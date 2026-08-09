import express, { Express } from 'express';
import { registry } from './metrics';

/**
 * Exposes cached AWS Cost Explorer data as Prometheus metrics. Deliberately
 * does not call Cost Explorer itself on each request -- see refresh.ts for
 * why that has to be decoupled from Prometheus's own scrape interval. A
 * scrape before the first refresh completes just returns the metric
 * families with no series yet, which Prometheus treats as "no data", not an
 * error.
 */
export function createApp(): Express {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });

  return app;
}
