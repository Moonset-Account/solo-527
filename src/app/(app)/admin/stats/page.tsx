'use client'

import { useEffect, useState } from 'react'
import { useApi } from '@/components/useApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { BillingStats, WorkOrderStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1']

export default function StatsPage() {
  const { request, loading } = useApi()
  const [stats, setStats] = useState<{ billingStats: BillingStats; workOrderStats: WorkOrderStats } | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const data = await request<{ billingStats: BillingStats; workOrderStats: WorkOrderStats }>('/api/stats')
      if (data) setStats(data)
    }
    load()
  }, [request])

  const doExport = async (type: string) => {
    setExporting(true)
    try {
      const res = await fetch(`/api/export?type=${type}`)
      if (!res.ok) throw new Error('导出失败')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const header = res.headers.get('Content-Disposition') || ''
      const match = header.match(/filename="(.+)"/)
      a.download = match ? decodeURIComponent(match[1]) : `${type}_${formatDate(new Date())}.xlsx`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      alert(e instanceof Error ? e.message : '导出失败')
    }
    setExporting(false)
  }

  if (loading || !stats) {
    return <div className="text-gray-500 p-8">加载中...</div>
  }

  const paymentRate = stats.billingStats.totalBilled > 0
    ? ((stats.billingStats.totalPaid / stats.billingStats.totalBilled) * 100).toFixed(1)
    : '0'

  const workOrderPieData = [
    { name: '待处理', value: stats.workOrderStats.pending },
    { name: '处理中', value: stats.workOrderStats.inProgress },
    { name: '已完成', value: stats.workOrderStats.completed },
    { name: '已超时', value: stats.workOrderStats.overdue },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据报表</h1>
          <p className="text-gray-500 mt-1">收费进度与工单统计</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-secondary" onClick={() => doExport('bills')} disabled={exporting}>
            📊 导出账单报表
          </button>
          <button className="btn btn-secondary" onClick={() => doExport('workorders')} disabled={exporting}>
            🔧 导出工单报表
          </button>
          <button className="btn btn-secondary" onClick={() => doExport('payments')} disabled={exporting}>
            💰 导出缴费报表
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="text-sm text-gray-500">应缴总额</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.billingStats.totalBilled)}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">已缴总额</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(stats.billingStats.totalPaid)}</div>
          <div className="text-xs text-gray-500 mt-1">收缴率 {paymentRate}%</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">待缴费笔数</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.billingStats.totalPending}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">已逾期笔数</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.billingStats.totalOverdue}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">月度收费趋势</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.billingStats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="billed" name="应缴金额" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid" name="已缴金额" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 mb-4">工单状态分布</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={workOrderPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {workOrderPieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-5">
          <div className="text-sm text-gray-500">总工单数</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{stats.workOrderStats.total}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">待处理</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">{stats.workOrderStats.pending}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">处理中</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats.workOrderStats.inProgress}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">已完成</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{stats.workOrderStats.completed}</div>
        </div>
        <div className="card p-5">
          <div className="text-sm text-gray-500">已超时</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{stats.workOrderStats.overdue}</div>
        </div>
      </div>
    </div>
  )
}
