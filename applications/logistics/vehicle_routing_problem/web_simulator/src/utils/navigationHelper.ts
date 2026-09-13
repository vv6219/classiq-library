import { NavigationStep, NavigationSnapshot, StudioTabId } from '../types/navigationState';

export interface PillarMeta {
  id: string;
  title: string;
  shortTitle: string;
  color: string;
  iconName: string;
  defaultTab?: StudioTabId;
}

export const PILLARS_CATALOG: PillarMeta[] = [
  {
    id: 'pillar-1',
    title: 'Digital Twin & Fleet Operations',
    shortTitle: 'Fleet & Twin',
    color: '#00f0ff',
    iconName: 'Box',
    defaultTab: '3d-sim',
  },
  {
    id: 'pillar-2',
    title: 'Workload, Scenarios & Solvers',
    shortTitle: 'Workload & Solvers',
    color: '#fbbf24',
    iconName: 'Layers',
    defaultTab: 'dataset',
  },
  {
    id: 'pillar-3',
    title: 'Classiq Quantum Co-Processor',
    shortTitle: 'Classiq Quantum',
    color: '#c084fc',
    iconName: 'Atom',
    defaultTab: 'quantum',
  },
  {
    id: 'pillar-4',
    title: 'Analytics, Auditing & Reports',
    shortTitle: 'Analytics & Reports',
    color: '#34d399',
    iconName: 'BarChart3',
    defaultTab: 'graphs',
  },
  {
    id: 'pillar-reports-studio',
    title: 'Reports Manager Studio',
    shortTitle: 'Reports Studio',
    color: '#10b981',
    iconName: 'FileText',
  },
  {
    id: 'pillar-5',
    title: 'Knowledge, Theory & Developer Tools',
    shortTitle: 'Theory & Tools',
    color: '#60a5fa',
    iconName: 'Lightbulb',
  },
];

/**
 * Resolves current pillar from activeTab or active menu context
 */
export function resolvePillarForTab(tab: StudioTabId): PillarMeta {
  switch (tab) {
    case '3d-sim':
    case '2d-route-map':
    case 'telemetry':
      return PILLARS_CATALOG[0]; // pillar-1
    case 'dataset':
    case 'tiers':
      return PILLARS_CATALOG[1]; // pillar-2
    case 'quantum':
      return PILLARS_CATALOG[2]; // pillar-3
    case 'graphs':
    case 'comparison':
      return PILLARS_CATALOG[3]; // pillar-4
    default:
      return PILLARS_CATALOG[0];
  }
}

/**
 * Derives full hierarchical navigation lineage based on the current application state
 */
export function computeCurrentNavigationStep(params: {
  activeTab: StudioTabId;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  selectedTier?: string;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null;
  selectedArchetype?: string;
  reportsRepoMode?: 'hidden' | 'minimized' | 'expanded';
  currentRunId?: string;
  facilityId?: string;
  facilityName?: string;
  numOrders?: number;
  numVehicles?: number;
  operationalMode?: 'QUANTUM' | 'CLASSICAL';
}): NavigationStep {
  const {
    activeTab,
    selectedEntity,
    selectedTier,
    cameraPreset,
    reportsRepoMode,
    currentRunId,
    facilityId = 'WMS-IND-01',
  } = params;

  // If reports repo is expanded, it takes high-level studio focus
  if (reportsRepoMode === 'expanded') {
    return {
      id: 'step-reports-studio',
      label: 'Reports Manager Studio',
      shortLabel: 'Reports Studio',
      pillarId: 'pillar-reports-studio',
      pillarTitle: 'Reports Manager Studio',
      pillarColor: '#10b981',
      menuItemId: 'menu-reports-studio-main',
      menuItemLabel: 'Reports Repository & Dossier Catalog',
      subGroupId: 'sub-studio-launch-panel',
      subGroupLabel: 'Artifact Repository Dock',
      tab: activeTab,
      runId: currentRunId,
      facilityId,
      timestamp: Date.now(),
    };
  }

  const pillar = resolvePillarForTab(activeTab);

  let menuItemId = `menu-${activeTab}`;
  let menuItemLabel = 'Studio View';
  let subGroupId: string | undefined;
  let subGroupLabel: string | undefined;
  let leafId: string | undefined;
  let leafLabel: string | undefined;

  switch (activeTab) {
    case '3d-sim':
      menuItemId = 'menu-3d-sim';
      menuItemLabel = '3D Warehouse Digital Twin';
      if (selectedEntity && selectedEntity.type === 'AMR') {
        subGroupId = 'amr-fleet';
        subGroupLabel = 'Active AMR Fleet';
        leafId = selectedEntity.id;
        leafLabel = `${selectedEntity.id} (${selectedEntity.telemetry?.soc ?? 88}% SoC)`;
      } else if (cameraPreset && cameraPreset !== 'overview') {
        subGroupId = 'camera-presets';
        subGroupLabel = 'Camera Perspectives';
        leafId = `cam-${cameraPreset}`;
        leafLabel =
          cameraPreset === 'top'
            ? 'Top-Down Orthographic'
            : cameraPreset === 'isometric'
            ? 'Isometric 45° Cyber'
            : cameraPreset === 'follow'
            ? 'Floor Follower'
            : 'Chute Array Focus';
      } else {
        subGroupId = 'sub-facility-envelope';
        subGroupLabel = 'Facility Overview (150m×100m)';
      }
      break;

    case '2d-route-map':
      menuItemId = 'menu-2d-route-map';
      menuItemLabel = '2D Coordinate Routing Map';
      subGroupId = 'sub-trajectories';
      subGroupLabel = 'Trajectories & Waypoints';
      break;

    case 'telemetry':
      menuItemId = 'menu-telemetry';
      menuItemLabel = 'Real-Time Telemetry Console';
      subGroupId = 'sub-kinematics';
      subGroupLabel = 'AMR Kinematics Stream';
      break;

    case 'dataset':
      menuItemId = 'menu-dataset';
      menuItemLabel = 'Dataset & Scenario Studio (CRUD)';
      subGroupId = 'archetypes-group';
      subGroupLabel = 'Warehouse Archetypes';
      if (params.selectedArchetype) {
        leafId = params.selectedArchetype;
        leafLabel = params.selectedArchetype.replace(/_/g, ' ');
      }
      break;

    case 'tiers':
      menuItemId = 'menu-tiers';
      menuItemLabel = '4-Tier Optimization Pipeline';
      if (selectedTier === 'tier1') {
        subGroupId = 'sub-tier-1';
        subGroupLabel = 'Tier 1: Quantum FCM Clustering (Rank 1Q)';
      } else if (selectedTier === 'tier2') {
        subGroupId = 'sub-tier-2';
        subGroupLabel = 'Tier 2: CP-SAT 3D Bin Packing (LIFO DAG)';
      } else if (selectedTier === 'tier3') {
        subGroupId = 'sub-tier-3';
        subGroupLabel = 'Tier 3: Classiq QAOA Subtour Synthesis (32Q)';
      } else if (selectedTier === 'tier4') {
        subGroupId = 'sub-tier-4';
        subGroupLabel = 'Tier 4: Continuous SIPP MAPF (Swept 3D)';
      } else {
        subGroupId = 'sub-tier-3';
        subGroupLabel = 'Tier 3: Classiq QAOA';
      }
      break;

    case 'quantum':
      menuItemId = 'menu-quantum-studio';
      menuItemLabel = 'Quantum Studio & Circuit Synthesis';
      subGroupId = 'sub-energy-landscape';
      subGroupLabel = 'QAOA Cost Surface (γ, β)';
      break;

    case 'graphs':
      menuItemId = 'menu-graphs';
      menuItemLabel = 'Performance Analytics & Pareto Graphs';
      subGroupId = 'sub-pareto';
      subGroupLabel = 'Makespan & Distance Pareto Front';
      break;

    case 'comparison':
      menuItemId = 'menu-comparison';
      menuItemLabel = 'Historical Run Comparative Benchmark';
      subGroupId = 'sub-delta-audit';
      subGroupLabel = 'Quantum vs Classical Delta Audit';
      break;
  }

  return {
    id: `step-${menuItemId}-${subGroupId || ''}-${leafId || ''}`,
    label: leafLabel || subGroupLabel || menuItemLabel,
    shortLabel: leafLabel ? leafLabel.substring(0, 16) : menuItemLabel.substring(0, 18),
    pillarId: pillar.id,
    pillarTitle: pillar.title,
    pillarColor: pillar.color,
    menuItemId,
    menuItemLabel,
    subGroupId,
    subGroupLabel,
    leafId,
    leafLabel,
    tab: activeTab,
    entity: selectedEntity,
    tierKey: selectedTier,
    cameraPreset,
    archetypeKey: params.selectedArchetype,
    runId: currentRunId,
    facilityId,
    timestamp: Date.now(),
  };
}

/**
 * Builds breadcrumb lineage segments for display in status bar and breadcrumb deck
 */
export function buildBreadcrumbSegments(
  step: NavigationStep,
  facilityName: string = 'Berlin Mega-Hub'
): { level: string; label: string; id: string; color?: string; tab?: StudioTabId }[] {
  const segments: { level: string; label: string; id: string; color?: string; tab?: StudioTabId }[] = [];

  // Level 1: Facility
  segments.push({
    level: 'facility',
    label: facilityName,
    id: step.facilityId || 'WMS-IND-01',
    color: '#00f0ff',
  });

  // Level 2: Pillar
  if (step.pillarTitle) {
    segments.push({
      level: 'pillar',
      label: step.pillarTitle,
      id: step.pillarId || 'pillar-1',
      color: step.pillarColor || '#00f0ff',
    });
  }

  // Level 3: Menu Item
  if (step.menuItemLabel) {
    segments.push({
      level: 'menu',
      label: step.menuItemLabel,
      id: step.menuItemId || '',
      color: '#cbd5e1',
      tab: step.tab,
    });
  }

  // Level 4: Sub-Group / Specific Target
  if (step.subGroupLabel && step.subGroupLabel !== step.menuItemLabel) {
    segments.push({
      level: 'subgroup',
      label: step.subGroupLabel,
      id: step.subGroupId || '',
      color: '#38bdf8',
      tab: step.tab,
    });
  }

  // Level 5: Leaf Node (e.g. specific AMR or Camera preset)
  if (step.leafLabel) {
    segments.push({
      level: 'leaf',
      label: step.leafLabel,
      id: step.leafId || '',
      color: '#34d399',
      tab: step.tab,
    });
  }

  return segments;
}
