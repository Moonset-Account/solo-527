"use client";

import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Thermometer, Droplets, AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { DotIndicator } from "@/components/ui/StatusBadge";
import { formatDate } from "@/utils/format";
import type { TemperatureRecord, Order } from "@/types";
import { cn } from "@/utils/cn";

interface TemperaturePanelProps {
  records?: TemperatureRecord[];
  minTemp?: number;
  maxTemp?: number;
  orderNo?: string;
  order?: Order;
  logs?: TemperatureRecord[];
  alertEnabled?: boolean;
}

export function TemperaturePanel(props: TemperaturePanelProps) {
  const {
    records,
    minTemp = 2,
    maxTemp = 8,
    orderNo,
    order,
    logs,
    alertEnabled,
  } = props;

  const actualRecords = records || logs || [];
  const actualMinTemp = minTemp ?? order?.temperatureRequired?.min ?? 2;
  const actualMaxTemp = maxTemp ?? order?.temperatureRequired?.max ?? 8;
  const actualOrderNo = orderNo || order?.orderNo;
  const [currentTemp, setCurrentTemp] = useState<number | null>(null);
  const [currentHumidity, setCurrentHumidity] = useState<number | null>(null);
  const [hasAnomaly, setHasAnomaly] = useState(false);

  useEffect(() => {
    if (actualRecords.length > 0) {
      const latest = actualRecords[actualRecords.length - 1];
      setCurrentTemp(latest.temperature);
      setCurrentHumidity(latest.humidity);
      setHasAnomaly(actualRecords.some((r) => !r.isNormal));
    }
  }, [actualRecords]);

  const chartData = actualRecords.map((r) => ({
    time: formatDate(r.timestamp, "HH:mm"),
    temperature: r.temperature,
    humidity: r.humidity,
    isNormal: r.isNormal,
  }));

  const isTempNormal = currentTemp !== null && currentTemp >= actualMinTemp && currentTemp <= actualMaxTemp;

  return (
    <Card className={cn(hasAnomaly && "border-danger-500/50 glow-red")}>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Thermometer className="h-5 w-5 text-warning-500" />
          <CardTitle>温控监控{actualOrderNo && ` - ${actualOrderNo}`}</CardTitle>
          {hasAnomaly && (
            <div className="flex items-center gap-1 text-danger-500 text-xs">
              <AlertTriangle className="h-4 w-4 animate-pulse-alert" />
              <span>温度异常</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>阈值范围: {actualMinTemp}°C ~ {actualMaxTemp}°C</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="h-4 w-4 text-warning-500" />
              <span className="text-sm text-slate-400">当前温度</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={cn(
                  "text-3xl font-display font-bold tabular-nums",
                  isTempNormal ? "text-success-500" : "text-danger-500 animate-pulse-alert"
                )}
              >
                {currentTemp !== null ? currentTemp.toFixed(1) : "--"}
              </span>
              <span className="text-slate-500 text-sm">°C</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <DotIndicator color={isTempNormal ? "success" : "danger"} pulse={!isTempNormal} />
              <span className="text-xs text-slate-500">
                {isTempNormal ? "正常范围内" : "超出阈值"}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="h-4 w-4 text-info-500" />
              <span className="text-sm text-slate-400">当前湿度</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-display font-bold text-info-500 tabular-nums">
                {currentHumidity !== null ? currentHumidity.toFixed(1) : "--"}
              </span>
              <span className="text-slate-500 text-sm">%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <DotIndicator color="info" />
              <span className="text-xs text-slate-500">湿度正常</span>
            </div>
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis
                dataKey="time"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[-5, 20]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "#94a3b8" }}
                itemStyle={{ color: "#f1f5f9" }}
              />
              <ReferenceLine y={actualMinTemp} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
              <ReferenceLine y={actualMaxTemp} stroke="#10b981" strokeDasharray="3 3" strokeWidth={1} />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#f97316"
                strokeWidth={2}
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  if (!payload.isNormal) {
                    return (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={4}
                        fill="#ef4444"
                        className="animate-pulse-alert"
                      />
                    );
                  }
                  return <circle cx={0} cy={0} r={0} />;
                }}
                activeDot={{ r: 4, fill: "#f97316" }}
              />
              <Line
                type="monotone"
                dataKey="humidity"
                stroke="#3b82f6"
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                opacity={0.5}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-warning-500" />
              <span>温度曲线</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-info-500" style={{ borderStyle: "dashed" }} />
              <span>湿度曲线</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-success-500" style={{ borderStyle: "dashed" }} />
              <span>正常阈值</span>
            </div>
          </div>
          <span className="text-xs text-slate-500">
            共 {actualRecords.length} 条记录
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
