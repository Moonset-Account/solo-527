"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Wrench,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  role: "DESIGNER" | "ADMIN" | "BOSS" | "CLIENT";
  unreadNotifications?: number;
}

const designerNavItems = [
  { href: "/designer", label: "项目列表", icon: LayoutDashboard },
  { href: "/designer/quotes", label: "报价管理", icon: FileText },
  { href: "/designer/addons", label: "增项管理", icon: PlusCircle },
];

const adminNavItems = [
  { href: "/admin", label: "总览", icon: LayoutDashboard },
  { href: "/admin/projects", label: "项目管理", icon: LayoutDashboard },
  { href: "/admin/budget", label: "预算追踪", icon: BarChart3 },
  { href: "/admin/repairs", label: "返修管理", icon: Wrench },
  { href: "/admin/feedbacks", label: "客户反馈", icon: MessageSquare },
  { href: "/admin/reports", label: "报表中心", icon: BarChart3 },
];

export function Sidebar({ role, unreadNotifications = 0 }: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === "DESIGNER" ? designerNavItems : adminNavItems;

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-muted/40">
      <div className="flex h-16 items-center justify-between border-b px-6">
        <Link href="/" className="text-xl font-bold">
          设计验收门户
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t p-4 space-y-2">
        <Link
          href="/notifications"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <div className="flex items-center gap-3">
            <Bell className="h-4 w-4" />
            通知中心
          </div>
          {unreadNotifications > 0 && (
            <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5">
              {unreadNotifications > 99 ? "99+" : unreadNotifications}
            </Badge>
          )}
        </Link>

        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          设置
        </Link>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">用户</p>
            <p className="text-xs text-muted-foreground">
              {role === "DESIGNER" && "设计师"}
              {role === "ADMIN" && "管理员"}
              {role === "BOSS" && "老板"}
              {role === "CLIENT" && "客户"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
