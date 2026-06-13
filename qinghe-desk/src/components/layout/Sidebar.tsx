"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Headphones,
  Receipt,
  Wrench,
  ClipboardCheck,
  ScrollText,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "工作台", icon: LayoutDashboard },
  { href: "/tenants", label: "租户档案", icon: Users },
  { href: "/rooms", label: "房态管理", icon: Building2 },
  { href: "/services", label: "服务申请", icon: Headphones },
  { href: "/bills", label: "费用账单", icon: Receipt },
  { href: "/repairs", label: "工程报修", icon: Wrench },
  { href: "/inspections", label: "巡检管理", icon: ClipboardCheck },
  { href: "/audit-logs", label: "变更记录", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="flex w-64 shrink-0 flex-col bg-pine-900 text-white min-h-screen">
      <div className="flex h-16 items-center gap-3 border-b border-pine-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-pine-900">
          <Leaf className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-serif text-lg font-bold leading-tight">青禾租户</h1>
          <p className="text-xs text-pine-200">服务台</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-pine-200 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-pine-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-pine-900">
            张
          </div>
          <div>
            <p className="text-sm font-medium">张管理</p>
            <p className="text-xs text-pine-300">管理员</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
