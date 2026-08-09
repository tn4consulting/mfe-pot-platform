import { fetchCostSnapshot } from './cost-explorer-client';
import { applySnapshot } from './metrics';
import { config } from './config';

export async function refreshOnce(): Promise<void> {
  const snapshot = await fetchCostSnapshot();
  applySnapshot(snapshot);
}

/** Refreshes immediately, then on config.refreshIntervalMs -- see its own comment for why this can't be per-scrape. */
export function startRefreshLoop(): void {
  refreshOnce().catch((err) => console.error('[aws-cost-exporter] initial cost refresh failed:', err));
  setInterval(() => {
    refreshOnce().catch((err) => console.error('[aws-cost-exporter] cost refresh failed:', err));
  }, config.refreshIntervalMs);
}
