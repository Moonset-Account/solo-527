"use client";

import { User, Bell, Download, Filter, ChevronDown } from "lucide-react";
import { useState } from "react";

export function TopNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-neutral-800">运营数据看板</h2>
        <span className="text-xs text-neutral-400">数据更新时间：{new Date().toLocaleString("zh-CN")}</span>
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors">
          <Download className="w-4 h-4" />
        </button>
        <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
        <div className="h-6 w-px bg-neutral-200 mx-1"></div>
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
              <User className="w-4 h-4 text-primary-600" />
            </div>
            <span className="text-sm text-neutral-700">运营分析员</span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-50">
              <button className="w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50">
                个人设置
              </button>
              <button className="w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
