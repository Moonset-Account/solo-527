"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Clock,
  Tags,
  BarChart3,
  History,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "看板总览", icon: LayoutDashboard },
  { href: "/dashboard/workload", label: "班组负载", icon: Users },
  { href: "/dashboard/timeout", label: "超时趋势", icon: Clock },
  { href: "/dashboard/tags", label: "标签分布", icon: Tags },
  { href: "/dashboard/staff", label: "人员对比", icon: BarChart3 },
  { href: "/dashboard/history", label: "调班历史", icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-neutral-100 shadow-sm">
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center px-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-800">客服看板</h1>
              <p className="text-xs text-neutral-400">Workload Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <div className="px-3 mb-2">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
              数据视图
            </p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary-50 text-primary-600"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5",
                    isActive ? "text-primary-500" : "text-neutral-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-100 space-y-1">
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            <Settings className="w-5 h-5 text-neutral-400" />
            系统设置
          </button>
          <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors">
            <LogOut className="w-5 h-5 text-neutral-400" />
            退出登录
          </button>
        </div>

        <div className="p-4 border-t border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
              主
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-800">主管 - 张三</p>
              <p className="text-xs text-neutral-400">拥有全部权限</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
