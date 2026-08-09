import type { Core } from '@strapi/strapi';
import { seedContentFromSources } from '../src/content-seed';

// Strapi is deployed well before any of the 6 content-owning apps exist on
// a from-scratch deploy-local.sh/deploy-eks.sh run -- src/index.ts's
// bootstrap() synchronous call is only a fast path for an already-warm
// cluster. This is what actually self-heals a from-scratch deploy: the
// same idempotent fetch+seed pass, re-run on an interval, needing no
// change to either deploy script. Once a minute is fast enough to pick up
// a newly-Ready app within about a minute, and cheap enough (6 tiny local
// JSON fetches per tick) to just leave running indefinitely rather than
// adding logic to stop once every source is confirmed seeded.
const schedule = process.env.CONTENT_SEED_CRON_SCHEDULE ?? '*/1 * * * *';

export default {
  [schedule]: async ({ strapi }: { strapi: Core.Strapi }) => {
    await seedContentFromSources(strapi);
  },
};
