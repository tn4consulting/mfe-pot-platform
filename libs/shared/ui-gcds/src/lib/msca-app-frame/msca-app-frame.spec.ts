import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { TranslocoService } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { MscaAppFrame } from './msca-app-frame';

describe('MscaAppFrame', () => {
  const setActiveLang = jest.fn();

  beforeEach(async () => {
    setActiveLang.mockClear();
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [MscaAppFrame],
      providers: [
        { provide: TranslocoService, useValue: { setActiveLang } },
        provideRouter([]),
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(MscaAppFrame);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('defaults to the MSCA brand name', () => {
    const fixture = TestBed.createComponent(MscaAppFrame);
    expect(fixture.componentInstance.brandName).toBe('My Service Canada Account');
  });

  it('switching locale flips between en and fr and notifies TranslocoService', () => {
    const fixture = TestBed.createComponent(MscaAppFrame);
    const component = fixture.componentInstance as unknown as {
      activeLocale: string;
      switchLocale: () => void;
    };
    expect(component.activeLocale).toBe('en');

    component.switchLocale();
    expect(component.activeLocale).toBe('fr');
    expect(setActiveLang).toHaveBeenCalledWith('fr');

    component.switchLocale();
    expect(component.activeLocale).toBe('en');
    expect(setActiveLang).toHaveBeenCalledWith('en');
  });

  it('reflects no active session by default', () => {
    const fixture = TestBed.createComponent(MscaAppFrame);
    const component = fixture.componentInstance as unknown as { session: () => unknown };
    expect(component.session()).toBeNull();
  });

  it('signOut clears the session and navigates to the login route', () => {
    storeSession(createMockSession());
    const fixture = TestBed.createComponent(MscaAppFrame);
    const component = fixture.componentInstance as unknown as {
      session: () => unknown;
      signOut: () => void;
    };
    expect(component.session()).not.toBeNull();

    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    component.signOut();

    expect(component.session()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/');
    clearSession();
  });
});
