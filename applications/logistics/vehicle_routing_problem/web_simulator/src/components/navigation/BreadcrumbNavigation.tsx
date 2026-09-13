import React, { useState, useRef, useEffect } from 'react';
import {
  Building2,
  Boxes,
  Database,
  Sparkles,
  Cpu,
  Box,
  MapPin,
  Layers,
  Atom,
  BarChart3,
  GitCompare,
  Terminal,
  ChevronRight,
  ChevronDown,
  X,
  RotateCcw,
  Sliders,
  ExternalLink,
  Truck,
  Activity,
  CheckCircle2,
  Compass,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { ArchetypeMeta, RunSummaryDTO } from '../../services/api';
import { trackButtonClick, trackTabChange } from '../../utils/analytics';

export interface BreadcrumbNavigationProps {
  facilityId?: string;
  facilityName?: string;
  archetypes: ArchetypeMeta[];
  selectedArchetype: string;
  onSelectArchetype: (key: string) => void;
  currentScenarioId: string;
  numOrders: number;
  numVehicles: number;
  seed: number;
  runs: RunSummaryDTO[];
  currentRunId: string;
  operationalMode: 'QUANTUM' | 'CLASSICAL';
  onSelectRun: (runId: string) => void;
  onReRunClick?: () => void;
  activeTab: '3d-sim' | '2d-route-map' | 'dataset' | 'tiers' | 'quantum' | 'graphs' | 'comparison' | 'telemetry';
  onSelectTab: (tab: '3d-sim' | '2d-route-map' | 'dataset' | 'tiers' | 'quantum' | 'graphs' | 'comparison' | 'telemetry') => void;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  onClearEntity: () => void;
  onCenterEntity?: (id: string) => void;
  onLocateInSidebar?: (pillarId: string, itemId?: string) => void;
  makespan?: number;
  distance?: number;
  onOpenConfig?: () => void;
  onOpenPDF?: (profile?: any) => void;
  selectedTier?: string;
  onSelectTier?: (tierKey: string) => void;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null;
  onSetCameraPreset?: (preset: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus') => void;
  reportsRepoMode?: 'hidden' | 'minimized' | 'expanded';
  onOpenReportsStudio?: () => void;
  onOpenOrdersDepotGenerator?: (paramKey?: string) => void;
  onSelectEntity?: (entity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any }) => void;
  currentStep?: any;
}

const FACILITIES = [
  {
    id: 'WMS-IND-01',
    name: 'Berlin Mega-Hub',
    badge: 'Primary Automated Site',
    grid: '150m × 100m Grid',
    racks: '12 Aisles (480 Bins)',
    chutes: '4 Chutes (C1–C4)',
    fleet: '4 Active AMRs',
  },
  {
    id: 'WMS-FRA-02',
    name: 'Frankfurt Air Cargo',
    badge: 'High-Throughput Cross-Dock',
    grid: '200m × 120m Grid',
    racks: '18 Aisles (720 Bins)',
    chutes: '6 Chutes (C1–C6)',
    fleet: '6 Active AMRs',
  },
  {
    id: 'WMS-MUC-03',
    name: 'Munich JIT Buffer',
    badge: 'Automotive JIS Hub',
    grid: '120m × 80m Grid',
    racks: '8 Aisles (320 Bins)',
    chutes: '3 Chutes (C1–C3)',
    fleet: '3 Heavy AMRs',
  },
];

const STUDIOS = [
  { id: '3d-sim', label: '3D Digital Twin', pillarId: 'pillar-1', domain: 'Operations', icon: <Box size={13} />, shortcut: 'Ctrl+1' },
  { id: '2d-route-map', label: '2D Route Map', pillarId: 'pillar-1', domain: 'Operations', icon: <MapPin size={13} />, shortcut: 'Ctrl+2' },
  { id: 'telemetry', label: 'Live Telemetry', pillarId: 'pillar-1', domain: 'Operations', icon: <Terminal size={13} />, shortcut: 'Ctrl+8' },
  { id: 'dataset', label: 'Dataset (CRUD)', pillarId: 'pillar-2', domain: 'Optimization', icon: <Database size={13} />, shortcut: 'Ctrl+3' },
  { id: 'tiers', label: '4-Tier Pipeline', pillarId: 'pillar-2', domain: 'Optimization', icon: <Layers size={13} />, shortcut: 'Ctrl+4' },
  { id: 'quantum', label: 'Classiq Quantum', pillarId: 'pillar-3', domain: 'Optimization', icon: <Atom size={13} />, shortcut: 'Ctrl+5' },
  { id: 'graphs', label: 'Analytics Graphs', pillarId: 'pillar-4', domain: 'Auditing', icon: <BarChart3 size={13} />, shortcut: 'Ctrl+6' },
  { id: 'comparison', label: 'Run Comparison', pillarId: 'pillar-4', domain: 'Auditing', icon: <GitCompare size={13} />, shortcut: 'Ctrl+7' },
] as const;

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  facilityId = 'WMS-IND-01',
  facilityName = 'Berlin Mega-Hub',
  archetypes,
  selectedArchetype,
  onSelectArchetype,
  currentScenarioId,
  numOrders,
  numVehicles,
  seed,
  runs,
  currentRunId,
  operationalMode,
  onSelectRun,
  onReRunClick,
  activeTab,
  onSelectTab,
  selectedEntity,
  onClearEntity,
  onCenterEntity,
  onLocateInSidebar,
  makespan = 949.3,
  distance = 3.71,
  onOpenConfig,
  onOpenPDF,
  selectedTier,
  onSelectTier,
  cameraPreset,
  onSetCameraPreset,
  reportsRepoMode,
  onOpenReportsStudio,
  onOpenOrdersDepotGenerator,
  onSelectEntity,
  currentStep,
}) => {
  const [openDropdown, setOpenDropdown] = useState<
    'facility' | 'archetype' | 'scenario' | 'run' | 'pillar' | 'menu' | 'subgroup' | 'leaf' | null
  >(null);
  const [activeFacility, setActiveFacility] = useState(facilityId);
  const [runSearchQuery, setRunSearchQuery] = useState('');
  const [runModeFilter, setRunModeFilter] = useState<'ALL' | 'QUANTUM' | 'CLASSICAL'>('ALL');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const activeArchetypeMeta = archetypes.find((a) => a.archetype_key === selectedArchetype);
  const activeArchetypeName = activeArchetypeMeta?.title || selectedArchetype.replace(/_/g, ' ');
  const activeStudio = STUDIOS.find((s) => s.id === activeTab) || STUDIOS[0];
  const activeFacilityMeta = FACILITIES.find((f) => f.id === activeFacility) || FACILITIES[0];

  const effectiveRuns = React.useMemo(() => {
    const list = [...(runs || [])];
    if (currentRunId && !list.some((r) => r.run_id === currentRunId)) {
      list.unshift({
        run_id: currentRunId,
        scenario_id: currentScenarioId || 'SCEN-7D42F06D',
        wave_id: 'WAVE-ACTIVE',
        operational_mode: operationalMode,
        mode: operationalMode === 'QUANTUM' ? '32Q' : 'CPU',
        makespan_sec: makespan || 949.3,
        distance_km: distance || 3.71,
        chute_variance: 0.45,
        solve_latency_sec: 0.1,
        falsification_ratio_phi: 0.88,
        is_falsified: false,
        timestamp: new Date().toISOString(),
      });
    }
    return list;
  }, [runs, currentRunId, operationalMode, currentScenarioId, makespan, distance]);

  const filteredRuns = effectiveRuns
    .filter((r) => {
      if (runModeFilter === 'ALL') return true;
      const opMode = (r.operational_mode || '').toUpperCase();
      const runMode = (r.mode || '').toUpperCase();
      if (runModeFilter === 'QUANTUM') {
        return opMode === 'QUANTUM' || runMode.includes('32Q') || runMode.includes('QUANTUM');
      }
      if (runModeFilter === 'CLASSICAL') {
        return opMode === 'CLASSICAL' || runMode.includes('CPU') || runMode.includes('CLASSICAL');
      }
      return true;
    })
    .filter((r) => {
      if (!runSearchQuery.trim()) return true;
      const q = runSearchQuery.toLowerCase();
      return r.run_id.toLowerCase().includes(q) || (r.scenario_id && r.scenario_id.toLowerCase().includes(q));
    });

  return (
    <nav
      ref={containerRef}
      aria-label="Breadcrumb Navigation"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        fontSize: '11px',
        fontWeight: 500,
        color: '#94a3b8',
        flexWrap: 'nowrap',
        position: 'relative',
        userSelect: 'none',
        overflow: 'visible',
      }}
    >
      {/* Node 1: Facility Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'facility' ? null : 'facility')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'facility' ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'facility' ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'facility' ? '#00f0ff' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`Facility: ${activeFacilityMeta.name} (${activeFacility})`}
        >
          <Building2 size={12} color="#00f0ff" />
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{activeFacility}</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
              display: 'inline-block',
            }}
          />
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'facility' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '280px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.05em', marginBottom: '8px' }}>
              SELECT LOGISTICS FACILITY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {FACILITIES.map((fac) => {
                const isCurrent = fac.id === activeFacility;
                return (
                  <div
                    key={fac.id}
                    onClick={() => {
                      setActiveFacility(fac.id);
                      setOpenDropdown(null);
                      trackButtonClick('Select_Facility_Breadcrumb', 'Breadcrumbs', { facilityId: fac.id });
                    }}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      backgroundColor: isCurrent ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: isCurrent ? '#00f0ff' : '#f8fafc', fontSize: '12px' }}>
                        {fac.id} • {fac.name}
                      </span>
                      {isCurrent && <CheckCircle2 size={12} color="#00f0ff" />}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px' }}>
                      {fac.grid} | {fac.racks} | {fac.chutes}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '8px', paddingTop: '6px' }}>
              <button
                onClick={() => {
                  onLocateInSidebar?.('pillar-1', 'overview-envelope');
                  setOpenDropdown(null);
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 0',
                }}
              >
                <Compass size={11} /> Reset 3D Camera on Facility Envelope
              </button>
            </div>
          </div>
        )}
      </div>

      <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />

      {/* Node 2: Archetype Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'archetype' ? null : 'archetype')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'archetype' ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'archetype' ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'archetype' ? '#fbbf24' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            maxWidth: '240px',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
          title={`Active Archetype: ${activeArchetypeName}`}
        >
          <Boxes size={12} color="#fbbf24" />
          <span style={{ fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {activeArchetypeName}
          </span>
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'archetype' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '320px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(251, 191, 36, 0.15)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', marginBottom: '8px' }}>
              WAREHOUSE ARCHETYPE (5 MATRIX)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '280px', overflowY: 'auto' }}>
              {archetypes.map((arch) => {
                const isCurrent = arch.archetype_key === selectedArchetype;
                return (
                  <div
                    key={arch.archetype_key}
                    onClick={() => {
                      onSelectArchetype(arch.archetype_key);
                      setOpenDropdown(null);
                      trackButtonClick('Select_Archetype_Breadcrumb', 'Breadcrumbs', { archetype: arch.archetype_key });
                    }}
                    style={{
                      padding: '7px 9px',
                      borderRadius: '6px',
                      backgroundColor: isCurrent ? 'rgba(251, 191, 36, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: 600, color: isCurrent ? '#fbbf24' : '#f8fafc', fontSize: '12px' }}>
                        {arch.title || arch.archetype_key}
                      </span>
                      {isCurrent && <CheckCircle2 size={12} color="#fbbf24" />}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                      {arch.description || arch.stress_target || 'Standard scenario'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />

      {/* Node 3: Scenario Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'scenario' ? null : 'scenario')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'scenario' ? 'rgba(168, 85, 247, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'scenario' ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'scenario' ? '#c084fc' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`Scenario: ${currentScenarioId} (Orders: ${numOrders}, Fleet: ${numVehicles})`}
        >
          <Database size={12} color="#c084fc" />
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{currentScenarioId}</span>
          <span style={{ fontSize: '9px', opacity: 0.7 }}>({numOrders}O/{numVehicles}V)</span>
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'scenario' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '280px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(168, 85, 247, 0.15)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#c084fc', letterSpacing: '0.05em', marginBottom: '8px' }}>
              SCENARIO WORKLOAD METADATA
            </div>
            <div style={{ fontSize: '11px', color: '#e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div><strong style={{ color: '#94a3b8' }}>ID:</strong> {currentScenarioId}</div>
              <div><strong style={{ color: '#94a3b8' }}>Orders Pool:</strong> {numOrders} Orders (3D BPP Cuboids)</div>
              <div><strong style={{ color: '#94a3b8' }}>Active AMRs:</strong> {numVehicles} AMR Transporters</div>
              <div><strong style={{ color: '#94a3b8' }}>Generation Seed:</strong> {seed}</div>
            </div>
            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '8px', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <button
                onClick={() => {
                  onSelectTab('dataset');
                  setOpenDropdown(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#c084fc',
                  fontSize: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 0',
                }}
              >
                <Database size={11} /> Open Dataset &amp; Mock Data Studio (CRUD)
              </button>
              {onOpenConfig && (
                <button
                  onClick={() => {
                    onOpenConfig();
                    setOpenDropdown(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 0',
                  }}
                >
                  <Sliders size={11} /> Customize 36 Engineering Parameters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />

      {/* Node 4: Run & Engine Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'run' ? null : 'run')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'run' ? 'rgba(52, 211, 153, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'run' ? '1px solid rgba(52, 211, 153, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'run' ? '#34d399' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`Active Run: ${currentRunId || 'RUN-ACTIVE'}`}
        >
          {operationalMode === 'QUANTUM' ? <Sparkles size={12} color="#00f0ff" /> : <Cpu size={12} color="#fbbf24" />}
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
            {currentRunId ? currentRunId.substring(0, 12) : 'RUN-ACTIVE'}
          </span>
          <span
            style={{
              fontSize: '9px',
              padding: '1px 5px',
              borderRadius: '4px',
              backgroundColor: operationalMode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(251, 191, 36, 0.18)',
              color: operationalMode === 'QUANTUM' ? '#00f0ff' : '#fbbf24',
              fontWeight: 700,
            }}
          >
            {operationalMode === 'QUANTUM' ? '32Q' : 'CPU'}
          </span>
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'run' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '360px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(52, 211, 153, 0.15)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#34d399', letterSpacing: '0.05em' }}>
                HISTORICAL RUN LEDGER ({filteredRuns.length})
              </span>
              <div style={{ display: 'flex', gap: '3px' }}>
                {(['ALL', 'QUANTUM', 'CLASSICAL'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setRunModeFilter(m)}
                    style={{
                      fontSize: '9px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      border: 'none',
                      backgroundColor: runModeFilter === m ? 'rgba(52, 211, 153, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                      color: runModeFilter === m ? '#34d399' : '#94a3b8',
                      cursor: 'pointer',
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              placeholder="Search run ID or scenario..."
              value={runSearchQuery}
              onChange={(e) => setRunSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '4px 8px',
                fontSize: '11px',
                borderRadius: '4px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                marginBottom: '8px',
                boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
              {filteredRuns.length === 0 ? (
                <div style={{ padding: '14px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                  <div>No runs matching mode: <strong style={{ color: '#34d399' }}>{runModeFilter}</strong></div>
                  {runModeFilter !== 'ALL' && (
                    <button
                      onClick={() => setRunModeFilter('ALL')}
                      style={{
                        marginTop: '8px',
                        fontSize: '10px',
                        padding: '3px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(52, 211, 153, 0.4)',
                        background: 'rgba(52, 211, 153, 0.15)',
                        color: '#34d399',
                        cursor: 'pointer',
                      }}
                    >
                      Show All Runs
                    </button>
                  )}
                </div>
              ) : (
                filteredRuns.map((r) => {
                  const isCurrent = r.run_id === currentRunId;
                  return (
                    <div
                      key={r.run_id}
                      onClick={() => {
                        onSelectRun(r.run_id);
                        setOpenDropdown(null);
                      }}
                      style={{
                        padding: '6px 8px',
                        borderRadius: '5px',
                        backgroundColor: isCurrent ? 'rgba(52, 211, 153, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCurrent ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: isCurrent ? '#34d399' : '#f1f5f9' }}>
                          {r.run_id}
                        </div>
                        <div style={{ fontSize: '9px', color: '#94a3b8' }}>
                          {r.operational_mode} • {r.makespan_sec.toFixed(1)}s • {r.distance_km.toFixed(2)}km
                        </div>
                      </div>
                      {isCurrent && <CheckCircle2 size={12} color="#34d399" />}
                    </div>
                  );
                })
              )}
            </div>

            {onReRunClick && (
              <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginTop: '8px', paddingTop: '6px' }}>
                <button
                  onClick={() => {
                    onReRunClick();
                    setOpenDropdown(null);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#34d399',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 0',
                  }}
                >
                  <RotateCcw size={11} /> Re-run Wave ({operationalMode === 'QUANTUM' ? '32Q Quantum FCM' : 'CPU Classical HGS-ADC'})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />

      {/* Node 3: Sidebar Pillar Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'pillar' ? null : 'pillar')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'pillar' ? 'rgba(251, 191, 36, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'pillar' ? '1px solid rgba(251, 191, 36, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'pillar' ? '#fbbf24' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`Pillar: ${currentStep?.pillarTitle || 'Workload & Solvers'}`}
        >
          <Layers size={12} color={currentStep?.pillarColor || '#fbbf24'} />
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
            {currentStep?.pillarTitle?.replace(' & Operations', '') || 'Pillar'}
          </span>
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'pillar' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '290px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(251, 191, 36, 0.15)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.05em', marginBottom: '8px' }}>
              SELECT SIDEBAR NAVIGATION PILLAR (6 PILLARS)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {[
                { id: 'pillar-1', title: 'Digital Twin & Fleet Operations', tab: '3d-sim' as const, color: '#00f0ff' },
                { id: 'pillar-2', title: 'Workload, Scenarios & Solvers', tab: 'dataset' as const, color: '#fbbf24' },
                { id: 'pillar-3', title: 'Classiq Quantum Co-Processor', tab: 'quantum' as const, color: '#c084fc' },
                { id: 'pillar-4', title: 'Analytics, Auditing & Reports', tab: 'graphs' as const, color: '#34d399' },
                { id: 'pillar-reports-studio', title: 'Reports Manager Studio', action: 'reports', color: '#10b981' },
                { id: 'pillar-5', title: 'Knowledge, Theory & Developer Tools', tab: 'tiers' as const, color: '#60a5fa' },
              ].map((p) => {
                const isCurrent = currentStep?.pillarId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      if (p.action === 'reports' && onOpenReportsStudio) {
                        onOpenReportsStudio();
                      } else if (p.tab) {
                        onSelectTab(p.tab);
                      }
                      setOpenDropdown(null);
                    }}
                    style={{
                      padding: '7px 9px',
                      borderRadius: '5px',
                      backgroundColor: isCurrent ? `${p.color}20` : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? `1px solid ${p.color}60` : '1px solid rgba(255, 255, 255, 0.06)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
                      <span style={{ fontSize: '11px', fontWeight: 600, color: isCurrent ? p.color : '#f1f5f9' }}>
                        {p.title}
                      </span>
                    </div>
                    {isCurrent && <CheckCircle2 size={12} color={p.color} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />

      {/* Node 4: Menu Item Node */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpenDropdown(openDropdown === 'menu' ? null : 'menu')}
          className="breadcrumb-node-btn"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 7px',
            borderRadius: '5px',
            backgroundColor: openDropdown === 'menu' ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.04)',
            border: openDropdown === 'menu' ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: openDropdown === 'menu' ? '#00f0ff' : '#cbd5e1',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={`Menu Item: ${currentStep?.menuItemLabel || activeStudio.label}`}
        >
          {activeStudio.icon}
          <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
            {currentStep?.menuItemLabel || activeStudio.label}
          </span>
          <ChevronDown size={10} style={{ opacity: 0.6 }} />
        </button>

        {openDropdown === 'menu' && (
          <div
            className="breadcrumb-popover glass-panel"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              zIndex: 9999,
              width: '280px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: 'rgba(7, 15, 30, 0.96)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 15px rgba(0, 240, 255, 0.15)',
            }}
          >
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.05em', marginBottom: '8px' }}>
              SWITCH WORKSPACE STUDIO / MENU
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '4px' }}>
              {STUDIOS.map((s) => {
                const isCurrent = s.id === activeTab;
                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      onSelectTab(s.id);
                      setOpenDropdown(null);
                      trackTabChange(activeTab, s.id, { label: s.label });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 8px',
                      borderRadius: '5px',
                      backgroundColor: isCurrent ? 'rgba(0, 240, 255, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                      border: isCurrent ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255, 255, 255, 0.05)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span style={{ color: isCurrent ? '#00f0ff' : '#94a3b8' }}>{s.icon}</span>
                      <span style={{ fontWeight: 600, color: isCurrent ? '#00f0ff' : '#f1f5f9', fontSize: '11px' }}>
                        {s.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '9px', color: '#64748b' }}>{s.shortcut}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Node 5: Sub-Item / Group Node (When present e.g. Tier 1-4, Camera, Fleet) */}
      {currentStep?.subGroupLabel && currentStep.subGroupLabel !== currentStep.menuItemLabel && (
        <>
          <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setOpenDropdown(openDropdown === 'subgroup' ? null : 'subgroup')}
              className="breadcrumb-node-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 7px',
                borderRadius: '5px',
                backgroundColor: openDropdown === 'subgroup' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                border: openDropdown === 'subgroup' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.08)',
                color: '#38bdf8',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Sub-Group: ${currentStep.subGroupLabel}`}
            >
              <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                {currentStep.subGroupLabel.length > 28
                  ? `${currentStep.subGroupLabel.substring(0, 26)}...`
                  : currentStep.subGroupLabel}
              </span>
              <ChevronDown size={10} style={{ opacity: 0.6 }} />
            </button>

            {openDropdown === 'subgroup' && (
              <div
                className="breadcrumb-popover glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  left: 0,
                  zIndex: 9999,
                  width: '300px',
                  padding: '10px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(7, 15, 30, 0.96)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  SELECT SUB-FEATURE / LEVEL
                </div>
                {activeTab === 'tiers' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { id: 'tier1', label: 'Tier 1: Quantum FCM Clustering', badge: 'Rank 1Q' },
                      { id: 'tier2', label: 'Tier 2: CP-SAT 3D Bin Packing', badge: 'LIFO DAG' },
                      { id: 'tier3', label: 'Tier 3: Classiq QAOA Subtours', badge: '32Q' },
                      { id: 'tier4', label: 'Tier 4: Continuous SIPP MAPF', badge: 'Swept 3D' },
                    ].map((t) => (
                      <div
                        key={t.id}
                        onClick={() => {
                          onSelectTier?.(t.id);
                          setOpenDropdown(null);
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '5px',
                          backgroundColor: selectedTier === t.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: selectedTier === t.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '11px',
                          color: selectedTier === t.id ? '#38bdf8' : '#f1f5f9',
                        }}
                      >
                        <span>{t.label}</span>
                        <span style={{ fontSize: '9px', background: 'rgba(56, 189, 248, 0.2)', padding: '1px 4px', borderRadius: '3px' }}>
                          {t.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : activeTab === '3d-sim' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {[
                      { id: 'overview', label: 'Facility Overview (150m×100m)' },
                      { id: 'top', label: 'Top-Down Orthographic' },
                      { id: 'isometric', label: 'Isometric 45° Cyber' },
                      { id: 'follow', label: 'Floor Follower (Cab Ride)' },
                      { id: 'chute-focus', label: 'Chute Array Focus (C1–C4)' },
                    ].map((cam) => (
                      <div
                        key={cam.id}
                        onClick={() => {
                          onSetCameraPreset?.(cam.id as any);
                          setOpenDropdown(null);
                        }}
                        style={{
                          padding: '6px 8px',
                          borderRadius: '5px',
                          backgroundColor: cameraPreset === cam.id ? 'rgba(56, 189, 248, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                          border: cameraPreset === cam.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.06)',
                          cursor: 'pointer',
                          fontSize: '11px',
                          color: cameraPreset === cam.id ? '#38bdf8' : '#f1f5f9',
                        }}
                      >
                        {cam.label}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: '11px', color: '#94a3b8', padding: '6px' }}>
                    {currentStep.subGroupLabel} Active
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Node 6: Contextual Entity / Leaf Node (Active AMR, Chute, Depot) */}
      {(selectedEntity || currentStep?.leafLabel) && (
        <>
          <ChevronRight size={12} color="#00f0ff" style={{ opacity: 0.6, flexShrink: 0 }} />
          <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 7px',
                borderRadius: '5px',
                backgroundColor: 'rgba(0, 240, 255, 0.18)',
                border: '1px solid rgba(0, 240, 255, 0.6)',
                boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
                color: '#00f0ff',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <Truck size={12} />
              <span>{selectedEntity?.id || currentStep?.leafLabel}</span>
              {selectedEntity?.telemetry?.soc && (
                <span style={{ fontSize: '9px', opacity: 0.8 }}>
                  ({selectedEntity.telemetry.soc}% SoC)
                </span>
              )}
              {selectedEntity && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearEntity();
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00f0ff',
                    cursor: 'pointer',
                    padding: '0 2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Dismiss Entity Focus (Esc)"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </nav>
  );
};
