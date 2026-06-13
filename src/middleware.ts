import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/trpc(.*)",
]);

export default function middleware(request: NextRequest) {
  try {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;

    const hasValidKeys =
      publishableKey &&
      !publishableKey.startsWith("pk_test_xxx") &&
      secretKey &&
      !secretKey.startsWith("sk_test_xxx");

    if (!hasValidKeys) {
      return NextResponse.next();
    }

    return clerkMiddleware(async (auth, req) => {
      if (!isPublicRoute(req)) {
        await auth().protect();
      }
    })(request as Parameters<typeof clerkMiddleware>[0]);
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
