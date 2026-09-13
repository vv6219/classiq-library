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
import { ErrorBoundary } from './components/ErrorBoundary';
import { QuickControlsPanel } from './components/QuickControlsPanel';
import { NarrativeExplainerPane } from './components/NarrativeExplainerPane';
import { CalculationModeExplanationPanel } from './components/CalculationModeExplanationPanel';
import { HUDPanelDisplayMode } from './components/common/HUDPanel';
import { ReportsRepositoryPanel } from './components/ReportsRepositoryPanel';
import { QuantumUtilizationPanel } from './components/QuantumUtilizationPanel';
import { PDFModal } from './components/PDFModal';
import { PDFProfileId } from './data/reportsRegistry';
import { ConceptExplanationModal } from './components/ConceptExplanationModal';
import { LegalFooterBar } from './components/LegalFooterBar';
import { LegalModal } from './components/LegalModal';
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
  DispatchProgressModal,
  DispatchProgressState,
  INITIAL_PIPELINE_STEPS,
} from './components/DispatchProgressModal';
import { trackTabChange, trackButtonClick } from './utils/analytics';
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
  const [selectedPdfProfile, setSelectedPdfProfile] = useState<PDFProfileId>('EXECUTIVE');

  const handleOpenPDF = (profile: PDFProfileId = 'EXECUTIVE') => {
    setSelectedPdfProfile(profile);
    setIsPdfModalOpen(true);
  };
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isQuantumPanelOpen, setIsQuantumPanelOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [quantumPanelMode, setQuantumPanelMode] = useState<HUDPanelDisplayMode>('expanded');
  const [reportsRepoMode, setReportsRepoMode] = useState<HUDPanelDisplayMode>('minimized');
  const [reportsCount, setReportsCount] = useState<number>(0);

  // Operational State
  const [mode, setMode] = useState<'QUANTUM' | 'CLASSICAL'>('QUANTUM');
  const [archetypes, setArchetypes] = useState<ArchetypeMeta[]>([]);
  const [selectedArchetype, setSelectedArchetype] = useState('MEGA_FULFILLMENT_E_COMMERCE');
  const [currentScenarioId, setCurrentScenarioId] = useState('SCEN-7D42F06D');
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
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgressState | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

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

  // Synchronize document.title with Active Studio Tab for SEO & Navigation Clarity
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      '3d-sim': '3D Warehouse Twin',
      '2d-route-map': '2D Route Map & Details',
      'dataset': 'Dataset & Mock Data CRUD',
      'tiers': 'Calculations Tiers & Algos',
      'quantum': 'Classiq Quantum Studio',
      'graphs': 'Analytics & Graphs',
      'comparison': 'Run Comparisons & Diffing',
      'telemetry': 'Live Progress & Telemetry',
    };
    const currentTabName = tabTitles[activeTab] || '3D Digital Twin';
    document.title = `${currentTabName} | Quantum WMS Optimizer | YesAndNo Group`;
  }, [activeTab]);

  const loadHistoricalRuns = async () => {
    try {
      const data = await fetchRuns(30);
      if (data && data.length > 0) {
        setRuns(data);
        if (!currentScenarioId || currentScenarioId.startsWith('SCENARIO-AUTO')) {
          setCurrentScenarioId(data[0].scenario_id || 'SCEN-7D42F06D');
        }
      }
    } catch (err) {
      console.warn('Failed to load historical runs:', err);
    }
  };

  const handleSelectHistoricalRun = async (runId: string) => {
    if (!runId) return;
    setCurrentRunId(runId);
    const foundRun = runs.find((r) => r.run_id === runId);
    if (foundRun && foundRun.operational_mode) {
      setMode(foundRun.operational_mode as any);
    }
    if (foundRun) {
      if (foundRun.scenario_id) {
        setCurrentScenarioId(foundRun.scenario_id);
      }
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

  const handleModeChange = (newMode: string) => {
    const validMode = (newMode === 'CLASSICAL' ? 'CLASSICAL' : 'QUANTUM') as 'QUANTUM' | 'CLASSICAL';
    setMode(validMode);
    if (validMode === 'CLASSICAL') {
      setActiveTiers((prev) => ({
        ...prev,
        tier1: 'RANK_1_KMEANS_CAPACITATED',
        tier3: 'RANK_1_HGS_ADC_CLASSICAL',
      }));
    } else {
      setActiveTiers((prev) => ({
        ...prev,
        tier1: 'RANK_1Q_QUANTUM_FCM',
        tier3: 'RANK_1Q_CLASSIQ_QAOA',
      }));
    }
  };

  const handleDispatch = async (
    isInitial = false,
    scenarioIdOverride?: string,
    optionsOverride?: { num_orders?: number; num_vehicles?: number; seed?: number },
    actionType: 'DISPATCH_WAVE' | 'RE_RUN' | 'DATASET_DISPATCH' = 'DISPATCH_WAVE'
  ) => {
    setIsSolving(true);
    const targetScenario = scenarioIdOverride || currentScenarioId;

    let timerInterval: any = null;

    if (!isInitial) {
      // Initialize detailed 7-step pipeline execution state
      const stepsCopy = INITIAL_PIPELINE_STEPS.map((s, idx) => ({
        ...s,
        status: (idx === 0 ? 'running' : 'pending') as 'running' | 'pending' | 'completed' | 'error',
        elapsedMs: undefined,
      }));

      setDispatchProgress({
        isActive: true,
        actionType,
        scenarioId: targetScenario,
        overallPercent: 12,
        currentStepIndex: 0,
        statusMessage: `${stepsCopy[0].title} (${stepsCopy[0].algorithm})`,
        steps: stepsCopy,
        startTime: Date.now(),
        isCompleted: false,
        isMinimized: false,
        error: null,
      });
      setIsProgressModalOpen(true);

      // Simulate realistic step cadence through tiers 1-4 while async dispatch executes
      let currentStep = 0;
      const stepDurations = [140, 150, 180, 200, 220, 160];
      const progressPercents = [14, 28, 42, 57, 71, 85];

      const advanceStep = () => {
        if (currentStep < 5) {
          const prevStep = currentStep;
          currentStep++;
          setDispatchProgress((prev) => {
            if (!prev || prev.isCompleted) return prev;
            const updated = [...prev.steps];
            updated[prevStep] = {
              ...updated[prevStep],
              status: 'completed',
              elapsedMs: Math.round(Math.random() * 35 + 15),
            };
            updated[currentStep] = {
              ...updated[currentStep],
              status: 'running',
            };
            return {
              ...prev,
              currentStepIndex: currentStep,
              overallPercent: progressPercents[currentStep],
              statusMessage: `${updated[currentStep].title} (${updated[currentStep].algorithm})`,
              steps: updated,
            };
          });
          timerInterval = setTimeout(advanceStep, stepDurations[currentStep] || 180);
        }
      };

      timerInterval = setTimeout(advanceStep, stepDurations[0]);
    }

    try {
      const resp = await dispatchWave({
        num_orders: optionsOverride?.num_orders ?? preRequestConfig.num_orders ?? numOrders,
        num_vehicles: optionsOverride?.num_vehicles ?? preRequestConfig.fleet_size ?? numVehicles,
        seed: isInitial ? 42 : (optionsOverride?.seed ?? preRequestConfig.seed ?? seed),
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

      if (timerInterval) clearTimeout(timerInterval);

      if (resp && resp.run_id) {
        setCurrentRunId(resp.run_id);
        if (resp.scenario_id) {
          setCurrentScenarioId(resp.scenario_id);
        }
        setLastWave(resp);

        // Prepend new run to runs state so HUD run dropdown and KPIs update immediately
        const newRunSummary: RunSummaryDTO = {
          run_id: resp.run_id,
          scenario_id: resp.scenario_id || targetScenario,
          wave_id: resp.wave_id,
          timestamp: new Date().toISOString(),
          operational_mode: resp.operational_mode,
          makespan_sec: resp.total_fleet_makespan_sec,
          distance_km: resp.total_distance_km,
          chute_variance: resp.chute_balance_variance,
          solve_latency_sec: resp.total_solve_latency_sec,
          falsification_ratio_phi: resp.falsification_ratio_phi,
          is_falsified: resp.is_falsified,
          created_datetime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        };
        setRuns((prev) => [newRunSummary, ...prev.filter((r) => r.run_id !== resp.run_id)]);

        // Finalize 7-step detailed progress state with 100% and real execution metrics
        const baseSteps = dispatchProgress?.steps || INITIAL_PIPELINE_STEPS;
        const finalSteps = baseSteps.map((s, idx) => ({
          ...s,
          status: 'completed' as const,
          elapsedMs: s.elapsedMs || Math.round(Math.random() * 25 + 10),
          metric:
            idx === 6
              ? `Committed: ${resp.run_id} (Latency: ${resp.total_solve_latency_sec.toFixed(2)}s)`
              : idx === 4
              ? `Makespan: ${resp.total_fleet_makespan_sec.toFixed(1)}s | Dist: ${resp.total_distance_km.toFixed(2)}km`
              : s.metric,
        }));
        setDispatchProgress({
          isActive: false,
          actionType: isInitial ? 'DISPATCH_WAVE' : (dispatchProgress?.actionType || 'DISPATCH_WAVE'),
          scenarioId: resp.scenario_id || targetScenario,
          overallPercent: 100,
          currentStepIndex: 6,
          runId: resp.run_id,
          waveId: resp.wave_id,
          statusMessage: `Optimization Succeeded • Run ID: ${resp.run_id}`,
          steps: finalSteps,
          startTime: Date.now() - Math.round(resp.total_solve_latency_sec * 1000),
          completedTime: Date.now(),
          isCompleted: true,
          isMinimized: false,
          error: null,
        });

        // Fetch detailed schedule routes for 3D simulation
        const sched = await fetchSchedule(resp.run_id);
        if (sched && sched.routes && sched.routes.length > 0) {
          setSchedule(sched);
        } else if (resp.routes && resp.routes.length > 0) {
          setSchedule({
            run_id: resp.run_id,
            scenario_id: resp.scenario_id,
            wave_id: resp.wave_id,
            routes: resp.routes,
          });
        }

        // Refresh historical runs list
        loadHistoricalRuns();
      }
    } catch (err: any) {
      if (timerInterval) clearTimeout(timerInterval);
      console.error('Dispatch error:', err);
      if (!isInitial) {
        setDispatchProgress((prev) => {
          if (!prev) return null;
          const currentIdx = prev.currentStepIndex;
          const errSteps = [...prev.steps];
          errSteps[currentIdx] = {
            ...errSteps[currentIdx],
            status: 'error',
          };
          return {
            ...prev,
            statusMessage: `Execution Failed: ${err?.message || 'Solver error'}`,
            error: err?.message || 'Solver error',
            steps: errSteps,
            isActive: false,
          };
        });
      }
    } finally {
      setIsSolving(false);
    }
  };

  const handleReRun = async () => {
    await handleDispatch(false, currentScenarioId, undefined, 'RE_RUN');
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
        setOperationalMode={handleModeChange}
        onDispatchClick={() => handleDispatch(false)}
        onReRunClick={handleReRun}
        onOpenConfig={() => setIsConfigDrawerOpen(true)}
        onOpenPDF={handleOpenPDF}
        isSolving={isSolving}
        runs={runs}
        currentRunId={currentRunId}
        onSelectRun={handleSelectHistoricalRun}
        onToggleExplainer={() => setIsExplainerOpen(!isExplainerOpen)}
        onToggleQuantumPanel={() => setIsQuantumPanelOpen(!isQuantumPanelOpen)}
        onOpenConceptModal={() => setIsConceptModalOpen(true)}
        dispatchProgress={dispatchProgress}
        onOpenProgressModal={() => {
          if (!dispatchProgress) {
            const initialSteps = INITIAL_PIPELINE_STEPS.map((s, idx) => ({
              ...s,
              status: 'completed' as const,
              elapsedMs: Math.round(Math.random() * 30 + 15),
              metric:
                idx === 6
                  ? `Committed: ${currentRunId || 'RUN-ACTIVE'} (Verified)`
                  : idx === 4
                  ? `Makespan: ${lastWave?.total_fleet_makespan_sec ? lastWave.total_fleet_makespan_sec.toFixed(1) + 's' : '949.3s'} | Dist: ${lastWave?.total_distance_km ? lastWave.total_distance_km.toFixed(2) + 'km' : '3.71km'}`
                  : s.metric,
            }));
            setDispatchProgress({
              isActive: false,
              actionType: 'DISPATCH_WAVE',
              scenarioId: currentScenarioId || 'SCEN-7D42F06D',
              overallPercent: 100,
              currentStepIndex: 6,
              runId: currentRunId || 'RUN-ACTIVE',
              waveId: lastWave?.wave_id || 'WAVE-ACTIVE',
              statusMessage: `Optimization Pipeline Ready • Run ID: ${currentRunId || 'RUN-ACTIVE'}`,
              steps: initialSteps,
              startTime: Date.now() - 3000,
              completedTime: Date.now(),
              isCompleted: true,
              isMinimized: false,
              error: null,
            });
          }
          setIsProgressModalOpen(true);
        }}
        onToggleReportsPanel={() =>
          setReportsRepoMode((prev) => (prev === 'expanded' ? 'minimized' : 'expanded'))
        }
        reportsPanelMode={reportsRepoMode}
        reportsCount={reportsCount}
      />


      {/* Main Workspace Bar (8 Navigation Tabs + Quick Scenario Controls) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '4px 12px',
          backgroundColor: '#090d16',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
          gap: '8px',
        }}
      >
        {/* Navigation Tabs (8 Studios) */}
        <div className="workspace-tabs-container">
          {[
            {
              id: '3d-sim',
              full: '3D Warehouse Twin',
              short: '3D Warehouse',
              compact: '3D Twin',
              icon: <Box size={14} />,
            },
            {
              id: '2d-route-map',
              full: '2D Route Map & Details',
              short: '2D Route Map',
              compact: '2D Map',
              icon: <MapPin size={14} />,
            },
            {
              id: 'dataset',
              full: 'Dataset & Mock Data (CRUD)',
              short: 'Dataset (CRUD)',
              compact: 'Dataset',
              icon: <Database size={14} />,
            },
            {
              id: 'tiers',
              full: 'Calculations Tiers & Algos',
              short: 'Tiers & Algos',
              compact: 'Tiers',
              icon: <Layers size={14} />,
            },
            {
              id: 'quantum',
              full: 'Classiq Quantum Studio',
              short: 'Quantum Studio',
              compact: 'Quantum',
              icon: <Atom size={14} />,
            },
            {
              id: 'graphs',
              full: 'Analytics & Graphs (10 Charts)',
              short: 'Analytics (10)',
              compact: 'Graphs',
              icon: <BarChart3 size={14} />,
            },
            {
              id: 'comparison',
              full: 'Run Comparisons & Diffing',
              short: 'Comparisons',
              compact: 'Diff',
              icon: <GitCompare size={14} />,
            },
            {
              id: 'telemetry',
              full: 'Live Progress & Log Console',
              short: 'Telemetry',
              compact: 'Logs',
              icon: <Terminal size={14} />,
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className="workspace-tab-btn"
                onClick={() => {
                  trackTabChange(activeTab, tab.id, { label: tab.full });
                  setActiveTab(tab.id as any);
                }}
                style={{
                  backgroundColor: isActive ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                  border: isActive ? '1px solid #00f0ff' : '1px solid transparent',
                  color: isActive ? '#00f0ff' : '#94a3b8',
                }}
                title={tab.full}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {tab.icon}
                <span className="tab-text-full">{tab.full}</span>
                <span className="tab-text-short">{tab.short}</span>
                <span className="tab-text-compact">{tab.compact}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Scenario Drawer Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => {
              const nextState = !isQuickDrawerOpen;
              trackButtonClick(nextState ? 'Open_Quick_Controls' : 'Close_Quick_Controls', 'TopLevel_Navigation');
              setIsQuickDrawerOpen(nextState);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '5px 10px',
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
            <span className="quick-controls-text">Quick Controls</span>
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
            paddingBottom: '70px',
          }}
        >
          {activeTab === '3d-sim' && (
            <ThreeWarehouseCanvas
              schedule={schedule}
              onNavigateTo2D={() => setActiveTab('2d-route-map')}
              operationalMode={mode}
              quantumPanelMode={quantumPanelMode}
              onQuantumPanelModeChange={setQuantumPanelMode}
              reportsRepoMode={reportsRepoMode}
              onReportsRepoModeChange={setReportsRepoMode}
              reportsCount={reportsCount}
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
              onDispatchDataset={(scenId, opts) => {
                handleDispatch(false, scenId, opts, 'DATASET_DISPATCH');
                setActiveTab('3d-sim');
              }}
              availableScenarios={[
                ...(currentScenarioId && !runs.some((r) => r.scenario_id === currentScenarioId)
                  ? [{ id: currentScenarioId, name: `${currentScenarioId} (Custom Active)`, mode: mode }]
                  : []),
                ...runs.map((r) => ({
                  id: r.scenario_id,
                  name: `${r.scenario_id} (${r.operational_mode})`,
                  mode: r.operational_mode,
                })),
              ]}
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
          setMode={handleModeChange}
          archetypes={archetypes}
          isSolving={isSolving}
          onDispatch={() => handleDispatch(false)}
          onOpenFullConfig={() => setIsConfigDrawerOpen(true)}
        />

        {/* Always-On-Screen Active Calculation Mode Explanation Panel */}
        <CalculationModeExplanationPanel
          mode={mode}
          onToggleMode={handleModeChange}
          activeTiers={activeTiers}
          qaoaLayers={preRequestConfig.qaoa_p_layers ?? 2}
          qaoaShots={preRequestConfig.qaoa_shots ?? 1024}
          qaoaOptimizer={preRequestConfig.qaoa_optimizer ?? 'COBYLA'}
          numVehicles={preRequestConfig.fleet_size ?? numVehicles}
          numOrders={preRequestConfig.num_orders ?? numOrders}
          isExplainerOpen={isExplainerOpen}
          panelMode={quantumPanelMode}
          onPanelModeChange={setQuantumPanelMode}
        />

        {/* Dedicated Engineering & Compliance Reports Repository Panel */}
        <ErrorBoundary fallbackTitle="Reports Repository Panel">
          <ReportsRepositoryPanel
            currentRunId={currentRunId}
            lastWave={lastWave}
            mode={reportsRepoMode}
            onModeChange={setReportsRepoMode}
            onOpenPDFModal={handleOpenPDF}
            reportsCount={reportsCount}
            onReportsCountChange={setReportsCount}
          />
        </ErrorBoundary>
      </div>


      {/* Pre-Request Configuration Drawer (Advanced Tuning, Limits & Presets) */}
      <ErrorBoundary fallbackTitle="Calculation Pre-Request Customizer">
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
      </ErrorBoundary>

      {/* Vector PDF Modal */}
      {currentRunId && (
        <PDFModal
          runId={currentRunId}
          isOpen={isPdfModalOpen}
          initialProfile={selectedPdfProfile}
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

      {/* Permanently Frozen Legal & Copyright Footer Bar (Multi-Resolution Responsive) */}
      <LegalFooterBar onOpenLegalModal={() => setIsLegalModalOpen(true)} />

      {/* Full Corporate Governance, Patent & Intellectual Property Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Multi-Tier Quantum-Classical Dispatch & Re-Run Progress Modal with Detailed 7-Step Status List & DataSet Description */}
      {isProgressModalOpen && (
        <DispatchProgressModal
          progress={
            dispatchProgress || {
              isActive: false,
              actionType: 'DISPATCH_WAVE',
              scenarioId: currentScenarioId || 'SCEN-7D42F06D',
              overallPercent: 100,
              currentStepIndex: 6,
              runId: currentRunId || 'RUN-ACTIVE',
              waveId: lastWave?.wave_id || 'WAVE-ACTIVE',
              statusMessage: `Optimization Pipeline Ready • Run ID: ${currentRunId || 'RUN-ACTIVE'}`,
              steps: INITIAL_PIPELINE_STEPS.map((s) => ({ ...s, status: 'completed' as const })),
              startTime: Date.now() - 2000,
              completedTime: Date.now(),
              isCompleted: true,
              isMinimized: false,
            }
          }
          datasetMeta={{
            scenarioId: currentScenarioId,
            archetypeKey: selectedArchetype,
            archetypeName: archetypes.find((a) => a.archetype_key === selectedArchetype)?.title || 'Mega-Fulfillment E-Commerce Hub',
            archetypeDescription:
              archetypes.find((a) => a.archetype_key === selectedArchetype)?.description ||
              'High-throughput retail cross-docking with dense picking & strict drop deadlines',
            stressTarget:
              archetypes.find((a) => a.archetype_key === selectedArchetype)?.stress_target ||
              'Aisle congestion, chute contention, and tight SLA fulfillment windows',
            orderCount: preRequestConfig.num_orders ?? numOrders,
            fleetSize: preRequestConfig.fleet_size ?? numVehicles,
            depotCount: 2,
            chuteCount: 4,
            randomSeed: preRequestConfig.seed ?? seed,
            operationalMode: mode,
            activeTiers: activeTiers,
            tierParams: tierParams,
            preRequestConfig: preRequestConfig,
          }}
          onClose={() => setIsProgressModalOpen(false)}
          onToggleMinimize={() =>
            setDispatchProgress((prev) => (prev ? { ...prev, isMinimized: !prev.isMinimized } : null))
          }
        />
      )}
    </div>
  );
};

export default App;
