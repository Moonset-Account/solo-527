'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

export type { Profile };

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
