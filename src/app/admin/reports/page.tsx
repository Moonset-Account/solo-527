'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { CalendarDays, Clock, FlaskConical, Download } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StatCard from '@/components/ui/StatCard'
import type { ProjectReport } from '@/types'

const MOCK_REPORTS: ProjectReport[] = [
  { project_id: 'p1', project_name: '蛋白质组学研究', booking_count: 45, total_hours: 128.5, sample_count: 32, team_members: ['张三', '李四', '王五'] },
  { project_id: 'p2', project_name: '基因编辑技术', booking_count: 38, total_hours: 96.0, sample_count: 25, team_members: ['赵六', '钱七'] },
  { project_id: 'p3', project_name: '纳米材料合成', booking_count: 52, total_hours: 156.0, sample_count: 41, team_members: ['孙八', '周九', '吴十', '郑一'] },
  { project_id: 'p4', project_name: '环境微生物检测', booking_count: 29, total_hours: 72.5, sample_count: 18, team_members: ['冯二', '陈三'] },
]

const MONTHLY_DATA = [
  { month: '1月', 蛋白质组学研究: 8, 基因编辑技术: 6, 纳米材料合成: 10, 环境微生物检测: 4 },
  { month: '2月', 蛋白质组学研究: 7, 基因编辑技术: 8, 纳米材料合成: 9, 环境微生物检测: 5 },
  { month: '3月', 蛋白质组学研究: 10, 基因编辑技术: 7, 纳米材料合成: 12, 环境微生物检测: 6 },
  { month: '4月', 蛋白质组学研究: 9, 基因编辑技术: 9, 纳米材料合成: 11, 环境微生物检测: 7 },
  { month: '5月', 蛋白质组学研究: 6, 基因编辑技术: 4, 纳米材料合成: 5, 环境微生物检测: 4 },
  { month: '6月', 蛋白质组学研究: 5, 基因编辑技术: 4, 纳米材料合成: 5, 环境微生物检测: 3 },
]

const STATUS_PIE_DATA = [
  { name: '待处理', value: 35, color: '#f59e0b' },
  { name: '进行中', value: 48, color: '#14b8a6' },
  { name: '已完成', value: 33, color: '#10b981' },
]

const BAR_COLORS = ['#0f766e', '#0d9488', '#2dd4bf', '#5eead4']

export default function ReportsPage() {
  const [selectedProject, setSelectedProject] = useState<string>('all')

  const displayReports = selectedProject === 'all'
    ? MOCK_REPORTS
    : MOCK_REPORTS.filter((r) => r.project_id === selectedProject)

  const totals = displayReports.reduce(
    (acc, r) => ({
      booking_count: acc.booking_count + r.booking_count,
      total_hours: acc.total_hours + r.total_hours,
      sample_count: acc.sample_count + r.sample_count,
    }),
    { booking_count: 0, total_hours: 0, sample_count: 0 }
  )

  const handleExport = () => {
    const header = '项目名称,预约次数,使用时长(h),样本数,团队成员'
    const rows = displayReports.map(
      (r) => `${r.project_name},${r.booking_count},${r.total_hours},${r.sample_count},"${r.team_members.join('、')}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '项目报表.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">项目报表</h1>
          <button onClick={handleExport} className="btn-primary">
            <Download className="w-4 h-4" />
            导出报表
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="label mb-0">选择项目</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="input-field w-auto min-w-[200px]"
          >
            <option value="all">全部项目</option>
            {MOCK_REPORTS.map((r) => (
              <option key={r.project_id} value={r.project_id}>{r.project_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="预约总次数" value={totals.booking_count} icon={CalendarDays} />
          <StatCard title="使用总时长(h)" value={totals.total_hours.toFixed(1)} icon={Clock} />
          <StatCard title="样本总数" value={totals.sample_count} icon={FlaskConical} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="section-title mb-4">月度预约统计</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={MONTHLY_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                {MOCK_REPORTS.map((r, idx) => (
                  <Bar key={r.project_id} dataKey={r.project_name} fill={BAR_COLORS[idx]} radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 className="section-title mb-4">样本处理状态分布</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={STATUS_PIE_DATA}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {STATUS_PIE_DATA.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h2 className="section-title mb-4">项目列表</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">项目名称</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-500">预约次数</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-500">使用时长(h)</th>
                  <th className="text-center py-3 px-4 font-medium text-slate-500">样本数</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">团队成员</th>
                </tr>
              </thead>
              <tbody>
                {displayReports.map((r) => (
                  <tr key={r.project_id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{r.project_name}</td>
                    <td className="py-3 px-4 text-center">{r.booking_count}</td>
                    <td className="py-3 px-4 text-center">{r.total_hours}</td>
                    <td className="py-3 px-4 text-center">{r.sample_count}</td>
                    <td className="py-3 px-4 text-slate-600">{r.team_members.join('、')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
