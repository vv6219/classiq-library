import React from 'react';
import {
  Compass,
  RotateCcw,
  Sliders,
  FileSpreadsheet,
  CheckCircle2,
  Sparkles,
  Cpu,
} from 'lucide-react';
import { ArchetypeMeta, RunSummaryDTO } from '../../services/api';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { PDFProfileId } from '../../data/reportsRegistry';

import { StudioTabId } from '../../types/navigationState';

export interface BreadcrumbsBarProps {
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
  activeTab: StudioTabId;
  onSelectTab: (tab: StudioTabId) => void;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  onClearEntity: () => void;
  makespan?: number;
  distance?: number;
  onOpenConfig?: () => void;
  onOpenPDF?: (profile?: PDFProfileId) => void;
  onResetCamera?: () => void;
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

const TAB_TITLES: Record<string, string> = {
  '3d-sim': '3D Warehouse Digital Twin',
  '2d-route-map': '2D Route Map & Details',
  'telemetry': 'AMR Live Telemetry Stream',
  'dataset': 'Dataset & Scenario Studio (CRUD)',
  'tiers': '4-Tier Optimization Pipeline',
  'quantum': 'Classiq Quantum Co-Processor',
  'graphs': 'Performance Analytics & Graphs',
  'comparison': 'Multi-Run Comparison Matrix',
  'investigation': 'Incident Investigation & Root-Cause Studio',
};

export const BreadcrumbsBar: React.FC<BreadcrumbsBarProps> = ({
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
  makespan = 949.3,
  distance = 3.71,
  onOpenConfig,
  onOpenPDF,
  onResetCamera,
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
  const currentTabTitle = TAB_TITLES[activeTab] || 'Digital Twin';

  return (
    <div
      id="breadcrumbs-navigation-bar"
      className="breadcrumbs-deck glass-panel"
      style={{
        margin: '0 14px 6px',
        padding: '5px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        background: 'rgba(7, 15, 30, 0.88)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        borderRadius: '7px',
        boxShadow: '0 4px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        position: 'relative',
        zIndex: 100,
        minHeight: '38px',
        boxSizing: 'border-box',
        overflow: 'visible',
      }}
    >
      {/* LEFT: Distinct Cyber BREADCRUMBS Badge + 6-Node Navigation Lineage */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflow: 'visible',
          flex: 1,
        }}
      >
        {/* Prominent BREADCRUMBS Label */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 240, 255, 0.14)',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            color: '#00f0ff',
            fontSize: '9.5px',
            fontWeight: 800,
            letterSpacing: '0.08em',
            flexShrink: 0,
            boxShadow: '0 0 10px rgba(0, 240, 255, 0.22)',
            userSelect: 'none',
          }}
          title="Interactive Hierarchical Breadcrumbs Navigation Trail"
        >
          <Compass size={12} color="#00f0ff" />
          <span>BREADCRUMBS</span>
        </div>

        {/* Subtle Vertical Divider */}
        <div
          style={{
            width: '1px',
            height: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.16)',
            flexShrink: 0,
          }}
        />

        {/* 6-Node Interactive Breadcrumbs Component */}
        <BreadcrumbNavigation
          facilityId={facilityId}
          facilityName={facilityName}
          archetypes={archetypes}
          selectedArchetype={selectedArchetype}
          onSelectArchetype={onSelectArchetype}
          currentScenarioId={currentScenarioId}
          numOrders={numOrders}
          numVehicles={numVehicles}
          seed={seed}
          runs={runs}
          currentRunId={currentRunId}
          operationalMode={operationalMode}
          onSelectRun={onSelectRun}
          onReRunClick={onReRunClick}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
          selectedEntity={selectedEntity}
          onClearEntity={onClearEntity}
          makespan={makespan}
          distance={distance}
          onOpenConfig={onOpenConfig}
          onOpenPDF={() => onOpenPDF?.('EXECUTIVE')}
          selectedTier={selectedTier}
          onSelectTier={onSelectTier}
          cameraPreset={cameraPreset}
          onSetCameraPreset={onSetCameraPreset}
          reportsRepoMode={reportsRepoMode}
          onOpenReportsStudio={onOpenReportsStudio}
          onOpenOrdersDepotGenerator={onOpenOrdersDepotGenerator}
          onSelectEntity={onSelectEntity}
          currentStep={currentStep}
        />
      </div>

      {/* RIGHT: Studio Context & Quick Utility Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Active Studio Status Chip */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontSize: '10.5px',
            color: '#94a3b8',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'inline-block',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          <span>
            Studio: <strong style={{ color: '#00f0ff' }}>{currentTabTitle}</strong>
          </span>
        </div>

        {/* Mode Pill Indicator */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '4px',
            backgroundColor:
              operationalMode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.12)' : 'rgba(251, 191, 36, 0.12)',
            border:
              operationalMode === 'QUANTUM'
                ? '1px solid rgba(0, 240, 255, 0.35)'
                : '1px solid rgba(251, 191, 36, 0.35)',
            fontSize: '10px',
            fontWeight: 700,
            color: operationalMode === 'QUANTUM' ? '#00f0ff' : '#fbbf24',
          }}
        >
          {operationalMode === 'QUANTUM' ? <Sparkles size={11} /> : <Cpu size={11} />}
          <span>{operationalMode === 'QUANTUM' ? '32Q QAOA' : 'CPU HGS'}</span>
        </div>

        {/* Reset / Recenter Overview Button */}
        {onResetCamera && (
          <button
            onClick={onResetCamera}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.4)';
              e.currentTarget.style.color = '#00f0ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
            title="Reset focus to warehouse overview"
          >
            <RotateCcw size={11} />
            <span>Overview</span>
          </button>
        )}
      </div>
    </div>
  );
};
