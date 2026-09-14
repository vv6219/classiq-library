import React, { useState, useMemo, useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import {
  Search,
  BookOpen,
  Cpu,
  Layers,
  Activity,
  ExternalLink,
  Copy,
  Check,
  Download,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Sliders,
  HelpCircle,
} from 'lucide-react';
import {
  GLOSSARY_ENTRIES,
  GLOSSARY_CATEGORIES,
  GlossaryEntry,
  GlossaryCategory,
} from '../data/glossaryRegistry';
import { GlossarySchemaViewer } from './GlossarySchemaViewer';
import { updatePageMetadata } from '../utils/headMetadata';
import { trackButtonClick, trackTabChange } from '../utils/analytics';

interface GlossaryStudioProps {
  initialTermId?: string;
  onNavigateRoute?: (path: string) => void;
}

export const GlossaryStudio: React.FC<GlossaryStudioProps> = ({
  initialTermId,
  onNavigateRoute,
}) => {
  const [selectedTermId, setSelectedTermId] = useState<string>(initialTermId || 'benders-decomposition');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [historyTrail, setHistoryTrail] = useState<string[]>([initialTermId || 'benders-decomposition']);

  const detailTopRef = useRef<HTMLDivElement>(null);

  // Sync initialTermId prop if changed from outside
  useEffect(() => {
    if (initialTermId && initialTermId !== selectedTermId) {
      handleSelectTerm(initialTermId);
    }
  }, [initialTermId]);

  // Safe KaTeX renderer
  const renderKaTeX = (latex: string, displayMode = false) => {
    try {
      return katex.renderToString(latex, {
        throwOnError: false,
        displayMode,
      });
    } catch {
      return latex;
    }
  };

  // Letters present in dataset
  const lettersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    GLOSSARY_ENTRIES.forEach((entry) => {
      const l = entry.letter.toUpperCase();
      counts[l] = (counts[l] || 0) + 1;
    });
    return counts;
  }, []);

  const alphabet = useMemo(() => {
    return 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  }, []);

  // Filtered terms
  const filteredTerms = useMemo(() => {
    let result = GLOSSARY_ENTRIES;

    if (selectedCategory !== 'ALL') {
      result = result.filter((e) => e.category === selectedCategory);
    }

    if (selectedLetter !== 'ALL') {
      result = result.filter((e) => e.letter.toUpperCase() === selectedLetter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((e) => {
        return (
          e.term.toLowerCase().includes(q) ||
          (e.acronym && e.acronym.toLowerCase().includes(q)) ||
          e.shortDefinition.toLowerCase().includes(q) ||
          e.detailedExplanation.toLowerCase().includes(q) ||
          (e.calculationMeaning && e.calculationMeaning.toLowerCase().includes(q)) ||
          (e.standardsReference && e.standardsReference.toLowerCase().includes(q)) ||
          (e.codebaseModule && e.codebaseModule.toLowerCase().includes(q)) ||
          e.tags.some((t) => t.toLowerCase().includes(q))
        );
      });
    }

    return result;
  }, [selectedCategory, selectedLetter, searchQuery]);

  // Active selected term
  const activeTerm = useMemo<GlossaryEntry>(() => {
    const found = GLOSSARY_ENTRIES.find((e) => e.id === selectedTermId);
    return found || filteredTerms[0] || GLOSSARY_ENTRIES[0];
  }, [selectedTermId, filteredTerms]);

  // Handle selecting a term with history tracking and metadata update
  const handleSelectTerm = (termId: string) => {
    const target = GLOSSARY_ENTRIES.find((e) => e.id === termId);
    if (!target) return;

    setSelectedTermId(termId);
    setHistoryTrail((prev) => {
      if (prev[prev.length - 1] === termId) return prev;
      return [...prev.slice(-8), termId];
    });

    // Update dynamic web page tags
    updatePageMetadata({
      title: `${target.term}${target.acronym ? ` (${target.acronym})` : ''} | A-Z Engineering Glossary`,
      description: `${target.shortDefinition} - Quantum WMS 3D Digital Twin Engineering Lexicon`,
      canonicalPath: `/glossary?term=${target.id}`,
      keywords: [target.term, target.acronym || '', ...target.tags],
    });

    // Google analytics event
    trackButtonClick(`Glossary_Term_${target.id}`, 'GlossaryStudio', {
      term: target.term,
      category: target.category,
    });

    // Scroll detail pane to top
    if (detailTopRef.current) {
      detailTopRef.current.scrollTop = 0;
    }
  };

  // Update default metadata on initial mount
  useEffect(() => {
    if (activeTerm) {
      updatePageMetadata({
        title: `${activeTerm.term} | A-Z Engineering Glossary & Lexicon`,
        description: `${activeTerm.shortDefinition} - Comprehensive A-Z reference covering quantum algorithms, VRP formulations, cyber-physical invariant gates, and safety standards.`,
        canonicalPath: `/glossary?term=${activeTerm.id}`,
        keywords: [activeTerm.term, activeTerm.acronym || '', ...activeTerm.tags],
      });
    }
  }, [activeTerm]);

  // Copy LaTeX formula
  const handleCopyLatex = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopyFeedback('latex');
    setTimeout(() => setCopyFeedback(null), 2000);
    trackButtonClick('Copy_Glossary_Latex', 'GlossaryStudio', { termId: activeTerm.id });
  };

  // Copy Full Definition
  const handleCopyDefinition = () => {
    const text = `${activeTerm.term} (${activeTerm.acronym || ''})\n\nCategory: ${activeTerm.category.toUpperCase()}\n\nDefinition:\n${activeTerm.shortDefinition}\n\nDetailed Explanation:\n${activeTerm.detailedExplanation}\n\nStandard Reference: ${activeTerm.standardsReference || 'N/A'}\nCodebase Module: ${activeTerm.codebaseModule || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopyFeedback('full');
    setTimeout(() => setCopyFeedback(null), 2000);
    trackButtonClick('Copy_Glossary_Full_Text', 'GlossaryStudio', { termId: activeTerm.id });
  };

  // Export Glossary JSON snapshot
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(GLOSSARY_ENTRIES, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wms_quantum_glossary_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    trackButtonClick('Export_Glossary_JSON', 'GlossaryStudio');
  };

  // Text highlighting parser for search query
  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              style={{
                backgroundColor: 'rgba(0, 240, 255, 0.3)',
                color: '#ffffff',
                borderRadius: '2px',
                padding: '0 2px',
              }}
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #070d19 0%, #0c1427 100%)',
        color: '#e2e8f0',
        fontFamily: 'var(--font-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      }}
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & SEARCH HERO BAR                                           */}
      {/* ========================================================================= */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
          background: 'rgba(10, 17, 34, 0.85)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          {/* Title & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(168, 85, 247, 0.35))',
                border: '1px solid rgba(0, 240, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(0, 240, 255, 0.3)',
              }}
            >
              <BookOpen size={20} color="#00f0ff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 800, color: '#ffffff', margin: 0, letterSpacing: '-0.3px' }}>
                  A–Z Engineering Glossary &amp; Lexicon
                </h1>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 800,
                    color: '#00f0ff',
                    background: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                  }}
                >
                  {GLOSSARY_ENTRIES.length} TERMS
                </span>
              </div>
              <p style={{ fontSize: '11.5px', color: '#94a3b8', margin: 0, marginTop: '2px' }}>
                Full-text search across quantum algorithms, VRP formulations, cyber-physical invariant gates, ISO standards, and KaTeX mathematical proofs.
              </p>
            </div>
          </div>

          {/* Right Action Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleExportJson}
              title="Download machine-readable JSON snapshot of all 50+ glossary terms"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#cbd5e1',
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '11px',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
            >
              <Download size={13} />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSelectedLetter('ALL');
                handleSelectTerm('benders-decomposition');
              }}
              title="Reset all filters and search queries"
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: '#94a3b8',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Search Bar Input Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={16}
              color="#00f0ff"
              style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search terms, acronyms, KaTeX formulas, DIN/ISO standards, algorithms (e.g. QAOA, SIPP, Gate 2, Benders)..."
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid rgba(0, 240, 255, 0.35)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12.5px',
                outline: 'none',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'transparent',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div style={{ fontSize: '11.5px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
            Showing <strong style={{ color: '#00f0ff' }}>{filteredTerms.length}</strong> of {GLOSSARY_ENTRIES.length} terms
          </div>
        </div>

        {/* Category Filter Pills Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              background: selectedCategory === 'ALL' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(30, 41, 59, 0.5)',
              border: selectedCategory === 'ALL' ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.2)',
              color: selectedCategory === 'ALL' ? '#ffffff' : '#94a3b8',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            All Categories ({GLOSSARY_ENTRIES.length})
          </button>
          {GLOSSARY_CATEGORIES.map((cat) => {
            const count = GLOSSARY_ENTRIES.filter((e) => e.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: isSelected ? cat.bg : 'rgba(30, 41, 59, 0.4)',
                  border: isSelected ? `1px solid ${cat.color}` : '1px solid rgba(148, 163, 184, 0.15)',
                  color: isSelected ? '#ffffff' : '#cbd5e1',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
                <span>{cat.label}</span>
                <span style={{ fontSize: '9.5px', color: isSelected ? cat.color : '#64748b', fontWeight: 700 }}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* A-Z Letter Index Ribbon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setSelectedLetter('ALL')}
            style={{
              background: selectedLetter === 'ALL' ? '#00f0ff' : 'rgba(30, 41, 59, 0.5)',
              color: selectedLetter === 'ALL' ? '#020617' : '#94a3b8',
              border: 'none',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            ALL
          </button>
          {alphabet.map((letter) => {
            const count = lettersWithCounts[letter] || 0;
            const isDisabled = count === 0;
            const isSelected = selectedLetter === letter;

            return (
              <button
                key={letter}
                disabled={isDisabled}
                onClick={() => setSelectedLetter(letter)}
                title={`${letter}: ${count} term${count === 1 ? '' : 's'}`}
                style={{
                  background: isSelected ? '#00f0ff' : isDisabled ? 'rgba(15, 23, 42, 0.3)' : 'rgba(30, 41, 59, 0.5)',
                  color: isSelected ? '#020617' : isDisabled ? '#475569' : '#cbd5e1',
                  border: isSelected ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.1)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 800,
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  opacity: isDisabled ? 0.35 : 1,
                  fontFamily: 'monospace',
                }}
              >
                {letter}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DUAL-PANE WORKSPACE: MASTER LIST & COMPREHENSIVE DETAIL INSPECTOR       */}
      {/* ========================================================================= */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* LEFT MASTER LIST PANE */}
        <div
          style={{
            width: '340px',
            minWidth: '280px',
            borderRight: '1px solid rgba(0, 240, 255, 0.15)',
            background: 'rgba(10, 18, 36, 0.5)',
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          {filteredTerms.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 16px', color: '#94a3b8' }}>
              <HelpCircle size={28} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#cbd5e1' }}>No matching terms found</div>
              <div style={{ fontSize: '11px', marginTop: '4px' }}>Try relaxing your search query or category filter.</div>
            </div>
          ) : (
            filteredTerms.map((item) => {
              const isSelected = activeTerm.id === item.id;
              const catConfig = GLOSSARY_CATEGORIES.find((c) => c.id === item.category);

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectTerm(item.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(0, 240, 255, 0.12)' : 'rgba(30, 41, 59, 0.35)',
                    border: isSelected ? '1px solid #00f0ff' : '1px solid rgba(148, 163, 184, 0.12)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'all 0.15s ease',
                    boxShadow: isSelected ? '0 0 12px rgba(0, 240, 255, 0.15)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: isSelected ? '#00f0ff' : '#ffffff' }}>
                      {renderHighlighted(item.term, searchQuery)}
                    </span>
                    {item.acronym && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: '#38bdf8',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.acronym}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        color: catConfig?.color || '#94a3b8',
                        background: catConfig?.bg || 'transparent',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        fontWeight: 600,
                      }}
                    >
                      {catConfig?.label.split(' ')[0]}
                    </span>

                    {item.schemaType && (
                      <span
                        title="Includes interactive architectural schema illustration"
                        style={{
                          fontSize: '8.5px',
                          color: '#fbbf24',
                          background: 'rgba(251, 191, 36, 0.15)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <Layers size={9} />
                        SCHEMA
                      </span>
                    )}

                    {item.latexFormula && (
                      <span
                        title="Includes mathematical KaTeX formula"
                        style={{
                          fontSize: '8.5px',
                          color: '#c084fc',
                          background: 'rgba(192, 132, 252, 0.15)',
                          padding: '1px 4px',
                          borderRadius: '3px',
                          fontWeight: 700,
                        }}
                      >
                        KaTeX
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      lineHeight: 1.35,
                      marginTop: '2px',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.shortDefinition}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT DETAIL INSPECTOR PANE */}
        <div
          ref={detailTopRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Breadcrumb Navigation Trail */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', fontSize: '11px', color: '#64748b' }}>
            <span style={{ fontWeight: 600 }}>History Trail:</span>
            {historyTrail.map((hId, index) => {
              const hTerm = GLOSSARY_ENTRIES.find((e) => e.id === hId);
              if (!hTerm) return null;
              const isLast = index === historyTrail.length - 1;

              return (
                <React.Fragment key={`${hId}-${index}`}>
                  <span
                    onClick={() => handleSelectTerm(hId)}
                    style={{
                      color: isLast ? '#00f0ff' : '#94a3b8',
                      cursor: 'pointer',
                      fontWeight: isLast ? 700 : 500,
                      textDecoration: isLast ? 'underline' : 'none',
                    }}
                  >
                    {hTerm.acronym || hTerm.term}
                  </span>
                  {!isLast && <ChevronRight size={10} color="#475569" />}
                </React.Fragment>
              );
            })}
          </div>

          {/* Term Header Card */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              borderRadius: '10px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                    {activeTerm.term}
                  </h2>
                  {activeTerm.acronym && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#00f0ff',
                        background: 'rgba(0, 240, 255, 0.15)',
                        border: '1px solid rgba(0, 240, 255, 0.4)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {activeTerm.acronym}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      color: '#a78bfa',
                      background: 'rgba(167, 139, 250, 0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    Category: {activeTerm.category.toUpperCase()}
                  </span>
                </div>

                <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '6px', lineHeight: 1.45, fontWeight: 500 }}>
                  {activeTerm.shortDefinition}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {activeTerm.appDeepLink && (
                  <button
                    onClick={() => {
                      if (onNavigateRoute) {
                        onNavigateRoute(activeTerm.appDeepLink!.path);
                      } else if (typeof window !== 'undefined') {
                        window.location.href = activeTerm.appDeepLink!.path;
                      }
                      trackButtonClick('Glossary_Deep_Link_Jump', 'GlossaryStudio', { target: activeTerm.appDeepLink!.path });
                    }}
                    style={{
                      background: 'rgba(0, 240, 255, 0.15)',
                      border: '1px solid #00f0ff',
                      color: '#00f0ff',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <ExternalLink size={12} />
                    <span>{activeTerm.appDeepLink.label}</span>
                  </button>
                )}

                <button
                  onClick={handleCopyDefinition}
                  title="Copy full definition text to clipboard"
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    border: '1px solid rgba(148, 163, 184, 0.25)',
                    color: copyFeedback === 'full' ? '#10b981' : '#cbd5e1',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                  }}
                >
                  {copyFeedback === 'full' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copyFeedback === 'full' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Intuitive Visual Schema Illustration Viewer */}
          {activeTerm.schemaType && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={14} color="#00f0ff" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
                  Intuitive Vector Schema &amp; Architectural Flow
                </span>
              </div>
              <GlossarySchemaViewer
                schemaType={activeTerm.schemaType}
                caption={activeTerm.schemaDescription}
              />
            </div>
          )}

          {/* Mathematical Formulation & KaTeX Proof */}
          {activeTerm.latexFormula && (
            <div
              style={{
                background: 'rgba(10, 18, 36, 0.85)',
                border: '1px solid rgba(168, 85, 247, 0.35)',
                borderRadius: '8px',
                padding: '14px 18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Cpu size={14} color="#c084fc" />
                  <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#c084fc', textTransform: 'uppercase' }}>
                    Mathematical Formulation &amp; KaTeX Proof
                  </span>
                </div>
                <button
                  onClick={() => handleCopyLatex(activeTerm.latexFormula!)}
                  style={{
                    background: 'rgba(168, 85, 247, 0.15)',
                    border: '1px solid rgba(168, 85, 247, 0.4)',
                    color: copyFeedback === 'latex' ? '#10b981' : '#c084fc',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copyFeedback === 'latex' ? <Check size={11} /> : <Copy size={11} />}
                  <span>{copyFeedback === 'latex' ? 'Copied LaTeX' : 'Copy LaTeX'}</span>
                </button>
              </div>

              <div
                style={{
                  background: 'rgba(7, 12, 24, 0.9)',
                  padding: '12px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  overflowX: 'auto',
                  textAlign: 'center',
                }}
                dangerouslySetInnerHTML={{
                  __html: renderKaTeX(activeTerm.latexFormula, true),
                }}
              />

              {activeTerm.calculationMeaning && (
                <div style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.45, marginTop: '2px' }}>
                  <strong style={{ color: '#38bdf8' }}>Variable &amp; Physics Breakdown:</strong> {activeTerm.calculationMeaning}
                </div>
              )}
            </div>
          )}

          {/* Detailed Engineering Explanation */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.2)',
              borderRadius: '8px',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#ffffff' }}>
              Detailed Cyber-Physical Explanation
            </span>
            <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.6 }}>
              {activeTerm.detailedExplanation}
            </div>
          </div>

          {/* Real-World Warehouse Example & Case Study */}
          {activeTerm.warehouseExample && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Activity size={13} color="#10b981" />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
                  Warehouse Operation Case Study &amp; Incident Verification
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#d1fae5', lineHeight: 1.45 }}>
                {activeTerm.warehouseExample}
              </div>
            </div>
          )}

          {/* Codebase Module & Standards Reference Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
            {activeTerm.standardsReference && (
              <div style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Industrial Standard &amp; Regulatory Clause</div>
                <div style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 600, marginTop: '3px' }}>
                  {activeTerm.standardsReference}
                </div>
              </div>
            )}

            {activeTerm.codebaseModule && (
              <div style={{ background: 'rgba(30, 41, 59, 0.45)', border: '1px solid rgba(148, 163, 184, 0.2)', padding: '10px 14px', borderRadius: '6px' }}>
                <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Repository Codebase Module</div>
                <div style={{ fontSize: '11.5px', color: '#38bdf8', fontFamily: 'monospace', fontWeight: 600, marginTop: '3px' }}>
                  {activeTerm.codebaseModule}
                </div>
              </div>
            )}
          </div>

          {/* Inner Cross-Links: Related Concepts Graph */}
          {activeTerm.relatedTermIds && activeTerm.relatedTermIds.length > 0 && (
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(0, 240, 255, 0.2)',
                borderRadius: '8px',
                padding: '12px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={13} color="#00f0ff" />
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#ffffff' }}>
                  Related Terms &amp; Inner Cross-References
                </span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {activeTerm.relatedTermIds.map((relId) => {
                  const relItem = GLOSSARY_ENTRIES.find((e) => e.id === relId);
                  if (!relItem) return null;

                  return (
                    <button
                      key={relId}
                      onClick={() => handleSelectTerm(relId)}
                      title={`Jump to ${relItem.term}`}
                      style={{
                        background: 'rgba(0, 240, 255, 0.1)',
                        border: '1px solid rgba(0, 240, 255, 0.3)',
                        color: '#e0f2fe',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.25)';
                        e.currentTarget.style.borderColor = '#00f0ff';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.3)';
                      }}
                    >
                      <span>{relItem.term}</span>
                      {relItem.acronym && (
                        <span style={{ fontSize: '9px', color: '#00f0ff', fontWeight: 800, fontFamily: 'monospace' }}>
                          ({relItem.acronym})
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
