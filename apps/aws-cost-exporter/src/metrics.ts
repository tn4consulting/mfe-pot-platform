import { Registry, Gauge, collectDefaultMetrics } from 'prom-client';
import type { AwsCostSnapshot } from './cost-explorer-client';

export const registry = new Registry();
collectDefaultMetrics({ register: registry });

const dailyCostGauge = new Gauge({
  name: 'aws_cost_daily_usd',
  help: "Today's AWS cost so far (UnblendedCost, USD), grouped by service. Refreshed on a long interval -- see config.refreshIntervalMs -- not per scrape.",
  labelNames: ['service'],
  registers: [registry],
});

const mtdCostGauge = new Gauge({
  name: 'aws_cost_mtd_usd',
  help: 'Month-to-date AWS cost (UnblendedCost, USD), grouped by service. Refreshed on a long interval -- see config.refreshIntervalMs -- not per scrape.',
  labelNames: ['service'],
  registers: [registry],
});

const lastRefreshGauge = new Gauge({
  name: 'aws_cost_last_refresh_timestamp_seconds',
  help: 'Unix timestamp of the last successful Cost Explorer API refresh.',
  registers: [registry],
});

export function applySnapshot(snapshot: AwsCostSnapshot): void {
  dailyCostGauge.reset();
  mtdCostGauge.reset();
  for (const { service, amountUsd } of snapshot.daily) {
    dailyCostGauge.set({ service }, amountUsd);
  }
  for (const { service, amountUsd } of snapshot.monthToDate) {
    mtdCostGauge.set({ service }, amountUsd);
  }
  lastRefreshGauge.set(snapshot.fetchedAt.getTime() / 1000);
}
