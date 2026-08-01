import { CanActivateFn } from '@angular/router';
/**
 * Shell-only: the shell has real sub-routes to guard (`/dashboard`, etc.),
 * so this is a normal Angular router guard. Remotes have no internal
 * routing in this PoT (each exposes a single component), so they check
 * their own claim directly in that component instead -- same principle,
 * different mechanism, see CLAUDE.md.
 */
export declare const requireSessionGuard: CanActivateFn;
//# sourceMappingURL=require-session.guard.d.ts.map