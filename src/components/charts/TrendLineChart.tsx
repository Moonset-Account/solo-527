"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface DataPoint {
  date: string;
  value: number;
}

interface TrendLineChartProps {
  revisit: DataPoint[];
  churn: DataPoint[];
  height?: number;
}

export default function TrendLineChart({
  revisit,
  churn,
  height = 280,
}: TrendLineChartProps) {
  const data = revisit.map((r, i) => ({
    date: r.date,
    复诊率: Number((r.value * 100).toFixed(1)),
    流失率: churn[i] ? Number((churn[i].value * 100).toFixed(1)) : 0,
  }));

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
        >
          <defs>
            <linearGradient id="revisitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0D7377" stopOpacity={0.18} />
              <stop offset="95%" stopColor="#0D7377" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="churnGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C87941" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#C87941" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(212, 168, 75, 0.18)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickFormatter={(v) =>
              format(new Date(v), "MM/dd", { locale: zhCN })
            }
            tick={{ fontSize: 11, fill: "#6B7280" }}
            stroke="rgba(212, 168, 75, 0.25)"
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#6B7280" }}
            stroke="rgba(212, 168, 75, 0.25)"
            tickFormatter={(v) => `${v}%`}
            domain={[0, "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid rgba(212, 168, 75, 0.4)",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(13, 115, 119, 0.1)",
            }}
            formatter={(value: number) => [`${value}%`]}
            labelFormatter={(v) =>
              format(new Date(v), "yyyy年MM月dd日", { locale: zhCN })
            }
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />
          <Line
            type="monotone"
            dataKey="复诊率"
            stroke="#0D7377"
            strokeWidth={2.2}
            dot={{ r: 2, fill: "#0D7377" }}
            activeDot={{ r: 5, fill: "#0D7377", stroke: "#fff", strokeWidth: 2 }}
          />
          <Line
            type="monotone"
            dataKey="流失率"
            stroke="#C87941"
            strokeWidth={2.2}
            dot={{ r: 2, fill: "#C87941" }}
            activeDot={{ r: 5, fill: "#C87941", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
