import type { Core } from '@strapi/strapi';
import { REMOTE_ENTRY_URLS } from './remote-config';
import { seedContentFromSources } from './content-seed';

// Reproducible local seed data for the MFE PoT. Runs on every startup and is
// idempotent (checks before creating), so it's safe as the standing seed
// mechanism rather than a fragile one-off `strapi export` archive -- see
// CLAUDE.md for why. This is what makes a fresh pod (`pnpm deploy:local`)
// produce a known, working local environment every time, with no manual
// admin-panel steps.

// URLs default to the local `nx serve` ports but are each overridable by an
// env var, so a Helm-deployed Strapi (see charts/strapi) can seed the real
// Ingress-routed hostnames instead -- otherwise a reachable-but-wrong
// directory is worse than an unreachable one, since resolveFederationManifest()
// in each app's main.ts only falls back to its own configured `remotes` map
// when Strapi itself is unavailable, not when its data is stale/wrong.
const REMOTES = [
  { name: 'dashboard-mfe', url: REMOTE_ENTRY_URLS['dashboard-mfe'], routePrefix: '/dashboard', version: '0.0.1' },
  {
    name: 'life-events-mfe',
    url: REMOTE_ENTRY_URLS['life-events-mfe'],
    routePrefix: '/life-events',
    version: '0.0.1',
  },
  { name: 'job-bank-mfe', url: REMOTE_ENTRY_URLS['job-bank-mfe'], routePrefix: '/job-bank', version: '0.0.1' },
  {
    name: 'employment-insurance-mfe',
    url: REMOTE_ENTRY_URLS['employment-insurance-mfe'],
    routePrefix: '/employment-insurance',
    version: '0.0.1',
  },
];

async function ensureFrenchLocale(strapi: Core.Strapi) {
  const localesService = strapi.plugin('i18n').service('locales');
  const existing = await localesService.find();
  if (!existing.some((locale: { code: string }) => locale.code === 'fr')) {
    await localesService.create({ code: 'fr', name: 'French (fr)', isDefault: false });
    strapi.log.info('[seed] created fr locale');
  }
}

async function ensurePublicReadAccess(strapi: Core.Strapi, uid: string, actions: string[]) {
  const publicRole = await strapi
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'public' } });
  if (!publicRole) return;

  for (const action of actions) {
    const actionId = `api::${uid}.${uid}.${action}`;
    const existingPermission = await strapi
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action: actionId, role: publicRole.id } });
    if (!existingPermission) {
      await strapi.query('plugin::users-permissions.permission').create({
        data: { action: actionId, role: publicRole.id },
      });
    }
  }
}

async function seedRemotes(strapi: Core.Strapi) {
  for (const remote of REMOTES) {
    const existing = await strapi.documents('api::remote.remote').findFirst({
      filters: { name: remote.name },
    });
    if (!existing) {
      await strapi.documents('api::remote.remote').create({ data: remote });
      strapi.log.info(`[seed] created remote entry: ${remote.name}`);
    }
  }
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    await ensureFrenchLocale(strapi);
    await ensurePublicReadAccess(strapi, 'remote', ['find', 'findOne']);
    await ensurePublicReadAccess(strapi, 'page-content', ['find', 'findOne']);
    await seedRemotes(strapi);
    // Fast path for an already-warm cluster -- best-effort, wrapped so a
    // failure here (e.g. no content-owning app reachable yet on a
    // from-scratch deploy) can't stop the rest of bootstrap. The real
    // self-heal path is config/cron-tasks.ts, re-running this same
    // idempotent function on an interval until every source responds.
    try {
      await seedContentFromSources(strapi);
    } catch (err) {
      strapi.log.error('[content-seed] bootstrap pass failed unexpectedly', err);
    }
  },
};
