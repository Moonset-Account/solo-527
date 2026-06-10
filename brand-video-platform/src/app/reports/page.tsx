'use client'

import { useState, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { exportToCSV, exportToExcel } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Download, Calendar } from 'lucide-react'

type TimeRange = 'week' | 'month' | 'custom'

export default function ReportsPage() {
  const topics = useAppStore((s) => s.topics)
  const scripts = useAppStore((s) => s.scripts)
  const tasks = useAppStore((s) => s.tasks)
  const schedules = useAppStore((s) => s.schedules)

  const [timeRange, setTimeRange] = useState<TimeRange>('month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv')
  const [exportDimension, setExportDimension] = useState<'production' | 'funnel'>('production')

  const isInRange = (dateStr: string) => {
    const d = new Date(dateStr)
    if (timeRange === 'week') {
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return d >= weekAgo && d <= now
    }
    if (timeRange === 'month') {
      const now = new Date()
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      return d >= monthAgo && d <= now
    }
    if (timeRange === 'custom' && customStart && customEnd) {
      return d >= new Date(customStart) && d <= new Date(customEnd + 'T23:59:59Z')
    }
    return true
  }

  const filteredTopics = useMemo(() => topics.filter((t) => isInRange(t.created_at)), [topics, timeRange, customStart, customEnd])
  const filteredScripts = useMemo(() => scripts.filter((s) => isInRange(s.created_at)), [scripts, timeRange, customStart, customEnd])
  const filteredFilmingTasks = useMemo(() => tasks.filter((t) => t.type === 'filming' && isInRange(t.created_at)), [tasks, timeRange, customStart, customEnd])
  const filteredEditingTasks = useMemo(() => tasks.filter((t) => t.type === 'editing' && isInRange(t.created_at)), [tasks, timeRange, customStart, customEnd])
  const filteredSchedules = useMemo(() => schedules.filter((s) => isInRange(s.created_at)), [schedules, timeRange, customStart, customEnd])

  const productionData = useMemo(() => [
    { name: '选题', 数量: filteredTopics.length, fill: '#3b82f6' },
    { name: '脚本', 数量: filteredScripts.length, fill: '#8b5cf6' },
    { name: '拍摄', 数量: filteredFilmingTasks.length, fill: '#f97316' },
    { name: '剪辑', 数量: filteredEditingTasks.length, fill: '#22c55e' },
    { name: '发布', 数量: filteredSchedules.filter((s) => s.status === 'published').length, fill: '#06b6d4' },
  ], [filteredTopics, filteredScripts, filteredFilmingTasks, filteredEditingTasks, filteredSchedules])

  const funnelData = useMemo(() => {
    const topicCount = filteredTopics.length
    const scriptCount = filteredScripts.length
    const filmingCount = filteredFilmingTasks.length
    const editingCount = filteredEditingTasks.length
    const publishCount = filteredSchedules.filter((s) => s.status === 'published').length

    return [
      { name: '选题', count: topicCount, color: '#3b82f6' },
      { name: '脚本', count: scriptCount, color: '#8b5cf6', rate: topicCount > 0 ? ((scriptCount / topicCount) * 100).toFixed(1) : '0.0' },
      { name: '拍摄', count: filmingCount, color: '#f97316', rate: scriptCount > 0 ? ((filmingCount / scriptCount) * 100).toFixed(1) : '0.0' },
      { name: '剪辑', count: editingCount, color: '#22c55e', rate: filmingCount > 0 ? ((editingCount / filmingCount) * 100).toFixed(1) : '0.0' },
      { name: '发布', count: publishCount, color: '#06b6d4', rate: editingCount > 0 ? ((publishCount / editingCount) * 100).toFixed(1) : '0.0' },
    ]
  }, [filteredTopics, filteredScripts, filteredFilmingTasks, filteredEditingTasks, filteredSchedules])

  const maxFunnelCount = Math.max(...funnelData.map((d) => d.count), 1)

  const handleExport = () => {
    if (exportDimension === 'production') {
      const data = productionData.map((d) => ({ 环节: d.name, 数量: d.数量 }))
      if (exportFormat === 'csv') exportToCSV(data, '产能报表')
      else exportToExcel(data, '产能报表')
    } else {
      const data = funnelData.map((d) => ({
        环节: d.name,
        数量: d.count,
        转化率: d.rate ? `${d.rate}%` : '-',
      }))
      if (exportFormat === 'csv') exportToCSV(data, '漏斗数据')
      else exportToExcel(data, '漏斗数据')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">报表中心</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Calendar className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(['week', 'month', 'custom'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                    timeRange === range ? 'bg-white shadow-sm text-gray-900 font-medium' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range === 'week' ? '本周' : range === 'month' ? '本月' : '自定义'}
                </button>
              ))}
            </div>
            {timeRange === 'custom' && (
              <>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400 text-sm">至</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">产能报表</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 13 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 13 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  formatter={(value) => [value, '数量']}
                />
                <Legend />
                <Bar dataKey="数量" radius={[6, 6, 0, 0]}>
                  {productionData.map((entry, index) => (
                    <rect key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">选题转化漏斗</h2>
          <div className="space-y-3 max-w-2xl mx-auto">
            {funnelData.map((stage, index) => {
              const widthPercent = maxFunnelCount > 0 ? (stage.count / maxFunnelCount) * 100 : 0
              return (
                <div key={stage.name} className="flex items-center gap-4">
                  <div className="w-14 text-sm text-gray-500 text-right shrink-0">{stage.name}</div>
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1 h-10 flex items-center justify-center relative">
                      <div
                        className="h-full rounded-md flex items-center justify-center transition-all duration-500"
                        style={{
                          width: `${Math.max(widthPercent, 8)}%`,
                          backgroundColor: stage.color,
                          margin: '0 auto',
                        }}
                      >
                        <span className="text-white text-sm font-semibold">{stage.count}</span>
                      </div>
                    </div>
                    {stage.rate !== undefined && (
                      <div className="w-16 text-sm text-gray-500 text-right shrink-0">
                        {stage.rate}%
                      </div>
                    )}
                    {index === 0 && <div className="w-16 shrink-0" />}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-4 text-center text-xs text-gray-400">
            转化率为相邻环节间的数量比值
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">数据导出</h2>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-sm text-gray-500 mr-2">导出格式</label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as 'csv' | 'excel')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="excel">Excel</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-500 mr-2">数据维度</label>
              <select
                value={exportDimension}
                onChange={(e) => setExportDimension(e.target.value as 'production' | 'funnel')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="production">产能数据</option>
                <option value="funnel">漏斗数据</option>
              </select>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
