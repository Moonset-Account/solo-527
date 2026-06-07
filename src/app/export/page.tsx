'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/hooks/use-trpc';
import { useFilterStore } from '@/store/filter-store';
import { cn } from '@/lib/utils';
import { BarChart3, Users, Trophy, ClipboardList, Download, Loader2 } from 'lucide-react';

type ExportType = 'funnel' | 'waitlist' | 'ranking' | 'adjustHistory';
type ExportFormat = 'xlsx' | 'csv';

const EXPORT_CARDS: { type: ExportType; label: string; description: string; icon: typeof BarChart3 }[] = [
  { type: 'funnel', label: '漏斗分析', description: '导出各阶段漏斗转化数据', icon: BarChart3 },
  { type: 'waitlist', label: '候补名单', description: '导出候补学员详细信息', icon: Users },
  { type: 'ranking', label: '课程排名', description: '导出课程候补排名数据', icon: Trophy },
  { type: 'adjustHistory', label: '调整记录', description: '导出调序排位变化记录', icon: ClipboardList },
];

const SHOW_ADJUST_DIFF_TYPES: ExportType[] = ['adjustHistory', 'waitlist'];

export default function ExportPage() {
  const filters = useFilterStore();
  const [selectedType, setSelectedType] = useState<ExportType | null>(null);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [includeAdjustDiff, setIncludeAdjustDiff] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const exportMutation = useMutation({
    mutationFn: () =>
      trpc.export.generate.mutate({
        type: selectedType!,
        format,
        includeAdjustDiff,
        filters: {
          campusIds: filters.campusIds.length > 0 ? filters.campusIds : undefined,
          courseIds: filters.courseIds.length > 0 ? filters.courseIds : undefined,
          ageGroups: filters.ageGroups.length > 0 ? filters.ageGroups : undefined,
          channels: filters.channels.length > 0 ? filters.channels : undefined,
          dateRange:
            filters.dateRange.start && filters.dateRange.end
              ? { start: filters.dateRange.start, end: filters.dateRange.end }
              : undefined,
        },
      }),
    onSuccess: (data) => {
      setDownloadUrl(data.downloadUrl);
    },
  });

  const handleExport = () => {
    if (!selectedType) return;
    setDownloadUrl(null);
    exportMutation.mutate();
  };

  const activeFilterCount =
    filters.campusIds.length +
    filters.courseIds.length +
    filters.ageGroups.length +
    filters.channels.length +
    (filters.dateRange.start && filters.dateRange.end ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">导出报告</h1>
          <p className="mt-1 text-sm text-gray-500">导出漏斗分析、候补名单、课程排名及调序记录</p>
        </div>

        {activeFilterCount > 0 && (
          <div className="mb-6 rounded-lg bg-blue-50 border border-blue-100 p-4">
            <p className="text-sm font-medium text-blue-800">当前筛选条件将应用于导出</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {filters.campusIds.length > 0 && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  校区: {filters.campusIds.length} 项
                </span>
              )}
              {filters.courseIds.length > 0 && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  课程: {filters.courseIds.length} 项
                </span>
              )}
              {filters.ageGroups.length > 0 && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  年龄段: {filters.ageGroups.join(', ')}
                </span>
              )}
              {filters.channels.length > 0 && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  渠道: {filters.channels.length} 项
                </span>
              )}
              {filters.dateRange.start && filters.dateRange.end && (
                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                  日期范围已设定
                </span>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-8">
          {EXPORT_CARDS.map((card) => {
            const Icon = card.icon;
            const isSelected = selectedType === card.type;
            return (
              <button
                key={card.type}
                onClick={() => {
                  setSelectedType(card.type);
                  setDownloadUrl(null);
                }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-xl p-6 shadow-sm border-2 text-left transition-colors',
                  isSelected
                    ? 'border-[#E8A838] bg-[#E8A838]/5'
                    : 'border-gray-100 bg-white hover:border-[#E8A838]/50'
                )}
              >
                <Icon className={cn('h-8 w-8', isSelected ? 'text-[#E8A838]' : 'text-gray-400')} />
                <div className="text-center">
                  <p className={cn('text-sm font-semibold', isSelected ? 'text-[#1E3A5F]' : 'text-gray-700')}>
                    {card.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{card.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {selectedType && (
          <div className="bg-white rounded-xl shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">导出格式</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFormat('xlsx')}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    format === 'xlsx'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  XLSX
                </button>
                <button
                  onClick={() => setFormat('csv')}
                  className={cn(
                    'rounded-lg px-4 py-2 text-sm font-medium transition-colors',
                    format === 'csv'
                      ? 'bg-[#1E3A5F] text-white'
                      : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  )}
                >
                  CSV
                </button>
              </div>
            </div>

            {SHOW_ADJUST_DIFF_TYPES.includes(selectedType) && (
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeAdjustDiff}
                    onChange={(e) => setIncludeAdjustDiff(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#E8A838] focus:ring-[#E8A838]"
                  />
                  <span className="text-sm text-gray-700">包含调序排位变化</span>
                </label>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#E8A838] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#d4952e] disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  导出
                </>
              )}
            </button>

            {downloadUrl && (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4">
                <p className="text-sm text-green-800 mb-2">文件已生成，点击下载：</p>
                <a
                  href={downloadUrl}
                  download
                  className="inline-flex items-center gap-1 text-sm font-medium text-[#E8A838] hover:underline"
                >
                  <Download className="h-4 w-4" />
                  下载文件
                </a>
              </div>
            )}

            {exportMutation.isError && (
              <div className="rounded-lg bg-red-50 border border-red-100 p-4">
                <p className="text-sm text-red-600">导出失败，请重试</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
