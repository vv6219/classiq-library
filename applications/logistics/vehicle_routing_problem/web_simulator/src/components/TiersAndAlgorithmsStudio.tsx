import React, { useState } from 'react';
import { ParameterCard } from './ParameterCard';
import katex from 'katex';
import {
  TIER_PARAMS_DOSSIER,
  TIER_PROBLEM_SOLVING_DOSSIER,
  TIER_ACRONYMS_DOSSIER,
  TIER_CALCULATIONS_DOSSIER,
} from '../data/tiersDossier';
import { CodeLmnBadge } from './CodeLmnBadge';

import { CONFIG_LIMITS } from '../services/api';
import {
  Layers,
  Cpu,
  Box,
  GitFork,
  Gauge,
  CheckCircle2,
  ArrowRight,
  Info,
  BookOpen,
  Sparkles,
  Zap,
  ShieldCheck,
  FileCode,
  Check,
  Copy,
  Volume2,
  VolumeX,
  X,
  Maximize2,
  Minimize2,
  ExternalLink,
} from 'lucide-react';

interface TiersAndAlgorithmsStudioProps {
  activeTiers: Record<string, string>;
  onSelectTierAlgorithm: (tierKey: string, algoRank: string) => void;
  tierParams: Record<string, number>;
  onChangeTierParam: (paramKey: string, val: number) => void;
  onNavigateToQuantumStudio?: () => void;
}

interface TierDetail {
  id: string;
  title: string;
  shortRole: string;
  stageNumber: number;
  icon: React.ReactNode;
  accentColor: string;
  desc: string;
  industrialMeaning: string;
  mathObjective: string;
  inputContract: string;
  outputContract: string;
  invariants: string[];
  quantumSynergy: string;
  tradeoffs: string;
  algorithms: {
    rank: string;
    name: string;
    type: 'QUANTUM' | 'CLASSICAL';
  }[];
  params: {
    key: string;
    label: string;
    nominal: [number, number];
  }[];
}

interface AlgoDetail {
  rank: string;
  name: string;
  tierId: string;
  tierTitle: string;
  type: 'QUANTUM' | 'CLASSICAL';
  tagline: string;
  meaning: string;
  mathematicalFormulation: string;
  solverMechanics: string;
  codeOrStructureSnippet: string;
  complexity: string;
  whenToUse: string;
  keyHyperparameters: string;
}

export const TiersAndAlgorithmsStudio: React.FC<TiersAndAlgorithmsStudioProps> = ({
  activeTiers,
  onSelectTierAlgorithm,
  tierParams,
  onChangeTierParam,
  onNavigateToQuantumStudio,
}) => {
  // Selection State: can inspect either a Tier or an Algorithm
  const [selectedItem, setSelectedItem] = useState<{
    type: 'tier' | 'algo' | 'param';
    id: string;
    tierId?: string;
  }>({
    type: 'tier',
    id: 'tier1',
  });

  const [subPanelTab, setSubPanelTab] = useState<'meaning' | 'param_deepdive' | 'problem_solving' | 'math' | 'acronyms' | 'contracts' | 'solver'>('meaning');
  const [selectedParamKey, setSelectedParamKey] = useState<string>('fcm_fuzziness_m');
  const [selectedTierDossierTab, setSelectedTierDossierTab] = useState<'all' | 'params' | 'problems' | 'acronyms' | 'calc'>('all');
  const [isSubPanelOpen, setIsSubPanelOpen] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Tiers Data Catalog
  const tiers: TierDetail[] = [
    {
      id: 'tier1',
      title: 'Tier 1: Wave Decomposition & Macro-Clustering',
      shortRole: 'Spatial Wave Balancing & Depot Allocation',
      stageNumber: 1,
      icon: <Layers size={18} color="#00f0ff" />,
      accentColor: '#00f0ff',
      desc: 'Solves balanced spatial wave clustering across AMRs and depots minimizing split-picking dispersion.',
      industrialMeaning:
        'Tier 1 acts as the executive macro-orchestrator of warehouse order dispatching. When hundreds or thousands of customer pick orders arrive from the WMS/ERP, Tier 1 groups them into spatio-temporal pick waves and balances their assignments across available AMR vehicles and depot induction points. The primary operational goal is preventing aisle gridlock and ensuring that induction chutes do not bottleneck or starve downstream packaging sorters.',
      mathObjective:
        'min J(U, C) = ∑_{k=1}^K ∑_{i=1}^N (u_{ik})^m · ||x_i - c_k||² + λ_chute · Var(L_chute) + λ_depot · Dist(c_k, Depot_k)\n\nSubject to:\n1. Non-negative fuzzy partition: ∑_{k=1}^K u_{ik} = 1, ∀i ∈ {1..N}\n2. Chute throughput capacity: C_min ≤ ∑_{i ∈ Wave_c} PickCount_i ≤ C_max\n3. Vehicle capacity feasibility envelope: Vol(Order_i) ≤ BayVolume_k',
      inputContract:
        'OrderPoolDTO: Array of active SKU pick orders with 3D physical bounding dimensions (mm), weight (kg), aisle rack coordinates (x, y, z), order urgency SLA deadlines (ISO-8601), and hazardous material flags.',
      outputContract:
        'ClusterPartitionDTO: Macro-wave clusters mapped to specific AMR fleet partitions and designated depot chute hubs, with balanced pick loads and minimized dispersion radius.',
      invariants: [
        'Invariant R1: Order Integrity - Every active pick line belongs to exactly one cluster wave (∑_k u_ik = 1).',
        'Invariant R4: Chute Variance Bound - Chute pick induction variance σ²_chute ≤ 15% across all depot exits.',
        'Hazmat Isolation: Reactive chemicals are strictly partitioned into segregated AMR pick waves.',
      ],
      quantumSynergy:
        'Classiq SC-QFCM (Quantum Fuzzy C-Means) maps high-dimensional order features into quantum state registers |ψ_i⟩. Using quantum Swap-Test circuits, it evaluates pairwise state overlaps ⟨ψ_i | c_k⟩ with logarithmic gate depth O(log D), drastically reducing runtime during massive e-commerce flash-sale surges where classical feature clustering experiences dimensional bottlenecking.',
      tradeoffs:
        'A high fuzziness exponent (m > 2.2) provides ultra-smooth fleet workload distribution but may increase boundary transit. Low fuzziness (m < 1.3) creates tight spatial clusters but risks overloading single chutes.',
      algorithms: [
        { rank: 'RANK_1Q_QUANTUM_FCM', name: 'Classiq Quantum Fuzzy C-Means (SC-QFCM)', type: 'QUANTUM' },
        { rank: 'RANK_1_FCM_DR_SAA', name: 'Distributionally Robust SAA Clustering', type: 'CLASSICAL' },
      ],
      params: [
        { key: 'fcm_fuzziness_m', label: 'Fuzziness Exponent (m)', nominal: [1.2, 2.5] },
        { key: 'fcm_max_iter', label: 'Max Iterations', nominal: [20, 100] },
      ],
    },
    {
      id: 'tier2',
      title: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
      shortRole: 'Physical Bay Loading & Static Equilibrium',
      stageNumber: 2,
      icon: <Box size={18} color="#a855f7" />,
      accentColor: '#a855f7',
      desc: 'Orchestrates 3D parcel loading inside AMR bays with support area checks and Invariant R10 acyclicity.',
      industrialMeaning:
        'Tier 2 translates theoretical pick assignments into physical reality inside each AMR robot’s cargo bay. Parcels are three-dimensional physical entities with mass, dimensions, and fragility constraints. Tier 2 ensures that parcels are placed in stable stacks that will not tip over during AMR acceleration/cornering, and guarantees Last-In-First-Out (LIFO) pickup order so robots never have to unstack earlier parcels to access another.',
      mathObjective:
        'min CenterOfGravity_Z + α · WastedBayVolume\n\nSubject to:\n1. 3D Non-overlapping boxes: (x_i + l_i ≤ x_j) ∨ (x_j + l_j ≤ x_i) ∨ (y_i + w_i ≤ y_j) ...\n2. Friction cone stability: ||[F_x, F_y]||₂ ≤ μ · F_z against emergency braking a_max = 1.8 m/s²\n3. LIFO Acyclicity: DeliveryOrder(p_j) > DeliveryOrder(p_i) ⟹ p_j cannot physically support p_i\n4. Base Support Area: SupportSurface(p_i) ≥ η_min · Area(p_i)',
      inputContract:
        'ClusterPartitionDTO from Tier 1 + BoxDimensionsDTO (L, W, H mm, mass kg, max top-load bearing capacity N/m², and pick station sequence indices).',
      outputContract:
        'PackManifestDTO: Exact spatial coordinates (x, y, z) inside the AMR bay, orientation quaternion, center of gravity offset, support area percentage, and verified LIFO loading sequence.',
      invariants: [
        'Invariant R10: LIFO Acyclicity - Zero rehandling overhead. An item scheduled for earlier unloading must never be trapped under a later item (Φ_LIFO = 0).',
        'Static Stability: Minimum 80% base support surface contact (η_min ≥ 0.80) to prevent load shift during AMR emergency stops.',
      ],
      quantumSynergy:
        'Classiq Grover-amplified LIFO Oracle compiles topological sort graphs of parcel dependencies into quantum phase shifts. When dealing with irregular cargo geometries, the quantum oracle prunes invalid stacking combinations in O(√N) iterations.',
      tradeoffs:
        'Strict support ratios (η_min > 0.90) eliminate tipping hazards entirely but can reduce volumetric packing efficiency by 8-12%. Solver time limit can be scaled to trade between packing density and dispatch latency.',
      algorithms: [
        { rank: 'RANK_1_CPSAT_MISOCP', name: 'OR-Tools CP-SAT with Continuous MISOCP Bounds', type: 'CLASSICAL' },
      ],
      params: [
        { key: 'bpp_support_ratio_min', label: 'Min Support Surface Ratio (η_min)', nominal: [0.75, 0.95] },
        { key: 'friction_coeff_mu', label: 'Friction Coefficient (μ)', nominal: [0.3, 0.6] },
        { key: 'bpp_time_limit_sec', label: 'Solver Time Budget (sec)', nominal: [1.0, 5.0] },
      ],
    },
    {
      id: 'tier3',
      title: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
      shortRole: 'Combinatorial Fleet Tour Optimization',
      stageNumber: 3,
      icon: <GitFork size={18} color="#00e676" />,
      accentColor: '#00e676',
      desc: 'Optimizes closed tours across pick aisles and chutes respecting customer SLAs and battery limits.',
      industrialMeaning:
        'Tier 3 is the routing brain of the warehouse. Each AMR must visit multiple pick aisles, collect items according to the Tier 2 manifest, and deliver them to outbound depot chutes. Tier 3 computes the optimal sequence of stops for every vehicle to minimize total transit distance and fleet makespan while strictly respecting customer delivery deadlines, pick-window SLAs, and lithium battery state-of-charge limits.',
      mathObjective:
        'min ∑_{k ∈ Fleet} ∑_{i,j} c_{ij} · x_{ijk} + β · ∑_i max(0, t_i - Deadline_i) + P · Subtours\n\nSubject to:\n1. Depot Tour Conservation: ∑_j x_{depot, j, k} = ∑_i x_{i, depot, k} = 1, ∀k\n2. Time Window Adherence: Arrival_i ∈ [EarlyWindow_i, LateWindow_i]\n3. Battery Reserve: SOC(t) ≥ 15% across entire tour including return transit\n4. Subtour Elimination: u_i - u_j + N · x_{ij} ≤ N - 1 (Miller-Tucker-Zemlin constraints)',
      inputContract:
        'PackManifestDTO from Tier 2 + Warehouse distance & travel time matrix D_{ij}, AMR battery discharge coefficients, and order delivery SLA windows.',
      outputContract:
        'FleetTourDTO: Ordered sequence of waypoint stops for each AMR, estimated time of arrival (ETA), SLA margin, cumulative distance, and predicted battery consumption.',
      invariants: [
        'Invariant R2: Conservation of Flow - Every robot departs from and returns to an authorized depot.',
        'Invariant R3: Weight Capacity - Total payload on any tour arc never exceeds AMR rating (W_max = 500 kg).',
        'Invariant R5: Energy Reserve - Minimum 15% SOC buffer maintained at all times to prevent dead-battery aisle blockages.',
      ],
      quantumSynergy:
        'Classiq QAOA Subtour Circuit Synthesizer maps the vehicle routing problem onto a 32-qubit Ising spin Hamiltonian. Variational quantum ansatz circuits explore the vast combinatorial tour permutation space, leveraging quantum superposition and phase interference to escape local minima traps that trap classical solvers.',
      tradeoffs:
        'Aggressive makespan minimization spreads pick tasks evenly across all AMRs, increasing total fleet battery usage. Strict window penalties prioritize high-priority orders at the cost of slightly longer detour routes.',
      algorithms: [
        { rank: 'RANK_1Q_QAOA_ROUTING', name: 'Classiq QAOA Subtour Circuit Synthesizer', type: 'QUANTUM' },
        { rank: 'RANK_1_HGS_ADC', name: 'Hybrid Genetic Search with Adaptive Diversity Control', type: 'CLASSICAL' },
      ],
      params: [
        { key: 'vrp_penalty_delay_beta', label: 'Soft Window Lateness Penalty (β)', nominal: [1.0, 4.0] },
        { key: 'vrp_penalty_subtour_p', label: 'Subtour Penalty Multiplier (P)', nominal: [50.0, 200.0] },
      ],
    },
    {
      id: 'tier4',
      title: 'Tier 4: Continuous Swept Kinematics & ISO 3691-4 HRI',
      shortRole: 'Micro-Kinematic Trajectories & Human Safety',
      stageNumber: 4,
      icon: <Gauge size={18} color="#f59e0b" />,
      accentColor: '#f59e0b',
      desc: 'Generates conflict-free space-time trajectories with dynamic throttles in pedestrian corridors.',
      industrialMeaning:
        'Tier 4 executes the actual physical motion planning in continuous time. While Tier 3 determines the order of stops, Tier 4 computes the exact wheel velocities, acceleration curves, and steering headings along warehouse aisles. It constantly evaluates swept volumes to prevent robot-to-robot collisions and enforces ISO 3691-4 industrial safety standards when operating near human workers.',
      mathObjective:
        'min ∫₀^T ( ||jerk(t)||² + λ_centripetal · ||a_centripetal(t)||² + λ_time · 1 ) dt\n\nSubject to:\n1. Collision-Free Swept Volumes: min_{i ≠ j} ||p_i(t) - p_j(t)|| ≥ 2·R_AMR + D_safety, ∀t\n2. ISO 3691-4 Speed Restriction: ||v_i(t)|| ≤ 0.4 m/s whenever Dist(AMR_i, Human_h) < 1.5 m\n3. Non-Holonomic Limits: |v(t)| ≤ 1.6 m/s, |a(t)| ≤ 1.2 m/s², |ω(t)| ≤ 1.2 rad/s\n4. Verified Safety Invariant: Φ = max_t (ConflictRatio) < 1.0',
      inputContract:
        'FleetTourDTO from Tier 3 + Real-time warehouse topological map + Active human picker coordinates from LiDAR/camera safety zones.',
      outputContract:
        'KinematicTrajectoryDTO: Continuous micro-waypoint trajectory profiles (x, y, θ, v, ω) sampled at Δt = 0.05s intervals, with dynamic safety deceleration envelopes and collision certificates.',
      invariants: [
        'Safety Invariant Φ < 1.0 (Token: Verified): Mathematical proof of zero robot-robot and robot-human collision hazard along the entire temporal trajectory envelope.',
        'ISO 3691-4 Compliance: Dynamic speed throttling in shared collaborative human-robot zones.',
      ],
      quantumSynergy:
        'Classiq Spatiotemporal Conflict Oracle computes multi-robot reservation conflict graphs in Hilbert space, projecting phase kicks onto deadlock states at narrow aisle intersections to resolve multi-vehicle standoffs in O(1) oracle calls.',
      tradeoffs:
        'A fine SIPP time-step resolution (dt = 0.05s) guarantees razor-sharp motion smoothness and zero jerk but increases trajectory planning computation time. Larger dt (0.2s) computes faster but requires conservative safety margins.',
      algorithms: [
        { rank: 'RANK_1_PBS_SIPP', name: 'Priority-Based Search with Safe Interval Path Planning', type: 'CLASSICAL' },
      ],
      params: [
        { key: 'kinematics_step_dt', label: 'SIPP Time-Step Resolution (dt)', nominal: [0.05, 0.2] },
      ],
    },
  ];

  // Algorithms Data Catalog
  const algorithms: Record<string, AlgoDetail> = {
    RANK_1Q_QUANTUM_FCM: {
      rank: 'RANK_1Q_QUANTUM_FCM',
      name: 'Classiq Quantum Fuzzy C-Means (SC-QFCM)',
      tierId: 'tier1',
      tierTitle: 'Tier 1: Wave Decomposition & Macro-Clustering',
      type: 'QUANTUM',
      tagline: 'Quantum-accelerated fuzzy clustering via state-vector overlap kernels',
      meaning:
        'Classiq SC-QFCM encodes multi-dimensional order features (spatial coordinates, SKU weights, pick deadlines) into quantum states |ψ_i⟩ using amplitude and angle embedding. It replaces the classical O(N · D) distance calculation with a quantum Swap-Test circuit that evaluates state overlaps ⟨ψ_i | c_k⟩ across all cluster centroids simultaneously. This provides an exponential feature dimensionality advantage during large e-commerce order waves.',
      mathematicalFormulation:
        'Fuzzy Membership Update:\nu_{ik} = [ ∑_{j=1}^K ( (1 - |⟨ψ_i | c_k⟩|²) / (1 - |⟨ψ_i | c_j⟩|²) )^{1/(m-1)} ]⁻¹\n\nQuantum Kernel Metric:\nDistance d(x_i, c_k) = 2 · (1 - |⟨ψ_i | c_k⟩|)\n\nSwap-Test Measurement:\nP(|0⟩_ancilla) = 1/2 + 1/2 · |⟨ψ_i | c_k⟩|²',
      solverMechanics:
        'Compiled directly with Classiq QMOD. Uses 32 qubits (feature registers + ancilla), 1024 shots budget, 48 circuit depth, achieving 94.2% fidelity. The state preparation circuit initializes order vectors in parallel, and ancilla projective measurements compute overlap probabilities for classical fuzzy matrix updates.',
      codeOrStructureSnippet: `@qfunc swap_test_kernel(state1: QArray[QBit], state2: QArray[QBit], res: Output[QBit]) {
  anc: QBit;
  H(anc);
  control (anc) {
    swap_registers(state1, state2);
  }
  H(anc);
  res = anc;
}`,
      complexity: 'Quantum Step: O(p · log D) | Centroid Update: O(N · K) | Qubits: 32 | Gate Depth: 48',
      whenToUse:
        'Recommended when order feature dimensionality is high (SKU dimensions, multi-zone coordinates, velocity classes) and when wave decomposition latency must remain bounded under surge order volumes.',
      keyHyperparameters:
        'fcm_fuzziness_m (controls boundary overlap softness) and fcm_max_iter (number of quantum-classical expectation iterations).',
    },
    RANK_1_FCM_DR_SAA: {
      rank: 'RANK_1_FCM_DR_SAA',
      name: 'Distributionally Robust SAA Clustering',
      tierId: 'tier1',
      tierTitle: 'Tier 1: Wave Decomposition & Macro-Clustering',
      type: 'CLASSICAL',
      tagline: 'Empirical risk minimization over Wasserstein ambiguity balls',
      meaning:
        'This algorithm performs Fuzzy C-Means clustering enhanced with Sample Average Approximation (SAA) and Distributionally Robust Optimization (DRO). Rather than assuming deterministic pick times, it models order arrival variances within a Wasserstein distance ambiguity ball of historical order distributions, ensuring that generated pick waves remain robust against real-world warehouse delays.',
      mathematicalFormulation:
        'min_{C} sup_{P ∈ B_ε(P_empirical)} E_P [ ∑_{k=1}^K ∑_{i=1}^N u_{ik}^m · ||x_i - c_k||² ]\n\nDual Reformulation:\nmin_{C, λ, s_i} [ λ · ε + (1/N) · ∑_{i=1}^N s_i ]\ns.t. s_i ≥ J_FCM(x_i, C) - λ · ||x_i - x̂_i||, ∀i',
      solverMechanics:
        'Leverages vectorized NumPy/SciPy linear algebra kernels with multi-threaded OpenMP acceleration. Solves the robust dual form using warm-started coordinate descent across cluster centroid matrices.',
      codeOrStructureSnippet: `# Distributionally Robust SAA Inner Loop
for iteration in range(max_iter):
    dist_matrix = cdist(order_features, centroids, metric='euclidean')
    # Add Wasserstein robustness margin
    robust_dist = dist_matrix + epsilon * np.std(dist_matrix, axis=0)
    membership = 1.0 / (robust_dist ** (2 / (m - 1)))
    membership /= np.sum(membership, axis=1, keepdims=True)
    centroids = (membership.T @ order_features) / np.sum(membership.T, axis=1, keepdims=True)`,
      complexity: 'Time: O(I · N · K · D) | Space: O(N · K) | Threads: Auto-parallelized',
      whenToUse:
        'Ideal when historical order datasets show high variance in SKU pick times or when warehouse operations experience frequent item stockouts requiring dynamic wave re-allocation.',
      keyHyperparameters:
        'fcm_fuzziness_m (fuzziness exponent) and sample size N_samples.',
    },
    RANK_1_CPSAT_MISOCP: {
      rank: 'RANK_1_CPSAT_MISOCP',
      name: 'OR-Tools CP-SAT with Continuous MISOCP Bounds',
      tierId: 'tier2',
      tierTitle: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
      type: 'CLASSICAL',
      tagline: 'Combinatorial constraint programming with second-order cone stability',
      meaning:
        'A hybrid mathematical solver combining Google OR-Tools Constraint Programming with Satisfiability (CP-SAT) for 3D spatial box placement and continuous Mixed-Integer Second-Order Cone Programming (MISOCP) for physical stability. It guarantees both geometric feasibility and physical stability against AMR acceleration forces.',
      mathematicalFormulation:
        'Non-Overlapping Constraints:\nx_i + l_i ≤ x_j + M·(1 - b_x1) ∧ x_j + l_j ≤ x_i + M·(1 - b_x2) ...\n∑ b_{xyz} ≥ 1 (at least one spatial axis separates box i and j)\n\nFriction Cone (MISOCP):\n√((m_i · a_x)² + (m_i · a_y)²) ≤ μ · m_i · (g - a_z)\n\nSupport Area:\n∑_{j: supports i} Area(Overlap(i, j)) ≥ η_min · Area(i)',
      solverMechanics:
        'Uses lazy clause generation, boolean satisfiability unit propagation, and conflict-driven clause learning (CDCL). Continuous center-of-gravity and friction cone constraints are verified at branch nodes with fast quadratic feasibility cuts.',
      codeOrStructureSnippet: `model = cp_model.CpModel()
# 3D Box Interval Variables
x_intervals = [model.NewIntervalVar(x[i], l[i], x[i] + l[i], f'x_{i}') for i in items]
y_intervals = [model.NewIntervalVar(y[i], w[i], y[i] + w[i], f'y_{i}') for i in items]
z_intervals = [model.NewIntervalVar(z[i], h[i], z[i] + h[i], f'z_{i}') for i in items]
# 3D No-Overlap Constraint
model.AddNoOverlap2D(x_intervals, y_intervals)
# LIFO Precedence
for i, j in lifo_precedences:
    model.Add(z[j] >= z[i] + h[i])`,
      complexity: 'NP-Hard (CP-SAT presolve with CDCL achieves sub-second solutions for N ≤ 50 boxes)',
      whenToUse:
        'Always active for Tier 2 packing. Mandatory whenever parcel stacking safety and zero-rehandling LIFO pick sequences are required.',
      keyHyperparameters:
        'bpp_support_ratio_min (minimum support area), friction_coeff_mu (friction threshold), and bpp_time_limit_sec.',
    },
    RANK_1Q_QAOA_ROUTING: {
      rank: 'RANK_1Q_QAOA_ROUTING',
      name: 'Classiq QAOA Subtour Circuit Synthesizer',
      tierId: 'tier3',
      tierTitle: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
      type: 'QUANTUM',
      tagline: 'Parameterized variational quantum ansatz for multi-depot Hamiltonian routing cycles',
      meaning:
        'Classiq QAOA synthesizes a parameterized quantum circuit that encodes the multi-depot vehicle routing graph into an Ising spin Hamiltonian. Alternating layers of cost Hamiltonian H_C (distances + penalties) and mixer Hamiltonian H_M (Pauli-X operators) steer the quantum state toward bitstrings corresponding to valid, optimal tour routes with minimal makespan.',
      mathematicalFormulation:
        'Ising Hamiltonian:\nH_C = ∑_{i,j} d_{ij} · Z_i · Z_j + P · ∑_{subtours S} ( ∑_{i ∈ S, j ∉ S} (1 - Z_i Z_j)/2 - 1 )²\n\nVariational State:\n|ψ(γ, β)⟩ = ∏_{l=1}^p exp(-i · β_l · H_M) · exp(-i · γ_l · H_C) |+⟩^{⊗n}\n\nCost Functional:\n⟨H_C⟩(γ, β) = ⟨ψ(γ, β)| H_C |ψ(γ, β)⟩ → minimize via classical COBYLA/Adam optimizer',
      solverMechanics:
        'Synthesized with Classiq SDK using 32 qubits, 2 QAOA layers (p=2), 1024 measurement shots, and 48 circuit depth. Classical optimizer tunes parameters (γ, β) based on expectation values from quantum hardware/simulator sampling.',
      codeOrStructureSnippet: `@qfunc qaoa_ansatz(gamma: List[QReal], beta: List[QReal], q: QArray[QBit]) {
  // Uniform Superposition Initialization
  allocate(q);
  repeat (q.len) {
    H(q[index]);
  }
  // Alternating QAOA p-layers
  repeat (gamma.len) {
    cost_hamiltonian_evolution(gamma[index], q);
    mixer_hamiltonian_evolution(beta[index], q);
  }
}`,
      complexity: 'Circuit Depth: 2p · deg(G) | Shots: 1024 | Qubits: 32 | Solves in polynomial quantum evaluations',
      whenToUse:
        'Excels in highly congested multi-depot topologies where classical local search heuristics become trapped in sub-optimal tour clusters.',
      keyHyperparameters:
        'vrp_penalty_delay_beta (soft time window penalty) and vrp_penalty_subtour_p (subtour elimination multiplier).',
    },
    RANK_1_HGS_ADC: {
      rank: 'RANK_1_HGS_ADC',
      name: 'Hybrid Genetic Search with Adaptive Diversity Control',
      tierId: 'tier3',
      tierTitle: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
      type: 'CLASSICAL',
      tagline: 'State-of-the-art metaheuristic with Prins split algorithm and Pareto diversity management',
      meaning:
        'HGS-ADC represents the gold standard in classical vehicle routing heuristics. It operates on chromosome representations of tours without route delimiters, using Prins’ dynamic programming Split algorithm to partition giant tours into optimal vehicle routes. It maintains two separate sub-populations (feasible and infeasible solutions) and dynamically adjusts penalty parameters to explore the boundary of feasibility.',
      mathematicalFormulation:
        'Bi-Criterion Fitness Evaluation:\nFitness(P) = Cost(P) + λ_feas · Violation(P) + λ_div · DiversityContribution(P)\n\nBroken Pairs Distance:\nDist(P_1, P_2) = (1 / 2N) · ∑_{i=1}^N ( 1 - I{Succ(P_1, i) == Succ(P_2, i)} )\n\nAdaptive Penalty Updates:\nIf feasible_ratio > 0.3: λ_feas ← λ_feas / 1.2 | If feasible_ratio < 0.1: λ_feas ← λ_feas · 1.2',
      solverMechanics:
        'Features Order Crossover (OX), 2-Opt*, Relocate, and Swap neighborhood local search with restricted candidate lists. Achieves near-optimal solutions across hundreds of stops within seconds.',
      codeOrStructureSnippet: `# HGS-ADC Main Evolutionary Loop
population = initialize_diverse_population(orders, fleet_size)
while generation < max_generations:
    parent1, parent2 = tournament_selection(population)
    child = order_crossover_ox(parent1, parent2)
    repaired_child = local_search_neighborhood(child)
    split_routes = prins_split_algorithm(repaired_child, vehicle_capacity)
    population.add(split_routes)
    adaptive_diversity_management(population)`,
      complexity: 'O(N²) per generation | Typically executes 500 generations in 1.2 - 2.5 seconds',
      whenToUse:
        'Best for large-scale routing benchmarks (>60 stops) where high-speed deterministic execution and proven classical convergence are required.',
      keyHyperparameters:
        'vrp_penalty_delay_beta and population diversity thresholds.',
    },
    RANK_1_PBS_SIPP: {
      rank: 'RANK_1_PBS_SIPP',
      name: 'Priority-Based Search with Safe Interval Path Planning',
      tierId: 'tier4',
      tierTitle: 'Tier 4: Continuous Swept Kinematics & ISO 3691-4 HRI',
      type: 'CLASSICAL',
      tagline: 'Spatiotemporal conflict-tree search with continuous time reservation intervals',
      meaning:
        'PBS-SIPP is an advanced Multi-Agent Path Finding (MAPF) algorithm that plans non-colliding continuous trajectories for AMRs in 2D space and continuous time (x, y, t). SIPP compresses the continuous time domain into safe intervals between dynamic obstacles, while Priority-Based Search (PBS) resolves robot-robot conflicts by dynamically establishing priority orderings without exhaustive conflict trees.',
      mathematicalFormulation:
        'Safe Interval Definition:\nSafeInterval(u) = [t_start, t_end] s.t. ∀t ∈ [t_start, t_end]: dist(u, Obstacle_k(t)) > R_safe\n\nSIPP Transition Validity:\nArrive(v, t\') is valid if t\' ∈ SafeInterval(v) and edge (u, v) is collision-free during [t, t\']\n\nISO 3691-4 Clearance Invariant:\nΦ_HRI = max_{t, i, h} ( (R_human + R_AMR + D_ISO) / ||p_i(t) - p_h(t)|| ) < 1.0',
      solverMechanics:
        'Operates on a discrete topological warehouse road map with continuous spline interpolation. Generates smooth unicycle motion profiles respecting wheel acceleration and jerk limits.',
      codeOrStructureSnippet: `def plan_sipp_trajectory(start_node, goal_node, reservations, human_zones):
    open_set = PriorityQueue([(0, start_node, 0.0)]) # (f_score, node, time)
    while not open_set.empty():
        f, current, t_arr = open_set.pop()
        if current == goal_node:
            return reconstruct_trajectory(current)
        for neighbor in graph.neighbors(current):
            for interval in get_safe_intervals(neighbor, reservations):
                t_dep = max(t_arr, interval.start)
                if can_traverse(current, neighbor, t_dep, human_zones):
                    open_set.push((f + cost, neighbor, t_dep + travel_time))`,
      complexity: 'Polynomial scaling with fleet size | Plans trajectories for 8 AMRs across 200 nodes in <250ms',
      whenToUse:
        'Active for all Tier 4 kinematics. Ensures strict mathematical guarantees against robot-robot collisions and full ISO 3691-4 industrial safety compliance.',
      keyHyperparameters:
        'kinematics_step_dt (discretization resolution) and safety clearance margin D_safety.',
    },
  };

  // Helper getters
  const selectedTier = tiers.find((t) => t.id === (selectedItem.type === 'tier' ? selectedItem.id : selectedItem.tierId || 'tier1')) || tiers[0];
  const selectedAlgo = selectedItem.type === 'algo' ? algorithms[selectedItem.id] : null;


  // KaTeX rendering helper
  const renderLatex = (latex: string) => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<div style="color: #00f0ff; font-family: monospace;">${latex}</div>`;
    }
  };

  // TTS Speech Reader
  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = '';
    if (selectedItem.type === 'tier') {
      textToSpeak = `${selectedTier.title}. ${selectedTier.shortRole}. ${selectedTier.industrialMeaning} Key objective: ${selectedTier.mathObjective.split('\n')[0]}`;
    } else if (selectedAlgo) {
      textToSpeak = `${selectedAlgo.name}. ${selectedAlgo.tagline}. ${selectedAlgo.meaning}`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  // Copy Markdown to Clipboard
  const handleCopyExplanation = () => {
    let md = '';
    if (selectedItem.type === 'tier') {
      md = `# ${selectedTier.title}\n**Role**: ${selectedTier.shortRole}\n\n## Industrial Meaning\n${selectedTier.industrialMeaning}\n\n## Mathematical Objective\n\`\`\`\n${selectedTier.mathObjective}\n\`\`\`\n\n## Contracts & Invariants\n- **Input**: ${selectedTier.inputContract}\n- **Output**: ${selectedTier.outputContract}\n${selectedTier.invariants.map((inv) => `- ${inv}`).join('\n')}\n\n## Quantum Synergy\n${selectedTier.quantumSynergy}`;
    } else if (selectedAlgo) {
      md = `# ${selectedAlgo.name} (${selectedAlgo.type})\n**Tier**: ${selectedAlgo.tierTitle}\n**Tagline**: ${selectedAlgo.tagline}\n\n## Meaning\n${selectedAlgo.meaning}\n\n## Mathematical Formulation\n\`\`\`\n${selectedAlgo.mathematicalFormulation}\n\`\`\`\n\n## Solver Mechanics\n${selectedAlgo.solverMechanics}\n\n## Code / Architecture\n\`\`\`python\n${selectedAlgo.codeOrStructureSnippet}\n\`\`\`\n\n## Complexity & When to Use\n- **Complexity**: ${selectedAlgo.complexity}\n- **When to Use**: ${selectedAlgo.whenToUse}`;
    }

    navigator.clipboard.writeText(md).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#050810',
        overflow: 'hidden',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#080c18',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f0f4f8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="#00f0ff" />
            Hierarchical Optimization Tiers & Algorithm Catalog
          </h2>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '3px' }}>
            Click any Tier header or Algorithm name to inspect detailed mathematical meaning, DTO contracts, and solver mechanics.
          </div>
        </div>

        {/* Sub-Panel Toggle Button */}
        <button
          onClick={() => setIsSubPanelOpen(!isSubPanelOpen)}
          style={{
            padding: '8px 14px',
            borderRadius: '6px',
            border: isSubPanelOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
            backgroundColor: isSubPanelOpen ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.04)',
            color: isSubPanelOpen ? '#00f0ff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
        >
          <BookOpen size={15} />
          {isSubPanelOpen ? 'Hide Explanation Sub-Panel' : 'Show Explanation Sub-Panel'}
        </button>
      </div>

      {/* Main Content Area (Split between Cards and Sub-Panel) */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
        {/* Left Area: Visual Pipeline + Tier Cards Grid */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto',
            padding: '16px 20px',
            paddingBottom: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Visual Pipeline Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: '#0c101c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              overflowX: 'auto',
              gap: '10px',
            }}
          >
            {tiers.map((t, idx) => {
              const isTierInspected = selectedItem.type === 'tier' && selectedItem.id === t.id;
              const isTierAlgoInspected = selectedItem.type === 'algo' && selectedItem.tierId === t.id;
              const isSelected = isTierInspected || isTierAlgoInspected;
              const isQuantum = activeTiers[t.id]?.includes('QUANTUM');

              return (
                <React.Fragment key={t.id}>
                  <div
                    onClick={() => {
                      setSelectedItem({ type: 'tier', id: t.id });
                      if (!isSubPanelOpen) setIsSubPanelOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      minWidth: '190px',
                    }}
                    title="Click to inspect this Tier in the Explanation Sub-Panel"
                  >
                    <div
                      style={{
                        padding: '6px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {t.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
                        STAGE {t.stageNumber}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
                        {t.title.split(':')[0]}
                      </div>
                      <div style={{ fontSize: '10px', color: isQuantum ? '#00f0ff' : '#a855f7', fontWeight: 600 }}>
                        {isQuantum ? '⚡ Quantum Co-Proc' : '⚙️ Classical'}
                      </div>
                    </div>
                  </div>
                  {idx < tiers.length - 1 && <ArrowRight size={16} color="#334155" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Interactive Tier & Parameter Intelligence Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              backgroundColor: '#0c101c',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#00f0ff',
                }}
              >
                <Sparkles size={22} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4f8' }}>
                  Calculation Tiers & Parameter Optimization Intelligence
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  Inspect parameter influence curves, mathematical formulations, operational problem-solving stages, and domain acronyms.
                </div>
              </div>
            </div>

            {/* Quick Filter Dossier Triggers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setSelectedItem({ type: 'tier', id: 'tier1' });
                  setSubPanelTab('param_deepdive');
                  if (!isSubPanelOpen) setIsSubPanelOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Info size={13} />
                <span>Param Deep-Dive</span>
              </button>

              <button
                onClick={() => {
                  setSelectedItem({ type: 'tier', id: 'tier1' });
                  setSubPanelTab('problem_solving');
                  if (!isSubPanelOpen) setIsSubPanelOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(0, 240, 255, 0.4)',
                  backgroundColor: 'rgba(0, 240, 255, 0.1)',
                  color: '#00f0ff',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <ShieldCheck size={13} />
                <span>Problem Solving</span>
              </button>

              <button
                onClick={() => {
                  setSelectedItem({ type: 'tier', id: 'tier1' });
                  setSubPanelTab('math');
                  if (!isSubPanelOpen) setIsSubPanelOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(56, 189, 248, 0.4)',
                  backgroundColor: 'rgba(56, 189, 248, 0.1)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Cpu size={13} />
                <span>Math & Formulations</span>
              </button>

              <button
                onClick={() => {
                  setSelectedItem({ type: 'tier', id: 'tier1' });
                  setSubPanelTab('acronyms');
                  if (!isSubPanelOpen) setIsSubPanelOpen(true);
                }}
                style={{
                  padding: '7px 12px',
                  borderRadius: '6px',
                  border: '1px solid rgba(168, 85, 247, 0.4)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  color: '#c084fc',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <BookOpen size={13} />
                <span>Glossary</span>
              </button>
            </div>
          </div>

          {/* Tier Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
            {tiers.map((tier) => {
              const isTierInspected = selectedItem.type === 'tier' && selectedItem.id === tier.id;

              return (
                <div
                  key={tier.id}
                  style={{
                    backgroundColor: '#0c101c',
                    border: isTierInspected
                      ? `1px solid ${tier.accentColor}`
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: isTierInspected ? `0 0 16px ${tier.accentColor}25` : 'none',
                    borderRadius: '10px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Card Header (Clickable for Tier Inspection) */}
                  <div
                    onClick={() => {
                      setSelectedItem({ type: 'tier', id: tier.id });
                      if (!isSubPanelOpen) setIsSubPanelOpen(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      padding: '8px',
                      margin: '-8px -8px 0 -8px',
                      borderRadius: '8px',
                      backgroundColor: isTierInspected ? 'rgba(255, 255, 255, 0.03)' : 'transparent',
                    }}
                    title="Click to view detailed meaning of this Tier"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255, 255, 255, 0.04)' }}>
                        {tier.icon}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#f0f4f8' }}>
                            {tier.title}
                          </h3>
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                          {tier.shortRole}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: isTierInspected ? tier.accentColor : '#64748b',
                        fontWeight: 600,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: isTierInspected ? `${tier.accentColor}18` : 'rgba(255, 255, 255, 0.02)',
                        border: isTierInspected ? `1px solid ${tier.accentColor}40` : '1px solid transparent',
                      }}
                    >
                      <Info size={13} />
                      {isTierInspected ? 'Inspecting Tier' : 'Inspect Tier'}
                    </div>
                  </div>

                  {/* Algorithm Selector with Clickable Meaning Inspection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                      Active Solver Algorithm Rank:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {tier.algorithms.map((algo) => {
                        const isSelected = (activeTiers[tier.id] || tier.algorithms[0].rank) === algo.rank;
                        const isAlgoInspected = selectedItem.type === 'algo' && selectedItem.id === algo.rank;

                        return (
                          <div
                            key={algo.rank}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              borderRadius: '6px',
                              border: isAlgoInspected
                                ? '1px solid #00f0ff'
                                : isSelected
                                ? '1px solid rgba(0, 240, 255, 0.4)'
                                : '1px solid rgba(255, 255, 255, 0.08)',
                              backgroundColor: isAlgoInspected
                                ? 'rgba(0, 240, 255, 0.12)'
                                : isSelected
                                ? 'rgba(0, 240, 255, 0.05)'
                                : 'rgba(255, 255, 255, 0.02)',
                              transition: 'all 0.2s ease',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Algorithm Selection Button */}
                            <button
                              onClick={() => {
                                onSelectTierAlgorithm(tier.id, algo.rank);
                                setSelectedItem({ type: 'algo', id: algo.rank, tierId: tier.id });
                                if (!isSubPanelOpen) setIsSubPanelOpen(true);
                              }}
                              style={{
                                flex: 1,
                                padding: '10px 12px',
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: isSelected || isAlgoInspected ? '#f0f4f8' : '#94a3b8',
                                cursor: 'pointer',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '12px',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: isSelected ? '#00e676' : '#64748b',
                                  }}
                                />
                                <span style={{ fontWeight: isSelected ? 700 : 500 }}>{algo.name}</span>
                              </div>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    algo.type === 'QUANTUM' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                  color: algo.type === 'QUANTUM' ? '#00f0ff' : '#a855f7',
                                  fontWeight: 700,
                                }}
                              >
                                {algo.type}
                              </span>
                            </button>

                            {/* Dedicated "Meaning & Details" Inspector Trigger */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedItem({ type: 'algo', id: algo.rank, tierId: tier.id });
                                if (!isSubPanelOpen) setIsSubPanelOpen(true);
                              }}
                              title="Click to inspect detailed meaning and math of this algorithm"
                              style={{
                                padding: '10px 12px',
                                border: 'none',
                                borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
                                backgroundColor: isAlgoInspected ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                                color: isAlgoInspected ? '#00f0ff' : '#64748b',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <Info size={13} />
                              <span>Meaning</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Parameter Cards */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                      Tier Mathematical Hyperparameters:
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {tier.params.map((p) => {
                        const spec = CONFIG_LIMITS[p.key];
                        if (!spec) return null;
                        const currentVal = tierParams[p.key] !== undefined ? tierParams[p.key] : spec.default;
                        const isParamSelected = selectedItem.type === 'param' && selectedItem.id === p.key;
                        return (
                          <ParameterCard
                            key={p.key}
                            label={p.label}
                            paramKey={p.key}
                            spec={spec}
                            value={currentVal}
                            onChange={(val) => onChangeTierParam(p.key, val)}
                            nominalRange={p.nominal}
                            isSelected={isParamSelected}
                            onInspect={() => {
                              setSelectedParamKey(p.key);
                              setSelectedItem({ type: 'param', id: p.key, tierId: tier.id });
                              setSubPanelTab('param_deepdive');
                              if (!isSubPanelOpen) setIsSubPanelOpen(true);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sub-Panel: Dedicated Detailed Meaning & Architecture Inspector */}
        {isSubPanelOpen && (
          <div
            style={{
              width: '420px',
              maxWidth: '44vw',
              minWidth: '320px',
              minHeight: 0,
              borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: '#070a14',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              zIndex: 10,
              overflow: 'hidden',
            }}
          >
            {/* Sub-Panel Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0c101c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                <div
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedItem.type === 'param' ? (
                    <Cpu size={18} color="#f59e0b" />
                  ) : selectedItem.type === 'tier' ? (
                    selectedTier.icon
                  ) : (
                    <Sparkles size={18} color="#00f0ff" />
                  )}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor:
                          selectedItem.type === 'param'
                            ? 'rgba(245, 158, 11, 0.2)'
                            : selectedItem.type === 'tier'
                            ? 'rgba(0, 240, 255, 0.2)'
                            : selectedAlgo?.type === 'QUANTUM'
                            ? 'rgba(0, 240, 255, 0.2)'
                            : 'rgba(168, 85, 247, 0.2)',
                        color:
                          selectedItem.type === 'param'
                            ? '#f59e0b'
                            : selectedItem.type === 'tier'
                            ? '#00f0ff'
                            : selectedAlgo?.type === 'QUANTUM'
                            ? '#00f0ff'
                            : '#a855f7',
                      }}
                    >
                      {selectedItem.type === 'param'
                        ? 'PARAMETER DOSSIER'
                        : selectedItem.type === 'tier'
                        ? `TIER ${selectedTier.stageNumber} EXPLANATION`
                        : `${selectedAlgo?.type} ALGORITHM`}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      color: '#f0f4f8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      marginTop: '2px',
                    }}
                  >
                    {selectedItem.type === 'param'
                      ? TIER_PARAMS_DOSSIER[selectedItem.id]?.name || selectedItem.id
                      : selectedItem.type === 'tier'
                      ? selectedTier.title
                      : selectedAlgo?.name}
                  </div>
                </div>
              </div>

              {/* Action Buttons: TTS, Copy, Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={handleToggleSpeech}
                  title={isSpeaking ? 'Stop voice readout' : 'Listen to voice readout'}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isSpeaking ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isSpeaking ? '#00e676' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>

                <button
                  onClick={handleCopyExplanation}
                  title="Copy markdown explanation"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: isCopied ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: isCopied ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                </button>

                <button
                  onClick={() => setIsSubPanelOpen(false)}
                  title="Close explanation sub-panel"
                  style={{
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Quick-Switch Chips Bar */}
            <div
              style={{
                padding: '8px 16px',
                backgroundColor: '#090d19',
                borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                overflowX: 'auto',
              }}
            >
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginRight: '4px' }}>
                Tiers:
              </span>
              {tiers.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedItem({ type: 'tier', id: t.id })}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border:
                      selectedItem.type === 'tier' && selectedItem.id === t.id
                        ? '1px solid #00f0ff'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    backgroundColor:
                      selectedItem.type === 'tier' && selectedItem.id === t.id
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.02)',
                    color:
                      selectedItem.type === 'tier' && selectedItem.id === t.id
                        ? '#00f0ff'
                        : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  T{t.stageNumber}
                </button>
              ))}
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }} />
              {Object.values(algorithms).map((a) => (
                <button
                  key={a.rank}
                  onClick={() => setSelectedItem({ type: 'algo', id: a.rank, tierId: a.tierId })}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border:
                      selectedItem.type === 'algo' && selectedItem.id === a.rank
                        ? '1px solid #00f0ff'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    backgroundColor:
                      selectedItem.type === 'algo' && selectedItem.id === a.rank
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.02)',
                    color:
                      selectedItem.type === 'algo' && selectedItem.id === a.rank
                        ? '#00f0ff'
                        : a.type === 'QUANTUM'
                        ? '#38bdf8'
                        : '#c084fc',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {a.name.split(' ')[0]}
                </button>
              ))}
              <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255, 255, 255, 0.1)', margin: '0 2px' }} />
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, margin: '0 2px' }}>Params:</span>
              {Object.values(TIER_PARAMS_DOSSIER).map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    setSelectedParamKey(p.key);
                    setSelectedItem({ type: 'param', id: p.key, tierId: p.tierId });
                    setSubPanelTab('param_deepdive');
                    if (!isSubPanelOpen) setIsSubPanelOpen(true);
                  }}
                  style={{
                    padding: '3px 7px',
                    borderRadius: '4px',
                    border:
                      selectedItem.type === 'param' && selectedItem.id === p.key
                        ? '1px solid #f59e0b'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                    backgroundColor:
                      selectedItem.type === 'param' && selectedItem.id === p.key
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(255, 255, 255, 0.02)',
                    color:
                      selectedItem.type === 'param' && selectedItem.id === p.key
                        ? '#f59e0b'
                        : '#94a3b8',
                    fontSize: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.symbol}
                </button>
              ))}
            </div>

            {/* Sub-Panel Tabs Navigation */}
            <div
              style={{
                display: 'flex',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0c101c',
                overflowX: 'auto',
              }}
            >
              {[
                { id: 'meaning', label: 'Meaning & Role' },
                { id: 'param_deepdive', label: 'Param Deep-Dive' },
                { id: 'problem_solving', label: 'Problem Solving' },
                { id: 'math', label: 'Calculations & Math' },
                { id: 'acronyms', label: 'Acronyms' },
                { id: 'contracts', label: selectedItem.type === 'algo' ? 'Complexity' : 'Contracts' },
                { id: 'solver', label: selectedItem.type === 'algo' ? 'Code Snippet' : 'Quantum Synergy' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSubPanelTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: '10px 4px',
                    border: 'none',
                    borderBottom: subPanelTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
                    backgroundColor: 'transparent',
                    color: subPanelTab === tab.id ? '#00f0ff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sub-Panel Body (Scrollable Details) */}
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '18px 20px',
                paddingBottom: '28px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#cbd5e1',
              }}
            >
              {/* ===================== TIER EXPLANATION VIEW ===================== */}
              {(selectedItem.type === 'tier' || selectedItem.type === 'param') && (
                <>
                  {subPanelTab === 'meaning' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 240, 255, 0.06)',
                          border: '1px solid rgba(0, 240, 255, 0.2)',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '4px' }}>
                          INDUSTRIAL LOGISTICS ROLE
                        </div>
                        <div style={{ fontSize: '12px', color: '#f0f4f8' }}>{selectedTier.shortRole}</div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          System Purpose & WMS Context
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                          {selectedTier.industrialMeaning}
                        </p>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          Operational Trade-Offs
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                          {selectedTier.tradeoffs}
                        </p>
                      </div>

                      {/* Associated Algorithms in this Tier */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '8px' }}>
                          Available Algorithmic Solvers
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {selectedTier.algorithms.map((algo) => (
                            <div
                              key={algo.rank}
                              onClick={() => setSelectedItem({ type: 'algo', id: algo.rank, tierId: selectedTier.id })}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                cursor: 'pointer',
                              }}
                            >
                              <span style={{ fontSize: '12px', color: '#f0f4f8', fontWeight: 500 }}>
                                {algo.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    algo.type === 'QUANTUM' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                                  color: algo.type === 'QUANTUM' ? '#00f0ff' : '#a855f7',
                                  fontWeight: 700,
                                }}
                              >
                                {algo.type} ➔
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Parameter Deep Dive Tab */}
                  {subPanelTab === 'param_deepdive' && (() => {
                    const currentParamKey = selectedItem.type === 'param' ? selectedItem.id : (selectedTier.params[0]?.key || 'fcm_fuzziness_m');
                    const pDossier = TIER_PARAMS_DOSSIER[currentParamKey] || TIER_PARAMS_DOSSIER['fcm_fuzziness_m'];
                    const currentVal = tierParams[pDossier.key] !== undefined ? tierParams[pDossier.key] : pDossier.defaultValue;

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Parameter Quick Switcher */}
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {Object.values(TIER_PARAMS_DOSSIER)
                            .filter(p => selectedItem.type !== 'tier' || p.tierId === selectedTier.id)
                            .map((p) => {
                              const isCur = p.key === pDossier.key;
                              return (
                                <button
                                  key={p.key}
                                  onClick={() => {
                                    setSelectedParamKey(p.key);
                                    setSelectedItem({ type: 'param', id: p.key, tierId: p.tierId });
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    border: isCur ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
                                    backgroundColor: isCur ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                                    color: isCur ? '#f59e0b' : '#94a3b8',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {p.symbol} ({p.name.split(' ')[0]})
                                </button>
                              );
                            })}
                        </div>

                        {/* Parameter Title Card */}
                        <div
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.25)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div>
                              <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.5px' }}>
                                {pDossier.tierName.toUpperCase()}
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8', marginTop: '2px' }}>
                                {pDossier.name}
                              </div>
                            </div>
                            <span style={{ fontSize: '12px', fontFamily: 'monospace', fontWeight: 700, color: '#f59e0b', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                              Current: {currentVal} {pDossier.unit}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                            {pDossier.description}
                          </div>
                        </div>

                        {/* Mathematical Role Formula */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '4px' }}>
                            Mathematical Role & Loss Function Embedding
                          </div>
                          <div
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#03050c',
                              border: '1px solid rgba(0, 240, 255, 0.2)',
                              overflowX: 'auto',
                            }}
                            dangerouslySetInnerHTML={{ __html: renderLatex(pDossier.mathematicalRole) }}
                          />
                        </div>

                        {/* Values Changing Influence Card (Low, Optimal, High) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4f8' }}>
                            Values Changing Influence Matrix:
                          </div>

                          {/* Low Value */}
                          <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(59, 130, 246, 0.06)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', marginBottom: '2px' }}>
                              📉 Low Value Regime (Under &lt; {pDossier.nominalRange[0]} {pDossier.unit})
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                              {pDossier.lowValueInfluence}
                            </div>
                          </div>

                          {/* Optimal Value */}
                          <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#00e676', marginBottom: '2px' }}>
                              🎯 Nominal Optimal Regime ({pDossier.nominalRange[0]} – {pDossier.nominalRange[1]} {pDossier.unit})
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                              {pDossier.optimalValueInfluence}
                            </div>
                          </div>

                          {/* High Value */}
                          <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                              📈 High Value Stress Regime (Over &gt; {pDossier.nominalRange[1]} {pDossier.unit})
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                              {pDossier.highValueInfluence}
                            </div>
                          </div>
                        </div>

                        {/* Operational Impact & Failure Mode */}
                        <div style={{ padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4f8', marginBottom: '4px' }}>
                            Operational Dispatch Impact:
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '8px' }}>
                            {pDossier.operationalImpact}
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#f87171', marginBottom: '2px' }}>
                            ⚠️ Failure Mode If Misconfigured:
                          </div>
                          <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: '1.5' }}>
                            {pDossier.failureModeIfMisconfigured}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Problem Solving Tab */}
                  {subPanelTab === 'problem_solving' && (() => {
                    const currentTierId = selectedItem.type === 'tier' ? selectedItem.id : (selectedItem.tierId || 'tier1');
                    const pSolve = TIER_PROBLEM_SOLVING_DOSSIER[currentTierId] || TIER_PROBLEM_SOLVING_DOSSIER['tier1'];

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {/* Target Restrictions Badges */}
                        <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: 'rgba(0, 240, 255, 0.06)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', marginBottom: '6px', letterSpacing: '0.5px' }}>
                            TARGET OPERATIONAL RESTRICTIONS SOLVED
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {pSolve.targetRestrictions.map((r, i) => (
                              <span key={i} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', fontWeight: 600, border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                                {r}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Core Problem Statement */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '4px' }}>
                            Operational Problem Statement
                          </div>
                          <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.6', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            {pSolve.problemStatement}
                          </div>
                        </div>

                        {/* Classical Bottlenecks & Failure Modes */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                            Classical Heuristic / Exact Failure Modes
                          </div>
                          <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: '1.6', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                            {pSolve.classicalBottlenecks}
                          </div>
                        </div>

                        {/* Tier Solving Mechanism */}
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#00e676', marginBottom: '4px' }}>
                            Algorithmic Resolution Engine
                          </div>
                          <div style={{ fontSize: '11px', color: '#a7f3d0', lineHeight: '1.6', padding: '10px 12px', borderRadius: '6px', backgroundColor: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.25)' }}>
                            {pSolve.tierSolvingMechanism}
                          </div>
                        </div>

                        {/* Invariant & Downstream */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>VERIFICATION INVARIANT:</span>
                              <CodeLmnBadge variant="pill" label="Verified" />
                            </div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{pSolve.verificationInvariant}</div>
                          </div>
                          <div style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#a855f7', marginBottom: '2px' }}>DOWNSTREAM HANDOFF:</div>
                            <div style={{ fontSize: '11px', color: '#cbd5e1' }}>{pSolve.downstreamHandoff}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Acronyms Tab */}
                  {subPanelTab === 'acronyms' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '2px' }}>
                        Domain Abbreviations & Acronyms Glossary
                      </div>
                      {TIER_ACRONYMS_DOSSIER.map((acr) => (
                        <div
                          key={acr.term}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>
                              {acr.term}
                            </span>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>
                              {acr.tier}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#f0f4f8', marginBottom: '4px' }}>
                            {acr.expansion}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.5', marginBottom: '4px' }}>
                            {acr.definition}
                          </div>
                          <div style={{ fontSize: '10px', color: '#38bdf8', fontStyle: 'italic' }}>
                            Context: {acr.contextUsage}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}


                  {subPanelTab === 'math' && (() => {
                    const currentTierId = selectedItem.type === 'tier' ? selectedItem.id : (selectedItem.tierId || 'tier1');
                    const tierCalcs = TIER_CALCULATIONS_DOSSIER.filter(c => c.tierId === currentTierId);

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
                          Rigorous Optimization Objectives & Calculations
                        </div>

                        {/* Calculations Dossier Cards with KaTeX */}
                        {tierCalcs.map((calc, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '14px',
                              borderRadius: '8px',
                              backgroundColor: '#0c101c',
                              border: '1px solid rgba(0, 240, 255, 0.2)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff' }}>
                                {calc.metricName}
                              </span>
                              <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#38bdf8' }}>
                                {calc.symbol}
                              </span>
                            </div>

                            {/* KaTeX Formula Display */}
                            <div
                              style={{
                                padding: '10px',
                                borderRadius: '6px',
                                backgroundColor: '#03050c',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                overflowX: 'auto',
                              }}
                              dangerouslySetInnerHTML={{ __html: renderLatex(calc.latexFormula) }}
                            />

                            <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: '1.5' }}>
                              <strong style={{ color: '#f0f4f8' }}>Operational Meaning:</strong> {calc.operationalMeaning}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4' }}>
                              <strong style={{ color: '#60a5fa' }}>Interpretation:</strong> {calc.numericalInterpretation}
                            </div>
                            <div style={{ fontSize: '10px', color: '#34d399', lineHeight: '1.4' }}>
                              <strong style={{ color: '#00e676' }}>Decision Rule:</strong> {calc.decisionRule}
                            </div>
                          </div>
                        ))}

                        {/* Raw Objective Reference */}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px' }}>
                            Full Math Formulation & Boundary Constraints
                          </div>
                          <div
                            style={{
                              padding: '12px',
                              borderRadius: '8px',
                              backgroundColor: '#03050c',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              fontFamily: 'Consolas, Monaco, monospace',
                              fontSize: '11px',
                              color: '#38bdf8',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.7',
                            }}
                          >
                            {selectedTier.mathObjective}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {subPanelTab === 'contracts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Input Contract */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          📥 Ingested Input Contract
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px',
                            color: '#cbd5e1',
                          }}
                        >
                          {selectedTier.inputContract}
                        </div>
                      </div>

                      {/* Output Contract */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          📤 Emitted Output Contract
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px',
                            color: '#cbd5e1',
                          }}
                        >
                          {selectedTier.outputContract}
                        </div>
                      </div>

                      {/* Invariants */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          🛡️ Physical & Cryptographic Invariants
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {selectedTier.invariants.map((inv, i) => (
                            <div
                              key={i}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(0, 230, 118, 0.05)',
                                border: '1px solid rgba(0, 230, 118, 0.2)',
                                fontSize: '11px',
                                color: '#a7f3d0',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '8px',
                              }}
                            >
                              <ShieldCheck size={14} color="#00e676" style={{ marginTop: '2px', flexShrink: 0 }} />
                              <div style={{ flex: 1 }}>
                                {inv.includes('(Token: Verified)') || inv.includes('(Token: lmn)') ? (
                                  <span>
                                    {inv.replace('(Token: Verified)', '').replace('(Token: lmn)', '')}{' '}
                                    <CodeLmnBadge variant="token" label="Verified" />
                                  </span>
                                ) : (
                                  <span>{inv}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {subPanelTab === 'solver' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid rgba(0, 240, 255, 0.25)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Sparkles size={14} color="#00f0ff" />
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff' }}>
                            CLASSIQ QUANTUM INTEGRATION
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#f0f4f8', lineHeight: '1.6' }}>
                          {selectedTier.quantumSynergy}
                        </div>
                      </div>

                      {onNavigateToQuantumStudio && (
                        <button
                          onClick={onNavigateToQuantumStudio}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #00f0ff',
                            backgroundColor: 'rgba(0, 240, 255, 0.1)',
                            color: '#00f0ff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <ExternalLink size={14} />
                          Open Classiq Quantum Studio
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* ===================== ALGORITHM EXPLANATION VIEW ===================== */}
              {selectedItem.type === 'algo' && selectedAlgo && (
                <>
                  {subPanelTab === 'meaning' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div
                        style={{
                          padding: '12px 14px',
                          borderRadius: '8px',
                          backgroundColor:
                            selectedAlgo.type === 'QUANTUM'
                              ? 'rgba(0, 240, 255, 0.08)'
                              : 'rgba(168, 85, 247, 0.08)',
                          border:
                            selectedAlgo.type === 'QUANTUM'
                              ? '1px solid rgba(0, 240, 255, 0.25)'
                              : '1px solid rgba(168, 85, 247, 0.25)',
                        }}
                      >
                        <div
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: selectedAlgo.type === 'QUANTUM' ? '#00f0ff' : '#c084fc',
                            marginBottom: '4px',
                          }}
                        >
                          {selectedAlgo.type} SOLVER ARCHETYPE
                        </div>
                        <div style={{ fontSize: '12px', color: '#f0f4f8', fontWeight: 600 }}>
                          {selectedAlgo.tagline}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          Detailed Meaning & Computational Mechanics
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                          {selectedAlgo.meaning}
                        </p>
                      </div>

                      {/* Active Status Badge & Activate Button */}
                      <div
                        style={{
                          padding: '12px',
                          borderRadius: '8px',
                          backgroundColor: '#0c101c',
                          border: '1px solid rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>DISPATCH STATUS</div>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color:
                                activeTiers[selectedAlgo.tierId] === selectedAlgo.rank ? '#00e676' : '#94a3b8',
                            }}
                          >
                            {activeTiers[selectedAlgo.tierId] === selectedAlgo.rank
                              ? 'Active Dispatch Solver'
                              : 'Standby Alternate'}
                          </div>
                        </div>

                        {activeTiers[selectedAlgo.tierId] !== selectedAlgo.rank && (
                          <button
                            onClick={() => onSelectTierAlgorithm(selectedAlgo.tierId, selectedAlgo.rank)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #00f0ff',
                              backgroundColor: 'rgba(0, 240, 255, 0.1)',
                              color: '#00f0ff',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Set As Active Solver
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {subPanelTab === 'math' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
                        Mathematical Formulation & Loss Functions
                      </div>
                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          backgroundColor: '#03050c',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '11px',
                          color: '#38bdf8',
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.7',
                        }}
                      >
                        {selectedAlgo.mathematicalFormulation}
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          Internal Solver Mechanics
                        </div>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '12px', lineHeight: '1.6' }}>
                          {selectedAlgo.solverMechanics}
                        </p>
                      </div>
                    </div>
                  )}

                  {subPanelTab === 'contracts' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Complexity */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          ⚡ Computational Complexity & Resource Footprint
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px',
                            fontFamily: 'Consolas, monospace',
                            color: '#38bdf8',
                          }}
                        >
                          {selectedAlgo.complexity}
                        </div>
                      </div>

                      {/* When to Use */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          🎯 Industrial Application Guidance: When to Use
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px',
                            color: '#cbd5e1',
                            lineHeight: '1.6',
                          }}
                        >
                          {selectedAlgo.whenToUse}
                        </div>
                      </div>

                      {/* Key Hyperparameters */}
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px' }}>
                          🎛️ Sensitivity to Mathematical Hyperparameters
                        </div>
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            backgroundColor: '#0c101c',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '11px',
                            color: '#cbd5e1',
                            lineHeight: '1.6',
                          }}
                        >
                          {selectedAlgo.keyHyperparameters}
                        </div>
                      </div>
                    </div>
                  )}

                  {subPanelTab === 'solver' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#f0f4f8' }}>
                        {selectedAlgo.type === 'QUANTUM'
                          ? 'Classiq QMOD Synthesizer Specification'
                          : 'Classical Algorithmic Loop Implementation'}
                      </div>
                      <div
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          backgroundColor: '#03050c',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '11px',
                          color: '#a7f3d0',
                          whiteSpace: 'pre-wrap',
                          overflowX: 'auto',
                          lineHeight: '1.6',
                        }}
                      >
                        {selectedAlgo.codeOrStructureSnippet}
                      </div>

                      {selectedAlgo.type === 'QUANTUM' && onNavigateToQuantumStudio && (
                        <button
                          onClick={onNavigateToQuantumStudio}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '6px',
                            border: '1px solid #00f0ff',
                            backgroundColor: 'rgba(0, 240, 255, 0.1)',
                            color: '#00f0ff',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                          }}
                        >
                          <Zap size={14} />
                          Inspect In Classiq Quantum Studio
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sub-Panel Footer */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                backgroundColor: '#0c101c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#64748b',
              }}
            >
              <CodeLmnBadge variant="token" label="Invariant Certified: Verified" />
              <span style={{ color: '#00e676', fontWeight: 600 }}>Φ &lt; 1.0 Verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
