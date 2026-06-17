"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import {
  History,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Clock,
  ArrowRightLeft,
  Filter,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { format, parseISO } from "date-fns"
import { cn } from "@/lib/utils"

export default function SettingsHistoryPage() {
  const router = useRouter()
  const { configChangeLogs, systemConfigs, interviewers } = useAppStore()

  const [search, setSearch] = useState("")
  const [filterKey, setFilterKey] = useState("")
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const PAGE_SIZE = 10

  const configKeyLabels: Record<string, string> = {}
  systemConfigs.forEach((c) => {
    configKeyLabels[c.key] = c.description || c.key
  })

  const filtered = useMemo(() => {
    let list = [...configChangeLogs]
    if (search) {
      const s = search.toLowerCase()
      list = list.filter((l) =>
        (l.old_value || "").toLowerCase().includes(s) ||
        (l.new_value || "").toLowerCase().includes(s) ||
        (l.config_key || "").toLowerCase().includes(s) ||
        (configKeyLabels[l.config_key] || "").toLowerCase().includes(s)
      )
    }
    if (filterKey) {
      list = list.filter((l) => l.config_key === filterKey)
    }
    list.sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
    return list
  }, [configChangeLogs, search, filterKey, systemConfigs])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const formatValue = (val: string | undefined) => {
    if (val === undefined || val === "") return "（空）"
    if (val === "true") return "启用"
    if (val === "false") return "停用"
    return val
  }

  const getKeyLabel = (key: string) => configKeyLabels[key] ?? key

  const isBooleanChange = (oldVal?: string, newVal?: string) => {
    const vals = [oldVal, newVal].filter(Boolean)
    return vals.every((v) => v === "true" || v === "false")
  }

  const keyOptions = useMemo(() => {
    const set = new Set(configChangeLogs.map((l) => l.config_key))
    return Array.from(set).sort()
  }, [configChangeLogs])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.push("/admin/settings")}>
            <ChevronLeft className="h-4 w-4" />
            返回设置
          </Button>
          <div className="h-6 w-px bg-slate-200" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">修改记录</h1>
            <p className="text-sm text-slate-500 mt-1">所有系统配置变更的审计日志</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => {
          setSearch("")
          setFilterKey("")
          setPage(1)
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          重置筛选
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">总变更数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{configChangeLogs.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <History className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600">启用操作</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                {configChangeLogs.filter((l) => l.new_value === "true").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <ChevronUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600">停用操作</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                {configChangeLogs.filter((l) => l.new_value === "false").length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <ChevronDown className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">参数修改</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {configChangeLogs.filter((l) => {
                  const vals = [l.old_value, l.new_value].filter(Boolean)
                  return vals.length > 0 && !vals.every((v) => v === "true" || v === "false")
                }).length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">筛选：</span>
          </div>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="搜索配置项或变更值..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">配置项</label>
            <Select
              value={filterKey}
              onChange={(e) => { setFilterKey(e.target.value); setPage(1) }}
              className="w-52"
            >
              <option value="">全部配置项</option>
              {keyOptions.map((k) => (
                <option key={k} value={k}>{getKeyLabel(k)}</option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      <Card className="p-0 overflow-hidden">
        {paged.length === 0 ? (
          <div className="p-16">
            <EmptyState
              icon={<History className="h-12 w-12 text-slate-400" />}
              title="暂无修改记录"
              description={search || filterKey ? "没有匹配筛选条件的变更记录" : "修改配置后变更记录将在此展示"}
            />
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100">
              {paged.map((log) => {
                const isExpanded = expandedId === log.id
                const isBoolean = isBooleanChange(log.old_value, log.new_value)
                const isEnable = log.new_value === "true"
                return (
                  <div key={log.id}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="w-full p-4 sm:p-5 text-left hover:bg-slate-50 transition-colors flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "w-10 h-10 rounded-xl shrink-0 flex items-center justify-center",
                          isBoolean && isEnable && "bg-emerald-100",
                          isBoolean && !isEnable && "bg-red-100",
                          !isBoolean && "bg-blue-100"
                        )}>
                          <ArrowRightLeft className={cn(
                            "h-4 w-4",
                            isBoolean && isEnable && "text-emerald-600",
                            isBoolean && !isEnable && "text-red-600",
                            !isBoolean && "text-blue-600"
                          )} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <h3 className="font-medium text-slate-900">{getKeyLabel(log.config_key)}</h3>
                            <Badge variant="secondary" className="text-[10px]">{log.config_key}</Badge>
                            {isBoolean && (
                              isEnable ? (
                                <Badge variant="default" className="text-[10px] bg-emerald-100 text-emerald-700">启用</Badge>
                              ) : (
                                <Badge variant="destructive" className="text-[10px] bg-red-100 text-red-700">停用</Badge>
                              )
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <User className="h-3.5 w-3.5" />
                              <span>
                                {interviewers.find((i) => i.user_id === log.changed_by)?.name ??
                                  log.changed_by === "current-user" ? "当前管理员" : (log.changed_by ?? "未知用户")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              <span>{format(parseISO(log.changed_at), "yyyy-MM-dd HH:mm:ss")}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                          <span className={cn(
                            "px-2 py-1 rounded-md",
                            isBoolean && log.old_value === "true" ? "bg-emerald-100 text-emerald-700" :
                            isBoolean && log.old_value === "false" ? "bg-red-100 text-red-700" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            {formatValue(log.old_value)}
                          </span>
                          <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                          <span className={cn(
                            "px-2 py-1 rounded-md font-medium",
                            isBoolean && log.new_value === "true" ? "bg-emerald-100 text-emerald-700" :
                            isBoolean && log.new_value === "false" ? "bg-red-100 text-red-700" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {formatValue(log.new_value)}
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-0">
                        <div className="p-4 bg-slate-50 rounded-xl ml-14 space-y-3 text-sm">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">变更前值</p>
                              <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-700">
                                {formatValue(log.old_value)}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">变更后值</p>
                              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 bg-emerald-50/50 font-mono text-xs text-slate-700">
                                {formatValue(log.new_value)}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                            <div>
                              <p className="text-xs text-slate-500 mb-1">配置键名</p>
                              <p className="font-mono text-xs text-slate-700">{log.config_key}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">操作人ID</p>
                              <p className="font-mono text-xs text-slate-700">{log.changed_by ?? "—"}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 mb-1">记录ID</p>
                              <p className="font-mono text-xs text-slate-700 truncate">{log.id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 sm:px-5 py-3">
                <span className="text-sm text-slate-500">
                  共 {filtered.length} 条记录，第 {currentPage}/{totalPages} 页
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={currentPage >= totalPages}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  )
}
