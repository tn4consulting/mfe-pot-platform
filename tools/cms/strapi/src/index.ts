import type { Core } from '@strapi/strapi';

// Reproducible local seed data for the MFE PoT. Runs on every startup and is
// idempotent (checks before creating), so it's safe as the standing seed
// mechanism rather than a fragile one-off `strapi export` archive -- see
// CLAUDE.md for why. This is what makes `docker compose up` produce a known,
// working local environment every time, with no manual admin-panel steps.

const REMOTES = [
  { name: 'dashboard', url: 'http://localhost:4201/remoteEntry.json', routePrefix: '/dashboard', version: '0.0.1' },
  { name: 'employment-life-events', url: 'http://localhost:4202/remoteEntry.json', routePrefix: '/employment-life-events', version: '0.0.1' },
  { name: 'job-bank', url: 'http://localhost:4203/remoteEntry.json', routePrefix: '/job-bank', version: '0.0.1' },
  { name: 'employment-insurance', url: 'http://localhost:4204/remoteEntry.json', routePrefix: '/employment-insurance', version: '0.0.1' },
];

const PAGE_CONTENT = [
  {
    key: 'dashboard.overview.intro',
    en: {
      title: 'Welcome to your account',
      body: 'Here is an overview of your benefits, payments, and tasks.',
    },
    fr: {
      title: 'Bienvenue dans votre compte',
      body: 'Voici un aperçu de vos prestations, paiements et tâches.',
    },
  },
  {
    key: 'employment-life-events.intro',
    en: {
      title: "You lost your job — here's what to do next",
      body: 'Guidance on CVs, job search, and Employment Insurance.',
    },
    fr: {
      title: 'Vous avez perdu votre emploi — voici les prochaines étapes',
      body: "Conseils sur le CV, la recherche d'emploi et l'assurance-emploi.",
    },
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

async function seedPageContent(strapi: Core.Strapi) {
  for (const page of PAGE_CONTENT) {
    const existingEn = await strapi.documents('api::page-content.page-content').findFirst({
      filters: { key: page.key },
      locale: 'en',
    });
    if (!existingEn) {
      const created = await strapi.documents('api::page-content.page-content').create({
        data: { key: page.key, title: page.en.title, body: page.en.body },
        locale: 'en',
      });
      await strapi.documents('api::page-content.page-content').update({
        documentId: created.documentId,
        data: { title: page.fr.title, body: page.fr.body },
        locale: 'fr',
      });
      strapi.log.info(`[seed] created page-content: ${page.key} (en + fr)`);
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
    await seedPageContent(strapi);
  },
};
