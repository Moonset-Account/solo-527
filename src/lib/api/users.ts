'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, isSupabaseConfigured } from './base';
import { mockUsers } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { User } from '@/lib/types';

export async function fetchUsers(): Promise<User[]> {
  return safeQuery<User[]>(
    () => {
      const sb = supabase as any;
      return sb
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
    },
    mockUsers
  );
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return mockUsers.find((u) => u.email === email) || null;
  }
  try {
    const sb = supabase as any;
    const result = (await sb
      .from('users')
      .select('*')
      .eq('email', email)
      .single()) as { data: User | null; error: any };
    const { data, error } = result;
    if (error) {
      return mockUsers.find((u) => u.email === email) || null;
    }
    return (data as User) || mockUsers.find((u) => u.email === email) || null;
  } catch {
    return mockUsers.find((u) => u.email === email) || null;
  }
}

export async function createUser(user: Omit<User, 'id' | 'created_at'>): Promise<User> {
  const now = new Date().toISOString();
  return safeInsert<User>(
    'users',
    { ...user, created_at: now, updated_at: now },
    () => ({ ...user, id: generateId(), created_at: now, updated_at: now })
  );
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User> {
  return safeUpdate<User>(
    'users',
    userId,
    updates,
    () => ({ ...mockUsers.find((u) => u.id === userId)!, ...updates } as User)
  );
}
