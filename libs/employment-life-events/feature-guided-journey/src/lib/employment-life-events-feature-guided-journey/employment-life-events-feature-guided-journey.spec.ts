import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@tn4consulting/shared-i18n';
import { PAYMENT_HISTORY_WIDGET_LOADER } from '@tn4consulting/shared-federation-runtime';
import { EmploymentLifeEventsFeatureGuidedJourney } from './employment-life-events-feature-guided-journey';

@Component({ selector: 'lib-fake-widget', standalone: true, template: 'widget content' })
class FakeWidget {}

describe('EmploymentLifeEventsFeatureGuidedJourney', () => {
  function setup(loader?: () => Promise<unknown>) {
    return TestBed.configureTestingModule({
      imports: [
        EmploymentLifeEventsFeatureGuidedJourney,
        TranslocoTestingModule.forRoot({
          langs: { en: {}, fr: {} },
          translocoConfig: { availableLangs: ['en', 'fr'], defaultLang: 'en' },
        }),
      ],
      providers: loader ? [{ provide: PAYMENT_HISTORY_WIDGET_LOADER, useValue: loader }] : [],
    }).compileComponents();
  }

  it('shows a degraded state when no loader is provided (standalone mode)', async () => {
    await setup();
    const fixture = TestBed.createComponent(EmploymentLifeEventsFeatureGuidedJourney);
    fixture.detectChanges();
    fixture.componentInstance.ngAfterViewInit();

    expect(fixture.componentInstance['widgetLoadError']).toBe(true);
  });

  it('mounts the widget with its own providers via a child environment injector', async () => {
    await setup(() =>
      Promise.resolve({
        component: FakeWidget,
        providers: [{ provide: 'SOME_TOKEN', useValue: 'from-dashboard' }],
      }),
    );
    const fixture = TestBed.createComponent(EmploymentLifeEventsFeatureGuidedJourney);
    fixture.detectChanges();
    fixture.componentInstance.ngAfterViewInit();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('widget content');
    expect(fixture.componentInstance['widgetLoadError']).toBe(false);
  });

  it('shows a degraded state when the widget fails to load', async () => {
    await setup(() => Promise.reject(new Error('remote unreachable')));
    const fixture = TestBed.createComponent(EmploymentLifeEventsFeatureGuidedJourney);
    fixture.detectChanges();
    fixture.componentInstance.ngAfterViewInit();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance['widgetLoadError']).toBe(true);
  });
});
