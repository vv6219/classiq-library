import React from 'react';
import { AlertTriangle, X, SlidersHorizontal, Zap, ArrowRight, ShieldAlert, Sparkles, Box } from 'lucide-react';

export interface ZeroOrdersBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetDefaultOrdersAndDispatch: (ordersCount?: number) => void;
  onOpenGenerator: () => void;
  configuredOrders?: number;
}

export const ZeroOrdersBlockModal: React.FC<ZeroOrdersBlockModalProps> = ({
  isOpen,
  onClose,
  onSetDefaultOrdersAndDispatch,
  onOpenGenerator,
  configuredOrders = 0,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="zero-orders-blocked-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        backgroundColor: 'rgba(3, 7, 18, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          backgroundColor: '#0a0d18',
          border: '1px solid rgba(239, 68, 68, 0.55)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(239, 68, 68, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Danger Accent Strip */}
        <div
          style={{
            height: '3px',
            width: '100%',
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 70%, #ef4444 100%)',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
          }}
        />

        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.12) 0%, rgba(10, 13, 24, 0.95) 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.22)',
                border: '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(239, 68, 68, 0.4)',
                color: '#ef4444',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#f87171', letterSpacing: '0.02em' }}>
                  DISPATCH REJECTED: ZERO ORDERS
                </h3>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '3px',
                    backgroundColor: 'rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                  }}
                >
                  N = 0 BLOCKED
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Pipeline execution invariant validation failed • Minimum order count is 1
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Main Warning Text */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              fontSize: '12px',
              lineHeight: '1.5',
              color: '#cbd5e1',
            }}
          >
            <strong style={{ color: '#fca5a5' }}>Cannot dispatch optimization wave with 0 orders.</strong> The Multi-Tier VRPTW engine requires a valid non-empty order pool to synthesize Hilbert clustering vectors (Tier 1) and QAOA tour Hamiltonians (Tier 3). Empty order sets produce zero stops and corrupt state histories.
          </div>

          {/* Validation Metrics Comparison Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Current Batch</span>
              <strong style={{ fontSize: '15px', color: '#f87171', fontFamily: 'monospace' }}>
                {configuredOrders} Orders
              </strong>
              <span style={{ fontSize: '9px', color: '#ef4444', display: 'block', marginTop: '2px', fontWeight: 600 }}>
                ✕ Invalid (Zero)
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Minimum Bound</span>
              <strong style={{ fontSize: '15px', color: '#38bdf8', fontFamily: 'monospace' }}>
                1 Order
              </strong>
              <span style={{ fontSize: '9px', color: '#0284c7', display: 'block', marginTop: '2px' }}>
                Single drop wave
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginBottom: '3px' }}>Recommended</span>
              <strong style={{ fontSize: '15px', color: '#34d399', fontFamily: 'monospace' }}>
                5–150 Orders
              </strong>
              <span style={{ fontSize: '9px', color: '#10b981', display: 'block', marginTop: '2px', fontWeight: 600 }}>
                ✓ Optimal QAOA
              </span>
            </div>
          </div>

          {/* Quick Resolution Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Select Resolution Action:
            </span>

            {/* Action 1: Auto-Set 20 Orders & Dispatch Now */}
            <button
              onClick={() => {
                onSetDefaultOrdersAndDispatch(20);
                onClose();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 240, 255, 0.15)',
                border: '1px solid #00f0ff',
                color: '#f0fdf4',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.25)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.25)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 240, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.15)';
                e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 240, 255, 0.25)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Zap size={16} color="#00f0ff" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#00f0ff' }}>
                    Auto-Set 20 Orders & Dispatch Active Wave
                  </div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Applies balanced 20-order batch (4 AMRs) and solves immediately
                  </div>
                </div>
              </div>
              <ArrowRight size={14} color="#00f0ff" />
            </button>

            {/* Action 2: Open Workload Generator */}
            <button
              onClick={() => {
                onClose();
                onOpenGenerator();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '9px 14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.borderColor = '#38bdf8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SlidersHorizontal size={15} color="#38bdf8" />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#f1f5f9' }}>
                    Open Dataset & Orders Generator Studio
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    Customize exact orders quantity (5–150), depots, chutes & archetype
                  </div>
                </div>
              </div>
              <ArrowRight size={13} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#070b14',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', color: '#64748b' }}>
            <ShieldAlert size={12} color="#f59e0b" />
            <span>Enforced by YesAndNo Quantum WMS Optimization Engine</span>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#cbd5e1',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
