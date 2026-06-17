import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

interface AuthContext {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
}

function parseAuthFromHeaders(request: NextRequest): AuthContext {
  const clerkUserId = request.headers.get("x-clerk-user-id");
  const clerkRole = request.headers.get("x-clerk-role");
  const clerkOrgRole = request.headers.get("x-clerk-org-role");

  let role: UserRole | null = null;
  if (clerkRole === "admin" || clerkOrgRole === "org:admin") {
    role = "OPERATIONS_MANAGER";
  } else if (clerkOrgRole === "org:doctor") {
    role = "DOCTOR";
  } else if (clerkRole === "basic_member" || clerkOrgRole === "org:member") {
    role = "FOLLOW_UP_STAFF";
  }

  return {
    userId: clerkUserId,
    role,
    orgRole: clerkOrgRole,
  };
}

export function middleware(request: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk =
    !!publishableKey && !publishableKey.includes("placeholder");

  const response = NextResponse.next();

  if (!hasClerk) {
    response.headers.set("x-clerk-user-id", "dev-admin");
    response.headers.set("x-clerk-org-role", "org:admin");
    return response;
  }

  const auth = parseAuthFromHeaders(request);

  if (!auth.userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/audit") && auth.role !== "OPERATIONS_MANAGER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!sign-in|sign-up|api/trpc|_next/static|_next/image|favicon.ico).*)",
  ],
};
