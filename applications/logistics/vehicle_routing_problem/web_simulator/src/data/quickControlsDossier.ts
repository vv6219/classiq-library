export interface QuickControlParam {
  key: string;
  name: string;
  symbol: string;
  category: 'topology' | 'fleet' | 'orders' | 'randomness' | 'engine';
  nominalRange: string;
  defaultValue: any;
  unit?: string;
  mathematicalRole: string;
  operationalMeaning: string;
  lowRegimeInfluence: string;
  optimalRegimeInfluence: string;
  highRegimeInfluence: string;
  failureModes: string;
  decisionRule: string;
}

export interface QuickControlProblem {
  id: string;
  title: string;
  problemStatement: string;
  classicalBottleneck: string;
  resolutionMechanism: string;
  targetRestrictions: string[];
  verificationMetric: string;
}

export interface QuickControlAcronym {
  term: string;
  expansion: string;
  definition: string;
  contextUsage: string;
}

export interface QuickControlCalculation {
  metricName: string;
  symbol: string;
  latexFormula: string;
  operationalMeaning: string;
  numericalInterpretation: string;
  decisionRule: string;
}

export const QUICK_CONTROLS_PARAMS: Record<string, QuickControlParam> = {
  selectedArchetype: {
    key: 'selectedArchetype',
    name: 'Industrial Facility Archetype',
    symbol: '\\mathcal{A}_{\\text{wh}}',
    category: 'topology',
    nominalRange: '7 Industrial Profiles',
    defaultValue: 'PARETO_HOT_ZONE',
    mathematicalRole:
      'Defines the spatial probability density distribution P(x, y) of pick locations, aisle access graph \\mathcal{G} = (\\mathcal{V}, \\mathcal{E}), SKU weight/volume distributions, and depot docking topologies.',
    operationalMeaning:
      'Selects real-world warehouse configurations (Automotive JIT, E-Commerce Hot-Zone, Cold-Chain, Pharma HAZMAT, High-Density Surge). Directly dictates picking velocity, aisle congestion points, and chute buffer demands.',
    lowRegimeInfluence:
      'Uniform Random Archetype: Picks are evenly scattered across all aisles. Eliminates localized hot-spots but increases average travel distance per pick line by 35–50%.',
    optimalRegimeInfluence:
      'Pareto 80/20 Hot-Zone & Cross-Dock: Reflects real industrial fulfillment where 20% of fast-moving SKUs generate 80% of pick volume. Tests clustering algorithms against concentrated aisle traffic.',
    highRegimeInfluence:
      'Surge Wave & Enterprise Scale (35,000 orders): Stresses solver scalability. Reveals whether decomposition hierarchy can sustain real-time dispatch without memory exhaustion.',
    failureModes:
      'Mismatched archetype leads to over-designed routes that ignore aisle bottlenecks or under-prepared consolidation buffers that overflow during real operational surges.',
    decisionRule:
      'Match warehouse archetype to customer logistics contract: E-Commerce for omni-channel retail, HAZMAT for chemical/pharma, Cross-Dock for FMCG distribution hubs.',
  },
  numVehicles: {
    key: 'numVehicles',
    name: 'Autonomous Mobile Robot (AMR) Fleet Size',
    symbol: 'K',
    category: 'fleet',
    nominalRange: '2 – 8 AMRs (Scalable to 16)',
    defaultValue: 4,
    unit: 'AMRs',
    mathematicalRole:
      'Specifies the vehicle cardinality index k \\in \\{1 \\dots K\\}. Sets upper bound on simultaneous tour partitions, total fleet payload W_{\\text{fleet}} = K \\cdot W_{\\text{max}}, and spatiotemporal trajectory reservation lines.',
    operationalMeaning:
      'Determines the active concurrent transport bandwidth on the warehouse floor. More AMRs allow parallel pick waves across different aisles but increase kinematic contention at narrow cross-aisles.',
    lowRegimeInfluence:
      'K = 2 AMRs: Extreme robot starvation. Total wave makespan escalates (>1200s), vehicles accumulate excessive mileage, battery levels approach critical 15% reserve, and customer SLA cut-offs are violated.',
    optimalRegimeInfluence:
      'K = 4 – 6 AMRs: Optimal operational balance. Workload is evenly partitioned across AMRs (CV < 0.12), average makespan drops to 280–420s, and depot turnaround time remains smooth.',
    highRegimeInfluence:
      'K ≥ 8 AMRs: Spatial congestion hysteresis. In high-density aisles, AMR-AMR spatiotemporal intersection conflicts grow quadratically \\mathcal{O}(K^2). Emergency stops and yield holds degrade physical throughput.',
    failureModes:
      'Under-sizing causes SLA breaches and fleet fatigue; over-sizing causes floor traffic deadlocks and excessive robot capital depreciation.',
    decisionRule:
      'Set K = \\lceil \\sum d_i / (v_{\\text{avg}} \\cdot T_{\\text{SLA}}) \\rceil. Add +1 AMR for contingency if tight deadline fraction exceeds 25%.',
  },
  numOrders: {
    key: 'numOrders',
    name: 'Order Batch Volume per Dispatch Wave',
    symbol: 'N_{\\text{orders}}',
    category: 'orders',
    nominalRange: '6 – 50 Orders',
    defaultValue: 20,
    unit: 'Orders',
    mathematicalRole:
      'Defines the cardinality of the customer pick set \\mathcal{O} = \\{o_1 \\dots o_N\\}. Dictates the dimensional size of the distance matrix D \\in \\mathbb{R}^{N \\times N} and the 3D bin packing item inventory.',
    operationalMeaning:
      'Represents the size of the fulfillment batch released by the WMS order management system. Governs container packing density, robot bay utilization, and route tour complexity.',
    lowRegimeInfluence:
      'N ≤ 10 Orders: Under-utilized AMR payload bays (<25% volume fill). High tare vehicle transit distance per delivered SKU, resulting in poor kWh/order energy efficiency.',
    optimalRegimeInfluence:
      'N = 20 – 35 Orders: High volumetric efficiency (>75% bay fill), cohesive spatial clusters in Tier 1 FCM, and near-optimal QAOA 32-qubit Ising Hamiltonian state sampling.',
    highRegimeInfluence:
      'N ≥ 50 Orders: Combinatorial state-space explosion. Tier 2 CP-SAT exact 3D packing reaches timeout limit; consolidation chute staging buffers overflow (Q_c(t) > Q_c^{\\text{max}}).',
    failureModes:
      'Over-sized batches flood chute staging buffers, causing conveyor back-ups and stalling upstream warehouse pick aisles.',
    decisionRule:
      'Cap N at 35 orders per wave for deterministic sub-minute dispatch; partition larger demand waves into consecutive rolling waves.',
  },
  seed: {
    key: 'seed',
    name: 'Pseudo-Random Simulation Seed',
    symbol: '\\mathcal{S}_{\\text{PRNG}}',
    category: 'randomness',
    nominalRange: '0 – 99999',
    defaultValue: 42,
    unit: 'Integer',
    mathematicalRole:
      'Seeds the deterministic Mersenne Twister PRNG engine. Controls stochastic instantiation of SKU coordinates (x, y), parcel dimensions (l, w, h), parcel masses (m), and delivery SLA deadlines.',
    operationalMeaning:
      'Ensures 100% mathematical reproducibility. Allows warehouse managers and researchers to evaluate identical facility conditions when comparing Classical ALNS vs Classiq Quantum QAOA solutions.',
    lowRegimeInfluence:
      'Deterministic Fixed Seed (e.g. 42): Ideal for scientific regression testing, circuit depth benchmarking, and mathematical falsification audits.',
    optimalRegimeInfluence:
      'Incremental Controlled Sweep: Testing seeds 42, 43, 44... isolates algorithmic sensitivity from random spatial clustering anomalies.',
    highRegimeInfluence:
      'Arbitrary Randomization: Stress-tests dispatch resilience against adversarial SKU weight spikes, unexpected obstacle placements, and erratic deadline distributions.',
    failureModes:
      'Uncontrolled random seeds render performance comparisons statistically invalid by confounding algorithmic efficiency with random variance.',
    decisionRule:
      'Lock seed during algorithm benchmarking; randomize seed across Monte Carlo stress tests (N ≥ 30 runs) to certify confidence intervals.',
  },
  mode: {
    key: 'mode',
    name: 'Optimization Co-Processing Engine Mode',
    symbol: '\\mathcal{M}_{\\text{solver}}',
    category: 'engine',
    nominalRange: 'QUANTUM | CLASSICAL',
    defaultValue: 'QUANTUM',
    mathematicalRole:
      'Switches between Classiq Quantum Hybrid Co-Processing (SC-QFCM + 32-qubit QAOA Ising Synthesizer) and Classical Operations Research Metaheuristics (K-Means++ + HGS-ADC / ALNS).',
    operationalMeaning:
      'Selects the computational co-processor architecture. Classical mode runs on local CPU cores, while Quantum mode synthesizes parameterized circuits with entanglement and quantum phase interference.',
    lowRegimeInfluence:
      'Classical Metaheuristic Mode: Deterministic execution with fast local convergence on simple layouts, but becomes trapped in local minima in congested multi-depot topologies.',
    optimalRegimeInfluence:
      'Classiq Quantum Mode: Synthesizes 32-qubit QAOA circuits with alternating cost/mixer Hamiltonians. Superposition and quantum tunneling explore complex subtour spaces, breaking classical stagnation.',
    highRegimeInfluence:
      'Hybrid Quantum-Classical Co-Processing: Quantum circuit samples high-probability ground states; classical optimizer refines kinematic continuous trajectories in Tier 4.',
    failureModes:
      'Relying solely on classical heuristics risks sub-optimal vehicle tour deadlocks; un-calibrated quantum ansatz parameters increase classical optimizer convergence iterations.',
    decisionRule:
      'Use Quantum mode for dense multi-depot scenarios with >25 stops and tight deadlines; use Classical mode for rapid baseline verification.',
  },
  hazardRatio: {
    key: 'hazardRatio',
    name: 'Hazardous (ADR) Cargo Segregation Ratio',
    symbol: '\\alpha_{\\text{haz}}',
    category: 'orders',
    nominalRange: '0.00 – 0.30 (0% – 30%)',
    defaultValue: 0.10,
    unit: 'Fraction',
    mathematicalRole:
      'Probability P(ADR) that an order SKU is classified as flammable, corrosive, or toxic, requiring isolated payload bay partitions and strict safety handling.',
    operationalMeaning:
      'Enforces industrial chemical and battery segregation standards. Hazardous parcels cannot be co-loaded with food or standard parcels in the same vehicle bay.',
    lowRegimeInfluence:
      '0%: Pure commercial parcels. Maximum 3D bin packing consolidation efficiency with zero segregation constraints.',
    optimalRegimeInfluence:
      '10% – 15%: Standard industrial warehouse distribution. Tests solver bay partitioning without degrading overall fleet throughput.',
    highRegimeInfluence:
      '> 25%: Heavy chemical/pharmaceutical facility. Requires dedicated HAZMAT AMRs, reducing effective fleet capacity for general cargo.',
    failureModes:
      'Inadequate hazard segregation violates ADR transport safety regulations and triggers Invariant Gate 1 rejection.',
    decisionRule:
      'Enforce dedicated AMR assignment whenever hazard ratio exceeds 20% to avoid cross-contamination delays.',
  },
};

export const QUICK_CONTROLS_PROBLEMS: QuickControlProblem[] = [
  {
    id: 'fleet_congestion_tradeoff',
    title: 'Fleet Sizing vs Spatial Congestion Trade-Off',
    problemStatement:
      'Warehouse managers face a fundamental dilemma: scaling the AMR fleet size K directly increases parallel order picking capacity, but linearly increases aisle traffic density, leading to quadratic growth in robot-robot crossing conflicts and intersection deadlocks.',
    classicalBottleneck:
      'Classical dispatchers treat AMRs as point particles on 2D graphs. When fleet size exceeds 6 AMRs, uncoordinated path intersections trigger cascade deadlock loops that shut down major feeder aisles.',
    resolutionMechanism:
      'Quick Controls fleet slider coupled with Tier 4 SIPP/PBS continuous spatiotemporal reservations. SIPP reserves dynamic time-intervals along corridors, guaranteeing collision-free transit even at maximum fleet density (K = 8 AMRs).',
    targetRestrictions: ['R5 (Dynamic Safety Headway)', 'R11 (ISO 3691-4 HRI)', 'R13 (Deadlock Avoidance)'],
    verificationMetric: 'System Falsification Ratio Φ = 0.880 < 1.0 (Zero Collisions)',
  },
  {
    id: 'wave_batch_balance',
    title: 'Wave Batch Volume vs Chute Buffer Capacity',
    problemStatement:
      'Releasing overly large order batches (N > 40) overwhelms the physical drop chute consolidation buffers, causing AMRs to queue up in front of sorting stations and blocking adjacent travel lanes.',
    classicalBottleneck:
      'Static batching ignores downstream sorting throughput. High-order waves cause buffer overflow Q_c(t) > Q_c^{\\text{max}}, resulting in conveyor back-pressure that halts upstream warehouse operations.',
    resolutionMechanism:
      'Dynamic wave sizing slider combined with Tier 1 Fuzzy C-Means (FCM) soft-clustering. FCM balances cluster payloads across multiple chutes and depots, smoothing arrival rates dQ_c/dt.',
    targetRestrictions: ['R4 (Split Deliveries)', 'R7 (Chute Buffer Capacity)', 'R10 (LIFO Order)'],
    verificationMetric: 'Chute Buffer Overflow Ratio < 0.85 (Zero Overflow)',
  },
  {
    id: 'archetype_spatial_adaptation',
    title: 'Heterogeneous Facility Archetype Optimization',
    problemStatement:
      'Different industrial facilities exhibit fundamentally different physical demand profiles: E-Commerce has extreme SKU pick hot-spots, Automotive JIT requires rigid delivery sequences, and Pharma mandates strict HAZMAT isolation.',
    classicalBottleneck:
      'Generic routing heuristics perform well on synthetic uniform benchmarks but fail disastrously on real-world Pareto distributions with 80% aisle congestion.',
    resolutionMechanism:
      'Archetype quick-selector instantaneously adapts graph topology, pick covariance matrices, and vehicle velocity profiles to match the specific physical reality of the target industry.',
    targetRestrictions: ['R1 (Depot Conservation)', 'R6 (Hazardous Segregation)', 'R9 (3D Stability)'],
    verificationMetric: 'Makespan Reduction vs Uniform Baseline: 24.3%',
  },
];

export const QUICK_CONTROLS_ACRONYMS: QuickControlAcronym[] = [
  {
    term: 'AMR',
    expansion: 'Autonomous Mobile Robot',
    definition: 'An industrial driverless vehicle navigating warehouse aisles using LiDAR, SLAM, and spatial sensors to transport goods autonomously.',
    contextUsage: 'Controlled via the Fleet Size (AMRs) slider in Quick Controls (nominal 2–8 robots).',
  },
  {
    term: 'SKU',
    expansion: 'Stock Keeping Unit',
    definition: 'A unique scannable barcode item representing a distinct product with specific mass, volume, and storage slot coordinates.',
    contextUsage: 'Generated dynamically based on the selected Industrial Facility Archetype.',
  },
  {
    term: 'WMS',
    expansion: 'Warehouse Management System',
    definition: 'The tier-1 enterprise software suite orchestrating inventory tracking, pick waves, and physical dispatch execution.',
    contextUsage: 'Quick Controls acts as the real-time simulation front-end for the WMS dispatch pipeline.',
  },
  {
    term: 'SLA',
    expansion: 'Service Level Agreement',
    definition: 'Strict commercial contract deadline governing the allowable time window for an order to be picked, packed, and delivered to dispatch chutes.',
    contextUsage: 'Stressed when Order Batch Size N is high or AMR Fleet Size K is low.',
  },
  {
    term: 'ADR',
    expansion: 'European Agreement on Dangerous Goods',
    definition: 'International safety regulations dictating mandatory segregation and handling protocols for flammable, corrosive, and toxic materials.',
    contextUsage: 'Governed by the Hazard Ratio slider, enforcing isolated AMR compartment loading.',
  },
  {
    term: 'PRNG',
    expansion: 'Pseudo-Random Number Generator',
    definition: 'A mathematical algorithm (Mersenne Twister) that produces a sequence of numbers approximating the properties of random numbers.',
    contextUsage: 'Controlled by the Simulation Seed input to ensure 100% reproducible benchmark scenarios.',
  },
  {
    term: 'HRI',
    expansion: 'Human-Robot Interaction',
    definition: 'The physical and cybernetic interface between human pickers and AMRs sharing the same warehouse corridors under ISO 3691-4 safety rules.',
    contextUsage: 'Active in the Collaborative HRI archetype with dynamic speed dampening to ≤0.4 m/s.',
  },
  {
    term: 'ALNS',
    expansion: 'Adaptive Large Neighborhood Search',
    definition: 'A state-of-the-art classical metaheuristic that iteratively destroys and repairs parts of a routing solution using weighted destroy/repair operators.',
    contextUsage: 'Executed when Quick Controls is set to CLASSICAL mode.',
  },
  {
    term: 'QAOA',
    expansion: 'Quantum Approximate Optimization Algorithm',
    definition: 'A hybrid quantum-classical variational algorithm synthesizing alternating cost and mixer Hamiltonian circuits to solve combinatorial NP-hard problems.',
    contextUsage: 'Executed via Classiq quantum circuit synthesizer when Quick Controls is set to QUANTUM mode.',
  },
  {
    term: 'Makespan',
    expansion: 'Maximum Wave Completion Time',
    definition: 'The total elapsed time from wave release until the final AMR completes all pick deliveries and docks safely at its terminal depot.',
    contextUsage: 'Primary optimization KPI minimized across all Quick Controls configurations.',
  },
];

export const QUICK_CONTROLS_CALCULATIONS: QuickControlCalculation[] = [
  {
    metricName: 'Theoretical Minimum Fleet Sizing Bound',
    symbol: 'K_{\\text{min}}',
    latexFormula: 'K_{\\text{min}} = \\left\\lceil \\frac{\\sum_{i=1}^N \\left( \\frac{2 \\cdot d(o_i, \\text{depot})}{v_{\\text{avg}}} + t_{\\text{pick}} \\right)}{T_{\\text{SLA}} - T_{\\text{buffer}}} \\right\\rceil',
    operationalMeaning:
      'Calculates the absolute minimum number of AMRs required to complete all customer picks within the commercial SLA window without violating battery limits.',
    numericalInterpretation:
      'If K_{\\text{min}} > K_{\\text{active}}, the dispatch wave is mathematically guaranteed to breach delivery deadlines unless high-priority orders are dropped.',
    decisionRule:
      'Always maintain K_{\\text{active}} \\ge K_{\\text{min}} + 1 to provide a safety buffer against unexpected aisle obstructions.',
  },
  {
    metricName: 'Warehouse Wave Spatial Density Index',
    symbol: '\\rho_{\\text{wave}}',
    latexFormula: '\\rho_{\\text{wave}} = \\frac{N_{\\text{orders}} \\cdot \\bar{V}_{\\text{order}}}{W_{\\text{facility}} \\cdot L_{\\text{facility}} \\cdot H_{\\text{clearance}}}',
    operationalMeaning:
      'Measures the volumetric concentration of active orders relative to the physical facility volume (orders/m³).',
    numericalInterpretation:
      '\\rho_{\\text{wave}} > 0.04 indicates severe aisle crowding and high probability of AMR spatiotemporal contention in Tier 4.',
    decisionRule:
      'When \\rho_{\\text{wave}} exceeds 0.05, enable strict multi-depot spatial partitioning in Tier 1 to prevent cross-aisle traffic.',
  },
  {
    metricName: 'Consolidation Chute Accumulation Rate',
    symbol: '\\frac{dQ_c}{dt}',
    latexFormula: '\\frac{dQ_c(t)}{dt} = \\sum_{k=1}^K \\mathbf{1}_{\\{p_k(t) = \\text{chute}_c\\}} \\cdot \\text{Rate}_{\\text{unload}} - \\text{Rate}_{\\text{conveyor}}',
    operationalMeaning:
      'The net rate of cargo accumulation at consolidation drop chute c. Must satisfy the integral bound \\int_0^t \\frac{dQ_c}{d\\tau} d\\tau \\le Q_c^{\\text{max}} at all times.',
    numericalInterpretation:
      'Positive accumulation indicates AMRs are arriving faster than outbound sortation conveyors can clear packages.',
    decisionRule:
      'If dQ_c/dt > 0 for >30 consecutive seconds, Tier 3 routing dynamically inserts an intermediate dwell waypoint to pace arrivals.',
  },
  {
    metricName: 'Fleet Workload Balance Coefficient',
    symbol: '\\text{CV}_{\\text{workload}}',
    latexFormula: '\\text{CV}_{\\text{workload}} = \\frac{\\sigma(D_1 \\dots D_K)}{\\bar{D}} = \\frac{\\sqrt{\\frac{1}{K} \\sum_{k=1}^K (D_k - \\bar{D})^2}}{\\frac{1}{K} \\sum_{k=1}^K D_k}',
    operationalMeaning:
      'The Coefficient of Variation of total travel distances across all AMRs. Measures fairness and balance of route assignments.',
    numericalInterpretation:
      '\\text{CV} < 0.15 indicates near-perfect workload balance; \\text{CV} > 0.40 signals that one robot is over-burdened while others idle.',
    decisionRule:
      'Reject dispatch solutions with \\text{CV}_{\\text{workload}} > 0.35 and trigger balanced Benders cuts in Tier 1 wave clustering.',
  },
];
