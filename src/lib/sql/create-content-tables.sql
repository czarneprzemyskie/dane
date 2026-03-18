-- ============================================================================
-- Content Tables Setup - Historia i Rejonizacja
-- Run this SQL in Supabase SQL Editor
-- ============================================================================

-- Tabela z treścią
CREATE TABLE IF NOT EXISTS content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_key VARCHAR(100) NOT NULL,
  section_key VARCHAR(100) NOT NULL,
  element_type VARCHAR(20) NOT NULL DEFAULT 'p',
  content TEXT NOT NULL DEFAULT '',
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  is_static BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(page_key, section_key)
);

-- Włącz RLS
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać opublikowaną treść
CREATE POLICY "Public can read published content"
ON content_items FOR SELECT
USING (status = 'published');

-- Tylko admini mogą edytować (sprawdza is_admin w tabeli profiles)
CREATE POLICY "Admins can insert content"
ON content_items FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can update content"
ON content_items FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Admins can delete content"
ON content_items FOR DELETE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Dodaj treść dla Historia i Rejonizacja
INSERT INTO content_items (page_key, section_key, element_type, content, status, is_static) VALUES 
-- Historia
('history', 'page-title', 'h2', 'Historia', 'published', true),
('history', 'intro-text', 'p', 'Tutaj znajdziesz krótką historię czarnych tablic rejestracyjnych na terenie województwa Przemyskiego.', 'published', true),
('history', 'pre-1975-title', 'h3', 'WSTĘP:PODZIAŁ ADMINISTRACYJNY WOJEWÓDZTWA PRZEMYSKIEGO (LATA 1975-1998):', 'published', true),
('history', 'pre-1975-intro', 'p', 'Utworzone 1.06.1975 r. woj. przemyskie dzieliło się na następujące miasta, miasta i gminy oraz gminy:', 'published', true),
('history', 'pre-1991-note', 'p', '* W 01.07.1991 r. Podzielono miasto i gminę Dynów oraz miasto i gminę Radymno na dwie jednostki administracyjne.', 'published', true),
('history', 'post-reform-title', 'h3', 'WOJEWÓDZTWO PRZEMYSKIE PO REFORMIE WPROWADZAJĄCEJ 16 WOJEWÓDZTW', 'published', true),
('history', 'post-reform-intro', 'p', '01.01.1999 wszedł nowy podział administacyjny wprowadzający 16 województw. Tereny woj. Przemyskiego zostały włączone do nowo powstałego woj, Podkarpackiego, a na jego terenach powstały następujące powiaty:', 'published', true),
-- Rejonizacja
('rejonizacja', 'page-title', 'h2', 'Rejonizacja tablic rejestracyjnych', 'published', true),
('rejonizacja', 'intro-text-1', 'p', 'Każdy polski pojazd ma przypisany konkretny symbol regionu — to te dwie litery na tablicy, które od razu zdradzają, skąd pochodzi auto. System wprowadzono w 2000 roku, zastępując stare oznaczenia z czasów PRL-u i zaborów. Dawniej tablice mówiły tylko o powiecie, teraz — o całym województwie.', 'published', true),
('rejonizacja', 'intro-text-2', 'p', 'Na stronie znajdziesz pełną listę kodów z podziałem na województwa, interaktywną mapkę oraz informacje o tym, jak zmieniały się granice administracyjne na przestrzeni lat. Jeśli kiedyś przepisywałeś tablice po zmianie miejsca zameldowania, wiesz, że procedura jest prosta, ale diabeł tkwi w szczegółach.', 'published', true),
('rejonizacja', 'cta-text', 'p', 'Masz pod ręką stare tablice, dokumenty z różnych lat albo zdjęcia nietypowych oznaczeń? Podziel się nimi — chętnie dodamy je do kolekcji.', 'published', true)
ON CONFLICT (page_key, section_key) DO NOTHING;
