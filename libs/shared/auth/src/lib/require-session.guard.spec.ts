import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { requireSessionGuard } from './require-session.guard';
import { storeSession } from './session-sync';
import { createMockSession } from './mock-login';

describe('requireSessionGuard', () => {
  let router: Router;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
    router = TestBed.inject(Router);
  });

  function runGuard(): boolean | UrlTree {
    return TestBed.runInInjectionContext(() =>
      requireSessionGuard({} as never, {} as never),
    ) as boolean | UrlTree;
  }

  it('allows activation when a session is present', () => {
    storeSession(createMockSession());
    expect(runGuard()).toBe(true);
  });

  it('redirects to the login route when no session is present', () => {
    const result = runGuard();
    expect(result).not.toBe(true);
    expect((result as UrlTree).toString()).toBe(router.parseUrl('/').toString());
  });
});
