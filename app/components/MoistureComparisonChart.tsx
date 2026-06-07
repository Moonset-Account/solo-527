import { useMemo } from "react";
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
} from "recharts";
import type { MoistureItem } from "~/types";
import { formatDate } from "~/hooks/useFilterContext";

interface MoistureComparisonChartProps {
  data: MoistureItem[];
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
const TARGET_MIN = 60;
const TARGET_MAX = 80;

export default function MoistureComparisonChart({ data }: MoistureComparisonChartProps) {
  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, any>> = {};

    data.forEach((item) => {
      const dateKey = item.date;
      if (!byDate[dateKey]) {
        byDate[dateKey] = { date: dateKey, displayDate: formatDate(dateKey).slice(5) };
      }
      byDate[dateKey][`${item.fieldName}_avg`] = item.avgMoisture;
      byDate[dateKey][`${item.fieldName}_min`] = item.minMoisture;
      byDate[dateKey][`${item.fieldName}_max`] = item.maxMoisture;
    });

    return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
  }, [data]);

  const fields = useMemo(() => {
    const fieldMap = new Map<number, string>();
    data.forEach((item) => fieldMap.set(item.fieldId, item.fieldName));
    return Array.from(fieldMap.values());
  }, [data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">土壤湿度对比</h3>
          <p className="text-sm text-gray-500 mt-1">
            各地块土壤湿度变化，虚线为适宜范围
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-0.5 bg-green-400 border-t-2 border-dashed" />
          <span className="text-sm text-gray-500">适宜范围 {TARGET_MIN}-{TARGET_MAX}%</span>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="moistureArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              tickLine={false}
              axisLine={{ stroke: "#e5e7eb" }}
              label={{ value: "湿度 (%)", angle: -90, position: "insideLeft", fontSize: 12, fill: "#6b7280" }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-100">
                      <p className="font-medium text-gray-800 mb-2">{payload[0].payload.date}</p>
                      {payload.map((entry, idx) => (
                        <p key={idx} className="text-sm" style={{ color: entry.color }}>
                          {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}%
                        </p>
                      ))}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />

            <ReferenceLine y={TARGET_MIN} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />
            <ReferenceLine y={TARGET_MAX} stroke="#10b981" strokeDasharray="3 3" strokeOpacity={0.5} />

            {fields.map((field, idx) => (
              <Line
                key={field}
                type="monotone"
                dataKey={`${field}_avg`}
                name={field}
                stroke={COLORS[idx % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
        {fields.slice(0, 3).map((field, idx) => {
          const fieldData = data.filter((d) => d.fieldName === field);
          const avgMoisture = fieldData.length
            ? fieldData.reduce((sum, d) => sum + d.avgMoisture, 0) / fieldData.length
            : 0;
          return (
            <div key={field} className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-sm text-gray-600">{field}</span>
              </div>
              <div className="text-lg font-semibold text-gray-800">{avgMoisture.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">平均湿度</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
