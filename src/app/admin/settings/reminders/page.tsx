"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import type { ReminderRule, UrgencyLevel, AlertType } from "@/types/database"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/ui/empty-state"
import {
  Bell,
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  AlertOctagon,
  AlertTriangle,
  Info,
  CircleDot,
  Mail,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Clock,
  Save,
  Target,
} from "lucide-react"
import { format, parseISO } from "date-fns"

const urgencyConfig: Record<UrgencyLevel, {
  label: string
  badge: "default" | "warning" | "destructive" | "info" | "secondary"
  bg: string
  border: string
  text: string
  icon: typeof AlertOctagon
}> = {
  critical: {
    label: "紧急",
    badge: "destructive",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    icon: AlertOctagon,
  },
  high: {
    label: "高",
    badge: "warning",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    icon: AlertTriangle,
  },
  medium: {
    label: "中",
    badge: "info",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    icon: Info,
  },
  low: {
    label: "低",
    badge: "secondary",
    bg: "bg-slate-50",
    border: "border-slate-200",
    text: "text-slate-700",
    icon: CircleDot,
  },
}

const channelConfig = {
  email: { label: "邮件", icon: Mail },
  in_app: { label: "站内", icon: MessageSquare },
  sms: { label: "短信", icon: Smartphone },
} as const

const ruleTypeConfig: Record<AlertType, { label: string; description: string; icon: typeof AlertTriangle }> = {
  conflict: { label: "时间冲突", description: "检测面试官面试时间安排冲突", icon: AlertTriangle },
  score_anomaly: { label: "评分异常", description: "检测面试官评分异常偏离", icon: Target },
  overdue: { label: "超时提醒", description: "检测面试评分超时未完成", icon: Clock },
  custom: { label: "自定义", description: "自定义提醒规则", icon: Bell },
}

interface RuleForm {
  name: string
  rule_type: AlertType
  trigger_condition: string
  urgency_level: UrgencyLevel
  notify_channels: string[]
  is_active: boolean
  config: Record<string, string | number | boolean>
}

const defaultForm: RuleForm = {
  name: "",
  rule_type: "conflict",
  trigger_condition: "",
  urgency_level: "medium",
  notify_channels: ["in_app"],
  is_active: true,
  config: {},
}

export default function RemindersPage() {
  const router = useRouter()
  const {
    reminderRules,
    addReminderRule,
    updateReminderRule,
    deleteReminderRule,
    alerts,
  } = useAppStore()

  const [filterUrgency, setFilterUrgency] = useState("")
  const [filterType, setFilterType] = useState("")
  const [showActive, setShowActive] = useState<string>("all")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<RuleForm>(defaultForm)

  const stats = useMemo(() => {
    const active = reminderRules.filter((r) => r.is_active).length
    const counts: Record<UrgencyLevel, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    reminderRules.forEach((r) => counts[r.urgency_level]++)
    return {
      total: reminderRules.length,
      active,
      inactive: reminderRules.length - active,
      ...counts,
    }
  }, [reminderRules])

  const filtered = useMemo(() => {
    let list = [...reminderRules]
    if (filterUrgency) list = list.filter((r) => r.urgency_level === filterUrgency)
    if (filterType) list = list.filter((r) => r.rule_type === filterType)
    if (showActive === "active") list = list.filter((r) => r.is_active)
    if (showActive === "inactive") list = list.filter((r) => !r.is_active)
    const order: UrgencyLevel[] = ["critical", "high", "medium", "low"]
    list.sort((a, b) => order.indexOf(a.urgency_level) - order.indexOf(b.urgency_level))
    return list
  }, [reminderRules, filterUrgency, filterType, showActive])

  const openAdd = () => {
    setEditingId(null)
    setForm(defaultForm)
    setShowModal(true)
  }

  const openEdit = (rule: ReminderRule) => {
    setEditingId(rule.id)
    setForm({
      name: rule.name,
      rule_type: rule.rule_type,
      trigger_condition: rule.trigger_condition,
      urgency_level: rule.urgency_level,
      notify_channels: [...rule.notify_channels],
      is_active: rule.is_active,
      config: rule.config ? { ...rule.config } : {},
    })
    setShowModal(true)
  }

  const handleSimulate = (rule: ReminderRule) => {
    const newAlert = {
      id: `al-${Date.now()}`,
      type: rule.rule_type,
      urgency_level: rule.urgency_level,
      title: `【模拟】${rule.name}`,
      description: `这是一条模拟触发的预警，用于测试提醒规则：${rule.trigger_condition}`,
      is_resolved: false,
      created_at: new Date().toISOString(),
    }
    useAppStore.getState().addAlert(newAlert)
  }

  const handleSave = () => {
    if (!form.name.trim() || !form.trigger_condition.trim()) return
    if (editingId) {
      updateReminderRule(editingId, { ...form })
    } else {
      addReminderRule({
        id: `rr-${Date.now()}`,
        ...form,
        created_at: new Date().toISOString(),
      })
    }
    setShowModal(false)
  }

  const toggleChannel = (channel: string) => {
    setForm((f) => ({
      ...f,
      notify_channels: f.notify_channels.includes(channel)
        ? f.notify_channels.filter((c) => c !== channel)
        : [...f.notify_channels, channel],
    }))
  }

  const updateConfig = (key: string, value: string | number | boolean) => {
    setForm((f) => ({
      ...f,
      config: { ...f.config, [key]: value },
    }))
  }

  const handleRuleTypeChange = (type: AlertType) => {
    const defaultConfigs: Record<AlertType, Record<string, string | number | boolean>> = {
      conflict: { check_overlap: true, min_gap_minutes: 15 },
      score_anomaly: { threshold_percent: 20, min_interviews: 5 },
      overdue: { overdue_hours: 24, repeat: true, repeat_interval_hours: 12 },
      custom: {},
    }
    setForm((f) => ({
      ...f,
      rule_type: type,
      config: { ...defaultConfigs[type] },
    }))
  }

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
            <h1 className="text-2xl font-bold text-slate-900">提醒规则</h1>
            <p className="text-sm text-slate-500 mt-1">配置面试冲突、评分异常等提醒规则及紧急程度分级</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            模拟触发
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4 mr-2" />
            新建规则
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">规则总数</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Target className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-emerald-50 border-emerald-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-600">已启用</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.active}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Bell className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-slate-50 border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">已停用</p>
              <p className="text-2xl font-bold text-slate-600 mt-1">{stats.inactive}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
              <Bell className="h-5 w-5 text-slate-500" />
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
              <p className="text-xs text-blue-600">中/低</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.medium + stats.low}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Info className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-slate-400" />
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
            <label className="text-xs text-slate-500 mb-1 block">规则类型</label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-32"
            >
              <option value="">全部</option>
              <option value="conflict">时间冲突</option>
              <option value="score_anomaly">评分异常</option>
              <option value="overdue">超时提醒</option>
              <option value="custom">自定义</option>
            </Select>
          </div>
          <div>
            <label className="text-xs text-slate-500 mb-1 block">状态</label>
            <Select
              value={showActive}
              onChange={(e) => setShowActive(e.target.value)}
              className="w-32"
            >
              <option value="all">全部</option>
              <option value="active">已启用</option>
              <option value="inactive">已停用</option>
            </Select>
          </div>
          <div className="ml-auto pt-5 text-sm text-slate-500">
            当前触发预警：
            <Badge variant="destructive" className="ml-2">
              {alerts.filter((a) => !a.is_resolved).length}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card className="p-16">
            <EmptyState
              icon={<Bell className="h-12 w-12 text-slate-400" />}
              title="暂无提醒规则"
              description="点击右上角新建规则按钮创建提醒规则"
            />
          </Card>
        ) : (
          filtered.map((rule) => {
            const cfg = urgencyConfig[rule.urgency_level]
            const UrgencyIcon = cfg.icon
            const typeCfg = ruleTypeConfig[rule.rule_type]
            return (
              <Card
                key={rule.id}
                className={cn(
                  "overflow-hidden transition-all",
                  !rule.is_active && "opacity-60"
                )}
              >
                <div className={cn("border-l-4", cfg.border.replace("border-", "border-l-"))}>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        <div className={cn(
                          "w-12 h-12 rounded-xl shrink-0 flex items-center justify-center",
                          cfg.bg,
                          cfg.border,
                          "border"
                        )}>
                          <UrgencyIcon className={cn("h-6 w-6", cfg.text)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                            <Badge variant="secondary" className="text-[10px]">
                              {typeCfg.label}
                            </Badge>
                            <Badge variant={cfg.badge} className="text-[10px]">
                              {cfg.label}
                            </Badge>
                            {rule.is_active ? (
                              <Badge variant="default" className="text-[10px]">已启用</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">已停用</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                            <span className="font-medium text-slate-700">触发条件：</span>
                            {rule.trigger_condition}
                          </p>
                          {rule.config && Object.keys(rule.config).length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {Object.entries(rule.config).map(([key, value]) => (
                                <Badge key={key} variant="outline" className="text-[10px]">
                                  {key}: {String(value)}
                                </Badge>
                              ))}
                            </div>
                          )}
                          <div className="flex flex-wrap items-center gap-4 text-xs">
                            <div className="flex items-center gap-1.5">
                              <Clock className="h-3.5 w-3.5 text-slate-400" />
                              <span className="text-slate-500">
                                创建于 {format(parseISO(rule.created_at), "yyyy-MM-dd")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-500">通知渠道：</span>
                              <div className="flex items-center gap-1">
                                {rule.notify_channels.map((ch) => {
                                  const cc = channelConfig[ch as keyof typeof channelConfig]
                                  if (!cc) return null
                                  const ChIcon = cc.icon
                                  return (
                                    <Badge key={ch} variant="info" className="text-[10px]">
                                      <ChIcon className="h-3 w-3 mr-1" />
                                      {cc.label}
                                    </Badge>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Toggle
                          checked={rule.is_active}
                          onChange={(v) => updateReminderRule(rule.id, { is_active: v })}
                        />
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleSimulate(rule)} title="模拟触发">
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                            <Pencil className="h-3.5 w-3.5" />
                            编辑
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deleteReminderRule(rule.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
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
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? "编辑提醒规则" : "新建提醒规则"}
        className="max-w-xl"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">规则名称 *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="如：面试时间冲突提醒"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">规则类型</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(ruleTypeConfig) as AlertType[]).map((type) => {
                const cfg = ruleTypeConfig[type]
                const TIcon = cfg.icon
                const isSelected = form.rule_type === type
                return (
                  <button
                    key={type}
                    onClick={() => handleRuleTypeChange(type)}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <TIcon className={cn("h-5 w-5", isSelected ? "text-emerald-600" : "text-slate-400")} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? "text-emerald-700" : "text-slate-600"
                    )}>
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">触发条件描述 *</label>
            <Textarea
              value={form.trigger_condition}
              onChange={(e) => setForm((f) => ({ ...f, trigger_condition: e.target.value }))}
              placeholder="如：同一面试官在同一时段有多场面试安排"
              rows={3}
            />
          </div>

          {form.rule_type === "conflict" && (
            <Card className="bg-slate-50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm text-slate-700">冲突检测配置</h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">检测时间重叠</span>
                  <Toggle
                    checked={Boolean(form.config.check_overlap)}
                    onChange={(v) => updateConfig("check_overlap", v)}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 shrink-0">最小间隔</label>
                  <Input
                    type="number"
                    min={0}
                    value={Number(form.config.min_gap_minutes ?? 15)}
                    onChange={(e) => updateConfig("min_gap_minutes", Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">分钟</span>
                </div>
              </CardContent>
            </Card>
          )}

          {form.rule_type === "score_anomaly" && (
            <Card className="bg-slate-50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm text-slate-700">评分异常配置</h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 shrink-0">异常阈值</label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={Number(form.config.threshold_percent ?? 20)}
                    onChange={(e) => updateConfig("threshold_percent", Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 shrink-0">最小样本</label>
                  <Input
                    type="number"
                    min={1}
                    value={Number(form.config.min_interviews ?? 5)}
                    onChange={(e) => updateConfig("min_interviews", Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">场面试</span>
                </div>
              </CardContent>
            </Card>
          )}

          {form.rule_type === "overdue" && (
            <Card className="bg-slate-50">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-sm text-slate-700">超时提醒配置</h4>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-slate-600 shrink-0">超时时间</label>
                  <Input
                    type="number"
                    min={1}
                    value={Number(form.config.overdue_hours ?? 24)}
                    onChange={(e) => updateConfig("overdue_hours", Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-slate-500">小时</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">重复提醒</span>
                  <Toggle
                    checked={Boolean(form.config.repeat)}
                    onChange={(v) => updateConfig("repeat", v)}
                  />
                </div>
                {form.config.repeat && (
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600 shrink-0">重复间隔</label>
                    <Input
                      type="number"
                      min={1}
                      value={Number(form.config.repeat_interval_hours ?? 12)}
                      onChange={(e) => updateConfig("repeat_interval_hours", Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-500">小时</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">紧急程度</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(urgencyConfig) as UrgencyLevel[]).map((level) => {
                const cfg = urgencyConfig[level]
                const LIcon = cfg.icon
                const isSelected = form.urgency_level === level
                return (
                  <button
                    key={level}
                    onClick={() => setForm((f) => ({ ...f, urgency_level: level }))}
                    className={cn(
                      "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                      isSelected
                        ? `${cfg.border} ${cfg.bg}`
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <LIcon className={cn("h-5 w-5", isSelected ? cfg.text : "text-slate-400")} />
                    <span className={cn(
                      "text-sm font-medium",
                      isSelected ? cfg.text : "text-slate-600"
                    )}>
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">通知渠道</label>
            <div className="flex flex-wrap items-center gap-2">
              {(Object.keys(channelConfig) as (keyof typeof channelConfig)[]).map((ch) => {
                const cc = channelConfig[ch]
                const CIcon = cc.icon
                const isSelected = form.notify_channels.includes(ch)
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all",
                      isSelected
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <CIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{cc.label}</span>
                    {isSelected && <Save className="h-3.5 w-3.5" />}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <Toggle
              checked={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              label="创建后立即启用"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowModal(false)}>取消</Button>
            <Button
              onClick={handleSave}
              disabled={!form.name.trim() || !form.trigger_condition.trim() || form.notify_channels.length === 0}
            >
              {editingId ? "保存修改" : "创建规则"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
