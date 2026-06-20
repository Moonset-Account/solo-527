"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const slaTrendData = [
  { date: "06/15", rate: 94.5, count: 156 },
  { date: "06/16", rate: 93.2, count: 168 },
  { date: "06/17", rate: 95.8, count: 142 },
  { date: "06/18", rate: 96.1, count: 175 },
  { date: "06/19", rate: 94.8, count: 163 },
  { date: "06/20", rate: 97.2, count: 189 },
  { date: "06/21", rate: 96.5, count: 172 },
];

const categoryData = [
  { name: "退换货", value: 45 },
  { name: "物流", value: 28 },
  { name: "质量", value: 18 },
  { name: "投诉", value: 12 },
  { name: "优惠券", value: 8 },
  { name: "安装", value: 5 },
];

export function QuickStats() {
  return (
    <Card className="border-0 shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-slate-800">
          趋势分析
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="sla" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sla">SLA达标率</TabsTrigger>
            <TabsTrigger value="volume">工单量</TabsTrigger>
          </TabsList>
          <TabsContent value="sla" className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={slaTrendData}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    domain={[90, 100]}
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                    formatter={(value: number) => [`${value}%`, "SLA达标率"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#1e3a5f"
                    strokeWidth={2}
                    fill="url(#colorRate)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
          <TabsContent value="volume" className="pt-4">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={slaTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#64748b" }}
                    axisLine={{ stroke: "#e2e8f0" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: "#f59e0b" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t border-slate-200">
          <h4 className="mb-3 text-sm font-medium text-slate-600">问题分类分布</h4>
          <div className="flex flex-wrap gap-2">
            {categoryData.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1.5 text-sm"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: [
                      "#1e3a5f",
                      "#3b82f6",
                      "#f59e0b",
                      "#10b981",
                      "#ef4444",
                      "#8b5cf6",
                    ][index],
                  }}
                />
                <span className="text-slate-700">{item.name}</span>
                <span className="font-semibold text-slate-900">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
