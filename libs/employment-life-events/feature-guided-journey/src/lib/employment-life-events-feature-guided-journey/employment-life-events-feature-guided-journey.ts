import {
  AfterViewInit,
  Component,
  EnvironmentInjector,
  ViewChild,
  ViewContainerRef,
  createEnvironmentInjector,
  inject,
} from '@angular/core';
import { TranslocoPipe } from '@tn4consulting/shared-i18n';
import { PAYMENT_HISTORY_WIDGET_LOADER } from '@tn4consulting/shared-federation-runtime';

@Component({
  selector: 'lib-employment-life-events-feature-guided-journey',
  imports: [TranslocoPipe],
  templateUrl: './employment-life-events-feature-guided-journey.html',
  styleUrl: './employment-life-events-feature-guided-journey.css',
})
export class EmploymentLifeEventsFeatureGuidedJourney
  implements AfterViewInit
{
  @ViewChild('paymentHistoryWidgetHost', { read: ViewContainerRef })
  private paymentHistoryWidgetHost!: ViewContainerRef;

  // Optional: standalone mode (no host wired up, e.g. running this app on
  // its own for independent testability) has no loader to inject, and the
  // widget slot degrades gracefully rather than crashing the journey.
  private readonly loadPaymentHistoryWidget = inject(
    PAYMENT_HISTORY_WIDGET_LOADER,
    { optional: true },
  );
  private readonly envInjector = inject(EnvironmentInjector);

  protected widgetLoadError = false;

  ngAfterViewInit(): void {
    if (!this.loadPaymentHistoryWidget) {
      this.widgetLoadError = true;
      return;
    }

    // Cross-remote widget embedding: dashboard (a separately deployed
    // remote) exposes its payment-history component. The shell -- the only
    // party guaranteed to have a working federation runtime -- loads it and
    // hands us the component class AND dashboard's own providers for it via
    // this injected loader, rather than us calling loadRemoteModule on
    // another remote directly (see CLAUDE.md's federation-sharing policy
    // for why that doesn't work). The providers are applied via a child
    // environment injector -- same pairing `RemoteRouteHost` uses -- since
    // this component's own injector (ours) has no idea what the widget
    // needs (e.g. its API client).
    this.loadPaymentHistoryWidget()
      .then(({ component, providers }) => {
        const childInjector = providers.length
          ? createEnvironmentInjector(providers, this.envInjector)
          : this.envInjector;
        this.paymentHistoryWidgetHost.createComponent(component, {
          environmentInjector: childInjector,
        });
      })
      .catch((err) => {
        console.error('Failed to load dashboard payment-history widget', err);
        this.widgetLoadError = true;
      });
  }
}
