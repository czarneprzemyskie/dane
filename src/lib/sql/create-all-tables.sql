-- ============================================================================
-- Complete Database Setup for Czarne Przemyskie
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Create visitor_count table if not exists
CREATE TABLE IF NOT EXISTS public.visitor_count (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create increment function
CREATE OR REPLACE FUNCTION public.increment_visitor_count()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.visitor_count SET count = count + 1, updated_at = NOW() WHERE id = (SELECT id FROM public.visitor_count LIMIT 1);
  
  SELECT count INTO new_count FROM public.visitor_count LIMIT 1;
  
  IF NOT FOUND THEN
    INSERT INTO public.visitor_count (count) VALUES (1);
    RETURN 1;
  END IF;
  
  RETURN new_count;
END;
$$;

-- Insert initial visitor count row if empty
INSERT INTO public.visitor_count (count) SELECT 0 WHERE NOT EXISTS (SELECT 1 FROM public.visitor_count);

-- Enable RLS
ALTER TABLE public.visitor_count ENABLE ROW LEVEL SECURITY;

-- Public can read
DROP POLICY IF EXISTS "Public can read visitor_count" ON public.visitor_count;
CREATE POLICY "Public can read visitor_count" ON public.visitor_count FOR SELECT USING (true);

-- Enable RLS on profiles (add is_admin column if missing)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Set your user as admin (replace with your user ID after registration)
-- UPDATE public.profiles SET is_admin = true WHERE id = 'YOUR_USER_ID';

-- Enable RLS on plates
ALTER TABLE public.plates ENABLE ROW LEVEL SECURITY;

-- Public can read plates
DROP POLICY IF EXISTS "Public can read plates" ON public.plates;
CREATE POLICY "Public can read plates" ON public.plates FOR SELECT USING (true);

-- Authenticated users can insert
DROP POLICY IF EXISTS "Users can insert plates" ON public.plates;
CREATE POLICY "Users can insert plates" ON public.plates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Owner or admin can update
DROP POLICY IF EXISTS "Owner or admin can update plates" ON public.plates;
CREATE POLICY "Owner or admin can update plates" ON public.plates FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  OR owner = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

-- Owner or admin can delete
DROP POLICY IF EXISTS "Owner or admin can delete plates" ON public.plates;
CREATE POLICY "Owner or admin can delete plates" ON public.plates FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
  OR owner = (SELECT username FROM public.profiles WHERE id = auth.uid())
);

-- Content items table
CREATE TABLE IF NOT EXISTS public.content_items (
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

-- RLS for content_items
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

-- Everyone can read
DROP POLICY IF EXISTS "Public can read content" ON public.content_items;
CREATE POLICY "Public can read content" ON public.content_items FOR SELECT USING (true);

-- Authenticated users can insert
DROP POLICY IF EXISTS "Users can insert content" ON public.content_items;
CREATE POLICY "Users can insert content" ON public.content_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Authenticated users can update
DROP POLICY IF EXISTS "Users can update content" ON public.content_items;
CREATE POLICY "Users can update content" ON public.content_items FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Authenticated users can delete
DROP POLICY IF EXISTS "Users can delete content" ON public.content_items;
CREATE POLICY "Users can delete content" ON public.content_items FOR DELETE USING (auth.uid() IS NOT NULL);
