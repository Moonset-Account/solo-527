import { createLazyFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { statsApi } from '../lib/api'
import type { RevenueCostStats, RetentionStats, MembersStats } from '../lib/types'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function generateTrendData(days: number, stats: RevenueCostStats) {
  const data = []
  const now = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]

    const revenueBase = Number(stats.revenue.total) / days
    const costBase = Number(stats.cost.total) / days

    data.push({
      date: dateStr.slice(5),
      revenue: Math.round(revenueBase * (0.7 + Math.random() * 0.6)),
      cost: Math.round(costBase * (0.7 + Math.random() * 0.6)),
    })
  }

  return data
}

function AdminPage() {
  const [revenueCostStats, setRevenueCostStats] = useState<RevenueCostStats | null>(null)
  const [retentionStats, setRetentionStats] = useState<RetentionStats | null>(null)
  const [membersStats, setMembersStats] = useState<MembersStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [revenueCost, retention, members] = await Promise.all([
          statsApi.getRevenueCost(),
          statsApi.getRetention(),
          statsApi.getMembers(),
        ])
        setRevenueCostStats(revenueCost)
        setRetentionStats(retention)
        setMembersStats(members)
      } catch (error) {
        console.error('Failed to fetch stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (value: number | string) => {
    const num = typeof value === 'string' ? Number(value) : value
    return `¥${num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const trendData = revenueCostStats ? generateTrendData(30, revenueCostStats) : []

  const revenueByTypeData = revenueCostStats?.revenue.byType.map((item) => ({
    name: item.type,
    value: Number(item.amount),
  })) || []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const statCards = [
    {
      label: '总收入',
      value: formatCurrency(revenueCostStats?.revenue.total || 0),
      change: '+12.5%',
      icon: '💰',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: '订阅用户',
      value: membersStats?.total.toLocaleString() || '0',
      change: '+8.3%',
      icon: '👥',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: '订单总数',
      value: revenueCostStats?.revenue.count.toLocaleString() || '0',
      change: '+15.2%',
      icon: '📦',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: '续订率',
      value: `${retentionStats?.renewalRate || 0}%`,
      change: '-2.1%',
      icon: '📈',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className={`w-10 h-10 ${card.bgColor} rounded-lg flex items-center justify-center text-xl`}
              >
                {card.icon}
              </div>
              <span
                className={`text-sm font-medium ${
                  card.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {card.change}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">收入成本趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  name="收入"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="成本"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">收入类型分布</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueByTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {revenueByTypeData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-medium text-gray-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">订阅计划分布</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {retentionStats?.byPlan.map((plan, index) => (
            <div
              key={plan.planId}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-800">{plan.planName}</h4>
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              <div className="text-2xl font-bold text-gray-800 mb-1">{plan.total}</div>
              <div className="text-sm text-gray-500">
                活跃: {plan.active} 人
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export const Route = createLazyFileRoute('/admin')({
  component: AdminPage,
})
