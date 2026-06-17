import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!sign-in|sign-up|api/trpc|_next/static|_next/image|favicon.ico).*)",
  ],
};
