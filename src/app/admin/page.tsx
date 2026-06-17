"use client"

import { useMemo } from "react"
import { format, parseISO, isToday, isThisWeek } from "date-fns"
import { Calendar, ClipboardCheck, AlertTriangle, BarChart3, Clock, User } from "lucide-react"
import { useAppStore } from "@/store/app-store"
import { StatCard } from "@/components/ui/stat-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const statusBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "warning" | "info"> = {
  scheduled: "info",
  in_progress: "warning",
  completed: "default",
  cancelled: "secondary",
}

const statusLabel: Record<string, string> = {
  scheduled: "已排期",
  in_progress: "进行中",
  completed: "已完成",
  cancelled: "已取消",
}

const urgencyColor: Record<string, string> = {
  critical: "border-l-red-500 bg-red-50/50",
  high: "border-l-amber-500 bg-amber-50/50",
  medium: "border-l-blue-500 bg-blue-50/50",
  low: "border-l-slate-300 bg-slate-50/50",
}

const urgencyBadgeVariant: Record<string, "default" | "secondary" | "destructive" | "warning" | "info"> = {
  critical: "destructive",
  high: "warning",
  medium: "info",
  low: "secondary",
}

export default function AdminPage() {
  const interviews = useAppStore((s) => s.interviews)
  const alerts = useAppStore((s) => s.alerts)
  const submissions = useAppStore((s) => s.submissions)
  const interviewers = useAppStore((s) => s.interviewers)

  const todayInterviews = useMemo(
    () =>
      interviews.filter((i) => {
        try {
          return isToday(parseISO(i.scheduled_at))
        } catch {
          return false
        }
      }),
    [interviews]
  )

  const pendingScoreCount = useMemo(
    () =>
      interviews.filter((i) => i.status === "completed" && (!i.scores || i.scores.length === 0)).length,
    [interviews]
  )

  const unresolvedAlerts = useMemo(() => alerts.filter((a) => !a.is_resolved), [alerts])

  const weekSubmissions = useMemo(
    () =>
      submissions.filter((s) => {
        try {
          return isThisWeek(parseISO(s.submitted_at), { weekStartsOn: 1 })
        } catch {
          return false
        }
      }),
    [submissions]
  )

  const recentInterviews = useMemo(
    () =>
      [...interviews]
        .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
        .slice(0, 5),
    [interviews]
  )

  const latestAlerts = useMemo(
    () =>
      [...unresolvedAlerts]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3),
    [unresolvedAlerts]
  )

  const getInterviewerName = (interviewerId: string) => {
    const interviewer = interviewers.find((i) => i.id === interviewerId)
    return interviewer?.name ?? interviewerId
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="今日面试"
          value={todayInterviews.length}
        />
        <StatCard
          icon={<ClipboardCheck className="h-6 w-6" />}
          label="待评分"
          value={pendingScoreCount}
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6" />}
          label="预警数"
          value={unresolvedAlerts.length}
        />
        <StatCard
          icon={<BarChart3 className="h-6 w-6" />}
          label="本周测评"
          value={weekSubmissions.length}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>最近面试</CardTitle>
            </CardHeader>
            <CardContent>
              {recentInterviews.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">暂无面试记录</p>
              ) : (
                <div className="space-y-3">
                  {recentInterviews.map((interview) => (
                    <div
                      key={interview.id}
                      className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {interview.candidate_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            面试官: {getInterviewerName(interview.interviewer_id)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(parseISO(interview.scheduled_at), "MM/dd HH:mm")}
                          </span>
                        </div>
                        <Badge variant={statusBadgeVariant[interview.status]}>
                          {statusLabel[interview.status] ?? interview.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>最新预警</CardTitle>
            </CardHeader>
            <CardContent>
              {latestAlerts.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">暂无预警</p>
              ) : (
                <div className="space-y-3">
                  {latestAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`rounded-lg border-l-4 px-4 py-3 ${urgencyColor[alert.urgency_level] ?? ""}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={urgencyBadgeVariant[alert.urgency_level]}>
                          {alert.urgency_level}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium text-slate-900">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {format(parseISO(alert.created_at), "MM/dd HH:mm")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
