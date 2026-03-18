import { supabase } from './db';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// Types
// ============================================================================

export type ContentStatus = 'draft' | 'pending_review' | 'published' | 'archived';

export type ElementType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'li' | 'blockquote' | 'span' | 'div';

export interface ContentItem {
  id: string;
  page_key: string;
  section_key: string;
  element_type: ElementType;
  content: string;
  status: ContentStatus;
  version: number;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
  is_static: boolean;
}

export interface ContentAuditLog {
  id: string;
  content_id: string;
  action: string;
  old_content: string | null;
  new_content: string | null;
  performed_by: string | null;
  performed_at: string;
  ip_address: string | null;
}

export interface ContentVersion {
  id: string;
  content_id: string;
  version: number;
  content: string;
  created_at: string;
  created_by: string | null;
}

// ============================================================================
// Helper Functions
// ============================================================================

function mapContentItem(row: any): ContentItem {
  return {
    id: row.id,
    page_key: row.page_key,
    section_key: row.section_key,
    element_type: row.element_type as ElementType,
    content: row.content,
    status: row.status as ContentStatus,
    version: row.version,
    created_at: row.created_at,
    updated_at: row.updated_at,
    updated_by: row.updated_by,
    is_static: row.is_static,
  };
}

function mapContentAuditLog(row: any): ContentAuditLog {
  return {
    id: row.id,
    content_id: row.content_id,
    action: row.action,
    old_content: row.old_content,
    new_content: row.new_content,
    performed_by: row.performed_by,
    performed_at: row.performed_at,
    ip_address: row.ip_address,
  };
}

function mapContentVersion(row: any): ContentVersion {
  return {
    id: row.id,
    content_id: row.content_id,
    version: row.version,
    content: row.content,
    created_at: row.created_at,
    created_by: row.created_by,
  };
}

function getClientIp(): string {
  // This would be handled server-side in a real implementation
  return '0.0.0.0';
}

// ============================================================================
// Content Functions
// ============================================================================

/**
 * Get all content items for a specific page
 */
export async function getContentByPage(pageKey: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('page_key', pageKey)
    .order('section_key');

  if (error) {
    console.error('Error fetching content by page:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }

  return data?.map(mapContentItem) ?? [];
}

/**
 * Get a specific content item by page and section keys
 */
export async function getContentByKeys(pageKey: string, sectionKey: string): Promise<ContentItem | null> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('page_key', pageKey)
    .eq('section_key', sectionKey)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - this is expected for new pages
      return null;
    }
    console.error('Error fetching content by keys:', error);
    throw new Error(`Failed to fetch content: ${error.message}`);
  }

  return data ? mapContentItem(data) : null;
}

/**
 * Get only published content for public access
 */
export async function getPublishedContent(pageKey: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .eq('page_key', pageKey)
    .eq('status', 'published')
    .order('section_key');

  if (error) {
    console.error('Error fetching published content:', error);
    throw new Error(`Failed to fetch published content: ${error.message}`);
  }

  return data?.map(mapContentItem) ?? [];
}

/**
 * Create a new content item
 */
export async function createContentItem(
  item: Omit<ContentItem, 'id' | 'created_at' | 'updated_at' | 'version'>
): Promise<ContentItem> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .insert({
      id,
      page_key: item.page_key,
      section_key: item.section_key,
      element_type: item.element_type,
      content: item.content,
      status: item.status || 'draft',
      version: 1,
      created_at: now,
      updated_at: now,
      updated_by: item.updated_by,
      is_static: item.is_static,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating content item:', error);
    throw new Error(`Failed to create content: ${error.message}`);
  }

  // Create initial audit log entry
  await createAuditLog(id, 'create', null, item.content, item.updated_by);

  return mapContentItem(data);
}

/**
 * Update an existing content item
 */
export async function updateContentItem(
  id: string,
  content: string,
  userId: string
): Promise<ContentItem> {
  // Get current content for audit log
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching current content:', fetchError);
    throw new Error('Content item not found');
  }

  const oldContent = currentItem.content;
  const newVersion = currentItem.version + 1;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      content,
      version: newVersion,
      updated_at: now,
      updated_by: userId,
      status: 'draft', // Reset to draft on edit
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating content item:', error);
    throw new Error(`Failed to update content: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'update', oldContent, content, userId);

  // Save version snapshot
  await createContentVersion(id, oldContent, userId);

  return mapContentItem(data);
}

/**
 * Publish a content item
 */
export async function publishContent(id: string, userId: string): Promise<ContentItem> {
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching content for publish:', fetchError);
    throw new Error('Content item not found');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'published',
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error publishing content:', error);
    throw new Error(`Failed to publish content: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'publish', currentItem.content, currentItem.content, userId);

  return mapContentItem(data);
}

/**
 * Get content history (audit log)
 */
export async function getContentHistory(contentId: string): Promise<ContentAuditLog[]> {
  const { data, error } = await supabase
    .from('content_audit_log')
    .select('*')
    .eq('content_id', contentId)
    .order('performed_at', { ascending: false });

  if (error) {
    console.error('Error fetching content history:', error);
    throw new Error(`Failed to fetch content history: ${error.message}`);
  }

  return data?.map(mapContentAuditLog) ?? [];
}

/**
 * Get content versions
 */
export async function getContentVersions(contentId: string): Promise<ContentVersion[]> {
  const { data, error } = await supabase
    .from('content_versions')
    .select('*')
    .eq('content_id', contentId)
    .order('version', { ascending: false });

  if (error) {
    console.error('Error fetching content versions:', error);
    throw new Error(`Failed to fetch content versions: ${error.message}`);
  }

  return data?.map(mapContentVersion) ?? [];
}

/**
 * Restore a specific version
 */
export async function restoreVersion(
  contentId: string,
  versionId: string,
  userId: string
): Promise<ContentItem> {
  // Get the version to restore
  const { data: versionData, error: versionError } = await supabase
    .from('content_versions')
    .select('*')
    .eq('id', versionId)
    .eq('content_id', contentId)
    .single();

  if (versionError || !versionData) {
    console.error('Error fetching version to restore:', versionError);
    throw new Error('Version not found');
  }

  // Get current content for audit log
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', contentId)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching current content:', fetchError);
    throw new Error('Content item not found');
  }

  const oldContent = currentItem.content;
  const newVersion = currentItem.version + 1;
  const now = new Date().toISOString();

  // Update content
  const { data, error } = await supabase
    .from('content_items')
    .update({
      content: versionData.content,
      version: newVersion,
      updated_at: now,
      updated_by: userId,
      status: 'draft', // Reset to draft on restore
    })
    .eq('id', contentId)
    .select()
    .single();

  if (error) {
    console.error('Error restoring version:', error);
    throw new Error(`Failed to restore version: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(contentId, 'restore', oldContent, versionData.content, userId);

  return mapContentItem(data);
}

/**
 * Search content across all pages
 */
export async function searchContent(query: string): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .ilike('content', `%${query}%`)
    .order('page_key')
    .order('section_key');

  if (error) {
    console.error('Error searching content:', error);
    throw new Error(`Failed to search content: ${error.message}`);
  }

  return data?.map(mapContentItem) ?? [];
}

/**
 * Bulk update multiple content items
 */
export async function bulkUpdateContent(
  items: { id: string; content: string }[],
  userId: string
): Promise<ContentItem[]> {
  if (items.length === 0) {
    return [];
  }

  const now = new Date().toISOString();
  const results: ContentItem[] = [];

  for (const item of items) {
    // Get current content for audit log
    const { data: currentItem, error: fetchError } = await supabase
      .from('content_items')
      .select('*')
      .eq('id', item.id)
      .single();

    if (fetchError || !currentItem) {
      console.error(`Error fetching content item ${item.id}:`, fetchError);
      continue;
    }

    const oldContent = currentItem.content;
    const newVersion = currentItem.version + 1;

    const { data, error } = await supabase
      .from('content_items')
      .update({
        content: item.content,
        version: newVersion,
        updated_at: now,
        updated_by: userId,
        status: 'draft',
      })
      .eq('id', item.id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating content item ${item.id}:`, error);
      continue;
    }

    if (data) {
      results.push(mapContentItem(data));
      
      // Create audit log entry
      await createAuditLog(item.id, 'update', oldContent, item.content, userId);
    }
  }

  return results;
}

/**
 * Get all content items (for admin dashboard)
 */
export async function getAllContentItems(): Promise<ContentItem[]> {
  const { data, error } = await supabase
    .from('content_items')
    .select('*')
    .order('page_key')
    .order('section_key');

  if (error) {
    console.error('Error fetching all content items:', error);
    throw new Error(`Failed to fetch content items: ${error.message}`);
  }

  return data?.map(mapContentItem) ?? [];
}

/**
 * Archive a content item
 */
export async function archiveContent(id: string, userId: string): Promise<ContentItem> {
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching content for archive:', fetchError);
    throw new Error('Content item not found');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'archived',
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error archiving content:', error);
    throw new Error(`Failed to archive content: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'archive', currentItem.content, currentItem.content, userId);

  return mapContentItem(data);
}

/**
 * Submit content for review
 */
export async function submitForReview(id: string, userId: string): Promise<ContentItem> {
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching content for review:', fetchError);
    throw new Error('Content item not found');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'pending_review',
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error submitting content for review:', error);
    throw new Error(`Failed to submit for review: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'review_approve', currentItem.content, currentItem.content, userId);

  return mapContentItem(data);
}

/**
 * Approve content from review
 */
export async function approveReview(id: string, userId: string): Promise<ContentItem> {
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching content for approval:', fetchError);
    throw new Error('Content item not found');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'published',
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error approving content:', error);
    throw new Error(`Failed to approve content: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'review_approve', currentItem.content, currentItem.content, userId);

  return mapContentItem(data);
}

/**
 * Reject content from review
 */
export async function rejectReview(id: string, userId: string): Promise<ContentItem> {
  const { data: currentItem, error: fetchError } = await supabase
    .from('content_items')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !currentItem) {
    console.error('Error fetching content for rejection:', fetchError);
    throw new Error('Content item not found');
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('content_items')
    .update({
      status: 'draft',
      updated_at: now,
      updated_by: userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error rejecting content:', error);
    throw new Error(`Failed to reject content: ${error.message}`);
  }

  // Create audit log entry
  await createAuditLog(id, 'review_reject', currentItem.content, currentItem.content, userId);

  return mapContentItem(data);
}

// ============================================================================
// Private Helper Functions
// ============================================================================

/**
 * Create an audit log entry
 */
async function createAuditLog(
  contentId: string,
  action: string,
  oldContent: string | null,
  newContent: string | null,
  performedBy: string | null
): Promise<void> {
  const id = uuidv4();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('content_audit_log')
    .insert({
      id,
      content_id: contentId,
      action,
      old_content: oldContent,
      new_content: newContent,
      performed_by: performedBy,
      performed_at: now,
      ip_address: getClientIp(),
    });

  if (error) {
    console.error('Error creating audit log:', error);
    // Don't throw - audit log failure shouldn't break main operation
  }
}

/**
 * Create a content version snapshot
 */
async function createContentVersion(
  contentId: string,
  content: string,
  createdBy: string | null
): Promise<void> {
  // Get current version number
  const { data: currentItem } = await supabase
    .from('content_items')
    .select('version')
    .eq('id', contentId)
    .single();

  const id = uuidv4();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('content_versions')
    .insert({
      id,
      content_id: contentId,
      version: currentItem?.version || 1,
      content,
      created_at: now,
      created_by: createdBy,
    });

  if (error) {
    console.error('Error creating content version:', error);
    // Don't throw - version creation failure shouldn't break main operation
  }
}

/**
 * Delete a content item
 */
export async function deleteContent(id: string): Promise<void> {
  const { error } = await supabase
    .from('content_items')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting content:', error);
    throw new Error(`Failed to delete content: ${error.message}`);
  }
}
