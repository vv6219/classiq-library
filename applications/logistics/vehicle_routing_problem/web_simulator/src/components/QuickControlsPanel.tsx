import React, { useState } from 'react';
import {
  Settings2,
  X,
  RotateCcw,
  Sliders,
  Sparkles,
  Zap,
  Cpu,
  Layers,
  HelpCircle,
  BookOpen,
  Scale,
  Maximize2,
  Minimize2,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import katex from 'katex';
import { ArchetypeMeta } from '../services/api';
import {
  QUICK_CONTROLS_PARAMS,
  QUICK_CONTROLS_PROBLEMS,
  QUICK_CONTROLS_ACRONYMS,
  QUICK_CONTROLS_CALCULATIONS,
  QuickControlParam,
} from '../data/quickControlsDossier';
import { CodeLmnBadge } from './CodeLmnBadge';

interface QuickControlsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedArchetype: string;
  setSelectedArchetype: (archetype: string) => void;
  numVehicles: number;
  setNumVehicles: (val: number) => void;
  numOrders: number;
  setNumOrders: (val: number) => void;
  seed: number;
  setSeed: (val: number) => void;
  mode: 'QUANTUM' | 'CLASSICAL';
  setMode?: (mode: string) => void;
  archetypes: ArchetypeMeta[];
  isSolving: boolean;
  onDispatch: () => void;
  onOpenFullConfig?: () => void;
}

export const QuickControlsPanel: React.FC<QuickControlsPanelProps> = ({
  isOpen,
  onClose,
  selectedArchetype,
  setSelectedArchetype,
  numVehicles,
  setNumVehicles,
  numOrders,
  setNumOrders,
  seed,
  setSeed,
  mode,
  setMode,
  archetypes,
  isSolving,
  onDispatch,
  onOpenFullConfig,
}) => {
  const [activeTab, setActiveTab] = useState<'controls' | 'param_deepdive' | 'problem_solving' | 'calculations' | 'acronyms'>('controls');
  const [selectedParamKey, setSelectedParamKey] = useState<string>('numVehicles');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [hazardRatio, setHazardRatio] = useState<number>(0.10);

  if (!isOpen) return null;

  // Safe KaTeX rendering helper
  const renderFormula = (latex: string) => {
    try {
      return katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<div style="font-family: monospace; color: #00f0ff;">${latex}</div>`;
    }
  };

  const currentParam: QuickControlParam = QUICK_CONTROLS_PARAMS[selectedParamKey] || QUICK_CONTROLS_PARAMS['numVehicles'];
  const panelWidth = isExpanded ? '680px' : '360px';

  return (
    <div
      style={{
        position: 'relative',
        width: panelWidth,
        height: '100%',
        backgroundColor: '#070b16',
        borderLeft: '1px solid rgba(0, 240, 255, 0.25)',
        boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.7)',
        zIndex: 30,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* ================= Header ================= */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c101c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings2 size={16} color="#00f0ff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8' }}>Quick Controls</span>
              <CodeLmnBadge variant="pill" label="Verified" />
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>Real-Time Dispatch Parameter Studio</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse panel width' : 'Expand panel width for side-by-side dossier'}
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: isExpanded ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
              color: isExpanded ? '#00f0ff' : '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <button
            onClick={onClose}
            title="Close Quick Controls"
            style={{
              padding: '6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.04)',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* ================= Navigation Tabs ================= */}
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#090d19',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        {[
          { id: 'controls', label: 'Controls & Sliders' },
          { id: 'param_deepdive', label: 'Param Deep-Dive' },
          { id: 'problem_solving', label: 'Problem Solving' },
          { id: 'calculations', label: 'Calculations & Math' },
          { id: 'acronyms', label: 'Acronyms' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '9px 4px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
              backgroundColor: 'transparent',
              color: activeTab === tab.id ? '#00f0ff' : '#94a3b8',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ================= Panel Body Content ================= */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          minHeight: 0,
        }}
      >
        {/* ================= TAB 1: CONTROLS & SLIDERS ================= */}
        {activeTab === 'controls' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Quick Intelligence Banner */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <Info size={14} color="#00f0ff" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                Adjust high-level dispatch inputs below. Click the <strong>Param Deep-Dive</strong> tab for mathematical role,
                influence bounds, and failure modes.
              </div>
            </div>

            {/* Industrial Facility Archetype */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600 }}>Industrial Facility Archetype</label>
                <button
                  onClick={() => {
                    setSelectedParamKey('selectedArchetype');
                    setActiveTab('param_deepdive');
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00f0ff',
                    fontSize: '10px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Explain
                </button>
              </div>
              <select
                value={selectedArchetype}
                onChange={(e) => setSelectedArchetype(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  backgroundColor: '#03050c',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#f0f4f8',
                  fontSize: '11px',
                  outline: 'none',
                }}
              >
                {archetypes.map((arch) => (
                  <option key={arch.archetype_key} value={arch.archetype_key}>
                    {arch.title} ({arch.stress_target})
                  </option>
                ))}
              </select>
            </div>

            {/* Fleet Size Slider (K) */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600 }}>AMR Fleet Sizing (K)</span>
                <span style={{ fontSize: '12px', color: '#00f0ff', fontFamily: 'monospace', fontWeight: 700 }}>
                  {numVehicles} AMRs
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="8"
                step="1"
                value={numVehicles}
                onChange={(e) => setNumVehicles(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00f0ff' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                <span>2 (Starvation)</span>
                <span>4–6 (Optimal)</span>
                <span>8 (Congestion)</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                Payload Bandwidth: <strong style={{ color: '#38bdf8' }}>{numVehicles * 500} kg</strong> across fleet.
              </div>
            </div>

            {/* Order Wave Volume (N) */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600 }}>Order Wave Batch Size (N)</span>
                <span style={{ fontSize: '12px', color: '#00f0ff', fontFamily: 'monospace', fontWeight: 700 }}>
                  {numOrders} Orders
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="50"
                step="1"
                value={numOrders}
                onChange={(e) => setNumOrders(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#00f0ff' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                <span>6 (Under-fill)</span>
                <span>20–35 (Balanced)</span>
                <span>50 (Chute Overflow)</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '10px', color: '#94a3b8' }}>
                Estimated Pick Lines: <strong style={{ color: '#38bdf8' }}>{numOrders * 3} SKUs</strong>.
              </div>
            </div>

            {/* Simulation Random Seed */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600 }}>Simulation Seed (PRNG)</span>
                <button
                  onClick={() => setSeed(Math.floor(Math.random() * 10000))}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#00f0ff',
                    fontSize: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <RotateCcw size={10} /> Randomize
                </button>
              </div>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  backgroundColor: '#03050c',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '6px',
                  color: '#f0f4f8',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
                {[42, 101, 777, 2026].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSeed(s)}
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      border: seed === s ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: seed === s ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      color: seed === s ? '#00f0ff' : '#94a3b8',
                      fontSize: '9px',
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                    }}
                  >
                    #{s}
                  </button>
                ))}
              </div>
            </div>

            {/* Hazardous (ADR) Ratio Slider */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600 }}>Hazardous (ADR) Ratio</span>
                <span style={{ fontSize: '11px', color: '#f59e0b', fontFamily: 'monospace', fontWeight: 700 }}>
                  {(hazardRatio * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="0.30"
                step="0.05"
                value={hazardRatio}
                onChange={(e) => setHazardRatio(parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: '#f59e0b' }}
              />
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                Enforces isolated transport bays and ADR segregation routes.
              </div>
            </div>

            {/* Active Calculation Engine Switcher */}
            <div
              style={{
                padding: '12px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '11px', color: '#f0f4f8', fontWeight: 600, marginBottom: '6px' }}>
                Co-Processing Engine Architecture
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setMode && setMode('QUANTUM')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: mode === 'QUANTUM' ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: mode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: mode === 'QUANTUM' ? '#00f0ff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={12} /> Classiq QAOA
                </button>
                <button
                  onClick={() => setMode && setMode('CLASSICAL')}
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: mode === 'CLASSICAL' ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor: mode === 'CLASSICAL' ? 'rgba(168, 85, 247, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: mode === 'CLASSICAL' ? '#a855f7' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                  }}
                >
                  <Cpu size={12} /> Classical ALNS
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <button
                onClick={onDispatch}
                disabled={isSolving}
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#00f0ff',
                  color: '#03050c',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: isSolving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
                }}
              >
                <Zap size={14} />
                {isSolving ? 'Solving Wave...' : 'Dispatch Wave with Quick Controls'}
              </button>

              {onOpenFullConfig && (
                <button
                  onClick={onOpenFullConfig}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    color: '#94a3b8',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <SlidersHorizontal size={13} />
                  Open Full Pre-Request Config Drawer
                </button>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: PARAM DEEP-DIVE ================= */}
        {activeTab === 'param_deepdive' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Param Switcher Chips */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
              {Object.values(QUICK_CONTROLS_PARAMS).map((p) => {
                const isCur = p.key === currentParam.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setSelectedParamKey(p.key)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: isCur ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.08)',
                      backgroundColor: isCur ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isCur ? '#00f0ff' : '#94a3b8',
                      fontSize: '10px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name.split(' ')[0]} ({p.symbol.replace('\\', '')})
                  </button>
                );
              })}
            </div>

            {/* Current Param Header Card */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: '#0c101c',
                border: '1px solid rgba(0, 240, 255, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8' }}>{currentParam.name}</span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#00f0ff', fontWeight: 700 }}>
                  {currentParam.symbol}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
                Nominal Range: <strong style={{ color: '#94a3b8' }}>{currentParam.nominalRange}</strong>
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.5 }}>
                {currentParam.operationalMeaning}
              </div>
            </div>

            {/* Mathematical Role */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '4px' }}>
                Mathematical Formulation Role
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#03050c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '11px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                }}
              >
                {currentParam.mathematicalRole}
              </div>
            </div>

            {/* Value Changing Influence Matrix */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#f59e0b', marginBottom: '8px' }}>
                Value Changing Influence Regimes
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Low Value */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                    LOW VALUE REGIME:
                  </div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                    {currentParam.lowRegimeInfluence}
                  </div>
                </div>

                {/* Optimal Value */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(0, 230, 118, 0.06)',
                    border: '1px solid rgba(0, 230, 118, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#00e676', marginBottom: '2px' }}>
                    OPTIMAL / NOMINAL REGIME:
                  </div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', lineHeight: 1.4 }}>
                    {currentParam.optimalRegimeInfluence}
                  </div>
                </div>

                {/* High Value */}
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#f59e0b', marginBottom: '2px' }}>
                    HIGH VALUE REGIME:
                  </div>
                  <div style={{ fontSize: '11px', color: '#fde68a', lineHeight: 1.4 }}>
                    {currentParam.highRegimeInfluence}
                  </div>
                </div>
              </div>
            </div>

            {/* Failure Modes & Decision Rule */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                  OPERATIONAL FAILURE MODES:
                </div>
                <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                  {currentParam.failureModes}
                </div>
              </div>

              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(0, 240, 255, 0.06)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#00f0ff', marginBottom: '2px' }}>
                  ENGINEERING DECISION RULE:
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  {currentParam.decisionRule}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROBLEM SOLVING ================= */}
        {activeTab === 'problem_solving' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Quick Controls solve high-level combinatorial dispatch and spatial traffic problems before detailed trajectory generation:
            </div>

            {QUICK_CONTROLS_PROBLEMS.map((prob) => (
              <div
                key={prob.id}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0c101c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>{prob.title}</span>
                  <CodeLmnBadge variant="token" label="Verified" />
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {prob.targetRestrictions.map((r, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: '9px',
                        padding: '1px 6px',
                        borderRadius: '3px',
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        color: '#38bdf8',
                        border: '1px solid rgba(0, 240, 255, 0.25)',
                      }}
                    >
                      {r}
                    </span>
                  ))}
                </div>

                <div>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#cbd5e1', marginBottom: '2px' }}>
                    Problem Statement:
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {prob.problemStatement}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(239, 68, 68, 0.06)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#ef4444', marginBottom: '2px' }}>
                    Classical Bottleneck:
                  </div>
                  <div style={{ fontSize: '11px', color: '#fca5a5', lineHeight: 1.4 }}>
                    {prob.classicalBottleneck}
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 230, 118, 0.06)',
                    border: '1px solid rgba(0, 230, 118, 0.2)',
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#00e676', marginBottom: '2px' }}>
                    Algorithmic Resolution:
                  </div>
                  <div style={{ fontSize: '11px', color: '#a7f3d0', lineHeight: 1.4 }}>
                    {prob.resolutionMechanism}
                  </div>
                </div>

                <div style={{ fontSize: '10px', color: '#64748b' }}>
                  Verification: <strong style={{ color: '#10b981' }}>{prob.verificationMetric}</strong>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 4: CALCULATIONS & MATH ================= */}
        {activeTab === 'calculations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Rigorous mathematical formulations governing Quick Controls sizing, queue rates, and spatial densities:
            </div>

            {QUICK_CONTROLS_CALCULATIONS.map((calc, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  backgroundColor: '#0c101c',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>{calc.metricName}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8' }}>{calc.symbol}</span>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#03050c',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    overflowX: 'auto',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderFormula(calc.latexFormula) }}
                />

                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                  <strong style={{ color: '#f0f4f8' }}>Operational Meaning:</strong> {calc.operationalMeaning}
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
                  <strong style={{ color: '#60a5fa' }}>Interpretation:</strong> {calc.numericalInterpretation}
                </div>
                <div style={{ fontSize: '10px', color: '#34d399', lineHeight: 1.4 }}>
                  <strong style={{ color: '#00e676' }}>Decision Rule:</strong> {calc.decisionRule}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= TAB 5: ACRONYMS & GLOSSARY ================= */}
        {activeTab === 'acronyms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Essential logistics, robotics, and quantum computing acronyms used across Quick Controls:
            </div>

            {QUICK_CONTROLS_ACRONYMS.map((acr) => (
              <div
                key={acr.term}
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#0c101c',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#00f0ff' }}>{acr.term}</span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{acr.expansion}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, marginBottom: '4px' }}>
                  {acr.definition}
                </div>
                <div style={{ fontSize: '10px', color: '#38bdf8', fontStyle: 'italic' }}>
                  Context: {acr.contextUsage}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= Footer ================= */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#0c101c',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '10px',
          color: '#64748b',
          flexShrink: 0,
        }}
      >
        <span>Active Archetype: <strong style={{ color: '#94a3b8' }}>{selectedArchetype}</strong></span>
        <CodeLmnBadge variant="token" label="Verified" />
      </div>
    </div>
  );
};
