import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Minus, Maximize2, Minimize2, X } from 'lucide-react';

export type HUDPanelDisplayMode = 'expanded' | 'minimized' | 'hidden';

export interface HUDPanelBadge {
  text: string;
  color?: string;
  bg?: string;
  border?: string;
}

export interface HUDPanelProps {
  id?: string;
  title: string;
  icon: React.ReactNode;
  badge?: HUDPanelBadge;
  summaryText?: string;
  mode?: HUDPanelDisplayMode;
  onModeChange?: (newMode: HUDPanelDisplayMode) => void;
  onClose?: () => void;
  actions?: React.ReactNode;
  accentColor?: string; // e.g. '#00f0ff', '#fbbf24', '#a855f7', '#10b981'
  positionStyle?: React.CSSProperties;
  width?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  zIndex?: number;
  onFocus?: () => void;
  isMinimizable?: boolean;
  isClosable?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const HUDPanel: React.FC<HUDPanelProps> = ({
  id,
  title,
  icon,
  badge,
  summaryText,
  mode: controlledMode,
  onModeChange,
  onClose,
  actions,
  accentColor = '#00f0ff',
  positionStyle,
  width = '320px',
  maxWidth = 'calc(100vw - 32px)',
  maxHeight = 'calc(100vh - 120px)',
  zIndex = 20,
  onFocus,
  isMinimizable = true,
  isClosable = false,
  className = '',
  children,
}) => {
  const [internalMode, setInternalMode] = useState<HUDPanelDisplayMode>('expanded');
  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  const setMode = (newMode: HUDPanelDisplayMode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
  };

  if (activeMode === 'hidden') return null;

  const isExpanded = activeMode === 'expanded';

  return (
    <div
      id={id}
      className={`glass-panel ${className}`}
      onClick={onFocus}
      style={{
        position: 'absolute',
        zIndex,
        width: isExpanded ? width : 'auto',
        maxWidth,
        maxHeight: isExpanded ? maxHeight : '42px',
        backgroundColor: 'rgba(8, 14, 26, 0.94)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${accentColor}44`,
        borderRadius: '10px',
        boxShadow: `0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px ${accentColor}18`,
        color: '#f0f4f8',
        transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        ...positionStyle,
      }}
    >
      {/* Top Accent Line */}
      <div
        style={{
          height: '2px',
          width: '100%',
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}44 70%, transparent 100%)`,
        }}
      />

      {/* Standardized Header Toolbar */}
      <div
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: `linear-gradient(90deg, ${accentColor}14 0%, rgba(255, 255, 255, 0.02) 100%)`,
          borderBottom: isExpanded ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
          cursor: isMinimizable ? 'pointer' : 'default',
          userSelect: 'none',
          minHeight: '38px',
        }}
        onClick={() => {
          if (isMinimizable) {
            setMode(isExpanded ? 'minimized' : 'expanded');
          }
        }}
      >
        {/* Left: Icon + Title + Badge + Summary */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              backgroundColor: `${accentColor}18`,
              border: `1px solid ${accentColor}55`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              color: accentColor,
            }}
          >
            {icon}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexWrap: 'nowrap' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.05em',
                color: '#f0f4f8',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </span>

            {badge && (
              <span
                style={{
                  fontSize: '8.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '3px',
                  backgroundColor: badge.bg || `${accentColor}22`,
                  color: badge.color || accentColor,
                  border: `1px solid ${badge.border || `${accentColor}44`}`,
                  whiteSpace: 'nowrap',
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {badge.text}
              </span>
            )}

            {!isExpanded && summaryText && (
              <span
                style={{
                  fontSize: '10px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  paddingLeft: '4px',
                  borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {summaryText}
              </span>
            )}
          </div>
        </div>

        {/* Right: Custom Action Buttons & Window Controls */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{actions}</div>}

          {isMinimizable && (
            <button
              onClick={() => setMode(isExpanded ? 'minimized' : 'expanded')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '3px 5px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title={isExpanded ? 'Minimize panel' : 'Expand panel'}
            >
              {isExpanded ? <Minus size={12} /> : <Maximize2 size={11} />}
            </button>
          )}

          {isClosable && onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '3px 5px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              title="Close panel"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body Content (Shown only when expanded) */}
      {isExpanded && (
        <div
          style={{
            padding: '12px',
            overflowY: 'auto',
            maxHeight: typeof maxHeight === 'number' ? `${maxHeight - 42}px` : 'calc(100% - 42px)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};
