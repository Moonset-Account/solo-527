"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  AlertTriangle,
  LineChart,
  FileBarChart,
  Settings,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  {
    label: "监控看板",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "异常中心",
    href: "/anomalies",
    icon: AlertTriangle,
    badge: 8,
  },
  {
    label: "告警规则",
    href: "/alerts/rules",
    icon: LineChart,
  },
  {
    label: "报表复盘",
    href: "/reports",
    icon: FileBarChart,
  },
  {
    label: "系统设置",
    href: "/settings",
    icon: Settings,
  },
];

export function SidebarNav({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg text-neutral-800">异常监控</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg hover:bg-neutral-100"
            >
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`sidebar-link ${
                    isActive ? "sidebar-link-active" : "sidebar-link-inactive"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-accent-rose text-white text-xs font-medium flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-neutral-100">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-medium text-sm">
                总
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-800 truncate">销售总监</p>
                <p className="text-xs text-neutral-500 truncate">director@company.com</p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-400" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

export function TopNav({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-sm border-b border-neutral-200">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100"
          >
            <Menu className="w-5 h-5 text-neutral-600" />
          </button>

          <div className="hidden md:flex items-center gap-2 bg-neutral-100 rounded-lg px-3 py-2 w-80">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="搜索指标、异常..."
              className="bg-transparent text-sm flex-1 outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-rose rounded-full"></span>
          </button>
        </div>
      </div>
    </header>
  );
}
