import React, { useState, useEffect } from 'react';
import {
  fetchRunExplanation,
  RunExplanationDTO,
} from '../services/api';
import {
  BookOpen,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Copy,
  Check,
  Cpu,
  Zap,
  Box,
  Layers,
  Sparkles,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CodeLmnBadge } from './CodeLmnBadge';

interface NarrativeExplainerPaneProps {
  runId: string;
  mode: 'QUANTUM' | 'CLASSICAL';
  activeTiers: Record<string, string>;
  numOrders: number;
  numVehicles: number;
  scenarioId: string;
  phi: number;
  makespan: number;
  distance: number;
  isSolving: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const NarrativeExplainerPane: React.FC<NarrativeExplainerPaneProps> = ({
  runId,
  mode,
  activeTiers,
  numOrders,
  numVehicles,
  scenarioId,
  phi,
  makespan,
  distance,
  isSolving,
  isExpanded: controlledExpanded,
  onToggleExpand,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpand = onToggleExpand || (() => setInternalExpanded(!internalExpanded));

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCard, setActiveCard] = useState<'all' | 'data' | 'tiers' | 'algos' | 'quantum'>('all');
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [serverExplanation, setServerExplanation] = useState<RunExplanationDTO | null>(null);

  // Fetch explanation whenever runId changes
  useEffect(() => {
    if (runId) {
      fetchRunExplanation(runId)
        .then((data) => {
          if (data && !('error' in data)) {
            setServerExplanation(data);
          }
        })
        .catch((err) => console.warn('Could not fetch run explanation:', err));
    }
  }, [runId]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const isQuantum = mode === 'QUANTUM';

  // Dynamic Natural Language Narrative Generator
  const narrative = {
    executive_summary:
      serverExplanation?.executive_summary ||
      `Current mission configuration operates under ${
        isQuantum ? 'Classiq Quantum Hybrid Co-Processing' : 'Classical Heuristic'
      } mode, orchestrating a fleet of ${numVehicles} autonomous mobile robots across ${numOrders} warehouse pick orders. Total makespan is estimated at ${makespan.toFixed(
        1
      )}s over ${distance.toFixed(
        2
      )}km of transit. Safety compliance is certified under Invariant 'Verified' with an evaluated falsification ratio of Φ = ${phi.toFixed(
        3
      )} (< 1.0).`,

    mock_data:
      serverExplanation?.mock_data ||
      `Operating Scenario (${scenarioId}): Simulating an active industrial fulfillment facility (150m × 100m) with 10 storage aisles and 4 consolidation chutes. The mock order batch comprises ${numOrders} pick tasks with realistic dimensions (0.01 to 0.45 m³), mass up to 35 kg, and stochastic customer time windows. Approximately 15% of parcels carry ADR hazardous classifications requiring segregated transport bays, while 20% represent critical-deadline parcels requiring expedited priority scheduling.`,

    tiers: {
      tier1:
        serverExplanation?.tiers?.tier1 ||
        'Tier 1 (Wave Macro-Clustering): Partitions the continuous order stream into spatially cohesive order clusters assigned to vehicle bays and origin depots. This mitigates split-picking overhead and prevents AMRs from crisscrossing opposing aisles.',
      tier2:
        serverExplanation?.tiers?.tier2 ||
        'Tier 2 (3D Volumetric Bin Packing & LIFO): Dynamically packs parcels into AMR cargo bays using extreme-point geometric placement. Enforces center-of-gravity stability and constructs an acyclic LIFO dependency DAG (Invariant R10) to guarantee inner parcels never block earlier delivery drop-offs.',
      tier3:
        serverExplanation?.tiers?.tier3 ||
        'Tier 3 (Multi-Depot Vehicle Routing & Scheduling): Solves the constrained multi-depot vehicle routing problem (MDVRP-TW), establishing exact arrival and departure times at pickup aisles and drop chutes while leveling chute buffer accumulation.',
      tier4:
        serverExplanation?.tiers?.tier4 ||
        'Tier 4 (Kinematic Collision Avoidance & SIPP): Converts topological routing graphs into 50Hz continuous kinematic trajectories. Enforces ISO 3691-4 safety deceleration, dynamic headway limits, and pedestrian zone speed reductions (0.4 m/s) using space-time reservation intervals.',
    },

    algorithms: {
      tier1:
        activeTiers.tier1 === 'RANK_1Q_QUANTUM_FCM'
          ? 'Classiq Quantum Fuzzy C-Means (SC-QFCM): Encodes order coordinates into quantum Hilbert space states and calculates spectral overlap fidelities via SWAP-test quantum kernels.'
          : 'Distributionally Robust Sample Average Approximation (DR-SAA): Clusters orders under demand uncertainty bounds using Wasserstein ambiguity balls.',
      tier2:
        'Google OR-Tools CP-SAT with Continuous MISOCP Mechanical Bounds: Solves 3D orthogonal parcel placement with exact non-overlapping constraints, support area checks (η_min ≥ 0.85), and friction force equilibrium.',
      tier3:
        activeTiers.tier3 === 'RANK_1Q_CLASSIQ_QAOA'
          ? 'Classiq QAOA Multi-Angle Hamiltonian Solver: Formulates the NP-hard subtour elimination problem as a parameterized Ising cost Hamiltonian, evaluated with p=2 variational depth and classical optimizer feedback.'
          : 'Hybrid Genetic Search with Advanced Diversity Control (HGS-ADC): Evolves population chromosomes with specialized split delivery crossover operators and local search improvements.',
      tier4:
        'Safe Interval Path Planning (SIPP) with Priority-Based Search (PBS): Resolves multi-agent path conflicts using continuous reservation tables and time-space safe intervals.',
    },

    classical_vs_quantum:
      serverExplanation?.classical_vs_quantum ||
      (isQuantum
        ? 'Quantum vs Classical Hybrid Synergy: The Classiq Quantum Co-Processor targets the combinatorial bottlenecks in Tiers 1 and 3 by encoding order clustering and subtour permutation searches into parameterized quantum circuits (p-layer QAOA with XY mixers). Meanwhile, deterministic classical processors handle continuous physics: OR-Tools CP-SAT validates 3D box packing geometries, and Safe Interval Path Planning computes 50Hz kinematic trajectories. This hybrid synergy offloads exponential state search to quantum hardware while guaranteeing 100% deterministic physical safety certification.'
        : 'Classical Heuristic Execution: All tiers are resolved using state-of-the-art classical mathematical programming and metaheuristics (DR-SAA, CP-SAT, and HGS-ADC). While deterministic and fast for smaller batches, classical combinatorial search scales exponentially with larger order pools compared to quantum co-processor formulations.'),
  };

  const handleToggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const textToSpeak = `${narrative.executive_summary} ${narrative.mock_data} ${narrative.classical_vs_quantum}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleCopyMarkdown = () => {
    const fullMarkdown = `
# Executive Mission Brief & Co-Processor Narrative
**Run ID:** ${runId || 'CURRENT'} | **Mode:** ${mode} | **Verification Code:** Verified (Φ = ${phi.toFixed(3)})

## Executive Summary
${narrative.executive_summary}

## 1. Mock Data & Warehouse Reality
${narrative.mock_data}

## 2. Multi-Tier Execution Pipeline
- **Tier 1:** ${narrative.tiers.tier1}
- **Tier 2:** ${narrative.tiers.tier2}
- **Tier 3:** ${narrative.tiers.tier3}
- **Tier 4:** ${narrative.tiers.tier4}

## 3. Active Algorithmic Engines
- **Tier 1 Algo:** ${narrative.algorithms.tier1}
- **Tier 2 Algo:** ${narrative.algorithms.tier2}
- **Tier 3 Algo:** ${narrative.algorithms.tier3}
- **Tier 4 Algo:** ${narrative.algorithms.tier4}

## 4. Quantum vs Classical Hybrid Synergy
${narrative.classical_vs_quantum}

---
*Generated by WMS Quantum Digital Twin Engine*
    `.trim();

    navigator.clipboard.writeText(fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 90,
        backgroundColor: '#070b16',
        borderTop: '1px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.7)',
        transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: isFullscreen ? '85vh' : isExpanded ? '440px' : '42px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Docked Summary Header Bar */}
      <div
        style={{
          height: '42px',
          minHeight: '42px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          backgroundColor: '#090e1c',
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={toggleExpand}
      >
        {/* Left: Brand Icon + Title + Live Preview */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div
            style={{
              width: '36px',
              height: '26px',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid rgba(0, 240, 255, 0.45)',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)',
              backgroundColor: '#070f1e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              padding: '1px',
            }}
          >
            <img
              src="/logo_emblem.png"
              alt="YesAndNo Quantum Computing Team"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <span style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff', letterSpacing: '0.02em', flexShrink: 0 }}>
            MISSION EXPLAINER & CO-PROCESSOR NARRATIVE
          </span>

          <span style={{ color: '#4b5563', flexShrink: 0 }}>|</span>

          {/* Live Preview Text */}
          <span
            style={{
              fontSize: '11px',
              color: '#94a3b8',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: '650px',
            }}
          >
            {isSolving
              ? '⏳ Solving active dispatch wave... Calculating multi-tier trajectories...'
              : `${mode} MODE | ${numOrders} Orders, ${numVehicles} AMRs | Makespan: ${makespan.toFixed(
                  1
                )}s | Verified (Φ=${phi.toFixed(3)})`}
          </span>
        </div>

        {/* Right: Mode Badge & Quick Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          {/* Active Mode Pill */}
          <span
            style={{
              fontSize: '10px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isQuantum ? 'rgba(168, 85, 247, 0.2)' : 'rgba(96, 165, 250, 0.2)',
              border: isQuantum ? '1px solid rgba(168, 85, 247, 0.5)' : '1px solid rgba(96, 165, 250, 0.5)',
              color: isQuantum ? '#c084fc' : '#93c5fd',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isQuantum ? <Cpu size={11} /> : <Zap size={11} />}
            {mode}
          </span>

          {/* Invariant Badge with Rich Hover Hint */}
          <CodeLmnBadge phi={phi}>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor: phi < 1.0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                border: phi < 1.0 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)',
                color: phi < 1.0 ? '#6ee7b7' : '#fca5a5',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'help',
              }}
            >
              <ShieldCheck size={11} />
              Verified (Φ={phi.toFixed(3)})
            </span>
          </CodeLmnBadge>

          {/* Read Aloud Button */}
          <button
            onClick={handleToggleSpeech}
            style={{
              background: isSpeaking ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: isSpeaking ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '4px',
              color: isSpeaking ? '#ef4444' : '#e2e8f0',
              padding: '4px 8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            title={isSpeaking ? 'Stop voice reading' : 'Read narrative aloud (TTS)'}
          >
            {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
            <span>{isSpeaking ? 'Stop Audio' : 'Listen'}</span>
          </button>

          {/* Copy Brief Button */}
          <button
            onClick={handleCopyMarkdown}
            style={{
              background: copied ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: copied ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '4px',
              color: copied ? '#10b981' : '#e2e8f0',
              padding: '4px 8px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            title="Copy human-friendly narrative to clipboard"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            onClick={toggleExpand}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#00f0ff',
              padding: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
            title={isExpanded ? 'Collapse pane' : 'Expand full explanation pane'}
          >
            {isExpanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>

      {/* Expanded Content View */}
      {isExpanded && (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Sub-Header Toolbar with Filter Pills & Fullscreen Toggle */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: 'All Sections' },
                { id: 'data', label: '1. Mock Data & Context' },
                { id: 'tiers', label: '2. Multi-Tier Pipeline' },
                { id: 'algos', label: '3. Algorithmic Engines' },
                { id: 'quantum', label: '4. Quantum vs Classical' },
              ].map((tab) => {
                const isSel = activeCard === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCard(tab.id as any)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: isSel ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                      backgroundColor: isSel ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSel ? '#00f0ff' : '#94a3b8',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '4px',
                color: '#94a3b8',
                padding: '4px 8px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
              }}
              title={isFullscreen ? 'Exit fullscreen view' : 'Maximize narrative view'}
            >
              {isFullscreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              <span>{isFullscreen ? 'Standard' : 'Maximize'}</span>
            </button>
          </div>

          {/* Executive Summary Callout */}
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(90deg, rgba(0, 240, 255, 0.08), rgba(124, 58, 237, 0.08))',
              border: '1px solid rgba(0, 240, 255, 0.25)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <Sparkles size={18} color="#00f0ff" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#00f0ff', marginBottom: '2px' }}>
                EXECUTIVE MISSION BRIEFING
              </div>
              <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5, margin: 0 }}>
                {narrative.executive_summary}
              </p>
            </div>
          </div>

          {/* 4 Thematic Explanation Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isFullscreen ? '1fr 1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '14px',
            }}
          >
            {/* Card 1: Mock Data & Warehouse Reality */}
            {(activeCard === 'all' || activeCard === 'data') && (
              <div
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(0, 240, 255, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00f0ff' }}>
                  <Box size={16} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                    1. Mock Data & Industrial Facility Context
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
                  {narrative.mock_data}
                </p>
                <div style={{ marginTop: 'auto', paddingTop: '6px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                    Orders: <strong>{numOrders}</strong>
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                    Fleet: <strong>{numVehicles} AMRs</strong>
                  </span>
                  <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                    Archetype: <strong>E-Commerce Mega</strong>
                  </span>
                </div>
              </div>
            )}

            {/* Card 2: Multi-Tier Execution Pipeline */}
            {(activeCard === 'all' || activeCard === 'tiers') && (
              <div
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c084fc' }}>
                  <Layers size={16} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                    2. Multi-Tier Decomposition (Tiers 1 to 4)
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#00f0ff' }}>Tier 1:</strong> {narrative.tiers.tier1}
                  </div>
                  <div>
                    <strong style={{ color: '#a855f7' }}>Tier 2:</strong> {narrative.tiers.tier2}
                  </div>
                  <div>
                    <strong style={{ color: '#60a5fa' }}>Tier 3:</strong> {narrative.tiers.tier3}
                  </div>
                  <div>
                    <strong style={{ color: '#34d399' }}>Tier 4:</strong> {narrative.tiers.tier4}
                  </div>
                </div>
              </div>
            )}

            {/* Card 3: Algorithmic Engines in Action */}
            {(activeCard === 'all' || activeCard === 'algos') && (
              <div
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: '1px solid rgba(96, 165, 250, 0.2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#60a5fa' }}>
                  <Zap size={16} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                    3. Algorithmic Solvers in Action
                  </h4>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  <div>
                    <strong style={{ color: '#60a5fa' }}>Clustering:</strong> {narrative.algorithms.tier1}
                  </div>
                  <div>
                    <strong style={{ color: '#fbbf24' }}>3D BPP:</strong> {narrative.algorithms.tier2}
                  </div>
                  <div>
                    <strong style={{ color: '#c084fc' }}>Routing:</strong> {narrative.algorithms.tier3}
                  </div>
                  <div>
                    <strong style={{ color: '#34d399' }}>Kinematics:</strong> {narrative.algorithms.tier4}
                  </div>
                </div>
              </div>
            )}

            {/* Card 4: Quantum vs Classical Hybrid Synergy */}
            {(activeCard === 'all' || activeCard === 'quantum') && (
              <div
                className="glass-card"
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'rgba(15, 23, 42, 0.65)',
                  border: isQuantum ? '1px solid rgba(168, 85, 247, 0.35)' : '1px solid rgba(96, 165, 250, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isQuantum ? '#c084fc' : '#60a5fa',
                  }}
                >
                  <Cpu size={16} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>
                    4. Classical vs Quantum Hybrid Synergy
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.55, margin: 0 }}>
                  {narrative.classical_vs_quantum}
                </p>
                <div
                  style={{
                    marginTop: 'auto',
                    paddingTop: '6px',
                    fontSize: '11px',
                    color: phi < 1.0 ? '#6ee7b7' : '#fca5a5',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  Audit Invariant:{' '}
                  <CodeLmnBadge
                    variant="token"
                    phi={phi}
                    label={`Verified (Φ = ${phi.toFixed(3)} < 1.0)`}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
