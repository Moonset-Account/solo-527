'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Instrument, Station, Project, Sample, Booking } from '@/types'
import { INSTRUMENT_STATUS_LABELS } from '@/types'

const MOCK_INSTRUMENTS: Instrument[] = [
  { id: 'inst-1', name: 'ICP-OES 电感耦合等离子体发射光谱仪', category: '光谱分析', status: 'available', teacher_id: 't-1', location: 'A栋302室', specifications: {}, created_at: '2024-01-01' },
  { id: 'inst-2', name: '高效液相色谱仪 HPLC', category: '色谱分析', status: 'in_use', teacher_id: 't-2', location: 'B栋205室', specifications: {}, created_at: '2024-01-01' },
  { id: 'inst-3', name: '气相色谱-质谱联用仪 GC-MS', category: '质谱分析', status: 'available', teacher_id: 't-3', location: 'A栋401室', specifications: {}, created_at: '2024-01-01' },
  { id: 'inst-4', name: '电化学工作站', category: '电化学', status: 'available', teacher_id: 't-4', location: 'C栋108室', specifications: {}, created_at: '2024-01-01' },
]

const MOCK_STATIONS: Station[] = [
  { id: 's-1', name: 'ICP-OES 台位1', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
  { id: 's-2', name: 'ICP-OES 台位2', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
  { id: 's-3', name: 'HPLC 台位1', instrument_id: 'inst-2', status: 'occupied', created_at: '2024-01-01' },
  { id: 's-4', name: 'HPLC 台位2', instrument_id: 'inst-2', status: 'available', created_at: '2024-01-01' },
  { id: 's-5', name: 'GC-MS 台位1', instrument_id: 'inst-3', status: 'available', created_at: '2024-01-01' },
  { id: 's-6', name: '电化学 台位1', instrument_id: 'inst-4', status: 'available', created_at: '2024-01-01' },
]

const MOCK_PROJECTS: Project[] = [
  { id: 'proj-1', name: '纳米材料表面分析', code: 'NM-2024-01', description: null, lead_id: null, start_date: '2024-01-01', end_date: '2024-12-31', created_at: '2024-01-01' },
  { id: 'proj-2', name: '环境水质监测', code: 'EQ-2024-03', description: null, lead_id: null, start_date: '2024-03-01', end_date: '2024-12-31', created_at: '2024-03-01' },
  { id: 'proj-3', name: '药物代谢动力学研究', code: 'PK-2024-05', description: null, lead_id: null, start_date: '2024-05-01', end_date: '2025-04-30', created_at: '2024-05-01' },
]

const MOCK_SAMPLES: Sample[] = [
  { id: 'samp-1', sample_code: 'NM-001', name: 'TiO2纳米颗粒A', project_id: 'proj-1', created_by: null, processing_status: 'pending', responsible_person: '张三', created_at: '2024-01-01' },
  { id: 'samp-2', sample_code: 'NM-002', name: 'ZnO纳米薄膜B', project_id: 'proj-1', created_by: null, processing_status: 'pending', responsible_person: '李四', created_at: '2024-01-01' },
  { id: 'samp-3', sample_code: 'EQ-001', name: '自来水样-6月', project_id: 'proj-2', created_by: null, processing_status: 'in_progress', responsible_person: '王五', created_at: '2024-06-01' },
  { id: 'samp-4', sample_code: 'EQ-002', name: '湖水样-西湖', project_id: 'proj-2', created_by: null, processing_status: 'pending', responsible_person: '赵六', created_at: '2024-06-01' },
  { id: 'samp-5', sample_code: 'PK-001', name: '血浆样本A', project_id: 'proj-3', created_by: null, processing_status: 'pending', responsible_person: '钱七', created_at: '2024-05-01' },
]

const MOCK_EXISTING_BOOKINGS: Booking[] = [
  {
    id: 'b-exist-1',
    user_id: 'u-2',
    instrument_id: 'inst-1',
    station_id: 's-1',
    project_id: 'proj-1',
    start_time: '2026-06-15T08:00',
    end_time: '2026-06-15T12:00',
    status: 'confirmed',
    notes: null,
    created_at: '2026-06-14',
    instrument: MOCK_INSTRUMENTS[0],
    station: MOCK_STATIONS[0],
  },
  {
    id: 'b-exist-2',
    user_id: 'u-3',
    instrument_id: 'inst-1',
    station_id: 's-1',
    project_id: 'proj-2',
    start_time: '2026-06-16T09:00',
    end_time: '2026-06-16T17:00',
    status: 'confirmed',
    notes: null,
    created_at: '2026-06-14',
    instrument: MOCK_INSTRUMENTS[0],
    station: MOCK_STATIONS[0],
  },
  {
    id: 'b-exist-3',
    user_id: 'u-4',
    instrument_id: 'inst-1',
    station_id: 's-2',
    project_id: 'proj-1',
    start_time: '2026-06-17T13:00',
    end_time: '2026-06-17T17:00',
    status: 'pending',
    notes: null,
    created_at: '2026-06-14',
    instrument: MOCK_INSTRUMENTS[0],
    station: MOCK_STATIONS[1],
  },
]

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const HOURS = Array.from({ length: 10 }, (_, i) => i + 8)

function getWeekDates(baseDate: Date) {
  const day = baseDate.getDay()
  const monday = new Date(baseDate)
  monday.setDate(baseDate.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function formatDigit(n: number) {
  return n.toString().padStart(2, '0')
}

export default function NewBookingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedInstrumentId = searchParams.get('instrument_id') || ''

  const [instrumentId, setInstrumentId] = useState(preselectedInstrumentId)
  const [stationId, setStationId] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [projectId, setProjectId] = useState('')
  const [selectedSampleIds, setSelectedSampleIds] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [showToast, setShowToast] = useState(false)

  const filteredStations = MOCK_STATIONS.filter(
    (s) => s.instrument_id === instrumentId && s.status !== 'disabled'
  )

  useEffect(() => {
    if (instrumentId && filteredStations.length > 0 && !filteredStations.find((s) => s.id === stationId)) {
      setStationId(filteredStations[0].id)
    }
    if (!instrumentId) {
      setStationId('')
    }
  }, [instrumentId])

  const conflicts = useMemo(() => {
    if (!stationId || !startTime || !endTime) return []
    return MOCK_EXISTING_BOOKINGS.filter((b) => {
      if (b.station_id !== stationId) return false
      if (b.status === 'cancelled') return false
      return b.start_time < endTime && b.end_time > startTime
    })
  }, [stationId, startTime, endTime])

  const weekDates = useMemo(() => getWeekDates(new Date()), [])

  const stationBookings = useMemo(() => {
    if (!stationId) return []
    return MOCK_EXISTING_BOOKINGS.filter(
      (b) => b.station_id === stationId && b.status !== 'cancelled'
    )
  }, [stationId])

  const hasConflict = conflicts.length > 0

  const selectedInstrument = MOCK_INSTRUMENTS.find((i) => i.id === instrumentId)

  const projectSamples = MOCK_SAMPLES.filter(
    (s) => !projectId || s.project_id === projectId
  )

  const toggleSample = (id: string) => {
    setSelectedSampleIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowToast(true)
    setTimeout(() => {
      router.push('/booking/mine')
    }, 1500)
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="page-title">新建预约</h1>

        {showToast && (
          <div className="fixed top-4 right-4 z-50 animate-slide-in">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg shadow-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">预约提交成功！正在跳转...</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card space-y-4">
              <h2 className="section-title">基本信息</h2>

              <div>
                <label className="label">仪器选择</label>
                <select
                  value={instrumentId}
                  onChange={(e) => setInstrumentId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">请选择仪器</option>
                  {MOCK_INSTRUMENTS.filter((i) => i.status !== 'disabled').map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">台位选择</label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="input-field"
                  required
                  disabled={!instrumentId}
                >
                  <option value="">请选择台位</option>
                  {filteredStations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.status === 'available' ? ' (可用)' : ' (占用中)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">开始时间</label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="label">结束时间</label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {hasConflict && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">时间冲突</p>
                    <p className="text-sm text-red-600">
                      所选时间段与已有预约冲突，请调整时间或更换台位。
                    </p>
                    {conflicts.map((c) => (
                      <p key={c.id} className="text-xs text-red-500 mt-1">
                        冲突预约: {c.start_time} ~ {c.end_time}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="label">关联课题</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="input-field"
                  required
                >
                  <option value="">请选择课题</option>
                  {MOCK_PROJECTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">关联样本（可多选）</label>
                <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto p-2 space-y-1">
                  {projectSamples.length === 0 && (
                    <p className="text-sm text-slate-400 px-2">请先选择课题</p>
                  )}
                  {projectSamples.map((s) => (
                    <label
                      key={s.id}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer transition-colors',
                        selectedSampleIds.includes(s.id)
                          ? 'bg-teal-50 text-teal-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSampleIds.includes(s.id)}
                        onChange={() => toggleSample(s.id)}
                        className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-medium">{s.sample_code}</span>
                      <span className="text-slate-500">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">备注</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="请填写预约备注信息..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={hasConflict || !instrumentId || !stationId || !startTime || !endTime || !projectId}
              className="btn-primary w-full justify-center py-3"
            >
              <CalendarPlus className="w-4 h-4" />
              提交预约
            </button>
          </div>

          <div className="space-y-6">
            <div className="card">
              <h2 className="section-title mb-3">周视图 - 台位预约情况</h2>
              {!stationId ? (
                <p className="text-sm text-slate-400">请先选择仪器和台位查看可用性</p>
              ) : (
                <div className="overflow-x-auto -mx-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr>
                        <th className="p-1 text-left text-slate-500 font-medium w-10">时</th>
                        {weekDates.map((d, i) => (
                          <th key={i} className="p-1 text-center text-slate-500 font-medium">
                            <div>{WEEKDAYS[i]}</div>
                            <div className="text-[10px] text-slate-400">{`${formatDigit(d.getMonth() + 1)}/${formatDigit(d.getDate())}`}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {HOURS.map((hour) => {
                        const isUserSlot =
                          startTime && endTime
                            ? isHourInRange(hour, startTime, endTime)
                            : false
                        return (
                          <tr key={hour}>
                            <td className="p-1 text-slate-500">{`${formatDigit(hour)}:00`}</td>
                            {weekDates.map((date, di) => {
                              const slotStart = buildSlotTime(date, hour)
                              const slotEnd = buildSlotTime(date, hour + 1)
                              const booking = stationBookings.find(
                                (b) => b.start_time < slotEnd && b.end_time > slotStart
                              )
                              const isConflictSlot = booking && isUserSlot
                              return (
                                <td key={di} className="p-0.5">
                                  <div
                                    className={cn(
                                      'w-full h-6 rounded text-center leading-6 text-[10px]',
                                      isConflictSlot
                                        ? 'bg-red-200 text-red-700 border border-red-300'
                                        : booking
                                          ? 'bg-amber-100 text-amber-700'
                                          : isUserSlot
                                            ? 'bg-teal-100 text-teal-700 border border-teal-300'
                                            : 'bg-slate-50 text-slate-300'
                                    )}
                                    title={booking ? `${booking.start_time}~${booking.end_time}` : '空闲'}
                                  >
                                    {isConflictSlot ? '冲' : booking ? '占' : isUserSlot ? '选' : ''}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {selectedInstrument && (
              <div className="card">
                <h2 className="section-title mb-2">仪器信息</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">状态</span>
                    <StatusBadge status={selectedInstrument.status} label={INSTRUMENT_STATUS_LABELS[selectedInstrument.status]} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">位置</span>
                    <span className="text-slate-700">{selectedInstrument.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">类别</span>
                    <span className="text-slate-700">{selectedInstrument.category}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  )
}

function buildSlotTime(date: Date, hour: number): string {
  return `${date.getFullYear()}-${formatDigit(date.getMonth() + 1)}-${formatDigit(date.getDate())}T${formatDigit(hour)}:00`
}

function isHourInRange(hour: number, start: string, end: string): boolean {
  const startHour = parseInt(start.slice(11, 13), 10)
  const endHour = parseInt(end.slice(11, 13), 10)
  const startDate = start.slice(0, 10)
  const endDate = end.slice(0, 10)
  if (startDate !== endDate) return false
  return hour >= startHour && hour < endHour
}
