/**
 * Centralized Route Registry & Navigation Engine
 * Hierarchical URL definitions, direct-access deep link matching, and SEO metadata specs
 *
 * WMS Quantum Digital Twin 3D Simulator | YesAndNo Group
 */

import { PageMetadataSpec } from './headMetadata';
import { PDFProfileId } from '../data/reportsRegistry';

export type StudioTabId =
  | '3d-sim'
  | '2d-route-map'
  | 'dataset'
  | 'tiers'
  | 'quantum'
  | 'graphs'
  | 'comparison'
  | 'telemetry';

export interface RouteTargetState {
  tab?: StudioTabId;
  selectedEntity?: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus';
  selectedArchetype?: string;
  selectedTier?: string;
  isQuickDrawerOpen?: boolean;
  isConfigDrawerOpen?: boolean;
  isExplainerOpen?: boolean;
  isQuantumPanelOpen?: boolean;
  isConceptModalOpen?: boolean;
  isStepsModalOpen?: boolean;
  reportsRepoMode?: 'minimized' | 'expanded';
  pdfProfileToOpen?: PDFProfileId;
  generatorParamKey?: string;
  panelAction?: 'minimize' | 'restore';
  externalUrl?: string;
}

export interface NavigationRouteDefinition {
  id: string;
  path: string;
  aliases?: string[];
  label: string;
  shortLabel?: string;
  pillarId: string;
  pillarTitle: string;
  menuLevel: 1 | 2 | 3;
  targetTab?: StudioTabId;
  sitemap: {
    changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number; // 0.0 to 1.0
  };
  meta: PageMetadataSpec;
  state: RouteTargetState;
}

export const NAVIGATION_ROUTES: NavigationRouteDefinition[] = [
  // ----------------------------------------------------
  // Root & Facility Overview
  // ----------------------------------------------------
  {
    id: 'root-overview',
    path: '/',
    aliases: ['/simulation', '/3d-sim', '/digital-twin'],
    label: '3D Warehouse Digital Twin',
    shortLabel: '3D Twin',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 1,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'daily', priority: 1.0 },
    meta: {
      title: '3D Cyber-Physical Warehouse Digital Twin',
      description: 'Interactive real-time 3D Three.js warehouse digital twin with automated guided vehicles (AMRs), dynamic congestion zones, and quantum-optimized routing.',
      keywords: ['3D Warehouse', 'Digital Twin', 'Three.js', 'AMR Fleet', 'Cyber-Physical Systems', 'Classiq QAOA'],
      canonicalPath: '/',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'overview',
      selectedEntity: null,
    },
  },
  {
    id: 'sub-facility-envelope',
    path: '/simulation/overview',
    aliases: ['/overview', '/twin/overview'],
    label: 'Facility Overview (150m×100m)',
    shortLabel: 'Facility Bounds',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: 'Facility Overview & Envelope Bounds (150m×100m)',
      description: 'Macro perspective of the 150m×100m industrial logistics facility floor, staging zones, charging docks, and high-bay racking systems.',
      keywords: ['Warehouse Envelope', 'Staging Zones', 'Charging Docks', 'Logistics Macro Layout'],
      canonicalPath: '/simulation/overview',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'overview',
    },
  },

  // ----------------------------------------------------
  // Pillar 1: Fleet AMRs
  // ----------------------------------------------------
  {
    id: 'amr-fleet',
    path: '/simulation/fleet',
    label: 'Active AMR Fleet (4 AMRs)',
    shortLabel: 'AMR Fleet',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 2,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'daily', priority: 0.85 },
    meta: {
      title: 'Autonomous Mobile Robot (AMR) Fleet Telemetry',
      description: 'Real-time battery state of charge (SoC), velocity, orientation, and kinematic trajectories across 4 active AMRs.',
      keywords: ['AMR Fleet', 'Battery SoC', 'Kinematic Telemetry', 'AGV Fleet Management'],
      canonicalPath: '/simulation/fleet',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'overview',
    },
  },
  {
    id: 'AMR_001',
    path: '/simulation/amr/AMR_001',
    aliases: ['/amr/AMR_001', '/amr/1', '/twin/amr/AMR_001'],
    label: 'AMR-01 (Heavy Payload Transporter)',
    shortLabel: 'AMR-01',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR-01 Heavy Payload Transporter Telemetry',
      description: 'Live kinematic tracking, 88% battery SoC, 1.38 m/s speed, and high-capacity payload routing for AMR-01.',
      keywords: ['AMR-01', 'Heavy Payload', 'Battery 88%', 'Trajectory Tracking'],
      canonicalPath: '/simulation/amr/AMR_001',
    },
    state: {
      tab: '3d-sim',
      selectedEntity: { type: 'AMR', id: 'AMR_001', telemetry: { soc: 88, speed: 1.38 } },
      cameraPreset: 'follow',
    },
  },
  {
    id: 'AMR_002',
    path: '/simulation/amr/AMR_002',
    aliases: ['/amr/AMR_002', '/amr/2', '/twin/amr/AMR_002'],
    label: 'AMR-02 (Standard Toter Carrier)',
    shortLabel: 'AMR-02',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR-02 Standard Toter Carrier Telemetry',
      description: 'Live telemetry, 92% battery SoC, 1.45 m/s speed, and dynamic tote handling kinematics for AMR-02.',
      keywords: ['AMR-02', 'Standard Toter', 'Battery 92%', 'Tote Handling'],
      canonicalPath: '/simulation/amr/AMR_002',
    },
    state: {
      tab: '3d-sim',
      selectedEntity: { type: 'AMR', id: 'AMR_002', telemetry: { soc: 92, speed: 1.45 } },
      cameraPreset: 'follow',
    },
  },
  {
    id: 'AMR_003',
    path: '/simulation/amr/AMR_003',
    aliases: ['/amr/AMR_003', '/amr/3', '/twin/amr/AMR_003'],
    label: 'AMR-03 (Narrow Aisle Navigator)',
    shortLabel: 'AMR-03',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR-03 Narrow Aisle High-Density Navigator',
      description: 'Live kinematic tracking, 76% battery SoC, 1.20 m/s velocity, and precision racking navigation for AMR-03.',
      keywords: ['AMR-03', 'Narrow Aisle', 'Battery 76%', 'Precision Navigation'],
      canonicalPath: '/simulation/amr/AMR_003',
    },
    state: {
      tab: '3d-sim',
      selectedEntity: { type: 'AMR', id: 'AMR_003', telemetry: { soc: 76, speed: 1.20 } },
      cameraPreset: 'follow',
    },
  },
  {
    id: 'AMR_004',
    path: '/simulation/amr/AMR_004',
    aliases: ['/amr/AMR_004', '/amr/4', '/twin/amr/AMR_004'],
    label: 'AMR-04 (High-Velocity Sprint Vehicle)',
    shortLabel: 'AMR-04',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR-04 High-Speed Sprint Vehicle Telemetry',
      description: 'High-speed dispatching telemetry, 84% battery SoC, 1.62 m/s sprint speed, and rapid order turnover for AMR-04.',
      keywords: ['AMR-04', 'High Speed', 'Battery 84%', 'Rapid Dispatching'],
      canonicalPath: '/simulation/amr/AMR_004',
    },
    state: {
      tab: '3d-sim',
      selectedEntity: { type: 'AMR', id: 'AMR_004', telemetry: { soc: 84, speed: 1.62 } },
      cameraPreset: 'follow',
    },
  },

  // ----------------------------------------------------
  // Camera Presets
  // ----------------------------------------------------
  {
    id: 'cam-top',
    path: '/simulation/camera/top',
    aliases: ['/camera/top'],
    label: 'Top-Down Orthographic Perspective',
    shortLabel: 'Top Cam',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.75 },
    meta: {
      title: 'Top-Down Orthographic Warehouse View',
      description: 'Overhead 2D/3D orthographic projection of warehouse transit aisles, charging bays, and obstacle zones.',
      keywords: ['Orthographic Camera', 'Warehouse Top View', 'Aisle Grid Map'],
      canonicalPath: '/simulation/camera/top',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'top',
    },
  },
  {
    id: 'cam-iso',
    path: '/simulation/camera/isometric',
    aliases: ['/camera/isometric', '/camera/iso'],
    label: 'Isometric 45° Cyber-Perspective',
    shortLabel: 'Isometric Cam',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.75 },
    meta: {
      title: 'Isometric 45° Cyber-Perspective 3D View',
      description: 'Standard axonometric 45° perspective for optimal spatial awareness across multi-level racking and AGVs.',
      keywords: ['Isometric View', 'Cyber Perspective', 'Axonometric Logistics'],
      canonicalPath: '/simulation/camera/isometric',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'isometric',
    },
  },
  {
    id: 'cam-follow',
    path: '/simulation/camera/follow',
    aliases: ['/camera/follow'],
    label: 'Floor Follower (Cab Ride) Camera',
    shortLabel: 'Follow Cam',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.75 },
    meta: {
      title: 'Floor Follower Cab-Ride Camera Perspective',
      description: 'First-person ground-level chase camera tethered directly behind active warehouse AMRs.',
      keywords: ['Chase Camera', 'Cab Ride', 'First Person AGV Tracking'],
      canonicalPath: '/simulation/camera/follow',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'follow',
    },
  },
  {
    id: 'cam-chute',
    path: '/simulation/camera/chutes',
    aliases: ['/camera/chute', '/camera/chutes'],
    label: 'Chute Array Focus (C1–C4)',
    shortLabel: 'Chute Cam',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'weekly', priority: 0.75 },
    meta: {
      title: 'Chute Discharge Terminal & Sorter Focus',
      description: 'Dedicated camera focusing on discharge chute terminals C1 through C4 and outbound tote collection.',
      keywords: ['Chute Array', 'Conveyor Drop Gate', 'Outbound Sorting'],
      canonicalPath: '/simulation/camera/chutes',
    },
    state: {
      tab: '3d-sim',
      cameraPreset: 'chute-focus',
    },
  },

  // ----------------------------------------------------
  // Floating HUD Panels
  // ----------------------------------------------------
  {
    id: 'panels-min-all',
    path: '/simulation/panels/minimize',
    label: 'Minimize All Floating Panels',
    shortLabel: 'Min Panels',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.6 },
    meta: {
      title: 'Uncluttered Full-Screen 3D Simulation Mode',
      description: 'Minimizes all floating glassmorphic telemetry panels to provide full viewport clarity.',
      keywords: ['Full Viewport', 'Zen Mode', 'Clean 3D Simulation'],
      canonicalPath: '/simulation/panels/minimize',
    },
    state: {
      tab: '3d-sim',
      panelAction: 'minimize',
    },
  },
  {
    id: 'panels-restore-all',
    path: '/simulation/panels/restore',
    label: 'Restore & Expand Active HUD Panels',
    shortLabel: 'Restore Panels',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.6 },
    meta: {
      title: 'Restore All Floating Telemetry Panels',
      description: 'Restores the Quantum Co-Processor Inspector and Reports Repository docks onto the HUD.',
      keywords: ['Restore Panels', 'HUD Docks', 'Telemetry HUD'],
      canonicalPath: '/simulation/panels/restore',
    },
    state: {
      tab: '3d-sim',
      panelAction: 'restore',
    },
  },

  // ----------------------------------------------------
  // 2D Route Map
  // ----------------------------------------------------
  {
    id: 'menu-2d-route-map',
    path: '/2d-route-map',
    aliases: ['/map-2d', '/routes-2d'],
    label: '2D Coordinate Routing Map',
    shortLabel: '2D Map',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 2,
    targetTab: '2d-route-map',
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: '2D Coordinate Space Routing & Collision Free Paths',
      description: 'High-precision 2D floor grid layout displaying AMR trajectory arcs, time-space waypoints, and depot staging coordinates.',
      keywords: ['2D Route Map', 'Collision Avoidance', 'Time-Space Waypoints', 'PBS SIPP'],
      canonicalPath: '/2d-route-map',
    },
    state: {
      tab: '2d-route-map',
    },
  },
  {
    id: 'sub-trajectories',
    path: '/2d-route-map/trajectories',
    label: 'Route Trajectories & Waypoints',
    shortLabel: 'Trajectories',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '2d-route-map',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR Kinematic Trajectories & Bezier Arcs',
      description: 'Detailed analysis of continuous-curvature Bezier paths and orientation changes across warehouse intersections.',
      keywords: ['Kinematic Trajectories', 'Continuous Curvature', 'Bezier S-Curves'],
      canonicalPath: '/2d-route-map/trajectories',
    },
    state: {
      tab: '2d-route-map',
    },
  },
  {
    id: 'sub-chute-contention',
    path: '/2d-route-map/chutes',
    label: 'Chute Contention & Queue Buffers',
    shortLabel: 'Chute Queue',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: '2d-route-map',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Chute Contention Analysis & Queue Buffer Zones',
      description: 'Deadlock avoidance, buffer queue allocations, and discharge gate availability across chutes C1 through C4.',
      keywords: ['Chute Contention', 'Buffer Queue', 'Deadlock Avoidance', 'Discharge Gates'],
      canonicalPath: '/2d-route-map/chutes',
    },
    state: {
      tab: '2d-route-map',
    },
  },

  // ----------------------------------------------------
  // Telemetry Console
  // ----------------------------------------------------
  {
    id: 'menu-telemetry',
    path: '/telemetry',
    aliases: ['/console/telemetry', '/stream'],
    label: 'Real-Time Telemetry Console',
    shortLabel: 'Telemetry',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 2,
    targetTab: 'telemetry',
    sitemap: { changefreq: 'daily', priority: 0.85 },
    meta: {
      title: 'Real-Time Telemetry & Kinematics Stream Console',
      description: 'High-frequency telemetry feed monitoring linear/angular velocities, battery draw, OpenTelemetry traces, and RPC latency.',
      keywords: ['Kinematics Stream', 'OpenTelemetry Spans', 'RPC Latency', 'Telemetry Dashboard'],
      canonicalPath: '/telemetry',
    },
    state: {
      tab: 'telemetry',
    },
  },
  {
    id: 'sub-kinematics',
    path: '/telemetry/kinematics',
    label: 'AMR Kinematics Stream (x, y, θ, v)',
    shortLabel: 'Kinematics',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: 'telemetry',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Live Kinematics Stream (x, y, θ, v)',
      description: 'Sub-millisecond state vectors for AMR position, heading angle θ, linear speed, and wheel traction.',
      keywords: ['State Vectors', 'Heading Angle', 'Sub-millisecond Telemetry'],
      canonicalPath: '/telemetry/kinematics',
    },
    state: {
      tab: 'telemetry',
    },
  },
  {
    id: 'sub-opentelemetry',
    path: '/telemetry/spans',
    label: 'OpenTelemetry Spans & Waterfall Tracing',
    shortLabel: 'OTel Spans',
    pillarId: 'pillar-1',
    pillarTitle: 'Digital Twin & Fleet Operations',
    menuLevel: 3,
    targetTab: 'telemetry',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'OpenTelemetry Distributed Spans & Waterfall Tracing',
      description: 'Trace distributed execution spans across Tier 1 Quantum FCM, Tier 2 CP-SAT, Tier 3 Classiq QAOA, and Tier 4 SIPP.',
      keywords: ['Distributed Tracing', 'OpenTelemetry Spans', 'Execution Waterfall'],
      canonicalPath: '/telemetry/spans',
    },
    state: {
      tab: 'telemetry',
    },
  },

  // ----------------------------------------------------
  // Pillar 2: Workload, Orders & Depots
  // ----------------------------------------------------
  {
    id: 'menu-workload-params',
    path: '/orders-depots',
    aliases: ['/workload/params', '/generator'],
    label: 'Dispatch Orders & Depot Parameters',
    shortLabel: 'Orders & Depots',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 2,
    targetTab: 'dataset',
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: 'Dispatch Orders & Depot Workload Configuration',
      description: 'Configure batch order sizes, replenishment depot coordinates, vehicle pool capacities, and chute distribution arrays.',
      keywords: ['Dispatch Orders', 'Depot Locations', 'Fleet Capacity', 'Workload Generator'],
      canonicalPath: '/orders-depots',
    },
    state: {
      tab: 'dataset',
      generatorParamKey: 'num_orders',
    },
  },
  {
    id: 'sub-orders-amount-param',
    path: '/orders-depots/num-orders',
    label: 'Dispatch Orders Amount (num_orders: 5–150)',
    shortLabel: 'Num Orders',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Dispatch Orders Batch Size Tuning (5–150 Orders)',
      description: 'Scale order batch density to stress-test quantum QUBO penalty formulations and clustering algorithms.',
      keywords: ['Batch Density', 'Order Clustering', 'QUBO Penalty Scaling'],
      canonicalPath: '/orders-depots/num-orders',
    },
    state: {
      tab: 'dataset',
      generatorParamKey: 'num_orders',
    },
  },
  {
    id: 'sub-depots-param',
    path: '/orders-depots/depots',
    label: 'Depot Quantity & Positions (num_depots: 1–6)',
    shortLabel: 'Depots Setup',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Multi-Depot Logistics Configuration (1–6 Depots)',
      description: 'Place replenishment depots and cross-docking staging points across the warehouse perimeter.',
      keywords: ['Multi-Depot VRP', 'Cross-Docking', 'Replenishment Depots'],
      canonicalPath: '/orders-depots/depots',
    },
    state: {
      tab: 'dataset',
      generatorParamKey: 'num_depots',
    },
  },
  {
    id: 'sub-fleet-sizing-param',
    path: '/orders-depots/fleet-size',
    label: 'AMR Fleet Sizing & Vehicles (num_vehicles: 1–16)',
    shortLabel: 'Fleet Size',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'AMR Fleet Sizing & Payload Capacity Allocation',
      description: 'Tune vehicle pool size from 1 to 16 AMRs, balancing payload distribution and makespan efficiency.',
      keywords: ['Fleet Sizing', 'Vehicle Capacity', 'Makespan Optimization'],
      canonicalPath: '/orders-depots/fleet-size',
    },
    state: {
      tab: 'dataset',
      generatorParamKey: 'num_vehicles',
    },
  },
  {
    id: 'sub-chutes-param',
    path: '/orders-depots/chutes',
    label: 'Chute Drop Arrays & Sorters (num_chutes: 1–8)',
    shortLabel: 'Chutes Array',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Discharge Chute Terminal Sizing (1–8 Chutes)',
      description: 'Configure high-throughput discharge sorting chutes to mitigate delivery bottlenecks.',
      keywords: ['Sorting Chutes', 'Drop Arrays', 'Throughput Balancing'],
      canonicalPath: '/orders-depots/chutes',
    },
    state: {
      tab: 'dataset',
      generatorParamKey: 'num_chutes',
    },
  },
  {
    id: 'sub-quick-workload-drawer',
    path: '/workload/quick-drawer',
    label: 'Quick Workload Drawer (Orders, Fleet & Seed)',
    shortLabel: 'Quick Drawer',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.75 },
    meta: {
      title: 'Quick Slide-Out Workload Drawer',
      description: 'Rapid slide-out drawer to adjust random seed, order count, and vehicle allocation in seconds.',
      keywords: ['Quick Workload', 'Random Seed', 'Fleet Sizing Drawer'],
      canonicalPath: '/workload/quick-drawer',
    },
    state: {
      tab: 'dataset',
      isQuickDrawerOpen: true,
    },
  },
  {
    id: 'sub-engineering-limits-drawer',
    path: '/workload/specs',
    aliases: ['/config/specs', '/parameters'],
    label: '36 Engineering Parameters & Limits Drawer',
    shortLabel: '36 Specs',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: '36 Engineering Parameters, Safety Limits & KaTeX Formulas',
      description: 'In-depth engineering configuration drawer with KaTeX mathematical bounds, Lagrange multipliers, and DIN EN ISO 3691-4 parameters.',
      keywords: ['36 Engineering Specs', 'KaTeX Formulas', 'Safety Limits', 'Lagrange Multipliers'],
      canonicalPath: '/workload/specs',
    },
    state: {
      tab: 'dataset',
      isConfigDrawerOpen: true,
    },
  },

  // ----------------------------------------------------
  // Archetypes
  // ----------------------------------------------------
  {
    id: 'menu-dataset',
    path: '/dataset',
    aliases: ['/scenarios', '/archetypes'],
    label: 'Dataset & Scenario Studio (CRUD)',
    shortLabel: 'Dataset Studio',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 2,
    targetTab: 'dataset',
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: 'Dataset & Warehouse Scenario Archetypes Studio',
      description: 'Select and benchmark five real-world industrial warehouse archetypes: Mega-Fulfillment, Automotive JIS, Pharma Cold-Chain, Micro-Fulfillment, and Heavy Industrial.',
      keywords: ['Warehouse Scenarios', 'Industrial Archetypes', 'Benchmarking Studio', 'Classiq Models'],
      canonicalPath: '/dataset',
    },
    state: {
      tab: 'dataset',
    },
  },
  {
    id: 'arch-mega',
    path: '/dataset/archetype/mega-fulfillment',
    aliases: ['/archetype/mega-fulfillment'],
    label: 'Mega-Fulfillment E-Commerce Archetype',
    shortLabel: 'Mega-Fulfillment',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Mega-Fulfillment E-Commerce Archetype (150m×100m, 80 Orders)',
      description: 'High-density e-commerce fulfillment center with 4 chutes, high SKU velocity, and multi-depot replenishment.',
      keywords: ['Mega-Fulfillment', 'E-Commerce Logistics', 'High SKU Density'],
      canonicalPath: '/dataset/archetype/mega-fulfillment',
    },
    state: {
      tab: 'dataset',
      selectedArchetype: 'MEGA_FULFILLMENT_E_COMMERCE',
    },
  },
  {
    id: 'arch-auto',
    path: '/dataset/archetype/automotive-jis',
    aliases: ['/archetype/automotive-jis'],
    label: 'Automotive Just-In-Sequence (JIS) Archetype',
    shortLabel: 'Automotive JIS',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Automotive Just-In-Sequence (JIS) Assembly Logistics',
      description: 'Strict time-window assembly line feeding with zero tolerance for sequence violation and buffer stalls.',
      keywords: ['Automotive JIS', 'Just-In-Sequence', 'Assembly Line Feeding', 'Strict Time Windows'],
      canonicalPath: '/dataset/archetype/automotive-jis',
    },
    state: {
      tab: 'dataset',
      selectedArchetype: 'AUTOMOTIVE_JUST_IN_SEQUENCE',
    },
  },
  {
    id: 'arch-cold',
    path: '/dataset/archetype/cold-chain',
    aliases: ['/archetype/cold-chain'],
    label: 'Pharmaceutical Cold-Chain Logistics Archetype',
    shortLabel: 'Pharma Cold-Chain',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Pharmaceutical Cold-Chain & Expiry Constraint Logistics',
      description: 'Temperature-controlled zone dispatching with hard time-at-temperature limits and FIFO vaccine parcel handling.',
      keywords: ['Cold Chain', 'Pharma Logistics', 'Temperature Constraints', 'Strict FIFO'],
      canonicalPath: '/dataset/archetype/cold-chain',
    },
    state: {
      tab: 'dataset',
      selectedArchetype: 'PHARMACEUTICAL_COLD_CHAIN',
    },
  },
  {
    id: 'arch-micro',
    path: '/dataset/archetype/micro-fulfillment',
    aliases: ['/archetype/micro-fulfillment'],
    label: 'Urban Micro-Fulfillment Dark-Store Archetype',
    shortLabel: 'Micro-Fulfillment',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Urban Micro-Fulfillment & Dark Store Fast Dispatch',
      description: 'Ultra-dense 15-minute quick-commerce warehouse model with narrow aisles and rapid chute turnover.',
      keywords: ['Micro-Fulfillment', 'Dark Store', 'Quick Commerce', 'Ultra-Dense Layout'],
      canonicalPath: '/dataset/archetype/micro-fulfillment',
    },
    state: {
      tab: 'dataset',
      selectedArchetype: 'URBAN_MICRO_FULFILLMENT',
    },
  },
  {
    id: 'arch-heavy',
    path: '/dataset/archetype/heavy-industrial',
    aliases: ['/archetype/heavy-industrial'],
    label: 'Heavy Industrial & Container Logistics Archetype',
    shortLabel: 'Heavy Industrial',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'dataset',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Heavy Industrial Machinery & Foundry Transport Archetype',
      description: 'Heavy payload distribution with strict turning radiuses, acceleration limits, and structural load constraints.',
      keywords: ['Heavy Industrial', 'Foundry Logistics', 'Structural Load Limits', 'Heavy AMRs'],
      canonicalPath: '/dataset/archetype/heavy-industrial',
    },
    state: {
      tab: 'dataset',
      selectedArchetype: 'HEAVY_INDUSTRIAL_LOGISTICS',
    },
  },

  // ----------------------------------------------------
  // 4-Tier Optimization Pipeline
  // ----------------------------------------------------
  {
    id: 'menu-tiers',
    path: '/tiers',
    aliases: ['/pipeline', '/solver-tiers'],
    label: '4-Tier Optimization Pipeline',
    shortLabel: '4 Tiers',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 2,
    targetTab: 'tiers',
    sitemap: { changefreq: 'daily', priority: 0.95 },
    meta: {
      title: '4-Tier Hybrid Quantum-Classical Optimization Pipeline',
      description: 'Decomposed 4-tier logistics optimization: Tier 1 Quantum FCM, Tier 2 CP-SAT 3D BPP, Tier 3 Classiq QAOA Routing, and Tier 4 Continuous SIPP.',
      keywords: ['4-Tier Pipeline', 'Quantum FCM', 'CP-SAT MISOCP', 'Classiq QAOA', 'SIPP MAPF'],
      canonicalPath: '/tiers',
    },
    state: {
      tab: 'tiers',
    },
  },
  {
    id: 'sub-tier-1',
    path: '/tiers/tier1',
    aliases: ['/tier1', '/clustering'],
    label: 'Tier 1: Quantum Fuzzy C-Means (FCM) Clustering',
    shortLabel: 'Tier 1 FCM',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'tiers',
    sitemap: { changefreq: 'weekly', priority: 0.9 },
    meta: {
      title: 'Tier 1: Quantum Fuzzy C-Means (FCM) Order Clustering',
      description: 'Quantum adiabatic and distance-metric clustering partitioning batch orders across AMR vehicle pools.',
      keywords: ['Tier 1', 'Quantum FCM', 'Fuzzy Clustering', 'AMR Partitioning'],
      canonicalPath: '/tiers/tier1',
    },
    state: {
      tab: 'tiers',
      selectedTier: 'tier1',
    },
  },
  {
    id: 'sub-tier-2',
    path: '/tiers/tier2',
    aliases: ['/tier2', '/bin-packing'],
    label: 'Tier 2: CP-SAT MISOCP 3D Bin Packing (LIFO DAG)',
    shortLabel: 'Tier 2 3D BPP',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'tiers',
    sitemap: { changefreq: 'weekly', priority: 0.9 },
    meta: {
      title: 'Tier 2: CP-SAT MISOCP 3D Bin Packing & LIFO Constraint',
      description: 'Exact mixed-integer 3D containerization enforcing center-of-gravity stability and Last-In-First-Out unloading sequences.',
      keywords: ['Tier 2', 'CP-SAT', '3D Bin Packing', 'LIFO DAG', 'MISOCP'],
      canonicalPath: '/tiers/tier2',
    },
    state: {
      tab: 'tiers',
      selectedTier: 'tier2',
    },
  },
  {
    id: 'sub-tier-3',
    path: '/tiers/tier3',
    aliases: ['/tier3', '/qaoa-routing'],
    label: 'Tier 3: Classiq QAOA Subtour Elimination Synthesis',
    shortLabel: 'Tier 3 QAOA',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'tiers',
    sitemap: { changefreq: 'weekly', priority: 0.9 },
    meta: {
      title: 'Tier 3: Classiq QAOA Subtour Elimination Quantum Routing',
      description: '32-qubit QAOA circuit synthesized via Classiq platform to solve Miller-Tucker-Zemlin subtour elimination constraints.',
      keywords: ['Tier 3', 'Classiq QAOA', '32Q Circuit', 'Subtour Elimination', 'QUBO VRP'],
      canonicalPath: '/tiers/tier3',
    },
    state: {
      tab: 'tiers',
      selectedTier: 'tier3',
    },
  },
  {
    id: 'sub-tier-4',
    path: '/tiers/tier4',
    aliases: ['/tier4', '/sipp-mapf'],
    label: 'Tier 4: Priority-Based Search (PBS) + Continuous SIPP MAPF',
    shortLabel: 'Tier 4 SIPP',
    pillarId: 'pillar-2',
    pillarTitle: 'Workload, Scenarios & Solvers',
    menuLevel: 3,
    targetTab: 'tiers',
    sitemap: { changefreq: 'weekly', priority: 0.9 },
    meta: {
      title: 'Tier 4: Priority-Based Search (PBS) & Continuous SIPP MAPF',
      description: 'Multi-Agent Path Finding resolving kinematic collisions in continuous 3D time-space with zero deadlock guarantees.',
      keywords: ['Tier 4', 'PBS SIPP', 'MAPF', 'Collision Avoidance', 'Continuous Time-Space'],
      canonicalPath: '/tiers/tier4',
    },
    state: {
      tab: 'tiers',
      selectedTier: 'tier4',
    },
  },

  // ----------------------------------------------------
  // Pillar 3: Classiq Quantum Co-Processor
  // ----------------------------------------------------
  {
    id: 'menu-quantum-studio',
    path: '/quantum-studio',
    aliases: ['/quantum', '/coprocessor'],
    label: 'Quantum Studio & Circuit Synthesis',
    shortLabel: 'Quantum Studio',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 2,
    targetTab: 'quantum',
    sitemap: { changefreq: 'daily', priority: 0.95 },
    meta: {
      title: 'Classiq Quantum Co-Processor Studio & Circuit Synthesis',
      description: 'Inspect synthesized quantum circuits, QAOA cost landscape surfaces (γ, β), and measured bitstring energy distributions.',
      keywords: ['Classiq Quantum Studio', 'Circuit Synthesis', 'QAOA Landscape', 'Bitstring Spectrum'],
      canonicalPath: '/quantum-studio',
    },
    state: {
      tab: 'quantum',
    },
  },
  {
    id: 'sub-energy-landscape',
    path: '/quantum-studio/energy-surface',
    label: 'QAOA Cost Surface (γ, β Landscape)',
    shortLabel: 'Energy Landscape',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 3,
    targetTab: 'quantum',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'QAOA Cost Expectation Value Surface ⟨H_C⟩(γ, β)',
      description: '3D visualization of the quantum variational parameter landscape with classical optimizer convergence trajectories.',
      keywords: ['QAOA Energy Surface', 'Expectation Value', 'Gamma Beta Landscape', 'Variational Convergence'],
      canonicalPath: '/quantum-studio/energy-surface',
    },
    state: {
      tab: 'quantum',
    },
  },
  {
    id: 'sub-bitstring-spectrum',
    path: '/quantum-studio/bitstrings',
    label: 'Sampled Bitstrings & Ground State Cut',
    shortLabel: 'Bitstrings',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 3,
    targetTab: 'quantum',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Quantum Measurement Bitstrings & State Probabilities',
      description: 'Histogram of sampled quantum bitstrings verifying ground state convergence and optimal route cuts.',
      keywords: ['Quantum Measurement', 'Ground State', 'Bitstring Histogram', 'State Probability'],
      canonicalPath: '/quantum-studio/bitstrings',
    },
    state: {
      tab: 'quantum',
    },
  },
  {
    id: 'sub-qmod-specs',
    path: '/quantum-studio/qmod',
    label: 'Native Qmod Circuit Specifications',
    shortLabel: 'Qmod Specs',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 3,
    targetTab: 'quantum',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Native Classiq Qmod Circuit Model Specifications',
      description: 'Review high-level functional Qmod representations of constraints, cost Hamiltonians, and mixer unitaries.',
      keywords: ['Native Qmod', 'Classiq Language', 'Cost Hamiltonian', 'Mixer Unitary'],
      canonicalPath: '/quantum-studio/qmod',
    },
    state: {
      tab: 'quantum',
    },
  },
  {
    id: 'menu-quantum-util',
    path: '/quantum/profiling',
    aliases: ['/profiling/quantum'],
    label: 'Quantum Utilization & Profiling',
    shortLabel: 'Quantum Profiling',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 2,
    targetTab: 'quantum',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Quantum Hardware Profiling & Qubit Register Allocation',
      description: 'Modal profiling qubit register allocation across tiers, hardware transpilation depth, and Shannon von Neumann entropy.',
      keywords: ['Quantum Profiling', 'Qubit Register', 'Transpilation Depth', 'Hardware Benchmarks'],
      canonicalPath: '/quantum/profiling',
    },
    state: {
      tab: 'quantum',
      isQuantumPanelOpen: true,
    },
  },
  {
    id: 'menu-quantum-pdf',
    path: '/quantum/monograph',
    label: 'Quantum Monograph Dossier (3P PDF)',
    shortLabel: 'Quantum Monograph',
    pillarId: 'pillar-3',
    pillarTitle: 'Classiq Quantum Co-Processor',
    menuLevel: 3,
    targetTab: 'quantum',
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Quantum Monograph Engineering Dossier (3-Page PDF)',
      description: 'Export formal 3-page scientific monograph detailing Classiq compilation metrics, quantum gate counts, and depth reduction.',
      keywords: ['Quantum Monograph', 'Engineering Dossier', 'Gate Count Audit', 'Classiq Compilation'],
      canonicalPath: '/quantum/monograph',
    },
    state: {
      tab: 'quantum',
      pdfProfileToOpen: 'QUANTUM',
    },
  },

  // ----------------------------------------------------
  // Pillar 4: Analytics & Historical Comparison
  // ----------------------------------------------------
  {
    id: 'menu-graphs',
    path: '/graphs',
    aliases: ['/analytics', '/pareto'],
    label: 'Performance Analytics & Pareto Graphs',
    shortLabel: 'Analytics',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 2,
    targetTab: 'graphs',
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: 'Logistics Performance Analytics & Pareto Frontier Graphs',
      description: '10 interactive analytical charts: makespan vs distance Pareto frontier, solver compute latency, and chute load distribution.',
      keywords: ['Pareto Frontier', 'Makespan Optimization', 'Solver Latency', 'Chute Variance Heatmap'],
      canonicalPath: '/graphs',
    },
    state: {
      tab: 'graphs',
    },
  },
  {
    id: 'sub-pareto',
    path: '/graphs/pareto',
    label: 'Fleet Makespan & Distance Pareto Front',
    shortLabel: 'Pareto Front',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 3,
    targetTab: 'graphs',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Fleet Makespan vs Travel Distance Pareto Optimization',
      description: 'Multi-objective Pareto frontier illustrating trade-offs between fleet completion makespan and total electric vehicle mileage.',
      keywords: ['Pareto Frontier', 'Makespan vs Distance', 'Multi-Objective Optimization'],
      canonicalPath: '/graphs/pareto',
    },
    state: {
      tab: 'graphs',
    },
  },
  {
    id: 'sub-benchmarks',
    path: '/graphs/benchmarks',
    label: '4-Way Solver Latency Benchmark',
    shortLabel: 'Solver Benchmarks',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 3,
    targetTab: 'graphs',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: '4-Way Solver Execution Latency Benchmarking',
      description: 'Comparative latency breakdown across Classical Heuristic, OR-Tools CP-SAT, Hybrid Co-Processor, and Full Quantum QAOA.',
      keywords: ['Solver Benchmarking', 'Execution Latency', 'Classical vs Quantum'],
      canonicalPath: '/graphs/benchmarks',
    },
    state: {
      tab: 'graphs',
    },
  },
  {
    id: 'sub-heatmaps',
    path: '/graphs/heatmaps',
    label: 'Chute Balance Variance Heatmaps',
    shortLabel: 'Chute Heatmaps',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 3,
    targetTab: 'graphs',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Chute Balance Variance & Congestion Heatmaps',
      description: 'Heatmaps tracking discharge gate utilization, preventing conveyor jams and balancing AMR dock arrivals.',
      keywords: ['Chute Heatmaps', 'Variance Balancing', 'Dock Arrival Smoothing'],
      canonicalPath: '/graphs/heatmaps',
    },
    state: {
      tab: 'graphs',
    },
  },
  {
    id: 'menu-comparison',
    path: '/comparison',
    aliases: ['/diff', '/benchmark-diff'],
    label: 'Historical Run Comparative Benchmark',
    shortLabel: 'Comparison',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 2,
    targetTab: 'comparison',
    sitemap: { changefreq: 'daily', priority: 0.95 },
    meta: {
      title: 'Run Comparison & Diffing Studio | Head-to-Head Benchmarks',
      description: 'Side-by-side run comparative studio: compare Quantum vs Classical solver runs with Winner Trophy banners, stop counts, and KPI delta matrices.',
      keywords: ['Run Comparison', 'Diffing Studio', 'Quantum Advantage', 'KPI Delta Matrix', 'Historical Benchmarks'],
      canonicalPath: '/comparison',
    },
    state: {
      tab: 'comparison',
    },
  },
  {
    id: 'sub-delta-audit',
    path: '/comparison/delta',
    label: 'Quantum vs Classical Delta Audit',
    shortLabel: 'Delta Audit',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 3,
    targetTab: 'comparison',
    sitemap: { changefreq: 'weekly', priority: 0.9 },
    meta: {
      title: 'Quantum vs Classical Direct Delta Audit',
      description: 'Rigorous mathematical delta calculation measuring makespan reduction, energy savings, and stop count efficiency.',
      keywords: ['Delta Audit', 'Quantum Speedup', 'Efficiency Gains', 'Stop Count Comparison'],
      canonicalPath: '/comparison/delta',
    },
    state: {
      tab: 'comparison',
    },
  },
  {
    id: 'sub-regression-table',
    path: '/comparison/regression',
    label: 'Historical Regression Table',
    shortLabel: 'Regression Table',
    pillarId: 'pillar-4',
    pillarTitle: 'Analytics, Auditing & Reports',
    menuLevel: 3,
    targetTab: 'comparison',
    sitemap: { changefreq: 'weekly', priority: 0.85 },
    meta: {
      title: 'Historical Run Regression & Telemetry Audit Table',
      description: 'Complete audit log of past warehouse simulation runs with solver configurations, execution times, and objective values.',
      keywords: ['Regression Table', 'Audit Log', 'Telemetry History'],
      canonicalPath: '/comparison/regression',
    },
    state: {
      tab: 'comparison',
    },
  },

  // ----------------------------------------------------
  // Pillar 5: Knowledge, Theory & Developer Tools
  // ----------------------------------------------------
  {
    id: 'menu-concept-theory',
    path: '/theory/math',
    aliases: ['/theory', '/equations'],
    label: 'Mathematical Formulation & Theory',
    shortLabel: 'Theory Dossier',
    pillarId: 'pillar-5',
    pillarTitle: 'Knowledge, Theory & Developer Tools',
    menuLevel: 2,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.85 },
    meta: {
      title: 'Mathematical Formulation & Cyber-Physical Theory Dossier (473 Equations)',
      description: 'Exhaustive scientific formulation of the ER-MD-VRPTW-3D-HRI problem, safety proofs, and ISO compliance theorems.',
      keywords: ['Mathematical Formulation', '473 Equations', 'VRPTW Theory', 'ISO 3691-4', 'Cyber-Physical Systems'],
      canonicalPath: '/theory/math',
    },
    state: {
      isConceptModalOpen: true,
    },
  },
  {
    id: 'sub-vrptw-formulation',
    path: '/theory/equations',
    label: 'ER-MD-VRPTW-3D-HRI LaTeX Equations',
    shortLabel: 'LaTeX Specs',
    pillarId: 'pillar-5',
    pillarTitle: 'Knowledge, Theory & Developer Tools',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.8 },
    meta: {
      title: 'ER-MD-VRPTW-3D-HRI Formal LaTeX Specifications',
      description: 'Rigorous mathematical equations for energy-recuperation multi-depot vehicle routing with human-robot interaction constraints.',
      keywords: ['LaTeX Equations', 'ER-MD-VRPTW', 'HRI Constraints', 'Kinematics Formulas'],
      canonicalPath: '/theory/equations',
    },
    state: {
      isConceptModalOpen: true,
    },
  },
  {
    id: 'sub-iso-checklist',
    path: '/theory/iso-3691-4',
    label: 'DIN EN ISO 3691-4 Safety Checklist (15 Rules)',
    shortLabel: 'ISO 3691-4',
    pillarId: 'pillar-5',
    pillarTitle: 'Knowledge, Theory & Developer Tools',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.8 },
    meta: {
      title: 'DIN EN ISO 3691-4 Industrial AGV Safety Checklist (15 Rules)',
      description: 'Formal regulatory safety rules governing automatic braking distances, warning field fields, and collaborative robot speed limits.',
      keywords: ['DIN EN ISO 3691-4', 'AGV Safety', 'Braking Distances', 'Safety Checklist'],
      canonicalPath: '/theory/iso-3691-4',
    },
    state: {
      isConceptModalOpen: true,
    },
  },
  {
    id: 'sub-popperian-phi',
    path: '/theory/falsification',
    label: 'Popperian Falsification Proof (Φ = 0.880)',
    shortLabel: 'Popperian Proof',
    pillarId: 'pillar-5',
    pillarTitle: 'Knowledge, Theory & Developer Tools',
    menuLevel: 3,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.8 },
    meta: {
      title: 'Popperian Falsification Proof & Empirical Bound (Φ = 0.880)',
      description: 'Scientific demarcation proving empirical validity and falsifiability of the hybrid quantum co-processor dispatch model.',
      keywords: ['Popperian Proof', 'Falsification', 'Scientific Demarcation', 'Empirical Bound'],
      canonicalPath: '/theory/falsification',
    },
    state: {
      isConceptModalOpen: true,
    },
  },
  {
    id: 'menu-steps-progress',
    path: '/pipeline-steps',
    aliases: ['/pipeline/progress'],
    label: 'Execution Pipeline Latency & Steps',
    shortLabel: '7-Step Pipeline',
    pillarId: 'pillar-5',
    pillarTitle: 'Knowledge, Theory & Developer Tools',
    menuLevel: 2,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.8 },
    meta: {
      title: '7-Step Dispatch Engine Execution Pipeline Modal',
      description: 'Live step-by-step breakdown of the dispatching pipeline from order ingestion to kinematic execution in the 3D world.',
      keywords: ['7-Step Pipeline', 'Execution Stages', 'Dispatch Engine Architecture'],
      canonicalPath: '/pipeline-steps',
    },
    state: {
      isStepsModalOpen: true,
    },
  },
  {
    id: 'pillar-explainer',
    path: '/explainer',
    aliases: ['/mission', '/co-processor-explainer'],
    label: 'Mission & Co-Processor Explainer Drawer',
    shortLabel: 'Explainer',
    pillarId: 'pillar-explainer',
    pillarTitle: 'Mission & Co-Processor Explainer',
    menuLevel: 1,
    targetTab: '3d-sim',
    sitemap: { changefreq: 'monthly', priority: 0.85 },
    meta: {
      title: 'Mission & Quantum Co-Processor Architecture Explainer',
      description: 'Interactive architectural explainer outlining the industrial objectives, cyber-physical integration, and YesAndNo Group roadmap.',
      keywords: ['Mission Explainer', 'Quantum Co-Processor Architecture', 'YesAndNo Group Roadmap'],
      canonicalPath: '/explainer',
    },
    state: {
      isExplainerOpen: true,
    },
  },
  {
    id: 'pillar-sqlite-studio',
    path: '/sqlite',
    aliases: ['/sqlite.html', '/sql'],
    label: 'SQL Query Console & In-Browser Database Workspace',
    shortLabel: 'SQLite DB',
    pillarId: 'pillar-sqlite-studio',
    pillarTitle: 'SQL Query Console /sqlite',
    menuLevel: 1,
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'SQL Query Console & Telemetry Database Studio (/sqlite)',
      description: 'Interactive in-browser WebAssembly SQL console querying dispatchengine.db with live schema visualization and export.',
      keywords: ['SQLite Studio', 'WASM Database', 'SQL Console', 'Telemetry Queries'],
      canonicalPath: '/sqlite',
    },
    state: {
      externalUrl: '/sqlite',
    },
  },
  {
    id: 'pillar-reports-studio',
    path: '/reports',
    aliases: ['/reports-studio', '/dossiers'],
    label: 'Reports Manager Studio & Compliance Repository',
    shortLabel: 'Reports Studio',
    pillarId: 'pillar-reports-studio',
    pillarTitle: 'Reports Manager Studio',
    menuLevel: 1,
    sitemap: { changefreq: 'daily', priority: 0.9 },
    meta: {
      title: 'Reports Manager Studio & Compliance Artifact Repository',
      description: 'Generate, preview, and download formal PDF engineering compliance dossiers, executive summaries, and safety certificates.',
      keywords: ['Reports Studio', 'Compliance Dossiers', 'PDF Generation', 'Audit Certificates'],
      canonicalPath: '/reports',
    },
    state: {
      reportsRepoMode: 'expanded',
    },
  },
  {
    id: 'sub-studio-exec-brief',
    path: '/reports/executive',
    label: 'Executive Brief (2P PDF Report)',
    shortLabel: 'Exec Brief PDF',
    pillarId: 'pillar-reports-studio',
    pillarTitle: 'Reports Manager Studio',
    menuLevel: 3,
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Executive Brief Logistics Report (2-Page PDF)',
      description: 'High-level 2-page executive summary covering cost reductions, throughput gains, and fleet utilization metrics.',
      keywords: ['Executive Brief', 'PDF Report', 'ROI Summary', 'Fleet Utilization'],
      canonicalPath: '/reports/executive',
    },
    state: {
      reportsRepoMode: 'expanded',
      pdfProfileToOpen: 'EXECUTIVE',
    },
  },
  {
    id: 'sub-studio-audit-dossier',
    path: '/reports/comprehensive',
    label: 'Comprehensive Dossier (7P PDF Report)',
    shortLabel: '7P Dossier',
    pillarId: 'pillar-reports-studio',
    pillarTitle: 'Reports Manager Studio',
    menuLevel: 3,
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'Comprehensive Engineering Audit Dossier (7-Page PDF)',
      description: '7-page deep technical monograph complete with mathematical proofs, benchmark regression tables, and quantum circuit diagrams.',
      keywords: ['Comprehensive Dossier', 'Technical Monograph', 'Audit Documentation'],
      canonicalPath: '/reports/comprehensive',
    },
    state: {
      reportsRepoMode: 'expanded',
      pdfProfileToOpen: 'COMPREHENSIVE',
    },
  },
  {
    id: 'sub-studio-safety-cert',
    path: '/reports/certificate',
    label: 'Safety Audit Certificate (1P PDF)',
    shortLabel: 'Safety Certificate',
    pillarId: 'pillar-reports-studio',
    pillarTitle: 'Reports Manager Studio',
    menuLevel: 3,
    sitemap: { changefreq: 'weekly', priority: 0.8 },
    meta: {
      title: 'DIN EN ISO 3691-4 Safety Audit Certificate (1-Page PDF)',
      description: 'Official certification artifact verifying adherence to dynamic collision-free navigation and cyber-physical safety protocols.',
      keywords: ['Safety Certificate', 'DIN EN ISO 3691-4', 'Compliance Artifact'],
      canonicalPath: '/reports/certificate',
    },
    state: {
      reportsRepoMode: 'expanded',
      pdfProfileToOpen: 'CERTIFICATE',
    },
  },
];

/**
 * Normalizes URL path or hash string for robust matching.
 * e.g. '#/simulation/amr/AMR_001' or '/simulation/amr/AMR_001/' -> '/simulation/amr/AMR_001'
 */
export function normalizePath(pathOrHash: string): string {
  if (!pathOrHash) return '/';
  let cleaned = pathOrHash.trim();
  // Strip hash prefix if using hash-routing
  if (cleaned.startsWith('#')) {
    cleaned = cleaned.substring(1);
  }
  // Strip query string
  const queryIndex = cleaned.indexOf('?');
  if (queryIndex !== -1) {
    cleaned = cleaned.substring(0, queryIndex);
  }
  // Ensure leading slash
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }
  // Remove trailing slash if longer than 1 char
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    cleaned = cleaned.substring(0, cleaned.length - 1);
  }
  return cleaned.toLowerCase();
}

/**
 * Matches a URL pathname or hash against the centralized route registry.
 */
export function matchNavigationRoute(pathOrHash: string): NavigationRouteDefinition | null {
  const norm = normalizePath(pathOrHash);

  // 1. Direct path match
  const exact = NAVIGATION_ROUTES.find((r) => r.path.toLowerCase() === norm);
  if (exact) return exact;

  // 2. Alias match
  const aliasMatch = NAVIGATION_ROUTES.find((r) =>
    r.aliases?.some((a) => a.toLowerCase() === norm)
  );
  if (aliasMatch) return aliasMatch;

  // 3. Fallback for prefix / partial routes (e.g. /simulation/amr/1 -> /simulation/amr/AMR_001)
  if (norm.includes('/amr/')) {
    const rawId = norm.split('/amr/')[1]?.replace(/[-_]/g, '').toUpperCase();
    if (rawId) {
      const amrRoute = NAVIGATION_ROUTES.find((r) =>
        r.id.replace(/[-_]/g, '').toUpperCase().includes(rawId)
      );
      if (amrRoute) return amrRoute;
    }
  }

  // 4. Default to root if on root
  if (norm === '/' || norm === '') {
    return NAVIGATION_ROUTES[0];
  }

  return null;
}

/**
 * Finds route by menu item ID
 */
export function findRouteByItemId(itemId: string): NavigationRouteDefinition | undefined {
  return NAVIGATION_ROUTES.find((r) => r.id === itemId);
}

/**
 * Returns all canonical route paths for sitemap and LLM map generation
 */
export function getAllCanonicalRoutes(): NavigationRouteDefinition[] {
  return NAVIGATION_ROUTES;
}
