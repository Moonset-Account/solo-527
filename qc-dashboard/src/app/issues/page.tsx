"use client"

import { useState, useMemo } from "react"
import {
  AlertTriangle,
  Search,
  Filter,
  Copy,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts"
import { mockData } from "@/lib/mock-data"
import type { Issue, IssueNote, ModificationRecord } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusLabels: Record<Issue["status"], string> = {
  open: "待处理",
  processing: "处理中",
  resolved: "已解决",
  closed: "已关闭",
}

const statusStyles: Record<Issue["status"], string> = {
  open: "bg-amber-bg text-amber",
  processing: "bg-navy/10 text-navy",
  resolved: "bg-emerald-bg text-emerald",
  closed: "bg-surface text-slate-light",
}

const categoryStyles: Record<string, string> = {
  流程违规: "bg-danger-bg text-danger",
  话术规范: "bg-amber-bg text-amber",
  响应时效: "bg-warning-bg text-amber",
  业务错误: "bg-navy/10 text-navy",
  服务态度: "bg-danger-bg text-danger",
}

const processingResultLabels: Record<Issue["processing_result"], string> = {
  resolved: "已解决",
  escalated: "已升级",
  pending: "待处理",
  dismissed: "已驳回",
}

const processingResultStyles: Record<Issue["processing_result"], string> = {
  resolved: "bg-emerald-bg text-emerald",
  escalated: "bg-danger-bg text-danger",
  pending: "bg-amber-bg text-amber",
  dismissed: "bg-surface text-slate-light",
}

const categoryColors: Record<string, string> = {
  流程违规: "#EF4444",
  话术规范: "#E8913A",
  响应时效: "#F59E0B",
  业务错误: "#1E3A5F",
  服务态度: "#8B5CF6",
}

const statusFilters = [
  { value: "", label: "全部" },
  { value: "open", label: "待处理" },
  { value: "processing", label: "处理中" },
  { value: "resolved", label: "已解决" },
  { value: "closed", label: "已关闭" },
]

const categoryFilters = [
  { value: "", label: "全部" },
  { value: "流程违规", label: "流程违规" },
  { value: "话术规范", label: "话术规范" },
  { value: "响应时效", label: "响应时效" },
  { value: "业务错误", label: "业务错误" },
  { value: "服务态度", label: "服务态度" },
]

export default function IssuesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [showTimeoutOnly, setShowTimeoutOnly] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteTexts, setNoteTexts] = useState<Record<string, string>>({})
  const [processingResults, setProcessingResults] = useState<Record<string, Issue["processing_result"]>>({})

  const { issues, issueNotes, modifications } = mockData

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !issue.title.toLowerCase().includes(q) &&
          !issue.description.toLowerCase().includes(q)
        ) {
          return false
        }
      }
      if (statusFilter && issue.status !== statusFilter) return false
      if (categoryFilter && issue.category !== categoryFilter) return false
      if (showTimeoutOnly && !issue.has_timeout_risk) return false
      return true
    })
  }, [issues, searchQuery, statusFilter, categoryFilter, showTimeoutOnly])

  const summaryStats = useMemo(() => {
    return {
      total: issues.length,
      timeoutRisk: issues.filter((i) => i.has_timeout_risk).length,
      pending: issues.filter((i) => i.status === "open").length,
      resolved: issues.filter((i) => i.status === "resolved").length,
    }
  }, [issues])

  const timeoutPieData = useMemo(() => {
    const categories = [...new Set(issues.map((i) => i.category))]
    return categories.map((cat) => ({
      name: cat,
      value: issues.filter((i) => i.category === cat && i.has_timeout_risk).length,
    })).filter((d) => d.value > 0)
  }, [issues])

  const categoryDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    issues.forEach((i) => {
      map[i.category] = (map[i.category] || 0) + 1
    })
    return Object.entries(map)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
  }, [issues])

  const maxCategoryCount = Math.max(...categoryDistribution.map((d) => d.count), 1)

  const getIssueNotes = (issueId: string): IssueNote[] => {
    return issueNotes.filter((n) => n.issue_id === issueId)
  }

  const getIssueModifications = (issueId: string): ModificationRecord[] => {
    return modifications.filter(
      (m) => m.entity_type === "issue" && m.entity_id === issueId
    )
  }

  const getProcessingResult = (issue: Issue): Issue["processing_result"] => {
    return processingResults[issue.id] ?? issue.processing_result
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  const handleAddNote = (issueId: string) => {
    setNoteTexts((prev) => ({ ...prev, [issueId]: "" }))
  }

  const handleProcessingResultChange = (issueId: string, value: Issue["processing_result"]) => {
    setProcessingResults((prev) => ({ ...prev, [issueId]: value }))
  }

  const toggleExpand = (issueId: string) => {
    setExpandedId((prev) => (prev === issueId ? null : issueId))
  }

  return (
    <div className="flex gap-6">
      <div className="flex-1 min-w-0" style={{ flex: "8" }}>
        <div className="bg-surface-white rounded-xl border border-slate-200 p-4 mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-light" />
              <input
                type="text"
                placeholder="搜索问题标题或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-surface border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-light" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-sm bg-surface border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {statusFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    状态: {f.label}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="text-sm bg-surface border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20"
              >
                {categoryFilters.map((f) => (
                  <option key={f.value} value={f.value}>
                    类型: {f.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                className={cn(
                  "w-9 h-5 rounded-full relative transition-colors",
                  showTimeoutOnly ? "bg-amber" : "bg-slate-200"
                )}
                onClick={() => setShowTimeoutOnly(!showTimeoutOnly)}
              >
                <div
                  className={cn(
                    "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm",
                    showTimeoutOnly ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </div>
              <span className="text-sm text-slate-light">超时风险</span>
            </label>
            <span className="text-sm text-slate-light ml-auto">
              共 <span className="font-semibold text-navy">{filteredIssues.length}</span> 条结果
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const isExpanded = expandedId === issue.id
            const notes = getIssueNotes(issue.id)
            const mods = getIssueModifications(issue.id)
            const currentResult = getProcessingResult(issue)

            return (
              <div
                key={issue.id}
                className={cn(
                  "bg-surface-white rounded-xl border border-slate-200 overflow-hidden transition-all",
                  issue.has_timeout_risk && "bg-amber-bg/40"
                )}
              >
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface/50 transition-colors"
                  onClick={() => toggleExpand(issue.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-navy truncate">
                        {issue.title}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          categoryStyles[issue.category] || "bg-surface text-slate-light"
                        )}
                      >
                        {issue.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-light">
                      <span className="flex items-center gap-1">
                        <Copy className="w-3 h-3" />
                        <span
                          className={cn(
                            issue.duplicate_count > 3 && "text-danger font-semibold"
                          )}
                        >
                          {issue.duplicate_count}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          statusStyles[issue.status]
                        )}
                      >
                        {statusLabels[issue.status]}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          processingResultStyles[currentResult]
                        )}
                      >
                        {processingResultLabels[currentResult]}
                      </span>
                      {issue.has_timeout_risk && (
                        <span className="flex items-center gap-0.5 text-amber">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs">超时</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {issue.related_session_count}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(issue.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-light">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-slate-200 px-4 py-3 space-y-4">
                    <p className="text-sm text-slate">{issue.description}</p>

                    <div>
                      <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" />
                        备注记录
                      </h4>
                      {notes.length > 0 ? (
                        <div className="space-y-2 mb-3">
                          {notes.map((note) => (
                            <div
                              key={note.id}
                              className="bg-surface rounded-lg p-3"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-navy">
                                  {note.author_name}
                                </span>
                                <span className="text-xs text-slate-light">
                                  {formatDate(note.created_at)}
                                </span>
                              </div>
                              <p className="text-sm text-slate">{note.content}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-light mb-3">暂无备注</p>
                      )}
                      <div className="flex gap-2">
                        <textarea
                          value={noteTexts[issue.id] || ""}
                          onChange={(e) =>
                            setNoteTexts((prev) => ({
                              ...prev,
                              [issue.id]: e.target.value,
                            }))
                          }
                          placeholder="添加备注..."
                          rows={2}
                          className="flex-1 text-sm bg-surface border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                        />
                        <button
                          onClick={() => handleAddNote(issue.id)}
                          disabled={!noteTexts[issue.id]?.trim()}
                          className="self-end px-4 py-2 text-xs font-medium text-white bg-navy rounded-lg hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          保存
                        </button>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        处理结果
                      </h4>
                      <div className="flex items-center gap-2">
                        <select
                          value={currentResult}
                          onChange={(e) =>
                            handleProcessingResultChange(
                              issue.id,
                              e.target.value as Issue["processing_result"]
                            )
                          }
                          className="text-sm bg-surface border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy/20"
                        >
                          <option value="resolved">已解决</option>
                          <option value="escalated">已升级</option>
                          <option value="pending">待处理</option>
                          <option value="dismissed">已驳回</option>
                        </select>
                        <button
                          className="px-4 py-2 text-xs font-medium text-white bg-emerald rounded-lg hover:bg-emerald-light transition-colors"
                          disabled={processingResults[issue.id] === undefined}
                        >
                          保存
                        </button>
                      </div>
                    </div>

                    {mods.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-navy uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          修改历史
                        </h4>
                        <div className="relative pl-4 space-y-3">
                          <div className="absolute left-[7px] top-1 bottom-1 w-px bg-slate-200" />
                          {mods.map((mod) => (
                            <div key={mod.id} className="relative flex items-start gap-3">
                              <div className="absolute left-[-12px] top-1.5 w-2.5 h-2.5 rounded-full bg-navy border-2 border-surface-white" />
                              <div className="text-xs">
                                <span className="font-medium text-navy">
                                  {mod.field}
                                </span>
                                <span className="mx-1.5 text-slate-light">:</span>
                                <span className="text-danger line-through">
                                  {mod.old_value}
                                </span>
                                <span className="mx-1.5 text-slate-light">→</span>
                                <span className="text-emerald">
                                  {mod.new_value}
                                </span>
                                <span className="ml-2 text-slate-light">
                                  {mod.modified_by} · {formatDate(mod.modified_at)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {filteredIssues.length === 0 && (
            <div className="bg-surface-white rounded-xl border border-slate-200 p-12 text-center">
              <XCircle className="w-10 h-10 text-slate-light mx-auto mb-3" />
              <p className="text-sm text-slate-light">未找到匹配的问题</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4" style={{ flex: "4" }}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-navy" />
              <span className="text-xs text-slate-light">总问题数</span>
            </div>
            <p className="text-2xl font-bold text-navy">{summaryStats.total}</p>
          </div>
          <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-amber" />
              <span className="text-xs text-slate-light">超时风险数</span>
            </div>
            <p className="text-2xl font-bold text-amber">
              {summaryStats.timeoutRisk}
            </p>
          </div>
          <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-amber-light" />
              <span className="text-xs text-slate-light">待处理数</span>
            </div>
            <p className="text-2xl font-bold text-amber-light">
              {summaryStats.pending}
            </p>
          </div>
          <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-4 h-4 text-emerald" />
              <span className="text-xs text-slate-light">已解决数</span>
            </div>
            <p className="text-2xl font-bold text-emerald">
              {summaryStats.resolved}
            </p>
          </div>
        </div>

        <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">超时风险分布</h3>
          <div className="relative">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={timeoutPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  dataKey="value"
                  stroke="none"
                >
                  {timeoutPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={categoryColors[entry.name] || "#94A3B8"}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value) => [`${value} 个`]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-navy">
                {summaryStats.timeoutRisk}
              </span>
              <span className="text-xs text-slate-light">超时总数</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {timeoutPieData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: categoryColors[entry.name] }}
                />
                <span className="text-xs text-slate-light">
                  {entry.name} ({entry.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-white rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-navy mb-3">分类分布</h3>
          <div className="space-y-3">
            {categoryDistribution.map((item) => (
              <div key={item.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-navy">
                    {item.category}
                  </span>
                  <span className="text-xs text-slate-light">
                    {item.count} 个
                  </span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(item.count / maxCategoryCount) * 100}%`,
                      backgroundColor: categoryColors[item.category] || "#94A3B8",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
