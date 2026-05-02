import React from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

export default function RoleGuard({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then((r) => r.data.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0F1117] text-white font-mono uppercase tracking-widest text-xs">
        Loading Account Role...
      </div>
    );
  }

  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to={profile?.role === 'consumer' ? '/consumer' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}
