"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitBranch,
  BarChart3,
  TrendingUp,
  Upload,
  BookOpen,
  FileDown,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/utils";

const navItems = [
  {
    title: "数据看板",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "流程分析",
    href: "/analysis/process",
    icon: GitBranch,
  },
  {
    title: "多维对比",
    href: "/analysis/comparison",
    icon: BarChart3,
  },
  {
    title: "趋势分析",
    href: "/analysis/trend",
    icon: TrendingUp,
  },
  {
    title: "数据导入",
    href: "/data/import",
    icon: Upload,
  },
  {
    title: "数据字典",
    href: "/data/dictionary",
    icon: BookOpen,
  },
  {
    title: "导出中心",
    href: "/export",
    icon: FileDown,
  },
  {
    title: "用户管理",
    href: "/admin/users",
    icon: Users,
    adminOnly: true,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 bg-white border-r border-neutral-200 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-lg font-bold text-primary-600 flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5" />
          门诊等待分析
        </h1>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-600"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
              )}
            >
              <Icon className="w-4 h-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-neutral-200">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-neutral-500">
          <Settings className="w-3.5 h-3.5" />
          <span>v1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
