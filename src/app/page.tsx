'use client'

import { useAppStore } from '@/store'
import { ROLE_LABELS, STATUS_LABELS, type Booking, type UserRole } from '@/types'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  CalendarCheck,
  Cpu,
  Archive,
  ShieldCheck,
  Clock,
  Plus,
  FileUp,
  Settings,
  BarChart3,
  FlaskConical,
} from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const recentBookings: Booking[] = [
  {
    id: 'b1',
    user_id: '1',
    instrument_id: 'inst-1',
    station_id: 'st-1',
    project_id: 'p-1',
    start_time: '2026-06-15T09:00:00',
    end_time: '2026-06-15T12:00:00',
    status: 'confirmed',
    notes: '蛋白质分析',
    created_at: '2026-06-14T10:30:00',
    instrument: { id: 'inst-1', name: '高效液相色谱仪', category: '分析仪器', status: 'in_use', teacher_id: '4', location: 'A301', specifications: {}, created_at: '' },
    station: { id: 'st-1', name: '台位1', instrument_id: 'inst-1', status: 'occupied', created_at: '' },
  },
  {
    id: 'b2',
    user_id: '1',
    instrument_id: 'inst-2',
    station_id: 'st-2',
    project_id: 'p-2',
    start_time: '2026-06-15T14:00:00',
    end_time: '2026-06-15T17:00:00',
    status: 'pending',
    notes: '纳米材料表征',
    created_at: '2026-06-14T15:20:00',
    instrument: { id: 'inst-2', name: '透射电子显微镜', category: '显微设备', status: 'available', teacher_id: '4', location: 'B205', specifications: {}, created_at: '' },
    station: { id: 'st-2', name: '台位1', instrument_id: 'inst-2', status: 'available', created_at: '' },
  },
  {
    id: 'b3',
    user_id: '2',
    instrument_id: 'inst-3',
    station_id: 'st-3',
    project_id: 'p-1',
    start_time: '2026-06-15T08:00:00',
    end_time: '2026-06-15T10:00:00',
    status: 'completed',
    notes: '细胞培养观察',
    created_at: '2026-06-13T09:00:00',
    instrument: { id: 'inst-3', name: '荧光显微镜', category: '显微设备', status: 'available', teacher_id: '4', location: 'C102', specifications: {}, created_at: '' },
    station: { id: 'st-3', name: '台位2', instrument_id: 'inst-3', status: 'available', created_at: '' },
  },
  {
    id: 'b4',
    user_id: '1',
    instrument_id: 'inst-4',
    station_id: 'st-4',
    project_id: 'p-3',
    start_time: '2026-06-15T10:00:00',
    end_time: '2026-06-15T11:30:00',
    status: 'cancelled',
    notes: '光谱检测（已取消）',
    created_at: '2026-06-12T14:00:00',
    instrument: { id: 'inst-4', name: '紫外分光光度计', category: '光谱仪器', status: 'available', teacher_id: '4', location: 'A205', specifications: {}, created_at: '' },
    station: { id: 'st-4', name: '台位1', instrument_id: 'inst-4', status: 'available', created_at: '' },
  },
  {
    id: 'b5',
    user_id: '3',
    instrument_id: 'inst-5',
    station_id: 'st-5',
    project_id: 'p-2',
    start_time: '2026-06-15T13:00:00',
    end_time: '2026-06-15T16:00:00',
    status: 'confirmed',
    notes: '质谱分析',
    created_at: '2026-06-14T08:15:00',
    instrument: { id: 'inst-5', name: '质谱仪', category: '分析仪器', status: 'in_use', teacher_id: '4', location: 'B301', specifications: {}, created_at: '' },
    station: { id: 'st-5', name: '台位1', instrument_id: 'inst-5', status: 'occupied', created_at: '' },
  },
]

const statusVariantMap: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  pending: 'warning',
  confirmed: 'info',
  cancelled: 'danger',
  completed: 'success',
}

const quickActions: Record<UserRole, Array<{ label: string; href: string; icon: React.ReactNode; color: string }>> = {
  researcher: [
    { label: '新建预约', href: '/booking/new', icon: <Plus className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '我的预约', href: '/booking/mine', icon: <CalendarCheck className="w-5 h-5" />, color: 'bg-slate-700 hover:bg-slate-800' },
    { label: '上传数据', href: '/archive/upload', icon: <FileUp className="w-5 h-5" />, color: 'bg-amber-500 hover:bg-amber-600' },
  ],
  archivist: [
    { label: '数据归档', href: '/archive', icon: <Archive className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '上传文件', href: '/archive/upload', icon: <FileUp className="w-5 h-5" />, color: 'bg-slate-700 hover:bg-slate-800' },
  ],
  admin: [
    { label: '审核权限', href: '/permissions/audit', icon: <ShieldCheck className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '样本追踪', href: '/admin/samples', icon: <FlaskConical className="w-5 h-5" />, color: 'bg-slate-700 hover:bg-slate-800' },
    { label: '课题报表', href: '/admin/reports', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-amber-500 hover:bg-amber-600' },
    { label: '系统设置', href: '/admin/filter', icon: <Settings className="w-5 h-5" />, color: 'bg-slate-600 hover:bg-slate-700' },
  ],
  equipment_teacher: [
    { label: '设备看板', href: '/equipment', icon: <Cpu className="w-5 h-5" />, color: 'bg-teal-600 hover:bg-teal-700' },
    { label: '停用提醒', href: '/equipment/alerts', icon: <Settings className="w-5 h-5" />, color: 'bg-amber-500 hover:bg-amber-600' },
  ],
}

function MiniCalendar() {
  const now = new Date()
  const hours = Array.from({ length: 14 }, (_, i) => i + 7)
  const bookedSlots = [
    { start: 9, end: 12, label: '高效液相色谱仪', color: 'bg-teal-200 border-teal-400 text-teal-800' },
    { start: 14, end: 17, label: '透射电子显微镜', color: 'bg-amber-100 border-amber-400 text-amber-800' },
    { start: 13, end: 16, label: '质谱仪', color: 'bg-blue-100 border-blue-400 text-blue-800' },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title">今日日程</h3>
        <span className="text-sm text-slate-500">
          {format(now, 'M月d日 EEEE', { locale: zhCN })}
        </span>
      </div>
      <div className="space-y-1">
        {hours.map((hour) => {
          const slot = bookedSlots.find((s) => hour >= s.start && hour < s.end)
          const isStart = slot && hour === slot.start
          return (
            <div key={hour} className="flex items-center gap-3 group">
              <span className="text-xs text-slate-400 w-10 text-right flex-shrink-0">
                {hour}:00
              </span>
              <div className="flex-1 h-7 relative">
                {isStart && (
                  <div
                    className={cn(
                      'absolute inset-x-0 top-0 h-7 rounded-md border text-xs font-medium px-2 flex items-center',
                      slot.color
                    )}
                    style={{ height: `${(slot.end - slot.start) * 28}px`, zIndex: 10 }}
                  >
                    {slot.label} ({slot.start}:00-{slot.end}:00)
                  </div>
                )}
                {!slot && (
                  <div className="h-full border-b border-slate-100" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAppStore()
  const role = user?.role ?? 'researcher'
  const actions = quickActions[role]

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="page-title">
            欢迎回来，{user?.display_name || '用户'}
          </h1>
          <p className="text-slate-500 mt-1">
            {user ? `${ROLE_LABELS[user.role]} · ${user.email}` : '请先登录'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="今日预约数" value={12} icon={CalendarCheck} trend="较昨日+3" trendUp={true} />
          <StatCard title="活跃设备" value={8} icon={Cpu} />
          <StatCard title="待处理归档" value={5} icon={Archive} trend="紧急2项" />
          <StatCard title="待审核权限" value={3} icon={ShieldCheck} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <MiniCalendar />
          </div>

          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">最近预约</h3>
                <Link href="/booking/mine" className="text-sm text-teal-600 hover:text-teal-700 font-medium">
                  查看全部
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">仪器</th>
                      <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">时间</th>
                      <th className="text-left text-xs font-medium text-slate-500 pb-3 pr-4">备注</th>
                      <th className="text-left text-xs font-medium text-slate-500 pb-3">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-3 pr-4">
                          <span className="text-sm font-medium text-slate-900">
                            {b.instrument?.name}
                          </span>
                          <span className="text-xs text-slate-400 ml-2">{b.instrument?.location}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-600 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className="text-sm text-slate-600">{b.notes}</span>
                        </td>
                        <td className="py-3">
                          <StatusBadge
                            label={STATUS_LABELS[b.status]}
                            variant={statusVariantMap[b.status]}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="section-title mb-4">快捷操作</h3>
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={cn(
                  'inline-flex items-center gap-2 px-5 py-3 rounded-xl text-white font-medium transition-colors text-sm',
                  action.color
                )}
              >
                {action.icon}
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
