"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquarePlus,
  Inbox,
  ClipboardList,
  GitBranch,
  CheckSquare,
  BookOpen,
  Clock,
  FileText,
  Menu,
  X,
  ChevronLeft,
} from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/use-sidebar";
import { useEffect } from "react";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
};

const navItems: NavItem[] = [
  {
    label: "仪表盘",
    href: "/",
    icon: LayoutDashboard,
    roles: ["CUSTOMER", "STAFF", "SUPERVISOR"],
  },
  {
    label: "提交反馈",
    href: "/feedback/submit",
    icon: MessageSquarePlus,
    roles: ["CUSTOMER", "STAFF", "SUPERVISOR"],
  },
  {
    label: "我的反馈",
    href: "/feedback/my",
    icon: Inbox,
    roles: ["CUSTOMER", "STAFF", "SUPERVISOR"],
  },
  {
    label: "反馈看板",
    href: "/feedback/board",
    icon: ClipboardList,
    roles: ["STAFF", "SUPERVISOR"],
  },
  {
    label: "归因分析",
    href: "/attribution",
    icon: GitBranch,
    roles: ["SUPERVISOR"],
  },
  {
    label: "待办事项",
    href: "/todos",
    icon: CheckSquare,
    roles: ["STAFF", "SUPERVISOR"],
  },
  {
    label: "知识库",
    href: "/knowledge",
    icon: BookOpen,
    roles: ["SUPERVISOR"],
  },
  {
    label: "响应时间",
    href: "/response-time",
    icon: Clock,
    roles: ["SUPERVISOR"],
  },
  {
    label: "审计日志",
    href: "/audit-log",
    icon: FileText,
    roles: ["SUPERVISOR"],
  },
];

function getUserRole(publicMetadata: Record<string, unknown> | undefined): string {
  return (publicMetadata?.role as string) ?? "CUSTOMER";
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar();
  const { user } = useUser();
  const { isSignedIn } = useAuth();

  const role = isSignedIn ? getUserRole(user?.publicMetadata) : "CUSTOMER";

  const visibleItems = navItems.filter((item) => item.roles.includes(role));

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 rounded-lg bg-slate-850 p-2 text-white lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-full flex-col bg-slate-850 text-white transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-700 px-4">
          {!collapsed && (
            <span className="text-lg font-semibold tracking-wide text-brand-500">
              反馈闭环
            </span>
          )}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileOpen(false);
              } else {
                toggle();
              }
            }}
            className="rounded p-1 text-slate-400 hover:text-white lg:block"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <ChevronLeft
                className={cn(
                  "h-5 w-5 transition-transform",
                  collapsed && "rotate-180"
                )}
              />
            )}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-4">
          <ul className="space-y-1">
            {visibleItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-500/15 text-brand-500"
                        : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-slate-700 px-4 py-3">
          {!collapsed && (
            <p className="text-xs text-slate-500">
              {role === "SUPERVISOR"
                ? "主管视图"
                : role === "STAFF"
                  ? "客服视图"
                  : "客户视图"}
            </p>
          )}
        </div>
      </aside>
    </>
  );
}
