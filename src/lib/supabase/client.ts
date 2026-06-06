'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

const isConfigured =
  typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-supabase-anon-key';

function createMockClient(): any {
  console.warn('⚠️ Supabase 未配置 - 使用演示模式');
  
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null }, error: new Error('请先配置 Supabase') }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
      insert: async () => ({ data: null, error: new Error('请先配置 Supabase') }),
      update: async () => ({ data: null, error: new Error('请先配置 Supabase') }),
    }),
  };
}

export function createClient(): SupabaseClient<Database> {
  if (!isConfigured) {
    return createMockClient() as SupabaseClient<Database>;
  }

  try {
    return createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  } catch (error) {
    console.error('Failed to create Supabase client, falling back to mock:', error);
    return createMockClient() as SupabaseClient<Database>;
  }
}

export const supabase = createClient();
