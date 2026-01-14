import { v4 as uuidv4 } from 'uuid';
import { addUser, getUserByUsername } from './storage';
import type { User } from './storage';

const CURRENT_KEY = 'czp_current';

function simpleHash(s: string) {
  return btoa(s);
}

export function currentUser(): { id: string; username: string } | null {
  try {
    const raw = localStorage.getItem(CURRENT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function logout() {
  localStorage.removeItem(CURRENT_KEY);
}

export function register(username: string, password: string): { ok: boolean; error?: string } {
  username = username.trim();
  if (!username || !password) return { ok: false, error: 'Missing username or password' };
  if (getUserByUsername(username)) return { ok: false, error: 'Username taken' };
  const user: User = { id: uuidv4(), username, password: simpleHash(password) };
  addUser(user);
  return { ok: true };
}

export function login(username: string, password: string): { ok: boolean; error?: string } {
  const u = getUserByUsername(username);
  if (!u) return { ok: false, error: 'No such user' };
  if (u.password !== simpleHash(password)) return { ok: false, error: 'Invalid credentials' };
  localStorage.setItem(CURRENT_KEY, JSON.stringify({ id: u.id, username: u.username }));
  return { ok: true };
}
