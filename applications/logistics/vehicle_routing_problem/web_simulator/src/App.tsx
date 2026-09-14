import React, { useState, useEffect, useMemo, useRef } from 'react';
import { NavigationStep, NavigationSnapshot, StudioTabId } from './types/navigationState';
import { computeCurrentNavigationStep } from './utils/navigationHelper';
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
import { ZeroOrdersBlockModal } from './components/ZeroOrdersBlockModal';
import {
  dispatchWave,
  fetchSchedule,
  fetchArchetypes,
  fetchRuns,
  getCustomRuns,
  CONFIG_LIMITS,
  CANONICAL_BENCHMARK_RUNS,
  ScheduleDetails,
  ArchetypeMeta,
  RunSummaryDTO,
  WaveExecutionResponse,
} from './services/api';
import { RouteMap2DStudio } from './components/RouteMap2DStudio';
import {
  DispatchProgressModal,
  DispatchProgressState,
  DispatchPipelineStep,
  INITIAL_PIPELINE_STEPS,
} from './components/DispatchProgressModal';
import { SidebarNavigation } from './components/navigation/SidebarNavigation';
import { BreadcrumbsBar } from './components/navigation/BreadcrumbsBar';
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

  // Sidebar & Layout State: Always start on first load with expanded sidebar
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('wms_sidebar_width_v1');
      if (saved && Number(saved) >= 200) return Number(saved);
    } catch (e) {}
    return 260;
  });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(true);
  const [isSidebarPinned, setIsSidebarPinned] = useState<boolean>(true);
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER';
    id: string;
    telemetry?: any;
  } | null>(null);
  const [cameraPreset, setCameraPreset] = useState<'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null>(null);

  useEffect(() => {
    localStorage.setItem('wms_sidebar_width_v1', String(sidebarWidth));
  }, [sidebarWidth]);

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [selectedPdfProfile, setSelectedPdfProfile] = useState<PDFProfileId>('EXECUTIVE');

  const handleOpenPDF = (profile: PDFProfileId = 'EXECUTIVE') => {
    setSelectedPdfProfile(profile);
    setIsPdfModalOpen(true);
  };
  const [isConceptModalOpen, setIsConceptModalOpen] = useState(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState(false);
  const [isQuickDrawerOpen, setIsQuickDrawerOpen] = useState(false);
  const [isDatasetGeneratorOpen, setIsDatasetGeneratorOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isQuantumPanelOpen, setIsQuantumPanelOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [quantumPanelMode, setQuantumPanelMode] = useState<HUDPanelDisplayMode>('expanded');
  const [reportsRepoMode, setReportsRepoMode] = useState<HUDPanelDisplayMode>('minimized');
  const [reportsCount, setReportsCount] = useState<number>(0);

  const [selectedTier, setSelectedTier] = useState<string>('tier1');
  const [generatorInitialParam, setGeneratorInitialParam] = useState<string>('num_orders');
  const [isZeroOrdersModalOpen, setIsZeroOrdersModalOpen] = useState(false);
  const [zeroOrdersToastMessage, setZeroOrdersToastMessage] = useState<string | null>(null);

  const showZeroOrdersToast = (msg: string) => {
    setZeroOrdersToastMessage(msg);
    setTimeout(() => setZeroOrdersToastMessage(null), 5000);
  };

  const handleOpenOrdersDepotGenerator = (paramKey: string = 'num_orders') => {
    setGeneratorInitialParam(paramKey);
    trackTabChange(activeTab, 'dataset');
    setActiveTab('dataset');
    setIsDatasetGeneratorOpen(true);
  };

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
  const [currentRunId, setCurrentRunId] = useState<string>(CANONICAL_BENCHMARK_RUNS[0]?.run_id || 'RUN-7D42F06D');
  const [runs, setRuns] = useState<RunSummaryDTO[]>(CANONICAL_BENCHMARK_RUNS);
  const [lastWave, setLastWave] = useState<WaveExecutionResponse | null>(null);
  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [dispatchProgress, setDispatchProgress] = useState<DispatchProgressState | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);

  // Navigation History Stack for Active Back Link and Lineage Tracking
  const [navHistory, setNavHistory] = useState<NavigationSnapshot[]>([]);
  const isNavigatingBackRef = useRef(false);

  // Compute Active Hierarchical Navigation Step
  const currentNavStep = useMemo<NavigationStep>(() => {
    return computeCurrentNavigationStep({
      facilityId: 'WMS-IND-01',
      facilityName: 'Berlin Mega-Hub',
      selectedArchetype: selectedArchetype,
      activeTab: activeTab as StudioTabId,
      selectedTier: selectedTier || 'tier1',
      selectedEntity: selectedEntity,
      cameraPreset: cameraPreset,
      reportsRepoMode: reportsRepoMode,
      currentRunId: currentRunId,
      numOrders: numOrders,
      numVehicles: numVehicles,
      operationalMode: mode as 'QUANTUM' | 'CLASSICAL',
    });
  }, [
    selectedArchetype,
    activeTab,
    selectedTier,
    selectedEntity,
    cameraPreset,
    reportsRepoMode,
    currentRunId,
    numOrders,
    numVehicles,
    mode,
  ]);

  // Record History on Navigation Changes
  useEffect(() => {
    if (isNavigatingBackRef.current) {
      isNavigatingBackRef.current = false;
      return;
    }
    setNavHistory((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.step.id === currentNavStep.id) {
        return prev;
      }
      const snapshot: NavigationSnapshot = {
        step: currentNavStep,
        activeTab: activeTab as StudioTabId,
        selectedArchetype: selectedArchetype,
        selectedTier: selectedTier || 'tier1',
        selectedEntity: selectedEntity,
        cameraPreset: cameraPreset,
        reportsRepoMode: reportsRepoMode,
        timestamp: Date.now(),
      };
      const next = [...prev, snapshot];
      if (next.length > 30) next.shift();
      return next;
    });
  }, [currentNavStep, activeTab, selectedArchetype, selectedTier, selectedEntity, cameraPreset, reportsRepoMode]);

  // Back Navigation Handler
  const handleGoBack = () => {
    if (navHistory.length <= 1) return;
    isNavigatingBackRef.current = true;
    const nextHistory = [...navHistory];
    nextHistory.pop(); // Remove current state
    const previousSnapshot = nextHistory[nextHistory.length - 1];
    setNavHistory(nextHistory);

    if (previousSnapshot) {
      if (previousSnapshot.activeTab) {
        trackTabChange(activeTab, previousSnapshot.activeTab);
        setActiveTab(previousSnapshot.activeTab);
      }
      if (previousSnapshot.selectedArchetype) {
        setSelectedArchetype(previousSnapshot.selectedArchetype);
      }
      if (previousSnapshot.selectedTier) {
        setSelectedTier(previousSnapshot.selectedTier);
      }
      setSelectedEntity(previousSnapshot.selectedEntity || null);
      setCameraPreset(previousSnapshot.cameraPreset || 'overview');
      if (previousSnapshot.reportsRepoMode) {
        setReportsRepoMode(previousSnapshot.reportsRepoMode);
      }
    }
  };

  // Direct Segment Click Navigation Handler
  const handleNavigateSegment = (segment: { level: string; label: string; id: string; tab?: StudioTabId }) => {
    if (segment.tab) {
      trackTabChange(activeTab, segment.tab);
      setActiveTab(segment.tab);
    } else if (segment.level === 'archetype') {
      setSelectedArchetype(segment.id);
    } else if (segment.level === 'facility') {
      setActiveTab('3d-sim');
      setCameraPreset('overview');
      setSelectedEntity(null);
    }
  };

  // Initial Load: Archetypes, Runs
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

  const loadHistoricalRuns = async (preserveRunId?: string) => {
    try {
      const data = await fetchRuns(30);
      if (data && data.length > 0) {
        setRuns((prev) => {
          const dataIds = new Set(data.map((d) => d.run_id));
          const unsaved = prev.filter((p) => !dataIds.has(p.run_id));
          return [...unsaved, ...data];
        });
        const targetId = preserveRunId || currentRunId;
        if (targetId && data.some((r) => r.run_id === targetId)) {
          handleSelectHistoricalRun(targetId);
        } else if (!currentRunId && data.length > 0) {
          handleSelectHistoricalRun(data[0].run_id);
        }
      }
    } catch (err) {
      console.warn('Failed to load historical runs:', err);
    }
  };

  const handleSelectHistoricalRun = async (runId: string) => {
    if (!runId) return;
    setCurrentRunId(runId);
    const allKnownRuns = [...getCustomRuns(), ...runs, ...CANONICAL_BENCHMARK_RUNS];
    const foundRun = allKnownRuns.find((r) => r.run_id === runId);
    if (foundRun && foundRun.operational_mode) {
      const targetMode = (foundRun.operational_mode === 'CLASSICAL' || (foundRun.mode && foundRun.mode.toUpperCase() === 'CPU'))
        ? 'CLASSICAL'
        : 'QUANTUM';
      handleModeChange(targetMode);
    }
    if (foundRun) {
      if (foundRun.scenario_id) {
        setCurrentScenarioId(foundRun.scenario_id);
      }
      setLastWave((prev) => ({
        ...prev,
        run_id: foundRun.run_id,
        scenario_id: foundRun.scenario_id,
        wave_id: foundRun.wave_id || `WAVE-${foundRun.run_id.replace('RUN-', '')}`,
        operational_mode: foundRun.operational_mode,
        mode: foundRun.mode || (foundRun.operational_mode === 'QUANTUM' ? '32Q' : 'CPU'),
        total_fleet_makespan_sec: foundRun.makespan_sec,
        total_distance_km: foundRun.distance_km,
        chute_balance_variance: foundRun.chute_variance,
        total_solve_latency_sec: foundRun.solve_latency_sec,
        falsification_ratio_phi: foundRun.falsification_ratio_phi,
        is_falsified: foundRun.is_falsified,
      }));
    }

    try {
      const sched = await fetchSchedule(runId);
      if (sched && sched.routes && sched.routes.length > 0) {
        setSchedule(sched);
      }
    } catch (err) {
      console.warn('Could not load schedule for run:', runId, err);
    }
  };

  const getPipelineStepsForMode = (currentMode: 'QUANTUM' | 'CLASSICAL'): DispatchPipelineStep[] => {
    return INITIAL_PIPELINE_STEPS.map((s) => {
      if (s.id === 'step_2_mode') {
        return {
          ...s,
          algorithm: currentMode === 'QUANTUM' ? 'AlgorithmSelectorEngine (Pareto Rank 1Q)' : 'AlgorithmSelectorEngine (Classical CPU HGS-ADC)',
          metric: currentMode === 'QUANTUM' ? 'Quantum 32Q / Co-Processor Rank Selected' : 'Classical CPU / HGS-ADC Rank Selected',
          calculationParams: s.calculationParams.map((p) =>
            p.key === 'selected_mode'
              ? { ...p, value: currentMode === 'QUANTUM' ? 'QUANTUM (32Q Co-Processor Assisted)' : 'CLASSICAL (CPU Multithreaded Solvers)' }
              : p.key === 'pareto_frontier'
              ? { ...p, value: currentMode === 'QUANTUM' ? 'T1: 1Q, T2: 1, T3: 1Q, T4: 1' : 'T1: 1, T2: 1, T3: 1, T4: 1' }
              : p
          ),
        };
      }
      if (s.id === 'step_3_tier1') {
        return {
          ...s,
          algorithm: currentMode === 'QUANTUM' ? 'Tier1Rank1QQuantumFCMSolver (FCM)' : 'Tier1Rank1KMeansSolver (Capacitated K-Means)',
          calculationParams: s.calculationParams.map((p) =>
            p.key === 'solver_rank'
              ? { ...p, value: currentMode === 'QUANTUM' ? 'RANK_1Q_QUANTUM_FCM' : 'RANK_1_KMEANS_CAPACITATED' }
              : p
          ),
        };
      }
      if (s.id === 'step_5_tier3') {
        return {
          ...s,
          title: currentMode === 'QUANTUM' ? 'Multi-Depot VRPTW & QAOA Tour Optimization' : 'Multi-Depot VRPTW & HGS-ADC Tour Optimization',
          algorithm: currentMode === 'QUANTUM' ? 'Tier3Rank1QQAOASolver (Classiq QAOA / HGS)' : 'Tier3Rank1HGSADCSolver (HGS-ADC Classical)',
          calculationParams: currentMode === 'QUANTUM'
            ? s.calculationParams
            : [
                { key: 'solver_engine', label: 'Routing Engine', value: 'HGS-ADC (Hybrid Genetic Search)', hint: 'Advanced population-based search with diversity management' },
                { key: 'population_size', label: 'Population Size', value: '40 Individuals', hint: 'Genetic algorithm chromosome pool size' },
                { key: 'time_limit', label: 'Time Limit', value: '5.0s', unit: 'Wall-Clock Limit', hint: 'Maximum optimization search budget' },
                { key: 'lagrangian_weights', label: 'Lagrangian (α, β, γ, λ)', value: '1.0, 2.0, 5.0, 1.5', hint: 'Penalty terms for capacity, time-windows, battery' },
                { key: 'subtour_penalty', label: 'Subtour Penalty (P)', value: '100.0', unit: 'Penalty Term', hint: 'Subtour violation elimination penalty' },
              ],
        };
      }
      return { ...s };
    });
  };

  const handleDispatch = async (
    isInitial = false,
    scenarioIdOverride?: string,
    optionsOverride?: { num_orders?: number; num_vehicles?: number; seed?: number },
    actionType: 'DISPATCH_WAVE' | 'RE_RUN' | 'DATASET_DISPATCH' = 'DISPATCH_WAVE'
  ) => {
    const effectiveOrders = optionsOverride?.num_orders ?? preRequestConfig.num_orders ?? numOrders;

    // NEVER DISPATCH SET WITH 0 ORDERS! BLOCK AND SHOW MESSAGE!
    if (!effectiveOrders || effectiveOrders <= 0) {
      setIsSolving(false);
      showZeroOrdersToast('⚠️ Dispatch Blocked: Order count is 0. Workload set must contain at least 1 order (recommended: 5–150).');
      setIsZeroOrdersModalOpen(true);
      return;
    }

    setIsSolving(true);
    const targetScenario = scenarioIdOverride || currentScenarioId;

    let timerInterval: any = null;

    if (!isInitial) {
      // Initialize detailed 7-step pipeline execution state with current mode
      const modeSteps = getPipelineStepsForMode(mode);
      const stepsCopy = modeSteps.map((s, idx) => ({
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
        mode: mode === 'QUANTUM' ? '32Q' : 'CPU',
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
          mode: resp.mode || (mode === 'QUANTUM' ? '32Q' : 'CPU'),
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

  const handleSetDefaultOrdersAndDispatch = (count = 20) => {
    setNumOrders(count);
    setPreRequestConfig((prev) => ({ ...prev, num_orders: count }));
    setIsZeroOrdersModalOpen(false);
    handleDispatch(false, undefined, { num_orders: count }, 'DISPATCH_WAVE');
  };

  const resetAllDefaults = () => {
    const defaults: Record<string, any> = {};
    Object.entries(CONFIG_LIMITS).forEach(([k, spec]) => {
      defaults[k] = spec.default;
    });
    setPreRequestConfig(defaults);
  };

  const handleOpenProgressModal = () => {
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
      {/* Topbar HUD: Executive Control Deck with Integrated Breadcrumbs */}
      <TopbarHUD
        lastWave={lastWave}
        operationalMode={mode}
        setOperationalMode={handleModeChange}
        onDispatchClick={() => handleDispatch(false)}
        onReRunClick={handleReRun}
        isSolving={isSolving}
        runs={runs}
        currentRunId={currentRunId}
        onSelectRun={handleSelectHistoricalRun}
        dispatchProgress={dispatchProgress}
        onOpenProgressModal={handleOpenProgressModal}
        archetypes={archetypes}
        selectedArchetype={selectedArchetype}
        onSelectArchetype={(archKey) => {
          setSelectedArchetype(archKey);
          handleDispatch(false, undefined, undefined, 'DISPATCH_WAVE');
        }}
        currentScenarioId={currentScenarioId}
        numOrders={numOrders}
        numVehicles={numVehicles}
        seed={seed}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          trackTabChange(activeTab, tab);
          setActiveTab(tab);
        }}
        selectedEntity={selectedEntity}
        onClearEntity={() => {
          setSelectedEntity(null);
          setCameraPreset('overview');
        }}
        onOpenConfig={() => setIsConfigDrawerOpen(true)}
        onOpenPDF={handleOpenPDF}
        isSidebarExpanded={isSidebarExpanded}
        onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
      />

      {/* Dedicated Interactive Breadcrumbs Navigation Bar */}
      <BreadcrumbsBar
        archetypes={archetypes}
        selectedArchetype={selectedArchetype}
        onSelectArchetype={(archKey) => {
          setSelectedArchetype(archKey);
          handleDispatch(false, undefined, undefined, 'DISPATCH_WAVE');
        }}
        currentScenarioId={currentScenarioId}
        numOrders={numOrders}
        numVehicles={numVehicles}
        seed={seed}
        runs={runs}
        currentRunId={currentRunId}
        operationalMode={mode as 'QUANTUM' | 'CLASSICAL'}
        onSelectRun={handleSelectHistoricalRun}
        onReRunClick={handleReRun}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          trackTabChange(activeTab, tab);
          setActiveTab(tab);
        }}
        selectedEntity={selectedEntity}
        onClearEntity={() => {
          setSelectedEntity(null);
          setCameraPreset('overview');
        }}
        makespan={lastWave?.total_fleet_makespan_sec ?? 949.3}
        distance={lastWave?.total_distance_km ?? 3.71}
        onOpenConfig={() => setIsConfigDrawerOpen(true)}
        onOpenPDF={handleOpenPDF}
        onResetCamera={() => {
          setSelectedEntity(null);
          setCameraPreset('overview');
        }}
        selectedTier={selectedTier}
        onSelectTier={(tierKey) => {
          setSelectedTier(tierKey);
          trackTabChange(activeTab, 'tiers');
          setActiveTab('tiers');
        }}
        cameraPreset={cameraPreset}
        onSetCameraPreset={(preset) => {
          setCameraPreset(preset);
          if (activeTab !== '3d-sim') setActiveTab('3d-sim');
        }}
        reportsRepoMode={reportsRepoMode}
        onOpenReportsStudio={() => setReportsRepoMode('expanded')}
        onOpenOrdersDepotGenerator={handleOpenOrdersDepotGenerator}
        onSelectEntity={(entity) => {
          setSelectedEntity(entity);
          if (entity.type === 'AMR') setCameraPreset('follow');
        }}
        currentStep={currentNavStep}
      />

      {/* Workspace Body: Left-Docked Multi-Level Sidebar + Central Viewport */}
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
        {/* Multi-Level Sidebar Navigation with Dynamic Splitter */}
        <SidebarNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => {
            trackTabChange(activeTab, tab);
            setActiveTab(tab);
          }}
          selectedEntity={selectedEntity}
          onSelectEntity={(entity) => {
            setSelectedEntity(entity);
            if (entity.type === 'AMR') {
              setCameraPreset('follow');
            }
          }}
          onClearEntity={() => {
            setSelectedEntity(null);
            setCameraPreset('overview');
          }}
          sidebarWidth={sidebarWidth}
          setSidebarWidth={setSidebarWidth}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
          isPinned={isSidebarPinned}
          setIsPinned={setIsSidebarPinned}
          onOpenConfig={() => setIsConfigDrawerOpen(true)}
          onOpenQuickDrawer={() => setIsQuickDrawerOpen(!isQuickDrawerOpen)}
          onOpenPDF={handleOpenPDF}
          onToggleExplainer={() => setIsExplainerOpen(!isExplainerOpen)}
          isExplainerOpen={isExplainerOpen}
          onToggleQuantumPanel={() => setIsQuantumPanelOpen(!isQuantumPanelOpen)}
          onOpenConceptModal={() => setIsConceptModalOpen(true)}
          onOpenStepsModal={handleOpenProgressModal}
          onToggleReportsPanel={() =>
            setReportsRepoMode((prev) => (prev === 'expanded' ? 'minimized' : 'expanded'))
          }
          onOpenReportsStudio={() => setReportsRepoMode('expanded')}
          onSetCameraPreset={(preset) => {
            setCameraPreset(preset);
            if (activeTab !== '3d-sim') {
              setActiveTab('3d-sim');
            }
          }}
          cameraPreset={cameraPreset}
          onSelectArchetype={(archKey) => {
            setSelectedArchetype(archKey);
            trackTabChange(activeTab, 'dataset');
            setActiveTab('dataset');
          }}
          selectedArchetype={selectedArchetype}
          reportsCount={reportsCount}
          onOpenOrdersDepotGenerator={handleOpenOrdersDepotGenerator}
          selectedTier={selectedTier}
          onSelectTier={(tierKey) => {
            setSelectedTier(tierKey);
            trackTabChange(activeTab, 'tiers');
            setActiveTab('tiers');
          }}
          onMinimizeAllPanels={() => {
            setQuantumPanelMode('minimized');
            setReportsRepoMode('minimized');
          }}
          onRestoreAllPanels={() => {
            setQuantumPanelMode('expanded');
            setReportsRepoMode('expanded');
          }}
          onNavigate={(item) => {
            if (item.targetTab) {
              trackTabChange(activeTab, item.targetTab);
              setActiveTab(item.targetTab);
            }
          }}
        />

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
              runId={currentRunId}
              runs={runs}
              onSelectRun={handleSelectHistoricalRun}
              onNavigateTo2D={() => setActiveTab('2d-route-map')}
              operationalMode={mode}
              quantumPanelMode={quantumPanelMode}
              onQuantumPanelModeChange={setQuantumPanelMode}
              reportsRepoMode={reportsRepoMode}
              onReportsRepoModeChange={setReportsRepoMode}
              reportsCount={reportsCount}
              selectedVehicleId={selectedEntity?.type === 'AMR' ? selectedEntity.id : null}
              onSelectVehicle={(vehId) => {
                if (vehId) {
                  setSelectedEntity({ type: 'AMR', id: vehId });
                } else {
                  setSelectedEntity(null);
                }
              }}
              cameraPreset={cameraPreset}
            />
          )}
          {activeTab === '2d-route-map' && (
            <ErrorBoundary fallbackTitle="2D Coordinate Routing Map Studio">
              <RouteMap2DStudio
                schedule={schedule}
                runId={currentRunId}
                runs={runs}
                onSelectRun={handleSelectHistoricalRun}
                onNavigateTo3D={() => setActiveTab('3d-sim')}
              />
            </ErrorBoundary>
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
              isGeneratorOpen={isDatasetGeneratorOpen}
              onCloseGenerator={() => setIsDatasetGeneratorOpen(false)}
              selectedArchetype={selectedArchetype}
              initialParamKey={generatorInitialParam}
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
              selectedTierKey={selectedTier}
            />
          )}
          {activeTab === 'quantum' && <QuantumStudio runId={currentRunId} />}
          {activeTab === 'graphs' && <GraphStudio runId={currentRunId} />}
          {activeTab === 'comparison' && (
            <RunComparisonStudio
              onSelectRun={(runId) => {
                handleSelectHistoricalRun(runId);
                setActiveTab('3d-sim');
              }}
            />
          )}
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
          sidebarWidth={sidebarWidth}
          isSidebarExpanded={isSidebarExpanded}
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
      <LegalFooterBar
        onOpenLegalModal={() => setIsLegalModalOpen(true)}
        currentStep={currentNavStep}
        canGoBack={navHistory.length > 1}
        previousStepLabel={navHistory.length > 1 ? navHistory[navHistory.length - 2].step.label : undefined}
        onGoBack={handleGoBack}
        onNavigateSegment={handleNavigateSegment}
        operationalMode={mode as 'QUANTUM' | 'CLASSICAL'}
        currentRunId={currentRunId}
      />

      {/* Full Corporate Governance, Patent & Intellectual Property Modal */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Zero Orders Prevention & Validation Modal */}
      <ZeroOrdersBlockModal
        isOpen={isZeroOrdersModalOpen}
        onClose={() => setIsZeroOrdersModalOpen(false)}
        onSetDefaultOrdersAndDispatch={handleSetDefaultOrdersAndDispatch}
        onOpenGenerator={() => handleOpenOrdersDepotGenerator('num_orders')}
        configuredOrders={preRequestConfig.num_orders ?? numOrders}
      />

      {/* Floating Alert Toast for Zero Orders Prevention */}
      {zeroOrdersToastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'rgba(239, 68, 68, 0.95)',
            border: '1px solid #f87171',
            borderRadius: '8px',
            padding: '10px 18px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(239, 68, 68, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontWeight: 700,
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <span>{zeroOrdersToastMessage}</span>
          <button
            onClick={() => setZeroOrdersToastMessage(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 800,
              fontSize: '14px',
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        </div>
      )}

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
