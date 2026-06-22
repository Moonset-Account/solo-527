import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authCookie = request.cookies.get('auth_user');

  const publicPaths = ['/login'];
  const isPublicPath = publicPaths.includes(pathname);

  if (pathname === '/') {
    if (authCookie) {
      try {
        const user = JSON.parse(authCookie.value);
        if (user.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        } else {
          return NextResponse.redirect(new URL('/resident', request.url));
        }
      } catch {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isPublicPath && authCookie) {
    try {
      const user = JSON.parse(authCookie.value);
      if (user.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      } else {
        return NextResponse.redirect(new URL('/resident', request.url));
      }
    } catch {
      return NextResponse.next();
    }
  }

  if (!isPublicPath && !authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!isPublicPath && authCookie) {
    try {
      const user = JSON.parse(authCookie.value);
      const isAdminPath = pathname.startsWith('/admin');
      const isResidentPath = pathname.startsWith('/resident');

      if (isAdminPath && user.role !== 'admin') {
        return NextResponse.redirect(new URL('/resident', request.url));
      }
      if (isResidentPath && user.role !== 'resident') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/resident/:path*'],
};
