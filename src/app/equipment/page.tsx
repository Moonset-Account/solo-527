'use client'

import { useState } from 'react'
import { Cpu, Activity, Ban, CalendarCheck } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { Instrument } from '@/types'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'

type TimeRange = 'day' | 'week' | 'month'

const MOCK_INSTRUMENTS: Instrument[] = [
  { id: 'ins1', name: 'XRD衍射仪', category: '结构分析', status: 'available', teacher_id: 't1', location: 'A301', specifications: {}, created_at: '' },
  { id: 'ins2', name: 'SEM扫描电镜', category: '形貌分析', status: 'in_use', teacher_id: 't2', location: 'A302', specifications: {}, created_at: '' },
  { id: 'ins3', name: 'FTIR红外光谱仪', category: '成分分析', status: 'available', teacher_id: 't1', location: 'B201', specifications: {}, created_at: '' },
  { id: 'ins4', name: 'TEM透射电镜', category: '形貌分析', status: 'available', teacher_id: 't2', location: 'A303', specifications: {}, created_at: '' },
  { id: 'ins5', name: 'DSC差示扫描量热仪', category: '热分析', status: 'disabled', teacher_id: 't3', location: 'B202', specifications: {}, created_at: '' },
  { id: 'ins6', name: 'UV-Vis紫外分光光度计', category: '光学分析', status: 'available', teacher_id: 't1', location: 'C101', specifications: {}, created_at: '' },
]

const CHART_DATA = [
  { name: 'XRD', 可用: 8, 已用: 6 },
  { name: 'SEM', 可用: 4, 已用: 10 },
  { name: 'FTIR', 可用: 6, 已用: 5 },
  { name: 'TEM', 可用: 7, 已用: 7 },
  { name: 'DSC', 可用: 0, 已用: 0 },
  { name: 'UV-Vis', 可用: 9, 已用: 3 },
]

const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i)

const HEATMAP_DATA: Record<string, number[]> = {
  'XRD':   [0.2, 0.5, 0.8, 0.9, 0.7, 0.3, 0.1, 0.4, 0.6, 0.8, 0.5, 0.2],
  'SEM':   [0.6, 0.8, 0.9, 0.7, 0.5, 0.8, 0.9, 0.6, 0.4, 0.7, 0.3, 0.1],
  'FTIR':  [0.1, 0.3, 0.5, 0.6, 0.4, 0.2, 0.1, 0.3, 0.5, 0.4, 0.2, 0.1],
  'TEM':   [0.4, 0.7, 0.6, 0.8, 0.9, 0.5, 0.3, 0.7, 0.8, 0.6, 0.4, 0.2],
  'DSC':   [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'UV-Vis': [0.3, 0.2, 0.4, 0.3, 0.1, 0.2, 0.1, 0.3, 0.4, 0.2, 0.1, 0],
}

function heatColor(value: number): string {
  if (value === 0) return 'bg-slate-100'
  if (value < 0.3) return 'bg-teal-100'
  if (value < 0.6) return 'bg-teal-300'
  if (value < 0.8) return 'bg-teal-500'
  return 'bg-teal-700'
}

export default function EquipmentPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('day')

  const totalInstruments = MOCK_INSTRUMENTS.length
  const disabledCount = MOCK_INSTRUMENTS.filter(i => i.status === 'disabled').length

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-4">设备利用率</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="总设备数" value={totalInstruments} icon={Cpu} />
        <StatCard title="平均利用率" value="62%" icon={Activity} trend={{ value: 3, direction: 'up' }} />
        <StatCard title="停用中" value={disabledCount} icon={Ban} />
        <StatCard title="今日预约" value={8} icon={CalendarCheck} />
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title">利用率统计</h2>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {([['day', '日'], ['week', '周'], ['month', '月']] as [TimeRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTimeRange(key)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  timeRange === key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={CHART_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} unit="h" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                formatter={(value: number, name: string) => [`${value}h`, name]}
              />
              <Legend />
              <Bar dataKey="已用" fill="#0f766e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="可用" fill="#99f6e4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title mb-4">时段热力图</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left py-2 px-3 font-medium text-slate-600 text-xs">设备</th>
                {HOURS.map(h => (
                  <th key={h} className="text-center py-2 px-1 font-medium text-slate-500 text-xs">{h}:00</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(HEATMAP_DATA).map(([name, values]) => (
                <tr key={name}>
                  <td className="py-2 px-3 font-medium text-slate-700 text-xs whitespace-nowrap">{name}</td>
                  {values.map((val, i) => (
                    <td key={i} className="py-2 px-1">
                      <div
                        className={`w-full h-6 rounded ${heatColor(val)} transition-colors`}
                        title={`${name} ${HOURS[i]}:00 利用率 ${Math.round(val * 100)}%`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
          <span>低</span>
          <div className="w-4 h-3 rounded bg-slate-100" />
          <div className="w-4 h-3 rounded bg-teal-100" />
          <div className="w-4 h-3 rounded bg-teal-300" />
          <div className="w-4 h-3 rounded bg-teal-500" />
          <div className="w-4 h-3 rounded bg-teal-700" />
          <span>高</span>
        </div>
      </div>
    </AppShell>
  )
}
