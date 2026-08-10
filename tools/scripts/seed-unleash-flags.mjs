#!/usr/bin/env node
// Idempotently seeds the Unleash feature flags this family depends on, via
// its Admin API -- the flag equivalent of tools/cms/strapi/src/index.ts's
// bootstrap() for Strapi content. Closes the gap CLAUDE.md's "Design
// principles" section used to flag ("no committed flag-seed script...
// created by hand once"). Safe to re-run on every tools/deploy-local.sh --
// every step below checks before mutating, same as content-seed.ts's own
// idempotency posture.
//
// Talks to Unleash through its own Ingress. Two distinct modes, selected by
// env vars so the identical script runs from both tools/deploy-local.sh
// (kind) and mfe-pot's tools/deploy-eks.sh (EKS) with no code change:
//   - kind (default): unleash.mfe-pot.local has no real DNS entry required
//     -- connects to plain http://localhost with an explicit Host header,
//     the same trick every other deploy-local.sh curl check already uses,
//     so this script doesn't depend on the developer's /etc/hosts being
//     configured (see README.md's local setup step).
//   - EKS: UNLEASH_CONNECT_HOST/UNLEASH_PROTOCOL=https point this straight
//     at the real Route 53-resolvable hostname with real TLS
//     (values-eks.yaml's letsencrypt-prod cert) -- no Host-header override
//     needed there, connect host and logical hostname are the same thing.
// Node's fetch/undici silently drops a manually-set Host header (confirmed
// live), so this uses node:http/node:https directly instead of fetch.
import http from 'node:http';
import https from 'node:https';

const UNLEASH_PROTOCOL = process.env.UNLEASH_PROTOCOL === 'https' ? 'https' : 'http';
const UNLEASH_CONNECT_HOST = process.env.UNLEASH_CONNECT_HOST ?? 'localhost';
const UNLEASH_CONNECT_PORT = process.env.UNLEASH_CONNECT_PORT
  ? Number(process.env.UNLEASH_CONNECT_PORT)
  : UNLEASH_PROTOCOL === 'https'
    ? 443
    : 80;
// The logical Host header -- on kind this differs from UNLEASH_CONNECT_HOST
// (localhost) by design; on EKS it's the same real hostname either way.
const UNLEASH_HOSTNAME = process.env.UNLEASH_HOSTNAME ?? 'unleash.mfe-pot.local';
// Matches charts/unleash/values.yaml's adminApiToken (unchanged by
// values-eks.yaml -- see that file's own comment on why this demo-only
// secret is safely committed and identical on both clusters).
const ADMIN_TOKEN = process.env.UNLEASH_ADMIN_API_TOKEN ?? '*:*.unleash-demo-admin-token';

/**
 * One entry per flag this family depends on existing. Add here, not by
 * hand in the admin UI, the next time a new flag needs a rollout/variant --
 * see mfe-pot-dashboard-mfe's CLAUDE.md and dashboard-bff's app.ts/config.ts
 * for how dashboard-whats-new-message is actually consumed.
 *
 * `environment` is 'development' because that's the only environment
 * charts/unleash/values.yaml's CLIENT/FRONTEND tokens are scoped to
 * (`*:development.unleash-demo-*-token`) -- see that file's own comment.
 */
const FLAGS = [
  {
    project: 'default',
    name: 'dashboard-whats-new-message',
    environment: 'development',
    description:
      "A/B-tests dashboard-mfe's What's New message content across a percentage of users, via dashboard-bff's server-side Unleash SDK -- see mfe-pot-dashboard-mfe's CLAUDE.md.",
    rollout: '100',
    // sessionId, not userId: this PoT has exactly one seeded mock persona
    // (dashboard-bff's data.ts SEED_SUB), so a userId-keyed split would
    // always resolve to the same variant on every demo run. sessionId is a
    // random per-browser-tab id (WhatsNewList.tsx), so opening a second
    // tab/incognito window is enough to see the other variant.
    stickiness: 'sessionId',
    variants: [
      { name: 'control', weight: 500, weightType: 'variable', stickiness: 'sessionId' },
      { name: 'updated-message', weight: 500, weightType: 'variable', stickiness: 'sessionId' },
    ],
  },
];

async function main() {
  for (const flag of FLAGS) {
    await seedFlag(flag);
  }
}

async function seedFlag(flag) {
  const featurePath = `/api/admin/projects/${flag.project}/features/${flag.name}`;
  let current = await request('GET', featurePath);

  if (current.status === 404) {
    await request('POST', `/api/admin/projects/${flag.project}/features`, {
      name: flag.name,
      type: 'release',
      description: flag.description,
    });
    console.log(`[seed-unleash-flags] created feature: ${flag.name}`);
    current = await request('GET', featurePath);
  }

  const envPath = `${featurePath}/environments/${flag.environment}`;
  let env = current.body.environments?.find((e) => e.name === flag.environment);
  const strategy = env?.strategies?.[0];
  const desiredVariantNames = flag.variants.map((v) => v.name).sort().join(',');
  const actualVariantNames = (strategy?.variants ?? []).map((v) => v.name).sort().join(',');

  // Confirmed live against this Unleash version: there is no update
  // endpoint that can add/change a strategy's variants after creation --
  // PUT .../environments/{env}/variants (the seemingly-obvious one) 403s
  // ("Environment variants deprecated ... Use strategy variants instead"),
  // and updateFeatureStrategySchema (PUT .../strategies/{id}) has no
  // variants field at all. Variants can only be set in the same POST call
  // that creates the strategy -- so converging on the desired variant set
  // means deleting and recreating the strategy, not patching it in place.
  if (strategy && actualVariantNames !== desiredVariantNames) {
    await request('DELETE', `${envPath}/strategies/${strategy.id}`);
    console.log(`[seed-unleash-flags] removed out-of-date strategy on ${flag.name}/${flag.environment} (variants: [${actualVariantNames}])`);
  }

  let strategyMutated = strategy && actualVariantNames !== desiredVariantNames;

  if (!strategy || actualVariantNames !== desiredVariantNames) {
    await request('POST', `${envPath}/strategies`, {
      name: 'flexibleRollout',
      parameters: { groupId: flag.name, rollout: flag.rollout, stickiness: flag.stickiness },
      variants: flag.variants,
    });
    console.log(
      `[seed-unleash-flags] added flexibleRollout(${flag.rollout}%, stickiness=${flag.stickiness}) with variants [${desiredVariantNames}] to ${flag.name}/${flag.environment}`,
    );
    strategyMutated = true;
  }

  // Deleting a strategy (above) drops the environment's own `enabled` flag
  // back to false as a side effect (confirmed live) -- re-fetch rather than
  // trust the env snapshot read before that mutation, so a from-scratch run
  // converges to fully enabled in one pass instead of needing a second
  // invocation to notice it's still off.
  if (strategyMutated) {
    current = await request('GET', featurePath);
    env = current.body.environments?.find((e) => e.name === flag.environment);
  }

  if (!env?.enabled) {
    await request('POST', `${envPath}/on`);
    console.log(`[seed-unleash-flags] enabled ${flag.name} in ${flag.environment}`);
  }
}

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const transport = UNLEASH_PROTOCOL === 'https' ? https : http;
    const req = transport.request(
      {
        host: UNLEASH_CONNECT_HOST,
        port: UNLEASH_CONNECT_PORT,
        method,
        path,
        headers: {
          Host: UNLEASH_HOSTNAME,
          Authorization: ADMIN_TOKEN,
          ...(payload
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
            : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400 && res.statusCode !== 404) {
            reject(new Error(`${method} ${path} -> ${res.statusCode}: ${data}`));
            return;
          }
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : undefined });
        });
      },
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

main().catch((err) => {
  console.error('[seed-unleash-flags] failed:', err);
  process.exit(1);
});
