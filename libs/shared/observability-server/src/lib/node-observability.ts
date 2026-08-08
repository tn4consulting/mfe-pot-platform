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
 */
export function initNodeObservability(options: NodeObservabilityOptions): void {
  if (started) {
    return;
  }
  started = true;

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
        // Noisy and not useful for these BFFs (no meaningful fs work of their
        // own) -- every other default instrumentation (http, undici,
        // express) stays enabled.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();
}
