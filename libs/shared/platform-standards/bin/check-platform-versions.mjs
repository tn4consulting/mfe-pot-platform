#!/usr/bin/env node
// Checks this repo's *resolved* dependency versions against the mfe-pot
// family's single source of truth (mfe-pot-platform/platform-versions.json).
//
// Exists because Native Federation's shared-singleton contract "fails at
// runtime with no compile-time warning across repos" (see
// mfe-pot-platform/CLAUDE.md's "Federation-sharing policy" and
// platform-versions.json's own $comment) -- with 7 independently-owned
// repos, nobody holds the whole picture in their head anymore, so this has
// to be enforced, not just documented.
//
// Usage:
//   check-platform-versions [--source <path-or-url>] [--check-critical-prs] [--grace-days <n>]
//
//   --source            Defaults to mfe-pot-platform's live
//                        platform-versions.json on `main` -- no sibling
//                        clone required, matching the family's
//                        "every MFE is independently testable" principle.
//                        Pass a local file path to check a working copy
//                        instead (mfe-pot-platform's own self-check does
//                        this, to validate uncommitted changes).
//   --check-critical-prs
//                        Also fails the build if a Renovate PR labelled
//                        `platform-critical` has been open longer than
//                        --grace-days (default 14, see
//                        docs/plans/20260808-1200-multi-team-scale-governance.md
//                        item 4) in this repo. Needs `gh` authenticated;
//                        CI already has this via GITHUB_TOKEN, so this is
//                        normally only passed from ci.yml, not run locally.

import { execFileSync } from 'node:child_process';

const DEFAULT_SOURCE =
  'https://raw.githubusercontent.com/tn4consulting/mfe-pot-platform/main/platform-versions.json';
const DEFAULT_GRACE_DAYS = 14;

// Maps a platform-versions.json key to the real installed package name it
// governs. Only checked when this repo actually depends on the package --
// e.g. mfe-pot-platform itself publishes @tn4consulting/shared-ui-scds-core
// but doesn't depend on it, so that check is silently skipped there, not
// treated as a failure.
const PACKAGE_KEYS = {
  react: 'react',
  reactDom: 'react-dom',
  typescript: 'typescript',
  sharedUiScdsCore: '@tn4consulting/shared-ui-scds-core',
  sharedFederationRuntime: '@tn4consulting/shared-federation-runtime',
  sharedFederationConfig: '@tn4consulting/shared-federation-config',
};

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let platformVersions;
  try {
    platformVersions = await loadPlatformVersions(args.source);
  } catch (err) {
    console.error(
      `check-platform-versions: couldn't reach platform-versions.json (${args.source}).\n` +
        `Check your network, or pass --source <local-path>.\n${err.message}`
    );
    process.exit(1);
  }

  const mismatches = [];

  const resolved = resolvedDependencyVersions();
  for (const [key, packageName] of Object.entries(PACKAGE_KEYS)) {
    const expected = platformVersions[key];
    const actual = resolved[packageName];
    if (expected === undefined || actual === undefined) continue; // not a dependency here, or not tracked -- not this repo's concern
    if (actual !== expected) {
      mismatches.push({ name: packageName, expected, actual });
    }
  }

  const nodeExpected = platformVersions.node;
  const nodeActual = process.version.replace(/^v/, '');
  if (nodeExpected && nodeActual !== nodeExpected) {
    mismatches.push({ name: 'node', expected: nodeExpected, actual: nodeActual });
  }

  const pnpmExpected = platformVersions.pnpm;
  if (pnpmExpected) {
    try {
      const pnpmActual = execFileSync('pnpm', ['--version'], { encoding: 'utf8' }).trim();
      if (pnpmActual !== pnpmExpected) {
        mismatches.push({ name: 'pnpm', expected: pnpmExpected, actual: pnpmActual });
      }
    } catch {
      // pnpm not on PATH under this name -- can't check, don't fail for it.
    }
  }

  if (mismatches.length > 0) {
    console.error('check-platform-versions: version drift from platform-versions.json:\n');
    for (const m of mismatches) {
      console.error(`  ${m.name}: expected ${m.expected}, found ${m.actual}`);
    }
    console.error(
      '\nSee mfe-pot-platform/platform-versions.json (the source of truth) and, for ' +
        'federation-shared singletons, mfe-pot-platform/CLAUDE.md\'s "Federation-sharing ' +
        'policy" for why this is enforced rather than just documented.'
    );
    process.exit(1);
  }

  console.log('check-platform-versions: all checked versions match platform-versions.json.');

  if (args.checkCriticalPrs) {
    await checkCriticalPrs(args.graceDays);
  }
}

function parseArgs(argv) {
  const sourceIndex = argv.indexOf('--source');
  const graceDaysIndex = argv.indexOf('--grace-days');
  return {
    source: sourceIndex === -1 ? DEFAULT_SOURCE : argv[sourceIndex + 1],
    checkCriticalPrs: argv.includes('--check-critical-prs'),
    graceDays: graceDaysIndex === -1 ? DEFAULT_GRACE_DAYS : Number(argv[graceDaysIndex + 1]),
  };
}

async function loadPlatformVersions(source) {
  if (/^https?:\/\//.test(source)) {
    const res = await fetch(source);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }
  const { readFileSync } = await import('node:fs');
  return JSON.parse(readFileSync(source, 'utf8'));
}

function resolvedDependencyVersions() {
  // One unfiltered `pnpm list` call, rather than asking pnpm to filter by
  // package name -- filtering for a package this repo doesn't depend on
  // (e.g. mfe-pot-platform checking react-dom, which it publishes
  // consumers of but doesn't itself depend on) behaves inconsistently
  // across pnpm versions, where an unfiltered call reliably just omits it.
  // Each entry pnpm returns is `{from, version, resolved, path}` -- `.version`
  // is already the exact resolved version (no caret/tilde), which is the
  // whole point: two repos both declaring `^19.2.8` in package.json can
  // still resolve different patches if their lockfiles diverge, and that's
  // exactly the drift this tool exists to catch.
  const raw = execFileSync('pnpm', ['list', '--json', '--depth', '0'], { encoding: 'utf8' });
  const [project] = JSON.parse(raw);
  const entries = { ...project?.dependencies, ...project?.devDependencies };
  return Object.fromEntries(Object.entries(entries).map(([name, entry]) => [name, entry.version]));
}

async function checkCriticalPrs(graceDays) {
  let prs;
  try {
    const raw = execFileSync(
      'gh',
      ['pr', 'list', '--label', 'platform-critical', '--state', 'open', '--json', 'number,createdAt,url'],
      { encoding: 'utf8' }
    );
    prs = JSON.parse(raw);
  } catch (err) {
    console.warn(`check-platform-versions: couldn't check for platform-critical PRs (${err.message}) -- skipping.`);
    return;
  }

  const graceMs = graceDays * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const overdue = prs.filter((pr) => now - new Date(pr.createdAt).getTime() > graceMs);

  if (overdue.length > 0) {
    console.error(
      `\ncheck-platform-versions: ${overdue.length} platform-critical PR(s) have been open ` +
        `longer than the ${graceDays}-day adoption window:\n`
    );
    for (const pr of overdue) {
      console.error(`  #${pr.number} (opened ${pr.createdAt}): ${pr.url}`);
    }
    console.error(
      '\nSee docs/plans/20260808-1200-multi-team-scale-governance.md item 4 -- merge or ' +
        'explicitly re-scope the bump before other work in this repo can land.'
    );
    process.exit(1);
  }
}

main();
