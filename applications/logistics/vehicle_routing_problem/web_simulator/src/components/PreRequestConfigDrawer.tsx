import React, { useState } from 'react';
import { ParameterCard } from './ParameterCard';
import { CONFIG_LIMITS } from '../services/api';
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
} from 'lucide-react';

interface PreRequestConfigDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  config: Record<string, any>;
  onChangeConfig: (key: string, val: any) => void;
  onApplyAndDispatch: () => void;
  onResetAllDefaults: () => void;
}

// Comprehensive parameter descriptions for rich hover tooltips
const PARAM_DESCRIPTIONS: Record<string, string> = {
  // Facility
  facility_length_m: 'Total longitudinal length of the warehouse floor (m). Defines AMR traversal envelope and coordinates.',
  facility_width_m: 'Total lateral width of the warehouse floor (m). Sets cross-aisle span and depot bay separation.',
  facility_height_m: 'Vertical clearance from floor to roof trusses (m). Governs multi-tier mezzanine and AS/RS lift bounds.',
  aisle_count: 'Number of active parallel storage aisles. Determines routing topology and one-way directional constraints.',
  aisle_width_m: 'Clear width of picking aisles (m). If < 2.5m, bidirectional AMR passing is restricted pursuant to ISO 3691-4.',
  chute_buffer_capacity_m3: 'Maximum volumetric staging buffer at each consolidation drop chute (m³) before overflow block occurs.',
  // Kinematics & ISO 3691-4
  fleet_size: 'Active Autonomous Mobile Robot (AMR) count. Directly scales parallel order fulfillment throughput.',
  v_max_amr_mps: 'Maximum kinematic velocity of AMR in unrestricted automated zones (m/s). Nominal industrial ceiling: 2.0 m/s.',
  v_safe_hri_mps: 'Mandatory reduced speed limit in Human-Robot Shared Aisles (m/s) pursuant to ISO 3691-4 safety standard (<= 0.4 m/s).',
  a_max_amr_mps2: 'Nominal AMR linear acceleration/deceleration rate (m/s²). Governs transit acceleration ramps.',
  emergency_decel_mps2: 'Emergency braking deceleration rate (m/s²) when pedestrian or obstacle enters safety laser scanner zone.',
  min_headway_sec: 'Dynamic spatiotemporal time gap maintained between consecutive AMRs (s) to guarantee zero collisions.',
  battery_capacity_kwh: 'Total onboard Lithium-ion battery capacity per vehicle (kWh). Dictates total operating range before recharge.',
  battery_initial_soc: 'State-of-Charge (%) at start of dispatch wave. Typical starting threshold: 90-100%.',
  battery_min_soc: 'Minimum allowable battery reserve (%) before vehicle is forced to terminate trip at a charging depot (Invariant Gate 1).',
  max_payload_mass_kg: 'Maximum gross payload capacity per robot bay (kg). Overload triggers Gate 1 structural violation.',
  max_payload_volume_m3: 'Maximum cubical cargo volume per robot bay (m³). Prevents physical tote overfill.',
  // Orders
  num_orders: 'Total customer order lines to batch and fulfill in current dispatch wave (orders).',
  hazard_fraction: 'Percentage of order SKUs classified as hazardous or flammable (%), requiring isolated tote compartmentalization.',
  tight_deadline_fraction: 'Percentage of orders with urgent consolidation cut-off windows (%), prioritized in QAOA Hamiltonian.',
  time_window_span_sec: 'Standard open time window duration (s) for order pick and consolidation delivery.',
  // Tiers
  fcm_fuzziness_m: 'Fuzzy C-Means fuzzifier exponent m (1.05-3.50). Governs soft cluster overlap across AMR zones.',
  fcm_max_iter: 'Maximum macro-clustering iteration limit for Spatially-Constrained Quantum Fuzzy C-Means (SC-QFCM).',
  bpp_support_ratio_min: 'Minimum required bottom support surface area (85%) to prevent carton tipping during acceleration (Invariant R8).',
  friction_coeff_mu: 'Static friction coefficient between tote floor and carton (nominal 0.45). Prevents sliding during turns.',
  bpp_time_limit_sec: 'CP-SAT exact 3D Bin Packing constraint solver wall-clock cutoff per vehicle bay (seconds).',
  vrp_penalty_delay_beta: 'Lagrangian penalty weight (beta) per second of missed drop deadline in the objective function.',
  vrp_penalty_subtour_p: 'Miller-Tucker-Zemlin (MTZ) subtour elimination penalty factor ensuring single continuous tour.',
  kinematics_step_dt: 'Simulation numerical integration timestep dt (s) for SIPP kinematic trajectory discretization.',
  // Quantum
  qaoa_p_layers: 'QAOA variational circuit layer depth p (1-5). Higher p increases approximation ratio alpha at cost of circuit depth.',
  qaoa_shots: 'Number of quantum projective measurement samples (256-16384). Governs empirical probability fidelity.',
  max_circuit_width: 'Maximum qubit budget allocated for Classiq quantum circuit synthesis (8-64 qubits).',
  // Lagrangian
  lagrangian_alpha: 'Lagrangian multiplier weight for AMR payload capacity constraint relaxation.',
  lagrangian_beta: 'Lagrangian multiplier weight for time-window and order deadline compliance.',
  lagrangian_gamma: 'Lagrangian multiplier weight for battery state-of-charge reserve conservation.',
  lagrangian_lambda: 'Lagrangian multiplier weight for consolidation chute buffer capacity non-overflow.',
};

export const PreRequestConfigDrawer: React.FC<PreRequestConfigDrawerProps> = ({
  isOpen,
  onClose,
  config,
  onChangeConfig,
  onApplyAndDispatch,
  onResetAllDefaults,
}) => {
  const [activeCategory, setActiveCategory] = useState<'Kinematics' | 'Lagrangian' | 'Quantum' | 'Facility'>('Kinematics');

  if (!isOpen) return null;

  const presets = [
    {
      id: 'QUANTUM_MAX',
      name: 'Quantum Max Fidelity',
      icon: <Cpu size={14} />,
      desc: 'p=3, 2048 shots, XY mixer, COBYLA',
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
      desc: 'HGS-ADC, CP-SAT 2s limit, fast heuristics',
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
      desc: 'v_safe=0.35 m/s, headway=2.0s, battery min=20%',
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
      desc: 'Tight deadlines, chute penalty 4.0',
      tooltip: 'E-commerce peak rush hour wave: 50% tight delivery windows and quadrupled chute buffer penalty (lambda=4.0) to stress-test accumulation bounds.',
      apply: () => {
        onChangeConfig('tight_deadline_fraction', 50.0);
        onChangeConfig('lagrangian_lambda', 4.0);
      },
    },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '460px',
        backgroundColor: '#0c101c',
        borderLeft: '1px solid rgba(0, 240, 255, 0.3)',
        boxShadow: '-15px 0 40px rgba(0, 0, 0, 0.8)',
        zIndex: 1100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#080c16',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="#00f0ff" />
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f0f4f8' }}>
            Calculation Pre-Request Customizer
          </h3>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Presets Bar */}
      <div style={{ padding: '12px 20px', backgroundColor: '#060913', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '6px' }}>ONE-CLICK PRESETS</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
          {presets.map((p) => (
            <button
              key={p.id}
              onClick={p.apply}
              title={p.tooltip}
              style={{
                padding: '8px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '6px',
                color: '#f0f4f8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#00f0ff')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)')}
            >
              <div style={{ color: '#00f0ff' }}>{p.icon}</div>
              <div style={{ textAlign: 'left' }}>
                <div>{p.name}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#090d16' }}>
        {(['Kinematics', 'Quantum', 'Lagrangian', 'Facility'] as const).map((cat) => {
          const isActive = activeCategory === cat;
          const tabHints: Record<string, string> = {
            Kinematics: 'AMR vehicle dynamics, ISO 3691-4 HRI speed throttles, payload masses, and battery reserves.',
            Quantum: 'Classiq QAOA variational ansatz layer depth, measurement shot fidelity, and qubit width limits.',
            Lagrangian: 'Dual relaxation multiplier penalties (alpha, beta, gamma, lambda) for capacity, deadlines, and chutes.',
            Facility: 'Warehouse geometric envelope dimensions, aisle clearances, AS/RS bays, and chute capacities.',
          };
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              title={tabHints[cat]}
              style={{
                flex: 1,
                padding: '10px 0',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: isActive ? '2px solid #00f0ff' : '2px solid transparent',
                color: isActive ? '#00f0ff' : '#94a3b8',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Category Parameters Body */}
      <div style={{ flex: 1, minHeight: 0, padding: '16px 20px', paddingBottom: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(CONFIG_LIMITS)
          .filter(([_, spec]) => spec.category === activeCategory)
          .map(([key, spec]) => {
            const currentVal = config[key] !== undefined ? config[key] : spec.default;
            return (
              <ParameterCard
                key={key}
                label={key.replace(/_/g, ' ').toUpperCase()}
                paramKey={key}
                spec={spec}
                value={currentVal}
                description={PARAM_DESCRIPTIONS[key] || `${key.replace(/_/g, ' ')}: nominal ${spec.default} ${spec.unit}`}
                onChange={(val) => onChangeConfig(key, val)}
              />
            );
          })}
      </div>

      {/* Drawer Footer Actions */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: '#080c16',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <button
          onClick={onResetAllDefaults}
          title="Restore all 36 cyber-physical parameters back to their nominal validated engineering defaults."
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#00f0ff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <RotateCcw size={13} /> Reset All Defaults
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
            padding: '8px 18px',
            backgroundColor: '#00f0ff',
            border: 'none',
            borderRadius: '6px',
            color: '#050810',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Play size={14} /> Apply & Dispatch
        </button>
      </div>
    </div>
  );
};
