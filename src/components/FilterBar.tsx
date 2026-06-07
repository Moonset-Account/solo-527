'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown, RefreshCw } from 'lucide-react';
import { FilterParams } from '@/lib/services/analytics';
import { mockDataset } from '@/lib/mock/data';
import { DATA_DICTIONARY } from '@/lib/constants/data-dictionary';

interface FilterBarProps {
  filters: FilterParams;
  onFilterChange: (filters: FilterParams) => void;
  onReset: () => void;
  onRefresh: () => void;
  canViewContact: boolean;
  sampleSize: number;
  updateTime: string;
}

export default function FilterBar({
  filters,
  onFilterChange,
  onReset,
  onRefresh,
  canViewContact,
  sampleSize,
  updateTime,
}: FilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const weeks = Array.from({ length: 16 }, (_, i) => i + 1);

  const handleChange = (key: keyof FilterParams, value: unknown) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
  ).length;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">筛选条件</span>
            {activeFilterCount > 0 && (
              <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {activeFilterCount} 个筛选
              </span>
            )}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            {isExpanded ? '收起' : '展开'}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            样本量: <span className="font-medium text-gray-700">{sampleSize}</span> 人
          </div>
          <div className="text-sm text-gray-500">
            更新时间:{' '}
            <span className="font-medium text-gray-700">
              {new Date(updateTime).toLocaleString('zh-CN')}
            </span>
          </div>
          {!canViewContact && (
            <span className="bg-amber-50 text-amber-700 text-xs px-2 py-1 rounded-md border border-amber-200">
              联系方式已脱敏
            </span>
          )}
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="刷新数据"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={onReset}
            className="text-sm text-gray-500 hover:text-red-600 flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">班级</label>
            <select
              value={filters.classId || ''}
              onChange={(e) => handleChange('classId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部班级</option>
              {mockDataset.classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">课程</label>
            <select
              value={filters.courseId || ''}
              onChange={(e) => handleChange('courseId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部课程</option>
              {mockDataset.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">任课教师</label>
            <select
              value={filters.teacherId || ''}
              onChange={(e) => handleChange('teacherId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部教师</option>
              {mockDataset.teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">起始周次</label>
            <select
              value={filters.weekStart || ''}
              onChange={(e) =>
                handleChange('weekStart', e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">不限制</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  第{w}周
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">结束周次</label>
            <select
              value={filters.weekEnd || ''}
              onChange={(e) =>
                handleChange('weekEnd', e.target.value ? Number(e.target.value) : undefined)
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">不限制</option>
              {weeks.map((w) => (
                <option key={w} value={w}>
                  第{w}周
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1.5">题型</label>
            <select
              value={filters.questionType || ''}
              onChange={(e) => handleChange('questionType', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">全部题型</option>
              {Object.entries(DATA_DICTIONARY.questionType).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
