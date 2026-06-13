import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];
const AUTH_COOKIE_NAME = 'weekly-meeting-dashboard-store';

function decodeAuthCookie(cookieValue: string) {
  try {
    const decoded = decodeURIComponent(cookieValue);
    return JSON.parse(decoded);
  } catch {
    try {
      return JSON.parse(cookieValue);
    } catch {
      return null;
    }
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (authCookie) {
      const storeData = decodeAuthCookie(authCookie.value);
      if (storeData?.state?.currentUser) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);

  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const storeData = decodeAuthCookie(authCookie.value);
  if (!storeData?.state?.currentUser) {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete(AUTH_COOKIE_NAME);
    return response;
  }

  const userRole = storeData.state.currentUser.role;

  if (pathname.startsWith('/admin')) {
    if (userRole !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  if (pathname === '/statistics') {
    if (userRole === 'user') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
