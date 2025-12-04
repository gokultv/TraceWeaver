# Phase 1 Summary: TraceWeaver MVP

## 1. Objective
The goal of Phase 1 was to build a minimum viable product (MVP) for **TraceWeaver**, a system to visualize distributed traces from microservices. The specific objective was to demonstrate a "Red Node" visualization where a downstream service failure is clearly visible in a React-based UI graph.

## 2. System Architecture
We implemented a containerized architecture using **Docker Compose** with the following components:

*   **Service A (Client)**: A Python Flask service that initiates a workflow.
*   **Service B (Server)**: A Python Flask service that processes requests and simulates random failures (20% error rate).
*   **Jaeger**: The OpenTelemetry backend for collecting and storing traces.
*   **TraceWeaver UI**: A React application using **React Flow** to visualize the trace data as a directed graph.

## 3. Implementation Details

### Infrastructure (`docker-compose.yml`)
*   Orchestrates all 4 services on a shared network `traceweaver-net`.
*   **Jaeger**: Deployed using the `all-in-one` image, exposing ports `16686` (UI/API), `4317` (OTLP gRPC), and `4318` (OTLP HTTP).
*   **Environment Variables**: Configured `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME` for all services.

### Microservices (Python Flask)
*   **Service A**:
    *   Uses **Auto-Instrumentation** (`opentelemetry-instrument`).
    *   Sends HTTP POST requests to Service B.
    *   Propagates trace context automatically.
*   **Service B**:
    *   Uses **Manual Instrumentation** (switched from Auto).
    *   Manually configures `TracerProvider` and `OTLPSpanExporter`.
    *   Simulates errors by returning HTTP 500 and setting span status to `ERROR`.

### Frontend (React + React Flow)
*   **Visualization**: Uses `React Flow` to render spans as nodes and references as edges.
*   **Data Fetching**: Polls the Jaeger API every 3 seconds.
*   **Logic**:
    *   Fetches traces for `service-a`.
    *   Selects the **most complete trace** (highest span count) to ensure full visibility.
    *   Colors nodes **Green** (Success) or **Red** (Error) based on `http.status_code >= 500` or `otel.status_code == ERROR`.

## 4. Key Challenges & Solutions (Debugging Journey)

During implementation, we encountered and resolved several critical technical hurdles:

### A. OTLP Protocol Mismatch
*   **Issue**: Traces were not appearing in Jaeger.
*   **Cause**: The Python OTel exporter defaults to gRPC (port 4317), which had compatibility issues with the Jaeger configuration.
*   **Fix**: Switched to **OTLP HTTP** exporter on port `4318` by installing `opentelemetry-exporter-otlp-proto-http` and updating environment variables.

### B. CORS & Connectivity
*   **Issue**: The React UI could not fetch traces from Jaeger due to Browser CORS (Cross-Origin Resource Sharing) restrictions.
*   **Attempt 1**: Configuring Jaeger's `QUERY_HTTP_SERVER_CORS_ALLOW_ORIGINS`. (Insufficient).
*   **Attempt 2**: Using `http-proxy-middleware` in `setupProxy.js`. (Failed due to configuration complexity).
*   **Final Fix**: Configured a proxy in `package.json` (`"proxy": "http://jaeger:16686"`). This allows the React app to forward API requests (`/api/...`) to the Jaeger container internally, bypassing browser CORS checks.

### C. Service B Instrumentation
*   **Issue**: Service B traces were missing, or appeared as separate traces (broken context).
*   **Cause**: Auto-instrumentation (`opentelemetry-instrument`) was failing silently for Service B, likely due to dependency conflicts or environment issues.
*   **Fix**: Switched Service B to **Manual Instrumentation**. We explicitly configured the `OTLPSpanExporter` in `app.py` to ensure traces are sent to `http://jaeger:4318/v1/traces`.

### D. UI Trace Selection
*   **Issue**: The UI sometimes showed only Service A, even when Service B traces existed in Jaeger.
*   **Cause**: The Jaeger API returns a list of traces. The UI was blindly selecting the *first* trace (`data[0]`), which was often a partial or older trace.
*   **Fix**: Updated `FlowMap.js` to iterate through all returned traces and select the one with the **most spans**. This ensures the UI always displays the complete distributed trace containing both services.

## 5. Final Outcome
We successfully achieved the Phase 1 objective. The system now:
1.  Generates distributed traces across two services.
2.  Reliably collects them in Jaeger.
3.  Visualizes the flow in real-time.
4.  **Accurately highlights failures in Red**, providing immediate visual feedback of system health.
