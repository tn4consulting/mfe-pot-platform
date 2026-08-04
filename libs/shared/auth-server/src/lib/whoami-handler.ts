import type { Request, Response } from 'express';
import { maskSin } from './mask-sin';

/**
 * The identical `/api/whoami` response shape every BFF mounts behind
 * `verifyBearerToken` -- the concrete, checkable proof that a SIN
 * propagated from mock-idp, through the browser, into an independently
 * verifying service. Shared here rather than duplicated per BFF since it's
 * genuinely identical logic, not just a similar shape.
 */
export function whoamiHandler(req: Request, res: Response): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Missing verified identity' });
    return;
  }
  const { sub, name, sin } = req.auth;
  res.json({ sub, name, sinMasked: maskSin(sin) });
}
