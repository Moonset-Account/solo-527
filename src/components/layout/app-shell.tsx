"use client";

import { useSidebar } from "@/hooks/use-sidebar";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <>
      <Sidebar />
      <Header />
      <main
        className={cn(
          "min-h-screen pt-14 transition-all duration-300",
          collapsed ? "lg:pl-16" : "lg:pl-60"
        )}
      >
        <div className="mx-auto max-w-7xl px-6 py-6">{children}</div>
      </main>
    </>
  );
}
