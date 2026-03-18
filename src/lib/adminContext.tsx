import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from './db';
import { currentUser } from './auth';

export interface AdminUser {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface AdminContextType {
  adminUser: AdminUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  checkAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAdminStatus = useCallback(async () => {
    const user = currentUser();
    
    if (!user) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, is_admin')
        .eq('id', user.id)
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching admin profile:', error);
        setAdminUser(null);
        setIsLoading(false);
        return;
      }

      if (profile && profile.is_admin) {
        setAdminUser({
          id: profile.id,
          username: profile.username,
          isAdmin: true,
        });
      } else {
        setAdminUser(null);
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
      setAdminUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAdminStatus();
  }, [checkAdminStatus]);

  return (
    <AdminContext.Provider
      value={{
        adminUser,
        isAdmin: adminUser?.isAdmin ?? false,
        isLoading,
        checkAdminStatus,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
