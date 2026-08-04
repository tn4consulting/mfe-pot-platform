import express from 'express';
import request from 'supertest';
import { whoamiHandler } from './whoami-handler';

describe('whoamiHandler', () => {
  it('returns the masked identity when req.auth is set', async () => {
    const app = express();
    app.get(
      '/api/whoami',
      (req, _res, next) => {
        req.auth = { sub: 'citizen-abc123', name: 'Alex Chen', sin: '123-456-789', claims: [] };
        next();
      },
      whoamiHandler,
    );

    const res = await request(app).get('/api/whoami');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sub: 'citizen-abc123', name: 'Alex Chen', sinMasked: '•••-•••-789' });
  });

  it('rejects when req.auth is missing', async () => {
    const app = express();
    app.get('/api/whoami', whoamiHandler);

    const res = await request(app).get('/api/whoami');
    expect(res.status).toBe(401);
  });
});
