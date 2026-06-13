"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNumber, formatPercent } from "@/utils/format";

interface MetricCardProps {
  title: string;
  value: number;
  unit?: string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "flat";
  isPositive?: boolean;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  unit = "",
  change,
  changeLabel = "环比",
  trend,
  isPositive = true,
  onClick,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="w-4 h-4" />;
    if (trend === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getTrendColor = () => {
    if (trend === "flat") return "text-neutral-500";
    const goodColor = isPositive ? "text-emerald-600" : "text-red-600";
    const badColor = isPositive ? "text-red-600" : "text-emerald-600";
    return trend === "up" ? goodColor : badColor;
  };

  const getTrendBg = () => {
    if (trend === "flat") return "bg-neutral-100";
    const goodBg = isPositive ? "bg-emerald-50" : "bg-red-50";
    const badBg = isPositive ? "bg-red-50" : "bg-emerald-50";
    return trend === "up" ? goodBg : badBg;
  };

  return (
    <div
      className={`card p-5 transition-all duration-200 ${
        onClick ? "cursor-pointer hover:shadow-card-hover hover:-translate-y-0.5" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-sm font-medium text-neutral-600">{title}</h3>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-2xl lg:text-3xl font-bold text-neutral-900 font-mono tracking-tight">
          {unit === "%" ? value.toFixed(1) : formatNumber(value)}
          <span className="text-lg font-normal text-neutral-500 ml-1">{unit}</span>
        </span>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${getTrendBg()} ${getTrendColor()}`}
          >
            {getTrendIcon()}
            <span>{change > 0 ? "+" : ""}{formatPercent(change / 100)}</span>
          </div>
          <span className="text-xs text-neutral-500">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}
