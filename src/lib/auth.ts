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
  // basic validation
  username = username.trim();
  if (!username || !password) return { ok: false, error: 'Missing username or password' };
  if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters' };

  // sanitize username to create a valid email local-part (remove diacritics and illegal chars)
  const sanitized = username
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
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

  // We use a derived email for auth. Try a simple example domain first and
  // fall back to using the project's Supabase hostname if the email is rejected
  // (some projects block example.com or validate domains).
  const tryEmail = (domain: string) => `${sanitized}@${domain}`;
  const primaryEmail = tryEmail('example.com');

  let resp = await supabase.auth.signUp({ email: primaryEmail, password });
  if (resp.error) {
    // if invalid email, try using the Supabase project's hostname as the domain
    try {
      const supaUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      if (supaUrl && /invalid/i.test(resp.error.message)) {
        const host = new URL(supaUrl).hostname;
        const fallbackEmail = tryEmail(host);
        resp = await supabase.auth.signUp({ email: fallbackEmail, password });
      }
    } catch (e) {
      // ignore URL parsing errors and fall through to error handling
    }
  }

  if (resp.error) return { ok: false, error: resp.error.message };
  // Insert profile row linking to the auth user id
  const userId = resp.data?.user?.id;
  if (!userId) return { ok: false, error: 'Could not create user' };

  const { error: e2 } = await supabase.from('profiles').insert([{ id: userId, username, created_at: new Date().toISOString() }]);
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username }));
  return { ok: true };
}

export async function login(username: string, password: string): Promise<{ ok: boolean; error?: string }> {
  username = username.trim();
  if (!username || !password) return { ok: false, error: 'Missing username or password' };

  const sanitized = username
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');

  if (!sanitized) return { ok: false, error: 'Invalid username' };

  // Try with example.com first, then fallback to project's hostname in case
  // the simple domain is rejected when created earlier.
  const tryEmail = (domain: string) => `${sanitized}@${domain}`;
  const primaryEmail = tryEmail('example.com');

  let signinResp = await supabase.auth.signInWithPassword({ email: primaryEmail, password });
  if (signinResp.error) {
    try {
      const supaUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
      if (supaUrl) {
        const host = new URL(supaUrl).hostname;
        const fallbackEmail = tryEmail(host);
        signinResp = await supabase.auth.signInWithPassword({ email: fallbackEmail, password });
      }
    } catch (e) {
      // ignore and fall through
    }
  }

  if (signinResp.error) return { ok: false, error: signinResp.error.message };
  const userId = signinResp.data.user?.id;
  if (!userId) return { ok: false, error: 'No such user' };

  // fetch username from profiles table in case of mismatch
  const { data: profile, error: e2 } = await supabase.from('profiles').select('username').eq('id', userId).limit(1).single();
  if (e2) return { ok: false, error: e2.message };

  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: userId, username: profile.username }));
  return { ok: true };
}