"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { Interview, InterviewResult, InterviewScore } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Calendar,
  List,
  Plus,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Clock,
  User,
  Star,
} from "lucide-react"
import {
  startOfWeek,
  addDays,
  format,
  parseISO,
  isSameDay,
  addWeeks,
  subWeeks,
  isWithinInterval,
  parse,
} from "date-fns"

const statusConfig: Record<string, { label: string; variant: "info" | "warning" | "default" | "destructive"; bg: string }> = {
  scheduled: { label: "已安排", variant: "info", bg: "bg-blue-100 border-blue-300 text-blue-800" },
  in_progress: { label: "进行中", variant: "warning", bg: "bg-amber-100 border-amber-300 text-amber-800" },
  completed: { label: "已完成", variant: "default", bg: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  cancelled: { label: "已取消", variant: "destructive", bg: "bg-red-100 border-red-300 text-red-800" },
}

const resultConfig: Record<string, { label: string; variant: "default" | "destructive" | "warning" }> = {
  pass: { label: "通过", variant: "default" },
  fail: { label: "未通过", variant: "destructive" },
  pending: { label: "待定", variant: "warning" },
}

const timeSlots = Array.from({ length: 9 }, (_, i) => i + 9)

export default function InterviewsPage() {
  const { interviews, interviewers, systemConfigs, scoringStandards, addInterview, updateInterview } = useAppStore()

  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [showNewModal, setShowNewModal] = useState(false)
  const [scoringInterview, setScoringInterview] = useState<Interview | null>(null)

  const [newForm, setNewForm] = useState({
    candidate_name: "",
    candidate_email: "",
    interviewer_id: "",
    date: "",
    start_time: "",
    duration_minutes: "60",
    notes: "",
  })

  const [scoreForm, setScoreForm] = useState<{
    scores: { dimension: string; score: number; max_score: number; comment: string }[]
    result: InterviewResult
  }>({ scores: [], result: "pending" })

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_interview_scheduling")?.value !== "false"

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  const getInterviewerName = (id: string) => interviewers.find((iv) => iv.id === id)?.name ?? "未知"

  const hasConflict = (interview: Interview) => {
    const start = parseISO(interview.scheduled_at)
    const end = new Date(start.getTime() + interview.duration_minutes * 60000)
    return interviews.some((other) => {
      if (other.id === interview.id || other.interviewer_id !== interview.interviewer_id || other.status === "cancelled") return false
      const oStart = parseISO(other.scheduled_at)
      const oEnd = new Date(oStart.getTime() + other.duration_minutes * 60000)
      return start < oEnd && end > oStart
    })
  }

  const getInterviewsForSlot = (day: Date, hour: number) =>
    interviews.filter((iv) => {
      if (iv.status === "cancelled") return false
      const start = parseISO(iv.scheduled_at)
      return isSameDay(start, day) && start.getHours() === hour
    })

  const openScoring = (interview: Interview) => {
    const standard = scoringStandards[0]
    const dims = standard?.dimensions ?? []
    const existing = interview.scores ?? []
    setScoreForm({
      scores: dims.map((d) => {
        const ex = existing.find((s) => s.dimension === d.name)
        return {
          dimension: d.name,
          score: ex?.score ?? 0,
          max_score: d.levels[0]?.max_score ?? 100,
          comment: ex?.comment ?? "",
        }
      }),
      result: interview.result ?? "pending",
    })
    setScoringInterview(interview)
  }

  const handleNewSave = () => {
    if (!newForm.candidate_name || !newForm.interviewer_id || !newForm.date || !newForm.start_time) return
    const scheduled_at = `${newForm.date}T${newForm.start_time}:00Z`
    addInterview({
      id: `it-${Date.now()}`,
      candidate_name: newForm.candidate_name,
      candidate_email: newForm.candidate_email,
      interviewer_id: newForm.interviewer_id,
      scheduled_at,
      duration_minutes: parseInt(newForm.duration_minutes),
      status: "scheduled",
      notes: newForm.notes || undefined,
      created_at: new Date().toISOString(),
    })
    setShowNewModal(false)
    setNewForm({ candidate_name: "", candidate_email: "", interviewer_id: "", date: "", start_time: "", duration_minutes: "60", notes: "" })
  }

  const handleScoreSave = () => {
    if (!scoringInterview) return
    const scores: InterviewScore[] = scoreForm.scores.map((s, i) => ({
      id: `is-${Date.now()}-${i}`,
      interview_id: scoringInterview.id,
      dimension: s.dimension,
      score: s.score,
      max_score: s.max_score,
      comment: s.comment || undefined,
    }))
    updateInterview(scoringInterview.id, { scores, result: scoreForm.result })
    setScoringInterview(null)
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">面试安排</h1>
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="模块已禁用"
          description="面试安排模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">面试安排</h1>
        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            <button
              onClick={() => setView("calendar")}
              className={cn("px-3 py-2 text-sm", view === "calendar" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
            >
              <Calendar className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("px-3 py-2 text-sm", view === "list" ? "bg-emerald-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50")}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button onClick={() => setShowNewModal(true)}>
            <Plus className="h-4 w-4" />
            新建面试
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium text-slate-700">
              {format(weekDays[0], "yyyy年M月d日")} — {format(weekDays[6], "M月d日")}
            </span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr>
                  <th className="w-16 border-b border-r border-slate-200 px-2 py-2 text-xs font-medium text-slate-500">
                    时间
                  </th>
                  {weekDays.map((day) => (
                    <th
                      key={day.toISOString()}
                      className={cn(
                        "border-b border-slate-200 px-2 py-2 text-xs font-medium",
                        isSameDay(day, new Date()) ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
                      )}
                    >
                      {format(day, "EEE M/d")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((hour) => (
                  <tr key={hour}>
                    <td className="border-b border-r border-slate-200 px-2 py-1 text-xs text-slate-400">
                      {hour}:00
                    </td>
                    {weekDays.map((day) => {
                      const slotInterviews = getInterviewsForSlot(day, hour)
                      return (
                        <td
                          key={day.toISOString() + hour}
                          className="border-b border-slate-200 p-1 align-top"
                        >
                          {slotInterviews.map((iv) => {
                            const cfg = statusConfig[iv.status]
                            const conflict = hasConflict(iv)
                            return (
                              <div
                                key={iv.id}
                                onClick={() => iv.status === "completed" && openScoring(iv)}
                                className={cn(
                                  "rounded px-1.5 py-1 text-xs border cursor-pointer mb-1",
                                  cfg.bg,
                                  iv.status === "cancelled" && "line-through opacity-60"
                                )}
                              >
                                <div className="font-medium truncate">{iv.candidate_name}</div>
                                <div className="truncate opacity-75">{getInterviewerName(iv.interviewer_id)}</div>
                                {conflict && <AlertTriangle className="h-3 w-3 text-red-500 mt-0.5" />}
                              </div>
                            )
                          })}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">候选人</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">面试官</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">时间</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">时长</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">状态</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">结果</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((iv) => {
                  const conflict = hasConflict(iv)
                  return (
                    <tr key={iv.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{iv.candidate_name}</td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="flex items-center gap-1">
                          {getInterviewerName(iv.interviewer_id)}
                          {conflict && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{format(parseISO(iv.scheduled_at), "yyyy-MM-dd HH:mm")}</td>
                      <td className="px-4 py-3 text-slate-600">{iv.duration_minutes}分钟</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[iv.status]?.variant ?? "secondary"}>
                          {statusConfig[iv.status]?.label ?? iv.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {iv.result ? (
                          <Badge variant={resultConfig[iv.result]?.variant ?? "secondary"}>
                            {resultConfig[iv.result]?.label ?? iv.result}
                          </Badge>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {iv.status === "completed" && (
                          <Button variant="ghost" size="sm" onClick={() => openScoring(iv)}>
                            <Star className="h-3.5 w-3.5" />
                            评分
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {interviews.length === 0 && (
              <EmptyState icon={<Calendar className="h-8 w-8" />} title="暂无面试" description="点击新建面试按钮创建面试安排" />
            )}
          </div>
        </Card>
      )}

      <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="新建面试">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">候选人姓名 *</label>
            <Input value={newForm.candidate_name} onChange={(e) => setNewForm((f) => ({ ...f, candidate_name: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">候选人邮箱</label>
            <Input type="email" value={newForm.candidate_email} onChange={(e) => setNewForm((f) => ({ ...f, candidate_email: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">面试官 *</label>
            <Select value={newForm.interviewer_id} onChange={(e) => setNewForm((f) => ({ ...f, interviewer_id: e.target.value }))}>
              <option value="">请选择面试官</option>
              {interviewers.map((iv) => (
                <option key={iv.id} value={iv.id}>{iv.name} - {iv.department}</option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">日期 *</label>
              <Input type="date" value={newForm.date} onChange={(e) => setNewForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">开始时间 *</label>
              <Input type="time" value={newForm.start_time} onChange={(e) => setNewForm((f) => ({ ...f, start_time: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">时长（分钟）</label>
            <Select value={newForm.duration_minutes} onChange={(e) => setNewForm((f) => ({ ...f, duration_minutes: e.target.value }))}>
              <option value="30">30分钟</option>
              <option value="60">60分钟</option>
              <option value="90">90分钟</option>
              <option value="120">120分钟</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
            <Textarea value={newForm.notes} onChange={(e) => setNewForm((f) => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowNewModal(false)}>取消</Button>
            <Button onClick={handleNewSave}>保存</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!scoringInterview} onClose={() => setScoringInterview(null)} title="面试评分" className="max-w-2xl">
        {scoringInterview && (
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                <span className="font-medium">{scoringInterview.candidate_name}</span> · {format(parseISO(scoringInterview.scheduled_at), "yyyy-MM-dd HH:mm")} · {getInterviewerName(scoringInterview.interviewer_id)}
              </p>
            </div>
            {scoreForm.scores.map((s, idx) => (
              <div key={s.dimension} className="rounded-lg border border-slate-200 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">{s.dimension}</span>
                  <span className="text-xs text-slate-400">满分 {s.max_score}</span>
                </div>
                <Input
                  type="number"
                  min={0}
                  max={s.max_score}
                  value={s.score}
                  onChange={(e) => {
                    const val = Math.min(s.max_score, Math.max(0, parseInt(e.target.value) || 0))
                    setScoreForm((f) => {
                      const scores = [...f.scores]
                      scores[idx] = { ...scores[idx], score: val }
                      return { ...f, scores }
                    })
                  }}
                />
                <Textarea
                  placeholder="评语（可选）"
                  value={s.comment}
                  onChange={(e) => {
                    setScoreForm((f) => {
                      const scores = [...f.scores]
                      scores[idx] = { ...scores[idx], comment: e.target.value }
                      return { ...f, scores }
                    })
                  }}
                  rows={2}
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">面试结果</label>
              <Select value={scoreForm.result} onChange={(e) => setScoreForm((f) => ({ ...f, result: e.target.value as InterviewResult }))}>
                <option value="pass">通过</option>
                <option value="fail">未通过</option>
                <option value="pending">待定</option>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setScoringInterview(null)}>取消</Button>
              <Button onClick={handleScoreSave}>保存评分</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
