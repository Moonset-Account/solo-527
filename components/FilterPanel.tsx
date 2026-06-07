'use client'

import { useState } from 'react'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { FilterParams } from '@/lib/types'

interface FilterPanelProps {
  masterData: {
    stations: { id: string; name: string }[]
    vehicles: { id: string; plateNumber: string }[]
    teams: { id: string; name: string }[]
    weatherConditions: { value: string; label: string }[]
    delayCategories: { value: string; label: string }[]
    severityLevels: { value: string; label: string }[]
  }
  filters: FilterParams
  onFilterChange: (filters: FilterParams) => void
  onExport: () => void
  canExport: boolean
}

export default function FilterPanel({
  masterData,
  filters,
  onFilterChange,
  onExport,
  canExport,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleMultiSelect = (field: keyof FilterParams, value: string) => {
    const current = (filters[field] as string[]) || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilterChange({ ...filters, [field]: updated.length > 0 ? updated : undefined })
  }

  const handleSingleChange = (field: keyof FilterParams, value: string | number | undefined) => {
    onFilterChange({ ...filters, [field]: value })
  }

  const clearFilters = () => {
    onFilterChange({})
  }

  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v !== undefined
  )

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary-600" />
          <h3 className="font-semibold text-gray-800">筛选条件</h3>
          {hasActiveFilters && (
            <span className="bg-primary-100 text-primary-700 text-xs px-2 py-0.5 rounded-full">
              已筛选
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              清除
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
              <input
                type="date"
                className="input text-sm"
                value={filters.startDate || ''}
                onChange={(e) => handleSingleChange('startDate', e.target.value || undefined)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
              <input
                type="date"
                className="input text-sm"
                value={filters.endDate || ''}
                onChange={(e) => handleSingleChange('endDate', e.target.value || undefined)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">中转站</label>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              {masterData.stations.map(stn => (
                <button
                  key={stn.id}
                  onClick={() => handleMultiSelect('stationIds', stn.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    (filters.stationIds || []).includes(stn.id)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {stn.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">车辆</label>
            <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
              {masterData.vehicles.slice(0, 10).map(v => (
                <button
                  key={v.id}
                  onClick={() => handleMultiSelect('vehicleIds', v.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    (filters.vehicleIds || []).includes(v.id)
                      ? 'bg-primary-100 border-primary-300 text-primary-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {v.plateNumber}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">迟滞原因</label>
            <div className="flex flex-wrap gap-2">
              {masterData.delayCategories.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => handleMultiSelect('delayCategories', cat.value)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    (filters.delayCategories || []).includes(cat.value)
                      ? 'bg-orange-100 border-orange-300 text-orange-700'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              最小迟滞时长 (分钟)
            </label>
            <input
              type="number"
              className="input text-sm"
              placeholder="输入最小迟滞分钟数"
              value={filters.minDelayMinutes || ''}
              onChange={(e) => handleSingleChange('minDelayMinutes', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>

          {canExport && (
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={onExport}
                className="btn-primary w-full text-sm"
              >
                导出分析报告
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
