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

export async function register(username: string, email: string, password: string, recaptchaToken?: string): Promise<{ ok: boolean; error?: string }> {
  // basic validation
  username = username.trim();
  email = email.trim();
  if (!username || !email || !password) return { ok: false, error: 'Missing username, email, or password' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };
  // Optionally, send recaptchaToken to your backend for verification here
  if (recaptchaToken) {
    // Example: await fetch('/api/verify-recaptcha', { method: 'POST', body: JSON.stringify({ token: recaptchaToken }) })
    // You should implement this endpoint in your backend
  }

  // sanitize username to check for duplicates
  const sanitized = username
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\u0300-\u036f/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  if (!sanitized) return { ok: false, error: 'Invalid username after sanitization' };

  // check username availability in profiles table (first check sanitized, then original)
  const { data: existingSan, error: err1 } = await supabase.from('profiles').select('username').eq('username', sanitized).limit(1);
  if (err1) return { ok: false, error: err1.message };
  if (existingSan && existingSan.length > 0) return { ok: false, error: 'Username taken' };

  const { data: existingOrig, error: err2 } = await supabase.from('profiles').select('username').eq('username', username).limit(1);
  if (err2) return { ok: false, error: err2.message };
  if (existingOrig && existingOrig.length > 0) return { ok: false, error: 'Username taken' };

  // Register with provided email
  let resp = await supabase.auth.signUp({ email, password });
  if (resp.error) return { ok: false, error: resp.error.message };
  // Insert profile row linking to the auth user id
  const userId = resp.data?.user?.id;
  if (!userId) return { ok: false, error: 'Could not create user' };

  const { error: e2 } = await supabase.from('profiles').insert([{ id: userId, username, email, created_at: new Date().toISOString() }]);
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username }));
  return { ok: true };
}

export async function login(email: string, password: string): Promise<{ ok: boolean; error?: string }> {
  email = email.trim();
  if (!email || !password) return { ok: false, error: 'Missing email or password' };

  let signinResp = await supabase.auth.signInWithPassword({ email, password });
  if (signinResp.error) return { ok: false, error: signinResp.error.message };
  const userId = signinResp.data.user?.id;
  if (!userId) return { ok: false, error: 'No such user' };

  // fetch username from profiles table in case of mismatch
  const { data: profile, error: e2 } = await supabase.from('profiles').select('username').eq('id', userId).limit(1).single();
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username: profile.username }));
  return { ok: true };
}