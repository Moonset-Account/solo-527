"use client";

import {
  LayoutDashboard,
  Map,
  BarChart3,
  AlertTriangle,
  FileText,
  Settings,
  Bus,
  Cloud,
  MessageSquare,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "overview", label: "总览仪表盘", icon: LayoutDashboard },
  { id: "map", label: "拥挤地图", icon: Map },
  { id: "comparison", label: "线路对比", icon: BarChart3 },
  { id: "interval", label: "到站间隔", icon: Bus },
  { id: "complaints", label: "投诉关联", icon: MessageSquare },
  { id: "anomalies", label: "异常事件", icon: AlertTriangle },
  { id: "weather", label: "天气影响", icon: Cloud },
  { id: "details", label: "明细数据", icon: FileText },
];

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Bus className="w-6 h-6 text-blue-400" />
            <span className="font-bold text-lg">公交调度</span>
          </div>
        )}
        {collapsed && <Bus className="w-6 h-6 text-blue-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-800 transition-colors ${
                activeView === item.id
                  ? "bg-slate-800 border-r-4 border-blue-500 text-blue-400"
                  : "text-slate-300"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="w-full flex items-center gap-3 px-2 py-2 hover:bg-slate-800 rounded text-slate-300">
          <Settings className="w-5 h-5" />
          {!collapsed && <span>系统设置</span>}
        </button>
      </div>
    </div>
  );
}
