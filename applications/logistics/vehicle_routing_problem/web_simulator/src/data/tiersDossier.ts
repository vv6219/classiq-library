export interface TierParamDetailedInfluence {
  key: string;
  name: string;
  symbol: string;
  tierId: string;
  tierName: string;
  category: 'Clustering' | '3D Bin Packing' | 'Vehicle Routing' | 'Kinematics & Safety' | 'Quantum Synthesis';
  unit: string;
  defaultValue: number;
  nominalRange: [number, number];
  allowedRange: [number, number];
  step: number;
  description: string;
  mathematicalRole: string;
  lowValueInfluence: string;
  optimalValueInfluence: string;
  highValueInfluence: string;
  operationalImpact: string;
  failureModeIfMisconfigured: string;
}

export interface TierProblemSolving {
  tierId: string;
  tierNumber: number;
  title: string;
  shortRole: string;
  targetRestrictions: string[]; // e.g. ['R8', 'R9', 'R13', 'R15']
  problemStatement: string;
  classicalBottlenecks: string;
  tierSolvingMechanism: string;
  verificationInvariant: string;
  downstreamHandoff: string;
}

export interface TierAcronym {
  term: string;
  expansion: string;
  tier: string;
  definition: string;
  contextUsage: string;
}

export interface TierCalculationMeaning {
  tierId: string;
  title: string;
  metricName: string;
  symbol: string;
  latexFormula: string;
  operationalMeaning: string;
  numericalInterpretation: string;
  decisionRule: string;
}

export const TIER_PARAMS_DOSSIER: Record<string, TierParamDetailedInfluence> = {
  fcm_fuzziness_m: {
    key: 'fcm_fuzziness_m',
    name: 'FCM Fuzziness Partitioning Exponent',
    symbol: 'm',
    tierId: 'tier1',
    tierName: 'Tier 1: Wave Decomposition & Macro-Clustering',
    category: 'Clustering',
    unit: 'scalar',
    defaultValue: 1.85,
    nominalRange: [1.2, 2.5],
    allowedRange: [1.05, 3.5],
    step: 0.05,
    description: 'Governs the degree of fuzzy overlap between macro pick waves and depot destination clusters. For m=1, FCM collapses to hard Voronoi partitioning (K-Means), whereas higher m allows SKU orders to share partial affinity across multiple vehicle batches.',
    mathematicalRole: 'u_{ik} = \\left[ \\sum_{j=1}^K \\left( \\frac{\\|x_i - c_k\\|^2}{\\|x_i - c_j\\|^2} \\right)^{\\frac{1}{m-1}} \\right]^{-1}',
    lowValueInfluence: 'Values m < 1.2 force crisp, hyper-localized hard boundaries. Eliminates multi-depot flex and triggers depot chute workload starvation or unhandled split picks.',
    optimalValueInfluence: 'Values m ∈ [1.6, 2.1] provide smooth affinity sharing (\\mu_{ic} ∈ [0,1]), enabling optimal split picking (R4) and balancing chute induction queues with variance < 12%.',
    highValueInfluence: 'Values m > 2.6 blur cluster centroids toward the geometric center of the warehouse. All AMRs receive identical diffuse clusters, dramatically increasing cross-aisle travel distances.',
    operationalImpact: 'Directly impacts fleet-wide empty deadhead travel and induction chute balance. Smooth fuzzy boundaries prevent single-chute gridlock during order arrival surges.',
    failureModeIfMisconfigured: 'Excessive m (>3.0) causes centroid collapse where all vehicles are assigned overlapping trajectories, multiplying Tier 4 kinematic conflict events by 400%.',
  },
  fcm_max_iter: {
    key: 'fcm_max_iter',
    name: 'FCM Coordinate Descent Iterations',
    symbol: 'I_{max}',
    tierId: 'tier1',
    tierName: 'Tier 1: Wave Decomposition & Macro-Clustering',
    category: 'Clustering',
    unit: 'iterations',
    defaultValue: 50,
    nominalRange: [20, 100],
    allowedRange: [5, 300],
    step: 5,
    description: 'The maximum allowable coordinate descent iterations between fuzzy membership matrix update U and spatio-temporal cluster centroid relocation V.',
    mathematicalRole: '\\|V^{(t+1)} - V^{(t)}\\|_\\infty < \\varepsilon \\quad \\lor \\quad t \\ge I_{max}',
    lowValueInfluence: 'Values < 15 terminate solver early before cluster centroids stabilize in aisle corridors, producing suboptimal, unbalanced pick batches.',
    optimalValueInfluence: 'Values between 40 and 80 guarantee Cauchy convergence (\\Delta J < 10^{-5}) within 35ms of real-time execution.',
    highValueInfluence: 'Values > 150 cause diminishing mathematical returns with zero cluster boundary shifts, wasting CPU cycle budget during high-frequency wave dispatch.',
    operationalImpact: 'Bounds online dispatch latency while ensuring cluster stability across continuous warehouse operations.',
    failureModeIfMisconfigured: 'Very low iterations (<10) produce skewed pick waves that overload one depot while leaving others idle.',
  },
  bpp_support_ratio_min: {
    key: 'bpp_support_ratio_min',
    name: 'Minimum Base Contact Support Surface Ratio',
    symbol: '\\eta_{min}',
    tierId: 'tier2',
    tierName: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
    category: '3D Bin Packing',
    unit: 'ratio',
    defaultValue: 0.85,
    nominalRange: [0.75, 0.95],
    allowedRange: [0.60, 0.98],
    step: 0.02,
    description: 'The minimum fraction of a box’s bottom surface area that must be physically supported by boxes directly underneath or by the AMR bay floor.',
    mathematicalRole: '\\sum_{j \\in \\text{Under}(i)} \\text{Area}(\\text{Overlap}_{xy}(i, j)) \\ge \\eta_{min} \\cdot \\text{Area}_{xy}(i)',
    lowValueInfluence: 'Values < 0.70 allow cantilevered parcel placements, leading to load instability and parcel toppling under AMR cornering or emergency stops.',
    optimalValueInfluence: 'Values in [0.80, 0.88] maximize volumetric bay utilization (up to 84%) while guaranteeing static mechanical equilibrium against lateral acceleration a_y = 1.2 m/s².',
    highValueInfluence: 'Values > 0.94 severely restrict valid stacking extreme points, rejecting 15–25% of feasible parcel combinations and increasing required AMR trips.',
    operationalImpact: 'Eliminates product damage, physical warehouse floor spills, and emergency AMR shutdowns caused by shifting cargo.',
    failureModeIfMisconfigured: 'Values below 0.65 violate ISO 3691-4 industrial safety envelope; sudden deceleration causes box tumbling off the robot chassis.',
  },
  friction_coeff_mu: {
    key: 'friction_coeff_mu',
    name: 'Static Coulomb Friction Coefficient',
    symbol: '\\mu',
    tierId: 'tier2',
    tierName: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
    category: '3D Bin Packing',
    unit: 'friction coefficient',
    defaultValue: 0.45,
    nominalRange: [0.30, 0.60],
    allowedRange: [0.20, 0.90],
    step: 0.05,
    description: 'Models cardboard-on-cardboard and cardboard-on-steel friction inside AMR bays, enforcing second-order cone stability against dynamic inertial slip forces.',
    mathematicalRole: '\\sqrt{(m_i a_x)^2 + (m_i a_y)^2} \\le \\mu \\cdot m_i (g - a_z)',
    lowValueInfluence: 'Values < 0.30 simulate wet or slippery surfaces, excessively constricting allowed pallet stacking heights and driving up AMR trip counts.',
    optimalValueInfluence: 'Values around 0.40–0.50 accurately reflect industrial corrugated cardboard friction, enabling stable multi-layer stacking at full transit speeds.',
    highValueInfluence: 'Values > 0.75 overestimate friction, assuming unrealistically sticky box surfaces that permit precarious stacks vulnerable to vibration collapse.',
    operationalImpact: 'Dictates safe acceleration envelopes for Tier 4 AMRs. Higher certified friction permits faster cornering and shorter trip times.',
    failureModeIfMisconfigured: 'Underestimating friction triggers unwarranted vehicle throttling; overestimating friction causes load tipping during emergency braking.',
  },
  bpp_time_limit_sec: {
    key: 'bpp_time_limit_sec',
    name: 'CP-SAT 3D Packing Solver Time Budget',
    symbol: 'T_{BPP}',
    tierId: 'tier2',
    tierName: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
    category: '3D Bin Packing',
    unit: 'seconds',
    defaultValue: 3.0,
    nominalRange: [1.0, 5.0],
    allowedRange: [0.5, 15.0],
    step: 0.5,
    description: 'The maximum runtime allocated to the OR-Tools CP-SAT solver with 3D diffn propagators and LIFO acyclicity constraints per AMR bay manifest.',
    mathematicalRole: 't_{\\text{CP-SAT}} \\le T_{BPP} \\implies \\text{Return best feasible bounded incumbent}',
    lowValueInfluence: 'Limits < 1.0s force solver to return greedy initial heuristics with lower volumetric density and suboptimal LIFO extraction paths.',
    optimalValueInfluence: 'Budgets between 2.0s and 4.0s allow conflict-driven clause learning (CDCL) to discover optimal stacking configurations with proven zero-rehandling LIFO order.',
    highValueInfluence: 'Budgets > 8.0s introduce noticeable dispatch pauses on the warehouse floor, delaying AMR departures from the induction depot.',
    operationalImpact: 'Balances volumetric packaging density against real-time operational reactivity during live fulfillment waves.',
    failureModeIfMisconfigured: 'Ultra-low limits (<0.5s) on dense batches (>30 items) cause CP-SAT timeouts with infeasible fallback flags, stalling AMR dispatch.',
  },
  vrp_penalty_delay_beta: {
    key: 'vrp_penalty_delay_beta',
    name: 'Soft Time-Window Lateness Penalty Multiplier',
    symbol: '\\beta',
    tierId: 'tier3',
    tierName: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
    category: 'Vehicle Routing',
    unit: 'weight / sec',
    defaultValue: 2.0,
    nominalRange: [1.0, 4.0],
    allowedRange: [0.2, 15.0],
    step: 0.2,
    description: 'Linear cost penalty assigned to each second of delivery lateness beyond the customer pick deadline [e_i, l_i] or chute induction window.',
    mathematicalRole: '\\text{Cost}_{TW} = \\beta \\sum_{i=1}^N \\max(0, T_i - l_i)',
    lowValueInfluence: 'Values < 0.8 prioritize total travel distance over delivery punctuality, causing low-priority orders to miss outbound truck departures.',
    optimalValueInfluence: 'Values in [1.5, 3.5] strike an industrial balance, penalizing SLA breaches while avoiding extreme detour excursions for minor delays.',
    highValueInfluence: 'Values > 6.0 turn soft windows into quasi-hard constraints, forcing vehicles to take inefficient, zig-zagging routes to satisfy tight pick deadlines.',
    operationalImpact: 'Directly governs Customer SLA compliance rates and on-time shipment metrics across multi-depot logistics hubs.',
    failureModeIfMisconfigured: 'Setting beta too low (<0.3) leads to 25%+ SLA violations during peak waves; setting beta too high (>10) increases total fleet mileage by 35%.',
  },
  vrp_penalty_subtour_p: {
    key: 'vrp_penalty_subtour_p',
    name: 'Ising Hamiltonian Subtour Elimination Multiplier',
    symbol: 'P',
    tierId: 'tier3',
    tierName: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
    category: 'Quantum Synthesis',
    unit: 'penalty weight',
    defaultValue: 100.0,
    nominalRange: [50.0, 200.0],
    allowedRange: [10.0, 500.0],
    step: 10.0,
    description: 'Quadratic energy penalty applied in the QUBO / Ising Hamiltonian whenever a bitstring encodes disconnected sub-tours or broken depot conservation cycles.',
    mathematicalRole: 'H_{subtour} = P \\sum_{S \\subset V} \\left( \\sum_{i \\in S, j \\notin S} x_{ij} - 1 \\right)^2',
    lowValueInfluence: 'Values < 30 fail to suppress invalid disconnected loops in quantum variational state sampling, producing non-conserved isolated circuits.',
    optimalValueInfluence: 'Values between 80 and 150 ensure the ground state manifold is strictly restricted to valid Hamiltonian tours without overshadowing distance optimization.',
    highValueInfluence: 'Values > 300 create steep energy canyons in the QAOA cost landscape, causing the classical optimizer (COBYLA) to become trapped in local minima.',
    operationalImpact: 'Guarantees that quantum execution results decode into continuous physical vehicle routes that depart and terminate at authorized depot terminals.',
    failureModeIfMisconfigured: 'Values below 20 yield invalid route solutions with orphaned AGV waypoints; values above 400 ruin QAOA convergence fidelity.',
  },
  kinematics_step_dt: {
    key: 'kinematics_step_dt',
    name: 'SIPP Safe Interval Discretization Time-Step',
    symbol: '\\Delta t',
    tierId: 'tier4',
    tierName: 'Tier 4: Continuous Swept Kinematics & ISO 3691-4 HRI',
    category: 'Kinematics & Safety',
    unit: 'seconds',
    defaultValue: 0.10,
    nominalRange: [0.05, 0.20],
    allowedRange: [0.02, 0.50],
    step: 0.02,
    description: 'Temporal resolution used by Safe Interval Path Planning (SIPP) and Priority-Based Search (PBS) to evaluate swept spatial volumes along warehouse corridors.',
    mathematicalRole: '\\mathcal{O}_{dynamic}(t_k) = \\mathbf{pos}_i(k \\Delta t) \\oplus \\mathcal{B}(R_{sweep}), \\quad k \\in \\mathbb{N}',
    lowValueInfluence: 'Fine steps (<0.04s) provide continuous, ultra-smooth velocity profiles and minimal tracking error but increase trajectory graph search time by 4x.',
    optimalValueInfluence: 'Steps in [0.08s, 0.12s] perfectly balance kinematic fidelity with 50Hz real-time path replanning for fleets of up to 16 autonomous robots.',
    highValueInfluence: 'Coarse steps (>0.25s) may fail to detect transient micro-conflicts at narrow aisle intersections, requiring conservative safety speed throttles.',
    operationalImpact: 'Enforces ISO 3691-4 certification and guarantees collision-free navigation between autonomous vehicles and human warehouse associates.',
    failureModeIfMisconfigured: 'Large dt (>0.35s) leads to dynamic collision checks missing fast-moving AMRs, compromising human-robot collaborative safety.',
  },
};

export const TIER_PROBLEM_SOLVING_DOSSIER: Record<string, TierProblemSolving> = {
  tier1: {
    tierId: 'tier1',
    tierNumber: 1,
    title: 'Tier 1: Wave Decomposition & Macro-Clustering',
    shortRole: 'Spatio-Temporal Order Partitioning & Depot Balancing',
    targetRestrictions: ['R8 (Chute Balancing)', 'R9 (Depot Capacities)', 'R13 (Hazmat Segregation)', 'R15 (Stochastic Uncertainty)'],
    problemStatement: 'Massive pools of unsorted SKU pick requests arrive with conflicting deadlines, variable package volumes, hazardous chemical incompatibilities, and uneven multi-depot throughput bottlenecks.',
    classicalBottlenecks: 'Classical K-Means enforces hard binary partitions that cannot model split-order pick lines (R4) and lacks awareness of temporal open windows, causing severe depot chute starvation and aisle traffic clustering.',
    tierSolvingMechanism: 'Spatio-temporal Fuzzy C-Means (FCM) combined with Distributionally Robust Sample Average Approximation (DR-SAA) computes continuous soft membership degrees \\mu_{ic} ∈ [0, 1]. In quantum mode, Classiq SC-QFCM evaluates pairwise state overlaps via Swap-Test circuits with logarithmic gate depth.',
    verificationInvariant: 'Invariant R1: Every pick item is accounted for (∑_k u_{ik} = 1) and Invariant R4: Chute variance σ²_chute ≤ 15%.',
    downstreamHandoff: 'Emits balanced ClusterPartitionDTO to Tier 2, containing partitioned order waves assigned to specific AMR bays and designated depot chute hubs.',
  },
  tier2: {
    tierId: 'tier2',
    tierNumber: 2,
    title: 'Tier 2: 3D Volumetric Bin Packing & LIFO Mechanics',
    shortRole: 'Physical Bay Loading & Static Mechanical Equilibrium',
    targetRestrictions: ['R4 (Split Deliveries)', 'R10 (LIFO Acyclicity & Zero Rehandling)'],
    problemStatement: 'Assigned pick items have diverse 3D bounding dimensions, masses, top-load compressive limits, and delivery sequences. Unstable stacking causes load spills, while improper loading forces robots to rehandle parcels.',
    classicalBottlenecks: 'Heuristic bin packing algorithms (First Fit Decreasing) ignore robot acceleration forces and LIFO extraction precedence, creating unstable cantilevered boxes and trapped parcels requiring manual unstacking.',
    tierSolvingMechanism: 'Constraint Programming with Satisfiability (OR-Tools CP-SAT) using 3D diffn spatial propagators coupled with continuous Mixed-Integer Second-Order Cone Programming (MISOCP) friction cone constraints. Strict linear inequalities enforce LIFO access ray clearance.',
    verificationInvariant: 'Invariant R10: LIFO Acyclicity - Zero rehandling overhead (Φ_LIFO = 0) and minimum 80% base contact support area (η_min ≥ 0.80).',
    downstreamHandoff: 'Emits PackManifestDTO to Tier 3, specifying exact 3D coordinates (x, y, z), orientation quaternions, and verified loading sequences for every AMR bay.',
  },
  tier3: {
    tierId: 'tier3',
    tierNumber: 3,
    title: 'Tier 3: Multi-Depot Time-Windowed Vehicle Routing (MD-VRPTW)',
    shortRole: 'Combinatorial Multi-Depot Fleet Tour Optimization',
    targetRestrictions: ['R1 (Depot Tour Conservation)', 'R2 (Aisle Flow)', 'R3 (Open Time Windows)', 'R6 (Battery SoC)', 'R7 (Capacity Limits)'],
    problemStatement: 'Each AMR must traverse complex warehouse rack networks, servicing multiple pick aisles and depot chutes within tight customer SLAs while managing lithium battery depletion and payload weight limits.',
    classicalBottlenecks: 'Exact Branch-Price-and-Cut pricing subproblems degenerate when time windows have open upper bounds (b_i = ∞), causing state label explosion. Classical heuristics get trapped in disconnected sub-tour loops.',
    tierSolvingMechanism: 'Memetic Hybrid Genetic Search with Advanced Diversity Control (HGS-ADC) using Prins split dynamic programming. In quantum mode, Classiq QAOA synthesizes a 32-qubit Ising spin Hamiltonian to explore combinatorial tour space via parameterized phase interference.',
    verificationInvariant: 'Invariant R2: Conservation of Flow (∑_j x_{0,j,k} = ∑_i x_{i,0,k} = 1) and Invariant R5: Minimum 15% Battery Reserve maintained throughout tour.',
    downstreamHandoff: 'Emits FleetTourDTO to Tier 4, containing ordered waypoint sequences, estimated arrival times (ETA), SLA margins, and predicted energy consumption.',
  },
  tier4: {
    tierId: 'tier4',
    tierNumber: 4,
    title: 'Tier 4: Continuous Swept Kinematics & ISO 3691-4 HRI',
    shortRole: 'Continuous Swept Trajectories & Human-Robot Safety',
    targetRestrictions: ['R5 (Dynamic Safety Clearance)', 'R11 (ISO 3691-4 HRI)', 'R12 (Crane Handshake)', 'R14 (Non-Holonomic Limits)'],
    problemStatement: 'Physical AMRs operate in shared warehouse aisles alongside human pickers, AS/RS cranes, and other mobile robots. Uncoordinated paths cause head-on gridlocks, cornering collisions, and safety violations.',
    classicalBottlenecks: 'Grid-based time-space A* suffers from exponential state explosion as fleet size grows. Standard CBS deadlocks at narrow one-way aisle intersections without priority resolution.',
    tierSolvingMechanism: 'Priority-Based Search (PBS) over continuous Safe Interval Path Planning (SIPP). PBS constructs a directed acyclic priority graph to resolve robot conflicts, planning continuous spline trajectories with dynamic speed throttling near human workers (ISO 3691-4).',
    verificationInvariant: 'Safety Invariant Φ < 1.0 (Token: Verified): Mathematical proof of zero swept-hull spatial overlap and continuous speed throttling to ≤0.4 m/s within 1.5m of humans.',
    downstreamHandoff: 'Emits KinematicTrajectoryDTO to AMR motor controllers and warehouse digital twin simulators, streaming continuous (x, y, θ, v, ω) waypoints at 50Hz.',
  },
};

export const TIER_ACRONYMS_DOSSIER: TierAcronym[] = [
  {
    term: 'FCM',
    expansion: 'Fuzzy C-Means',
    tier: 'Tier 1',
    definition: 'An unsupervised clustering algorithm allowing data points to belong to multiple clusters with continuous membership degrees \\mu_{ic} ∈ [0, 1].',
    contextUsage: 'Enables soft wave partitioning and split deliveries in Tier 1 warehouse batching.',
  },
  {
    term: 'DR-SAA',
    expansion: 'Distributionally Robust Sample Average Approximation',
    tier: 'Tier 1',
    definition: 'A stochastic optimization technique that optimizes for the worst-case probability distribution within a Wasserstein ambiguity ball.',
    contextUsage: 'Protects Tier 1 cluster plans against stochastic order arrival delays and SKU stockouts.',
  },
  {
    term: 'SC-QFCM',
    expansion: 'Swap-Circuit Quantum Fuzzy C-Means',
    tier: 'Tier 1 / Quantum',
    definition: 'A quantum-enhanced clustering algorithm using quantum state embedding and Swap-Test circuits to compute feature distance kernels in logarithmic gate depth.',
    contextUsage: 'Classiq implementation for massive order wave decomposition.',
  },
  {
    term: 'CP-SAT',
    expansion: 'Constraint Programming with Satisfiability',
    tier: 'Tier 2',
    definition: 'A state-of-the-art solver combining constraint satisfaction techniques with boolean SAT solvers (CDCL - Conflict-Driven Clause Learning).',
    contextUsage: 'Solves 3D bin packing with non-overlapping diffn constraints in Tier 2.',
  },
  {
    term: 'MISOCP',
    expansion: 'Mixed-Integer Second-Order Cone Programming',
    tier: 'Tier 2',
    definition: 'An optimization class handling convex quadratic and cone constraints alongside discrete decision variables.',
    contextUsage: 'Enforces friction cone stability against emergency braking acceleration inside AMR bays.',
  },
  {
    term: 'LIFO',
    expansion: 'Last-In, First-Out',
    tier: 'Tier 2',
    definition: 'Stacking discipline where the last parcel placed into the vehicle bay is the first parcel unloaded at the destination.',
    contextUsage: 'Guarantees zero rehandling overhead (Invariant R10) during order deliveries.',
  },
  {
    term: 'MD-VRPTW',
    expansion: 'Multi-Depot Vehicle Routing Problem with Time Windows',
    tier: 'Tier 3',
    definition: 'The generalized routing problem where a fleet based across multiple depot stations visits customer nodes within specified time intervals.',
    contextUsage: 'The core mathematical formulation solved in Tier 3.',
  },
  {
    term: 'HGS-ADC',
    expansion: 'Hybrid Genetic Search with Advanced Diversity Control',
    tier: 'Tier 3',
    definition: 'A state-of-the-art metaheuristic combining genetic crossovers, local search neighborhoods, and dual-population diversity preservation.',
    contextUsage: 'Rank-1 classical vehicle routing engine for open time-window delivery schedules.',
  },
  {
    term: 'QAOA',
    expansion: 'Quantum Approximate Optimization Algorithm',
    tier: 'Tier 3 / Quantum',
    definition: 'A hybrid variational quantum algorithm alternating cost and mixer Hamiltonian evolutions to sample low-energy combinatorial ground states.',
    contextUsage: 'Synthesized with Classiq to solve multi-depot subtour elimination on 32-qubit QPUs.',
  },
  {
    term: 'SIPP',
    expansion: 'Safe Interval Path Planning',
    tier: 'Tier 4',
    definition: 'A continuous-time path planning algorithm that compresses time-space search trees into safe contiguous intervals between dynamic obstacles.',
    contextUsage: 'Forms the continuous kinematic low-level search engine in Tier 4.',
  },
  {
    term: 'PBS',
    expansion: 'Priority-Based Search',
    tier: 'Tier 4',
    definition: 'A multi-agent pathfinding algorithm that resolves kinematic conflicts by constructing dynamic directed acyclic priority graphs.',
    contextUsage: 'High-level coordinator resolving multi-AMR intersections without combinatorial branching.',
  },
  {
    term: 'ISO 3691-4',
    expansion: 'International Safety Standard for Driverless Industrial Trucks',
    tier: 'Tier 4',
    definition: 'Global safety standard mandating continuous obstacle detection, automatic speed throttling (<0.4 m/s), and braking envelopes near humans.',
    contextUsage: 'Enforced dynamically across all AMR kinematic trajectory planners in collaborative zones.',
  },
  {
    term: 'AMR',
    expansion: 'Autonomous Mobile Robot',
    tier: 'General',
    definition: 'An automated guided vehicle capable of navigating dynamic warehouse environments using onboard sensors and digital twin dispatch.',
    contextUsage: 'The physical execution agents executing multi-tier dispatch tours.',
  },
  {
    term: 'SLA',
    expansion: 'Service Level Agreement',
    tier: 'General',
    definition: 'Guaranteed customer order delivery deadline; late deliveries incur soft penalty costs or contractual penalties.',
    contextUsage: 'Optimized within Tier 3 time-window penalty formulations.',
  },
];

export const TIER_CALCULATIONS_DOSSIER: TierCalculationMeaning[] = [
  {
    tierId: 'tier1',
    title: 'Tier 1: Spatio-Temporal Fuzzy Objective Function',
    metricName: 'Cluster Partition Energy J_m',
    symbol: 'J_m(\\mathbf{U}, \\mathbf{V})',
    latexFormula: 'J_m = \\sum_{i=1}^N \\sum_{c=1}^C (\\mu_{ic})^m \\cdot D_{\\text{ST}}^2(x_i, v_c) + \\rho \\sum_{c=1}^C \\max\\left(0, \\sum_{i=1}^N \\mu_{ic} q_i^{\\text{vol}} - Q_c^{\\text{vol}}\\right)^2',
    operationalMeaning: 'Measures total spatial dispersion, temporal pick-window dissonance, and depot capacity overload across all macro pick waves.',
    numericalInterpretation: 'Lower values indicate compact, synchronized pick batches that load AMRs evenly without choking depot consolidation chutes.',
    decisionRule: 'A partition is accepted if J_m converges with chute throughput variance σ²_chute ≤ 15% across all depot exits.',
  },
  {
    tierId: 'tier1',
    title: 'Tier 1: Composite Spatio-Temporal Warehouse Metric',
    metricName: 'Warehouse ST Distance D_ST',
    symbol: 'D_{\\text{ST}}(x_i, v_c)',
    latexFormula: 'D_{\\text{ST}}(x_i, v_c) = \\|\\mathbf{pos}_i - \\mathbf{pos}_c^{\\text{spatial}}\\|_1 + \\omega_{\\text{time}} |e_i - v_c^{\\text{time}}| + \\omega_{\\text{chute}} \\mathbb{I}(c(i) \\neq c(v_c))',
    operationalMeaning: 'Combines orthogonal Manhattan aisle travel distance, order pick deadline divergence, and chute destination affinity into a single distance scalar.',
    numericalInterpretation: 'Penalizes grouping items that are far apart in the warehouse or that have mismatched release time windows.',
    decisionRule: 'Ensures that orders assigned to the same AMR pick wave can be gathered with minimal aisle backtracking.',
  },
  {
    tierId: 'tier2',
    title: 'Tier 2: Second-Order Cone Dynamic Stability Criterion',
    metricName: 'Friction Cone Invariant',
    symbol: '\\mathcal{C}_{friction}',
    latexFormula: '\\sqrt{(m_i \\cdot a_x)^2 + (m_i \\cdot a_y)^2} \\le \\mu \\cdot m_i \\cdot (g - a_z)',
    operationalMeaning: 'Ensures that the lateral inertial forces generated during AMR cornering and braking do not exceed Coulomb static friction resistance.',
    numericalInterpretation: 'If the inertial force vector pierces the friction cone, parcels will slide or tip off the AMR cargo bed.',
    decisionRule: 'Strict mathematical invariant: Maximum permissible AMR turning acceleration is capped by a_{max} = \\mu g.',
  },
  {
    tierId: 'tier2',
    title: 'Tier 2: LIFO Precedence Ray Access Condition',
    metricName: 'LIFO Acyclicity Clearance',
    symbol: '\\Phi_{LIFO}',
    latexFormula: '\\mathcal{R}_{\\text{access}}(\\pi_i) \\cap \\mathcal{B}_q = \\emptyset \\quad \\forall q : T_{\\text{drop}}(q) > T_{\\text{drop}}(\\pi_i)',
    operationalMeaning: 'Guarantees that no parcel scheduled for later delivery physically obstructs the extraction ray of an earlier scheduled parcel.',
    numericalInterpretation: 'Binary compliance: \\Phi_{LIFO} = 0 implies zero parcel rehandling overhead at delivery stations.',
    decisionRule: 'Enforced strictly by CP-SAT during 3D placement; reject any placement where an earlier item is buried underneath.',
  },
  {
    tierId: 'tier3',
    title: 'Tier 3: Bellman-Ford Open-Window Split Formulation',
    metricName: 'Optimal Subsequence Cost V(j)',
    symbol: 'V(j)',
    latexFormula: 'V(j) = \\min_{0 \\le i < j} \\left\\{ V(i) + c_{ij}^k + \\beta \\sum_{u=i+1}^j \\Delta_u^k + \\phi \\max\\left(0, \\mathbf{u}_j^k - \\mathbf{Q}_k\\right) \\right\\}',
    operationalMeaning: 'Dynamic programming formulation that partitions a giant permutation tour into optimal individual vehicle routes under open time windows.',
    numericalInterpretation: 'Computes the minimum combined transit cost, SLA lateness penalty, and capacity slack for serving customer orders 1 through j.',
    decisionRule: 'Optimal split point determines exactly when an AMR must return to the depot to offload its batch.',
  },
  {
    tierId: 'tier3',
    title: 'Tier 3: Bi-Objective Diversity Selection Fitness',
    metricName: 'HGS-ADC Selection Fitness',
    symbol: '\\text{Fit}(p)',
    latexFormula: '\\text{Fit}(p) = \\text{Rank}_{\\text{cost}}(p) + \\left(1 - \\frac{\\text{iter}}{\\text{max\\_iter}}\\right) \\cdot \\text{Rank}_{\\text{diversity}}(p)',
    operationalMeaning: 'Balances solution quality (low distance and penalties) against population diversity contribution (broken pairs distance).',
    numericalInterpretation: 'Early in search, diverse solutions are heavily favored; toward final iterations, pure cost minimization dominates.',
    decisionRule: 'Prevents genetic algorithms from prematurely converging to suboptimal local minima on grid warehouse graphs.',
  },
  {
    tierId: 'tier4',
    title: 'Tier 4: Priority-Based Continuous Conflict Resolution',
    metricName: 'Continuous Swept-Hull Collision Integral',
    symbol: '\\mathcal{B}_{sweep}(k, \\mathbf{x}_k(t))',
    latexFormula: '\\mathcal{B}_{\\text{sweep}}(k, \\mathbf{x}_k(t)) \\cap \\mathcal{B}_{\\text{sweep}}(k\', \\mathbf{x}_{k\'}(t)) = \\emptyset \\quad \\forall t \\in [0, T]',
    operationalMeaning: 'Evaluates the Minkowski sum of the AMR chassis with swept turning radius over continuous time interval [0, T].',
    numericalInterpretation: 'Non-empty intersection indicates an impending spatial conflict at a warehouse corridor intersection.',
    decisionRule: 'When intersection occurs, PBS establishes a directed priority arc (k \\prec k\') and forces k\' to hold in safe interval.',
  },
  {
    tierId: 'tier4',
    title: 'Tier 4: ISO 3691-4 Human-Robot Proximity Invariant',
    metricName: 'Collaborative Safety Invariant Ratio',
    symbol: '\\Phi_{HRI}',
    latexFormula: '\\Phi_{HRI} = \\max_{t, i, h} \\left( \\frac{R_{\\text{human}} + R_{\\text{AMR}} + D_{\\text{ISO}}}{\\|\\mathbf{pos}_i(t) - \\mathbf{pos}_h(t)\\|} \\right) < 1.0',
    operationalMeaning: 'Continuous verification that the clearance distance between every moving AMR and human associate strictly satisfies ISO 3691-4 safety buffers.',
    numericalInterpretation: 'Values Φ < 1.0 mathematically guarantee zero collision hazard; values ≥ 1.0 trigger immediate emergency dynamic braking.',
    decisionRule: 'If AMR approaches within 1.5m of a human, speed is automatically governed to v_{safe} ≤ 0.4 m/s.',
  },
];
