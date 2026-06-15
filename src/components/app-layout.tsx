"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { Bell, Home, Wrench, FileText, DollarSign, Users, Settings, BarChart3, ShieldAlert } from "lucide-react";
import { api } from "@/lib/trpc/client";

const navItems = [
  { href: "/", label: "首页", icon: Home },
  { href: "/repairs", label: "报修管理", icon: Wrench },
  { href: "/repairs/new", label: "提交报修", icon: Wrench },
  { href: "/trades", label: "二手交易", icon: DollarSign },
  { href: "/complaints", label: "举报中心", icon: ShieldAlert },
  { href: "/refunds", label: "退款管理", icon: DollarSign },
  { href: "/notifications", label: "消息通知", icon: Bell },
  { href: "/profile", label: "个人中心", icon: Settings },
];

const adminNavItems = [
  { href: "/admin/dashboard", label: "数据概览", icon: BarChart3 },
  { href: "/admin/repairs", label: "报修管理", icon: Wrench },
  { href: "/admin/complaints", label: "举报处理", icon: FileText },
  { href: "/admin/refunds", label: "退款审批", icon: DollarSign },
  { href: "/admin/exports", label: "导出任务", icon: FileText },
  { href: "/admin/audit-logs", label: "操作日志", icon: ShieldAlert },
  { href: "/admin/users", label: "用户管理", icon: Users },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user: clerkUser } = useUser();
  const { data: dbUser } = api.user.me.useQuery(undefined, {
    enabled: !!clerkUser,
  });

  const isAdmin = dbUser?.role === "ADMIN" || dbUser?.role === "DORM_MANAGER";
  const isAdminPage = pathname?.startsWith("/admin");

  const items = isAdminPage ? adminNavItems : navItems;

  return (
    <div className="flex min-h-screen bg-zinc-50">
      <aside className="w-64 border-r border-zinc-200 bg-white">
        <div className="flex h-16 items-center border-b border-zinc-200 px-6">
          <h1 className="text-xl font-bold text-zinc-900">宿舍管理平台</h1>
        </div>

        <nav className="p-4 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && !isAdminPage && (
            <>
              <div className="my-4 border-t border-zinc-200" />
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50"
              >
                <ShieldAlert className="h-5 w-5" />
                管理后台
              </Link>
            </>
          )}

          {isAdminPage && (
            <>
              <div className="my-4 border-t border-zinc-200" />
              <Link
                href="/"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                <Home className="h-5 w-5" />
                返回首页
              </Link>
            </>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              {isAdminPage ? "管理后台" : "用户中心"}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {dbUser && (
              <div className="text-right">
                <p className="text-sm font-medium text-zinc-900">{dbUser.name}</p>
                <p className="text-xs text-zinc-500">{dbUser.role === "ADMIN" ? "管理员" : dbUser.role === "DORM_MANAGER" ? "宿管老师" : "学生"}</p>
              </div>
            )}
            <UserButton />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
