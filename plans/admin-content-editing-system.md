# Admin Content Editing System - Technical Specification

## Document Overview

This document provides a comprehensive technical specification for implementing an admin content editing system for the Czarne Przemyskie application. The system enables authenticated administrators to modify all static textual content displayed on any page of the application.

**Current Application State:**
- Uses Supabase Auth with email/password authentication
- Admin role support via `is_admin` boolean field in `profiles` table
- Basic Admin.tsx component exists (not exposed in navigation)
- Client-side state-based routing with Route type
- Static content is hardcoded in components: Home.tsx, History.tsx, Rejonizacja.tsx
- Uses Supabase for database and storage

---

## 1. Database Schema Design

### 1.1 Content Table (`content_items`)

The core table for storing editable static content.

```sql
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  element_type VARCHAR(20) NOT NULL DEFAULT 'p',
  content TEXT NOT NULL,
  content_html TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE(page_key, section_key)
);

CREATE INDEX idx_content_page_key ON content_items(page_key);
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_updated_at ON content_items(updated_at DESC);
```

**Field Descriptions:**
| Field | Type | Description |
|-------|------|-------------|
| `page_key` | VARCHAR(100) | Unique identifier for the page (e.g., 'home', 'history', 'rejonizacja') |
| `section_key` | VARCHAR(100) | Unique identifier for the section within a page (e.g., 'hero-title', 'intro-text') |
| `element_type` | VARCHAR(20) | HTML element type: h1, h2, h3, h4, h5, h6, p, li, blockquote |
| `content` | TEXT | Plain text content (sanitized) |
| `content_html` | TEXT | HTML content (if different from plain text) |
| `status` | VARCHAR(20) | Status: draft, pending_review, published, archived |
| `version` | INTEGER | Version number for optimistic locking |
| `created_by` | UUID | User who created the content item |
| `updated_by` | UUID | User who last updated the content |
| `published_at` | TIMESTAMPTZ | When content was published |
| `reviewed_by` | UUID | User who approved the content |
| `reviewed_at` | TIMESTAMPTZ | When content was reviewed/approved |
| `notes` | TEXT | Admin notes about changes |

### 1.2 Audit Log Table (`content_audit_log`)

Tracks all changes to content for accountability and rollback.

```sql
CREATE TABLE content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  action VARCHAR(20) NOT NULL,
  old_content TEXT,
  new_content TEXT,
  changed_by UUID NOT NULL REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB
);

CREATE INDEX idx_audit_content_item ON content_audit_log(content_item_id);
CREATE INDEX idx_audit_changed_at ON content_audit_log(changed_at DESC);
CREATE INDEX idx_audit_changed_by ON content_audit_log(changed_by);
```

**Action Types:**
- `create` - Initial content creation
- `update` - Content modification
- `publish` - Publishing draft content
- `archive` - Archiving content
- `restore` - Restoring from archive
- `review_approve` - Content approved by reviewer
- `review_reject` - Content rejected by reviewer

### 1.3 Content Version Table (`content_versions`)

Stores historical versions for rollback capability.

```sql
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_html TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  UNIQUE(content_item_id, version_number)
);

CREATE INDEX idx_versions_content_item ON content_versions(content_item_id, version_number DESC);
```

### 1.4 Row Level Security (RLS) Policies

```sql
-- Enable RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- Content items: Everyone can read published content
CREATE POLICY "Published content is viewable by everyone"
ON content_items FOR SELECT
USING (status = 'published');

-- Content items: Admins can read all content
CREATE POLICY "Admins can read all content"
ON content_items FOR SELECT
USING (is_admin_user());

-- Content items: Admins can insert
CREATE POLICY "Admins can insert content"
ON content_items FOR INSERT
WITH CHECK (is_admin_user());

-- Content items: Admins can update
CREATE POLICY "Admins can update content"
ON content_items FOR UPDATE
USING (is_admin_user())
WITH CHECK (is_admin_user());

-- Content items: Admins can delete
CREATE POLICY "Admins can delete content"
ON content_items FOR DELETE
USING (is_admin_user());

-- Audit log: Only admins can read
CREATE POLICY "Admins can read audit log"
ON content_audit_log FOR SELECT
USING (is_admin_user());

-- Audit log: System can insert (via trigger)
CREATE POLICY "System can insert audit log"
ON content_audit_log FOR INSERT
WITH CHECK (true);

-- Content versions: Everyone can read published content versions
CREATE POLICY "Published content versions are viewable by everyone"
ON content_versions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM content_items
    WHERE id = content_versions.content_item_id
    AND status = 'published'
  )
);

-- Content versions: Admins can read all
CREATE POLICY "Admins can read all versions"
ON content_versions FOR SELECT
USING (is_admin_user());
```

---

## 2. API/Storage Layer Design

### 2.1 New Functions in `storage.ts`

```typescript
// Types for content management
export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';
export type ElementType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li' | 'blockquote';

export interface ContentItem {
  id: string;
  pageKey: string;
  sectionKey: string;
  elementType: ElementType;
  content: string;
  contentHtml?: string;
  status: ContentStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
  publishedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}

export interface ContentAuditLog {
  id: string;
  contentItemId: string;
  action: string;
  oldContent?: string;
  newContent?: string;
  changedBy: string;
  changedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

// Content retrieval functions
export async function getContentByPage(pageKey: string): Promise<ContentItem[]>;
export async function getContentByKeys(pageKey: string, sectionKey: string): Promise<ContentItem | null>;
export async function getAllContentItems(filters?: { status?: ContentStatus; pageKey?: string }): Promise<ContentItem[]>;
export async function getContentForAdmin(): Promise<ContentItem[]>;

// Content mutation functions
export async function createContentItem(item: Omit<ContentItem, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ContentItem>;
export async function updateContentItem(id: string, updates: Partial<ContentItem>): Promise<ContentItem>;
export async function deleteContentItem(id: string): Promise<boolean>;
export async function publishContent(id: string): Promise<ContentItem>;
export async function archiveContent(id: string): Promise<ContentItem>;

// Audit and version functions
export async function getContentHistory(contentItemId: string): Promise<ContentAuditLog[]>;
export async function getContentVersions(contentItemId: string): Promise<ContentVersion[]>;
export async function restoreVersion(contentItemId: string, versionNumber: number): Promise<ContentItem>;

// Helper functions
export function mapContentItem(row: any): ContentItem;
```

### 2.2 Content Retrieval and Update Patterns

**Retrieval Pattern:**
```typescript
// Get content for a specific page (only published)
const content = await getContentByPage('home');
const contentMap = new Map(content.map(c => [c.sectionKey, c]));

// Usage in component
<h1>{contentMap.get('hero-title')?.content}</h1>
```

**Update Pattern:**
```typescript
// Update content with audit logging
await updateContentItem(id, { 
  content: newContent, 
  status: 'pending_review',
  updatedBy: userId 
});
```

### 2.3 Database Functions (Server-side in Supabase)

```sql
-- Function to create content with initial audit log entry
CREATE OR REPLACE FUNCTION create_content_item(
  p_page_key VARCHAR,
  p_section_key VARCHAR,
  p_element_type VARCHAR,
  p_content TEXT,
  p_status VARCHAR DEFAULT 'draft'
)
RETURNS UUID AS $$
DECLARE
  v_content_id UUID;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  INSERT INTO content_items (
    page_key, section_key, element_type, content, status, created_by, updated_by
  ) VALUES (
    p_page_key, p_section_key, p_element_type, p_content, p_status, v_user_id, v_user_id
  )
  RETURNING id INTO v_content_id;

  INSERT INTO content_audit_log (content_item_id, action, new_content, changed_by)
  VALUES (v_content_id, 'create', p_content, v_user_id);

  RETURN v_content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update content with version increment
CREATE OR REPLACE FUNCTION update_content_item(
  p_id UUID,
  p_content TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_old_content TEXT;
  v_user_id UUID;
  v_new_version INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  SELECT content, version INTO v_old_content, v_new_version 
  FROM content_items WHERE id = p_id;
  
  v_new_version := v_new_version + 1;

  UPDATE content_items SET
    content = p_content,
    version = v_new_version,
    updated_at = NOW(),
    updated_by = v_user_id,
    notes = COALESCE(p_notes, notes)
  WHERE id = p_id;

  INSERT INTO content_audit_log (content_item_id, action, old_content, new_content, changed_by)
  VALUES (p_id, 'update', v_old_content, p_content, v_user_id);

  INSERT INTO content_versions (content_item_id, version_number, content, created_by)
  VALUES (p_id, v_new_version, p_content, v_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to publish content
CREATE OR REPLACE FUNCTION publish_content_item(p_id UUID)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  UPDATE content_items SET
    status = 'published',
    published_at = NOW(),
    reviewed_by = v_user_id,
    reviewed_at = NOW()
  WHERE id = p_id;

  INSERT INTO content_audit_log (content_item_id, action, new_content, changed_by)
  SELECT p_id, 'publish', content, v_user_id
  FROM content_items WHERE id = p_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 3. Frontend Architecture

### 3.1 Editable Content Component System

```typescript
// src/components/content/EditableContent.tsx
import { useState, useEffect, useCallback } from 'react';
import { getContentByKeys, updateContentItem, publishContent } from '../lib/storage';

interface EditableContentProps {
  pageKey: string;
  sectionKey: string;
  elementType: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li' | 'blockquote';
  defaultContent: string;
  isAdmin: boolean;
  onContentChange?: (newContent: string) => void;
}

export function EditableContent({
  pageKey,
  sectionKey,
  elementType,
  defaultContent,
  isAdmin,
  onContentChange
}: EditableContentProps) {
  const [content, setContent] = useState(defaultContent);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load content from database on mount
  useEffect(() => {
    async function loadContent() {
      try {
        const item = await getContentByKeys(pageKey, sectionKey);
        if (item && item.status === 'published') {
          setContent(item.content);
        }
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, [pageKey, sectionKey]);

  const handleClick = useCallback(() => {
    if (!isAdmin) return;
    setEditValue(content);
    setIsEditing(true);
  }, [isAdmin, content]);

  const handleSave = useCallback(async () => {
    try {
      const item = await getContentByKeys(pageKey, sectionKey);
      if (item) {
        await updateContentItem(item.id, { content: editValue });
        setContent(editValue);
        onContentChange?.(editValue);
      }
    } catch (error) {
      console.error('Failed to save content:', error);
    }
    setIsEditing(false);
  }, [pageKey, sectionKey, editValue, onContentChange]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
    setEditValue(content);
  }, [content]);

  const handlePublish = useCallback(async () => {
    try {
      const item = await getContentByKeys(pageKey, sectionKey);
      if (item) {
        await publishContent(item.id);
      }
    } catch (error) {
      console.error('Failed to publish content:', error);
    }
  }, [pageKey, sectionKey]);

  // Render element based on type
  const Element = elementType;

  if (isLoading) {
    return <Element>{defaultContent}</Element>;
  }

  if (isEditing) {
    return (
      <div className="editable-wrapper editing">
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="editable-textarea"
          autoFocus
        />
        <div className="editable-actions">
          <button onClick={handleSave} className="btn-save">Zapisz</button>
          <button onClick={handleCancel} className="btn-cancel">Anuluj</button>
          <button onClick={handlePublish} className="btn-publish">Opublikuj</button>
        </div>
      </div>
    );
  }

  return (
    <Element 
      className={isAdmin ? 'editable-content admin-mode' : 'editable-content'}
      onClick={handleClick}
      title={isAdmin ? 'Kliknij, aby edytować' : undefined}
    >
      {content}
    </Element>
  );
}
```

### 3.2 Content Context/Provider

```typescript
// src/contexts/AdminContext.tsx
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/db';

interface AdminUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdminLoading: boolean;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(true);

  const refreshAdminStatus = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data?.user?.id;
      
      if (!userId) {
        setAdminUser(null);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .eq('id', userId)
        .limit(1)
        .single();

      if (profile?.is_admin) {
        setAdminUser({
          id: profile.id,
          username: profile.username,
          isAdmin: true
        });
      } else {
        setAdminUser(null);
      }
    } catch (error) {
      console.error('Failed to check admin status:', error);
      setAdminUser(null);
    } finally {
      setIsAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAdminStatus();
  }, [refreshAdminStatus]);

  return (
    <AdminContext.Provider value={{ adminUser, isAdminLoading, refreshAdminStatus }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
```

### 3.3 Visual Indicator System

CSS for editable content:

```css
/* Editable content styles */
.editable-content {
  transition: all 0.2s ease;
  cursor: default;
}

.editable-content.admin-mode {
  cursor: pointer;
  position: relative;
}

.editable-content.admin-mode:hover {
  background-color: rgba(59, 130, 246, 0.1);
  outline: 2px dashed rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

/* Visual indicator - pencil icon on hover */
.editable-content.admin-mode::after {
  content: '✏️';
  position: absolute;
  right: -24px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.2s ease;
  font-size: 14px;
}

.editable-content.admin-mode:hover::after {
  opacity: 1;
}

/* Editing mode */
.editable-wrapper.editing {
  position: relative;
}

.editable-textarea {
  width: 100%;
  min-height: 100px;
  padding: 8px;
  font-size: inherit;
  font-family: inherit;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  background: white;
  color: #1f2937;
}

.editable-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.editable-actions button {
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
}

.btn-save {
  background-color: #22c55e;
  color: white;
  border: none;
}

.btn-cancel {
  background-color: #6b7280;
  color: white;
  border: none;
}

.btn-publish {
  background-color: #3b82f6;
  color: white;
  border: none;
}
```

### 3.4 Admin Dashboard UI

```typescript
// src/components/admin/ContentDashboard.tsx
import { useState, useEffect } from 'react';
import { getAllContentItems, ContentItem, ContentStatus } from '../lib/storage';

export function ContentDashboard() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [filter, setFilter] = useState<ContentStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      try {
        const data = await getAllContentItems(
          filter !== 'all' ? { status: filter } : undefined
        );
        setItems(data);
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadContent();
  }, [filter]);

  const filteredItems = items.filter(item => 
    item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.pageKey.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.sectionKey.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusColors: Record<ContentStatus, string> = {
    draft: 'bg-yellow-100 text-yellow-800',
    pending_review: 'bg-orange-100 text-orange-800',
    published: 'bg-green-100 text-green-800',
    archived: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="admin-dashboard">
      <h2>Panel Zarządzania Treścią</h2>
      
      <div className="dashboard-filters">
        <input
          type="text"
          placeholder="Szukaj treści..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as ContentStatus | 'all')}
          className="filter-select"
        >
          <option value="all">Wszystkie</option>
          <option value="draft">Szkice</option>
          <option value="pending_review">Oczekujące na przegląd</option>
          <option value="published">Opublikowane</option>
          <option value="archived">Zarchiwizowane</option>
        </select>
      </div>

      <div className="content-table">
        <table>
          <thead>
            <tr>
              <th>Strona</th>
              <th>Sekcja</th>
              <th>Treść</th>
              <th>Status</th>
              <th>Wersja</th>
              <th>Zaktualizowano</th>
              <th>Akcje</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id}>
                <td>{item.pageKey}</td>
                <td>{item.sectionKey}</td>
                <td className="content-cell">
                  {item.content.substring(0, 50)}
                  {item.content.length > 50 ? '...' : ''}
                </td>
                <td>
                  <span className={`status-badge ${statusColors[item.status]}`}>
                    {item.status}
                  </span>
                </td>
                <td>v{item.version}</td>
                <td>{new Date(item.updatedAt).toLocaleDateString('pl-PL')}</td>
                <td>
                  <button className="btn-edit">Edytuj</button>
                  <button className="btn-history">Historia</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <span className="stat-number">{items.length}</span>
          <span className="stat-label">Łącznie elementów</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {items.filter(i => i.status === 'published').length}
          </span>
          <span className="stat-label">Opublikowanych</span>
        </div>
        <div className="stat-card">
          <span className="stat-number">
            {items.filter(i => i.status === 'draft').length}
          </span>
          <span className="stat-label">Szkiców</span>
        </div>
      </div>
    </div>
  );
}
```

---

## 4. Routing Changes

### 4.1 Route Type Updates

```typescript
// Update Route type in App.tsx
type Route = 
  | 'home' 
  | 'plates' 
  | 'forum' 
  | 'register' 
  | 'login' 
  | 'profile' 
  | 'history' 
  | 'rejonizacja'
  | 'admin'           // Admin dashboard
  | 'admin-content'   // Content management
  | 'admin-edit';    // Single content editor
```

### 4.2 Admin Route Component

```typescript
// src/components/admin/AdminRoute.tsx
import { Navigate } from 'react-router';
import { useAdmin } from '../contexts/AdminContext';

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { adminUser, isAdminLoading } = useAdmin();

  if (isAdminLoading) {
    return <div>Sprawdzanie uprawnień...</div>;
  }

  if (!adminUser?.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
```

### 4.3 Navigation Updates (Header.tsx)

```typescript
// Add admin link to navigation for admin users
{user && isAdmin && (
  <button 
    className="nav-link admin-link" 
    onClick={() => onNavigate('admin')}
  >
    Admin
  </button>
)}
```

### 4.4 App.tsx Route Integration

```typescript
// Add new routes in App.tsx
import { ContentDashboard } from './components/admin/ContentDashboard';
import { ContentEditor } from './components/admin/ContentEditor';
import { useAdmin } from './contexts/AdminContext';

// In render:
{route === 'admin' && <ContentDashboard />}
{route === 'admin-edit' && <ContentEditor />}
```

---

## 5. Security Implementation

### 5.1 Server-Side Permission Enforcement

**Supabase Database Functions:**

1. All content mutations go through database functions (not direct table access)
2. Functions check `is_admin_user()` before allowing modifications
3. RLS policies provide additional security layer

**Client-Side Checks:**

```typescript
// Hook for admin-only operations
function useRequireAdmin() {
  const { adminUser, isAdminLoading } = useAdmin();
  
  useEffect(() => {
    if (!isAdminLoading && !adminUser?.isAdmin) {
      // Redirect or show error
    }
  }, [adminUser, isAdminLoading]);
}
```

### 5.2 XSS Prevention Approach

1. **Content Storage:** Store both plain text (`content`) and sanitized HTML (`content_html`)
2. **Sanitization Library:** Use DOMPurify on the server before storing HTML
3. **Output Encoding:** Always escape content when rendering

```typescript
// Sanitization utility
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'blockquote', 'a'],
    ALLOWED_ATTR: ['href', 'target', 'rel']
  });
}

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
```

### 5.3 Audit Logging Details

**Automatic Audit Logging via Database Triggers:**

```sql
-- Trigger function for automatic audit logging
CREATE OR REPLACE FUNCTION content_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.content <> OLD.content THEN
    INSERT INTO content_audit_log (
      content_item_id, 
      action, 
      old_content, 
      new_content, 
      changed_by,
      ip_address,
      user_agent
    ) VALUES (
      NEW.id,
      'update',
      OLD.content,
      NEW.content,
      COALESCE(NEW.updated_by, auth.uid()),
      (SELECT client_ip FROM pg_stat_activity WHERE pid = pg_backend_pid()),
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER content_audit_update
AFTER UPDATE ON content_items
FOR EACH ROW
EXECUTE FUNCTION content_audit_trigger();
```

**Audit Log Viewer for Admins:**

```typescript
// src/components/admin/AuditLogViewer.tsx
import { getContentHistory } from '../lib/storage';

export function AuditLogViewer({ contentItemId }: { contentItemId: string }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    async function loadLogs() {
      const data = await getContentHistory(contentItemId);
      setLogs(data);
    }
    loadLogs();
  }, [contentItemId]);

  return (
    <div className="audit-log">
      <h3>Historia zmian</h3>
      <div className="audit-timeline">
        {logs.map(log => (
          <div key={log.id} className="audit-entry">
            <div className="audit-meta">
              <span className="audit-action">{log.action}</span>
              <span className="audit-date">
                {new Date(log.changedAt).toLocaleString('pl-PL')}
              </span>
            </div>
            <div className="audit-diff">
              <div className="old-value">{log.oldContent}</div>
              <div className="arrow">→</div>
              <div className="new-value">{log.newContent}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.4 Role-Based Access Control (RBAC)

**User Roles:**
- `user` - Regular authenticated user (can view content, create posts/plates)
- `admin` - Content administrator (full access to content management)

**Permission Matrix:**

| Action | User | Admin |
|--------|------|-------|
| View published content | ✓ | ✓ |
| View draft content | ✗ | ✓ |
| Edit own posts/plates | ✓ | ✓ |
| Edit static content | ✗ | ✓ |
| Delete content items | ✗ | ✓ |
| Publish content | ✗ | ✓ |
| View audit log | ✗ | ✓ |
| Restore previous versions | ✗ | ✓ |

---

## 6. Implementation Priority/Order

### Phase 1: Foundation (Week 1)
- [ ] Create database tables (content_items, content_audit_log, content_versions)
- [ ] Set up RLS policies
- [ ] Create database functions (create, update, publish)
- [ ] Add audit trigger
- [ ] Install DOMPurify for XSS prevention

### Phase 2: API Layer (Week 1-2)
- [ ] Add content types to storage.ts
- [ ] Implement getContentByPage function
- [ ] Implement getContentByKeys function
- [ ] Implement updateContentItem function
- [ ] Implement publishContent function
- [ ] Implement getContentHistory function
- [ ] Implement getContentVersions function

### Phase 3: Core Components (Week 2)
- [ ] Create EditableContent component
- [ ] Create AdminContext provider
- [ ] Implement visual indicator CSS
- [ ] Add XSS sanitization utilities

### Phase 4: Integration (Week 2-3)
- [ ] Update Home.tsx with EditableContent
- [ ] Update History.tsx with EditableContent
- [ ] Update Rejonizacja.tsx with EditableContent
- [ ] Test inline editing functionality
- [ ] Test content persistence

### Phase 5: Admin Dashboard (Week 3)
- [ ] Create ContentDashboard component
- [ ] Create ContentEditor component
- [ ] Create AuditLogViewer component
- [ ] Add admin route to App.tsx
- [ ] Add admin link to Header navigation

### Phase 6: Workflow Features (Week 3-4)
- [ ] Implement draft/pending_review workflow
- [ ] Add version history view
- [ ] Implement rollback functionality
- [ ] Add bulk operations

### Phase 7: Security & Polish (Week 4)
- [ ] Security audit
- [ ] Performance optimization
- [ ] User testing
- [ ] Documentation
- [ ] Bug fixes

---

## 7. Content Page Key Reference

For initial implementation, here's the content mapping:

| Page | Component | Page Key | Sections |
|------|-----------|----------|----------|
| Home | Home.tsx | home | hero-title, intro-text, cta-button-1, cta-button-2 |
| History | History.tsx | history | page-title, intro-text, section-1975, section-1999 |
| Rejonizacja | Rejonizacja.tsx | rejonizacja | page-title, intro-1, intro-2, features-title, feature-1, feature-2, feature-3, cta-text |
| Header | Header.tsx | header | site-title, site-subtitle |
| Plates | Plates.tsx | plates | page-title, search-placeholder, add-button |
| Blog | Blog.tsx | blog | page-title, form-title, form-placeholder |

---

## 8. Migration Strategy

### Initial Content Seeding

```typescript
// scripts/seed-content.ts
const initialContent = [
  { pageKey: 'home', sectionKey: 'hero-title', elementType: 'h2', content: 'Witaj w społeczności miłośników czarnych tablic!' },
  { pageKey: 'home', sectionKey: 'intro-text', elementType: 'p', content: 'Miejsce dla fanów starych aut i legendarnych czarnych tablic z Przemyśla. Dziel się historiami, przeglądaj bazę tablic i poznawaj innych pasjonatów.' },
  { pageKey: 'home', sectionKey: 'cta-button-1', elementType: 'button', content: 'Przeglądaj tablice' },
  { pageKey: 'home', sectionKey: 'cta-button-2', elementType: 'button', content: 'Odwiedź forum' },
  { pageKey: 'history', sectionKey: 'page-title', elementType: 'h2', content: 'Historia' },
  // ... more content
];

async function seedContent() {
  for (const item of initialContent) {
    await createContentItem({ ...item, status: 'published' });
  }
}
```

---

## 9. Testing Strategy

1. **Unit Tests:** EditableContent component, sanitization utilities
2. **Integration Tests:** Content CRUD operations
3. **E2E Tests:** Admin login → Edit content → Verify display
4. **Security Tests:** XSS attempts, unauthorized access attempts

---

## 10. Future Enhancements

- Multi-language support for content
- Scheduled publishing
- Content comparison tool
- Media content management
- SEO meta tag editing
- Content templates
- Export/import functionality

---

*Document Version: 1.0*
*Created: 2026-03-07*
*Author: Technical Specification*
