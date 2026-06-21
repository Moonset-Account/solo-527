"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserRole } from "@prisma/client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { api } from "@/trpc/react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | undefined>();

  const { data: currentUser } = api.user.getCurrent.useQuery(undefined, {
    enabled: isLoaded && !!user,
  });

  useEffect(() => {
    if (currentUser) {
      setUserRole(currentUser.role as UserRole);
    } else if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role as UserRole);
    }
  }, [currentUser, user]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userRole={userRole} />
      <div className="pl-64">
        <Header
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          sidebarOpen={sidebarOpen}
        />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
