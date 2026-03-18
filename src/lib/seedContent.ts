import { createContentItem, publishContent, getContentByKeys } from './content';
import type { ElementType } from './content';

// Define the shape of initial content entries
interface SeedContentEntry {
  pageKey: string;
  sectionKey: string;
  elementType: ElementType;
  content: string;
  isStatic: boolean;
}

// Define all initial content entries
const initialContent: SeedContentEntry[] = [
  // Home page
  { pageKey: 'home', sectionKey: 'hero-title', elementType: 'h1', content: 'Witamy na stronie poświęconej polskim tablicom rejestracyjnym', isStatic: true },
  { pageKey: 'home', sectionKey: 'hero-description', elementType: 'p', content: 'Odkryj historię i ewolucję polskich tablic rejestracyjnych. Baza danych zawiera informacje o tablicach z całej Polski.', isStatic: true },
  { pageKey: 'home', sectionKey: 'cta-plates', elementType: 'span', content: 'Przeglądaj tablice', isStatic: true },
  { pageKey: 'home', sectionKey: 'cta-forum', elementType: 'span', content: 'Odwiedź forum', isStatic: true },
  { pageKey: 'home', sectionKey: 'features-title', elementType: 'h2', content: 'Dlaczego warto odwiedzić nasz serwis?', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-1-title', elementType: 'h3', content: 'Baza tablic', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-1-desc', elementType: 'p', content: 'Przeglądaj tablice rejestracyjne z całej Polski. Znajdź informacje o swoim regionie.', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-2-title', elementType: 'h3', content: 'Historia', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-2-desc', elementType: 'p', content: 'Poznaj ewolucję polskich tablic rejestracyjnych na przestrzeni lat.', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-3-title', elementType: 'h3', content: 'Forum dyskusyjne', isStatic: true },
  { pageKey: 'home', sectionKey: 'feature-3-desc', elementType: 'p', content: 'Dołącz do społeczności miłośników polskich tablic rejestracyjnych.', isStatic: true },
  
  // History page
  { pageKey: 'history', sectionKey: 'page-title', elementType: 'h1', content: 'Historia polskich tablic rejestracyjnych', isStatic: true },
  { pageKey: 'history', sectionKey: 'intro-text', elementType: 'p', content: 'Poznaj ewolucję polskich tablic rejestracyjnych na przestrzeni lat.', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-1920-title', elementType: 'h2', content: 'Okres międzywojenny (1921-1939)', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-1920-desc', elementType: 'p', content: 'Po odzyskaniu niepodległości w 1918 roku, Polska rozpoczęła budowę własnego systemu rejestracji pojazdów. Pierwsze tablice wprowadzono w 1921 roku.', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-1945-title', elementType: 'h2', content: 'Okres powojenny (1945-1989)', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-1945-desc', elementType: 'p', content: 'Po II wojnie światowej system tablic rejestracyjnych został zreformowany. Wprowadzono nowe oznaczenia regionalne.', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-modern-title', elementType: 'h2', content: 'Era współczesna (od 2000)', isStatic: true },
  { pageKey: 'history', sectionKey: 'era-modern-desc', elementType: 'p', content: 'W 2000 roku wprowadzono nowy system rejestracji pojazdów z kodami powiatowymi.', isStatic: true },
  
  // Plates page
  { pageKey: 'plates', sectionKey: 'page-title', elementType: 'h1', content: 'Polskie tablice rejestracyjne', isStatic: true },
  { pageKey: 'plates', sectionKey: 'intro-text', elementType: 'p', content: 'Przeglądaj i wyszukuj tablice rejestracyjne z całej Polski.', isStatic: true },
  { pageKey: 'plates', sectionKey: 'search-placeholder', elementType: 'span', content: 'Wyszukaj tablice...', isStatic: true },
  { pageKey: 'plates', sectionKey: 'no-results', elementType: 'p', content: 'Nie znaleziono tablic rejestracyjnych.', isStatic: true },
  { pageKey: 'plates', sectionKey: 'add-plate-title', elementType: 'h2', content: 'Dodaj nową tablicę', isStatic: true },
  { pageKey: 'plates', sectionKey: 'add-plate-desc', elementType: 'p', content: 'Chcesz dodać zdjęcie własnej tablicy? Dołącz do naszej społeczności!', isStatic: true },
  
  // Blog page
  { pageKey: 'blog', sectionKey: 'page-title', elementType: 'h1', content: 'Blog o tablicach rejestracyjnych', isStatic: true },
  { pageKey: 'blog', sectionKey: 'intro-text', elementType: 'p', content: 'Ciekawostki, nowości i artykuły o polskich tablicach rejestracyjnych.', isStatic: true },
  
  // Rejonizacja page
  { pageKey: 'rejonizacja', sectionKey: 'page-title', elementType: 'h1', content: 'Rejonizacja tablic rejestracyjnych', isStatic: true },
  { pageKey: 'rejonizacja', sectionKey: 'intro-text', elementType: 'p', content: 'Poznaj podział administracyjny Polski i odpowiadające mu kody tablic rejestracyjnych.', isStatic: true },
  
  // Profile page
  { pageKey: 'profile', sectionKey: 'welcome-title', elementType: 'h1', content: 'Twój profil', isStatic: true },
  { pageKey: 'profile', sectionKey: 'stats-title', elementType: 'h2', content: 'Twoje statystyki', isStatic: true },
  
  // Registration page
  { pageKey: 'register', sectionKey: 'page-title', elementType: 'h1', content: 'Zarejestruj się', isStatic: true },
  { pageKey: 'register', sectionKey: 'intro-text', elementType: 'p', content: 'Dołącz do naszej społeczności i uczestnicz w dyskusjach o tablicach rejestracyjnych.', isStatic: true },
  
  // Login page
  { pageKey: 'login', sectionKey: 'page-title', elementType: 'h1', content: 'Zaloguj się', isStatic: true },
  { pageKey: 'login', sectionKey: 'intro-text', elementType: 'p', content: 'Zaloguj się, aby zarządzać treścią i uczestniczyć w dyskusjach.', isStatic: true },
];

/**
 * Check if content already exists for a given page and section
 */
export async function contentExists(pageKey: string, sectionKey: string): Promise<boolean> {
  try {
    const existing = await getContentByKeys(pageKey, sectionKey);
    return existing !== null;
  } catch (error) {
    console.error('Error checking content existence:', error);
    return false;
  }
}

/**
 * Create a single content item and optionally publish it
 */
async function createContentEntry(
  entry: SeedContentEntry,
  publish: boolean = true
): Promise<void> {
  // Check if content already exists
  const exists = await contentExists(entry.pageKey, entry.sectionKey);
  if (exists) {
    console.log(`Content already exists for ${entry.pageKey}/${entry.sectionKey}, skipping...`);
    return;
  }

  try {
    // Create the content item
    const newItem = await createContentItem({
      page_key: entry.pageKey,
      section_key: entry.sectionKey,
      element_type: entry.elementType,
      content: entry.content,
      status: publish ? 'published' : 'draft',
      updated_by: 'system', // System user for seeded content
      is_static: entry.isStatic,
    });

    console.log(`Created content for ${entry.pageKey}/${entry.sectionKey}: ${newItem.id}`);

    // If we need to publish and it's not already published
    if (publish && newItem.status !== 'published') {
      await publishContent(newItem.id, 'system');
      console.log(`Published content for ${entry.pageKey}/${entry.sectionKey}`);
    }
  } catch (error) {
    console.error(`Error creating content for ${entry.pageKey}/${entry.sectionKey}:`, error);
    throw error;
  }
}

/**
 * Seed content for a specific page
 */
export async function seedPageContent(pageKey: string): Promise<{ success: boolean; created: number; skipped: number; errors: string[] }> {
  const pageContent = initialContent.filter((entry) => entry.pageKey === pageKey);
  
  if (pageContent.length === 0) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      errors: [`No content defined for page: ${pageKey}`],
    };
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of pageContent) {
    try {
      const exists = await contentExists(entry.pageKey, entry.sectionKey);
      if (exists) {
        skipped++;
        continue;
      }

      await createContentEntry(entry, true);
      created++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to create ${entry.pageKey}/${entry.sectionKey}: ${errorMsg}`);
    }
  }

  return {
    success: errors.length === 0,
    created,
    skipped,
    errors,
  };
}

/**
 * Seed all initial content entries
 */
export async function seedAllContent(): Promise<{ success: boolean; created: number; skipped: number; errors: string[] }> {
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const entry of initialContent) {
    try {
      const exists = await contentExists(entry.pageKey, entry.sectionKey);
      if (exists) {
        skipped++;
        continue;
      }

      await createContentEntry(entry, true);
      created++;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Failed to create ${entry.pageKey}/${entry.sectionKey}: ${errorMsg}`);
    }
  }

  return {
    success: errors.length === 0,
    created,
    skipped,
    errors,
  };
}

/**
 * Get the list of pages that have seed content defined
 */
export function getSeedablePages(): string[] {
  const pages = new Set(initialContent.map((entry) => entry.pageKey));
  return Array.from(pages).sort();
}

/**
 * Get the number of content entries for a specific page
 */
export function getSeedableContentCount(pageKey: string): number {
  return initialContent.filter((entry) => entry.pageKey === pageKey).length;
}
