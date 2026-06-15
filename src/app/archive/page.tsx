'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Upload, Download, Eye, Pencil } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import FilterBar from '@/components/ui/FilterBar'
import EmptyState from '@/components/ui/EmptyState'
import type { ArchiveRecord, ProcessingStatus } from '@/types'
import { PROCESSING_STATUS_LABELS } from '@/types'
import { cn } from '@/lib/utils'

const MOCK_RECORDS: ArchiveRecord[] = [
  {
    id: '1',
    user_id: 'u1',
    project_id: 'p1',
    sample_id: 's1',
    file_url: '/files/protein_analysis_2024.xlsx',
    file_name: '蛋白质分析数据_2024Q1.xlsx',
    processing_status: 'completed',
    responsible_person: '张伟',
    metadata: { instrument: '质谱仪A' },
    archived_at: '2024-12-01T10:30:00Z',
    project: { id: 'p1', name: '新型蛋白质结构研究', code: 'PRJ-2024-001', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's1', sample_code: 'SMP-001', name: '蛋白质样本A1', project_id: 'p1', created_by: null, processing_status: 'completed', responsible_person: null, created_at: '' },
  },
  {
    id: '2',
    user_id: 'u2',
    project_id: 'p1',
    sample_id: 's2',
    file_url: '/files/gene_seq_batch1.csv',
    file_name: '基因组测序_批次1.csv',
    processing_status: 'in_progress',
    responsible_person: '李娜',
    metadata: { batch: 'B1' },
    archived_at: '2024-12-03T14:20:00Z',
    project: { id: 'p1', name: '新型蛋白质结构研究', code: 'PRJ-2024-001', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's2', sample_code: 'SMP-002', name: 'DNA样本B3', project_id: 'p1', created_by: null, processing_status: 'in_progress', responsible_person: null, created_at: '' },
  },
  {
    id: '3',
    user_id: 'u3',
    project_id: 'p2',
    sample_id: 's3',
    file_url: '/files/microscope_img.zip',
    file_name: '显微镜图像_组1.zip',
    processing_status: 'pending',
    responsible_person: '王磊',
    metadata: {},
    archived_at: '2024-12-05T09:00:00Z',
    project: { id: 'p2', name: '纳米材料表征', code: 'PRJ-2024-002', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's3', sample_code: 'SMP-003', name: '纳米粒子C7', project_id: 'p2', created_by: null, processing_status: 'pending', responsible_person: null, created_at: '' },
  },
  {
    id: '4',
    user_id: 'u1',
    project_id: 'p2',
    sample_id: 's4',
    file_url: '/files/spectrum_report.pdf',
    file_name: '光谱分析报告.pdf',
    processing_status: 'completed',
    responsible_person: '赵敏',
    metadata: { type: '拉曼光谱' },
    archived_at: '2024-12-06T16:45:00Z',
    project: { id: 'p2', name: '纳米材料表征', code: 'PRJ-2024-002', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's4', sample_code: 'SMP-004', name: '碳纳米管D2', project_id: 'p2', created_by: null, processing_status: 'completed', responsible_person: null, created_at: '' },
  },
  {
    id: '5',
    user_id: 'u2',
    project_id: 'p3',
    sample_id: 's5',
    file_url: '/files/cell_culture_log.csv',
    file_name: '细胞培养记录.csv',
    processing_status: 'in_progress',
    responsible_person: '陈晨',
    metadata: {},
    archived_at: '2024-12-08T11:15:00Z',
    project: { id: 'p3', name: '干细胞分化研究', code: 'PRJ-2024-003', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's5', sample_code: 'SMP-005', name: '干细胞E5', project_id: 'p3', created_by: null, processing_status: 'in_progress', responsible_person: null, created_at: '' },
  },
  {
    id: '6',
    user_id: 'u3',
    project_id: 'p3',
    sample_id: 's6',
    file_url: '/files/pcr_results.xlsx',
    file_name: 'PCR检测结果.xlsx',
    processing_status: 'pending',
    responsible_person: '刘芳',
    metadata: { cycles: '35' },
    archived_at: '2024-12-09T08:30:00Z',
    project: { id: 'p3', name: '干细胞分化研究', code: 'PRJ-2024-003', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's6', sample_code: 'SMP-006', name: 'RNA样本F1', project_id: 'p3', created_by: null, processing_status: 'pending', responsible_person: null, created_at: '' },
  },
  {
    id: '7',
    user_id: 'u1',
    project_id: 'p4',
    sample_id: 's7',
    file_url: '/files/hplc_data.csv',
    file_name: '高效液相色谱数据.csv',
    processing_status: 'completed',
    responsible_person: '张伟',
    metadata: { column: 'C18' },
    archived_at: '2024-12-10T13:00:00Z',
    project: { id: 'p4', name: '药物代谢动力学', code: 'PRJ-2024-004', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's7', sample_code: 'SMP-007', name: '药物样本G3', project_id: 'p4', created_by: null, processing_status: 'completed', responsible_person: null, created_at: '' },
  },
  {
    id: '8',
    user_id: 'u2',
    project_id: 'p4',
    sample_id: 's8',
    file_url: '/files/mass_spec_raw.zip',
    file_name: '质谱原始数据.zip',
    processing_status: 'in_progress',
    responsible_person: '李娜',
    metadata: { format: 'RAW' },
    archived_at: '2024-12-11T15:20:00Z',
    project: { id: 'p4', name: '药物代谢动力学', code: 'PRJ-2024-004', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's8', sample_code: 'SMP-008', name: '血清样本H7', project_id: 'p4', created_by: null, processing_status: 'in_progress', responsible_person: null, created_at: '' },
  },
  {
    id: '9',
    user_id: 'u3',
    project_id: 'p1',
    sample_id: 's9',
    file_url: '/files/western_blot.tif',
    file_name: 'Western Blot图像.tif',
    processing_status: 'completed',
    responsible_person: '王磊',
    metadata: { antibody: 'Anti-p53' },
    archived_at: '2024-12-12T10:00:00Z',
    project: { id: 'p1', name: '新型蛋白质结构研究', code: 'PRJ-2024-001', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's9', sample_code: 'SMP-009', name: '蛋白提取物I2', project_id: 'p1', created_by: null, processing_status: 'completed', responsible_person: null, created_at: '' },
  },
  {
    id: '10',
    user_id: 'u1',
    project_id: 'p2',
    sample_id: 's10',
    file_url: '/files/xrd_pattern.txt',
    file_name: 'XRD衍射图谱.txt',
    processing_status: 'pending',
    responsible_person: '赵敏',
    metadata: {},
    archived_at: '2024-12-13T09:30:00Z',
    project: { id: 'p2', name: '纳米材料表征', code: 'PRJ-2024-002', description: null, lead_id: null, start_date: null, end_date: null, created_at: '' },
    sample: { id: 's10', sample_code: 'SMP-010', name: '晶体样本J4', project_id: 'p2', created_by: null, processing_status: 'pending', responsible_person: null, created_at: '' },
  },
]

const STATUS_VARIANT: Record<ProcessingStatus, 'success' | 'info' | 'warning'> = {
  pending: 'warning',
  in_progress: 'info',
  completed: 'success',
}

export default function ArchivePage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProcessingStatus | ''>('')
  const [personFilter, setPersonFilter] = useState('')

  const filtered = useMemo(() => {
    return MOCK_RECORDS.filter((r) => {
      if (dateFrom && r.archived_at < dateFrom) return false
      if (dateTo && r.archived_at > dateTo + 'T23:59:59Z') return false
      if (statusFilter && r.processing_status !== statusFilter) return false
      if (personFilter && r.responsible_person && !r.responsible_person.includes(personFilter)) return false
      return true
    })
  }, [dateFrom, dateTo, statusFilter, personFilter])

  const handleReset = () => {
    setDateFrom('')
    setDateTo('')
    setStatusFilter('')
    setPersonFilter('')
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">数据归档</h1>
          <Link href="/archive/upload" className="btn-primary">
            <Upload className="w-4 h-4" />
            上传数据
          </Link>
        </div>

        <FilterBar
          dateFrom={dateFrom}
          dateTo={dateTo}
          processingStatus={statusFilter}
          responsiblePerson={personFilter}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onProcessingStatusChange={setStatusFilter}
          onResponsiblePersonChange={setPersonFilter}
          onReset={handleReset}
        />

        {filtered.length === 0 ? (
          <EmptyState
            title="暂无匹配的归档记录"
            description="尝试调整筛选条件或上传新数据"
            action={
              <Link href="/archive/upload" className="btn-primary">
                <Upload className="w-4 h-4" />
                上传数据
              </Link>
            }
          />
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">文件名</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">课题</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">样本</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">处理状态</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">责任人</th>
                    <th className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">归档时间</th>
                    <th className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record) => (
                    <tr key={record.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{record.file_name}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.project?.code}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.sample?.sample_code}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <StatusBadge variant={STATUS_VARIANT[record.processing_status]}>
                          {PROCESSING_STATUS_LABELS[record.processing_status]}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{record.responsible_person}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(record.archived_at).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button className="p-1.5 rounded-md hover:bg-teal-50 text-teal-700 transition-colors" title="下载">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-teal-50 text-teal-700 transition-colors" title="预览">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-amber-50 text-amber-700 transition-colors" title="编辑状态">
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 bg-slate-50 text-xs text-slate-500 border-t border-slate-200">
              共 {filtered.length} 条记录
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
