import React from 'react';
import { useAdmin } from '../lib/adminContext';
import { currentUser } from '../lib/auth';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedAdminRoute({ children, fallback }: ProtectedAdminRouteProps): React.ReactElement {
  const { isAdmin, isLoading, adminUser: _adminUser } = useAdmin();
  const user = currentUser();

  // Show loading state while checking admin status
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="retro-card">
          <p className="text-center">Sprawdzanie uprawnień...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show fallback or redirect to login
  if (!user) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="p-4">
        <div className="retro-card">
          <h2 className="text-xl font-semibold mb-2">Dostęp ograniczony</h2>
          <p>Musisz być zalogowany, aby uzyskać dostęp do tej strony.</p>
        </div>
      </div>
    );
  }

  // Authenticated but not admin - show fallback or access denied
  if (!isAdmin) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="p-4">
        <div className="retro-card">
          <h2 className="text-xl font-semibold mb-2">Brak uprawnień</h2>
          <p>Ta strona jest dostępna tylko dla administratorów.</p>
        </div>
      </div>
    );
  }

  // Admin user - render children
  return <>{children}</>;
}
