const port = process.env['PORT'] ? Number(process.env['PORT']) : 3006;

export const config = {
  // Same 0.0.0.0-not-'localhost' reasoning as apps/mock-idp/src/config.ts --
  // a container-internal 'localhost' default would make the Pod's Service
  // unreachable despite the process looking healthy from inside its own
  // container.
  host: process.env['HOST'] ?? '0.0.0.0',
  port,
  // Cost Explorer's GetCostAndUsage is individually billed per call (and its
  // underlying data only updates roughly daily), so this must be decoupled
  // from Prometheus's own ~15s scrape interval -- refreshed on this long
  // timer instead, with every /metrics scrape served from the in-memory
  // cache. 6h default keeps this well under any reasonable API budget for a
  // demo while still reflecting same-day spend during a live demo session.
  refreshIntervalMs: process.env['COST_REFRESH_INTERVAL_MS']
    ? Number(process.env['COST_REFRESH_INTERVAL_MS'])
    : 6 * 60 * 60 * 1000,
};
