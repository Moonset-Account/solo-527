import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isClerkConfigured = () =>
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

const needAuth = process.env.DEV_BYPASS_AUTH !== "1" && isClerkConfigured();

export async function middleware(request: NextRequest) {
  if (!needAuth) return NextResponse.next();
  try {
    const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
    const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)", "/api(.*)"]);
    return clerkMiddleware((auth, req) => {
      if (!isPublicRoute(req)) auth().protect();
      return NextResponse.next();
    })(request, {} as any);
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
