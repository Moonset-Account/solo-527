"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "仪表盘", icon: "📊" },
  { href: "/admin/schedules", label: "教练排班", icon: "📅" },
  { href: "/admin/coaches", label: "教练管理", icon: "👨‍🏫" },
  { href: "/admin/pricing", label: "价格规则", icon: "💰" },
  { href: "/admin/courts", label: "场地管理", icon: "🏟️" },
  { href: "/admin/waiting-list", label: "候补名单", icon: "📋" },
  { href: "/admin/audit-logs", label: "操作日志", icon: "📝" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-8rem)] flex-shrink-0">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-red-500">⚙️</span> 管理员后台
        </h2>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
