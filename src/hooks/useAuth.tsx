'use client';

import { useEffect, useState } from 'react';
import { AuthContext } from './useAuth';
import { createClient } from '@/lib/supabase/client';
import type { AuthContextType, Profile } from './useAuth';

export { useAuth, usePermissions } from './useAuth';

const mockProfile: Profile = {
  id: 'demo-user',
  email: 'admin@museum.com',
  full_name: '演示管理员',
  role: 'admin',
  created_at: new Date().toISOString(),
};

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
          setState({ user: null, profile: mockProfile, loading: false });
        }
      } catch (error) {
        console.warn('Auth fallback to demo mode:', error);
        setState({ user: null, profile: mockProfile, loading: false });
      }
    };

    getCurrentUser();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          const user = session?.user || null;
          if (user) {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();
              setState({ user, profile: profile || null, loading: false });
            } catch {
              setState({ user, profile: mockProfile, loading: false });
            }
          } else {
            setState({ user: null, profile: mockProfile, loading: false });
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch {
      return () => {};
    }
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn('Sign out fallback:', error);
    }
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
