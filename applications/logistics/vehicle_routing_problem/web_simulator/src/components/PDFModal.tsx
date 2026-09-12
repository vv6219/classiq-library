import React, { useState } from 'react';
import { getReportPdfUrl } from '../services/api';
import { FileText, Download, X, Award, Atom, Layers, CheckCircle2 } from 'lucide-react';
import { CodeLmnBadge } from './CodeLmnBadge';
import { trackTelegramClick } from '../utils/analytics';

interface PDFModalProps {
  runId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PDFModal: React.FC<PDFModalProps> = ({ runId, isOpen, onClose }) => {
  const [profile, setProfile] = useState<'EXECUTIVE' | 'COMPREHENSIVE' | 'QUANTUM' | 'CERTIFICATE'>('EXECUTIVE');

  if (!isOpen) return null;

  const pdfUrl = getReportPdfUrl(runId, profile);

  const profiles = [
    {
      id: 'EXECUTIVE',
      title: 'Executive 1-Pager',
      icon: <FileText size={16} />,
      desc: 'High-level KPI scorecard, fleet makespan, route distance, and executive summary.',
    },
    {
      id: 'COMPREHENSIVE',
      title: 'Comprehensive Dossier',
      icon: <Layers size={16} />,
      desc: 'Complete multi-tier schedule, 3D LIFO DAG graphs, chute accumulation, and kinematic profiles.',
    },
    {
      id: 'QUANTUM',
      title: 'Quantum Monograph',
      icon: <Atom size={16} />,
      desc: 'Bloch sphere state coordinates, QAOA energy surface, bitstring spectrum, and Shannon entropy.',
    },
    {
      id: 'CERTIFICATE',
      title: 'Safety Audit Certificate',
      icon: <Award size={16} />,
      desc: 'DIN EN ISO 3691-4 & 4-Gate Invariant audit compliance certificate with cryptographic proof.',
    },
  ];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `DispatchEngine_Report_${profile}_${runId.slice(0, 8)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '94vw',
          maxWidth: '1280px',
          height: '92vh',
          backgroundColor: '#0c101c',
          border: '1px solid rgba(0, 240, 255, 0.3)',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(0, 240, 255, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, rgba(16, 24, 48, 0.8) 0%, rgba(10, 16, 32, 0.8) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '38px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                boxShadow: '0 0 12px rgba(0, 240, 255, 0.25)',
                backgroundColor: '#070f1e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                padding: '2px',
              }}
            >
              <img
                src="/logo_emblem.png"
                alt="YesAndNo Quantum Team"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#f0f4f8' }}>
                  Vector PDF Publishing Engine
                </h2>
                <a
                  href="https://t.me/yesandnoQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackTelegramClick('PDF_Export_Modal')}
                  title="Join YesAndNo Quantum Community on Telegram: t.me/yesandnoQ"
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    color: '#00f0ff',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                  <span>YES&amp;NO QUANTUM</span>
                </a>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Run ID: <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{runId}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={handleDownload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid #00f0ff',
                borderRadius: '6px',
                color: '#00f0ff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.15)')}
            >
              <Download size={15} />
              Download Vector PDF
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Profile Tabs */}
        <div
          style={{
            padding: '12px 24px',
            backgroundColor: '#090d16',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            gap: '12px',
          }}
        >
          {profiles.map((p) => {
            const isActive = profile === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setProfile(p.id as any)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  backgroundColor: isActive ? 'rgba(0, 240, 255, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: isActive ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '8px',
                  color: isActive ? '#00f0ff' : '#94a3b8',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ color: isActive ? '#00f0ff' : '#64748b' }}>{p.icon}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.title}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                    {p.desc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* PDF Iframe Viewer */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#1e293b' }}>
          <iframe
            src={pdfUrl}
            title="PDF Document Preview"
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
            }}
          />
        </div>

        {/* Modal Footer Note */}
        <div
          style={{
            padding: '8px 24px',
            backgroundColor: '#090d16',
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={13} color="#00e676" />
            <span>
              Cryptographically sealed & verified against Falsification Invariant (
              <CodeLmnBadge variant="compact" label="Verified" />)
            </span>
          </div>
          <div>Multi-page Vector PDF rendered via Matplotlib Backend PDF Engine</div>
        </div>
      </div>
    </div>
  );
};
