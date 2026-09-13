import React from 'react';
import { RotateCcw, Info, AlertTriangle, Search, ChevronRight } from 'lucide-react';
import { ParameterLimitSpec } from '../services/api';
import katex from 'katex';

interface ParameterCardProps {
  label: string;
  paramKey: string;
  spec: ParameterLimitSpec;
  value: number;
  onChange: (val: number) => void;
  description?: string;
  stageName?: string;
  symbol?: string;
  nominalRange?: [number, number];
  isSelected?: boolean;
  onInspect?: () => void;
}

export const ParameterCard: React.FC<ParameterCardProps> = ({
  label,
  paramKey,
  spec,
  value,
  onChange,
  description,
  stageName,
  symbol,
  nominalRange,
  isSelected,
  onInspect,
}) => {
  const isDefault = value === spec.default;

  const renderFormula = (latex: string) => {
    try {
      const html = katex.renderToString(latex, { throwOnError: false, displayMode: false });
      return <span dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return <code>{latex}</code>;
    }
  };

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
    nominal: 'rgba(0, 240, 255, 0.22)',
    stress: 'rgba(245, 158, 11, 0.45)',
    violation: 'rgba(239, 68, 68, 0.55)',
  };

  const badgeColors = {
    nominal: '#00f0ff',
    stress: '#f59e0b',
    violation: '#ef4444',
  };

  const defaultPct = Math.max(0, Math.min(100, ((spec.default - spec.min) / (spec.max - spec.min)) * 100));

  return (
    <div
      onClick={onInspect}
      style={{
        backgroundColor: isSelected ? 'rgba(0, 240, 255, 0.08)' : '#0c101c',
        border: isSelected ? '1px solid #00f0ff' : `1px solid ${borderColors[health]}`,
        borderRadius: '8px',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: isSelected
          ? '0 0 16px rgba(0, 240, 255, 0.3)'
          : health !== 'nominal'
          ? `0 0 10px ${borderColors[health]}`
          : 'none',
        transition: 'all 0.15s ease',
        cursor: 'pointer',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              color: isSelected ? '#00f0ff' : '#f0f4f8',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
          {symbol && (
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'monospace',
                color: '#94a3b8',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                padding: '1px 5px',
                borderRadius: '3px',
              }}
            >
              {renderFormula(symbol)}
            </span>
          )}
          {stageName && (
            <span
              style={{
                fontSize: '9px',
                color: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                padding: '1px 4px',
                borderRadius: '3px',
                whiteSpace: 'nowrap',
              }}
            >
              {stageName.split(':')[0]}
            </span>
          )}
        </div>

        {/* Right side controls: Numeric input & Reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: `1px solid ${borderColors[health]}`,
              borderRadius: '4px',
              padding: '1px 4px',
            }}
          >
            <input
              type="number"
              step={spec.step}
              min={spec.min}
              max={spec.max}
              value={value}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) onChange(val);
              }}
              style={{
                width: '52px',
                background: 'transparent',
                border: 'none',
                color: badgeColors[health],
                fontSize: '11px',
                fontFamily: 'monospace',
                fontWeight: 700,
                textAlign: 'right',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '3px' }}>{spec.unit}</span>
          </div>

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
              <RotateCcw size={12} />
            </button>
          )}

          <button
            onClick={onInspect}
            title="Inspect detailed mathematical problem & parameter influence"
            style={{
              background: isSelected ? '#00f0ff' : 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: isSelected ? '#050810' : '#94a3b8',
              cursor: 'pointer',
              padding: '3px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease',
            }}
          >
            <Search size={10} />
            <span>{isSelected ? 'Active' : 'Inspect'}</span>
          </button>
        </div>
      </div>

      {/* Dual Control: Slider with Default Baseline Marker */}
      <div
        style={{ position: 'relative', width: '100%', padding: '2px 0' }}
        onClick={(e) => e.stopPropagation()}
      >
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
            backgroundColor: 'rgba(255, 255, 255, 0.45)',
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
          fontSize: '9px',
          color: '#64748b',
        }}
      >
        <span>Min: {spec.min}</span>
        <span style={{ color: isDefault ? '#00f0ff' : '#64748b' }}>Nominal Default: {spec.default}</span>
        <span>Max: {spec.max}</span>
      </div>

      {health === 'violation' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', color: '#ef4444' }}>
          <AlertTriangle size={10} />
          <span>High stress / safety threshold reached!</span>
        </div>
      )}
    </div>
  );
};
