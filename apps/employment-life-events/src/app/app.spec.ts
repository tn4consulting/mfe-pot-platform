import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { clearSession, createMockSession, storeSession } from '@tn4consulting/shared-auth';
import { App } from './app';

describe('App', () => {
  afterEach(() => clearSession());

  async function setup() {
    await TestBed.configureTestingModule({
      imports: [
        App,
        TranslocoTestingModule.forRoot({
          langs: {
            en: { auth: { signInRequired: 'You need to sign in to view your guided journey.' } },
            fr: { auth: { signInRequired: 'Vous devez ouvrir une session.' } },
          },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: [provideRouter([])],
    }).compileComponents();
  }

  it('should create the app', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the guided journey when the claim is present', async () => {
    storeSession(createMockSession());
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('lib-employment-life-events-feature-guided-journey'),
    ).not.toBeNull();
  });

  it('blocks its own content when there is no active session, independent of the shell', async () => {
    clearSession();
    await setup();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(
      compiled.querySelector('lib-employment-life-events-feature-guided-journey'),
    ).toBeNull();
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain('sign in');
  });
});
