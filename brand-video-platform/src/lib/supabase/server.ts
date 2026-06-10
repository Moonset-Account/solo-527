import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export function createServerClient(): SupabaseClient<Database> | null {
  if (!url) return null
  const key = serviceKey || anonKey
  if (!key) return null
  return createClient<Database>(`https://${url}`, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: serviceKey ? { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } : undefined,
    },
  })
}

export function hasSupabaseConfig(): boolean {
  return Boolean(url && (serviceKey || anonKey))
}
