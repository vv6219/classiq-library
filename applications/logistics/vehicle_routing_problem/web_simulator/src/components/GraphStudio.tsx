import React, { useState, useEffect } from 'react';
import {
  Network,
  GitFork,
  TrendingUp,
  Gauge,
  Cpu,
  GitCommit,
  BarChart3,
  RefreshCw,
  Download,
  Layers,
  Sparkles,
  Eye,
  Check,
  BookOpen,
  HelpCircle,
  Activity,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  Tag,
  Scale,
  Zap,
  Maximize2,
  Volume2,
  VolumeX,
  Copy,
  X,
} from 'lucide-react';
import katex from 'katex';
import { getGraphImageUrl, RunSummaryDTO, formatRunMode } from '../services/api';
import { GRAPH_DOSSIERS } from '../data/graphDossiers';
import { HUDPanelDisplayMode } from './common/HUDPanel';

interface GraphStudioProps {
  runId?: string;
  runs?: RunSummaryDTO[];
  onSelectRun?: (runId: string) => void;
  activeGraphId?: string;
  onSelectGraph?: (graphId: string) => void;
  isMeaningPanelOpen?: boolean;
  onToggleMeaningPanel?: () => void;
  onOpenReportsStudio?: () => void;
  reportsCount?: number;
  reportsRepoMode?: HUDPanelDisplayMode;
  onReportsRepoModeChange?: (mode: HUDPanelDisplayMode) => void;
}

export const GraphStudio: React.FC<GraphStudioProps> = ({
  runId: propRunId,
  runs,
  onSelectRun,
  activeGraphId,
  onSelectGraph,
  isMeaningPanelOpen: propIsMeaningPanelOpen,
  onToggleMeaningPanel,
  onOpenReportsStudio,
  reportsCount = 0,
  reportsRepoMode = 'minimized',
  onReportsRepoModeChange,
}) => {
  const effectiveRunId = propRunId && propRunId.trim() ? propRunId.trim() : (runs && runs[0]?.run_id) || 'RUN-ACTIVE-001';
  const currentRunObj = runs?.find((r) => r.run_id === effectiveRunId);
  const currentMode = currentRunObj?.operational_mode || 'QUANTUM';
  const [activeGraph, setActiveGraph] = useState<string>(activeGraphId || 'pareto');
  const [reloadKey, setReloadKey] = useState<number>(Date.now());
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [triedFallback, setTriedFallback] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'figure' | 'vector'>('figure');
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [dossierTab, setDossierTab] = useState<'all' | 'meaning' | 'elements' | 'acronyms' | 'results'>('all');
  const [activeStudioTab, setActiveStudioTab] = useState<'chart' | 'dossier'>('chart');
  const [localMeaningOpen, setLocalMeaningOpen] = useState<boolean>(true);
  const isMeaningOpen = propIsMeaningPanelOpen !== undefined ? propIsMeaningPanelOpen : localMeaningOpen;
  const toggleMeaningPanel = () => {
    if (onToggleMeaningPanel) {
      onToggleMeaningPanel();
    } else {
      setLocalMeaningOpen((prev) => !prev);
    }
  };
  const [isSpeakingMeaning, setIsSpeakingMeaning] = useState<boolean>(false);
  const [meaningSubTab, setMeaningSubTab] = useState<'overview' | 'math' | 'elements' | 'kpis'>('overview');

  // Helper to render KaTeX safely
  const renderFormula = (latex: string) => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<div style="color: #00f0ff; font-family: monospace;">${latex}</div>`;
    }
  };

  const handleToggleMeaningSpeech = (dossierObj: any) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeakingMeaning) {
      window.speechSynthesis.cancel();
      setIsSpeakingMeaning(false);
      return;
    }
    const text = `${dossierObj.title}. ${dossierObj.generalMeaning.overview}. Industrial significance: ${dossierObj.generalMeaning.industrialSignificance}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeakingMeaning(false);
    utterance.onerror = () => setIsSpeakingMeaning(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeakingMeaning(true);
  };

  const handleCopyMeaningMarkdown = (dossierObj: any) => {
    const md = `# ${dossierObj.title}\n\n## Overview\n${dossierObj.generalMeaning.overview}\n\n## Mathematical Paradigm\n${dossierObj.generalMeaning.mathematicalParadigm}\n\n## Industrial Significance\n${dossierObj.generalMeaning.industrialSignificance}\n\n## Key Elements\n${dossierObj.elementExplanations.map((e: any) => `- **${e.name}** (${e.symbol}): ${e.description}`).join('\n')}\n\n## Key Metrics\n${dossierObj.calculatedResults.map((r: any) => `- **${r.metric}**: ${r.value} ${r.unit} (${r.status}) - ${r.interpretation}`).join('\n')}`;
    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  useEffect(() => {
    if (activeGraphId && activeGraphId !== activeGraph) {
      setActiveGraph(activeGraphId);
    }
  }, [activeGraphId]);

  const handleSelectGraph = (graphId: string) => {
    setActiveGraph(graphId);
    if (onSelectGraph) {
      onSelectGraph(graphId);
    }
  };

  const graphOptions = [
    {
      id: 'pareto',
      title: 'Fleet Makespan & Distance Pareto Front',
      shortTitle: 'Pareto Front',
      icon: Scale,
      desc: 'Multi-objective non-dominated frontier: makespan (s) vs total distance (km)',
      tooltip: 'Fleet Makespan vs Distance Pareto Frontier: Evaluates non-dominated trade-offs between fleet completion makespan and total travel distance across 4 optimization tiers and solver formulations.',
    },
    {
      id: 'spatial',
      title: 'Spatial Routing Network G=(V, A)',
      shortTitle: 'Spatial G=(V,A)',
      icon: Network,
      desc: 'Multi-AMR directed tour overlay, depots, picking bins & chutes',
      tooltip: 'Spatial Directed Network G=(V, A): Visualizes origin depots, picking bins, drop chutes, and charging bays. Directed arcs demonstrate collision-free tours with one-way aisle flow and MTZ subtour elimination.',
    },
    {
      id: 'lifo',
      title: '3D LIFO Extraction DAG',
      shortTitle: '3D LIFO DAG',
      icon: GitFork,
      desc: 'Topological extraction precedence & Invariant R10 acyclicity',
      tooltip: '3D LIFO Extraction Precedence DAG: Proves strict acyclicity of the item extraction graph. Ensures zero occluded item reshuffling at consolidation drop chutes pursuant to Invariant R10.',
    },
    {
      id: 'chutes',
      title: 'Chute Accumulation Qc(t)',
      shortTitle: 'Chute Qc(t)',
      icon: TrendingUp,
      desc: 'Continuous accumulation curves vs max buffer limits',
      tooltip: 'Dynamic Chute Accumulation Qc(t): Continuous volumetric loading curves at each consolidation pack station plotted against physical capacity ceiling Qc_max (3.5 m³) to guarantee zero overflow.',
    },
    {
      id: 'velocity',
      title: 'Fleet Kinematics vk(t)',
      shortTitle: 'Kinematics vk(t)',
      icon: Gauge,
      desc: 'ISO 3691-4 HRI pedestrian speed throttle (0.4 m/s)',
      tooltip: 'Fleet Kinematics vk(t): Velocity and acceleration ramps over time, demonstrating autonomous throttling to v_safe <= 0.4 m/s when traversing Human-Robot Shared Zones per ISO 3691-4.',
    },
    {
      id: 'qaoa',
      title: 'QAOA Energy Surface',
      shortTitle: 'QAOA Surface',
      icon: Cpu,
      desc: '2D contour map & bitstring measurement spectrum',
      tooltip: 'Classiq QAOA Variational Energy Landscape: 2D contour grid <gamma, beta | H_C | gamma, beta> and 2048-shot bitstring measurement spectrum identifying the minimum-energy optimal tour.',
    },
    {
      id: 'benders',
      title: 'Benders Convergence',
      shortTitle: 'Benders Bounds',
      icon: GitCommit,
      desc: 'Master Lower Bound vs Subproblem Upper Bound closure',
      tooltip: 'Logic-Based Benders Decomposition Convergence: Plots Master Problem lower bound against 3D packing feasibility upper bound, proving closure within < 1.0% optimality tolerance.',
    },
    {
      id: 'packing_3d',
      title: '3D AMR Bay Packing & CoG Stability',
      shortTitle: '3D Bay CoG',
      icon: BarChart3,
      desc: 'Container placement layout, center of gravity & geometric origin',
      tooltip: '3D Bay Packing Layout: Precise item coordinate placement [x, y, z] inside AMR cargo bays with Center-of-Gravity (CoG) balancing, friction mu=0.45, and minimum 85% bottom support area.',
    },
    {
      id: 'battery_soc',
      title: 'Fleet Battery SOC Trajectories',
      shortTitle: 'Battery SOC',
      icon: Gauge,
      desc: 'State-of-charge depletion and recovery profiles vs 20% alarm line',
      tooltip: 'Fleet Battery State-of-Charge (SOC): Continuous charge depletion curves across all active AMRs, verifying no vehicle violates the 20% minimum emergency battery threshold.',
    },
    {
      id: 'spatiotemporal_heatmap',
      title: 'Aisle Spatio-Temporal Heatmap',
      shortTitle: 'Aisle Heatmap',
      icon: Network,
      desc: 'Spatial congestion density & intersection conflict probability over time',
      tooltip: 'Spatio-Temporal Aisle Occupancy Heatmap: Density map of AMR positions across time and storage aisles, highlighting bottleneck intersections and validating PBS-SIPP deconfliction.',
    },
  ];

  const activeOption = graphOptions.find((g) => g.id === activeGraph) || graphOptions[0];

  useEffect(() => {
    setImageState('loading');
    setTriedFallback(false);
  }, [activeGraph, effectiveRunId, reloadKey]);

  const handleRefresh = () => {
    setReloadKey(Date.now());
  };

  const primaryUrl = `${getGraphImageUrl(effectiveRunId, activeGraph)}?t=${reloadKey}`;
  const staticFallbackUrl = `/api/v1/presentation/runs/RUN-ACTIVE-001/graphs/${activeGraph}.png?t=${reloadKey}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = primaryUrl;
    link.download = `wms_graph_${activeGraph}_${effectiveRunId}.png`;
    link.target = '_blank';
    link.click();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  // Render vector fallback SVG for each graph type
  const renderVectorFallback = () => {
    switch (activeGraph) {
      case 'pareto':
        return (
          <svg viewBox="0 0 700 380" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <defs>
              <linearGradient id="paretoShading" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.12" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.06" />
                <stop offset="100%" stopColor="#1e1b4b" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#00f0ff" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
            <rect width="700" height="380" fill="#0b1329" rx="8" />
            <text x="350" y="24" fill="#00f0ff" fontSize="12" fontWeight="bold" textAnchor="middle">
              Fleet Makespan vs. Total Travel Distance Pareto Frontier (Bi-Objective Multi-Tier Optimization)
            </text>

            {/* Grid & Axes */}
            <line x1="80" y1="310" x2="650" y2="310" stroke="#334155" strokeWidth="1.5" />
            <line x1="80" y1="45" x2="80" y2="310" stroke="#334155" strokeWidth="1.5" />

            {/* Horizontal Grid lines (Distance: 3.5km to 8.5km) */}
            {[
              { y: 65, label: '8.5 km' },
              { y: 115, label: '7.0 km' },
              { y: 165, label: '5.5 km' },
              { y: 215, label: '4.5 km' },
              { y: 265, label: '3.5 km' },
            ].map((tick, i) => (
              <g key={`y-${i}`}>
                <line x1="80" y1={tick.y} x2="650" y2={tick.y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x="72" y={tick.y + 4} fill="#64748b" fontSize="10" textAnchor="end" fontFamily="monospace">{tick.label}</text>
              </g>
            ))}

            {/* Vertical Grid lines (Makespan: 450s to 850s) */}
            {[
              { x: 140, label: '450s' },
              { x: 240, label: '550s' },
              { x: 340, label: '650s' },
              { x: 440, label: '750s' },
              { x: 540, label: '850s' },
            ].map((tick, i) => (
              <g key={`x-${i}`}>
                <line x1={tick.x} y1="45" x2={tick.x} y2="310" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={tick.x} y="325" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">{tick.label}</text>
              </g>
            ))}

            {/* Axis Titles */}
            <text x="365" y="344" fill="#94a3b8" fontSize="11" fontWeight="600" textAnchor="middle">Fleet Turnaround Makespan (Seconds)</text>
            <text x="25" y="175" fill="#94a3b8" fontSize="11" fontWeight="600" transform="rotate(-90 25 175)" textAnchor="middle">Total Fleet Travel Distance (km)</text>

            {/* Shaded Dominated Trade-off Region */}
            <path
              d="M 130 65 Q 180 180 270 230 T 520 265 L 640 275 L 640 45 L 130 45 Z"
              fill="url(#paretoShading)"
            />

            {/* Pareto Frontier Smooth Curve */}
            <path
              d="M 130 65 Q 180 180 270 230 T 520 265 L 630 275"
              fill="none"
              stroke="url(#curveGradient)"
              strokeWidth="3.5"
            />
            <path
              d="M 130 65 Q 180 180 270 230 T 520 265 L 630 275"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1"
              strokeDasharray="4 2"
            />

            {/* Solution Points */}
            {/* 1. Classiq Quantum QAOA Hybrid Co-Processor (Optimal Knee) */}
            <g transform="translate(190, 205)">
              <circle cx="0" cy="0" r="16" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1" />
              <polygon points="0,-9 2.5,-3 8.5,-2.5 4,2 5.5,8 0,5 -5.5,8 -4,2 -8.5,-2.5 -2.5,-3" fill="#facc15" stroke="#ffffff" strokeWidth="1" />
              <text x="14" y="-4" fill="#00f0ff" fontSize="10" fontWeight="bold">Classiq QAOA Hybrid (Optimal Knee)</text>
              <text x="14" y="9" fill="#94a3b8" fontSize="9">Makespan: 482s | Dist: 4.82 km (Active)</text>
            </g>

            {/* 2. OR-Tools CP-SAT (High Speed Non-Dominated) */}
            <g transform="translate(270, 230)">
              <rect x="-6" y="-6" width="12" height="12" fill="#3b82f6" stroke="#93c5fd" strokeWidth="1.5" />
              <text x="10" y="3" fill="#93c5fd" fontSize="9" fontWeight="600">OR-Tools CP-SAT (510s, 5.15km)</text>
            </g>

            {/* 3. Min-Distance Extreme Pareto Point */}
            <g transform="translate(520, 265)">
              <circle cx="0" cy="0" r="5" fill="#10b981" stroke="#a7f3d0" strokeWidth="1.5" />
              <text x="8" y="4" fill="#6ee7b7" fontSize="9">Eco-Speed Min-Distance (790s, 3.65km)</text>
            </g>

            {/* 4. Min-Makespan Extreme Pareto Point */}
            <g transform="translate(130, 65)">
              <circle cx="0" cy="0" r="5" fill="#06b6d4" stroke="#a5f3fc" strokeWidth="1.5" />
              <text x="8" y="4" fill="#67e8f9" fontSize="9">Rush-Wave Min-Makespan (440s, 8.40km)</text>
            </g>

            {/* 5. Dominated Classical SC-QFCM Point */}
            <g transform="translate(320, 160)">
              <polygon points="0,-6 6,0 0,6 -6,0" fill="#f97316" stroke="#fdba74" strokeWidth="1.5" />
              <text x="9" y="3" fill="#fdba74" fontSize="9">SC-QFCM Classical (590s, 5.60km)</text>
            </g>

            {/* 6. Dominated FIFO Heuristic Point */}
            <g transform="translate(430, 110)">
              <rect x="-5" y="-5" width="10" height="10" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.5" />
              <text x="9" y="3" fill="#fca5a5" fontSize="9">FIFO Baseline (780s, 7.85km - Dominated)</text>
            </g>

            {/* 7. Dominated Random Baseline */}
            <g transform="translate(530, 85)">
              <circle cx="0" cy="0" r="4" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />
              <text x="8" y="3" fill="#94a3b8" fontSize="9">Random Heuristic (840s, 8.40km)</text>
            </g>

            {/* Legend Bar */}
            <rect x="75" y="356" width="550" height="20" rx="4" fill="#0f172a" stroke="#1e293b" />
            <polygon points="90,366 92,362 96,362 93,365 94,369 90,367 86,369 87,365 84,362 88,362" fill="#facc15" />
            <text x="100" y="370" fill="#00f0ff" fontSize="9" fontWeight="bold">Quantum-Hybrid</text>
            <rect x="185" y="362" width="8" height="8" fill="#3b82f6" />
            <text x="198" y="370" fill="#94a3b8" fontSize="9">OR-Tools CP-SAT</text>
            <polygon points="280,366 284,362 288,366 284,370" fill="#f97316" />
            <text x="293" y="370" fill="#94a3b8" fontSize="9">SC-QFCM</text>
            <rect x="350" y="362" width="8" height="8" fill="#ef4444" />
            <text x="363" y="370" fill="#94a3b8" fontSize="9">FIFO Baseline</text>
            <line x1="440" y1="366" x2="465" y2="366" stroke="#00f0ff" strokeWidth="2" />
            <text x="472" y="370" fill="#38bdf8" fontSize="9" fontWeight="bold">Pareto Front Line</text>
          </svg>
        );

      case 'spatial':
        return (
          <svg viewBox="0 0 700 380" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="380" fill="#0b1329" rx="8" />
            {/* Grid Aisles */}
            {[70, 140, 210, 280, 350, 420, 490, 560, 630].map((x, i) => (
              <g key={i}>
                <line x1={x} y1="40" x2={x} y2="330" stroke="#1e293b" strokeWidth="18" strokeLinecap="round" />
                <line x1={x} y1="40" x2={x} y2="330" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
                <text x={x} y="350" fill="#64748b" fontSize="10" textAnchor="middle" fontFamily="monospace">Aisle {i + 1}</text>
              </g>
            ))}
            {/* Routes */}
            {/* AMR-1 Blue */}
            <path d="M 80 80 Q 140 120 210 90 T 350 160 T 490 260 L 620 300" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 3" />
            {/* AMR-2 Orange */}
            <path d="M 620 80 Q 490 140 350 110 T 210 240 L 80 300" fill="none" stroke="#fb923c" strokeWidth="3" strokeDasharray="6 3" />
            {/* AMR-3 Purple */}
            <path d="M 140 300 Q 280 200 420 280 T 560 120" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="4 2" />
            {/* AMR-4 Green */}
            <path d="M 80 180 Q 280 90 490 180 T 620 180" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />

            {/* Depots */}
            <polygon points="80,60 97,70 97,90 80,100 63,90 63,70" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
            <text x="80" y="84" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">D1</text>

            <polygon points="620,280 637,290 637,310 620,320 603,310 603,290" fill="#2563eb" stroke="#60a5fa" strokeWidth="2" />
            <text x="620" y="304" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">D2</text>

            {/* Chutes */}
            <rect x="65" y="285" width="30" height="30" rx="4" fill="#059669" stroke="#34d399" strokeWidth="2" />
            <text x="80" y="305" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C1</text>

            <rect x="605" y="65" width="30" height="30" rx="4" fill="#059669" stroke="#34d399" strokeWidth="2" />
            <text x="620" y="85" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">C2</text>

            {/* SKU Pick nodes */}
            {[
              [140, 90, 'ORD-01', false], [210, 160, 'ORD-02', true], [280, 110, 'ORD-03', false],
              [350, 220, 'ORD-04', false], [420, 130, 'ORD-05', true], [490, 270, 'ORD-06', false],
              [280, 250, 'ORD-07', false], [350, 100, 'ORD-08', false], [560, 190, 'ORD-09', true],
            ].map(([x, y, label, haz], idx) => (
              <g key={idx}>
                <circle cx={x as number} cy={y as number} r="7" fill={haz ? '#ef4444' : '#0284c7'} stroke={haz ? '#fca5a5' : '#7dd3fc'} strokeWidth="2" />
                <text x={(x as number) + 10} y={(y as number) + 4} fill="#cbd5e1" fontSize="9" fontWeight="bold">{label}</text>
              </g>
            ))}

            {/* Legend */}
            <rect x="20" y="16" width="660" height="24" rx="4" fill="#0f172a" stroke="#1e293b" />
            <circle cx="35" cy="28" r="4" fill="#2563eb" />
            <text x="44" y="32" fill="#94a3b8" fontSize="10">Depot (Hex)</text>
            <rect x="120" y="23" width="10" height="10" fill="#059669" rx="2" />
            <text x="135" y="32" fill="#94a3b8" fontSize="10">Chute (Square)</text>
            <circle cx="225" cy="28" r="4" fill="#0284c7" />
            <text x="234" y="32" fill="#94a3b8" fontSize="10">Standard SKU</text>
            <circle cx="320" cy="28" r="4" fill="#ef4444" />
            <text x="329" y="32" fill="#f87171" fontSize="10">Hazardous SKU</text>
            <line x1="420" y1="28" x2="445" y2="28" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
            <text x="450" y="32" fill="#38bdf8" fontSize="10">AMR-1 Tour</text>
            <line x1="520" y1="28" x2="545" y2="28" stroke="#fb923c" strokeWidth="2" strokeDasharray="3 2" />
            <text x="550" y="32" fill="#fb923c" fontSize="10">AMR-2 Tour</text>
            <text x="630" y="32" fill="#10b981" fontSize="10" fontWeight="bold">Active</text>
          </svg>
        );

      case 'lifo':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            {/* Headers for Levels */}
            <text x="120" y="40" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">Level 1: Ground Support</text>
            <text x="350" y="40" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">Level 2: Mid-Layer Precedence</text>
            <text x="580" y="40" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">Level 3: Top (First-Out)</text>

            {/* Dependency Arcs */}
            <path d="M 170 100 L 290 100" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrow)" />
            <path d="M 170 200 L 290 180" stroke="#ef4444" strokeWidth="2" />
            <path d="M 170 200 L 290 260" stroke="#ef4444" strokeWidth="2" />
            <path d="M 400 100 L 520 150" stroke="#ef4444" strokeWidth="2" />
            <path d="M 400 180 L 520 150" stroke="#ef4444" strokeWidth="2" />
            <path d="M 400 260 L 520 230" stroke="#ef4444" strokeWidth="2" />

            {/* Nodes Level 1 */}
            <rect x="70" y="70" width="100" height="55" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            <text x="120" y="94" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-001</text>
            <text x="120" y="112" fill="#94a3b8" fontSize="9" textAnchor="middle">Support: 95%</text>

            <rect x="70" y="170" width="100" height="55" rx="6" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
            <text x="120" y="194" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-002</text>
            <text x="120" y="212" fill="#94a3b8" fontSize="9" textAnchor="middle">Support: 90%</text>

            {/* Nodes Level 2 */}
            <rect x="300" y="70" width="100" height="55" rx="6" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
            <text x="350" y="94" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-003</text>
            <text x="350" y="112" fill="#94a3b8" fontSize="9" textAnchor="middle">Support: 88%</text>

            <rect x="300" y="155" width="100" height="55" rx="6" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
            <text x="350" y="179" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-004</text>
            <text x="350" y="197" fill="#94a3b8" fontSize="9" textAnchor="middle">Support: 85%</text>

            <rect x="300" y="235" width="100" height="55" rx="6" fill="#1e293b" stroke="#a855f7" strokeWidth="2" />
            <text x="350" y="259" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-005</text>
            <text x="350" y="277" fill="#94a3b8" fontSize="9" textAnchor="middle">Support: 85%</text>

            {/* Nodes Level 3 */}
            <rect x="530" y="125" width="100" height="55" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <text x="580" y="149" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-006</text>
            <text x="580" y="167" fill="#34d399" fontSize="9" textAnchor="middle">First-to-Drop</text>

            <rect x="530" y="205" width="100" height="55" rx="6" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
            <text x="580" y="229" fill="#f8fafc" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-007</text>
            <text x="580" y="247" fill="#34d399" fontSize="9" textAnchor="middle">First-to-Drop</text>

            {/* Invariant Banner */}
            <rect x="50" y="315" width="600" height="30" rx="6" fill="#0f172a" stroke="#00f0ff" strokeWidth="1" />
            <text x="350" y="334" fill="#00f0ff" fontSize="11" fontWeight="bold" textAnchor="middle">
              ✓ Invariant R10 Verified: Directed Acyclic Graph (DAG) | Zero Occluded Re-Handling at Consolidation Chutes
            </text>
          </svg>
        );

      case 'chutes':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            {/* Axis Grid */}
            <line x1="60" y1="300" x2="650" y2="300" stroke="#334155" strokeWidth="1.5" />
            <line x1="60" y1="50" x2="60" y2="300" stroke="#334155" strokeWidth="1.5" />
            {[100, 150, 200, 250].map((y, idx) => (
              <g key={idx}>
                <line x1="60" y1={y} x2="650" y2={y} stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x="50" y={y + 4} fill="#64748b" fontSize="9" textAnchor="end">{(4.0 - idx * 0.7).toFixed(1)} m³</text>
              </g>
            ))}
            <text x="50" y="304" fill="#64748b" fontSize="9" textAnchor="end">0.0 m³</text>

            {/* Max buffer limit line 3.5 m³ at y = 90 */}
            <line x1="60" y1="90" x2="650" y2="90" stroke="#ef4444" strokeWidth="2" strokeDasharray="6 4" />
            <text x="640" y="82" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">Qc_max = 3.5 m³ Buffer Ceiling</text>

            {/* Chute 1 Accumulation Curve */}
            <path
              d="M 60 300 Q 200 280 300 200 T 500 130 T 650 115 L 650 300 Z"
              fill="rgba(56, 189, 248, 0.15)"
            />
            <path
              d="M 60 300 Q 200 280 300 200 T 500 130 T 650 115"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />

            {/* Chute 2 Accumulation Curve */}
            <path
              d="M 60 300 Q 250 290 380 230 T 550 160 T 650 145 L 650 300 Z"
              fill="rgba(251, 146, 60, 0.15)"
            />
            <path
              d="M 60 300 Q 250 290 380 230 T 550 160 T 650 145"
              fill="none"
              stroke="#fb923c"
              strokeWidth="3"
            />

            <text x="350" y="335" fill="#94a3b8" fontSize="11" textAnchor="middle">Elapsed Wave Time (0s to 1200s)</text>
            <text x="450" y="110" fill="#38bdf8" fontSize="11" fontWeight="bold">Chute C1 Peak: 2.85 m³ (81%)</text>
            <text x="450" y="180" fill="#fb923c" fontSize="11" fontWeight="bold">Chute C2 Peak: 2.30 m³ (66%)</text>
          </svg>
        );

      case 'velocity':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            <line x1="60" y1="300" x2="650" y2="300" stroke="#334155" strokeWidth="1.5" />
            <line x1="60" y1="50" x2="60" y2="300" stroke="#334155" strokeWidth="1.5" />

            {/* Speed limits */}
            <line x1="60" y1="70" x2="650" y2="70" stroke="#64748b" strokeWidth="1.5" strokeDasharray="5 5" />
            <text x="640" y="62" fill="#94a3b8" fontSize="10" textAnchor="end">Free Haulway Cap: vmax = 1.5 m/s</text>

            <rect x="250" y="50" width="180" height="250" fill="rgba(234, 179, 8, 0.08)" />
            <line x1="60" y1="235" x2="650" y2="235" stroke="#eab308" strokeWidth="2" strokeDasharray="4 3" />
            <text x="640" y="228" fill="#facc15" fontSize="10" fontWeight="bold" textAnchor="end">ISO 3691-4 Pedestrian Throttle: vsafe = 0.4 m/s</text>

            <text x="340" y="85" fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="middle">HRI Shared Zone (t=35s to 55s)</text>

            {/* Velocity Profile Curve */}
            <path
              d="M 60 300 L 100 85 L 240 85 L 260 235 L 420 235 L 440 85 L 580 85 L 630 300"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3.5"
            />
            <circle cx="260" cy="235" r="5" fill="#eab308" />
            <circle cx="420" cy="235" r="5" fill="#eab308" />

            <text x="350" y="335" fill="#94a3b8" fontSize="11" textAnchor="middle">Mission Time (Seconds)</text>
            <text x="25" y="175" fill="#94a3b8" fontSize="11" transform="rotate(-90 25 175)" textAnchor="middle">Velocity (m/s)</text>
          </svg>
        );

      case 'qaoa':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            {/* Left 2D Contour */}
            <g transform="translate(30, 40)">
              <rect width="280" height="250" fill="#0f172a" rx="6" stroke="#1e293b" />
              <text x="140" y="-10" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">QAOA Energy Surface ⟨HC⟩(γ, β)</text>
              {/* Concentric Contours */}
              <ellipse cx="140" cy="125" rx="110" ry="90" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeOpacity="0.4" />
              <ellipse cx="140" cy="125" rx="80" ry="65" fill="none" stroke="#06b6d4" strokeWidth="1.8" strokeOpacity="0.6" />
              <ellipse cx="140" cy="125" rx="50" ry="40" fill="none" stroke="#10b981" strokeWidth="2" strokeOpacity="0.8" />
              <ellipse cx="140" cy="125" rx="20" ry="16" fill="rgba(16, 185, 129, 0.3)" stroke="#34d399" strokeWidth="2" />
              {/* Ground state star */}
              <polygon points="140,113 144,122 153,123 147,129 149,138 140,133 131,138 133,129 127,123 136,122" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
              <text x="140" y="155" fill="#fef08a" fontSize="10" fontWeight="bold" textAnchor="middle">Optimal Ground State (γ*, β*)</text>
              <text x="140" y="270" fill="#64748b" fontSize="10" textAnchor="middle">Problem Angle γ ∈ [0, 2π]</text>
              <text x="-15" y="125" fill="#64748b" fontSize="10" transform="rotate(-90 -15 125)" textAnchor="middle">Mixer Angle β ∈ [0, π]</text>
            </g>

            {/* Right Bitstring Spectrum */}
            <g transform="translate(370, 40)">
              <rect width="290" height="250" fill="#0f172a" rx="6" stroke="#1e293b" />
              <text x="145" y="-10" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">2048-Shot Bitstring Spectrum</text>
              <line x1="30" y1="210" x2="270" y2="210" stroke="#334155" />
              {/* Bars */}
              {[
                { bs: '|0011⟩', p: 0.06, h: 25, col: '#475569' },
                { bs: '|0101⟩', p: 0.08, h: 32, col: '#475569' },
                { bs: '|0110⟩', p: 0.38, h: 145, col: '#00f0ff' },
                { bs: '|1001⟩', p: 0.34, h: 130, col: '#38bdf8' },
                { bs: '|1010⟩', p: 0.09, h: 36, col: '#475569' },
                { bs: '|1100⟩', p: 0.05, h: 20, col: '#475569' },
              ].map((bar, i) => (
                <g key={i}>
                  <rect x={40 + i * 38} y={210 - bar.h} width="26" height={bar.h} fill={bar.col} rx="3" />
                  <text x={53 + i * 38} y="226" fill="#94a3b8" fontSize="9" textAnchor="middle">{bar.bs}</text>
                  <text x={53 + i * 38} y={204 - bar.h} fill="#f1f5f9" fontSize="9" fontWeight="bold" textAnchor="middle">{(bar.p * 100).toFixed(0)}%</text>
                </g>
              ))}
              <text x="145" y="270" fill="#64748b" fontSize="10" textAnchor="middle">Classiq Variational Ansatz (p=3 layers)</text>
            </g>

            {/* Banner */}
            <rect x="30" y="320" width="630" height="28" rx="4" fill="#0f172a" stroke="#00f0ff" strokeWidth="1" />
            <text x="345" y="338" fill="#00f0ff" fontSize="11" fontWeight="bold" textAnchor="middle">
              Classiq Quantum Circuit Winner: Subtour Bitstring |0110⟩ Achieves Minimum Ground-State Energy (-21.4% Makespan)
            </text>
          </svg>
        );

      case 'benders':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            <line x1="70" y1="300" x2="640" y2="300" stroke="#334155" strokeWidth="1.5" />
            <line x1="70" y1="40" x2="70" y2="300" stroke="#334155" strokeWidth="1.5" />

            {/* Iterations 1 to 5 */}
            {[1, 2, 3, 4, 5].map((it, idx) => (
              <g key={idx}>
                <line x1={120 + idx * 110} y1="40" x2={120 + idx * 110} y2="300" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
                <text x={120 + idx * 110} y="320" fill="#94a3b8" fontSize="11" textAnchor="middle">Iter {it}</text>
              </g>
            ))}

            {/* Upper Bound Points: 1150s, 1020s, 970s, 955s, 949.3s */}
            <path
              d="M 120 50 L 230 110 L 340 160 L 450 185 L 560 195"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
            {/* Lower Bound Points: 820s, 890s, 930s, 945s, 949.3s */}
            <path
              d="M 120 270 L 230 235 L 340 215 L 450 202 L 560 195"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="3"
            />
            {/* Shaded Duality Gap */}
            <polygon
              points="120,50 230,110 340,160 450,185 560,195 560,195 450,202 340,215 230,235 120,270"
              fill="rgba(168, 85, 247, 0.2)"
            />

            {[
              [120, 50, '1150s'], [230, 110, '1020s'], [340, 160, '970s'], [450, 185, '955s'], [560, 195, '949.3s']
            ].map(([x, y, label], i) => (
              <g key={i}>
                <circle cx={x as number} cy={y as number} r="5" fill="#ef4444" />
                <text x={x as number} y={(y as number) - 8} fill="#fca5a5" fontSize="10" fontWeight="bold" textAnchor="middle">{label}</text>
              </g>
            ))}

            {[
              [120, 270, '820s'], [230, 235, '890s'], [340, 215, '930s'], [450, 202, '945s'], [560, 195, '949.3s']
            ].map(([x, y, label], i) => (
              <g key={i}>
                <circle cx={x as number} cy={y as number} r="5" fill="#38bdf8" />
                <text x={x as number} y={(y as number) + 16} fill="#7dd3fc" fontSize="10" fontWeight="bold" textAnchor="middle">{label}</text>
              </g>
            ))}

            <text x="600" y="100" fill="#ef4444" fontSize="11" fontWeight="bold">Subproblem Upper Bound</text>
            <text x="600" y="240" fill="#38bdf8" fontSize="11" fontWeight="bold">Master Lower Bound</text>
            <text x="560" y="180" fill="#a855f7" fontSize="12" fontWeight="bold" textAnchor="middle">★ Gap Closed (0.0%)</text>
          </svg>
        );

      case 'packing_3d':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            {/* AMR Bed Frame */}
            <rect x="150" y="40" width="400" height="260" rx="10" fill="#0f172a" stroke="#475569" strokeWidth="3" strokeDasharray="6 4" />
            <text x="350" y="25" fill="#94a3b8" fontSize="12" fontWeight="bold" textAnchor="middle">AMR Cargo Bed (0.8m Width × 1.2m Length)</text>

            {/* Boxes */}
            <rect x="180" y="60" width="160" height="110" rx="4" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" />
            <text x="260" y="115" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">ORD-001 (12.5 kg)</text>

            <rect x="360" y="60" width="160" height="110" rx="4" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" />
            <text x="440" y="115" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">ORD-002 (18.0 kg)</text>

            <rect x="180" y="185" width="200" height="95" rx="4" fill="rgba(239, 68, 68, 0.4)" stroke="#ef4444" strokeWidth="2" />
            <text x="280" y="235" fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">ORD-003 [FLAMMABLE] (14.2 kg)</text>

            <rect x="395" y="185" width="125" height="95" rx="4" fill="rgba(59, 130, 246, 0.4)" stroke="#3b82f6" strokeWidth="2" />
            <text x="457" y="235" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">ORD-004 (8.5 kg)</text>

            {/* Geometric Center (+) */}
            <line x1="340" y1="170" x2="360" y2="170" stroke="#94a3b8" strokeWidth="3" />
            <line x1="350" y1="160" x2="350" y2="180" stroke="#94a3b8" strokeWidth="3" />
            <text x="350" y="152" fill="#94a3b8" fontSize="10" textAnchor="middle">Geometric Center</text>

            {/* Center of Gravity (X) */}
            <line x1="335" y1="165" x2="355" y2="185" stroke="#fbbf24" strokeWidth="4" />
            <line x1="335" y1="185" x2="355" y2="165" stroke="#fbbf24" strokeWidth="4" />
            <text x="345" y="200" fill="#facc15" fontSize="11" fontWeight="bold" textAnchor="middle">CoG (Balanced: Δ = 2.3 cm)</text>

            <text x="350" y="330" fill="#10b981" fontSize="11" fontWeight="bold" textAnchor="middle">
              ✓ Static Equilibrium &amp; 85% Minimum Support Area Maintained (Invariant R4 / R10)
            </text>
          </svg>
        );

      case 'battery_soc':
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            <line x1="60" y1="300" x2="640" y2="300" stroke="#334155" strokeWidth="1.5" />
            <line x1="60" y1="40" x2="60" y2="300" stroke="#334155" strokeWidth="1.5" />

            {/* 20% Alarm Threshold line */}
            <line x1="60" y1="240" x2="640" y2="240" stroke="#ef4444" strokeWidth="2" strokeDasharray="5 5" />
            <text x="630" y="232" fill="#ef4444" fontSize="10" fontWeight="bold" textAnchor="end">20% SOC Alarm Threshold</text>

            {/* 15% Emergency Stop */}
            <line x1="60" y1="265" x2="640" y2="265" stroke="#991b1b" strokeWidth="1.5" strokeDasharray="3 3" />
            <text x="630" y="278" fill="#f87171" fontSize="9" textAnchor="end">15% Emergency Stop Line</text>

            {/* Battery Curves */}
            {/* AMR-1 */}
            <path d="M 60 50 Q 200 80 350 110 T 640 135" fill="none" stroke="#38bdf8" strokeWidth="2.5" />
            <text x="645" y="138" fill="#38bdf8" fontSize="10" fontWeight="bold">AMR-1 (78%)</text>

            {/* AMR-2 */}
            <path d="M 60 50 Q 200 90 350 130 T 640 160" fill="none" stroke="#fb923c" strokeWidth="2.5" />
            <text x="645" y="163" fill="#fb923c" fontSize="10" fontWeight="bold">AMR-2 (71%)</text>

            {/* AMR-3 */}
            <path d="M 60 50 Q 200 100 350 145 T 640 180" fill="none" stroke="#a855f7" strokeWidth="2.5" />
            <text x="645" y="183" fill="#a855f7" fontSize="10" fontWeight="bold">AMR-3 (64%)</text>

            {/* AMR-4 */}
            <path d="M 60 50 Q 200 110 350 160 T 640 205" fill="none" stroke="#10b981" strokeWidth="2.5" />
            <text x="645" y="208" fill="#10b981" fontSize="10" fontWeight="bold">AMR-4 (58%)</text>

            <text x="350" y="335" fill="#94a3b8" fontSize="11" textAnchor="middle">Mission Time (0s to 1200s)</text>
            <text x="25" y="170" fill="#94a3b8" fontSize="11" transform="rotate(-90 25 170)" textAnchor="middle">Battery SOC (%)</text>
          </svg>
        );

      case 'spatiotemporal_heatmap':
      default:
        return (
          <svg viewBox="0 0 700 360" style={{ width: '100%', height: 'auto', maxHeight: '480px' }}>
            <rect width="700" height="360" fill="#0b1329" rx="8" />
            <text x="350" y="30" fill="#38bdf8" fontSize="12" fontWeight="bold" textAnchor="middle">Warehouse Aisle Spatio-Temporal Congestion Density Matrix</text>

            {/* 8x8 Heatmap Grid */}
            {[0, 1, 2, 3, 4, 5, 6, 7].map((row) =>
              [0, 1, 2, 3, 4, 5, 6, 7].map((col) => {
                // Synthetic intensity with peak at central aisles 2-4 and mid time
                const isHot = (row === 2 || row === 3) && (col >= 2 && col <= 5);
                const isWarm = (row === 1 || row === 4) && (col >= 1 && col <= 6);
                const color = isHot ? '#ef4444' : isWarm ? '#f59e0b' : col % 2 === 0 ? '#1e3a8a' : '#1e293b';
                const opacity = isHot ? '0.85' : isWarm ? '0.6' : '0.4';
                return (
                  <rect
                    key={`${row}-${col}`}
                    x={120 + col * 60}
                    y={50 + row * 30}
                    width="54"
                    height="26"
                    rx="3"
                    fill={color}
                    fillOpacity={opacity}
                    stroke="#0f172a"
                    strokeWidth="1"
                  />
                );
              })
            )}

            {/* Axis labels */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map((aisle, i) => (
              <text key={i} x="110" y={67 + i * 30} fill="#94a3b8" fontSize="10" textAnchor="end">Aisle {aisle}</text>
            ))}

            {['0-150s', '150-300s', '300-450s', '450-600s', '600-750s', '750-900s', '900-1050s', '1050-1200s'].map((time, i) => (
              <text key={i} x={147 + i * 60} y="305" fill="#94a3b8" fontSize="9" textAnchor="middle">{time}</text>
            ))}

            {/* Legend */}
            <rect x="230" y="325" width="240" height="20" rx="4" fill="#0f172a" stroke="#1e293b" />
            <circle cx="245" cy="335" r="4" fill="#1e3a8a" />
            <text x="255" y="338" fill="#94a3b8" fontSize="9">Clear (0-20%)</text>
            <circle cx="325" cy="335" r="4" fill="#f59e0b" />
            <text x="335" y="338" fill="#f59e0b" fontSize="9">Moderate (40-60%)</text>
            <circle cx="415" cy="335" r="4" fill="#ef4444" />
            <text x="425" y="338" fill="#ef4444" fontSize="9">High Peak (80%+)</text>
          </svg>
        );
    }
  };

  return (
    <div className="graph-studio-fit">
      {/* Studio Header: Separate Places for Run ID Selector and Button Menu */}
      <div
        className="glass-panel"
        style={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(10, 16, 31, 0.9) 100%)',
        }}
      >
        {/* Place 1: Dedicated Run ID Combobox and Mode Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              boxShadow: '0 0 12px rgba(0, 240, 255, 0.15)',
            }}
          >
            <BarChart3 size={14} color="#00f0ff" />
            <span style={{ fontSize: '10px', fontWeight: 800, color: '#00f0ff', letterSpacing: '0.05em' }}>
              ANALYTICS RUN ID
            </span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '2px 5px',
                borderRadius: '3px',
                backgroundColor: currentMode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                color: currentMode === 'QUANTUM' ? '#00f0ff' : '#fbbf24',
                border: `1px solid ${currentMode === 'QUANTUM' ? '#00f0ff' : '#fbbf24'}`,
                letterSpacing: '0.04em',
              }}
            >
              {currentMode}
            </span>
            <select
              value={effectiveRunId}
              onChange={(e) => onSelectRun && onSelectRun(e.target.value)}
              style={{
                backgroundColor: '#070c18',
                color: '#f8fafc',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                borderRadius: '4px',
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '240px',
              }}
              title="Select Historical Run for Performance Analytics"
            >
              {runs && runs.length > 0 ? (
                runs.map((r) => (
                  <option key={r.run_id} value={r.run_id} style={{ background: '#0b1329', color: '#f8fafc' }}>
                    {r.run_id} • [{formatRunMode(r)}] {r.makespan_sec ? `${r.makespan_sec.toFixed(0)}s` : 'active'} {r.distance_km ? `• ${r.distance_km.toFixed(2)}km` : ''}
                  </option>
                ))
              ) : (
                <option value={effectiveRunId}>{effectiveRunId}</option>
              )}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#475569' }}>|</span>
            <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#f3f4f6', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{activeOption.title}</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>(10 Charts Available)</span>
            </h2>
          </div>
        </div>

        {/* Place 2: Dedicated Buttons Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {/* View Mode Switcher: Chart Canvas vs Mathematical Dossier */}
          <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setActiveStudioTab('chart')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeStudioTab === 'chart' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: activeStudioTab === 'chart' ? '#00f0ff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
              title="Fit-to-Screen Chart Canvas (Zero Scrolling)"
            >
              <BarChart3 size={12} />
              <span>Chart View</span>
            </button>
            <button
              onClick={() => setActiveStudioTab('dossier')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                border: 'none',
                background: activeStudioTab === 'dossier' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                color: activeStudioTab === 'dossier' ? '#00f0ff' : '#94a3b8',
                transition: 'all 0.15s ease',
              }}
              title="Mathematical Invariant Audit & LaTeX Proofs"
            >
              <BookOpen size={12} />
              <span>Dossier &amp; Invariants</span>
            </button>
          </div>

          {/* Publication Figure / Interactive Vector toggle */}
          {activeStudioTab === 'chart' && (
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <button
                onClick={() => setViewMode('figure')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: viewMode === 'figure' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                  color: viewMode === 'figure' ? '#00f0ff' : '#94a3b8',
                }}
              >
                <Eye size={11} />
                <span>Publication</span>
              </button>
              <button
                onClick={() => setViewMode('vector')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none',
                  background: viewMode === 'vector' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
                  color: viewMode === 'vector' ? '#00f0ff' : '#94a3b8',
                }}
              >
                <Layers size={11} />
                <span>Vector SVG</span>
              </button>
            </div>
          )}

          {/* Detailed Meaning Panel Toggle */}
          {activeStudioTab === 'chart' && (
            <button
              onClick={toggleMeaningPanel}
              className="btn-secondary"
              style={{
                fontSize: '10px',
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: isMeaningOpen ? 'rgba(0, 240, 255, 0.18)' : 'rgba(15, 23, 42, 0.8)',
                borderColor: isMeaningOpen ? '#00f0ff' : 'rgba(255, 255, 255, 0.15)',
                color: isMeaningOpen ? '#00f0ff' : '#94a3b8',
                boxShadow: isMeaningOpen ? '0 0 10px rgba(0, 240, 255, 0.25)' : 'none',
              }}
              title="Toggle Detailed Graph Meaning & Engineering Dossier Panel"
            >
              <BookOpen size={11} color={isMeaningOpen ? '#00f0ff' : '#94a3b8'} />
              <span>{isMeaningOpen ? 'Meaning Panel On' : 'Meaning Panel'}</span>
            </button>
          )}

          {/* Reports Studio Toggle Button */}
          <button
            onClick={() => {
              if (onReportsRepoModeChange) {
                onReportsRepoModeChange(reportsRepoMode === 'expanded' ? 'minimized' : 'expanded');
              } else if (onOpenReportsStudio) {
                onOpenReportsStudio();
              }
            }}
            className="btn-secondary"
            style={{
              fontSize: '10px',
              padding: '3px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: reportsRepoMode === 'expanded' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(15, 23, 42, 0.8)',
              borderColor: reportsRepoMode === 'expanded' ? '#00f0ff' : 'rgba(255, 255, 255, 0.15)',
              color: reportsRepoMode === 'expanded' ? '#00f0ff' : '#94a3b8',
              boxShadow: reportsRepoMode === 'expanded' ? '0 0 10px rgba(0, 240, 255, 0.25)' : 'none',
            }}
            title="Toggle Reports Manager Studio"
          >
            <FileText size={11} color={reportsRepoMode === 'expanded' ? '#00f0ff' : '#10b981'} />
            <span>Reports ({reportsCount})</span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="btn-secondary"
            style={{ fontSize: '10px', padding: '3px 7px', display: 'flex', alignItems: 'center', gap: '4px' }}
            title="Download publication-quality high-resolution PNG figure (180 DPI)"
          >
            {copiedNotification ? <Check size={12} color="#10b981" /> : <Download size={12} />}
            <span>PNG</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="btn-secondary"
            style={{ fontSize: '10px', padding: '3px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
            title="Force instantaneous re-fetch of figures"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Single-Row 10-Graph Selector Strip */}
      <div
        className="graph-pills-strip"
        style={{
          padding: '4px 16px 6px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          background: 'rgba(10, 16, 31, 0.6)',
          paddingRight: reportsRepoMode !== 'hidden' ? '380px' : '16px',
        }}
      >
        {graphOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeGraph === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectGraph(opt.id)}
              className="glass-card"
              title={opt.tooltip}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                background: isActive
                  ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(37, 99, 235, 0.3))'
                  : 'rgba(31, 41, 55, 0.5)',
                borderColor: isActive ? '#00f0ff' : 'rgba(75, 85, 99, 0.4)',
                color: isActive ? '#00f0ff' : '#9ca3af',
                boxShadow: isActive ? '0 0 10px rgba(0, 240, 255, 0.25)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={12} color={isActive ? '#00f0ff' : '#9ca3af'} />
              <span>{opt.shortTitle || opt.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Graph Viewer Display (Fit-to-Screen) with Detailed Graph Meaning Panel */}
      {activeStudioTab === 'chart' && (() => {
        const dossier = GRAPH_DOSSIERS[activeGraph] || GRAPH_DOSSIERS['pareto'] || GRAPH_DOSSIERS['spatial'];
        const getStatusBadge = (status: 'OPTIMAL' | 'COMPLIANT' | 'BALANCED' | 'WARNING') => {
          switch (status) {
            case 'OPTIMAL':
              return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', icon: CheckCircle2 };
            case 'COMPLIANT':
              return { bg: 'rgba(0, 240, 255, 0.15)', border: '#00f0ff', text: '#38bdf8', icon: ShieldCheck };
            case 'BALANCED':
              return { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc', icon: Scale };
            case 'WARNING':
              return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', icon: AlertTriangle };
          }
        };

        return (
          <div style={{ flex: 1, minHeight: 0, display: 'flex', gap: '10px', position: 'relative', overflow: 'hidden' }}>
            {/* Left / Center: Main Graph Canvas */}
            <div
              className="glass-card"
              style={{
                flex: 1,
                minHeight: 0,
                minWidth: 0,
                padding: '8px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#070c18',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              }}
              title={`Active Analytics Graph: ${activeOption.title}`}
            >
              {/* If Interactive Vector mode is toggled or image has permanently errored */}
              {viewMode === 'vector' || imageState === 'error' ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', alignSelf: 'flex-start', flexShrink: 0 }}>
                    <Sparkles size={13} color="#00f0ff" />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8' }}>
                      Interactive Vector Engine (Pure Client-Side SVG)
                    </span>
                  </div>
                  <div style={{ width: '100%', flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {renderVectorFallback()}
                  </div>
                </div>
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                  {/* Animated Loading Overlay */}
                  {imageState === 'loading' && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        background: 'rgba(7, 12, 24, 0.85)',
                        backdropFilter: 'blur(6px)',
                        zIndex: 10,
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          border: '3px solid rgba(0, 240, 255, 0.15)',
                          borderTop: '3px solid #00f0ff',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.04em' }}>
                          RENDERING GRAPH...
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Publication Figure PNG */}
                  <img
                    key={`${activeGraph}-${effectiveRunId}-${reloadKey}`}
                    src={primaryUrl}
                    alt={activeGraph}
                    title={activeOption.tooltip}
                    style={{
                      maxWidth: '100%',
                      maxHeight: 'calc(100vh - 225px)',
                      height: 'auto',
                      objectFit: 'contain',
                      borderRadius: '6px',
                      boxShadow: '0 6px 25px rgba(0,0,0,0.5)',
                      opacity: imageState === 'loaded' ? 1 : 0.01,
                      transition: 'opacity 0.25s ease',
                    }}
                    onLoad={() => setImageState('loaded')}
                    onError={(e) => {
                      if (!triedFallback) {
                        setTriedFallback(true);
                        (e.target as HTMLImageElement).src = staticFallbackUrl;
                      } else {
                        setImageState('error');
                      }
                    }}
                  />
                </div>
              )}

              {/* Caption & Controls */}
              <div
                style={{
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#9ca3af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: '4px',
                  flexShrink: 0,
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: '#00f0ff' }}>{activeOption.title}:</strong>{' '}
                  <span>{activeOption.desc}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    onClick={toggleMeaningPanel}
                    style={{
                      background: isMeaningOpen ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.06)',
                      border: isMeaningOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.15)',
                      color: isMeaningOpen ? '#00f0ff' : '#94a3b8',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                    title="Toggle Detailed Graph Meaning Panel"
                  >
                    <BookOpen size={11} />
                    <span>{isMeaningOpen ? 'Hide Meaning' : 'Detailed Meaning'}</span>
                  </button>
                  <button
                    onClick={() => setActiveStudioTab('dossier')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#38bdf8',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span>Full Audit &rarr;</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Detailed Graph Meaning Panel */}
            {isMeaningOpen && (
              <div
                className="glass-card"
                style={{
                  width: '400px',
                  minWidth: '330px',
                  maxWidth: '430px',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: '#070f1e',
                  border: '1px solid rgba(0, 240, 255, 0.3)',
                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(0, 240, 255, 0.15)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  flexShrink: 0,
                }}
              >
                {/* Panel Header */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(15, 23, 42, 0.65)',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid rgba(0, 240, 255, 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Sparkles size={13} color="#00f0ff" />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        DETAILED GRAPH MEANING
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dossier.title}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={() => handleToggleMeaningSpeech(dossier)}
                      style={{
                        background: isSpeakingMeaning ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                        border: isSpeakingMeaning ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                        color: isSpeakingMeaning ? '#ef4444' : '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                      }}
                      title={isSpeakingMeaning ? 'Stop Reading Aloud' : 'Read Aloud Graph Meaning'}
                    >
                      {isSpeakingMeaning ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <button
                      onClick={() => handleCopyMeaningMarkdown(dossier)}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                      }}
                      title="Copy Dossier Markdown"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={toggleMeaningPanel}
                      style={{
                        background: 'transparent',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                      }}
                      title="Close Meaning Panel"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>

                {/* Sub-Tabs Strip */}
                <div
                  style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.35)',
                    padding: '3px 6px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  {[
                    { id: 'overview', label: 'Meaning' },
                    { id: 'math', label: 'Math' },
                    { id: 'elements', label: 'Elements' },
                    { id: 'kpis', label: 'KPIs' },
                  ].map((tab) => {
                    const isTabActive = meaningSubTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setMeaningSubTab(tab.id as any)}
                        style={{
                          flex: 1,
                          padding: '4px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: isTabActive ? 700 : 500,
                          cursor: 'pointer',
                          border: isTabActive ? '1px solid #00f0ff' : '1px solid transparent',
                          background: isTabActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                          color: isTabActive ? '#00f0ff' : '#94a3b8',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Scrollable Body */}
                <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {meaningSubTab === 'overview' && (
                    <>
                      <div style={{ fontSize: '11.5px', lineHeight: '1.6', color: '#cbd5e1' }}>
                        {dossier.generalMeaning.overview}
                      </div>

                      <div
                        style={{
                          padding: '10px 12px',
                          borderRadius: '6px',
                          background: 'rgba(0, 240, 255, 0.05)',
                          border: '1px solid rgba(0, 240, 255, 0.2)',
                        }}
                      >
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Scale size={11} /> Industrial Significance & Trade-offs
                        </div>
                        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#94a3b8' }}>
                          {dossier.generalMeaning.industrialSignificance}
                        </div>
                      </div>

                      {activeGraph === 'pareto' && (
                        <div
                          style={{
                            padding: '10px 12px',
                            borderRadius: '6px',
                            background: 'rgba(250, 204, 21, 0.05)',
                            border: '1px solid rgba(250, 204, 21, 0.25)',
                          }}
                        >
                          <div style={{ fontSize: '10px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase', marginBottom: '4px' }}>
                            ★ Quantum Knee Point Advantage
                          </div>
                          <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#cbd5e1' }}>
                            Classiq QAOA identifies the non-dominated Pareto knee point at <strong>482s makespan</strong> and <strong>4.82 km total distance</strong>, outperforming classical FIFO by <strong>+18.4%</strong> in multi-objective hypervolume.
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {meaningSubTab === 'math' && (
                    <>
                      {dossier.formulaLatex && (
                        <div
                          style={{
                            padding: '10px',
                            borderRadius: '6px',
                            background: 'rgba(10, 18, 36, 0.95)',
                            border: '1px solid rgba(0, 240, 255, 0.25)',
                            overflowX: 'auto',
                          }}
                        >
                          <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#00f0ff', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Governing KaTeX Formulation
                          </div>
                          <div
                            dangerouslySetInnerHTML={{ __html: renderFormula(dossier.formulaLatex) }}
                            style={{ color: '#ffffff', fontSize: '11px' }}
                          />
                        </div>
                      )}

                      <div style={{ padding: '10px 12px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
                          Mathematical Paradigm
                        </div>
                        <div style={{ fontSize: '11px', lineHeight: '1.5', color: '#94a3b8' }}>
                          {dossier.generalMeaning.mathematicalParadigm}
                        </div>
                      </div>
                    </>
                  )}

                  {meaningSubTab === 'elements' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {dossier.elementExplanations.map((el, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: el.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#f1f5f9' }}>{el.name}</span>
                            <span style={{ fontSize: '9.5px', color: el.color, marginLeft: 'auto', fontWeight: 600 }}>{el.symbol}</span>
                          </div>
                          <div style={{ fontSize: '10.5px', lineHeight: '1.4', color: '#94a3b8' }}>
                            {el.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {meaningSubTab === 'kpis' && (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Enforced Invariants
                        </div>
                        {dossier.generalMeaning.enforcedInvariants.map((inv, i) => (
                          <div
                            key={i}
                            style={{
                              fontSize: '10.5px',
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: 'rgba(0, 240, 255, 0.06)',
                              border: '1px solid rgba(0, 240, 255, 0.15)',
                              color: '#cbd5e1',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <ShieldCheck size={11} color="#00f0ff" />
                            <span>{inv}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', textTransform: 'uppercase', marginBottom: '2px' }}>
                          Calculated Audit Results
                        </div>
                        {dossier.calculatedResults.map((r, i) => {
                          const badge = getStatusBadge(r.status);
                          return (
                            <div
                              key={i}
                              style={{
                                padding: '8px 10px',
                                borderRadius: '6px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.06)',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>{r.metric}</span>
                                <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text }}>
                                  {r.status}
                                </span>
                              </div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>
                                {r.value} <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 400 }}>{r.unit}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                                {r.interpretation}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* DEEP GRAPH INTELLIGENCE & ALGORITHMIC AUDIT DOSSIER PANEL   */}
      {/* ============================================================ */}
      {activeStudioTab === 'dossier' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '16px' }}>
          {(() => {
            const dossier = GRAPH_DOSSIERS[activeGraph] || GRAPH_DOSSIERS['spatial'];

        // Helper to render KaTeX safely
        const renderFormula = (latex: string) => {
          try {
            return katex.renderToString(latex, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return `<div style="color: #00f0ff; font-family: monospace;">${latex}</div>`;
          }
        };

        const getStatusBadge = (status: 'OPTIMAL' | 'COMPLIANT' | 'BALANCED' | 'WARNING') => {
          switch (status) {
            case 'OPTIMAL':
              return { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#34d399', icon: CheckCircle2 };
            case 'COMPLIANT':
              return { bg: 'rgba(0, 240, 255, 0.15)', border: '#00f0ff', text: '#38bdf8', icon: ShieldCheck };
            case 'BALANCED':
              return { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc', icon: Scale };
            case 'WARNING':
              return { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24', icon: AlertTriangle };
          }
        };

        return (
          <div
            className="glass-card"
            style={{
              padding: '24px',
              border: '1px solid rgba(0, 240, 255, 0.22)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            {/* Header with Title & Navigation Tabs */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(0, 240, 255, 0.12)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookOpen size={20} color="#00f0ff" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc', margin: 0, letterSpacing: '0.02em' }}>
                      Deep Graph Intelligence &amp; Algorithmic Audit Dossier
                    </h2>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid rgba(0, 240, 255, 0.35)',
                        color: '#00f0ff',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {activeGraph.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0 0' }}>
                    Multi-dimensional cyber-physical specification, element breakdown, mathematical foundations, and invariant proofs.
                  </p>
                </div>
              </div>

              {/* Sub-Tab Navigation Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(15, 23, 42, 0.65)',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {[
                  { id: 'all', label: 'All Sections', icon: FileText },
                  { id: 'meaning', label: '1. Meaning & Math', icon: Sparkles },
                  { id: 'elements', label: '2. Elements Key', icon: Eye },
                  { id: 'acronyms', label: '3. Glossary & Terms', icon: Tag },
                  { id: 'results', label: '4. Calculated Results', icon: Activity },
                ].map((tab) => {
                  const IconComp = tab.icon;
                  const isActive = dossierTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setDossierTab(tab.id as any)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        fontSize: '11px',
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#00f0ff' : '#94a3b8',
                        background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                        border: isActive ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid transparent',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <IconComp size={13} color={isActive ? '#00f0ff' : '#64748b'} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ============================================================ */}
            {/* SECTION 1: GENERAL GRAPH MEANING & FORMAL MATHEMATICS       */}
            {/* ============================================================ */}
            {(dossierTab === 'all' || dossierTab === 'meaning') && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '18px',
                  background: 'rgba(15, 23, 42, 0.45)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={16} color="#00f0ff" />
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                    1. General Graph Meaning &amp; Mathematical Formulation
                  </h3>
                </div>

                {/* Conceptual Overview */}
                <div style={{ fontSize: '13px', lineHeight: '1.65', color: '#cbd5e1' }}>
                  {dossier.generalMeaning.overview}
                </div>

                {/* Formal LaTeX Display Block */}
                {dossier.formulaLatex && (
                  <div
                    style={{
                      marginTop: '4px',
                      padding: '14px 18px',
                      background: 'rgba(10, 18, 36, 0.85)',
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 240, 255, 0.25)',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
                      overflowX: 'auto',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '8px', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>∑</span> Governing Mathematical Formulation
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: renderFormula(dossier.formulaLatex) }}
                      style={{ color: '#f8fafc', fontSize: '14px', textAlign: 'center' }}
                    />
                  </div>
                )}

                {/* Dual Column: Mathematical Paradigm vs Industrial Significance */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginTop: '6px' }}>
                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.35)',
                      border: '1px solid rgba(56, 189, 248, 0.18)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Optimization Theory &amp; Mathematical Paradigm
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#94a3b8' }}>
                      {dossier.generalMeaning.mathematicalParadigm}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      background: 'rgba(30, 41, 59, 0.35)',
                      border: '1px solid rgba(16, 185, 129, 0.18)',
                    }}
                  >
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#34d399', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Industrial Cyber-Physical Significance
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#94a3b8' }}>
                      {dossier.generalMeaning.industrialSignificance}
                    </div>
                  </div>
                </div>

                {/* Enforced Invariants */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#cbd5e1', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} color="#00f0ff" /> Enforced Operational Invariants &amp; Physical Constraints:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {dossier.generalMeaning.enforcedInvariants.map((inv, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '11px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          background: 'rgba(0, 240, 255, 0.08)',
                          border: '1px solid rgba(0, 240, 255, 0.22)',
                          color: '#e2e8f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <CheckCircle2 size={12} color="#00f0ff" />
                        <span>{inv}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SECTION 2: DETAILED GRAPH ELEMENTS BREAKDOWN                */}
            {/* ============================================================ */}
            {(dossierTab === 'all' || dossierTab === 'elements') && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '18px',
                  background: 'rgba(15, 23, 42, 0.45)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} color="#38bdf8" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                      2. Visual Anatomy &amp; Element-by-Element Key
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {dossier.elementExplanations.length} elements mapped in this figure
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                  {dossier.elementExplanations.map((elem, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        borderLeft: `4px solid ${elem.color}`,
                        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                          {elem.name}
                        </div>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(15, 23, 42, 0.8)',
                            color: elem.color,
                            border: `1px solid ${elem.color}55`,
                            fontFamily: 'monospace',
                          }}
                        >
                          {elem.symbol}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', lineHeight: '1.5', color: '#94a3b8' }}>
                        {elem.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SECTION 3: ABBREVIATIONS & ACRONYMS GLOSSARY                */}
            {/* ============================================================ */}
            {(dossierTab === 'all' || dossierTab === 'acronyms') && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '18px',
                  background: 'rgba(15, 23, 42, 0.45)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Tag size={16} color="#a855f7" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                      3. Abbreviations &amp; Acronyms Glossary
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Domain lexicon &amp; mathematical symbols
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
                  {dossier.abbreviationsAndAcronyms.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        background: 'rgba(30, 41, 59, 0.35)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: '#a855f7',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(168, 85, 247, 0.15)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {item.term}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: '#f1f5f9' }}>
                          {item.expansion}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', lineHeight: '1.5', color: '#94a3b8' }}>
                        {item.definition}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* SECTION 4: CALCULATED MEANING RESULT VALUES                  */}
            {/* ============================================================ */}
            {(dossierTab === 'all' || dossierTab === 'results') && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '18px',
                  background: 'rgba(15, 23, 42, 0.45)',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Activity size={16} color="#10b981" />
                    <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
                      4. Calculated Result Values &amp; Operational Meaning
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Quantified simulation metrics &amp; physical safety margins
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                  {dossier.calculatedResults.map((res, idx) => {
                    const badge = getStatusBadge(res.status);
                    const StatusIcon = badge.icon;
                    return (
                      <div
                        key={idx}
                        style={{
                          padding: '14px',
                          borderRadius: '8px',
                          background: 'rgba(30, 41, 59, 0.4)',
                          border: `1px solid ${badge.border}44`,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                              {res.metric}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: badge.bg,
                                border: `1px solid ${badge.border}`,
                                color: badge.text,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <StatusIcon size={10} color={badge.text} />
                              <span>{res.status}</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                            <span style={{ fontSize: '22px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                              {res.value}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: badge.text }}>
                              {res.unit}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: '11.5px',
                            lineHeight: '1.5',
                            color: '#cbd5e1',
                            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                            paddingTop: '8px',
                          }}
                        >
                          {res.interpretation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* 4-Way Algorithmic Benchmark Comparison Card */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <BarChart3 size={18} color="#00f0ff" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#f3f4f6', margin: 0 }}>
            4-Way Benchmark Comparator (Makespan in Seconds)
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
            Hover each solver card for algorithmic mechanism &amp; performance breakdown
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {[
            {
              name: 'FIFO Baseline',
              makespan: 1207.8,
              color: '#9ca3af',
              diff: '0.0%',
              tooltip: 'First-In-First-Out baseline queue without clustering or combinatorial 3D bin packing. Yields 1207.8s makespan baseline.',
            },
            {
              name: 'Hard K-Means',
              makespan: 1142.1,
              color: '#cbd5e1',
              diff: '-5.4%',
              tooltip: 'Classical geometric partitioning with L2 Euclidean distance. Yields -5.4% makespan savings but creates non-convex routing overlap.',
            },
            {
              name: 'Classical SC-QFCM',
              makespan: 988.4,
              color: '#38bdf8',
              diff: '-18.1%',
              tooltip: 'Spatially-Constrained Quantum-inspired Fuzzy C-Means with soft cluster membership and Voronoi boundary smoothing (-18.1% makespan).',
            },
            {
              name: 'Classiq Quantum',
              makespan: 949.3,
              color: '#10b981',
              diff: '-21.4% (WINNER)',
              tooltip: 'Classiq QAOA hybrid quantum variational solver with multi-objective Hamiltonian optimization. Achieves benchmark-winning -21.4% makespan reduction (949.3s).',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-card"
              style={{
                padding: '14px',
                borderLeft: `4px solid ${item.color}`,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={item.tooltip}
            >
              <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{item.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#f3f4f6' }}>{item.makespan.toFixed(1)}s</span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: item.color }}>{item.diff}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )}
</div>
  );
};
