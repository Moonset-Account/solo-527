'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import type { FilterState, Platform, ContentType, TimeUnit } from '@/lib/types';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/lib/types';

interface FilterPanelProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableAccounts: string[];
  availableTags: string[];
  availableAuthors: string[];
}

const TIME_RANGES = [
  { label: '近7天', days: 7 },
  { label: '近30天', days: 30 },
  { label: '近90天', days: 90 },
  { label: '自定义', days: 0 },
];

export default function FilterPanel({
  filters,
  onFilterChange,
  availableAccounts,
  availableTags,
  availableAuthors,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTimeRange, setActiveTimeRange] = useState(1);

  const handleTimeRangeChange = (index: number) => {
    setActiveTimeRange(index);
    if (TIME_RANGES[index].days > 0) {
      const endDate = dayjs();
      const startDate = endDate.subtract(TIME_RANGES[index].days, 'day');
      onFilterChange({
        ...filters,
        dateRange: [startDate.format('YYYY-MM-DD'), endDate.format('YYYY-MM-DD')],
      });
    }
  };

  const toggleFilter = <T extends string>(key: keyof FilterState, value: T) => {
    const current = filters[key] as T[];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFilterChange({ ...filters, [key]: updated });
  };

  const clearAllFilters = () => {
    onFilterChange({
      accounts: [],
      platforms: [],
      contentTypes: [],
      tags: [],
      authors: [],
      dateRange: [dayjs().subtract(30, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
      timeUnit: 'day',
      excludeAnomaly: false,
    });
    setActiveTimeRange(1);
  };

  const activeFilterCount = [
    filters.accounts.length,
    filters.platforms.length,
    filters.contentTypes.length,
    filters.tags.length,
    filters.authors.length,
    filters.excludeAnomaly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold text-gray-800">筛选条件</span>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
              已选 {activeFilterCount} 项
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              clearAllFilters();
            }}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            清空筛选
          </button>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-6 border-t border-gray-100">
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">时间范围</label>
            <div className="flex flex-wrap gap-2">
              {TIME_RANGES.map((range, index) => (
                <button
                  key={range.label}
                  onClick={() => handleTimeRangeChange(index)}
                  className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                    activeTimeRange === index
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            {activeTimeRange === 3 && (
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="date"
                  value={filters.dateRange[0]}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      dateRange: [e.target.value, filters.dateRange[1]],
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={filters.dateRange[1]}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      dateRange: [filters.dateRange[0], e.target.value],
                    })
                  }
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FilterGroup
              label="账号"
              options={availableAccounts}
              selected={filters.accounts}
              onToggle={(v) => toggleFilter('accounts', v)}
            />
            <FilterGroup
              label="平台"
              options={Object.keys(PLATFORM_LABELS) as Platform[]}
              optionLabels={PLATFORM_LABELS}
              selected={filters.platforms}
              onToggle={(v) => toggleFilter('platforms', v as Platform)}
            />
            <FilterGroup
              label="内容类型"
              options={Object.keys(CONTENT_TYPE_LABELS) as ContentType[]}
              optionLabels={CONTENT_TYPE_LABELS}
              selected={filters.contentTypes}
              onToggle={(v) => toggleFilter('contentTypes', v as ContentType)}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FilterGroup
              label="选题标签"
              options={availableTags}
              selected={filters.tags}
              onToggle={(v) => toggleFilter('tags', v)}
              showMore
            />
            <FilterGroup
              label="作者"
              options={availableAuthors}
              selected={filters.authors}
              onToggle={(v) => toggleFilter('authors', v)}
              showMore
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.excludeAnomaly}
                onChange={(e) =>
                  onFilterChange({ ...filters, excludeAnomaly: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">排除异常数据</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterGroup<T extends string>({
  label,
  options,
  optionLabels,
  selected,
  onToggle,
  showMore = false,
}: {
  label: string;
  options: T[];
  optionLabels?: Record<string, string>;
  selected: T[];
  onToggle: (value: T) => void;
  showMore?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayOptions = showMore && !showAll ? options.slice(0, 8) : options;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex flex-wrap gap-2">
        {displayOptions.map((option) => (
          <button
            key={option}
            onClick={() => onToggle(option)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
              selected.includes(option)
                ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
            }`}
          >
            {optionLabels?.[option] || option}
          </button>
        ))}
        {showMore && options.length > 8 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showAll ? '收起' : `+${options.length - 8} 更多`}
          </button>
        )}
      </div>
    </div>
  );
}
