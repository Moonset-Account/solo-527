"use client";

import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: "primary" | "green" | "orange" | "red";
  icon?: React.ReactNode;
  delay?: number;
}

const colorClasses = {
  primary: "from-primary-500 to-primary-600",
  green: "from-emerald-500 to-emerald-600",
  orange: "from-orange-500 to-orange-600",
  red: "from-red-500 to-red-600",
};

export default function MetricCard({
  title,
  value,
  unit,
  trend,
  trendLabel,
  color = "primary",
  icon,
  delay = 0,
}: MetricCardProps) {
  const TrendIcon =
    trend && trend > 0 ? TrendingUp : trend && trend < 0 ? TrendingDown : Minus;
  const trendColor =
    trend && trend > 0
      ? "text-red-600 bg-red-50"
      : trend && trend < 0
      ? "text-green-600 bg-green-50"
      : "text-slate-500 bg-slate-50";

  return (
    <div
      className="card card-hover animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-slate-500 font-medium">{title}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  "text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
                  colorClasses[color]
                )}
              >
                {value}
              </span>
              {unit && (
                <span className="text-sm text-slate-500 font-medium">
                  {unit}
                </span>
              )}
            </div>
          </div>
          {icon && (
            <div
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center",
                colorClasses[color]
              )}
            >
              <div className="text-white">{icon}</div>
            </div>
          )}
        </div>

        {(trend !== undefined || trendLabel) && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium",
                  trendColor
                )}
              >
                <TrendIcon className="w-3 h-3" />
                {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && (
              <span className="text-xs text-slate-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
