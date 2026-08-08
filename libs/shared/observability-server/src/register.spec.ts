const initNodeObservabilityMock = jest.fn();

jest.mock('./lib/node-observability', () => ({
  initNodeObservability: (...args: unknown[]) => initNodeObservabilityMock(...args),
}));

describe('register', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env['OTEL_EXPORTER_OTLP_ENDPOINT'];
    delete process.env['OTEL_SERVICE_NAME'];
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('is a no-op when OTEL_EXPORTER_OTLP_ENDPOINT is unset', () => {
    require('./register');

    expect(initNodeObservabilityMock).not.toHaveBeenCalled();
  });

  it('throws when the endpoint is set but the service name is not', () => {
    process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'http://otel-collector:4318';

    expect(() => require('./register')).toThrow(/OTEL_SERVICE_NAME/);
  });

  it('initializes observability when both env vars are set', () => {
    process.env['OTEL_EXPORTER_OTLP_ENDPOINT'] = 'http://otel-collector:4318';
    process.env['OTEL_SERVICE_NAME'] = 'job-bank-bff';

    require('./register');

    expect(initNodeObservabilityMock).toHaveBeenCalledWith({
      serviceName: 'job-bank-bff',
      otlpEndpoint: 'http://otel-collector:4318',
    });
  });
});
