"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BarChart3 } from "lucide-react";

interface DailyConsumption {
  date: string;
  hours: number;
  classes: number;
}

interface DailyConsumptionChartProps {
  data: DailyConsumption[];
  period?: string;
}

export function DailyConsumptionChart({
  data,
  period,
}: DailyConsumptionChartProps) {
  const displayData = data.length > 15 ? data.slice(-15) : data;
  const totalHours = data.reduce((s, d) => s + d.hours, 0);
  const totalClasses = data.reduce((s, d) => s + d.classes, 0);
  const avgHours = data.length > 0 ? +(totalHours / data.length).toFixed(1) : 0;

  return (
    <div className="card-gold p-5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-deep-blue-600" size={18} />
          <h3 className="section-title text-base">每日消课趋势</h3>
          {period && (
            <span className="chip bg-deep-blue-50 text-deep-blue-500 border border-deep-blue-100 !text-[10px]">
              {period}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right">
            <div className="num text-base font-semibold text-deep-blue-700">
              {totalHours}
            </div>
            <div className="text-deep-blue-400">总课时</div>
          </div>
          <div className="w-px h-8 bg-deep-blue-100" />
          <div className="text-right">
            <div className="num text-base font-semibold text-ink-gold-600">
              {avgHours}
            </div>
            <div className="text-deep-blue-400">日均</div>
          </div>
          <div className="w-px h-8 bg-deep-blue-100" />
          <div className="text-right">
            <div className="num text-base font-semibold text-success-green">
              {totalClasses}
            </div>
            <div className="text-deep-blue-400">课次</div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={displayData}
            margin={{ top: 10, right: 8, left: -16, bottom: 0 }}
          >
            <defs>
              <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2E4F7A" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#80A0C6" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#E8EDF3"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#4D719B" }}
              axisLine={{ stroke: "#D9E3F0" }}
              tickLine={false}
              interval={displayData.length > 10 ? 1 : 0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#4D719B" }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                background: "#fff",
                border: "1px solid #D9E3F0",
                borderRadius: "8px",
                fontSize: "12px",
                boxShadow: "0 4px 12px rgba(30, 58, 95, 0.1)",
              }}
              labelStyle={{ color: "#1E3A5F", fontWeight: 600 }}
              formatter={(value: number, name: string) => [
                <span className="num">{value}</span>,
                name === "hours" ? "消课时" : "课次数",
              ]}
            />
            <Bar
              dataKey="hours"
              radius={[4, 4, 0, 0]}
              maxBarSize={24}
            >
              {displayData.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill="url(#hoursGradient)"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
