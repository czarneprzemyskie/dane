import React, { useState, useEffect } from 'react';
import { useAdmin } from '../lib/adminContext';
import { getContentHistory, getContentVersions, restoreVersion } from '../lib/content';
import type { ContentItem, ContentAuditLog, ContentVersion } from '../lib/content';
import { stripHtml } from '../lib/sanitize';
import { X, History, Clock, RotateCcw, Loader2, ArrowRightLeft, Eye } from 'lucide-react';

interface ContentHistoryPanelProps {
  item: ContentItem;
  onClose: () => void;
  onRestore: () => void;
}

type TabType = 'audit' | 'versions';

export default function ContentHistoryPanel({ item, onClose, onRestore }: ContentHistoryPanelProps) {
  const { adminUser } = useAdmin();
  const [activeTab, setActiveTab] = useState<TabType>('audit');
  const [auditLogs, setAuditLogs] = useState<ContentAuditLog[]>([]);
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<[string, string] | null>(null);
  const [diffView, setDiffView] = useState(false);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [logs, vers] = await Promise.all([
          getContentHistory(item.id),
          getContentVersions(item.id),
        ]);
        setAuditLogs(logs);
        setVersions(vers);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [item.id]);

  const handleRestore = async (version: ContentVersion) => {
    if (!adminUser) return;
    setRestoring(version.id);
    try {
      await restoreVersion(item.id, version.id, adminUser.id);
      onRestore();
    } catch (err) {
      console.error('Error restoring version:', err);
    } finally {
      setRestoring(null);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      create: 'Utworzono',
      update: 'Zaktualizowano',
      publish: 'Opublikowano',
      archive: 'Zarchiwizowano',
      restore: 'Przywrócono wersję',
      review_approve: 'Zatwierdzono do publikacji',
      review_reject: 'Odrzucono z przeglądu',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return '+';
      case 'update':
        return '✏️';
      case 'publish':
        return '👁';
      case 'archive':
        return '📦';
      case 'restore':
        return '↩️';
      case 'review_approve':
        return '✓';
      case 'review_reject':
        return '✗';
      default:
        return '•';
    }
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    const plainText = stripHtml(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  const handleVersionSelect = (versionId: string) => {
    if (selectedVersions === null) {
      setSelectedVersions([versionId, versionId]);
    } else if (selectedVersions[0] === versionId) {
      // If clicking the same version, deselect
      setSelectedVersions(null);
      setDiffView(false);
    } else {
      // Select two versions for comparison
      const v1 = versions.find(v => v.id === selectedVersions[0]);
      const v2 = versions.find(v => v.id === versionId);
      if (v1 && v2) {
        // Sort by version number
        const sorted = [v1, v2].sort((a, b) => a.version - b.version);
        setSelectedVersions([sorted[0].id, sorted[1].id]);
        setDiffView(true);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="history-panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <History size={20} />
            Historia zmian
          </h2>
          <button className="panel-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="panel-info">
          <span><strong>Strona:</strong> {item.page_key}</span>
          <span><strong>Sekcja:</strong> {item.section_key}</span>
        </div>

        <div className="panel-tabs">
          <button
            className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <Clock size={16} />
            Dziennik audytu
          </button>
          <button
            className={`tab-btn ${activeTab === 'versions' ? 'active' : ''}`}
            onClick={() => setActiveTab('versions')}
          >
            <History size={16} />
            Wersje
          </button>
        </div>

        <div className="panel-body">
          {isLoading ? (
            <div className="loading-state">
              <Loader2 className="animate-spin" size={24} />
              <p>Ładowanie historii...</p>
            </div>
          ) : activeTab === 'audit' ? (
            <div className="audit-log">
              {auditLogs.length === 0 ? (
                <div className="empty-state">
                  <p>Brak wpisów w dzienniku audytu</p>
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="audit-entry">
                    <div className="audit-entry-header">
                      <span className="audit-action-icon">{getActionIcon(log.action)}</span>
                      <span className="audit-action">{getActionLabel(log.action)}</span>
                      <span className="audit-date">{formatDate(log.performed_at)}</span>
                    </div>
                    {log.performed_by && (
                      <div className="audit-user">
                        Użytkownik: {log.performed_by.substring(0, 8)}...
                      </div>
                    )}
                    {(log.old_content || log.new_content) && (
                      <div className="audit-changes">
                        {log.old_content && log.new_content && log.action === 'update' ? (
                          <div className="change-comparison">
                            <div className="change-old">
                              <span className="change-label">Przed:</span>
                              <span className="change-content">{truncateContent(log.old_content, 100)}</span>
                            </div>
                            <ArrowRightLeft size={14} className="change-arrow" />
                            <div className="change-new">
                              <span className="change-label">Po:</span>
                              <span className="change-content">{truncateContent(log.new_content, 100)}</span>
                            </div>
                          </div>
                        ) : (
                          log.new_content && (
                            <div className="change-new">
                              <span className="change-label">Treść:</span>
                              <span className="change-content">{truncateContent(log.new_content, 100)}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="versions-list">
              {versions.length === 0 ? (
                <div className="empty-state">
                  <p>Brak zapisanych wersji</p>
                </div>
              ) : (
                <>
                  {selectedVersions && selectedVersions[0] !== selectedVersions[1] && diffView && (
                    <div className="diff-view">
                      <div className="diff-header">
                        <span>Porównanie wersji</span>
                        <button 
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setDiffView(false);
                            setSelectedVersions(null);
                          }}
                        >
                          Zamknij porównanie
                        </button>
                      </div>
                      {(() => {
                        const v1 = versions.find(v => v.id === selectedVersions[0]);
                        const v2 = versions.find(v => v.id === selectedVersions[1]);
                        if (!v1 || !v2) return null;
                        return (
                          <div className="diff-content">
                            <div className="diff-version diff-old">
                              <div className="diff-version-header">
                                Wersja {v1.version} ({formatDate(v1.created_at)})
                              </div>
                              <div className="diff-version-content">
                                {truncateContent(v1.content, 500)}
                              </div>
                            </div>
                            <div className="diff-version diff-new">
                              <div className="diff-version-header">
                                Wersja {v2.version} ({formatDate(v2.created_at)})
                              </div>
                              <div className="diff-version-content">
                                {truncateContent(v2.content, 500)}
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {versions.map((version) => (
                    <div 
                      key={version.id} 
                      className={`version-entry ${selectedVersions?.includes(version.id) ? 'selected' : ''}`}
                    >
                      <div className="version-entry-header">
                        <input
                          type="checkbox"
                          checked={selectedVersions?.includes(version.id) || false}
                          onChange={() => handleVersionSelect(version.id)}
                        />
                        <span className="version-number">Wersja {version.version}</span>
                        <span className="version-date">{formatDate(version.created_at)}</span>
                        {version.created_by && (
                          <span className="version-user">
                            {version.created_by.substring(0, 8)}...
                          </span>
                        )}
                      </div>
                      <div className="version-content-preview">
                        {truncateContent(version.content, 120)}
                      </div>
                      <div className="version-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            // Show full content in a preview (simple implementation)
                            alert(`Treść wersji ${version.version}:\n\n${version.content}`);
                          }}
                        >
                          <Eye size={14} />
                          Podgląd
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => handleRestore(version)}
                          disabled={restoring === version.id}
                        >
                          {restoring === version.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <>
                              <RotateCcw size={14} />
                              Przywróć
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        <div className="panel-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Zamknij
          </button>
        </div>
      </div>
    </div>
  );
}
