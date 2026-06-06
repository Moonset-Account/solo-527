'use client';

import { useEffect, useState } from 'react';
import { AuthContext } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import type { AuthContextType } from './useAuth';

export { useAuth, usePermissions } from './useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextType, 'signOut'>>({
    user: null,
    profile: null,
    loading: true,
  });
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setState({ user, profile: profile || null, loading: false });
        } else {
          setState({ user: null, profile: null, loading: false });
        }
      } catch (error) {
        console.error('Error loading user:', error);
        setState({ user: null, profile: null, loading: false });
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user || null;
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setState({ user, profile: profile || null, loading: false });
        } else {
          setState({ user: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    ...state,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
