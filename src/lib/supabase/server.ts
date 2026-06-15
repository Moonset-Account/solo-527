import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

function getEnv(): { url: string; anonKey: string } | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return null
  }

  return { url: supabaseUrl, anonKey: supabaseAnonKey }
}

export function createClient(cookieStore: {
  get: (name: string) => { value: string } | undefined
  set: (name: string, value: string, options: CookieOptions) => void
  remove?: (name: string, options: CookieOptions) => void
}) {
  const env = getEnv()
  if (!env) return null

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set(name, value, options)
        } catch {
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          if (cookieStore.remove) {
            cookieStore.remove(name, options)
          } else {
            cookieStore.set(name, '', options)
          }
        } catch {
        }
      },
    },
  })
}

export function createSupabaseServerClient() {
  const env = getEnv()
  if (!env) return null

  const cookieStore = cookies()
  return createServerClient(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
        }
      },
    },
  })
}

interface MiddlewareResult {
  supabase: ReturnType<typeof createServerClient> | null
  getResponse: () => NextResponse
}

export function createSupabaseMiddlewareClient(
  request: NextRequest,
  response: NextResponse
): MiddlewareResult {
  const env = getEnv()
  if (!env) {
    return { supabase: null, getResponse: () => response }
  }

  let currentResponse = response

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        currentResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        currentResponse.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        currentResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        currentResponse.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })

  return {
    supabase,
    getResponse: () => currentResponse,
  }
}
