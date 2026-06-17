"use client"

import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import {
  Settings,
  BookOpen,
  Target,
  Calendar,
  UserCheck,
  Award,
  BarChart3,
  History,
  Bell,
  ChevronRight,
  Save,
  AlertCircle,
  Layers,
  Clock,
  AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface ModuleGroup {
  title: string
  description: string
  items: {
    key: string
    label: string
    description: string
    icon: typeof BookOpen
    color: string
    defaultValue?: string
  }[]
}

const moduleGroups: ModuleGroup[] = [
  {
    title: "业务模块",
    description: "控制各个核心业务模块的启用和停用",
    items: [
      { key: "module_question_bank", label: "题库管理", description: "维护面试题目分类、难度和评分标准关联", icon: BookOpen, color: "emerald", defaultValue: "true" },
      { key: "module_scoring_standards", label: "评分标准", description: "定义各岗位评分维度、权重和等级描述", icon: Target, color: "blue", defaultValue: "true" },
      { key: "module_interview_scheduling", label: "面试安排", description: "日历视图管理面试排期，支持冲突检测", icon: Calendar, color: "purple", defaultValue: "true" },
      { key: "module_instructor_availability", label: "讲师档期", description: "设置面试官可用时段、请假和忙碌标记", icon: UserCheck, color: "amber", defaultValue: "true" },
      { key: "module_hiring_results", label: "录用结果", description: "记录面试结论，统计各部门录用率", icon: Award, color: "rose", defaultValue: "true" },
      { key: "module_quality_dashboard", label: "质量看板", description: "面试质量数据统计、趋势分析和预警中心", icon: BarChart3, color: "cyan", defaultValue: "true" },
    ],
  },
  {
    title: "提醒开关",
    description: "配置各类提醒通知的启用状态",
    items: [
      { key: "reminder_conflict_detection", label: "面试冲突检测提醒", description: "自动检测面试官时间冲突并预警", icon: AlertTriangle, color: "red", defaultValue: "true" },
      { key: "reminder_score_anomaly", label: "评分异常提醒", description: "面试官评分显著偏离平均分自动预警", icon: AlertCircle, color: "orange", defaultValue: "true" },
      { key: "reminder_overdue_scoring", label: "超时未评分提醒", description: "面试完成后24小时未提交评分自动提醒", icon: Clock, color: "indigo", defaultValue: "true" },
    ],
  },
]

export default function SettingsPage() {
  const router = useRouter()
  const {
    systemConfigs,
    updateSystemConfig,
    addSystemConfig,
    addConfigChangeLog,
    configChangeLogs,
  } = useAppStore()

  const [savedKey, setSavedKey] = useState<string | null>(null)
  const [valueOverrides, setValueOverrides] = useState<Record<string, string>>({})

  const getConfigValue = (key: string, defaultVal: string = "false") => {
    if (valueOverrides[key] !== undefined) return valueOverrides[key]
    return systemConfigs.find((c) => c.key === key)?.value ?? defaultVal
  }

  const handleToggle = (key: string, currentValue: string, label: string) => {
    const newValue = currentValue === "true" ? "false" : "true"
    setValueOverrides((prev) => ({ ...prev, [key]: newValue }))
    setSavedKey(key)
    setTimeout(() => setSavedKey(null), 1500)

    const existing = systemConfigs.find((c) => c.key === key)
    if (existing) {
      updateSystemConfig(existing.id, {
        value: newValue,
        updated_at: new Date().toISOString(),
      })
    } else {
      addSystemConfig({
        id: `sc-${Date.now()}`,
        key,
        value: newValue,
        description: label,
        is_toggleable: true,
        updated_at: new Date().toISOString(),
      })
    }

    addConfigChangeLog({
      id: `cl-${Date.now()}`,
      config_key: key,
      old_value: currentValue,
      new_value: newValue,
      changed_by: "current-user",
      changed_at: new Date().toISOString(),
    })
  }

  const handleNumberChange = (key: string, oldValue: string, newValue: string) => {
    setValueOverrides((prev) => ({ ...prev, [key]: newValue }))
    const existing = systemConfigs.find((c) => c.key === key)
    if (existing) {
      updateSystemConfig(existing.id, {
        value: newValue,
        updated_at: new Date().toISOString(),
      })
    }
    addConfigChangeLog({
      id: `cl-${Date.now()}`,
      config_key: key,
      old_value: oldValue,
      new_value: newValue,
      changed_by: "current-user",
      changed_at: new Date().toISOString(),
    })
  }

  const navItems = [
    { label: "修改记录", icon: History, href: "/admin/settings/history", count: configChangeLogs.length },
    { label: "提醒规则", icon: Bell, href: "/admin/settings/reminders" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">系统设置</h1>
          <p className="text-sm text-slate-500 mt-1">配置功能模块开关、系统参数和提醒规则</p>
        </div>
        <div className="flex items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Button key={item.href} variant="outline" onClick={() => router.push(item.href)}>
                <Icon className="h-4 w-4 mr-2" />
                {item.label}
                {item.count !== undefined && (
                  <Badge variant="secondary" className="ml-2">{item.count}</Badge>
                )}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )
          })}
        </div>
      </div>

      {moduleGroups.map((group) => (
        <Card key={group.title}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-slate-400" />
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </div>
                <p className="text-sm text-slate-500 mt-1">{group.description}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100">
            {group.items.map((item) => {
              const currentVal = getConfigValue(item.key, item.defaultValue ?? "false")
              const isEnabled = currentVal === "true"
              const Icon = item.icon
              const isSaving = savedKey === item.key
              return (
                <div
                  key={item.key}
                  className={cn(
                    "flex items-start justify-between py-4 gap-4 transition-colors",
                    isSaving && "bg-emerald-50 -mx-6 px-6 rounded-xl"
                  )}
                >
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={cn(
                      "w-11 h-11 rounded-xl shrink-0 flex items-center justify-center",
                      isEnabled ? `bg-${item.color}-100` : "bg-slate-100"
                    )}>
                      <Icon className={cn(
                        "h-5 w-5",
                        isEnabled ? `text-${item.color}-600` : "text-slate-400"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-slate-900">{item.label}</h3>
                        {isEnabled ? (
                          <Badge variant="default" className="text-[10px]">已启用</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">已停用</Badge>
                        )}
                        {isSaving && (
                          <span className="flex items-center gap-1 text-xs text-emerald-600">
                            <Save className="h-3 w-3" />
                            已保存
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Toggle
                      checked={isEnabled}
                      onChange={() => handleToggle(item.key, currentVal, item.label)}
                      size="lg"
                    />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <div className="flex items-start gap-2">
            <Settings className="h-5 w-5 text-slate-400" />
            <div>
              <CardTitle className="text-base">系统参数</CardTitle>
              <p className="text-sm text-slate-500 mt-1">配置系统级别的数值参数</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {[
            { key: "system_max_interview_per_day", label: "每位面试官每日最大面试数", description: "超过此数量的排期将触发预警", unit: "场/天", min: 1, max: 20, defaultValue: "4" },
            { key: "system_scoring_overdue_hours", label: "评分逾期时长", description: "面试完成后超过此时长未评分将触发提醒", unit: "小时", min: 1, max: 168, defaultValue: "24" },
            { key: "system_score_anomaly_threshold", label: "评分异常阈值", description: "单场面试评分低于平均分此百分比视为异常", unit: "%", min: 5, max: 50, defaultValue: "20" },
            { key: "system_reminder_lead_minutes", label: "面试提前提醒时间", description: "面试开始前此分钟数发送提醒通知", unit: "分钟", min: 5, max: 120, defaultValue: "30" },
          ].map((item) => {
            const existing = systemConfigs.find((c) => c.key === item.key)
            const value = getConfigValue(item.key, existing?.value ?? item.defaultValue)
            return (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-slate-900">{item.label}</h3>
                  <p className="text-sm text-slate-500 mt-1">{item.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={item.min}
                      max={item.max}
                      value={value}
                      onChange={(e) => handleNumberChange(item.key, value, e.target.value)}
                      className="w-20"
                    />
                    <span className="text-sm text-slate-500">{item.unit}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => router.push("/admin/settings/history")}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                <History className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900">配置修改记录</h3>
              <p className="text-sm text-slate-500 mt-1">查看所有配置变更的审计日志，包含操作人、时间和变更内容</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </button>

        <button
          onClick={() => router.push("/admin/settings/reminders")}
          className="text-left p-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-semibold text-slate-900">提醒规则配置</h3>
              <p className="text-sm text-slate-500 mt-1">配置面试冲突、超时、异常等提醒规则和紧急程度分级</p>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
          </div>
        </button>
      </div>
    </div>
  )
}
