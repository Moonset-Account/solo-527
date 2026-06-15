'use client'

import { useState, useMemo } from 'react'
import { Search, X, RotateCcw, ChevronDown } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StatusBadge from '@/components/ui/StatusBadge'
import type { ProcessingStatus, FilterParams } from '@/types'
import { PROCESSING_STATUS_LABELS } from '@/types'

interface CombinedRecord {
  id: string
  type: 'booking' | 'archive'
  date: string
  project_name: string
  instrument_name: string
  responsible_person: string
  processing_status: ProcessingStatus
  notes: string
}

const MOCK_RECORDS: CombinedRecord[] = [
  { id: '1', type: 'booking', date: '2024-03-01', project_name: '蛋白质组学研究', instrument_name: '质谱仪', responsible_person: '张三', processing_status: 'completed', notes: '常规检测' },
  { id: '2', type: 'booking', date: '2024-03-02', project_name: '基因编辑技术', instrument_name: 'PCR仪', responsible_person: '李四', processing_status: 'in_progress', notes: '基因扩增' },
  { id: '3', type: 'archive', date: '2024-03-03', project_name: '纳米材料合成', instrument_name: '电子显微镜', responsible_person: '王五', processing_status: 'pending', notes: '材料表征' },
  { id: '4', type: 'booking', date: '2024-03-04', project_name: '环境微生物检测', instrument_name: '培养箱', responsible_person: '赵六', processing_status: 'completed', notes: '菌落培养' },
  { id: '5', type: 'archive', date: '2024-03-05', project_name: '蛋白质组学研究', instrument_name: '色谱仪', responsible_person: '张三', processing_status: 'in_progress', notes: '蛋白分离' },
  { id: '6', type: 'booking', date: '2024-03-06', project_name: '基因编辑技术', instrument_name: '离心机', responsible_person: '钱七', processing_status: 'pending', notes: '样本前处理' },
  { id: '7', type: 'booking', date: '2024-03-07', project_name: '纳米材料合成', instrument_name: 'X射线衍射仪', responsible_person: '孙八', processing_status: 'completed', notes: '晶体结构分析' },
  { id: '8', type: 'archive', date: '2024-03-08', project_name: '环境微生物检测', instrument_name: '光谱仪', responsible_person: '周九', processing_status: 'in_progress', notes: '水质分析' },
  { id: '9', type: 'booking', date: '2024-03-09', project_name: '蛋白质组学研究', instrument_name: '质谱仪', responsible_person: '吴十', processing_status: 'pending', notes: '代谢物检测' },
  { id: '10', type: 'archive', date: '2024-03-10', project_name: '基因编辑技术', instrument_name: 'PCR仪', responsible_person: '李四', processing_status: 'completed', notes: '序列验证' },
  { id: '11', type: 'booking', date: '2024-03-11', project_name: '纳米材料合成', instrument_name: '电子显微镜', responsible_person: '郑一', processing_status: 'in_progress', notes: '表面形貌观察' },
  { id: '12', type: 'archive', date: '2024-03-12', project_name: '环境微生物检测', instrument_name: '培养箱', responsible_person: '赵六', processing_status: 'completed', notes: '环境样本培养' },
  { id: '13', type: 'booking', date: '2024-03-13', project_name: '蛋白质组学研究', instrument_name: '色谱仪', responsible_person: '冯二', processing_status: 'pending', notes: '多肽分离' },
  { id: '14', type: 'booking', date: '2024-03-14', project_name: '基因编辑技术', instrument_name: '离心机', responsible_person: '陈三', processing_status: 'completed', notes: '细胞分离' },
  { id: '15', type: 'archive', date: '2024-03-15', project_name: '纳米材料合成', instrument_name: 'X射线衍射仪', responsible_person: '孙八', processing_status: 'in_progress', notes: '物相分析' },
  { id: '16', type: 'booking', date: '2024-03-16', project_name: '环境微生物检测', instrument_name: '光谱仪', responsible_person: '周九', processing_status: 'pending', notes: '重金属检测' },
  { id: '17', type: 'archive', date: '2024-03-17', project_name: '蛋白质组学研究', instrument_name: '质谱仪', responsible_person: '张三', processing_status: 'in_progress', notes: '定量分析' },
  { id: '18', type: 'booking', date: '2024-03-18', project_name: '基因编辑技术', instrument_name: 'PCR仪', responsible_person: '钱七', processing_status: 'completed', notes: '引物验证' },
  { id: '19', type: 'archive', date: '2024-03-19', project_name: '纳米材料合成', instrument_name: '电子显微镜', responsible_person: '王五', processing_status: 'pending', notes: '纳米颗粒观察' },
  { id: '20', type: 'booking', date: '2024-03-20', project_name: '环境微生物检测', instrument_name: '培养箱', responsible_person: '吴十', processing_status: 'in_progress', notes: '厌氧培养' },
]

const ALL_PROJECTS = Array.from(new Set(MOCK_RECORDS.map((r) => r.project_name)))
const ALL_INSTRUMENTS = Array.from(new Set(MOCK_RECORDS.map((r) => r.instrument_name)))
const ALL_PERSONS = Array.from(new Set(MOCK_RECORDS.map((r) => r.responsible_person)))

const STATUS_OPTIONS: ProcessingStatus[] = ['pending', 'in_progress', 'completed']

export default function FilterPage() {
  const [filters, setFilters] = useState<FilterParams & { processing_statuses?: ProcessingStatus[] }>({})
  const [personInput, setPersonInput] = useState('')
  const [showPersonSuggest, setShowPersonSuggest] = useState(false)

  const personSuggestions = useMemo(() => {
    if (!personInput.trim()) return []
    return ALL_PERSONS.filter((p) => p.includes(personInput.trim()))
  }, [personInput])

  const handlePersonSelect = (person: string) => {
    setFilters((f) => ({ ...f, responsible_person: person }))
    setPersonInput(person)
    setShowPersonSuggest(false)
  }

  const toggleStatus = (status: ProcessingStatus) => {
    const current = filters.processing_statuses || []
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status]
    setFilters((f) => ({ ...f, processing_statuses: next }))
  }

  const appliedTags = useMemo(() => {
    const tags: Array<{ key: string; label: string }> = []
    if (filters.date_from) tags.push({ key: 'date_from', label: `起始: ${filters.date_from}` })
    if (filters.date_to) tags.push({ key: 'date_to', label: `截止: ${filters.date_to}` })
    ;(filters.processing_statuses || []).forEach((s) =>
      tags.push({ key: `status_${s}`, label: PROCESSING_STATUS_LABELS[s] })
    )
    if (filters.responsible_person) tags.push({ key: 'responsible_person', label: `责任人: ${filters.responsible_person}` })
    if (filters.project_id) tags.push({ key: 'project_id', label: `课题: ${filters.project_id}` })
    if (filters.instrument_id) tags.push({ key: 'instrument_id', label: `仪器: ${filters.instrument_id}` })
    return tags
  }, [filters])

  const removeTag = (key: string) => {
    setFilters((f) => {
      const next = { ...f }
      if (key === 'date_from') delete next.date_from
      else if (key === 'date_to') delete next.date_to
      else if (key === 'responsible_person') { delete next.responsible_person; setPersonInput('') }
      else if (key === 'project_id') delete next.project_id
      else if (key === 'instrument_id') delete next.instrument_id
      else if (key.startsWith('status_')) {
        const status = key.replace('status_', '') as ProcessingStatus
        next.processing_statuses = (next.processing_statuses || []).filter((s) => s !== status)
      }
      return next
    })
  }

  const resetAll = () => {
    setFilters({})
    setPersonInput('')
  }

  const filteredRecords = useMemo(() => {
    return MOCK_RECORDS.filter((r) => {
      if (filters.date_from && r.date < filters.date_from) return false
      if (filters.date_to && r.date > filters.date_to) return false
      if ((filters.processing_statuses || []).length > 0 && !filters.processing_statuses!.includes(r.processing_status)) return false
      if (filters.responsible_person && r.responsible_person !== filters.responsible_person) return false
      if (filters.project_id && r.project_name !== filters.project_id) return false
      if (filters.instrument_id && r.instrument_name !== filters.instrument_id) return false
      return true
    })
  }, [filters])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="page-title">筛选面板</h1>
          <button onClick={resetAll} className="btn-secondary text-sm">
            <RotateCcw className="w-3.5 h-3.5" />
            重置全部
          </button>
        </div>

        <div className="card space-y-5">
          <h2 className="section-title">高级筛选</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="label">日期范围</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))}
                  className="input-field"
                />
                <span className="text-slate-400">~</span>
                <input
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))}
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label">处理状态</label>
              <div className="flex items-center gap-4 mt-1.5">
                {STATUS_OPTIONS.map((s) => (
                  <label key={s} className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(filters.processing_statuses || []).includes(s)}
                      onChange={() => toggleStatus(s)}
                      className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-slate-700">{PROCESSING_STATUS_LABELS[s]}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="relative">
              <label className="label">责任人</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={personInput}
                  onChange={(e) => { setPersonInput(e.target.value); setShowPersonSuggest(true) }}
                  onFocus={() => setShowPersonSuggest(true)}
                  onBlur={() => setTimeout(() => setShowPersonSuggest(false), 150)}
                  placeholder="搜索责任人"
                  className="input-field pl-9"
                />
                {showPersonSuggest && personSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-auto">
                    {personSuggestions.map((p) => (
                      <button
                        key={p}
                        onMouseDown={() => handlePersonSelect(p)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="label">课题</label>
              <div className="relative">
                <select
                  value={filters.project_id || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, project_id: e.target.value || undefined }))}
                  className="input-field appearance-none pr-8"
                >
                  <option value="">全部课题</option>
                  {ALL_PROJECTS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="label">仪器</label>
              <div className="relative">
                <select
                  value={filters.instrument_id || ''}
                  onChange={(e) => setFilters((f) => ({ ...f, instrument_id: e.target.value || undefined }))}
                  className="input-field appearance-none pr-8"
                >
                  <option value="">全部仪器</option>
                  {ALL_INSTRUMENTS.map((i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {appliedTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-slate-500">已选筛选:</span>
            {appliedTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"
              >
                {tag.label}
                <button onClick={() => removeTag(tag.key)} className="hover:text-teal-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="text-sm text-slate-500">
          共 <span className="font-semibold text-teal-700">{filteredRecords.length}</span> 条记录
        </div>

        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-medium text-slate-500">日期</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">类型</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">课题</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">仪器</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">责任人</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-slate-500">备注</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-900">{r.date}</td>
                    <td className="py-3 px-4">
                      <span className={r.type === 'booking' ? 'badge-info' : 'badge-neutral'}>
                        {r.type === 'booking' ? '预约' : '归档'}
                      </span>
                    </td>
                    <td className="py-3 px-4">{r.project_name}</td>
                    <td className="py-3 px-4">{r.instrument_name}</td>
                    <td className="py-3 px-4">{r.responsible_person}</td>
                    <td className="py-3 px-4"><StatusBadge status={r.processing_status} /></td>
                    <td className="py-3 px-4 text-slate-500">{r.notes}</td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">无匹配记录</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
