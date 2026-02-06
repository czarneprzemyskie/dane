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
  photoUrl?: string;
  createdAt: string;
};

export type Post = {
  id: string;
  author: string;
  title: string;
  body: string;
  photoUrl?: string;
  createdAt: string;
};

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'uploads';

export async function getPlates(): Promise<Plate[]> {
  const { data, error } = await supabase.from('plates').select('id,registration,owner,notes,photo_url,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPlate) as Plate[];
}

export async function addPlate(p: Plate) {
  const { error } = await supabase.from('plates').insert([{ id: p.id, registration: p.registration, owner: p.owner, notes: p.notes, photo_url: p.photoUrl, created_at: p.createdAt }]);
  if (error) throw error;
}

export async function searchPlates(q: string): Promise<Plate[]> {
  const s = q.trim();
  if (!s) return getPlates();
  const pattern = `%${s}%`;
  const { data, error } = await supabase.from('plates').select('id,registration,owner,notes,photo_url,created_at').or(`registration.ilike.${pattern},notes.ilike.${pattern}`);
  if (error) throw error;
  return (data ?? []).map(mapPlate) as Plate[];
}

export async function removePlate(id: string): Promise<boolean> {
  const { error } = await supabase.from('plates').delete().eq('id', id);
  if (error) return false;
  return true;
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await supabase.from('posts').select('id,author,title,body,photo_url,created_at').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapPost) as Post[];
}

export async function addPost(post: Post) {
  const { error } = await supabase.from('posts').insert([{ id: post.id, author: post.author, title: post.title, body: post.body, photo_url: post.photoUrl, created_at: post.createdAt }]);
  if (error) throw error;
}

export async function uploadImage(file: File, folder: 'plates' | 'posts', id: string): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ext.replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${id}-${Date.now()}.${safeExt}`;
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
    contentType: file.type || 'image/jpeg',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function removePost(id: string): Promise<boolean> {
  const { error } = await supabase.from('posts').delete().eq('id', id);
  if (error) return false;
  return true;
}
