"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { ExportType } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Download,
  FileSpreadsheet,
  FileBarChart,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  ChevronRight,
  Calendar,
  Building2,
  Filter,
  ClipboardList,
  DownloadCloud,
  History,
  Clock,
  Eye,
  Trash2,
  X,
  CheckCircle2,
  RefreshCw,
} from "lucide-react"
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from "date-fns"
import * as XLSX from "xlsx"

const typeConfig: Record<ExportType, {
  label: string
  description: string
  icon: typeof FileSpreadsheet
  color: string
}> = {
  interview_summary: {
    label: "面试汇总报表",
    description: "按时间段汇总面试安排、完成情况和结果分布",
    icon: FileSpreadsheet,
    color: "emerald",
  },
  scoring_analysis: {
    label: "评分分析报表",
    description: "面试官评分分布、偏差分析、各维度评分对比",
    icon: Target,
    color: "blue",
  },
  hiring_result: {
    label: "招聘结果报表",
    description: "录用率统计、各部门招聘结果对比、岗位招聘进度",
    icon: Users,
    color: "purple",
  },
  quality_metrics: {
    label: "质量指标报表",
    description: "面试质量核心指标，包含通过率、平均评分、录用率等趋势",
    icon: TrendingUp,
    color: "amber",
  },
}

export default function ExportPage() {
  const {
    interviews,
    submissions,
    hiringResults,
    interviewers,
    questions,
    exportReports,
    systemConfigs,
    addExportReport,
    deleteExportReport,
  } = useAppStore()

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_quality_dashboard")?.value !== "false"

  const [selectedType, setSelectedType] = useState<ExportType>("interview_summary")
  const [showPreview, setShowPreview] = useState(false)
  const [previewReport, setPreviewReport] = useState<any>(null)

  const [filters, setFilters] = useState({
    startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
    endDate: format(new Date(), "yyyy-MM-dd"),
    department: "",
    position: "",
    interviewer: "",
    decision: "",
  })

  const departmentOptions = useMemo(() => {
    const set = new Set<string>()
    interviewers.forEach((i) => i.department && set.add(i.department))
    hiringResults.forEach((r) => r.department && set.add(r.department))
    return Array.from(set)
  }, [interviewers, hiringResults])

  const positionOptions = useMemo(() => {
    const set = new Set<string>()
    hiringResults.forEach((r) => r.position && set.add(r.position))
    return Array.from(set)
  }, [hiringResults])

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    parts.push(`${filters.startDate} 至 ${filters.endDate}`)
    if (filters.department) parts.push(`部门：${filters.department}`)
    if (filters.position) parts.push(`岗位：${filters.position}`)
    if (filters.interviewer) {
      const iv = interviewers.find((i) => i.id === filters.interviewer)
      if (iv) parts.push(`面试官：${iv.name}`)
    }
    if (filters.decision) {
      const decisionMap: Record<string, string> = {
        hired: "已录用",
        rejected: "已拒绝",
        pending: "待定",
      }
      parts.push(`结果：${decisionMap[filters.decision] ?? filters.decision}`)
    }
    const prefixMap: Record<ExportType, string> = {
      interview_summary: "面试汇总",
      scoring_analysis: "评分分析",
      hiring_result: "招聘结果",
      quality_metrics: "质量指标",
    }
    return `${prefixMap[selectedType]} · ${parts.join(" · ")}`
  }, [filters, selectedType, interviewers])

  const generateData = () => {
    const start = new Date(filters.startDate)
    const end = new Date(filters.endDate + "T23:59:59")

    let filteredInterviews = interviews.filter((i) => {
      const d = new Date(i.scheduled_at)
      if (d < start || d > end) return false
      if (filters.interviewer && i.interviewer_id !== filters.interviewer) return false
      return true
    })

    let filteredHiring = hiringResults.filter((r) => {
      const d = new Date(r.decided_at)
      if (d < start || d > end) return false
      if (filters.department && !r.department.includes(filters.department)) return false
      if (filters.position && !r.position.includes(filters.position)) return false
      if (filters.decision && r.decision !== filters.decision) return false
      return true
    })

    return {
      interviews: filteredInterviews,
      hiringResults: filteredHiring,
    }
  }

  const handleGenerate = () => {
    const { interviews: ivs, hiringResults: hrs } = generateData()
    let rows: Record<string, any>[] = []

    switch (selectedType) {
      case "interview_summary":
        rows = ivs.map((i) => ({
          面试ID: i.id.slice(0, 8),
          候选人: i.candidate_name,
          候选人邮箱: i.candidate_email,
          面试官: interviewers.find((iv) => iv.id === i.interviewer_id)?.name ?? "未知",
          部门: interviewers.find((iv) => iv.id === i.interviewer_id)?.department ?? "—",
          面试时间: format(parseISO(i.scheduled_at), "yyyy-MM-dd HH:mm"),
          时长: i.duration_minutes + "分钟",
          状态: { scheduled: "已排期", in_progress: "进行中", completed: "已完成", cancelled: "已取消" }[i.status] ?? i.status,
          结果: i.result ? { pass: "通过", fail: "未通过", pending: "待定" }[i.result] ?? i.result : "—",
          备注: i.notes ?? "—",
        }))
        break
      case "scoring_analysis":
        rows = ivs
          .filter((i) => i.scores && i.scores.length > 0)
          .flatMap((i) =>
            (i.scores ?? []).map((s) => ({
              面试ID: i.id.slice(0, 8),
              候选人: i.candidate_name,
              面试官: interviewers.find((iv) => iv.id === i.interviewer_id)?.name ?? "未知",
              面试时间: format(parseISO(i.scheduled_at), "yyyy-MM-dd"),
              评分维度: s.dimension,
              得分: s.score,
              满分: s.max_score,
              得分率: Math.round((s.score / s.max_score) * 100) + "%",
              评语: s.comment ?? "—",
            }))
          )
        break
      case "hiring_result":
        rows = hrs.map((r) => ({
          决策ID: r.id.slice(0, 8),
          候选人: interviews.find((i) => i.id === r.interview_id)?.candidate_name ?? "未知",
          岗位: r.position,
          部门: r.department,
          决策: { hired: "已录用", rejected: "已拒绝", pending: "待定" }[r.decision] ?? r.decision,
          决策时间: format(parseISO(r.decided_at), "yyyy-MM-dd HH:mm"),
          备注: r.notes ?? "—",
        }))
        break
      case "quality_metrics": {
        const total = ivs.length
        const completed = ivs.filter((i) => i.status === "completed").length
        const passed = ivs.filter((i) => i.result === "pass").length
        const hired = hrs.filter((r) => r.decision === "hired").length
        const allScores = ivs.flatMap((i) => (i.scores ?? []).map((s) => s.score / s.max_score))
        const avg = allScores.length > 0 ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) : 0
        rows = [
          { 指标: "面试总数", 数值: total, 单位: "场", 说明: "筛选时间段内所有面试安排" },
          { 指标: "完成面试", 数值: completed, 单位: "场", 说明: "已完成的面试数量" },
          { 指标: "面试完成率", 数值: total > 0 ? Math.round((completed / total) * 100) : 0, 单位: "%", 说明: "完成面试占总面试的比例" },
          { 指标: "通过面试数", 数值: passed, 单位: "人", 说明: "面试结果为通过的候选人" },
          { 指标: "面试通过率", 数值: completed > 0 ? Math.round((passed / completed) * 100) : 0, 单位: "%", 说明: "通过面试占完成面试的比例" },
          { 指标: "录用人数", 数值: hired, 单位: "人", 说明: "最终录用的候选人数" },
          { 指标: "录用率", 数值: hrs.length > 0 ? Math.round((hired / hrs.length) * 100) : 0, 单位: "%", 说明: "录用占全部决策的比例" },
          { 指标: "平均评分", 数值: avg, 单位: "分", 说明: "所有评分维度的平均得分率" },
          { 指标: "题目总数", 数值: questions.length, 单位: "道", 说明: "题库中总题目数量" },
          { 指标: "面试官数", 数值: interviewers.length, 单位: "人", 说明: "参与面试的面试官数量" },
        ]
        break
      }
    }

    return rows
  }

  const handleExport = () => {
    const rows = handleGenerate()
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, typeConfig[selectedType].label)

    const summaryWs = XLSX.utils.json_to_sheet([
      { 项目: "报表类型", 值: typeConfig[selectedType].label },
      { 项目: "生成时间", 值: format(new Date(), "yyyy-MM-dd HH:mm:ss") },
      { 项目: "筛选条件", 值: filterSummary },
      { 项目: "数据行数", 值: rows.length },
    ])
    XLSX.utils.book_append_sheet(wb, summaryWs, "条件摘要")

    const filename = `${typeConfig[selectedType].label}_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`
    XLSX.writeFile(wb, filename)

    addExportReport({
      id: `er-${Date.now()}`,
      name: `${typeConfig[selectedType].label} - ${format(new Date(), "MM-dd HH:mm")}`,
      type: selectedType,
      filters: JSON.parse(JSON.stringify(filters)),
      filter_summary: filterSummary,
      generated_at: new Date().toISOString(),
      file_url: `/exports/${filename}`,
    })
  }

  const handlePreview = () => {
    const rows = handleGenerate()
    setPreviewReport({
      type: selectedType,
      rows,
      summary: filterSummary,
    })
    setShowPreview(true)
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">报表导出</h1>
        <EmptyState
          icon={<FileSpreadsheet className="h-8 w-8" />}
          title="模块已禁用"
          description="质量看板模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">报表导出</h1>
        <p className="text-sm text-slate-500 mt-1">按条件筛选导出数据报表，条件摘要自动保留便于各部门对齐口径</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.keys(typeConfig) as ExportType[]).map((type) => {
          const cfg = typeConfig[type]
          const Icon = cfg.icon
          const isSelected = selectedType === type
          return (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                "text-left p-5 rounded-xl border-2 transition-all",
                isSelected
                  ? `border-${cfg.color}-500 bg-${cfg.color}-50 ring-2 ring-${cfg.color}-200`
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              )}
            >
              <div className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center mb-3",
                isSelected
                  ? `bg-${cfg.color}-500 text-white`
                  : "bg-slate-100 text-slate-600"
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{cfg.label}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{cfg.description}</p>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-base">筛选条件</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters((f) => ({ ...f, startDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters((f) => ({ ...f, endDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">部门</label>
                <Select
                  value={filters.department}
                  onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
                >
                  <option value="">全部部门</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">岗位</label>
                <Select
                  value={filters.position}
                  onChange={(e) => setFilters((f) => ({ ...f, position: e.target.value }))}
                >
                  <option value="">全部岗位</option>
                  {positionOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">面试官</label>
                <Select
                  value={filters.interviewer}
                  onChange={(e) => setFilters((f) => ({ ...f, interviewer: e.target.value }))}
                >
                  <option value="">全部面试官</option>
                  {interviewers.map((i) => (
                    <option key={i.id} value={i.id}>{i.name} - {i.department}</option>
                  ))}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">录用结果</label>
                <Select
                  value={filters.decision}
                  onChange={(e) => setFilters((f) => ({ ...f, decision: e.target.value }))}
                >
                  <option value="">全部结果</option>
                  <option value="hired">已录用</option>
                  <option value="rejected">已拒绝</option>
                  <option value="pending">待定</option>
                </Select>
              </div>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-start gap-3">
                <ClipboardList className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <span className="font-medium text-emerald-800">条件摘要：</span>
                  <span className="text-emerald-700">{filterSummary}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => {
                setFilters({
                  startDate: format(subMonths(new Date(), 1), "yyyy-MM-dd"),
                  endDate: format(new Date(), "yyyy-MM-dd"),
                  department: "",
                  position: "",
                  interviewer: "",
                  decision: "",
                })
              }}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                重置
              </Button>
              <Button variant="outline" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-1.5" />
                预览数据
              </Button>
              <Button onClick={handleExport}>
                <Download className="h-4 w-4 mr-1.5" />
                导出报表
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-slate-400" />
                <CardTitle className="text-base">历史导出</CardTitle>
              </div>
              <Badge variant="secondary">{exportReports.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto -mx-1">
            {exportReports.length === 0 ? (
              <EmptyState
                icon={<DownloadCloud className="h-8 w-8" />}
                title="暂无导出记录"
                description="导出报表后将在此展示历史记录"
              />
            ) : (
              <div className="space-y-2">
                {[...exportReports]
                  .sort((a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime())
                  .map((report) => {
                    const cfg = typeConfig[report.type]
                    const Icon = cfg?.icon ?? FileBarChart
                    return (
                      <div
                        key={report.id}
                        className="p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-slate-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-slate-900 truncate">{report.name}</p>
                              <button
                                onClick={() => deleteExportReport(report.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                              <Clock className="h-3 w-3" />
                              <span>{format(parseISO(report.generated_at), "MM-dd HH:mm")}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{report.filter_summary}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="数据预览"
        className="max-w-4xl"
      >
        {previewReport && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-lg text-sm">
              <div className="flex items-start gap-2">
                <ClipboardList className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-slate-700">条件摘要：</span>
                  <span className="text-slate-600">{previewReport.summary}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                共 <span className="font-medium text-slate-700">{previewReport.rows.length}</span> 条数据
                {previewReport.rows.length > 50 && "（仅展示前50条）"}
              </p>
              <Button size="sm" onClick={handleExport}>
                <Download className="h-3.5 w-3.5 mr-1.5" />
                导出完整数据
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-auto border border-slate-200 rounded-lg">
              {previewReport.rows.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">当前筛选条件下暂无数据</div>
              ) : (
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      {Object.keys(previewReport.rows[0]).map((key) => (
                        <th
                          key={key}
                          className="px-3 py-2 text-left font-medium text-slate-600 border-b border-slate-200 whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewReport.rows.slice(0, 50).map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50">
                        {Object.values(row).map((val: any, i: number) => (
                          <td
                            key={i}
                            className="px-3 py-2 text-slate-700 whitespace-nowrap"
                          >
                            {typeof val === "string" && val.length > 40
                              ? val.slice(0, 40) + "..."
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                <X className="h-4 w-4 mr-1.5" />
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
