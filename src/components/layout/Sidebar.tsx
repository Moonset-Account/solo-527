"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  ClipboardList,
  Users,
  FileSignature,
  GitBranch,
  Settings,
  Workflow,
  Building2,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface SidebarProps {
  userRole?: UserRole;
}

const menuItems = [
  {
    title: "仪表盘",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "FINANCE", "FRONTLINE"],
  },
  {
    title: "一线工作台",
    href: "/workbench",
    icon: Workflow,
    roles: ["ADMIN", "FRONTLINE"],
  },
  {
    title: "租约管理",
    href: "/leases",
    icon: Building2,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    title: "账单管理",
    href: "/bills",
    icon: Receipt,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    title: "派工管理",
    href: "/assignments",
    icon: ClipboardList,
    roles: ["ADMIN", "FINANCE", "FRONTLINE"],
  },
  {
    title: "业主结算",
    href: "/settlements",
    icon: Users,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    title: "合同签署",
    href: "/contracts",
    icon: FileSignature,
    roles: ["ADMIN", "FINANCE"],
  },
  {
    title: "变更记录",
    href: "/audit",
    icon: GitBranch,
    roles: ["ADMIN"],
  },
  {
    title: "系统设置",
    href: "/settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
];

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { userId } = useAuth();

  const filteredItems = menuItems.filter(
    (item) => userRole && item.roles.includes(userRole)
  );

  return (
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900">租后服务中心</h1>
          <p className="text-xs text-slate-500">Rental Service Center</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-item group",
                isActive && "active"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-slate-400 group-hover:text-slate-600"
                )}
              />
              <span className="flex-1">{item.title}</span>
              {item.title === "账单管理" && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-medium text-white">
                  !
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="text-xs text-slate-400">
          <p>© 2024 租后服务中心</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
