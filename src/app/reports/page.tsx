'use client'

import { Suspense, useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import { generateReport } from '../actions'
import { useActionState } from 'react'
import { BarChart3, TrendingUp, Users, AlertTriangle, Calendar, RefreshCw } from 'lucide-react'

interface ReportData {
  trend: Array<{
    date: string
    totalConversations: number
    hitRate: number
    accuracyRate: number
    knowledgeUsed: number
    riskCount: number
  }>
  coverage: Array<{
    ownerName: string
    total: number
    active: number
    expired: number
    underReview: number
  }>
  expireReasons: Array<{
    reason: string
    count: number
  }>
  knowledgeByDate: Array<{
    date: string
    count: number
  }>
  summary: {
    totalKnowledge: number
    activeKnowledge: number
    expiredKnowledge: number
    pendingConversations: number
    unresolvedRisks: number
  }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

function ReportCharts() {
  const [data, setData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const [state, formAction] = useActionState(generateReport, {
    success: false,
    error: null,
  })

  useEffect(() => {
    fetch('/api/reports?type=summary')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data)
        }
      })
      .catch(e => console.error('Failed to fetch reports'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-96 animate-pulse bg-gray-100 rounded-xl" />
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">暂无报表数据</div>
  }

  const trendData = data.trend.map(item => ({
    ...item,
    hitRate: (item.hitRate * 100).toFixed(1),
    accuracyRate: (item.accuracyRate * 100).toFixed(1),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          数据报表
        </h2>
        <form action={formAction} className="flex items-center gap-3">
          <input
            type="date"
            name="date"
            defaultValue={new Date().toISOString().split('T')[0]}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <RefreshCw className="w-4 h-4" />
            生成日报
          </button>
        </form>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">知识库总数</p>
              <p className="text-2xl font-bold text-gray-900">{data.summary.totalKnowledge}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">活跃知识</p>
              <p className="text-2xl font-bold text-green-600">{data.summary.activeKnowledge}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">已过期</p>
              <p className="text-2xl font-bold text-red-600">{data.summary.expiredKnowledge}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">待处理会话</p>
              <p className="text-2xl font-bold text-yellow-600">{data.summary.pendingConversations}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">未解决风险</p>
              <p className="text-2xl font-bold text-orange-600">{data.summary.unresolvedRisks}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">命中率与准确率趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hitRate"
                name="命中率(%)"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracyRate"
                name="准确率(%)"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">会话量与风险数趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="totalConversations"
                name="会话量"
                fill="#3B82F6"
                stroke="#3B82F6"
              />
              <Area
                type="monotone"
                dataKey="riskCount"
                name="风险数"
                fill="#EF4444"
                stroke="#EF4444"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">知识覆盖按负责人分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.coverage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="ownerName" tick={{ fontSize: 12 }} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" name="生效中" fill="#10B981" />
              <Bar dataKey="expired" name="已过期" fill="#EF4444" />
              <Bar dataKey="underReview" name="审核中" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">过期原因分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.expireReasons}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ reason, percent }) => `${reason} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.expireReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">近30天知识新增趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.knowledgeByDate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" name="新增知识" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-600" />
          知识覆盖按负责人明细
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">负责人</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">总数</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">生效中</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">已过期</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">审核中</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">覆盖率</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.map((item, index) => (
              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{item.ownerName}</td>
                <td className="text-center py-3 px-4 text-gray-600">{item.total}</td>
                <td className="text-center py-3 px-4">
                  <span className="text-green-600 font-medium">{item.active}</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-red-600 font-medium">{item.expired}</span>
                </td>
                <td className="text-center py-3 px-4">
                  <span className="text-yellow-600 font-medium">{item.underReview}</span>
                </td>
                <td className="text-center py-3 px-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${item.total > 0 ? (item.active / item.total * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {item.total > 0 ? ((item.active / item.total) * 100).toFixed(0) : 0}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">数据报表</h1>
        <p className="text-gray-600">查看命中率、准确率、知识覆盖等多维度数据分析</p>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse bg-gray-100 rounded-xl" />}>
        <ReportCharts />
      </Suspense>
    </div>
  )
}
