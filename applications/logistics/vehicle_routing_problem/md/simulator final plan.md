# Deeply Enhanced & Refined Implementation Plan: API Engine Integration, Database Schema Adjustments & Full-Info Telemetry Logging ($\mathcal{P}_{\text{ER-MD-VRPTW-3D-HRI-Q}}$)

This comprehensive plan details the architectural enhancements, database schema extensions, REST API upgrades, and full-information logging pipelines required for 100% interoperability between the Python `DispatchEngine`, the .NET 10 Gateway, the VB.NET Persistence Layer, and the React 19 3D Digital Twin Simulator.

---

## User Review Required

> [!IMPORTANT]
> **1. Database Schema Extensions (8 Cohesive Tables)**:
> In addition to the baseline `scenarios`, `orders`, and `execution_runs` tables, the persistence layer is enhanced with 5 new dedicated cyber-physical tables:
> - `vehicle_routes` & `route_stops`: Persists complete multi-depot vehicle route sequences, arrival/departure timestamps, and carried payloads.
> - `container_placements` & `lifo_dependencies`: Stores 3D bounding boxes $(x, y, z, l, w, h)$ inside AMR bays and the complete directed acyclic graph ($\mathcal{G}_{\text{LIFO}}$) of extraction precedence.
> - `gate_validations`: Records formal verification outcomes for Gates 1–4, violation metrics, and verification code `lmn`.
> - `telemetry_events`: Persistent **Full-Info Logger DB Sink** storing structured ECS/OpenTelemetry log events, trace spans, and error traces.
> - `chute_flow_dynamics`: Time-series recording continuous accumulation volume $Q_c(t)$ and drop impulses.
>
> **2. Zero-Latency Dual DB Backend (SQLite Native + SQL Server)**:
> Both Python (`sqlite3` / `SQLAlchemy`) and VB.NET (`Microsoft.Data.Sqlite` / `Microsoft.Data.SqlClient`) share identical schema definitions, enabling zero-configuration embedded execution or enterprise-grade clustered SQL Server deployment.
>
> **3. REST API Compatibility Upgrades**:
> Standalone server (`api/standalone_server.py`) and OpenAPI specification (`api/openapi_spec.py`) are expanded with 10 new endpoints dedicated to feeding the React 19 3D simulator: complete 3D schedules, 50Hz continuous kinematic splines, LIFO extraction DAGs, chute accumulation curves, live SSE telemetry streams, and vector PDF reports.

---

## Open Questions

> [!NOTE]
> 1. **Telemetry DB Archival Policy**: By default, high-frequency 50Hz kinematic ticks are streamed via memory ring buffer (`TelemetryBuffer`) and SSE, while milestone events (gate passes, tier completions, errors, warnings) are committed to the `telemetry_events` table in SQLite. Should all raw 50Hz frame vectors also be persisted to a dedicated SQLite time-series table (`amr_kinematic_frames`), or retained only in the memory buffer and exported on-demand?
> 2. **Database Auto-Migration**: Should `DatabaseManager.init_schema()` automatically execute non-destructive `ALTER TABLE` statements on existing databases to add new columns without dropping legacy data?

---

## Architecture Overview: Engine API, Database, and Simulator Integration

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                       SYSTEM INTEGRATION & DATA TOPOLOGY                                        │
│                                                                                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                       REACT 19 3D DIGITAL TWIN SIMULATOR                                │   │
│   │  - 3D Warehouse Canvas (Three.js / InstancedMesh)    - Classiq Quantum Studio (Bloch / QAOA / DAG)       │   │
│   │  - Graph Analytics Studio (7 Interactive Charts)     - Live Telemetry Console (SSE / Waterfall)         │   │
│   │  - PDF Export Modal (Live Vector Preview & Print)    - Scenario Archetype Generator & Benchmark HUD     │   │
│   └───────────────────────────────────┬─────────────────────────────────┬───────────────────────────────────┘   │
│                                       │                                 │                                       │
│                         HTTP / REST   │                   SSE Live      │ Binary Telemetry                      │
│                         Requests      │                   Stream        │ (28-byte unmanaged frames)            │
│                                       ▼                                 ▼                                       │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                               .NET 10 NATIVE AOT HIGH-THROUGHPUT GATEWAY                                │   │
│   │  - System.IO.Pipelines Frame Demuxer                 - SSE Broadcast Relay                              │   │
│   │  - PDF Streaming Pass-Through Proxy                  - Response Caching & ETag Validation               │   │
│   └───────────────────────────────────┬─────────────────────────────────────────────────────────────────────┘   │
│                                       │                                                                         │
│                                       ▼                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                                      PYTHON DISPATCH ENGINE (PORT 8080)                                 │   │
│   │  ┌───────────────────────────────┐ ┌────────────────────────────────┐ ┌──────────────────────────────┐ │   │
│   │  │ 4-Tier Solvers & Recourse     │ │ Telemetry Engine & Tracer      │ │ Presentation & Reports       │ │   │
│   │  │ - Tier 1: FCM-DR-SAA / Q-FCM  │ │ - ECS JSON Structured Logger   │ │ - Graph Visualizer (7 Types) │ │   │
│   │  │ - Tier 2: CP-SAT 3D Diffn     │ │ - W3C TraceContext (Spans)     │ │ - Vector PDF Generator       │ │   │
│   │  │ - Tier 3: HGS-ADC / QAOA      │ │ - In-Memory TelemetryBuffer    │ │   (PdfPages Zero-Dep)        │ │   │
│   │  │ - Tier 4: PBS-SIPP 50Hz       │ │ - DB Full-Info Logger Sink     │ │ - Standalone REST Server     │ │   │
│   │  └───────────────┬───────────────┘ └───────────────┬────────────────┘ └──────────────┬───────────────┘ │   │
│   └──────────────────┼─────────────────────────────────┼─────────────────────────────────┼──────────────────┘   │
│                      │                                 │                                 │                      │
│                      ▼                                 ▼                                 ▼                      │
│   ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐   │
│   │                             UNIFIED DATABASE REPOSITORY (SQLite / SQL Server)                           │   │
│   │  ┌──────────────────────────────┐ ┌────────────────────────────────┐ ┌──────────────────────────────┐ │   │
│   │  │ Core Scenarios & Orders      │ │ Optimization & Routing         │ │ Telemetry, Gates & Flows     │ │   │
│   │  │ - scenarios                  │ │ - execution_runs               │ │ - gate_validations (lmn)     │ │   │
│   │  │ - orders (3D, Hazmat, SLA)   │ │ - vehicle_routes               │ │ - telemetry_events (Full DB) │ │   │
│   │  │ - container_placements       │ │ - route_stops                  │ │ - chute_flow_dynamics        │ │   │
│   │  │ - lifo_dependencies (DAG)    │ │ - tier_executions              │ │ - algorithm_benchmarks       │ │   │
│   │  │                              │ │ - quantum_telemetry            │ │                              │ │   │
│   │  └──────────────────────────────┘ └────────────────────────────────┘ └──────────────────────────────┘ │   │
│   └─────────────────────────────────────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Complete Database Schema Adjustments

The persistence schema (`DispatchEngine/storage/database.py` and `DispatchEngine/storage/models.py`) is enhanced with 8 interconnected relational tables:

```sql
-- 1. SCENARIOS: Warehouse configuration, archetype metadata, and random seed
CREATE TABLE IF NOT EXISTS scenarios (
    scenario_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL DEFAULT 'PARETO_HOT_ZONE',
    random_seed INTEGER NOT NULL,
    order_count INTEGER NOT NULL,
    fleet_size INTEGER NOT NULL,
    depot_count INTEGER NOT NULL,
    chute_count INTEGER NOT NULL,
    is_mock_data INTEGER NOT NULL,
    topology_metadata TEXT NOT NULL  -- JSON: aisles, depots, chutes, obstacle zones
);

-- 2. ORDERS: Order pool with 3D parcel dimensions, hazard class, and SLA deadlines
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    depot_id TEXT NOT NULL,
    aisle_id TEXT NOT NULL,
    pickup_x REAL NOT NULL,
    pickup_y REAL NOT NULL,
    pickup_z REAL NOT NULL,
    drop_chute_id TEXT NOT NULL,
    mass_kg REAL NOT NULL,
    volume_m3 REAL NOT NULL,
    dim_l REAL NOT NULL DEFAULT 0.4,
    dim_w REAL NOT NULL DEFAULT 0.3,
    dim_h REAL NOT NULL DEFAULT 0.2,
    open_window_start REAL NOT NULL,
    drop_deadline REAL NOT NULL,
    is_atomic INTEGER NOT NULL DEFAULT 1,
    hazard_class TEXT DEFAULT 'NONE',
    sla_priority INTEGER DEFAULT 1,
    FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
);

-- 3. EXECUTION_RUNS: High-level wave execution outcomes and empirical falsification metrics
CREATE TABLE IF NOT EXISTS execution_runs (
    run_id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    wave_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    operational_mode TEXT NOT NULL,
    algorithm_ranks_used TEXT NOT NULL,  -- JSON: {Tier1, Tier2, Tier3, Tier4}
    total_makespan_sec REAL NOT NULL,
    total_distance_km REAL NOT NULL,
    chute_variance REAL NOT NULL,
    sla_violations_count INTEGER DEFAULT 0,
    total_solve_latency_sec REAL NOT NULL,
    falsification_ratio_phi REAL NOT NULL,
    is_falsified INTEGER DEFAULT 0,
    verification_code TEXT NOT NULL DEFAULT 'lmn',
    FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
);

-- 4. VEHICLE_ROUTES: Individual AMR tours, battery drain, and cargo loads
CREATE TABLE IF NOT EXISTS vehicle_routes (
    route_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    origin_depot_id TEXT NOT NULL,
    destination_depot_id TEXT NOT NULL,
    tour_length_m REAL NOT NULL,
    route_makespan_sec REAL NOT NULL,
    total_carried_mass_kg REAL NOT NULL,
    total_carried_volume_m3 REAL NOT NULL,
    volume_utilization_pct REAL NOT NULL,
    battery_consumed_pct REAL NOT NULL,
    stops_count INTEGER NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
);

-- 5. ROUTE_STOPS: Waypoint stop sequence with timestamps, coordinates, and actions
CREATE TABLE IF NOT EXISTS route_stops (
    stop_id TEXT PRIMARY KEY,
    route_id TEXT NOT NULL,
    stop_sequence INTEGER NOT NULL,
    location_type TEXT NOT NULL,  -- 'DEPOT', 'PICKUP', 'DROP_CHUTE'
    location_id TEXT NOT NULL,
    pos_x REAL NOT NULL,
    pos_y REAL NOT NULL,
    pos_z REAL NOT NULL,
    arrival_time_sec REAL NOT NULL,
    departure_time_sec REAL NOT NULL,
    service_duration_sec REAL NOT NULL,
    action TEXT NOT NULL,         -- 'PICKUP', 'DROP', 'REPLENISH'
    order_ids_json TEXT NOT NULL, -- JSON array of order IDs serviced at stop
    FOREIGN KEY (route_id) REFERENCES vehicle_routes(route_id) ON DELETE CASCADE
);

-- 6. CONTAINER_PLACEMENTS: 3D bounding boxes inside AMR cargo bays & support ratios
CREATE TABLE IF NOT EXISTS container_placements (
    placement_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    order_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    pos_x REAL NOT NULL,
    pos_y REAL NOT NULL,
    pos_z REAL NOT NULL,
    dim_l REAL NOT NULL,
    dim_w REAL NOT NULL,
    dim_h REAL NOT NULL,
    mass_kg REAL NOT NULL,
    extraction_sequence INTEGER NOT NULL,
    support_surface_ratio REAL NOT NULL,  -- Invariant R8: >= 0.75
    FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
);

-- 7. LIFO_DEPENDENCIES: Directed extraction precedence edges (G_LIFO)
CREATE TABLE IF NOT EXISTS lifo_dependencies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL,
    blocking_order_id TEXT NOT NULL,
    blocked_order_id TEXT NOT NULL,
    contact_area_m2 REAL NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
);

-- 8. GATE_VALIDATIONS: Invariant verification audit trail (Gates 1-4)
CREATE TABLE IF NOT EXISTS gate_validations (
    validation_id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    gate_number INTEGER NOT NULL,  -- 1, 2, 3, 4
    gate_name TEXT NOT NULL,
    status TEXT NOT NULL,          -- 'PASS', 'FAIL', 'RECOURSE'
    falsification_ratio_phi REAL,
    verification_code TEXT NOT NULL DEFAULT 'lmn',
    violations_count INTEGER DEFAULT 0,
    details_json TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
);

-- 9. TELEMETRY_EVENTS: DB Full-Info Logger Sink for structured ECS events
CREATE TABLE IF NOT EXISTS telemetry_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    log_level TEXT NOT NULL,       -- 'TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'AUDIT'
    logger_name TEXT NOT NULL,
    trace_id TEXT NOT NULL,
    span_id TEXT NOT NULL,
    wave_id TEXT,
    vehicle_id TEXT,
    message TEXT NOT NULL,
    attributes_json TEXT,          -- JSON object of arbitrary contextual attributes
    error_stack TEXT
);

-- 10. CHUTE_FLOW_DYNAMICS: Time-series tracking chute accumulation curves Qc(t)
CREATE TABLE IF NOT EXISTS chute_flow_dynamics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    run_id TEXT NOT NULL,
    chute_id TEXT NOT NULL,
    time_sec REAL NOT NULL,
    accumulated_volume_m3 REAL NOT NULL,
    inflow_rate_m3_s REAL NOT NULL,
    clearance_status TEXT NOT NULL DEFAULT 'NORMAL',
    FOREIGN KEY (run_id) REFERENCES execution_runs(run_id) ON DELETE CASCADE
);

-- 11. ALGORITHM_BENCHMARKS: Historical 4-way benchmark comparisons
CREATE TABLE IF NOT EXISTS algorithm_benchmarks (
    benchmark_id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    fifo_makespan_sec REAL NOT NULL,
    kmeans_makespan_sec REAL NOT NULL,
    sc_qfcm_makespan_sec REAL NOT NULL,
    classiq_makespan_sec REAL NOT NULL,
    makespan_improvement_pct REAL NOT NULL,
    distance_improvement_pct REAL NOT NULL,
    falsification_ratio_phi REAL NOT NULL,
    verification_code TEXT NOT NULL DEFAULT 'lmn',
    FOREIGN KEY (scenario_id) REFERENCES scenarios(scenario_id) ON DELETE CASCADE
);

-- INDEXES FOR ZERO-LATENCY QUERYING
CREATE INDEX IF NOT EXISTS idx_orders_scenario ON orders(scenario_id);
CREATE INDEX IF NOT EXISTS idx_runs_scenario ON execution_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_routes_run ON vehicle_routes(run_id);
CREATE INDEX IF NOT EXISTS idx_stops_route ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_placements_run ON container_placements(run_id);
CREATE INDEX IF NOT EXISTS idx_lifo_run ON lifo_dependencies(run_id);
CREATE INDEX IF NOT EXISTS idx_gates_run ON gate_validations(run_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_trace ON telemetry_events(trace_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_level ON telemetry_events(log_level);
CREATE INDEX IF NOT EXISTS idx_chutes_run ON chute_flow_dynamics(run_id);
```

---

## 2. API Engine Adjustments for Full Simulator Compatibility

To guarantee complete compatibility with the React 19 simulator and .NET 10 Gateway, the following REST endpoints are implemented in `DispatchEngine/api/standalone_server.py` and documented in `DispatchEngine/api/openapi_spec.py`:

| HTTP Method | Path | Purpose / Simulator Consumer | Response Payload / Format |
|---|---|---|---|
| `GET` | `/api/v1/dispatch/runs/{run_id}/schedule` | Provides complete 3D routes, stops, cargo bounding boxes, and arrival timestamps to Three.js scene. | `ScheduleDetailsDTO` (JSON) |
| `GET` | `/api/v1/dispatch/runs/{run_id}/trajectories` | Supplies continuous 50Hz kinematic spline waypoints $(t, x, y, v, a, \theta)$ for smooth robot motion. | `TrajectoryCollectionDTO` (JSON) |
| `GET` | `/api/v1/dispatch/runs/{run_id}/lifo-dag` | Supplies extraction dependency graph ($\mathcal{G}_{\text{LIFO}}$) to Tab 5 DAG visualizer. | `LIFODagResponseDTO` (JSON: nodes, edges, cycle_count) |
| `GET` | `/api/v1/dispatch/runs/{run_id}/chutes/dynamics` | Returns volume accumulation curves $Q_c(t)$ for all chutes over the wave horizon. | `ChuteDynamicsDTO` (JSON: time_series) |
| `GET` | `/api/v1/dispatch/runs/{run_id}/quantum/telemetry` | Provides Qmod circuit metadata, QAOA energy landscape grid, bitstring counts, and entropy curve. | `QuantumTelemetryFullDTO` (JSON) |
| `GET` | `/api/v1/dispatch/runs/{run_id}/gates/audit` | Returns Invariant Gate 1–4 evaluation results, violation counts, and verification code `lmn`. | `GateAuditResponseDTO` (JSON) |
| `GET` | `/api/v1/presentation/runs/{run_id}/report.pdf` | Streams publication-grade vector PDF report (Executive, Comprehensive, Quantum, Certificate). | `application/pdf` (binary stream) |
| `GET` | `/api/v1/presentation/runs/{run_id}/graphs/{type}` | Generates individual vector figures (`spatial_network`, `lifo_dag`, `chutes`, `velocity`, `qaoa`, `benders`). | `image/svg+xml` or `image/png` |
| `GET` | `/api/v1/telemetry/events` | Queryable full-info log events filtered by `level`, `trace_id`, `wave_id`, `limit`. | `TelemetryEventListDTO` (JSON) |
| `GET` | `/api/v1/telemetry/stream` | Server-Sent Events (SSE) live push stream emitting kinematic ticks, gate passes, and system logs. | `text/event-stream` (SSE) |
| `POST` | `/api/v1/telemetry/ingest` | Ingestion endpoint allowing Gateway or external AMRs to push 50Hz telemetry packets into the engine. | `TelemetryIngestResponseDTO` (JSON) |
| `GET` | `/api/v1/benchmarks/history` | Returns historical 4-way benchmark runs comparing classical vs quantum solvers. | `BenchmarkHistoryDTO` (JSON) |

---

## 3. Full-Info Logger Subsystem & DB Sink Implementation

### 3.1 Architecture of the DB Full-Info Logger
The logging subsystem (`DispatchEngine/telemetry/`) is upgraded to route log events through a dual-channel pipeline:
1. **Low-Latency Stream Handler**: Immediate console output in ECS-compliant JSON format.
2. **Rotating File Sink**: Continuous writes to `DispatchEngine/telemetry/logs/engine.log`.
3. **Asynchronous Batching Database Sink (`DatabaseLogHandler`)**: Buffers log events in a queue and flushes them in bulk to the `telemetry_events` table using worker threads, ensuring **zero overhead** on optimization solvers.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   FULL-INFO LOGGER PIPELINE                                     │
│                                                                                                 │
│   Python Engine / Solvers / Gates / Quantum Client                                              │
│                                │                                                                │
│                                ▼                                                                │
│                     logger.info / logger.error                                                  │
│                                │                                                                │
│                                ▼                                                                │
│                  StructuredJsonFormatter (ECS)                                                  │
│                                │                                                                │
│        ┌───────────────────────┼──────────────────────────────┐                                 │
│        ▼                       ▼                              ▼                                 │
│  Console Stream          Rotating File Sink             Async Database Sink                     │
│  (sys.stdout)       (engine.log / audit.jsonl)        (DatabaseLogHandler)                      │
│                                                               │                                 │
│                                                               ▼                                 │
│                                                    Worker Thread Batch Flush                    │
│                                                               │                                 │
│                                                               ▼                                 │
│                                                    INSERT INTO telemetry_events                 │
└─────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Concrete Python DB Log Handler (`DispatchEngine/telemetry/db_handler.py`)
```python
import logging
import queue
import threading
import time
import json
from typing import Optional, Dict, Any
from DispatchEngine.storage.database import DatabaseManager

class DatabaseLogHandler(logging.Handler):
    """Asynchronous, non-blocking log handler flushing structured records to SQLite / SQL Server."""
    
    def __init__(self, batch_size: int = 50, flush_interval_sec: float = 1.0):
        super().__init__()
        self.batch_size = batch_size
        self.flush_interval_sec = flush_interval_sec
        self.queue: queue.Queue = queue.Queue(maxsize=10000)
        self._stop_event = threading.Event()
        self._worker = threading.Thread(target=self._flush_loop, daemon=True, name="DBLoggerWorker")
        self._worker.start()

    def emit(self, record: logging.LogRecord):
        try:
            entry = {
                "timestamp": getattr(record, "timestamp", time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())),
                "log_level": record.levelname,
                "logger_name": record.name,
                "trace_id": getattr(record, "trace_id", "0" * 32),
                "span_id": getattr(record, "span_id", "0" * 16),
                "wave_id": getattr(record, "wave_id", None),
                "vehicle_id": getattr(record, "vehicle_id", None),
                "message": record.getMessage(),
                "attributes_json": json.dumps(getattr(record, "warehouse_data", {})),
                "error_stack": self.formatException(record.exc_info) if record.exc_info else None,
            }
            self.queue.put_nowait(entry)
        except queue.Full:
            pass  # Drop under extreme backpressure to protect solver thread

    def _flush_loop(self):
        while not self._stop_event.is_set():
            batch = []
            start = time.time()
            while len(batch) < self.batch_size and (time.time() - start) < self.flush_interval_sec:
                try:
                    item = self.queue.get(timeout=0.2)
                    batch.append(item)
                except queue.Empty:
                    break

            if batch:
                self._insert_batch(batch)

    def _insert_batch(self, batch):
        try:
            conn = DatabaseManager.get_connection()
            cursor = conn.cursor()
            cursor.executemany("""
                INSERT INTO telemetry_events 
                (timestamp, log_level, logger_name, trace_id, span_id, wave_id, vehicle_id, message, attributes_json, error_stack)
                VALUES (:timestamp, :log_level, :logger_name, :trace_id, :span_id, :wave_id, :vehicle_id, :message, :attributes_json, :error_stack)
            """, batch)
            conn.commit()
            conn.close()
        except Exception:
            pass

    def close(self):
        self._stop_event.set()
        self._worker.join(timeout=2.0)
        super().close()
```

---

## 4. Step-by-Step Instructions: Adjust & Improve Engine API and DB

Follow these concrete operational steps to update the existing codebase for full compatibility:

### Step 1: Upgrade Database Schema & ORM Models
1. **File to Modify**: `DispatchEngine/storage/models.py`
   - Add SQLAlchemy models and dataclasses for `VehicleRouteRecord`, `RouteStopRecord`, `ContainerPlacementRecord`, `LIFODependencyRecord`, `GateValidationRecord`, `TelemetryEventRecord`, and `ChuteFlowRecord`.
2. **File to Modify**: `DispatchEngine/storage/database.py`
   - Update `DatabaseManager.init_schema()` to execute the 8 `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX` statements.
   - Add helper methods:
     - `DatabaseManager.save_execution_schedule(run_id, schedule)`
     - `DatabaseManager.save_container_placements(run_id, placements)`
     - `DatabaseManager.save_lifo_dependencies(run_id, dependencies)`
     - `DatabaseManager.save_gate_validations(run_id, gate_results)`

### Step 2: Implement the Asynchronous DB Full-Info Logger
1. **File to Create**: `DispatchEngine/telemetry/db_handler.py`
   - Implement `DatabaseLogHandler` with non-blocking worker thread.
2. **File to Modify**: `DispatchEngine/telemetry/logger.py`
   - Attach `DatabaseLogHandler` to the root `DispatchEngine` logger.
   - Ensure all calls to `logger.info()`, `logger.warning()`, `logger.error()` automatically capture `trace_id`, `span_id`, `wave_id`, and `vehicle_id`.

### Step 3: Enhance DispatchOrchestrator to Persist Deep Artifacts
1. **File to Modify**: `DispatchEngine/orchestrator.py`
   - In `execute_wave()`, after Tier 2 completes, persist 3D container placements and LIFO extraction edges to `container_placements` and `lifo_dependencies`.
   - After Tier 4 completes, persist vehicle routes and stop schedules to `vehicle_routes` and `route_stops`.
   - Persist validation outcomes for Gates 1–4 to `gate_validations` recording verification code `lmn`.
   - Record continuous chute volume samples to `chute_flow_dynamics`.

### Step 4: Add New Simulator Endpoints to Standalone Server
1. **File to Modify**: `DispatchEngine/api/standalone_server.py`
   - Implement `GET /api/v1/dispatch/runs/{run_id}/schedule` querying `vehicle_routes`, `route_stops`, and `container_placements`.
   - Implement `GET /api/v1/dispatch/runs/{run_id}/lifo-dag` querying `lifo_dependencies` and constructing the JSON DAG.
   - Implement `GET /api/v1/dispatch/runs/{run_id}/chutes/dynamics` querying `chute_flow_dynamics`.
   - Implement `GET /api/v1/dispatch/runs/{run_id}/gates/audit` querying `gate_validations`.
   - Implement `GET /api/v1/telemetry/events` with query filters (`level`, `trace_id`, `limit`).
   - Implement `GET /api/v1/telemetry/stream` using chunked transfer encoding (`text/event-stream`) streaming real-time events.
   - Implement `GET /api/v1/presentation/runs/{run_id}/report.pdf` invoking `generate_wave_pdf_report()`.

### Step 5: Update OpenAPI 3.1.0 Specification Generator
1. **File to Modify**: `DispatchEngine/api/openapi_spec.py`
   - Add schema definitions for `ScheduleDetailsDTO`, `LIFODagResponseDTO`, `ChuteDynamicsDTO`, `GateAuditResponseDTO`, and `TelemetryEventListDTO`.
   - Add paths and operations for all 10 new endpoints under tags `Dispatch`, `Telemetry`, `Quantum`, and `Presentation`.
   - Regenerate and export `DispatchEngine/api/openapi.json`.

### Step 6: Connect React 19 Simulator & .NET 10 Gateway
1. **React 19 Simulator**:
   - Configure API client base URL to `http://localhost:8080` (or `http://localhost:5000` via .NET Gateway).
   - Hook Three.js vehicle manager to `/api/v1/dispatch/runs/{run_id}/schedule`.
   - Hook Tab 5 Graph Visualizer to `/api/v1/dispatch/runs/{run_id}/lifo-dag` and `/api/v1/dispatch/runs/{run_id}/chutes/dynamics`.
   - Hook PDF Export Modal to `/api/v1/presentation/runs/{run_id}/report.pdf`.
   - Hook Live Log Viewer to `/api/v1/telemetry/stream`.

---

## 5. Verification Plan

### Automated Tests
1. **Database Schema & Persistence Test (`DispatchEngine/tests/test_database_extended.py`)**:
   - Initialize schema on clean in-memory / temporary SQLite DB.
   - Insert and retrieve full wave hierarchy (scenario -> orders -> execution_run -> routes -> stops -> placements -> lifo_edges -> gate_validations).
   - Assert foreign key cascades, data integrity, and support surface ratio bounds ($\ge 0.75$).
2. **DB Logger Asynchronous Flush Test (`DispatchEngine/tests/test_db_logger.py`)**:
   - Emit 500 structured log messages with varied levels and trace IDs.
   - Wait for worker thread flush; assert exact row count and JSON attribute preservation in `telemetry_events`.
3. **API Endpoint Verification Test (`DispatchEngine/tests/test_api_extended.py`)**:
   - Test all new GET endpoints (`/schedule`, `/lifo-dag`, `/chutes/dynamics`, `/gates/audit`, `/telemetry/events`, `/report.pdf`).
   - Assert valid JSON responses, HTTP 200, and proper schema conformance.
4. **Full Regression Execution**:
   ```powershell
   python -m unittest discover -s "DispatchEngine/tests" -v
   ```

### Manual Verification
1. **Live Swagger Verification**:
   - Open `http://127.0.0.1:8080/docs`.
   - Test `POST /api/v1/dispatch/waves` with Pareto Hot-Zone archetype.
   - Copy `run_id` and test `GET /api/v1/dispatch/runs/{run_id}/schedule` and `GET /api/v1/dispatch/runs/{run_id}/lifo-dag`.
   - Test `GET /api/v1/presentation/runs/{run_id}/report.pdf?profile=EXECUTIVE` and verify PDF preview renders in browser.
2. **Simulator End-to-End Run**:
   - Start React 19 simulator, trigger wave dispatch, observe real-time 3D AMR movement, LIFO DAG rendering, live telemetry logs, and one-click vector PDF generation.
