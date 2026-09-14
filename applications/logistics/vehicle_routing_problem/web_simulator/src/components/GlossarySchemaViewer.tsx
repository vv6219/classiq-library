import React from 'react';
import { GlossarySchemaType } from '../data/glossaryRegistry';

interface GlossarySchemaViewerProps {
  schemaType: GlossarySchemaType;
  caption?: string;
}

export const GlossarySchemaViewer: React.FC<GlossarySchemaViewerProps> = ({ schemaType, caption }) => {
  return (
    <div
      style={{
        background: 'radial-gradient(ellipse at top, rgba(15, 23, 42, 0.95), rgba(7, 12, 24, 0.98))',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '680px', height: 'auto', minHeight: '220px', display: 'flex', justifyContent: 'center' }}>
        {/* ========================================================================= */}
        {/* 1. BENDERS DECOMPOSITION RECOURSE LOOP                                    */}
        {/* ========================================================================= */}
        {schemaType === 'benders_loop' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            <defs>
              <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#9f1239" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.8" />
              </linearGradient>
              <marker id="arrowCyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#00f0ff" />
              </marker>
              <marker id="arrowRed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" />
              </marker>
              <marker id="arrowGreen" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 1 L 8 5 L 0 9 z" fill="#10b981" />
              </marker>
            </defs>

            {/* Master Box */}
            <rect x="30" y="45" width="160" height="130" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#00f0ff" strokeWidth="1.5" />
            <text x="110" y="75" fill="#00f0ff" fontSize="13" fontWeight="800" textAnchor="middle">MASTER PROBLEM</text>
            <text x="110" y="98" fill="#e2e8f0" fontSize="11" textAnchor="middle">Binary Tour MILP</text>
            <text x="110" y="118" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">x_ij ∈ &#123;0, 1&#125;</text>
            <text x="110" y="142" fill="#38bdf8" fontSize="9.5" textAnchor="middle">CP-SAT / Gurobi</text>

            {/* Forward Arrow: Candidate Solution */}
            <path d="M 190 85 L 290 85" stroke="#00f0ff" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <text x="240" y="75" fill="#38bdf8" fontSize="10" fontWeight="700" textAnchor="middle">Candidate x*</text>

            {/* Subproblem Box */}
            <rect x="300" y="30" width="180" height="160" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="390" y="58" fill="#f43f5e" fontSize="13" fontWeight="800" textAnchor="middle">SUBPROBLEMS</text>
            <rect x="315" y="72" width="150" height="26" rx="4" fill="rgba(244, 63, 94, 0.15)" stroke="rgba(244, 63, 94, 0.3)" />
            <text x="390" y="89" fill="#fecdd3" fontSize="10" textAnchor="middle">3D Packing Non-Overlap</text>
            <rect x="315" y="106" width="150" height="26" rx="4" fill="rgba(244, 63, 94, 0.15)" stroke="rgba(244, 63, 94, 0.3)" />
            <text x="390" y="123" fill="#fecdd3" fontSize="10" textAnchor="middle">SoC &amp; Time-Windows</text>
            <rect x="315" y="140" width="150" height="26" rx="4" fill="rgba(244, 63, 94, 0.15)" stroke="rgba(244, 63, 94, 0.3)" />
            <text x="390" y="157" fill="#fecdd3" fontSize="10" textAnchor="middle">Continuous Kinematics</text>

            {/* Return Arrow 1: Infeasibility Cut */}
            <path d="M 300 135 L 200 135" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,3" markerEnd="url(#arrowRed)" />
            <text x="245" y="152" fill="#f87171" fontSize="9.5" fontWeight="700" textAnchor="middle">Infeasibility Cut π*</text>

            {/* Solution Verification Node */}
            <circle cx="560" cy="110" r="35" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" />
            <text x="560" y="106" fill="#10b981" fontSize="11" fontWeight="800" textAnchor="middle">OPTIMAL</text>
            <text x="560" y="122" fill="#a7f3d0" fontSize="9.5" textAnchor="middle">Gap = 0.0%</text>

            {/* Subproblem to Optimal Arrow */}
            <path d="M 480 110 L 520 110" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrowGreen)" />
            <text x="500" y="100" fill="#10b981" fontSize="9" fontWeight="700" textAnchor="middle">Feasible</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 2. 3D CONTAINERIZATION & LIFO STACKING                                   */}
        {/* ========================================================================= */}
        {schemaType === 'packing_lifo' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* AMR Platform Base */}
            <polygon points="120,180 340,180 440,140 220,140" fill="rgba(30, 41, 59, 0.8)" stroke="#38bdf8" strokeWidth="2" />
            <text x="270" y="166" fill="#94a3b8" fontSize="10" fontWeight="700">AMR Cargo Platform Bed</text>

            {/* Center of Mass Marker on Bed */}
            <circle cx="280" cy="160" r="4" fill="#38bdf8" />
            <text x="290" y="163" fill="#38bdf8" fontSize="9" fontFamily="monospace">Bed Center</text>

            {/* Bottom Box (Delivered Later) */}
            <polygon points="170,145 290,145 350,115 230,115" fill="rgba(14, 165, 233, 0.3)" stroke="#0284c7" strokeWidth="1.5" />
            <polygon points="170,145 290,145 290,115 170,115" fill="rgba(14, 165, 233, 0.4)" stroke="#0284c7" strokeWidth="1.5" />
            <polygon points="290,145 350,115 350,85 290,115" fill="rgba(14, 165, 233, 0.2)" stroke="#0284c7" strokeWidth="1.5" />
            <text x="230" y="133" fill="#e0f2fe" fontSize="10" fontWeight="800">Box A (Stop 2 - Base)</text>

            {/* Top Box (Delivered First - LIFO) */}
            <polygon points="190,110 280,110 330,85 240,85" fill="rgba(16, 185, 129, 0.4)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="190,110 280,110 280,80 190,80" fill="rgba(16, 185, 129, 0.5)" stroke="#10b981" strokeWidth="1.5" />
            <polygon points="280,110 330,85 330,55 280,80" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" strokeWidth="1.5" />
            <text x="235" y="97" fill="#d1fae5" fontSize="10" fontWeight="800">Box B (Stop 1 - LIFO)</text>

            {/* Support Ratio Indicator */}
            <path d="M 235 97 L 235 110" stroke="#fbbf24" strokeWidth="2" strokeDasharray="2,2" />
            <circle cx="255" cy="80" r="5" fill="#f43f5e" />
            <text x="268" y="80" fill="#f43f5e" fontSize="9.5" fontWeight="700">CoM Payload</text>

            {/* Metrics Callout Panel */}
            <rect x="440" y="30" width="180" height="150" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(0, 240, 255, 0.3)" />
            <text x="455" y="55" fill="#00f0ff" fontSize="11" fontWeight="800">STABILITY INVARIANTS</text>
            <text x="455" y="80" fill="#e2e8f0" fontSize="10">Support Ratio (σ):</text>
            <text x="560" y="80" fill="#10b981" fontSize="11" fontWeight="700" fontFamily="monospace">0.762 ≥ 0.75</text>
            <text x="455" y="105" fill="#e2e8f0" fontSize="10">CoM Offset (Δ):</text>
            <text x="560" y="105" fill="#38bdf8" fontSize="11" fontWeight="700" fontFamily="monospace">0.08m ≤ 0.15m</text>
            <text x="455" y="130" fill="#e2e8f0" fontSize="10">Roll Angle (θ):</text>
            <text x="560" y="130" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="monospace">1.8° ≪ 5.0°</text>
            <text x="455" y="155" fill="#e2e8f0" fontSize="10">LIFO Precedence:</text>
            <text x="560" y="155" fill="#10b981" fontSize="10" fontWeight="700">PASS (Acyclic)</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 3. QAOA QUANTUM CIRCUIT FLOW                                             */}
        {/* ========================================================================= */}
        {schemaType === 'qaoa_circuit' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Input Qubits */}
            <text x="30" y="60" fill="#94a3b8" fontSize="11" fontFamily="monospace">|0⟩</text>
            <text x="30" y="110" fill="#94a3b8" fontSize="11" fontFamily="monospace">|0⟩</text>
            <text x="30" y="160" fill="#94a3b8" fontSize="11" fontFamily="monospace">|0⟩</text>

            {/* Qubit Wires */}
            <line x1="60" y1="55" x2="520" y2="55" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
            <line x1="60" y1="105" x2="520" y2="105" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
            <line x1="60" y1="155" x2="520" y2="155" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />

            {/* Hadamard Initialization Layer */}
            <rect x="75" y="40" width="30" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
            <text x="90" y="60" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">H</text>
            <rect x="75" y="90" width="30" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
            <text x="90" y="110" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">H</text>
            <rect x="75" y="140" width="30" height="30" rx="4" fill="rgba(56, 189, 248, 0.2)" stroke="#38bdf8" />
            <text x="90" y="160" fill="#38bdf8" fontSize="12" fontWeight="700" textAnchor="middle">H</text>
            <text x="90" y="25" fill="#38bdf8" fontSize="9.5" fontWeight="700" textAnchor="middle">|+⟩ State</text>

            {/* Layer 1: Problem Hamiltonian Phase Gate */}
            <rect x="135" y="35" width="80" height="135" rx="6" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1.5" />
            <text x="175" y="95" fill="#c084fc" fontSize="11" fontWeight="800" textAnchor="middle">e^(-iγ₁ H_C)</text>
            <text x="175" y="115" fill="#e9d5ff" fontSize="9" textAnchor="middle">Route Cost</text>
            <text x="175" y="25" fill="#c084fc" fontSize="9.5" fontWeight="700" textAnchor="middle">Cost Unitary</text>

            {/* Layer 1: Mixer Hamiltonian Gate */}
            <rect x="235" y="35" width="70" height="135" rx="6" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1.5" />
            <text x="270" y="95" fill="#00f0ff" fontSize="11" fontWeight="800" textAnchor="middle">e^(-iβ₁ H_M)</text>
            <text x="270" y="115" fill="#bae6fd" fontSize="9" textAnchor="middle">Mixer (X)</text>
            <text x="270" y="25" fill="#00f0ff" fontSize="9.5" fontWeight="700" textAnchor="middle">Mixer Unitary</text>

            {/* Layer 2 to p Indicator */}
            <rect x="330" y="35" width="80" height="135" rx="6" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeDasharray="3,3" />
            <text x="370" y="95" fill="#c084fc" fontSize="11" fontWeight="700" textAnchor="middle">Layer 2...p</text>
            <text x="370" y="115" fill="#e9d5ff" fontSize="9" textAnchor="middle">p = 3 Layers</text>

            {/* Measurement Detector */}
            <rect x="435" y="40" width="30" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" />
            <text x="450" y="60" fill="#10b981" fontSize="12" textAnchor="middle">M</text>
            <rect x="435" y="90" width="30" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" />
            <text x="450" y="110" fill="#10b981" fontSize="12" textAnchor="middle">M</text>
            <rect x="435" y="140" width="30" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" />
            <text x="450" y="160" fill="#10b981" fontSize="12" textAnchor="middle">M</text>
            <text x="450" y="25" fill="#10b981" fontSize="9.5" fontWeight="700" textAnchor="middle">Sample Bits</text>

            {/* Classical Feedback Loop */}
            <path d="M 480 105 C 560 105, 560 195, 270 195 C 175 195, 175 180, 175 175" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,3" markerEnd="url(#arrowCyan)" />
            <text x="370" y="210" fill="#fbbf24" fontSize="9.5" fontWeight="700" textAnchor="middle">Classical Optimizer (COBYLA) Refines (γ, β)</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 4. CHUTE HYDRODYNAMICS & BUFFER REGULATION                               */}
        {/* ========================================================================= */}
        {schemaType === 'chute_hydrodynamics' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Infeed AMR Conveyor Pipe */}
            <path d="M 40 50 L 180 50 L 220 80" fill="none" stroke="#38bdf8" strokeWidth="4" markerEnd="url(#arrowCyan)" />
            <text x="110" y="38" fill="#38bdf8" fontSize="10" fontWeight="700">Inbound AMR Drop (Q̇_in)</text>

            {/* Chute Storage Tank Container */}
            <rect x="220" y="60" width="180" height="130" rx="6" fill="rgba(15, 23, 42, 0.9)" stroke="#00f0ff" strokeWidth="2" />
            <text x="310" y="82" fill="#00f0ff" fontSize="12" fontWeight="800" textAnchor="middle">CHUTE C2 BUFFER TANK</text>

            {/* Fluid Volume Level (89% Full Surge) */}
            <rect x="224" y="95" width="172" height="92" fill="rgba(239, 68, 68, 0.3)" />
            <line x1="220" y1="95" x2="400" y2="95" stroke="#ef4444" strokeWidth="2" strokeDasharray="4,2" />
            <text x="310" y="112" fill="#f87171" fontSize="11" fontWeight="800" textAnchor="middle">SURGE: 3.12 m³ (89.1%)</text>
            <text x="310" y="130" fill="#cbd5e1" fontSize="9.5" textAnchor="middle">Capacity: Q_max = 3.50 m³</text>

            {/* 85% Warning Threshold Mark */}
            <line x1="220" y1="108" x2="400" y2="108" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3,3" />
            <text x="405" y="111" fill="#fbbf24" fontSize="9">85% Backpressure Limit</text>

            {/* Outflow Conveyor Clearance */}
            <path d="M 400 160 L 520 160" fill="none" stroke="#10b981" strokeWidth="4" markerEnd="url(#arrowGreen)" />
            <text x="470" y="150" fill="#10b981" fontSize="10" fontWeight="700">Conveyor Out (Q̇_out)</text>

            {/* Supervisory Closed-Loop Recourse Box */}
            <rect x="430" y="30" width="190" height="65" rx="6" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" />
            <text x="525" y="48" fill="#fbbf24" fontSize="10.5" fontWeight="800" textAnchor="middle">AUTONOMOUS BACKPRESSURE</text>
            <text x="525" y="65" fill="#e2e8f0" fontSize="9" textAnchor="middle">Q_c &gt; 85% ➜ 18s AMR Infeed Delay</text>
            <text x="525" y="80" fill="#38bdf8" fontSize="9" textAnchor="middle">Overflow diverted to Chute C3</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 5. SIPP CORRIDOR & ISO 3691-4 SPEED CLAMPING                             */}
        {/* ========================================================================= */}
        {schemaType === 'sipp_corridor' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Aisle Corridor Walls */}
            <line x1="40" y1="40" x2="600" y2="40" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" strokeDasharray="5,5" />
            <line x1="40" y1="180" x2="600" y2="180" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" strokeDasharray="5,5" />
            <text x="50" y="30" fill="#64748b" fontSize="9.5" fontWeight="700">WAREHOUSE AISLE 4 CORRIDOR</text>

            {/* AMR 1 Moving Forward */}
            <rect x="120" y="85" width="55" height="40" rx="4" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="1.5" />
            <text x="147" y="108" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">AMR_001</text>

            {/* Dynamic Swept-Volume Bubble (1.2m) */}
            <ellipse cx="147" cy="105" rx="65" ry="45" fill="rgba(0, 240, 255, 0.08)" stroke="#00f0ff" strokeWidth="1" strokeDasharray="3,3" />
            <text x="147" y="160" fill="#38bdf8" fontSize="9" textAnchor="middle">1.2m Swept Safety Bubble</text>

            {/* Laser Scanner Warning Envelope (3.0m) */}
            <ellipse cx="147" cy="105" rx="140" ry="60" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="4,4" />
            <text x="230" y="70" fill="#fbbf24" fontSize="9">3.0m LiDAR Warning Field</text>

            {/* Human Associate Marker */}
            <circle cx="340" cy="105" r="10" fill="rgba(244, 63, 94, 0.3)" stroke="#f43f5e" strokeWidth="2" />
            <text x="340" y="109" fill="#ffffff" fontSize="9" fontWeight="800" textAnchor="middle">H</text>
            <text x="340" y="130" fill="#f43f5e" fontSize="9.5" fontWeight="700" textAnchor="middle">Operator in Aisle</text>

            {/* Velocity Clamping Arc Annotation */}
            <rect x="420" y="60" width="190" height="90" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(244, 63, 94, 0.4)" />
            <text x="435" y="82" fill="#f43f5e" fontSize="11" fontWeight="800">ISO 3691-4 SPEED CLAMP</text>
            <text x="435" y="102" fill="#cbd5e1" fontSize="9.5">Normal transit: <tspan fill="#38bdf8" fontWeight="700">1.75 m/s</tspan></text>
            <text x="435" y="120" fill="#cbd5e1" fontSize="9.5">Pedestrian within 3m: <tspan fill="#f87171" fontWeight="700">0.40 m/s</tspan></text>
            <text x="435" y="138" fill="#10b981" fontSize="9">Continuous SIPP Safe Interval</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 6. KERS ENERGETICS & POWER DRAW DECOMPOSITION                            */}
        {/* ========================================================================= */}
        {schemaType === 'kers_energetics' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Battery Source */}
            <rect x="40" y="60" width="120" height="90" rx="8" fill="rgba(16, 185, 129, 0.15)" stroke="#10b981" strokeWidth="2" />
            <text x="100" y="85" fill="#10b981" fontSize="12" fontWeight="800" textAnchor="middle">LiFePO4 BATTERY</text>
            <text x="100" y="105" fill="#34d399" fontSize="16" fontWeight="800" textAnchor="middle">1.48 kWh</text>
            <text x="100" y="125" fill="#94a3b8" fontSize="9" textAnchor="middle">Nominal Reserve &ge; 15%</text>

            {/* Distribution Arrows */}
            <path d="M 160 85 L 260 50" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <path d="M 160 100 L 260 100" stroke="#fbbf24" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <path d="M 160 115 L 260 150" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrowCyan)" />

            {/* Subsystem Consumers */}
            <rect x="270" y="35" width="160" height="30" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" />
            <text x="350" y="54" fill="#e0f2fe" fontSize="10" textAnchor="middle">Traction Motors: <tspan fontWeight="700" fill="#38bdf8">0.84 kWh (56.8%)</tspan></text>

            <rect x="270" y="85" width="160" height="30" rx="4" fill="rgba(251, 191, 36, 0.15)" stroke="#fbbf24" />
            <text x="350" y="104" fill="#fef3c7" fontSize="10" textAnchor="middle">Deck / Lifts: <tspan fontWeight="700" fill="#fbbf24">0.32 kWh (21.6%)</tspan></text>

            <rect x="270" y="135" width="160" height="30" rx="4" fill="rgba(168, 85, 247, 0.15)" stroke="#a855f7" />
            <text x="350" y="154" fill="#f3e8ff" fontSize="10" textAnchor="middle">LiDAR &amp; Edge: <tspan fontWeight="700" fill="#a855f7">0.21 kWh (14.2%)</tspan></text>

            {/* KERS Recuperation Return Loop */}
            <path d="M 440 50 C 530 50, 530 195, 220 195 C 100 195, 100 160, 100 152" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4,3" markerEnd="url(#arrowGreen)" />
            <rect x="250" y="180" width="220" height="30" rx="4" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" />
            <text x="360" y="199" fill="#a7f3d0" fontSize="10" fontWeight="800" textAnchor="middle">KERS Recuperation: -0.14 kWh (9.4%)</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 7. 4-TIER CYBER-PHYSICAL DISPATCH HIERARCHY                              */}
        {/* ========================================================================= */}
        {schemaType === 'dispatch_tiers' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Tier 1 */}
            <rect x="40" y="25" width="120" height="170" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#00f0ff" strokeWidth="1.5" />
            <text x="100" y="50" fill="#00f0ff" fontSize="11" fontWeight="800" textAnchor="middle">TIER 1</text>
            <text x="100" y="70" fill="#e2e8f0" fontSize="10" fontWeight="700" textAnchor="middle">Order Batching</text>
            <text x="100" y="90" fill="#94a3b8" fontSize="9" textAnchor="middle">Chute Envelopes</text>
            <text x="100" y="110" fill="#94a3b8" fontSize="9" textAnchor="middle">Makespan Min</text>
            <text x="100" y="170" fill="#00f0ff" fontSize="9" textAnchor="middle">Gate 1 Certified</text>

            {/* Arrow T1 -> T2 */}
            <path d="M 160 85 L 195 85" stroke="#00f0ff" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <path d="M 195 135 L 160 135" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrowRed)" />

            {/* Tier 2 */}
            <rect x="200" y="25" width="120" height="170" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="260" y="50" fill="#38bdf8" fontSize="11" fontWeight="800" textAnchor="middle">TIER 2</text>
            <text x="260" y="70" fill="#e2e8f0" fontSize="10" fontWeight="700" textAnchor="middle">3D Packing</text>
            <text x="260" y="90" fill="#94a3b8" fontSize="9" textAnchor="middle">LIFO Acyclicity</text>
            <text x="260" y="110" fill="#94a3b8" fontSize="9" textAnchor="middle">CoM Stability</text>
            <text x="260" y="170" fill="#38bdf8" fontSize="9" textAnchor="middle">Gate 2 Certified</text>

            {/* Arrow T2 -> T3 */}
            <path d="M 320 85 L 355 85" stroke="#38bdf8" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <path d="M 355 135 L 320 135" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrowRed)" />

            {/* Tier 3 */}
            <rect x="360" y="25" width="120" height="170" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#a855f7" strokeWidth="1.5" />
            <text x="420" y="50" fill="#c084fc" fontSize="11" fontWeight="800" textAnchor="middle">TIER 3</text>
            <text x="420" y="70" fill="#e2e8f0" fontSize="10" fontWeight="700" textAnchor="middle">MD-VRPTW</text>
            <text x="420" y="90" fill="#94a3b8" fontSize="9" textAnchor="middle">Quantum QAOA</text>
            <text x="420" y="110" fill="#94a3b8" fontSize="9" textAnchor="middle">SoC Discharge</text>
            <text x="420" y="170" fill="#c084fc" fontSize="9" textAnchor="middle">Gate 3 Certified</text>

            {/* Arrow T3 -> T4 */}
            <path d="M 480 85 L 515 85" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrowCyan)" />
            <path d="M 515 135 L 480 135" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,3" markerEnd="url(#arrowRed)" />

            {/* Tier 4 */}
            <rect x="520" y="25" width="100" height="170" rx="8" fill="rgba(15, 23, 42, 0.9)" stroke="#10b981" strokeWidth="1.5" />
            <text x="570" y="50" fill="#10b981" fontSize="11" fontWeight="800" textAnchor="middle">TIER 4</text>
            <text x="570" y="70" fill="#e2e8f0" fontSize="10" fontWeight="700" textAnchor="middle">Kinematics</text>
            <text x="570" y="90" fill="#94a3b8" fontSize="9" textAnchor="middle">SIPP Paths</text>
            <text x="570" y="110" fill="#94a3b8" fontSize="9" textAnchor="middle">ISO 3691-4</text>
            <text x="570" y="170" fill="#10b981" fontSize="9" textAnchor="middle">Gate 4 Certified</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 8. ISING QUBO SPIN LATTICE                                               */}
        {/* ========================================================================= */}
        {schemaType === 'ising_qubo' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Spin Vertices (Orders / Depots) */}
            <line x1="120" y1="70" x2="260" y2="50" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" />
            <line x1="260" y1="50" x2="380" y2="100" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" />
            <line x1="380" y1="100" x2="280" y2="170" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" />
            <line x1="280" y1="170" x2="120" y2="150" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" />
            <line x1="120" y1="70" x2="280" y2="170" stroke="rgba(168, 85, 247, 0.3)" strokeDasharray="3,3" />
            <line x1="260" y1="50" x2="120" y2="150" stroke="rgba(168, 85, 247, 0.3)" strokeDasharray="3,3" />

            {/* Edge Couplings J_ij */}
            <text x="185" y="52" fill="#c084fc" fontSize="9.5" fontFamily="monospace">J₁₂ Z₁Z₂</text>
            <text x="330" y="68" fill="#c084fc" fontSize="9.5" fontFamily="monospace">J₂₃ Z₂Z₃</text>
            <text x="340" y="145" fill="#c084fc" fontSize="9.5" fontFamily="monospace">J₃₄ Z₃Z₄</text>
            <text x="195" y="172" fill="#c084fc" fontSize="9.5" fontFamily="monospace">J₄₁ Z₄Z₁</text>

            {/* Node 1 */}
            <circle cx="120" cy="70" r="18" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
            <text x="120" y="74" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">q₁</text>
            <text x="90" y="70" fill="#94a3b8" fontSize="8.5">h₁ Z₁</text>

            {/* Node 2 */}
            <circle cx="260" cy="50" r="18" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
            <text x="260" y="54" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">q₂</text>
            <text x="260" y="26" fill="#94a3b8" fontSize="8.5" textAnchor="middle">h₂ Z₂</text>

            {/* Node 3 */}
            <circle cx="380" cy="100" r="18" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
            <text x="380" y="104" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">q₃</text>
            <text x="410" y="104" fill="#94a3b8" fontSize="8.5">h₃ Z₃</text>

            {/* Node 4 */}
            <circle cx="280" cy="170" r="18" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
            <text x="280" y="174" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">q₄</text>
            <text x="280" y="198" fill="#94a3b8" fontSize="8.5" textAnchor="middle">h₄ Z₄</text>

            {/* Node 5 */}
            <circle cx="120" cy="150" r="18" fill="rgba(0, 240, 255, 0.2)" stroke="#00f0ff" strokeWidth="2" />
            <text x="120" y="154" fill="#00f0ff" fontSize="10" fontWeight="800" textAnchor="middle">q₅</text>
            <text x="90" y="155" fill="#94a3b8" fontSize="8.5">h₅ Z₅</text>

            {/* Explanation Box */}
            <rect x="445" y="40" width="175" height="130" rx="8" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(168, 85, 247, 0.4)" />
            <text x="460" y="65" fill="#c084fc" fontSize="11" fontWeight="800">ISING QUBO MAPPING</text>
            <text x="460" y="88" fill="#e2e8f0" fontSize="9.5">Binary x_i ∈ &#123;0, 1&#125; ➜ Z_i</text>
            <text x="460" y="108" fill="#94a3b8" fontSize="9">Coupling J_ij = Arc Distances</text>
            <text x="460" y="128" fill="#94a3b8" fontSize="9">Local Field h_i = Time Windows</text>
            <text x="460" y="148" fill="#10b981" fontSize="9">Ground State = Optimal Tour</text>
          </svg>
        )}

        {/* ========================================================================= */}
        {/* 9. SPEED CLAMPING DECELERATION ARC                                       */}
        {/* ========================================================================= */}
        {schemaType === 'speed_clamping' && (
          <svg viewBox="0 0 640 220" style={{ width: '100%', height: 'auto' }}>
            {/* Axis */}
            <line x1="80" y1="170" x2="560" y2="170" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
            <line x1="80" y1="170" x2="80" y2="40" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="1.5" />
            <text x="560" y="190" fill="#94a3b8" fontSize="9.5" textAnchor="end">Distance to Pedestrian d_H (m)</text>
            <text x="75" y="35" fill="#94a3b8" fontSize="9.5" textAnchor="end">Velocity v(t) [m/s]</text>

            {/* Velocity Limits Lines */}
            <line x1="80" y1="65" x2="560" y2="65" stroke="rgba(56, 189, 248, 0.2)" strokeDasharray="3,3" />
            <text x="70" y="68" fill="#38bdf8" fontSize="9" textAnchor="end">1.75 m/s</text>

            <line x1="80" y1="135" x2="560" y2="135" stroke="rgba(244, 63, 94, 0.3)" strokeDasharray="3,3" />
            <text x="70" y="138" fill="#f43f5e" fontSize="9" textAnchor="end">0.40 m/s</text>

            {/* 3.0m Marker */}
            <line x1="320" y1="40" x2="320" y2="170" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4,3" />
            <text x="320" y="185" fill="#fbbf24" fontSize="9" textAnchor="middle">d_H = 3.0 m</text>

            {/* Deceleration Curve */}
            <path d="M 520 65 L 360 65 Q 320 65, 270 135 L 140 135 L 90 170" fill="none" stroke="#00f0ff" strokeWidth="3" />

            {/* Annotations */}
            <circle cx="320" cy="95" r="4" fill="#fbbf24" />
            <text x="330" y="95" fill="#fbbf24" fontSize="9" fontWeight="700">ISO 3691-4 Clamping Trigger</text>
            <text x="440" y="55" fill="#38bdf8" fontSize="9.5" fontWeight="700">Free Corridor Transit (1.75 m/s)</text>
            <text x="180" y="125" fill="#f87171" fontSize="9.5" fontWeight="700">Creep Safety Speed (0.40 m/s)</text>
          </svg>
        )}
      </div>

      {caption && (
        <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', maxWidth: '580px' }}>
          {caption}
        </div>
      )}
    </div>
  );
};
