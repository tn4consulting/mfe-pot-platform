#!/usr/bin/env node
// Signs a built federation remote's manifest so a shell can verify it
// before trusting/executing the code it points at. See
// mfe-pot/docs/plans/20260811-1500-federation-remote-loading-integrity.md.
//
// Reads a built `dist/apps/<app>/browser/` directory, SHA-384-hashes
// `remoteEntry.json` and every file its own `exposes[].outFileName` points
// at (not just the manifest -- `exposes` entries have plain,
// non-content-hashed filenames, so nothing else ties their bytes to the
// manifest's own hash), signs the resulting claim set as a compact JWS,
// and writes it to `remoteEntry.json.sig` alongside the manifest.
//
// Usage:
//   sign-remote-manifest --dist <path> --remote-name <name> \
//                         --private-key <path-to-PEM> --kid <kid>
//
//   --dist          Path to the built browser output directory (contains
//                    remoteEntry.json and the files its exposes[] list).
//   --remote-name   Must match this remote's name in the consuming
//                    shell's trust registry.
//   --private-key   Path to a PKCS8 PEM RSA private key. Never read from
//                    an env var or CLI flag directly -- pass it via a
//                    file (e.g. a Docker BuildKit --mount=type=secret) so
//                    it never lands in shell history or process listings.
//   --kid           Public key id, matches the registry entry's `kid`.

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { importPKCS8, SignJWT } from 'jose';
import { sha384Base64 } from '../dist/index.js';

const args = parseArgs(process.argv.slice(2));
for (const required of ['dist', 'remote-name', 'private-key', 'kid']) {
  if (!args[required]) {
    console.error(
      `Usage: sign-remote-manifest --dist <path> --remote-name <name> --private-key <path> --kid <kid>`,
    );
    console.error(`Missing required --${required}`);
    process.exit(1);
  }
}

const distDir = args['dist'];
const remoteName = args['remote-name'];
const privateKeyPath = args['private-key'];
const kid = args['kid'];

const manifestPath = join(distDir, 'remoteEntry.json');
const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes.toString('utf-8'));

const files = { 'remoteEntry.json': await sha384Base64(manifestBytes) };
const exposesFileNames = {};

for (const expose of manifest.exposes ?? []) {
  exposesFileNames[expose.key] = expose.outFileName;
  if (!(expose.outFileName in files)) {
    const fileBytes = readFileSync(join(distDir, expose.outFileName));
    files[expose.outFileName] = await sha384Base64(fileBytes);
  }
}

const claims = {
  remoteName,
  iat: Math.floor(Date.now() / 1000),
  files,
  exposesFileNames,
};

const privateKeyPem = readFileSync(privateKeyPath, 'utf-8');
const privateKey = await importPKCS8(privateKeyPem, 'RS256');

const compactJws = await new SignJWT(claims)
  .setProtectedHeader({ alg: 'RS256', kid })
  .setIssuedAt()
  .setExpirationTime('30d')
  .sign(privateKey);

const sigPath = `${manifestPath}.sig`;
writeFileSync(sigPath, compactJws, 'utf-8');
console.log(`Signed ${remoteName}: wrote ${sigPath}`);

function parseArgs(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const value = argv[i + 1];
      result[key] = value;
      i += 1;
    }
  }
  return result;
}
