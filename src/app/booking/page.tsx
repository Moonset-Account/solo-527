'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MapPin,
  User,
  Monitor,
  ChevronDown,
  ChevronUp,
  CalendarDays,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import type { Instrument, Station } from '@/types'
import { INSTRUMENT_STATUS_LABELS, STATUS_LABELS } from '@/types'

const CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: '光谱分析', label: '光谱分析' },
  { value: '色谱分析', label: '色谱分析' },
  { value: '质谱分析', label: '质谱分析' },
  { value: '电化学', label: '电化学' },
  { value: '其他', label: '其他' },
]

const MOCK_INSTRUMENTS: (Instrument & { teacher_name: string; stations: Station[] })[] = [
  {
    id: 'inst-1',
    name: 'ICP-OES 电感耦合等离子体发射光谱仪',
    category: '光谱分析',
    status: 'available',
    teacher_id: 't-1',
    teacher_name: '张明教授',
    location: 'A栋302室',
    specifications: { model: 'Agilent 5800' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-1', name: '台位1', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
      { id: 's-2', name: '台位2', instrument_id: 'inst-1', status: 'available', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-2',
    name: '高效液相色谱仪 HPLC',
    category: '色谱分析',
    status: 'in_use',
    teacher_id: 't-2',
    teacher_name: '李芳副教授',
    location: 'B栋205室',
    specifications: { model: 'Waters Alliance e2695' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-3', name: '台位1', instrument_id: 'inst-2', status: 'occupied', created_at: '2024-01-01' },
      { id: 's-4', name: '台位2', instrument_id: 'inst-2', status: 'available', created_at: '2024-01-01' },
      { id: 's-5', name: '台位3', instrument_id: 'inst-2', status: 'occupied', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-3',
    name: '气相色谱-质谱联用仪 GC-MS',
    category: '质谱分析',
    status: 'available',
    teacher_id: 't-3',
    teacher_name: '王强教授',
    location: 'A栋401室',
    specifications: { model: 'Shimadzu QP2020 NX' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-6', name: '台位1', instrument_id: 'inst-3', status: 'available', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-4',
    name: '电化学工作站',
    category: '电化学',
    status: 'available',
    teacher_id: 't-4',
    teacher_name: '陈磊讲师',
    location: 'C栋108室',
    specifications: { model: 'CHI 760E' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-7', name: '台位1', instrument_id: 'inst-4', status: 'available', created_at: '2024-01-01' },
      { id: 's-8', name: '台位2', instrument_id: 'inst-4', status: 'available', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-5',
    name: '紫外-可见分光光度计',
    category: '光谱分析',
    status: 'disabled',
    teacher_id: 't-1',
    teacher_name: '张明教授',
    location: 'A栋303室',
    specifications: { model: 'Hitachi UH4150' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-9', name: '台位1', instrument_id: 'inst-5', status: 'disabled', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-6',
    name: '离子色谱仪 IC',
    category: '色谱分析',
    status: 'available',
    teacher_id: 't-5',
    teacher_name: '刘洋副教授',
    location: 'B栋210室',
    specifications: { model: 'Thermo ICS-600' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-10', name: '台位1', instrument_id: 'inst-6', status: 'available', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-7',
    name: '原子吸收光谱仪 AAS',
    category: '光谱分析',
    status: 'in_use',
    teacher_id: 't-3',
    teacher_name: '王强教授',
    location: 'A栋305室',
    specifications: { model: 'PerkinElmer PinAAcle 900T' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-11', name: '台位1', instrument_id: 'inst-7', status: 'occupied', created_at: '2024-01-01' },
      { id: 's-12', name: '台位2', instrument_id: 'inst-7', status: 'available', created_at: '2024-01-01' },
    ],
  },
  {
    id: 'inst-8',
    name: '超纯水制备系统',
    category: '其他',
    status: 'available',
    teacher_id: 't-6',
    teacher_name: '赵辉实验师',
    location: 'D栋101室',
    specifications: { model: 'Milli-Q IQ 7003' },
    created_at: '2024-01-01',
    stations: [
      { id: 's-13', name: '台位1', instrument_id: 'inst-8', status: 'available', created_at: '2024-01-01' },
    ],
  },
]

const WEEKDAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const TIME_SLOTS = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']

function generateWeeklyGrid(stationId: string) {
  const grid: boolean[][] = []
  for (let d = 0; d < 7; d++) {
    const day: boolean[] = []
    for (let t = 0; t < TIME_SLOTS.length; t++) {
      const hash = (stationId.charCodeAt(0) + d * 7 + t * 3) % 5
      day.push(hash < 2)
    }
    grid.push(day)
  }
  return grid
}

const STATION_STATUS_LABELS: Record<string, string> = {
  available: '可用',
  occupied: '占用中',
  disabled: '已停用',
}

export default function BookingPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = activeCategory === 'all'
    ? MOCK_INSTRUMENTS
    : MOCK_INSTRUMENTS.filter((i) => i.category === activeCategory)

  const getAvailableCount = (stations: Station[]) =>
    stations.filter((s) => s.status === 'available').length

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">预约大厅</h1>
          <Link href="/booking/new" className="btn-primary">
            <CalendarDays className="w-4 h-4" />
            快速预约
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeCategory === cat.value
                  ? 'bg-teal-700 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-300 hover:text-teal-700'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((instrument) => {
            const isExpanded = expandedId === instrument.id
            const availableCount = getAvailableCount(instrument.stations)
            return (
              <div
                key={instrument.id}
                className={cn(
                  'card transition-all duration-200',
                  isExpanded ? 'col-span-1 md:col-span-2 xl:col-span-3' : ''
                )}
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : instrument.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="section-title truncate">{instrument.name}</h3>
                      <StatusBadge status={instrument.status} label={INSTRUMENT_STATUS_LABELS[instrument.status]} />
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Monitor className="w-3.5 h-3.5" />
                        {instrument.category}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {instrument.location}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        {instrument.teacher_name}
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-teal-600 font-medium">{availableCount}</span>
                      <span className="text-slate-500">/{instrument.stations.length} 台位可用</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    {instrument.status !== 'disabled' && (
                      <Link
                        href={`/booking/new?instrument_id=${instrument.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        立即预约
                      </Link>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">台位列表与周可用性</h4>
                    <div className="space-y-4">
                      {instrument.stations.map((station) => {
                        const grid = generateWeeklyGrid(station.id)
                        return (
                          <div key={station.id} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-slate-700">{station.name}</span>
                              <StatusBadge status={station.status} label={STATION_STATUS_LABELS[station.status] || station.status} />
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr>
                                    <th className="p-1 text-left text-slate-500 font-medium w-14">时段</th>
                                    {WEEKDAYS.map((d) => (
                                      <th key={d} className="p-1 text-center text-slate-500 font-medium">
                                        {d}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {TIME_SLOTS.map((time, ti) => (
                                    <tr key={time}>
                                      <td className="p-1 text-slate-500">{time}</td>
                                      {WEEKDAYS.map((_, di) => (
                                        <td key={di} className="p-0.5">
                                          <div
                                            className={cn(
                                              'w-full h-5 rounded text-center leading-5 text-[10px]',
                                              grid[di][ti]
                                                ? 'bg-teal-100 text-teal-700'
                                                : 'bg-white text-slate-400 border border-slate-200'
                                            )}
                                          >
                                            {grid[di][ti] ? '空' : '满'}
                                          </div>
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
