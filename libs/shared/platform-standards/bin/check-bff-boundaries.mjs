#!/usr/bin/env node
// Scans this repo's own application source for the two concrete,
// mechanically-checkable shapes a "BFF/UI call boundary" violation takes in
// this family -- see mfe-pot/TODO.md's "Design principles" section
// (principles 1 and 2) and docs/PLATFORM_STANDARDS.md's "BFF boundary
// rules". Not a full data-flow/AST analysis (deliberately -- see
// check-platform-versions.mjs's own plain-grep-over-AST-parser precedent);
// catches the actual violation shape found and fixed in dashboard-bff's
// former getBenefitOverview fan-out, not every conceivable violation.
//
// Rule 1: no in-cluster Kubernetes Service DNS literal
// (`*.svc.cluster.local`) anywhere in application TypeScript source. That
// value only ever belongs in a Helm chart's values.yaml, injected at
// runtime via an env var (backend) or ConfigMap-supplied runtime config
// (frontend) -- see mfe-pot-platform/CLAUDE.md's "Hosting: Kubernetes +
// Helm" section. A literal in .ts/.tsx source means someone hardcoded a
// direct cluster-internal call, bypassing that indirection -- exactly
// dashboard-bff's old `JOB_BANK_BFF_URL`/`EMPLOYMENT_INSURANCE_BFF_URL`
// shape, just skipping the env var.
//
// Rule 2: no reference, in this repo's *own* non-BFF source, to another
// domain's dev-default BFF port (job-bank-bff :3001, employment-insurance-
// bff :3002, dashboard-bff :3004 -- see each repo's own runtime-config.ts
// dev defaults). Scoped to "non-BFF source" so a BFF's own repo can freely
// mention its own port; scoped to "another domain's" so, e.g., dashboard-
// mfe's frontend referencing its own dashboard-bff's dev port is fine.
//
// Usage: check-bff-boundaries [--path <dir>]
//   --path   Defaults to the current working directory (the consuming
//            repo's own root when run via its package.json script).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const OTHER_DOMAIN_BFF_PORTS = {
  'job-bank-bff': '3001',
  'employment-insurance-bff': '3002',
  'dashboard-bff': '3004',
};

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);
const SPEC_SUFFIX = /\.(spec|test)\.tsx?$/;

function main() {
  const args = parseArgs(process.argv.slice(2));
  const appsDir = join(args.path, 'apps');
  const files = listSourceFiles(appsDir);
  // The whole repo's own domain(s), not per-file -- a frontend referencing
  // its own sibling BFF's dev port (e.g. dashboard-mfe's runtime-config.ts
  // defaulting to dashboard-bff's :3004) is fine; only a reference to a
  // domain this repo does NOT own is a violation.
  const ownedBffNames = ownedBffNamesIn(appsDir);

  const violations = [];
  for (const file of files) {
    if (SPEC_SUFFIX.test(file)) continue; // a test asserting the wrong shape is fine (see check-bff-boundaries' own self-test)
    const relPath = relative(args.path, file);
    const content = readFileSync(file, 'utf8');

    if (content.includes('.svc.cluster.local')) {
      violations.push({
        file: relPath,
        rule: 'in-cluster Service DNS literal in application source',
        detail: 'belongs only in a Helm chart values.yaml, injected via env var/ConfigMap at runtime',
      });
    }

    for (const [bffName, port] of Object.entries(OTHER_DOMAIN_BFF_PORTS)) {
      if (ownedBffNames.has(bffName)) continue; // this repo's own domain -- referencing its own BFF's port is fine
      if (content.includes(`:${port}`)) {
        violations.push({
          file: relPath,
          rule: `reference to ${bffName}'s dev-default port (:${port})`,
          detail: `this repo doesn't own ${bffName} -- a UI/BFF may only call its own BFF`,
        });
      }
    }
  }

  if (violations.length > 0) {
    console.error('check-bff-boundaries: possible BFF/UI call boundary violation(s):\n');
    for (const v of violations) {
      console.error(`  ${v.file}: ${v.rule}\n    ${v.detail}`);
    }
    console.error(
      '\nSee mfe-pot/TODO.md\'s "Design principles" section (principles 1 and 2) and ' +
        'docs/PLATFORM_STANDARDS.md\'s "BFF boundary rules". If this is a deliberate, reviewed ' +
        'exception, this check has no override flag by design -- raise it as a scoped, ' +
        'documented decision instead (see how dashboard-bff\'s former fan-out was resolved).'
    );
    process.exit(1);
  }

  console.log('check-bff-boundaries: no BFF/UI call boundary violations found.');
}

function parseArgs(argv) {
  const pathIndex = argv.indexOf('--path');
  return { path: pathIndex === -1 ? process.cwd() : argv[pathIndex + 1] };
}

/** The set of *-bff app directory names directly under apps/ -- this repo's own domain(s). */
function ownedBffNamesIn(appsDir) {
  let entries;
  try {
    entries = readdirSync(appsDir, { withFileTypes: true });
  } catch {
    return new Set();
  }
  return new Set(entries.filter((e) => e.isDirectory() && e.name.endsWith('-bff')).map((e) => e.name));
}

function listSourceFiles(dir) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return []; // no apps/ dir (e.g. run from somewhere unexpected) -- nothing to check, not an error
  }
  const files = [];
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      files.push(fullPath);
    }
  }
  return files;
}

main();
