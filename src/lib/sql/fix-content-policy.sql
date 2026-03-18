-- Fix RLS policy to allow authenticated users to edit content
-- Run this in Supabase SQL Editor

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can insert content" ON content_items;
DROP POLICY IF EXISTS "Admins can update content" ON content_items;
DROP POLICY IF EXISTS "Admins can delete content" ON content_items;

-- Allow all authenticated users to edit content
CREATE POLICY "Users can insert content"
ON content_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update content"
ON content_items FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete content"
ON content_items FOR DELETE USING (auth.uid() IS NOT NULL);
