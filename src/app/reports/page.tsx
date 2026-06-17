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
  BarChart,
  Bar,
  Legend,
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

function AppointmentStatusPill({ status }: { status: string | null }) {
  const styles: Record<string, string> = {
    SCHEDULED: "bg-indigo-primary/10 text-indigo-primary",
    RESCHEDULED: "bg-amber-warning/10 text-amber-warning",
    CONFLICT: "bg-red-500/10 text-red-600",
    CANCELLED: "bg-gray-400/10 text-gray-500",
  };
  const labels: Record<string, string> = {
    SCHEDULED: "已预约",
    RESCHEDULED: "已改期",
    CONFLICT: "号源冲突",
    CANCELLED: "已取消",
  };
  const style = status ? styles[status] ?? "bg-gray-100 text-gray-500" : "bg-gray-100 text-gray-500";
  const label = status ? labels[status] ?? "无" : "无预约";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
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
  const { data: statusDist } = trpc.report.getAppointmentStatusDistribution.useQuery();
  const { data: impactData } = trpc.report.getAppointmentImpactOnFollowUp.useQuery();

  const chartData = (trendData ?? []).map((d) => ({
    ...d,
    ratePercent: +(d.rate * 100).toFixed(1),
  }));

  const stackedMonthlyData = (statusDist?.monthly ?? []).map((m) => ({
    month: m.month.replace("-", "年") + "月",
    已预约: m.scheduled,
    已改期: m.rescheduled,
    号源冲突: m.conflict,
    已取消: m.cancelled,
  }));

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
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

      <div className="grid grid-cols-3 gap-6">
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

      <div className="bg-white rounded-xl shadow-sm p-6">
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

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-serif font-semibold text-indigo-primary mb-4">
            预约状态分布
          </h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {(statusDist?.byStatus ?? []).map((s) => (
              <div
                key={s.status}
                className="rounded-lg border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <AppointmentStatusPill status={s.status} />
                  <span className="text-sm text-gray-400">
                    {((s.rate ?? 0) * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-2xl font-bold text-indigo-primary">{s.count}</p>
                <ProgressBar rate={s.rate ?? 0} />
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stackedMonthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8e0d0" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#666" }} />
              <YAxis tick={{ fontSize: 11, fill: "#666" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e8e0d0",
                }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="已预约" stackId="a" fill="#1e3a5f" radius={[0, 0, 0, 0]} />
              <Bar dataKey="已改期" stackId="a" fill="#d4913b" />
              <Bar dataKey="号源冲突" stackId="a" fill="#c0392b" />
              <Bar dataKey="已取消" stackId="a" fill="#9ca3af" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-serif font-semibold text-indigo-primary mb-4">
            预约状态对复诊管理的影响
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            对比不同预约状态下的随访复诊完成率
          </p>
          <div className="space-y-3">
            {(impactData?.items ?? []).map((item) => (
              <div
                key={item.bucket}
                className="rounded-lg border border-gray-100 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <AppointmentStatusPill status={item.status} />
                    <span className="text-sm font-medium text-gray-700">
                      {item.label}
                    </span>
                  </div>
                  <RateColorBadge rate={item.rate} />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span>
                    已完成 {item.completed} / 总 {item.total}
                  </span>
                </div>
                <ProgressBar rate={item.rate} />
              </div>
            ))}
          </div>
        </div>
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
