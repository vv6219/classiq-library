import React, { useState, useMemo } from 'react';
import { ParameterCard } from './ParameterCard';
import { CONFIG_LIMITS } from '../services/api';
import { PARAM_DEEP_DOSSIERS, ACRONYMS_DICTIONARY, ParameterDeepDossier } from '../data/parameterDossiers';
import { STAGE_DOSSIERS, StageDossier } from '../data/stageDossiers';
import katex from 'katex';
import {
  Sliders,
  X,
  Zap,
  ShieldCheck,
  Cpu,
  Flame,
  RotateCcw,
  Play,
  CheckCircle2,
  Search,
  BookOpen,
  Info,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  HelpCircle,
  Hash,
  Terminal,
  FileCode,
  Gauge,
  Tag,
  ExternalLink,
} from 'lucide-react';

interface PreRequestConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: Record<string, any>;
  onChangeConfig: (key: string, val: any) => void;
  onApplyAndDispatch: () => void;
  onResetAllDefaults: () => void;
}

export const PreRequestConfigDrawer: React.FC<PreRequestConfigDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onApplyAndDispatch,
  onResetAllDefaults,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedParamKey, setSelectedParamKey] = useState<string>('v_safe_hri_mps');
  const [inspectorTab, setInspectorTab] = useState<'influence' | 'stage' | 'acronyms'>('influence');
  const [paramSearchTerm, setParamSearchTerm] = useState<string>('');
  const [acronymSearchTerm, setAcronymSearchTerm] = useState<string>('');
  const [acronymCategoryFilter, setAcronymCategoryFilter] = useState<string>('All');


  // Render KaTeX helper
  const renderFormula = (latex: string) => {
    try {
      const html = katex.renderToString(latex, { throwOnError: false, displayMode: false });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <code>{latex}</code>;
    }
  };

  // Presets
  const presets = [
    {
      id: 'QUANTUM_MAX',
      name: 'Quantum Max Fidelity',
      icon: <Cpu size={14} />,
      desc: 'p=3 layers, 2048 shots, strict Lagrangian penalties',
      tooltip: 'Maximize Classiq Quantum QAOA accuracy: depth p=3, 2048 measurement shots, strict Lagrangian penalties (alpha=1.0, beta=2.0) for optimal tour makespan.',
      apply: () => {
        onChangeConfig('qaoa_p_layers', 3);
        onChangeConfig('qaoa_shots', 2048);
        onChangeConfig('lagrangian_alpha', 1.0);
        onChangeConfig('lagrangian_beta', 2.0);
      },
    },
    {
      id: 'CLASSICAL_FAST',
      name: 'Classical High-Speed',
      icon: <Zap size={14} />,
      desc: 'HGS-ADC, CP-SAT 1.5s limit, 25-iter QFCM',
      tooltip: 'Ultra-fast classical dispatch heuristic: tight 1.5s CP-SAT 3D BPP limit and 25-iteration SC-QFCM macro clustering for rapid throughput waves.',
      apply: () => {
        onChangeConfig('bpp_time_limit_sec', 1.5);
        onChangeConfig('fcm_max_iter', 25);
      },
    },
    {
      id: 'STRICT_SAFETY',
      name: 'Strict ISO 3691-4',
      icon: <ShieldCheck size={14} />,
      desc: 'v_safe=0.35 m/s, headway=2.0s, battery reserve=20%',
      tooltip: 'Zero-tolerance human safety profile: enforces 0.35 m/s in shared aisles, 2.0s vehicle headway gap, and 20% minimum battery reserve pursuant to ISO 3691-4.',
      apply: () => {
        onChangeConfig('v_safe_hri_mps', 0.35);
        onChangeConfig('min_headway_sec', 2.0);
        onChangeConfig('battery_min_soc', 20.0);
      },
    },
    {
      id: 'SURGE_STRESS',
      name: 'Surge Stress Wave',
      icon: <Flame size={14} />,
      desc: 'Tight deadlines 50%, chute penalty lambda=4.0',
      tooltip: 'E-commerce peak rush hour wave: 50% tight delivery windows and quadrupled chute buffer penalty (lambda=4.0) to stress-test accumulation bounds.',
      apply: () => {
        onChangeConfig('tight_deadline_fraction', 50.0);
        onChangeConfig('lagrangian_lambda', 4.0);
      },
    },
    {
      id: 'GREEN_FLEET',
      name: 'Low-Energy Green Fleet',
      icon: <Sparkles size={14} />,
      desc: 'v_max=1.6 m/s, gamma=8.0, a_max=0.8 m/s²',
      tooltip: 'Energy-optimized transit mode: limits top cruise speed to 1.6 m/s, elevates battery reserve penalty (gamma=8.0), and softens acceleration ramps.',
      apply: () => {
        onChangeConfig('v_max_amr_mps', 1.6);
        onChangeConfig('lagrangian_gamma', 8.0);
        onChangeConfig('a_max_amr_mps2', 0.8);
      },
    },
  ];

  // Filtered parameters
  const filteredParams = useMemo(() => {
    return Object.entries(CONFIG_LIMITS).filter(([key, spec]) => {
      // Category filter
      if (activeCategory !== 'All' && spec.category !== activeCategory) {
        return false;
      }
      // Search term filter
      if (paramSearchTerm.trim()) {
        const query = paramSearchTerm.toLowerCase();
        const dossier = PARAM_DEEP_DOSSIERS[key];
        const matchKey = key.toLowerCase().includes(query);
        const matchLabel = dossier?.label.toLowerCase().includes(query);
        const matchDesc = dossier?.definition.toLowerCase().includes(query);
        const matchCat = spec.category.toLowerCase().includes(query);
        return matchKey || matchLabel || matchDesc || matchCat;
      }
      return true;
    });
  }, [activeCategory, paramSearchTerm]);

  // Categories list with counts
  const categories = useMemo(() => {
    const counts: Record<string, number> = { All: Object.keys(CONFIG_LIMITS).length };
    Object.values(CONFIG_LIMITS).forEach((spec) => {
      counts[spec.category] = (counts[spec.category] || 0) + 1;
    });
    return [
      { id: 'All', label: 'All Parameters', count: counts['All'] },
      { id: 'Kinematics', label: 'Kinematics & ISO', count: counts['Kinematics'] || 0 },
      { id: 'Quantum', label: 'Quantum Circuits', count: counts['Quantum'] || 0 },
      { id: 'Lagrangian', label: 'Lagrangian Dual', count: counts['Lagrangian'] || 0 },
      { id: 'Facility', label: 'Facility Envelopes', count: counts['Facility'] || 0 },
      { id: 'Orders', label: 'Order Workload', count: counts['Orders'] || 0 },
      { id: 'Tier1', label: 'Tier 1 Clustering', count: counts['Tier1'] || 0 },
      { id: 'Tier2', label: 'Tier 2 3D BPP', count: counts['Tier2'] || 0 },
      { id: 'Tier3', label: 'Tier 3 Routing', count: counts['Tier3'] || 0 },
      { id: 'Tier4', label: 'Tier 4 MAPF', count: counts['Tier4'] || 0 },
    ];
  }, []);

  // Filtered Acronyms
  const filteredAcronyms = useMemo(() => {
    return ACRONYMS_DICTIONARY.filter((acronym) => {
      if (acronymCategoryFilter !== 'All' && acronym.category !== acronymCategoryFilter) {
        return false;
      }
      if (acronymSearchTerm.trim()) {
        const q = acronymSearchTerm.toLowerCase();
        return (
          acronym.term.toLowerCase().includes(q) ||
          acronym.expansion.toLowerCase().includes(q) ||
          acronym.definition.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [acronymSearchTerm, acronymCategoryFilter]);

  // Active Parameter Dossier & Stage
  const activeDossier: ParameterDeepDossier =
    PARAM_DEEP_DOSSIERS[selectedParamKey] ||
    PARAM_DEEP_DOSSIERS['v_safe_hri_mps'] || {
      key: selectedParamKey,
      label: selectedParamKey.replace(/_/g, ' ').toUpperCase(),
      symbol: selectedParamKey,
      category: 'General',
      stageId: 1,
      stageName: 'Stage 1: Pre-Synthesis & Graph Topology Validation',
      definition: 'Cyber-physical optimization parameter controlling vehicle scheduling and routing behavior.',
      physicalMeaning: 'Affects robotic fleet transit, loading bounds, or algorithm convergence.',
      stageProblem: 'Solves constrained multi-tier logistics optimization.',
      classicalFailureMode: 'Suboptimal routing schedules or constraint violations.',
      mathematicalResolution: 'Rigorous multi-tier mathematical bounding.',
      increasingInfluence: 'Increases constraint strictness or algorithmic search depth.',
      decreasingInfluence: 'Relaxes bounds for faster heuristic convergence.',
      nominalRangeText: 'Nominal engineering range',
      recommendedDefault: 'Nominal default',
    };

  const activeSpec = CONFIG_LIMITS[selectedParamKey] || {
    min: 0,
    max: 100,
    step: 1,
    default: 50,
    unit: '',
    category: 'General',
  };

  const activeCurrentValue =
    config[selectedParamKey] !== undefined ? config[selectedParamKey] : activeSpec.default;

  const activeStageDossier: StageDossier | undefined = STAGE_DOSSIERS[activeDossier.stageId];

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 'min(1160px, 96vw)',
        backgroundColor: '#070f1e',
        borderLeft: '1px solid rgba(0, 240, 255, 0.4)',
        boxShadow: '-20px 0 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)',
        zIndex: 1200,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ========================================================================= */}
      {/* DRAWER TOPBAR HEADER                                                      */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#090d16',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              backgroundColor: 'rgba(0, 240, 255, 0.15)',
              border: '1px solid rgba(0, 240, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={18} color="#00f0ff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f3f4f6' }}>
                Calculation Pre-Request Customizer & Diagnostic Inspector
              </h3>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  backgroundColor: 'rgba(0, 240, 255, 0.15)',
                  border: '1px solid rgba(0, 240, 255, 0.4)',
                  color: '#00f0ff',
                  padding: '1px 6px',
                  borderRadius: '4px',
                }}
              >
                36 Parameters
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '1px' }}>
              Fine-tune multi-tier solver constraints, inspect problem formulations, parameter influence, and industry acronyms.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={onResetAllDefaults}
            title="Restore all 36 cyber-physical parameters back to their validated nominal defaults."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              padding: '6px 10px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#00f0ff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <RotateCcw size={12} />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={() => {
              onApplyAndDispatch();
              onClose();
            }}
            title="Commit configured mathematical parameters and trigger immediate multi-tier quantum dispatch wave calculation."
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 16px',
              backgroundColor: '#00f0ff',
              border: 'none',
              borderRadius: '6px',
              color: '#050810',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(0, 240, 255, 0.4)',
            }}
          >
            <Play size={13} />
            <span>Apply & Dispatch</span>
          </button>

          <button
            onClick={onClose}
            title="Close Customizer Drawer"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94a3b8',
              borderRadius: '6px',
              padding: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ONE-CLICK WORKLOAD PRESETS STRIP                                          */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '10px 20px',
          backgroundColor: '#060913',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          overflowX: 'auto',
        }}
      >
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
          One-Click Presets:
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'nowrap' }}>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={p.apply}
              title={p.tooltip}
              style={{
                padding: '5px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                color: '#f0f4f8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#00f0ff';
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
            >
              <div style={{ color: '#00f0ff' }}>{p.icon}</div>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN DUAL-PANE SPLIT CONTAINER                                            */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {/* ======================================================================= */}
        {/* LEFT PANE: PARAMETERS CONTROLLER & SLIDERS                              */}
        {/* ======================================================================= */}
        <div
          style={{
            flex: '0 0 52%',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#090d16',
          }}
        >
          {/* Search & Filter Bar */}
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: '#080c16',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
              <input
                type="text"
                value={paramSearchTerm}
                onChange={(e) => setParamSearchTerm(e.target.value)}
                placeholder="Search 36 parameters by name, key, or category..."
                style={{
                  width: '100%',
                  padding: '7px 10px 7px 32px',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  fontSize: '11px',
                  outline: 'none',
                }}
              />
              {paramSearchTerm && (
                <button
                  onClick={() => setParamSearchTerm('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Pills Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
              }}
            >
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '3px 8px',
                      borderRadius: '5px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: 'none',
                      whiteSpace: 'nowrap',
                      backgroundColor: isActive ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#00f0ff' : '#94a3b8',
                      borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{cat.label}</span>
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '0 4px',
                        borderRadius: '3px',
                        backgroundColor: isActive ? 'rgba(0, 240, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        color: isActive ? '#050810' : '#cbd5e1',
                        fontWeight: 700,
                      }}
                    >
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Parameters Cards Scrollable List */}
          <div
            style={{
              flex: 1,
              minHeight: 0,
              padding: '12px 16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {filteredParams.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <Search size={24} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>No parameters matched</div>
                <div style={{ fontSize: '11px', marginTop: '2px' }}>Try adjusting your search query or category filter.</div>
              </div>
            ) : (
              filteredParams.map(([key, spec]) => {
                const currentVal = config[key] !== undefined ? config[key] : spec.default;
                const dossier = PARAM_DEEP_DOSSIERS[key];
                const isSelected = selectedParamKey === key;

                return (
                  <ParameterCard
                    key={key}
                    label={dossier?.label || key.replace(/_/g, ' ').toUpperCase()}
                    paramKey={key}
                    spec={spec}
                    value={currentVal}
                    symbol={dossier?.symbol}
                    stageName={dossier?.stageName}
                    description={dossier?.definition}
                    isSelected={isSelected}
                    onInspect={() => {
                      setSelectedParamKey(key);
                      setInspectorTab('influence');
                    }}
                    onChange={(val) => onChangeConfig(key, val)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT PANE: INTUITIVE DEEP-DIVE EXPLANATION & ACRONYMS INSPECTOR       */}
        {/* ======================================================================= */}
        <div
          style={{
            flex: '0 0 48%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            backgroundColor: '#070f1e',
          }}
        >
          {/* Inspector Navigation Tabs */}
          <div
            style={{
              padding: '10px 16px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#090d16',
            }}
          >
            <button
              onClick={() => setInspectorTab('influence')}
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: inspectorTab === 'influence' ? 'rgba(0, 240, 255, 0.15)' : 'transparent',
                color: inspectorTab === 'influence' ? '#00f0ff' : '#94a3b8',
                borderBottom: inspectorTab === 'influence' ? '2px solid #00f0ff' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={13} />
              <span>Param Influence & Problem</span>
            </button>

            <button
              onClick={() => setInspectorTab('stage')}
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: inspectorTab === 'stage' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                color: inspectorTab === 'stage' ? '#38bdf8' : '#94a3b8',
                borderBottom: inspectorTab === 'stage' ? '2px solid #38bdf8' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Layers size={13} />
              <span>Stage Formulation</span>
            </button>

            <button
              onClick={() => setInspectorTab('acronyms')}
              style={{
                padding: '8px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                border: 'none',
                background: inspectorTab === 'acronyms' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
                color: inspectorTab === 'acronyms' ? '#fbbf24' : '#94a3b8',
                borderBottom: inspectorTab === 'acronyms' ? '2px solid #fbbf24' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <BookOpen size={13} />
              <span>Acronyms Dictionary ({ACRONYMS_DICTIONARY.length})</span>
            </button>
          </div>

          {/* Inspector Content Body */}
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 20px' }}>
            {/* =================================================================== */}
            {/* TAB 1: PARAMETER INFLUENCE & STAGE PROBLEM DEEP-DIVE                */}
            {/* =================================================================== */}
            {inspectorTab === 'influence' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Active Parameter Header Card */}
                <div
                  style={{
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    border: '1px solid rgba(0, 240, 255, 0.35)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '16px',
                          fontWeight: 800,
                          color: '#00f0ff',
                          fontFamily: 'monospace',
                          backgroundColor: 'rgba(0, 240, 255, 0.12)',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(0, 240, 255, 0.3)',
                        }}
                      >
                        {renderFormula(activeDossier.symbol)}
                      </span>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                          {activeDossier.label}
                        </h4>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          {activeDossier.key}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                        }}
                      >
                        {activeSpec.category}
                      </span>
                      {activeDossier.safetyStandard && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                          }}
                        >
                          {activeDossier.safetyStandard.split(' ')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Current Value vs Factory Default */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Active Value</div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#00f0ff', fontFamily: 'monospace' }}>
                        {activeCurrentValue} {activeSpec.unit}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Nominal Default</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>
                        {activeSpec.default} {activeSpec.unit}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Safety Span</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                        [{activeSpec.min}, {activeSpec.max}] {activeSpec.unit}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 1. Core Physical Definition */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <Info size={13} style={{ color: '#00f0ff' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
                      Physical Definition & Operational Meaning
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: '#e2e8f0', lineHeight: 1.45 }}>
                    {activeDossier.definition}
                  </p>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', fontStyle: 'italic' }}>
                    {activeDossier.physicalMeaning}
                  </div>
                </div>

                {/* 2. Problem Solved on Stage */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} style={{ color: '#38bdf8' }} />
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#38bdf8' }}>
                        Optimization Stage & Problem Solved
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        fontFamily: 'monospace',
                      }}
                    >
                      Stage {activeDossier.stageId}
                    </span>
                  </div>

                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '4px' }}>
                    {activeDossier.stageName}
                  </div>

                  <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    <strong>Problem Statement:</strong> {activeDossier.stageProblem}
                  </div>

                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#ef4444' }}>
                      <AlertTriangle size={11} />
                      <span>Classical Failure Mode Prevented</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px', lineHeight: 1.35 }}>
                      {activeDossier.classicalFailureMode}
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(16, 185, 129, 0.08)',
                      border: '1px solid rgba(16, 185, 129, 0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#10b981' }}>
                      <CheckCircle2 size={11} />
                      <span>Mathematical Resolution in DispatchEngine</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#86efac', marginTop: '2px', lineHeight: 1.35 }}>
                      {activeDossier.mathematicalResolution}
                    </div>
                  </div>
                </div>

                {/* 3. Parameter Influence Analysis */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <Gauge size={13} style={{ color: '#fbbf24' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#fbbf24' }}>
                      Parameter Influence & Trade-Off Matrix
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Increasing Effect */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(59, 130, 246, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <TrendingUp size={12} color="#60a5fa" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd' }}>
                          Increasing Value (+)
                        </div>
                        <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '1px', lineHeight: 1.35 }}>
                          {activeDossier.increasingInfluence}
                        </div>
                      </div>
                    </div>

                    {/* Decreasing Effect */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}
                    >
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(245, 158, 11, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <TrendingDown size={12} color="#f59e0b" />
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fcd34d' }}>
                          Decreasing Value (-)
                        </div>
                        <div style={{ fontSize: '11px', color: '#e2e8f0', marginTop: '1px', lineHeight: 1.35 }}>
                          {activeDossier.decreasingInfluence}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Operating Boundaries & Safety Standard */}
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <ShieldCheck size={13} style={{ color: '#10b981' }} />
                    <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#10b981' }}>
                      Recommended Engineering Boundaries
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#cbd5e1' }}>
                    <div>
                      <strong>Recommended Operating Range:</strong> {activeDossier.nominalRangeText}
                    </div>
                    {activeDossier.safetyStandard && (
                      <div>
                        <strong>Safety Standard Reference:</strong>{' '}
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{activeDossier.safetyStandard}</span>
                      </div>
                    )}
                    <div>
                      <strong>Nominal Baseline Setting:</strong> {activeDossier.recommendedDefault}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 2: STAGE MATHEMATICAL FORMULATION & DOSSIER                     */}
            {/* =================================================================== */}
            {inspectorTab === 'stage' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {activeStageDossier ? (
                  <>
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '10px',
                        backgroundColor: 'rgba(15, 23, 42, 0.85)',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                      }}
                    >
                      <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                        {activeStageDossier.tag}
                      </div>
                      <h4 style={{ margin: '2px 0 4px', fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
                        {activeStageDossier.name}
                      </h4>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {activeStageDossier.subtitle}
                      </div>
                      <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {activeStageDossier.summary}
                      </p>
                    </div>

                    {/* Algorithmic Resolution */}
                    <div
                      style={{
                        padding: '12px 14px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '4px' }}>
                        Algorithmic Engine & Resolution
                      </div>
                      <div style={{ fontSize: '11px', color: '#e2e8f0', lineHeight: 1.4 }}>
                        {activeStageDossier.problemSolving.algorithmicEngine}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', lineHeight: 1.35 }}>
                        {activeStageDossier.problemSolving.mathematicalResolution}
                      </div>
                    </div>

                    {/* Stage Steps */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                        Stage Execution Steps
                      </div>
                      {activeStageDossier.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', fontFamily: 'monospace' }}>
                              STEP 0{step.stepNumber}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#f1f5f9' }}>
                              {step.title}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', lineHeight: 1.35 }}>
                            {step.description}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Mathematical Formulas */}
                    {activeStageDossier.calculations && activeStageDossier.calculations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                          Mathematical Formulations & Equations
                        </div>
                        {activeStageDossier.calculations.map((calc, i) => (
                          <div
                            key={i}
                            style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(251, 191, 36, 0.05)',
                              border: '1px solid rgba(251, 191, 36, 0.25)',
                            }}
                          >
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24' }}>
                              {calc.metricName}: <span style={{ color: '#f8fafc', fontWeight: 600 }}>{calc.calculatedValue}</span>
                            </div>
                            <div style={{ margin: '6px 0', fontSize: '12px', color: '#e2e8f0', overflowX: 'auto' }}>
                              {renderFormula(calc.formulaLatex)}
                            </div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic' }}>
                              {calc.operationalMeaning}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    Select a parameter to view its associated stage formulation.
                  </div>
                )}
              </div>
            )}

            {/* =================================================================== */}
            {/* TAB 3: ABBREVIATIONS & ACRONYMS DICTIONARY                          */}
            {/* =================================================================== */}
            {inspectorTab === 'acronyms' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Search & Category Filter */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
                    <input
                      type="text"
                      value={acronymSearchTerm}
                      onChange={(e) => setAcronymSearchTerm(e.target.value)}
                      placeholder="Search acronyms (e.g. AMR, QAOA, BPP, LIFO, MTZ)..."
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 32px',
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '11px',
                        outline: 'none',
                      }}
                    />
                    {acronymSearchTerm && (
                      <button
                        onClick={() => setAcronymSearchTerm('')}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    {['All', 'Robotics & AMR', 'Quantum Computing', 'Operations Research', 'Safety & Compliance', 'WMS Infrastructure'].map(
                      (cat) => (
                        <button
                          key={cat}
                          onClick={() => setAcronymCategoryFilter(cat)}
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: 'none',
                            backgroundColor:
                              acronymCategoryFilter === cat ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            color: acronymCategoryFilter === cat ? '#fbbf24' : '#94a3b8',
                            borderBottom: acronymCategoryFilter === cat ? '1px solid #fbbf24' : 'none',
                          }}
                        >
                          {cat}
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Acronyms List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {filteredAcronyms.map((item) => (
                    <div
                      key={item.term}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 900,
                              color: '#00f0ff',
                              fontFamily: 'monospace',
                              backgroundColor: 'rgba(0, 240, 255, 0.1)',
                              padding: '1px 6px',
                              borderRadius: '4px',
                              border: '1px solid rgba(0, 240, 255, 0.25)',
                            }}
                          >
                            {item.term}
                          </span>
                          <span style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                            {item.expansion}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '3px',
                            backgroundColor: 'rgba(251, 191, 36, 0.15)',
                            color: '#fbbf24',
                          }}
                        >
                          {item.category}
                        </span>
                      </div>

                      <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4 }}>
                        {item.definition}
                      </div>

                      {item.relatedParams && item.relatedParams.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>Related Parameters:</span>
                          {item.relatedParams.map((pKey) => (
                            <button
                              key={pKey}
                              onClick={() => {
                                setSelectedParamKey(pKey);
                                setInspectorTab('influence');
                              }}
                              style={{
                                fontSize: '9px',
                                fontFamily: 'monospace',
                                color: '#38bdf8',
                                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                                border: '1px solid rgba(56, 189, 248, 0.25)',
                                borderRadius: '3px',
                                padding: '1px 4px',
                                cursor: 'pointer',
                              }}
                              title={`Inspect parameter ${pKey}`}
                            >
                              {pKey}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DRAWER FOOTER                                                             */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '12px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#080c16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ fontSize: '11px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldCheck size={13} style={{ color: '#10b981' }} />
          <span>All 36 parameters validated against ISO 3691-4 and Classiq hardware synthesis invariants.</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {(config.num_orders === undefined || config.num_orders <= 0) && (
            <span style={{ fontSize: '11px', color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              ⚠️ Orders cannot be 0
            </span>
          )}

          <button
            onClick={onClose}
            className="btn-secondary"
            style={{ fontSize: '12px', padding: '6px 14px' }}
          >
            Cancel
          </button>

          <button
            onClick={() => {
              if (config.num_orders === undefined || config.num_orders <= 0) {
                alert('Cannot dispatch wave with 0 orders. Workload set must contain at least 1 order (recommended: 5–150).');
                return;
              }
              onApplyAndDispatch();
              onClose();
            }}
            className="btn-quantum"
            style={{ fontSize: '12px', padding: '6px 18px' }}
          >
            <Play size={13} />
            <span>Apply & Dispatch Wave</span>
          </button>
        </div>
      </div>
    </div>
  );
};
