"use client";

import { TRPCProvider } from "@/trpc/provider";

const hasClerkKey =
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

type AuthContextValue = {
  userId: string | null;
  role: "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR" | null;
  isSignedIn: boolean;
};

let sharedAuth: AuthContextValue = {
  userId: "dev-admin",
  role: "OPERATIONS_MANAGER",
  isSignedIn: true,
};

function getFallbackAuth(): AuthContextValue {
  if (typeof window !== "undefined") {
    const stored = (window as unknown as { __tcm_auth?: AuthContextValue }).__tcm_auth;
    if (stored) return stored;
  }
  return sharedAuth;
}

function setFallbackAuth(auth: AuthContextValue) {
  sharedAuth = auth;
  if (typeof window !== "undefined") {
    (window as unknown as { __tcm_auth?: AuthContextValue }).__tcm_auth = auth;
  }
}

export function useAuth(): AuthContextValue {
  return getFallbackAuth();
}

export function useIsOperationsManager(): boolean {
  const auth = getFallbackAuth();
  return auth.role === "OPERATIONS_MANAGER";
}

export function useIsDoctor(): boolean {
  const auth = getFallbackAuth();
  return auth.role === "DOCTOR";
}

export const setAuth = setFallbackAuth;

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
