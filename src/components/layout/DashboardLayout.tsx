"use client";

import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";
import { FilterPanel } from "@/components/filters/FilterPanel";
import { useAppStore } from "@/store";
import { cn } from "@/utils";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isFilterPanelOpen = useAppStore((state) => state.isFilterPanelOpen);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <div className="flex-1 flex overflow-hidden">
          {isFilterPanelOpen && (
            <div className="w-64 border-r border-neutral-200 bg-white overflow-y-auto flex-shrink-0">
              <FilterPanel />
            </div>
          )}
          <main
            className={cn(
              "flex-1 overflow-y-auto p-4 bg-neutral-50",
              !isFilterPanelOpen && "ml-0"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
