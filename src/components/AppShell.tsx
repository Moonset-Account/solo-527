"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Server,
  AlertTriangle,
  ShieldAlert,
  ClipboardList,
  RotateCcw,
  FileClock,
  Users,
  Settings,
} from "lucide-react";
import { UserButton, useAuth } from "@clerk/nextjs";
import { api } from "@/lib/trpc/client";
import { USER_ROLE_LABELS } from "@/lib/label-maps";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/assets", label: "资产配置", icon: Server },
  { href: "/alerts", label: "告警管理", icon: AlertTriangle },
  { href: "/vulnerabilities", label: "漏洞修复", icon: ShieldAlert },
  { href: "/inspections", label: "设备巡检", icon: ClipboardList },
  { href: "/rollbacks", label: "回滚方案", icon: RotateCcw },
  { href: "/audit", label: "操作日志", icon: FileClock, roles: ["ADMIN", "IT_MANAGER"] },
  { href: "/users", label: "人员管理", icon: Users, roles: ["ADMIN"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoaded } = useAuth();
  const meQuery = api.user.me.useQuery(undefined, { enabled: isLoaded, retry: false });

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r bg-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b px-5">
          <Settings className="h-6 w-6 text-primary-600" />
          <div>
            <div className="text-sm font-semibold text-slate-900">告警资产配置库</div>
            <div className="text-[11px] text-slate-500">值班运维系统</div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.filter((item) => {
            if (!item.roles) return true;
            if (!meQuery.data) return false;
            return item.roles.includes(meQuery.data.role);
          }).map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <div className="flex items-center gap-3 rounded-md p-2">
            <UserButton afterSignOutUrl="/" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-slate-800">
                {meQuery.data?.name ?? meQuery.data?.email ?? "加载中…"}
              </div>
              {meQuery.data && (
                <span className={USER_ROLE_LABELS[meQuery.data.role].cls}>
                  {USER_ROLE_LABELS[meQuery.data.role].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>
      <main className="flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b bg-white px-6 md:hidden">
          <UserButton afterSignOutUrl="/" />
          <div className="font-semibold">告警资产配置库</div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
