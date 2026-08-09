import request from 'supertest';
import { createApp } from './app';
import { applySnapshot } from './metrics';

describe('aws-cost-exporter', () => {
  const app = createApp();

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('serves Prometheus text-format metrics with no cost series before the first refresh', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.text).toContain('# HELP aws_cost_daily_usd');
    expect(res.text).not.toMatch(/^aws_cost_daily_usd\{/m);
  });

  it('reflects an applied cost snapshot as labeled gauges', async () => {
    const fetchedAt = new Date('2026-08-09T12:00:00Z');
    applySnapshot({
      daily: [{ service: 'Amazon Elastic Kubernetes Service', amountUsd: 12.34 }],
      monthToDate: [{ service: 'Amazon Elastic Kubernetes Service', amountUsd: 256.78 }],
      fetchedAt,
    });

    const res = await request(app).get('/metrics');
    expect(res.text).toContain('aws_cost_daily_usd{service="Amazon Elastic Kubernetes Service"} 12.34');
    expect(res.text).toContain('aws_cost_mtd_usd{service="Amazon Elastic Kubernetes Service"} 256.78');
    expect(res.text).toContain(`aws_cost_last_refresh_timestamp_seconds ${fetchedAt.getTime() / 1000}`);
  });
});
