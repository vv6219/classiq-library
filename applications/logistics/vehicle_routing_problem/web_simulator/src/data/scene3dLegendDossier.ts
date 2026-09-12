/**
 * 3D Warehouse Twin: Scene Intelligence, Object Legend, and Route Explanations Dossier
 * Comprehensive domain dictionary and mathematical specifications for all 3D scene elements.
 */

export interface Scene3DObjectDossier {
  id: string;
  name: string;
  category: 'ROBOTICS' | 'FACILITY' | 'STORAGE' | 'SAFETY' | 'NAVIGATION';
  visualDescription: string;
  hexColor: string;
  glowColor: string;
  operationalPurpose: string;
  mathematicalInvariants: string;
  associatedRestrictions: string[];
  operationalRules: string[];
}

export interface RouteColorSpec {
  vehicleId: string;
  name: string;
  hex: string;
  deckGlow: string;
  trailGlow: string;
  frequency: string;
}

export const SCENE_3D_OBJECTS: Scene3DObjectDossier[] = [
  {
    id: 'OBJ_AMR',
    name: 'Autonomous Mobile Robot (AMR)',
    category: 'ROBOTICS',
    visualDescription: 'Heavy-duty differential-drive chassis (2.0m x 1.5m x 0.5m) with illuminated colored deck, onboard yellow payload tote, and 4 black drive wheels.',
    hexColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.6)',
    operationalPurpose: 'Carries customer order cartons autonomously through warehouse corridors, traversing pick bays, chutes, and charging depots without human operators.',
    mathematicalInvariants: 'Velocity: v(t) <= 2.0 m/s; Acceleration: ||a(t)||_2 <= 1.0 m/s^2; Emergency decel: 2.5 m/s^2; Chassis swept radius: R_chassis = 0.65 m.',
    associatedRestrictions: ['R1 (Kinematic Constraints)', 'R7 (Battery State of Charge)', 'R11 (Dynamic Velocity Scaling in Shared Spaces)'],
    operationalRules: [
      'Must maintain safe Minkowski clearance min ||p_i(t) - p_j(t)|| >= 2·R + D_safe from other vehicles.',
      'Mandatory speed dampening to v <= 0.4 m/s within 1.5m of humans or in shared pedestrian corridors (ISO 3691-4).',
      'Battery SOC must never drop below 15% (SOC >= 0.15) at any point along the mission tour.',
    ],
  },
  {
    id: 'OBJ_DEPOT',
    name: 'Warehouse Fleet Depot (Berths D1–D5)',
    category: 'FACILITY',
    visualDescription: 'Cobalt blue hexagonal docking platform (radius 3.6m) with illuminated cyan concentric ring and vertical 4.5m beacon light pillar.',
    hexColor: '#1d4ed8',
    glowColor: 'rgba(0, 240, 255, 0.8)',
    operationalPurpose: 'Mission staging hub where AMRs originate, conclude tours, replenish inventory, and perform high-speed automated inductive fast-charging.',
    mathematicalInvariants: 'Tour Conservation: sum_j x_{0,j}^k = 1, sum_i x_{i,0}^k = 1; Turnaround dwell: tau_turnaround = 20.0s; Inductive charging rate: 0.5% SOC/s.',
    associatedRestrictions: ['R3 (MTZ Subtour Elimination)', 'R7 (Battery Buffer & Fast Charging)', 'R9 (Multi-Depot Flow Conservation)'],
    operationalRules: [
      'Every AMR mission tour must begin and end at an authorized depot node.',
      'D1 (Southwest 10,10), D2 (Southeast 140,10), D3 (Northwest 10,90), D4 (Northeast 140,90), D5 (Central Cross-Dock 75,50).',
      'AMRs replenish battery SOC to >= 90% during docking turnaround before next wave dispatch.',
    ],
  },
  {
    id: 'OBJ_CHUTE',
    name: 'Consolidation Chute (Ports C1–C4)',
    category: 'FACILITY',
    visualDescription: 'Industrial emerald green sorting hopper (4.8m x 2.4m x 4.8m) equipped with angled conveyor intake ramp and glowing floor drop-ring.',
    hexColor: '#047857',
    glowColor: 'rgba(16, 185, 129, 0.7)',
    operationalPurpose: 'High-speed order consolidation port where AMRs deposit picked cartons to feed downstream automated packing and packaging sorters.',
    mathematicalInvariants: 'Queue buffer limit: Q_c(t) <= Q_c^{max_buffer} = 100 cartons; Conveyor drain rate: dQ_c/dt = sum(AMR -> c)·mu_unload - lambda_conveyor; Dwell: tau_drop = 30.0s.',
    associatedRestrictions: ['R13 (Consolidation Chute Queue Overflow)', 'R8 (Delivery Time Window Deadlines)'],
    operationalRules: [
      'AMRs execute precise alignment inside the 1.8m drop-zone ring before releasing payload.',
      'If chute queue buffer exceeds 85% capacity, Tier 1 macro-clustering routes incoming waves to alternative chutes to prevent line starvation.',
      'Located along the northern outbound dock wall (Z = 92m) for immediate cross-dock throughput.',
    ],
  },
  {
    id: 'OBJ_RACKS',
    name: 'Storage Rack Aisles (Aisles 01–22)',
    category: 'STORAGE',
    visualDescription: 'Steel upright frames (height 5.2m) spanning parallel pick corridors, featuring 3 vertical shelf tiers populated with multi-colored cartons.',
    hexColor: '#334155',
    glowColor: 'rgba(56, 189, 248, 0.4)',
    operationalPurpose: 'High-density vertical storage for warehouse stock keeping units (SKUs). Provides structured pick corridors for autonomous retrieval.',
    mathematicalInvariants: 'Aisle lateral spacing: 5.2m; Rack row width: 1.4m; Pick corridor width: 3.8m; Vertical levels: 3 (Tier 1: 1.35m, Tier 2: 2.7m, Tier 3: 4.05m).',
    associatedRestrictions: ['R2 (Narrow Aisle Headway Clearance)', 'R14 (Corridor Deadlock Prevention)'],
    operationalRules: [
      'Two wide transverse cross-aisles at Z = 45m..55m and front/back buffers allow AMRs to switch corridors without reversing.',
      'SIPP space-time reservation prevents head-on AMR conflict inside single-lane aisle segments.',
    ],
  },
  {
    id: 'OBJ_PARCEL_AMBER',
    name: 'Standard Ambient Cargo Carton',
    category: 'STORAGE',
    visualDescription: 'Gold-amber corrugated cardboard carton positioned on storage racks and robot cargo decks.',
    hexColor: '#d97706',
    glowColor: 'rgba(217, 119, 6, 0.5)',
    operationalPurpose: 'Represents general merchandise orders requiring standard volumetric bin packing and delivery to consolidation chutes.',
    mathematicalInvariants: 'Mass: 0.5kg - 18.0kg; Volume: 0.002m^3 - 0.045m^3; Friction coefficient with robot deck: mu = 0.35.',
    associatedRestrictions: ['R4 (3D Bin Packing & Payload Capacity)', 'R6 (LIFO Topological Precedence DAG)'],
    operationalRules: [
      'Must satisfy second-order cone friction bound ||m·a_{xy}||_2 <= mu·m(g - a_z) during maximum deceleration.',
      'Packed according to LIFO DAG: boxes required earlier at chutes must never be blocked beneath later boxes.',
    ],
  },
  {
    id: 'OBJ_PARCEL_HAZ',
    name: 'Hazardous / Flammable Material SKU',
    category: 'STORAGE',
    visualDescription: 'High-visibility crimson red container with subtle pulsing glow, indicating regulated chemical or hazardous contents.',
    hexColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    operationalPurpose: 'Identifies hazardous goods (HAZ_A, HAZ_B, FLAMMABLE, CORROSIVE) that require strict spatial segregation and handling constraints.',
    mathematicalInvariants: 'Safety segregation distance: d_haz >= 1.5m from incompatible classes; Robot speed capped at 1.2 m/s while carrying hazardous payload.',
    associatedRestrictions: ['R5 (Hazardous Materials Co-Loading & Segregation)', 'R11 (Dynamic Velocity Scaling)'],
    operationalRules: [
      'Incompatible hazard categories must never be co-loaded onto the same AMR payload deck.',
      'Trigger automated emergency response routing and designated safety aisle clearances.',
    ],
  },
  {
    id: 'OBJ_PERIMETER_BARRIER',
    name: 'Perimeter Safety Boundary & Pylons',
    category: 'SAFETY',
    visualDescription: 'Dual-frequency glowing neon cyan laser boundary lines (Y=0.25m and Y=1.8m) anchored by 8 structural corner/edge safety pylons with amber beacons.',
    hexColor: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.9)',
    operationalPurpose: 'Delineates the absolute physical envelope of the 150m x 100m warehouse, preventing any robot, route, or stop leakage beyond facility limits.',
    mathematicalInvariants: 'Physical footprint: X in [0.0, 150.0]m, Z in [0.0, 100.0]m; Safety clearance: d_wall >= 2.0m; Leakage rate: Exactly 0.0%.',
    associatedRestrictions: ['R1 (Kinematic Boundaries)', 'Gate-1 Verification (Physical Containment)'],
    operationalRules: [
      'All route stops must maintain a minimum 2.0m buffer from the perimeter laser fence.',
      'Audited continuously by floorBoundsCalculator.ts; any breach immediately invalidates the Popperian falsification token.',
    ],
  },
  {
    id: 'OBJ_WAYPOINTS',
    name: 'Discrete Route Stop Waypoints',
    category: 'NAVIGATION',
    visualDescription: 'Illuminated cylindrical floor discs positioned at each stop coordinate: Cyan for Depots, Amber for Pickups, Emerald for Drops.',
    hexColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.6)',
    operationalPurpose: 'Marks the exact physical coordinates and sequential order of vehicle task stops along the synthesized mission trajectory.',
    mathematicalInvariants: 'Arrival & departure time windows: e_i <= t_i <= l_i; Dwell duration: tau_i = t_{dep} - t_{arr}; Stop sequence: s_1 -> s_2 -> ... -> s_N.',
    associatedRestrictions: ['R8 (Time Window SLA Open and Deadlines)', 'R10 (Order Line Service Times)'],
    operationalRules: [
      'AMRs must arrive within customer order pickup windows to avoid beta penalty cost escalation.',
      'Color indicates stop action: Cyan (Replenish/Dock), Amber (Carton Pickup), Emerald (Chute Drop).',
    ],
  },
];

export const SCENE_3D_VEHICLE_COLORS: RouteColorSpec[] = [
  { vehicleId: 'AMR-1', name: 'Alpha Runner', hex: '#00f0ff', deckGlow: 'rgba(0, 240, 255, 0.6)', trailGlow: '#00f0ff', frequency: '450 THz' },
  { vehicleId: 'AMR-2', name: 'Beta Hauler', hex: '#10b981', deckGlow: 'rgba(16, 185, 129, 0.6)', trailGlow: '#10b981', frequency: '520 THz' },
  { vehicleId: 'AMR-3', name: 'Gamma Carrier', hex: '#f59e0b', deckGlow: 'rgba(245, 158, 11, 0.6)', trailGlow: '#f59e0b', frequency: '580 THz' },
  { vehicleId: 'AMR-4', name: 'Delta Lifter', hex: '#a855f7', deckGlow: 'rgba(168, 85, 247, 0.6)', trailGlow: '#a855f7', frequency: '690 THz' },
  { vehicleId: 'AMR-5', name: 'Epsilon Swift', hex: '#3b82f6', deckGlow: 'rgba(59, 130, 246, 0.6)', trailGlow: '#3b82f6', frequency: '620 THz' },
  { vehicleId: 'AMR-6', name: 'Zeta Express', hex: '#ec4899', deckGlow: 'rgba(236, 72, 153, 0.6)', trailGlow: '#ec4899', frequency: '720 THz' },
  { vehicleId: 'AMR-7', name: 'Eta Cruiser', hex: '#14b8a6', deckGlow: 'rgba(20, 184, 166, 0.6)', trailGlow: '#14b8a6', frequency: '500 THz' },
  { vehicleId: 'AMR-8', name: 'Theta Heavy', hex: '#f97316', deckGlow: 'rgba(249, 115, 22, 0.6)', trailGlow: '#f97316', frequency: '595 THz' },
];

export const SCENE_3D_SAFETY_STANDARDS = [
  {
    standard: 'ISO 3691-4:2023',
    title: 'Industrial Trucks — Safety Requirements and Verification',
    details: 'Mandates automatic optical/laser protective fields. AMR must immediately decelerate to v <= 0.4 m/s within 1.5m of human workers and halt completely if within 0.5m braking envelope.',
  },
  {
    standard: 'VDI 2510 / VDI 4452',
    title: 'Automated Guided Vehicle Systems (AGVS)',
    details: 'Defines battery charging protocols, inductive loop tolerances, floor flatness indices, and minimum passing clearances in narrow warehouse aisles.',
  },
  {
    standard: 'SIPP Continuous Clearance',
    title: 'Safe Interval Path Planning Envelope',
    details: 'Spatiotemporal swept-volume reservation guarantees that Minkowski sum envelopes ||p_i(t) - p_j(t)|| >= 2·R + D_safe never intersect across time t in [0, T].',
  },
];
