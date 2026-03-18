-- ============================================================================
-- Content Editing System Database Schema
-- Run this SQL in Supabase to set up the content management tables
-- ============================================================================

-- ============================================================================
-- content_items table
-- Stores all editable content on the website
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  element_type VARCHAR(50) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_static BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT unique_page_section UNIQUE (page_key, section_key)
);

-- Index for faster lookups by page
CREATE INDEX IF NOT EXISTS idx_content_items_page_key ON content_items(page_key);

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);

-- Index for combined page and status queries
CREATE INDEX IF NOT EXISTS idx_content_items_page_status ON content_items(page_key, status);

-- ============================================================================
-- content_audit_log table
-- Tracks all changes made to content items
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  old_content TEXT,
  new_content TEXT,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45)
);

-- Index for fetching audit log by content
CREATE INDEX IF NOT EXISTS idx_content_audit_log_content_id ON content_audit_log(content_id);

-- Index for fetching audit log by user
CREATE INDEX IF NOT EXISTS idx_content_audit_log_performed_by ON content_audit_log(performed_by);

-- Index for chronological ordering
CREATE INDEX IF NOT EXISTS idx_content_audit_log_performed_at ON content_audit_log(performed_at DESC);

-- ============================================================================
-- content_versions table
-- Stores snapshots of content for versioning
-- ============================================================================

CREATE TABLE IF NOT EXISTS content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Index for fetching versions by content
CREATE INDEX IF NOT EXISTS idx_content_versions_content_id ON content_versions(content_id);

-- Index for fetching versions by version number
CREATE INDEX IF NOT EXISTS idx_content_versions_version ON content_versions(content_id, version DESC);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Public Read Access (published content only)
-- ============================================================================

-- Public can read only published content items
CREATE POLICY "Public can read published content items"
ON content_items FOR SELECT
USING (status = 'published');

-- Public can read audit log (for transparency)
CREATE POLICY "Public can read content audit log"
ON content_audit_log FOR SELECT
USING (true);

-- Public can read content versions
CREATE POLICY "Public can read content versions"
ON content_versions FOR SELECT
USING (true);

-- ============================================================================
-- Admin Full Access Policies
-- ============================================================================

-- Admins can do everything with content items
CREATE POLICY "Admins can insert content items"
ON content_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() IS NOT NULL  -- Allow all authenticated users for now
);

CREATE POLICY "Admins can update content items"
ON content_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() IS NOT NULL  -- Allow all authenticated users for now
);

CREATE POLICY "Admins can delete content items"
ON content_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() IS NOT NULL  -- Allow all authenticated users for now
);

-- Admins can do everything with audit log
CREATE POLICY "Admins can manage audit log"
ON content_audit_log FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() IS NOT NULL  -- Allow all authenticated users for now
);

-- Admins can do everything with versions
CREATE POLICY "Admins can manage content versions"
ON content_versions FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  )
  OR auth.uid() IS NOT NULL  -- Allow all authenticated users for now
);

-- ============================================================================
-- Function to auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
CREATE TRIGGER update_content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to get published content by page (helper function)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_published_content_by_page(page_key_param VARCHAR)
RETURNS TABLE (
  id UUID,
  page_key VARCHAR,
  section_key VARCHAR,
  element_type VARCHAR,
  content TEXT,
  status VARCHAR,
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  is_static BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.page_key,
    ci.section_key,
    ci.element_type,
    ci.content,
    ci.status,
    ci.version,
    ci.created_at,
    ci.updated_at,
    ci.updated_by,
    ci.is_static
  FROM content_items ci
  WHERE ci.page_key = page_key_param
    AND ci.status = 'published'
  ORDER BY ci.section_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to get all content for admin (including drafts)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_all_content_for_admin()
RETURNS TABLE (
  id UUID,
  page_key VARCHAR,
  section_key VARCHAR,
  element_type VARCHAR,
  content TEXT,
  status VARCHAR,
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  is_static BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.page_key,
    ci.section_key,
    ci.element_type,
    ci.content,
    ci.status,
    ci.version,
    ci.created_at,
    ci.updated_at,
    ci.updated_by,
    ci.is_static
  FROM content_items ci
  ORDER BY ci.page_key, ci.section_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to search content
-- ============================================================================

CREATE OR REPLACE FUNCTION search_content_content(query_text VARCHAR)
RETURNS TABLE (
  id UUID,
  page_key VARCHAR,
  section_key VARCHAR,
  element_type VARCHAR,
  content TEXT,
  status VARCHAR,
  version INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  updated_by UUID,
  is_static BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ci.id,
    ci.page_key,
    ci.section_key,
    ci.element_type,
    ci.content,
    ci.status,
    ci.version,
    ci.created_at,
    ci.updated_at,
    ci.updated_by,
    ci.is_static
  FROM content_items ci
  WHERE ci.content ILIKE '%' || query_text || '%'
  ORDER BY ci.page_key, ci.section_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Seed Data: Initial content items (optional - for testing)
-- ============================================================================

-- Uncomment below to add sample content for testing

-- INSERT INTO content_items (page_key, section_key, element_type, content, status, is_static)
-- VALUES 
--   ('home', 'hero-title', 'h1', 'Welcome to Our Site', 'published', true),
--   ('home', 'hero-subtitle', 'p', 'Discover amazing things with us', 'published', true),
--   ('home', 'intro-text', 'p', 'Learn more about our history and mission', 'published', false),
--   ('history', 'page-title', 'h1', 'Our History', 'published', true),
--   ('history', 'intro-text', 'p', 'We have been serving the community since 1995', 'published', true),
--   ('rejonizacja', 'page-title', 'h1', 'Rejonizacja', 'published', true),
--   ('rejonizacja', 'intro-text', 'p', 'Information about our regional structure', 'published', false)
-- ON CONFLICT (page_key, section_key) DO NOTHING;

-- ============================================================================
-- End of Schema Setup
-- ============================================================================
