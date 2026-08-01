import request from 'supertest';
import { createApp } from './app';

describe('client-profile-service', () => {
  const app = createApp();

  it('reports healthy', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns the profile for a known citizen', async () => {
    const res = await request(app).get('/api/profile/mock-citizen-001');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ sub: 'mock-citizen-001', name: 'Jordan Tremblay' });
  });

  it('returns 404 for an unknown citizen', async () => {
    const res = await request(app).get('/api/profile/nobody');
    expect(res.status).toBe(404);
  });

  it('updates the profile (tell-us-once)', async () => {
    const res = await request(app)
      .put('/api/profile/mock-citizen-001')
      .send({ phone: '613-555-9999' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('613-555-9999');

    const followUp = await request(app).get('/api/profile/mock-citizen-001');
    expect(followUp.body.phone).toBe('613-555-9999');
  });

  it('merges partial address updates instead of overwriting them', async () => {
    const res = await request(app)
      .put('/api/profile/mock-citizen-001')
      .send({ address: { city: 'Gatineau' } });
    expect(res.status).toBe(200);
    expect(res.body.address.city).toBe('Gatineau');
    expect(res.body.address.province).toBe('ON');
  });

  it('returns payment history', async () => {
    const res = await request(app).get('/api/profile/mock-citizen-001/payments');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });

  it('returns an empty payment list for an unknown citizen', async () => {
    const res = await request(app).get('/api/profile/nobody/payments');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns correspondence history', async () => {
    const res = await request(app).get('/api/profile/mock-citizen-001/correspondence');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
