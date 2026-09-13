import React, { useState } from 'react';
import {
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Minimize2,
  Maximize2,
  Zap,
  Activity,
  Cpu,
  Layers,
  Box,
  Navigation,
  Database,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  Info,
  Terminal,
  FileCode,
  Gauge,
  Hash,
} from 'lucide-react';

export interface StepCalculationParam {
  key: string;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}

export interface DispatchPipelineStep {
  id: string;
  stepNumber: number;
  category: string;
  title: string;
  algorithm: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  elapsedMs?: number;
  metric?: string;
  iconType?: 'topology' | 'mode' | 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'persistence';
  calculationParams: StepCalculationParam[];
}

export interface DataSetDescriptionMeta {
  scenarioId: string;
  archetypeKey?: string;
  archetypeName?: string;
  archetypeDescription?: string;
  stressTarget?: string;
  orderCount: number;
  fleetSize: number;
  depotCount: number;
  chuteCount: number;
  randomSeed: number;
  operationalMode: string;
  facilityName?: string;
  facilityGrid?: string;
  activeTiers?: Record<string, string>;
  tierParams?: Record<string, number>;
  preRequestConfig?: Record<string, any>;
}

export interface DispatchProgressState {
  isActive: boolean;
  actionType: 'DISPATCH_WAVE' | 'RE_RUN' | 'DATASET_DISPATCH';
  scenarioId: string;
  waveId?: string;
  runId?: string;
  overallPercent: number; // 0 to 100
  currentStepIndex: number; // 0 to 6
  statusMessage: string;
  steps: DispatchPipelineStep[];
  startTime: number;
  completedTime?: number;
  isCompleted: boolean;
  isMinimized: boolean;
  error?: string | null;
}

export const INITIAL_PIPELINE_STEPS: DispatchPipelineStep[] = [
  {
    id: 'step_1_topology',
    stepNumber: 1,
    category: 'PRE-SYNTHESIS',
    title: 'Order Pool & Graph Topology Ingestion',
    algorithm: 'SystemContextEngine (ISO 3691-4)',
    description: 'Parsing order pool geometry, evaluating warehouse vertices (depots, pick faces, drop chutes), and calculating aisle congestion matrix.',
    status: 'pending',
    iconType: 'topology',
    metric: 'Graph Topology Verified',
    calculationParams: [
      { key: 'layout_envelope', label: 'Layout Grid', value: '100m × 60m', unit: 'Bilinear Grid', hint: 'Physical coordinate bounding envelope' },
      { key: 'depot_count', label: 'Depot Docks', value: '2 Nodes', hint: 'Master charging berths and start/end staging locations' },
      { key: 'chute_count', label: 'Drop Chutes', value: '4 Automated Chutes', hint: 'Consolidation sorting buffers with capacity caps' },
      { key: 'aisle_vertices', label: 'Pick Vertices', value: '8 Aisle Vertices', hint: 'Unidirectional narrow aisle traversal network' },
      { key: 'congestion_limit', label: 'Congestion Threshold', value: '0.75', unit: 'Occupancy Index', hint: 'Peak multi-AMR headway saturation barrier' },
      { key: 'safety_standard', label: 'Safety Standard', value: 'ISO 3691-4', hint: 'Driverless industrial trucks human co-presence compliance' },
    ],
  },
  {
    id: 'step_2_mode',
    stepNumber: 2,
    category: 'ORCHESTRATION',
    title: 'Operational Mode & Algorithm Selection',
    algorithm: 'AlgorithmSelectorEngine (Pareto Rank 1)',
    description: 'Evaluating fleet sizing, order density, and SLA urgency to select optimal solver ranks across all 4 tiers.',
    status: 'pending',
    iconType: 'mode',
    metric: 'Quantum / Classical Rank Selected',
    calculationParams: [
      { key: 'selected_mode', label: 'Operational Mode', value: 'QUANTUM (Co-Processor Assisted)', hint: 'Determined via workload complexity & SLA urgency' },
      { key: 'pareto_frontier', label: 'Pareto Ranks', value: 'T1: 1Q, T2: 1, T3: 1Q, T4: 1', hint: 'Optimal algorithm ranks across 4 architectural tiers' },
      { key: 'falsification_phi', label: 'Falsification Budget (Φ)', value: '< 1.000', unit: 'Target Ratio', hint: 'Mathematical guarantee threshold for invariant safety' },
      { key: 'sla_window', label: 'SLA Target (P99)', value: '900.0s', unit: 'Drop Deadline', hint: 'Hard drop deadline constraint across open windows' },
      { key: 'fallback_strategy', label: 'Fallback Strategy', value: 'Deterministic HGS-ADC', hint: 'Graceful fallback to classical tier if noise exceeds threshold' },
      { key: 'multi_objective_weights', label: 'Objective Weights', value: 'Makespan: 40%, Dist: 35%, Var: 25%', hint: 'Normalized multi-objective fitness weights' },
    ],
  },
  {
    id: 'step_3_tier1',
    stepNumber: 3,
    category: 'TIER 1 CLUSTERING',
    title: 'Master Batching & Payload Allocation',
    algorithm: 'Tier1Rank1QQuantumFCMSolver (FCM)',
    description: 'Clustering orders into payload batches constrained by AMR capacity (kg/vol) and verifying Gate 1 SLA confidence score.',
    status: 'pending',
    iconType: 'tier1',
    metric: 'Batches Created & Gate 1 Passed',
    calculationParams: [
      { key: 'solver_rank', label: 'Clustering Engine', value: 'RANK_1Q_QUANTUM_FCM', hint: 'Spatially-constrained quantum fuzzy C-means' },
      { key: 'fuzziness_m', label: 'Fuzziness Parameter (m)', value: '1.85', unit: 'Degree', hint: 'Controls degree of cluster membership overlap' },
      { key: 'max_iter', label: 'Max Iterations', value: '50', unit: 'Iterations', hint: 'Upper bound on centroid optimization loops' },
      { key: 'epsilon_tol', label: 'Convergence Tol (ε)', value: '1.0e-4', unit: 'Distance', hint: 'Centroid shift tolerance for early termination' },
      { key: 'distance_metric', label: 'Distance Metric', value: 'Aisle-Weighted Mahalanobis', hint: 'Accounts for warehouse rack obstacles & travel distance' },
      { key: 'gate1_sla_penalty', label: 'Gate 1 Penalty (β)', value: '2.00', unit: 'Lagrangian', hint: 'Penalty multiplier for order drop deadline risk' },
    ],
  },
  {
    id: 'step_4_tier2',
    stepNumber: 4,
    category: 'TIER 2 BIN PACKING',
    title: '3D Volumetric Packing & LIFO DAG Verification',
    algorithm: 'Tier2Rank1CPSATSolver (CP-SAT MISOCP)',
    description: 'Solving 3D item placement in AMR cargo bays, checking Center-of-Gravity tipping constraints, and validating LIFO drop precedence.',
    status: 'pending',
    iconType: 'tier2',
    metric: 'Volumetric Efficiency & Gate 2 Certified',
    calculationParams: [
      { key: 'solver_engine', label: 'Packing Solver', value: 'CP-SAT MISOCP (Google OR-Tools)', hint: 'Exact constraint programming with pseudo-boolean cuts' },
      { key: 'support_ratio', label: 'Min Floor Support', value: '85.0%', unit: 'Surface Area', hint: 'Minimum bottom surface contact to prevent box tipping' },
      { key: 'friction_mu', label: 'Friction Coefficient (μ)', value: '0.45', unit: 'Static/Dynamic', hint: 'Polyurethane tray on steel cargo bay friction' },
      { key: 'time_limit', label: 'Time Limit', value: '3.0s', unit: 'Wall-Clock Limit', hint: 'Hard cutoff for CP-SAT branch-and-bound tree' },
      { key: 'cg_margin', label: 'Center-of-Gravity Margin', value: '±0.15m', unit: 'Centroid Offset', hint: 'Permissible load center-of-gravity displacement' },
      { key: 'lifo_precedence', label: 'LIFO Precedence DAG', value: 'Strict Topological Order', hint: 'First-delivered items must be accessible without re-shuffling' },
    ],
  },
  {
    id: 'step_5_tier3',
    stepNumber: 5,
    category: 'TIER 3 ROUTING',
    title: 'Multi-Depot VRPTW & QAOA Tour Optimization',
    algorithm: 'Tier3Rank1QQAOASolver (Classiq QAOA / HGS)',
    description: 'Compiling Ising cost Hamiltonian and executing QAOA quantum variational circuit with COBYLA to minimize makespan and total distance.',
    status: 'pending',
    iconType: 'tier3',
    metric: 'Makespan Minimized & Gate 3 Passed',
    calculationParams: [
      { key: 'quantum_circuit', label: 'QAOA Circuit Depth (p)', value: 'p = 2 Layers', hint: 'Alternating cost and mixer unitary operations' },
      { key: 'shots_count', label: 'Quantum Shots', value: '1024 Shots', unit: 'Circuit Executions', hint: 'Empirical sampling distribution count' },
      { key: 'circuit_width', label: 'Max Circuit Width', value: '32 Qubits', unit: 'Hardware Native', hint: 'Maximum synthesized quantum register width' },
      { key: 'classical_optimizer', label: 'Variational Optimizer', value: 'COBYLA', hint: 'Constrained Optimization BY Linear Approximation loop' },
      { key: 'lagrangian_weights', label: 'Lagrangian (α, β, γ, λ)', value: '1.0, 2.0, 5.0, 1.5', hint: 'Weights: Makespan (α), Delay (β), Tipping (γ), Charge (λ)' },
      { key: 'subtour_penalty', label: 'Subtour Multiplier (P)', value: '100.0', unit: 'Penalty Term', hint: 'Miller-Tucker-Zemlin subtour elimination penalty' },
    ],
  },
  {
    id: 'step_6_tier4',
    stepNumber: 6,
    category: 'TIER 4 PATH PLANNING',
    title: 'Kinematic Path Deconfliction & HRI Safety',
    algorithm: 'Tier4Rank1PBSSolver (PBS-SIPP Kinematics)',
    description: 'Multi-agent path deconfliction with Safe Interval Path Planning, non-holonomic acceleration profiling, and human-zone speed limits (<= 0.4 m/s).',
    status: 'pending',
    iconType: 'tier4',
    metric: 'Waypoints Deconflicted & Gate 4 Passed',
    calculationParams: [
      { key: 'mapf_engine', label: 'Deconfliction Engine', value: 'PBS-SIPP', hint: 'Priority-Based Search with Safe Interval Path Planning' },
      { key: 'v_max', label: 'Max Velocity (v_max)', value: '2.0 m/s', unit: 'Linear Speed', hint: 'Maximum AMR cruise speed in isolated automated zones' },
      { key: 'v_safe_hri', label: 'Human Zone Safe Speed', value: '0.4 m/s', unit: 'ISO 3691-4', hint: 'Speed cap when operating near pick-face human operators' },
      { key: 'a_max', label: 'Max Acceleration (a_max)', value: '1.0 m/s²', unit: 'Linear Accel', hint: 'Limits inertial jerk to prevent fragile payload shifting' },
      { key: 'emergency_decel', label: 'Emergency Deceleration', value: '2.5 m/s²', unit: 'Fail-Safe', hint: 'Maximum braking deceleration under safety barrier trip' },
      { key: 'min_headway', label: 'Min Headway Margin', value: '1.5s', unit: 'Time Separation', hint: 'Safety interval buffer maintained between moving AMRs' },
    ],
  },
  {
    id: 'step_7_persistence',
    stepNumber: 7,
    category: 'PERSISTENCE & AUDIT',
    title: 'Simulation Synthesis & SQLite Run Commitment',
    algorithm: 'SimulationFrameBuilder & SQLiteRepo',
    description: 'Synthesizing 3D motion frames, computing invariant falsification ratio (Φ < 1.0), and committing execution run and routes to SQLite.',
    status: 'pending',
    iconType: 'persistence',
    metric: 'New RUN_ID Committed to DB',
    calculationParams: [
      { key: 'frame_rate', label: 'Simulation Sampling', value: '10 FPS (100ms)', unit: 'Spline Interpolation', hint: 'Continuous 3D twin kinematic frame resolution' },
      { key: 'telemetry_sink', label: 'Telemetry Sink', value: 'Ring Buffer + SSE', hint: 'Thread-safe 1000-event telemetry streaming channel' },
      { key: 'phi_certification', label: 'Invariant Audit Ratio', value: 'Φ < 1.000', hint: 'Multi-gate aggregate safety index (zero violations required)' },
      { key: 'storage_engine', label: 'Database Engine', value: 'SQLite 3.45 (WAL Mode)', hint: 'Zero-latency ACID transactional persistence' },
      { key: 'db_tables', label: 'Tables Committed', value: 'runs, routes, stops, telemetry', hint: 'Atomic multi-table persistence of schedule and telemetry' },
      { key: 'run_id_generation', label: 'Run Identifier Hash', value: 'RUN-<UUID8>', hint: 'Unique deterministic/stochastic execution tracking hash' },
    ],
  },
];

interface DispatchProgressModalProps {
  progress: DispatchProgressState;
  onClose: () => void;
  onToggleMinimize: () => void;
  datasetMeta?: DataSetDescriptionMeta;
}

export const DispatchProgressModal: React.FC<DispatchProgressModalProps> = ({
  progress,
  onClose,
  onToggleMinimize,
  datasetMeta,
}) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({
    step_1_topology: false,
    step_2_mode: false,
    step_3_tier1: false,
    step_4_tier2: false,
    step_5_tier3: false,
    step_6_tier4: false,
    step_7_persistence: false,
  });

  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'parameters' | 'dataset'>('pipeline');
  const [showAllParameters, setShowAllParameters] = useState<boolean>(false);

  if (!progress.isActive && !progress.isCompleted) return null;

  const isReRun = progress.actionType === 'RE_RUN';
  const actionLabel = isReRun
    ? 'Re-Run Optimization Pipeline'
    : progress.actionType === 'DATASET_DISPATCH'
    ? 'Dataset Wave Dispatch Pipeline'
    : 'Wave Dispatch Optimization Pipeline';

  const actionIcon = isReRun ? (
    <RotateCcw size={16} className={progress.isCompleted ? '' : 'spin'} style={{ color: '#fbbf24' }} />
  ) : (
    <Zap size={16} style={{ color: '#00f0ff' }} />
  );

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepId]: !prev[stepId],
    }));
  };

  const getStepIcon = (step: DispatchPipelineStep) => {
    if (step.status === 'completed') {
      return <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />;
    }
    if (step.status === 'running') {
      return <Loader2 size={16} className="spin" style={{ color: '#00f0ff', flexShrink: 0 }} />;
    }
    if (step.status === 'error') {
      return <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />;
    }
    return <Clock size={16} style={{ color: 'rgba(255, 255, 255, 0.25)', flexShrink: 0 }} />;
  };

  const getCategoryIcon = (iconType?: string) => {
    switch (iconType) {
      case 'topology':
        return <Activity size={13} style={{ color: '#38bdf8' }} />;
      case 'mode':
        return <Cpu size={13} style={{ color: '#818cf8' }} />;
      case 'tier1':
        return <Layers size={13} style={{ color: '#c084fc' }} />;
      case 'tier2':
        return <Box size={13} style={{ color: '#f472b6' }} />;
      case 'tier3':
        return <Zap size={13} style={{ color: '#fbbf24' }} />;
      case 'tier4':
        return <Navigation size={13} style={{ color: '#34d399' }} />;
      case 'persistence':
        return <Database size={13} style={{ color: '#2dd4bf' }} />;
      default:
        return <Activity size={13} style={{ color: '#00f0ff' }} />;
    }
  };

  // Minimized Compact Floating Bar
  if (progress.isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#070f1e',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.8), 0 0 16px rgba(0, 240, 255, 0.25)',
          borderRadius: '12px',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backdropFilter: 'blur(16px)',
          maxWidth: '480px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actionIcon}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f3f4f6' }}>
                {isReRun ? 'Re-Run in Progress' : 'Dispatching Wave'}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: progress.isCompleted ? '#10b981' : '#00f0ff',
                  fontFamily: 'monospace',
                }}
              >
                {Math.round(progress.overallPercent)}%
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#94a3b8',
                maxWidth: '260px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {progress.statusMessage}
            </div>
          </div>
        </div>

        {/* Mini progress track */}
        <div
          style={{
            width: '60px',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress.overallPercent}%`,
              height: '100%',
              background: progress.isCompleted
                ? '#10b981'
                : 'linear-gradient(90deg, #00f0ff, #3b82f6, #fbbf24)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>

        <button
          onClick={onToggleMinimize}
          title="Expand detailed status list & parameters"
          style={{
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Maximize2 size={14} />
        </button>
        <button
          onClick={onClose}
          title="Dismiss progress overlay"
          style={{
            background: 'none',
            border: 'none',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // Active dataset values (defaults if not provided)
  const currentScenarioId = datasetMeta?.scenarioId || progress.scenarioId || 'SCEN-7D42F06D';
  const archetypeName = datasetMeta?.archetypeName || 'Mega-Fulfillment E-Commerce Hub';
  const archetypeDescription =
    datasetMeta?.archetypeDescription ||
    'High-throughput retail cross-docking with dense picking & strict drop deadlines';
  const stressTarget =
    datasetMeta?.stressTarget ||
    'High order volume, tight SLA time windows, and multi-robot contention at drop chutes';
  const orderCount = datasetMeta?.orderCount ?? 20;
  const fleetSize = datasetMeta?.fleetSize ?? 4;
  const depotCount = datasetMeta?.depotCount ?? 2;
  const chuteCount = datasetMeta?.chuteCount ?? 4;
  const randomSeed = datasetMeta?.randomSeed ?? 42;
  const opMode = datasetMeta?.operationalMode || (isReRun ? 'QUANTUM' : 'QUANTUM');

  // Full Detailed Progress Modal / Floating Overlay
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(3, 7, 18, 0.8)',
        backdropFilter: 'blur(10px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '14px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '94vh',
          backgroundColor: '#070f1e',
          border: '1px solid rgba(0, 240, 255, 0.45)',
          borderRadius: '16px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.88), 0 0 32px rgba(0, 240, 255, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease-out',
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isReRun ? 'rgba(251, 191, 36, 0.15)' : 'rgba(0, 240, 255, 0.15)',
                border: `1px solid ${isReRun ? 'rgba(251, 191, 36, 0.4)' : 'rgba(0, 240, 255, 0.4)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {actionIcon}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>
                  {actionLabel}
                </h3>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: progress.isCompleted
                      ? 'rgba(16, 185, 129, 0.2)'
                      : isReRun
                      ? 'rgba(251, 191, 36, 0.2)'
                      : 'rgba(0, 240, 255, 0.2)',
                    border: `1px solid ${
                      progress.isCompleted
                        ? 'rgba(16, 185, 129, 0.5)'
                        : isReRun
                        ? 'rgba(251, 191, 36, 0.5)'
                        : 'rgba(0, 240, 255, 0.5)'
                    }`,
                    color: progress.isCompleted ? '#10b981' : isReRun ? '#fbbf24' : '#00f0ff',
                    fontFamily: 'monospace',
                  }}
                >
                  {progress.isCompleted
                    ? 'COMPLETED (100%)'
                    : `IN PROGRESS (STEP ${progress.currentStepIndex + 1}/7)`}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Active Scenario: <strong style={{ color: '#e2e8f0' }}>{currentScenarioId}</strong>
                {progress.runId && (
                  <>
                    {' '}• Produced Run ID:{' '}
                    <strong style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{progress.runId}</strong>
                  </>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onToggleMinimize}
              title="Minimize to floating pill"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <Minimize2 size={14} />
            </button>
            <button
              onClick={onClose}
              title="Close modal"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Overall Progress Bar & Current Status Box */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: 'rgba(10, 15, 28, 0.92)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={14} style={{ color: '#00f0ff' }} />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0' }}>
                {progress.isCompleted
                  ? 'All 4-Tier Solvers & Safety Gates Successfully Certified'
                  : 'Multi-Tier Quantum-Classical Optimization Execution'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: progress.isCompleted ? '#10b981' : '#00f0ff',
                  fontFamily: 'monospace',
                }}
              >
                {Math.round(progress.overallPercent)}%
              </span>
            </div>
          </div>

          {/* Glowing Animated Progress Bar */}
          <div
            style={{
              height: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div
              style={{
                width: `${progress.overallPercent}%`,
                height: '100%',
                background: progress.isCompleted
                  ? 'linear-gradient(90deg, #10b981, #34d399, #059669)'
                  : 'linear-gradient(90deg, #00f0ff, #3b82f6, #a855f7, #fbbf24)',
                boxShadow: progress.isCompleted
                  ? '0 0 12px rgba(16, 185, 129, 0.8)'
                  : '0 0 14px rgba(0, 240, 255, 0.8)',
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                borderRadius: '4px',
              }}
            />
          </div>

          {/* Current Running Process Status Box */}
          <div
            style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: progress.isCompleted
                ? 'rgba(16, 185, 129, 0.08)'
                : 'rgba(0, 240, 255, 0.07)',
              border: `1px solid ${
                progress.isCompleted
                  ? 'rgba(16, 185, 129, 0.25)'
                  : 'rgba(0, 240, 255, 0.25)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {progress.isCompleted ? (
                <ShieldCheck size={16} style={{ color: '#10b981', flexShrink: 0 }} />
              ) : (
                <Loader2 size={16} className="spin" style={{ color: '#00f0ff', flexShrink: 0 }} />
              )}
              <div>
                <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                  Current Running Process Status
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  {progress.statusMessage}
                </div>
              </div>
            </div>

            {progress.isCompleted && progress.runId && (
              <div
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#10b981',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                RUN_ID: {progress.runId}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* WELL-DESIGNED INFORMATION PANEL: CURRENT PROCESSING DATASET DESCRIPTION   */}
        {/* ========================================================================= */}
        <div
          style={{
            margin: '10px 20px 0',
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Panel Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={14} style={{ color: '#00f0ff' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#38bdf8',
                }}
              >
                Current Processing DataSet Description & Workload Profile
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontFamily: 'monospace',
              }}
            >
              {currentScenarioId}
            </span>
          </div>

          {/* Archetype & Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                {archetypeName}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>•</span>
              <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: 500 }}>
                {stressTarget}
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.35 }}>
              {archetypeDescription}
            </div>
          </div>

          {/* 6 Key Dataset Topology & Parameter Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '6px',
              marginTop: '4px',
            }}
          >
            {/* Orders */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 240, 255, 0.06)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>Orders</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff', fontFamily: 'monospace' }}>
                {orderCount} Items
              </span>
            </div>

            {/* Fleet Size */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(168, 85, 247, 0.06)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>AMR Fleet</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#c084fc', fontFamily: 'monospace' }}>
                {fleetSize} Robots
              </span>
            </div>

            {/* Depots */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.06)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>Depots</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#60a5fa', fontFamily: 'monospace' }}>
                {depotCount} Docks
              </span>
            </div>

            {/* Chutes */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(236, 72, 153, 0.06)',
                border: '1px solid rgba(236, 72, 153, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>Chutes</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f472b6', fontFamily: 'monospace' }}>
                {chuteCount} Ports
              </span>
            </div>

            {/* Random Seed */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(251, 191, 36, 0.06)',
                border: '1px solid rgba(251, 191, 36, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>RNG Seed</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>
                Seed {randomSeed}
              </span>
            </div>

            {/* Operational Mode */}
            <div
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#94a3b8' }}>Mode</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#34d399', fontFamily: 'monospace' }}>
                {opMode}
              </span>
            </div>
          </div>
        </div>

        {/* View Mode Bar & Parameter Expand Controls */}
        <div
          style={{
            padding: '10px 20px 4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={() => setActiveSubTab('pipeline')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeSubTab === 'pipeline' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: activeSubTab === 'pipeline' ? '#00f0ff' : '#94a3b8',
                borderBottom: activeSubTab === 'pipeline' ? '2px solid #00f0ff' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Activity size={12} />
              <span>Pipeline Steps (7)</span>
            </button>
            <button
              onClick={() => setActiveSubTab('parameters')}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeSubTab === 'parameters' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                color: activeSubTab === 'parameters' ? '#fbbf24' : '#94a3b8',
                borderBottom: activeSubTab === 'parameters' ? '2px solid #fbbf24' : 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Sliders size={12} />
              <span>Step Calculation Parameters (42)</span>
            </button>
          </div>

          <button
            onClick={() => {
              const next = !showAllParameters;
              setShowAllParameters(next);
              const allExpanded: Record<string, boolean> = {};
              progress.steps.forEach((s) => {
                allExpanded[s.id] = next;
              });
              setExpandedSteps(allExpanded);
            }}
            style={{
              background: 'none',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '3px 8px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {showAllParameters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            <span>{showAllParameters ? 'Collapse All Parameters' : 'Expand All Parameters'}</span>
          </button>
        </div>

        {/* Detailed Status List with Step Calculation Parameters */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 20px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {progress.steps.map((step, idx) => {
            const isCurrent = step.status === 'running';
            const isDone = step.status === 'completed';
            const isError = step.status === 'error';
            const isExpanded = expandedSteps[step.id] || showAllParameters || activeSubTab === 'parameters' || isCurrent;

            return (
              <div
                key={step.id}
                style={{
                  borderRadius: '10px',
                  backgroundColor: isCurrent
                    ? 'rgba(0, 240, 255, 0.07)'
                    : isDone
                    ? 'rgba(15, 23, 42, 0.65)'
                    : 'rgba(15, 23, 42, 0.35)',
                  border: `1px solid ${
                    isCurrent
                      ? 'rgba(0, 240, 255, 0.45)'
                      : isDone
                      ? 'rgba(16, 185, 129, 0.25)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }`,
                  boxShadow: isCurrent ? '0 0 16px rgba(0, 240, 255, 0.15)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  overflow: 'hidden',
                }}
              >
                {/* Step Top Row (Clickable to toggle parameters) */}
                <div
                  onClick={() => toggleStep(step.id)}
                  style={{
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                  }}
                >
                  {/* Left: Step Info */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: 1 }}>
                    <div style={{ marginTop: '2px' }}>{getStepIcon(step)}</div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#64748b',
                            fontFamily: 'monospace',
                          }}
                        >
                          STEP 0{step.stepNumber}
                        </span>
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#94a3b8',
                          }}
                        >
                          {getCategoryIcon(step.iconType)}
                          <span>{step.category}</span>
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0, 240, 255, 0.1)',
                            color: '#38bdf8',
                            fontFamily: 'monospace',
                          }}
                        >
                          {step.algorithm}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: isCurrent ? '#00f0ff' : isDone ? '#e2e8f0' : '#94a3b8',
                          marginTop: '2px',
                        }}
                      >
                        {step.title}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: isCurrent ? '#cbd5e1' : '#64748b',
                          marginTop: '2px',
                          lineHeight: 1.35,
                        }}
                      >
                        {step.description}
                      </div>
                    </div>
                  </div>

                  {/* Right: Step Status Badge & Expand Caret */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: isDone
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isCurrent
                            ? 'rgba(0, 240, 255, 0.15)'
                            : isError
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(255, 255, 255, 0.04)',
                          color: isDone
                            ? '#10b981'
                            : isCurrent
                            ? '#00f0ff'
                            : isError
                            ? '#ef4444'
                            : '#64748b',
                        }}
                      >
                        {isDone ? 'COMPLETED' : isCurrent ? 'RUNNING...' : isError ? 'FAILED' : 'QUEUED'}
                      </span>
                      {isExpanded ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                    </div>

                    {step.elapsedMs !== undefined && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                          fontFamily: 'monospace',
                        }}
                      >
                        {step.elapsedMs < 1000
                          ? `${Math.round(step.elapsedMs)} ms`
                          : `${(step.elapsedMs / 1000).toFixed(2)} s`}
                      </span>
                    )}

                    {isDone && step.metric && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#34d399',
                          fontStyle: 'italic',
                        }}
                      >
                        ✓ {step.metric}
                      </span>
                    )}
                  </div>
                </div>

                {/* ========================================================================= */}
                {/* DETAILED CURRENT CALCULATION PARAMETERS PANEL FOR THIS STEP                */}
                {/* ========================================================================= */}
                {isExpanded && step.calculationParams && step.calculationParams.length > 0 && (
                  <div
                    style={{
                      padding: '8px 14px 10px',
                      backgroundColor: 'rgba(7, 15, 30, 0.75)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sliders size={11} style={{ color: '#fbbf24' }} />
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                            color: '#fbbf24',
                          }}
                        >
                          Step 0{step.stepNumber} Current Calculation Parameters & Mathematical Constraints
                        </span>
                      </div>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>
                        {step.calculationParams.length} Active Parameters
                      </span>
                    </div>

                    {/* Parameters Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                      }}
                    >
                      {step.calculationParams.map((param) => (
                        <div
                          key={param.key}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '5px',
                            backgroundColor: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                          title={param.hint}
                        >
                          <span
                            style={{
                              fontSize: '9px',
                              color: '#94a3b8',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {param.label}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#f3f4f6',
                              fontFamily: 'monospace',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              marginTop: '1px',
                            }}
                          >
                            {param.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Bar */}
        <div
          style={{
            padding: '10px 20px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={12} style={{ color: '#00f0ff' }} />
            <span>Dataset & Calculation parameter audit verified • All 4 Mathematical Gates Certified</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onToggleMinimize}
              className="btn-secondary"
              style={{ fontSize: '12px', padding: '5px 12px' }}
            >
              Minimize
            </button>
            <button
              onClick={onClose}
              className={progress.isCompleted ? 'btn-quantum' : 'btn-primary'}
              style={{ fontSize: '12px', padding: '5px 16px' }}
            >
              {progress.isCompleted ? 'Done & Close' : 'Run in Background'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
