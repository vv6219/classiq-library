import React from 'react';
import {
  Layers,
  ShieldCheck,
  Navigation,
  Sparkles,
  Cpu,
  Minimize2,
  Maximize2,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { HUDPanelDisplayMode } from './HUDPanel';
import { trackButtonClick } from '../../utils/analytics';

export interface PanelStackState {
  floorEnvelope: HUDPanelDisplayMode;
  amrTelemetry: HUDPanelDisplayMode;
  quantumCoProc: HUDPanelDisplayMode;
  reportsRepo?: HUDPanelDisplayMode;
  reportsCount?: number;
  isLegendOpen: boolean;
  selectedVehicleId: string | null;
  operationalMode: string;
}

export interface PanelStackActions {
  setFloorEnvelopeMode: (mode: HUDPanelDisplayMode) => void;
  setAmrTelemetryMode: (mode: HUDPanelDisplayMode) => void;
  setQuantumCoProcMode: (mode: HUDPanelDisplayMode) => void;
  setReportsRepoMode?: (mode: HUDPanelDisplayMode) => void;
  setIsLegendOpen: (open: boolean) => void;
  minimizeAll: () => void;
  restoreAll: () => void;
}

interface PanelStackDockProps {
  state: PanelStackState;
  actions: PanelStackActions;
  positionStyle?: React.CSSProperties;
}

export const PanelStackDock: React.FC<PanelStackDockProps> = ({ state, actions, positionStyle }) => {
  const isAllMinimized =
    state.floorEnvelope === 'minimized' &&
    (state.amrTelemetry === 'minimized' || !state.selectedVehicleId) &&
    state.quantumCoProc === 'minimized' &&
    (state.reportsRepo === 'minimized' || state.reportsRepo === 'hidden' || !state.reportsRepo);

  const isQuantum = state.operationalMode === 'QUANTUM';

  return (
    <div
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        zIndex: 25,
        padding: '4px 12px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(8, 12, 22, 0.88)',
        border: '1px solid rgba(0, 240, 255, 0.25)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6), 0 0 16px rgba(0, 240, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        maxWidth: 'calc(100vw - 420px)',
        overflowX: 'auto',
        ...positionStyle,
      }}
    >
      {/* Title & Quick Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '8px', borderRight: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <Layers size={13} color="#00f0ff" />
        <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.04em' }}>
          HUD STACK
        </span>
        <button
          onClick={() => {
            trackButtonClick('HUD_Stack_Toggle_All', 'PanelStackDock', { action: isAllMinimized ? 'restore' : 'minimize' });
            if (isAllMinimized) {
              actions.restoreAll();
            } else {
              actions.minimizeAll();
            }
          }}
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            color: '#00f0ff',
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '2px 7px',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title={isAllMinimized ? 'Restore all HUD panels to expanded' : 'Minimize all HUD panels to compact pills'}
        >
          {isAllMinimized ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
          <span>{isAllMinimized ? 'Restore' : 'Min All'}</span>
        </button>
      </div>

      {/* Individual Panel Status Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Floor Envelope Pill */}
        <button
          onClick={() => {
            const nextMode = state.floorEnvelope === 'expanded' ? 'minimized' : 'expanded';
            actions.setFloorEnvelopeMode(nextMode);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: state.floorEnvelope === 'expanded' ? 'rgba(0, 240, 255, 0.18)' : 'rgba(255, 255, 255, 0.04)',
            border: state.floorEnvelope === 'expanded' ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
            color: state.floorEnvelope === 'expanded' ? '#00f0ff' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Floor Surface Envelope: Click to expand/minimize"
        >
          <ShieldCheck size={11} color={state.floorEnvelope === 'expanded' ? '#00f0ff' : '#64748b'} />
          <span>Floor Envelope</span>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>
            {state.floorEnvelope === 'expanded' ? '▲' : '▼'}
          </span>
        </button>

        {/* AMR Telemetry Pill (If vehicle selected) */}
        {state.selectedVehicleId && (
          <button
            onClick={() => {
              const nextMode = state.amrTelemetry === 'expanded' ? 'minimized' : 'expanded';
              actions.setAmrTelemetryMode(nextMode);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: state.amrTelemetry === 'expanded' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: state.amrTelemetry === 'expanded' ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              color: state.amrTelemetry === 'expanded' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={`${state.selectedVehicleId} Telemetry: Click to expand/minimize`}
          >
            <Navigation size={11} color={state.amrTelemetry === 'expanded' ? '#38bdf8' : '#64748b'} />
            <span>{state.selectedVehicleId}</span>
            <span style={{ fontSize: '8px', opacity: 0.7 }}>
              {state.amrTelemetry === 'expanded' ? '▲' : '▼'}
            </span>
          </button>
        )}

        {/* Engine Co-Processor Pill */}
        <button
          onClick={() => {
            const nextMode = state.quantumCoProc === 'expanded' ? 'minimized' : 'expanded';
            actions.setQuantumCoProcMode(nextMode);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor:
              state.quantumCoProc === 'expanded'
                ? isQuantum
                  ? 'rgba(168, 85, 247, 0.22)'
                  : 'rgba(245, 158, 11, 0.22)'
                : 'rgba(255, 255, 255, 0.04)',
            border:
              state.quantumCoProc === 'expanded'
                ? isQuantum
                  ? '1px solid #c084fc'
                  : '1px solid #f59e0b'
                : '1px solid rgba(255, 255, 255, 0.1)',
            color: state.quantumCoProc === 'expanded' ? (isQuantum ? '#c084fc' : '#fbbf24') : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="Active Calculation Engine: Click to expand/minimize"
        >
          {isQuantum ? <Sparkles size={11} /> : <Cpu size={11} />}
          <span>{isQuantum ? '32Q Co-Proc' : 'CPU Engine'}</span>
          <span style={{ fontSize: '8px', opacity: 0.7 }}>
            {state.quantumCoProc === 'expanded' ? '▲' : '▼'}
          </span>
        </button>

        {/* Reports Repository Pill */}
        {actions.setReportsRepoMode && (
          <button
            onClick={() => {
              const current = state.reportsRepo || 'minimized';
              const nextMode = current === 'expanded' ? 'minimized' : 'expanded';
              actions.setReportsRepoMode!(nextMode);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: 700,
              backgroundColor: state.reportsRepo === 'expanded' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: state.reportsRepo === 'expanded' ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
              color: state.reportsRepo === 'expanded' ? '#00f0ff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Reports Repository: Click to expand/minimize"
          >
            <FileText size={11} color={state.reportsRepo === 'expanded' ? '#00f0ff' : '#64748b'} />
            <span>Reports</span>
            {state.reportsCount !== undefined && (
              <span style={{ fontSize: '8.5px', opacity: 0.8, fontFamily: 'monospace' }}>
                ({state.reportsCount})
              </span>
            )}
            <span style={{ fontSize: '8px', opacity: 0.7 }}>
              {state.reportsRepo === 'expanded' ? '▲' : '▼'}
            </span>
          </button>
        )}

        {/* 3D Scene Legend & Tours Pill */}
        <button
          onClick={() => actions.setIsLegendOpen(!state.isLegendOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 700,
            backgroundColor: state.isLegendOpen ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
            border: state.isLegendOpen ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
            color: state.isLegendOpen ? '#00f0ff' : '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title="3D Scene Legend & Tours: Click to open/close"
        >
          <Layers size={11} />
          <span>Legend</span>
        </button>
      </div>
    </div>
  );
};
