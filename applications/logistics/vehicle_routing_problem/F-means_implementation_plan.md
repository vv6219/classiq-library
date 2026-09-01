# Implementation Plan: Quantum Fuzzy C-Means (QFCM / F-Means) for WMS Vehicle Routing

This plan outlines the architecture, mathematical foundation, module design, and integration workflow for adding **Quantum Fuzzy C-Means (F-Means / QFCM)** to the WMS Vehicle Routing Problem (VRP) codebase.

---

## 1. Problem & Proposed Solution

### The Limitation of Deterministic Quantum K-Means
- Current batch assignment uses deterministic, hard clustering where each pick order $i$ is forced strictly into one cluster $k = \arg\min_j D_Q(\mathbf{x}_i, \mathbf{c}_j)$.
- In warehouse logistics, boundary orders (items located midway between AGV zones, or orders with high variance in pick duration, weight, or SLA deadlines) cause vehicle overload or detour inefficiencies when forced into rigid clusters.

### The Quantum F-Means (QFCM) Advantage
- **Soft Membership Matrix $U \in [0, 1]^{N \times K}$**: Every order has continuous membership probabilities across all $K$ batch clusters ($\sum_k u_{ik} = 1$).
- **Born's Rule Quantum Measurement**: Computes quantum overlap fidelity $|\langle \psi_i | c_k \rangle|^2$ via swap-test ancilla measurement probabilities $P(|0\rangle) = \frac{1 + |\langle \psi_i | c_k \rangle|^2}{2}$, directly translating quantum probability amplitudes into fuzzy memberships.
- **Entropy-Based Capacity Balancing**: Analyzes Shannon entropy $H(u_i) = -\sum_k u_{ik} \ln u_{ik}$ to identify boundary orders and dynamically reassign them to under-utilized AGVs before QUBO/QAOA route optimization.

---

## 2. Proposed Changes & Architecture

### Component 1: Quantum F-Means Engine
#### [NEW] [wms_quantum_fmeans.py](file:///c:/Users/vladimir.dobrouchkin/.gemini/antigravity-ide/scratch/classiq_env/classiq-library/applications/logistics/vehicle_routing_problem/wms_quantum_fmeans.py)
- **`QuantumFMeansDistance`**: Quantum state amplitude/angle encoding and fidelity calculation based on Born's rule $D_Q(\psi_i, c_k) = 1.0 - |\langle \psi_i | c_k \rangle|^2$.
- **`QuantumFMeans` class**:
  - `fit(orders)`: Iterative expectation-maximization with fuzziness exponent $m > 1.0$ (default $m = 2.0$).
  - `predict_proba(orders)`: Returns soft membership probability matrix $U$.
  - `predict(orders)`: Defuzzified cluster assignment ($\arg\max_k u_{ik}$).
  - `get_cluster_entropy()`: Calculates per-order fuzzy assignment uncertainty $H_i$.
- **`entropy_rebalance_clusters(orders, U, k_batches, vehicle_capacity)`**: Load-aware dynamic rebalancing for boundary orders.
- **`fuzzy_route_cluster_pipeline(...)`**: Complete orchestration producing centroids, memberships, rebalanced assignments, and intra-cluster QUBO models.

---

### Component 2: Integration with Visual Simulator
#### [MODIFY] [wms_visual_simulator.py](file:///c:/Users/vladimir.dobrouchkin/.gemini/antigravity-ide/scratch/classiq_env/classiq-library/applications/logistics/vehicle_routing_problem/wms_visual_simulator.py)
- Add CLI arguments:
  - `--clustering {kmeans,fmeans}` (default: `fmeans`)
  - `--fuzziness-m <float>` (default: `2.0`)
- Visual enhancement for fuzzy clustering:
  - Highlight high-entropy boundary orders with dashed probability links or semi-transparent rings showing their secondary cluster affinity.
  - Print fuzzy membership statistics and entropy distribution in console logs.

---

### Component 3: Integration with Quantum Pipeline & Benchmarking
#### [MODIFY] [wms_quantum_optimization_pipeline.py](file:///c:/Users/vladimir.dobrouchkin/.gemini/antigravity-ide/scratch/classiq_env/classiq-library/applications/logistics/vehicle_routing_problem/wms_quantum_optimization_pipeline.py)
- Export `fuzzy_route_cluster_pipeline` alongside standard `route_cluster_pipeline`.
- Add comparative benchmark function `benchmark_kmeans_vs_fmeans()` measuring cluster balance, total fleet travel distance, and capacity compliance across 100-order datasets.

---

### Component 4: Documentation
#### [MODIFY] [README.md](file:///c:/Users/vladimir.dobrouchkin/.gemini/antigravity-ide/scratch/classiq_env/classiq-library/applications/logistics/vehicle_routing_problem/README.md)
- Document the Quantum F-Means mathematical derivation, Born's rule probability interpretation, and entropy rebalancing algorithm.
- Update CLI usage examples with `--clustering fmeans` and comparative benchmark guidelines.

---

## 3. Verification Plan

### Automated & Unit Tests
1. **Unit Tests for QFCM (`test_quantum_fmeans.py`)**:
   - Verify that all rows in membership matrix $U$ sum to $1.0 \pm 10^{-6}$.
   - Verify convergence of centroid vectors on multi-dimensional order features.
   - Verify entropy calculation and boundary order identification.
2. **Execution Tests via PowerShell**:
   - Run static plot export with F-Means:
     ```powershell
     & "c:\Users\vladimir.dobrouchkin\.gemini\antigravity-ide\scratch\classiq_env\Scripts\python.exe" wms_visual_simulator.py --clustering fmeans --num-points 40 --k-batches 4 --output wms_fmeans_simulation.png
     ```
   - Run animated GIF export with F-Means:
     ```powershell
     & "c:\Users\vladimir.dobrouchkin\.gemini\antigravity-ide\scratch\classiq_env\Scripts\python.exe" wms_visual_simulator.py --clustering fmeans --num-points 25 --k-batches 3 --animate --output wms_fmeans_simulation.gif
     ```
   - Run comparative benchmark:
     ```powershell
     & "c:\Users\vladimir.dobrouchkin\.gemini\antigravity-ide\scratch\classiq_env\Scripts\python.exe" -c "import wms_quantum_fmeans; print('QFCM Module Loaded Successfully')"
     ```

### Manual Verification
- Inspect generated static and animated visuals to confirm balanced route geometries and accurate boundary node representation.
