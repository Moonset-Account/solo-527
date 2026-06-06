"use client";

import { MoreHorizontal, Download, Maximize2 } from "lucide-react";
import { useState } from "react";

interface ChartCardProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function ChartCard({
  title,
  subtitle,
  children,
  actions,
  className = "",
}: ChartCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className={`bg-white rounded-lg shadow-card overflow-hidden ${className}`}>
      <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-neutral-800">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-1">
          {actions}
          <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-md shadow-lg border border-neutral-200 py-1 z-10">
                <button className="w-full px-3 py-1.5 text-sm text-left text-neutral-700 hover:bg-neutral-50">
                  导出数据
                </button>
                <button className="w-full px-3 py-1.5 text-sm text-left text-neutral-700 hover:bg-neutral-50">
                  查看详情
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
