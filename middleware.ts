import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('weekly-meeting-dashboard-store');
  
  if (!authCookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const storeData = JSON.parse(authCookie.value);
    if (!storeData.state?.currentUser) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (pathname.startsWith('/admin')) {
      const userRole = storeData.state.currentUser.role;
      if (userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    if (pathname === '/statistics') {
      const userRole = storeData.state.currentUser.role;
      if (userRole === 'user') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
