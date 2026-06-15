'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
  CheckCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { Booking, BookingStatus } from '@/types'
import { STATUS_LABELS } from '@/types'
import { getMyBookings, cancelBooking, completeBooking } from '@/lib/actions/bookings'

const MOCK_BOOKINGS: Booking[] = [
  {
    id: '00000000-0000-0000-0000-000000000101',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000001',
    station_id: '00000000-0000-0000-0000-000000000011',
    project_id: '00000000-0000-0000-0000-000000000021',
    start_time: '2026-06-16T08:00',
    end_time: '2026-06-16T12:00',
    status: 'pending',
    notes: '需要测试纳米颗粒表面元素',
    created_at: '2026-06-14T10:30:00',
    instrument: { id: '00000000-0000-0000-0000-000000000001', name: 'ICP-OES 电感耦合等离子体发射光谱仪', category: '光谱分析', status: 'available', teacher_id: null, location: 'A栋302室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000011', name: '台位1', instrument_id: '00000000-0000-0000-0000-000000000001', status: 'available', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000021', name: '纳米材料表面分析', code: 'NM-2024-01', description: null, lead_id: null, start_date: '2024-01-01', end_date: '2024-12-31', created_at: '2024-01-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000102',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000002',
    station_id: '00000000-0000-0000-0000-000000000014',
    project_id: '00000000-0000-0000-0000-000000000022',
    start_time: '2026-06-17T09:00',
    end_time: '2026-06-17T17:00',
    status: 'confirmed',
    notes: '水质有机物分析',
    created_at: '2026-06-13T14:00:00',
    instrument: { id: '00000000-0000-0000-0000-000000000002', name: '高效液相色谱仪 HPLC', category: '色谱分析', status: 'in_use', teacher_id: null, location: 'B栋205室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000014', name: '台位2', instrument_id: '00000000-0000-0000-0000-000000000002', status: 'available', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000022', name: '环境水质监测', code: 'EQ-2024-03', description: null, lead_id: null, start_date: '2024-03-01', end_date: '2024-12-31', created_at: '2024-03-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000103',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000003',
    station_id: '00000000-0000-0000-0000-000000000015',
    project_id: '00000000-0000-0000-0000-000000000023',
    start_time: '2026-06-18T13:00',
    end_time: '2026-06-18T17:00',
    status: 'confirmed',
    notes: null,
    created_at: '2026-06-12T09:15:00',
    instrument: { id: '00000000-0000-0000-0000-000000000003', name: '气相色谱-质谱联用仪 GC-MS', category: '质谱分析', status: 'available', teacher_id: null, location: 'A栋401室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000015', name: '台位1', instrument_id: '00000000-0000-0000-0000-000000000003', status: 'available', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000023', name: '药物代谢动力学研究', code: 'PK-2024-05', description: null, lead_id: null, start_date: '2024-05-01', end_date: '2025-04-30', created_at: '2024-05-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000104',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000004',
    station_id: '00000000-0000-0000-0000-000000000016',
    project_id: '00000000-0000-0000-0000-000000000021',
    start_time: '2026-06-10T08:00',
    end_time: '2026-06-10T12:00',
    status: 'completed',
    notes: '循环伏安扫描已完成',
    created_at: '2026-06-08T11:00:00',
    instrument: { id: '00000000-0000-0000-0000-000000000004', name: '电化学工作站', category: '电化学', status: 'available', teacher_id: null, location: 'C栋108室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000016', name: '台位1', instrument_id: '00000000-0000-0000-0000-000000000004', status: 'available', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000021', name: '纳米材料表面分析', code: 'NM-2024-01', description: null, lead_id: null, start_date: '2024-01-01', end_date: '2024-12-31', created_at: '2024-01-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000105',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000001',
    station_id: '00000000-0000-0000-0000-000000000012',
    project_id: '00000000-0000-0000-0000-000000000022',
    start_time: '2026-06-09T14:00',
    end_time: '2026-06-09T17:00',
    status: 'cancelled',
    notes: '仪器临时维护，取消预约',
    created_at: '2026-06-07T16:30:00',
    instrument: { id: '00000000-0000-0000-0000-000000000001', name: 'ICP-OES 电感耦合等离子体发射光谱仪', category: '光谱分析', status: 'available', teacher_id: null, location: 'A栋302室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000012', name: '台位2', instrument_id: '00000000-0000-0000-0000-000000000001', status: 'available', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000022', name: '环境水质监测', code: 'EQ-2024-03', description: null, lead_id: null, start_date: '2024-03-01', end_date: '2024-12-31', created_at: '2024-03-01' },
  },
  {
    id: '00000000-0000-0000-0000-000000000106',
    user_id: '00000000-0000-0000-0000-000000009001',
    instrument_id: '00000000-0000-0000-0000-000000000002',
    station_id: '00000000-0000-0000-0000-000000000013',
    project_id: '00000000-0000-0000-0000-000000000023',
    start_time: '2026-06-19T08:00',
    end_time: '2026-06-19T16:00',
    status: 'pending',
    notes: '血药浓度检测',
    created_at: '2026-06-15T08:00:00',
    instrument: { id: '00000000-0000-0000-0000-000000000002', name: '高效液相色谱仪 HPLC', category: '色谱分析', status: 'in_use', teacher_id: null, location: 'B栋205室', specifications: {}, created_at: '2024-01-01' },
    station: { id: '00000000-0000-0000-0000-000000000013', name: '台位1', instrument_id: '00000000-0000-0000-0000-000000000002', status: 'occupied', created_at: '2024-01-01' },
    project: { id: '00000000-0000-0000-0000-000000000023', name: '药物代谢动力学研究', code: 'PK-2024-05', description: null, lead_id: null, start_date: '2024-05-01', end_date: '2025-04-30', created_at: '2024-05-01' },
  },
]

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

function formatTime(t: string) {
  return t.replace('T', ' ').slice(0, 16)
}

export default function MyBookingsPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isPending, startTransition] = useTransition()
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    id: string
    action: 'cancel' | 'complete'
  } | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    startTransition(async () => {
      const result = await getMyBookings()
      if (result.bookings && result.bookings.length > 0) {
        setBookings(result.bookings)
      } else {
        setBookings(MOCK_BOOKINGS)
      }
    })
  }, [])

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.instrument?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.project?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCancel = (id: string) => {
    setConfirmDialog({ id, action: 'cancel' })
  }

  const handleComplete = (id: string) => {
    setConfirmDialog({ id, action: 'complete' })
  }

  const confirmAction = () => {
    if (!confirmDialog) return
    const { id, action } = confirmDialog
    setActionLoading(`${action}-${id}`)

    startTransition(async () => {
      if (action === 'cancel') {
        const result = await cancelBooking(id)
        if (result.success) {
          setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b))
          )
          showToast('success', '预约已取消')
        } else {
          showToast('error', result.error || '取消失败')
        }
      } else {
        const result = await completeBooking(id)
        if (result.success) {
          setBookings((prev) =>
            prev.map((b) => (b.id === id ? { ...b, status: 'completed' as BookingStatus } : b))
          )
          showToast('success', '预约已完成')
        } else {
          showToast('error', result.error || '操作失败')
        }
      }
      setActionLoading(null)
      setConfirmDialog(null)
    })
  }

  return (
    <AppShell>
      <div className="space-y-6 relative">
        {toast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border',
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        )}

        {confirmDialog && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setConfirmDialog(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {confirmDialog.action === 'cancel' ? '确认取消预约' : '确认完成预约'}
                </h3>
                <button onClick={() => setConfirmDialog(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-6">
                {confirmDialog.action === 'cancel'
                  ? '确定取消该预约吗？取消后将无法恢复。'
                  : '确认该预约已完成？此操作将更新设备利用率统计。'}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmDialog(null)}
                  disabled={!!actionLoading}
                  className="btn-secondary disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={confirmAction}
                  disabled={!!actionLoading}
                  className={cn(
                    confirmDialog.action === 'cancel' ? 'btn-danger' : 'btn-primary',
                    'disabled:opacity-50'
                  )}
                >
                  {actionLoading ? '处理中...' : confirmDialog.action === 'cancel' ? '确认取消' : '确认完成'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h1 className="page-title">我的预约</h1>
          <Link href="/booking/new" className="btn-primary">
            <CalendarDays className="w-4 h-4" />
            新建预约
          </Link>
        </div>

        <div className="card flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索仪器或课题..."
              className="input-field pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto min-w-[140px]"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="暂无预约记录"
            description="您还没有相关的预约记录，可以前往预约大厅创建新预约。"
            action={
              <Link href="/booking" className="btn-primary">
                <CalendarDays className="w-4 h-4" />
                前往预约大厅
              </Link>
            }
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">仪器</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">台位</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">时间</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">课题</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600">状态</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((booking) => (
                    <tr key={booking.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">
                          {booking.instrument?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {booking.station?.name}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <div>
                            <div>{formatTime(booking.start_time)}</div>
                            <div className="text-slate-400">至 {formatTime(booking.end_time)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-600">{booking.project?.name || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={booking.status} label={STATUS_LABELS[booking.status]} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleCancel(booking.id)}
                              disabled={actionLoading === `cancel-${booking.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              取消预约
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleComplete(booking.id)}
                              disabled={actionLoading === `complete-${booking.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              完成预约
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
