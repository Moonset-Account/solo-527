"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Users, CalendarCheck, GraduationCap,
  Clock3, MessageCircle, ReceiptText, FileBarChart, Settings,
  ChevronRight, LogOut, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const UserButton = dynamic(() =>
  (async () => {
    try {
      const mod = await import("@clerk/nextjs");
      if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return mod.UserButton;
    } catch {}
    return { default: () => null };
  })(),
  { ssr: false, loading: () => null },
);

const navGroups = [
  {
    items: [
      { label: "仪表盘", href: "/", Icon: LayoutDashboard },
      { label: "线索跟进", href: "/leads", Icon: Users, badge: true },
      { label: "试听管理", href: "/trials", Icon: CalendarCheck },
      { label: "教学一线台", href: "/classes", Icon: GraduationCap },
      { label: "消课记录", href: "/consumptions", Icon: Clock3 },
      { label: "家校反馈", href: "/feedback", Icon: MessageCircle, badge: true },
      { label: "跨部门对账", href: "/audit", Icon: ReceiptText },
      { label: "报表复盘", href: "/reports", Icon: FileBarChart },
    ],
  },
];

const bottomNav = [
  { label: "系统设置", href: "/settings", Icon: Settings },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = (h: string) => (h === "/" ? pathname === "/" : pathname.startsWith(h));

  return (
    <div className="min-h-screen flex bg-bg-surface text-deep-blue-800">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-deep-blue-50 flex flex-col sticky top-0 h-screen z-30">
        <Link href="/" className="px-5 py-5 flex items-center gap-3 border-b border-deep-blue-50">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-deep-blue-600 to-ink-gold-500 flex items-center justify-center text-white shadow-sm">
            <Building2 size={20} />
          </div>
          <div>
            <div className="font-serif font-bold text-deep-blue-700 tracking-wide leading-tight">排课消课台</div>
            <div className="text-[11px] text-deep-blue-400 mt-0.5">Art Training Admin</div>
          </div>
        </Link>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
          {navGroups.map((g, gi) => (
            <div key={gi} className="space-y-1">
              {g.items.map(({ label, href, Icon, badge }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} className="group relative block">
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-200",
                      active
                        ? "bg-deep-blue-600 text-white shadow-sm"
                        : "text-deep-blue-600 hover:bg-deep-blue-50",
                    )}>
                      <Icon size={18} className={cn(active ? "text-ink-gold-300" : "text-deep-blue-400 group-hover:text-ink-gold-500")} />
                      <span className="flex-1 font-medium">{label}</span>
                      {badge && (
                        <span className={cn(
                          "min-w-5 h-5 text-[10px] rounded-full px-1.5 flex items-center justify-center",
                          active ? "bg-ink-gold-400 text-deep-blue-900" : "bg-alert-red text-white",
                        )}>!</span>
                      )}
                      {active && (
                        <motion.div layoutId="nav-active" className="absolute right-1 w-1 h-5 rounded-full bg-ink-gold-400" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-deep-blue-50 p-3 space-y-1">
          {bottomNav.map(({ label, href, Icon }) => (
            <Link key={href} href={href} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-deep-blue-600 hover:bg-deep-blue-50",
              isActive(href) && "bg-deep-blue-50 text-deep-blue-700 font-medium",
            )}>
              <Icon size={18} className="text-deep-blue-400" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="h-16 shrink-0 bg-topbar-gradient px-6 flex items-center justify-between text-white sticky top-0 z-20 border-b border-deep-blue-800/30">
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-sm opacity-80">星辰艺术培训 · 海淀校区</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-white/10 backdrop-blur border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-success-green animate-pulse" />
              <span>实时数据同步中</span>
            </div>
            <div className="flex items-center gap-3 pl-3 border-l border-white/10">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium leading-tight">李砚秋</div>
                <div className="text-[11px] opacity-70">校区校长</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-ink-gold-400 to-ink-gold-600 flex items-center justify-center text-deep-blue-900 font-bold text-sm shadow-lg ring-2 ring-white/20">
                李
              </div>
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
