import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/_next/static(.*)",
  "/_next/image(.*)",
  "/favicon.ico",
]);

const isTrpcRoute = createRouteMatcher(["/api/trpc(.*)"]);

type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

function mapClerkRole(orgRole: string | undefined | null): UserRole | null {
  if (orgRole === "org:admin") return "OPERATIONS_MANAGER";
  if (orgRole === "org:doctor") return "DOCTOR";
  if (orgRole === "org:member") return "FOLLOW_UP_STAFF";
  return null;
}

function hasClerkKeys(): boolean {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  return (
    !!publishableKey &&
    !publishableKey.includes("placeholder") &&
    !!secretKey &&
    !secretKey.includes("placeholder")
  );
}

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!hasClerkKeys()) {
    return NextResponse.next();
  }

  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  const authObj = await auth();

  if (isTrpcRoute(request)) {
    return NextResponse.next();
  }

  if (!authObj.userId) {
    return authObj.redirectToSignIn();
  }

  const role = mapClerkRole(authObj.orgRole);
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/audit") && role !== "OPERATIONS_MANAGER") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
