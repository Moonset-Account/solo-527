"use client";

import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  color?: string;
  trend?: {
    value: number;
    label: string;
  };
  className?: string;
}

function StatCard({
  icon: Icon,
  title,
  value,
  color,
  trend,
  className = "",
}: StatCardProps) {
  const iconBgStyle = color
    ? { backgroundColor: `${color}18`, color }
    : undefined;

  return (
    <div
      className={`bg-white rounded-xl border border-border p-5 transition-shadow hover:shadow-md ${className}`}
    >
      <div className="flex items-start justify-between">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary-100 text-primary-700"
          style={iconBgStyle}
        >
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-sm font-medium ${
              trend.value >= 0 ? "text-primary-600" : "text-danger-600"
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span>
              {trend.value >= 0 ? "+" : ""}
              {trend.value}%
            </span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{title}</p>
      </div>
      {trend && (
        <p className="text-xs text-muted-foreground mt-2">{trend.label}</p>
      )}
    </div>
  );
}

export { StatCard };
export default StatCard;
