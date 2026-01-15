import { supabase } from './db';

const TABLE = 'visitor_count';

export async function incrementVisitorCount(): Promise<number> {
  // Increment the count and return the new value
  const { data, error } = await supabase.rpc('increment_visitor_count');
  if (error) throw error;
  return data;
}

export async function getVisitorCount(): Promise<number> {
  const { data, error } = await supabase.from(TABLE).select('count').single();
  if (error) throw error;
  return data?.count ?? 0;
}
