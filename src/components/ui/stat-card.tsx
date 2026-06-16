"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: number | string;
  label: string;
  trend?: "up" | "down";
  trendValue?: string;
  sparklineData?: number[];
  icon?: React.ElementType;
  className?: string;
}

function StatCard({ value, label, trend, trendValue, sparklineData, icon: Icon, className }: StatCardProps) {
  const chartData = sparklineData?.map((v, i) => ({ value: v, index: i }));

  return (
    <div className={cn("stat-card", className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            {Icon && <Icon className="h-5 w-5 text-slate-400" />}
            <p className="stat-value">{value}</p>
          </div>
          <p className="stat-label">{label}</p>
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend === "up" ? "text-emerald-600" : "text-rose-600"
            )}
          >
            {trend === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      {chartData && chartData.length > 1 && (
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke="#F59E0B"
                strokeWidth={1.5}
                fill="url(#sparkFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export { StatCard };
