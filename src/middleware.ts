import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'wmc_session';

const PUBLIC_PATHS = [
  '/login',
  '/api/auth',
  '/api/auth/me',
  '/_next',
  '/favicon.ico',
  '/public',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const hasSession = request.cookies.has(SESSION_COOKIE);

  if (!hasSession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, error: '未登录或会话已过期' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
