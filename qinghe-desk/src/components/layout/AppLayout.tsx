import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TRPCProvider } from "@/lib/provider";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      <div className="flex min-h-screen bg-[#F8F6F0]">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-8 py-8">{children}</div>
        </main>
      </div>
    </TRPCProvider>
  );
}
