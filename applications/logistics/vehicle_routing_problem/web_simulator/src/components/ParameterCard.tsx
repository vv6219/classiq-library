import React from 'react';
import { RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { ParameterLimitSpec } from '../services/api';

interface ParameterCardProps {
  label: string;
  paramKey: string;
  spec: ParameterLimitSpec;
  value: number;
  onChange: (val: number) => void;
  description?: string;
  nominalRange?: [number, number];
  isSelected?: boolean;
  onInspect?: () => void;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({
  label,
  spec,
  value,
  onChange,
  description,
  nominalRange,
  isSelected,
  onInspect,
}) => {
  const isDefault = value === spec.default;

  // Determine health zone
  let health: 'nominal' | 'stress' | 'violation' = 'nominal';
  if (nominalRange) {
    if (value < nominalRange[0] || value > nominalRange[1]) {
      health = 'stress';
    }
  }
  if (value >= spec.max * 0.95 || (spec.unit === '%' && value < 10.0)) {
    health = 'violation';
  }

  const borderColors = {
    nominal: 'rgba(0, 240, 255, 0.25)',
    stress: 'rgba(245, 158, 11, 0.5)',
    violation: 'rgba(239, 68, 68, 0.6)',
  };

  const badgeColors = {
    nominal: '#00f0ff',
    stress: '#f59e0b',
    violation: '#ef4444',
  };

  const defaultPct = ((spec.default - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <div
      onClick={onInspect}
      style={{
        backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.08)' : '#0c101c',
        border: isSelected ? '1px solid #00f0ff' : `1px solid ${borderColors[health]}`,
        borderRadius: '8px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: isSelected
          ? '0 0 16px rgba(0, 240, 255, 0.35)'
          : health !== 'nominal'
          ? `0 0 12px ${borderColors[health]}`
          : 'none',
        transition: 'all 0.2s ease',
        cursor: onInspect ? 'pointer' : 'default',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#00f0ff' : '#f0f4f8' }}>{label}</span>
          {isSelected && (
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#00f0ff', backgroundColor: 'rgba(0, 240, 255, 0.15)', padding: '1px 5px', borderRadius: '3px' }}>
              Inspecting
            </span>
          )}
          {description && (
            <span title={description} style={{ color: '#64748b', cursor: 'help' }}>
              <Info size={13} />
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: badgeColors[health],
              border: `1px solid ${borderColors[health]}`,
            }}
          >
            {value} {spec.unit}
          </span>
          {!isDefault && (
            <button
              onClick={() => onChange(spec.default)}
              title={`Reset to default (${spec.default} ${spec.unit})`}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00f0ff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              <RotateCcw size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Dual Control: Slider with Default Baseline Marker */}
      <div style={{ position: 'relative', width: '100%', padding: '4px 0' }}>
        <input
          type="range"
          min={spec.min}
          max={spec.max}
          step={spec.step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          style={{
            width: '100%',
            accentColor: badgeColors[health],
            cursor: 'pointer',
          }}
        />
        {/* Factory Baseline Tick Marker */}
        <div
          title={`Baseline Default: ${spec.default} ${spec.unit}`}
          style={{
            position: 'absolute',
            left: `calc(${defaultPct}% - 1px)`,
            top: '2px',
            bottom: '2px',
            width: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Footer Limits Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '10px',
          color: '#64748b',
        }}
      >
        <span>Min: {spec.min}</span>
        <span style={{ color: isDefault ? '#00f0ff' : '#64748b' }}>Def: {spec.default}</span>
        <span>Max: {spec.max}</span>
      </div>

      {health === 'violation' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#ef4444' }}>
          <AlertTriangle size={11} />
          <span>High stress / safety threshold reached!</span>
        </div>
      )}
    </div>
  );
};
