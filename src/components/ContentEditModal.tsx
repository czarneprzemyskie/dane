import React, { useState, useEffect } from 'react';
import { useAdmin } from '../lib/adminContext';
import { updateContentItem, publishContent, submitForReview } from '../lib/content';
import type { ContentItem, ContentStatus, ElementType } from '../lib/content';
import { sanitizeContent } from '../lib/sanitize';
import { X, Eye, Save, Send, Loader2 } from 'lucide-react';

interface ContentEditModalProps {
  item: ContentItem;
  onClose: () => void;
  onSave: () => void;
}

const ELEMENT_TYPES: { value: ElementType; label: string }[] = [
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

const STATUS_OPTIONS: { value: ContentStatus | 'no_change'; label: string }[] = [
  { value: 'no_change', label: 'Bez zmian (pozostaw szkic)' },
  { value: 'draft', label: 'Szkic' },
  { value: 'pending_review', label: 'Wyślij do przeglądu' },
  { value: 'published', label: 'Opublikuj' },
];

export default function ContentEditModal({ item, onClose, onSave }: ContentEditModalProps) {
  const { adminUser } = useAdmin();
  const [content, setContent] = useState(item.content);
  const [elementType, setElementType] = useState<ElementType>(item.element_type);
  const [status, setStatus] = useState<'no_change' | ContentStatus>('no_change');
  const [isHtml, setIsHtml] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSave = async (targetStatus?: ContentStatus) => {
    if (!adminUser) return;
    setIsSaving(true);
    setError(null);

    try {
      // Sanitize content if it's HTML
      let finalContent = content;
      if (isHtml) {
        finalContent = sanitizeContent(content);
      }

      // Update the content
      await updateContentItem(item.id, finalContent, adminUser.id);

      // Handle status changes
      if (targetStatus === 'published') {
        await publishContent(item.id, adminUser.id);
      } else if (targetStatus === 'pending_review') {
        await submitForReview(item.id, adminUser.id);
      }

      onSave();
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Nie udało się zapisać treści. Spróbuj ponownie.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="content-edit-modal">
        <div className="modal-header">
          <h2 className="modal-title">Edytuj treść</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-info">
          <span className="modal-info-item">
            <strong>Strona:</strong> {item.page_key}
          </span>
          <span className="modal-info-item">
            <strong>Sekcja:</strong> {item.section_key}
          </span>
          <span className="modal-info-item">
            <strong>Wersja:</strong> {item.version}
          </span>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="edit-options">
            <div className="option-group">
              <label htmlFor="elementType">Typ elementu:</label>
              <select
                id="elementType"
                value={elementType}
                onChange={(e) => setElementType(e.target.value as ElementType)}
                className="filter-select"
              >
                {ELEMENT_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="option-group html-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={isHtml}
                  onChange={(e) => setIsHtml(e.target.checked)}
                />
                <span>Tryb HTML</span>
              </label>
            </div>

            <button
              className="btn btn-ghost preview-toggle"
              onClick={() => setShowPreview(!showPreview)}
            >
              <Eye size={16} />
              {showPreview ? 'Edytuj' : 'Podgląd'}
            </button>
          </div>

          {showPreview ? (
            <div 
              className="content-preview-mode"
              dangerouslySetInnerHTML={{ __html: isHtml ? sanitizeContent(content) : content }}
            />
          ) : (
            <textarea
              className="content-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isHtml ? '<p>Wpisz treść HTML...</p>' : 'Wpisz treść...'}
              rows={10}
            />
          )}

          <div className="status-selector">
            <label>Po zapisie:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContentStatus | 'no_change')}
              className="filter-select"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Anuluj
          </button>
          
          <div className="action-group">
            <button
              className="btn btn-primary"
              onClick={() => handleSave('draft')}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <Save size={16} />
                  Zapisz jako szkic
                </>
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => handleSave('pending_review')}
              disabled={isSaving}
            >
              <Send size={16} />
              Wyślij do przeglądu
            </button>

            <button
              className="btn btn-success"
              onClick={() => handleSave('published')}
              disabled={isSaving}
            >
              <Eye size={16} />
              Opublikuj
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
