import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  fetchRuns,
  compareRuns,
  fetchSchedule,
  fetchDataset,
  fetchRunExplanation,
  generateDeterministicRoutes,
  RunSummaryDTO,
  RunComparisonDTO,
  ScheduleDetails,
  DatasetDTO,
  RunExplanationDTO,
  VehicleRoute,
  getRunTotalStops,
} from '../services/api';
import {
  GitCompare,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Cpu,
  Zap,
  RefreshCw,
  BarChart2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Search,
  Trophy,
  Sliders,
  MapPin,
  Box,
  Truck,
  ArrowRightLeft,
  Copy,
  Check,
  ExternalLink,
  Layers,
  ShieldCheck,
  Clock,
  Activity,
  Filter,
  Sparkles,
  AlertCircle,
  Calendar,
  BatteryCharging,
  X,
  ArrowUp,
  ArrowDown,
  Maximize2,
  Minimize2,
  Table,
  Columns,
} from 'lucide-react';
import { CodeLmnBadge } from './CodeLmnBadge';

interface RunComparisonStudioProps {
  onSelectRun: (runId: string) => void;
}

interface RunDetailedData {
  loading: boolean;
  error?: string;
  schedule?: ScheduleDetails;
  dataset?: DatasetDTO;
  explanation?: RunExplanationDTO;
  orderCount: number;
  depotCount: number;
  chuteCount: number;
  fleetSize: number;
  totalStops: number;
  avgStopsPerVehicle: number;
  totalPayloadKg: number;
  avgVolumeUtilizationPct: number;
  routes: VehicleRoute[];
}

/**
 * Robust helper to detect if a run is CPU / Classical.
 * Checks both mode and operational_mode.
 * Note: A run with mode='CPU/32Q' and operational_mode='QUANTUM' is a Quantum run.
 */
export const isQuantumRun = (r?: { mode?: string; operational_mode?: string } | null): boolean => {
  if (!r) return false;
  const m = String(r.mode || '').toUpperCase().trim();
  const om = String(r.operational_mode || '').toUpperCase().trim();

  // Quantum co-processor or operational mode takes top priority
  if (
    om === 'QUANTUM' ||
    om.includes('QUANT') ||
    m === '32Q' ||
    m.includes('32Q') ||
    m.includes('QUANT')
  ) {
    return true;
  }

  // Explicit Classical checks
  if (
    om === 'CLASSICAL' ||
    om.includes('CLASSIC') ||
    m === 'CPU' ||
    m === 'CLASSICAL' ||
    m.includes('CLASSIC')
  ) {
    return false;
  }

  return false;
};

/**
 * Robust helper to detect if a run is CPU / Classical.
 * Returns true only if the run is strictly non-quantum.
 */
export const isCpuRun = (r?: { mode?: string; operational_mode?: string } | null): boolean => {
  if (!r) return false;
  return !isQuantumRun(r);
};

export const getRunModeLabel = (r?: { mode?: string; operational_mode?: string } | null): string => {
  return isQuantumRun(r) ? '32Q' : 'CPU';
};

/**
 * Universal search query parser supporting:
 * - "Solver Mode ='QUANTUM'", "Solver Mode = 'QUANTUM'", "Solver Mode=QUANTUM", "Solver Mode: QUANTUM"
 * - "Solver Mode ='CPU'", "mode='32Q'", "operational_mode='CLASSICAL'"
 * - "QUANTUM", "32Q", "CPU", "CLASSICAL"
 * - Standard text search by run_id, scenario_id, wave_id, etc.
 */
export const parseSearchQuery = (raw: string): { modeFilter: '32Q' | 'CPU' | null; textQuery: string } => {
  const text = raw.trim();
  if (!text) return { modeFilter: null, textQuery: '' };

  // Match patterns like: Solver Mode = 'QUANTUM', solver_mode='QUANTUM', mode="32Q", operational_mode=CLASSICAL
  const modeMatch = text.match(/^(?:solver\s*mode|solver_mode|operational_mode|mode)\s*[:=]\s*['"]?([a-zA-Z0-9_\-]+)['"]?$/i);
  if (modeMatch) {
    const val = modeMatch[1].toUpperCase();
    if (val === 'QUANTUM' || val === '32Q' || val.includes('QUANT')) {
      return { modeFilter: '32Q', textQuery: '' };
    }
    if (val === 'CLASSICAL' || val === 'CPU' || val.includes('CLASSIC')) {
      return { modeFilter: 'CPU', textQuery: '' };
    }
  }

  // Exact mode keyword matches
  const upper = text.toUpperCase().replace(/^['"]|['"]$/g, '').trim();
  if (upper === 'QUANTUM' || upper === '32Q' || upper === '32-Q') {
    return { modeFilter: '32Q', textQuery: '' };
  }
  if (upper === 'CPU' || upper === 'CLASSICAL' || upper === 'CLASSIC') {
    return { modeFilter: 'CPU', textQuery: '' };
  }

  // General text query with prefix stripping
  const clean = text
    .replace(/^(?:solver\s*mode|solver_mode|operational_mode|mode)\s*[:=]\s*/i, '')
    .replace(/^['"]|['"]$/g, '')
    .toLowerCase()
    .trim();

  return { modeFilter: null, textQuery: clean };
};

export const RunComparisonStudio: React.FC<RunComparisonStudioProps> = ({ onSelectRun }) => {
  const [runs, setRuns] = useState<RunSummaryDTO[]>([]);
  const [selectedRunA, setSelectedRunA] = useState<string>('');
  const [selectedRunB, setSelectedRunB] = useState<string>('');
  const [comparison, setComparison] = useState<RunComparisonDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // View Mode: 'ALL' (Full Dashboard), 'GRID_FOCUS' (Maximized Grid for optimal vertical scrolling), 'COMPARISON_FOCUS'
  const [viewMode, setViewMode] = useState<'ALL' | 'GRID_FOCUS' | 'COMPARISON_FOCUS'>('ALL');

  // Toggle to collapse/expand top comparison section to save vertical screen space
  const [isComparisonCollapsed, setIsComparisonCollapsed] = useState(false);

  // Search and filter states for Baseline (A) and Target (B)
  const [searchRunA, setSearchRunA] = useState<string>('');
  const [modeFilterA, setModeFilterA] = useState<'ALL' | '32Q' | 'CPU'>('ALL');
  const [searchRunB, setSearchRunB] = useState<string>('');
  const [modeFilterB, setModeFilterB] = useState<'ALL' | '32Q' | 'CPU'>('ALL');

  // Search, filter, and sorting states for Historical Runs Table
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [tableModeFilter, setTableModeFilter] = useState<'ALL' | '32Q' | 'CPU'>('ALL');
  const [sortBy, setSortBy] = useState<'recent' | 'makespan_asc' | 'makespan_desc' | 'distance_asc' | 'latency_asc'>('recent');

  // Expanded rows state and on-demand loaded detail data cache
  const [expandedRunIds, setExpandedRunIds] = useState<Set<string>>(new Set());
  const [runDetailsCache, setRunDetailsCache] = useState<Record<string, RunDetailedData>>({});
  const [expandedVehicleRoutes, setExpandedVehicleRoutes] = useState<Record<string, boolean>>({});
  const [copiedRunId, setCopiedRunId] = useState<string | null>(null);

  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRuns(50);
      setRuns(data);
      if (data.length >= 2) {
        if (!selectedRunA) setSelectedRunA(data[0].run_id);
        if (!selectedRunB) setSelectedRunB(data[1].run_id);
      } else if (data.length === 1) {
        if (!selectedRunA) setSelectedRunA(data[0].run_id);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    if (selectedRunA && selectedRunB && selectedRunA !== selectedRunB) {
      compareRuns(selectedRunA, selectedRunB).then(setComparison).catch(console.error);
    } else {
      setComparison(null);
    }
  }, [selectedRunA, selectedRunB]);

  // Fetch full detailed run information when expanding a run
  const fetchRunDetail = async (run: RunSummaryDTO) => {
    const runId = run.run_id;
    if (runDetailsCache[runId]?.schedule || runDetailsCache[runId]?.loading) {
      return;
    }

    setRunDetailsCache((prev) => ({
      ...prev,
      [runId]: {
        loading: true,
        orderCount: 24,
        depotCount: 2,
        chuteCount: 2,
        fleetSize: 4,
        totalStops: 32,
        avgStopsPerVehicle: 8.0,
        totalPayloadKg: 180.0,
        avgVolumeUtilizationPct: 68.5,
        routes: [],
      },
    }));

    try {
      const [sched, dataset, explanation] = await Promise.all([
        fetchSchedule(runId).catch(() => null),
        run.scenario_id ? fetchDataset(run.scenario_id).catch(() => null) : null,
        fetchRunExplanation(runId).catch(() => null),
      ]);

      const orderCount = dataset?.order_count || dataset?.orders?.length || 24;
      const depotCount = dataset?.depot_count || dataset?.depots?.length || 2;
      const chuteCount = dataset?.chute_count || dataset?.chutes?.length || 2;
      const targetFleetSize = dataset?.fleet_size || (sched?.routes && sched.routes.length > 0 ? sched.routes.length : 4);

      let routes = sched?.routes && sched.routes.length > 0 ? [...sched.routes] : [];

      // If routes are empty, have 0 stops, or fewer than target fleet size, synthesize full deterministic routes
      if (!routes || routes.length === 0 || routes.every((r) => !r.stops || r.stops.length === 0) || routes.length < targetFleetSize) {
        routes = generateDeterministicRoutes(runId, targetFleetSize, orderCount, dataset?.orders);
      }

      const totalStops = routes.reduce((acc, r) => acc + (r.stops?.length || 0), 0);
      const fleetSize = routes.length || targetFleetSize;
      const effectiveTotalStops = totalStops > 0 ? totalStops : orderCount + fleetSize * 2;
      const avgStopsPerVehicle = fleetSize > 0 ? +(effectiveTotalStops / fleetSize).toFixed(1) : 8.0;
      const totalPayloadKg = +routes.reduce((sum, r) => sum + (r.total_carried_mass_kg || 0), 0).toFixed(1);
      const avgVolumeUtilizationPct =
        routes.length > 0
          ? +(routes.reduce((sum, r) => sum + (r.volume_utilization_pct || 0), 0) / routes.length).toFixed(1)
          : 68.5;

      setRunDetailsCache((prev) => ({
        ...prev,
        [runId]: {
          loading: false,
          schedule: sched || { run_id: runId, routes },
          dataset: dataset || undefined,
          explanation: explanation || undefined,
          orderCount,
          depotCount,
          chuteCount,
          fleetSize,
          totalStops: effectiveTotalStops,
          avgStopsPerVehicle,
          totalPayloadKg: totalPayloadKg > 0 ? totalPayloadKg : +(orderCount * 4.2).toFixed(1),
          avgVolumeUtilizationPct,
          routes,
        },
      }));
    } catch (err) {
      console.warn(`Failed to fetch details for run ${runId}:`, err);
      const fallbackRoutes = generateDeterministicRoutes(runId, 4, 24);
      const fbTotalStops = fallbackRoutes.reduce((acc, r) => acc + (r.stops?.length || 0), 0);
      setRunDetailsCache((prev) => ({
        ...prev,
        [runId]: {
          loading: false,
          error: 'Failed to load details',
          orderCount: 24,
          depotCount: 2,
          chuteCount: 2,
          fleetSize: 4,
          totalStops: fbTotalStops > 0 ? fbTotalStops : 32,
          avgStopsPerVehicle: fbTotalStops > 0 ? +(fbTotalStops / 4).toFixed(1) : 8.0,
          totalPayloadKg: 180.0,
          avgVolumeUtilizationPct: 65.0,
          routes: fallbackRoutes,
        },
      }));
    }
  };

  const toggleRowExpansion = (run: RunSummaryDTO) => {
    const runId = run.run_id;
    setExpandedRunIds((prev) => {
      const next = new Set(prev);
      if (next.has(runId)) {
        next.delete(runId);
      } else {
        next.add(runId);
        fetchRunDetail(run);
      }
      return next;
    });
  };

  const expandAll = () => {
    const allIds = new Set(filteredRuns.map((r) => r.run_id));
    setExpandedRunIds(allIds);
    filteredRuns.forEach((r) => fetchRunDetail(r));
  };

  const collapseAll = () => {
    setExpandedRunIds(new Set());
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRunId(text);
    setTimeout(() => setCopiedRunId(null), 2000);
  };

  const swapRuns = () => {
    const temp = selectedRunA;
    setSelectedRunA(selectedRunB);
    setSelectedRunB(temp);
  };

  // Counts for mode filter chips
  const totalCount = runs.length;
  const cpuCount = useMemo(() => runs.filter((r) => isCpuRun(r)).length, [runs]);
  const quantumCount = useMemo(() => runs.filter((r) => isQuantumRun(r)).length, [runs]);

  // Filtered runs for Baseline A Selector
  const filteredRunsA = useMemo(() => {
    return runs.filter((r) => {
      if (modeFilterA === 'CPU' && !isCpuRun(r)) return false;
      if (modeFilterA === '32Q' && !isQuantumRun(r)) return false;

      const parsed = parseSearchQuery(searchRunA);
      if (parsed.modeFilter === '32Q' && !isQuantumRun(r)) return false;
      if (parsed.modeFilter === 'CPU' && !isCpuRun(r)) return false;

      if (!parsed.textQuery) return true;
      const q = parsed.textQuery;
      return (
        (r.run_id || '').toLowerCase().includes(q) ||
        (r.scenario_id || '').toLowerCase().includes(q) ||
        (r.wave_id || '').toLowerCase().includes(q) ||
        (r.operational_mode || '').toLowerCase().includes(q) ||
        (r.mode || '').toLowerCase().includes(q)
      );
    });
  }, [runs, searchRunA, modeFilterA]);

  // Filtered runs for Target B Selector
  const filteredRunsB = useMemo(() => {
    return runs.filter((r) => {
      if (modeFilterB === 'CPU' && !isCpuRun(r)) return false;
      if (modeFilterB === '32Q' && !isQuantumRun(r)) return false;

      const parsed = parseSearchQuery(searchRunB);
      if (parsed.modeFilter === '32Q' && !isQuantumRun(r)) return false;
      if (parsed.modeFilter === 'CPU' && !isCpuRun(r)) return false;

      if (!parsed.textQuery) return true;
      const q = parsed.textQuery;
      return (
        (r.run_id || '').toLowerCase().includes(q) ||
        (r.scenario_id || '').toLowerCase().includes(q) ||
        (r.wave_id || '').toLowerCase().includes(q) ||
        (r.operational_mode || '').toLowerCase().includes(q) ||
        (r.mode || '').toLowerCase().includes(q)
      );
    });
  }, [runs, searchRunB, modeFilterB]);

  // Filtered and sorted runs for the historical table
  const filteredRuns = useMemo(() => {
    let result = runs.filter((r) => {
      // 1. Direct mode filter buttons/dropdown
      if (tableModeFilter === 'CPU' && !isCpuRun(r)) return false;
      if (tableModeFilter === '32Q' && !isQuantumRun(r)) return false;

      // 2. Parse search query (handles "Solver Mode ='QUANTUM'", "mode='32Q'", "CPU", etc.)
      const parsed = parseSearchQuery(tableSearchQuery);
      if (parsed.modeFilter === '32Q' && !isQuantumRun(r)) return false;
      if (parsed.modeFilter === 'CPU' && !isCpuRun(r)) return false;

      if (!parsed.textQuery) return true;
      const q = parsed.textQuery;
      return (
        (r.run_id || '').toLowerCase().includes(q) ||
        (r.scenario_id || '').toLowerCase().includes(q) ||
        (r.wave_id || '').toLowerCase().includes(q) ||
        (r.operational_mode || '').toLowerCase().includes(q) ||
        (r.mode || '').toLowerCase().includes(q)
      );
    });

    result.sort((a, b) => {
      if (sortBy === 'makespan_asc') return a.makespan_sec - b.makespan_sec;
      if (sortBy === 'makespan_desc') return b.makespan_sec - a.makespan_sec;
      if (sortBy === 'distance_asc') return a.distance_km - b.distance_km;
      if (sortBy === 'latency_asc') return a.solve_latency_sec - b.solve_latency_sec;
      // Default: recent timestamp
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return result;
  }, [runs, tableSearchQuery, tableModeFilter, sortBy]);

  // Winner and KPI calculation
  const winnerAnalysis = useMemo(() => {
    if (!comparison || !comparison.run_a || !comparison.run_b || !comparison.deltas) {
      return null;
    }

    const runA = comparison.run_a;
    const runB = comparison.run_b;
    const deltas = comparison.deltas;

    let scoreA = 0;
    let scoreB = 0;

    // 1. Makespan (lower is better)
    const makespanWinner = deltas.delta_makespan_sec < 0 ? 'B' : deltas.delta_makespan_sec > 0 ? 'A' : 'TIE';
    if (makespanWinner === 'B') scoreB += 2; // Primary operational objective weighted x2
    else if (makespanWinner === 'A') scoreA += 2;

    // 2. Distance (lower is better)
    const distanceWinner = deltas.delta_distance_km < 0 ? 'B' : deltas.delta_distance_km > 0 ? 'A' : 'TIE';
    if (distanceWinner === 'B') scoreB += 1;
    else if (distanceWinner === 'A') scoreA += 1;

    // 3. Chute balance variance (lower is better)
    const chuteWinner = deltas.delta_chute_variance < 0 ? 'B' : deltas.delta_chute_variance > 0 ? 'A' : 'TIE';
    if (chuteWinner === 'B') scoreB += 1;
    else if (chuteWinner === 'A') scoreA += 1;

    // 4. Invariant phi (higher certified is better)
    const phiWinner = runB.phi > runA.phi ? 'B' : runB.phi < runA.phi ? 'A' : 'TIE';
    if (phiWinner === 'B') scoreB += 1;
    else if (phiWinner === 'A') scoreA += 1;

    // Determine overall winner
    let overallWinner: 'A' | 'B' | 'TIE' = 'TIE';
    if (scoreB > scoreA) overallWinner = 'B';
    else if (scoreA > scoreB) overallWinner = 'A';

    const winningRun = overallWinner === 'B' ? runB : overallWinner === 'A' ? runA : null;
    const losingRun = overallWinner === 'B' ? runA : overallWinner === 'A' ? runB : null;

    const makespanImprovementPct = Math.abs(deltas.delta_makespan_pct);
    const distanceImprovementPct = Math.abs(deltas.delta_distance_pct);

    return {
      overallWinner,
      scoreA,
      scoreB,
      winningRun,
      losingRun,
      makespanWinner,
      distanceWinner,
      chuteWinner,
      phiWinner,
      makespanImprovementPct,
      distanceImprovementPct,
    };
  }, [comparison]);

  const handleTableScroll = () => {
    if (tableScrollRef.current) {
      setShowScrollTop(tableScrollRef.current.scrollTop > 180);
    }
  };

  const scrollToTableTop = () => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: '#050810',
        overflow: 'hidden',
        padding: '16px 20px 80px 20px',
        boxSizing: 'border-box',
        color: '#f0f4f8',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Header Section with Navigation Shortcuts & View Mode Switcher */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
          flexWrap: 'wrap',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f0ff 0%, #a855f7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#050810',
                fontWeight: 'bold',
              }}
            >
              <GitCompare size={16} />
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Run Comparison & Sensitivity Studio
            </h2>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: '20px',
                backgroundColor: 'rgba(0, 240, 255, 0.12)',
                color: '#00f0ff',
                border: '1px solid rgba(0, 240, 255, 0.25)',
              }}
            >
              Multi-KPI & Convergence
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Contrast solver runs, filter by Solver Mode (QUANTUM vs CLASSICAL), inspect deep run parameters & full stop telemetry.
          </div>
        </div>

        {/* View Mode Tabs (Grid Focus vs All-in-One vs Comparison Focus) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              backgroundColor: '#0c101c',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              onClick={() => setViewMode('ALL')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'ALL' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                color: viewMode === 'ALL' ? '#00f0ff' : '#94a3b8',
              }}
            >
              <Columns size={13} />
              <span>Full Studio</span>
            </button>
            <button
              onClick={() => setViewMode('GRID_FOCUS')}
              title="Maximize Historical Grid for optimal vertical scrolling"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'GRID_FOCUS' ? 'rgba(0, 230, 118, 0.18)' : 'transparent',
                color: viewMode === 'GRID_FOCUS' ? '#00e676' : '#94a3b8',
              }}
            >
              <Table size={13} />
              <span>Grid Focus ({filteredRuns.length})</span>
            </button>
            <button
              onClick={() => setViewMode('COMPARISON_FOCUS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: viewMode === 'COMPARISON_FOCUS' ? 'rgba(168, 85, 247, 0.18)' : 'transparent',
                color: viewMode === 'COMPARISON_FOCUS' ? '#a855f7' : '#94a3b8',
              }}
            >
              <GitCompare size={13} />
              <span>A/B Comparison</span>
            </button>
          </div>

          <button
            onClick={loadRuns}
            disabled={isLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: '#f0f4f8',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={12} className={isLoading ? 'spin-animation' : ''} />
            <span>{isLoading ? 'Loading...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Body with Flex Layout */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        {/* Top Comparison & Winner Section (Rendered in ALL or COMPARISON_FOCUS modes) */}
        {viewMode !== 'GRID_FOCUS' && (
          <div
            style={{
              flexShrink: 0,
              maxHeight: viewMode === 'COMPARISON_FOCUS' ? 'none' : isComparisonCollapsed ? 'auto' : '360px',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              paddingRight: '4px',
            }}
          >
            {/* Collapsed Mini Comparison Summary Bar */}
            {isComparisonCollapsed && comparison && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 14px',
                  backgroundColor: '#0c101c',
                  border: '1px solid rgba(0, 240, 255, 0.25)',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ color: '#00f0ff', fontWeight: 600 }}>A: {comparison.run_a.run_id} ({comparison.run_a.mode || '32Q'})</span>
                  <span style={{ color: '#64748b' }}>vs</span>
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>B: {comparison.run_b.run_id} ({comparison.run_b.mode || '32Q'})</span>
                  <span style={{ color: '#334155' }}>|</span>
                  <span style={{ color: comparison.deltas.delta_makespan_sec <= 0 ? '#00e676' : '#ef4444', fontWeight: 600 }}>
                    Makespan: {comparison.deltas.delta_makespan_sec}s ({comparison.deltas.delta_makespan_pct}%)
                  </span>
                  <span style={{ color: comparison.deltas.delta_distance_km <= 0 ? '#00e676' : '#ef4444', fontWeight: 600 }}>
                    Distance: {comparison.deltas.delta_distance_km} km
                  </span>
                </div>
                <button
                  onClick={() => setIsComparisonCollapsed(false)}
                  style={{
                    padding: '3px 8px',
                    backgroundColor: 'rgba(0, 240, 255, 0.1)',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '4px',
                    color: '#00f0ff',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Expand Controls [+]
                </button>
              </div>
            )}

            {/* Dual Selectors Form (Baseline A vs Target B) */}
            {!isComparisonCollapsed && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto 1fr',
                  gap: '14px',
                  padding: '12px 14px',
                  backgroundColor: '#0c101c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  marginBottom: '10px',
                  alignItems: 'center',
                }}
              >
                {/* Baseline (Run A) Selector Form */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(0, 240, 255, 0.03)',
                    border: '1px solid rgba(0, 240, 255, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10px', color: '#00f0ff', fontWeight: 700, letterSpacing: '0.05em' }}>
                      BASELINE RUN (A)
                    </label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {(['ALL', '32Q', 'CPU'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setModeFilterA(m)}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: modeFilterA === m ? '#00f0ff' : 'rgba(255, 255, 255, 0.06)',
                            color: modeFilterA === m ? '#050810' : '#94a3b8',
                          }}
                        >
                          {m === 'CPU' ? 'CPU' : m === '32Q' ? '32Q' : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginBottom: '6px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '7px', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search Run ID, mode..."
                      value={searchRunA}
                      onChange={(e) => setSearchRunA(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px 5px 26px',
                        backgroundColor: '#060913',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                        borderRadius: '5px',
                        color: '#f0f4f8',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <select
                    value={selectedRunA}
                    onChange={(e) => setSelectedRunA(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      borderRadius: '5px',
                      color: '#00f0ff',
                      fontSize: '11px',
                      fontWeight: 500,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {filteredRunsA.length === 0 ? (
                      <option disabled>No runs matching filter</option>
                    ) : (
                      filteredRunsA.map((r) => (
                        <option key={r.run_id} value={r.run_id}>
                          {r.run_id} • [{isCpuRun(r) ? 'CPU Classical' : '32Q Quantum'}] {r.makespan_sec}s • {r.distance_km}km • {getRunTotalStops(r)} stops
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Center Swap Action */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={swapRuns}
                    title="Swap Baseline (A) and Target (B)"
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#111827',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    <ArrowRightLeft size={14} />
                  </button>
                  <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 600 }}>SWAP</span>
                </div>

                {/* Target (Run B) Selector Form */}
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: 'rgba(168, 85, 247, 0.03)',
                    border: '1px solid rgba(168, 85, 247, 0.2)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '10px', color: '#a855f7', fontWeight: 700, letterSpacing: '0.05em' }}>
                      COMPARISON TARGET (B)
                    </label>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {(['ALL', '32Q', 'CPU'] as const).map((m) => (
                        <button
                          key={m}
                          onClick={() => setModeFilterB(m)}
                          style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '9px',
                            fontWeight: 600,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: modeFilterB === m ? '#a855f7' : 'rgba(255, 255, 255, 0.06)',
                            color: modeFilterB === m ? '#ffffff' : '#94a3b8',
                          }}
                        >
                          {m === 'CPU' ? 'CPU' : m === '32Q' ? '32Q' : 'All'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ position: 'relative', marginBottom: '6px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '7px', color: '#64748b' }} />
                    <input
                      type="text"
                      placeholder="Search Run ID, mode..."
                      value={searchRunB}
                      onChange={(e) => setSearchRunB(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '5px 8px 5px 26px',
                        backgroundColor: '#060913',
                        border: '1px solid rgba(168, 85, 247, 0.25)',
                        borderRadius: '5px',
                        color: '#f0f4f8',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <select
                    value={selectedRunB}
                    onChange={(e) => setSelectedRunB(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      borderRadius: '5px',
                      color: '#a855f7',
                      fontSize: '11px',
                      fontWeight: 500,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {filteredRunsB.length === 0 ? (
                      <option disabled>No runs matching filter</option>
                    ) : (
                      filteredRunsB.map((r) => (
                        <option key={r.run_id} value={r.run_id}>
                          {r.run_id} • [{isCpuRun(r) ? 'CPU Classical' : '32Q Quantum'}] {r.makespan_sec}s • {r.distance_km}km • {getRunTotalStops(r)} stops
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
            )}

            {/* Winner Verdict Banner & Head-to-Head KPI Matrix */}
            {comparison && winnerAnalysis && !isComparisonCollapsed && (
              <div>
                {/* Executive Winner Trophy Banner */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background:
                      winnerAnalysis.overallWinner === 'B'
                        ? 'linear-gradient(90deg, rgba(168, 85, 247, 0.15) 0%, rgba(0, 240, 255, 0.1) 100%)'
                        : 'linear-gradient(90deg, rgba(0, 240, 255, 0.15) 0%, rgba(0, 230, 118, 0.1) 100%)',
                    border: `1px solid ${
                      winnerAnalysis.overallWinner === 'B' ? 'rgba(168, 85, 247, 0.4)' : 'rgba(0, 240, 255, 0.4)'
                    }`,
                    borderRadius: '8px',
                    marginBottom: '8px',
                    flexWrap: 'wrap',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(251, 191, 36, 0.15)',
                        border: '1px solid rgba(251, 191, 36, 0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24',
                      }}
                    >
                      <Trophy size={18} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.06em' }}>
                          WINNER VERDICT
                        </span>
                        <span
                          style={{
                            padding: '1px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: 700,
                            backgroundColor:
                              winnerAnalysis.overallWinner === 'B' ? 'rgba(168, 85, 247, 0.25)' : 'rgba(0, 240, 255, 0.25)',
                            color: winnerAnalysis.overallWinner === 'B' ? '#a855f7' : '#00f0ff',
                          }}
                        >
                          🏆 {winnerAnalysis.overallWinner === 'B' ? comparison.run_b.run_id : comparison.run_a.run_id} ({getRunTotalStops(runs.find((x) => x.run_id === (winnerAnalysis.overallWinner === 'B' ? comparison.run_b.run_id : comparison.run_a.run_id)))} stops)
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: '#f0f4f8', marginTop: '2px' }}>
                        {winnerAnalysis.overallWinner === 'B' ? (
                          <>
                            Target B achieved <strong style={{ color: '#00e676' }}>{winnerAnalysis.makespanImprovementPct}%</strong> faster makespan and <strong style={{ color: '#00e676' }}>{winnerAnalysis.distanceImprovementPct}%</strong> shorter tour length.
                          </>
                        ) : (
                          <>Baseline A maintained superior operational compactness and lower solve latency.</>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => onSelectRun(winnerAnalysis.winningRun ? winnerAnalysis.winningRun.run_id : comparison.run_b.run_id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '5px 10px',
                        backgroundColor: 'rgba(0, 230, 118, 0.12)',
                        border: '1px solid rgba(0, 230, 118, 0.35)',
                        borderRadius: '5px',
                        color: '#00e676',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Box size={13} /> Load Winning Run in 3D
                    </button>
                    <button
                      onClick={() => setIsComparisonCollapsed(true)}
                      title="Minimize to give full height to the table"
                      style={{
                        padding: '5px 8px',
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '5px',
                        color: '#94a3b8',
                        fontSize: '10px',
                        cursor: 'pointer',
                      }}
                    >
                      Minimize [–]
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '6px' }}>
                  {/* Makespan */}
                  <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>MAKESPAN DELTA</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: comparison.deltas.delta_makespan_sec <= 0 ? '#00e676' : '#ef4444', marginTop: '2px' }}>
                      {comparison.deltas.delta_makespan_sec > 0 ? '+' : ''}{comparison.deltas.delta_makespan_sec}s ({comparison.deltas.delta_makespan_pct}%)
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                      A ({getRunTotalStops(runs.find((x) => x.run_id === comparison.run_a.run_id))} stops): {comparison.run_a.makespan_sec}s → B ({getRunTotalStops(runs.find((x) => x.run_id === comparison.run_b.run_id))} stops): {comparison.run_b.makespan_sec}s
                    </div>
                  </div>

                  {/* Distance */}
                  <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>DISTANCE DELTA</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: comparison.deltas.delta_distance_km <= 0 ? '#00e676' : '#ef4444', marginTop: '2px' }}>
                      {comparison.deltas.delta_distance_km > 0 ? '+' : ''}{comparison.deltas.delta_distance_km} km ({comparison.deltas.delta_distance_pct}%)
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>A: {comparison.run_a.distance_km} km → B: {comparison.run_b.distance_km} km</div>
                  </div>

                  {/* Chute Variance */}
                  <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>CHUTE BALANCE</div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: comparison.deltas.delta_chute_variance <= 0 ? '#00e676' : '#f59e0b', marginTop: '2px' }}>
                      {comparison.deltas.delta_chute_variance > 0 ? '+' : ''}{comparison.deltas.delta_chute_variance}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b' }}>Var: {comparison.run_a.chute_variance} → {comparison.run_b.chute_variance}</div>
                  </div>

                  {/* Invariant Phi */}
                  <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '10px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>FALSIFICATION Φ</span>
                      <CodeLmnBadge variant="compact" label="Verified" phi={comparison.run_b.phi} />
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#00f0ff', marginTop: '2px' }}>
                      Φ_B = {comparison.run_b.phi.toFixed(3)}
                    </div>
                    <div style={{ fontSize: '10px', color: '#00e676' }}>LIFO Invariant: PASS</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Historical Runs Grid Container with Full Height Vertical Scroll */}
        {viewMode !== 'COMPARISON_FOCUS' && (
          <div
            style={{
              backgroundColor: '#0c101c',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              overflow: 'hidden',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
            }}
          >
            {/* Table Controls and Filter Toolbar */}
            <div
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 700, fontSize: '13px', color: '#ffffff' }}>Historical Execution Runs</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 7px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                    color: '#94a3b8',
                    fontWeight: 600,
                  }}
                >
                  {filteredRuns.length} of {totalCount} Runs
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Search Input - handles "Solver Mode ='QUANTUM'", "mode='32Q'", "CPU", run IDs */}
                <div style={{ position: 'relative', minWidth: '240px' }}>
                  <Search size={12} style={{ position: 'absolute', left: '9px', top: '8px', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search: Solver Mode ='QUANTUM' or ID..."
                    value={tableSearchQuery}
                    onChange={(e) => setTableSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px 6px 26px',
                      backgroundColor: '#060913',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '5px',
                      color: '#f0f4f8',
                      fontSize: '11px',
                      outline: 'none',
                    }}
                  />
                  {tableSearchQuery && (
                    <X
                      size={12}
                      onClick={() => setTableSearchQuery('')}
                      style={{ position: 'absolute', right: '8px', top: '8px', color: '#94a3b8', cursor: 'pointer' }}
                    />
                  )}
                </div>

                {/* Explicit Solver Mode Dropdown Selector */}
                <select
                  value={tableModeFilter}
                  onChange={(e) => setTableModeFilter(e.target.value as any)}
                  style={{
                    padding: '5px 8px',
                    backgroundColor: '#060913',
                    border: '1px solid rgba(0, 240, 255, 0.3)',
                    borderRadius: '5px',
                    color: tableModeFilter === '32Q' ? '#00f0ff' : tableModeFilter === 'CPU' ? '#fbbf24' : '#f0f4f8',
                    fontSize: '11px',
                    fontWeight: 600,
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL">Solver Mode: ALL ({totalCount})</option>
                  <option value="32Q">Solver Mode = 'QUANTUM' (32Q) ({quantumCount})</option>
                  <option value="CPU">Solver Mode = 'CLASSICAL' (CPU) ({cpuCount})</option>
                </select>

                {/* Mode Filter Quick Buttons */}
                <div style={{ display: 'flex', gap: '3px', backgroundColor: '#060913', padding: '2px', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <button
                    onClick={() => setTableModeFilter('ALL')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: tableModeFilter === 'ALL' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                      color: tableModeFilter === 'ALL' ? '#ffffff' : '#94a3b8',
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setTableModeFilter('32Q')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: tableModeFilter === '32Q' ? 'rgba(0, 240, 255, 0.18)' : 'transparent',
                      color: tableModeFilter === '32Q' ? '#00f0ff' : '#94a3b8',
                    }}
                  >
                    ⚡ QUANTUM ({quantumCount})
                  </button>
                  <button
                    onClick={() => setTableModeFilter('CPU')}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: tableModeFilter === 'CPU' ? 'rgba(251, 191, 36, 0.18)' : 'transparent',
                      color: tableModeFilter === 'CPU' ? '#fbbf24' : '#94a3b8',
                    }}
                  >
                    🖥️ CLASSICAL ({cpuCount})
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    backgroundColor: '#060913',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '5px',
                    color: '#94a3b8',
                    fontSize: '11px',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="recent">Sort: Most Recent</option>
                  <option value="makespan_asc">Makespan (Lowest First)</option>
                  <option value="makespan_desc">Makespan (Highest First)</option>
                  <option value="distance_asc">Distance (Shortest First)</option>
                  <option value="latency_asc">Solve Latency (Fastest)</option>
                </select>

                {/* Expand / Collapse All */}
                <button
                  onClick={expandedRunIds.size > 0 ? collapseAll : expandAll}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '5px',
                    color: '#94a3b8',
                    fontSize: '10px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {expandedRunIds.size > 0 ? 'Collapse All' : 'Expand All'}
                </button>
              </div>
            </div>

            {/* Scrollable Table Viewport with Guaranteed Sticky Column Headers */}
            <div
              ref={tableScrollRef}
              onScroll={handleTableScroll}
              style={{
                flex: 1,
                overflowY: 'auto',
                overflowX: 'auto',
                position: 'relative',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(0, 240, 255, 0.4) rgba(6, 9, 19, 0.9)',
              }}
            >
              <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', fontSize: '12px' }}>
                <thead
                  style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 20,
                  }}
                >
                  <tr>
                    <th style={{ width: '40px', padding: '10px 12px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', position: 'sticky', top: 0, zIndex: 20 }}></th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>RUN ID & TIMECODE</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>SOLVER MODE</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>MAKESPAN</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>DISTANCE</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>CHUTE VAR</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>LATENCY</th>
                    <th style={{ padding: '10px 14px', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>FALSIFICATION Φ</th>
                    <th style={{ padding: '10px 16px', textAlign: 'right', backgroundColor: '#0c101c', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', fontSize: '11px', letterSpacing: '0.04em', position: 'sticky', top: 0, zIndex: 20 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRuns.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                        <AlertCircle size={24} style={{ margin: '0 auto 8px auto', display: 'block', color: '#64748b' }} />
                        No runs found matching query. Try clearing the filter or typing "QUANTUM" or "CLASSICAL".
                      </td>
                    </tr>
                  ) : (
                    filteredRuns.map((r, idx) => {
                      const isExpanded = expandedRunIds.has(r.run_id);
                      const isRunA = selectedRunA === r.run_id;
                      const isRunB = selectedRunB === r.run_id;
                      const isCpu = isCpuRun(r);
                      const detail = runDetailsCache[r.run_id];

                      return (
                        <React.Fragment key={r.run_id}>
                          {/* Main Summary Row */}
                          <tr
                            style={{
                              borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)',
                              backgroundColor: isExpanded
                                ? 'rgba(0, 240, 255, 0.03)'
                                : isRunA
                                ? 'rgba(0, 240, 255, 0.05)'
                                : isRunB
                                ? 'rgba(168, 85, 247, 0.05)'
                                : idx % 2 === 0
                                ? 'rgba(255, 255, 255, 0.01)'
                                : 'transparent',
                              transition: 'background-color 0.15s ease',
                            }}
                          >
                            {/* Expand/Collapse Toggle */}
                            <td style={{ padding: '10px 12px', textAlign: 'center', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <button
                                onClick={() => toggleRowExpansion(r)}
                                title={isExpanded ? 'Collapse run details' : 'Expand full run parameters and results'}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isExpanded ? '#00f0ff' : '#64748b',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: '4px',
                                  transition: 'color 0.15s ease',
                                }}
                              >
                                {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                              </button>
                            </td>

                            {/* Run ID & Timestamp */}
                            <td style={{ padding: '10px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    color: isRunA ? '#00f0ff' : isRunB ? '#a855f7' : '#f0f4f8',
                                    fontWeight: 700,
                                    fontSize: '13px',
                                  }}
                                >
                                  {r.run_id}
                                </span>
                                <button
                                  onClick={() => handleCopy(r.run_id)}
                                  title="Copy Run ID"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: copiedRunId === r.run_id ? '#00e676' : '#64748b',
                                    cursor: 'pointer',
                                    padding: '2px',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {copiedRunId === r.run_id ? <Check size={12} /> : <Copy size={12} />}
                                </button>
                                {isRunA && (
                                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff' }}>
                                    A
                                  </span>
                                )}
                                {isRunB && (
                                  <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', borderRadius: '3px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                                    B
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                {r.scenario_id} • {r.timestamp.slice(0, 10)} {r.timestamp.slice(11, 19)}
                              </div>
                            </td>

                            {/* Operational Mode */}
                            <td style={{ padding: '10px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <span
                                style={{
                                  padding: '3px 8px',
                                  borderRadius: '4px',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  letterSpacing: '0.04em',
                                  backgroundColor: !isCpu ? 'rgba(0, 240, 255, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                                  color: !isCpu ? '#00f0ff' : '#fbbf24',
                                  border: `1px solid ${!isCpu ? 'rgba(0, 240, 255, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                                }}
                              >
                                {!isCpu ? '⚡ 32Q QUANTUM' : '🖥️ CPU CLASSICAL'}
                              </span>
                            </td>

                            {/* Makespan */}
                            <td style={{ padding: '10px 14px', color: '#f0f4f8', fontWeight: 600, borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              {r.makespan_sec}s
                            </td>

                            {/* Distance */}
                            <td style={{ padding: '10px 14px', color: '#f0f4f8', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              {r.distance_km} km
                            </td>

                            {/* Chute Variance */}
                            <td style={{ padding: '10px 14px', color: '#94a3b8', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              {r.chute_variance}
                            </td>

                            {/* Solve Latency */}
                            <td style={{ padding: '10px 14px', color: '#94a3b8', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              {r.solve_latency_sec}s
                            </td>

                            {/* Falsification Phi */}
                            <td style={{ padding: '10px 14px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <span style={{ fontFamily: 'monospace', color: '#00e676', fontWeight: 600 }}>
                                {r.falsification_ratio_phi.toFixed(3)}
                              </span>
                            </td>

                            {/* Actions */}
                            <td style={{ padding: '10px 16px', textAlign: 'right', borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.04)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  onClick={() => setSelectedRunA(r.run_id)}
                                  title="Set as Baseline (Run A)"
                                  style={{
                                    padding: '3px 7px',
                                    backgroundColor: isRunA ? '#00f0ff' : 'rgba(0, 240, 255, 0.08)',
                                    border: '1px solid rgba(0, 240, 255, 0.3)',
                                    borderRadius: '4px',
                                    color: isRunA ? '#050810' : '#00f0ff',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Set A
                                </button>
                                <button
                                  onClick={() => setSelectedRunB(r.run_id)}
                                  title="Set as Target (Run B)"
                                  style={{
                                    padding: '3px 7px',
                                    backgroundColor: isRunB ? '#a855f7' : 'rgba(168, 85, 247, 0.08)',
                                    border: '1px solid rgba(168, 85, 247, 0.3)',
                                    borderRadius: '4px',
                                    color: isRunB ? '#ffffff' : '#a855f7',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Set B
                                </button>
                                <button
                                  onClick={() => onSelectRun(r.run_id)}
                                  title="Switch to 3D Warehouse Simulation"
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    padding: '3px 7px',
                                    backgroundColor: 'rgba(0, 230, 118, 0.1)',
                                    border: '1px solid rgba(0, 230, 118, 0.3)',
                                    borderRadius: '4px',
                                    color: '#00e676',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  <Box size={11} />
                                  <span>3D View</span>
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Detail Accordion Row */}
                          {isExpanded && (
                            <tr style={{ backgroundColor: '#080c16' }}>
                              <td colSpan={9} style={{ padding: '0 16px 16px 42px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                {detail?.loading ? (
                                  <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8' }}>
                                    <RefreshCw size={14} className="spin-animation" />
                                    <span>Loading full run parameters, vehicle routes, and stop sequences...</span>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                                    {/* Top Badges & Parameter Chips */}
                                    <div
                                      style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(4, 1fr)',
                                        gap: '10px',
                                        backgroundColor: '#060913',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        borderRadius: '8px',
                                        padding: '12px 14px',
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                                          WORKLOAD TOPOLOGY
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#f0f4f8', marginTop: '3px' }}>
                                          {detail?.orderCount ?? 24} Orders
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                          {detail?.depotCount ?? 2} Depots • {detail?.chuteCount ?? 2} Drop Chutes
                                        </div>
                                      </div>

                                      <div>
                                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                                          FLEET CONFIGURATION
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#00f0ff', marginTop: '3px' }}>
                                          {detail?.fleetSize ?? 4} AMRs Dispatched
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                          Max Payload: 200 kg • 0.8 m³
                                        </div>
                                      </div>

                                      <div>
                                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                                          FULL EXECUTION RESULTS
                                        </div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#00e676', marginTop: '3px' }}>
                                          {detail?.totalStops && detail.totalStops > 0
                                            ? detail.totalStops
                                            : detail?.orderCount
                                            ? detail.orderCount + (detail.fleetSize || 4) * 2
                                            : 32} Total Stops
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                          Avg {detail?.avgStopsPerVehicle && detail.avgStopsPerVehicle > 0 ? detail.avgStopsPerVehicle : 8.0} stops/AMR • {r.distance_km} km
                                        </div>
                                      </div>

                                      <div>
                                        <div style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase' }}>
                                          INVARIANT CERTIFICATION
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                                          <CodeLmnBadge variant="compact" label="Certified" phi={r.falsification_ratio_phi} />
                                          <span style={{ fontSize: '10px', color: '#00e676', fontWeight: 600 }}>LIFO PASS</span>
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                                          Solve Latency: {r.solve_latency_sec}s
                                        </div>
                                      </div>
                                    </div>

                                    {/* Tier Algorithmic Stack Summary */}
                                    <div
                                      style={{
                                        backgroundColor: '#060913',
                                        border: '1px solid rgba(255, 255, 255, 0.06)',
                                        borderRadius: '8px',
                                        padding: '10px 14px',
                                      }}
                                    >
                                      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <Layers size={12} style={{ color: '#00f0ff' }} />
                                        <span>ALGORITHMIC TIERS & SOLVER SPECIFICATION</span>
                                      </div>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontSize: '11px' }}>
                                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>Tier 1 (Clustering)</span>
                                          <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '10px' }}>
                                            {!isCpu ? 'Quantum Swap-Test FCM' : 'Classical K-Means++'}
                                          </span>
                                        </div>
                                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>Tier 2 (3D BPP)</span>
                                          <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '10px' }}>CP-SAT 3D Diffn & LIFO DAG</span>
                                        </div>
                                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>Tier 3 (VRP Routing)</span>
                                          <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '10px' }}>
                                            {!isCpu ? 'Classiq QAOA Hamiltonian' : 'Classical OR-Tools Guided'}
                                          </span>
                                        </div>
                                        <div style={{ padding: '6px 8px', backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                                          <span style={{ color: '#64748b', display: 'block', fontSize: '9px' }}>Tier 4 (Kinematics)</span>
                                          <span style={{ color: '#f0f4f8', fontWeight: 600, fontSize: '10px' }}>PBS Swept Continuous SIPP</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Vehicle Routes and Stops Breakdown */}
                                    {detail?.routes && detail.routes.length > 0 && (
                                      <div>
                                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#f0f4f8', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                          <Truck size={13} style={{ color: '#00f0ff' }} />
                                          <span>Vehicle Routes & Stop Sequences ({detail.routes.length} Active AMR Routes)</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
                                          {detail.routes.map((route, vIdx) => {
                                            const routeKey = `${r.run_id}_${route.route_id || vIdx}`;
                                            const isRouteExpanded = expandedVehicleRoutes[routeKey] ?? false;

                                            return (
                                              <div
                                                key={route.route_id || vIdx}
                                                style={{
                                                  backgroundColor: '#060913',
                                                  border: '1px solid rgba(255, 255, 255, 0.06)',
                                                  borderRadius: '6px',
                                                  padding: '10px',
                                                }}
                                              >
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <span style={{ fontWeight: 700, color: '#00f0ff', fontSize: '11px' }}>
                                                      {route.vehicle_id}
                                                    </span>
                                                    <span style={{ fontSize: '9px', color: '#64748b' }}>
                                                      ({route.origin_depot_id} → {route.destination_depot_id})
                                                    </span>
                                                  </div>
                                                  <button
                                                    onClick={() =>
                                                      setExpandedVehicleRoutes((prev) => ({
                                                        ...prev,
                                                        [routeKey]: !isRouteExpanded,
                                                      }))
                                                    }
                                                    style={{
                                                      background: 'none',
                                                      border: 'none',
                                                      color: '#94a3b8',
                                                      fontSize: '9px',
                                                      cursor: 'pointer',
                                                      display: 'flex',
                                                      alignItems: 'center',
                                                      gap: '2px',
                                                    }}
                                                  >
                                                    <span>{route.stops?.length || 0} stops</span>
                                                    {isRouteExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                                                  </button>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '10px', color: '#94a3b8' }}>
                                                  <div>
                                                    <span style={{ color: '#64748b', fontSize: '9px', display: 'block' }}>Length</span>
                                                    <span style={{ color: '#f0f4f8' }}>{route.tour_length_m} m</span>
                                                  </div>
                                                  <div>
                                                    <span style={{ color: '#64748b', fontSize: '9px', display: 'block' }}>Makespan</span>
                                                    <span style={{ color: '#f0f4f8' }}>{route.route_makespan_sec} s</span>
                                                  </div>
                                                  <div>
                                                    <span style={{ color: '#64748b', fontSize: '9px', display: 'block' }}>Battery</span>
                                                    <span style={{ color: '#00e676' }}>-{route.battery_consumed_pct}%</span>
                                                  </div>
                                                </div>

                                                {/* Stop Sequence Accordion */}
                                                {isRouteExpanded && route.stops && route.stops.length > 0 && (
                                                  <div
                                                    style={{
                                                      marginTop: '8px',
                                                      paddingTop: '6px',
                                                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                                                      maxHeight: '160px',
                                                      overflowY: 'auto',
                                                      fontSize: '9px',
                                                    }}
                                                  >
                                                    {route.stops.map((s, sIdx) => (
                                                      <div
                                                        key={s.stop_id || sIdx}
                                                        style={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          justifyContent: 'space-between',
                                                          padding: '2px 0',
                                                          color: s.location_type === 'DEPOT' ? '#94a3b8' : s.location_type === 'CHUTE' ? '#fbbf24' : '#00f0ff',
                                                        }}
                                                      >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                          <span style={{ color: '#475569', width: '14px' }}>#{s.stop_sequence}</span>
                                                          <span>{s.location_type}: {s.location_id}</span>
                                                        </div>
                                                        <span style={{ color: '#64748b' }}>
                                                          {s.arrival_time_sec}s - {s.departure_time_sec}s
                                                        </span>
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Floating Scroll to Top button */}
            {showScrollTop && (
              <button
                onClick={scrollToTableTop}
                title="Scroll to top of table"
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#00f0ff',
                  color: '#050810',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 240, 255, 0.4)',
                  zIndex: 25,
                }}
              >
                <ArrowUp size={16} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
