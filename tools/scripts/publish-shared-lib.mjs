#!/usr/bin/env node
// Builds and (optionally) publishes one `libs/shared/*` package to GitHub
// Packages. See CLAUDE.md's "Strong contracts" section for why this exists:
// each split-out app repo depends on pinned versions of these instead of a
// hand-copied source import, and the TypeScript types published alongside
// are the actual enforced contract.
//
// Usage: node tools/scripts/publish-shared-lib.mjs <lib-name> [--publish]
//   <lib-name> is the directory name under libs/shared/ (e.g. "auth").
//   Without --publish, this only builds and stages assets -- useful for
//   verifying a package is publish-ready without actually publishing.
//
// Deliberately builds via the normal `nx run shared-<name>:build` target,
// which (per tsconfig.lib.json) outputs to the shared, out-of-the-way
// `dist/out-tsc/libs/shared/<name>/src/` tree -- NOT into
// `libs/shared/<name>/dist`. That distinction matters: once a `dist/`
// folder exists *inside* a lib's own directory (matching its package.json's
// "main"), Nx's jest resolver starts preferring that plain-tsc-compiled
// output over the TS source for any OTHER project that imports it -- and a
// plain `tsc` build never inlines Angular's templateUrl/styleUrl the way
// jest-preset-angular's source transform does, so any Angular component in
// the lib breaks with "not resolved: templateUrl" everywhere except the
// lib's own test suite (confirmed the hard way -- see CLAUDE.md). This
// script only ever copies this lib's own output slice into
// libs/shared/<name>/dist for the brief window `npm publish` needs it to
// exist, then removes it again -- a lib whose imports pull in other shared
// libs (e.g. ui-gcds depends on shared-auth/shared-i18n) still builds
// cleanly because the shared out-tsc tree has room for all of them; only
// THIS lib's own slice gets copied into its publish-time dist.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const [, , libName, ...rest] = process.argv;
if (!libName) {
  console.error('Usage: node tools/scripts/publish-shared-lib.mjs <lib-name> [--publish]');
  process.exit(1);
}
const shouldPublish = rest.includes('--publish');

const libDir = join(workspaceRoot, 'libs', 'shared', libName);
if (!existsSync(libDir)) {
  console.error(`No such shared lib: libs/shared/${libName}`);
  process.exit(1);
}

const nxProjectName = `shared-${libName}`;
const sharedOutDir = join(workspaceRoot, 'dist', 'out-tsc', 'libs', 'shared', libName, 'src');
const distDir = join(libDir, 'dist');

// federation-config is plain JS with no build step -- it publishes straight
// from its `src` (see its package.json's `files` field), nothing to stage.
const hasTsBuild = existsSync(join(libDir, 'tsconfig.lib.json'));

try {
  if (hasTsBuild) {
    console.log(`Building ${nxProjectName}...`);
    execFileSync('pnpm', ['exec', 'nx', 'run', `${nxProjectName}:build`], {
      cwd: workspaceRoot,
      stdio: 'inherit',
    });

    rmSync(distDir, { recursive: true, force: true });
    cpSync(sharedOutDir, distDir, { recursive: true });

    // A plain tsc build doesn't inline or copy Angular templateUrl/
    // styleUrl targets, so any Angular component in this lib needs its
    // .html/.css copied alongside the compiled output by hand.
    copyTemplateAssets(join(libDir, 'src'), distDir);
  }

  if (shouldPublish) {
    publish();
  } else {
    console.log(`${nxProjectName} built and staged (pass --publish to actually publish).`);
  }
} finally {
  // dist/ only exists for the moment `npm publish` needs it to be there --
  // see the file-level comment for why it can't be left behind.
  if (hasTsBuild) {
    rmSync(distDir, { recursive: true, force: true });
  }
}

function publish() {
  console.log(`Publishing ${nxProjectName}...`);
  try {
    execFileSync('npm', ['publish'], { cwd: libDir, stdio: 'pipe' });
    console.log(`Published ${nxProjectName}.`);
  } catch (err) {
    const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    // No version bump since the last publish -- expected on most pushes
    // (most changes to libs/shared/** don't warrant a new package version
    // every time), not a real failure. Anything else should still fail CI.
    if (output.includes('cannot publish over') || output.includes('You cannot publish over')) {
      console.log(`${nxProjectName}: version already published, nothing to do.`);
    } else {
      console.error(output);
      throw err;
    }
  }
}

function copyTemplateAssets(from, to) {
  if (!existsSync(from)) return;
  for (const entry of readdirSync(from)) {
    const fromPath = join(from, entry);
    if (statSync(fromPath).isDirectory()) {
      copyTemplateAssets(fromPath, join(to, entry));
      continue;
    }
    if (entry.endsWith('.html') || entry.endsWith('.css')) {
      const toPath = join(to, entry);
      mkdirSync(dirname(toPath), { recursive: true });
      cpSync(fromPath, toPath);
    }
  }
}
