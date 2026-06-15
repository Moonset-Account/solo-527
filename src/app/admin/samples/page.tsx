'use client'

import { useState } from 'react'
import { Search, FlaskConical, MapPin, User, FileText } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import EmptyState from '@/components/ui/EmptyState'
import type { SampleTracking, Sample } from '@/types'

const MOCK_SAMPLE: Sample = {
  id: 's1',
  sample_code: 'SMP-2024-001',
  name: '细胞培养基A',
  project_id: 'p1',
  created_by: 'u1',
  processing_status: 'in_progress',
  responsible_person: '张三',
  created_at: '2024-03-01T08:00:00Z',
}

const MOCK_TRACKING: SampleTracking = {
  sample_id: 's1',
  timeline: [
    { timestamp: '2024-03-01 08:30', action: '创建', operator: '张三', location: '样本接收室', notes: '样本信息录入系统' },
    { timestamp: '2024-03-02 10:00', action: '预约', operator: '李四', location: '在线系统', notes: '预约质谱仪检测' },
    { timestamp: '2024-03-03 09:15', action: '送样', operator: '张三', location: '实验室B-201', notes: '样本送达检测工位' },
    { timestamp: '2024-03-04 14:00', action: '检测', operator: '王五', location: '质谱仪室', notes: '质谱分析进行中' },
    { timestamp: '2024-03-06 16:30', action: '归档', operator: '赵六', location: '档案室', notes: '检测结果归档保存' },
  ],
}

const MOCK_PROJECTS: Record<string, string> = { p1: '蛋白质组学研究' }

export default function SamplesPage() {
  const [searchCode, setSearchCode] = useState('')
  const [sample, setSample] = useState<Sample | null>(null)
  const [tracking, setTracking] = useState<SampleTracking | null>(null)

  const handleSearch = () => {
    if (searchCode.trim().toUpperCase() === 'SMP-2024-001') {
      setSample(MOCK_SAMPLE)
      setTracking(MOCK_TRACKING)
    } else {
      setSample(null)
      setTracking(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="page-title">样本追踪</h1>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入样本编号，如 SMP-2024-001"
              className="input-field pl-9"
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            <Search className="w-4 h-4" />
            搜索
          </button>
        </div>

        {!sample && !tracking && (
          <EmptyState title="暂无搜索结果" description="请输入样本编号进行搜索" />
        )}

        {sample && tracking && (
          <>
            <div className="card">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-teal-50">
                  <FlaskConical className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">样本编号</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{sample.sample_code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">样本名称</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{sample.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">所属课题</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">
                      {sample.project_id ? MOCK_PROJECTS[sample.project_id] || '-' : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">处理状态</p>
                    <div className="mt-0.5">
                      <StatusBadge status={sample.processing_status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">责任人</p>
                    <p className="text-sm font-semibold text-slate-900 mt-0.5">{sample.responsible_person || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="section-title mb-6">样本流转记录</h2>
              <div className="relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-teal-200" />
                <div className="space-y-6">
                  {tracking.timeline.map((event, idx) => (
                    <div key={idx} className="relative flex gap-4 pl-8">
                      <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-teal-500 border-4 border-teal-100 z-10" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-teal-700">{event.action}</span>
                          <span className="text-xs text-slate-400">{event.timestamp}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            {event.operator}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            {event.location}
                          </span>
                        </div>
                        {event.notes && (
                          <p className="mt-1 text-sm text-slate-500 inline-flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5" />
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
