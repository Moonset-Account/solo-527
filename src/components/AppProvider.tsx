"use client";

import { TRPCProvider } from "@/trpc/provider";

const hasClerkKey =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

function MockClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  if (hasClerkKey) {
    try {
      const { ClerkProvider } = require("@clerk/nextjs");
      return <ClerkProvider>{children}</ClerkProvider>;
    } catch {
      return <MockClerkProvider>{children}</MockClerkProvider>;
    }
  }
  return <MockClerkProvider>{children}</MockClerkProvider>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TRPCProvider>{children}</TRPCProvider>
    </AuthProvider>
  );
}
