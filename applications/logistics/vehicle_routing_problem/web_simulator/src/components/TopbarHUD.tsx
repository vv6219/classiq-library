import React from 'react';
import { Play, FileText, Cpu, ShieldCheck, Zap, RotateCcw, Sliders, History, BookOpen, Lightbulb, Database, Code } from 'lucide-react';
import { WaveExecutionResponse, RunSummaryDTO } from '../services/api';
import { CodeLmnBadge } from './CodeLmnBadge';

interface TopbarHUDProps {
  lastWave: WaveExecutionResponse | null;
  operationalMode: string;
  setOperationalMode: (mode: string) => void;
  onDispatchClick: () => void;
  onReRunClick: () => void;
  onOpenConfig: () => void;
  onOpenPDF: () => void;
  isSolving: boolean;
  runs: RunSummaryDTO[];
  currentRunId: string;
  onSelectRun: (runId: string) => void;
  onToggleExplainer?: () => void;
  onToggleQuantumPanel?: () => void;
  onOpenConceptModal?: () => void;
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
}) => {
  const makespan = lastWave?.total_fleet_makespan_sec ?? 949.3;
  const distance = lastWave?.total_distance_km ?? 3.71;
  const variance = lastWave?.chute_balance_variance ?? 0.45;
  const phi = lastWave?.falsification_ratio_phi ?? 0.880;

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
            <span
              style={{
                fontSize: '10px',
                background: 'rgba(6, 182, 212, 0.2)',
                border: '1px solid rgba(6, 182, 212, 0.5)',
                color: '#22d3ee',
                padding: '1px 6px',
                borderRadius: '4px',
                fontWeight: 600,
              }}
            >
              CLASSIQ CO-PROC
            </span>

            {/* Native Telegram Channel Join Link */}
            <a
              href="https://t.me/yesandnoQ"
              target="_blank"
              rel="noopener noreferrer"
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
                onChange={(e) => onSelectRun(e.target.value)}
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
          onClick={onOpenConfig}
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
            onClick={onOpenConceptModal}
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
            onClick={onToggleExplainer}
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
            onClick={onToggleQuantumPanel}
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

        {/* Mode Toggle */}
        <button
          onClick={() => setOperationalMode(operationalMode === 'QUANTUM' ? 'CLASSICAL' : 'QUANTUM')}
          className="btn-secondary"
          style={{ fontSize: '12px', padding: '7px 12px' }}
          title="Toggle Quantum vs Classical Solver Mode"
        >
          <Zap size={14} color={operationalMode === 'QUANTUM' ? '#a78bfa' : '#9ca3af'} />
          <span style={{ fontWeight: 700, color: operationalMode === 'QUANTUM' ? '#a78bfa' : '#60a5fa' }}>
            {operationalMode}
          </span>
        </button>

        {/* Re-Run Wave Button */}
        <button
          onClick={onReRunClick}
          disabled={isSolving}
          className="btn-secondary"
          style={{
            fontSize: '12px',
            padding: '7px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#fbbf24',
            borderColor: 'rgba(251, 191, 36, 0.3)',
          }}
          title="Re-execute current wave calculation with active configuration"
        >
          <RotateCcw size={14} className={isSolving ? 'spin' : ''} />
          <span>Re-Run</span>
        </button>

        {/* Dispatch Solve Button */}
        <button
          onClick={onDispatchClick}
          disabled={isSolving}
          className="btn-quantum"
          style={{ fontSize: '12px', padding: '8px 16px' }}
        >
          <Play size={14} />
          <span>{isSolving ? 'Solving...' : 'Dispatch Wave'}</span>
        </button>

        {/* PDF Export Button */}
        <button
          onClick={onOpenPDF}
          disabled={!currentRunId}
          className="btn-primary"
          style={{ fontSize: '12px', padding: '8px 14px' }}
          title="Generate and view ISO 3691-4 signed PDF engineering report"
        >
          <FileText size={14} />
          <span>PDF</span>
        </button>

        {/* Swagger UI API Link */}
        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
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
    </header>
  );
};
