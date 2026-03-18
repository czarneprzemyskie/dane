import { supabase } from './db';
import { currentUser } from './auth';

export interface AdminProfile {
  id: string;
  username: string;
  is_admin: boolean;
}

/**
 * Check if the current user is an admin
 */
export async function isAdminUser(): Promise<boolean> {
  const user = currentUser();
  
  if (!user) {
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .limit(1)
    .single();

  return profile?.is_admin ?? false;
}

/**
 * Get the admin profile for the current user
 */
export async function getAdminProfile(): Promise<AdminProfile | null> {
  const user = currentUser();
  
  if (!user) {
    return null;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, is_admin')
    .eq('id', user.id)
    .limit(1)
    .single();

  if (error || !profile) {
    return null;
  }

  return {
    id: profile.id,
    username: profile.username,
    is_admin: profile.is_admin,
  };
}

/**
 * Require admin - throws error if not admin
 * @throws Error if user is not authenticated or not an admin
 */
export async function requireAdmin(): Promise<AdminProfile> {
  const user = currentUser();
  
  if (!user) {
    throw new Error('Authentication required');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, is_admin')
    .eq('id', user.id)
    .limit(1)
    .single();

  if (error || !profile) {
    throw new Error('Failed to fetch user profile');
  }

  if (!profile.is_admin) {
    throw new Error('Admin access required');
  }

  return {
    id: profile.id,
    username: profile.username,
    is_admin: profile.is_admin,
  };
}

/**
 * Check if a specific user is an admin
 * @param userId - The user ID to check
 */
export async function checkUserIsAdmin(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .limit(1)
    .single();

  return profile?.is_admin ?? false;
}
