import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ChevronDown,
  Download,
  Layers,
  Atom,
  Award,
  Database,
  FileSpreadsheet,
  Clock,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Search,
} from 'lucide-react';
import {
  REPORTS_REGISTRY,
  ReportDefinition,
  ReportCategory,
  PDFProfileId,
  exportRunToJson,
  exportRoutesToCsv,
  downloadPdfDirect,
} from '../data/reportsRegistry';
import { WaveExecutionResponse } from '../services/api';
import { trackButtonClick } from '../utils/analytics';

interface ReportsDropdownMenuProps {
  runId: string;
  lastWave: WaveExecutionResponse | null;
  onOpenPDF: (profile?: PDFProfileId) => void;
  disabled?: boolean;
}

export const ReportsDropdownMenu: React.FC<ReportsDropdownMenuProps> = ({
  runId,
  lastWave,
  onOpenPDF,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const filteredReports = REPORTS_REGISTRY.filter((report) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      (selectedCategory === 'PDF' && report.category === 'PDF') ||
      (selectedCategory === 'DATA' && report.category === 'DATA') ||
      (selectedCategory === 'PLANNED' && report.category === 'PLANNED');

    const matchesSearch =
      searchQuery.trim() === '' ||
      report.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.highlights.some((h) => h.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const getReportIcon = (report: ReportDefinition) => {
    switch (report.id) {
      case 'executive_brief':
        return <FileText size={16} color="#00f0ff" />;
      case 'comprehensive_dossier':
        return <Layers size={16} color="#c084fc" />;
      case 'quantum_monograph':
        return <Atom size={16} color="#38bdf8" />;
      case 'safety_certificate':
        return <Award size={16} color="#34d399" />;
      case 'execution_telemetry_json':
        return <Database size={16} color="#fbbf24" />;
      case 'fleet_routes_csv':
        return <FileSpreadsheet size={16} color="#34d399" />;
      case 'sustainability_audit':
        return <Sparkles size={16} color="#a855f7" />;
      case 'multi_facility_benchmark':
        return <Clock size={16} color="#94a3b8" />;
      default:
        return <FileText size={16} color="#00f0ff" />;
    }
  };

  const handleAction = (report: ReportDefinition, mode: 'VIEW' | 'DOWNLOAD') => {
    trackButtonClick(`Report_Action_${report.id}_${mode}`, 'Reports_Dropdown_Menu', {
      report_id: report.id,
      format: report.format,
      mode,
      run_id: runId,
    });

    if (report.category === 'PDF') {
      if (mode === 'VIEW') {
        onOpenPDF(report.pdfProfile);
        setIsOpen(false);
      } else {
        downloadPdfDirect(runId, report.pdfProfile);
      }
    } else if (report.id === 'execution_telemetry_json') {
      exportRunToJson(lastWave, runId);
    } else if (report.id === 'fleet_routes_csv') {
      exportRoutesToCsv(lastWave, runId);
    }
  };

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => {
          if (!disabled && runId) {
            trackButtonClick('Toggle_Reports_Dropdown', 'TopLevel_HUD', { is_open: !isOpen, run_id: runId });
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled || !runId}
        className="btn-primary"
        style={{
          fontSize: '12px',
          padding: '7px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: isOpen
            ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.35) 0%, rgba(14, 165, 233, 0.45) 100%)'
            : undefined,
          borderColor: isOpen ? '#00f0ff' : undefined,
          boxShadow: isOpen ? '0 0 16px rgba(0, 240, 255, 0.4)' : undefined,
          cursor: disabled || !runId ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Open Engineering & Compliance Reports Menu (4 PDF Profiles, JSON/CSV Data Exports, ISO Certificates)"
      >
        <FileText size={14} />
        <span style={{ fontWeight: 700 }}>Reports</span>
        <span
          style={{
            fontSize: '9.5px',
            fontWeight: 800,
            padding: '1px 5px',
            borderRadius: '4px',
            backgroundColor: 'rgba(0, 240, 255, 0.2)',
            color: '#00f0ff',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            fontFamily: 'monospace',
          }}
        >
          4 PDF
        </span>
        <ChevronDown
          size={13}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {/* Floating Dropdown Panel */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '460px',
            maxHeight: '620px',
            backgroundColor: 'rgba(10, 15, 29, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 240, 255, 0.18)',
            zIndex: 1050,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              background: 'linear-gradient(90deg, rgba(16, 24, 48, 0.85) 0%, rgba(10, 16, 32, 0.85) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(0, 240, 255, 0.12)',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={16} color="#00f0ff" />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f4f8' }}>
                  Engineering & Compliance Reports
                </div>
                <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  DIN EN ISO 3691-4 • Classiq Quantum 32Q Telemetry
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'monospace',
                  padding: '2px 7px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: '#94a3b8',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                }}
                title={`Active Run ID: ${runId}`}
              >
                {runId ? runId.slice(0, 8) : 'NO_RUN'}
              </span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Close menu"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Search & Category Filter Bar */}
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
              backgroundColor: 'rgba(7, 11, 22, 0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            {/* Search Input */}
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Search
                size={13}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by title, rule or standard..."
                style={{
                  width: '100%',
                  padding: '6px 10px 6px 30px',
                  fontSize: '11px',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: '#f0f4f8',
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                  }}
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {(
                [
                  { id: 'ALL', label: 'All', count: REPORTS_REGISTRY.length },
                  { id: 'PDF', label: 'Vector PDF', count: 4 },
                  { id: 'DATA', label: 'Data Exports', count: 2 },
                  { id: 'PLANNED', label: 'Roadmap', count: 2 },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border:
                      selectedCategory === cat.id
                        ? '1px solid rgba(0, 240, 255, 0.6)'
                        : '1px solid rgba(255, 255, 255, 0.08)',
                    backgroundColor:
                      selectedCategory === cat.id
                        ? 'rgba(0, 240, 255, 0.15)'
                        : 'rgba(255, 255, 255, 0.03)',
                    color: selectedCategory === cat.id ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '9px',
                      opacity: 0.7,
                      fontFamily: 'monospace',
                    }}
                  >
                    ({cat.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Report List */}
          <div
            style={{
              padding: '8px 10px',
              overflowY: 'auto',
              maxHeight: '380px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            {filteredReports.length === 0 ? (
              <div
                style={{
                  padding: '30px',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '12px',
                }}
              >
                No reports found matching your search.
              </div>
            ) : (
              filteredReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  {/* Top line: Icon + Title + Badge + Actions */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '6px',
                          backgroundColor: 'rgba(255, 255, 255, 0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {getReportIcon(report)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#f0f4f8',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {report.title}
                          </span>
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              padding: '1px 5px',
                              borderRadius: '3px',
                              backgroundColor: `${report.badgeColor}22`,
                              color: report.badgeColor,
                              border: `1px solid ${report.badgeColor}44`,
                              fontFamily: 'monospace',
                              flexShrink: 0,
                            }}
                          >
                            {report.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                      {report.category === 'PDF' && (
                        <>
                          <button
                            onClick={() => handleAction(report, 'VIEW')}
                            style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '4px 9px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(0, 240, 255, 0.15)',
                              border: '1px solid rgba(0, 240, 255, 0.4)',
                              color: '#00f0ff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              transition: 'all 0.15s ease',
                            }}
                            title={`Inspect ${report.title} in Vector PDF Studio`}
                          >
                            <Eye size={12} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleAction(report, 'DOWNLOAD')}
                            style={{
                              fontSize: '11px',
                              padding: '4px 7px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.15)',
                              color: '#cbd5e1',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            title={`Download ${report.title} as PDF file`}
                          >
                            <Download size={12} />
                          </button>
                        </>
                      )}

                      {report.category === 'DATA' && (
                        <button
                          onClick={() => handleAction(report, 'DOWNLOAD')}
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '4px 10px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(52, 211, 153, 0.15)',
                            border: '1px solid rgba(52, 211, 153, 0.4)',
                            color: '#34d399',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.15s ease',
                          }}
                          title={`Export ${report.format} file`}
                        >
                          <Download size={12} />
                          <span>Export {report.format}</span>
                        </button>
                      )}

                      {report.category === 'PLANNED' && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: '#64748b',
                            fontFamily: 'monospace',
                            padding: '3px 7px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                          }}
                        >
                          Planned
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {report.description}
                  </div>

                  {/* Highlight bullets */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '4px',
                      marginTop: '2px',
                    }}
                  >
                    {report.highlights.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: '9.5px',
                          color: '#64748b',
                          backgroundColor: 'rgba(255, 255, 255, 0.03)',
                          padding: '1px 6px',
                          borderRadius: '3px',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                      >
                        • {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              backgroundColor: 'rgba(8, 12, 24, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={11} color="#10b981" />
              <span>Vector PDF Engine v2.4 • ISO 3691-4</span>
            </div>
            <button
              onClick={() => {
                onOpenPDF('EXECUTIVE');
                setIsOpen(false);
              }}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: '#00f0ff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>Open Vector PDF Studio</span>
              <ExternalLink size={11} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
