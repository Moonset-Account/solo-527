import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { cn, formatNumber, formatPercent } from "@/lib/utils";
import type { Metric, MetricDataPoint } from "@/types";
import { StatusBadge } from "./StatusBadge";

interface MetricCardProps {
  metric: Metric;
  trendData?: MetricDataPoint[];
  onClick?: () => void;
  className?: string;
}

const statusMap: Record<string, "normal" | "warning" | "critical"> = {
  NORMAL: "normal",
  WARNING: "warning",
  CRITICAL: "critical",
};

const statusLabelMap: Record<string, string> = {
  NORMAL: "正常",
  WARNING: "警告",
  CRITICAL: "严重",
};

export function MetricCard({ metric, trendData, onClick, className }: MetricCardProps) {
  const isPositive = metric.trend === "UP";
  const isNegative = metric.trend === "DOWN";
  const isStable = metric.trend === "STABLE";

  const chartData = trendData?.map((item) => ({
    ...item,
    value: item.value,
  })) || [];

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-card-border shadow-card p-5 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-semibold text-foreground truncate">
              {metric.name}
            </h3>
            <span className="text-xs text-muted font-mono bg-muted/10 px-1.5 py-0.5 rounded">
              {metric.code}
            </span>
          </div>
          <StatusBadge status={statusMap[metric.status] || "normal"} size="sm">
            {statusLabelMap[metric.status] || "正常"}
          </StatusBadge>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-3xl font-bold font-display text-foreground">
            {formatNumber(metric.currentValue, 0)}
          </span>
          <span className="text-sm text-muted">{metric.unit}</span>
        </div>
        <div
          className={cn(
            "flex items-center gap-1 text-sm font-medium",
            isPositive && "text-success",
            isNegative && "text-danger",
            isStable && "text-muted"
          )}
        >
          {isPositive && <TrendingUp className="w-4 h-4" />}
          {isNegative && <TrendingDown className="w-4 h-4" />}
          {isStable && <Minus className="w-4 h-4" />}
          <span>
            {isPositive ? "+" : ""}
            {formatPercent(metric.changeRate)}
          </span>
          <span className="text-muted font-normal">环比</span>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="h-16 -mx-2 -mb-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isNegative ? "#EF4444" : isPositive ? "#10B981" : "#3B82F6"}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor={isNegative ? "#EF4444" : isPositive ? "#10B981" : "#3B82F6"}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={isNegative ? "#EF4444" : isPositive ? "#10B981" : "#3B82F6"}
                strokeWidth={2}
                fill={`url(#gradient-${metric.id})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
