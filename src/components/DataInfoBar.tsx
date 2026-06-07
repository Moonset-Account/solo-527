'use client';

import { useState } from 'react';
import type { FilterState, ContentItem } from '@/lib/types';
import { exportToCSV } from '@/lib/etl';
import { PLATFORM_LABELS, CONTENT_TYPE_LABELS } from '@/lib/types';

interface DataInfoBarProps {
  sampleSize: number;
  updateTime: string;
  filters: FilterState;
  items: ContentItem[];
  validation: { valid: boolean; issues: string[] };
}

export default function DataInfoBar({
  sampleSize,
  updateTime,
  filters,
  items,
  validation,
}: DataInfoBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleExport = () => {
    const csvContent = exportToCSV(items, filters, updateTime);
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `内容数据_${updateTime.replace(/[:\s]/g, '_')}.csv`;
    link.click();
  };

  const getActiveFiltersSummary = () => {
    const parts: string[] = [];
    if (filters.accounts.length > 0) parts.push(`账号×${filters.accounts.length}`);
    if (filters.platforms.length > 0) parts.push(`平台×${filters.platforms.length}`);
    if (filters.contentTypes.length > 0) parts.push(`类型×${filters.contentTypes.length}`);
    if (filters.tags.length > 0) parts.push(`标签×${filters.tags.length}`);
    if (filters.authors.length > 0) parts.push(`作者×${filters.authors.length}`);
    if (filters.excludeAnomaly) parts.push('排除异常');
    return parts.length > 0 ? parts.join(' · ') : '无筛选';
  };

  const getSampleSizeWarning = () => {
    if (sampleSize === 0) return { level: 'error', message: '样本量为0，请调整筛选条件' };
    if (sampleSize < 10) return { level: 'warning', message: '样本量较小，结论可能存在偏差' };
    if (sampleSize < 30) return { level: 'info', message: '样本量适中，可作为参考' };
    return { level: 'success', message: '样本量充足，数据可信度高' };
  };

  const warning = getSampleSizeWarning();
  const warningStyles: Record<string, string> = {
    error: 'bg-red-50 text-red-700 border-red-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium ${warningStyles[warning.level]}`}>
            <span className="mr-1">样本量:</span>
            <span className="font-bold">{sampleSize}</span>
            <span className="ml-2 opacity-75">({warning.message})</span>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {getActiveFiltersSummary()}
          </button>

          {!validation.valid && (
            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              数据校验存在{validation.issues.length}个问题
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-500">
            <span className="text-gray-400 mr-1">数据更新:</span>
            {updateTime}
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            导出数据
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <FilterDetail label="账号" values={filters.accounts} />
            <FilterDetail
              label="平台"
              values={filters.platforms.map((p) => PLATFORM_LABELS[p])}
            />
            <FilterDetail
              label="内容类型"
              values={filters.contentTypes.map((t) => CONTENT_TYPE_LABELS[t])}
            />
            <FilterDetail label="标签" values={filters.tags} />
            <FilterDetail label="作者" values={filters.authors} />
            <div>
              <span className="text-gray-500">时间范围:</span>
              <span className="ml-1 text-gray-900">
                {filters.dateRange[0]} ~ {filters.dateRange[1]}
              </span>
            </div>
            <div>
              <span className="text-gray-500">排除异常:</span>
              <span className="ml-1 text-gray-900">{filters.excludeAnomaly ? '是' : '否'}</span>
            </div>
          </div>

          {!validation.valid && (
            <div className="mt-4 p-3 bg-amber-50 rounded-lg">
              <div className="text-sm font-medium text-amber-800 mb-2">数据校验问题:</div>
              <ul className="text-sm text-amber-700 space-y-1">
                {validation.issues.map((issue, index) => (
                  <li key={index}>• {issue}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterDetail({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return (
      <div>
        <span className="text-gray-500">{label}:</span>
        <span className="ml-1 text-gray-400">全部</span>
      </div>
    );
  }

  return (
    <div>
      <span className="text-gray-500">{label}:</span>
      <span className="ml-1 text-gray-900">{values.join(', ')}</span>
    </div>
  );
}
