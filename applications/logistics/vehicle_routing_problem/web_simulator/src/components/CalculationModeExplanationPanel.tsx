import React, { useState } from 'react';
import {
  Sparkles,
  Cpu,
  ArrowRightLeft,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  BarChart2,
  BookOpen,
  Minus,
  Maximize2,
  Minimize2,
  Boxes,
  Zap,
} from 'lucide-react';
import katex from 'katex';

import { HUDPanelDisplayMode } from './common/HUDPanel';

interface CalculationModeExplanationPanelProps {
  mode: string; // 'QUANTUM' | 'CLASSICAL'
  onToggleMode: (newMode: string) => void;
  activeTiers: Record<string, string>;
  qaoaLayers?: number;
  qaoaShots?: number;
  qaoaOptimizer?: string;
  numVehicles?: number;
  numOrders?: number;
  isExplainerOpen?: boolean;
  panelMode?: HUDPanelDisplayMode;
  onPanelModeChange?: (newMode: HUDPanelDisplayMode) => void;
  sidebarWidth?: number;
  isSidebarExpanded?: boolean;
}

export const CalculationModeExplanationPanel: React.FC<CalculationModeExplanationPanelProps> = ({
  mode,
  onToggleMode,
  activeTiers,
  qaoaLayers = 2,
  qaoaShots = 1024,
  qaoaOptimizer = 'COBYLA',
  numVehicles = 4,
  numOrders = 20,
  isExplainerOpen = false,
  panelMode,
  onPanelModeChange,
  sidebarWidth = 260,
  isSidebarExpanded = false,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const isExpanded = panelMode !== undefined ? panelMode === 'expanded' : internalExpanded;

  const setIsExpanded = (val: boolean) => {
    if (onPanelModeChange) {
      onPanelModeChange(val ? 'expanded' : 'minimized');
    } else {
      setInternalExpanded(val);
    }
  };

  const [activeTab, setActiveTab] = useState<'architecture' | 'telemetry' | 'formula'>('architecture');
  const isQuantum = mode === 'QUANTUM';

  // Compute non-overlapping layout offsets
  const actualSidebarWidth = isSidebarExpanded ? sidebarWidth : 56;
  const computedLeft = `${actualSidebarWidth + 16}px`;
  const computedBottom = isExplainerOpen ? '480px' : '78px';

  // If panel is explicitly hidden via HUD dock/sidebar, don't render
  if (panelMode === 'hidden') return null;

  // Safe KaTeX rendering helper
  const renderFormula = (latex: string, displayMode: boolean = false) => {
    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode: displayMode,
      });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <code style={{ color: '#fbbf24' }}>{latex}</code>;
    }
  };

  const nextMode = isQuantum ? 'CLASSICAL' : 'QUANTUM';

  return (
    <div
      id="quantum-classiq-hud-card"
      style={{
        position: 'absolute',
        bottom: computedBottom,
        left: computedLeft,
        zIndex: 45,
        width: isExpanded ? '440px' : 'auto',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: isQuantum ? 'rgba(6, 12, 26, 0.96)' : 'rgba(22, 16, 8, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: isQuantum
          ? '1px solid rgba(0, 240, 255, 0.65)'
          : '1px solid rgba(245, 158, 11, 0.65)',
        borderRadius: '10px',
        boxShadow: isQuantum
          ? '0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(0, 240, 255, 0.25)'
          : '0 16px 45px rgba(0, 0, 0, 0.85), 0 0 25px rgba(245, 158, 11, 0.25)',
        color: '#e2e8f0',
        transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1), bottom 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s ease, box-shadow 0.2s ease',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Neon Accent Glow Strip */}
      <div
        style={{
          height: '2.5px',
          width: '100%',
          background: isQuantum
            ? 'linear-gradient(90deg, #00f0ff 0%, #a855f7 70%, transparent 100%)'
            : 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 70%, transparent 100%)',
          boxShadow: isQuantum
            ? '0 0 10px rgba(0, 240, 255, 0.6)'
            : '0 0 10px rgba(251, 191, 36, 0.6)',
        }}
      />

      {/* Top Header Bar */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: isQuantum
            ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.28), rgba(168, 85, 247, 0.22))'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.28), rgba(217, 119, 6, 0.22))',
          borderBottom: isExpanded
            ? isQuantum
              ? '1px solid rgba(0, 240, 255, 0.28)'
              : '1px solid rgba(245, 158, 11, 0.28)'
            : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Click to minimize explanation panel' : 'Click to expand mode details'}
      >
        {/* Active Engine Badge & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isQuantum ? 'rgba(0, 240, 255, 0.28)' : 'rgba(245, 158, 11, 0.28)',
              border: isQuantum ? '1px solid #00f0ff' : '1px solid #f59e0b',
              color: isQuantum ? '#00f0ff' : '#fbbf24',
              boxShadow: isQuantum ? '0 0 10px rgba(0, 240, 255, 0.4)' : '0 0 10px rgba(245, 158, 11, 0.4)',
              flexShrink: 0,
            }}
          >
            {isQuantum ? <Sparkles size={14} /> : <Cpu size={14} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: isQuantum ? '#38bdf8' : '#fbbf24',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {isQuantum ? 'Quantum (Classiq) 32Q' : 'Classical CPU Mode'}
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 800,
                  backgroundColor: isQuantum ? 'rgba(34, 197, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                  color: isQuantum ? '#4ade80' : '#60a5fa',
                  border: isQuantum ? '1px solid rgba(34, 197, 94, 0.45)' : '1px solid rgba(59, 130, 246, 0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span
                  style={{
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    backgroundColor: isQuantum ? '#4ade80' : '#60a5fa',
                    boxShadow: isQuantum ? '0 0 6px #4ade80' : '0 0 6px #60a5fa',
                  }}
                />
                ACTIVE
              </span>
            </div>
            <span
              style={{
                fontSize: '9.5px',
                color: '#94a3b8',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {isQuantum ? 'SC-QFCM + Classiq QAOA (p=2)' : 'Capacitated K-Means + HGS-ADC'}
            </span>
          </div>
        </div>

        {/* Action Buttons: Mode Switch & Expand/Collapse */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onToggleMode(nextMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '5px',
              backgroundColor: isQuantum ? 'rgba(245, 158, 11, 0.22)' : 'rgba(0, 240, 255, 0.22)',
              border: isQuantum ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(0, 240, 255, 0.6)',
              color: isQuantum ? '#fbbf24' : '#38bdf8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={`Switch solver engine to ${isQuantum ? 'Classical CPU' : 'Quantum (Classiq) 32Q'}`}
          >
            <ArrowRightLeft size={11} />
            <span>Switch to {isQuantum ? 'CPU' : '32Q'}</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '3px 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.15s ease',
            }}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
          </button>
        </div>
      </div>

      {/* Expanded Content Body with Compact Tabs */}
      {isExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {/* Sub-Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(0, 0, 0, 0.35)',
              padding: '3px 6px',
              gap: '4px',
            }}
          >
            {[
              { id: 'architecture', label: 'Architecture & Tiers', icon: <Layers size={11} /> },
              { id: 'telemetry', label: 'Hardware & Telemetry', icon: <BarChart2 size={11} /> },
              { id: 'formula', label: 'KaTeX Formulation', icon: <BookOpen size={11} /> },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '5px 6px',
                    fontSize: '9.5px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: '4px',
                    backgroundColor: isSelected
                      ? isQuantum
                        ? 'rgba(0, 240, 255, 0.2)'
                        : 'rgba(245, 158, 11, 0.2)'
                      : 'transparent',
                    border: isSelected
                      ? isQuantum
                        ? '1px solid rgba(0, 240, 255, 0.45)'
                        : '1px solid rgba(245, 158, 11, 0.45)'
                      : '1px solid transparent',
                    color: isSelected ? (isQuantum ? '#00f0ff' : '#fbbf24') : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: Architecture & Tiers */}
          {activeTab === 'architecture' && (
            <div style={{ padding: '10px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  backgroundColor: isQuantum ? 'rgba(6, 182, 212, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                  border: isQuantum ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '11px', color: isQuantum ? '#38bdf8' : '#fbbf24', marginBottom: '3px' }}>
                  <Activity size={12} />
                  <span>{isQuantum ? 'Classiq Quantum-Classical Co-Processor' : 'Multi-Core Deterministic IP Architecture'}</span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.45', color: '#cbd5e1', fontSize: '10px' }}>
                  {isQuantum
                    ? 'Orders are clustered in Hilbert feature space via SC-QFCM, and vehicle routes are synthesized into QAOA QUBO circuits running on the Classiq virtual QPU with 32 functional qubits.'
                    : 'Orders are partitioned via Capacitated K-Means Voronoi relaxation, and multi-AMR routes are solved with HGS-ADC genetic search and CP-SAT subtour cuts.'}
                </p>
              </div>

              {/* Comprehensive 4-Tier Pipeline Breakdown Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ padding: '6px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 1: Clustering</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#38bdf8' : '#fbbf24' }}>
                    {isQuantum ? 'SC-QFCM (Quantum)' : 'Capacitated K-Means'}
                  </strong>
                </div>

                <div style={{ padding: '6px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 2: 3D Bin Packing</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#2dd4bf' : '#34d399' }}>
                    {isQuantum ? 'Quantum QUBO BPP' : 'Best-Fit Decreasing'}
                  </strong>
                </div>

                <div style={{ padding: '6px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 3: Multi-AMR Routing</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#c084fc' : '#f59e0b' }}>
                    {isQuantum ? `Classiq QAOA (p=${qaoaLayers})` : 'HGS-ADC + CP-SAT'}
                  </strong>
                </div>

                <div style={{ padding: '6px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 4: Time Windows</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#f43f5e' : '#f87171' }}>
                    {isQuantum ? 'Q-Relaxation Dynamic' : 'CP-SAT Subtour Cuts'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Hardware & Telemetry */}
          {activeTab === 'telemetry' && (
            <div style={{ padding: '10px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '6px',
                  padding: '6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                {isQuantum ? (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Qubits</span>
                      <strong style={{ color: '#00f0ff', fontSize: '11px', fontFamily: 'monospace' }}>32 Q</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Ansatz</span>
                      <strong style={{ color: '#c084fc', fontSize: '11px', fontFamily: 'monospace' }}>p={qaoaLayers} QAOA</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Optimizer</span>
                      <strong style={{ color: '#4ade80', fontSize: '11px', fontFamily: 'monospace' }}>{qaoaOptimizer}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Backend</span>
                      <strong style={{ color: '#38bdf8', fontSize: '11px', fontFamily: 'monospace' }}>Virtual QPU</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Threads</span>
                      <strong style={{ color: '#fbbf24', fontSize: '11px', fontFamily: 'monospace' }}>Multi-Core</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Population</span>
                      <strong style={{ color: '#f59e0b', fontSize: '11px', fontFamily: 'monospace' }}>50 Indiv.</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Subtour Cut</span>
                      <strong style={{ color: '#4ade80', fontSize: '11px', fontFamily: 'monospace' }}>MTZ Exact</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Solver</span>
                      <strong style={{ color: '#60a5fa', fontSize: '11px', fontFamily: 'monospace' }}>OR-Tools</strong>
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  fontSize: '9.5px',
                  lineHeight: '1.45',
                  color: '#cbd5e1',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)',
                  padding: '7px 9px',
                  borderRadius: '5px',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                <strong style={{ color: isQuantum ? '#38bdf8' : '#fbbf24' }}>
                  {isQuantum ? '⚛️ Quantum Synthesis & Execution:' : '⚙️ Classical Engine Execution:'}
                </strong>{' '}
                {isQuantum
                  ? `Synthesized via Classiq SDK v0.42+. Executes ${qaoaShots} measurement shots with depth-48 entanglement ansatz across 32 registers.`
                  : 'Executed on local multi-threaded CPU. Provides deterministic feasibility bounds with zero sampling noise.'}
              </div>
            </div>
          )}

          {/* Tab 3: KaTeX Formulation */}
          {activeTab === 'formula' && (
            <div style={{ padding: '10px 12px 14px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
                {isQuantum ? 'QAOA Quantum State Evolution:' : 'Mixed-Integer Routing Objective:'}
              </span>
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.45)',
                  border: isQuantum ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                  fontSize: '10px',
                  textAlign: 'center',
                  color: isQuantum ? '#38bdf8' : '#fbbf24',
                  overflowX: 'auto',
                }}
              >
                {isQuantum
                  ? renderFormula('|\\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta})\\rangle = \\prod_{l=1}^p e^{-i \\beta_l H_M} e^{-i \\gamma_l H_C} |+\\rangle^{\\otimes 32}')
                  : renderFormula('\\min \\sum_{k} \\sum_{i,j} c_{ij} x_{ijk} \\quad \\text{s.t.} \\; u_i - u_j + q_i \\le Q(1 - x_{ij})')}
              </div>
              <span style={{ fontSize: '8.5px', color: '#94a3b8', lineHeight: '1.35' }}>
                {isQuantum
                  ? 'Alternating phase separator and mixer Hamiltonians mapped to 32 functional Qmod registers running on Classiq.'
                  : 'Miller-Tucker-Zemlin (MTZ) polynomial subtour elimination with continuous load variables.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
