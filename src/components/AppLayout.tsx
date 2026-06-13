"use client";

import { useState, useEffect } from "react";
import { useUser, UserButton } from "@clerk/nextjs";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import type { UserRole } from "@prisma/client";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const ensure = api.user.ensureUser.useMutation();
  const me = api.user.me.useQuery(undefined, { enabled: !!user });

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    } else if (user && !me.data && !me.isLoading) {
      ensure.mutate({
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? undefined,
      });
    }
  }, [isLoaded, user, me.data, me.isLoading, router, ensure]);

  if (!isLoaded || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  const role = (me.data?.role ?? "RECEPTIONIST") as UserRole;
  const isAdmin = role === "ADMIN" || role === "MANAGER";

  const navItems = [
    { href: "/dashboard", label: "工作台", icon: "📊", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/consultations", label: "咨询记录", icon: "📝", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/customers", label: "客户管理", icon: "👥", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/leads", label: "线索跟进", icon: "🎯", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/followups", label: "回访计划", icon: "📞", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/payments", label: "回款看板", icon: "💰", roles: ["MANAGER", "ADMIN"] },
    { href: "/abnormal", label: "异常记录", icon: "⚠️", roles: ["RECEPTIONIST", "DOCTOR", "MANAGER", "ADMIN"] },
    { href: "/admin/rules", label: "回访规则", icon: "⚙️", roles: ["MANAGER", "ADMIN"] },
    { href: "/admin/tags", label: "客户标签", icon: "🏷️", roles: ["MANAGER", "ADMIN"] },
    { href: "/admin/stages", label: "跟进阶段", icon: "📈", roles: ["MANAGER", "ADMIN"] },
    { href: "/admin/logs", label: "操作日志", icon: "📋", roles: ["MANAGER", "ADMIN"] },
  ].filter((item) => item.roles.includes(role));

  return (
    <div className="flex h-screen bg-slate-50">
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-white border-r border-slate-200 flex flex-col transition-all duration-200`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200">
          {sidebarOpen && (
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-2xl">🦷</span>
              <span className="font-bold text-lg text-dental-700">齿悦管家</span>
            </Link>
          )}
          {!sidebarOpen && <span className="text-2xl mx-auto">🦷</span>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="btn-ghost h-8 w-8 p-0 !rounded-md"
            aria-label="切换侧边栏"
          >
            {sidebarOpen ? "«" : "»"}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname?.startsWith(item.href) && item.href !== "/dashboard"
                  ? "sidebar-link-active"
                  : pathname === item.href
                  ? "sidebar-link-active"
                  : "sidebar-link"
              }
              title={!sidebarOpen ? item.label : undefined}
            >
              <span className="text-lg">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className={`flex items-center gap-3 ${sidebarOpen ? "" : "justify-center"}`}>
            <UserButton afterSignOutUrl="/" />
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  {me.data?.name ?? user.fullName}
                </div>
                <div className="text-xs text-slate-500">
                  {roleLabel(role)}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800">
              {getPageTitle(pathname, isAdmin)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/abnormal" className="relative">
              <span className="text-2xl">🔔</span>
              <AbnormalBadge />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

function AbnormalBadge() {
  const { data } = api.abnormal.stats.useQuery();
  const count = data?.pending ?? 0;
  if (!count) return null;
  return (
    <span className="absolute -top-1 -right-1 h-5 min-w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1">
      {count > 99 ? "99+" : count}
    </span>
  );
}

function roleLabel(role: UserRole) {
  return {
    RECEPTIONIST: "前台",
    DOCTOR: "医生",
    MANAGER: "经理",
    ADMIN: "管理员",
  }[role];
}

function getPageTitle(pathname: string | null, isAdmin: boolean) {
  if (!pathname) return "";
  const map: Record<string, string> = {
    "/dashboard": "工作台",
    "/consultations": "咨询记录",
    "/customers": "客户管理",
    "/leads": "线索跟进",
    "/followups": "回访计划",
    "/payments": "回款看板",
    "/abnormal": "异常记录",
    "/admin/rules": "回访规则设置",
    "/admin/tags": "客户标签维护",
    "/admin/stages": "跟进阶段维护",
    "/admin/logs": "操作日志",
  };
  if (map[pathname]) return map[pathname];
  for (const key of Object.keys(map)) {
    if (pathname.startsWith(key + "/")) return map[key];
  }
  return isAdmin ? "后台管理" : "前台接待";
}
