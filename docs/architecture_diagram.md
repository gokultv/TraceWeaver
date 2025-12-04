# TraceWeaver Architecture Diagram

This diagram illustrates the flow of requests (solid lines) and the flow of trace data (dotted lines) in the TraceWeaver system.

```mermaid
graph TD
    User(User / Curl)
    Browser(User Browser)
    
    subgraph ServiceA_Container [Service A Container]
        ServiceA[Service A Flask]
        OTelA[OTel SDK]
    end
    
    subgraph ServiceB_Container [Service B Container]
        ServiceB[Service B Flask]
        OTelB[OTel SDK]
    end
    
    subgraph Jaeger_Container [Jaeger Container]
        JaegerCollector[Jaeger Collector]
        JaegerQuery[Jaeger Query Service]
    end
    
    subgraph UI_Container [UI Container]
        ReactApp[TraceWeaver UI]
        Proxy[Proxy]
    end

    User -->|1. POST /start-workflow| ServiceA
    ServiceA -->|2. POST /process| ServiceB
    ServiceB -->|3. Response| ServiceA
    ServiceA -->|4. Response| User

    ServiceA -.->|Internal Call| OTelA
    OTelA -.->|5. Export Trace HTTP| JaegerCollector
    
    ServiceB -.->|Internal Call| OTelB
    OTelB -.->|6. Export Trace HTTP| JaegerCollector

    JaegerCollector --> JaegerQuery

    Browser -->|7. View UI| ReactApp
    ReactApp -->|8. Fetch Traces| Proxy
    Proxy -->|9. Proxy Request| JaegerQuery
    JaegerQuery -->|10. Return JSON| Proxy
    Proxy -->|11. Return JSON| ReactApp
    ReactApp -->|12. Render Graph| Browser
```

### Key Components

1.  **User / Curl**: Initiates the workflow.
2.  **Service A & B**: The microservices doing the work. They contain the **OTel SDK** (library) which automatically captures timing and metadata.
3.  **OTel SDK**: The "agent" inside the code. It buffers spans and sends them to Jaeger asynchronously.
4.  **Jaeger**: The backend that receives, stores, and serves trace data.
5.  **TraceWeaver UI**: The frontend that visualizes the data. It uses a **Proxy** to talk to Jaeger to avoid browser security restrictions (CORS).
