import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAdmin } from '../lib/adminContext';
import {
  getAllContentItems,
  publishContent,
  archiveContent,
  deleteContent,
} from '../lib/content';
import { seedAllContent } from '../lib/seedContent';
import type { ContentItem, ContentStatus, ElementType } from '../lib/content';
import { stripHtml } from '../lib/sanitize';
import ContentEditModal from './ContentEditModal';
import ContentHistoryPanel from './ContentHistoryPanel';
import ContentStats from './ContentStats';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Edit2,
  Eye,
  Archive,
  Trash2,
  History,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Database,
} from 'lucide-react';

// Sort field type
type SortField = 'page_key' | 'section_key' | 'status' | 'updated_at' | 'element_type';
type SortDirection = 'asc' | 'desc';

// Status options
const STATUS_OPTIONS: { value: ContentStatus | ''; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  { value: 'draft', label: 'Szkic' },
  { value: 'pending_review', label: 'Oczekuje na przegląd' },
  { value: 'published', label: 'Opublikowany' },
  { value: 'archived', label: 'Zarchiwizowany' },
];

// Element type options
const ELEMENT_TYPE_OPTIONS: { value: ElementType | ''; label: string }[] = [
  { value: '', label: 'Wszystkie' },
  { value: 'h1', label: 'Nagłówek H1' },
  { value: 'h2', label: 'Nagłówek H2' },
  { value: 'h3', label: 'Nagłówek H3' },
  { value: 'h4', label: 'Nagłówek H4' },
  { value: 'h5', label: 'Nagłówek H5' },
  { value: 'h6', label: 'Nagłówek H6' },
  { value: 'p', label: 'Paragraf' },
  { value: 'li', label: 'Element listy' },
  { value: 'blockquote', label: 'Cytat' },
  { value: 'span', label: 'Span' },
  { value: 'div', label: 'Div' },
];

// Get unique page keys from content
function getUniquePages(items: ContentItem[]): string[] {
  const pages = new Set(items.map((item) => item.page_key));
  return Array.from(pages).sort();
}

// Status badge component
function StatusBadge({ status }: { status: ContentStatus }) {
  const statusClasses: Record<ContentStatus, string> = {
    draft: 'status-draft',
    pending_review: 'status-pending',
    published: 'status-published',
    archived: 'status-archived',
  };

  const statusLabels: Record<ContentStatus, string> = {
    draft: 'Szkic',
    pending_review: 'Oczekuje',
    published: 'Opublikowany',
    archived: 'Zarchiwizowany',
  };

  return (
    <span className={`status-badge ${statusClasses[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

// Element type badge
function ElementTypeBadge({ type }: { type: ElementType }) {
  return (
    <span className="element-type-badge">
      {type}
    </span>
  );
}

// Confirm dialog component
function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Potwierdź',
  cancelText = 'Anuluj',
  danger = false,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="confirm-dialog">
        <h3 className="confirm-dialog-title">{title}</h3>
        <p className="confirm-dialog-message">{message}</p>
        <div className="confirm-dialog-actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminContentDashboard() {
  const { adminUser } = useAdmin();
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContentStatus | ''>('');
  const [pageFilter, setPageFilter] = useState<string>('');
  const [elementTypeFilter, setElementTypeFilter] = useState<ElementType | ''>('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('updated_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal states
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [historyItem, setHistoryItem] = useState<ContentItem | null>(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    danger?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Loading states for actions
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ success: boolean; created: number; skipped: number; errors: string[] } | null>(null);

  // Fetch content items
  const fetchContent = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const items = await getAllContentItems();
      setContentItems(items);
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Nie udało się pobrać treści. Spróbuj ponownie.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle seed content
  const handleSeedContent = useCallback(async () => {
    try {
      setIsSeeding(true);
      setSeedResult(null);
      const result = await seedAllContent();
      setSeedResult(result);
      // Refresh content after seeding
      await fetchContent();
    } catch (err) {
      console.error('Error seeding content:', err);
      setSeedResult({
        success: false,
        created: 0,
        skipped: 0,
        errors: [err instanceof Error ? err.message : 'Unknown error'],
      });
    } finally {
      setIsSeeding(false);
    }
  }, [fetchContent]);

  // Show toast notification when seed result changes
  useEffect(() => {
    if (seedResult) {
      const message = seedResult.success
        ? `Utworzono ${seedResult.created} wpisów, pominięto ${seedResult.skipped} istniejących`
        : `Błąd podczas dodawania treści: ${seedResult.errors.join(', ')}`;
      
      // Use console for now - could integrate with toast system
      console.log(message);
      alert(message);
      
      // Clear result after showing
      setSeedResult(null);
    }
  }, [seedResult]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Get unique pages for filter
  const uniquePages = useMemo(() => getUniquePages(contentItems), [contentItems]);

  // Apply filters and sorting
  useEffect(() => {
    let items = [...contentItems];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.page_key.toLowerCase().includes(query) ||
          item.section_key.toLowerCase().includes(query) ||
          stripHtml(item.content).toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      items = items.filter((item) => item.status === statusFilter);
    }

    // Apply page filter
    if (pageFilter) {
      items = items.filter((item) => item.page_key === pageFilter);
    }

    // Apply element type filter
    if (elementTypeFilter) {
      items = items.filter((item) => item.element_type === elementTypeFilter);
    }

    // Apply sorting
    items.sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      switch (sortField) {
        case 'page_key':
          aVal = a.page_key;
          bVal = b.page_key;
          break;
        case 'section_key':
          aVal = a.section_key;
          bVal = b.section_key;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'updated_at':
          aVal = a.updated_at;
          bVal = b.updated_at;
          break;
        case 'element_type':
          aVal = a.element_type;
          bVal = b.element_type;
          break;
      }

      const comparison = aVal.localeCompare(bVal);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    setFilteredItems(items);
    setCurrentPage(1); // Reset to first page when filters change
  }, [contentItems, searchQuery, statusFilter, pageFilter, elementTypeFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedItems.map((item) => item.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Action handlers
  const handlePublish = async (item: ContentItem) => {
    if (!adminUser) return;
    setActionLoading((prev) => new Set(prev).add(item.id));
    try {
      await publishContent(item.id, adminUser.id);
      await fetchContent();
    } catch (err) {
      console.error('Error publishing:', err);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleArchive = async (item: ContentItem) => {
    if (!adminUser) return;
    setActionLoading((prev) => new Set(prev).add(item.id));
    try {
      await archiveContent(item.id, adminUser.id);
      await fetchContent();
    } catch (err) {
      console.error('Error archiving:', err);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDelete = (item: ContentItem) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Usuń treść',
      message: `Czy na pewno chcesz usunąć treść "${item.section_key}" ze strony "${item.page_key}"? Ta operacja jest nieodwracalna.`,
      danger: true,
      onConfirm: async () => {
        if (!adminUser) return;
        setActionLoading((prev) => new Set(prev).add(item.id));
        try {
          await deleteContent(item.id);
          await fetchContent();
        } catch (err) {
          console.error('Error deleting:', err);
        } finally {
          setActionLoading((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // Bulk actions
  const handleBulkPublish = async () => {
    if (!adminUser || selectedIds.size === 0) return;
    setActionLoading((prev) => new Set(prev).add('bulk-publish'));
    try {
      for (const id of selectedIds) {
        const item = contentItems.find((i) => i.id === id);
        if (item && item.status !== 'published') {
          await publishContent(id, adminUser.id);
        }
      }
      await fetchContent();
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error bulk publishing:', err);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete('bulk-publish');
        return next;
      });
    }
  };

  const handleBulkArchive = async () => {
    if (!adminUser || selectedIds.size === 0) return;
    setActionLoading((prev) => new Set(prev).add('bulk-archive'));
    try {
      for (const id of selectedIds) {
        const item = contentItems.find((i) => i.id === id);
        if (item && item.status !== 'archived') {
          await archiveContent(id, adminUser.id);
        }
      }
      await fetchContent();
      setSelectedIds(new Set());
    } catch (err) {
      console.error('Error bulk archiving:', err);
    } finally {
      setActionLoading((prev) => {
        const next = new Set(prev);
        next.delete('bulk-archive');
        return next;
      });
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Usuń zaznaczone',
      message: `Czy na pewno chcesz usunąć ${selectedIds.size} elementów? Ta operacja jest nieodwracalna.`,
      danger: true,
      onConfirm: async () => {
        if (!adminUser) return;
        setActionLoading((prev) => new Set(prev).add('bulk-delete'));
        try {
          for (const id of selectedIds) {
            await deleteContent(id);
          }
          await fetchContent();
          setSelectedIds(new Set());
        } catch (err) {
          console.error('Error bulk deleting:', err);
        } finally {
          setActionLoading((prev) => {
            const next = new Set(prev);
            next.delete('bulk-delete');
            return next;
          });
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  // Format date
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

  // Truncate content for preview
  const truncateContent = (content: string, maxLength: number = 100) => {
    const plainText = stripHtml(content);
    if (plainText.length <= maxLength) return plainText;
    return plainText.substring(0, maxLength) + '...';
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  if (isLoading) {
    return (
      <div className="dashboard-loading">
        <Loader2 className="animate-spin" size={32} />
        <p>Ładowanie treści...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchContent}>
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="admin-content-dashboard">
      <ContentStats items={contentItems} />

      <div className="dashboard-toolbar">
        <div className="search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Szukaj treści..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <div className="filter-item">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContentStatus | '')}
              className="filter-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select
              value={pageFilter}
              onChange={(e) => setPageFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">Wszystkie strony</option>
              {uniquePages.map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <select
              value={elementTypeFilter}
              onChange={(e) => setElementTypeFilter(e.target.value as ElementType | '')}
              className="filter-select"
            >
              {ELEMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="toolbar-actions">
          <button
            className="btn btn-secondary"
            onClick={handleSeedContent}
            disabled={isSeeding}
            title="Dodaj przykładową treść do bazy danych"
          >
            {isSeeding ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Database size={16} />
            )}
            <span className="btn-text">Seeded Content</span>
          </button>
        </div>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bulk-actions-toolbar">
          <span className="selection-count">
            <Check size={16} />
            {selectedIds.size} zaznaczonych
          </span>
          <div className="bulk-actions">
            <button
              className="btn btn-sm btn-primary"
              onClick={handleBulkPublish}
              disabled={actionLoading.has('bulk-publish')}
            >
              <Eye size={14} />
              Opublikuj
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={handleBulkArchive}
              disabled={actionLoading.has('bulk-archive')}
            >
              <Archive size={14} />
              Archiwizuj
            </button>
            <button
              className="btn btn-sm btn-danger"
              onClick={handleBulkDelete}
              disabled={actionLoading.has('bulk-delete')}
            >
              <Trash2 size={14} />
              Usuń
            </button>
            <button
              className="btn btn-sm btn-ghost"
              onClick={clearSelection}
            >
              <X size={14} />
              Wyczyść
            </button>
          </div>
        </div>
      )}

      {/* Content Table */}
      <div className="content-table-container">
        <table className="content-table">
          <thead>
            <tr>
              <th className="th-checkbox">
                <input
                  type="checkbox"
                  checked={selectedIds.size === paginatedItems.length && paginatedItems.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="th-sortable" onClick={() => handleSort('page_key')}>
                Strona / Sekcja
                {renderSortIcon('page_key')}
              </th>
              <th>Podgląd treści</th>
              <th className="th-sortable" onClick={() => handleSort('element_type')}>
                Typ
                {renderSortIcon('element_type')}
              </th>
              <th className="th-sortable" onClick={() => handleSort('status')}>
                Status
                {renderSortIcon('status')}
              </th>
              <th className="th-sortable" onClick={() => handleSort('updated_at')}>
                Ostatnia aktualizacja
                {renderSortIcon('updated_at')}
              </th>
              <th className="th-actions">Akcje</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  {searchQuery || statusFilter || pageFilter || elementTypeFilter
                    ? 'Brak wyników dla wybranych filtrów'
                    : 'Brak treści do wyświetlenia'}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr
                  key={item.id}
                  className={selectedIds.has(item.id) ? 'row-selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td>
                    <div className="page-section-cell">
                      <span className="page-key">{item.page_key}</span>
                      <span className="section-key">{item.section_key}</span>
                    </div>
                  </td>
                  <td>
                    <span className="content-preview" title={stripHtml(item.content)}>
                      {truncateContent(item.content)}
                    </span>
                  </td>
                  <td>
                    <ElementTypeBadge type={item.element_type} />
                  </td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="date-cell">
                    {formatDate(item.updated_at)}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => setEditingItem(item)}
                        title="Edytuj"
                        disabled={actionLoading.has(item.id)}
                      >
                        <Edit2 size={16} />
                      </button>
                      {item.status !== 'published' && (
                        <button
                          className="action-btn action-publish"
                          onClick={() => handlePublish(item)}
                          title="Opublikuj"
                          disabled={actionLoading.has(item.id)}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      {item.status !== 'archived' && (
                        <button
                          className="action-btn action-archive"
                          onClick={() => handleArchive(item)}
                          title="Archiwizuj"
                          disabled={actionLoading.has(item.id)}
                        >
                          <Archive size={16} />
                        </button>
                      )}
                      <button
                        className="action-btn action-history"
                        onClick={() => setHistoryItem(item)}
                        title="Historia"
                      >
                        <History size={16} />
                      </button>
                      <button
                        className="action-btn action-delete"
                        onClick={() => handleDelete(item)}
                        title="Usuń"
                        disabled={actionLoading.has(item.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft size={16} />
            Poprzednia
          </button>
          <span className="pagination-info">
            Strona {currentPage} z {totalPages}
          </span>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Następna
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Modals */}
      {editingItem && (
        <ContentEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSave={() => {
            setEditingItem(null);
            fetchContent();
          }}
        />
      )}

      {historyItem && (
        <ContentHistoryPanel
          item={historyItem}
          onClose={() => setHistoryItem(null)}
          onRestore={() => {
            setHistoryItem(null);
            fetchContent();
          }}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
        danger={confirmDialog.danger}
      />
    </div>
  );
}
