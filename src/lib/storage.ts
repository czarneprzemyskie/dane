import { supabase, mapPost, mapPlate } from './db';

export type User = {
  id: string;
  username: string;
};

export type Plate = {
  id: string;
  registration: string;
  owner?: string | null; // optional owner username
  notes?: string;
  createdAt: string;
};

export type Post = {
  id: string;
  author: string;
  title: string;
  body: string;
  createdAt: string;
};

export async function getPlates(): Promise<Plate[]> {
  const { data, error } = await supabase.from('plates').select('id,registration,owner,notes,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPlate) as Plate[];
}

export async function addPlate(p: Plate) {
  const { error } = await supabase.from('plates').insert([{ id: p.id, registration: p.registration, owner: p.owner, notes: p.notes, created_at: p.createdAt }]);
  if (error) throw error;
}

export async function searchPlates(q: string): Promise<Plate[]> {
  const s = q.trim();
  if (!s) return getPlates();
  const pattern = `%${s}%`;
  const { data, error } = await supabase.from('plates').select('id,registration,owner,notes,created_at').or(`registration.ilike.${pattern},notes.ilike.${pattern}`);
  if (error) throw error;
  return (data ?? []).map(mapPlate) as Plate[];
}

export async function removePlate(id: string): Promise<boolean> {
  const { error } = await supabase.from('plates').delete().eq('id', id);
  if (error) return false;
  return true;
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select('id,author,title,body,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPost) as Post[];
}

export async function addPost(post: Post) {
  const { error } = await supabase.from('posts').insert([{ id: post.id, author: post.author, title: post.title, body: post.body, created_at: post.createdAt }]);
  if (error) throw error;
}

export async function removePost(id: string): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return false;
  return true;
}
