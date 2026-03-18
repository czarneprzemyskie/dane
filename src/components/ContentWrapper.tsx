import React, { useState, useEffect, useCallback } from 'react';
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

export interface ContentWrapperProps {
  pageKey: string;
  sectionKey: string;
  elementType: ElementType;
  defaultContent: string;
  className?: string;
  children?: React.ReactNode;
  autoSave?: boolean;
  showStatus?: boolean;
  onContentUpdate?: (content: ContentItem) => void;
}

// Status badge configuration
const statusConfig: Record<ContentStatus, { color: string; label: string }> = {
  draft: { color: '#f59e0b', label: 'Draft' },
  pending_review: { color: '#8b5cf6', label: 'Pending Review' },
  published: { color: '#10b981', label: 'Published' },
  archived: { color: '#6b7280', label: 'Archived' }
};

export const ContentWrapper: React.FC<ContentWrapperProps> = ({
  pageKey,
  sectionKey,
  elementType,
  defaultContent,
  className = '',
  children,
  autoSave = false,
  showStatus = true,
  onContentUpdate
}) => {
  const { isAdmin, adminUser, isLoading: adminLoading } = useAdmin();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Fetch content on mount
  useEffect(() => {
    const fetchContent = async () => {
      if (adminLoading) return;
      
      try {
        setIsLoading(true);
        const fetchedContent = await getContentByKeys(pageKey, sectionKey);
        setContent(fetchedContent);
        if (fetchedContent) {
          setEditValue(fetchedContent.content);
        } else {
          setEditValue(defaultContent);
        }
      } catch (err) {
        console.error('Error fetching content:', err);
        setError('Failed to load content');
        setEditValue(defaultContent);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [pageKey, sectionKey, defaultContent, adminLoading]);

  // Auto-save on blur if enabled
  const handleBlur = useCallback(() => {
    if (autoSave && isEditing && !isSaving) {
      handleSave();
    }
  }, [autoSave, isEditing, isSaving]);

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
          element_type: elementType,
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
      setError('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, adminUser, content, editValue, pageKey, sectionKey, elementType, onContentUpdate]);

  const handlePublish = useCallback(async () => {
    if (!isAdmin || !adminUser || !content) return;

    try {
      const published = await publishContent(content.id, adminUser.id);
      setContent(published);
      onContentUpdate?.(published);
    } catch (err) {
      console.error('Error publishing content:', err);
      setError('Failed to publish content');
    }
  }, [isAdmin, adminUser, content, onContentUpdate]);

  // Render content based on element type
  const renderContent = (contentText: string) => {
    switch (elementType) {
      case 'h1':
        return <h1 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'h2':
        return <h2 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'h3':
        return <h3 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'h4':
        return <h4 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'h5':
        return <h5 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'h6':
        return <h6 className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'p':
        return <p className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'li':
        return <li className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'blockquote':
        return <blockquote className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'span':
        return <span className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      case 'div':
        return <div className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
      default:
        return <p className={className} dangerouslySetInnerHTML={{ __html: contentText }} />;
    }
  };

  const displayContent = content?.content || defaultContent;

  // Non-admin view
  if (!isAdmin || adminLoading) {
    if (children) {
      return <>{children}</>;
    }
    return <>{renderContent(displayContent)}</>;
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="content-wrapper loading">
        {renderContent(defaultContent)}
        <div className="content-wrapper-loader" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="content-wrapper error">
        {renderContent(defaultContent)}
        <span className="content-wrapper-error">{error}</span>
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div className={`content-wrapper editing ${className}`}>
        <textarea
          className="content-wrapper-textarea"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          rows={5}
          placeholder="Enter content..."
        />
        <div className="content-wrapper-actions">
          <button
            className="content-wrapper-btn save"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            className="content-wrapper-btn cancel"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Admin view mode
  const status = content?.status || 'draft';
  const statusInfo = statusConfig[status];

  return (
    <div 
      className={`content-wrapper ${className}`}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <div className="content-wrapper-content" onClick={handleEdit}>
        {renderContent(displayContent)}
        
        {/* Edit indicator */}
        <div className="content-wrapper-edit-indicator">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>

      {/* Status badge */}
      {showStatus && content && (
        <div 
          className="content-wrapper-status"
          style={{ backgroundColor: statusInfo.color }}
        >
          {statusInfo.label}
        </div>
      )}

      {/* Publish button */}
      {showControls && content && status !== 'published' && (
        <button
          className="content-wrapper-publish"
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

export default ContentWrapper;
