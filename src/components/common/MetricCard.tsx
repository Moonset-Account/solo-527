"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
  className?: string;
}

const colorConfig = {
  primary: {
    bg: "from-primary-50 to-primary-100/50",
    border: "border-primary-100",
    icon: "bg-primary-500 text-white",
  },
  success: {
    bg: "from-success-50 to-success-100/50",
    border: "border-success-100",
    icon: "bg-success-500 text-white",
  },
  warning: {
    bg: "from-warning-50 to-warning-100/50",
    border: "border-warning-100",
    icon: "bg-warning-500 text-white",
  },
  danger: {
    bg: "from-danger-50 to-danger-100/50",
    border: "border-danger-100",
    icon: "bg-danger-500 text-white",
  },
};

export function MetricCard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  icon,
  color = "primary",
  className,
}: MetricCardProps) {
  const colors = colorConfig[color];
  const isPositive = trend && trend >= 0;

  return (
    <div
      className={cn(
        "rounded-2xl p-5 bg-gradient-to-br border transition-all duration-300 hover:shadow-card-hover",
        colors.bg,
        colors.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-white shadow-sm">
          {icon || (
            <div className={cn("w-6 h-6 rounded-lg", colors.icon)} />
          )}
        </div>
        {trend !== undefined && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              isPositive
                ? "bg-success-100 text-success-700"
                : "bg-danger-100 text-danger-700"
            )}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {Math.abs(trend)}%
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-neutral-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-neutral-800 font-mono">
            {value}
          </span>
          {unit && <span className="text-sm text-neutral-500">{unit}</span>}
        </div>
        {trendLabel && (
          <p className="text-xs text-neutral-400 mt-1">{trendLabel}</p>
        )}
      </div>
    </div>
  );
}
