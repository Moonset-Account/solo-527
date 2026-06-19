"use client"

import { useState, useMemo } from "react"
import { Search, BookOpen, FileText, Layers, Users, Tag, ChevronDown, ChevronUp, X } from "lucide-react"
import { mockData } from "@/lib/mock-data"
import type { KnowledgeEntry, KnowledgeHit, KnowledgeVersion } from "@/lib/types"
import { cn } from "@/lib/utils"

const hotSearchTags = ["退货退款", "物流异常", "换货流程", "售后时效", "投诉处理"]

type CategoryFilter = "全部" | "答案" | "教程"

const categoryMap: Record<KnowledgeEntry["category"], CategoryFilter> = {
  answer: "答案",
  tutorial: "教程",
}

const statusConfig: Record<KnowledgeEntry["status"], { label: string; className: string }> = {
  draft: { label: "草稿", className: "bg-amber-bg text-amber" },
  published: { label: "已发布", className: "bg-emerald-bg text-emerald" },
  archived: { label: "已归档", className: "bg-surface text-slate-light" },
}

const categoryBadgeConfig: Record<KnowledgeEntry["category"], { label: string; className: string }> = {
  answer: { label: "答案", className: "bg-navy/10 text-navy" },
  tutorial: { label: "教程", className: "bg-emerald-bg text-emerald" },
}

const roleConfig: Record<KnowledgeHit["role"], { label: string; className: string }> = {
  agent: { label: "客服", className: "bg-navy/10 text-navy" },
  customer: { label: "客户", className: "bg-amber-bg text-amber" },
  system: { label: "系统", className: "bg-surface text-slate-light" },
}

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("全部")
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [expandedVersion, setExpandedVersion] = useState<string | null>(null)

  const filteredEntries = useMemo(() => {
    return mockData.knowledgeEntries.filter((entry) => {
      const matchesCategory =
        selectedCategory === "全部" || categoryMap[entry.category] === selectedCategory
      const q = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !q || entry.title.toLowerCase().includes(q) || entry.content.toLowerCase().includes(q)
      return matchesCategory && matchesSearch
    })
  }, [searchQuery, selectedCategory])

  const selectedEntry = useMemo(() => {
    if (!selectedEntryId) return null
    return mockData.knowledgeEntries.find((e) => e.id === selectedEntryId) ?? null
  }, [selectedEntryId])

  const entryVersions = useMemo(() => {
    if (!selectedEntryId) return []
    return mockData.knowledgeVersions
      .filter((v) => v.entry_id === selectedEntryId)
      .sort((a, b) => b.version - a.version)
  }, [selectedEntryId])

  const entryHits = useMemo(() => {
    if (!selectedEntryId) return []
    return mockData.knowledgeHits.filter((h) => h.entry_id === selectedEntryId)
  }, [selectedEntryId])

  const hitRoleGroups = useMemo(() => {
    const groups: Record<string, KnowledgeHit[]> = { agent: [], customer: [], system: [] }
    entryHits.forEach((h) => {
      if (groups[h.role]) groups[h.role].push(h)
    })
    return Object.entries(groups).filter(([, hits]) => hits.length > 0)
  }, [entryHits])

  const handleHotTagClick = (tag: string) => {
    setSearchQuery(tag)
    setSelectedEntryId(null)
  }

  const handleEntryClick = (id: string) => {
    setSelectedEntryId(id === selectedEntryId ? null : id)
    setExpandedVersion(null)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
  }

  const categories: CategoryFilter[] = ["全部", "答案", "教程"]

  return (
    <div className="flex h-full flex-col gap-6">
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full max-w-2xl items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-light" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setSelectedEntryId(null)
              }}
              placeholder="搜索答案和教程..."
              className="h-12 w-full rounded-xl border border-slate-light/30 bg-surface-white pl-11 pr-10 text-sm shadow-sm outline-none transition-all placeholder:text-slate-light focus:border-navy focus:ring-2 focus:ring-navy/20"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-light transition-colors hover:text-navy"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tag size={14} className="text-slate-light" />
          <span className="text-xs text-slate-light">热门搜索:</span>
          {hotSearchTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleHotTagClick(tag)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                searchQuery === tag
                  ? "bg-navy text-white"
                  : "bg-surface text-slate hover:bg-navy/10 hover:text-navy"
              )}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-surface p-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat)
                setSelectedEntryId(null)
              }}
              className={cn(
                "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
                selectedCategory === cat
                  ? "bg-surface-white text-navy shadow-sm"
                  : "text-slate-light hover:text-navy"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 gap-6">
        <div className={cn("flex-1 transition-all", selectedEntry ? "w-[60%]" : "w-full")}>
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-light">
              <BookOpen size={48} className="mb-4 opacity-40" />
              <p className="text-base font-medium">未找到相关条目</p>
              <p className="mt-1 text-sm">请尝试更换搜索关键词或分类筛选</p>
            </div>
          ) : (
            <div
              className={cn(
                "grid gap-4",
                selectedEntry ? "grid-cols-2" : "grid-cols-3"
              )}
            >
              {filteredEntries.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => handleEntryClick(entry.id)}
                  className={cn(
                    "group flex flex-col gap-3 rounded-xl border bg-surface-white p-5 text-left shadow-sm transition-all hover:shadow-md",
                    selectedEntryId === entry.id
                      ? "border-navy ring-2 ring-navy/20"
                      : "border-transparent hover:border-navy/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold leading-snug text-navy-dark group-hover:text-navy">
                      {entry.title}
                    </h3>
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                        categoryBadgeConfig[entry.category].className
                      )}
                    >
                      {categoryBadgeConfig[entry.category].label}
                    </span>
                  </div>

                  <p className="line-clamp-2 text-xs leading-relaxed text-slate-light">
                    {entry.content}
                  </p>

                  <div className="mt-auto flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1 rounded bg-navy/5 px-2 py-0.5 text-xs font-medium text-navy">
                      <Layers size={11} />
                      v{entry.version}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded bg-surface px-2 py-0.5 text-xs font-medium text-slate">
                      <Users size={11} />
                      {entry.hit_count}
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded px-2 py-0.5 text-xs font-medium",
                        statusConfig[entry.status].className
                      )}
                    >
                      {statusConfig[entry.status].label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEntry && (
          <div className="w-[40%] shrink-0">
            <div className="sticky top-0 flex max-h-[calc(100vh-12rem)] flex-col gap-5 overflow-y-auto rounded-xl border border-navy/10 bg-surface-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-navy-dark">{selectedEntry.title}</h2>
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={cn(
                        "rounded-md px-2 py-0.5 text-xs font-medium",
                        categoryBadgeConfig[selectedEntry.category].className
                      )}
                    >
                      {categoryBadgeConfig[selectedEntry.category].label}
                    </span>
                    <span className="rounded bg-navy/5 px-2 py-0.5 text-xs font-medium text-navy">
                      v{selectedEntry.version}
                    </span>
                    <span
                      className={cn(
                        "rounded px-2 py-0.5 text-xs font-medium",
                        statusConfig[selectedEntry.status].className
                      )}
                    >
                      {statusConfig[selectedEntry.status].label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntryId(null)}
                  className="rounded-lg p-1.5 text-slate-light transition-colors hover:bg-surface hover:text-navy"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="rounded-lg bg-surface p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-navy">
                  <FileText size={14} />
                  条目内容
                </div>
                <p className="text-sm leading-relaxed text-slate">{selectedEntry.content}</p>
              </div>

              {entryVersions.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-navy">
                    <Layers size={14} />
                    版本历史
                  </div>
                  <div className="relative ml-3 border-l-2 border-navy/15 pl-5">
                    {entryVersions.map((ver, idx) => {
                      const isExpanded = expandedVersion === ver.id
                      return (
                        <div key={ver.id} className="relative pb-4 last:pb-0">
                          <div className="absolute -left-[calc(1.25rem+5px)] top-0 h-3 w-3 rounded-full border-2 border-navy bg-surface-white" />
                          <button
                            onClick={() => setExpandedVersion(isExpanded ? null : ver.id)}
                            className="w-full rounded-lg bg-surface p-3 text-left transition-colors hover:bg-navy/5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-navy">v{ver.version}</span>
                                <span className="text-xs text-slate-light">
                                  {ver.diff_summary}
                                </span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp size={14} className="text-slate-light" />
                              ) : (
                                <ChevronDown size={14} className="text-slate-light" />
                              )}
                            </div>
                            {isExpanded && (
                              <div className="mt-2 space-y-1 border-t border-navy/10 pt-2">
                                <p className="text-xs text-slate">{ver.content}</p>
                                <div className="flex items-center gap-3 text-xs text-slate-light">
                                  <span>发布者: {ver.published_by}</span>
                                  <span>{formatTime(ver.published_at)}</span>
                                </div>
                              </div>
                            )}
                            {!isExpanded && (
                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-light">
                                <span>{ver.published_by}</span>
                                <span>{formatTime(ver.published_at)}</span>
                              </div>
                            )}
                          </button>
                        </div>
                    )
                    })}
                  </div>
                </div>
              )}

              {hitRoleGroups.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-navy">
                    <Users size={14} />
                    命中记录
                    <span className="rounded-full bg-navy/10 px-2 py-0.5 text-xs font-medium text-navy">
                      {entryHits.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {hitRoleGroups.map(([role, hits]) => (
                      <div key={role} className="rounded-lg border border-navy/5 p-3">
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={cn(
                              "rounded px-2 py-0.5 text-xs font-medium",
                              roleConfig[role as KnowledgeHit["role"]].className
                            )}
                          >
                            {roleConfig[role as KnowledgeHit["role"]].label}
                          </span>
                          <span className="text-xs text-slate-light">{hits.length} 次命中</span>
                        </div>
                        <div className="space-y-2">
                          {hits.map((hit) => (
                            <div
                              key={hit.id}
                              className="flex items-center justify-between rounded-md bg-surface px-3 py-2"
                            >
                              <span className="text-xs font-medium text-navy">
                                {hit.session_id}
                              </span>
                              <span className="text-xs text-slate-light">
                                {formatTime(hit.hit_at)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
