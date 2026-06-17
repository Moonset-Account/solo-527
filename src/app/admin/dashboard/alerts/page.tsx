"use client"

import { useState, useMemo } from "react"
import { useAppStore } from "@/store/app-store"
import type { Alert, UrgencyLevel, AlertType } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  ChevronRight,
  X,
  AlertOctagon,
  CalendarClock,
  FileWarning,
  Bell,
} from "lucide-react"
import { format, parseISO } from "date-fns"

const urgencyConfig: Record<UrgencyLevel, {
  label: string
  badge: "default" | "warning" | "destructive" | "info" | "secondary"
  bg: string
  border: string
  iconColor: string
}> = {
  critical: {
    label: "紧急",
    badge: "destructive",
    bg: "bg-red-50",
    border: "border-red-200",
    iconColor: "text-red-500",
  },
  high: {
    label: "高",
    badge: "warning",
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconColor: "text-amber-500",
  },
  medium: {
    label: "中",
    badge: "info",
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconColor: "text-blue-500",
  },
  low: {
    label: "低",
    badge: "secondary",
    bg: "bg-slate-50",
    border: "border-slate-200",
    iconColor: "text-slate-500",
  },
}

const typeConfig: Record<AlertType, { label: string; icon: typeof AlertTriangle }> = {
  conflict: { label: "时间冲突", icon: CalendarClock },
  score_anomaly: { label: "评分异常", icon: FileWarning },
  overdue: { label: "超时提醒", icon: Clock },
  custom: { label: "系统通知", icon: Bell },
}

export default function AlertsPage() {
  const { alerts, updateAlert, removeAlert, systemConfigs } = useAppStore()

  const moduleEnabled = systemConfigs.find((c) => c.key === "module_quality_dashboard")?.value !== "false"

  const [filterUrgency, setFilterUrgency] = useState("")
  const [filterType, setFilterType] = useState("")
  const [showResolved, setShowResolved] = useState(false)
  const [detailAlert, setDetailAlert] = useState<Alert | null>(null)

  const stats = useMemo(() => {
    const unresolved = alerts.filter((a) => !a.is_resolved)
    return {
      total: alerts.length,
      unresolved: unresolved.length,
      critical: unresolved.filter((a) => a.urgency_level === "critical").length,
      high: unresolved.filter((a) => a.urgency_level === "high").length,
      medium: unresolved.filter((a) => a.urgency_level === "medium").length,
      low: unresolved.filter((a) => a.urgency_level === "low").length,
    }
  }, [alerts])

  const filtered = useMemo(() => {
    let list = [...alerts]
    if (!showResolved) list = list.filter((a) => !a.is_resolved)
    if (filterUrgency) list = list.filter((a) => a.urgency_level === filterUrgency)
    if (filterType) list = list.filter((a) => a.type === filterType)
    list.sort((a, b) => {
      const urgencyOrder = ["critical", "high", "medium", "low"]
      const ua = urgencyOrder.indexOf(a.urgency_level)
      const ub = urgencyOrder.indexOf(b.urgency_level)
      if (ua !== ub) return ua - ub
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return list
  }, [alerts, showResolved, filterUrgency, filterType])

  const handleResolve = (id: string) => {
    updateAlert(id, { is_resolved: true })
    if (detailAlert?.id === id) setDetailAlert(null)
  }

  const handleResolveAll = () => {
    filtered.forEach((a) => {
      if (!a.is_resolved) updateAlert(a.id, { is_resolved: true })
    })
  }

  if (!moduleEnabled) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">预警中心</h1>
        <EmptyState
          icon={<AlertTriangle className="h-8 w-8" />}
          title="模块已禁用"
          description="质量看板模块当前未启用，请联系管理员开启。"
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">预警中心</h1>
          <p className="text-sm text-slate-500 mt-1">处理面试冲突、评分异常等各类预警信息</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResolveAll}
            disabled={stats.unresolved === 0}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            批量处理
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">待处理</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.unresolved}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600">紧急</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.critical}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertOctagon className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-amber-50 border-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600">高优先级</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">{stats.high}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-blue-50 border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600">中优先级</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.medium}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">低优先级</p>
              <p className="text-2xl font-bold text-slate-700 mt-1">{stats.low}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
              <Bell className="h-5 w-5 text-slate-600" />
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
          <div>
            <label className="text-xs text-slate-500 mb-1 block">紧急程度</label>
            <Select
              value={filterUrgency}
              onChange={(e) => setFilterUrgency(e.target.value)}
              className="w-32"
            >
              <option value="">全部</option>
              <option value="critical">紧急</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">预警类型</label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-36"
            >
              <option value="">全部</option>
              <option value="conflict">时间冲突</option>
              <option value="score_anomaly">评分异常</option>
              <option value="overdue">超时提醒</option>
              <option value="custom">系统通知</option>
            </Select>
          </div>
          <div className="ml-auto pt-5">
            <Toggle
              checked={showResolved}
              onChange={setShowResolved}
              label="显示已处理"
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12">
            <EmptyState
              icon={<AlertTriangle className="h-12 w-12 text-emerald-500" />}
              title="暂无预警"
              description={showResolved ? "没有匹配条件的预警记录" : "太棒了，当前没有需要处理的预警！"}
            />
          </Card>
        ) : (
          filtered.map((alert) => {
            const cfg = urgencyConfig[alert.urgency_level]
            const tCfg = typeConfig[alert.type]
            const TypeIcon = tCfg?.icon ?? AlertTriangle
            return (
              <Card
                key={alert.id}
                className={cn(
                  "overflow-hidden transition-all",
                  alert.is_resolved && "opacity-60",
                  !alert.is_resolved && "hover:shadow-md"
                )}
              >
                <div className={cn("border-l-4", cfg.iconColor.replace("text-", "border-"))}>
                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl shrink-0 flex items-center justify-center",
                          cfg.bg
                        )}>
                          <TypeIcon className={cn("h-5 w-5", cfg.iconColor)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant={cfg.badge} className="text-[10px] px-2 py-0.5">
                              {cfg.label}
                            </Badge>
                            <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                              {tCfg?.label ?? alert.type}
                            </Badge>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(alert.created_at), "yyyy-MM-dd HH:mm")}
                            </span>
                            {alert.is_resolved && (
                              <Badge variant="default" className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                已处理
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1">{alert.title}</h3>
                          {alert.description && (
                            <p className="text-sm text-slate-600 line-clamp-2">{alert.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailAlert(alert)}
                        >
                          详情
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        {!alert.is_resolved && (
                          <Button size="sm" onClick={() => handleResolve(alert.id)}>
                            <CheckCircle2 className="h-4 w-4 mr-1.5" />
                            处理
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>

      <Modal
        open={!!detailAlert}
        onClose={() => setDetailAlert(null)}
        title="预警详情"
        className="max-w-lg"
      >
        {detailAlert && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Badge variant={urgencyConfig[detailAlert.urgency_level].badge}>
                {urgencyConfig[detailAlert.urgency_level].label}优先级
              </Badge>
              <Badge variant="secondary">
                {typeConfig[detailAlert.type]?.label ?? detailAlert.type}
              </Badge>
              {detailAlert.is_resolved && (
                <Badge variant="default">已处理</Badge>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{detailAlert.title}</h3>
              <p className="text-slate-600 leading-relaxed">
                {detailAlert.description || "暂无详细描述"}
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">创建时间</span>
                <span className="font-medium text-slate-700">
                  {format(parseISO(detailAlert.created_at), "yyyy年M月d日 HH:mm:ss")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">关联ID</span>
                <span className="font-mono text-slate-700 text-xs">
                  {detailAlert.related_entity_id || "—"}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
              <Button variant="outline" onClick={() => setDetailAlert(null)}>
                <X className="h-4 w-4 mr-1.5" />
                关闭
              </Button>
              {!detailAlert.is_resolved && (
                <Button onClick={() => handleResolve(detailAlert.id)}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  标记已处理
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
