import { initNodeObservability } from './lib/node-observability';

/**
 * Side-effect entry point -- a BFF's main.ts imports this as its literal
 * first line, before anything else, so require-in-the-middle's module
 * patching is installed before express/http/undici are first required. See
 * mfe-pot-platform/CLAUDE.md's observability section for why the ordering
 * matters.
 *
 * OTEL_EXPORTER_OTLP_ENDPOINT unset -- true no-op, matching the
 * REDIS_URL-unset dev-default precedent in shared-session-cache (no local
 * collector needed for plain `nx serve`).
 */
const otlpEndpoint = process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];

if (otlpEndpoint) {
  const serviceName = process.env['OTEL_SERVICE_NAME'];
  if (!serviceName) {
    throw new Error(
      'OTEL_SERVICE_NAME must be set when OTEL_EXPORTER_OTLP_ENDPOINT is set -- ' +
        'each BFF needs its own distinct service name, or spans/metrics silently ' +
        'misattribute to whichever BFF happened to set one first.',
    );
  }
  initNodeObservability({ serviceName, otlpEndpoint });
}
