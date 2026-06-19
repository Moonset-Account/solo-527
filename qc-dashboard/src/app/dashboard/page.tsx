"use client"

import Link from "next/link"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import {
  ClipboardCheck,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { mockData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

const metrics = [
  {
    key: "today_inspected" as const,
    label: "今日已检",
    icon: ClipboardCheck,
    trend: 12,
    trendUp: true,
  },
  {
    key: "avg_score" as const,
    label: "平均评分",
    icon: TrendingUp,
    trend: 3.2,
    trendUp: true,
  },
  {
    key: "pending_count" as const,
    label: "待处理",
    icon: Clock,
    trend: 2,
    trendUp: false,
  },
  {
    key: "timeout_risk_count" as const,
    label: "超时风险",
    icon: AlertTriangle,
    trend: 1,
    trendUp: false,
  },
]

const pendingSessions = mockData.sessions.filter(
  (s) => s.status === "pending" || s.status === "inspecting"
)

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((m) => {
          const value = mockData.dashboardMetrics[m.key]
          const Icon = m.icon
          return (
            <div
              key={m.key}
              className="flex items-center gap-4 rounded-xl bg-navy px-5 py-4 text-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <Icon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-bold leading-tight">
                  {m.key === "avg_score" ? value.toFixed(1) : value}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-light">{m.label}</span>
                  <span
                    className={cn(
                      "inline-flex items-center text-xs font-medium",
                      m.trendUp ? "text-emerald-light" : "text-amber-light"
                    )}
                  >
                    {m.trendUp ? (
                      <TrendingUp size={12} />
                    ) : (
                      <TrendingDown size={12} />
                    )}
                    {m.trendUp ? "+" : ""}
                    {m.trend}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">
              超时风险分布
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={mockData.timeoutRiskDistribution}
                layout="vertical"
                margin={{ top: 0, right: 24, bottom: 0, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={72}
                  tick={{ fontSize: 12 }}
                  stroke="#94A3B8"
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#E8913A"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-navy">
              待处理任务
            </h2>
            <div className="space-y-2">
              {pendingSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-navy-dark">
                        {session.agent_name}
                      </span>
                      <span
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                          session.status === "pending"
                            ? "bg-amber-bg text-amber"
                            : "bg-surface text-navy-light"
                        )}
                      >
                        {session.status === "pending" ? "待质检" : "质检中"}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-light">
                      {session.order_no}
                    </p>
                  </div>
                  {session.has_timeout_risk && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-navy">质检评分趋势</h2>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart
            data={mockData.trendData}
            margin={{ top: 4, right: 24, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D9C6F" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#2D9C6F" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              stroke="#94A3B8"
              dy={8}
            />
            <YAxis
              domain={[60, 100]}
              tick={{ fontSize: 12 }}
              stroke="#94A3B8"
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#1E3A5F"
              strokeWidth={2}
              fill="url(#scoreGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
