'use client';

import { supabase } from '@/lib/supabase/client';
import { safeQuery, safeInsert, safeUpdate, isSupabaseConfigured } from './base';
import { mockUsers } from '@/lib/mock-data';
import { generateId } from '@/lib/utils';
import type { User } from '@/lib/types';

export async function fetchUsers(): Promise<User[]> {
  return safeQuery<User[]>(
    () =>
      supabase
        .from('users' as any)
        .select('*')
        .order('created_at', { ascending: false }) as unknown as Promise<{
        data: User[] | null;
        error: any;
      }>,
    mockUsers
  );
}

export async function fetchUserByEmail(email: string): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return mockUsers.find((u) => u.email === email) || null;
  }
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error) return null;
    return data as User;
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
