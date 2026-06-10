'use client'

import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  url && anonKey
    ? createClient<Database>(`https://${url}`, anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null

export function hasSupabaseConfig(): boolean {
  return Boolean(url && anonKey)
}
