"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
} from "recharts";
import { UsersRound, UserX, Calendar, AlertCircle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import {
  computeRevisitStats,
  getChurnedPatients,
} from "@/lib/services";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

export default function PatientStatisticsPage() {
  const [range, setRange] = useState<7 | 14 | 30>(30);
  const data = useMemo(() => computeRevisitStats(range), [range]);

  const chartData = data.map((d) => ({
    date: format(new Date(d.date), "MM/dd", { locale: zhCN }),
    总接诊: d.totalPatients,
    复诊人数: d.revisitedPatients,
    复诊率: Number((d.revisitRate * 100).toFixed(1)),
  }));

  const avgRate =
    data.reduce((s, d) => s + d.revisitRate, 0) / (data.length || 1);
  const churned = getChurnedPatients();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            患者统计分析
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            复诊率、流失患者趋势与多维分析
          </p>
        </div>
        <div className="inline-flex rounded-lg border border-gold-200/60 bg-white p-1 shadow-sm">
          {[7, 14, 30].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r as 7 | 14 | 30)}
              className={
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all " +
                (range === r
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-ink-700 hover:bg-cream-100")
              }
            >
              近{r}天
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="平均复诊率"
          value={`${(avgRate * 100).toFixed(1)}%`}
          icon={UsersRound}
          color="green"
          delta={0.032}
          deltaType="increase"
          deltaGood
        />
        <StatCard
          title="流失患者数"
          value={churned.length}
          icon={UserX}
          color="red"
          suffix="人"
          delta={0.021}
          deltaType="increase"
          deltaGood={false}
        />
        <StatCard
          title="周期内总接诊"
          value={data.reduce((s, d) => s + d.totalPatients, 0)}
          icon={Calendar}
          color="teal"
          suffix="人次"
        />
        <StatCard
          title="周期内复诊"
          value={data.reduce((s, d) => s + d.revisitedPatients, 0)}
          icon={UsersRound}
          color="ochre"
          suffix="人次"
        />
      </div>

      <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
        <div>
          <h3 className="font-display text-base font-semibold text-ink-900">
            复诊趋势分析
          </h3>
          <p className="text-xs text-ink-600">
            接诊人数与复诊率随时间变化
          </p>
        </div>
        <div className="divider-gold my-3" />
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <defs>
                <linearGradient id="barTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0D7377" stopOpacity={0.85} />
                  <stop offset="100%" stopColor="#0D7377" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="barRevisit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D4A84B" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#C87941" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 168, 75, 0.18)" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                stroke="rgba(212, 168, 75, 0.25)"
                interval={range === 30 ? 4 : range === 14 ? 2 : 0}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                stroke="rgba(212, 168, 75, 0.25)"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                stroke="rgba(212, 168, 75, 0.25)"
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
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
              <Bar yAxisId="left" dataKey="总接诊" fill="url(#barTotal)" radius={[4, 4, 0, 0]} barSize={14} />
              <Bar yAxisId="left" dataKey="复诊人数" fill="url(#barRevisit)" radius={[4, 4, 0, 0]} barSize={14} />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="复诊率"
                stroke="#C87941"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#C87941" }}
                activeDot={{ r: 6, fill: "#C87941", stroke: "#fff", strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink-900">
              科室复诊率对比
            </h3>
          </div>
          <div className="divider-gold my-3" />
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { dept: "内科", 复诊率: 72.5, 接诊: 86 },
                  { dept: "针灸科", 复诊率: 81.2, 接诊: 64 },
                  { dept: "推拿科", 复诊率: 63.8, 接诊: 42 },
                ]}
                margin={{ top: 16, right: 16, left: 0, bottom: 8 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(212, 168, 75, 0.18)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#6B7280" }} stroke="rgba(212, 168, 75, 0.25)" tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                <YAxis dataKey="dept" type="category" tick={{ fontSize: 12, fill: "#2C3639" }} stroke="rgba(212, 168, 75, 0.25)" width={56} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid rgba(212, 168, 75, 0.4)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "复诊率"]}
                />
                <Bar dataKey="复诊率" fill="#0D7377" radius={[0, 4, 4, 0]} barSize={20}>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-hover rounded-xl border border-gold-200/50 bg-white p-5 shadow-card">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <h3 className="font-display text-base font-semibold text-ink-900">
              流失患者预警
            </h3>
          </div>
          <div className="divider-gold my-3" />
          <div className="space-y-2.5">
            {churned.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-red-100 bg-red-50/40 px-4 py-3 transition-colors hover:bg-red-50"
              >
                <div>
                  <p className="text-sm font-medium text-ink-900">
                    {p.name}
                    <span className="ml-2 text-xs text-ink-600">
                      {p.patientNo}
                    </span>
                  </p>
                  <p className="text-xs text-ink-600">
                    最后就诊：
                    {format(new Date(p.lastVisitDate), "yyyy-MM-dd", {
                      locale: zhCN,
                    })}
                    （{p.daysSinceLastVisit}天前）
                  </p>
                </div>
                <div className="text-right">
                  <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
                    {p.reason}
                  </span>
                  <p className="mt-1 text-[11px] text-ink-600">{p.phone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
