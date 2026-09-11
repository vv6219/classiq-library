# Industrial Multi-Tier Warehouse Optimization Engine (`DispatchEngine`)

A production-grade, asynchronous four-tier mathematical optimization engine for rich intra-facility logistics:
$$\mathcal{P}_{\text{ER-MD-VRPTW-3D-HRI-Q}}$$

Extended Rich Multi-Depot, Multi-Trip, Multi-Commodity Pickup-and-Delivery Problem with Open Time Windows, 3D Containerization, Human-Robot Shared Spaces, Stochastic Disruption Recourse, and Classiq Quantum Co-Processor Acceleration.

---

## Key Architecture & Features

1. **Enterprise Persistence & Database Layer (`storage/`):**
   - Built on **SQLAlchemy 2.0+** (default local SQLite `dispatchengine.db`, pluggable PostgreSQL).
   - Versions warehouse topologies, saves synthetic mock scenario seeds (10 to 35,000 orders), and logs execution snapshots.
   - Database-backed historical regression detection & comparative reporting.

2. **Four-Tier Mathematical Hierarchy (`tiers/`):**
   - **Tier 1 (Master Batching):** Quantum-Enhanced Spatio-Temporal FCM (`Rank 1Q`) with Classiq Swap-Test kernels and classical FCM + Wasserstein DR-SAA (`Rank 1`).
   - **Tier 2 (3D Containerization):** CP-SAT `diffn` 3D box packing with MISOCP Center-of-Mass margin stability and acyclic LIFO extraction DAGs.
   - **Tier 3 (Route Sequencing):** Classiq Parameterized QAOA VRP subtour synthesizer (`Rank 1Q`) and classical HGS-ADC Asymmetric Open Bellman-Ford split (`Rank 1`).
   - **Tier 4 (Kinematic Deconfliction):** Priority-Based Search (PBS) over Continuous Swept-SIPP and Distributed NMPC for ISO 3691-4 human-robot speed dampening.

3. **Invariant Validation Gates (`gates/`):**
   - Gate 1: Batch payload capacity & SLA chance-constraint reliability ($\mathbb{P}(T \le L) \ge 1 - \epsilon$).
   - Gate 2: Acyclic LIFO extraction graph & dynamic CoM margin support $\ge 75\%$.
   - Gate 3: Open-window arrival bounds ($T_i \ge e_i$), shift caps, and battery SoC reserve ($\ge 15\%$).
   - Gate 4: Continuous Minkowski swept clearance & ISO 3691-4 velocity limits ($v \le 0.8\,\text{m/s}$).

4. **Analytical Benders Recourse (`recourse/`):**
   - Tier 2 $\rightarrow$ Tier 1 Minimal Infeasible Sub-batch combinatorial cuts.
   - Tier 3 $\rightarrow$ Tier 1 Critical Subtour & battery deficit cuts.
   - Tier 4 $\rightarrow$ Tier 3 Spatiotemporal corridor invalidation cuts ($c_{uv}^k(t) = \infty$).

5. **Presentation Engine (`presentation/`):**
   - Interpolates 50Hz continuous splines into 10Hz/20Hz `SimulationFrameDTO` streams for 2D/3D visual floor simulators.
   - Emits structured telemetry for the 6-Panel Executive Dashboard HUD.

6. **Classiq Quantum Co-Processor Subsystem (`quantum/`):**
   - Swap-Test fidelity circuits, non-linear ZZ Feature Maps, and parameterized QAOA circuits synthesized through the Classiq engine.
   - Deep circuit profiler (`ClassiqCircuitInvestigator`) tracking qubit width, CX gate depth, and variational energy convergence.

---

## Quick Start & CLI Usage

### Running an Optimization Wave
```bash
python main.py --scenario-orders 80 --vehicles 4 --depots 4 --mode QUANTUM --benchmark
```

### Running Test Suites
```bash
# 1. Storage & Database CRUD tests
pytest tests/test_storage.py -v

# 2. Validation Gates tests
pytest tests/test_gates.py -v

# 3. Classiq Quantum Co-Processor tests
pytest tests/test_quantum.py -v

# 4. End-to-end Orchestrator & Benchmarks
pytest tests/test_orchestrator.py -v
```
