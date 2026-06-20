"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  ShieldAlert,
  Target,
  GitBranch,
  AlertTriangle,
  BarChart3,
  Settings,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const navigation = [
  {
    name: "预警台首页",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "知识库搜索",
    href: "/knowledge",
    icon: BookOpen,
  },
  {
    name: "SLA规则管理",
    href: "/sla/rules",
    icon: ShieldAlert,
  },
  {
    name: "知识命中管理",
    href: "/hits",
    icon: Target,
    badge: 3,
  },
  {
    name: "处理轨迹",
    href: "/trajectory",
    icon: GitBranch,
  },
  {
    name: "知识失效管理",
    href: "/knowledge/invalid",
    icon: AlertTriangle,
    badge: 1,
  },
  {
    name: "数据看板",
    href: "/dashboard",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col gradient-primary text-white">
      <div className="flex h-16 items-center px-6 border-b border-white/10">
        <ShieldAlert className="h-8 w-8 text-amber-400" />
        <span className="ml-3 text-lg font-bold tracking-tight">
          SLA预警台
        </span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200",
                isActive
                  ? "bg-white/20 text-white shadow-inner"
                  : "text-slate-200 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon
                className={cn(
                  "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-amber-400" : "text-slate-300 group-hover:text-white"
                )}
              />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
                <Badge variant="danger" className="animate-breathe">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-sm font-semibold">张</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">张经理</p>
              <p className="text-xs text-slate-300">售后经理</p>
            </div>
          </div>
          <button className="relative p-2 text-slate-300 hover:text-white transition-colors">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-breathe" />
          </button>
        </div>
      </div>
    </div>
  );
}
