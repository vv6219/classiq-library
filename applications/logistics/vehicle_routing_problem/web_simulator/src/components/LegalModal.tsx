import React from 'react';
import { ShieldCheck, X, Scale, FileText, Cpu, Lock, CheckCircle2, Globe, ExternalLink } from 'lucide-react';
import { trackTelegramClick } from '../utils/analytics';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        backgroundColor: 'rgba(3, 7, 18, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          maxHeight: '90vh',
          backgroundColor: '#0a0f1d',
          border: '1px solid rgba(0, 240, 255, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 35px rgba(0, 240, 255, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, #0f172a 0%, #0a0f1d 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 240, 255, 0.12)',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={20} color="#00f0ff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
                  Corporate Governance &amp; Intellectual Property Rights
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                  }}
                >
                  REGISTERED ENTITY
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                Legal Holder: <strong style={{ color: '#00f0ff' }}>YesAndNo Group</strong> &bull; Production WMS Quantum Digital Twin Platform
              </div>
            </div>
          </div>

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
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px',
            overflowY: 'auto',
            fontSize: '13px',
            color: '#cbd5e1',
            lineHeight: 1.65,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Section 1: Official Corporate Notice */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <ShieldCheck size={16} color="#00f0ff" />
              <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>
                1. Legal Ownership &amp; Registered Copyright
              </strong>
            </div>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              The <em>WMS Quantum Digital Twin 3D Simulator</em>, including all associated software engines, user interfaces, mathematical formulations, algorithmic pipelines, 3D assets, API schemas, and technical documentation, is the exclusive intellectual property of the registered <strong>YesAndNo Group</strong>.
            </p>
            <div
              style={{
                marginTop: '10px',
                padding: '8px 12px',
                backgroundColor: 'rgba(0, 240, 255, 0.05)',
                borderLeft: '3px solid #00f0ff',
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#e2e8f0',
              }}
            >
              &copy; 2026 YesAndNo Group. All rights reserved. Registered Entity.
            </div>
          </div>

          {/* Section 2: Proprietary Algorithms & Mathematical Formulations */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Cpu size={16} color="#c084fc" />
              <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>
                2. Proprietary 4-Tier Optimization Framework &amp; Quantum Acceleration
              </strong>
            </div>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              All algorithmic implementations utilized in this system—including Quantum State Clustering (FCM), Bin Packing with Dynamic Kinematic Center of Gravity Invariants (MISOCP), Classiq-synthesized QAOA/VQE Quadratic Unconstrained Binary Optimization (QUBO), and Multi-Agent Pathfinding (MAPF / Priority-Based SIPP)—represent proprietary trade secrets, research discoveries, and patent-pending methodologies of <strong>YesAndNo Group</strong>.
            </p>
          </div>

          {/* Section 3: Classiq Quantum Technology Co-Processing */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={16} color="#f59e0b" />
              <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>
                3. Permitted Usage &amp; Industrial Terms of License
              </strong>
            </div>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              This web simulator and its interactive endpoints are made available for technical demonstration, academic peer-review, and approved industrial logistics pilot evaluations. Reproduction, commercial reselling, unapproved mirroring, or decompilation of the computational kernels without explicit prior written authorization from <strong>YesAndNo Group</strong> is strictly prohibited under international copyright and intellectual property treaties.
            </p>
          </div>

          {/* Section 4: Privacy, Telemetry & Diagnostics */}
          <div
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Globe size={16} color="#34d399" />
              <strong style={{ color: '#f1f5f9', fontSize: '14px' }}>
                4. Analytics, Telemetry &amp; OpenTelemetry Compliance
              </strong>
            </div>
            <p style={{ margin: 0, color: '#94a3b8' }}>
              The application records operational telemetry, simulation performance metrics, and anonymized user navigation data via Google Analytics 4 (GA4) to ensure high availability and monitor computational convergence across solver runs. No personally identifiable customer inventory or confidential warehouse topologies are transmitted or exposed.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0c1322',
          }}
        >
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Official Legal Channel: <strong style={{ color: '#94a3b8' }}>@yesandnoQ</strong>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <a
              href="https://t.me/yesandnoQ"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackTelegramClick('Legal_Modal')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #229ED9 0%, #0088cc 100%)',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>Contact via Telegram</span>
              <ExternalLink size={12} />
            </a>

            <button
              onClick={onClose}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)')}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
