import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createSupabaseMiddlewareClient } from '@/lib/supabase/server'
import type { UserRole } from '@/types'

const PUBLIC_PATTERNS = [
  /^\/login$/,
  /^\/favicon\.ico$/,
  /^\/_next\//,
  /^\/api\//,
]

const isPublicPath = (pathname: string): boolean => {
  return PUBLIC_PATTERNS.some((pattern) => pattern.test(pathname))
}

const VALID_ROLES: UserRole[] = ['researcher', 'archivist', 'admin', 'equipment_teacher']

const fetchUserRole = async (
  supabase: NonNullable<
    Awaited<ReturnType<typeof createSupabaseMiddlewareClient>>['supabase']
  >,
  userId: string
): Promise<UserRole> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !data) {
      return 'researcher'
    }

    const role = data.role as UserRole
    return VALID_ROLES.includes(role) ? role : 'researcher'
  } catch {
    return 'researcher'
  }
}

const ROLE_ACCESS: Record<string, UserRole[]> = {
  '/booking': ['researcher', 'admin'],
  '/archive': ['researcher', 'archivist', 'admin'],
  '/permissions': ['admin'],
  '/equipment': ['admin', 'equipment_teacher'],
  '/admin': ['admin'],
}

function canAccess(pathname: string, role: UserRole): boolean {
  for (const [prefix, roles] of Object.entries(ROLE_ACCESS)) {
    if (pathname.startsWith(prefix)) {
      return roles.includes(role)
    }
  }
  return true
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const baseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (isPublicPath(pathname)) {
    return baseResponse
  }

  const { supabase, getResponse } = createSupabaseMiddlewareClient(request, baseResponse)

  if (!supabase) {
    return baseResponse
  }

  let user: import('@supabase/supabase-js').User | null = null
  try {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser
  } catch {
    user = null
  }

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname)
    }
    return NextResponse.redirect(loginUrl)
  }

  const role = await fetchUserRole(supabase, user.id)
  const response = getResponse()

  if (pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!canAccess(pathname, role)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
