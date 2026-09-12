# WMS Quantum Cyber-Physical Digital Twin & DispatchEngine: Complete Operational & Advanced User Guide
> **Document Status**: Production Verified (`Code Verified`) | **Revision**: 4.2.0  
> **Target Audience**: Warehouse Dispatchers, Logistics Systems Engineers, Operations Researchers, Quantum Algorithm Developers  
> **Compliance Certifications**: ISO 3691-4:2023 (AMR Safety), VDI 2510, OpenAPI 3.1.0, Classiq QMOD 0.46+  

---

## Executive Directory & Guide Navigation

This guide is partitioned into five distinct operational, architectural, and mathematical pillars:

- [Part I: Operational & UX User Guide (Standard Operations Role)](#part-i-operational--ux-user-guide-standard-operations-role)
  - [1. User Interface Surfaces & Screen-by-Screen Walkthrough](#1-user-interface-surfaces--screen-by-screen-walkthrough)
  - [2. 3D Warehouse Scene Legend & Tour Explorer Manual](#2-3d-warehouse-scene-legend--tour-explorer-manual)
  - [3. Complete Parameter Catalog & Slider Influence Dictionary](#3-complete-parameter-catalog--slider-influence-dictionary)
  - [4. Step-by-Step Daily Dispatch Operations Workflow](#4-step-by-step-daily-dispatch-operations-workflow)
  - [5. Operational Troubleshooting & Invariant Audit Alerts](#5-operational-troubleshooting--invariant-audit-alerts)
- [Part II: Data Simulation, Manipulation & SQLite Database Guide](#part-ii-data-simulation-manipulation--sqlite-database-guide)
  - [6. SQLite Database Architecture (`dispatchengine.db`)](#6-sqlite-database-architecture-dispatchenginedb)
  - [7. Synthetic Warehouse Scenario Archetypes & Mathematical Models](#7-synthetic-warehouse-scenario-archetypes--mathematical-models)
  - [8. Practical Data Querying & Operational SQL Recipes](#8-practical-data-querying--operational-sql-recipes)
  - [9. Cloud Sync Pipeline (`export_api_from_db.py`) & Offline Resilience](#9-cloud-sync-pipeline-export_api_from_dbpy--offline-resilience)
  - [10. Ingesting Real Enterprise ERP / WMS Order Datasets](#10-ingesting-real-enterprise-erp--wms-order-datasets)
- [Part III: OpenAPI 3.1 & Swagger Developer Integration Guide](#part-iii-openapi-31--swagger-developer-integration-guide)
  - [11. OpenAPI Specification Architecture & Swagger UI Explorer](#11-openapi-specification-architecture--swagger-ui-explorer)
  - [12. Comprehensive Endpoint Catalog across 9 Functional Domains](#12-comprehensive-endpoint-catalog-across-9-functional-domains)
  - [13. Real-Time 20Hz AMR Coordinate Streaming via Server-Sent Events (SSE)](#13-real-time-20hz-amr-coordinate-streaming-via-server-sent-events-sse)
  - [14. Production Client SDK Code Recipes (Python, TypeScript, cURL)](#14-production-client-sdk-code-recipes-python-typescript-curl)
- [Part IV: Classiq Quantum Programming & QMOD Synthesis Guide](#part-iv-classiq-quantum-programming--qmod-synthesis-guide)
  - [15. High-Level Quantum Modeling vs Low-Level Gate Assembly](#15-high-level-quantum-modeling-vs-low-level-gate-assembly)
  - [16. Quantum Distance Kernels & Swap-Test Fidelity Circuits](#16-quantum-distance-kernels--swap-test-fidelity-circuits)
  - [17. VRP QAOA Subtour Circuit Synthesis & Variational Optimization](#17-vrp-qaoa-subtour-circuit-synthesis--variational-optimization)
  - [18. Native QMOD Reference (`vehicle_routing_problem.qmod`)](#18-native-qmod-reference-vehicle_routing_problemqmod)
- [Part V: Advanced Engineering & Mathematical Formulations (Researcher Role)](#part-v-advanced-engineering--mathematical-formulations-researcher-role)
  - [19. Rigorous Mathematical Formulations ($\text{\KaTeX}$) across Tiers 1–4](#19-rigorous-mathematical-formulations-katex-across-tiers-14)
  - [20. Generalized Benders Recourse Feedback Derivations](#20-generalized-benders-recourse-feedback-derivations)
  - [21. Computational Complexity Matrix & Quantum Advantage Horizon](#21-computational-complexity-matrix--quantum-advantage-horizon)
  - [22. Custom Solver Implementation & Extension Runbook](#22-custom-solver-implementation--extension-runbook)

---

# Part I: Operational & UX User Guide (Standard Operations Role)

## 1. User Interface Surfaces & Screen-by-Screen Walkthrough

The **WMS Quantum Digital Twin** web application integrates real-time telemetry, 3D cyber-physical rendering, and multi-tier algorithmic solvers into a unified command dashboard.

```
+---------------------------------------------------------------------------------------------------+
|  [TOPBAR]  WMS Quantum Digital Twin  |  Mode: QUANTUM  |  Fleet: 8 AMRs  |  Status: Code Verified |
+---------------------------------------------------------------------------------------------------+
|                                                                     |  [DRAWER / HUD PANEL]       |
|  [HUD OVERLAY 1: FLOOR ENVELOPE]                                    |  Scene 3D Legend & Tours    |
|  - Dimensions: 150m x 100m                                          |  (4 Tabs, Expandable Width) |
|  - Status: 100% Contained (0 Leakage)                               |  - 3D Objects & Invariants  |
|  - Min Wall Clearance: 5.0m                                         |  - Active Tours (Itinerary) |
|  - [Legend & Tours Button]                                          |  - Color Code Guide         |
|                                                                     |  - Kinematics & Safety      |
|                       3D WAREHOUSE CANVAS                           |  - Width: 420px <-> 760px   |
|                    (150m x 100m Dark Epoxy Floor)                   |                             |
|                    Dual-Frequency Cyber Grid (10m / 2m)             |  [HUD OVERLAY 2: TELEMETRY] |
|                    22+ Industrial Racks / 5 Depots                  |  - Active AMRs: 8           |
|                    Cyan Perimeter Laser Boundary                    |  - Battery SOC: 94% Avg     |
|                                                                     |  - Completed Orders: 64/80  |
|                                                                     |  - Makespan: 03:15          |
+---------------------------------------------------------------------+-----------------------------+
|  [FLOATING CONTROL DOCK]                                                                          |
|  [▶ Play] [⏸ Pause] [Scrubber: 01:14 / 03:15] [Speed: 1x 2x 4x] [Layer Toggles] [3D Legend]     |
+---------------------------------------------------------------------------------------------------+
|  [NAVIGATION TABS]:                                                                               |
|  (1) 3D Warehouse Twin  (2) Tiers Studio  (3) Parameter Sweep  (4) Analytics Studio  (5) Swagger |
+---------------------------------------------------------------------------------------------------+
```

### 1.1 Top Command Bar
- **System Title & Branding**: Displays the platform identity and active operational profile.
- **Operational Mode Indicator**: Badges display the active solver strategy (`CLASSICAL`, `QUANTUM`, `HYBRID`, or `RESILIENCE`).
- **Fleet Status Badge**: Displays active AMR vehicle count (e.g. `Fleet: 8 AMRs`).
- **Verification Status Seal (`Code Verified`)**: Cryptographic badge certifying that all 4 mathematical gates ($G_1 \dots G_4$) passed validation. Hovering reveals the 4-gate verification methodology tooltip.

### 1.2 3D Warehouse Canvas Viewport
- **Industrial Floor Mesh**: High-precision $150\,\text{m} \times 100\,\text{m}$ dark epoxy floor plane centered at $(75.0, 0, 50.0)\,\text{m}$.
- **Dual-Frequency Cyber Grid**:
  - *10m Primary Structural Grid*: Marked with cyan grid intersections for high-level aisle alignment.
  - *2m Secondary Navigation Grid*: Subdivided grid for precision vehicle trajectory interpolation.
- **Perimeter Safety Laser Barrier**: Glowing cyan neon perimeter lines enclosing the facility at $Y = 0.05\,\text{m}$.
- **Safety Boundary Beacons**: 8 corner and curb pylons equipped with amber strobe beacons enforcing zero-leakage perimeter safety.
- **Warehouse Infrastructure**:
  - *Storage Aisles 1–22+*: Dual-row industrial heavy pallet racking positioned from $X = 30\,\text{m}$ to $120\,\text{m}$.
  - *Charging Depots ($D_1 \dots D_5$)*: Perimeter fast-charging pads with illuminated landing pads.
  - *Consolidation Chutes ($C_1 \dots C_4$)*: Outbound packaging sorting stations located along the south wall ($Z = 5\,\text{m}$).

### 1.3 Viewport Mouse & Keyboard Navigation
| Input Action | Gesture / Key | Resulting Viewport Behavior |
| :--- | :--- | :--- |
| **Orbit / Rotate** | Left Click + Drag | Rotates camera around facility orbit center $(75, 0, 50)\,\text{m}$. |
| **Pan / Translate** | Right Click + Drag | Panning camera laterally across the floor plane. |
| **Zoom In / Out** | Scroll Wheel | Smooth zooming from single-parcel close-up to bird's-eye warehouse overview. |
| **Reset View** | Double Click Canvas | Returns camera to isometric perspective $(75, 80, 140)\,\text{m}$. |
| **Focus AMR** | Click "Focus in 3D" | Animates camera to smooth tracking orbit centered on the selected robot. |

---

## 2. 3D Warehouse Scene Legend & Tour Explorer Manual

The **Scene 3D Legend & Tours Drawer** (`Scene3DLegendPanel.tsx`) provides an exhaustive breakdown of all physical elements and active vehicle routes. It is toggled via the top-left HUD envelope card or the floating bottom dock.

### 2.1 Tab 1: 3D Objects & Invariants
- **Category Filter Pills**: Filter objects by `ALL`, `ROBOTICS`, `FACILITY`, `STORAGE`, `SAFETY`, or `NAVIGATION`.
- **Item Dossier Cards**: Each 3D object card provides:
  - *Visual Rendering Description*: Geometry, material shader, and color scheme.
  - *Operational Role*: Purpose in warehouse workflow.
  - *Mathematical Formulation*: KaTeX equation governing its physical/kinematic behavior (e.g. differential drive kinematics, Euclidean distance, rack volumetric density).
  - *Associated Invariant Constraints*: Formal constraints ($R_1 \dots R_{15}$) verified by the audit gates.

### 2.2 Tab 2: Active Tours (Itinerary Breakdown)
- **Vehicle Selector Pills**: Click pills for `AMR_001` through `AMR_008` to view that vehicle's specific tour.
- **Tour Summary KPI Card**:
  - *Makespan*: Total mission duration in seconds.
  - *Route Length*: Total transit distance in meters.
  - *Payload Mass*: Total cargo weight assigned in kilograms.
  - *Volumetric Utilization*: Percentage of pallet cage cube filled ($V / V_{\max}$).
  - *Battery Consumption*: Projected energy drain ($\Delta\text{SOC}$).
- **Stop-by-Stop Itinerary Table**:
  - `Sequence`: Visit order index ($1 \dots M$).
  - `Action`: Color-coded action pill (`REPLENISH`, `PICKUP`, `DROP`, `DOCK`).
  - `Coordinates`: Target physical coordinates $(X, Y, Z)$ in meters.
  - `Parcel Details`: SKU ID, mass, volume, and customer deadline.
- **"Focus in 3D" Camera Button**: Smoothly repositions the camera to $(p_x, 42, p_z + 50)$ targeting $(p_x, 0, p_z)$, locking view onto the robot.

### 2.3 Tab 3: Color Code Guide
- **Fleet Vehicle Glow Signatures**:
  - `AMR #1`: Neon Cyan (`#00f0ff` / 600 THz) — Fast Movers / High-Priority Orders.
  - `AMR #2`: Vivid Emerald (`#10b981` / 575 THz) — Standard Ambient Goods.
  - `AMR #3`: Electric Violet (`#8b5cf6` / 720 THz) — Heavy Bulk Packages.
  - `AMR #4`: Amber Gold (`#f59e0b` / 510 THz) — Cross-Dock Transit.
  - `AMR #5–8`: Cobalt, Crimson, Tangerine, and Mint signatures for expanded waves.
- **Facility Infrastructure Markers**:
  - Depots: Electric Cyan (`#00f0ff`) outline with yellow charging indicators.
  - Chutes: Lime Green (`#10b981`) outbound sorting conveyor indicators.
  - Storage Racks: Industrial steel grey (`#334155`) with high-contrast amber beams.

### 2.4 Tab 4: Kinematics & Safety
- **ISO 3691-4:2023 Specifications**: Tabular overview of maximum rated speeds, reaction times, deceleration envelopes, and laser scanner fields.
- **SIPP Continuous Swept-Volume Clearance**: Mathematical proof that AMR paths maintain non-overlapping volumes for all time steps $t$.

---

## 3. Complete Parameter Catalog & Slider Influence Dictionary

### 3.1 Order Pool Attributes (`OrderDTO`)
| Parameter Name | Data Type | Physical Domain | Operational Meaning |
| :--- | :--- | :--- | :--- |
| `order_id` | String | `ORD-XXXX` | Unique customer order identifier. |
| `pickup_x`, `pickup_y`, `pickup_z` | Floats | $X \in [5, 145]\,\text{m}, Z \in [5, 95]\,\text{m}$ | Exact spatial rack storage coordinate. |
| `mass_kg` | Float | $0.10\,\text{kg} \dots 25.00\,\text{kg}$ | Physical weight of cargo package. |
| `volume_m3` | Float | $0.001\,\text{m}^3 \dots 0.125\,\text{m}^3$ | Bounding box volume $(w \times l \times h)$. |
| `open_window_start` | Float | Seconds from wave epoch | Earliest pickup time (dock availability). |
| `drop_deadline` | Float | Seconds from wave epoch | Hard customer delivery deadline at sorting chute. |
| `hazard_class` | Enum | `AMBIENT`, `PRIORITY`, `HAZMAT` | Material handling segregation requirements. |

### 3.2 Quick Controls Slider Impact Guide

```
+---------------------------------------------------------------------------------------------------+
| SLIDER PARAMETER      | DEFAULT | MIN - MAX   | SLIDER INCREASE IMPACT    | SLIDER DECREASE IMPACT|
+---------------------------------------------------------------------------------------------------+
| Wave Orders (N)       | 80      | 20 - 200    | Dense pick batches;       | Low AMR utilization;  |
|                       |         |             | stresses cage capacity.   | short trivial tours.  |
+---------------------------------------------------------------------------------------------------+
| Fleet Vehicles (K)    | 4       | 2 - 8       | Lower per-robot load;     | High vehicle payload; |
|                       |         |             | more aisle congestion.    | longer route tours.   |
+---------------------------------------------------------------------------------------------------+
| Fuzzifier Exponent (m)| 2.0     | 1.1 - 3.0   | Softer cluster borders;   | Crisper clustering;   |
|                       |         |             | more entropy rebalancing. | approaches K-Means.   |
+---------------------------------------------------------------------------------------------------+
| Workload Penalty (λ1) | 0.5     | 0.0 - 2.0   | Strictly equal mass/robot;| Unequal mass loads;   |
|                       |         |             | slightly longer paths.    | shorter total travel. |
+---------------------------------------------------------------------------------------------------+
| AMR Speed (v_nom)     | 1.2 m/s | 0.5 - 2.0m/s| Shortens wave makespan;   | Slower operations;    |
|                       |         |             | longer braking buffer.    | compact brake margin. |
+---------------------------------------------------------------------------------------------------+
| SIPP Clearance (d_saf)| 0.5 m   | 0.2 - 1.5 m | Wider collision buffer;   | Dense traffic packing;|
|                       |         |             | longer wait delays.       | risk of near-misses.  |
+---------------------------------------------------------------------------------------------------+
```

---

## 4. Step-by-Step Daily Dispatch Operations Workflow

```
[1. Select Scenario Archetype] ---> [2. Choose Operational Mode] ---> [3. Execute Wave Pipeline]
               |                                                                    |
               v                                                                    v
[4. Inspect Invariant Gates]   <--- [5. Explore 3D Digital Twin]   <--- [6. Export PDF Audit Report]
```

### Step 1: Ingest Wave Backlog
1. Navigate to the sidebar scenario selector.
2. Select a canonical warehouse preset (e.g. `Pareto Hot Zone 80/20 (80 Orders, 4 AMRs)`).
3. The order grid populates with 3D pick locations, SKU masses, and deadlines.

### Step 2: Set Operational Solver Mode
- Select **`QUANTUM`** to enable Classiq Swap-Test fidelity distance kernels and QAOA subtour optimization.
- Select **`CLASSICAL`** to run Google OR-Tools CP-SAT and HGS-ADC.
- Select **`HYBRID`** for classical Tier 1 partitioning combined with quantum Tier 3 route refinement.

### Step 3: Run Wave Dispatch Pipeline
1. Click the blue **"Run Wave Pipeline"** button.
2. The orchestrator triggers Tier 1 (Batching), Tier 2 (Packing), Tier 3 (Routing), and Tier 4 (Kinematics).
3. Progress spinners and execution latency (in milliseconds) appear next to each tier.

### Step 4: Validate Invariant Audit Gates ($G_1 \dots G_4$)
Verify that all four gates pass validation:
- **Gate 1**: Universal order assignment ($\sum_k u_{ik} = 1$) and vehicle weight limits.
- **Gate 2**: Pairwise 3D bounding box separation ($\text{vol}_i \cap \text{vol}_j = \emptyset$) and LIFO extraction DAG acyclicity.
- **Gate 3**: Subtour elimination and zero SLA deadline breaches ($t_i^{\text{arr}} \le \text{TW}_i^{\text{end}}$).
- **Gate 4**: Dynamic swept-volume separation ($\min \|\mathbf{p}_a(t) - \mathbf{p}_b(t)\| \ge 2 R_{\text{swept}} + d_{\text{safety}}$).
- Confirm the **`Code Verified`** seal is active on the HUD.

### Step 5: Playback & Inspect 3D Simulation
1. Press **Play (▶)** on the bottom floating dock.
2. Drag the time scrubber to jump to specific points in time.
3. Open the **3D Scene Legend & Tours** drawer, choose an AMR, and click **"Focus in 3D"** to follow the robot through picking aisles and docking chutes.

### Step 6: Export Publication-Quality PDF Report
1. Click **"Export PDF Audit"** in the top navigation bar.
2. The system generates a publication-grade PDF into `Export/` containing KPI scorecards, route maps, and KaTeX mathematical proofs.

---

## 5. Operational Troubleshooting & Invariant Audit Alerts

### 5.1 Benders Recourse Overfill Warning (`GATE 2 VIOLATION`)
- **Root Cause**: Assigned parcel geometries cannot physically fit into the AMR's pallet cage due to irregular aspect ratios.
- **Automatic Recovery**: An automated Benders cut reduces AMR $k$'s allowable volume by $\Delta V_{\text{repack}} = 0.05\,\text{m}^3$. Tier 1 automatically re-solves and reallocates excess items to other vehicles.
- **Manual Action**: If overfill persists across 3 iterations, reduce wave size $N$ or increase fleet size $K$ using Quick Controls.

### 5.2 SIPP Kinematic Intersection Delay (`WAIT_FOR_CLEARANCE`)
- **Root Cause**: Two AMRs are scheduled to cross the same cross-aisle intersection within $t_{\text{wait}} < 2.5\,\text{s}$.
- **Automatic Recovery**: Safe Interval Path Planning (SIPP) delays the lower-priority vehicle at the holding waypoint.
- **Manual Action**: None required. This is normal safe behavior enforcing ISO 3691-4 continuous non-overlap.

---

# Part II: Data Simulation, Manipulation & SQLite Database Guide

## 6. SQLite Database Architecture (`dispatchengine.db`)

The database is stored at `DispatchEngine/dispatchengine.db` using SQLite 3 in Write-Ahead Logging (`WAL`) mode for high-concurrency read/write access.

```
+---------------------------------------------------------------------------------------------------+
|                                  DISPATCH ENGINE SQLITE SCHEMA                                    |
+---------------------------------------------------------------------------------------------------+
|  scenarios         -> scenario_id (PK), name, archetype, order_count, fleet_size, seed, metadata  |
|  orders            -> id (PK), scenario_id, sku_id, (x, y, z), mass_kg, vol_m3, SLA windows      |
|  runs              -> run_id (PK), scenario_id, operational_mode, total_distance, makespan, status |
|  tier_executions   -> id (PK), run_id, tier_number, algorithm_rank, latency_ms, gate_status       |
|  telemetry_frames  -> id (PK), run_id, timestamp_sec, amr_id, x, y, z, velocity, battery_soc     |
|  audit_trails      -> id (PK), run_id, gate_id, proof_hash, verification_code ('Code Verified')  |
+---------------------------------------------------------------------------------------------------+
```

### Table Definitions & Foreign Key Relationships
```sql
CREATE TABLE scenarios (
    scenario_id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    name TEXT NOT NULL,
    archetype TEXT NOT NULL,
    random_seed INTEGER NOT NULL,
    order_count INTEGER NOT NULL,
    fleet_size INTEGER NOT NULL,
    depot_count INTEGER NOT NULL,
    chute_count INTEGER NOT NULL,
    topology_metadata TEXT NOT NULL
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scenario_id TEXT NOT NULL REFERENCES scenarios(scenario_id),
    order_id TEXT NOT NULL,
    sku_id TEXT NOT NULL,
    pickup_x REAL NOT NULL,
    pickup_y REAL NOT NULL,
    pickup_z REAL NOT NULL,
    drop_chute_id TEXT NOT NULL,
    mass_kg REAL NOT NULL,
    volume_m3 REAL NOT NULL,
    open_window_start REAL NOT NULL,
    drop_deadline REAL NOT NULL
);

CREATE TABLE runs (
    run_id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES scenarios(scenario_id),
    created_at TEXT NOT NULL,
    operational_mode TEXT NOT NULL,
    total_distance_m REAL NOT NULL,
    total_makespan_s REAL NOT NULL,
    total_energy_kwh REAL NOT NULL,
    status TEXT NOT NULL
);
```

---

## 7. Synthetic Warehouse Scenario Archetypes & Mathematical Models

The generator in `DispatchEngine/storage/mock_generator.py` uses rigorous statistical distributions to model real-world warehouse logistics:

```
+---------------------------------------------------------------------------------------------------+
| ARCHETYPE              | SPATIAL DISTRIBUTION         | SLA DEADLINE MODEL   | PRIMARY STRESS     |
+---------------------------------------------------------------------------------------------------+
| UNIFORM_RANDOM         | Uniform Across All Aisles    | Beta(2, 5) [120-600s]| Baseline Travel    |
| PARETO_HOT_ZONE        | 80/20 Fast-Mover Aisles 1-5  | Exponential Arrivals | Chute Congestion   |
| DUAL_DEPOT_CROSS_DOCK  | Bimodal Perimeter Clusters   | Linear Shift Windows | AMR Battery SOC    |
| PEAK_SURGE_HEAVY_TAIL  | Poisson Burst (λ = 24/min)   | Tight Uniform [80-240s]| SLA Feasibility  |
+---------------------------------------------------------------------------------------------------+
```

---

## 8. Practical Data Querying & Operational SQL Recipes

Connect to the database via command line:
```powershell
sqlite3 DispatchEngine/dispatchengine.db
```

### Recipe 1: Retrieve Recent Dispatch Runs & Makespan
```sql
SELECT run_id, scenario_id, operational_mode, total_distance_m, total_makespan_s, status
FROM runs
ORDER BY created_at DESC
LIMIT 5;
```

### Recipe 2: Audit Invariant Gate Verification Status
```sql
SELECT run_id, tier_number, algorithm_rank, latency_ms, gate_status
FROM tier_executions
WHERE run_id = 'RUN-WAVE-001';
```

### Recipe 3: Verify Payload Balance Across Vehicles
```sql
SELECT amr_id, COUNT(*) AS items_assigned, ROUND(SUM(mass_kg), 2) AS total_kg, ROUND(SUM(volume_m3), 3) AS total_m3
FROM orders
WHERE scenario_id = 'SCEN-PARETO-01'
GROUP BY amr_id;
```

---

## 9. Cloud Sync Pipeline (`export_api_from_db.py`) & Offline Resilience

To deploy database scenarios and telemetry to static hosting environments:
```powershell
python web_simulator/scripts/export_api_from_db.py
```
This automated script:
1. Performs an atomic SQLite backup of `dispatchengine.db` to `web_simulator/public/` and `web_simulator/dist/`.
2. Serializes scenario lists, archetypes, and configuration limits into cached JSON endpoints in `public/api/v1/`.
3. Guarantees that the web simulator remains fully interactive even when running offline without a live Python backend.

---

## 10. Ingesting Real Enterprise ERP / WMS Order Datasets

### Option A: Direct Python Script (`WarehouseRepository`)
```python
from DispatchEngine.storage.database import DatabaseManager
from DispatchEngine.storage.repository import WarehouseRepository
from DispatchEngine.contracts.tier1_dto import OrderDTO, OrderPoolDTO

session = DatabaseManager.get_session()
repo = WarehouseRepository(session)

orders = [
    OrderDTO(order_id="WMS-101", pickup_x=22.5, pickup_y=1.2, pickup_z=14.0, mass_kg=3.2, volume_m3=0.015, drop_deadline=240.0),
    OrderDTO(order_id="WMS-102", pickup_x=75.0, pickup_y=0.0, pickup_z=48.0, mass_kg=7.5, volume_m3=0.042, drop_deadline=360.0),
]
pool = OrderPoolDTO(wave_id="WAVE-ERP-01", orders=orders)
repo.save_order_pool(pool)
```

---

# Part III: OpenAPI 3.1 & Swagger Developer Integration Guide

## 11. OpenAPI Specification Architecture & Swagger UI Explorer

The backend exposes an **OpenAPI 3.1.0** specification generated dynamically by `DispatchEngine/api/openapi_spec.py`:
- **Interactive Swagger UI 5.x**: Available in browser at `http://127.0.0.1:8080/docs`.
- **Standard OpenAPI JSON Schema**: Available at `http://127.0.0.1:8080/openapi.json`.
- **Standalone Engine Server**: Multi-threaded HTTP/WebSocket server in `DispatchEngine/api/standalone_server.py`.

---

## 12. Comprehensive Endpoint Catalog across 9 Functional Domains

| Domain / Tag | Endpoint | Method | Key DTO Payload | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Scenarios** | `/api/v1/scenarios/archetypes` | `GET` | `ArchetypeListResponse` | Retrieves 7 available warehouse archetypes. |
| | `/api/v1/scenarios/presets` | `GET` | `PresetListResponse` | Retrieves canonical test presets (40 to 1000 orders). |
| **Wave Pipeline** | `/api/v1/dispatch/wave` | `POST` | `WaveResultDTO` | Executes full 4-tier dispatch pipeline. |
| | `/api/v1/dispatch/status/{id}` | `GET` | `AuditReportDTO` | Returns gate proofs and tier latencies. |
| **Isolated Tiers**| `/api/v1/tiers/{tier_id}/solve` | `POST` | `TierOutputDTO` | Step-through execution of Tier 1, 2, 3, or 4. |
| **Invariant Gates**| `/api/v1/gates/{gate_id}/audit` | `POST` | `GateValidationResultDTO`| Direct post-condition audit and Benders cut check. |
| **Quantum** | `/api/v1/quantum/circuit/{id}` | `GET` | `QuantumCircuitDTO` | Retrieves QMOD / OpenQASM synthesis data. |
| | `/api/v1/quantum/fidelity-matrix`| `POST` | `QuantumKernelMatrixDTO`| Evaluates Swap-Test fidelity state overlaps. |
| **Benchmarks** | `/api/v1/benchmarks/compare` | `POST` | `BenchmarkComparisonDTO` | 4-way comparison: FIFO vs K-Means vs QFCM vs QAOA. |
| **Streaming** | `/api/v1/simulation/stream` | `GET` | `SSE (SimulationFrameDTO)`| 20Hz AMR coordinates stream for 3D canvas. |
| **Health** | `/api/v1/health` | `GET` | `HealthDTO` | Engine status and Classiq SDK readiness. |

---

## 13. Real-Time 20Hz AMR Coordinate Streaming via Server-Sent Events (SSE)

The streaming endpoint `GET /api/v1/simulation/stream` pushes robot position frames at 20 FPS:
```json
event: frame
data: {
  "frame_index": 124,
  "timestamp_sec": 6.2,
  "vehicles": [
    {
      "vehicle_id": "AMR_001",
      "x": 42.5,
      "y": 0.0,
      "z": 18.2,
      "heading_rad": 1.57,
      "velocity_mps": 1.2,
      "battery_soc": 0.96,
      "current_action": "PICKUP"
    }
  ]
}
```

---

## 14. Production Client SDK Code Recipes

### Python Client Recipe (`httpx`)
```python
import httpx

client = httpx.Client(base_url="http://127.0.0.1:8080")

# 1. Healthcheck
health = client.get("/api/v1/health").json()
print("Engine Status:", health["status"])

# 2. Trigger Dispatch Wave
payload = {
    "wave_id": "WAVE-001",
    "fleet_size": 4,
    "operational_mode": "QUANTUM",
    "orders": [
        {"order_id": "ORD-1", "pickup_x": 30.0, "pickup_y": 0.0, "pickup_z": 20.0, "mass_kg": 2.5, "volume_m3": 0.01, "drop_deadline": 300.0}
    ]
}
result = client.post("/api/v1/dispatch/wave", json=payload).json()
print("Verification Seal:", result["verification_badge"])
print("Total Travel Distance:", result["summary"]["total_fleet_distance_m"], "meters")
```

### TypeScript / React Recipe (`EventSource` for SSE)
```typescript
import { useEffect, useState } from 'react';

export function useAMRTelemetryStream() {
  const [frame, setFrame] = useState(null);

  useEffect(() => {
    const sse = new EventSource('http://127.0.0.1:8080/api/v1/simulation/stream');
    sse.onmessage = (e) => setFrame(JSON.parse(e.data));
    sse.onerror = () => sse.close();
    return () => sse.close();
  }, []);

  return frame;
}
```

---

# Part IV: Classiq Quantum Programming & QMOD Synthesis Guide

## 15. High-Level Quantum Modeling vs Low-Level Gate Assembly

Classiq replaces manual gate assembly with high-level functional declarations using the **QMOD language**.

```
[Problem Formulation] ---> [Classiq @qfunc Model] ---> [Hardware Constraints] ---> [Transpiled Circuit]
```

### Key Capabilities in Logistics:
1. **Hardware-Agnostic Synthesis**: Define algorithm logic independently of physical quantum hardware. Apply `Constraints(max_width=16, max_depth=100)` to compile automatically for IBM Quantum, IonQ, or AWS Braket.
2. **Native Arithmetic**: Supports multi-qubit arithmetic (`add`, `multiply`, `comparator`) synthesized with minimum ancilla qubits.

---

## 16. Quantum Distance Kernels & Swap-Test Fidelity Circuits

In `DispatchEngine/quantum/kernels.py`, order-to-centroid distances are calculated using the **Swap-Test Fidelity State Overlap**:

### Feature Angle Encoding:
$$\theta_j = 2 \arcsin\left(\sqrt{\tilde{v}_j}\right), \quad \tilde{v}_j \in [0, 1]$$

### Swap-Test State Interference:
$$|\psi(\mathbf{x}_i)\rangle = \cos\left(\frac{\theta_i}{2}\right)|0\rangle + \sin\left(\frac{\theta_i}{2}\right)|1\rangle$$

$$P(|1\rangle_{\text{ancilla}}) = \frac{1 - |\langle \psi(\mathbf{x}_i) | \psi(\mathbf{c}_k) \rangle|^2}{2} \implies D_Q = 2 P(|1\rangle) = 1 - F(|\psi_i\rangle, |c_k\rangle)$$

### Classiq Code Implementation:
```python
from classiq import qfunc, QBit, H, SWAP, control, allocate, Output

@qfunc
def swap_test(q1: QBit, q2: QBit, ancilla: Output[QBit]) -> None:
    allocate(1, ancilla)
    H(ancilla)
    control(ancilla, lambda: SWAP(q1, q2))
    H(ancilla)
```

---

## 17. VRP QAOA Subtour Circuit Synthesis

In `DispatchEngine/quantum/qaoa_circuits.py`, multi-depot routing is mapped to an Ising Hamiltonian:

$$H_C = \sum_{(i,j) \in \mathcal{E}} c_{ij} \frac{I - Z_i Z_j}{2} + \lambda_{\text{deg}} \sum_{i=1}^N \left( 2 - \sum_{j \in \delta(i)} \frac{I - Z_i Z_j}{2} \right)^2$$

### Classiq Synthesis Call:
```python
from classiq import create_model, synthesize, Constraints

def synthesize_vrp_circuit(distance_matrix, p_layers=2):
    constraints = Constraints(max_width=16, max_depth=120)
    model = create_model(vrp_qaoa_model, constraints=constraints)
    return synthesize(model)
```

---

## 18. Native QMOD Reference (`vehicle_routing_problem.qmod`)

The root file `vehicle_routing_problem.qmod` defines native QMOD statements:
- `qarray[QBit, N]` registers representing customer visit states.
- Alternating unitary layers implementing problem phase separation ($H_C$) and transverse mixer pulses ($H_M = \sum X_i$).
- Direct compatibility with the Classiq Cloud IDE for visual circuit analysis.

---

# Part V: Advanced Engineering & Mathematical Formulations (Researcher Role)

## 19. Rigorous Mathematical Formulations ($\text{\KaTeX}$) across Tiers 1–4

### 19.1 Tier 1: Wave Decomposition ($DR\text{-}SAA\text{-}FCM$)
$$\min_{U, \mathbf{C}} \sum_{k=1}^K \sum_{i=1}^N u_{ik}^m \cdot \mathbb{E}_{\mathbb{P}} \left[ \|\mathbf{x}_i - \mathbf{c}_k\|_{\Sigma^{-1}}^2 \right] + \lambda_1 \sum_{k=1}^K \left( \sum_{i=1}^N u_{ik} q_i - \frac{Q_{\text{total}}}{K} \right)^2$$

Subject to the Unitary Partition Constraint:
$$\sum_{k=1}^K u_{ik} = 1 \quad \forall i \in \{1, \dots, N\}, \qquad u_{ik} \in [0, 1]$$

- **Plain English**: Optimizes fuzzy assignments $u_{ik}$ and centroids $\mathbf{c}_k$ balancing travel distance under covariance $\Sigma^{-1}$ with fleet payload equity.

### 19.2 Tier 2: CP-SAT 3D Containerization & LIFO DAG
$$\text{Maximize } \sum_{i \in \mathcal{B}_k} \text{vol}(i) \cdot y_i - \alpha \left(\Delta x_{\text{CoG}}^2 + \Delta y_{\text{CoG}}^2\right)$$

Subject to Pairwise Spatial Non-Overlap Conditions:
$$x_i + w_i \le x_j + M(1 - a_{ij}) \quad \lor \quad x_j + w_j \le x_i + M(1 - b_{ij})$$
$$y_i + l_i \le y_j + M(1 - c_{ij}) \quad \lor \quad y_j + l_j \le y_i + M(1 - d_{ij})$$
$$z_i + h_i \le z_j + M(1 - e_{ij}) \quad \lor \quad z_j + h_j \le z_i + M(1 - f_{ij})$$

Strict Physical LIFO DAG Acyclicity:
$$z_j \ge z_i + h_i \implies \pi(i) > \pi(j)$$

- **Plain English**: Maximizes pallet cube fill while centering payload Center of Gravity. Enforces that boxes placed on top are unloaded first, eliminating restacking.

### 19.3 Tier 3: Multi-Depot Multi-Trip VRP ($HGS\text{-}ADC$)
$$\Phi(S) = \text{Cost}(S) + \beta_{\text{cap}} \sum_{k=1}^K \max(0, Q(r_k) - Q_{\max}) + \beta_{\text{tw}} \sum_{i=1}^N \max(0, t_i - \text{TW}_i^{\text{end}})$$

Bi-Subpopulation Diversity Rank Formula:
$$\text{BiRank}(S) = \text{rank}_{\text{fit}}(\Phi(S)) + \left(1 - \frac{\text{nbElapsedIter}}{\text{nbMaxIter}}\right) \cdot \text{rank}_{\text{div}}(\Delta(S, \mathcal{P}))$$

- **Plain English**: Evaluates chromosome fitness penalized for capacity or deadline breaches, balancing cost minimization with population diversity to escape local minima.

### 19.4 Tier 4: Multi-Agent Kinematics & SIPP Trajectories
$$\min_{t \in [0, T_{\text{makespan}}]} \|\mathbf{p}_a(t) - \mathbf{p}_b(t)\|_2 \ge 2 R_{\text{swept}} + d_{\text{safety}} \quad \forall a \ne b$$

ISO 3691-4:2023 Safe Kinematic Deceleration Profile:
$$s_{\text{stop}}(v) = \frac{v^2}{2 a_{\max}} + v \cdot t_{\text{reaction}} + s_{\text{margin}}$$

- **Plain English**: Guarantees continuous swept-volume non-overlap for all moving AMRs. Dynamically calculates safe stopping distance under laser scanner trip events.

---

## 20. Generalized Benders Recourse Feedback Derivations

### Volumetric Overfill Cut (Tier 2 $\to$ Tier 1):
$$\sum_{i \in \mathcal{B}_k} v_i \cdot x_{ik} \le V_{\max} - \Delta V_{\text{repack}}$$

### Battery & Shift Duration Cut (Tier 3 $\to$ Tier 1):
$$\sum_{i \in \mathcal{R}_k} t_{\text{service}, i} + \frac{1}{v_{\text{nom}}} \sum_{(i, j) \in \mathcal{E}_k} d_{ij} \le T_{\text{shift}}$$

---

## 21. Computational Complexity Matrix & Quantum Advantage Horizon

| Problem / Tier | Classical Algorithm | Classical Complexity | Quantum Algorithm | Quantum Complexity | Advantage Horizon |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tier 1 (Batching)** | Classical FCM | $\mathcal{O}(I \cdot N \cdot K \cdot d)$ | Swap-Test QFCM | $\mathcal{O}(I \cdot N \cdot K \cdot \log d)$ | Feature dimension $d \gg 100$. |
| **Tier 2 (3D Packing)** | CP-SAT Branch-and-Cut | $\mathcal{O}(2^N \cdot 6^N)$ | Quantum Knapsack | $\mathcal{O}(2^{N/2})$ (Grover) | Complex irregular geometries. |
| **Tier 3 (VRP Routing)**| Exact MIP / HGS-ADC | $\mathcal{O}(N!)$ / $\mathcal{O}(I \cdot N^2)$ | QAOA Spin Glass | Poly-logarithmic ansatz depth | Dense graph topology optimization. |
| **Tier 4 (SIPP)** | Priority SIPP | $\mathcal{O}(K \cdot |V| \log |V|)$ | Safe Interval Prop | Classical Optimal | Real-time millisecond control. |

---

## 22. Custom Solver Implementation & Extension Runbook

Follow these steps to add a custom optimization solver:
1. Create your solver class in `DispatchEngine/tiers/`:
   ```python
   from DispatchEngine.tiers.base import BaseTierSolver
   from DispatchEngine.contracts.tier1_dto import OrderPoolDTO, BatchPlanDTO

   class CustomTier1Solver(BaseTierSolver):
       def solve(self, pool: OrderPoolDTO) -> BatchPlanDTO:
           # Implement custom clustering logic
           return BatchPlanDTO(...)
   ```
2. Register the solver in `DispatchEngine/strategy/state_machine.py`.
3. Run orchestrator test suite:
   ```powershell
   python -m unittest DispatchEngine.tests.test_orchestrator
   ```

---
*Certified & Maintained by YesAndNo Quantum Research Team | Revision 4.2.0*
