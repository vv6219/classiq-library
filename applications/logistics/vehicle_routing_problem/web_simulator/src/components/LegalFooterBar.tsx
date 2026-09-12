import React from 'react';
import { ShieldCheck, ExternalLink, Scale, FileText, Database, BookOpen } from 'lucide-react';
import { trackTelegramClick, trackEvent } from '../utils/analytics';

interface LegalFooterBarProps {
  onOpenLegalModal: () => void;
}

export const LegalFooterBar: React.FC<LegalFooterBarProps> = ({ onOpenLegalModal }) => {
  const handleOpenLegal = () => {
    trackEvent('modal_open', {
      modal_name: 'Legal_And_IP_Modal',
      event_category: 'Legal_Governance',
    });
    onOpenLegalModal();
  };

  return (
    <footer className="legal-footer-bar" role="contentinfo" aria-label="Legal and Copyright Footer">
      {/* Left: Registered Entity Brand & Copyright Notice */}
      <div className="legal-footer-left">
        <ShieldCheck size={13} color="#00f0ff" style={{ flexShrink: 0 }} />

        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '3px',
            backgroundColor: 'rgba(0, 240, 255, 0.12)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            color: '#00f0ff',
            letterSpacing: '0.04em',
          }}
          className="legal-footer-tablet-only"
        >
          REG. ENTITY: YESANDNO GROUP
        </span>

        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>
          &copy; 2026 <strong style={{ color: '#ffffff' }}>YesAndNo Group</strong>. All rights reserved.
        </span>

        <span style={{ color: '#334155' }}>|</span>

        {/* Interactive Legal & IP Modal Trigger */}
        <button
          onClick={handleOpenLegal}
          style={{
            background: 'none',
            border: 'none',
            color: '#38bdf8',
            fontSize: '11px',
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
          <Scale size={12} />
          <span>Legal &amp; IP Terms</span>
        </button>
      </div>

      {/* Center: Proprietary IP & Co-Processor Scope Statement (Collapses on Tablet/Mobile) */}
      <div className="legal-footer-center">
        <span style={{ color: '#64748b' }}>
          Proprietary Multi-Tier Cyber-Physical Warehouse Twin &bull; Classiq Quantum Co-Processor Engine
        </span>
        <span className="legal-footer-ultrawide-only" style={{ color: '#475569' }}>
          &bull; Patent-Pending QUBO &amp; MAPF Formulations
        </span>
      </div>

      {/* Right: Technical Docs & Official Telegram Channel */}
      <div className="legal-footer-right">
        {/* Quick Reference Links (Desktop only) */}
        <div className="legal-footer-desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <a
            href="/docs.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <FileText size={10} />
            <span>Swagger</span>
          </a>
          <a
            href="/sqlite.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <Database size={10} />
            <span>SQLite</span>
          </a>
        </div>

        {/* Telegram Community Button with GA4 Tracking */}
        <a
          href="https://t.me/yesandnoQ"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackTelegramClick('Footer_Legal_Bar')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '1px 7px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #229ED9 0%, #0088cc 100%)',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 0 8px rgba(34, 158, 217, 0.45)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            cursor: 'pointer',
            transition: 'transform 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
          title="Join YesAndNo Quantum Computing Team on Telegram: t.me/yesandnoQ"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
          </svg>
          <span>t.me/yesandnoQ</span>
        </a>
      </div>
    </footer>
  );
};
