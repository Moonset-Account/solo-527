import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scissors, ClipboardCheck, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, Package, FileText, Plus,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { useApi } from '@/hooks/useApi'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'

const mockOverview = {
  todayHarvest: { value: 1240, unit: 'kg', trend: 12.5 },
  pendingReview: { value: 8, unit: '条', trend: -3 },
  alertCount: { value: 3, unit: '条', trend: 1 },
  fulfillmentRate: { value: 94.2, unit: '%', trend: 2.1 },
}

const mockTrend = [
  { date: '06-05', amount: 980 },
  { date: '06-06', amount: 1120 },
  { date: '06-07', amount: 860 },
  { date: '06-08', amount: 1350 },
  { date: '06-09', amount: 1100 },
  { date: '06-10', amount: 1240 },
  { date: '06-11', amount: 1240 },
]

const mockVariety = [
  { name: '红富士', value: 420, color: '#DC2626' },
  { name: '嘎啦', value: 280, color: '#F59E0B' },
  { name: '金冠', value: 210, color: '#EAB308' },
  { name: '国光', value: 180, color: '#22C55E' },
  { name: '其他', value: 150, color: '#8B5CF6' },
]

const mockPending = [
  { id: '1', type: '农事记录', title: '红富士A区施肥记录', time: '2小时前' },
  { id: '2', type: '采收记录', title: '嘎啦B区采收记录', time: '3小时前' },
  { id: '3', type: '分拣订单', title: 'GD-20260611-003 待分拣', time: '1小时前' },
]

const mockAlerts = [
  { id: '1', level: 'warning', message: 'A3地块农药残留检测待提交' },
  { id: '2', level: 'error', message: '订单 OR-20260608-012 履约超期' },
  { id: '3', level: 'info', message: '本周申报材料截止日为周五' },
]

interface OverviewCardProps {
  icon: React.ElementType
  label: string
  value: number | string
  unit: string
  trend: number
  gradient: string
}

function OverviewCard({ icon: Icon, label, value, unit, trend, gradient }: OverviewCardProps) {
  const isUp = trend >= 0
  return (
    <div className={cn('rounded-xl p-5 text-white', gradient)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm opacity-90">{label}</span>
        <Icon className="h-5 w-5 opacity-80" />
      </div>
      <div className="text-2xl font-bold">
        {value}
        <span className="text-sm font-normal ml-1 opacity-80">{unit}</span>
      </div>
      <div className="flex items-center gap-1 mt-2 text-xs opacity-90">
        {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
        <span>{isUp ? '+' : ''}{trend}%</span>
        <span className="opacity-70">较昨日</span>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { execute, data: overview } = useApi<typeof mockOverview>()
  const [trend, setTrend] = useState(mockTrend)
  const [variety, setVariety] = useState(mockVariety)
  const [pending, setPending] = useState(mockPending)
  const [alerts, setAlerts] = useState(mockAlerts)

  const displayOverview = overview || mockOverview

  useEffect(() => {
    execute('/api/dashboard/overview').catch(() => {})
    fetch('/api/dashboard/trend')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setTrend)
      .catch(() => {})
    fetch('/api/dashboard/variety')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setVariety)
      .catch(() => {})
    fetch('/api/dashboard/pending')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setPending)
      .catch(() => {})
    fetch('/api/dashboard/alerts')
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then(setAlerts)
      .catch(() => {})
  }, [])

  const overviewCards: OverviewCardProps[] = [
    { icon: Scissors, label: '今日采收量', ...displayOverview.todayHarvest, gradient: 'bg-gradient-to-br from-primary-600 to-primary-800' },
    { icon: ClipboardCheck, label: '待审核', ...displayOverview.pendingReview, gradient: 'bg-gradient-to-br from-accent-500 to-accent-700' },
    { icon: AlertTriangle, label: '异常数', ...displayOverview.alertCount, gradient: 'bg-gradient-to-br from-red-500 to-red-700' },
    { icon: TrendingUp, label: '履约率', ...displayOverview.fulfillmentRate, gradient: 'bg-gradient-to-br from-emerald-500 to-emerald-700' },
  ]

  const alertColors: Record<string, string> = {
    error: 'border-red-400 bg-red-50 text-red-700',
    warning: 'border-amber-400 bg-amber-50 text-amber-700',
    info: 'border-blue-400 bg-blue-50 text-blue-700',
  }

  const quickActions = [
    { label: '新建农事记录', path: '/farm-records/new', icon: Plus },
    { label: '新建采收记录', path: '/harvests/new', icon: Scissors },
    { label: '新建分拣订单', path: '/sorting-orders/new', icon: Package },
    { label: '查看申报材料', path: '/declarations', icon: FileText },
  ]

  return (
    <div>
      <PageHeader title="仪表盘" subtitle="果园采摘生产总览" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {overviewCards.map((card) => (
          <OverviewCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">采收趋势（近7日）</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value: number) => [`${value} kg`, '采收量']}
              />
              <Area type="monotone" dataKey="amount" stroke="#1B4332" fill="#95D5B2" fillOpacity={0.4} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">品种分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={variety} cx="50%" cy="45%" innerRadius={50} outerRadius={80} dataKey="value" nameKey="name" label={false}>
                {variety.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value} kg`, '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">待处理事项</h3>
          <div className="space-y-3">
            {pending.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded mr-2">{item.type}</span>
                  <span className="text-sm text-gray-700">{item.title}</span>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 mb-4">异常提醒</h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className={cn('p-3 rounded-lg border-l-4 text-sm', alertColors[alert.level])}>
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border border-gray-200 text-sm text-gray-700 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-colors"
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
