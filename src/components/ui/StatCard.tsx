import { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "orange" | "red";
  className?: string;
}

const colorClasses = {
  blue: "from-brand-500/20 to-brand-500/5 border-brand-500/30",
  green: "from-success-500/20 to-success-500/5 border-success-500/30",
  orange: "from-warning-500/20 to-warning-500/5 border-warning-500/30",
  red: "from-danger-500/20 to-danger-500/5 border-danger-500/30",
};

const iconColorClasses = {
  blue: "text-brand-500",
  green: "text-success-500",
  orange: "text-warning-500",
  red: "text-danger-500",
};

export function StatCard({ title, value, icon, trend, color = "blue", className }: StatCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-gradient-to-br p-5 transition-all duration-300 hover:scale-[1.02]",
        colorClasses[color],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{title}</p>
          <p className="text-3xl font-display font-bold text-slate-100 tabular-nums">
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                trend.isPositive ? "text-success-500" : "text-danger-500"
              )}
            >
              <span>{trend.isPositive ? "↑" : "↓"}</span>
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-slate-500">较昨日</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={cn("p-3 rounded-lg bg-slate-800/50", iconColorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
