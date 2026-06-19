'use client';

import { Bell, Search, ChevronDown } from 'lucide-react';

export function TopBar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/80 px-6 backdrop-blur">
      <div>
        <h1 className="font-serif text-lg font-semibold text-zinc-900">{title}</h1>
        {subtitle && <p className="text-xs text-zinc-500 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="搜索项目、客户..."
            className="h-9 w-64 rounded border border-zinc-200 bg-zinc-50 pl-9 pr-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger-500" />
        </button>

        <div className="flex items-center gap-2 rounded-full border border-zinc-200 px-2 py-1 hover:bg-zinc-50 cursor-pointer">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-medium">
            张
          </div>
          <span className="text-sm text-zinc-700 hidden lg:inline">张管理</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
        </div>
      </div>
    </header>
  );
}
