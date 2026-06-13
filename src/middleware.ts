import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/trpc(.*)",
]);

const hasValidClerkKeys = (): boolean => {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const sk = process.env.CLERK_SECRET_KEY;
  return Boolean(
    pk && !pk.startsWith("pk_test_xxx") && sk && !sk.startsWith("sk_test_xxx")
  );
};

const clerkHandler = (auth: any, request: any) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
};

export default function middleware(request: NextRequest, event: any) {
  if (!hasValidClerkKeys()) {
    return NextResponse.next();
  }
  const handler = clerkMiddleware(clerkHandler);
  return handler(request as any, event);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
