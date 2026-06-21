"use client";

import { Bell, Search, ChevronDown, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { cn, getInitials } from "@/lib/utils";
import { useState } from "react";
import Link from "next/link";

export default function Header() {
  const { user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const today = new Date("2026-06-21").toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gold-200/40 bg-cream-100/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="font-display text-lg font-semibold text-ink-900">
            运营管理中心
          </h1>
          <p className="text-xs text-ink-600">{today}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
          <input
            type="text"
            placeholder="搜索病历/患者/任务..."
            className="w-64 rounded-lg border border-gold-200/60 bg-white/70 py-2 pl-9 pr-4 text-sm text-ink-800 placeholder:text-ink-600/60 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        <button
          className="relative rounded-lg border border-gold-200/60 bg-white/70 p-2 text-ink-700 transition-colors hover:bg-white"
          title="通知"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ochre-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-ochre-500" />
          </span>
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg border border-gold-200/60 bg-white/70 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-white"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-semibold text-white">
              {user ? getInitials(user.full_name) : "--"}
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-sm font-medium text-ink-900">
                {user?.full_name}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-ink-600">
                {user?.role === "operation"
                  ? "运营负责人"
                  : user?.role === "frontdesk"
                  ? "前台"
                  : user?.role === "auditor"
                  ? "审核员"
                  : "管理员"}
              </div>
            </div>
            <ChevronDown className={cn("h-4 w-4 text-ink-600 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-gold-200/60 bg-white shadow-card-hover">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-ink-800 hover:bg-cream-200"
              >
                个人设置
              </Link>
              <div className="h-px bg-gold-200/50" />
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-ochre-700 hover:bg-ochre-50"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
