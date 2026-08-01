import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { getStoredSession } from './session-sync';

/**
 * Shell-only: the shell has real sub-routes to guard (`/dashboard`, etc.),
 * so this is a normal Angular router guard. Remotes have no internal
 * routing in this PoT (each exposes a single component), so they check
 * their own claim directly in that component instead -- same principle,
 * different mechanism, see CLAUDE.md.
 */
export const requireSessionGuard: CanActivateFn = () => {
  const router = inject(Router);
  return getStoredSession() !== null ? true : router.parseUrl('/');
};
