"use client"

import { useState, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import {
  CalendarDays,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MapPin,
  Mail,
  ArrowRight,
  Home,
  Building2,
} from "lucide-react"
import {
  startOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  format,
  parseISO,
  isSameDay,
  isBefore,
  isToday,
  isAfter,
} from "date-fns"

export default function BookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const submissionId = searchParams.get("sub")

  const { interviewers, instructorAvailability, interviews, submissions, addInterview } = useAppStore()

  const submission = useMemo(() => {
    if (submissionId) return submissions.find((s) => s.id === submissionId)
    return submissions[submissions.length - 1]
  }, [submissions, submissionId])

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [selectedInstructor, setSelectedInstructor] = useState<string>("")
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const [form, setForm] = useState({
    name: submission?.candidate_name ?? "",
    email: submission?.candidate_email ?? "",
    phone: "",
    notes: "",
  })

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)),
    [currentWeekStart]
  )

  const availableInstructors = useMemo(() => {
    return interviewers.filter((iv) => {
      if (!selectedDate) return instructorAvailability.some((a) => a.interviewer_id === iv.id)
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      const avails = instructorAvailability.filter(
        (a) => a.interviewer_id === iv.id && a.date === dateStr && a.status === "available"
      )
      return avails.length > 0
    })
  }, [interviewers, instructorAvailability, selectedDate])

  const displayInterviewers = selectedInstructor
    ? interviewers.filter((i) => i.id === selectedInstructor)
    : availableInstructors.length > 0
    ? availableInstructors
    : interviewers

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedInstructor) return []
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const avails = instructorAvailability.filter(
      (a) => a.interviewer_id === selectedInstructor && a.date === dateStr && a.status === "available"
    )
    const slots: string[] = []
    avails.forEach((a) => {
      let [startH] = a.start_time.split(":").map(Number)
      const [endH] = a.end_time.split(":").map(Number)
      while (startH < endH) {
        const slot = `${startH.toString().padStart(2, "0")}:00`
        slots.push(slot)
        startH += 1
      }
    })
    const bookedSlots = interviews
      .filter((i) => {
        if (i.status === "cancelled") return false
        if (i.interviewer_id !== selectedInstructor) return false
        return isSameDay(parseISO(i.scheduled_at), selectedDate)
      })
      .map((i) => format(parseISO(i.scheduled_at), "HH:00"))
    return slots.filter((s) => !bookedSlots.includes(s) && !(isToday(selectedDate) && Number(s.split(":")[0]) <= new Date().getHours()))
  }, [selectedDate, selectedInstructor, instructorAvailability, interviews])

  const canSelectDate = (day: Date) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysLater = addDays(today, 30)
    return !isBefore(day, today) && !isAfter(day, thirtyDaysLater)
  }

  const handleConfirm = () => {
    if (!form.name.trim() || !form.email.trim() || !selectedDate || !selectedTime || !selectedInstructor) return
    const isoDate = `${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00Z`
    addInterview({
      id: `it-${Date.now()}`,
      candidate_name: form.name,
      candidate_email: form.email,
      submission_id: submission?.id,
      interviewer_id: selectedInstructor,
      scheduled_at: isoDate,
      duration_minutes: 60,
      status: "scheduled",
      notes: form.notes || undefined,
      created_at: new Date().toISOString(),
    })
    setShowConfirm(false)
    setShowSuccess(true)
  }

  const selectedInterviewer = interviewers.find((i) => i.id === selectedInstructor)

  return (
    <div className="min-h-screen bg-slate-50 py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 font-serif">预约技术面试</h1>
          <p className="text-slate-500">请选择合适的面试官和时段</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <CalendarDays className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">选择日期</h2>
                  <p className="text-sm text-slate-500">可预约未来30天内的工作日</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
                  disabled={isAfter(new Date(), addDays(subWeeks(currentWeekStart, 1), 6))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium text-slate-700">
                  {format(weekDays[0], "yyyy年M月d日")} — {format(weekDays[6], "M月d日")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {["一", "二", "三", "四", "五", "六", "日"].map((w) => (
                  <div key={w} className="text-center text-xs font-medium text-slate-400 py-2">
                    {w}
                  </div>
                ))}
                {weekDays.map((day) => {
                  const selectable = canSelectDate(day)
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const today = isToday(day)
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => selectable && setSelectedDate(day)}
                      disabled={!selectable}
                      className={cn(
                        "aspect-square rounded-xl text-sm font-medium transition-all flex flex-col items-center justify-center",
                        !selectable && "opacity-40 cursor-not-allowed",
                        selectable && !isSelected && !today && "bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50",
                        selectable && !isSelected && today && "bg-amber-50 border border-amber-300 hover:bg-amber-100",
                        isSelected && "bg-emerald-500 text-white border-2 border-emerald-600 shadow-lg shadow-emerald-200"
                      )}
                    >
                      <span className="text-lg">{format(day, "d")}</span>
                      {today && (
                        <span className={cn("text-[10px] mt-0.5", isSelected ? "text-emerald-100" : "text-amber-600")}>
                          今天
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">选择面试官</h2>
                  <p className="text-sm text-slate-500">
                    {selectedDate
                      ? `${format(selectedDate, "M月d日")} 有 ${availableInstructors.length} 位面试官可预约`
                      : "请先选择日期"}
                  </p>
                </div>
              </div>

              {displayInterviewers.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">该日期暂无可用面试官</div>
              ) : (
                <div className="space-y-3">
                  {displayInterviewers.map((iv) => {
                    const isSelected = selectedInstructor === iv.id
                    const isAvailable = availableInstructors.some((a) => a.id === iv.id) || !selectedDate
                    return (
                      <button
                        key={iv.id}
                        onClick={() => isAvailable && setSelectedInstructor(iv.id)}
                        disabled={!isAvailable}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all",
                          !isAvailable && "opacity-50 cursor-not-allowed",
                          isAvailable && !isSelected && "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50",
                          isSelected && "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200"
                        )}
                      >
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0">
                          <span className="text-lg font-semibold text-slate-700">
                            {iv.name.charAt(0)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{iv.name}</p>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-sm text-slate-500">{iv.department ?? "技术部"}</span>
                          </div>
                        </div>
                        {!isAvailable && selectedDate && (
                          <Badge variant="secondary" className="shrink-0">已满</Badge>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">选择时段</h2>
                  <p className="text-sm text-slate-500">
                    {selectedDate && selectedInterviewer
                      ? `${selectedInterviewer.name} · ${format(selectedDate, "M月d日")} · ${availableSlots.length}个可预约时段`
                      : "请先选择日期和面试官"}
                  </p>
                </div>
              </div>

              {!selectedDate || !selectedInstructor ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  请先选择日期和面试官
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  该日期所有时段已预约完毕，请选择其他日期
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availableSlots.map((slot) => {
                    const isSelected = selectedTime === slot
                    return (
                      <button
                        key={slot}
                        onClick={() => setSelectedTime(slot)}
                        className={cn(
                          "py-3 rounded-xl text-sm font-medium transition-all border-2",
                          !isSelected && "bg-white border-slate-200 text-slate-700 hover:border-emerald-300 hover:bg-emerald-50",
                          isSelected && "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                        )}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-6">预约信息</h2>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">姓名 *</label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="请输入您的姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">邮箱 *</label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">手机号</label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="选填，用于接收面试提醒"
                  />
                </div>
              </div>

              <div className="space-y-3 p-4 bg-slate-50 rounded-xl mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">面试官</span>
                  <span className="font-medium text-slate-700">
                    {selectedInterviewer?.name ?? "未选择"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">日期</span>
                  <span className="font-medium text-slate-700">
                    {selectedDate ? format(selectedDate, "yyyy年M月d日") : "未选择"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">时间</span>
                  <span className="font-medium text-slate-700">{selectedTime ?? "未选择"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">时长</span>
                  <span className="font-medium text-slate-700">60 分钟</span>
                </div>
              </div>

              <Button
                className="w-full h-12"
                onClick={() => setShowConfirm(true)}
                disabled={
                  !form.name.trim() ||
                  !form.email.trim() ||
                  !selectedDate ||
                  !selectedTime ||
                  !selectedInstructor
                }
              >
                确认预约
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>

              <Button
                variant="outline"
                className="w-full mt-3"
                onClick={() => router.push("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                返回首页
              </Button>
            </Card>
          </div>
        </div>

        <Modal open={showConfirm} onClose={() => setShowConfirm(false)} title="确认预约信息">
          <div className="space-y-5">
            <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">姓名</span>
                <span className="font-medium text-slate-900">{form.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />邮箱
                </span>
                <span className="font-medium text-slate-900">{form.email}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 mt-3">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">面试官</span>
                  <span className="font-medium text-slate-900">{selectedInterviewer?.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">部门</span>
                  <span className="font-medium text-slate-900">{selectedInterviewer?.department}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />日期
                  </span>
                  <span className="font-medium text-slate-900">
                    {selectedDate && format(selectedDate, "yyyy年M月d日 EEEE")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />时间
                  </span>
                  <span className="font-medium text-slate-900">{selectedTime} — {selectedTime && `${parseInt(selectedTime) + 1}:00`}</span>
                </div>
              </div>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              <span>面试方式：视频会议（预约成功后将通过邮件发送会议链接）</span>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>返回修改</Button>
              <Button onClick={handleConfirm}>确认预约</Button>
            </div>
          </div>
        </Modal>

        <Modal open={showSuccess} onClose={() => setShowSuccess(false)} className="max-w-md">
          <div className="text-center py-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 mb-6">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">预约成功！</h2>
            <p className="text-slate-500 mb-8">
              您的面试预约已确认，详细信息已发送至 <span className="font-medium text-slate-700">{form.email}</span>
            </p>
            <div className="p-4 bg-slate-50 rounded-xl text-sm space-y-2 mb-8 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">面试官</span>
                <span className="font-medium text-slate-900">{selectedInterviewer?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">日期</span>
                <span className="font-medium text-slate-900">
                  {selectedDate && format(selectedDate, "yyyy年M月d日")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">时间</span>
                <span className="font-medium text-slate-900">{selectedTime}</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button variant="outline" className="flex-1" onClick={() => router.push("/")}>
                回到首页
              </Button>
              <Button className="flex-1" onClick={() => setShowSuccess(false)}>
                查看详情
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  )
}
