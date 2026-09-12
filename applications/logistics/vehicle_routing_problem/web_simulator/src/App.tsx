import React, { useState, useEffect } from 'react';
import { TopbarHUD } from './components/TopbarHUD';
import { ThreeWarehouseCanvas } from './components/ThreeWarehouseCanvas';
import { DatasetStudio } from './components/DatasetStudio';
import { TiersAndAlgorithmsStudio } from './components/TiersAndAlgorithmsStudio';
import { QuantumStudio } from './components/QuantumStudio';
import { GraphStudio } from './components/GraphStudio';
import { RunComparisonStudio } from './components/RunComparisonStudio';
import { TelemetryConsole } from './components/TelemetryConsole';
import { PreRequestConfigDrawer } from './components/PreRequestConfigDrawer';
import { QuickControlsPanel } from './components/QuickControlsPanel';
import { NarrativeExplainerPane } from './components/NarrativeExplainerPane';
import { QuantumUtilizationPanel } from './components/QuantumUtilizationPanel';
import { PDFModal } from './components/PDFModal';
import { ConceptExplanationModal } from './components/ConceptExplanationModal';
import {
  dispatchWave,
  fetchSchedule,
  fetchArchetypes,
  fetchRuns,
  CONFIG_LIMITS,
  ScheduleDetails,
  ArchetypeMeta,
  RunSummaryDTO,
  WaveExecutionResponse,
} from './services/api';
import { RouteMap2DStudio } from './components/RouteMap2DStudio';
import {
  Box,
  MapPin,
  Database,
  Layers,
  Atom,
  BarChart3,
  GitCompare,
  Terminal,
  Sliders,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Settings2,
} from 'lucide-react';

export const App: React.FC = () => {
  // Navigation: 8 Workspace Tabs
  const [activeTab, setActiveTab] = useState<
    '3d-sim' | '2d-route-map' | 'dataset' | 'tiers' | 'quantum' | 'graphs' | 'comparison' | 'telemetry'
  >('3d-sim');
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isQuantumPanelOpen, setIsQuantumPanelOpen] = useState(false);

  // Operational State
  const [mode, setMode] = useState<'QUANTUM' | 'CLASSICAL'>('QUANTUM');
  const [archetypes, setArchetypes] = useState<ArchetypeMeta[]>([]);
  const [selectedArchetype, setSelectedArchetype] = useState('MEGA_FULFILLMENT_E_COMMERCE');
  const [currentScenarioId, setCurrentScenarioId] = useState('SCENARIO-AUTO-42');
  const [numOrders, setNumOrders] = useState(20);
  const [numVehicles, setNumVehicles] = useState(4);
  const [seed, setSeed] = useState(42);

  // Active Tier Algorithms & Parameters
  const [activeTiers, setActiveTiers] = useState<Record<string, string>>({
    tier1: 'RANK_1Q_QUANTUM_FCM',
    tier2: 'RANK_1_CPSAT_MISOCP',
    tier3: 'RANK_1Q_CLASSIQ_QAOA',
    tier4: 'RANK_1_MAPF_PBS_SIPP',
  });

  const [tierParams, setTierParams] = useState<Record<string, number>>({
    fcm_fuzziness_m: 1.85,
    fcm_max_iter: 50,
    bpp_support_ratio_min: 0.85,
    friction_coeff_mu: 0.45,
    bpp_time_limit_sec: 3.0,
    vrp_penalty_delay_beta: 2.0,
    vrp_penalty_subtour_p: 100.0,
    kinematics_step_dt: 0.10,
  });

  // Pre-request Config Values (initialized with default limits)
  const [preRequestConfig, setPreRequestConfig] = useState<Record<string, any>>(() => {
    const initial: Record<string, any> = {};
    Object.entries(CONFIG_LIMITS).forEach(([key, spec]) => {
      initial[key] = spec.default;
    });
    return initial;
  });

  // Run & Execution State
  const [isSolving, setIsSolving] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string>('');
  const [runs, setRuns] = useState<RunSummaryDTO[]>([]);
  const [lastWave, setLastWave] = useState<WaveExecutionResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);

  // Initial Load: Archetypes, Runs, Initial Wave Dispatch
  useEffect(() => {
    fetchArchetypes()
      .then((data) => {
        if (data && data.length > 0) {
          setArchetypes(data);
          setSelectedArchetype(data[0].archetype_key);
        }
      })
      .catch((err) => console.warn('Archetypes fetch error:', err));

    loadHistoricalRuns();
    handleDispatch(true);
  }, []);

  const loadHistoricalRuns = async () => {
    try {
      const data = await fetchRuns(30);
      if (data && data.length > 0) {
        setRuns(data);
      }
    } catch (err) {
      console.warn('Failed to load historical runs:', err);
    }
  };

  const handleSelectHistoricalRun = async (runId: string) => {
    if (!runId) return;
    setCurrentRunId(runId);
    const foundRun = runs.find((r) => r.run_id === runId);
    if (foundRun) {
      setLastWave({
        run_id: foundRun.run_id,
        scenario_id: foundRun.scenario_id,
        wave_id: foundRun.wave_id,
        operational_mode: foundRun.operational_mode,
        algorithm_ranks_used: {},
        total_fleet_makespan_sec: foundRun.makespan_sec,
        total_distance_km: foundRun.distance_km,
        chute_balance_variance: foundRun.chute_variance,
        total_solve_latency_sec: foundRun.solve_latency_sec,
        falsification_ratio_phi: foundRun.falsification_ratio_phi,
        is_falsified: foundRun.is_falsified,
        routes: [],
      });
    }

    try {
      const sched = await fetchSchedule(runId);
      if (sched && sched.routes) {
        setSchedule(sched);
      }
    } catch (err) {
      console.warn('Could not load schedule for run:', runId, err);
    }
  };

  const handleDispatch = async (isInitial = false, scenarioIdOverride?: string) => {
    setIsSolving(true);
    try {
      const targetScenario = scenarioIdOverride || currentScenarioId;
      const resp = await dispatchWave({
        num_orders: preRequestConfig.num_orders ?? numOrders,
        num_vehicles: preRequestConfig.fleet_size ?? numVehicles,
        seed: isInitial ? 42 : (preRequestConfig.seed ?? seed),
        operational_mode: mode,
        scenario_id: targetScenario,
        tier_algorithms: activeTiers,
        quantum_config: {
          qaoa_p_layers: preRequestConfig.qaoa_p_layers ?? 2,
          qaoa_shots: preRequestConfig.qaoa_shots ?? 1024,
          max_circuit_width: preRequestConfig.max_circuit_width ?? 32,
        },
        lagrangian_weights: {
          alpha: preRequestConfig.lagrangian_alpha ?? 1.0,
          beta: preRequestConfig.lagrangian_beta ?? 2.0,
          gamma: preRequestConfig.lagrangian_gamma ?? 5.0,
          lambda: preRequestConfig.lagrangian_lambda ?? 1.5,
        },
        kinematics_config: {
          v_max_amr_mps: preRequestConfig.v_max_amr_mps ?? 2.0,
          v_safe_hri_mps: preRequestConfig.v_safe_hri_mps ?? 0.4,
          a_max_amr_mps2: preRequestConfig.a_max_amr_mps2 ?? 1.0,
          emergency_decel_mps2: preRequestConfig.emergency_decel_mps2 ?? 2.5,
          min_headway_sec: preRequestConfig.min_headway_sec ?? 1.5,
        },
      });

      if (resp && resp.run_id) {
        setCurrentRunId(resp.run_id);
        setLastWave(resp);

        // Fetch detailed schedule routes for 3D simulation
        const sched = await fetchSchedule(resp.run_id);
        if (sched && sched.routes) {
          setSchedule(sched);
        }

        // Refresh historical runs list
        loadHistoricalRuns();
      }
    } catch (err) {
      console.error('Dispatch error:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleReRun = async () => {
    await handleDispatch(false, currentScenarioId);
  };

  const resetAllDefaults = () => {
    const defaults: Record<string, any> = {};
    Object.entries(CONFIG_LIMITS).forEach(([k, spec]) => {
      defaults[k] = spec.default;
    });
    setPreRequestConfig(defaults);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        backgroundColor: '#050810',
        color: '#f0f4f8',
      }}
    >
      {/* Topbar HUD with Run Selector, KPIs, Re-Run, and Config Drawer Trigger */}
      <TopbarHUD
        lastWave={lastWave}
        operationalMode={mode}
        setOperationalMode={(newMode: string) => setMode(newMode as any)}
        onDispatchClick={() => handleDispatch(false)}
        onReRunClick={handleReRun}
        onOpenConfig={() => setIsConfigDrawerOpen(true)}
        onOpenPDF={() => setIsPdfModalOpen(true)}
        isSolving={isSolving}
        runs={runs}
        currentRunId={currentRunId}
        onSelectRun={handleSelectHistoricalRun}
        onToggleExplainer={() => setIsExplainerOpen(!isExplainerOpen)}
        onToggleQuantumPanel={() => setIsQuantumPanelOpen(!isQuantumPanelOpen)}
        onOpenConceptModal={() => setIsConceptModalOpen(true)}
      />

      {/* Main Workspace Bar (7 Navigation Tabs + Quick Scenario Controls) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 18px',
          backgroundColor: '#090d16',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
          overflowX: 'auto',
        }}
      >
        {/* Navigation Tabs (8 Studios) */}
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {[
            { id: '3d-sim', label: '3D Warehouse Twin', icon: <Box size={15} /> },
            { id: '2d-route-map', label: '2D Route Map & Details', icon: <MapPin size={15} /> },
            { id: 'dataset', label: 'Dataset & Mock Data (CRUD)', icon: <Database size={15} /> },
            { id: 'tiers', label: 'Calculations Tiers & Algos', icon: <Layers size={15} /> },
            { id: 'quantum', label: 'Classiq Quantum Studio', icon: <Atom size={15} /> },
            { id: 'graphs', label: 'Analytics & Graphs (10 Charts)', icon: <BarChart3 size={15} /> },
            { id: 'comparison', label: 'Run Comparisons & Diffing', icon: <GitCompare size={15} /> },
            { id: 'telemetry', label: 'Live Progress & Log Console', icon: <Terminal size={15} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 12px',
                  backgroundColor: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  border: isActive ? '1px solid #00f0ff' : '1px solid transparent',
                  borderRadius: '6px',
                  color: isActive ? '#00f0ff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Quick Scenario Drawer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => setIsQuickDrawerOpen(!isQuickDrawerOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: isQuickDrawerOpen ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: isQuickDrawerOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              color: isQuickDrawerOpen ? '#00f0ff' : '#e2e8f0',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            title="Toggle Quick Controls drawer to adjust industrial warehouse archetypes, AMR fleet sizing, order batch volume, and random seeds."
          >
            <Sliders size={13} />
            <span>Quick Controls</span>
            {isQuickDrawerOpen ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>
      </div>

      {/* Workspace Body */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          paddingBottom: isExplainerOpen ? '440px' : '42px',
          transition: 'padding-bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* Main View Area */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            height: '100%',
            minHeight: 0,
            minWidth: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeTab === '3d-sim' && (
            <ThreeWarehouseCanvas
              schedule={schedule}
              onNavigateTo2D={() => setActiveTab('2d-route-map')}
            />
          )}
          {activeTab === '2d-route-map' && (
            <RouteMap2DStudio
              schedule={schedule}
              runId={currentRunId}
              onNavigateTo3D={() => setActiveTab('3d-sim')}
            />
          )}
          {activeTab === 'dataset' && (
            <DatasetStudio
              scenarioId={currentScenarioId}
              onSelectScenario={setCurrentScenarioId}
              onDispatchDataset={(scenId) => handleDispatch(false, scenId)}
            />
          )}
          {activeTab === 'tiers' && (
            <TiersAndAlgorithmsStudio
              activeTiers={activeTiers}
              onSelectTierAlgorithm={(tierKey, algoRank) =>
                setActiveTiers((prev) => ({ ...prev, [tierKey]: algoRank }))
              }
              tierParams={tierParams}
              onChangeTierParam={(paramKey, val) =>
                setTierParams((prev) => ({ ...prev, [paramKey]: val }))
              }
              onNavigateToQuantumStudio={() => setActiveTab('quantum')}
            />
          )}
          {activeTab === 'quantum' && <QuantumStudio runId={currentRunId} />}
          {activeTab === 'graphs' && <GraphStudio runId={currentRunId} />}
          {activeTab === 'comparison' && <RunComparisonStudio onSelectRun={handleSelectHistoricalRun} />}
          {activeTab === 'telemetry' && <TelemetryConsole runId={currentRunId} />}
        </div>

        {/* Quick Controls & Mission Dossier Sidebar */}
        <QuickControlsPanel
          isOpen={isQuickDrawerOpen}
          onClose={() => setIsQuickDrawerOpen(false)}
          selectedArchetype={selectedArchetype}
          setSelectedArchetype={setSelectedArchetype}
          numVehicles={numVehicles}
          setNumVehicles={(val) => {
            setNumVehicles(val);
            setPreRequestConfig((prev) => ({ ...prev, fleet_size: val }));
          }}
          numOrders={numOrders}
          setNumOrders={(val) => {
            setNumOrders(val);
            setPreRequestConfig((prev) => ({ ...prev, num_orders: val }));
          }}
          seed={seed}
          setSeed={(val) => {
            setSeed(val);
            setPreRequestConfig((prev) => ({ ...prev, seed: val }));
          }}
          mode={mode as any}
          setMode={(m) => setMode(m as any)}
          archetypes={archetypes}
          isSolving={isSolving}
          onDispatch={() => handleDispatch(false)}
          onOpenFullConfig={() => setIsConfigDrawerOpen(true)}
        />
      </div>

      {/* Pre-Request Configuration Drawer (Advanced Tuning, Limits & Presets) */}
      <PreRequestConfigDrawer
        isOpen={isConfigDrawerOpen}
        onClose={() => setIsConfigDrawerOpen(false)}
        config={preRequestConfig}
        onChangeConfig={(key, val) => setPreRequestConfig((prev) => ({ ...prev, [key]: val }))}
        onApplyAndDispatch={() => {
          setIsConfigDrawerOpen(false);
          handleDispatch(false);
        }}
        onResetAllDefaults={resetAllDefaults}
      />

      {/* Vector PDF Modal */}
      {currentRunId && (
        <PDFModal
          runId={currentRunId}
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
        />
      )}

      {/* Concept Explanation & Problem Definition Modal (473 Formulas with KaTeX) */}
      <ConceptExplanationModal
        isOpen={isConceptModalOpen}
        onClose={() => setIsConceptModalOpen(false)}
      />

      {/* Special Simulator Human-Friendly Mission & Co-Processor Explainer Pane */}
      <NarrativeExplainerPane
        runId={currentRunId}
        mode={mode}
        activeTiers={activeTiers}
        numOrders={preRequestConfig.num_orders ?? numOrders}
        numVehicles={preRequestConfig.fleet_size ?? numVehicles}
        scenarioId={currentScenarioId}
        phi={lastWave?.falsification_ratio_phi ?? 0.88}
        makespan={lastWave?.total_fleet_makespan_sec ?? 949.3}
        distance={lastWave?.total_distance_km ?? 3.71}
        isSolving={isSolving}
        isExpanded={isExplainerOpen}
        onToggleExpand={() => setIsExplainerOpen(!isExplainerOpen)}
      />

      {/* Special Quantum Calculation Utilization & Classiq Functions Panel */}
      <QuantumUtilizationPanel
        isOpen={isQuantumPanelOpen}
        onClose={() => setIsQuantumPanelOpen(false)}
        runId={currentRunId}
        operationalMode={mode}
        activeTiers={activeTiers}
        qaoaLayers={preRequestConfig.qaoa_p_layers}
        qaoaShots={preRequestConfig.qaoa_shots}
      />
    </div>
  );
};

export default App;
