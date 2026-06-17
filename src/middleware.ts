import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

interface AuthContext {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
}

function mapClerkRole(orgRole: string | undefined | null): UserRole | null {
  if (orgRole === "org:admin") return "OPERATIONS_MANAGER";
  if (orgRole === "org:doctor") return "DOCTOR";
  if (orgRole === "org:member") return "FOLLOW_UP_STAFF";
  return null;
}

async function getAuthContext(request: NextRequest): Promise<AuthContext> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk =
    !!publishableKey && !publishableKey.includes("placeholder");

  if (!hasClerk) {
    return {
      userId: request.headers.get("x-clerk-user-id"),
      role: mapClerkRole(request.headers.get("x-clerk-org-role")),
      orgRole: request.headers.get("x-clerk-org-role"),
    };
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId, orgRole, has } = await auth();

    const role = mapClerkRole(orgRole);

    return {
      userId,
      role,
      orgRole: orgRole ?? null,
    };
  } catch {
    return {
      userId: null,
      role: null,
      orgRole: null,
    };
  }
}

export async function middleware(request: NextRequest) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk =
    !!publishableKey && !publishableKey.includes("placeholder");

  const response = NextResponse.next();

  const auth = await getAuthContext(request);

  if (hasClerk && !auth.userId) {
    const { redirectToSignIn } = await import("@clerk/nextjs/server");
    return redirectToSignIn({ returnBackUrl: request.url });
  }

  if (auth.userId) {
    response.headers.set("x-clerk-user-id", auth.userId);
  }
  if (auth.orgRole) {
    response.headers.set("x-clerk-org-role", auth.orgRole);
  }
  if (auth.role) {
    response.headers.set("x-clerk-role", auth.role);
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
