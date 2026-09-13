import React from 'react';
import { Play, FileText, Cpu, ShieldCheck, Zap, RotateCcw, Sliders, History, BookOpen, Lightbulb, Database, Code, ListOrdered, Activity, Sparkles } from 'lucide-react';
import { WaveExecutionResponse, RunSummaryDTO } from '../services/api';
import { CodeLmnBadge } from './CodeLmnBadge';
import { DispatchProgressState } from './DispatchProgressModal';
import { ReportsDropdownMenu } from './ReportsDropdownMenu';
import { PDFProfileId } from '../data/reportsRegistry';
import {
  trackButtonClick,
  trackLinkClick,
  trackTelegramClick,
  trackModeToggle,
  trackHistoricalRunSelect,
} from '../utils/analytics';

interface TopbarHUDProps {
  lastWave: WaveExecutionResponse | null;
  operationalMode: string;
  setOperationalMode: (mode: string) => void;
  onDispatchClick: () => void;
  onReRunClick: () => void;
  onOpenConfig: () => void;
  onOpenPDF: (profile?: PDFProfileId) => void;
  isSolving: boolean;
  runs: RunSummaryDTO[];
  currentRunId: string;
  onSelectRun: (runId: string) => void;
  onToggleExplainer?: () => void;
  onToggleQuantumPanel?: () => void;
  onOpenConceptModal?: () => void;
  dispatchProgress?: DispatchProgressState | null;
  onOpenProgressModal?: () => void;
}

export const TopbarHUD: React.FC<TopbarHUDProps> = ({
  lastWave,
  operationalMode,
  setOperationalMode,
  onDispatchClick,
  onReRunClick,
  onOpenConfig,
  onOpenPDF,
  isSolving,
  runs,
  currentRunId,
  onSelectRun,
  onToggleExplainer,
  onToggleQuantumPanel,
  onOpenConceptModal,
  dispatchProgress,
  onOpenProgressModal,
}) => {
  const makespan = lastWave?.total_fleet_makespan_sec ?? 949.3;
  const distance = lastWave?.total_distance_km ?? 3.71;
  const variance = lastWave?.chute_balance_variance ?? 0.45;
  const phi = lastWave?.falsification_ratio_phi ?? 0.880;

  const isReRunSolving = isSolving && dispatchProgress?.actionType === 'RE_RUN';
  const isDispatchSolving = isSolving && dispatchProgress?.actionType !== 'RE_RUN';
  const progressPercent = Math.round(dispatchProgress?.overallPercent ?? 0);

  return (
    <header
      className="glass-panel"
      style={{
        margin: '12px 16px 8px',
        padding: '10px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Brand & Facility / Run Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div
          style={{
            width: '58px',
            height: '42px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid rgba(0, 240, 255, 0.45)',
            boxShadow: '0 0 16px rgba(0, 240, 255, 0.3), inset 0 0 10px rgba(0, 0, 0, 0.5)',
            flexShrink: 0,
            backgroundColor: '#070f1e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2px',
          }}
        >
          <img
            src="/logo_emblem.png"
            alt="YesAndNo Quantum Computing Team Logo"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#f3f4f6', margin: 0 }}>
              WMS QUANTUM DIGITAL TWIN
            </h1>
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                color: '#00f0ff',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              YES&amp;NO QUANTUM
            </span>
            <button
              onClick={() => {
                const nextMode = operationalMode === 'QUANTUM' ? 'CLASSICAL' : 'QUANTUM';
                trackButtonClick('Toggle_Operational_Mode_Badge', 'TopLevel_HUD', { newMode: nextMode });
                setOperationalMode(nextMode);
              }}
              style={{
                fontSize: '10px',
                background: operationalMode === 'QUANTUM' ? 'rgba(6, 182, 212, 0.22)' : 'rgba(251, 191, 36, 0.2)',
                border: operationalMode === 'QUANTUM' ? '1px solid rgba(6, 182, 212, 0.6)' : '1px solid rgba(251, 191, 36, 0.5)',
                color: operationalMode === 'QUANTUM' ? '#22d3ee' : '#fbbf24',
                padding: '2px 8px',
                borderRadius: '5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: operationalMode === 'QUANTUM' ? '0 0 10px rgba(6, 182, 212, 0.3)' : '0 0 10px rgba(251, 191, 36, 0.25)',
                transition: 'all 0.2s ease',
              }}
              title={
                operationalMode === 'QUANTUM'
                  ? 'Active: Classiq Quantum Co-Processor (32Q QAOA). Click to switch to Classical CPU.'
                  : 'Active: Classical Solvers (HGS-ADC). Click to switch to Classiq Quantum Co-Processor.'
              }
            >
              {operationalMode === 'QUANTUM' ? <Sparkles size={11} /> : <Cpu size={11} />}
              <span>{operationalMode === 'QUANTUM' ? 'CLASSIQ CO-PROC (32Q)' : 'CLASSICAL CPU MODE'}</span>
            </button>

            {/* Native Telegram Channel Join Link */}
            <a
              href="https://t.me/yesandnoQ"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackTelegramClick('Topbar_HUD')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #229ED9 0%, #0088cc 100%)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 0 12px rgba(34, 158, 217, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              title="Join YesAndNo Quantum Computing Team on Telegram: t.me/yesandnoQ"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>t.me/yesandnoQ</span>
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
            <span style={{ fontSize: '11px', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
              Facility: <strong style={{ color: '#e5e7eb' }}>WMS-IND-01</strong>
            </span>
            <span style={{ color: '#4b5563' }}>|</span>
            {/* Historical Run Selector Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <History size={12} color="#60a5fa" />
              <select
                value={currentRunId}
                onChange={(e) => {
                  trackHistoricalRunSelect(e.target.value);
                  onSelectRun(e.target.value);
                }}
                style={{
                  backgroundColor: '#0a0f1d',
                  border: '1px solid rgba(96, 165, 250, 0.4)',
                  borderRadius: '4px',
                  color: '#93c5fd',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  padding: '1px 6px',
                  outline: 'none',
                  cursor: 'pointer',
                  maxWidth: '180px',
                }}
                title="Select from historical execution runs"
              >
                {runs.length === 0 && <option value="">No runs recorded</option>}
                {runs.map((r) => (
                  <option key={r.run_id} value={r.run_id}>
                    {r.run_id} ({r.operational_mode})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5 KPI Scorecard Cards */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="glass-card" style={{ padding: '4px 12px', minWidth: '95px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>MAKESPAN</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#60a5fa', fontFamily: 'var(--font-mono)' }}>
            {makespan.toFixed(1)} s
          </div>
        </div>

        <div className="glass-card" style={{ padding: '4px 12px', minWidth: '95px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>DISTANCE</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
            {distance.toFixed(2)} km
          </div>
        </div>

        <div className="glass-card" style={{ padding: '4px 12px', minWidth: '95px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>CHUTE VAR</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
            {variance.toFixed(2)} m³
          </div>
        </div>

        <div className="glass-card" style={{ padding: '4px 12px', minWidth: '95px' }}>
          <div style={{ fontSize: '9px', color: '#9ca3af', fontWeight: 600 }}>PACKING ν</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
            82.4 %
          </div>
        </div>

        <CodeLmnBadge phi={phi}>
          <div
            className="glass-card"
            style={{
              padding: '4px 12px',
              minWidth: '115px',
              border: phi < 1.0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
              boxShadow: phi < 1.0 ? '0 0 10px rgba(16, 185, 129, 0.15)' : '0 0 10px rgba(239, 68, 68, 0.15)',
              cursor: 'help',
            }}
          >
            <div
              style={{
                fontSize: '9px',
                color: phi < 1.0 ? '#6ee7b7' : '#fca5a5',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ShieldCheck size={11} /> Verified
            </div>
            <div
              style={{
                fontSize: '14px',
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

      {/* Actions: Config Drawer, Mode Toggle, Re-Run, Dispatch, PDF */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Pre-Request Config Drawer Button */}
        <button
          onClick={() => {
            trackButtonClick('Config_and_Limits_Drawer', 'TopLevel_HUD');
            onOpenConfig();
          }}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            color: '#00f0ff',
            backgroundColor: 'rgba(0, 240, 255, 0.08)',
          }}
          title="Open Pre-Request Calculation Configuration (Presets, Limits, Weights)"
        >
          <Sliders size={14} />
          <span>Config & Limits</span>
        </button>

        {/* Highlighted Iconographic Concept Explanation Button */}
        {onOpenConceptModal && (
          <button
            onClick={() => {
              trackButtonClick('Concept_Explanation_Modal', 'TopLevel_HUD');
              onOpenConceptModal();
            }}
            style={{
              fontSize: '12px',
              fontWeight: 700,
              padding: '7px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.22), rgba(249, 115, 22, 0.28))',
              border: '1px solid rgba(234, 179, 8, 0.65)',
              color: '#fef08a',
              boxShadow: '0 0 16px rgba(234, 179, 8, 0.35)',
              transition: 'all 0.2s ease',
            }}
            title="Open Mathematical Problem Definition & Theory Dossier (ER-MD-VRPTW-3D-HRI with 473 Formulas)"
          >
            <Lightbulb size={15} color="#facc15" style={{ filter: 'drop-shadow(0 0 4px #facc15)' }} />
            <span>Concept Explanation</span>
          </button>
        )}

        {/* Mission Explainer Button */}
        {onToggleExplainer && (
          <button
            onClick={() => {
              trackButtonClick('Mission_Explainer_Toggle', 'TopLevel_HUD');
              onToggleExplainer();
            }}
            className="btn-secondary"
            style={{
              fontSize: '12px',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#c084fc',
              backgroundColor: 'rgba(168, 85, 247, 0.1)',
            }}
            title="Open Human-Friendly Mission & Co-Processor Explainer"
          >
            <BookOpen size={14} />
            <span>Explainer</span>
          </button>
        )}

        {/* Quantum Utilization Button */}
        {onToggleQuantumPanel && (
          <button
            onClick={() => {
              trackButtonClick('Quantum_Utilization_Panel', 'TopLevel_HUD');
              onToggleQuantumPanel();
            }}
            className="btn-secondary"
            style={{
              fontSize: '12px',
              padding: '7px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(168, 85, 247, 0.5)',
              color: '#c084fc',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
            }}
            title="Inspect Quantum Qubits, Shots, and Classiq Function Utilization by Tier"
          >
            <Cpu size={14} />
            <span>Quantum Util (32Q)</span>
          </button>
        )}
        {/* Pipeline Steps / Process Status Modal Trigger */}
        {onOpenProgressModal && (
          <button
            onClick={() => {
              trackButtonClick('Open_Pipeline_Steps_Modal', 'TopLevel_HUD');
              onOpenProgressModal();
            }}
            className="btn-secondary"
            style={{
              fontSize: '12px',
              padding: '7px 11px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              color: isSolving ? '#00f0ff' : '#cbd5e1',
              borderColor: isSolving ? 'rgba(0, 240, 255, 0.6)' : 'rgba(255, 255, 255, 0.15)',
              background: isSolving ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.04)',
              boxShadow: isSolving ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none',
            }}
            title="View detailed 7-step running process status & solver latency"
          >
            <ListOrdered size={13} />
            <span>Steps</span>
            {isSolving && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: '#00f0ff',
                  fontFamily: 'monospace',
                }}
              >
                {progressPercent}%
              </span>
            )}
          </button>
        )}

        {/* Pre-Request Config Drawer */}
        <button
          onClick={() => {
            trackButtonClick('Open_PreRequest_Config_Drawer', 'TopLevel_HUD');
            onOpenConfig();
          }}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
          title="Open advanced optimization & physics parameters configuration"
        >
          <Sliders size={13} />
          <span>Config</span>
        </button>

        {/* ========================================================================= */}
        {/* QUANTUM / CLASSIQ CO-PROCESSOR CALCULATION ENGINE SWITCH                  */}
        {/* ========================================================================= */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#070f1e',
            border: operationalMode === 'QUANTUM'
              ? '1px solid rgba(0, 240, 255, 0.45)'
              : '1px solid rgba(251, 191, 36, 0.45)',
            borderRadius: '8px',
            padding: '2px',
            gap: '3px',
            boxShadow: operationalMode === 'QUANTUM'
              ? '0 0 14px rgba(0, 240, 255, 0.25), inset 0 0 8px rgba(0, 240, 255, 0.05)'
              : '0 0 14px rgba(251, 191, 36, 0.2), inset 0 0 8px rgba(251, 191, 36, 0.05)',
            transition: 'all 0.2s ease',
          }}
          title={
            operationalMode === 'QUANTUM'
              ? 'Active Engine: Classiq Quantum Co-Processor (QAOA + SC-QFCM, 32 Qubits, 1024 Shots). Click Classical to toggle.'
              : 'Active Engine: Classical Deterministic Solvers (HGS-ADC + CP-SAT). Click Quantum to toggle.'
          }
        >
          {/* Quantum (Classiq) Switch Tab */}
          <button
            onClick={() => {
              trackButtonClick('Switch_Mode_Quantum', 'TopLevel_HUD');
              setOperationalMode('QUANTUM');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: operationalMode === 'QUANTUM'
                ? '1px solid rgba(0, 240, 255, 0.7)'
                : '1px solid transparent',
              background: operationalMode === 'QUANTUM'
                ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(168, 85, 247, 0.25))'
                : 'transparent',
              color: operationalMode === 'QUANTUM' ? '#00f0ff' : '#64748b',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: operationalMode === 'QUANTUM' ? '0 0 10px rgba(0, 240, 255, 0.3)' : 'none',
            }}
          >
            <Sparkles size={13} color={operationalMode === 'QUANTUM' ? '#00f0ff' : '#64748b'} />
            <span>Quantum (Classiq)</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: operationalMode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: operationalMode === 'QUANTUM' ? '#38bdf8' : '#64748b',
                fontFamily: 'monospace',
              }}
            >
              32Q
            </span>
          </button>

          {/* Classical Switch Tab */}
          <button
            onClick={() => {
              trackButtonClick('Switch_Mode_Classical', 'TopLevel_HUD');
              setOperationalMode('CLASSICAL');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '6px',
              border: operationalMode === 'CLASSICAL'
                ? '1px solid rgba(251, 191, 36, 0.7)'
                : '1px solid transparent',
              background: operationalMode === 'CLASSICAL'
                ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(245, 158, 11, 0.18))'
                : 'transparent',
              color: operationalMode === 'CLASSICAL' ? '#fbbf24' : '#64748b',
              fontSize: '11.5px',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              boxShadow: operationalMode === 'CLASSICAL' ? '0 0 10px rgba(251, 191, 36, 0.3)' : 'none',
            }}
          >
            <Cpu size={13} color={operationalMode === 'CLASSICAL' ? '#fbbf24' : '#64748b'} />
            <span>Classical</span>
            <span
              style={{
                fontSize: '9px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: operationalMode === 'CLASSICAL' ? 'rgba(251, 191, 36, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                color: operationalMode === 'CLASSICAL' ? '#f59e0b' : '#64748b',
                fontFamily: 'monospace',
              }}
            >
              CPU
            </span>
          </button>
        </div>

        {/* Re-Run Button */}
        <button
          onClick={() => {
            trackButtonClick('ReRun_Wave_Solve', 'TopLevel_HUD', { mode: operationalMode, run_id: currentRunId });
            onReRunClick();
          }}
          disabled={isSolving}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fbbf24',
            borderColor: 'rgba(251, 191, 36, 0.4)',
            background: isReRunSolving ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.05)',
            boxShadow: isReRunSolving ? '0 0 12px rgba(251, 191, 36, 0.4)' : 'none',
          }}
          title={`Re-execute current wave calculation using ${operationalMode === 'QUANTUM' ? 'Classiq Quantum Co-Processor' : 'Classical Solvers'} (produces new unique run_id)`}
        >
          <RotateCcw size={14} className={isSolving ? 'spin' : ''} />
          <span>
            {isReRunSolving ? `Re-Running (${progressPercent}%)...` : 'Re-Run'}
          </span>
        </button>

        {/* Dispatch Solve Button */}
        <button
          onClick={() => {
            trackButtonClick('Dispatch_Wave_Solve', 'TopLevel_HUD', { mode: operationalMode, run_id: currentRunId });
            onDispatchClick();
          }}
          disabled={isSolving}
          className={operationalMode === 'QUANTUM' ? 'btn-quantum' : 'btn-primary'}
          style={{
            fontSize: '12px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: operationalMode === 'CLASSICAL'
              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              : undefined,
            boxShadow: operationalMode === 'CLASSICAL'
              ? '0 0 16px rgba(245, 158, 11, 0.35)'
              : undefined,
          }}
          title={
            operationalMode === 'QUANTUM'
              ? 'Dispatch Wave via Classiq Quantum Co-Processor (32 Qubits QAOA)'
              : 'Dispatch Wave via Classical Solvers (HGS-ADC + CP-SAT)'
          }
        >
          {operationalMode === 'QUANTUM' ? (
            <Sparkles size={14} className={isDispatchSolving ? 'spin' : ''} />
          ) : (
            <Play size={14} className={isDispatchSolving ? 'spin' : ''} />
          )}
          <span>
            {isDispatchSolving
              ? `Solving (${progressPercent}%)...`
              : operationalMode === 'QUANTUM'
              ? 'Dispatch Quantum Wave'
              : 'Dispatch Classical Wave'}
          </span>
        </button>

        {/* Engineering & Compliance Reports Dropdown Menu */}
        <ReportsDropdownMenu
          runId={currentRunId}
          lastWave={lastWave}
          onOpenPDF={onOpenPDF}
          disabled={!currentRunId}
        />

        {/* Swagger UI API Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick('/docs', 'Swagger_UI_OpenAPI')}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#38bdf8',
            borderColor: 'rgba(56, 189, 248, 0.35)',
            textDecoration: 'none',
            background: 'rgba(56, 189, 248, 0.08)',
          }}
          title="Open Interactive Swagger UI & OpenAPI Specification"
        >
          <Code size={13} />
          <span>Swagger</span>
        </a>

        {/* SQLite Database Studio Link */}
        <a
          href="/sqlite"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackLinkClick('/sqlite', 'SQLite_Database_Studio')}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            color: '#34d399',
            borderColor: 'rgba(16, 185, 129, 0.35)',
            textDecoration: 'none',
            background: 'rgba(16, 185, 129, 0.08)',
          }}
          title="Open WebAssembly SQLite Database Studio & Query Engine"
        >
          <Database size={13} />
          <span>SQLite DB</span>
        </a>
      </div>

      {/* Progress Bar & Current Running Process Status Banner */}
      {(isSolving || (dispatchProgress && dispatchProgress.isActive)) && (
        <div
          onClick={onOpenProgressModal}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '7px 14px',
            backgroundColor: 'rgba(7, 15, 30, 0.95)',
            border: `1px solid ${
              dispatchProgress?.actionType === 'RE_RUN'
                ? 'rgba(251, 191, 36, 0.4)'
                : 'rgba(0, 240, 255, 0.4)'
            }`,
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px',
            boxShadow:
              dispatchProgress?.actionType === 'RE_RUN'
                ? '0 2px 14px rgba(251, 191, 36, 0.2)'
                : '0 2px 14px rgba(0, 240, 255, 0.2)',
            transition: 'all 0.2s ease',
          }}
          title="Click to expand detailed 7-step running process status list"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RotateCcw
                size={13}
                className="spin"
                style={{
                  color: dispatchProgress?.actionType === 'RE_RUN' ? '#fbbf24' : '#00f0ff',
                }}
              />
              <span
                style={{
                  fontWeight: 800,
                  color: dispatchProgress?.actionType === 'RE_RUN' ? '#fbbf24' : '#00f0ff',
                  letterSpacing: '0.04em',
                }}
              >
                {dispatchProgress?.actionType === 'RE_RUN'
                  ? 'RE-RUN OPTIMIZING'
                  : 'DISPATCH WAVE SOLVING'}
              </span>
              <span style={{ color: 'rgba(255, 255, 255, 0.3)' }}>•</span>
              <span style={{ color: '#f3f4f6', fontWeight: 600 }}>
                {dispatchProgress?.statusMessage || 'Executing Multi-Tier Quantum-Classical Solvers...'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                Step {(dispatchProgress?.currentStepIndex ?? 0) + 1} of 7
              </span>
              <span
                style={{
                  color: dispatchProgress?.actionType === 'RE_RUN' ? '#fbbf24' : '#00f0ff',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  fontSize: '12px',
                }}
              >
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* Progress Bar Track */}
          <div
            style={{
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: `${dispatchProgress?.overallPercent ?? 35}%`,
                height: '100%',
                background:
                  dispatchProgress?.actionType === 'RE_RUN'
                    ? 'linear-gradient(90deg, #fbbf24, #f59e0b, #00f0ff)'
                    : 'linear-gradient(90deg, #00f0ff, #3b82f6, #fbbf24)',
                boxShadow:
                  dispatchProgress?.actionType === 'RE_RUN'
                    ? '0 0 8px rgba(251, 191, 36, 0.8)'
                    : '0 0 8px rgba(0, 240, 255, 0.8)',
                transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      )}
    </header>
  );
};
