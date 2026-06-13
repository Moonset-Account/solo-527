"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/manager", label: "工作台", icon: "🎯" },
  { href: "/manager/conflicts", label: "场地冲突", icon: "⚠️" },
  { href: "/manager/safety-reports", label: "设备安全报表", icon: "🛡️" },
  { href: "/manager/bookings", label: "预约管理", icon: "📑" },
];

export default function ManagerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-8rem)] flex-shrink-0">
      <div className="p-4 border-b border-slate-200">
        <h2 className="font-bold text-slate-800 flex items-center gap-2">
          <span className="text-amber-500">🎖️</span> 负责人工作台
        </h2>
      </div>
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/manager" && pathname?.startsWith(item.href));
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
