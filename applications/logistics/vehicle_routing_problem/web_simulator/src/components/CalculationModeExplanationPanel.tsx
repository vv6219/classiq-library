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
      style={{
        position: 'absolute',
        bottom: isExplainerOpen ? '455px' : '62px',
        left: '16px',
        zIndex: 35,
        width: isExpanded ? '410px' : 'auto',
        maxWidth: 'calc(100vw - 32px)',
        backgroundColor: isQuantum ? 'rgba(7, 14, 28, 0.95)' : 'rgba(24, 18, 8, 0.95)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: isQuantum
          ? '1px solid rgba(0, 240, 255, 0.5)'
          : '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '10px',
        boxShadow: isQuantum
          ? '0 10px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(0, 240, 255, 0.18)'
          : '0 10px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(245, 158, 11, 0.18)',
        color: '#e2e8f0',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          background: isQuantum
            ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.22), rgba(168, 85, 247, 0.18))'
            : 'linear-gradient(90deg, rgba(245, 158, 11, 0.22), rgba(217, 119, 6, 0.18))',
          borderBottom: isExpanded
            ? isQuantum
              ? '1px solid rgba(0, 240, 255, 0.25)'
              : '1px solid rgba(245, 158, 11, 0.25)'
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
              width: '24px',
              height: '24px',
              borderRadius: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isQuantum ? 'rgba(0, 240, 255, 0.25)' : 'rgba(245, 158, 11, 0.25)',
              border: isQuantum ? '1px solid #00f0ff' : '1px solid #f59e0b',
              color: isQuantum ? '#00f0ff' : '#fbbf24',
              flexShrink: 0,
            }}
          >
            {isQuantum ? <Sparkles size={13} /> : <Cpu size={13} />}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: isQuantum ? '#38bdf8' : '#fbbf24',
                  textTransform: 'uppercase',
                }}
              >
                {isQuantum ? 'Quantum (Classiq) 32Q' : 'Classical CPU Mode'}
              </span>
              <span
                style={{
                  fontSize: '8.5px',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  fontWeight: 700,
                  backgroundColor: isQuantum ? 'rgba(34, 197, 94, 0.25)' : 'rgba(59, 130, 246, 0.25)',
                  color: isQuantum ? '#4ade80' : '#60a5fa',
                  border: isQuantum ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(59, 130, 246, 0.4)',
                }}
              >
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
              {isQuantum ? 'SC-QFCM + Classiq QAOA' : 'Capacitated K-Means + HGS-ADC'}
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
              padding: '3px 7px',
              fontSize: '10px',
              fontWeight: 700,
              borderRadius: '5px',
              backgroundColor: isQuantum ? 'rgba(245, 158, 11, 0.2)' : 'rgba(0, 240, 255, 0.2)',
              border: isQuantum ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(0, 240, 255, 0.5)',
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
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
            }}
            title={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
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
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              padding: '2px 6px',
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
                    padding: '4px 6px',
                    fontSize: '9.5px',
                    fontWeight: isSelected ? 700 : 500,
                    borderRadius: '4px',
                    backgroundColor: isSelected
                      ? isQuantum
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)'
                      : 'transparent',
                    border: isSelected
                      ? isQuantum
                        ? '1px solid rgba(0, 240, 255, 0.35)'
                        : '1px solid rgba(245, 158, 11, 0.35)'
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
            <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div
                style={{
                  backgroundColor: isQuantum ? 'rgba(6, 182, 212, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  border: isQuantum ? '1px solid rgba(6, 182, 212, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '6px',
                  padding: '7px 10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 700, fontSize: '10.5px', color: isQuantum ? '#38bdf8' : '#fbbf24', marginBottom: '3px' }}>
                  <Activity size={12} />
                  <span>{isQuantum ? 'Classiq Quantum-Classical Co-Processor' : 'Multi-Core Deterministic IP Architecture'}</span>
                </div>
                <p style={{ margin: 0, lineHeight: '1.4', color: '#cbd5e1', fontSize: '10px' }}>
                  {isQuantum
                    ? 'Orders are clustered in Hilbert feature space via SC-QFCM, and vehicle routes are synthesized into QAOA QUBO circuits running on the Classiq virtual QPU.'
                    : 'Orders are partitioned via Capacitated K-Means Voronoi relaxation, and multi-AMR routes are solved with HGS-ADC genetic search and CP-SAT subtour cuts.'}
                </p>
              </div>

              {/* Tiers Breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ padding: '5px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 1: Clustering</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#38bdf8' : '#fbbf24' }}>
                    {isQuantum ? 'SC-QFCM (Quantum)' : 'Capacitated K-Means'}
                  </strong>
                </div>

                <div style={{ padding: '5px 8px', borderRadius: '5px', backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Tier 3: Routing</span>
                  <strong style={{ fontSize: '10px', color: isQuantum ? '#c084fc' : '#f59e0b' }}>
                    {isQuantum ? `Classiq QAOA (p=${qaoaLayers})` : 'HGS-ADC + CP-SAT'}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Hardware & Telemetry */}
          {activeTab === 'telemetry' && (
            <div style={{ padding: '8px 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '6px',
                  padding: '5px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {isQuantum ? (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Qubits</span>
                      <strong style={{ color: '#00f0ff', fontSize: '11px', fontFamily: 'monospace' }}>32 Q</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>QAOA Layers</span>
                      <strong style={{ color: '#c084fc', fontSize: '11px', fontFamily: 'monospace' }}>p = {qaoaLayers}</strong>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>Optimizer</span>
                      <strong style={{ color: '#4ade80', fontSize: '11px', fontFamily: 'monospace' }}>{qaoaOptimizer}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '8.5px', color: '#94a3b8', display: 'block' }}>CPU Threads</span>
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
                  </>
                )}
              </div>

              <div style={{ fontSize: '9.5px', lineHeight: '1.4', color: '#cbd5e1' }}>
                <strong style={{ color: isQuantum ? '#38bdf8' : '#fbbf24' }}>
                  {isQuantum ? '⚛️ Quantum Execution:' : '⚙️ Classical Execution:'}
                </strong>{' '}
                {isQuantum
                  ? `Synthesized via Classiq SDK v0.42+. Executes ${qaoaShots} measurement shots with depth-48 entanglement ansatz.`
                  : 'Executed on local multi-threaded CPU. Provides deterministic feasibility bounds with zero sampling noise.'}
              </div>
            </div>
          )}

          {/* Tab 3: KaTeX Formulation */}
          {activeTab === 'formula' && (
            <div style={{ padding: '8px 12px 14px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>
                {isQuantum ? 'QAOA Quantum State Evolution:' : 'Mixed-Integer Routing Objective:'}
              </span>
              <div
                style={{
                  padding: '6px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  border: isQuantum ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '9.5px',
                  textAlign: 'center',
                  color: isQuantum ? '#38bdf8' : '#fbbf24',
                  overflowX: 'auto',
                }}
              >
                {isQuantum
                  ? renderFormula('|\\psi(\\boldsymbol{\\gamma}, \\boldsymbol{\\beta})\\rangle = \\prod_{l=1}^p e^{-i \\beta_l H_M} e^{-i \\gamma_l H_C} |+\\rangle^{\\otimes 32}')
                  : renderFormula('\\min \\sum_{k} \\sum_{i,j} c_{ij} x_{ijk} \\quad \\text{s.t.} \\; u_i - u_j + q_i \\le Q(1 - x_{ij})')}
              </div>
              <span style={{ fontSize: '8.5px', color: '#64748b', lineHeight: '1.3' }}>
                {isQuantum
                  ? 'Alternating phase separator and mixer Hamiltonians mapped to 32 functional Qmod registers.'
                  : 'Miller-Tucker-Zemlin (MTZ) polynomial subtour elimination with continuous load variables.'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
