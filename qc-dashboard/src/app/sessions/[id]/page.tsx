"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  Paperclip,
  Clock,
  User,
  Bot,
  MessageSquare,
  FileText,
  Image,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react"
import { mockData } from "@/lib/mock-data"
import type { Inspection, KnowledgeHit, Attachment, ModificationRecord } from "@/lib/types"
import { cn } from "@/lib/utils"

type MessageRole = "agent" | "customer" | "system"

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: "待质检", cls: "bg-warning-bg text-warning" },
  inspecting: { label: "质检中", cls: "bg-amber-bg text-amber" },
  completed: { label: "已完成", cls: "bg-emerald-bg text-emerald" },
  appealed: { label: "已申诉", cls: "bg-danger-bg text-danger" },
}

const resultMap: Record<string, { label: string; cls: string }> = {
  pass: { label: "通过", cls: "bg-emerald-bg text-emerald" },
  fail: { label: "不通过", cls: "bg-danger-bg text-danger" },
  warning: { label: "警告", cls: "bg-warning-bg text-warning" },
}

const processingMap: Record<string, { label: string; cls: string }> = {
  resolved: { label: "已解决", cls: "bg-emerald-bg text-emerald" },
  escalated: { label: "已升级", cls: "bg-danger-bg text-danger" },
  pending: { label: "待处理", cls: "bg-warning-bg text-warning" },
  dismissed: { label: "已驳回", cls: "bg-surface text-slate-light" },
}

const roleMap: Record<string, { label: string; icon: typeof User; bubbleCls: string; labelCls: string }> = {
  agent: { label: "客服", icon: User, bubbleCls: "bg-navy/5", labelCls: "text-navy" },
  customer: { label: "客户", icon: MessageSquare, bubbleCls: "bg-emerald/5", labelCls: "text-emerald" },
  system: { label: "系统", icon: Bot, bubbleCls: "bg-amber/5", labelCls: "text-amber" },
}

const hitRoleMap: Record<string, { label: string; cls: string }> = {
  agent: { label: "客服", cls: "bg-navy/10 text-navy" },
  customer: { label: "客户", cls: "bg-emerald/10 text-emerald" },
  system: { label: "系统", cls: "bg-amber/10 text-amber" },
}

const scoreDimensions = [
  { key: "attitude_score" as const, label: "服务态度", max: 25 },
  { key: "professional_score" as const, label: "专业能力", max: 25 },
  { key: "response_score" as const, label: "响应速度", max: 25 },
  { key: "compliance_score" as const, label: "合规规范", max: 25 },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function isImageFile(type: string): boolean {
  return type.startsWith("image/")
}

function StarRating({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-xs text-slate-light">未评价</span>
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn("h-4 w-4", i < rating ? "text-amber" : "text-slate-200")}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ScoreBar({ label, score, max }: { label: string; score: number; max: number }) {
  const pct = (score / max) * 100
  const color = pct >= 90 ? "bg-emerald" : pct >= 70 ? "bg-amber" : "bg-danger"
  return (
    <div className="flex items-center gap-3">
      <span className="w-16 shrink-0 text-xs text-slate-light">{label}</span>
      <div className="h-2 flex-1 rounded-full bg-surface">
        <div className={cn("h-2 rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium text-navy">
        {score}/{max}
      </span>
    </div>
  )
}

export default function SessionDetailPage() {
  const params = useParams()
  const sessionId = params.id as string

  const session = mockData.sessions.find((s) => s.id === sessionId)

  const inspection = mockData.inspections.find((i) => i.session_id === sessionId) as
    | Inspection
    | undefined

  const rawMessages = mockData.chatMessages[sessionId] || []
  const messages = rawMessages.map((m) => ({ ...m, role: m.role as MessageRole }))

  const sessionAttachments = mockData.attachments.filter(
    (a) => a.session_id === sessionId
  ) as Attachment[]

  const sessionHits = mockData.knowledgeHits.filter(
    (kh) => kh.session_id === sessionId
  ) as KnowledgeHit[]

  const sessionMods = inspection
    ? (mockData.modifications.filter(
        (m) => m.entity_id === inspection.id
      ) as ModificationRecord[])
    : []

  const [expandedHits, setExpandedHits] = useState<Set<string>>(new Set())
  const [newNote, setNewNote] = useState("")
  const [processingResult, setProcessingResult] = useState(
    inspection?.processing_result ?? "pending"
  )

  const toggleHit = (id: string) => {
    setExpandedHits((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  if (!session) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-lg text-slate-light">会话不存在</p>
      </div>
    )
  }

  const statusInfo = statusMap[session.status] ?? statusMap.pending

  return (
    <div className="grid grid-cols-12 gap-5">
      {/* ===== LEFT COLUMN ===== */}
      <div className="col-span-3 flex flex-col gap-5">
        <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
          <Link
            href="/sessions"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-light transition-colors hover:text-navy"
          >
            <ArrowLeft size={16} />
            返回会话列表
          </Link>

          <div className="mt-3 space-y-4">
            <div>
              <p className="text-xs text-slate-light">订单编号</p>
              <p className="mt-0.5 text-sm font-semibold text-navy">{session.order_no}</p>
            </div>

            <div>
              <p className="text-xs text-slate-light">客服</p>
              <p className="mt-0.5 text-sm font-medium text-navy">{session.agent_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                  statusInfo.cls
                )}
              >
                {statusInfo.label}
              </span>
              {session.has_timeout_risk && (
                <span className="inline-flex items-center gap-1 rounded-md bg-warning-bg px-2 py-0.5 text-xs font-medium text-warning">
                  <Clock size={12} />
                  超时风险
                </span>
              )}
            </div>

            {session.score !== null && (
              <div>
                <p className="text-xs text-slate-light">质检评分</p>
                <p className="mt-0.5 text-2xl font-bold text-navy">{session.score}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-light">服务评价</p>
              <div className="mt-0.5">
                <StarRating rating={session.service_rating} />
              </div>
            </div>

            {session.knowledge_version && (
              <div>
                <p className="text-xs text-slate-light">知识库版本</p>
                <span className="mt-0.5 inline-block rounded-md bg-surface px-2 py-0.5 text-xs font-medium text-navy">
                  {session.knowledge_version}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-light">
                <Clock size={12} />
                创建: {formatTime(session.created_at)}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-light">
                <Clock size={12} />
                更新: {formatTime(session.updated_at)}
              </div>
            </div>
          </div>
        </div>

        {sessionAttachments.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Paperclip size={14} className="text-slate-light" />
              <span className="text-sm font-medium text-navy">附件</span>
              <span className="text-xs text-slate-light">({sessionAttachments.length})</span>
            </div>
            <div className="space-y-2.5">
              {sessionAttachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-2.5"
                >
                  {isImageFile(att.file_type) ? (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald/10">
                      <Image size={18} className="text-emerald" />
                    </div>
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy/5">
                      <FileText size={18} className="text-navy" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-navy">{att.file_name}</p>
                    <p className="text-[10px] text-slate-light">{formatSize(att.file_size)}</p>
                  </div>
                  <button className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-light transition-colors hover:bg-surface hover:text-navy">
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== MIDDLE COLUMN ===== */}
      <div className="col-span-5">
        <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-navy">会话记录</h2>
          <div className="max-h-[calc(100vh-220px)] space-y-4 overflow-y-auto pr-1">
            {messages.length === 0 && (
              <p className="py-8 text-center text-sm text-slate-light">暂无会话记录</p>
            )}
            {messages.map((msg) => {
              const role = roleMap[msg.role] ?? roleMap.agent
              const Icon = role.icon
              const isSystem = msg.role === "system"
              const isCustomer = msg.role === "customer"

              return (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2.5",
                    isSystem && "justify-center",
                    isCustomer && "justify-end"
                  )}
                >
                  {!isSystem && !isCustomer && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy/10">
                      <Icon size={16} className="text-navy" />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3.5 py-2.5",
                      isSystem ? "bg-amber/5" : role.bubbleCls,
                      isCustomer && "rounded-tr-sm",
                      !isSystem && !isCustomer && "rounded-tl-sm"
                    )}
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className={cn("text-xs font-medium", role.labelCls)}>
                        {role.label}
                      </span>
                      <span className="text-[10px] text-slate-light">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-navy/90">
                      {msg.content}
                    </p>
                  </div>
                  {!isSystem && isCustomer && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald/10">
                      <Icon size={16} className="text-emerald" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ===== RIGHT COLUMN ===== */}
      <div className="col-span-4 flex flex-col gap-5">
        {inspection && (
          <>
            <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy">质检评分</h3>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      (resultMap[inspection.result] ?? resultMap.warning).cls
                    )}
                  >
                    {(resultMap[inspection.result] ?? resultMap.warning).label}
                  </span>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-xs font-medium",
                      (processingMap[inspection.processing_result] ?? processingMap.pending).cls
                    )}
                  >
                    {(processingMap[inspection.processing_result] ?? processingMap.pending).label}
                  </span>
                </div>
              </div>

              <div className="mb-4 space-y-2.5">
                {scoreDimensions.map((dim) => (
                  <ScoreBar
                    key={dim.key}
                    label={dim.label}
                    score={inspection[dim.key]}
                    max={dim.max}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-xs text-slate-light">总分</span>
                <span className="text-xl font-bold text-navy">{inspection.total_score}</span>
              </div>

              {inspection.notes && (
                <div className="mt-3 rounded-lg bg-surface p-3">
                  <p className="text-xs text-slate-light">质检备注</p>
                  <p className="mt-1 text-sm text-navy">{inspection.notes}</p>
                </div>
              )}
            </div>

            {sessionHits.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
                <h3 className="mb-3 text-sm font-semibold text-navy">知识库命中</h3>
                <div className="space-y-2">
                  {sessionHits.map((hit) => {
                    const isExpanded = expandedHits.has(hit.id)
                    const hitRole = hitRoleMap[hit.role] ?? hitRoleMap.system
                    return (
                      <div
                        key={hit.id}
                        className="rounded-lg border border-slate-200 transition-colors"
                      >
                        <button
                          onClick={() => toggleHit(hit.id)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", hitRole.cls)}>
                              {hitRole.label}
                            </span>
                            <span className="text-xs font-medium text-navy">
                              {hit.entry_title}
                            </span>
                          </div>
                          {isExpanded ? (
                            <ChevronUp size={14} className="text-slate-light" />
                          ) : (
                            <ChevronDown size={14} className="text-slate-light" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="border-t border-slate-200 px-3 py-2.5">
                            <div className="flex items-center gap-3 text-[10px] text-slate-light">
                              <span className="rounded bg-surface px-1.5 py-0.5 font-medium text-navy">
                                v{hit.knowledge_version}
                              </span>
                              <span>{formatTime(hit.hit_at)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
              <h3 className="mb-3 text-sm font-semibold text-navy">备注与处理</h3>
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="添加质检备注..."
                className="w-full resize-none rounded-lg border border-slate-200 bg-surface px-3 py-2 text-sm text-navy placeholder:text-slate-light focus:border-navy/30 focus:outline-none"
                rows={3}
              />
              <div className="mt-3 flex items-center gap-3">
                <select
                  value={processingResult}
                  onChange={(e) => setProcessingResult(e.target.value as typeof processingResult)}
                  className="rounded-lg border border-slate-200 bg-surface px-3 py-1.5 text-sm text-navy focus:border-navy/30 focus:outline-none"
                >
                  <option value="pending">待处理</option>
                  <option value="resolved">已解决</option>
                  <option value="escalated">已升级</option>
                  <option value="dismissed">已驳回</option>
                </select>
                <button className="rounded-lg bg-navy px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-navy-light">
                  保存
                </button>
              </div>
            </div>
          </>
        )}

        {sessionMods.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-surface-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-navy">修改记录</h3>
            <div className="relative pl-5">
              <div className="absolute bottom-2 left-[7px] top-2 w-px bg-slate-200" />
              {sessionMods.map((mod, idx) => (
                <div key={mod.id} className="relative pb-4 last:pb-0">
                  <div className="absolute -left-5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-navy bg-surface-white" />
                  <div className="rounded-lg border border-slate-200 p-3">
                    <p className="text-xs font-medium text-navy">{mod.field}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="rounded bg-danger-bg px-1.5 py-0.5 text-danger line-through">
                        {mod.old_value}
                      </span>
                      <span className="text-slate-light">→</span>
                      <span className="rounded bg-emerald-bg px-1.5 py-0.5 text-emerald">
                        {mod.new_value}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-light">
                      <span>{mod.modified_by}</span>
                      <span>·</span>
                      <span>{formatTime(mod.modified_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
