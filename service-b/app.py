import random
from flask import Flask, jsonify
import logging
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.instrumentation.flask import FlaskInstrumentor
from opentelemetry.sdk.resources import Resource

# Manual OTel Configuration
resource = Resource(attributes={
    "service.name": "service-b"
})
trace.set_tracer_provider(TracerProvider(resource=resource))
otlp_exporter = OTLPSpanExporter(endpoint="http://jaeger:4318/v1/traces")
span_processor = BatchSpanProcessor(otlp_exporter)
trace.get_tracer_provider().add_span_processor(span_processor)

app = Flask(__name__)
FlaskInstrumentor().instrument_app(app)
logging.basicConfig(level=logging.DEBUG)

@app.route("/process", methods=["POST"])
def process():
    logging.info("Processing request in Service B")
    
    # 20% chance of failure
    if random.random() < 0.2:
        logging.error("Service B encountered a random error")
        return jsonify({"status": "Error", "message": "Random failure occurred"}), 500
    
    return jsonify({"status": "Success", "message": "Processed successfully"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
