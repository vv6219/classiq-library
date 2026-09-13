import React, { useEffect } from 'react';
import {
  ShieldCheck,
  Scale,
  FileText,
  Database,
  ArrowLeft,
  Compass,
  Radio,
  Cpu,
  Sparkles,
  Layers,
} from 'lucide-react';
import { trackTelegramClick, trackEvent } from '../utils/analytics';
import { NavigationStep, StudioTabId } from '../types/navigationState';
import { buildBreadcrumbSegments } from '../utils/navigationHelper';

export interface LegalFooterBarProps {
  onOpenLegalModal: () => void;
  currentStep?: NavigationStep;
  canGoBack?: boolean;
  previousStepLabel?: string;
  onGoBack?: () => void;
  onNavigateSegment?: (segment: { level: string; label: string; id: string; tab?: StudioTabId }) => void;
  operationalMode?: 'QUANTUM' | 'CLASSICAL';
  currentRunId?: string;
}

export const LegalFooterBar: React.FC<LegalFooterBarProps> = ({
  onOpenLegalModal,
  currentStep,
  canGoBack = false,
  previousStepLabel,
  onGoBack,
  onNavigateSegment,
  operationalMode = 'QUANTUM',
  currentRunId = 'RUN-ACTIVE',
}) => {
  const handleOpenLegal = () => {
    trackEvent('modal_open', {
      modal_name: 'Legal_And_IP_Modal',
      event_category: 'Legal_Governance',
    });
    onOpenLegalModal();
  };

  // Keyboard shortcut: Alt+Left Arrow for Back navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        if (canGoBack && onGoBack) {
          onGoBack();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canGoBack, onGoBack]);

  // Compute navigation segments for the status bar
  const segments = currentStep
    ? buildBreadcrumbSegments(currentStep, 'Berlin Mega-Hub')
    : [{ level: 'facility', label: 'Berlin Mega-Hub', id: 'WMS-IND-01', color: '#00f0ff' }];

  return (
    <footer
      className="legal-footer-bar"
      role="contentinfo"
      aria-label="System Status and Navigation Bar"
      style={{
        height: '30px',
        minHeight: '30px',
        backgroundColor: 'rgba(6, 10, 20, 0.96)',
        borderTop: '1px solid rgba(0, 240, 255, 0.28)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 95,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        gap: '10px',
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      {/* LEFT SECTION: Active Back Link + Navigation Path Lineage */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexShrink: 1 }}>
        {/* Active Back Link Button */}
        <button
          onClick={() => {
            if (canGoBack && onGoBack) onGoBack();
          }}
          disabled={!canGoBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            border: canGoBack ? '1px solid rgba(0, 240, 255, 0.45)' : '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: canGoBack ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
            color: canGoBack ? '#00f0ff' : '#475569',
            cursor: canGoBack ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
            boxShadow: canGoBack ? '0 0 8px rgba(0, 240, 255, 0.2)' : 'none',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            if (canGoBack) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.22)';
              e.currentTarget.style.borderColor = '#00f0ff';
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 240, 255, 0.35)';
            }
          }}
          onMouseLeave={(e) => {
            if (canGoBack) {
              e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.45)';
              e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 240, 255, 0.2)';
            }
          }}
          title={canGoBack ? `Navigate Back: ${previousStepLabel || 'Previous View'} (Alt+←)` : 'No previous navigation history'}
        >
          <ArrowLeft size={11} color={canGoBack ? '#00f0ff' : '#475569'} />
          <span>Back</span>
          {canGoBack && previousStepLabel && (
            <span
              style={{
                fontSize: '8.5px',
                opacity: 0.8,
                maxWidth: '95px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              ({previousStepLabel})
            </span>
          )}
        </button>

        <span style={{ color: '#334155', flexShrink: 0 }}>|</span>

        {/* Current Navigation Path with Active Node Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, overflow: 'hidden' }}>
          <Compass size={12} color="#00f0ff" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              color: '#64748b',
              letterSpacing: '0.04em',
              flexShrink: 0,
            }}
          >
            NAV PATH:
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {segments.map((seg, idx) => {
              const isLast = idx === segments.length - 1;
              return (
                <React.Fragment key={`${seg.level}-${seg.id}-${idx}`}>
                  {idx > 0 && <span style={{ color: '#475569', fontSize: '9px', flexShrink: 0 }}>›</span>}
                  <button
                    onClick={() => onNavigateSegment?.(seg)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isLast ? '#00f0ff' : '#94a3b8',
                      fontWeight: isLast ? 700 : 500,
                      fontSize: '10px',
                      cursor: 'pointer',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      transition: 'all 0.15s ease',
                      maxWidth: isLast ? '220px' : '140px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'inline-block',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#38bdf8';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = isLast ? '#00f0ff' : '#94a3b8';
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    title={`Click to jump to ${seg.label}`}
                  >
                    {seg.label}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER / RIGHT SECTION: System Telemetry & External Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Live Engine Port Indicator */}
        <a
          href="http://127.0.0.1:8080/docs"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '9.5px',
            color: '#34d399',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '1px 6px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 700,
          }}
          title="DispatchEngine Port 8080 Live"
        >
          <Radio size={10} color="#10b981" />
          <span>:8080 Live</span>
        </a>

        {/* Operational Mode Badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            fontSize: '9.5px',
            fontWeight: 700,
            padding: '1px 6px',
            borderRadius: '4px',
            backgroundColor: operationalMode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(251, 191, 36, 0.15)',
            border: operationalMode === 'QUANTUM' ? '1px solid rgba(0, 240, 255, 0.35)' : '1px solid rgba(251, 191, 36, 0.35)',
            color: operationalMode === 'QUANTUM' ? '#00f0ff' : '#fbbf24',
          }}
        >
          {operationalMode === 'QUANTUM' ? <Sparkles size={10} /> : <Cpu size={10} />}
          <span>{operationalMode === 'QUANTUM' ? '32Q QAOA' : 'CPU'}</span>
        </span>

        {/* Interactive Legal & IP Terms Trigger */}
        <button
          onClick={handleOpenLegal}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '10px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '2px 4px',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#7dd3fc')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#38bdf8')}
          title="Review full Corporate Registration, Patent Notices, and Intellectual Property Terms"
        >
          <Scale size={11} />
          <span>Legal &amp; IP</span>
        </button>

        {/* Telegram Community Button with GA4 Tracking */}
        <a
          href="https://t.me/yesandnoQ"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackTelegramClick('Footer_Legal_Bar')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '1px 6px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #229ED9 0%, #0088cc 100%)',
            color: '#ffffff',
            fontSize: '9.5px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 6px rgba(34, 158, 217, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
          title="Join YesAndNo Quantum Computing Team on Telegram: t.me/yesandnoQ"
        >
          <span>t.me/yesandnoQ</span>
        </a>
      </div>
    </footer>
  );
};

