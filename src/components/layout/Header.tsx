"use client";

import { useState, useEffect } from "react";
import { Bell, Search, RefreshCw, Download, Clock } from "lucide-react";
import { useDashboardStore } from "@/store/useDashboardStore";
import { cn } from "@/utils/cn";
import { formatDate } from "@/utils/format";

export function Header() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const { notifications, markNotificationRead, isLoading, refreshData } =
    useDashboardStore();

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNotificationClick = (id: string) => {
    markNotificationRead(id);
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="搜索订单号、骑手姓名..."
            className="w-80 h-9 pl-9 pr-4 bg-slate-800 border border-slate-700 rounded text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <button
          onClick={() => refreshData()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm text-slate-300 transition-colors disabled:opacity-50"
        >
          <RefreshCw
            className={cn("h-4 w-4", isLoading && "animate-spin")}
          />
          刷新
        </button>

        <button className="flex items-center gap-2 px-3 h-9 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-sm text-slate-300 transition-colors">
          <Download className="h-4 w-4" />
          导出
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <Clock className="h-4 w-4" />
          <span className="font-mono">
            {isMounted && currentTime ? formatDate(currentTime) : "--:--:--"}
          </span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-5 w-5 text-slate-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-danger-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse-alert">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 animate-slide-up">
              <div className="p-3 border-b border-slate-700">
                <h3 className="font-semibold text-slate-200">通知中心</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                    className={cn(
                      "p-3 border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors",
                      !notification.read && "bg-slate-800/30"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full mt-1.5 flex-shrink-0",
                          notification.type === "temperature" &&
                            "bg-danger-500 animate-pulse-alert",
                          notification.type === "timeout" &&
                            "bg-warning-500 animate-pulse-alert",
                          notification.type === "discrepancy" && "bg-yellow-500",
                          notification.type === "info" && "bg-brand-500"
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium truncate",
                            notification.read
                              ? "text-slate-400"
                              : "text-slate-200"
                          )}
                        >
                          {notification.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                          {formatDate(notification.createdAt, "HH:mm:ss")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
