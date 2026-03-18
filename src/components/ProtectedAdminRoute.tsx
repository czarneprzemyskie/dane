import React from 'react';
import { useAdmin } from '../lib/adminContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps): React.ReactElement {
  const { isAdmin, isLoading } = useAdmin();

  // Show nothing while loading
  if (isLoading) {
    return <></>;
  }

  // Show nothing if not admin - don't show any error message
  if (!isAdmin) {
    return <></>;
  }

  // Admin user - render children
  return <>{children}</>;
}
