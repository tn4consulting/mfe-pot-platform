import type { Core } from '@strapi/strapi';
import cronTasks from './cron-tasks';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  // cron defaults to disabled (@strapi/core's defaultServerConfig), and a
  // config/cron-tasks.ts file is not auto-merged into server.cron.tasks by
  // any filename convention -- confirmed by tracing @strapi/core's
  // config-loader + cron provider source directly: the loader keys each
  // config/ file flatly by its own filename, and the cron provider only
  // ever reads server.cron.tasks. This explicit wiring is the only path
  // the cron provider actually reads.
  cron: { enabled: true, tasks: cronTasks },
});

export default config;
