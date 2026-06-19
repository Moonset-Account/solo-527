import { NextRequest, NextResponse } from 'next/server';
import { updateSession, deriveRole, roleCanAccessRoute } from '@/lib/supabase/auth-guard';

const PUBLIC_PATHS = ['/login', '/_next', '/favicon.ico', '/api'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const res = await updateSession(request);
    return res.response;
  }

  const { response, user } = await updateSession(request);

  const demoAuth = request.cookies.get('demo_role')?.value;
  const demoEmail = request.cookies.get('demo_email')?.value;

  const email = user?.email ?? demoEmail ?? null;
  const role = demoAuth
    ? (demoAuth as any)
    : deriveRole(email);

  if (!email) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const { allowed } = roleCanAccessRoute(role, pathname);
  if (!allowed) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url, { headers: response.headers });
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
