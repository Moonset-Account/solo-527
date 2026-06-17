"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  BarChart3,
  Users,
  ClipboardCheck,
  Target,
  TrendingUp,
  AlertTriangle,
  Download,
  FileText,
  ChevronRight,
  Star,
  Layers,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { format, parseISO, eachDayOfInterval, subDays } from "date-fns"

const PIE_COLORS = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6"]

export default function DashboardPage() {
  const router = useRouter()
  const { interviews, submissions, questions, hiringResults, alerts, interviewers, systemConfigs } = useAppStore()

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_quality_dashboard")?.value !== "false"

  const totalInterviews = interviews.length
  const completedInterviews = interviews.filter((i) => i.status === "completed")
  const pendingInterviews = interviews.filter((i) => i.status === "scheduled").length
  const unresolvedAlerts = alerts.filter((a) => !a.is_resolved).length

  const passRate = completedInterviews.length > 0
    ? Math.round(
        (interviews.filter((i) => i.result === "pass").length / completedInterviews.length) * 100
      )
    : 0

  const avgScore = useMemo(() => {
    const allScores = completedInterviews
      .filter((i) => i.scores && i.scores.length > 0)
      .flatMap((i) => i.scores!.map((s) => s.score / s.max_score))
    if (allScores.length === 0) return 0
    return Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100)
  }, [completedInterviews])

  const hireRate = hiringResults.length > 0
    ? Math.round((hiringResults.filter((r) => r.decision === "hired").length / hiringResults.length) * 100)
    : 0

  const last14Days = useMemo(() => {
    const end = new Date()
    const start = subDays(end, 13)
    return eachDayOfInterval({ start, end })
  }, [])

  const interviewTrend = useMemo(() => {
    return last14Days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const dayInterviews = interviews.filter((i) => {
        const ivDay = format(parseISO(i.scheduled_at), "yyyy-MM-dd")
        return ivDay === dayStr
      })
      return {
        date: format(day, "MM/dd"),
        安排数: dayInterviews.length,
        完成数: dayInterviews.filter((i) => i.status === "completed").length,
      }
    })
  }, [interviews, last14Days])

  const submissionsTrend = useMemo(() => {
    return last14Days.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd")
      const count = submissions.filter((s) => {
        const subDay = format(parseISO(s.submitted_at), "yyyy-MM-dd")
        return subDay === dayStr
      }).length
      return {
        date: format(day, "MM/dd"),
        测评数: count,
      }
    })
  }, [submissions, last14Days])

  const difficultyDistribution = useMemo(() => {
    const groups: Record<string, number> = { easy: 0, medium: 0, hard: 0 }
    questions.forEach((q) => {
      groups[q.difficulty] = (groups[q.difficulty] ?? 0) + 1
    })
    return [
      { name: "简单", value: groups.easy, color: "#10B981" },
      { name: "中等", value: groups.medium, color: "#F59E0B" },
      { name: "困难", value: groups.hard, color: "#EF4444" },
    ].filter((d) => d.value > 0)
  }, [questions])

  const categoryDistribution = useMemo(() => {
    const groups: Record<string, number> = {}
    questions.forEach((q) => {
      groups[q.category] = (groups[q.category] ?? 0) + 1
    })
    return Object.entries(groups).map(([name, value]) => ({ name, value }))
  }, [questions])

  const interviewerStats = useMemo(() => {
    return interviewers.slice(0, 6).map((iv) => {
      const ivInterviews = interviews.filter((i) => i.interviewer_id === iv.id && i.status === "completed")
      const ivScores = ivInterviews
        .filter((i) => i.scores && i.scores.length > 0)
        .flatMap((i) => i.scores!.map((s) => s.score / s.max_score))
      const avg = ivScores.length > 0
        ? Math.round((ivScores.reduce((a, b) => a + b, 0) / ivScores.length) * 100)
        : 0
      const passCount = ivInterviews.filter((i) => i.result === "pass").length
      const pass = ivInterviews.length > 0 ? Math.round((passCount / ivInterviews.length) * 100) : 0
      return {
        name: iv.name.slice(0, 4),
        评分: avg,
        通过率: pass,
        面试数: ivInterviews.length,
      }
    }).filter((s) => s.面试数 > 0)
  }, [interviewers, interviews])

  const radarData = useMemo(() => {
    const byCategory: Record<string, { total: number; count: number }> = {}
    completedInterviews.forEach((iv) => {
      iv.scores?.forEach((s) => {
        const key = s.dimension
        if (!byCategory[key]) byCategory[key] = { total: 0, count: 0 }
        byCategory[key].total += s.score / s.max_score
        byCategory[key].count += 1
      })
    })
    const entries = Object.entries(byCategory).slice(0, 6)
    if (entries.length === 0) {
      return [
        { dimension: "基础知识", 平均: 85 },
        { dimension: "编码能力", 平均: 78 },
        { dimension: "综合表达", 平均: 82 },
        { dimension: "系统设计", 平均: 70 },
        { dimension: "算法能力", 平均: 72 },
      ]
    }
    return entries.map(([dim, data]) => ({
      dimension: dim,
      平均: Math.round((data.total / Math.max(data.count, 1)) * 100),
    }))
  }, [completedInterviews])

  const latestAlerts = alerts
    .filter((a) => !a.is_resolved)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4)

  const urgencyBadgeVariant: Record<string, "default" | "warning" | "destructive" | "info" | "secondary"> = {
    critical: "destructive",
    high: "warning",
    medium: "info",
    low: "secondary",
  }

  const urgencyLabel: Record<string, string> = {
    critical: "紧急",
    high: "高",
    medium: "中",
    low: "低",
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">面试质量看板</h1>
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="模块已禁用"
          description="质量看板模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">面试质量看板</h1>
          <p className="text-sm text-slate-500 mt-1">团队整体面试质量数据统计与分析</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push("/admin/dashboard/alerts")}>
            <AlertTriangle className="h-4 w-4 mr-2" />
            预警中心
            {unresolvedAlerts > 0 && (
              <Badge variant="destructive" className="ml-2">{unresolvedAlerts}</Badge>
            )}
          </Button>
          <Button onClick={() => router.push("/admin/dashboard/export")}>
            <Download className="h-4 w-4 mr-2" />
            导出报表
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={<BarChart3 className="h-6 w-6" />}
          label="面试总数"
          value={totalInterviews}
          trend="up"
          trendValue={`${pendingInterviews}场待进行`}
        />
        <StatCard
          icon={<ClipboardCheck className="h-6 w-6" />}
          label="已完成面试"
          value={completedInterviews.length}
          trend={completedInterviews.length >= 3 ? "up" : "down"}
        />
        <StatCard
          icon={<Target className="h-6 w-6" />}
          label="通过率"
          value={`${passRate}%`}
          trend={passRate >= 50 ? "up" : "down"}
        />
        <StatCard
          icon={<Star className="h-6 w-6" />}
          label="平均评分"
          value={`${avgScore}分`}
          trend={avgScore >= 75 ? "up" : "down"}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="录用率"
          value={`${hireRate}%`}
          trend={hireRate >= 30 ? "up" : "down"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">面试趋势（近14天）</CardTitle>
              <Badge variant="secondary">按天统计</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interviewTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="安排数" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="完成数" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">测评提交趋势（近14天）</CardTitle>
              <Badge variant="info">按天统计</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={submissionsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <YAxis tick={{ fontSize: 11 }} stroke="#94A3B8" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E2E8F0",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="测评数"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "#10B981" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">题库难度分布</CardTitle>
              <Layers className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {difficultyDistribution.length === 0 ? (
              <EmptyState icon={<Layers className="h-8 w-8" />} title="暂无数据" description="" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {difficultyDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip fontSize="12px" />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">各维度评分（雷达图）</CardTitle>
              <Target className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Radar
                  name="平均分"
                  dataKey="平均"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip fontSize="12px" />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">面试官表现对比</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent className="h-72">
            {interviewerStats.length === 0 ? (
              <EmptyState icon={<Users className="h-8 w-8" />} title="暂无数据" description="完成面试后将展示面试官对比" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={interviewerStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="#94A3B8" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#94A3B8" width={40} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #E2E8F0",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="评分" fill="#10B981" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="通过率" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">最新预警</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/dashboard/alerts")}
              >
                查看全部
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-72 overflow-y-auto">
            {latestAlerts.length === 0 ? (
              <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="暂无预警" description="一切运行正常" />
            ) : (
              <div className="space-y-3">
                {latestAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={urgencyBadgeVariant[alert.urgency_level] ?? "secondary"} className="text-[10px]">
                            {urgencyLabel[alert.urgency_level] ?? alert.urgency_level}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            {format(parseISO(alert.created_at), "MM/dd HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{alert.title}</p>
                        {alert.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{alert.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {categoryDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">题库分类统计</CardTitle>
              <FileText className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categoryDistribution.map((cat, idx) => {
                const max = Math.max(...categoryDistribution.map((c) => c.value), 1)
                const pct = Math.round((cat.value / max) * 100)
                return (
                  <div key={cat.name} className="p-4 rounded-xl bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                      <span className="text-2xl font-bold" style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }}>
                        {cat.value}
                      </span>
                    </div>
                    <div className="h-2 bg-white rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">题目数量</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
