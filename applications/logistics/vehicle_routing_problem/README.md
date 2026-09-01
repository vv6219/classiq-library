# Warehouse Management System (WMS) Quantum Vehicle Routing Problem (VRP) & Visual Simulator

## 1. Project Overview

This project implements a hybrid **Quantum-Classical Warehouse Management System (WMS)** optimization pipeline and visual simulator for the **Capacitated Vehicle Routing Problem (CVRP)** and **Batch Picking / Automated Guided Vehicle (AGV) Routing**.

The system addresses large-scale warehouse order fulfilment by decomposing the combinatorial NP-hard VRP problem into two coordinated stages:
1. **Quantum K-Means Clustering (Batch Assignment)**: Partitions multi-dimensional warehouse pick orders ($x, y, z$, weight, volume, SLA urgency, zone class) into $K$ balanced batches using quantum state fidelity / swap-test distance metric.
2. **QAOA & QUBO Route Optimization**: Formulates intra-cluster AGV pick sequences as a Quadratic Unconstrained Binary Optimization (QUBO) problem with Miller-Tucker-Zemlin (MTZ) subtour elimination constraints and maps them to an Ising Hamiltonian for Quantum Approximate Optimization Algorithm (QAOA) execution.
3. **Visual Simulator**: A high-resolution 2D warehouse simulator supporting static plot exports, animated multi-AGV GIF simulations, and real-time interactive desktop GUI navigation.

---

## 2. Architecture & Mathematical Formulation

```mermaid
flowchart TD
    A[Raw Warehouse Orders\nx, y, z, weight, volume, SLA, zone] --> B[Qubitized Feature Encoding]
    B --> C[Quantum K-Means Subroutine\nSwap-Test Fidelity Metric]
    C --> D[K Batches / AGV Allocations]
    D --> E[QUBO Intra-Cluster Formulation\nDegree + Capacity + MTZ Penalties]
    E --> F[Ising Hamiltonian Mapping\nx -> (1-z)/2]
    F --> G[Classiq QAOA Synthesis\nParameterized Ansatz & Circuit Execution]
    G --> H[AGV Dispatch Routes]
    H --> I[WMS Visual Simulator\nPNG / GIF / Interactive GUI]
```

### 2.1 Feature Vector Representation
Each order is characterized by a 7-dimensional physical and operational vector:
$$\mathbf{v}_i = [x_i, y_i, z_i, w_i, v_i, \text{SLA}_i, \text{Zone}_i]^T$$
Features are normalized and amplitude/angle-encoded into quantum registers:
$$|\psi_i\rangle = \sum_{j=1}^7 \sqrt{\tilde{v}_{ij}} |j\rangle \quad \text{or} \quad R_y(\theta_j)|0\rangle \quad \text{where } \theta_j = 2 \arcsin\left(\sqrt{\tilde{v}_{ij}}\right)$$

### 2.2 Quantum Distance Metric (Swap-Test Fidelity)
Instead of purely classical Euclidean distance, cluster assignment uses the quantum state overlap:
$$F(|\psi_a\rangle, |\psi_b\rangle) = |\langle \psi_a | \psi_b \rangle|^2$$
$$D_{\text{quantum}}(\mathbf{a}, \mathbf{b}) = 1.0 - |\langle \psi_a | \psi_b \rangle|^2$$

### 2.3 Intra-Cluster VRP QUBO Formulation
For each cluster with $N$ nodes (including depot $0$), binary decision variables $x_{ij} \in \{0, 1\}$ represent traversal from node $i$ to $j$:
$$\min \sum_{i,j} d_{ij} x_{ij} + \alpha_{\text{deg}} H_{\text{degree}} + \alpha_{\text{cap}} H_{\text{capacity}} + \alpha_{\text{mtz}} H_{\text{subtour}}$$

- **Degree Penalty**:
  $$H_{\text{degree}} = \sum_{i} \left(1 - \sum_j x_{ij}\right)^2 + \sum_j \left(1 - \sum_i x_{ij}\right)^2$$
- **Capacity Penalty**:
  $$H_{\text{capacity}} = \sum_{i,j} \frac{w_j}{C_{\text{max}}} x_{ij}$$
- **MTZ Subtour Elimination**:
  Quadratic penalties enforcing continuous acyclic route sequences without premature closed sub-loops.

### 2.4 Ising Hamiltonian for QAOA
Mapping binary variables $x_i = \frac{1 - z_i}{2}$ with Pauli-Z operators $z_i \in \{+1, -1\}$ transforms the QUBO matrix $Q$ into:
$$H_C = \sum_i h_i Z_i + \sum_{i < j} J_{ij} Z_i Z_j + \text{offset}$$

---

## 3. Project Structure & Files

```
applications/logistics/vehicle_routing_problem/
├── README.md                                  # This comprehensive project documentation
├── wms_quantum_optimization_pipeline.py       # Core quantum pipeline (K-Means, QUBO, QAOA, Classiq synthesis)
├── wms_visual_simulator.py                    # 2D Warehouse simulator (CLI, PNG, GIF, Interactive GUI)
├── vehicle_routing_problem.ipynb              # Interactive Jupyter tutorial notebook
├── vehicle_routing_problem.qmod               # Native Classiq QMOD model file
├── vehicle_routing_problem.metadata.json      # Classiq library registry metadata
├── vehicle_routing_problem.synthesis_options.json # Synthesis compiler preferences
├── wms_simulation.png                         # Generated static routing map
└── wms_simulation.gif                         # Generated animated multi-AGV dispatch simulation
```

---

## 4. Installation & Environment Setup

### 4.1 Prerequisites
- Python 3.10 - 3.12 (or Windows Python 3.12+ in virtual environment)
- Active virtual environment (e.g. `classiq_env`)

### 4.2 Required Packages
The project dependencies include:
- `classiq` (Quantum synthesis & hardware execution SDK)
- `numpy`, `scipy` (Numerical operations and linear algebra)
- `matplotlib`, `pillow` (Visualization and GIF rendering)
- `networkx` (Graph and route modeling)

Install via pip:
```bash
pip install classiq numpy scipy matplotlib pillow networkx
```

---

## 5. Usage & Execution Guide

### 5.1 Running the Visual Simulator (`wms_visual_simulator.py`)

The simulator provides flexible CLI options for test sizes, cluster counts, output formats, and GUI modes:

| Argument | Description | Default |
| :--- | :--- | :--- |
| `--num-points` | Number of synthesized order locations (`0` for fixed 10-point demo) | `100` |
| `--k-batches` | Number of AGV pick clusters / fleet size | `4` |
| `--animate` | Generate frame-by-frame animated dispatch sequence | `False` |
| `--output` | Destination path (`.png` or `.gif`) | `wms_simulation.png` / `.gif` |
| `--seed` | Random generator seed for repeatable order coordinates | `42` |
| `--gui`, `--interactive` | Launch interactive desktop window (`TkAgg` backend) | `False` |

#### Mode 1: Static Route Map (PNG)
```powershell
python wms_visual_simulator.py --num-points 40 --k-batches 4 --output wms_simulation.png
```
*Output Summary Example:*
```
============================================================
  WMS Quantum Optimization Visual Simulator
============================================================
  * Orders count:      40
  * K batches/routes:  4
  * Mode:              Static Plot (PNG)
  * Output path:       wms_simulation.png
  * GUI display:       Headless/Save only
============================================================
[*] Running Quantum K-Means & QAOA Routing Pipeline...
  - Cluster 1: 6 pick stops, route distance = 46.28 m
  - Cluster 2: 12 pick stops, route distance = 72.72 m
  - Cluster 3: 10 pick stops, route distance = 64.73 m
  - Cluster 4: 12 pick stops, route distance = 76.78 m
[*] Total AGV Fleet Distance: 260.51 m
[*] Generating static simulation plot...
[+] Static simulation saved to: .../wms_simulation.png
[OK] Simulation completed successfully!
```

#### Mode 2: Animated Multi-AGV Simulation (GIF)
```powershell
python wms_visual_simulator.py --num-points 25 --k-batches 3 --animate --output wms_simulation.gif
```
*Generates animated vehicle trajectories dispatching simultaneously from the central depot $(0,0)$ through their assigned pick clusters.*

#### Mode 3: Interactive GUI Desktop Window
```powershell
python wms_visual_simulator.py --num-points 30 --k-batches 3 --gui
```

---

### 5.2 Running the Quantum Synthesis Pipeline (`wms_quantum_optimization_pipeline.py`)

Execute the end-to-end Classiq synthesis pipeline to compile the parameterized QAOA ansatz and swap-test circuits:

```powershell
python wms_quantum_optimization_pipeline.py
```

#### Programmatic Integration Example:
```python
from wms_quantum_optimization_pipeline import OrderLocation, route_cluster_pipeline, build_qaoa_model

# 1. Define order locations
orders = [
    OrderLocation(x=2.0, y=5.0, z=1.0, weight=11.0, volume=13.0, sla_priority=0.9, zone_class=0.2),
    OrderLocation(x=8.0, y=7.0, z=1.0, weight=15.0, volume=14.0, sla_priority=0.8, zone_class=0.5),
    OrderLocation(x=14.0, y=10.0, z=1.8, weight=18.0, volume=18.0, sla_priority=0.9, zone_class=0.7),
]

# 2. Run clustering and QUBO decomposition
pipeline = route_cluster_pipeline(orders, k_batches=2, vehicle_capacity=100.0)

# 3. Create Classiq QMOD model for QAOA circuit synthesis
qmod, details = build_qaoa_model(orders, k_batches=2)
```

---

## 6. Benchmarking & Scalability

The pipeline includes built-in benchmarking utilities (`benchmark_runtime_100_points`) to evaluate clustering throughput and QUBO generation latency across varying batch counts ($K \in [2, 6]$):

```python
from wms_quantum_optimization_pipeline import benchmark_runtime_100_points

results = benchmark_runtime_100_points(cluster_counts=[2, 3, 4, 5], repeats=3)
for row in results:
    print(f"K={row['k_batches']} -> Avg Latency: {row['avg_seconds']:.4f}s")
```

---

## 7. Key Benefits & Design Highlights

1. **Scalability**: By partitioning 100+ order workloads into balanced sub-clusters, individual route QUBOs remain within quantum hardware NISQ limits ($\le 30$ qubits).
2. **Multi-Criteria Clustering**: Integrates spatial distances with physical item weight, container volume, and warehouse SLA priorities.
3. **Cross-Platform Visualizations**: Robust handling of headless server environments (Agg backend) as well as desktop interactive UI (TkAgg).
