'use client'

import { useState, useEffect, useTransition, useMemo } from 'react'
import { Cpu, AlertTriangle, Clock, TrendingUp, Info, Calendar, AlertCircle } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import { cn } from '@/lib/utils'
import { listInstruments, listUtilizationLogs, aggregateUtilizationDaily } from '@/lib/actions/equipment'
import type { DailyUtilization, Instrument, UtilizationLog } from '@/types'

const CATEGORIES = ['结构分析', '形貌分析', '成分分析', '光学分析', '热分析']
const LAST_7_DAYS = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (6 - i))
  return `${d.getMonth() + 1}/${d.getDate()}`
})
const LAST_30_DAYS = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  return d.toISOString().split('T')[0]
})

const MOCK_INSTRUMENT_NAMES = ['XRD衍射仪', 'SEM扫描电镜', 'FTIR红外光谱仪', 'UV-Vis紫外分光光度计', 'DSC差示扫描量热仪']

function generateMockHeatmap(instrumentNames: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  instrumentNames.forEach(inst => {
    LAST_7_DAYS.forEach(day => {
      map[`${inst}-${day}`] = Math.floor(Math.random() * 12)
    })
  })
  return map
}

interface MockDaily extends DailyUtilization {
  date_label: string
}

function generateMockDaily(instrumentNames: string[]): MockDaily[] {
  return instrumentNames.map(name => ({
    instrument_id: `00000000-0000-0000-0000-00000000000${MOCK_INSTRUMENT_NAMES.indexOf(name) + 1}`,
    instrument_name: name,
    date: LAST_30_DAYS[LAST_30_DAYS.length - 1],
    date_label: '',
    used_hours: Math.floor(Math.random() * 80) / 10 + 2,
    disabled_hours: Math.random() > 0.7 ? Math.floor(Math.random() * 20) / 10 : 0,
    utilization_rate: Math.floor(Math.random() * 50) + 30,
  }))
}

function getHeatmapColor(used: number): string {
  if (used === 0) return 'bg-slate-50'
  if (used <= 2) return 'bg-teal-50'
  if (used <= 5) return 'bg-teal-100'
  if (used <= 8) return 'bg-teal-300'
  if (used <= 10) return 'bg-teal-500'
  return 'bg-teal-700'
}

function getHeatmapTextColor(used: number): string {
  if (used <= 8) return 'text-slate-700'
  return 'text-white'
}

export default function EquipmentDashboard() {
  const [instruments, setInstruments] = useState<Instrument[]>([])
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})
  const [dailyData, setDailyData] = useState<MockDaily[]>([])
  const [isPending, startTransition] = useTransition()
  const [loadError, setLoadError] = useState<string | null>(null)

  const instrumentNames = useMemo(() => {
    if (instruments.length > 0) {
      return instruments.map(i => i.name)
    }
    return MOCK_INSTRUMENT_NAMES
  }, [instruments])

  const mockHeatmap = useMemo(() => generateMockHeatmap(instrumentNames), [instrumentNames])
  const mockDaily = useMemo(() => generateMockDaily(instrumentNames), [instrumentNames])

  useEffect(() => {
    startTransition(async () => {
      try {
        const date_from = LAST_30_DAYS[0]
        const date_to = LAST_30_DAYS[LAST_30_DAYS.length - 1]

        const [instrumentsResult, logsResult, dailyResult] = await Promise.all([
          listInstruments(),
          listUtilizationLogs({ date_from, date_to }),
          aggregateUtilizationDaily(),
        ])

        if (instrumentsResult.error || logsResult.error || dailyResult.error) {
          setLoadError(instrumentsResult.error || logsResult.error || dailyResult.error || null)
        }

        let finalInstruments: Instrument[] = []
        if (instrumentsResult.instruments && instrumentsResult.instruments.length > 0) {
          finalInstruments = instrumentsResult.instruments
        }
        setInstruments(finalInstruments)

        const names = finalInstruments.length > 0
          ? finalInstruments.map(i => i.name)
          : MOCK_INSTRUMENT_NAMES

        let finalHeatmap = mockHeatmap
        if (logsResult.logs && logsResult.logs.length > 0) {
          const hMap: Record<string, number> = {}
          const last7Dates = LAST_30_DAYS.slice(-7)
          const last7Logs = logsResult.logs.filter(l => {
            const logDate = (l.log_date as string).slice(0, 10)
            return last7Dates.includes(logDate)
          })
          names.forEach(instName => {
            LAST_7_DAYS.forEach((day, dayIdx) => {
              const dayDate = last7Dates[dayIdx]
              const found = last7Logs.find(l =>
                (l.instrument?.name === instName || l.instrument_name === instName) &&
                (l.log_date as string).slice(0, 10) === dayDate
              )
              hMap[`${instName}-${day}`] = found ? Math.round(Number(found.used_hours)) : 0
            })
          })
          finalHeatmap = hMap
        }
        setHeatmapData(finalHeatmap)

        let finalDaily: MockDaily[] = mockDaily
        if (dailyResult.data && dailyResult.data.length > 0) {
          const latestByInstrument = new Map<string, DailyUtilization>()
          for (const d of dailyResult.data) {
            const existing = latestByInstrument.get(d.instrument_name)
            if (!existing || d.date > existing.date) {
              latestByInstrument.set(d.instrument_name, d)
            }
          }
          finalDaily = names.map(name => {
            const d = latestByInstrument.get(name)
            if (d) {
              return {
                ...d,
                date_label: `${d.date.slice(5)}`,
              } as MockDaily
            }
            return {
              instrument_id: `00000000-0000-0000-0000-00000000000${names.indexOf(name) + 1}`,
              instrument_name: name,
              date: LAST_30_DAYS[LAST_30_DAYS.length - 1],
              date_label: '',
              used_hours: 0,
              disabled_hours: 0,
              utilization_rate: 0,
            }
          })
        }
        setDailyData(finalDaily)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '加载失败'
        setLoadError(msg)
        setHeatmapData(mockHeatmap)
        setDailyData(mockDaily)
      }
    })
  }, [mockHeatmap, mockDaily])

  const totalInstruments = instruments.length > 0 ? instruments.length : instrumentNames.length
  const disabledCount = instruments.length > 0
    ? instruments.filter(i => i.status === 'disabled').length
    : 3
  const avgUtilization = dailyData.length > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.utilization_rate, 0) / dailyData.length)
    : 0

  const todayStr = new Date().toISOString().slice(0, 10)
  const todayHours = dailyData.length > 0
    ? Math.round(dailyData.reduce((s, d) => s + d.used_hours, 0) * 10) / 10
    : 0

  const maxBarHours = 12

  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="page-title mb-2">设备管理</h1>
        {loadError && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Supabase 未配置，当前显示示例数据：{loadError}</span>
          </div>
        )}
        <p className="text-sm text-slate-500">设备状态监控与利用率统计分析</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={Cpu}
          title="设备总数"
          value={totalInstruments}
          trend="实验室在用设备"
        />
        <StatCard
          icon={AlertTriangle}
          title="停用设备"
          value={disabledCount}
          trend="需要关注的设备"
          trendUp={false}
        />
        <StatCard
          icon={Clock}
          title="今日使用时长"
          value={`${todayHours}h`}
          trend="累计预约使用"
        />
        <StatCard
          icon={TrendingUp}
          title="平均利用率"
          value={`${avgUtilization}%`}
          trend="近30天平均"
        />
      </div>

      <div className="card mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title mb-1">每日使用时长分布（柱状图）</h2>
            <p className="text-xs text-slate-400">今日各设备累计预约使用小时数</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString('zh-CN')}
          </div>
        </div>

        <div className="space-y-3">
          {dailyData.map(d => (
            <div key={d.instrument_id} className="flex items-center gap-4">
              <div className="w-44 shrink-0 text-sm text-slate-700 font-medium truncate">
                {d.instrument_name}
              </div>
              <div className="flex-1 h-10 bg-slate-50 rounded-lg flex items-end overflow-hidden px-1.5 gap-1">
                {Array.from({ length: maxBarHours }, (_, i) => i < Math.ceil(d.used_hours)).map((fill, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex-1 rounded-t-sm transition-all duration-300',
                      fill ? 'bg-gradient-to-t from-teal-500 to-teal-400' : 'bg-transparent',
                      i >= maxBarHours - 2 && fill ? 'h-9' : fill ? 'h-7' : 'h-0'
                    )}
                    style={{
                      height: fill ? ((i + 1) / maxBarHours) * 100 + '%' : '0%',
                    }}
                  />
                ))}
              </div>
              <div className="w-20 text-right shrink-0">
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {d.used_hours.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 ml-0.5">h</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="flex items-end gap-0.5 h-4">
              <div className="w-1.5 bg-teal-200 rounded-sm" style={{ height: '30%' }} />
              <div className="w-1.5 bg-teal-300 rounded-sm" style={{ height: '55%' }} />
              <div className="w-1.5 bg-teal-400 rounded-sm" style={{ height: '75%' }} />
              <div className="w-1.5 bg-teal-500 rounded-sm" style={{ height: '100%' }} />
            </div>
            <span>使用率从低到高</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Info className="w-3.5 h-3.5" />
            <span>单日理论可用 {maxBarHours}h</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title mb-1">7日预约热力图</h2>
            <p className="text-xs text-slate-400">近一周各设备每天的预约时段数统计</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-8 gap-2 mb-2">
              <div className="text-xs font-medium text-slate-500 px-3 py-2">设备</div>
              {LAST_7_DAYS.map(day => (
                <div key={day} className="text-xs font-medium text-slate-500 text-center py-2">{day}</div>
              ))}
            </div>

            {instrumentNames.map(inst => (
              <div key={inst} className="grid grid-cols-8 gap-2 mb-2">
                <div className="text-sm text-slate-600 px-3 py-3 rounded-lg bg-slate-50 font-medium truncate">
                  {inst}
                </div>
                {LAST_7_DAYS.map(day => {
                  const used = heatmapData[`${inst}-${day}`] || 0
                  return (
                    <div
                      key={day}
                      className={cn(
                        'flex items-center justify-center rounded-lg text-sm font-semibold transition-all hover:ring-2 hover:ring-teal-400/30 cursor-default aspect-square',
                        getHeatmapColor(used),
                        getHeatmapTextColor(used)
                      )}
                      title={`${inst} ${day}: ${used} 个时段`}
                    >
                      {used}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <div className="text-xs text-slate-500">预约时段数（每时段1小时）</div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">少</span>
              <div className="flex gap-1">
                <div className="w-6 h-6 rounded bg-slate-50 border border-slate-100" title="0" />
                <div className="w-6 h-6 rounded bg-teal-50" title="1-2" />
                <div className="w-6 h-6 rounded bg-teal-100" title="3-5" />
                <div className="w-6 h-6 rounded bg-teal-300" title="6-8" />
                <div className="w-6 h-6 rounded bg-teal-500" title="9-10" />
                <div className="w-6 h-6 rounded bg-teal-700" title="11+" />
              </div>
              <span className="text-xs text-slate-400">多</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 card bg-gradient-to-br from-slate-50 to-teal-50/30 border-slate-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
            <Info className="w-5 h-5 text-teal-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-1">设备利用率分析建议</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              根据近30天统计数据，当前整体设备利用率为 <strong className="text-teal-700">{avgUtilization}%</strong>。
              {avgUtilization < 40 ? ' 利用率偏低，建议加强设备开放宣传并优化预约流程。' : avgUtilization > 70 ? ' 利用率较高，部分热门设备可能需要增加机时或购置新设备。' : ' 利用率处于合理区间，设备资源配置较为均衡。'}
              建议定期审查设备使用数据，合理分配预约时段。
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
