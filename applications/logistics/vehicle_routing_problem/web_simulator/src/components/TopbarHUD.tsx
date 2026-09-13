import React from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  Cpu,
  PanelLeftClose,
  PanelLeftOpen,
  ListOrdered,
  Activity,
} from 'lucide-react';
import { WaveExecutionResponse, RunSummaryDTO, ArchetypeMeta, formatRunMode } from '../services/api';
import { CodeLmnBadge } from './CodeLmnBadge';
import { DispatchProgressState } from './DispatchProgressModal';
import { PDFProfileId } from '../data/reportsRegistry';
import {
  trackButtonClick,
  trackModeToggle,
  trackTelegramClick,
} from '../utils/analytics';

export interface TopbarHUDProps {
  lastWave: WaveExecutionResponse | null;
  operationalMode: string;
  setOperationalMode: (mode: string) => void;
  onDispatchClick: () => void;
  onReRunClick: () => void;
  isSolving: boolean;
  runs: RunSummaryDTO[];
  currentRunId: string;
  onSelectRun: (runId: string) => void;
  dispatchProgress?: DispatchProgressState | null;
  onOpenProgressModal?: () => void;

  // Breadcrumb props
  archetypes: ArchetypeMeta[];
  selectedArchetype: string;
  onSelectArchetype: (key: string) => void;
  currentScenarioId: string;
  numOrders: number;
  numVehicles: number;
  seed: number;
  activeTab: '3d-sim' | '2d-route-map' | 'dataset' | 'tiers' | 'quantum' | 'graphs' | 'comparison' | 'telemetry';
  onSelectTab: (tab: '3d-sim' | '2d-route-map' | 'dataset' | 'tiers' | 'quantum' | 'graphs' | 'comparison' | 'telemetry') => void;
  selectedEntity: { type: 'AMR' | 'CHUTE' | 'DEPOT' | 'ORDER'; id: string; telemetry?: any } | null;
  onClearEntity: () => void;
  onOpenConfig?: () => void;
  onOpenPDF?: (profile?: PDFProfileId) => void;
  isSidebarExpanded: boolean;
  onToggleSidebar: () => void;
}

export const TopbarHUD: React.FC<TopbarHUDProps> = ({
  lastWave,
  operationalMode,
  setOperationalMode,
  onDispatchClick,
  onReRunClick,
  isSolving,
  runs,
  currentRunId,
  onSelectRun,
  dispatchProgress,
  onOpenProgressModal,
  archetypes,
  selectedArchetype,
  onSelectArchetype,
  currentScenarioId,
  numOrders,
  numVehicles,
  seed,
  activeTab,
  onSelectTab,
  selectedEntity,
  onClearEntity,
  onOpenConfig,
  onOpenPDF,
  isSidebarExpanded,
  onToggleSidebar,
}) => {
  const makespan = lastWave?.total_fleet_makespan_sec ?? 949.3;
  const distance = lastWave?.total_distance_km ?? 3.71;
  const variance = lastWave?.chute_balance_variance ?? 0.45;
  const phi = lastWave?.falsification_ratio_phi ?? 0.880;

  const isReRunSolving = isSolving && dispatchProgress?.actionType === 'RE_RUN';
  const isDispatchSolving = isSolving && dispatchProgress?.actionType !== 'RE_RUN';
  const progressPercent = Math.round(dispatchProgress?.overallPercent ?? 0);

  const effectiveRuns = React.useMemo(() => {
    const list = [...(runs || [])];
    if (currentRunId && !list.some((r) => r.run_id === currentRunId)) {
      list.unshift({
        run_id: currentRunId,
        scenario_id: currentScenarioId || 'SCEN-7D42F06D',
        wave_id: 'WAVE-ACTIVE',
        operational_mode: operationalMode,
        mode: operationalMode === 'QUANTUM' ? '32Q' : 'CPU',
        makespan_sec: makespan,
        distance_km: distance,
        chute_variance: variance,
        solve_latency_sec: 0.1,
        falsification_ratio_phi: phi,
        is_falsified: false,
        timestamp: new Date().toISOString(),
      });
    }
    return list;
  }, [runs, currentRunId, operationalMode, currentScenarioId, makespan, distance, variance, phi]);

  return (
    <header
      className="glass-panel"
      style={{
        margin: '10px 14px 6px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexWrap: 'nowrap',
        position: 'relative',
        zIndex: 90,
        boxSizing: 'border-box',
      }}
    >
      {/* LEFT: Brand Emblem, Sidebar Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {/* Sidebar Collapse/Expand Button */}
        <button
          onClick={onToggleSidebar}
          style={{
            background: isSidebarExpanded ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            border: isSidebarExpanded ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '6px',
            color: isSidebarExpanded ? '#00f0ff' : '#94a3b8',
            padding: '5px 7px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}
          title={isSidebarExpanded ? 'Collapse Navigation Sidebar (Ctrl+B)' : 'Expand Navigation Sidebar (Ctrl+B)'}
        >
          {isSidebarExpanded ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
        </button>

        {/* Brand Emblem */}
        <div
          style={{
            width: '38px',
            height: '32px',
            borderRadius: '6px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
            flexShrink: 0,
            backgroundColor: '#070f1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1px',
          }}
        >
          <img
            src="/logo_emblem.png"
            alt="YesAndNo Quantum Computing Team Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>

        {/* Brand Title & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h1 style={{ fontSize: '13.5px', fontWeight: 800, letterSpacing: '-0.02em', color: '#f3f4f6', margin: 0, whiteSpace: 'nowrap' }}>
            WMS DIGITAL TWIN
          </h1>
          <span
            style={{
              fontSize: '9px',
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              color: '#00f0ff',
              padding: '1px 5px',
              borderRadius: '3px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
          >
            YES&amp;NO
          </span>

          {/* Telegram Channel Pill */}
          <a
            href="https://t.me/yesandnoQ"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackTelegramClick('Topbar_HUD')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: 'rgba(34, 158, 217, 0.2)',
              color: '#38bdf8',
              fontSize: '9px',
              fontWeight: 700,
              textDecoration: 'none',
              border: '1px solid rgba(34, 158, 217, 0.4)',
              whiteSpace: 'nowrap',
            }}
            title="Join YesAndNo Quantum Community on Telegram"
          >
            <span>@yesandnoQ</span>
          </a>
        </div>
      </div>

      {/* CENTER: Executive Real-Time KPIs & Verified Code LMN Badge */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
        <div className="glass-card" style={{ padding: '3px 9px', minWidth: '80px' }}>
          <div style={{ fontSize: '8.5px', color: '#9ca3af', fontWeight: 600 }}>MAKESPAN</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
            {makespan.toFixed(1)} s
          </div>
        </div>

        <div className="glass-card" style={{ padding: '3px 9px', minWidth: '80px' }}>
          <div style={{ fontSize: '8.5px', color: '#9ca3af', fontWeight: 600 }}>DISTANCE</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            {distance.toFixed(2)} km
          </div>
        </div>

        <div className="glass-card" style={{ padding: '3px 9px', minWidth: '80px' }}>
          <div style={{ fontSize: '8.5px', color: '#9ca3af', fontWeight: 600 }}>CHUTE VAR</div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            {variance.toFixed(2)} m³
          </div>
        </div>

        <CodeLmnBadge phi={phi}>
          <div
            className="glass-card"
            style={{
              padding: '3px 9px',
              minWidth: '95px',
              border: phi < 1.0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: phi < 1.0 ? '0 0 10px rgba(16, 185, 129, 0.15)' : '0 0 10px rgba(239, 68, 68, 0.15)',
              cursor: 'help',
            }}
          >
            <div style={{ fontSize: '8.5px', color: phi < 1.0 ? '#6ee7b7' : '#fca5a5', fontWeight: 700 }}>
              VERIFIED LMN
            </div>
            <div
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: phi < 1.0 ? '#10b981' : '#ef4444',
                fontFamily: 'var(--font-mono)',
              }}
            >
              Φ = {phi.toFixed(3)}
            </div>
          </div>
        </CodeLmnBadge>
      </div>

      {/* RIGHT: Run Selector, Engine Switcher, Re-Run & Dispatch Wave Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Run Selector Combobox Dropdown */}
        {effectiveRuns.length > 0 && onSelectRun && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '2px 8px',
              borderRadius: '6px',
              background: 'rgba(7, 15, 30, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              height: '28px',
              boxSizing: 'border-box',
            }}
            title={`Active Run ID: ${currentRunId || 'None'} - Switch execution run`}
          >
            <span style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
              RUN:
            </span>
            <select
              value={currentRunId || ''}
              onChange={(e) => {
                trackButtonClick('Select_Run_Combo', 'TopbarHUD', { run_id: e.target.value });
                onSelectRun(e.target.value);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                maxWidth: '175px',
              }}
            >
              {effectiveRuns.map((r) => (
                <option key={r.run_id} value={r.run_id} style={{ background: '#0d1527', color: '#f0f4f8' }}>
                  {r.run_id} • [{formatRunMode(r)}] {r.makespan_sec ? `${r.makespan_sec.toFixed(0)}s` : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Operational Mode Toggle Tab */}
        <button
          onClick={() => {
            const nextMode = operationalMode === 'QUANTUM' ? 'CLASSICAL' : 'QUANTUM';
            trackButtonClick('Toggle_Operational_Mode_Badge', 'TopLevel_HUD', { newMode: nextMode });
            setOperationalMode(nextMode);
          }}
          style={{
            fontSize: '11px',
            background: operationalMode === 'QUANTUM' ? 'rgba(6, 182, 212, 0.18)' : 'rgba(251, 191, 36, 0.18)',
            border: operationalMode === 'QUANTUM' ? '1px solid rgba(6, 182, 212, 0.6)' : '1px solid rgba(251, 191, 36, 0.6)',
            color: operationalMode === 'QUANTUM' ? '#22d3ee' : '#fbbf24',
            padding: '5px 10px',
            borderRadius: '6px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: operationalMode === 'QUANTUM' ? '0 0 10px rgba(6, 182, 212, 0.3)' : '0 0 10px rgba(251, 191, 36, 0.25)',
            transition: 'all 0.2s ease',
          }}
          title={
            operationalMode === 'QUANTUM'
              ? 'Active: Classiq Quantum Co-Processor (32Q QAOA). Click to switch to Classical CPU mode.'
              : 'Active: Classical Solvers (HGS-ADC). Click to switch to Classiq Quantum Co-Processor.'
          }
        >
          {operationalMode === 'QUANTUM' ? <Sparkles size={13} /> : <Cpu size={13} />}
          <span>{operationalMode === 'QUANTUM' ? 'CLASSIQ 32Q' : 'CPU MODE'}</span>
        </button>

        {/* Steps Modal Shortcut (When Solving or Available) */}
        {onOpenProgressModal && (
          <button
            onClick={onOpenProgressModal}
            style={{
              padding: '5px 8px',
              borderRadius: '6px',
              border: isSolving ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.12)',
              backgroundColor: isSolving ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: isSolving ? '#00f0ff' : '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              fontWeight: 600,
            }}
            title="View 7-step pipeline latency & execution status"
          >
            <ListOrdered size={13} />
            <span>Steps</span>
            {isSolving && (
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff' }}>
                {progressPercent}%
              </span>
            )}
          </button>
        )}

        {/* Primary Re-Run Button */}
        <button
          onClick={onReRunClick}
          disabled={isSolving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 700,
            backgroundColor: isReRunSolving ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.12)',
            border: '1px solid rgba(251, 191, 36, 0.55)',
            color: '#fbbf24',
            cursor: isSolving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 10px rgba(251, 191, 36, 0.2)',
          }}
          title={`Re-run active scenario with current mode: ${operationalMode} (${operationalMode === 'QUANTUM' ? '32Q QAOA' : 'CPU HGS-ADC'})`}
        >
          <RotateCcw size={13} className={isReRunSolving ? 'spin-animation' : ''} />
          <span>{isReRunSolving ? `Re-running (${operationalMode === 'QUANTUM' ? '32Q' : 'CPU'})...` : 'Re-Run'}</span>
        </button>

        {/* Primary Dispatch Wave CTA */}
        <button
          onClick={onDispatchClick}
          disabled={isSolving}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '11.5px',
            fontWeight: 800,
            background: isDispatchSolving
              ? 'rgba(0, 240, 255, 0.3)'
              : 'linear-gradient(135deg, #00f0ff 0%, #0284c7 100%)',
            border: '1px solid #00f0ff',
            color: '#050810',
            cursor: isSolving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.45)',
          }}
          title="Dispatch new optimization wave across all 4 tiers"
        >
          {isDispatchSolving ? (
            <>
              <Activity size={13} className="spin-animation" />
              <span>Solving {progressPercent}%</span>
            </>
          ) : (
            <>
              <Play size={13} fill="currentColor" />
              <span>DISPATCH WAVE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
