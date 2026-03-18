import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAdmin } from '../lib/adminContext';
import { 
  getContentByKeys, 
  createContentItem, 
  updateContentItem,
  publishContent,
  type ContentItem,
  type ContentStatus,
  type ElementType 
} from '../lib/content';
import { sanitizeContent } from '../lib/sanitize';

export interface EditableTextProps {
  pageKey: string;
  sectionKey: string;
  elementType?: 'span' | 'p' | 'small' | 'strong' | 'em';
  defaultContent: string;
  className?: string;
  autoSave?: boolean;
  onContentUpdate?: (content: ContentItem) => void;
}

// Status badge colors
const statusColors: Record<ContentStatus, string> = {
  draft: '#f59e0b',
  pending_review: '#8b5cf6',
  published: '#10b981',
  archived: '#6b7280'
};

export const EditableText: React.FC<EditableTextProps> = ({
  pageKey,
  sectionKey,
  elementType = 'span',
  defaultContent,
  className = '',
  autoSave = false,
  onContentUpdate
}) => {
  const { isAdmin, adminUser, isLoading: adminLoading } = useAdmin();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch content on mount
  useEffect(() => {
    const fetchContent = async () => {
      if (adminLoading) return;
      
      try {
        setIsLoading(true);
        const fetchedContent = await getContentByKeys(pageKey, sectionKey);
        setContent(fetchedContent);
        setEditValue(fetchedContent?.content || defaultContent);
      } catch (err) {
        console.error('Error fetching content:', err);
        setEditValue(defaultContent);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [pageKey, sectionKey, defaultContent, adminLoading]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close edit mode on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.editable-text-wrapper') && isEditing && !isSaving) {
        handleCancel();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, isSaving]);

  const handleEdit = useCallback(() => {
    if (!isAdmin) return;
    setIsEditing(true);
    setEditValue(content?.content || defaultContent);
  }, [isAdmin, content, defaultContent]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(content?.content || defaultContent);
  }, [content, defaultContent]);

  const handleSave = useCallback(async () => {
    if (!isAdmin || !adminUser) return;

    setIsSaving(true);
    try {
      const sanitizedContent = sanitizeContent(editValue);

      if (content) {
        const updated = await updateContentItem(content.id, sanitizedContent, adminUser.id);
        setContent(updated);
        onContentUpdate?.(updated);
      } else {
        const newContent = await createContentItem({
          page_key: pageKey,
          section_key: sectionKey,
          element_type: elementType as ElementType,
          content: sanitizedContent,
          status: 'draft',
          updated_by: adminUser.id,
          is_static: false
        });
        setContent(newContent);
        onContentUpdate?.(newContent);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving content:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, adminUser, content, editValue, pageKey, sectionKey, elementType, onContentUpdate]);

  const handleBlur = useCallback(() => {
    if (autoSave && isEditing && !isSaving) {
      handleSave();
    }
  }, [autoSave, isEditing, isSaving, handleSave]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handlePublish = useCallback(async () => {
    if (!isAdmin || !adminUser || !content) return;

    try {
      const published = await publishContent(content.id, adminUser.id);
      setContent(published);
      onContentUpdate?.(published);
    } catch (err) {
      console.error('Error publishing content:', err);
    }
  }, [isAdmin, adminUser, content, onContentUpdate]);

  const displayContent = content?.content || defaultContent;

  // Non-admin view - just render the text
  if (!isAdmin || adminLoading) {
    switch (elementType) {
      case 'p':
        return <p className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
      case 'small':
        return <small className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
      case 'strong':
        return <strong className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
      case 'em':
        return <em className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
      case 'span':
      default:
        return <span className={className} dangerouslySetInnerHTML={{ __html: displayContent }} />;
    }
  }

  // Loading state
  if (isLoading) {
    switch (elementType) {
      case 'p':
        return <p className={className}>{defaultContent}</p>;
      case 'small':
        return <small className={className}>{defaultContent}</small>;
      case 'strong':
        return <strong className={className}>{defaultContent}</strong>;
      case 'em':
        return <em className={className}>{defaultContent}</em>;
      case 'span':
      default:
        return <span className={className}>{defaultContent}</span>;
    }
  }

  // Edit mode - show input
  if (isEditing) {
    return (
      <div className="editable-text-wrapper editing">
        <input
          ref={inputRef}
          type="text"
          className="editable-text-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
        />
        <div className="editable-text-actions">
          <button
            className="editable-text-btn save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? '...' : '✓'}
          </button>
          <button
            className="editable-text-btn cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Admin view mode with edit indicator
  const status = content?.status || 'draft';

  return (
    <div 
      className={`editable-text-wrapper ${className}`}
      onMouseEnter={() => setShowIndicator(true)}
      onMouseLeave={() => setShowIndicator(false)}
    >
      <span 
        className="editable-text-content"
        onClick={handleEdit}
      >
        {elementType === 'p' && <p dangerouslySetInnerHTML={{ __html: displayContent }} />}
        {elementType === 'small' && <small dangerouslySetInnerHTML={{ __html: displayContent }} />}
        {elementType === 'strong' && <strong dangerouslySetInnerHTML={{ __html: displayContent }} />}
        {elementType === 'em' && <em dangerouslySetInnerHTML={{ __html: displayContent }} />}
        {(elementType === 'span' || !elementType) && <span dangerouslySetInnerHTML={{ __html: displayContent }} />}
      </span>

      {/* Edit indicator */}
      {showIndicator && (
        <div className="editable-text-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      )}

      {/* Status dot */}
      {content && (
        <div 
          className="editable-text-status-dot"
          style={{ backgroundColor: statusColors[status] }}
          title={status}
        />
      )}

      {/* Quick publish */}
      {showIndicator && status !== 'published' && (
        <button
          className="editable-text-publish"
          onClick={(e) => {
            e.stopPropagation();
            handlePublish();
          }}
        >
          Publish
        </button>
      )}
    </div>
  );
};

export default EditableText;
