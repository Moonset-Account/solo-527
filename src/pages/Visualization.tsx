import { useState, useEffect } from 'react'
import { useAppStore } from '@/hooks/useAppStore'
import { CaliberTooltip } from '@/components/CaliberTooltip'
import { StickyNote } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Legend,
} from 'recharts'

interface WaitBucket { range: string; count: number }
interface CancelReason { reason: string; count: number; rate: number }
interface ChannelTrend { month: string; [channel: string]: string | number }
interface FunnelStage { stage: string; count: number; rate: number }

const WAIT_COLORS = ['#0D9488', '#2DD4BF', '#F59E0B', '#F97066']
const CHANNEL_COLORS: Record<string, string> = {
  '线上预约': '#0D9488',
  '线下窗口': '#6366F1',
  '辅导员转介': '#F59E0B',
  '家长转介': '#F97066',
  '朋辈推荐': '#8B5CF6',
}
const FUNNEL_COLORS = ['#0D9488', '#2DD4BF', '#F59E0B', '#F97066']

export default function Visualization() {
  const { openNotesDrawer } = useAppStore()
  const [waitData, setWaitData] = useState<WaitBucket[]>([])
  const [cancelData, setCancelData] = useState<CancelReason[]>([])
  const [channelData, setChannelData] = useState<ChannelTrend[]>([])
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([])

  useEffect(() => {
    fetch('/api/analysis/wait-distribution').then(r => r.json()).then(setWaitData).catch(() => {})
    fetch('/api/analysis/cancel-reasons').then(r => r.json()).then(setCancelData).catch(() => {})
    fetch('/api/analysis/channel-trend').then(r => r.json()).then(setChannelData).catch(() => {})
    fetch('/api/analysis/followup-funnel').then(r => r.json()).then(setFunnelData).catch(() => {})
  }, [])

  const maxFunnelCount = Math.max(...funnelData.map((f) => f.count), 1)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-zinc-800">可视化工作台</h1>
        <p className="text-sm text-zinc-500 mt-0.5">等待分布、取消原因、渠道趋势、回访漏斗</p>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-700">等待时间分布</h2>
              <CaliberTooltip metricKey="avgWaitDays" metricName="平均等待天数" />
            </div>
            <button
              onClick={() => openNotesDrawer({ targetKey: 'viz:waitDistribution', label: '等待时间分布' })}
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
            >
              <StickyNote size={12} /> 备注
            </button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={waitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717A' }} />
              <RechartsTooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E4E4E7' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} name="预约人数">
                {waitData.map((_, i) => (
                  <Cell key={i} fill={WAIT_COLORS[i % WAIT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-700">取消原因分析</h2>
              <CaliberTooltip metricKey="cancelRate" metricName="取消率" />
            </div>
            <button
              onClick={() => openNotesDrawer({ targetKey: 'viz:cancelReasons', label: '取消原因分析' })}
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
            >
              <StickyNote size={12} /> 备注
            </button>
          </div>
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={260}>
              <PieChart>
                <Pie
                  data={cancelData}
                  dataKey="count"
                  nameKey="reason"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {cancelData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        ['#F97066', '#F59E0B', '#6366F1', '#0D9488', '#8B5CF6', '#71717A'][i % 6]
                      }
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E4E4E7' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {cancelData.map((item, i) => (
                <div key={item.reason} className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: ['#F97066', '#F59E0B', '#6366F1', '#0D9488', '#8B5CF6', '#71717A'][i % 6],
                    }}
                  />
                  <span className="text-xs text-zinc-600 flex-1 truncate">{item.reason}</span>
                  <span className="text-xs font-medium text-zinc-800">{item.rate}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-700">渠道趋势</h2>
              <CaliberTooltip metricKey="appointmentCount" metricName="预约数" />
            </div>
            <button
              onClick={() => openNotesDrawer({ targetKey: 'viz:channelTrend', label: '渠道趋势' })}
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
            >
              <StickyNote size={12} /> 备注
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={channelData}>
              <defs>
                {Object.entries(CHANNEL_COLORS).map(([ch, color]) => (
                  <linearGradient key={ch} id={`grad-${ch}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E4E7" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#71717A' }} />
              <YAxis tick={{ fontSize: 10, fill: '#71717A' }} />
              <RechartsTooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E4E4E7' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {Object.entries(CHANNEL_COLORS).map(([ch, color]) => (
                <Area
                  key={ch}
                  type="monotone"
                  dataKey={ch}
                  stroke={color}
                  fill={`url(#grad-${ch})`}
                  strokeWidth={1.5}
                  stackId="1"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-white p-5 shadow-sm col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-zinc-700">回访漏斗</h2>
              <CaliberTooltip metricKey="followUpRate" metricName="回访完成率" />
            </div>
            <button
              onClick={() => openNotesDrawer({ targetKey: 'viz:followupFunnel', label: '回访漏斗' })}
              className="flex items-center gap-1 rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:text-teal-600 hover:border-teal-300 transition-colors"
            >
              <StickyNote size={12} /> 备注
            </button>
          </div>
          <div className="flex items-center justify-center gap-0 py-4">
            {funnelData.map((stage, i) => {
              const widthPct = Math.max((stage.count / maxFunnelCount) * 100, 20)
              return (
                <div key={stage.stage} className="flex flex-col items-center" style={{ width: '25%' }}>
                  <div
                    className="flex items-center justify-center rounded-lg transition-all"
                    style={{
                      width: `${widthPct}%`,
                      height: 56,
                      backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] + '18',
                      borderTop: `3px solid ${FUNNEL_COLORS[i % FUNNEL_COLORS.length]}`,
                    }}
                  >
                    <span className="text-lg font-bold" style={{ color: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}>
                      {stage.count}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-medium text-zinc-700">{stage.stage}</p>
                  <p className="text-[10px] text-zinc-400">转化率 {stage.rate}%</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
