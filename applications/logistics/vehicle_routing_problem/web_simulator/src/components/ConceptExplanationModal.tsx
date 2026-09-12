import React, { useState, useMemo, useRef, useEffect } from 'react';
import katex from 'katex';
import {
  BookOpen,
  X,
  Search,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  Layers,
  Sparkles,
  ChevronRight,
  Download,
  Lightbulb,
  FileCode,
  Compass,
} from 'lucide-react';
import conceptData from '../data/conceptProblemDefinition.json';

interface ConceptExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Robust LaTeX equation renderer with KaTeX
const sanitizeFormula = (s: string): string => {
  let res = s.trim();
  res = res.replace(/^\\\[([\s\S]*)\\\]$/, '$1').trim();
  res = res.replace(/^\\\(([\s\S]*)\\\)$/, '$1').trim();
  res = res.replace(/\\\(/g, '(').replace(/\\\)/g, ')');
  res = res.replace(/\\\[/g, '[').replace(/\\\]/g, ']');
  res = res.replace(/\\vert\{\}/g, '|').replace(/\\vert/g, '|');
  // Normalize underscores in text-like commands so that they always become exactly \_
  res = res.replace(/\\(text|mathrm|mathit|mathbf)\{([^{}]*)\}/g, (_, tag, c) => {
    const normalized = c.replace(/\\+_/g, '_').replace(/_/g, '\\_');
    return `\\${tag}{${normalized}}`;
  });
  return res;
};

const renderLatexToHtml = (text: string): string => {
  if (!text) return '';

  // 1. Process Display Math: $$ ... $$
  let rendered = text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (_, equation) => {
    try {
      const cleaned = sanitizeFormula(equation);
      const html = katex.renderToString(cleaned, {
        displayMode: true,
        throwOnError: false,
      });
      return `\n\n__DISPLAY_MATH_START__\n<div class="katex-display-wrapper" style="overflow-x: auto; margin: 16px 0; padding: 12px 16px; background: rgba(10, 18, 36, 0.85); border: 1px solid rgba(0, 240, 255, 0.25); border-radius: 8px; text-align: center; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">${html}</div>\n__DISPLAY_MATH_END__\n\n`;
    } catch {
      return `\n\n<pre class="katex-error" style="color: #f59e0b; background: rgba(245, 158, 11, 0.1); padding: 6px 10px; border-radius: 6px; font-size: 12px; overflow-x: auto;">$$ ${equation} $$</pre>\n\n`;
    }
  });

  // 2. Process Inline Math: $ ... $
  rendered = rendered.replace(/\$([^\$\n]+?)\$/g, (_, equation) => {
    try {
      const cleaned = sanitizeFormula(equation);
      return katex.renderToString(cleaned, {
        displayMode: false,
        throwOnError: false,
      });
    } catch {
      return `<code style="color: #38bdf8; font-family: monospace;">$${equation}$</code>`;
    }
  });

  // 3. Process Block Elements (Headers, Lists, Tables, Preformatted ASCII Diagrams, Paragraphs)
  const lines = rendered.split('\n');
  const out: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let inAscii = false;
  let asciiLines: string[] = [];

  const flushTable = () => {
    if (tableRows.length === 0) return;
    const headerRow = tableRows[0];
    const dataRows = tableRows.slice(1).filter((r) => !r.every((cell) => /^:?-+:?$/.test(cell.trim())));

    let html = '<div class="table-wrapper" style="overflow-x: auto; margin: 18px 0; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 8px; background: rgba(15, 23, 42, 0.6);"><table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">';
    if (headerRow) {
      html += '<thead><tr style="background: rgba(0, 240, 255, 0.12); border-bottom: 1px solid rgba(0, 240, 255, 0.25);">';
      headerRow.forEach((h) => {
        html += `<th style="padding: 10px 14px; font-weight: 700; color: #00f0ff; border-right: 1px solid rgba(255, 255, 255, 0.06);">${h.trim()}</th>`;
      });
      html += '</tr></thead>';
    }
    html += '<tbody>';
    dataRows.forEach((row, rIdx) => {
      const bg = rIdx % 2 === 0 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.18)';
      html += `<tr style="background: ${bg}; border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.15s ease;">`;
      row.forEach((cell) => {
        const c = cell.trim().replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f3f4f6; font-weight: 600;">$1</strong>');
        html += `<td style="padding: 8px 14px; color: #cbd5e1; border-right: 1px solid rgba(255, 255, 255, 0.05); vertical-align: top; line-height: 1.5;">${c}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    out.push(html);
    tableRows = [];
    inTable = false;
  };

  const flushAscii = () => {
    if (asciiLines.length === 0) return;
    const content = asciiLines.join('\n');
    out.push(`<pre class="ascii-diagram" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; line-height: 1.45; background: rgba(0, 240, 255, 0.03); border: 1px solid rgba(0, 240, 255, 0.15); border-radius: 8px; padding: 14px; overflow-x: auto; color: #38bdf8; margin: 14px 0; box-shadow: inset 0 2px 8px rgba(0,0,0,0.4);">${content}</pre>`);
    asciiLines = [];
    inAscii = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const l = rawLine.trim();

    // Preserve whitespace separator
    if (!l) {
      if (inTable) flushTable();
      if (inAscii) flushAscii();
      continue;
    }

    // Display math tokens
    if (l === '__DISPLAY_MATH_START__') {
      if (inTable) flushTable();
      if (inAscii) flushAscii();
      i++;
      out.push(lines[i]);
      if (i + 1 < lines.length && lines[i + 1].trim() === '__DISPLAY_MATH_END__') i++;
      continue;
    }
    if (l.startsWith('<div class="katex-display-wrapper"') || l.startsWith('<pre class="katex-error"')) {
      if (inTable) flushTable();
      if (inAscii) flushAscii();
      out.push(l);
      continue;
    }

    // Table rows: lines with pipes
    if (l.startsWith('|') && l.endsWith('|')) {
      if (inAscii) flushAscii();
      inTable = true;
      const cells = l.slice(1, -1).split('|');
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // ASCII Trees & Box-drawing diagrams
    if (/[│├──└──▼┌───]/.test(l) || (inAscii && (l.startsWith('Tier') || l.startsWith('TIER') || l.includes('Rank')))) {
      inAscii = true;
      asciiLines.push(rawLine);
      continue;
    } else if (inAscii) {
      flushAscii();
    }

    // Headers
    if (l.startsWith('#### ')) {
      out.push(`<h4 style="font-size: 14px; font-weight: 700; color: #38bdf8; margin: 18px 0 6px 0; display: flex; align-items: center; gap: 6px;">
        <span style="display: inline-block; width: 4px; height: 14px; background: #00f0ff; border-radius: 2px;"></span>
        ${l.slice(5).replace(/\*\*(.*?)\*\*/g, '$1')}
      </h4>`);
      continue;
    }
    if (l.startsWith('### ')) {
      out.push(`<h3 style="font-size: 16px; font-weight: 700; color: #f0f4f8; margin: 24px 0 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 4px;">
        ${l.slice(4).replace(/\*\*(.*?)\*\*/g, '$1')}
      </h3>`);
      continue;
    }

    // Bullet points
    if (l.startsWith('* ') || l.startsWith('- ')) {
      let content = l.slice(2);
      content = content.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f3f4f6; font-weight: 600;">$1</strong>');
      out.push(`<div style="display: flex; gap: 8px; margin: 4px 0; padding-left: 8px; line-height: 1.6;">
        <span style="color: #00f0ff; font-weight: bold;">•</span>
        <span style="color: #cbd5e1; font-size: 13px;">${content}</span>
      </div>`);
      continue;
    }

    // Paragraph
    const formatted = l.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #f3f4f6; font-weight: 600;">$1</strong>');
    out.push(`<p style="color: #94a3b8; font-size: 13px; margin: 6px 0; line-height: 1.65;">${formatted}</p>`);
  }

  if (inTable) flushTable();
  if (inAscii) flushAscii();

  return out.join('\n');
};

export const ConceptExplanationModal: React.FC<ConceptExplanationModalProps> = ({ isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(conceptData.chapters[0]?.id || 'ch-1');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const contentContainerRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Current active chapter
  const currentChapter = useMemo(() => {
    return conceptData.chapters.find((c) => c.id === selectedChapterId) || conceptData.chapters[0];
  }, [selectedChapterId]);

  // Filter sections if search is active
  const filteredSections = useMemo(() => {
    if (!searchTerm.trim()) return currentChapter.sections;
    const term = searchTerm.toLowerCase();
    return currentChapter.sections.filter(
      (sec) =>
        sec.title.toLowerCase().includes(term) ||
        sec.raw_content.toLowerCase().includes(term)
    );
  }, [currentChapter, searchTerm]);

  // Search match count across entire document
  const totalMatches = useMemo(() => {
    if (!searchTerm.trim()) return 0;
    const term = searchTerm.toLowerCase();
    let count = 0;
    for (const ch of conceptData.chapters) {
      if (ch.title.toLowerCase().includes(term)) count++;
      for (const s of ch.sections) {
        if (s.title.toLowerCase().includes(term) || s.raw_content.toLowerCase().includes(term)) {
          count++;
        }
      }
    }
    return count;
  }, [searchTerm]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(
      `# ${conceptData.title}\n## ${conceptData.subtitle}\n\nProblem Classification: ${conceptData.problem_class}\nInvariant Code: ${conceptData.verification_invariant} (${conceptData.falsification_ratio})\n\n${currentChapter.title}\n\n${currentChapter.raw_content}\n\n` +
      currentChapter.sections.map((s) => `### ${s.title}\n\n${s.raw_content}`).join('\n\n')
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFullDoc = () => {
    const blob = new Blob([
      `# ${conceptData.title}\n## ${conceptData.subtitle}\n\n${conceptData.chapters.map(c => `## ${c.title}\n${c.raw_content}\n` + c.sections.map(s => `### ${s.title}\n${s.raw_content}`).join('\n\n')).join('\n\n')}`
    ], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Dispatching_Problem_Definition_ER-MD-VRPTW-3D-HRI.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 18, 0.82)',
        backdropFilter: 'blur(12px)',
        padding: isFullscreen ? '0' : '20px',
        transition: 'all 0.25s ease',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Dialog Card */}
      <div
        className="glass-panel"
        style={{
          width: isFullscreen ? '100vw' : '94vw',
          maxWidth: isFullscreen ? '100vw' : '1280px',
          height: isFullscreen ? '100vh' : '90vh',
          backgroundColor: '#060913',
          border: '1px solid rgba(234, 179, 8, 0.45)',
          borderRadius: isFullscreen ? '0' : '14px',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.95), 0 0 40px rgba(234, 179, 8, 0.22)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          minWidth: 0,
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#090e1c',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          {/* Brand & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.25), rgba(249, 115, 22, 0.3))',
                border: '1px solid rgba(234, 179, 8, 0.6)',
                boxShadow: '0 0 16px rgba(234, 179, 8, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Lightbulb size={22} color="#facc15" />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  Concept Explanation & Mathematical Problem Definition
                </h2>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(234, 179, 8, 0.15)',
                    border: '1px solid rgba(234, 179, 8, 0.45)',
                    color: '#facc15',
                  }}
                >
                  ER-MD-VRPTW-3D-HRI
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(0, 240, 255, 0.15)',
                    border: '1px solid rgba(0, 240, 255, 0.4)',
                    color: '#00f0ff',
                  }}
                >
                  {conceptData.total_formulas} RIGOROUS LATEX FORMULAS
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                  }}
                >
                  INVARIANT: '{conceptData.verification_invariant}' (Φ &lt; 1.0)
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                Unified formal formulation with open time windows, 3D containerization, human-robot shared spaces &amp; stochastic recourse
              </div>
            </div>
          </div>

          {/* Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            {/* Search Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0c1222',
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Search size={13} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search formulas, constraints, symbols..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px',
                  outline: 'none',
                  width: '200px',
                }}
              />
              {searchTerm && (
                <span style={{ fontSize: '10px', color: '#facc15', fontWeight: 600 }}>
                  {totalMatches} matches
                </span>
              )}
            </div>

            {/* Copy Button */}
            <button
              onClick={handleCopyMarkdown}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Copy active chapter markdown with LaTeX"
            >
              {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownloadFullDoc}
              className="btn-secondary"
              style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}
              title="Download complete mathematical definition document (.md)"
            >
              <Download size={13} />
              <span>Export .md</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '6px',
                color: '#94a3b8',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title={isFullscreen ? 'Restore standard modal size' : 'Maximize to fullscreen'}
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '6px',
                color: '#f87171',
                padding: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Close modal (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chapter Switcher Pills Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 20px',
            backgroundColor: '#070b16',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            overflowX: 'auto',
            flexShrink: 0,
          }}
        >
          {conceptData.chapters.map((ch, idx) => {
            const isSel = selectedChapterId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => {
                  setSelectedChapterId(ch.id);
                  setSelectedSectionId(null);
                  if (contentContainerRef.current) {
                    contentContainerRef.current.scrollTop = 0;
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isSel ? '1px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)',
                  backgroundColor: isSel ? 'rgba(234, 179, 8, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                  color: isSel ? '#facc15' : '#94a3b8',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.7 }}>CH {idx + 1}</span>
                <span>{ch.title.replace(/^\d+\.\s*/, '')}</span>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    backgroundColor: isSel ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                    color: isSel ? '#fef08a' : '#64748b',
                  }}
                >
                  {ch.sections.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Split Navigation & Reader */}
        <div
          style={{
            display: 'flex',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {/* Left Sidebar: Sub-sections list */}
          <div
            style={{
              width: '320px',
              maxWidth: '30vw',
              minWidth: '240px',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: '#080c18',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>Sections &amp; Formulations</span>
              <span>{filteredSections.length}</span>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minHeight: 0,
              }}
            >
              {/* Main Chapter Overview Link */}
              <button
                onClick={() => {
                  setSelectedSectionId(null);
                  if (contentContainerRef.current) {
                    contentContainerRef.current.scrollTop = 0;
                  }
                }}
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: selectedSectionId === null ? 700 : 500,
                  cursor: 'pointer',
                  border: selectedSectionId === null ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid transparent',
                  backgroundColor: selectedSectionId === null ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                  color: selectedSectionId === null ? '#00f0ff' : '#cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Compass size={13} color={selectedSectionId === null ? '#00f0ff' : '#64748b'} />
                <span>Chapter Overview &amp; Foundations</span>
              </button>

              {/* Sub-sections links */}
              {filteredSections.map((sec) => {
                const isSecSel = selectedSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      setSelectedSectionId(sec.id);
                      const el = document.getElementById(sec.id);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    style={{
                      textAlign: 'left',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      lineHeight: '1.4',
                      fontWeight: isSecSel ? 700 : 500,
                      cursor: 'pointer',
                      border: isSecSel ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid transparent',
                      backgroundColor: isSecSel ? 'rgba(234, 179, 8, 0.12)' : 'transparent',
                      color: isSecSel ? '#facc15' : '#94a3b8',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <ChevronRight size={12} style={{ marginTop: '2px', flexShrink: 0 }} color={isSecSel ? '#facc15' : '#64748b'} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{sec.title}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Main Content Reader */}
          <div
            ref={contentContainerRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '24px 32px 64px',
              backgroundColor: '#060913',
              minHeight: 0,
            }}
          >
            {/* Chapter Header Banner */}
            <div
              style={{
                marginBottom: '24px',
                padding: '16px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(9, 14, 28, 0.8))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {currentChapter.title}
                </span>
              </div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>
                {currentChapter.title}
              </h1>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                Formal mathematical formulation in standard LaTeX, including physical invariants, graph topologies, and multi-tier optimization solvers.
              </div>
            </div>

            {/* Chapter Introduction Content */}
            {currentChapter.raw_content && (
              <div
                style={{ marginBottom: '28px' }}
                dangerouslySetInnerHTML={{ __html: renderLatexToHtml(currentChapter.raw_content) }}
              />
            )}

            {/* Render Each Section */}
            {filteredSections.map((sec) => (
              <div
                key={sec.id}
                id={sec.id}
                style={{
                  marginBottom: '36px',
                  padding: '20px',
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '10px',
                  transition: 'border-color 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '8px' }}>
                  <Sparkles size={16} color="#facc15" />
                  <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
                    {sec.title}
                  </h2>
                </div>

                {/* Section Content with rendered KaTeX formulas */}
                <div
                  dangerouslySetInnerHTML={{ __html: renderLatexToHtml(sec.raw_content) }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
