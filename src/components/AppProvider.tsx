"use client";

import { TRPCProvider } from "@/trpc/provider";
import {
  ClerkProvider,
  useAuth as useClerkAuth,
  useUser as useClerkUser,
} from "@clerk/nextjs";
import { useEffect, useState } from "react";

type UserRole = "OPERATIONS_MANAGER" | "FOLLOW_UP_STAFF" | "DOCTOR";

interface AuthContextValue {
  userId: string | null;
  role: UserRole | null;
  orgRole: string | null;
  isSignedIn: boolean;
  isLoaded: boolean;
}

function mapClerkRole(orgRole: string | undefined): UserRole | null {
  if (orgRole === "org:admin") return "OPERATIONS_MANAGER";
  if (orgRole === "org:doctor") return "DOCTOR";
  if (orgRole === "org:member") return "FOLLOW_UP_STAFF";
  return null;
}

function useAuthInternal(): AuthContextValue {
  const clerk = useClerkAuth();
  const [state, setState] = useState<AuthContextValue>({
    userId: null,
    role: null,
    orgRole: null,
    isSignedIn: false,
    isLoaded: false,
  });

  useEffect(() => {
    if (!clerk.isLoaded) return;

    const role = mapClerkRole(clerk.orgRole ?? undefined);

    setState({
      userId: clerk.userId,
      role,
      orgRole: clerk.orgRole ?? null,
      isSignedIn: !!clerk.isSignedIn,
      isLoaded: true,
    });
  }, [
    clerk.isLoaded,
    clerk.userId,
    clerk.orgRole,
    clerk.isSignedIn,
  ]);

  return state;
}

let cachedAuth: AuthContextValue | null = null;

export function useAuth(): AuthContextValue {
  const auth = useAuthInternal();
  if (auth.isLoaded) {
    cachedAuth = auth;
  }
  return cachedAuth ?? auth;
}

export function useIsOperationsManager(): boolean {
  const auth = useAuth();
  return auth.role === "OPERATIONS_MANAGER";
}

export function useIsDoctor(): boolean {
  const auth = useAuth();
  return auth.role === "DOCTOR";
}

export function useUser() {
  return useClerkUser();
}

function MockClerkProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AuthProviderWrapper({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasClerk =
    !!publishableKey && !publishableKey.includes("placeholder");

  if (hasClerk) {
    return <ClerkProvider>{children}</ClerkProvider>;
  }

  return <MockClerkProvider>{children}</MockClerkProvider>;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthProviderWrapper>
      <TRPCProvider>{children}</TRPCProvider>
    </AuthProviderWrapper>
  );
}
