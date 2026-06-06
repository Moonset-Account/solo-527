"use client";

import { cn, formatMinutes, formatNumber } from "@/utils";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  unit?: string;
  trend?: number;
  icon?: React.ReactNode;
  color?: "primary" | "success" | "warning" | "danger";
  isTime?: boolean;
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  icon,
  color = "primary",
  isTime = false,
}: KPICardProps) {
  const colorClasses = {
    primary: "bg-primary-50 text-primary-600",
    success: "bg-success-50 text-success-600",
    warning: "bg-warning-50 text-warning-600",
    danger: "bg-danger-50 text-danger-600",
  };

  const displayValue = isTime && typeof value === "number"
    ? formatMinutes(value)
    : formatNumber(value as number);

  return (
    <div className="bg-white rounded-lg shadow-card p-4 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-800 font-mono">
            {displayValue}
            {unit && <span className="text-sm font-normal text-neutral-500 ml-1">{unit}</span>}
          </p>
        </div>
        {icon && (
          <div className={cn("p-2.5 rounded-lg", colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-3 flex items-center gap-1">
          {trend > 0 ? (
            <ArrowUp className="w-3.5 h-3.5 text-danger-500" />
          ) : trend < 0 ? (
            <ArrowDown className="w-3.5 h-3.5 text-success-500" />
          ) : (
            <Minus className="w-3.5 h-3.5 text-neutral-400" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend > 0
                ? "text-danger-500"
                : trend < 0
                ? "text-success-500"
                : "text-neutral-400"
            )}
          >
            {Math.abs(trend)}分钟
          </span>
          <span className="text-xs text-neutral-400">较上一周期</span>
        </div>
      )}
    </div>
  );
}
