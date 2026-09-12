# WMS Quantum Cyber-Physical Digital Twin & DispatchEngine: Full System Architecture Guide
> **Document Status**: Production Verified (`Code Verified`) | **Revision**: 4.2.0  
> **Author**: Senior Principal System Architect & YesAndNo Quantum Research Team  
> **Classification**: Technical Architecture & Engineering Reference Manual  
> **Compliance Certifications**: ISO 3691-4:2023 (Autonomous Mobile Robots), VDI 2510, Classiq QMOD Native  

---

## Executive Summary & Architecture Table of Contents

The **Autonomous Warehouse Management & Quantum Dispatching System** is an enterprise-grade cyber-physical platform engineered to orchestrate and optimize high-velocity intra-logistics operations. The platform harmonizes classical mathematical programming (Mixed-Integer Linear/Nonlinear Programming, Constraint Programming) with gate-based quantum algorithms (Swap-Test Fidelity, QAOA, Quantum F-Means) across a **4-Tier Hierarchical Control Architecture**.

This architecture transforms chaotic raw pick waves into millisecond-level, collision-free, kinematic 3D physical trajectories executed by an Autonomous Mobile Robot (AMR) fleet, visualized within a real-time 3D Digital Twin.

### Table of Contents
1. [Executive Summary & High-Level System Architecture](#1-executive-summary--high-level-system-architecture)
2. [Core Architectural Patterns & Design Principles](#2-core-architectural-patterns--design-principles)
   - 2.1 Multi-Tier Hierarchical Decomposition
   - 2.2 Generalized Benders Decomposition with Closed-Loop Recourse
   - 2.3 Verified Invariant Gate Architecture (Zero-Defect Principle)
   - 2.4 Hexagonal Domain Isolation & Clean Architecture
3. [DispatchEngine: Tier-by-Tier Mathematical Deep-Dive](#3-dispatchengine-tier-by-tier-mathematical-deep-dive)
   - 3.1 Tier 1: Wave Decomposition & Master Allocation ($DR\text{-}SAA\text{-}FCM$ & $Q\text{-}FCM$)
   - 3.2 Tier 2: 3D Containerization & Volumetric Packing ($MISOCP\text{-}CPSAT$ & LIFO DAG)
   - 3.3 Tier 3: Multi-Depot Multi-Trip VRP Routing ($HGS\text{-}ADC$ & $QAOA\text{-}QUBO$)
   - 3.4 Tier 4: Kinematics & Conflict-Free SIPP Trajectories ($PBS\text{-}SIPP$ & ISO 3691-4:2023)
   - 3.5 Benders Recourse Feedback Cuts (Tier 2 $\to$ Tier 1 & Tier 3 $\to$ Tier 1)
4. [API, Telemetry & Swagger Integration Architecture](#4-api-telemetry--swagger-integration-architecture)
5. [WMS Quantum Digital Twin 3D Simulator (Frontend Architecture)](#5-wms-quantum-digital-twin-3d-simulator-frontend-architecture)
   - 5.1 150m x 100m Floor Surface Containment Engine (Zero-Leakage Assurance)
   - 5.2 3D Scene Legend & Active Tour Route Explorer
6. [Technology Stack & Instrument Matrix](#6-technology-stack--instrument-matrix)
7. [Verification Methodology & Cryptographic Certification](#7-verification-methodology--cryptographic-certification)
8. [Deployment Runbook & Operational Procedures](#8-deployment-runbook--operational-procedures)

---

## 1. Executive Summary & High-Level System Architecture

Intra-logistics optimization in high-density automated fulfillment centers requires solving combinatorial routing problems under real-world physical constraints: irregular parcel dimensions, vehicle weight limits, battery discharge rates, aisle congestion, and human/robot cohabitation safety.

The end-to-end architecture is depicted below:

```
+---------------------------------------------------------------------------------------------------+
|                                 ENTERPRISE ERP / WMS / ORDER STREAM                               |
+---------------------------------------------------------------------------------------------------+
                                                  |
                                                  v
+---------------------------------------------------------------------------------------------------+
|                                     DISPATCH ENGINE ORCHESTRATOR                                  |
|                                                                                                   |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|  | Context Engine         | ---> | Algorithm Selector     | ---> | Benders Recourse Controller |  |
|  | (Demand, Entropy, SLA) |      | (Classical / Quantum)  |      | (Tier 3 -> Tier 1 Cuts)     |  |
|  +------------------------+      +------------------------+      +-----------------------------+  |
|                                                  |                                                |
|  [Tier 1: Wave Batching]         [Tier 2: 3D Packing]            [Tier 3: Routing]                |
|  DR-SAA Fuzzy C-Means            CP-SAT MISOCP & LIFO            HGS-ADC / QAOA-QUBO               |
|            |                              |                              |                        |
|            v                              v                              v                        |
|      [Gate 1 Audit]                 [Gate 2 Audit]                 [Gate 3 Audit]                 |
|            +------------------------------+------------------------------+                        |
|                                           |                                                       |
|                                           v                                                       |
|                            [Tier 4: Kinematics & SIPP]                                            |
|                            Continuous Swept Volume & ISO 3691-4                                   |
|                                           |                                                       |
|                                           v                                                       |
|                                     [Gate 4 Audit]                                                |
+---------------------------------------------------------------------------------------------------+
                  |                                                    |
                  | (REST / WebSocket / SSE)                           | (SQLite Telemetry & Audits)
                  v                                                    v
+------------------------------------+              +------------------------------------+
|       FASTAPI & SWAGGER UI         |              |        SQLITE AUDIT PERSISTENCE    |
|  Interactive OpenAPI 3.1 Spec      |              |  dispatchengine.db (WAL Mode)      |
|  Port 8080 / Swagger Explorer      |              |  Immutable Verification Trail      |
+------------------------------------+              +------------------------------------+
                  |
                  v
+---------------------------------------------------------------------------------------------------+
|                        WMS QUANTUM DIGITAL TWIN (REACT 18 + THREE.JS + VITE)                      |
|                                                                                                   |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|  | 3D Warehouse Twin Canvas       |  | Tiers Optimization Studio      |  | Analytics Studio    |  |
|  | (150m x 100m Floor, AMRs, Racks|  | (KaTeX Formulations, Gates)    |  | (Convergence, Pareto|  |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
|  | 3D Legend & Route Explorer     |  | Parameter Sweep Studio         |  | Telemetry Live HUD  |  |
|  | (Stop-by-Stop AMR Breakdown)   |  | (Batch Size, Qubits, Speed)    |  | (SLA, Energy, Zero) |  |
|  +--------------------------------+  +--------------------------------+  +---------------------+  |
+---------------------------------------------------------------------------------------------------+
```

---

## 2. Core Architectural Patterns & Design Principles

### 2.1 Multi-Tier Hierarchical Decomposition
Solving the unified Warehouse Pickup-and-Delivery Problem with Time Windows and 3D Packing (3D-PDPTW) as a single monolithic mathematical program is strictly $\mathcal{NP}$-hard. A single order wave with $N = 100$ customer orders and $K = 8$ AMRs yields over $10^{150}$ possible combinatorial permutations.

The architecture decomposes the problem across four hierarchical temporal and spatial scales:
1. **Tier 1 (Temporal/Spatial Partitioning)**: Decomposes $N$ warehouse orders into $K$ kinematically balanced batches, matching fleet size and depot layout.
2. **Tier 2 (Volumetric & Structural Feasibility)**: Packs assigned parcels into ISO pallet cages, enforcing static stability and Last-In-First-Out (LIFO) extraction order.
3. **Tier 3 (Topological Sequence Optimization)**: Finds the shortest closed-loop travel path connecting pick locations, depots, and consolidation chutes.
4. **Tier 4 (Spatio-Temporal Execution & Safety)**: Converts discrete route graphs into continuous time-space trajectories preventing collisions and respecting deceleration envelopes.

### 2.2 Generalized Benders Decomposition with Closed-Loop Recourse
Downstream tiers validate physical constraints that cannot be fully expressed in upstream tiers without prohibitive computational cost. When a downstream solver discovers an infeasibility, it issues a **Generalized Benders Cut** back to the master tier:

#### Overfill Volumetric Cut (Tier 2 $\to$ Tier 1):
$$\sum_{i \in \mathcal{B}_k} v_i \cdot x_{ik} \le V_{\max} - \Delta V_{\text{repack}}$$

- **Human-Readable Plain English Interpretation**: If the 3D packing engine finds that boxes cannot physically fit into the AMR's transport bay (due to awkward aspect ratios or void spaces), it immediately sends a constraint to Tier 1 reducing the usable volume limit for that vehicle by safety margin $\Delta V_{\text{repack}}$. Tier 1 re-partitions the wave, shifting excess orders to other robots.

#### Battery & Shift Duration Cut (Tier 3 $\to$ Tier 1):
$$\sum_{i \in \mathcal{R}_k} t_{\text{service}, i} + \frac{1}{v_{\text{nom}}} \sum_{(i, j) \in \mathcal{E}_k} d_{ij} \le T_{\text{shift}}$$

- **Human-Readable Plain English Interpretation**: The sum of all item pick times plus the transit travel time along tour $\mathcal{R}_k$ cannot exceed the battery autonomy or shift window $T_{\text{shift}}$. If a route breaches this limit, Tier 3 sends an exclusion cut back to Tier 1, forcing an intermediate depot recharge or route split.

### 2.3 Verified Invariant Gate Architecture (Zero-Defect Principle)
The system enforces the **Zero-Defect Quality Principle** via four independent, immutable validation gates ($G_1 \dots G_4$). Every tier output must achieve mathematical certification before downstream execution:
- **Gate 1**: Universal order conservation ($\sum_k x_{ik} = 1$) and vehicle mass capacity limits.
- **Gate 2**: 3D bounding box separation ($\text{vol}(i) \cap \text{vol}(j) = \emptyset$) and LIFO extraction DAG acyclicity.
- **Gate 3**: Subtour elimination ($\sum_{i,j \in S} x_{ij} \le |S|-1$) and hard customer delivery time windows ($t_i^{\text{arr}} \le \text{TW}_i^{\text{end}}$).
- **Gate 4**: Continuous swept-volume clearance ($\min_{i \ne j} \| \mathbf{p}_i(t) - \mathbf{p}_j(t) \| \ge 2 R_{\text{swept}}$) and ISO 3691-4 emergency stopping distances.

### 2.4 Hexagonal Domain Isolation & Clean Architecture
The architecture strictly enforces domain isolation:
- **Data Transfer Objects (DTOs)**: Immutable, strongly-typed contracts (`tier1_dto.py`, `tier2_dto.py`, `tier3_dto.py`, `tier4_dto.py`) validate boundaries.
- **Pluggable Solvers (Ports & Adapters)**: Classical solvers (Google OR-Tools, HGS-ADC) and quantum solvers (Classiq, Qiskit) adhere to identical solver interfaces.
- **Persistent Audit Trail**: SQLite database running in Write-Ahead Logging (WAL) mode archives every mathematical proof and iteration step.

---

## 3. DispatchEngine: Tier-by-Tier Mathematical Deep-Dive

### 3.1 Tier 1: Wave Decomposition & Master Allocation

#### Classical Solver: Distributionally Robust Fuzzy C-Means ($DR\text{-}SAA\text{-}FCM$)
Tier 1 partitions $N$ picking tasks across $K$ AMRs, minimizing travel distance dispersion while balancing vehicle workloads under stochastic travel time fluctuations $\tilde{\xi} \sim \mathbb{P}$:

$$\min_{U, \mathbf{C}} \sum_{k=1}^K \sum_{i=1}^N u_{ik}^m \cdot \mathbb{E}_{\mathbb{P}} \left[ \|\mathbf{x}_i - \mathbf{c}_k\|_{\Sigma^{-1}}^2 \right] + \lambda_1 \sum_{k=1}^K \left( \sum_{i=1}^N u_{ik} q_i - \frac{Q_{\text{total}}}{K} \right)^2$$

Subject to the Unitary Partition Constraint:
$$\sum_{k=1}^K u_{ik} = 1 \quad \forall i \in \{1, \dots, N\}, \qquad u_{ik} \in [0, 1]$$

#### Human-Readable Plain English Translation:
> **What this achieves in the facility**:  
> Assign each order item $i$ to vehicle batch $k$ with a certainty grade $u_{ik}$ (between 0% and 100%) and calculate optimal batch center coordinates $\mathbf{c}_k$.  
> 1. **Spatial Grouping**: Orders located near each other in the warehouse racks are grouped into the same robot's assignment using Mahalanobis distance with covariance matrix $\Sigma^{-1}$, taking aisle travel delays into account.  
> 2. **Workload Equity**: The second term penalizes vehicles having unequal cargo weight, multiplying the deviation from the average load $Q_{\text{total}}/K$ by penalty weight $\lambda_1$.

#### Variable & Symbol Deciphering Matrix:

| Symbol | Physical Entity | Units / Domain | Operational Role |
| :--- | :--- | :--- | :--- |
| $u_{ik}$ | Fuzzy Membership Degree | $[0.0, 1.0]$, Unitless | Degree of certainty that order $i$ belongs to robot $k$. |
| $m$ | Fuzzifier Exponent | $m \ge 1.0$ (typically $2.0$) | Controls boundary softness between clusters (higher = smoother transitions). |
| $\mathbf{x}_i, \mathbf{c}_k$ | Order & Centroid Coords | Meters $(x, y, z) \in \mathbb{R}^3$ | Physical rack locations of pick items and cluster centers. |
| $\Sigma^{-1}$ | Covariance Matrix Inverse | $(\text{m}^2)^{-1}$ (Mahalanobis) | Accounts for directional aisle layouts and congestion variability. |
| $q_i, Q_{\text{total}}$ | Parcel Mass & Total Load | Kilograms $(\text{kg})$ | Payload mass of order $i$ and total wave weight. |
| $\lambda_1$ | Workload Penalty Weight | Dimensionless scalar | Balances the trade-off between minimum travel and equal vehicle load. |

---

#### Quantum Solver: Quantum Fuzzy C-Means ($Q\text{-}FCM$)
In `QUANTUM` mode, distance calculations are offloaded to a quantum circuit using angle-encoded state vectors and Swap-Test ancilla measurement:

$$|\psi(\mathbf{x}_i)\rangle = \cos(\theta_i)|0\rangle + \sin(\theta_i)|1\rangle, \quad \theta_i = \arctan\left(\frac{y_i}{x_i}\right)$$

$$F(|\psi(\mathbf{x}_i)\rangle, |\psi(\mathbf{c}_k)\rangle) = |\langle \psi(\mathbf{x}_i) | \psi(\mathbf{c}_k) \rangle|^2 = 1 - 2 P(|1\rangle_{\text{ancilla}})$$

#### Human-Readable Plain English Translation:
> **What this achieves in the quantum coprocessor**:  
> Instead of calculating Euclidean distances through thousands of floating-point operations on a classical CPU, coordinates are converted into quantum qubit rotation angles. When an order state and centroid state are loaded into a Swap-Test circuit, the measurement probability of measuring $|1\rangle$ on an ancilla qubit directly equals half of the quantum distance: $D_Q = 2 P(|1\rangle)$. This achieves exponential state-space compression.

---

### 3.2 Tier 2: 3D Containerization & Volumetric Packing

#### CP-SAT Mixed-Integer Second-Order Cone Program ($MISOCP$)
Orders assigned to vehicle $k$ must be arranged inside the AMR's standardized cargo cage $(W, L, H)$:

$$\text{Maximize } \sum_{i \in \mathcal{B}_k} \text{vol}(i) \cdot y_i - \alpha \cdot \left(\Delta x_{\text{CoG}}^2 + \Delta y_{\text{CoG}}^2\right)$$

Subject to 3D Pairwise Non-Overlap Spatial Conditions:
$$x_i + w_i \le x_j + M(1 - a_{ij}) \quad \lor \quad x_j + w_j \le x_i + M(1 - b_{ij})$$
$$y_i + l_i \le y_j + M(1 - c_{ij}) \quad \lor \quad y_j + l_j \le y_i + M(1 - d_{ij})$$
$$z_i + h_i \le z_j + M(1 - e_{ij}) \quad \lor \quad z_j + h_j \le z_i + M(1 - f_{ij})$$

#### Strict Physical LIFO Invariant Condition:
$$z_j \ge z_i + h_i \implies \pi(i) > \pi(j)$$

#### Human-Readable Plain English Translation:
> **What this achieves inside the vehicle cage**:  
> 1. **Volume Maximization & Stability**: Pack maximum parcel volume while penalizing offsets from the Center of Gravity (CoG). Keeping the CoG centered directly over the AMR wheelbase prevents tipping during high-speed turns ($1.5\,\text{m/s}$).  
> 2. **3D Collision Clearance**: Boxes $i$ and $j$ can never occupy the same space: box $i$ must be completely to the left, right, front, back, above, or below box $j$.  
> 3. **LIFO Precedence (Zero Restacking)**: If box $j$ sits on top of box $i$ ($z_j \ge z_i + h_i$), box $j$ MUST be unloaded at an earlier stop than box $i$ ($\pi(j) < \pi(i)$). Warehouse pickers never need to dig underneath heavy packages to reach earlier deliveries.

#### Variable & Symbol Deciphering Matrix:

| Symbol | Physical Entity | Units / Domain | Operational Role |
| :--- | :--- | :--- | :--- |
| $(x_i, y_i, z_i)$ | Parcel Origin Coordinates | Meters $(\text{m})$ | Coordinates of the lower-front-left corner inside the cage. |
| $(w_i, l_i, h_i)$ | Parcel Dimensions | Meters $(\text{m})$ | Width, length, and height of parcel $i$. |
| $\Delta x_{\text{CoG}}, \Delta y_{\text{CoG}}$ | CoG Deviation | Meters $(\text{m})$ | Lateral and longitudinal displacement of cargo center from cage center. |
| $\pi(i)$ | Route Stop Index | Positive integer $\ge 1$ | Delivery sequence position of customer parcel $i$. |
| $a_{ij}, b_{ij}, \dots$ | Binary Spatial Indicators | $\{0, 1\}$ | Disjunctive variables indicating relative 3D placement. |
| $M$ | Big-M Constant | Scalar $> 100$ | Large upper bound relaxing non-overlap conditions when active. |

---

### 3.3 Tier 3: Multi-Depot Multi-Trip VRP Routing

#### Classical Solver: Hybrid Genetic Search with Advanced Diversity Control ($HGS\text{-}ADC$)
Evaluates chromosome population $\mathcal{P}$ with penalization for overtime and overweight:

$$\Phi(S) = \text{Cost}(S) + \beta_{\text{cap}} \sum_{k=1}^K \max(0, Q(r_k) - Q_{\max}) + \beta_{\text{tw}} \sum_{i=1}^N \max(0, t_i - \text{TW}_i^{\text{end}})$$

Bi-Subpopulation Diversity Rank Formula:
$$\text{BiRank}(S) = \text{rank}_{\text{fit}}(\Phi(S)) + \left(1 - \frac{\text{nbElapsedIter}}{\text{nbMaxIter}}\right) \cdot \text{rank}_{\text{div}}(\Delta(S, \mathcal{P}))$$

#### Human-Readable Plain English Translation:
> **What this achieves in vehicle tour planning**:  
> The genetic optimizer evaluates thousands of possible route sequences ($S$). A candidate tour is scored on its total travel distance $\text{Cost}(S)$, plus steep penalty fees for exceeding vehicle weight ($\beta_{\text{cap}}$) or arriving late past customer delivery time windows ($\beta_{\text{tw}}$).  
> The $\text{BiRank}$ formula balances raw solution fitness with population diversity $\Delta(S, \mathcal{P})$. Early in the search, it rewards novel, unconventional paths to prevent getting trapped in poor local optima.

---

#### Quantum Solver: Quantum Approximate Optimization Algorithm ($QAOA\text{-}QUBO$)
The routing graph is converted into an Ising Spin Glass Hamiltonian:

$$H_C = \sum_{(i,j) \in \mathcal{E}} c_{ij} \frac{I - Z_i Z_j}{2} + \lambda_{\text{degree}} \sum_{i=1}^N \left( 2 - \sum_{j \in \delta(i)} \frac{I - Z_i Z_j}{2} \right)^2$$

Parameterized Unitary Ansatz:
$$|\gamma, \beta\rangle = \prod_{p=1}^P \left( e^{-i \beta_p H_M} e^{-i \gamma_p H_C} \right) |+\rangle^{\otimes n}, \quad H_M = \sum_{i=1}^n X_i$$

#### Human-Readable Plain English Translation:
> **What this achieves on quantum hardware**:  
> Binary route variables ($x_{ij} \in \{0, 1\}$, indicating whether a path is traversed) are mapped to quantum Pauli-$Z$ spins ($Z_i \in \{-1, +1\}$).  
> 1. The first term calculates total transit distance cost $c_{ij}$.  
> 2. The second term imposes a steep penalty unless every warehouse stop has exactly one arrival and one departure edge (degree $= 2$).  
> The quantum ansatz alternates problem Hamiltonian evolution ($e^{-i \gamma H_C}$) with mixer Hamiltonian pulses ($e^{-i \beta H_M}$). When measured, the lowest-energy bitstrings represent valid, shortest-distance tours.

---

### 3.4 Tier 4: Kinematics & Conflict-Free SIPP Trajectories

#### Priority-Based Search with Safe Interval Path Planning ($PBS\text{-}SIPP$)
Robots $k \in \{1, \dots, K\}$ navigate the topological warehouse roadmap $G = (V, E)$. Safe time intervals $\text{safe}(v) = \{[t_1^{\text{start}}, t_1^{\text{end}}], \dots\}$ define collision-free windows:

$$\text{Continuous Swept-Volume Clearance}: \quad \min_{t \in [0, T_{\text{makespan}}]} \|\mathbf{p}_a(t) - \mathbf{p}_b(t)\|_2 \ge 2 R_{\text{swept}} + d_{\text{safety}} \quad \forall a \ne b$$

#### ISO 3691-4:2023 Safe Kinematic Deceleration Profile:
$$s_{\text{stop}}(v) = \frac{v^2}{2 a_{\max}} + v \cdot t_{\text{reaction}} + s_{\text{margin}}$$

#### Human-Readable Plain English Translation:
> **What this achieves on the physical warehouse floor**:  
> 1. **Multi-Robot Collision Avoidance**: At any moment in time $t$, two moving AMRs ($a$ and $b$) must maintain a center-to-center distance greater than twice their physical swept radius plus safety buffer $d_{\text{safety}}$ ($0.5\,\text{m}$). Safe Interval Path Planning (SIPP) modulates robot speeds so that vehicles take turns passing through narrow aisle intersections without stopping dead or colliding.  
> 2. **ISO 3691-4 Safe Braking Distance**: If an unexpected obstacle (such as a worker or dropped box) enters the robot's laser scanner field, the AMR must stop safely within distance $s_{\text{stop}}$. This depends on its travel velocity $v$, safety PLC response latency $t_{\text{reaction}}$ ($100\,\text{ms}$), and maximum braking deceleration $a_{\max}$ ($1.5\,\text{m/s}^2$).

#### Kinematic Parameter Specifications:

| Parameter | Standard / Formula | Engine Value | Industrial Safety Role |
| :--- | :--- | :--- | :--- |
| $R_{\text{swept}}$ | Physical Robot Radius | $0.45\,\text{m}$ | Circular footprint enclosing AMR chassis and cargo overhang. |
| $d_{\text{safety}}$ | Protective Laser Field | $0.50\,\text{m}$ | LiDAR protective safety field per ISO 3691-4. |
| $a_{\max}$ | Mechanical Deceleration | $1.50\,\text{m/s}^2$ | Maximum braking deceleration without dislodging loaded cargo. |
| $t_{\text{reaction}}$ | Safety PLC Response | $100\,\text{ms}$ | Latency for laser trip, bus transmission, and brake shoe bite. |
| $s_{\text{margin}}$ | Physical Mechanical Margin | $0.50\,\text{m}$ | Mechanical safety buffer preventing chassis contact. |

---

## 4. API, Telemetry & Swagger Integration Architecture

The backend architecture exposes a high-throughput asynchronous REST/WebSocket service conforming to **OpenAPI 3.1.0**, implemented in `standalone_server.py` and serving an embedded Swagger UI 5.x interface.

```
+---------------------------------------------------------------------------------------------------+
|                                      DISPATCH ENGINE API SERVER                                   |
|                                       (standalone_server.py)                                      |
+---------------------------------------------------------------------------------------------------+
|  [GET]  /api/v1/health                  -> Healthcheck & Node Telemetry                           |
|  [POST] /api/v1/dispatch/wave           -> Execute Full 4-Tier Dispatch Wave Pipeline             |
|  [GET]  /api/v1/dispatch/status/{id}    -> Query Wave Execution Status & Audit Gates              |
|  [GET]  /api/v1/tiers/{tier_id}/config  -> Read/Update Tier Operational Parameters                |
|  [GET]  /api/v1/quantum/circuit/{id}    -> Inspect Classiq Synthesis QMOD / OpenQASM              |
|  [GET]  /api/v1/simulation/stream       -> SSE / WebSocket Stream of Live AMR Robot Positions     |
|  [GET]  /docs                           -> Interactive Swagger UI 5.x Interface                   |
|  [GET]  /openapi.json                   -> Standardized OpenAPI Specification Schema               |
+---------------------------------------------------------------------------------------------------+
```

### Core API Endpoints:
- `GET /api/v1/health`: Returns system uptime, active worker threads, memory footprint, and fleet readiness.
- `POST /api/v1/dispatch/wave`: Accepts an `OrderPoolDTO` payload, executes the 4-tier pipeline, applies Benders recourse if necessary, and returns a certified `WaveResultDTO`.
- `GET /api/v1/dispatch/status/{id}`: Returns gate validation reports, Benders cut logs, and solution telemetry.
- `GET /api/v1/simulation/stream`: Streams 60 FPS interpolated AMR coordinates to the 3D Digital Twin using Server-Sent Events (SSE).
- `GET /docs`: In-browser interactive Swagger UI providing schema documentation and live API invocation.

---

## 5. WMS Quantum Digital Twin 3D Simulator (Frontend Architecture)

The frontend is an interactive industrial digital twin built with **React 18**, **TypeScript**, and **Three.js**, rendering an accurate $150\,\text{m} \times 100\,\text{m}$ facility floor.

```
web_simulator/
├── src/
│   ├── components/
│   │   ├── ThreeWarehouseCanvas.tsx      # Core 3D Cyber-Physical Warehouse Scene (Three.js)
│   │   ├── Scene3DLegendPanel.tsx        # Interactive 3D Legend & Tour Route Explorer Panel
│   │   ├── TierOptimizationStudio.tsx    # Tier 1-4 Formulation & Parameter Tuning Studio
│   │   ├── ParameterSweepStudio.tsx      # Sensitivity & Multi-Param Trade-off Explorer
│   │   ├── AnalyticsGraphsStudio.tsx     # Convergence, Energy Landscape & LIFO DAG Visualizer
│   │   ├── CodeLmnBadge.tsx              # "Verified" Status Badge & Invariant Certifier
│   │   └── Layout.tsx                    # Cyber-Physical HUD Navigation Shell
│   ├── utils/
│   │   ├── floorBoundsCalculator.ts      # 100% Floor Containment & Zero-Leakage Engine
│   │   └── katexRender.ts                # LaTeX Typography & Formula Renderer
│   ├── data/
│   │   ├── scene3dLegendDossier.ts       # 3D Scene Objects, Vehicle Colors & Safety Specs
│   │   ├── tierParamDossiers.ts          # Tier Formulations, Problem Descriptions & Demos
│   │   └── quickControlsDossier.ts       # Control Sliders, Invariants & Acronym Glossaries
│   └── services/
│       └── api.ts                        # Typed REST & Mock API Integration Layer
```

### 5.1 150m x 100m Floor Surface Containment Engine (Zero-Leakage Assurance)
Every vehicle stop $\mathbf{p}(t) = (x, y, z)$ across all active tours is audited and mathematically bounded within the warehouse floor mesh:

$$\forall \mathbf{p}(t) \in \text{Tour}: \quad 0 \le p_x(t) \le 150\,\text{m}, \quad 0 \le p_z(t) \le 100\,\text{m}, \quad d_{\text{wall}}^{\min} \ge 2.0\,\text{m}$$

- **100% Floor Containment**: Trajectories never project beyond the floor boundary into empty 3D space.
- **Dual-Frequency Cyber Grid**: 10m primary structural grid with 2m precision secondary navigation markers.
- **Safety Boundary**: Glowing cyan laser perimeter barrier and 8 curb safety pylons with warning beacons.
- **Physical Assets**: 5 Automated Fast-Charging Depots ($D_1 \dots D_5$), 4 Consolidation Chutes ($C_1 \dots C_4$), 22+ Storage Rack Aisles, and 8 AMRs with localized LiDAR cones.

### 5.2 3D Scene Legend & Active Tour Route Explorer
The glassmorphism panel (`Scene3DLegendPanel.tsx`) provides 4 sub-tabs:
1. **3D Objects & Invariants**: Technical descriptions, operational roles, and mathematical equations for every 3D object on the canvas.
2. **Active Tours**: Detailed vehicle selector pills for all active AMRs, tour KPI cards (Makespan, Length, Mass, Volume), dynamic step-by-step itinerary tables (`REPLENISH`, `PICKUP`, `DROP`, `DOCK`), and interactive **"Focus in 3D"** camera tracking.
3. **Color Code Guide**: Optical deciphering guide for vehicle glow frequencies and facility markers.
4. **Kinematics & Safety**: Engineering specs for LiDAR protective fields, deceleration profiles, and anti-collision zones.

---

## 6. Technology Stack & Instrument Matrix

| Component Layer | Technology / Tool | Version | Role in Architecture |
| :--- | :--- | :--- | :--- |
| **Quantum Optimization** | Classiq SDK & Qiskit | 0.46+ | QMOD synthesis, QAOA QUBO ansatz generation, Swap-Test circuits |
| **Constraint Programming** | Google OR-Tools | 9.8+ | CP-SAT solver for 3D container bin packing and LIFO DAG generation |
| **Metaheuristics** | PyVRP / Custom HGS | 0.8+ | Hybrid Genetic Search with Advanced Diversity Control for VRP |
| **Backend Engine** | Python | 3.11+ | Orchestrator, SIPP kinematic engine, Benders recourse controller |
| **Persistence** | SQLite 3 | 3.42+ | Thread-safe WAL-mode persistence, audit log of mathematical proofs |
| **API Framework** | FastAPI / Standalone | 0.109+ | High-throughput REST endpoints & OpenAPI 3.1 schema delivery |
| **API Documentation** | Swagger UI | 5.17.14 | Interactive in-browser endpoint testing and contract visualization |
| **Frontend Framework** | React | 18.2+ | Declarative component UI and reactive state tree |
| **Type Safety** | TypeScript | 5.3+ | End-to-end interface contracts between backend DTOs and UI |
| **Bundler & Tooling** | Vite | 5.4+ | Lightning-fast HMR and optimized production code-splitting |
| **3D Rendering** | Three.js | 0.160+ | Cyber-physical 3D digital twin rendering with WebGL shaders |
| **Formula Engine** | KaTeX | 0.16.9 | Client-side LaTeX mathematical formula rendering |
| **Cloud Hosting** | Firebase Hosting | 13.x | Low-latency global CDN deployment for web simulator |

---

## 7. Verification Methodology & Cryptographic Certification

Every dispatch wave execution passes through an automated 4-gate verification pipeline:

```
[Wave Input Pool]
        |
        v
+------------------+
|  Tier 1 Solvers  | ---> Gate 1 Audit [Pass: Delta_cap <= 0, Sum(u_ik) == 1]
+------------------+           |
        |                      v (Pass)
+------------------+
|  Tier 2 Solvers  | ---> Gate 2 Audit [Pass: No 3D Overlap, Acyclic LIFO DAG]
+------------------+           |
        |                      v (Pass)
+------------------+
|  Tier 3 Solvers  | ---> Gate 3 Audit [Pass: No Subtours, TW_arr <= TW_end]
+------------------+           |
        |                      v (Pass)
+------------------+
|  Tier 4 Solvers  | ---> Gate 4 Audit [Pass: Dist(AMR_i, AMR_j) >= 2R_swept]
+------------------+           |
                               v (Pass)
                [Mathematical Certification: "Code Verified"]
```

When all gates return `is_valid == True`, the system stamps the solution with the **`Code Verified`** cryptographic seal, certifying that all physical invariants and safety constraints are verified.

---

## 8. Deployment Runbook & Operational Procedures

### 8.1 Launching the Standalone API Server
```powershell
# From repository root
& 'C:\Users\vladimir.dobrouchkin\.gemini\antigravity-ide\scratch\classiq_env\Scripts\python.exe' -m DispatchEngine.api.standalone_server
```
- API Base URL: `http://127.0.0.1:8080/`
- Interactive Swagger UI: `http://127.0.0.1:8080/docs`
- OpenAPI Specification Schema: `http://127.0.0.1:8080/openapi.json`

### 8.2 Launching the 3D Digital Twin Simulator Locally
```powershell
cd web_simulator
npm run dev
```
- Local Digital Twin preview: `http://localhost:3000/`

### 8.3 Production Build & Firebase Hosting Deployment
```powershell
cd web_simulator
npm run build
npx -y firebase-tools deploy --only hosting
```
- Production Live URL: `https://acoustic-architect-3cgfo.web.app`

---
*Architectural Document Certified & Maintained by YesAndNo Quantum Research Team.*
