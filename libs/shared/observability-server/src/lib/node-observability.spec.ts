const startMock = jest.fn();
const sdkConstructorMock = jest.fn();

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation((...args: unknown[]) => {
    sdkConstructorMock(...args);
    return { start: startMock };
  }),
}));
jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn().mockReturnValue([]),
}));
jest.mock('@opentelemetry/exporter-trace-otlp-http', () => ({
  OTLPTraceExporter: jest.fn(),
}));
jest.mock('@opentelemetry/exporter-metrics-otlp-http', () => ({
  OTLPMetricExporter: jest.fn(),
}));
jest.mock('@opentelemetry/sdk-metrics', () => ({
  PeriodicExportingMetricReader: jest.fn(),
}));

describe('initNodeObservability', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('starts the SDK once for the given service name and OTLP endpoint', () => {
    const { initNodeObservability } = require('./node-observability');
    initNodeObservability({ serviceName: 'job-bank-bff', otlpEndpoint: 'http://otel-collector:4318' });

    expect(sdkConstructorMock).toHaveBeenCalledTimes(1);
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it('is idempotent -- a second call on the same module instance does not start a second SDK', () => {
    const { initNodeObservability } = require('./node-observability');
    initNodeObservability({ serviceName: 'job-bank-bff', otlpEndpoint: 'http://otel-collector:4318' });
    initNodeObservability({ serviceName: 'job-bank-bff', otlpEndpoint: 'http://otel-collector:4318' });

    expect(sdkConstructorMock).toHaveBeenCalledTimes(1);
  });

  it('does not throw if the SDK fails to initialize -- telemetry is best-effort, never a new failure mode', () => {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    NodeSDK.mockImplementationOnce(() => {
      throw new Error('boom');
    });
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { initNodeObservability } = require('./node-observability');

    expect(() =>
      initNodeObservability({ serviceName: 'job-bank-bff', otlpEndpoint: 'http://otel-collector:4318' }),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('failed to initialize'), expect.any(Error));

    warnSpy.mockRestore();
  });
});
