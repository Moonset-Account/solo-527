"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  SlidersHorizontal,
  Star,
  X,
  RotateCcw,
} from "lucide-react"
import { mockData } from "@/lib/mock-data"
import type { Session, FilterPreset } from "@/lib/types"
import { cn } from "@/lib/utils"

const statusMap: Record<Session["status"], { label: string; cls: string }> = {
  pending: { label: "待质检", cls: "bg-amber-bg text-amber" },
  inspecting: { label: "质检中", cls: "bg-navy/10 text-navy" },
  completed: { label: "已完成", cls: "bg-emerald-bg text-emerald" },
  appealed: { label: "已申诉", cls: "bg-danger-bg text-danger" },
}

const ratingOptions = [1, 2, 3, 4, 5] as const
const knowledgeVersions = ["v2.1", "v2.2", "v2.3"] as const

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-slate-light">—</span>
  return (
    <span
      className={cn(
        "font-semibold",
        score >= 90 && "text-emerald",
        score >= 70 && score < 90 && "text-amber",
        score < 70 && "text-danger"
      )}
    >
      {score}
    </span>
  )
}

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-slate-light">—</span>
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={cn(
            i < rating ? "fill-amber text-amber" : "text-slate-light/40"
          )}
        />
      ))}
    </span>
  )
}

export default function SessionsPage() {
  const { sessions, filterPresets } = mockData

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [ratingFilter, setRatingFilter] = useState("")
  const [versionFilter, setVersionFilter] = useState("")
  const [timeoutOnly, setTimeoutOnly] = useState(false)
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const [activePreset, setActivePreset] = useState<string | null>(null)

  const [drawerSession, setDrawerSession] = useState<Session | null>(null)
  const [scores, setScores] = useState({
    attitude: 0,
    professional: 0,
    response: 0,
    compliance: 0,
  })
  const [notes, setNotes] = useState("")
  const [processingResult, setProcessingResult] = useState("resolved")

  function resetFilters() {
    setQuery("")
    setStatusFilter("")
    setRatingFilter("")
    setVersionFilter("")
    setTimeoutOnly(false)
    setDateFrom("")
    setDateTo("")
    setActivePreset(null)
  }

  function applyPreset(preset: FilterPreset) {
    const f = preset.filters
    setQuery(f.query ?? "")
    setStatusFilter(f.status?.[0] ?? "")
    setRatingFilter(
      f.service_rating ? String(f.service_rating[0]) : ""
    )
    setVersionFilter(f.knowledge_version?.[0] ?? "")
    setTimeoutOnly(f.has_timeout_risk ?? false)
    setDateFrom(f.date_from ?? "")
    setDateTo(f.date_to ?? "")
    setActivePreset(preset.id)
  }

  function openDrawer(session: Session) {
    setDrawerSession(session)
    setScores({ attitude: 0, professional: 0, response: 0, compliance: 0 })
    setNotes("")
    setProcessingResult("resolved")
  }

  function closeDrawer() {
    setDrawerSession(null)
  }

  const totalScore = scores.attitude + scores.professional + scores.response + scores.compliance
  const resultLabel =
    totalScore >= 80 ? "合格" : totalScore >= 60 ? "警告" : "不合格"
  const resultCls =
    totalScore >= 80
      ? "text-emerald"
      : totalScore >= 60
        ? "text-amber"
        : "text-danger"

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (query) {
        const q = query.toLowerCase()
        const match =
          s.agent_name.toLowerCase().includes(q) ||
          s.order_no.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
        if (!match) return false
      }
      if (statusFilter && s.status !== statusFilter) return false
      if (ratingFilter && s.service_rating !== Number(ratingFilter)) return false
      if (versionFilter && s.knowledge_version !== versionFilter) return false
      if (timeoutOnly && !s.has_timeout_risk) return false
      if (dateFrom && new Date(s.created_at) < new Date(dateFrom)) return false
      if (dateTo && new Date(s.created_at) > new Date(dateTo + "T23:59:59Z"))
        return false
      return true
    })
  }, [sessions, query, statusFilter, ratingFilter, versionFilter, timeoutOnly, dateFrom, dateTo])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-navy-dark">会话质检</h1>
        <p className="mt-1 text-sm text-slate-light">管理售后客服会话的质量检查</p>
      </div>

      <div className="rounded-xl bg-surface-white p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <SlidersHorizontal size={16} className="text-navy" />
          <span className="text-sm font-semibold text-navy">筛选条件</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="relative sm:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-light"
            />
            <input
              type="text"
              placeholder="搜索客服、订单号、会话ID..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setActivePreset(null)
              }}
              className="w-full rounded-lg border border-slate/20 bg-surface py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-navy focus:ring-1 focus:ring-navy/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setActivePreset(null)
            }}
            className="rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
          >
            <option value="">全部状态</option>
            <option value="pending">待质检</option>
            <option value="inspecting">质检中</option>
            <option value="completed">已完成</option>
            <option value="appealed">已申诉</option>
          </select>

          <select
            value={ratingFilter}
            onChange={(e) => {
              setRatingFilter(e.target.value)
              setActivePreset(null)
            }}
            className="rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
          >
            <option value="">全部评分</option>
            {ratingOptions.map((r) => (
              <option key={r} value={r}>
                {r}星
              </option>
            ))}
          </select>

          <select
            value={versionFilter}
            onChange={(e) => {
              setVersionFilter(e.target.value)
              setActivePreset(null)
            }}
            className="rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
          >
            <option value="">全部版本</option>
            {knowledgeVersions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              checked={timeoutOnly}
              onChange={(e) => {
                setTimeoutOnly(e.target.checked)
                setActivePreset(null)
              }}
              className="accent-navy h-4 w-4 rounded"
            />
            <span>超时风险</span>
          </label>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setActivePreset(null)
            }}
            className="rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
            placeholder="开始日期"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setActivePreset(null)
            }}
            className="rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
            placeholder="结束日期"
          />

          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm text-slate transition-colors hover:bg-slate/10"
          >
            <RotateCcw size={14} />
            重置
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-light mr-1">快捷筛选:</span>
          {filterPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activePreset === preset.id
                  ? "bg-navy text-white"
                  : "bg-surface text-slate hover:bg-navy/10 hover:text-navy"
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-surface-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate/10 flex items-center justify-between">
          <span className="text-sm text-slate">
            共 <span className="font-semibold text-navy">{filtered.length}</span> 条记录
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate/10 bg-surface/50">
                <th className="px-5 py-3 text-left font-medium text-slate-light">订单号</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">客服</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">服务评价</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">知识库版本</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">质检状态</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">评分</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">超时风险</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">创建时间</th>
                <th className="px-5 py-3 text-left font-medium text-slate-light">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-light">
                      <Search size={32} className="opacity-40" />
                      <p className="text-sm">没有找到匹配的会话记录</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((s) => {
                const badge = statusMap[s.status]
                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate/5 transition-colors hover:bg-surface/60"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-navy">
                      {s.order_no}
                    </td>
                    <td className="px-5 py-3 text-slate">{s.agent_name}</td>
                    <td className="px-5 py-3">
                      <RatingStars rating={s.service_rating} />
                    </td>
                    <td className="px-5 py-3 text-slate">
                      {s.knowledge_version ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                          badge.cls
                        )}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <ScoreCell score={s.score} />
                    </td>
                    <td className="px-5 py-3">
                      {s.has_timeout_risk ? (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-danger" />
                      ) : (
                        <span className="text-slate-light">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-slate-light whitespace-nowrap">
                      {new Date(s.created_at).toLocaleString("zh-CN", {
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/sessions/${s.id}`}
                          className="text-xs font-medium text-navy hover:text-navy-light transition-colors"
                        >
                          查看详情
                        </Link>
                        <button
                          onClick={() => openDrawer(s)}
                          className="text-xs font-medium text-amber hover:text-amber-light transition-colors"
                        >
                          评分
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawerSession && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={closeDrawer}
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-surface-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate/10 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-navy-dark">评分面板</h2>
                <p className="mt-0.5 text-xs text-slate-light">
                  {drawerSession.order_no} · {drawerSession.agent_name}
                </p>
              </div>
              <button
                onClick={closeDrawer}
                className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-surface"
              >
                <X size={18} className="text-slate" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
              {(
                [
                  { key: "attitude", label: "服务态度" },
                  { key: "professional", label: "专业度" },
                  { key: "response", label: "响应时效" },
                  { key: "compliance", label: "规范度" },
                ] as const
              ).map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate">{item.label}</span>
                    <span className="text-sm font-semibold text-navy">
                      {scores[item.key]}
                      <span className="text-slate-light font-normal">/25</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={25}
                    value={scores[item.key]}
                    onChange={(e) =>
                      setScores((prev) => ({
                        ...prev,
                        [item.key]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-navy h-2 cursor-pointer"
                  />
                </div>
              ))}

              <div className="rounded-lg border border-slate/10 bg-surface p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate">总分</span>
                  <span className="text-lg font-bold text-navy">{totalScore}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm text-slate-light">质检结果</span>
                  <span className={cn("text-sm font-semibold", resultCls)}>
                    {resultLabel}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">
                  备注说明
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy resize-none"
                  placeholder="输入质检备注..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">
                  处理结果
                </label>
                <select
                  value={processingResult}
                  onChange={(e) => setProcessingResult(e.target.value)}
                  className="w-full rounded-lg border border-slate/20 bg-surface px-3 py-2 text-sm outline-none transition-colors focus:border-navy"
                >
                  <option value="resolved">已解决</option>
                  <option value="escalated">已升级</option>
                  <option value="pending">待处理</option>
                  <option value="dismissed">已驳回</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate/10 px-5 py-4">
              <button
                onClick={() => {
                  alert(
                    `评分提交成功！\n会话: ${drawerSession.id}\n总分: ${totalScore} (${resultLabel})\n处理结果: ${processingResult}`
                  )
                  closeDrawer()
                }}
                className="w-full rounded-lg bg-navy py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy-light"
              >
                提交评分
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
