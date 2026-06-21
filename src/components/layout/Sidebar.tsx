"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PhoneCall,
  Users,
  BarChart3,
  Download,
  AlertTriangle,
  CalendarRange,
  ChevronLeft,
  Leaf,
} from "lucide-react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "运营仪表盘", icon: LayoutDashboard },
  { href: "/medical-records", label: "病历管理", icon: FileText },
  { href: "/follow-up-tasks", label: "随访任务", icon: PhoneCall },
  { href: "/patient-statistics", label: "患者统计", icon: Users },
  { href: "/follow-up-export", label: "随访导出", icon: Download },
  { href: "/permission-exceptions", label: "权限异常", icon: AlertTriangle },
  { href: "/appointment-reports", label: "号源报表", icon: CalendarRange },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();

  return (
    <aside
      className={cn(
        "group relative flex h-screen flex-col border-r border-gold-200/50 bg-gradient-to-b from-[#0B5659] via-[#0D7377] to-[#0A4A4C] text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gold-500/20 ring-1 ring-gold-400/40">
          <Leaf className="h-5 w-5 text-gold-300" />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden">
            <span className="font-display text-lg font-semibold tracking-wide text-gold-100">
              病历随访台
            </span>
            <span className="text-[11px] uppercase tracking-[0.2em] text-teal-200/70">
              TCM Follow-Up Desk
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto py-4 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group/nav flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                isActive
                  ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(212,168,75,0.25)]"
                  : "text-teal-100/80 hover:bg-white/5 hover:text-white"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "h-4.5 w-4.5 flex-shrink-0 transition-colors",
                  isActive ? "text-gold-300" : "text-teal-200/70 group-hover/nav:text-gold-200"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-2">
        <button
          onClick={toggle}
          className="flex w-full items-center justify-center rounded-lg p-2 text-teal-200/70 transition-colors hover:bg-white/5 hover:text-white"
          title={collapsed ? "展开导航" : "收起导航"}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
