"use client";

import { User, Bell, Download, ChevronDown, LogOut, LogIn, UserCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export function TopNav() {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/login");
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <header className="h-14 bg-white border-b border-neutral-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-semibold text-neutral-800">运营数据看板</h2>
        <span className="text-xs text-neutral-400">数据更新时间：{new Date().toLocaleString("zh-CN")}</span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => router.push("/export")}
          className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
          title="导出中心"
        >
          <Download className="w-4 h-4" />
        </button>
        <button className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
        </button>
        <div className="h-6 w-px bg-neutral-200 mx-1"></div>
        
        {isAuthenticated && user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <span className="text-sm text-neutral-700">{user.username || "用户"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-neutral-100">
                  <p className="text-sm font-medium text-neutral-800">{user.username}</p>
                  <p className="text-xs text-neutral-500">角色: {user.roleId || "运营分析员"}</p>
                </div>
                <button className="w-full px-4 py-2 text-sm text-left text-neutral-700 hover:bg-neutral-50 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" />
                  个人设置
                </button>
                <button 
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-sm text-left text-danger-600 hover:bg-danger-50 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={handleLogin}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-white bg-primary-500 rounded-md hover:bg-primary-600 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            登录
          </button>
        )}
      </div>
    </header>
  );
}
