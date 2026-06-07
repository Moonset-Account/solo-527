"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutDashboard, Users, Trophy, Download, User } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "漏斗看板", icon: LayoutDashboard },
  { href: "/waitlist", label: "候补管理", icon: Users },
  { href: "/ranking", label: "课程排名", icon: Trophy },
  { href: "/export", label: "导出报告", icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 h-screen bg-primary flex flex-col text-white shrink-0">
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <BarChart3 className="w-6 h-6 text-accent" />
        <span className="text-lg font-bold tracking-wide">候补看板</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-white/15"
                  : "hover:bg-white/10"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm">教务运营</span>
        </div>
      </div>
    </aside>
  );
}
