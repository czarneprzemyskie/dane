import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!url || !key) console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY not set. Supabase client will not work until they are configured.');

export const supabase: SupabaseClient = createClient(url ?? '', key ?? '');

// Helper to map returned rows to local shapes
export function mapPost(row: any) {
  return {
    id: row.id,
    author: row.author,
    title: row.title,
    body: row.body,
    createdAt: row.created_at ?? row.createdAt,
  } as const;
}

export function mapPlate(row: any) {
  return {
    id: row.id,
    registration: row.registration,
    owner: row.owner ?? null,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? row.createdAt,
  } as const;
}
