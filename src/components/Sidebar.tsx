"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "病历随访台", href: "/", icon: LayoutDashboard },
  { label: "随访任务", href: "/follow-ups", icon: ClipboardList },
  { label: "复诊率报表", href: "/reports", icon: BarChart3 },
  { label: "变更审计", href: "/audit", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col bg-white border-r border-beige-dark transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-2 px-4 h-16 border-b border-beige-dark",
          sidebarCollapsed && "justify-center px-0"
        )}
      >
        <Activity className="w-6 h-6 text-green-primary shrink-0" />
        {!sidebarCollapsed && (
          <span className="text-lg font-bold text-indigo-primary font-[var(--font-noto-serif-sc)]">
            中医随访
          </span>
        )}
      </div>

      <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-indigo-primary text-white"
                  : "text-indigo-primary/70 hover:bg-beige-dark",
                sidebarCollapsed && "justify-center px-0"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-beige-dark px-2 py-3">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center py-2 text-indigo-primary/50 hover:text-indigo-primary transition-colors"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {!sidebarCollapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="w-8 h-8 rounded-full bg-indigo-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-indigo-primary">
                运营负责人
              </span>
              <span className="text-[10px] text-indigo-primary/50">
                管理员
              </span>
            </div>
          </div>
        )}

        {sidebarCollapsed && (
          <div className="flex justify-center mt-2">
            <div className="w-8 h-8 rounded-full bg-indigo-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-indigo-primary" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
