import type { ScoreBucket } from "~/types";
import { Card } from "./Card";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface QuizDistributionProps {
  data: ScoreBucket[];
}

const COLORS = ["#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];

export function QuizDistribution({ data }: QuizDistributionProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card title="测验分数分布" subtitle={`共 ${total} 名学员参与测验`}>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={{ stroke: "#e5e7eb" }}
              tickLine={false}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  const pct = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                  return (
                    <div className="bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2">
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">
                        {item.count} 人 ({pct}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-5 gap-2 mt-4">
        {data.map((d, i) => {
          const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : 0;
          return (
            <div key={d.label} className="text-center">
              <div
                className="w-full h-2 rounded-full mb-1"
                style={{ backgroundColor: COLORS[i] }}
              />
              <p className="text-xs font-medium text-gray-900">{d.count}</p>
              <p className="text-xs text-gray-500">{pct}%</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
