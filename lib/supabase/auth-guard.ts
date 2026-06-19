import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { UserRole } from '../types';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

  const supabase = createServerClient(url, anon, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({ request });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { response, user };
  } catch {
    return { response, user: null };
  }
}

export interface AuthContext {
  userId: string | null;
  role: UserRole | null;
  email: string | null;
}

const ROLE_BY_EMAIL: Record<string, UserRole> = {
  'manager@autoparts.com': 'store_manager',
  'reception@autoparts.com': 'reception',
  'warehouse@autoparts.com': 'warehouse',
  'lead@autoparts.com': 'team_lead',
  'tech@autoparts.com': 'team_lead',
  'inspector@autoparts.com': 'inspector',
};

export function deriveRole(email: string | null | undefined): UserRole | null {
  if (!email) return null;
  if (email in ROLE_BY_EMAIL) return ROLE_BY_EMAIL[email];
  return 'reception';
}

export const ROUTE_ROLES: Record<string, UserRole[] | 'all'> = {
  '/dashboard': 'all',
  '/vehicles': ['reception', 'store_manager'],
  '/vehicles/new': ['reception', 'store_manager'],
  '/parts': ['warehouse', 'store_manager'],
  '/parts/new': ['warehouse', 'store_manager'],
  '/parts/turnover': ['warehouse', 'store_manager'],
  '/workorders': 'all',
  '/workorders/new': ['reception', 'store_manager'],
  '/production/schedule': ['team_lead', 'store_manager'],
  '/production/nodes': ['team_lead', 'store_manager'],
  '/quality': ['inspector', 'store_manager'],
  '/quality/new': ['inspector', 'store_manager'],
  '/order-changes': ['reception', 'store_manager'],
  '/order-changes/new': ['reception', 'store_manager'],
  '/callbacks': ['store_manager'],
  '/settings/users': ['store_manager'],
  '/settings/roles': ['store_manager'],
};

export function roleCanAccessRoute(
  role: UserRole | null,
  pathname: string,
): { allowed: boolean; matchedPrefix: string } {
  if (role === null) return { allowed: false, matchedPrefix: '' };
  if (role === 'store_manager') return { allowed: true, matchedPrefix: pathname };

  const sortedKeys = Object.keys(ROUTE_ROLES).sort((a, b) => b.length - a.length);
  for (const prefix of sortedKeys) {
    if (pathname === prefix || pathname.startsWith(prefix + '/')) {
      const allowed = ROUTE_ROLES[prefix];
      if (allowed === 'all' || allowed.includes(role)) {
        return { allowed: true, matchedPrefix: prefix };
      }
      return { allowed: false, matchedPrefix: prefix };
    }
  }
  return { allowed: true, matchedPrefix: '' };
}
