"use client";

import { Bell, Search, ChevronDown, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-4 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-80 hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="全局搜索知识、工单..."
              className="pl-10 bg-slate-50 border-slate-200 focus:bg-white"
            />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-700">张经理</p>
              <p className="text-xs text-slate-500">MANAGER</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6f] flex items-center justify-center text-white text-sm font-semibold">
              张
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>
    </header>
  );
}
