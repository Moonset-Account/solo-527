"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function ReportStatCard({
  title,
  value,
  suffix,
}: {
  title: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-indigo-primary mt-1">
        {value}
        {suffix}
      </p>
    </div>
  );
}

function RateColorBadge({ rate }: { rate: number }) {
  const percent = (rate * 100).toFixed(1);
  let colorClass = "text-red-600";
  if (rate > 0.7) colorClass = "text-green-primary";
  else if (rate >= 0.4) colorClass = "text-amber-warning";

  return <span className={`font-semibold ${colorClass}`}>{percent}%</span>;
}

function ProgressBar({ rate }: { rate: number }) {
  const percent = Math.round(rate * 100);
  let barColor = "bg-red-500";
  if (rate > 0.7) barColor = "bg-green-primary";
  else if (rate >= 0.4) barColor = "bg-amber-warning";

  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div
        className={`${barColor} h-2 rounded-full transition-all`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export default function ReportsPage() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: stats } = trpc.report.getFollowUpRate.useQuery({
    startDate: startDate ? new Date(startDate) : undefined,
    endDate: endDate ? new Date(endDate) : undefined,
  });

  const { data: trendData } = trpc.report.getFollowUpRateTrend.useQuery();

  const { data: doctorData } = trpc.report.getFollowUpRateByDoctor.useQuery();

  const chartData = (trendData ?? []).map((d) => ({
    ...d,
    ratePercent: +(d.rate * 100).toFixed(1),
  }));

  return (
    <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif font-bold text-indigo-primary">
            复诊率报表
          </h1>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-primary/30"
            />
            <span className="text-gray-400 text-sm">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-primary/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <ReportStatCard
            title="总体复诊率"
            value={stats ? (stats.rate * 100).toFixed(1) : "-"}
            suffix="%"
          />
          <ReportStatCard
            title="总任务数"
            value={stats?.total ?? "-"}
          />
          <ReportStatCard
            title="已完成数"
            value={stats?.completed ?? "-"}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-lg font-serif font-semibold text-indigo-primary mb-4">
            复诊率趋势
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d0" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12, fill: "#666" }}
                tickFormatter={(v: string) => v.replace("-", "年") + "月"}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#666" }}
                tickFormatter={(v: number) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "复诊率"]}
                labelFormatter={(label: string) =>
                  label.replace("-", "年") + "月"
                }
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e8e0d0",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                }}
              />
              <Line
                type="monotone"
                dataKey="ratePercent"
                stroke="#4a7c59"
                strokeWidth={2}
                dot={{ fill: "#4a7c59", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-serif font-semibold text-indigo-primary mb-4">
            按医师统计
          </h2>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  医师ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  任务总数
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  已完成
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
                  复诊率
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 w-48">
                  进度
                </th>
              </tr>
            </thead>
            <tbody>
              {(doctorData ?? []).map((row) => (
                <tr
                  key={row.doctorId}
                  className="border-b border-gray-50 hover:bg-beige-warm/50 transition-colors"
                >
                  <td className="py-3 px-4 text-sm font-mono">
                    {row.doctorId}
                  </td>
                  <td className="py-3 px-4 text-sm">{row.total}</td>
                  <td className="py-3 px-4 text-sm">{row.completed}</td>
                  <td className="py-3 px-4 text-sm">
                    <RateColorBadge rate={row.rate} />
                  </td>
                  <td className="py-3 px-4">
                    <ProgressBar rate={row.rate} />
                  </td>
                </tr>
              ))}
              {(!doctorData || doctorData.length === 0) && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400 text-sm"
                  >
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
    </div>
  );
}
