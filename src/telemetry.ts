import opentelemetry, { Span } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { BatchSpanProcessor, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { FastifyInstrumentation, FastifyRequestInfo } from '@opentelemetry/instrumentation-fastify';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { OTTracePropagator } from '@opentelemetry/propagator-ot-trace';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

export const provider = new NodeTracerProvider({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'tier2-backend-node',
  }),
});
provider.register();

export const fastifyInstrumentation = new FastifyInstrumentation({
  requestHook: function(span: Span, info: FastifyRequestInfo) {
    span.setAttribute(
      'http.method', info.request.method,
      // 'my-pub-key', process.env. //TODO
      // 'my-ip' //TODO
    );
  },
});
registerInstrumentations({
  tracerProvider: provider,
  instrumentations: [
    // Fastify instrumentation expects HTTP layer to be instrumented
    new HttpInstrumentation(),
    new FastifyInstrumentation(),
  ],
});

const oltpExporterOptions = {
  // tags: [], // optional
  // You can use the default UDPSender
  host: 'localhost', // optional
  port: 6832, // optional
  // OR you can use the HTTPSender as follows
  endpoint: 'http://localhost:14268/api/traces',
  maxPacketSize: 65000, // optional

};
// const exporter = new OTLPTraceExporter(oltpExporterOptions);
const exporter = new JaegerExporter(oltpExporterOptions); //TODO replace with OTLPTraceExporter later
// const exporter = new ConsoleSpanExporter();
provider.addSpanProcessor(new BatchSpanProcessor(exporter));
provider.register({ propagator: new OTTracePropagator() });

export const tracer = opentelemetry.trace.getTracer('tier2-broadcast-node');

