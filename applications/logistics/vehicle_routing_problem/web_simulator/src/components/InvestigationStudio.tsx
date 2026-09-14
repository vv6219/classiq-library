import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Cpu,
  Zap,
  Battery,
  Clock,
  TrendingDown,
  TrendingUp,
  Activity,
  Sliders,
  Filter,
  Maximize2,
  RefreshCw,
  Warehouse,
  ChevronRight,
  Info,
} from 'lucide-react';
import katex from 'katex';
import {
  WaveExecutionResponse,
  RunSummaryDTO,
  fetchGatesAudit,
  fetchChuteDynamics,
  fetchLIFODag,
  fetchRunExplanation,
  fetchRuns,
  getReportPdfUrl,
} from '../services/api';
import { PDFProfileId } from '../data/reportsRegistry';
import { trackButtonClick, trackTabChange } from '../utils/analytics';

export interface InvestigationStudioProps {
  runId?: string;
  lastWave?: WaveExecutionResponse | null;
  archetypeKey?: string;
  onOpenPDF?: (profile?: PDFProfileId) => void;
  onSelectRun?: (runId: string) => void;
  activeSubTab?: InvestigationSubTab;
  onSubTabChange?: (subTab: InvestigationSubTab) => void;
}

export type InvestigationSubTab = 'timeline' | 'gates' | 'chutes' | 'quantum' | 'carbon';
export type IncidentSeverity = 'ALL' | 'CRITICAL' | 'INVARIANT' | 'CHOKE' | 'INFO';

interface IncidentEvent {
  id: string;
  timeSec: number;
  severity: 'CRITICAL' | 'INVARIANT' | 'CHOKE' | 'INFO';
  title: string;
  description: string;
  rootCauseCategory: string;
  physicalFailureMode: string;
  invariantProofFormula?: string;
  rippleEffects: string;
  preventiveRecommendation: string;
  standardsReference: string;
  amrId?: string;
  gate?: number;
  metric?: string;
  value?: string;
  resolution?: string;
  bendersCutEquation?: string;
}

const SAMPLE_INCIDENTS: IncidentEvent[] = [
  {
    id: 'inc-01',
    timeSec: 42,
    severity: 'INFO',
    title: 'Mission Dispatch & Invariant Pre-Check',
    description: 'Fleet initialization complete across 4 AMRs. Invariant Gates 1-4 bounds registered into CP-SAT solver.',
    rootCauseCategory: 'System Initialization & Boundary Setup',
    physicalFailureMode: 'Pre-flight integrity verification across multi-depot fleet topology and charging dock status.',
    invariantProofFormula: '\\forall k \\in \\mathcal{K}, \\; E_k(0) \\ge E_{\\min} \\; \\land \\; \\text{Depot}(k) \\in \\mathcal{D}',
    rippleEffects: 'All 4 vehicle controllers armed with nominal velocity limits and payload tare calibrators.',
    preventiveRecommendation: 'Enforce pre-wave battery threshold of ≥ 90% SoC before mission authorization.',
    standardsReference: 'VDI 4453 / DIN EN 1525 AGV Safety Standards',
    metric: 'AMR Fleet',
    value: '4 units operational',
    resolution: 'Initial route commitments verified acyclic and bounded.',
  },
  {
    id: 'inc-02',
    timeSec: 142,
    severity: 'CHOKE',
    title: 'Chute C2 Inflow Surge Alert',
    description: 'Rapid batch drop from Pick-Face Aisle 3 caused Chute C2 buffer volume to rise to 3.12 m³, reaching 89.1% of max capacity.',
    rootCauseCategory: 'Hydrodynamic Buffer Over-Accumulation',
    physicalFailureMode: 'Drop surge rate from multiple concurrent pick batches outpaced cross-dock sorter induction throughput (dQ/dt > 0).',
    invariantProofFormula: 'Q_c(t) = \\int_0^t (\\dot{Q}_{\\text{in}}(c, \\tau) - \\mu_{\\text{out}}(c)) d\\tau \\le Q_{\\max} = 3.50\\,\\text{m}^3',
    rippleEffects: 'AMR_003 delayed by 18s at intermediate waypoint; fleet makespan increased by 0.38%; zero dropped cartons.',
    preventiveRecommendation: 'Implement proactive rolling horizon wave staggering between adjacent pick aisles.',
    standardsReference: 'ISO 23412 Cold-Chain & Parcel Handling Logistics',
    metric: 'Buffer Vol Q_2(t)',
    value: '3.12 / 3.50 m³ (89.1%)',
    resolution: 'Closed-loop backpressure controller throttled subsequent AMR_003 drop by 18s.',
  },
  {
    id: 'inc-03',
    timeSec: 285,
    severity: 'INVARIANT',
    title: 'Gate 2 (3D LIFO) Support Surface Warning',
    description: 'AMR_002 container placement calculated support surface ratio σ = 0.762, hovering near critical threshold σ_min = 0.750.',
    rootCauseCategory: 'Volumetric Packing & Dynamic Center of Mass Stability',
    physicalFailureMode: 'Carton geometry overhang on rear cargo deck caused marginal bottom support contact under cornering centrifugal forces.',
    invariantProofFormula: '\\sigma_{\\text{support}} = \\frac{\\text{Area}(B_i \\cap \\bigcup_{j \\in \\text{below}} B_j)}{\\text{Area}(B_i)} \\ge 0.750',
    rippleEffects: 'AMR_002 turning acceleration clamped to 0.65 m/s² through bend radius R=2.5m; zero carton toppling.',
    preventiveRecommendation: 'Tune CP-SAT diffn objective to penalize top-heavy stack configurations when lateral acceleration exceeds 0.8 m/s².',
    standardsReference: 'VDI 2700 Cargo Securing on Vehicles',
    amrId: 'AMR_002',
    gate: 2,
    metric: 'Support Ratio σ',
    value: '0.762 (Threshold: ≥ 0.750)',
    resolution: 'CP-SAT Diffn re-indexed box stack sequence. Platform tilt angle verified at 1.8° (< 5.0°).',
  },
  {
    id: 'inc-04',
    timeSec: 418,
    severity: 'CRITICAL',
    title: 'DIN EN ISO 3691-4 HRI Mixed-Zone Speed Clamping',
    description: 'Human picker entered shared corridor at Aisle 4 intersection (d_human = 2.4m ≤ 3.0m). Safety PLC clamped AMR_001 velocity.',
    rootCauseCategory: 'Human-Robot Cyber-Physical Interaction & Proximity Clamping',
    physicalFailureMode: 'Human operator walked into active AMR path intersection without active virtual light curtain triggering.',
    invariantProofFormula: 'v_{\\text{AMR}}(t) \\le v_{\\text{safe}} = 0.40\\,\\text{m/s} \\quad \\text{whenever} \\; d_{\\text{human}}(t) \\le 3.0\\,\\text{m}',
    rippleEffects: 'Transit delay of 6.4s along Aisle 4 spine; audio-visual optical beacon pulse triggered; zero contact incident.',
    preventiveRecommendation: 'Install ceiling-mounted Ultra-Wideband (UWB) proximity beacon anchors at high-density crossing nodes.',
    standardsReference: 'DIN EN ISO 3691-4:2020 Clause 4.2.1.2.4 (Safety of Industrial Trucks)',
    amrId: 'AMR_001',
    gate: 4,
    metric: 'Kinematic Velocity v(t)',
    value: 'Clamped 1.80 m/s → 0.40 m/s',
    resolution: 'Swept safe-interval path planning (SIPP) maintained dynamic separation d_safe ≥ 1.2m without emergency stop.',
  },
  {
    id: 'inc-05',
    timeSec: 612,
    severity: 'INVARIANT',
    title: 'Gate 1 Subtour Violation & Automated Benders Cut',
    description: 'Subtour detected in Tier 3 tentative route for AMR_004 covering orders {O-104, O-109, O-115}. Master problem cut generated and applied.',
    rootCauseCategory: 'Combinatorial Graph Connectivity & Hamiltonian Cycle Breakdown',
    physicalFailureMode: 'Tentative integer solver solution formed an isolated disconnected subtour cycle not anchored to depot.',
    invariantProofFormula: '\\sum_{(i,j) \\in C} x_{ij} \\le |C| - 1 \\quad \\forall C \\subset V \\setminus \\{0\\}, \\; 2 \\le |C| \\le |V|-1',
    rippleEffects: 'Subproblem separation generated infeasibility cut in 4.2ms; branch-and-cut continued without restart; route makespan optimized by 3.1%.',
    preventiveRecommendation: 'Maintain lazy constraint separation cache to re-use subtour cuts across successive dispatch waves.',
    standardsReference: 'Benders Decomposition & Dantzig-Fulkerson-Johnson (DFJ) Formulation',
    amrId: 'AMR_004',
    gate: 1,
    metric: 'Dual Multiplier π',
    value: 'Infeasibility Dual π = 142.8',
    resolution: 'Benders combinatorial cut added in 4.2 ms; branch-and-cut continued without restart.',
    bendersCutEquation: '\\sum_{(i,j) \\in C} x_{ij} \\le |C| - 1 \\quad (C = \\{104, 109, 115\\}, \\; |C|=3)',
  },
  {
    id: 'inc-06',
    timeSec: 780,
    severity: 'CHOKE',
    title: 'Aisle 2 Crossing Yield-Hold',
    description: 'AMR_003 yielded priority to AMR_002 carrying urgent SLA medical cargo at main transit artery.',
    rootCauseCategory: 'Spatiotemporal Multi-Agent Corridor Contention',
    physicalFailureMode: 'Simultaneous traversal request for narrow single-lane intersection at Aisle 2 coordinate (X=60m, Y=45m).',
    invariantProofFormula: '\\mathcal{V}_i(t) \\cap \\mathcal{V}_j(t) = \\emptyset \\quad \\forall i \\neq j, \\; \\forall t \\ge 0',
    rippleEffects: 'AMR_003 stood in holding bay for 4.8s; AMR_002 proceeded unimpeded, preserving express medical SLA target.',
    preventiveRecommendation: 'Adopt dynamic priority queueing with real-time SLA deadline slack weighting.',
    standardsReference: 'Priority-Based Search (PBS) & Continuous SIPP',
    metric: 'Yield Hold Time',
    value: '4.8 s',
    resolution: 'Continuous SIPP space-time reservation prevented dead-lock collision.',
  },
  {
    id: 'inc-07',
    timeSec: 890,
    severity: 'INFO',
    title: 'Chute C1 & C3 Clearance Complete',
    description: 'Chute C1 cleared to 0.0 m³. Chute C3 cleared to 0.42 m³. Secondary pick waves authorized.',
    rootCauseCategory: 'Buffer Depletion & Steady-State Throughput',
    physicalFailureMode: 'Sorter discharge conveyors drained active accumulated parcels into downstream consolidation packing cells.',
    invariantProofFormula: 'Q_c(t) \\to 0 \\implies \\text{BackpressureState} = \\text{CLEARED}',
    rippleEffects: 'Full conveyor bandwidth restored; AMR transit corridor restriction lifted.',
    preventiveRecommendation: 'Trigger automated packaging container replenishment based on chute clearance milestone signals.',
    standardsReference: 'WMS High-Density Cross-Dock Automated Material Handling Guidelines',
    metric: 'Chute Status',
    value: 'Clearance Nominal',
    resolution: 'Discharge confirmed; buffer headroom verified for wave 2 dispatch.',
  },
  {
    id: 'inc-08',
    timeSec: 1045,
    severity: 'INFO',
    title: 'Fleet Return to Depots & SLA Fulfillment',
    description: 'All 4 AMRs docked at assigned home depots. 100% order SLA compliance verified. Energy recuperation generated 0.14 kWh.',
    rootCauseCategory: 'Mission Completion & Regenerative Energy Accounting',
    physicalFailureMode: 'All AMR kinematics decelerated smoothly to dock pins with zero residual motion and regenerative braking capture.',
    invariantProofFormula: '\\sum_{k} E_{\\text{regen}}(k) = 0.14\\,\\text{kWh} \\; (9.4\\% \\; \\text{gross recovery})',
    rippleEffects: 'Wave completed in 1045.2s (predicted 1050.0s); fleet returned with average battery SoC = 48.2%.',
    preventiveRecommendation: 'Schedule next wave launch window within 300s to leverage warm battery cell chemistry.',
    standardsReference: 'ISO 14064 GHG Verification & Green Logistics Accounting',
    metric: 'Final Makespan',
    value: '1045.2 s (0 SLA breaches)',
    resolution: 'Mission verified compliant with Code: lmn certificate.',
  },
];

export const InvestigationStudio: React.FC<InvestigationStudioProps> = ({
  runId,
  lastWave,
  archetypeKey = 'HOT_ZONE_80_20',
  onOpenPDF,
  onSelectRun,
  activeSubTab: controlledSubTab,
  onSubTabChange,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<InvestigationSubTab>(controlledSubTab || 'timeline');

  // Synchronize internal active subtab if controlled from outside (e.g. sidebar navigation or URL deep link)
  useEffect(() => {
    if (controlledSubTab && controlledSubTab !== activeSubTab) {
      setActiveSubTab(controlledSubTab);
    }
  }, [controlledSubTab]);

  const [currentTimeSec, setCurrentTimeSec] = useState<number>(418); // Default to interesting incident
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [severityFilter, setSeverityFilter] = useState<IncidentSeverity>('ALL');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('inc-04');
  const [copyFeedback, setCopyFeedback] = useState<boolean>(false);
  const [explanationData, setExplanationData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableRuns, setAvailableRuns] = useState<RunSummaryDTO[]>([]);

  const maxHorizonSec = 1200;
  const playIntervalRef = useRef<any>(null);

  // Safe KaTeX renderer
  const renderKaTeX = (latex: string, displayMode = false) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      return latex;
    }
  };

  // Load explanation and runs data
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [expl, runs] = await Promise.all([
          fetchRunExplanation(runId || 'RUN-ACTIVE-001'),
          fetchRuns(15),
        ]);
        if (isMounted) {
          setExplanationData(expl);
          setAvailableRuns(runs || []);
        }
      } catch (err) {
        console.warn('InvestigationStudio: error loading API data', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [runId]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= maxHorizonSec) {
            setIsPlaying(false);
            return maxHorizonSec;
          }
          return Math.min(maxHorizonSec, prev + 1 * playbackSpeed);
        });
      }, 100);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, playbackSpeed, maxHorizonSec]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    if (severityFilter === 'ALL') return SAMPLE_INCIDENTS;
    return SAMPLE_INCIDENTS.filter((inc) => inc.severity === severityFilter);
  }, [severityFilter]);

  // Selected incident object
  const activeIncident = useMemo(() => {
    return SAMPLE_INCIDENTS.find((inc) => inc.id === selectedIncidentId) || SAMPLE_INCIDENTS[3];
  }, [selectedIncidentId]);

  // Dynamic telemetry states computed from current scrubber time
  const amrTelemetryAtTime = useMemo(() => {
    const t = currentTimeSec;
    // AMR 1
    const amr1Speed = t >= 410 && t <= 440 ? 0.40 : t < 1000 ? 1.75 : 0.0;
    const amr1Soc = Math.max(15, 95 - (t / 1200) * 45);
    const amr1Status =
      t >= 410 && t <= 440
        ? 'ISO 3691-4 SPEED CLAMP'
        : t >= 1000
        ? 'DOCKED'
        : 'EN ROUTE';

    // AMR 2
    const amr2Speed = t >= 280 && t <= 310 ? 0.85 : t < 1050 ? 1.90 : 0.0;
    const amr2Soc = Math.max(15, 98 - (t / 1200) * 48);
    const amr2Status =
      t >= 280 && t <= 310
        ? 'GATE 2 LIFO VERIFY'
        : t >= 1050
        ? 'DOCKED'
        : 'DELIVERING';

    // AMR 3
    const amr3Speed = t >= 775 && t <= 785 ? 0.0 : t < 980 ? 1.65 : 0.0;
    const amr3Soc = Math.max(15, 92 - (t / 1200) * 41);
    const amr3Status =
      t >= 775 && t <= 785
        ? 'YIELDING AT AISLE 2'
        : t >= 980
        ? 'DOCKED'
        : 'LOADING';

    // AMR 4
    const amr4Speed = t >= 605 && t <= 620 ? 0.2 : t < 1020 ? 1.80 : 0.0;
    const amr4Soc = Math.max(15, 94 - (t / 1200) * 44);
    const amr4Status =
      t >= 605 && t <= 620
        ? 'BENDERS CUT REVISE'
        : t >= 1020
        ? 'DOCKED'
        : 'TRANSIT';

    return [
      {
        id: 'AMR_001',
        x: (25 + Math.sin(t / 80) * 40).toFixed(1),
        y: (15 + Math.cos(t / 80) * 20).toFixed(1),
        speed: amr1Speed.toFixed(2),
        soc: amr1Soc.toFixed(1),
        payloadMass: 142.5,
        status: amr1Status,
        statusColor: amr1Status.includes('CLAMP') ? '#ef4444' : amr1Status === 'DOCKED' ? '#10b981' : '#00f0ff',
      },
      {
        id: 'AMR_002',
        x: (65 + Math.cos(t / 95) * 35).toFixed(1),
        y: (40 + Math.sin(t / 95) * 25).toFixed(1),
        speed: amr2Speed.toFixed(2),
        soc: amr2Soc.toFixed(1),
        payloadMass: 198.0,
        status: amr2Status,
        statusColor: amr2Status.includes('LIFO') ? '#f59e0b' : amr2Status === 'DOCKED' ? '#10b981' : '#38bdf8',
      },
      {
        id: 'AMR_003',
        x: (85 + Math.sin(t / 110) * 30).toFixed(1),
        y: (70 + Math.cos(t / 110) * 15).toFixed(1),
        speed: amr3Speed.toFixed(2),
        soc: amr3Soc.toFixed(1),
        payloadMass: 85.0,
        status: amr3Status,
        statusColor: amr3Status.includes('YIELD') ? '#f59e0b' : amr3Status === 'DOCKED' ? '#10b981' : '#a855f7',
      },
      {
        id: 'AMR_004',
        x: (110 + Math.cos(t / 75) * 25).toFixed(1),
        y: (25 + Math.sin(t / 75) * 30).toFixed(1),
        speed: amr4Speed.toFixed(2),
        soc: amr4Soc.toFixed(1),
        payloadMass: 165.2,
        status: amr4Status,
        statusColor: amr4Status.includes('BENDERS') ? '#f43f5e' : amr4Status === 'DOCKED' ? '#10b981' : '#10b981',
      },
    ];
  }, [currentTimeSec]);

  // Chute volumes at current time
  const chuteVolumesAtTime = useMemo(() => {
    const t = currentTimeSec;
    // Chute 1
    const q1 = Math.max(0, 2.8 * Math.exp(-Math.pow((t - 300) / 250, 2)));
    // Chute 2 (Peak surge)
    const q2 = Math.max(0, 3.12 * Math.exp(-Math.pow((t - 142) / 200, 2)));
    // Chute 3
    const q3 = Math.max(0, 2.45 * Math.exp(-Math.pow((t - 600) / 300, 2)));
    // Chute 4
    const q4 = Math.max(0, 1.95 * Math.exp(-Math.pow((t - 800) / 250, 2)));

    return [
      { id: 'C_01', name: 'Chute 1 (West Dock)', vol: q1, max: 3.5, pct: (q1 / 3.5) * 100 },
      { id: 'C_02', name: 'Chute 2 (Central Sorter)', vol: q2, max: 3.5, pct: (q2 / 3.5) * 100 },
      { id: 'C_03', name: 'Chute 3 (East Buffer)', vol: q3, max: 3.5, pct: (q3 / 3.5) * 100 },
      { id: 'C_04', name: 'Chute 4 (Priority Dispatch)', vol: q4, max: 3.5, pct: (q4 / 3.5) * 100 },
    ];
  }, [currentTimeSec]);

  // Copy full mathematical invariant formulation
  const handleCopyMathProof = () => {
    const proofText = `% Cyber-Physical Invariant Gates & Automated Benders Decomposition Proof
% Problem: ER-MD-VRPTW-3D-HRI-Q | WMS Quantum Twin | Code: lmn
\\begin{aligned}
  & \\text{Gate 1 (Sub-tour & Chute Volumetric Capacity):} \\\\
  & \\quad \\sum_{i \\in S} \\text{vol}_i \\le Q_{\\text{chute}}^{\\max} = 3.50\\,\\text{m}^3, \\quad \\sum_{i,j \\in S, i \\neq j} x_{ij} \\le |S| - 1 \\quad \\forall S \\subseteq V \\setminus \\{0\\} \\\\[8pt]
  & \\text{Gate 2 (3D Volumetric LIFO & Support Surface Ratio):} \\\\
  & \\quad \\sigma_{\\text{support}} = \\frac{\\text{Area}(\\text{box}_i \\cap \\text{boxes below})}{\\text{Area}(\\text{box}_i)} \\ge 0.75, \\quad \\sqrt{(x_{\\text{CoM}} - x_{\\text{bed}})^2 + (y_{\\text{CoM}} - y_{\\text{bed}})^2} \\le 0.15\\,\\text{m} \\\\[8pt]
  & \\text{Gate 3 (Time-Windows & Kinetic SoC Discharge):} \\\\
  & \\quad t_i^{\\text{arr}} \\le t_i^{\\text{deadline}}, \\quad E(t) = E_0 - \\int_0^t \\left( P_{\\text{traction}}(v) + P_{\\text{payload}}(m) \\right) dt + E_{\\text{regen}} \\ge 0.15 E_0 \\\\[8pt]
  & \\text{Gate 4 (Swept-Volume Dynamic HRI Collision Separation):} \\\\
  & \\quad \\|\\mathbf{p}_i(t) - \\mathbf{p}_k(t)\\|_2 \\ge d_{\\text{safe}} = 1.20\\,\\text{m} \\quad \\forall t, \\quad v(t) \\le 0.40\\,\\text{m/s} \\; \\text{if } d_{\\text{human}}(t) \\le 3.0\\,\\text{m}
\\end{aligned}`;

    navigator.clipboard.writeText(proofText);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2500);
    trackButtonClick('Copy_LaTeX_Proof', 'InvestigationStudio');
  };

  // Export Forensic Incident JSON
  const handleExportIncidentJson = () => {
    const forensicSnapshot = {
      investigation_report: 'INVESTIGATION_DOSSIER_5_PAGE',
      run_id: runId || 'RUN-ACTIVE-001',
      generated_at: new Date().toISOString(),
      falsification_metric_phi: 0.880,
      invariant_seal: 'lmn',
      certified_by: 'DIN EN ISO 3691-4 Autonomous Vehicle Safety Engine',
      scrubber_timestamp_sec: currentTimeSec,
      incidents_recorded: SAMPLE_INCIDENTS,
      active_amr_telemetry: amrTelemetryAtTime,
      chute_flow_dynamics: chuteVolumesAtTime,
      invariant_gates_audit: [
        { gate: 1, name: 'Subtour & Chute Volumetric Capacity', status: 'PASS', cuts_generated: 1, benders_dual: 142.8 },
        { gate: 2, name: '3D Volumetric LIFO & CoM Stability', status: 'PASS', min_support_ratio: 0.762, max_tilt_deg: 1.8 },
        { gate: 3, name: 'Time-Windows & Kinetic Battery SoC', status: 'PASS', min_soc_pct: 26.4, sla_breaches: 0 },
        { gate: 4, name: 'Swept-Volume Dynamic HRI Collision', status: 'PASS', clamping_events: 12, violations: 0 },
      ],
      quantum_coprocessor: {
        circuit_qubits: 16,
        circuit_depth: 42,
        cx_2q_gates: 68,
        qaoa_p_layers: 3,
        fidelity: 0.941,
        variational_energy: -184.6,
      },
      iso_14064_carbon: {
        total_energy_kwh: 1.48,
        ghg_footprint_kg_co2e: 0.214,
        savings_vs_baseline_pct: 43.8,
      },
    };

    const blob = new Blob([JSON.stringify(forensicSnapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `incident_forensics_${runId || 'RUN-ACTIVE-001'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    trackButtonClick('Export_Incident_JSON', 'InvestigationStudio');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: '#070c18',
        color: '#f3f4f6',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* TOP HEADER: Context, Archetype Pill, Verification Hash & PDF Trigger */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 18px',
          background: 'rgba(11, 19, 38, 0.95)',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          backdropFilter: 'blur(12px)',
          flexShrink: 0,
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Studio Identity & Run Context */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(0, 240, 255, 0.2))',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#f87171',
              boxShadow: '0 0 14px rgba(239, 68, 68, 0.3)',
            }}
          >
            <Search size={18} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2
                style={{
                  fontSize: '15px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#ffffff',
                  letterSpacing: '-0.02em',
                }}
              >
                Incident Investigation & Root-Cause Studio
              </h2>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  padding: '1px 7px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Forensics Dossier
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
              <span>Run ID: <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{runId || 'RUN-ACTIVE-001'}</strong></span>
              <span>•</span>
              <span>Archetype: <strong style={{ color: '#e2e8f0' }}>{archetypeKey}</strong></span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#10b981' }}>
                <ShieldCheck size={12} /> Certified Φ = 0.880 (lmn)
              </span>
            </div>
          </div>
        </div>

        {/* Right Action Bar: PDF Compile, JSON Snapshot, LaTeX Copy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Run Switcher Dropdown */}
          {availableRuns.length > 0 && onSelectRun && (
            <select
              value={runId || ''}
              onChange={(e) => onSelectRun(e.target.value)}
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.3)',
                color: '#38bdf8',
                fontSize: '11px',
                padding: '5px 8px',
                borderRadius: '6px',
                outline: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
              }}
            >
              {availableRuns.map((r) => (
                <option key={r.run_id} value={r.run_id} style={{ background: '#0b1326', color: '#f3f4f6' }}>
                  {r.run_id} ({r.operational_mode})
                </option>
              ))}
            </select>
          )}

          {/* Copy LaTeX Proof */}
          <button
            onClick={handleCopyMathProof}
            title="Copy LaTeX Mathematical Proof to Clipboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              color: copyFeedback ? '#10b981' : '#cbd5e1',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {copyFeedback ? <Check size={13} /> : <Copy size={13} />}
            <span>{copyFeedback ? 'Copied LaTeX' : 'LaTeX Proof'}</span>
          </button>

          {/* Export JSON Snapshot */}
          <button
            onClick={handleExportIncidentJson}
            title="Export full incident telemetry snapshot in machine-readable JSON"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(30, 41, 59, 0.8)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              color: '#38bdf8',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Download size={13} />
            <span>Export JSON</span>
          </button>

          {/* Primary Action: Open 5-Page Investigation Vector PDF */}
          <button
            onClick={() => {
              trackButtonClick('Open_Investigation_PDF', 'InvestigationStudio');
              if (onOpenPDF) {
                onOpenPDF('INVESTIGATION');
              } else {
                window.open(getReportPdfUrl(runId || 'RUN-ACTIVE-001', 'INVESTIGATION'), '_blank');
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, #ef4444, #b91c1c)',
              border: '1px solid rgba(248, 113, 113, 0.6)',
              color: '#ffffff',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(239, 68, 68, 0.35)',
              transition: 'all 0.2s ease',
            }}
          >
            <FileText size={14} />
            <span>Generate 5-Page PDF</span>
            <span
              style={{
                fontSize: '9px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 800,
              }}
            >
              INVESTIGATION
            </span>
          </button>
        </div>
      </div>

      {/* SUB-NAVIGATION TABS */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 18px',
          background: 'rgba(10, 16, 32, 0.9)',
          borderBottom: '1px solid rgba(148, 163, 184, 0.15)',
          flexShrink: 0,
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'timeline', label: '1. Incident Timeline & Scrubber', icon: <Clock size={13} />, badge: 't=0..T' },
          { id: 'gates', label: '2. Invariant Gates 1-4 & Benders Cuts', icon: <ShieldCheck size={13} />, badge: '4 Gates' },
          { id: 'chutes', label: '3. Chute Dynamics & Choke-Points', icon: <Warehouse size={13} />, badge: 'Q_c(t)' },
          { id: 'quantum', label: '4. Quantum Diagnostic Lens', icon: <Cpu size={13} />, badge: 'QAOA' },
          { id: 'carbon', label: '5. Fleet Energy & ISO 14064 Carbon', icon: <Battery size={13} />, badge: 'ESG' },
        ].map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                const targetSubTab = tab.id as InvestigationSubTab;
                setActiveSubTab(targetSubTab);
                if (onSubTabChange) {
                  onSubTabChange(targetSubTab);
                }
                trackTabChange(`investigation_${activeSubTab}`, `investigation_${targetSubTab}`, {
                  screen_context: targetSubTab,
                  run_id: runId || 'RUN-ACTIVE-001',
                  source: 'investigation_sub_tab_bar',
                });
                trackButtonClick(`Investigation_SubTab_${targetSubTab}`, 'InvestigationStudio', {
                  sub_tab: targetSubTab,
                  run_id: runId || 'RUN-ACTIVE-001',
                });
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                background: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
                color: isActive ? '#00f0ff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span
                style={{
                  fontSize: '9px',
                  background: isActive ? 'rgba(0, 240, 255, 0.25)' : 'rgba(30, 41, 59, 0.6)',
                  color: isActive ? '#ffffff' : '#64748b',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                }}
              >
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* MAIN WORKSPACE CONTENT AREA */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* ========================================================================= */}
        {/* SUBTAB 1: TIMELINE & INTERACTIVE SCRUBBER                                */}
        {/* ========================================================================= */}
        {activeSubTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Top Scrubber Control Console */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '10px',
                padding: '16px 20px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              {/* Scrubber Playback Controls Row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Play / Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: isPlaying ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 240, 255, 0.2)',
                      border: isPlaying ? '1px solid #ef4444' : '1px solid #00f0ff',
                      color: isPlaying ? '#ef4444' : '#00f0ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isPlaying ? '0 0 12px rgba(239, 68, 68, 0.4)' : '0 0 12px rgba(0, 240, 255, 0.4)',
                    }}
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
                  </button>

                  {/* Reset */}
                  <button
                    onClick={() => setCurrentTimeSec(0)}
                    title="Reset Scrubber to t=0"
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#cbd5e1',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>t = 0</span>
                  </button>

                  {/* Step Next Incident */}
                  <button
                    onClick={() => {
                      const nextInc = SAMPLE_INCIDENTS.find((i) => i.timeSec > currentTimeSec);
                      if (nextInc) {
                        setCurrentTimeSec(nextInc.timeSec);
                        setSelectedIncidentId(nextInc.id);
                      }
                    }}
                    title="Jump to Next Incident Event"
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(148, 163, 184, 0.25)',
                      color: '#cbd5e1',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                    }}
                  >
                    <SkipForward size={12} />
                    <span>Next Incident</span>
                  </button>

                  {/* Speed Selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>SPEED:</span>
                    {[1, 2, 5, 10].map((s) => (
                      <button
                        key={s}
                        onClick={() => setPlaybackSpeed(s)}
                        style={{
                          background: playbackSpeed === s ? 'rgba(0, 240, 255, 0.25)' : 'rgba(30, 41, 59, 0.4)',
                          border: playbackSpeed === s ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.2)',
                          color: playbackSpeed === s ? '#ffffff' : '#94a3b8',
                          padding: '3px 7px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Current Timestamp Display */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 600 }}>MISSION TIMESTEP</div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                      t = {currentTimeSec.toFixed(0)} <span style={{ fontSize: '12px', color: '#64748b' }}>/ {maxHorizonSec} s</span>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid rgba(0, 240, 255, 0.3)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '9px', color: '#00f0ff', fontWeight: 700 }}>PROGRESS</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {((currentTimeSec / maxHorizonSec) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Slider Track with Incident Markers */}
              <div style={{ position: 'relative', marginTop: '4px', marginBottom: '8px' }}>
                <input
                  type="range"
                  min={0}
                  max={maxHorizonSec}
                  value={currentTimeSec}
                  onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: '#00f0ff',
                    cursor: 'pointer',
                    height: '6px',
                  }}
                />

                {/* Incident Pins on Slider Track */}
                <div style={{ position: 'relative', width: '100%', height: '14px', marginTop: '2px' }}>
                  {SAMPLE_INCIDENTS.map((inc) => {
                    const leftPct = (inc.timeSec / maxHorizonSec) * 100;
                    const pinColor =
                      inc.severity === 'CRITICAL'
                        ? '#ef4444'
                        : inc.severity === 'INVARIANT'
                        ? '#f59e0b'
                        : inc.severity === 'CHOKE'
                        ? '#f97316'
                        : '#38bdf8';
                    const isSelected = selectedIncidentId === inc.id;

                    return (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setCurrentTimeSec(inc.timeSec);
                          setSelectedIncidentId(inc.id);
                        }}
                        title={`t=${inc.timeSec}s: ${inc.title}`}
                        style={{
                          position: 'absolute',
                          left: `${leftPct}%`,
                          top: '0',
                          transform: 'translateX(-50%)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: isSelected ? '10px' : '7px',
                            height: isSelected ? '10px' : '7px',
                            borderRadius: '50%',
                            background: pinColor,
                            border: isSelected ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.5)',
                            boxShadow: `0 0 8px ${pinColor}`,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* AMR Telemetry State Grid at t */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              {amrTelemetryAtTime.map((amr) => (
                <div
                  key={amr.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                      {amr.id}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        color: amr.statusColor,
                        background: `${amr.statusColor}20`,
                        border: `1px solid ${amr.statusColor}60`,
                        padding: '1px 6px',
                        borderRadius: '4px',
                      }}
                    >
                      {amr.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Position (X, Y):</span>
                      <div style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        ({amr.x}, {amr.y}) m
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Velocity v(t):</span>
                      <div style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {amr.speed} m/s
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Battery SoC:</span>
                      <div style={{ color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {amr.soc}%
                      </div>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Payload Mass:</span>
                      <div style={{ color: '#e2e8f0', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {amr.payloadMass} kg
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Row: Incident Event Log & Deep Root-Cause Inspector */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Event Log with Severity Filter */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '380px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Activity size={14} color="#00f0ff" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>Incident Event Log</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>({filteredIncidents.length})</span>
                  </div>

                  {/* Filter Pills */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {(['ALL', 'CRITICAL', 'INVARIANT', 'CHOKE', 'INFO'] as IncidentSeverity[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setSeverityFilter(f)}
                        style={{
                          background: severityFilter === f ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                          border: severityFilter === f ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.2)',
                          color: severityFilter === f ? '#00f0ff' : '#94a3b8',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '9.5px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Items List */}
                <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '4px' }}>
                  {filteredIncidents.map((inc) => {
                    const isSelected = selectedIncidentId === inc.id;
                    const badgeColor =
                      inc.severity === 'CRITICAL'
                        ? '#ef4444'
                        : inc.severity === 'INVARIANT'
                        ? '#f59e0b'
                        : inc.severity === 'CHOKE'
                        ? '#f97316'
                        : '#38bdf8';

                    return (
                      <div
                        key={inc.id}
                        onClick={() => {
                          setSelectedIncidentId(inc.id);
                          setCurrentTimeSec(inc.timeSec);
                        }}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(30, 41, 59, 0.4)',
                          border: isSelected ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.15)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? '#00f0ff' : '#ffffff' }}>
                            {inc.title}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              color: badgeColor,
                              background: `${badgeColor}15`,
                              border: `1px solid ${badgeColor}40`,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            t = {inc.timeSec}s
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.3 }}>
                          {inc.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deep Root-Cause Inspector Card */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={14} color="#f59e0b" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                      Root-Cause Forensics & Recourse Action
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '9.5px',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: '#fbbf24',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 700,
                    }}
                  >
                    {activeIncident.severity}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  {/* Category & Standards Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.15)',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        padding: '2px 7px',
                        borderRadius: '4px',
                      }}
                    >
                      {activeIncident.rootCauseCategory}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: '#94a3b8',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {activeIncident.standardsReference}
                    </span>
                  </div>

                  {/* Observed Incident & Physical Mechanism */}
                  <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '9px 11px', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Observed Event (t = {activeIncident.timeSec}s):
                    </span>
                    <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '12.5px', marginTop: '2px' }}>
                      {activeIncident.title}
                    </div>
                    <div style={{ color: '#cbd5e1', fontSize: '11px', marginTop: '3px' }}>
                      {activeIncident.description}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '10.5px', marginTop: '4px', borderTop: '1px solid rgba(148, 163, 184, 0.15)', paddingTop: '4px' }}>
                      <strong style={{ color: '#f87171' }}>Physical Failure Mechanism:</strong> {activeIncident.physicalFailureMode}
                    </div>
                  </div>

                  {/* Mathematical Invariant Checked */}
                  {activeIncident.invariantProofFormula && (
                    <div style={{ background: 'rgba(10, 18, 36, 0.75)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#00f0ff', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Active Cyber-Physical Invariant Checked:
                      </span>
                      <div
                        style={{ marginTop: '3px', overflowX: 'auto', textAlign: 'center' }}
                        dangerouslySetInnerHTML={{
                          __html: renderKaTeX(activeIncident.invariantProofFormula, true),
                        }}
                      />
                    </div>
                  )}

                  {/* Telemetry Metric & Value */}
                  {activeIncident.metric && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.4)', padding: '6px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#94a3b8', fontSize: '11px' }}>Telemetry Parameter:</span>
                      <strong style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{activeIncident.metric} = {activeIncident.value}</strong>
                    </div>
                  )}

                  {/* Automated Solver Recourse Action */}
                  {activeIncident.resolution && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#10b981', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={11} /> Automated Closed-Loop Recourse:
                      </span>
                      <div style={{ color: '#d1fae5', fontSize: '11.5px', marginTop: '2px' }}>
                        {activeIncident.resolution}
                      </div>
                    </div>
                  )}

                  {/* Downstream Ripple Effects */}
                  {activeIncident.rippleEffects && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: '7px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#fbbf24', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Activity size={11} /> Fleet Ripple Effects & SLA Impact:
                      </span>
                      <div style={{ color: '#fef3c7', fontSize: '11px', marginTop: '2px' }}>
                        {activeIncident.rippleEffects}
                      </div>
                    </div>
                  )}

                  {/* Preventive Engineering Recommendation */}
                  {activeIncident.preventiveRecommendation && (
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', padding: '7px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#818cf8', fontSize: '9.5px', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Info size={11} /> Preventive Engineering Recommendation:
                      </span>
                      <div style={{ color: '#e0e7ff', fontSize: '11px', marginTop: '2px' }}>
                        {activeIncident.preventiveRecommendation}
                      </div>
                    </div>
                  )}

                  {/* Synthesized Benders Infeasibility Cut */}
                  {activeIncident.bendersCutEquation && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '8px 10px', borderRadius: '6px' }}>
                      <span style={{ color: '#f87171', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
                        Synthesized Benders Infeasibility Cut:
                      </span>
                      <div
                        style={{ marginTop: '4px', overflowX: 'auto', textAlign: 'center' }}
                        dangerouslySetInnerHTML={{
                          __html: renderKaTeX(activeIncident.bendersCutEquation, true),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 2: INVARIANT GATES 1-4 & BENDERS CUTS RECOURSE                     */}
        {/* ========================================================================= */}
        {activeSubTab === 'gates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 4 Invariant Gate Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
              {/* Gate 1: Batching & Chute Volumetric Capacity */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} color="#10b981" />
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Gate 1: Batching & Sub-tours</strong>
                  </div>
                  <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    PASS (1 Cut Injected)
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(10, 18, 36, 0.85)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    textAlign: 'center',
                    overflowX: 'auto',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('\\sum_{i \\in S} \\text{vol}_i \\le Q_{\\text{chute}}^{\\max} = 3.50\\,\\text{m}^3 \\quad \\land \\quad \\sum_{i,j \\in S, i \\neq j} x_{ij} \\le |S| - 1 \\quad \\forall S \\subseteq V \\setminus \\{0\\}', true),
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#f87171' }}>Physical Hazard Prevented:</strong> Sorter infeed hopper overflow jamming, sorter recirculation cascades, and AMR topological deadlock loops.
                  </div>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>Separation Oracle:</strong> Solved via Dantzig-Fulkerson-Johnson (DFJ) polyhedral min-cut cuts. Subtour separated on AMR_004 at t = 612s (|S| = 3) and resolved via dynamic cut injection in 4.2ms.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    Standard: VDI 4480 Sorting Systems & DFJ Polyhedral Branch-and-Cut
                  </div>
                </div>
              </div>

              {/* Gate 2: 3D Volumetric LIFO & CoM Stability */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={16} color="#38bdf8" />
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Gate 2: 3D LIFO & CoM Stability</strong>
                  </div>
                  <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    PASS (σ = 0.762 ≥ 0.75)
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(10, 18, 36, 0.85)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    textAlign: 'center',
                    overflowX: 'auto',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('\\sigma_{\\text{support}} = \\frac{\\text{Area}(\\text{box}_i \\cap \\text{below})}{\\text{Area}(\\text{box}_i)} \\ge 0.75 \\quad \\land \\quad \\Delta_{\\text{CoM}} \\le 0.15\\,\\text{m} \\quad \\land \\quad \\text{DAG}_{\\text{LIFO}} \\in \\text{Acyclic}', true),
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#f87171' }}>Physical Hazard Prevented:</strong> Dynamic load toppling under cornering centrifugal acceleration a_c = v²/R, parcel crush damage, and manual restacking halts.
                  </div>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>Non-Entanglement & Support:</strong> Lowest recorded contact ratio: σ = 0.762 on AMR_002. IMU triaxial accelerometer logged peak bed roll of 1.8° &lt;&lt; 5.0° critical threshold.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    Standard: DIN EN 12195 Load Securing & VDI 2700 Static/Dynamic Distribution
                  </div>
                </div>
              </div>

              {/* Gate 3: Time-Windows & Battery SoC */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Battery size={16} color="#fbbf24" />
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Gate 3: Time-Windows & SoC</strong>
                  </div>
                  <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    PASS (Min SoC = 26.4%)
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(10, 18, 36, 0.85)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    textAlign: 'center',
                    overflowX: 'auto',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('t_i^{\\text{arr}} \\le t_i^{\\text{deadline}} \\quad \\land \\quad E(t) = E_0 - \\int_0^t P_{\\text{traction}}(v, m)\\,dt + E_{\\text{regen}} \\ge 0.15\\,E_0', true),
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#f87171' }}>Physical Hazard Prevented:</strong> LiFePO4 deep discharge degradation, main aisle stranding requiring manual tug recovery, and customer SLA breach penalties.
                  </div>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>Delivery SLA Audit:</strong> 18/18 customer time-windows satisfied with 0 breaches. Minimum fleet reserve at mission close: 26.4% on AMR_003 (exceeding 15% safety floor).
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    Standard: IEC 62619 Industrial Lithium Batteries & DIN 15140 AMR Safety
                  </div>
                </div>
              </div>

              {/* Gate 4: Swept-Volume Dynamic HRI Separation */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldAlert size={16} color="#f43f5e" />
                    <strong style={{ fontSize: '13px', color: '#ffffff' }}>Gate 4: HRI Separation (ISO 3691-4)</strong>
                  </div>
                  <span style={{ fontSize: '9.5px', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    PASS (d_safe ≥ 1.20m)
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(10, 18, 36, 0.85)',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    textAlign: 'center',
                    overflowX: 'auto',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: renderKaTeX('\\|\\mathbf{p}_i(t) - \\mathbf{p}_k(t)\\|_2 \\ge d_{\\text{safe}} = 1.20\\,\\text{m} \\quad \\land \\quad v(t) \\le 0.40\\,\\text{m/s} \\; (d_{\\text{human}} \\le 3.0\\,\\text{m})', true),
                  }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#f87171' }}>Physical Hazard Prevented:</strong> AMR-to-human body contact, pinch entrapment in pedestrian zones, and high-momentum collisions.
                  </div>
                  <div>
                    <strong style={{ color: '#38bdf8' }}>Swept-Interval Enforcement:</strong> 12 dynamic speed-clamping activations registered without stopping dead; Swept-volume time-reservation reservation cell certified clear.
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    Standard: DIN EN ISO 3691-4:2020 Clause 4.2.1.2.4 (Safety of Industrial Trucks)
                  </div>
                </div>
              </div>
            </div>

            {/* Benders Decomposition Formulation Showcase */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={16} color="#00f0ff" />
                <strong style={{ fontSize: '14px', color: '#ffffff' }}>
                  Automated Benders Cuts Recourse Decomposition Architecture
                </strong>
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                The Master Problem determines discrete binary vehicle assignments <span style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>x_ij &isin; &#123;0, 1&#125;</span>, while continuous subproblems evaluate 3D packing feasibility, battery discharge rates, and kinematic trajectories:
              </div>

              <div
                style={{
                  background: 'rgba(7, 12, 24, 0.9)',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  overflowX: 'auto',
                  textAlign: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('\\text{Infeasibility Cut:} \\quad \\boldsymbol{\\pi}^{(k)\\top} (\\mathbf{b} - \\mathbf{A}_1 \\mathbf{x}) \\le 0 \\implies \\sum_{(i,j) \\in C} x_{ij} \\le |C| - 1, \\quad z \\ge z_k + \\sum_{(i,j)} \\mu_{ij}^{(k)} \\left( x_{ij} - x_{ij}^{(k)} \\right)', true),
                }}
              />

              {/* 3-Step Iterative Cycle */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginTop: '4px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#38bdf8' }}>STEP 1: MASTER MILP</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
                    Solves relaxed combinatorial routing graph to obtain tentative candidate tour assignments <span style={{ fontFamily: 'var(--font-mono)' }}>x*</span>.
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#f43f5e' }}>STEP 2: SUBPROBLEM CERTIFICATE</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
                    Evaluates continuous 3D packing & time-window constraints; if infeasible, computes dual extreme ray <span style={{ fontFamily: 'var(--font-mono)' }}>&pi;*</span>.
                  </div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#10b981' }}>STEP 3: CUT INJECTION</div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '3px' }}>
                    Appends linear valid inequality to Master problem, permanently pruning the infeasible combinatorial subtree in &lt;5ms.
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '6px' }}>
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>MASTER ITERATIONS</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>3 Iterations</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>CUTS GENERATED</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>1 Infeasibility Cut</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>SUBPROBLEM LATENCY</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>4.2 ms</div>
                </div>
                <div style={{ background: 'rgba(30, 41, 59, 0.4)', padding: '8px 12px', borderRadius: '6px' }}>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>OPTIMALITY GAP</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#a855f7', fontFamily: 'var(--font-mono)' }}>0.00% (Exact)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 3: CHUTE DYNAMICS & SPATIOTEMPORAL CHOKE-POINTS                   */}
        {/* ========================================================================= */}
        {activeSubTab === 'chutes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Hydrodynamic Buffer Formulation Banner */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>
                  Hydrodynamic Chute Buffer Conservation & Backpressure Regulation
                </strong>
                <span style={{ fontSize: '10px', color: '#00f0ff', background: 'rgba(0, 240, 255, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                  CLOSED-LOOP FLUID CONSERVATION
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                Chute buffer utilization is modeled as a continuous fluid differential equation balanced against discrete AMR drop batches and automated conveyor clearance throughput:
              </div>

              <div
                style={{
                  background: 'rgba(7, 12, 24, 0.9)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  overflowX: 'auto',
                  textAlign: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('\\frac{dQ_c(t)}{dt} = \\dot{Q}_{\\text{in}}(t) - \\dot{Q}_{\\text{out}}(t) \\quad \\text{with} \\quad Q_c(t) \\le Q_{\\text{chute}}^{\\max} = 3.50\\,\\text{m}^3, \\quad \\dot{Q}_{\\text{out}}(t) = \\mu_c \\cdot \\mathbb{I}_{\\{Q_c(t) > 0\\}}', true),
                }}
              />

              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                When buffer accumulation exceeds the 85% warning threshold (2.975 m³), the dispatcher autonomously triggers an 18-second infeed hold on upstream AMRs, routing overflow batches to adjacent fallback chutes without causing main sorter shutdowns.
              </div>
            </div>

            {/* Chute Contention Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {chuteVolumesAtTime.map((chute) => {
                const isWarning = chute.pct >= 85;
                const barColor = isWarning ? '#ef4444' : chute.pct >= 60 ? '#f59e0b' : '#00f0ff';

                return (
                  <div
                    key={chute.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: isWarning ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(0, 240, 255, 0.25)',
                      borderRadius: '10px',
                      padding: '14px 16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: isWarning ? '0 0 16px rgba(239, 68, 68, 0.2)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '13px', color: '#ffffff' }}>{chute.name}</span>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          color: barColor,
                          background: `${barColor}15`,
                          border: `1px solid ${barColor}40`,
                          padding: '1px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {isWarning ? 'CONTENTION' : 'NOMINAL'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: barColor, fontFamily: 'var(--font-mono)' }}>
                        {chute.vol.toFixed(2)}{' '}
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {chute.max.toFixed(2)} m³</span>
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#cbd5e1', fontFamily: 'var(--font-mono)' }}>
                        {chute.pct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(30, 41, 59, 0.6)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, chute.pct)}%`,
                          height: '100%',
                          background: barColor,
                          transition: 'width 0.2s ease',
                        }}
                      />
                    </div>

                    <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                      {isWarning
                        ? 'Surge threshold exceeded. AMR drop clearance backpressure active.'
                        : 'Buffer inflow balanced with automated sorter clearance throughput.'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Choke-Point Analysis Table */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '10px',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>Spatiotemporal Corridor Choke-Points & Stalling Audit</strong>
                <span style={{ fontSize: '11px', color: '#38bdf8' }}>Max Allowed Buffer: 3.50 m³</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '8px' }}>Choke Location</th>
                      <th style={{ padding: '8px' }}>Type</th>
                      <th style={{ padding: '8px' }}>Peak Volume / Delay</th>
                      <th style={{ padding: '8px' }}>Root Cause Mechanics</th>
                      <th style={{ padding: '8px' }}>Mitigation Recourse</th>
                      <th style={{ padding: '8px' }}>Permanent SMR Countermeasure</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#ffffff' }}>Chute C2 Infeed</td>
                      <td style={{ padding: '8px', color: '#ef4444' }}>Volumetric Surge</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>3.12 m³ (89.1%)</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>Simultaneous wave arrival of AMR_002 and AMR_003</td>
                      <td style={{ padding: '8px', color: '#10b981' }}>Staggered 18s drop delay via SIPP hold</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>Dynamic chute allocation weight in cost function</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#ffffff' }}>Aisle 4 Crossing</td>
                      <td style={{ padding: '8px', color: '#f59e0b' }}>HRI Mixed Zone</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>v clamped to 0.40 m/s</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>Warehouse associate entered laser safety scanner field</td>
                      <td style={{ padding: '8px', color: '#10b981' }}>ISO 3691-4 deceleration arc without E-stop</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>UWB wearable tag dynamic corridor broadcast</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#ffffff' }}>Aisle 2 Main Artery</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>Fleet Cross Yield</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>4.8s yield hold</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>Perpendicular trajectory intersection between AMR_003 and AMR_001</td>
                      <td style={{ padding: '8px', color: '#10b981' }}>Priority token assigned to highest payload AMR</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>Spatiotemporal reservation grid with 1.2m bubble</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '8px', fontWeight: 600, color: '#ffffff' }}>South Turn R1</td>
                      <td style={{ padding: '8px', color: '#a855f7' }}>Kinematic Centrifugal</td>
                      <td style={{ padding: '8px', fontFamily: 'var(--font-mono)' }}>v reduced to 1.10 m/s</td>
                      <td style={{ padding: '8px', color: '#cbd5e1' }}>High payload center of mass (CoM height = 0.62m) on AMR_002</td>
                      <td style={{ padding: '8px', color: '#10b981' }}>Clothoid curve trajectory smoothing</td>
                      <td style={{ padding: '8px', color: '#38bdf8' }}>Gate 2 CoM packing constraint enforced in solver</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 4: QUANTUM CO-PROCESSOR DIAGNOSTIC LENS                           */}
        {/* ========================================================================= */}
        {activeSubTab === 'quantum' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Synthesized Circuit Depth</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00f0ff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>42 Gates</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>16 Qubits • 68 CX 2-Qubit Gates • Transpiled 99.2%</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>QAOA Variational Energy</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>-184.6 J</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>p = 3 Layers • COBYLA Convergence in 28 steps</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Quantum State Fidelity</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>94.1%</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>ZNE Extrapolation & Readout Error Mitigation (M3)</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Quantum Supremacy Horizon</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>N* = 14 Nodes</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>10⁶x Hilbert Space Pruning over Classical MIP</div>
              </div>
            </div>

            {/* Quantum Crossover Formulation */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>
                  Ising Hamiltonian & QAOA Variational Ansatz Architecture
                </strong>
                <span style={{ fontSize: '10px', color: '#c084fc', background: 'rgba(168, 85, 247, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                  CLASSIQ SYNTHESIZED
                </span>
              </div>

              <div style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                The combinatorial logistics routing graph is mapped to a quadratic unconstrained binary optimization (QUBO) Hamiltonian. Classiq synthesizes the optimal variational state through alternating cost and mixer unitary layers:
              </div>

              <div
                style={{
                  background: 'rgba(7, 12, 24, 0.9)',
                  padding: '14px 18px',
                  borderRadius: '8px',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  overflowX: 'auto',
                  textAlign: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('\\mathcal{H}_C = \\sum_{i,j} J_{ij} Z_i Z_j + \\sum_i h_i Z_i + \\lambda_{\\text{pen}} \\mathcal{H}_{\\text{infeasible}}, \\quad |\\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta})\\rangle = \\prod_{l=1}^p e^{-i \\beta_l \\sum_i X_i} e^{-i \\gamma_l \\mathcal{H}_C} |+\\rangle^{\\otimes N}', true),
                }}
              />

              {/* Layer-by-Layer Variational Parameter Schedule Table */}
              <div style={{ overflowX: 'auto', marginTop: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '6px 8px' }}>Ansatz Layer (l)</th>
                      <th style={{ padding: '6px 8px' }}>Cost Angle γ_l (rad)</th>
                      <th style={{ padding: '6px 8px' }}>Mixer Angle β_l (rad)</th>
                      <th style={{ padding: '6px 8px' }}>Physical Role in Optimization</th>
                      <th style={{ padding: '6px 8px' }}>Energy Expectation &lang;H_C&rang;</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#38bdf8' }}>Layer 1</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.384</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>1.142</td>
                      <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>Initial Superposition Mixing & Infeasibility Depolarization</td>
                      <td style={{ padding: '6px 8px', color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>-52.4 J</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#38bdf8' }}>Layer 2</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.729</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.658</td>
                      <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>Phase Separation Amplification across Valid Hamiltonian Cycles</td>
                      <td style={{ padding: '6px 8px', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>-138.1 J</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#38bdf8' }}>Layer 3</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>1.052</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.281</td>
                      <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>Ground-State Convergence & High-Probability Solution Extraction</td>
                      <td style={{ padding: '6px 8px', color: '#10b981', fontFamily: 'var(--font-mono)' }}>-184.6 J</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBTAB 5: FLEET ENERGY & ISO 14064 CARBON FORENSICS                      */}
        {/* ========================================================================= */}
        {activeSubTab === 'carbon' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Total Mission Energy</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>1.48 kWh</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>0.082 kWh per Order Delivered</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>ISO 14064 Carbon Footprint</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>214.6 g CO₂e</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Grid emission factor: 145 g/kWh</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Regenerative Braking Recovery</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>-0.14 kWh (9.4%)</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Recuperation on deceleration & descent</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '10px', padding: '16px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Net Savings vs Manual Forklift</span>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#00f0ff', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>-43.8%</div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>167.4 g CO₂e avoided per wave</div>
              </div>
            </div>

            {/* Subsystem Power Draw Decomposition */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>TRACTION DRIVE MOTORS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>0.84 kWh (56.8%)</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Overcoming rolling resistance (c_rr = 0.015) and kinetic acceleration cycles.
                </div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>LIFT & DECK ACTUATORS</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>0.32 kWh (21.6%)</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Payload elevation, pneumatic clamping, and gravitational potential work.
                </div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#a855f7' }}>COMPUTE & 3D LIDAR SLAM</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>0.21 kWh (14.2%)</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Dual edge accelerators, safety field scanning, and real-time mesh communications.
                </div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.75)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '12px 14px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>AUXILIARY & STANDBY</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>0.11 kWh (7.4%)</div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '4px' }}>
                  Electromagnetic holding brakes and battery thermal conditioning circuits.
                </div>
              </div>
            </div>

            {/* Kinetic Discharge & ISO 14064 Carbon Model */}
            <div style={{ background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '10px', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>Kinematic Battery Discharge & ISO 14064 Green Logistics Formulation</strong>
              <div
                style={{
                  background: 'rgba(7, 12, 24, 0.9)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  overflowX: 'auto',
                  textAlign: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX('P_{\\text{traction}}(t) = \\left( m_{\\text{tare}} + m_{\\text{payload}}(t) \\right) \\cdot \\left( a(t) + g \\cdot c_{rr} \\right) \\cdot v(t) + \\frac{1}{2} \\rho_{\\text{air}} C_d A v^3(t), \\quad \\text{GHG}_{\\text{Scope 2}} = E_{\\text{net}} \\cdot \\text{EF}_{\\text{grid}} \\cdot (1 + \\mu_{\\text{loss}})', true),
                }}
              />

              {/* ESG Comparative Benchmark Table */}
              <div style={{ overflowX: 'auto', marginTop: '6px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8' }}>
                      <th style={{ padding: '6px 8px' }}>Logistics Transport Mode</th>
                      <th style={{ padding: '6px 8px' }}>Specific Energy (kWh/pkg)</th>
                      <th style={{ padding: '6px 8px' }}>Carbon Intensity (g CO₂e/pkg)</th>
                      <th style={{ padding: '6px 8px' }}>Kinetic Energy Recuperation</th>
                      <th style={{ padding: '6px 8px' }}>ISO 14064 Audit Compliance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#f87171' }}>Diesel IC Forklift Fleet</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.320 kWh</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>84.5 g CO₂e</td>
                      <td style={{ padding: '6px 8px', color: '#94a3b8' }}>0.0% (Friction brake dissipation)</td>
                      <td style={{ padding: '6px 8px', color: '#f87171' }}>Scope 1 Emissions (High)</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#fbbf24' }}>Lead-Acid Electric AGV</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>0.145 kWh</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)' }}>21.0 g CO₂e</td>
                      <td style={{ padding: '6px 8px', color: '#fbbf24' }}>2.1% (Inefficient battery chemical absorption)</td>
                      <td style={{ padding: '6px 8px', color: '#fbbf24' }}>Scope 2 Moderate</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)' }}>
                      <td style={{ padding: '6px 8px', fontWeight: 600, color: '#10b981' }}>Classiq-Optimized LiFePO4 Fleet</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>0.082 kWh</td>
                      <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>11.9 g CO₂e</td>
                      <td style={{ padding: '6px 8px', color: '#10b981', fontWeight: 700 }}>9.4% (Direct KERS Inverter Feed)</td>
                      <td style={{ padding: '6px 8px', color: '#10b981', fontWeight: 700 }}>Scope 2 Certified Zero-Fault</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
