#!/usr/bin/env node
// Copies this package's bundled trusted-remotes.json into a consuming
// shell's own working tree. Meant to run via that repo's package.json
// "postinstall", so the registry a shell's main.tsx relatively-imports is
// always a real, current file on disk -- and it updates itself the moment
// the shell reinstalls after a version bump of this package, with no
// manual step.
//
// Unlike shared-platform-standards's sync-platform-standards (one fixed
// docs/ destination fits every consumer), the two shells' apps/<name>/src/
// paths differ, so the destination is an explicit --dest argument rather
// than a hardcoded path.
//
// Usage:
//   sync-trusted-remotes --dest <path> [--dev]
//
//   --dest   Where to write the registry file, e.g.
//            apps/msca-shell/src/generated/trusted-remotes.json
//   --dev    Copy trusted-remotes.dev.json instead of the production
//            trusted-remotes.json. Local-dev origins are kept in a
//            separate file, never merged into the production one, so a
//            locally-generated dev keypair can never end up trusted in a
//            real deployment.

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = parseArgs(process.argv.slice(2));
if (!args['dest']) {
  console.error('Usage: sync-trusted-remotes --dest <path> [--dev]');
  process.exit(1);
}

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceFileName = args['dev'] ? 'trusted-remotes.dev.json' : 'trusted-remotes.json';
const source = join(packageRoot, sourceFileName);
const dest = join(process.cwd(), args['dest']);

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(source, dest);
console.log(`sync-trusted-remotes: wrote ${dest} (from ${sourceFileName})`);

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--dev') {
      result['dev'] = true;
      continue;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      result[key] = value;
      i += 1;
    }
  }
  return result;
}
