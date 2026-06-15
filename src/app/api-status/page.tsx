'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  RefreshCw,
  Database,
  Shield,
  HardDrive,
  Radio,
  Globe,
  FileStack,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import type { ApiStatusRecord, ApiStatusType } from '@/types'
import { API_STATUS_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const SERVICE_ICONS: Record<string, React.ElementType> = {
  'Supabase Auth': Shield,
  'PostgreSQL': Database,
  'Supabase Storage': HardDrive,
  'Supabase Realtime': Radio,
  'API Gateway': Globe,
  '文件服务': FileStack,
}

const MOCK_SERVICES: ApiStatusRecord[] = [
  { id: '1', service_name: 'Supabase Auth', status: 'healthy', response_time_ms: 45, checked_at: '2024-12-14T10:00:00Z' },
  { id: '2', service_name: 'PostgreSQL', status: 'healthy', response_time_ms: 12, checked_at: '2024-12-14T10:00:00Z' },
  { id: '3', service_name: 'Supabase Storage', status: 'degraded', response_time_ms: 320, checked_at: '2024-12-14T10:00:00Z' },
  { id: '4', service_name: 'Supabase Realtime', status: 'healthy', response_time_ms: 78, checked_at: '2024-12-14T10:00:00Z' },
  { id: '5', service_name: 'API Gateway', status: 'healthy', response_time_ms: 23, checked_at: '2024-12-14T10:00:00Z' },
  { id: '6', service_name: '文件服务', status: 'healthy', response_time_ms: 56, checked_at: '2024-12-14T10:00:00Z' },
]

const MOCK_TREND = Array.from({ length: 24 }, (_, i) => ({
  time: `${String(i).padStart(2, '0')}:00`,
  'Supabase Auth': 40 + Math.random() * 30,
  PostgreSQL: 10 + Math.random() * 15,
  'Supabase Storage': i >= 18 ? 200 + Math.random() * 200 : 80 + Math.random() * 50,
  'Supabase Realtime': 60 + Math.random() * 40,
  'API Gateway': 18 + Math.random() * 20,
  '文件服务': 40 + Math.random() * 35,
}))

const STATUS_DOT: Record<ApiStatusType, string> = {
  healthy: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
}

const STATUS_BADGE: Record<ApiStatusType, 'success' | 'warning' | 'danger'> = {
  healthy: 'success',
  degraded: 'warning',
  down: 'danger',
}

const OVERALL_COLORS: Record<string, string> = {
  all_healthy: 'bg-emerald-500 shadow-emerald-200',
  has_degraded: 'bg-amber-500 shadow-amber-200',
  has_down: 'bg-red-500 shadow-red-200',
}

export default function ApiStatusPage() {
  const [services] = useState<ApiStatusRecord[]>(MOCK_SERVICES)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [countdown, setCountdown] = useState(30)

  const overallStatus = services.some((s) => s.status === 'down')
    ? 'has_down'
    : services.some((s) => s.status === 'degraded')
      ? 'has_degraded'
      : 'all_healthy'

  const overallLabel =
    overallStatus === 'all_healthy'
      ? '系统运行正常'
      : overallStatus === 'has_degraded'
        ? '部分服务降级'
        : '服务故障'

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setLastRefresh(new Date())
          return 30
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">服务状态</h1>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            <span>每30秒刷新 · {countdown}s</span>
          </div>
        </div>

        <div className="card flex items-center gap-6">
          <div className="relative">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center shadow-lg',
                OVERALL_COLORS[overallStatus]
              )}
            >
              <Activity className="w-9 h-9 text-white" />
            </div>
            <div
              className={cn(
                'absolute inset-0 w-20 h-20 rounded-full animate-pulse-ring',
                OVERALL_COLORS[overallStatus]
              )}
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{overallLabel}</h2>
            <p className="text-sm text-slate-500 mt-1">
              上次刷新: {lastRefresh.toLocaleTimeString('zh-CN')}
            </p>
            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                正常 {services.filter((s) => s.status === 'healthy').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                降级 {services.filter((s) => s.status === 'degraded').length}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                故障 {services.filter((s) => s.status === 'down').length}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const Icon = SERVICE_ICONS[svc.service_name] ?? Activity
            return (
              <div key={svc.id} className="card-hover">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="w-4.5 h-4.5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{svc.service_name}</h3>
                    </div>
                  </div>
                  <StatusBadge variant={STATUS_BADGE[svc.status]}>
                    {API_STATUS_LABELS[svc.status]}
                  </StatusBadge>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>响应时间: <span className="font-medium text-slate-700">{svc.response_time_ms}ms</span></span>
                  <span>{new Date(svc.checked_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={cn('w-2 h-2 rounded-full', STATUS_DOT[svc.status])} />
                  <span className="text-xs text-slate-500">
                    {svc.status === 'healthy' ? '运行正常' : svc.status === 'degraded' ? '响应延迟' : '服务不可用'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card">
          <h3 className="section-title mb-4">响应时间趋势（近24小时）</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} interval={3} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  label={{ value: 'ms', position: 'insideTopLeft', offset: -5, fontSize: 11, fill: '#94a3b8' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="Supabase Auth" stroke="#0f766e" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="PostgreSQL" stroke="#6366f1" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Supabase Storage" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="Supabase Realtime" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="API Gateway" stroke="#06b6d4" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="文件服务" stroke="#ec4899" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
