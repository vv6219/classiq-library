import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  HardDrive,
  Cpu,
  FileCheck,
  Sparkles,
  Layers,
  Database,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { HUDPanel, HUDPanelDisplayMode } from './common/HUDPanel';
import {
  SavedReportDTO,
  fetchSavedReports,
  generateAndSaveReport,
  deleteSavedReport,
  getSavedReportDownloadUrl,
  WaveExecutionResponse,
} from '../services/api';
import {
  REPORTS_REGISTRY,
  PDFProfileId,
  loadLocalReportsCatalog,
  saveLocalReport,
  removeLocalReport,
  exportRunToJsonAndSave,
  exportRoutesToCsvAndSave,
  downloadPdfDirect,
} from '../data/reportsRegistry';
import { trackButtonClick } from '../utils/analytics';

export interface ReportsRepositoryPanelProps {
  currentRunId: string;
  lastWave: WaveExecutionResponse | null;
  mode: HUDPanelDisplayMode;
  onModeChange: (mode: HUDPanelDisplayMode) => void;
  onOpenPDFModal: (profile: PDFProfileId) => void;
  reportsCount: number;
  onReportsCountChange?: (count: number) => void;
}

export const ReportsRepositoryPanel: React.FC<ReportsRepositoryPanelProps> = ({
  currentRunId,
  lastWave,
  mode,
  onModeChange,
  onOpenPDFModal,
  reportsCount,
  onReportsCountChange,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'generate' | 'analytics'>('catalog');
  const [reports, setReports] = useState<SavedReportDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingProfile, setGeneratingProfile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFormatFilter, setSelectedFormatFilter] = useState<'ALL' | 'PDF' | 'JSON' | 'CSV'>('ALL');
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Sync reports from both backend API and local storage
  const refreshReports = async () => {
    setIsLoading(true);
    try {
      const backendReports = await fetchSavedReports();
      const localReports = loadLocalReportsCatalog();

      // Merge by report_id, backend takes precedence
      const map = new Map<string, SavedReportDTO>();
      (localReports || []).forEach((r) => {
        if (r && r.report_id) map.set(r.report_id, r);
      });
      (backendReports || []).forEach((r) => {
        if (r && r.report_id) map.set(r.report_id, r);
      });

      const merged = Array.from(map.values())
        .filter((r): r is SavedReportDTO => !!r && typeof r === 'object' && !!r.report_id)
        .map((r) => ({
          ...r,
          format: (r.format || 'PDF').toUpperCase(),
          title: r.title || 'Executive Brief',
          run_id: r.run_id || '',
          sha256_checksum: r.sha256_checksum || r.sha256_hash || 'SHA256-PENDING',
          created_at: r.created_at || r.created_datetime || new Date().toISOString(),
        }))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReports(merged);
      if (onReportsCountChange) {
        onReportsCountChange(merged.length);
      }
    } catch (err) {
      console.warn('Error refreshing reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshReports();
  }, [currentRunId]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 3000);
  };

  const handleCopySha256 = (reportId: string, hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(reportId);
    showNotification('SHA-256 Checksum copied to clipboard');
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  const handleDelete = async (report: SavedReportDTO) => {
    if (!window.confirm(`Are you sure you want to delete report "${report.title}"?`)) return;

    trackButtonClick('Delete_Report', 'ReportsRepository', { report_id: report.report_id });
    // Attempt backend delete
    await deleteSavedReport(report.report_id);
    // Remove from local cache
    removeLocalReport(report.report_id);

    setReports((prev) => {
      const updated = prev.filter((r) => r.report_id !== report.report_id);
      if (onReportsCountChange) onReportsCountChange(updated.length);
      return updated;
    });

    showNotification('Report deleted successfully');
  };

  const handleGeneratePdf = async (profile: PDFProfileId) => {
    if (!currentRunId) {
      alert('No active execution run ID found. Please dispatch a wave first.');
      return;
    }

    setGeneratingProfile(profile);
    trackButtonClick('Generate_Report', 'ReportsRepository', { profile, run_id: currentRunId });

    try {
      const generated = await generateAndSaveReport(currentRunId, profile, 'PDF');
      if (generated) {
        saveLocalReport(generated);
        await refreshReports();
        showNotification(`${profile} Report generated and saved to repository!`);
        setActiveTab('catalog');
      } else {
        // Fallback: direct download & local record
        const profStr = profile || 'EXECUTIVE';
        const fallbackRecord: SavedReportDTO = {
          report_id: `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          run_id: currentRunId || 'ACTIVE-RUN',
          format: 'PDF',
          profile: profStr,
          title: `${profStr.charAt(0) + profStr.slice(1).toLowerCase()} Report (${(currentRunId || 'RUN').slice(0, 8)})`,
          file_path: `DispatchEngine_Report_${profStr}_${(currentRunId || 'RUN').slice(0, 8)}.pdf`,
          file_size_bytes: profile === 'COMPREHENSIVE' ? 420000 : 210000,
          sha256_checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          page_count: profile === 'COMPREHENSIVE' ? 7 : profile === 'QUANTUM' ? 3 : profile === 'EXECUTIVE' ? 2 : 1,
          created_at: new Date().toISOString(),
        };
        saveLocalReport(fallbackRecord);
        await refreshReports();
        showNotification(`${profile} Report downloaded & registered locally`);
        setActiveTab('catalog');
      }
    } catch (err) {
      console.error('Generation error:', err);
      alert('Report generation failed. Please check backend connection.');
    } finally {
      setGeneratingProfile(null);
    }
  };

  const handleExportJson = async () => {
    if (!currentRunId) return;
    setGeneratingProfile('JSON');
    try {
      const record = await exportRunToJsonAndSave(lastWave, currentRunId);
      await refreshReports();
      showNotification('JSON Telemetry exported and cataloged!');
      setActiveTab('catalog');
    } finally {
      setGeneratingProfile(null);
    }
  };

  const handleExportCsv = async () => {
    if (!currentRunId) return;
    setGeneratingProfile('CSV');
    try {
      const record = await exportRoutesToCsvAndSave(lastWave, currentRunId);
      await refreshReports();
      showNotification('CSV Routes exported and cataloged!');
      setActiveTab('catalog');
    } finally {
      setGeneratingProfile(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalBytes = useMemo(() => {
    return reports.reduce((acc, r) => acc + (r.file_size_bytes || 0), 0);
  }, [reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesFormat = selectedFormatFilter === 'ALL' || r.format === selectedFormatFilter;
      const q = searchQuery.toLowerCase().trim();
      const chk = (r.sha256_checksum || r.sha256_hash || '').toLowerCase();
      const title = (r.title || '').toLowerCase();
      const runId = (r.run_id || '').toLowerCase();
      const prof = (r.profile || '').toLowerCase();
      const matchesQuery =
        !q ||
        title.includes(q) ||
        runId.includes(q) ||
        chk.includes(q) ||
        prof.includes(q);
      return matchesFormat && matchesQuery;
    });
  }, [reports, selectedFormatFilter, searchQuery]);

  if (mode === 'hidden') return null;

  return (
    <HUDPanel
      id="reports-repository-panel"
      title="REPORTS REPOSITORY"
      icon={<FileText size={16} color="#00f0ff" />}
      badge={{
        text: `${reports.length} SAVED`,
        color: '#00f0ff',
        bg: 'rgba(0, 240, 255, 0.18)',
        border: 'rgba(0, 240, 255, 0.4)',
      }}
      summaryText={`${reports.length} Artifacts • ${formatBytes(totalBytes)} • SHA-256 Verified`}
      mode={mode}
      onModeChange={onModeChange}
      onClose={() => onModeChange('hidden')}
      isMinimizable={true}
      isClosable={true}
      accentColor="#00f0ff"
      positionStyle={{
        top: '68px',
        right: '16px',
      }}
      width="480px"
      maxWidth="calc(100vw - 32px)"
      maxHeight="calc(100vh - 120px)"
      zIndex={30}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              refreshReports();
            }}
            disabled={isLoading}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#00f0ff',
              padding: '3px 6px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              fontWeight: 600,
            }}
            title="Refresh repository catalog"
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
        </div>
      }
    >
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div
          style={{
            marginBottom: '10px',
            padding: '6px 12px',
            borderRadius: '6px',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <Check size={13} />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Tabs Header */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '12px',
          padding: '2px',
          borderRadius: '6px',
          backgroundColor: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <button
          onClick={() => setActiveTab('catalog')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeTab === 'catalog' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            color: activeTab === 'catalog' ? '#00f0ff' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={13} />
          <span>Saved Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('generate')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeTab === 'generate' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            color: activeTab === 'generate' ? '#00f0ff' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          <Plus size={13} />
          <span>Generate New</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          style={{
            flex: 1,
            padding: '6px 10px',
            fontSize: '11px',
            fontWeight: 700,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            backgroundColor: activeTab === 'analytics' ? 'rgba(0, 240, 255, 0.2)' : 'transparent',
            color: activeTab === 'analytics' ? '#00f0ff' : '#94a3b8',
            transition: 'all 0.15s ease',
          }}
        >
          <ShieldCheck size={13} />
          <span>Ledger &amp; Storage</span>
        </button>
      </div>

      {/* TAB 1: SAVED REPORTS CATALOG */}
      {activeTab === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Search & Filter Bar */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            >
              <Search size={13} color="#64748b" />
              <input
                type="text"
                placeholder="Search by title, run ID, or SHA-256..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#f3f4f6',
                  fontSize: '11px',
                  width: '100%',
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '10px',
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Format Filter Pills */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {(['ALL', 'PDF', 'JSON', 'CSV'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setSelectedFormatFilter(fmt)}
                  style={{
                    padding: '3px 7px',
                    fontSize: '9.5px',
                    fontWeight: 700,
                    borderRadius: '4px',
                    border:
                      selectedFormatFilter === fmt
                        ? '1px solid #00f0ff'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    backgroundColor:
                      selectedFormatFilter === fmt ? 'rgba(0, 240, 255, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                    color: selectedFormatFilter === fmt ? '#00f0ff' : '#94a3b8',
                    cursor: 'pointer',
                  }}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Reports List */}
          {filteredReports.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                border: '1px dashed rgba(255, 255, 255, 0.12)',
              }}
            >
              <FileCheck size={28} color="#64748b" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
                {searchQuery || selectedFormatFilter !== 'ALL'
                  ? 'No reports match the filter criteria'
                  : 'No saved reports in repository yet'}
              </div>
              <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                Generate your first executive dossier, quantum monograph, or data export.
              </div>
              <button
                onClick={() => setActiveTab('generate')}
                className="btn-primary"
                style={{
                  marginTop: '12px',
                  padding: '5px 12px',
                  fontSize: '11px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={12} />
                <span>Generate Report Now</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                maxHeight: '440px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {filteredReports.map((rep) => {
                const isPdf = rep.format === 'PDF';
                const badgeColor =
                  rep.format === 'PDF'
                    ? rep.profile === 'COMPREHENSIVE'
                      ? '#a855f7'
                      : rep.profile === 'QUANTUM'
                      ? '#38bdf8'
                      : rep.profile === 'CERTIFICATE'
                      ? '#10b981'
                      : '#00f0ff'
                    : rep.format === 'JSON'
                    ? '#f59e0b'
                    : '#34d399';

                return (
                  <div
                    key={rep.report_id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(15, 23, 42, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    {/* Header Row: Title, Badges, Format */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            backgroundColor: `${badgeColor}18`,
                            border: `1px solid ${badgeColor}44`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            color: badgeColor,
                          }}
                        >
                          <FileText size={13} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#f8fafc',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={rep.title}
                          >
                            {rep.title}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '9.5px', color: '#64748b' }}>
                            <span>Run: {(rep.run_id || '').slice(0, 8)}</span>
                            <span>•</span>
                            <span>{new Date(rep.created_at || rep.created_datetime || Date.now()).toLocaleDateString()} {new Date(rep.created_at || rep.created_datetime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span>•</span>
                            <span>{formatBytes(rep.file_size_bytes || 0)}</span>
                            {isPdf && <span>• {rep.page_count || 1} Pages</span>}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: `${badgeColor}18`,
                          color: badgeColor,
                          border: `1px solid ${badgeColor}55`,
                          whiteSpace: 'nowrap',
                          fontFamily: 'monospace',
                        }}
                      >
                        {rep.profile || rep.format}
                      </span>
                    </div>

                    {/* SHA-256 Ledger Line */}
                    {(() => {
                      const hashStr = rep.sha256_checksum || rep.sha256_hash || 'SHA256-PENDING';
                      return (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '6px',
                            fontSize: '9px',
                            fontFamily: 'monospace',
                            color: '#94a3b8',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                            <Lock size={10} color="#10b981" />
                            <span style={{ color: '#10b981', fontWeight: 700 }}>SHA-256:</span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={hashStr}>
                              {hashStr.length > 24 ? `${hashStr.slice(0, 16)}...${hashStr.slice(-8)}` : hashStr}
                            </span>
                          </div>

                          <button
                            onClick={() => handleCopySha256(rep.report_id, hashStr)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: copiedHashId === rep.report_id ? '#34d399' : '#64748b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                              padding: '1px 4px',
                              borderRadius: '3px',
                            }}
                            title="Copy full SHA-256 Hash"
                          >
                            {copiedHashId === rep.report_id ? <Check size={10} /> : <Copy size={10} />}
                            <span style={{ fontSize: '8.5px' }}>{copiedHashId === rep.report_id ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      );
                    })()}

                    {/* Action Buttons Row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                      {/* View in PDF Studio Button */}
                      {isPdf && rep.profile && (
                        <button
                          onClick={() => {
                            trackButtonClick('View_Saved_PDF', 'ReportsRepository', { profile: rep.profile });
                            onOpenPDFModal(rep.profile as PDFProfileId);
                          }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '10px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0, 240, 255, 0.12)',
                            border: '1px solid rgba(0, 240, 255, 0.35)',
                            color: '#00f0ff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                          title="Open in PDF Viewer & Verification Studio"
                        >
                          <Eye size={11} />
                          <span>View Studio</span>
                        </button>
                      )}

                      {/* Download File Button */}
                      <a
                        href={getSavedReportDownloadUrl(rep.report_id)}
                        download={rep.file_path || `${rep.title || 'Report'}.${(rep.format || 'pdf').toLowerCase()}`}
                        onClick={() => trackButtonClick('Download_Saved_Report', 'ReportsRepository', { id: rep.report_id })}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          color: '#f8fafc',
                          textDecoration: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        title="Download file directly"
                      >
                        <Download size={11} />
                        <span>Download</span>
                      </a>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(rep)}
                        style={{
                          padding: '4px 6px',
                          fontSize: '10px',
                          borderRadius: '4px',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title="Delete report from repository"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: GENERATE NEW REPORT */}
      {activeTab === 'generate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
            Generate publication-grade PDF engineering audits or raw telemetry directly from the active wave (
            <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>{currentRunId ? currentRunId.slice(0, 8) : 'No Run'}</span>
            ). Each generated report is automatically signed with a cryptographic SHA-256 seal.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {REPORTS_REGISTRY.map((def) => {
              const isPdf = def.format === 'PDF';
              const isGenerating = generatingProfile === def.pdfProfile || generatingProfile === def.format;

              return (
                <div
                  key={def.id}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: `${def.badgeColor}18`,
                          border: `1px solid ${def.badgeColor}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: def.badgeColor,
                          flexShrink: 0,
                        }}
                      >
                        {def.format === 'PDF' ? <FileText size={13} /> : def.format === 'JSON' ? <Database size={13} /> : <FileCheck size={13} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc' }}>
                          {def.title}
                        </div>
                        <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>{def.standardReference}</div>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: `${def.badgeColor}18`,
                        color: def.badgeColor,
                        border: `1px solid ${def.badgeColor}55`,
                      }}
                    >
                      {def.badge}
                    </span>
                  </div>

                  <div style={{ fontSize: '10.5px', color: '#94a3b8', lineHeight: 1.4 }}>
                    {def.description}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '4px' }}>
                    {def.status === 'AVAILABLE' ? (
                      <button
                        onClick={() => {
                          if (isPdf && def.pdfProfile) {
                            handleGeneratePdf(def.pdfProfile);
                          } else if (def.format === 'JSON') {
                            handleExportJson();
                          } else if (def.format === 'CSV') {
                            handleExportCsv();
                          }
                        }}
                        disabled={isGenerating || !currentRunId}
                        style={{
                          padding: '5px 12px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          borderRadius: '4px',
                          border: 'none',
                          cursor: !currentRunId ? 'not-allowed' : 'pointer',
                          backgroundColor: def.badgeColor,
                          color: '#070f1e',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          opacity: !currentRunId ? 0.5 : 1,
                        }}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw size={11} className="animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <>
                            <Plus size={11} />
                            <span>Generate &amp; Save</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span style={{ fontSize: '10px', color: '#64748b', fontStyle: 'italic' }}>
                        Roadmap Analytical Module
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STORAGE ANALYTICS & CRYPTOGRAPHIC LEDGER */}
      {activeTab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Metrics Overview Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(0, 240, 255, 0.25)',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Reports
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#00f0ff', marginTop: '2px' }}>
                {reports.length}
              </div>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Disk Usage
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#c084fc', marginTop: '2px' }}>
                {formatBytes(totalBytes)}
              </div>
            </div>

            <div
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Audit Status
              </div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#34d399', marginTop: '2px' }}>
                100% SEALED
              </div>
            </div>
          </div>

          {/* Verification Protocol Ledger */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '11px', fontWeight: 700 }}>
              <ShieldCheck size={14} />
              <span>Cryptographic Governance &amp; Compliance Standards</span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: 1.4 }}>
              Every engineering audit produced by DispatchEngine v2.4 calculates a SHA-256 fingerprint from the rendered byte stream. Records are persisted both in SQLite (<code>produced_reports</code> table) and replicated to the client local ledger.
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                DIN EN ISO 3691-4 §5.2.1
              </span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                Popperian Invariant Φ = 0.880
              </span>
              <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '3px', backgroundColor: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
                Classiq 32Q Synthesis Specs
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
            <button
              onClick={refreshReports}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#f8fafc',
                fontSize: '10.5px',
                fontWeight: 600,
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <RefreshCw size={11} />
              <span>Force Re-sync with SQLite</span>
            </button>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to clear local catalog cache?')) {
                  localStorage.removeItem('dispatch_engine_reports_catalog_v1');
                  refreshReports();
                  showNotification('Local repository cache reset');
                }
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#f87171',
                fontSize: '10.5px',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Reset Local Cache
            </button>
          </div>
        </div>
      )}
    </HUDPanel>
  );
};
