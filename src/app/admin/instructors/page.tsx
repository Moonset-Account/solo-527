"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { AvailabilityStatus } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Modal } from "@/components/ui/modal"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Plane,
  CheckCircle2,
} from "lucide-react"
import {
  startOfWeek,
  addDays,
  format,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns"

const statusColors: Record<AvailabilityStatus, string> = {
  available: "bg-emerald-100 text-emerald-800 border-emerald-300",
  busy: "bg-amber-100 text-amber-800 border-amber-300",
  leave: "bg-red-100 text-red-800 border-red-300",
}

const statusLabels: Record<AvailabilityStatus, string> = {
  available: "可用",
  busy: "忙碌",
  leave: "请假",
}

const statusBadgeVariants: Record<AvailabilityStatus, "default" | "warning" | "destructive"> = {
  available: "default",
  busy: "warning",
  leave: "destructive",
}

export default function InstructorsPage() {
  const {
    interviewers,
    instructorAvailability,
    systemConfigs,
    addInstructorAvailability,
    updateInstructorAvailability,
  } = useAppStore()

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [filterInterviewer, setFilterInterviewer] = useState("")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ interviewerId: string; date: string } | null>(null)

  const [form, setForm] = useState({
    interviewer_id: "",
    date: "",
    start_time: "09:00",
    end_time: "18:00",
    status: "available" as AvailabilityStatus,
  })

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_instructor_availability")?.value !== "false"

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  const filteredInterviewers = useMemo(
    () => filterInterviewer ? interviewers.filter((iv) => iv.id === filterInterviewer) : interviewers,
    [interviewers, filterInterviewer]
  )

  const getAvailabilityForCell = (interviewerId: string, day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd")
    return instructorAvailability.filter((a) => a.interviewer_id === interviewerId && a.date === dateStr)
  }

  const getCellStatus = (interviewerId: string, day: Date): AvailabilityStatus | null => {
    const items = getAvailabilityForCell(interviewerId, day)
    if (items.length === 0) return null
    if (items.some((a) => a.status === "leave")) return "leave"
    if (items.some((a) => a.status === "busy")) return "busy"
    return "available"
  }

  const openNewModal = () => {
    setEditingId(null)
    setForm({ interviewer_id: "", date: "", start_time: "09:00", end_time: "18:00", status: "available" })
    setShowModal(true)
  }

  const openEditModal = (interviewerId: string, day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd")
    const items = getAvailabilityForCell(interviewerId, day)
    setSelectedRange({ interviewerId, date: dateStr })
    if (items.length > 0) {
      const first = items[0]
      setEditingId(first.id)
      setForm({
        interviewer_id: first.interviewer_id,
        date: first.date,
        start_time: first.start_time,
        end_time: first.end_time,
        status: first.status,
      })
    } else {
      setEditingId(null)
      setForm({
        interviewer_id: interviewerId,
        date: dateStr,
        start_time: "09:00",
        end_time: "18:00",
        status: "available",
      })
    }
    setShowModal(true)
  }

  const handleSave = () => {
    if (!form.interviewer_id || !form.date || !form.start_time || !form.end_time) return
    if (editingId) {
      updateInstructorAvailability(editingId, {
        interviewer_id: form.interviewer_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
      })
    } else {
      addInstructorAvailability({
        id: `ia-${Date.now()}`,
        interviewer_id: form.interviewer_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        status: form.status,
      })
    }
    setShowModal(false)
  }

  const handleQuickAction = (status: AvailabilityStatus) => {
    if (!selectedRange) return
    const { interviewerId, date } = selectedRange
    const items = getAvailabilityForCell(interviewerId, new Date(date + "T00:00:00"))
    if (items.length > 0) {
      items.forEach((item) => updateInstructorAvailability(item.id, { status }))
    } else {
      addInstructorAvailability({
        id: `ia-${Date.now()}`,
        interviewer_id: interviewerId,
        date,
        start_time: "09:00",
        end_time: "18:00",
        status,
      })
    }
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">讲师档期</h1>
        <EmptyState
          icon={<CalendarDays className="h-8 w-8" />}
          title="模块已禁用"
          description="讲师档期模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">讲师档期</h1>
        <Button onClick={openNewModal}>
          <Plus className="h-4 w-4" />
          添加档期
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-slate-700">面试官筛选</label>
        <Select
          value={filterInterviewer}
          onChange={(e) => setFilterInterviewer(e.target.value)}
          className="w-56"
        >
          <option value="">全部面试官</option>
          {interviewers.map((iv) => (
            <option key={iv.id} value={iv.id}>{iv.name}</option>
          ))}
        </Select>
      </div>

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
                <th className="w-32 border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-500">
                  面试官
                </th>
                {weekDays.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={cn(
                      "border-b border-slate-200 px-2 py-2 text-center text-xs font-medium",
                      isSameDay(day, new Date()) ? "bg-emerald-50 text-emerald-700" : "text-slate-500"
                    )}
                  >
                    {format(day, "EEE M/d")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInterviewers.map((iv) => (
                <tr key={iv.id}>
                  <td className="border-b border-r border-slate-200 px-3 py-2">
                    <div className="text-sm font-medium text-slate-900">{iv.name}</div>
                    <div className="text-xs text-slate-400">{iv.department}</div>
                  </td>
                  {weekDays.map((day) => {
                    const status = getCellStatus(iv.id, day)
                    return (
                      <td
                        key={day.toISOString()}
                        className="border-b border-slate-200 p-1"
                      >
                        <button
                          onClick={() => openEditModal(iv.id, day)}
                          className={cn(
                            "w-full rounded px-2 py-1.5 text-xs font-medium border transition-colors cursor-pointer",
                            status
                              ? statusColors[status]
                              : "bg-white text-slate-300 border-slate-200 hover:bg-slate-50"
                          )}
                        >
                          {status ? statusLabels[status] : "—"}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredInterviewers.length === 0 && (
          <EmptyState
            icon={<CalendarDays className="h-8 w-8" />}
            title="暂无面试官"
            description="请先在系统中添加面试官"
          />
        )}
      </Card>

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">图例：</span>
        <Badge variant="default">可用</Badge>
        <Badge variant="warning">忙碌</Badge>
        <Badge variant="destructive">请假</Badge>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "编辑档期" : "添加档期"}>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">面试官 *</label>
            <Select
              value={form.interviewer_id}
              onChange={(e) => setForm((f) => ({ ...f, interviewer_id: e.target.value }))}
              disabled={!!editingId}
            >
              <option value="">请选择面试官</option>
              {interviewers.map((iv) => (
                <option key={iv.id} value={iv.id}>{iv.name}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">日期 *</label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">开始时间</label>
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">结束时间</label>
              <Input
                type="time"
                value={form.end_time}
                onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">状态</label>
            <Select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as AvailabilityStatus }))}
            >
              <option value="available">可用</option>
              <option value="busy">忙碌</option>
              <option value="leave">请假</option>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Toggle
              checked={form.status === "leave"}
              onChange={(checked) => setForm((f) => ({ ...f, status: checked ? "leave" : "available" }))}
              label="请假"
            />
            <Toggle
              checked={form.status === "available"}
              onChange={(checked) => setForm((f) => ({ ...f, status: checked ? "available" : "busy" }))}
              label="可用"
            />
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
            <span className="text-xs text-slate-500">快捷操作：</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm((f) => ({ ...f, status: "leave" }))
                handleQuickAction("leave")
              }}
            >
              <Plane className="h-3.5 w-3.5" />
              标记请假
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setForm((f) => ({ ...f, status: "available" }))
                handleQuickAction("available")
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              设为可用
            </Button>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
