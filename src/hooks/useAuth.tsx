'use client';

import { useEffect, useState, createContext, useContext } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setProfile(profile);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function usePermissions() {
  const { profile } = useAuth();

  const can = (permission: string): boolean => {
    if (!profile) return false;

    const rolePermissions: Record<string, string[]> = {
      admin: ['all'],
      curator: [
        'exhibits:read', 'exhibits:write',
        'contracts:read', 'contracts:write',
        'applications:read', 'applications:write',
        'installations:read', 'installations:write',
        'deinstallations:read', 'deinstallations:write',
        'locations:read', 'locations:write',
        'condition_reports:read',
        'institutions:read',
      ],
      registrar: [
        'exhibits:read', 'exhibits:write',
        'contracts:read', 'contracts:write',
        'applications:read', 'applications:write',
        'insurance:read', 'insurance:write',
        'transport:read', 'transport:write',
        'condition_reports:read', 'condition_reports:write',
        'institutions:read', 'institutions:write',
        'locations:read',
        'import_export',
      ],
      conservator: [
        'exhibits:read',
        'condition_reports:read', 'condition_reports:write',
      ],
      logistics: [
        'exhibits:read',
        'transport:read', 'transport:write',
        'crates:read', 'crates:write',
        'installations:read', 'installations:write',
        'deinstallations:read', 'deinstallations:write',
      ],
      finance: [
        'contracts:read',
        'insurance:read',
        'reconciliation:read', 'reconciliation:write',
      ],
      viewer: [
        'exhibits:read',
        'contracts:read',
        'applications:read',
        'locations:read',
      ],
    };

    const userPermissions = rolePermissions[profile.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  };

  return { can, role: profile?.role };
}
