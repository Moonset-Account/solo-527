"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { Rider } from "@/types";

interface RiderStatusChartProps {
  riders: Rider[];
}

export function RiderStatusChart({ riders }: RiderStatusChartProps) {
  const statusCounts = {
    idle: riders.filter((r) => r.status === "idle").length,
    busy: riders.filter((r) => r.status === "busy").length,
    delivering: riders.filter((r) => r.status === "delivering").length,
    offline: riders.filter((r) => r.status === "offline").length,
  };

  const data = [
    { name: "空闲", value: statusCounts.idle, color: "#10b981" },
    { name: "忙碌", value: statusCounts.busy, color: "#f97316" },
    { name: "配送中", value: statusCounts.delivering, color: "#3b82f6" },
    { name: "离线", value: statusCounts.offline, color: "#64748b" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>骑手状态分布</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value}人`, "数量"]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                wrapperStyle={{ fontSize: "12px" }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-4">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between bg-slate-800/50 rounded px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-slate-400">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-slate-200">{item.value}人</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
