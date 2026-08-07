import type { Core } from '@strapi/strapi';

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
  {
    name: 'dashboard-mfe',
    url: process.env.REMOTE_DASHBOARD_MFE_URL ?? 'http://localhost:4201/remoteEntry.json',
    routePrefix: '/dashboard',
    version: '0.0.1',
  },
  {
    name: 'employment-life-events-mfe',
    url: process.env.REMOTE_EMPLOYMENT_LIFE_EVENTS_MFE_URL ?? 'http://localhost:4202/remoteEntry.json',
    routePrefix: '/employment-life-events',
    version: '0.0.1',
  },
  {
    name: 'job-bank-mfe',
    url: process.env.REMOTE_JOB_BANK_MFE_URL ?? 'http://localhost:4203/remoteEntry.json',
    routePrefix: '/job-bank',
    version: '0.0.1',
  },
  {
    name: 'employment-insurance-mfe',
    url: process.env.REMOTE_EMPLOYMENT_INSURANCE_MFE_URL ?? 'http://localhost:4204/remoteEntry.json',
    routePrefix: '/employment-insurance',
    version: '0.0.1',
  },
];

const PAGE_CONTENT = [
  {
    key: 'dashboard.overview.intro',
    en: {
      title: 'Welcome to your account',
      body: 'Here is an overview of your benefits and payments.',
    },
    fr: {
      title: 'Bienvenue dans votre compte',
      body: 'Voici un aperçu de vos prestations et paiements.',
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
  {
    key: 'job-bank.intro',
    en: {
      title: 'Job Bank',
      body: 'Search job postings and submit applications, all in one place.',
    },
    fr: {
      title: 'Guichet-Emplois',
      body: "Recherchez des offres d'emploi et soumettez vos candidatures, le tout au même endroit.",
    },
  },
  {
    key: 'employment-insurance.intro',
    en: {
      title: 'Employment Insurance',
      body: 'Apply for Employment Insurance benefits, check your claim status, and submit your reports.',
    },
    fr: {
      title: 'Assurance-emploi',
      body: "Faites une demande de prestations d'assurance-emploi, consultez l'état de votre demande et soumettez vos déclarations.",
    },
  },
  // -- dashboard: payment history --
  {
    key: 'dashboard.payment-history.heading',
    en: { title: 'Payments Activity', body: '' },
    fr: { title: 'Activité des paiements', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.program',
    en: { title: 'Program', body: '' },
    fr: { title: 'Programme', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.status',
    en: { title: 'Status', body: '' },
    fr: { title: 'État', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.date',
    en: { title: 'Date', body: '' },
    fr: { title: 'Date', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.amount',
    en: { title: 'Amount', body: '' },
    fr: { title: 'Montant', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.actions',
    en: { title: 'Actions', body: '' },
    fr: { title: 'Actions', body: '' },
  },
  {
    key: 'dashboard.payment-history.table.actions-label',
    en: { title: 'Actions', body: '' },
    fr: { title: 'Actions', body: '' },
  },
  {
    key: 'dashboard.payment-history.status.complete',
    en: { title: 'Complete', body: '' },
    fr: { title: 'Terminé', body: '' },
  },
  {
    key: 'dashboard.payment-history.status.pending',
    en: { title: 'Pending', body: '' },
    fr: { title: 'En attente', body: '' },
  },
  {
    key: 'dashboard.payment-history.error',
    en: { title: 'Payment history is temporarily unavailable.', body: '' },
    fr: { title: "L'historique des paiements est temporairement indisponible.", body: '' },
  },
  {
    key: 'dashboard.payment-history.view-all',
    en: { title: 'View payment history', body: '' },
    fr: { title: "Voir l'historique des paiements", body: '' },
  },
  // -- job-bank: search --
  {
    key: 'job-bank.search.heading',
    en: { title: 'Job Bank — Job search', body: '' },
    fr: { title: "Guichet-Emplois — Recherche d'emploi", body: '' },
  },
  {
    key: 'job-bank.search.error',
    en: { title: 'Job postings are temporarily unavailable.', body: '' },
    fr: { title: "Les offres d'emploi sont temporairement indisponibles.", body: '' },
  },
  {
    key: 'job-bank.search.table.title',
    en: { title: 'Job title', body: '' },
    fr: { title: 'Titre du poste', body: '' },
  },
  {
    key: 'job-bank.search.table.employer',
    en: { title: 'Employer', body: '' },
    fr: { title: 'Employeur', body: '' },
  },
  {
    key: 'job-bank.search.table.location',
    en: { title: 'Location', body: '' },
    fr: { title: 'Lieu', body: '' },
  },
  {
    key: 'job-bank.search.table.posted',
    en: { title: 'Posted', body: '' },
    fr: { title: 'Date de publication', body: '' },
  },
  {
    key: 'job-bank.search.list.emptyLabel',
    en: { title: 'No job postings found.', body: '' },
    fr: { title: "Aucune offre d'emploi trouvée.", body: '' },
  },
  {
    key: 'job-bank.search.list.label',
    en: { title: 'Job postings', body: '' },
    fr: { title: "Offres d'emploi", body: '' },
  },
  // -- job-bank: apply --
  {
    key: 'job-bank.apply.heading',
    en: { title: 'Apply for a job', body: '' },
    fr: { title: 'Postuler à un emploi', body: '' },
  },
  {
    key: 'job-bank.apply.error',
    en: { title: 'Job applications are temporarily unavailable.', body: '' },
    fr: { title: 'Les candidatures sont temporairement indisponibles.', body: '' },
  },
  {
    key: 'job-bank.apply.label',
    en: { title: 'Choose a posting', body: '' },
    fr: { title: 'Choisissez une offre', body: '' },
  },
  {
    key: 'job-bank.apply.button',
    en: { title: 'Apply now', body: '' },
    fr: { title: 'Postuler maintenant', body: '' },
  },
  {
    key: 'job-bank.apply.confirmation',
    en: { title: 'Application {id} submitted — status: {status}.', body: '' },
    fr: { title: 'Candidature {id} soumise — état : {status}.', body: '' },
  },
  // -- job-bank: applications list (migrated off local i18n hook) --
  {
    key: 'job-bank.applications-list.heading',
    en: { title: 'My Job Applications', body: '' },
    fr: { title: 'Mes candidatures', body: '' },
  },
  {
    key: 'job-bank.applications-list.empty',
    en: { title: 'No job applications on file.', body: '' },
    fr: { title: 'Aucune candidature au dossier.', body: '' },
  },
  {
    key: 'job-bank.applications-list.unavailable',
    en: { title: 'Job applications are temporarily unavailable.', body: '' },
    fr: { title: 'Les candidatures sont temporairement indisponibles.', body: '' },
  },
  {
    key: 'job-bank.applications-list.unknownPosition',
    en: { title: 'Unknown position', body: '' },
    fr: { title: 'Poste inconnu', body: '' },
  },
  {
    key: 'job-bank.applications-list.unknownEmployer',
    en: { title: 'Unknown employer', body: '' },
    fr: { title: 'Employeur inconnu', body: '' },
  },
  {
    key: 'job-bank.applications-list.table.position',
    en: { title: 'Position', body: '' },
    fr: { title: 'Poste', body: '' },
  },
  {
    key: 'job-bank.applications-list.table.employer',
    en: { title: 'Employer', body: '' },
    fr: { title: 'Employeur', body: '' },
  },
  {
    key: 'job-bank.applications-list.table.status',
    en: { title: 'Status', body: '' },
    fr: { title: 'État', body: '' },
  },
  // -- employment-insurance: claims --
  {
    key: 'employment-insurance.claims.heading',
    en: { title: 'Claim status', body: '' },
    fr: { title: 'État de la demande', body: '' },
  },
  {
    key: 'employment-insurance.claims.error',
    en: { title: 'Claim status is temporarily unavailable.', body: '' },
    fr: { title: "L'état de la demande est temporairement indisponible.", body: '' },
  },
  {
    key: 'employment-insurance.claims.cardTitle',
    en: { title: 'Claim {id}', body: '' },
    fr: { title: 'Demande {id}', body: '' },
  },
  {
    key: 'employment-insurance.claims.status',
    en: { title: 'Status: {status}.', body: '' },
    fr: { title: 'État : {status}.', body: '' },
  },
  {
    key: 'employment-insurance.claims.empty',
    en: { title: 'No claim on file yet.', body: '' },
    fr: { title: 'Aucune demande au dossier pour le moment.', body: '' },
  },
  // -- employment-insurance: applications --
  {
    key: 'employment-insurance.applications.heading',
    en: { title: 'Employment Insurance — Apply', body: '' },
    fr: { title: 'Assurance-emploi — Faire une demande', body: '' },
  },
  {
    key: 'employment-insurance.applications.intro',
    en: { title: 'Apply for Employment Insurance benefits.', body: '' },
    fr: { title: "Faites une demande de prestations d'assurance-emploi.", body: '' },
  },
  {
    key: 'employment-insurance.applications.button',
    en: { title: 'Apply for EI', body: '' },
    fr: { title: "Faire une demande d'AE", body: '' },
  },
  {
    key: 'employment-insurance.applications.confirmationDescription',
    en: { title: 'Status: {status}, weekly benefit: ${amount}.', body: '' },
    fr: { title: 'État : {status}, prestation hebdomadaire : {amount} $.', body: '' },
  },
  {
    key: 'employment-insurance.applications.error',
    en: { title: 'EI applications are temporarily unavailable.', body: '' },
    fr: { title: "Les demandes d'AE sont temporairement indisponibles.", body: '' },
  },
  // -- employment-insurance: reporting --
  {
    key: 'employment-insurance.reporting.heading',
    en: { title: 'Submit your EI report', body: '' },
    fr: { title: "Soumettre votre déclaration d'AE", body: '' },
  },
  {
    key: 'employment-insurance.reporting.error',
    en: { title: 'EI reporting is temporarily unavailable.', body: '' },
    fr: { title: "La déclaration d'AE est temporairement indisponible.", body: '' },
  },
  {
    key: 'employment-insurance.reporting.noClaim',
    en: { title: 'You need an active EI claim before you can submit a report.', body: '' },
    fr: { title: "Vous devez avoir une demande d'AE active avant de pouvoir soumettre une déclaration.", body: '' },
  },
  {
    key: 'employment-insurance.reporting.hoursLabel',
    en: { title: 'Hours worked this period', body: '' },
    fr: { title: 'Heures travaillées durant cette période', body: '' },
  },
  {
    key: 'employment-insurance.reporting.earningsLabel',
    en: { title: 'Earnings this period ($)', body: '' },
    fr: { title: 'Revenus durant cette période (en dollars)', body: '' },
  },
  {
    key: 'employment-insurance.reporting.submitButton',
    en: { title: 'Submit report', body: '' },
    fr: { title: 'Soumettre la déclaration', body: '' },
  },
  {
    key: 'employment-insurance.reporting.confirmation',
    en: { title: 'Report {id} submitted for {periodStart} to {periodEnd}.', body: '' },
    fr: { title: 'Déclaration {id} soumise pour la période du {periodStart} au {periodEnd}.', body: '' },
  },
  // -- employment-insurance: reporting status widget (migrated off shared-i18n) --
  {
    key: 'employment-insurance.reporting-status.heading',
    en: { title: 'EI Reporting Status', body: '' },
    fr: { title: "État de la déclaration d'assurance-emploi", body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.unavailable',
    en: { title: 'EI reporting status is temporarily unavailable.', body: '' },
    fr: { title: "L'état de la déclaration d'assurance-emploi est temporairement indisponible.", body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.noClaim',
    en: { title: 'No active EI claim on file.', body: '' },
    fr: { title: "Aucune demande d'assurance-emploi active au dossier.", body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.notYetDue',
    en: { title: 'Not yet due', body: '' },
    fr: { title: 'Pas encore requise', body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.dueSoon',
    en: { title: 'Due soon', body: '' },
    fr: { title: 'Bientôt requise', body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.overdue',
    en: { title: 'Overdue', body: '' },
    fr: { title: 'En retard', body: '' },
  },
  {
    key: 'employment-insurance.reporting-status.nextReportDue',
    en: { title: 'Next report due {date} ({days} days)', body: '' },
    fr: { title: 'Prochaine déclaration due le {date} ({days} jours)', body: '' },
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
