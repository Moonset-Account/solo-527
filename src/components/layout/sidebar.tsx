"use client";

import {
  LayoutDashboard,
  Calendar,
  Users,
  CheckSquare,
  Bell,
  Wrench,
  ShoppingBag,
  Shield,
  FileBarChart,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    title: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "活动管理",
    href: "/activities",
    icon: Calendar,
  },
  {
    title: "报名管理",
    href: "/registrations",
    icon: Users,
  },
  {
    title: "签到管理",
    href: "/check-in",
    icon: CheckSquare,
  },
  {
    title: "消息中心",
    href: "/messages",
    icon: Bell,
    badge: 3,
  },
  {
    title: "宿舍报修",
    href: "/repairs",
    icon: Wrench,
  },
  {
    title: "二手交易",
    href: "/second-hand",
    icon: ShoppingBag,
  },
  {
    title: "身份审核",
    href: "/verifications",
    icon: Shield,
  },
  {
    title: "复盘核对",
    href: "/review",
    icon: FileBarChart,
  },
  {
    title: "系统设置",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full w-64 flex-col bg-gray-900 text-white", className)}>
      <div className="flex h-16 items-center border-b border-gray-800 px-6">
        <Link href="/" className="flex items-center space-x-2">
          <Home className="h-6 w-6 text-primary-400" />
          <span className="text-lg font-bold">社团管理后台</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <div className="flex items-center space-x-3">
                <Icon className="h-5 w-5" />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-sm font-medium">管</span>
          </div>
          <div>
            <p className="text-sm font-medium">管理员</p>
            <p className="text-xs text-gray-400">admin@club.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
