"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { CalendarCheck, CalendarRange, Users, AlertTriangle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { getAppointmentReports } from "@/lib/services";
import { cn, formatPercent } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function AppointmentReportsPage() {
  const [dept, setDept] = useState("");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["appointment-reports"],
    queryFn: () => getAppointmentReports(),
  });

  const filtered = reports ?? [];
  const byDate = filtered.reduce<Record<string, typeof filtered>>((acc, r) => {
    (acc[r.report_date] = acc[r.report_date] || []).push(r);
    return acc;
  }, {});

  const chartData = Object.entries(byDate).map(([date, items]) => ({
    date: format(new Date(date), "MM/dd", { locale: zhCN }),
    总号源: items.reduce((s, r) => s + r.total_slots, 0),
    已预约: items.reduce((s, r) => s + r.booked_slots, 0),
    已到诊: items.reduce((s, r) => s + r.attended_slots, 0),
  }));

  const totalSlots = filtered.reduce((s, r) => s + r.total_slots, 0);
  const totalBooked = filtered.reduce((s, r) => s + r.booked_slots, 0);
  const totalAttended = filtered.reduce((s, r) => s + r.attended_slots, 0);
  const avgUtil =
    filtered.length > 0
      ? filtered.reduce((s, r) => s + parseFloat(r.utilization_rate), 0) / filtered.length
      : 0;

  const exceptions = filtered.filter((r) => Object.keys(r.exception_impact || {}).length > 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            号源利用报表
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            号源预约、到诊分析，含权限异常病例的影响追踪
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-lg border border-gold-200/60 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="">全部科室</option>
            <option value="内科">内科</option>
            <option value="针灸科">针灸科</option>
            <option value="推拿科">推拿科</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="总号源数"
          value={totalSlots}
          icon={CalendarRange}
          color="teal"
          suffix="个"
        />
        <StatCard
          title="已预约数"
          value={totalBooked}
          icon={CalendarCheck}
          color="ochre"
          suffix="个"
          delta={0.05}
          deltaType="increase"
          deltaGood
        />
        <StatCard
          title="已到诊数"
          value={totalAttended}
          icon={Users}
          color="green"
          suffix="人次"
          delta={0.03}
          deltaType="increase"
          deltaGood
        />
        <StatCard
          title="平均利用率"
          value={formatPercent(avgUtil, 1)}
          icon={CalendarCheck}
          color="gold"
        />
      </div>

      <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">
            号源利用趋势
          </h3>
          <p className="text-xs text-ink-600">总号源 / 预约 / 实际到诊对比</p>
        </div>
        <div className="divider-gold my-3" />
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
            >
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6B7280" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="#6B7280" stopOpacity={0.3} />
                </linearGradient>
                <linearGradient id="gBooked" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D7377" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0D7377" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gAttend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A84B" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#C87941" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 168, 75, 0.18)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6B7280" }} stroke="rgba(212, 168, 75, 0.25)" />
              <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} stroke="rgba(212, 168, 75, 0.25)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid rgba(212, 168, 75, 0.4)",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(13, 115, 119, 0.1)",
                }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="总号源" fill="url(#gTotal)" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="已预约" fill="url(#gBooked)" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar dataKey="已到诊" fill="url(#gAttend)" radius={[4, 4, 0, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="card-hover overflow-hidden rounded-xl border border-gold-200/50 bg-white shadow-card lg:col-span-2">
          <div className="border-b border-gold-100/60 px-5 py-4">
            <h3 className="font-display text-base font-semibold text-ink-900">
              科室号源明细
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gradient-to-r from-cream-200/70 to-cream-100">
                <tr>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    日期
                  </th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-ink-700">
                    科室
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                    总号源
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                    已预约
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                    已到诊
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-ink-700">
                    利用率
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-100/60">
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-5 py-6">
                        <div className="skeleton h-8 w-full" />
                      </td>
                    </tr>
                  ))
                ) : (
                  filtered.map((r) => {
                    const hasException = Object.keys(r.exception_impact || {}).length > 0;
                    return (
                      <tr
                        key={r.id}
                        className={cn(
                          "transition-colors hover:bg-teal-50/40",
                          hasException && "bg-ochre-50/40"
                        )}
                      >
                        <td className="px-5 py-3 font-mono text-sm tabular-nums text-ink-800">
                          {format(new Date(r.report_date), "yyyy-MM-dd", { locale: zhCN })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-ink-900">{r.department}</span>
                            {hasException && (
                              <StatusBadge variant="high" label="异常影响" />
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-ink-800">
                          {r.total_slots}
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-teal-700">
                          {r.booked_slots}
                          <span className="ml-1 text-[11px] text-ink-600">
                            ({r.total_slots > 0 ? ((r.booked_slots / r.total_slots) * 100).toFixed(0) : 0}%)
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-mono tabular-nums text-gold-700">
                          {r.attended_slots}
                          <span className="ml-1 text-[11px] text-ink-600">
                            ({r.total_slots > 0 ? ((r.attended_slots / r.total_slots) * 100).toFixed(0) : 0}%)
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-mono text-sm font-semibold tabular-nums text-ink-900">
                            {formatPercent(parseFloat(r.utilization_rate), 1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-ochre-600" />
            <h3 className="font-display text-base font-semibold text-ink-900">
              异常影响分析
            </h3>
          </div>
          <div className="divider-gold my-3" />
          {exceptions.length === 0 ? (
            <div className="py-12 text-center text-sm text-ink-600">
              暂无异常病例影响记录
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((r) => {
                const impact = r.exception_impact as Record<string, unknown>;
                return (
                  <div
                    key={r.id}
                    className="rounded-lg border border-ochre-200/60 bg-ochre-50/40 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-ink-900">
                        {r.department}
                      </span>
                      <StatusBadge
                        variant={(impact.severity as "low" | "medium" | "high" | "critical") || "high"}
                        dot
                      />
                    </div>
                    <p className="mt-1 text-xs text-ink-700">
                      {format(new Date(r.report_date), "yyyy-MM-dd", { locale: zhCN })}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-ink-800">
                      {String(impact.conclusion || "已同步处理结论")}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
