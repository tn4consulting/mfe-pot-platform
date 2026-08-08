const registerInstrumentationsMock = jest.fn();
const tracerProviderConstructorMock = jest.fn();
const meterProviderConstructorMock = jest.fn();

jest.mock('@opentelemetry/sdk-trace-web', () => ({
  WebTracerProvider: jest.fn().mockImplementation((...args: unknown[]) => {
    tracerProviderConstructorMock(...args);
    return { name: 'tracerProvider' };
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
    expect(call.tracerProvider).toEqual({ name: 'tracerProvider' });
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
