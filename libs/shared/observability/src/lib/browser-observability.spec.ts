const registerInstrumentationsMock = jest.fn();
const tracerProviderConstructorMock = jest.fn();
const meterProviderConstructorMock = jest.fn();

// A minimal fake span with a valid-shaped SpanContext -- real enough for
// @opentelemetry/core's actual W3CTraceContextPropagator (used unmocked
// below, since it's pure/deterministic logic) to inject/extract a genuine
// W3C `traceparent` string against.
function makeFakeSpan(spanId: string) {
  return {
    spanContext: () => ({
      traceId: '4bf92f3577b34da6a3ce929d0e0e4736',
      spanId,
      traceFlags: 1,
      isRemote: false,
    }),
  };
}

jest.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: jest.fn().mockImplementation((...args: unknown[]) => {
    tracerProviderConstructorMock(...args);
    return {
      name: 'tracerProvider',
      getTracer: () => ({ startSpan: jest.fn().mockReturnValue(makeFakeSpan('00f067aa0ba902b7')) }),
    };
  }),
  BatchSpanProcessor: jest.fn(),
}));
jest.mock('@opentelemetry/sdk-metrics', () => ({
  MeterProvider: jest.fn().mockImplementation((...args: unknown[]) => {
    meterProviderConstructorMock(...args);
    return { name: 'meterProvider' };
  }),
  PeriodicExportingMetricReader: jest.fn(),
}));
jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn(),
}));
jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn(),
}));
jest.mock('@opentelemetry/instrumentation', () => ({
  registerInstrumentations: (...args: unknown[]) => registerInstrumentationsMock(...args),
}));
jest.mock('@opentelemetry/instrumentation-document-load', () => ({
  DocumentLoadInstrumentation: jest.fn(),
}));
jest.mock('@opentelemetry/instrumentation-fetch', () => ({
  FetchInstrumentation: jest.fn(),
}));

describe('initBrowserObservability', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('is a no-op when otlpEndpoint is undefined', () => {
    const { initBrowserObservability } = require('./browser-observability');
    initBrowserObservability({ serviceName: 'job-bank-mfe', otlpEndpoint: undefined });

    expect(tracerProviderConstructorMock).not.toHaveBeenCalled();
    expect(meterProviderConstructorMock).not.toHaveBeenCalled();
    expect(registerInstrumentationsMock).not.toHaveBeenCalled();
  });

  it('registers instrumentations against a locally-built tracer/meter provider pair, not the global registry', () => {
    const { initBrowserObservability } = require('./browser-observability');
    initBrowserObservability({
      serviceName: 'job-bank-mfe',
      otlpEndpoint: 'http://otel.mfe-pot.local',
      propagateTraceHeaderCorsUrls: [/job-bank-mfe\.mfe-pot\.local/],
    });

    expect(tracerProviderConstructorMock).toHaveBeenCalledTimes(1);
    expect(meterProviderConstructorMock).toHaveBeenCalledTimes(1);
    expect(registerInstrumentationsMock).toHaveBeenCalledTimes(1);
    const call = registerInstrumentationsMock.mock.calls[0][0];
    expect(call.tracerProvider).toMatchObject({ name: 'tracerProvider' });
    expect(call.meterProvider).toEqual({ name: 'meterProvider' });
    expect(call.instrumentations).toHaveLength(2);
  });

  it('is idempotent -- a second call on the same module instance does not re-init', () => {
    const { initBrowserObservability } = require('./browser-observability');
    initBrowserObservability({ serviceName: 'job-bank-mfe', otlpEndpoint: 'http://otel.mfe-pot.local' });
    initBrowserObservability({ serviceName: 'job-bank-mfe', otlpEndpoint: 'http://otel.mfe-pot.local' });

    expect(tracerProviderConstructorMock).toHaveBeenCalledTimes(1);
  });

  it('does not throw if setup fails -- telemetry is best-effort, never a new failure mode for the app', () => {
    const { WebTracerProvider } = require('@opentelemetry/sdk-trace-web');
    WebTracerProvider.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { initBrowserObservability } = require('./browser-observability');

    expect(() =>
      initBrowserObservability({ serviceName: 'job-bank-mfe', otlpEndpoint: 'http://otel.mfe-pot.local' }),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to initialize'), expect.any(Error));

    warnSpy.mockRestore();
  });
});

describe('startPageSpan / withRemoteParent', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('startPageSpan returns undefined when observability was never initialized', () => {
    const { startPageSpan } = require('./browser-observability');
    expect(startPageSpan('overview-page-load')).toBeUndefined();
  });

  it('withRemoteParent with an undefined traceparent just runs fn() normally', () => {
    const { withRemoteParent } = require('./browser-observability');
    const fn = jest.fn().mockReturnValue('result');
    expect(withRemoteParent(undefined, fn)).toBe('result');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('startPageSpan produces a real W3C traceparent once initialized, and withRemoteParent round-trips it without throwing', () => {
    const { initBrowserObservability, startPageSpan, withRemoteParent } = require('./browser-observability');
    initBrowserObservability({ serviceName: 'dashboard-mfe', otlpEndpoint: 'http://otel.mfe-pot.local' });

    const result = startPageSpan('overview-page-load');
    expect(result).toBeDefined();
    // 00-<32 hex traceId>-<16 hex spanId>-<2 hex flags>
    expect(result?.traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-[0-9a-f]{2}$/);

    const fn = jest.fn().mockReturnValue('widget-fetch-result');
    expect(withRemoteParent(result?.traceparent, fn)).toBe('widget-fetch-result');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
