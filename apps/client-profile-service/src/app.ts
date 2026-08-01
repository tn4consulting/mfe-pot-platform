import cors from 'cors';
import express, { Express } from 'express';
import { getCorrespondence, getPayments, getProfile, updateProfile } from './data';

/**
 * "Tell us once" data (profile, address, payments, correspondence) lives
 * here as the single source of truth -- not duplicated as in-memory state
 * inside job-bank/employment-insurance/dashboard, which would silently give
 * each independently-built remote its own disconnected copy. See
 * CLAUDE.md's "Backends: BFF pattern" section.
 */
export function createApp(): Express {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/profile/:sub', (req, res) => {
    const profile = getProfile(req.params.sub);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(profile);
  });

  app.put('/api/profile/:sub', (req, res) => {
    const updated = updateProfile(req.params.sub, req.body);
    if (!updated) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.json(updated);
  });

  app.get('/api/profile/:sub/payments', (req, res) => {
    res.json(getPayments(req.params.sub));
  });

  app.get('/api/profile/:sub/correspondence', (req, res) => {
    res.json(getCorrespondence(req.params.sub));
  });

  return app;
}
