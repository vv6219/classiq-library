export type StudioTabId =
  | '3d-sim'
  | '2d-route-map'
  | 'dataset'
  | 'tiers'
  | 'quantum'
  | 'graphs'
  | 'comparison'
  | 'telemetry';

export interface NavigationStep {
  id: string;
  label: string;
  shortLabel?: string;
  pillarId?: string;
  pillarTitle?: string;
  pillarColor?: string;
  menuItemId?: string;
  menuItemLabel?: string;
  subGroupId?: string;
  subGroupLabel?: string;
  leafId?: string;
  leafLabel?: string;
  tab?: StudioTabId;
  entity?: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  tierKey?: string;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null;
  archetypeKey?: string;
  runId?: string;
  facilityId?: string;
  modal?: 'config' | 'quick-drawer' | 'pdf' | 'concept' | 'steps' | 'reports' | 'quantum-panel' | null;
  timestamp: number;
}

export interface NavigationSnapshot {
  activeTab: StudioTabId;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  selectedTier?: string;
  cameraPreset?: 'overview' | 'top' | 'isometric' | 'follow' | 'chute-focus' | null;
  selectedArchetype?: string;
  currentRunId?: string;
  reportsRepoMode?: 'hidden' | 'minimized' | 'expanded';
  step: NavigationStep;
  timestamp?: number;
}
