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

export interface EditableContentProps {
  pageKey: string;
  sectionKey: string;
  elementType: ElementType;
  defaultContent: string;
  className?: string;
  children?: React.ReactNode;
  editable?: boolean; // If true (default), admin can edit this content
}

// Status badge colors
const statusColors: Record<ContentStatus, string> = {
  draft: '#f59e0b',
  pending_review: '#8b5cf6',
  published: '#10b981',
  archived: '#6b7280'
};

// Status labels
const statusLabels: Record<ContentStatus, string> = {
  draft: 'Draft',
  pending_review: 'Pending',
  published: 'Published',
  archived: 'Archived'
};

export const EditableContent: React.FC<EditableContentProps> = ({
  pageKey,
  sectionKey,
  elementType,
  defaultContent,
  className = '',
  children,
  editable = true
}) => {
  const { isAdmin, adminUser, isLoading: adminLoading } = useAdmin();
  // If editable prop is explicitly true, allow editing
  const isEditable = editable === true;
  const [content, setContent] = useState<ContentItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Close edit mode when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (isEditing && !isSaving) {
          handleCancel();
        }
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
      // Sanitize content before saving
      const sanitizedContent = sanitizeContent(editValue);

      if (content) {
        // Update existing content
        const updated = await updateContentItem(content.id, sanitizedContent, adminUser.id);
        setContent(updated);
      } else {
        // Create new content item
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
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving content:', err);
      setError('Failed to save content');
    } finally {
      setIsSaving(false);
    }
  }, [isAdmin, adminUser, content, editValue, pageKey, sectionKey, elementType]);

  const handlePublish = useCallback(async () => {
    if (!isAdmin || !adminUser || !content) return;

    try {
      const published = await publishContent(content.id, adminUser.id);
      setContent(published);
    } catch (err) {
      console.error('Error publishing content:', err);
      setError('Failed to publish content');
    }
  }, [isAdmin, adminUser, content]);

  // Determine which content to display
  const displayContent = content?.content || defaultContent;

  // Render the appropriate element type
  const renderElement = (contentHtml: string) => {
    const commonProps = {
      className: className,
      dangerouslySetInnerHTML: { __html: contentHtml }
    };

    switch (elementType) {
      case 'h1':
        return <h1 {...commonProps} />;
      case 'h2':
        return <h2 {...commonProps} />;
      case 'h3':
        return <h3 {...commonProps} />;
      case 'h4':
        return <h4 {...commonProps} />;
      case 'h5':
        return <h5 {...commonProps} />;
      case 'h6':
        return <h6 {...commonProps} />;
      case 'p':
        return <p {...commonProps} />;
      case 'li':
        return <li {...commonProps} />;
      case 'blockquote':
        return <blockquote {...commonProps} />;
      case 'span':
        return <span {...commonProps} />;
      case 'div':
        return <div {...commonProps} />;
      default:
        return <p {...commonProps} />;
    }
  };

  // Don't show any indicators for non-admin users or non-editable content
  if (!isAdmin || adminLoading || !isEditable) {
    if (children) {
      return <>{children}</>;
    }
    return (
      <>
        {renderElement(displayContent)}
      </>
    );
  }

  // Don't show edit indicators if not editable
  if (!isEditable && isAdmin && !adminLoading) {
    return (
      <>
        {children ? children : renderElement(displayContent)}
      </>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="editable-content-wrapper loading">
        {renderElement(defaultContent)}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="editable-content-wrapper error">
        {renderElement(defaultContent)}
      </div>
    );
  }

  // Edit mode
  if (isEditing) {
    return (
      <div 
        ref={wrapperRef}
        className={`editable-content-wrapper editing ${className}`}
      >
        <div className="editable-content-edit-panel">
          <textarea
            ref={textareaRef}
            className="editable-content-textarea"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={4}
            placeholder="Enter content..."
          />
          <div className="editable-content-edit-actions">
            <button
              className="editable-content-btn save"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="editable-content-btn cancel"
              onClick={handleCancel}
              disabled={isSaving}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View mode (admin)
  return (
    <div 
      ref={wrapperRef}
      className={`editable-content-wrapper ${className}`}
      onMouseEnter={() => setShowStatus(true)}
      onMouseLeave={() => setShowStatus(false)}
    >
      <div 
        className="editable-content-inner"
        onClick={handleEdit}
      >
        {renderElement(displayContent)}
        
        {/* Edit indicator overlay */}
        <div className="editable-content-indicator">
          <svg 
            className="edit-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </div>
      </div>

      {/* Status badge */}
      {showStatus && content && (
        <div 
          className="editable-content-status"
          style={{ 
            backgroundColor: statusColors[content.status],
            color: '#fff'
          }}
        >
          {statusLabels[content.status]}
        </div>
      )}

      {/* Quick publish button */}
      {showStatus && content && content.status !== 'published' && (
        <button
          className="editable-content-publish-btn"
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

export default EditableContent;
