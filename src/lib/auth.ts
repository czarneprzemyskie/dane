import { supabase } from './db';

const CURRENT_KEY = 'czp_current';

export function currentUser(): { id: string; username: string } | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export async function logout() {
  await supabase.auth.signOut();
  localStorage.removeItem(CURRENT_KEY);
}

export async function register(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  username = username.trim();
  if (!username || !password) return { ok: false, error: 'Missing username or password' };

  // check username availability in profiles table
  const { data: existing, error: err } = await supabase.from('profiles').select('username').eq('username', username).limit(1);
  if (err) return { ok: false, error: err.message };
  if (existing && existing.length > 0) return { ok: false, error: 'Username taken' };

  // We use a derived email for auth (username@example.com) — replace with real emails if desired
  const email = `${username}@example.com`;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: error.message };

  // Insert profile row linking to the auth user id
  const userId = (data.user && data.user.id) || (data.user as any)?.id;
  if (!userId) return { ok: false, error: 'Could not create user' };

  const { error: e2 } = await supabase.from('profiles').insert([{ id: userId, username, created_at: new Date().toISOString() }]);
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username }));
  return { ok: true };
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  const email = `${username}@example.com`;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  const userId = data.user?.id;
  if (!userId) return { ok: false, error: 'No such user' };

  // fetch username from profiles table in case of mismatch
  const { data: profile, error: e2 } = await supabase.from('profiles').select('username').eq('id', userId).limit(1).single();
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username: profile.username }));
  return { ok: true };
}