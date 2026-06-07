import { useMemo } from "react";
import {
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import type { PumpEnergyItem } from "~/types";
import { formatNumber, formatDate } from "~/hooks/useFilterContext";

interface PumpEnergyChartProps {
  data: PumpEnergyItem[];
}

const PUMP_COLORS: Record<string, string> = {
  "1号泵站": "#3b82f6",
  "2号泵站": "#10b981",
  "3号泵站": "#f59e0b",
};

export default function PumpEnergyChart({ data }: PumpEnergyChartProps) {
  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, any>> = {};

    data.forEach((item) => {
      const dateKey = item.date;
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, displayDate: formatDate(dateKey).slice(5) };
      }
      byDate[dateKey][`${item.pumpName}_water`] = item.totalWater;
      byDate[dateKey][`${item.pumpName}_cost`] = item.totalCost;
      byDate[dateKey][`${item.pumpName}_efficiency`] = item.efficiency;
    });

    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const pumps = useMemo(() => {
    const pumpMap = new Map<number, string>();
    data.forEach((item) => pumpMap.set(item.pumpId, item.pumpName));
    return Array.from(pumpMap.values());
  }, [data]);

  const avgEfficiencyByPump = useMemo(() => {
    const result: Record<string, number> = {};
    pumps.forEach((pump) => {
      const pumpData = data.filter((d) => d.pumpName === pump);
      result[pump] = pumpData.length
        ? pumpData.reduce((sum, d) => sum + d.efficiency, 0) / pumpData.length
        : 0;
    });
    return result;
  }, [data, pumps]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">泵站能耗分析</h3>
          <p className="text-sm text-gray-500 mt-1">
            各泵站供水量与运行效率对比
          </p>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "供水量 (m³)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "效率 (%)", angle: 90, position: "insideRight", fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                      <p className="font-medium text-gray-800 mb-2">{payload[0].payload.date}</p>
                      {payload.map((entry, idx) => {
                        const name = String(entry.name || "");
                        const value = entry.value;
                        const numValue = typeof value === "number" ? value : 0;
                        return (
                          <p key={idx} className="text-sm" style={{ color: entry.color }}>
                            {name}: {name.includes("效率") ? `${numValue.toFixed(1)}%` : `${formatNumber(numValue)} m³`}
                          </p>
                        );
                      })}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />

            {pumps.map((pump, idx) => (
              <Bar
                key={`${pump}-water`}
                yAxisId="left"
                dataKey={`${pump}_water`}
                name={`${pump} 供水量`}
                fill={PUMP_COLORS[pump] || `hsl(${idx * 60}, 70%, 50%)`}
                radius={[4, 4, 0, 0]}
                barSize={20}
              />
            ))}

            {pumps.map((pump, idx) => (
              <Line
                key={`${pump}-efficiency`}
                yAxisId="right"
                type="monotone"
                dataKey={`${pump}_efficiency`}
                name={`${pump} 效率`}
                stroke={PUMP_COLORS[pump] || `hsl(${idx * 60}, 70%, 50%)`}
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        {pumps.map((pump, idx) => (
          <div key={pump} className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: PUMP_COLORS[pump] }}
              />
              <span className="text-sm text-gray-600">{pump}</span>
            </div>
            <div className="text-lg font-semibold text-gray-800">
              {avgEfficiencyByPump[pump].toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">平均运行效率</div>
          </div>
        ))}
      </div>
    </div>
  );
}
