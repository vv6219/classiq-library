import React, { useState, useEffect } from 'react';
import { fetchRuns, compareRuns, RunSummaryDTO, RunComparisonDTO } from '../services/api';
import { GitCompare, TrendingDown, TrendingUp, CheckCircle2, Cpu, Zap, RefreshCw, BarChart2 } from 'lucide-react';
import { CodeLmnBadge } from './CodeLmnBadge';

interface RunComparisonStudioProps {
  onSelectRun: (runId: string) => void;
}

export const RunComparisonStudio: React.FC<RunComparisonStudioProps> = ({ onSelectRun }) => {
  const [runs, setRuns] = useState<RunSummaryDTO[]>([]);
  const [selectedRunA, setSelectedRunA] = useState<string>('');
  const [selectedRunB, setSelectedRunB] = useState<string>('');
  const [comparison, setComparison] = useState<RunComparisonDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadRuns = async () => {
    setIsLoading(true);
    try {
      const data = await fetchRuns(30);
      setRuns(data);
      if (data.length >= 2) {
        setSelectedRunA(data[0].run_id);
        setSelectedRunB(data[1].run_id);
      } else if (data.length === 1) {
        setSelectedRunA(data[0].run_id);
      }
    } catch (err) {
      console.error('Failed to load runs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRuns();
  }, []);

  useEffect(() => {
    if (selectedRunA && selectedRunB && selectedRunA !== selectedRunB) {
      compareRuns(selectedRunA, selectedRunB).then(setComparison).catch(console.error);
    } else {
      setComparison(null);
    }
  }, [selectedRunA, selectedRunB]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#050810', overflowY: 'auto', padding: '24px 24px 48px 24px', minHeight: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#f0f4f8' }}>
            Run Comparison & Sensitivity Studio
          </h2>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Contrast past execution runs, examine KPI deltas, and analyze quantum acceleration.
          </div>
        </div>
        <button
          onClick={loadRuns}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            color: '#f0f4f8',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          <RefreshCw size={14} /> Refresh History
        </button>
      </div>

      {/* Selectors Bar */}
      <div
        style={{
          display: 'flex',
          gap: '20px',
          padding: '16px 20px',
          backgroundColor: '#0c101c',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          marginBottom: '24px',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
            Baseline Run (A):
          </label>
          <select
            value={selectedRunA}
            onChange={(e) => setSelectedRunA(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#060913',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '6px',
              color: '#00f0ff',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            {runs.map((r) => (
              <option key={r.run_id} value={r.run_id}>
                {r.run_id} ({r.operational_mode}) - Makespan: {r.makespan_sec}s - {r.timestamp.slice(11, 19)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ padding: '8px', color: '#64748b' }}>
          <GitCompare size={20} />
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '6px' }}>
            Comparison Target (B):
          </label>
          <select
            value={selectedRunB}
            onChange={(e) => setSelectedRunB(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              backgroundColor: '#060913',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '6px',
              color: '#a855f7',
              fontSize: '12px',
              outline: 'none',
            }}
          >
            {runs.map((r) => (
              <option key={r.run_id} value={r.run_id}>
                {r.run_id} ({r.operational_mode}) - Makespan: {r.makespan_sec}s - {r.timestamp.slice(11, 19)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Delta Scorecards Grid */}
      {comparison && comparison.deltas && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {/* Makespan Delta */}
          <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>MAKESPAN DELTA</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: comparison.deltas.delta_makespan_sec <= 0 ? '#00e676' : '#ef4444', marginTop: '4px' }}>
              {comparison.deltas.delta_makespan_sec > 0 ? '+' : ''}{comparison.deltas.delta_makespan_sec}s ({comparison.deltas.delta_makespan_pct}%)
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {comparison.run_a.makespan_sec}s → {comparison.run_b.makespan_sec}s
            </div>
          </div>

          {/* Distance Delta */}
          <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>DISTANCE DELTA</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: comparison.deltas.delta_distance_km <= 0 ? '#00e676' : '#ef4444', marginTop: '4px' }}>
              {comparison.deltas.delta_distance_km > 0 ? '+' : ''}{comparison.deltas.delta_distance_km} km
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              {comparison.run_a.distance_km} km → {comparison.run_b.distance_km} km
            </div>
          </div>

          {/* Chute Variance Delta */}
          <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>CHUTE BALANCE DELTA</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: comparison.deltas.delta_chute_variance <= 0 ? '#00e676' : '#f59e0b', marginTop: '4px' }}>
              {comparison.deltas.delta_chute_variance > 0 ? '+' : ''}{comparison.deltas.delta_chute_variance}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Var: {comparison.run_a.chute_variance} → {comparison.run_b.chute_variance}
            </div>
          </div>

          {/* Phi Invariant Delta */}
          <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '8px', padding: '16px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>FALSIFICATION RATIO (Φ)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: '#00f0ff', marginTop: '4px' }}>
              Φ_B = {comparison.run_b.phi.toFixed(3)}
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Verification Code: <CodeLmnBadge variant="compact" label="Verified" phi={comparison.run_b.phi} /> (PASS)
            </div>
          </div>
        </div>
      )}

      {/* Historical Runs Table */}
      <div style={{ backgroundColor: '#0c101c', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', fontWeight: 600, fontSize: '13px' }}>
          Historical Execution Runs ({runs.length} Runs Recorded in Database)
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', minWidth: '750px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: '#94a3b8' }}>
              <th style={{ padding: '10px 16px' }}>Run ID</th>
              <th style={{ padding: '10px 16px' }}>Mode</th>
              <th style={{ padding: '10px 16px' }}>Makespan</th>
              <th style={{ padding: '10px 16px' }}>Distance</th>
              <th style={{ padding: '10px 16px' }}>Chute Var</th>
              <th style={{ padding: '10px 16px' }}>Solve Latency</th>
              <th style={{ padding: '10px 16px' }}>Falsification Φ</th>
              <th style={{ padding: '10px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr
                key={r.run_id}
                style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}
              >
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#00f0ff', fontWeight: 600 }}>
                  {r.run_id}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: r.operational_mode === 'QUANTUM' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                      color: r.operational_mode === 'QUANTUM' ? '#00f0ff' : '#a855f7',
                    }}
                  >
                    {r.operational_mode}
                  </span>
                </td>
                <td style={{ padding: '10px 16px', color: '#f0f4f8' }}>{r.makespan_sec}s</td>
                <td style={{ padding: '10px 16px', color: '#f0f4f8' }}>{r.distance_km} km</td>
                <td style={{ padding: '10px 16px', color: '#f0f4f8' }}>{r.chute_variance}</td>
                <td style={{ padding: '10px 16px', color: '#94a3b8' }}>{r.solve_latency_sec}s</td>
                <td style={{ padding: '10px 16px', fontFamily: 'monospace', color: '#00e676' }}>
                  {r.falsification_ratio_phi.toFixed(3)}
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => onSelectRun(r.run_id)}
                    style={{
                      padding: '4px 10px',
                      backgroundColor: 'rgba(0, 240, 255, 0.1)',
                      border: '1px solid #00f0ff',
                      borderRadius: '4px',
                      color: '#00f0ff',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Load in 3D
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
