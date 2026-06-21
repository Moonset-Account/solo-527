"use client";

import React, { useMemo } from "react";
import { ClerkProvider } from "@clerk/nextjs";

/**
 * Auth Provider wrapper.
 * - When Clerk env vars are configured: use real Clerk authentication
 * - Otherwise (demo mode): provide a transparent wrapper so the app still runs
 */
export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const hasClerk = useMemo(
    () =>
      typeof process !== "undefined" &&
      !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      !!process.env.CLERK_SECRET_KEY,
    [],
  );

  if (hasClerk) {
    return (
      <ClerkProvider
        appearance={{
          variables: { colorPrimary: "#1E3A5F", colorTextOnPrimaryBackground: "#fff" },
        }}
      >
        {children}
      </ClerkProvider>
    );
  }
  // Demo mode fallback
  return <>{children}</>;
}
