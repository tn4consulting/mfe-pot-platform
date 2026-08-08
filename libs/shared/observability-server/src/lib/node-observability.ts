import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export interface NodeObservabilityOptions {
  /** Distinct per-BFF -- see charts/<bff>/values.yaml's OTEL_SERVICE_NAME. */
  serviceName: string;
  /** Collector's OTLP/HTTP base URL, e.g. http://otel-collector.default.svc.cluster.local:4318 -- signal-specific paths are appended here. */
  otlpEndpoint: string;
}

let started = false;

/**
 * Starts the Node OTel SDK: traces + metrics over OTLP/HTTP, auto-instrumented
 * http/undici/express spans (undici matters because dashboard-bff's fan-out
 * to the other two BFFs uses the native fetch API, not http.request).
 * Idempotent -- a second call is a no-op.
 *
 * Never throws, and a collector that's down or unreachable has zero impact
 * on this BFF's own request handling. Two independent things make that
 * true: (1) the exporters' own export calls are async and run on a batch
 * timer completely decoupled from any real request/response cycle -- a
 * failed export is retried/dropped in the background by the SDK itself,
 * never propagated as an exception into application code; (2) this
 * function's own synchronous setup (constructing the SDK/exporters, which
 * itself makes no network calls) is wrapped in try/catch so that even an
 * unexpected SDK-internal failure at startup can't crash the BFF process --
 * telemetry is strictly best-effort and must never become a new source of
 * downtime for a citizen-facing service.
 */
export function initNodeObservability(options: NodeObservabilityOptions): void {
  if (started) {
    return;
  }
  started = true;

  try {
    const sdk = new NodeSDK({
      resource: resourceFromAttributes({ [ATTR_SERVICE_NAME]: options.serviceName }),
      traceExporter: new OTLPTraceExporter({ url: `${options.otlpEndpoint}/v1/traces` }),
      metricReaders: [
        new PeriodicExportingMetricReader({
          exporter: new OTLPMetricExporter({ url: `${options.otlpEndpoint}/v1/metrics` }),
        }),
      ],
      instrumentations: [
        getNodeAutoInstrumentations({
          // Noisy and not useful for these BFFs (no meaningful fs work of
          // their own) -- every other default instrumentation (http,
          // undici, express) stays enabled.
          '@opentelemetry/instrumentation-fs': { enabled: false },
        }),
      ],
    });

    sdk.start();
  } catch (err) {
    // Deliberately console, not a dependency on this BFF's own logging
    // setup, which observability bootstrap must not assume exists.
    console.warn('[shared-observability-server] failed to initialize, continuing without telemetry:', err);
  }
}
