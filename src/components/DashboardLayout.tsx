"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Users,
  Settings,
  BarChart3,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "核心看板",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "工单管理",
    href: "/work-orders",
    icon: ListTodo,
  },
  {
    label: "供应商管理",
    href: "/suppliers",
    icon: Users,
  },
  {
    label: "数据分析",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "地图总览",
    href: "/map",
    icon: MapPin,
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={cn(
          "bg-white border-r border-slate-200 flex flex-col transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-display text-lg font-semibold text-primary-500">
                  维修看板
                </h1>
                <p className="text-xs text-slate-500">资产运营平台</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-2">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                      isActive
                        ? "bg-primary-50 text-primary-600 font-medium"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-2 border-t border-slate-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>收起菜单</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="搜索工单、楼栋..."
                className="pl-10 pr-4 py-2 w-64 rounded-xl bg-slate-50 border border-transparent focus:border-primary-500 focus:bg-white focus:outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-slate-50 transition-colors">
              <Bell className="w-5 h-5 text-slate-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm">
                运
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">运营管理员</p>
                <p className="text-xs text-slate-500">资产运营部</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
