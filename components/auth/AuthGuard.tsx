import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { isDemoMode } from '../../services/demo';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return <div className="flex items-center justify-center min-h-screen bg-[#0F1117] text-white font-mono uppercase tracking-widest text-xs">Loading Auth Session...</div>;
  if (isDemoMode()) return <>{children}</>;
  if (!session) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
}
