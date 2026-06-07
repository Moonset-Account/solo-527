"use client";

import { useState } from "react";
import { Bell, Download, RefreshCw, HelpCircle, Loader2 } from "lucide-react";
import { GlobalFilter } from "@/components/common/GlobalFilter";
import { useQueryClient } from "@tanstack/react-query";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onExport?: () => void;
  showExport?: boolean;
  showRefresh?: boolean;
}

export function Header({
  title,
  subtitle,
  onExport,
  showExport = true,
  showRefresh = true,
}: HeaderProps) {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const handleExport = () => {
    if (!onExport || isExporting) return;
    setIsExporting(true);
    try {
      onExport();
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

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

          {showRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          )}

          {showExport && (
            <button
              onClick={handleExport}
              disabled={isExporting || !onExport}
              className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={onExport ? "导出数据" : "暂无导出数据"}
            >
              {isExporting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </button>
          )}

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
