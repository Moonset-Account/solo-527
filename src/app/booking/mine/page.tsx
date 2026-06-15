'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CalendarDays,
  XCircle,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { Booking, BookingStatus } from '@/types'
import { STATUS_LABELS } from '@/types'

const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    user_id: 'u-1',
    instrument_id: 'inst-1',
    station_id: 's-1',
    project_id: 'proj-1',
    start_time: '2026-06-16T08:00',
    end_time: '2026-06-16T12:00',
    status: 'pending',
    notes: '需要测试纳米颗粒表面元素',
    created_at: '2026-06-14T10:30:00',
    instrument: { id: 'inst-1', name: 'ICP-OES 电感耦合等离子体发射光谱仪', category: '光谱分析', status: 'available', teacher_id: 't-1', location: 'A栋302室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-1', name: '台位1', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
    project: { id: 'proj-1', name: '纳米材料表面分析', code: 'NM-2024-01', description: null, lead_id: null, start_date: '2024-01-01', end_date: '2024-12-31', created_at: '2024-01-01' },
  },
  {
    id: 'b-2',
    user_id: 'u-1',
    instrument_id: 'inst-2',
    station_id: 's-4',
    project_id: 'proj-2',
    start_time: '2026-06-17T09:00',
    end_time: '2026-06-17T17:00',
    status: 'confirmed',
    notes: '水质有机物分析',
    created_at: '2026-06-13T14:00:00',
    instrument: { id: 'inst-2', name: '高效液相色谱仪 HPLC', category: '色谱分析', status: 'in_use', teacher_id: 't-2', location: 'B栋205室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-4', name: '台位2', instrument_id: 'inst-2', status: 'available', created_at: '2024-01-01' },
    project: { id: 'proj-2', name: '环境水质监测', code: 'EQ-2024-03', description: null, lead_id: null, start_date: '2024-03-01', end_date: '2024-12-31', created_at: '2024-03-01' },
  },
  {
    id: 'b-3',
    user_id: 'u-1',
    instrument_id: 'inst-3',
    station_id: 's-5',
    project_id: 'proj-3',
    start_time: '2026-06-18T13:00',
    end_time: '2026-06-18T17:00',
    status: 'confirmed',
    notes: null,
    created_at: '2026-06-12T09:15:00',
    instrument: { id: 'inst-3', name: '气相色谱-质谱联用仪 GC-MS', category: '质谱分析', status: 'available', teacher_id: 't-3', location: 'A栋401室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-5', name: '台位1', instrument_id: 'inst-3', status: 'available', created_at: '2024-01-01' },
    project: { id: 'proj-3', name: '药物代谢动力学研究', code: 'PK-2024-05', description: null, lead_id: null, start_date: '2024-05-01', end_date: '2025-04-30', created_at: '2024-05-01' },
  },
  {
    id: 'b-4',
    user_id: 'u-1',
    instrument_id: 'inst-4',
    station_id: 's-6',
    project_id: 'proj-1',
    start_time: '2026-06-10T08:00',
    end_time: '2026-06-10T12:00',
    status: 'completed',
    notes: '循环伏安扫描已完成',
    created_at: '2026-06-08T11:00:00',
    instrument: { id: 'inst-4', name: '电化学工作站', category: '电化学', status: 'available', teacher_id: 't-4', location: 'C栋108室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-6', name: '台位1', instrument_id: 'inst-4', status: 'available', created_at: '2024-01-01' },
    project: { id: 'proj-1', name: '纳米材料表面分析', code: 'NM-2024-01', description: null, lead_id: null, start_date: '2024-01-01', end_date: '2024-12-31', created_at: '2024-01-01' },
  },
  {
    id: 'b-5',
    user_id: 'u-1',
    instrument_id: 'inst-1',
    station_id: 's-2',
    project_id: 'proj-2',
    start_time: '2026-06-09T14:00',
    end_time: '2026-06-09T17:00',
    status: 'cancelled',
    notes: '仪器临时维护，取消预约',
    created_at: '2026-06-07T16:30:00',
    instrument: { id: 'inst-1', name: 'ICP-OES 电感耦合等离子体发射光谱仪', category: '光谱分析', status: 'available', teacher_id: 't-1', location: 'A栋302室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-2', name: '台位2', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
    project: { id: 'proj-2', name: '环境水质监测', code: 'EQ-2024-03', description: null, lead_id: null, start_date: '2024-03-01', end_date: '2024-12-31', created_at: '2024-03-01' },
  },
  {
    id: 'b-6',
    user_id: 'u-1',
    instrument_id: 'inst-2',
    station_id: 's-3',
    project_id: 'proj-3',
    start_time: '2026-06-19T08:00',
    end_time: '2026-06-19T16:00',
    status: 'pending',
    notes: '血药浓度检测',
    created_at: '2026-06-15T08:00:00',
    instrument: { id: 'inst-2', name: '高效液相色谱仪 HPLC', category: '色谱分析', status: 'in_use', teacher_id: 't-2', location: 'B栋205室', specifications: {}, created_at: '2024-01-01' },
    station: { id: 's-3', name: '台位1', instrument_id: 'inst-2', status: 'occupied', created_at: '2024-01-01' },
    project: { id: 'proj-3', name: '药物代谢动力学研究', code: 'PK-2024-05', description: null, lead_id: null, start_date: '2024-05-01', end_date: '2025-04-30', created_at: '2024-05-01' },
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
  const [bookings, setBookings] = useState<Booking[]>(MOCK_BOOKINGS)

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.instrument?.name.toLowerCase().includes(search.toLowerCase()) ||
      b.project?.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || b.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCancel = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' as BookingStatus } : b))
    )
  }

  const handleComplete = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'completed' as BookingStatus } : b))
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              取消预约
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleComplete(booking.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
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
