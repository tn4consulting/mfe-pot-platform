import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { DocumentLoadInstrumentation } from '@opentelemetry/instrumentation-document-load';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { BatchSpanProcessor, WebTracerProvider, type PropagateTraceHeaderCorsUrls } from '@opentelemetry/sdk-trace-web';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface BrowserObservabilityOptions {
  /** This app's own federation identity, e.g. "job-bank-mfe" or "msca-shell". */
  serviceName: string;
  /**
   * Collector's browser-reachable OTLP/HTTP Ingress URL, e.g.
   * http://otel.mfe-pot.local -- undefined skips init entirely (no local
   * collector needed for plain `nx serve`).
   */
  otlpEndpoint: string | undefined;
  /**
   * Origins this app's own BFF calls should carry a traceparent header to.
   * Not optional in practice for any app with a BFF: a federated remote
   * resolves its BFF base URL against its OWN origin (see runtime-config.ts),
   * so the call is cross-origin from the browser's point of view even when
   * embedded in a shell -- FetchInstrumentation only attaches traceparent to
   * origins listed here. Leave empty for apps with no BFF of their own.
   */
  propagateTraceHeaderCorsUrls?: PropagateTraceHeaderCorsUrls;
}

let initialized = false;

/**
 * Starts an independent, per-app OTel Web SDK instance: its own
 * WebTracerProvider + MeterProvider, registered via registerInstrumentations
 * (NOT the global WebTracerProvider.register() form -- see
 * mfe-pot-platform/CLAUDE.md's observability section for why: with every
 * federated app on a page bundling its own copy of this package, global
 * registration would let whichever app's bundle loads first silently win
 * and mis-attribute every other app's spans to its own service.name).
 *
 * Idempotent -- some apps call their one wiring point (runtime-config.ts's
 * loadRuntimeConfig) more than once per session (e.g. dashboard-mfe, which
 * exposes both ./Component and ./PaymentHistoryWidget).
 *
 * Never throws. The collector being unreachable is an expected, harmless
 * runtime condition -- the SDK's own exporters already handle that
 * gracefully and asynchronously (a failed export is dropped/retried in the
 * background, never surfaced as a thrown error or a blocked request; this
 * app's own real fetch/render calls are never delayed by it). What this
 * try/catch actually guards against is different: an unexpected failure
 * *setting up* the SDK itself (e.g. a future OTel version's constructor
 * throwing, a browser API being unexpectedly unavailable) must never take
 * down the calling app -- telemetry is strictly best-effort and must never
 * be a new failure mode for a citizen-facing page.
 */
export function initBrowserObservability(options: BrowserObservabilityOptions): void {
  if (initialized || !options.otlpEndpoint) {
    return;
  }
  initialized = true;

  try {
    const otlpEndpoint = options.otlpEndpoint;

    const tracerProvider = new WebTracerProvider({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: options.serviceName }),
      spanProcessors: [new BatchSpanProcessor(new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces` }))],
    });

    const meterProvider = new MeterProvider({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: options.serviceName }),
      readers: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics` }),
        }),
      ],
    });

    registerInstrumentations({
      tracerProvider,
      meterProvider,
      instrumentations: [
        new DocumentLoadInstrumentation(),
        new FetchInstrumentation({
          propagateTraceHeaderCorsUrls: options.propagateTraceHeaderCorsUrls ?? [],
        }),
      ],
    });
  } catch (err) {
    // Deliberately console, not a dependency on this app's own logging
    // setup, which observability bootstrap must not assume exists.
    console.warn('[shared-observability] failed to initialize, continuing without telemetry:', err);
  }
}
