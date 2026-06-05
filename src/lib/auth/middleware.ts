import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { UserRole } from '@/types/database'

const STAFF_ROLES: UserRole[] = ['admin', 'manager']

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return response
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value, ...options })
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options })
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        })
        response.cookies.set({ name, value: '', ...options })
      },
    },
  })

  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile && request.nextUrl.pathname.startsWith('/admin')) {
        if (!STAFF_ROLES.includes(profile.role)) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    }
  } catch (error) {
    console.log('Auth check skipped:', error)
  }

  return response
}

export function isStaffRole(role: UserRole | undefined | null): boolean {
  if (!role) return false
  return STAFF_ROLES.includes(role)
}

export function isAdminRole(role: UserRole | undefined | null): boolean {
  if (!role) return false
  return role === 'admin'
}
