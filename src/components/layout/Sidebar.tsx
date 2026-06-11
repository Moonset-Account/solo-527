"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Thermometer,
  Warehouse,
  Route,
  FileX,
  AlertTriangle,
  Settings,
  ScrollText,
  ChevronLeft,
  ChevronRight,
  Truck,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/orders", label: "订单管理", icon: Package },
  { href: "/tracking", label: "轨迹监控", icon: MapPin },
  { href: "/temperature", label: "温控监控", icon: Thermometer },
  { href: "/inventory", label: "站点库存", icon: Warehouse },
  { href: "/rider-routes", label: "司机路线", icon: Route },
  { href: "/signature-diff", label: "签收差异", icon: FileX },
  { href: "/exceptions", label: "异常管理", icon: AlertTriangle },
  { href: "/logs", label: "操作日志", icon: ScrollText },
  { href: "/settings", label: "系统设置", icon: Settings },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand-500" />
            <span className="font-display font-bold text-lg">骑手轨迹</span>
          </div>
        )}
        {collapsed && <Truck className="h-6 w-6 text-brand-500 mx-auto" />}
        <button
          onClick={onToggle}
          className="p-1 rounded hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded transition-all duration-200",
                "hover:bg-slate-800 group",
                isActive
                  ? "bg-brand-500/10 text-brand-500 border-l-2 border-brand-500"
                  : "text-slate-400 hover:text-slate-200 border-l-2 border-transparent"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0 transition-colors",
                  isActive ? "text-brand-500" : "group-hover:text-slate-200"
                )}
              />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">当前用户</p>
            <p className="text-sm font-medium text-slate-200">张主管</p>
            <p className="text-xs text-slate-500">调度主管</p>
          </div>
        </div>
      )}
    </aside>
  );
}
