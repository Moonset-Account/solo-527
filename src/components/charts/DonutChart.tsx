"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

interface DonutChartProps {
  completed: number;
  pending: number;
  inProgress: number;
  overdue: number;
  height?: number;
}

const COLORS = [
  "#0D7377", // completed
  "#C87941", // pending
  "#D4A84B", // inProgress
  "#DC2626", // overdue
];

export default function DonutChart({
  completed,
  pending,
  inProgress,
  overdue,
  height = 280,
}: DonutChartProps) {
  const data = [
    { name: "已完成", value: completed },
    { name: "待随访", value: pending },
    { name: "进行中", value: inProgress },
    { name: "已逾期", value: overdue },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);
  const rate = total > 0 ? ((completed / total) * 100).toFixed(1) : "0";

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={62}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid rgba(212, 168, 75, 0.4)",
              borderRadius: 8,
              fontSize: 12,
              boxShadow: "0 4px 12px rgba(13, 115, 119, 0.1)",
            }}
            formatter={(v: number, n: string) => [
              `${v} 例 (${((v / total) * 100).toFixed(1)}%)`,
              n,
            ]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 12 }}
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pb-6">
        <span className="text-xs font-medium text-ink-600">完成率</span>
        <span className="font-mono text-3xl font-semibold text-teal-700 tabular-nums">
          {rate}%
        </span>
      </div>
    </div>
  );
}
