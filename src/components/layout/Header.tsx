"use client";

import { Bell, Download, RefreshCw, HelpCircle } from "lucide-react";
import { GlobalFilter } from "@/components/common/GlobalFilter";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-sm border-b border-neutral-100">
      <div className="px-6 h-16 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-800">{title}</h2>
          {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          <GlobalFilter />

          <div className="h-6 w-px bg-neutral-200" />

          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
          </button>
          <button className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors">
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
