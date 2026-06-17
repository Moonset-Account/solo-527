import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { cn, formatNumber, formatDate } from "@/lib/utils";
import type { MetricDataPoint } from "@/types";

interface MetricSeries {
  dataKey: string;
  name: string;
  color: string;
  data: MetricDataPoint[];
}

interface AnomalyPoint {
  date: string;
  value: number;
  metricName: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

interface DimensionFilter {
  key: string;
  name: string;
  values: string[];
}

interface TrendChartProps {
  series: MetricSeries[];
  dimensions?: DimensionFilter[];
  anomalyPoints?: AnomalyPoint[];
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  className?: string;
}

const CHART_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const severityColorMap: Record<string, string> = {
  LOW: "#3B82F6",
  MEDIUM: "#F59E0B",
  HIGH: "#F97316",
  CRITICAL: "#EF4444",
};

export function TrendChart({
  series,
  dimensions,
  anomalyPoints = [],
  height = 400,
  showLegend = true,
  showGrid = true,
  className,
}: TrendChartProps) {
  const [selectedDimensions, setSelectedDimensions] = useState<Record<string, string>>({});
  const [activeDimensionKey, setActiveDimensionKey] = useState<string | null>(null);

  const mergedData = useMemo(() => {
    if (series.length === 0) return [];

    const allDates = new Set<string>();
    series.forEach((s) => {
      s.data.forEach((d) => allDates.add(d.date));
    });

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map((date) => {
      const row: Record<string, string | number> = { date };
      series.forEach((s) => {
        const dataPoint = s.data.find((d) => d.date === date);
        row[s.dataKey] = dataPoint?.value ?? 0;
      });
      return row;
    });
  }, [series]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-card-border rounded-lg shadow-xl p-3 min-w-[200px]">
          <p className="text-sm font-medium text-foreground mb-2">
            {formatDate(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-muted">{entry.name}</span>
              </div>
              <span className="text-sm font-semibold text-foreground font-display">
                {formatNumber(entry.value, 0)}
              </span>
            </div>
          ))}
          {anomalyPoints.filter((a) => a.date === label).length > 0 && (
            <div className="mt-2 pt-2 border-t border-card-border">
              <p className="text-xs font-medium text-danger flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                异常检测
              </p>
              {anomalyPoints
                .filter((a) => a.date === label)
                .map((anomaly, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs mt-1"
                  >
                    <span className="text-muted">{anomaly.metricName}</span>
                    <span
                      className="font-medium"
                      style={{ color: severityColorMap[anomaly.severity] }}
                    >
                      {anomaly.severity === "CRITICAL"
                        ? "严重"
                        : anomaly.severity === "HIGH"
                        ? "高"
                        : anomaly.severity === "MEDIUM"
                        ? "中"
                        : "低"}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const handleDimensionSelect = (dimKey: string, value: string) => {
    setSelectedDimensions((prev) => ({ ...prev, [dimKey]: value }));
    setActiveDimensionKey(null);
  };

  return (
    <div className={cn("w-full", className)}>
      {dimensions && dimensions.length > 0 && (
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          {dimensions.map((dim) => (
            <div key={dim.key} className="relative">
              <button
                onClick={() =>
                  setActiveDimensionKey(activeDimensionKey === dim.key ? null : dim.key)
                }
                className="flex items-center gap-2 px-3 py-2 bg-card border border-card-border rounded-lg text-sm hover:bg-muted/5 transition-colors"
              >
                <span className="text-muted">{dim.name}:</span>
                <span className="text-foreground font-medium">
                  {selectedDimensions[dim.key] || "全部"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-muted transition-transform",
                    activeDimensionKey === dim.key && "rotate-180"
                  )}
                />
              </button>
              {activeDimensionKey === dim.key && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-card-border rounded-lg shadow-xl z-10 overflow-hidden">
                  <div
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer hover:bg-muted/5 transition-colors",
                      !selectedDimensions[dim.key] && "bg-primary/5 text-primary font-medium"
                    )}
                    onClick={() => handleDimensionSelect(dim.key, "")}
                  >
                    全部
                  </div>
                  {dim.values.map((value) => (
                    <div
                      key={value}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer hover:bg-muted/5 transition-colors",
                        selectedDimensions[dim.key] === value &&
                          "bg-primary/5 text-primary font-medium"
                      )}
                      onClick={() => handleDimensionSelect(dim.key, value)}
                    >
                      {value}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            )}
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getMonth() + 1}/${date.getDate()}`;
              }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#94A3B8" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatNumber(value, 0)}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#E2E8F0" }} />
            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
                formatter={(value) => <span className="text-sm text-muted">{value}</span>}
              />
            )}
            {series.map((s, index) => (
              <Line
                key={s.dataKey}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color || CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
              />
            ))}
            {anomalyPoints.map((anomaly, index) => {
              const dataIndex = mergedData.findIndex((d) => d.date === anomaly.date);
              if (dataIndex === -1) return null;
              const seriesIndex = series.findIndex((s) =>
                s.data.some((d) => d.date === anomaly.date)
              );
              const dataKey = series[seriesIndex]?.dataKey;
              if (!dataKey) return null;
              const yValue = mergedData[dataIndex][dataKey] as number;
              return (
                <ReferenceLine
                  key={`anomaly-${index}`}
                  x={anomaly.date}
                  stroke={severityColorMap[anomaly.severity]}
                  strokeWidth={2}
                  strokeDasharray="3 3"
                >
                  <Cell
                    key={`anomaly-dot-${index}`}
                    cx={0}
                    cy={0}
                    r={6}
                    fill={severityColorMap[anomaly.severity]}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                </ReferenceLine>
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
