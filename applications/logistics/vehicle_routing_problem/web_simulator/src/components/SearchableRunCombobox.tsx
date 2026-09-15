import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, Zap, X, CornerDownLeft } from 'lucide-react';
import { RunSummaryDTO, getRunTotalStops, formatRunMode } from '../services/api';

interface SearchableRunComboboxProps {
  runs: RunSummaryDTO[];
  currentRunId: string;
  onSelectRun: (runId: string) => void;
  operationalMode?: 'QUANTUM' | 'CLASSICAL';
  lastDispatchedRunId?: string;
}

export const SearchableRunCombobox: React.FC<SearchableRunComboboxProps> = ({
  runs,
  currentRunId,
  onSelectRun,
  operationalMode,
  lastDispatchedRunId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'QUANTUM' | 'CLASSICAL'>('ALL');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Sync input value when currentRunId changes and not actively searching
  useEffect(() => {
    if (!isOpen) {
      setInputValue(currentRunId || '');
    }
  }, [currentRunId, isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setInputValue(currentRunId || '');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setInputValue(currentRunId || '');
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentRunId]);

  // Strict sorting: order by created_datetime DESC (falling back to timestamp)
  const sortedRuns = useMemo(() => {
    const list = [...(runs || [])];
    list.sort((a, b) => {
      const timeA = new Date(a.created_datetime || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_datetime || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    return list;
  }, [runs]);

  // Identify latest run by sorted order or explicit prop
  const latestRunId = useMemo(() => {
    if (lastDispatchedRunId) return lastDispatchedRunId;
    if (sortedRuns && sortedRuns.length > 0) return sortedRuns[0].run_id;
    return '';
  }, [lastDispatchedRunId, sortedRuns]);

  // Filtered runs with strict prefix matching (LIKE 'XXX%')
  const filteredRuns = useMemo(() => {
    let list = [...sortedRuns];

    // Mode filter
    if (modeFilter !== 'ALL') {
      list = list.filter((r) => {
        const opMode = (r.operational_mode || '').toUpperCase();
        const rMode = (r.mode || '').toUpperCase();
        if (modeFilter === 'QUANTUM') {
          return opMode === 'QUANTUM' || rMode.includes('32Q') || rMode.includes('QUANTUM');
        }
        if (modeFilter === 'CLASSICAL') {
          return opMode === 'CLASSICAL' || rMode.includes('CPU') || rMode.includes('CLASSICAL');
        }
        return true;
      });
    }

    // Prefix match: search like 'XXX%'
    if (isOpen && inputValue.trim()) {
      const q = inputValue.trim().toUpperCase();
      const cleanQ = q.replace(/^RUN-/, '');

      list = list.filter((r) => {
        const rId = (r.run_id || '').toUpperCase();
        const cleanRId = rId.replace(/^RUN-/, '');
        const sId = (r.scenario_id || '').toUpperCase();
        const cleanSId = sId.replace(/^SCEN-/, '');
        const wId = (r.wave_id || '').toUpperCase();
        const cleanWId = wId.replace(/^WAVE-/, '');
        const dt = (r.created_datetime || r.timestamp || '').toUpperCase();

        // Strict prefix matching LIKE 'XXX%'
        return (
          rId.startsWith(q) ||
          cleanRId.startsWith(cleanQ) ||
          sId.startsWith(q) ||
          cleanSId.startsWith(cleanQ) ||
          wId.startsWith(q) ||
          cleanWId.startsWith(cleanQ) ||
          dt.startsWith(q)
        );
      });
    }

    return list;
  }, [sortedRuns, modeFilter, isOpen, inputValue]);

  // Top candidate for inline ghost autocomplete
  const topCandidate = filteredRuns[highlightedIndex] || filteredRuns[0];

  // Compute ghost autocomplete text
  const ghostSuffix = useMemo(() => {
    if (!isOpen || !inputValue.trim() || !topCandidate) return '';
    const typed = inputValue.trim().toUpperCase();
    const candidateId = topCandidate.run_id.toUpperCase();

    if (candidateId.startsWith(typed)) {
      return topCandidate.run_id.substring(typed.length);
    }

    const cleanTyped = typed.replace(/^RUN-/, '');
    const cleanCandidateId = candidateId.replace(/^RUN-/, '');
    if (cleanCandidateId.startsWith(cleanTyped)) {
      return cleanCandidateId.substring(cleanTyped.length);
    }

    return '';
  }, [isOpen, inputValue, topCandidate]);

  // Currently selected run metadata
  const currentRun = useMemo(() => {
    return sortedRuns.find((r) => r.run_id === currentRunId) || sortedRuns[0];
  }, [sortedRuns, currentRunId]);

  const isCurrentLatest = currentRunId && currentRunId === latestRunId;

  // Keyboard handlers for autocomplete & navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredRuns.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, filteredRuns.length - 1)));
    } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
      // Autocomplete accept
      if (topCandidate) {
        e.preventDefault();
        setInputValue(topCandidate.run_id);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const targetRun = filteredRuns[highlightedIndex] || filteredRuns[0];
      if (targetRun) {
        onSelectRun(targetRun.run_id);
        setInputValue(targetRun.run_id);
        setIsOpen(false);
      }
    }
  };

  const handleSelect = (runId: string) => {
    onSelectRun(runId);
    setInputValue(runId);
    setIsOpen(false);
  };

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    try {
      const date = new Date(ts);
      if (isNaN(date.getTime())) return ts.substring(0, 16);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts.substring(0, 16);
    }
  };

  // Helper to render prefix matched highlighting (LIKE 'XXX%')
  const renderPrefixHighlight = (text: string, query: string) => {
    if (!query.trim()) return <span>{text}</span>;
    const q = query.trim().toUpperCase();
    const upperText = text.toUpperCase();

    if (upperText.startsWith(q)) {
      const matched = text.substring(0, q.length);
      const remaining = text.substring(q.length);
      return (
        <span>
          <strong style={{ color: '#00f0ff', textDecoration: 'underline' }}>{matched}</strong>
          {remaining}
        </span>
      );
    }

    const cleanQ = q.replace(/^RUN-/, '');
    if (upperText.startsWith('RUN-') && upperText.substring(4).startsWith(cleanQ)) {
      const prefix = text.substring(0, 4);
      const matched = text.substring(4, 4 + cleanQ.length);
      const remaining = text.substring(4 + cleanQ.length);
      return (
        <span>
          {prefix}
          <strong style={{ color: '#00f0ff', textDecoration: 'underline' }}>{matched}</strong>
          {remaining}
        </span>
      );
    }

    return <span>{text}</span>;
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} onKeyDown={handleKeyDown}>
      {/* Combobox Trigger: Interactive Autocomplete Input Box */}
      <div
        onClick={() => {
          if (!isOpen) {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.select(), 30);
          }
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 8px',
          borderRadius: '6px',
          background: isOpen ? 'rgba(15, 23, 42, 0.98)' : 'rgba(7, 15, 30, 0.85)',
          border: isOpen
            ? '1px solid #00f0ff'
            : isCurrentLatest
            ? '1px solid rgba(52, 211, 153, 0.6)'
            : '1px solid rgba(0, 240, 255, 0.35)',
          boxShadow: isOpen
            ? '0 0 12px rgba(0, 240, 255, 0.35)'
            : isCurrentLatest
            ? '0 0 8px rgba(52, 211, 153, 0.25)'
            : 'none',
          height: '28px',
          cursor: 'text',
          boxSizing: 'border-box',
          color: '#f0f4f8',
          position: 'relative',
          transition: 'all 0.15s ease',
        }}
        title={`Active Execution Run: ${currentRunId || 'None'} • Type prefix (e.g. 7D) to autocomplete`}
      >
        <span
          style={{
            fontSize: '9px',
            fontWeight: 800,
            color: isCurrentLatest ? '#34d399' : '#94a3b8',
            letterSpacing: '0.06em',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            userSelect: 'none',
          }}
        >
          {isCurrentLatest && (
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399', boxShadow: '0 0 6px #34d399' }} />
          )}
          RUN:
        </span>

        {/* Input Container with Ghost Autocomplete Suffix */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            ref={inputRef}
            type="text"
            value={isOpen ? inputValue : (currentRunId || '')}
            onChange={(e) => {
              setInputValue(e.target.value);
              setHighlightedIndex(0);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => {
              setIsOpen(true);
              inputRef.current?.select();
            }}
            placeholder="Search run_id (LIKE 'XXX%')..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#38bdf8',
              fontSize: '11px',
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 700,
              letterSpacing: '0.02em',
              width: '120px',
              padding: 0,
              margin: 0,
            }}
          />

          {/* Ghost Autocomplete Text (shown inline when typing) */}
          {isOpen && ghostSuffix && (
            <span
              style={{
                position: 'absolute',
                left: `${(inputValue.length * 7.1) + 2}px`,
                pointerEvents: 'none',
                color: '#64748b',
                fontSize: '11px',
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 700,
                letterSpacing: '0.02em',
                userSelect: 'none',
                opacity: 0.7,
              }}
            >
              {ghostSuffix}
            </span>
          )}
        </div>

        {/* Mode Tag */}
        {currentRun && (
          <span
            style={{
              fontSize: '8.5px',
              padding: '1px 4px',
              borderRadius: '3px',
              fontWeight: 700,
              background:
                currentRun.mode === '32Q' || currentRun.operational_mode === 'QUANTUM'
                  ? 'rgba(0, 240, 255, 0.18)'
                  : 'rgba(251, 191, 36, 0.18)',
              color:
                currentRun.mode === '32Q' || currentRun.operational_mode === 'QUANTUM'
                  ? '#00f0ff'
                  : '#fbbf24',
              border:
                currentRun.mode === '32Q' || currentRun.operational_mode === 'QUANTUM'
                  ? '1px solid rgba(0, 240, 255, 0.4)'
                  : '1px solid rgba(251, 191, 36, 0.4)',
              userSelect: 'none',
            }}
          >
            {formatRunMode(currentRun)}
          </span>
        )}

        {isCurrentLatest && (
          <span
            style={{
              fontSize: '8px',
              fontWeight: 800,
              padding: '1px 4px',
              borderRadius: '3px',
              background: 'rgba(52, 211, 153, 0.2)',
              color: '#34d399',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              letterSpacing: '0.05em',
              userSelect: 'none',
            }}
          >
            LATEST
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
        >
          <ChevronDown
            size={11}
            style={{
              color: '#94a3b8',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
      </div>

      {/* Autocomplete Dropdown Popover */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 9999,
            width: '400px',
            borderRadius: '8px',
            background: 'rgba(7, 15, 30, 0.98)',
            border: '1px solid rgba(0, 240, 255, 0.4)',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.2)',
            backdropFilter: 'blur(16px)',
            padding: '10px',
            boxSizing: 'border-box',
          }}
        >
          {/* Header with Title & Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.06em' }}>
                RUNS (ORDER BY CREATED_DATETIME DESC)
              </span>
              <span style={{ fontSize: '9px', color: '#64748b' }}>
                ({filteredRuns.length})
              </span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'QUANTUM', 'CLASSICAL'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModeFilter(mode)}
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: modeFilter === mode ? '1px solid #00f0ff' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: modeFilter === mode ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: modeFilter === mode ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {mode === 'QUANTUM' ? '32Q' : mode === 'CLASSICAL' ? 'CPU' : 'ALL'}
                </button>
              ))}
            </div>
          </div>

          {/* Autocomplete Hint Banner */}
          {ghostSuffix && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '4px',
                background: 'rgba(0, 240, 255, 0.08)',
                border: '1px dashed rgba(0, 240, 255, 0.3)',
                marginBottom: '8px',
                fontSize: '10px',
                color: '#38bdf8',
              }}
            >
              <CornerDownLeft size={11} />
              <span>
                Press <strong>Tab</strong> or <strong>→</strong> to autocomplete: <code>{topCandidate?.run_id}</code>
              </span>
            </div>
          )}

          {/* Quick Select Latest Dispatch Banner */}
          {latestRunId && latestRunId !== currentRunId && (
            <div
              onClick={() => handleSelect(latestRunId)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '6px',
                background: 'rgba(52, 211, 153, 0.12)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                marginBottom: '8px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(52, 211, 153, 0.22)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(52, 211, 153, 0.12)')}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={13} color="#34d399" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                  Latest Dispatched Run:
                </span>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 800, color: '#f0fdf4' }}>
                  {latestRunId}
                </span>
              </div>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#34d399', textDecoration: 'underline' }}>
                Select ↵
              </span>
            </div>
          )}

          {/* Runs Scrollable List */}
          <div
            ref={listRef}
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              paddingRight: '2px',
            }}
          >
            {filteredRuns.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '11px' }}>
                <div>No runs matching prefix <code>LIKE '{inputValue}%'</code></div>
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => setInputValue('')}
                    style={{
                      marginTop: '8px',
                      fontSize: '10px',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0, 240, 255, 0.4)',
                      background: 'rgba(0, 240, 255, 0.15)',
                      color: '#00f0ff',
                      cursor: 'pointer',
                    }}
                  >
                    Reset Filter
                  </button>
                )}
              </div>
            ) : (
              filteredRuns.map((r, index) => {
                const isSelected = r.run_id === currentRunId;
                const isLatest = r.run_id === latestRunId;
                const isHighlighted = index === highlightedIndex;
                const stops = getRunTotalStops(r);
                const isQuantum = r.operational_mode === 'QUANTUM' || (r.mode && r.mode.toUpperCase().includes('32Q'));

                return (
                  <div
                    key={r.run_id}
                    onClick={() => handleSelect(r.run_id)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      borderRadius: '6px',
                      background: isSelected
                        ? 'rgba(0, 240, 255, 0.16)'
                        : isHighlighted
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(15, 23, 42, 0.5)',
                      border: isSelected
                        ? '1px solid rgba(0, 240, 255, 0.5)'
                        : isHighlighted
                        ? '1px solid rgba(255, 255, 255, 0.15)'
                        : '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'all 0.1s ease',
                    }}
                  >
                    {/* Left: ID with Prefix Highlighting & Badges */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            fontSize: '11px',
                            color: isSelected ? '#00f0ff' : '#f1f5f9',
                          }}
                        >
                          {renderPrefixHighlight(r.run_id, inputValue)}
                        </span>

                        <span
                          style={{
                            fontSize: '8.5px',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            background: isQuantum ? 'rgba(0, 240, 255, 0.18)' : 'rgba(251, 191, 36, 0.18)',
                            color: isQuantum ? '#00f0ff' : '#fbbf24',
                            border: isQuantum ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
                          }}
                        >
                          {formatRunMode(r)}
                        </span>

                        {isLatest && (
                          <span
                            style={{
                              fontSize: '8px',
                              fontWeight: 800,
                              padding: '1px 4px',
                              borderRadius: '3px',
                              background: 'rgba(52, 211, 153, 0.25)',
                              color: '#34d399',
                              border: '1px solid rgba(52, 211, 153, 0.5)',
                            }}
                          >
                            LATEST
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9.5px', color: '#94a3b8' }}>
                        {r.scenario_id && <span>{r.scenario_id}</span>}
                        {r.makespan_sec ? <span>⏱ {r.makespan_sec.toFixed(0)}s</span> : null}
                        {r.distance_km ? <span>🛣 {r.distance_km.toFixed(2)}km</span> : null}
                        {stops > 0 && <span>📍 {stops} stops</span>}
                      </div>
                    </div>

                    {/* Right: Timestamp & Checkmark */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '3px' }}>
                      {isSelected ? (
                        <Check size={14} color="#00f0ff" />
                      ) : (
                        <span style={{ fontSize: '9px', color: '#64748b' }}>
                          {formatTimestamp(r.created_datetime || r.timestamp)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
