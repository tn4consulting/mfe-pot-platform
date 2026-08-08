#!/usr/bin/env node
// Copies this package's bundled PLATFORM_STANDARDS.md into the consuming
// repo's own docs/ directory. Meant to run automatically via that repo's
// package.json "postinstall", so the file is always a real, current file
// on disk -- not a node_modules path Claude Code's `@import` may or may not
// resolve (untested at the time this was written -- see this package's
// README) -- and it updates itself the moment a team reinstalls after
// merging a Renovate bump of this package, with no manual step.
//
// The destination is gitignored, generated content: same shape as this
// family's other generated/local-only artifacts (mfe-pot-platform's
// .deploy-state, the gitignored docs/msca-screenshots/).

import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(packageRoot, 'standards', 'PLATFORM_STANDARDS.md');
const destDir = join(process.cwd(), 'docs');
const dest = join(destDir, 'PLATFORM_STANDARDS.md');

mkdirSync(destDir, { recursive: true });
copyFileSync(source, dest);
console.log(`sync-platform-standards: wrote ${dest}`);
