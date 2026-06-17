"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { HiringDecision } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { StatCard } from "@/components/ui/stat-card"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Trophy,
  Users,
  TrendingUp,
  Plus,
  Pencil,
  ClipboardCheck,
} from "lucide-react"
import { format, parseISO } from "date-fns"

const decisionConfig: Record<HiringDecision, { label: string; variant: "default" | "destructive" | "warning" }> = {
  hired: { label: "已录用", variant: "default" },
  rejected: { label: "已拒绝", variant: "destructive" },
  pending: { label: "待定", variant: "warning" },
}

export default function ResultsPage() {
  const { hiringResults, interviews, interviewers, systemConfigs, addHiringResult, updateHiringResult } = useAppStore()

  const [filterDecision, setFilterDecision] = useState("")
  const [filterDepartment, setFilterDepartment] = useState("")
  const [filterPosition, setFilterPosition] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingResult, setEditingResult] = useState<string | null>(null)

  const [form, setForm] = useState({
    interview_id: "",
    decision: "pending" as HiringDecision,
    position: "",
    department: "",
    notes: "",
  })

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_hiring_results")?.value !== "false"

  const completedInterviews = interviews.filter((iv) => iv.status === "completed")

  const getInterviewerName = (interviewId: string) => {
    const interview = interviews.find((iv) => iv.id === interviewId)
    if (!interview) return "未知"
    return interviewers.find((iv) => iv.id === interview.interviewer_id)?.name ?? "未知"
  }

  const getCandidateName = (interviewId: string) =>
    interviews.find((iv) => iv.id === interviewId)?.candidate_name ?? "未知"

  const filtered = useMemo(() => {
    return hiringResults.filter((r) => {
      if (filterDecision && r.decision !== filterDecision) return false
      if (filterDepartment && !r.department.includes(filterDepartment)) return false
      if (filterPosition && !r.position.includes(filterPosition)) return false
      return true
    })
  }, [hiringResults, filterDecision, filterDepartment, filterPosition])

  const totalInterviewed = hiringResults.length
  const hiredCount = hiringResults.filter((r) => r.decision === "hired").length
  const hireRate = totalInterviewed > 0 ? Math.round((hiredCount / totalInterviewed) * 100) : 0

  const departmentStats = useMemo(() => {
    const map: Record<string, { total: number; hired: number }> = {}
    hiringResults.forEach((r) => {
      if (!map[r.department]) map[r.department] = { total: 0, hired: 0 }
      map[r.department].total++
      if (r.decision === "hired") map[r.department].hired++
    })
    return Object.entries(map).map(([dept, stats]) => ({
      department: dept,
      total: stats.total,
      hired: stats.hired,
      rate: stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0,
    }))
  }, [hiringResults])

  const maxDeptTotal = Math.max(...departmentStats.map((d) => d.total), 1)

  const openAddModal = () => {
    setEditingResult(null)
    setForm({ interview_id: "", decision: "pending", position: "", department: "", notes: "" })
    setShowAddModal(true)
  }

  const openEditModal = (id: string) => {
    const result = hiringResults.find((r) => r.id === id)
    if (!result) return
    setEditingResult(id)
    setForm({
      interview_id: result.interview_id,
      decision: result.decision,
      position: result.position,
      department: result.department,
      notes: result.notes ?? "",
    })
    setShowAddModal(true)
  }

  const handleSave = () => {
    if (!form.interview_id || !form.position || !form.department) return
    if (editingResult) {
      updateHiringResult(editingResult, {
        interview_id: form.interview_id,
        decision: form.decision,
        position: form.position,
        department: form.department,
        notes: form.notes || undefined,
      })
    } else {
      addHiringResult({
        id: `hr-${Date.now()}`,
        interview_id: form.interview_id,
        decision: form.decision,
        position: form.position,
        department: form.department,
        notes: form.notes || undefined,
        decided_at: new Date().toISOString(),
      })
    }
    setShowAddModal(false)
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">录用结果</h1>
        <EmptyState
          icon={<ClipboardCheck className="h-8 w-8" />}
          title="模块已禁用"
          description="录用结果模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">录用结果</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4" />
          添加结果
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="面试总人数"
          value={totalInterviewed}
        />
        <StatCard
          icon={<Trophy className="h-6 w-6" />}
          label="录用人数"
          value={hiredCount}
          trend="up"
          trendValue={`${hiredCount}人`}
        />
        <StatCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="录用率"
          value={`${hireRate}%`}
          trend={hireRate >= 50 ? "up" : "down"}
          trendValue={hireRate >= 50 ? "高于50%" : "低于50%"}
        />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">决策</label>
            <Select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value)}
              className="w-40"
            >
              <option value="">全部</option>
              <option value="hired">已录用</option>
              <option value="rejected">已拒绝</option>
              <option value="pending">待定</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">部门</label>
            <Input
              placeholder="搜索部门"
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-40"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">岗位</label>
            <Input
              placeholder="搜索岗位"
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
              className="w-40"
            />
          </div>
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left font-medium text-slate-500">候选人</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">面试官</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">岗位</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">部门</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">决策</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">决策时间</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">备注</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{getCandidateName(r.interview_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{getInterviewerName(r.interview_id)}</td>
                  <td className="px-4 py-3 text-slate-600">{r.position}</td>
                  <td className="px-4 py-3 text-slate-600">{r.department}</td>
                  <td className="px-4 py-3">
                    <Badge variant={decisionConfig[r.decision]?.variant ?? "secondary"}>
                      {decisionConfig[r.decision]?.label ?? r.decision}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{format(parseISO(r.decided_at), "yyyy-MM-dd HH:mm")}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{r.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => openEditModal(r.id)}>
                      <Pencil className="h-3.5 w-3.5" />
                      编辑
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <EmptyState
              icon={<ClipboardCheck className="h-8 w-8" />}
              title="暂无录用结果"
              description="点击添加结果按钮录入录用决策"
            />
          )}
        </div>
      </Card>

      {departmentStats.length > 0 && (
        <Card className="p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">各部门录用率</h3>
          <div className="space-y-3">
            {departmentStats.map((d) => (
              <div key={d.department} className="flex items-center gap-4">
                <span className="w-28 text-sm text-slate-600 truncate">{d.department}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-700 w-12 text-right">{d.rate}%</span>
                </div>
                <span className="text-xs text-slate-400 w-20 text-right">
                  {d.hired}/{d.total}人
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={editingResult ? "编辑录用结果" : "添加录用结果"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">面试 *</label>
            <Select
              value={form.interview_id}
              onChange={(e) => setForm((f) => ({ ...f, interview_id: e.target.value }))}
              disabled={!!editingResult}
            >
              <option value="">请选择已完成面试</option>
              {completedInterviews.map((iv) => (
                <option key={iv.id} value={iv.id}>
                  {iv.candidate_name} — {format(parseISO(iv.scheduled_at), "yyyy-MM-dd HH:mm")}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">决策 *</label>
            <Select
              value={form.decision}
              onChange={(e) => setForm((f) => ({ ...f, decision: e.target.value as HiringDecision }))}
            >
              <option value="hired">已录用</option>
              <option value="rejected">已拒绝</option>
              <option value="pending">待定</option>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">岗位 *</label>
            <Input
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
              placeholder="输入岗位名称"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">部门 *</label>
            <Input
              value={form.department}
              onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
              placeholder="输入部门名称"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">备注</label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>取消</Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
