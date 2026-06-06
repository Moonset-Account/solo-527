import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

const isConfigured =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your-supabase-url' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your-supabase-anon-key';

function createMockClient(): any {
  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
    }),
  };
}

export async function createClient(): Promise<SupabaseClient<Database>> {
  if (!isConfigured) {
    return createMockClient() as SupabaseClient<Database>;
  }

  try {
    const { createServerClient } = await import('@supabase/ssr');
    const cookieStore = await cookies();

    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Failed to create server Supabase client:', error);
    return createMockClient() as SupabaseClient<Database>;
  }
}
