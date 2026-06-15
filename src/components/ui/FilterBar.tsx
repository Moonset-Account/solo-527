'use client'

import { Search, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store'
import type { ProcessingStatus } from '@/types'
import { PROCESSING_STATUS_LABELS } from '@/types'

const STATUS_OPTIONS: { value: ProcessingStatus; label: string }[] = [
  { value: 'pending', label: PROCESSING_STATUS_LABELS.pending },
  { value: 'in_progress', label: PROCESSING_STATUS_LABELS.in_progress },
  { value: 'completed', label: PROCESSING_STATUS_LABELS.completed },
]

interface FilterBarProps {
  className?: string
  dateFrom?: string
  dateTo?: string
  processingStatus?: ProcessingStatus | ''
  responsiblePerson?: string
  onDateFromChange?: (v: string) => void
  onDateToChange?: (v: string) => void
  onProcessingStatusChange?: (v: ProcessingStatus | '') => void
  onResponsiblePersonChange?: (v: string) => void
  onReset?: () => void
}

export default function FilterBar({
  className,
  dateFrom,
  dateTo,
  processingStatus,
  responsiblePerson,
  onDateFromChange,
  onDateToChange,
  onProcessingStatusChange,
  onResponsiblePersonChange,
  onReset,
}: FilterBarProps) {
  const { filters, setFilters, resetFilters } = useAppStore()
  const useProps = onDateFromChange !== undefined
  const df = useProps ? (dateFrom ?? '') : (filters.date_from || '')
  const dt = useProps ? (dateTo ?? '') : (filters.date_to || '')
  const ps = useProps ? (processingStatus ?? '') : (filters.processing_status || '')
  const rp = useProps ? (responsiblePerson ?? '') : (filters.responsible_person || '')

  return (
    <div className={cn('card flex flex-wrap items-end gap-4', className)}>
      <div className="flex-1 min-w-[160px]">
        <label className="label">开始日期</label>
        <input
          type="date"
          value={df}
          onChange={(e) => useProps ? onDateFromChange!(e.target.value) : setFilters({ date_from: e.target.value })}
          className="input-field"
        />
      </div>

      <div className="flex-1 min-w-[160px]">
        <label className="label">结束日期</label>
        <input
          type="date"
          value={dt}
          onChange={(e) => useProps ? onDateToChange!(e.target.value) : setFilters({ date_to: e.target.value })}
          className="input-field"
        />
      </div>

      <div className="flex-1 min-w-[140px]">
        <label className="label">处理状态</label>
        <select
          value={ps}
          onChange={(e) => {
            const val = (e.target.value || '') as ProcessingStatus | ''
            useProps ? onProcessingStatusChange!(val) : setFilters({ processing_status: val || undefined })
          }}
          className="input-field"
        >
          <option value="">全部</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[180px]">
        <label className="label">负责人</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="搜索负责人..."
            value={rp}
            onChange={(e) => useProps ? onResponsiblePersonChange!(e.target.value) : setFilters({ responsible_person: e.target.value || undefined })}
            className="input-field pl-9"
          />
        </div>
      </div>

      <button
        onClick={() => useProps && onReset ? onReset() : resetFilters()}
        className="btn-secondary h-[38px]"
      >
        <RotateCcw className="h-4 w-4" />
        重置
      </button>
    </div>
  )
}
