import { RefreshCw, AlertCircle, CheckCircle, FileOutput } from 'lucide-react';
import { useDashboardStore } from '../../store/useDashboardStore';
import type { TimeWindow } from '../../../shared/types.js';

const timeWindows: { value: TimeWindow; label: string }[] = [
  { value: '7d', label: '7天' },
  { value: '30d', label: '30天' },
  { value: '90d', label: '90天' },
  { value: '1y', label: '1年' },
  { value: 'all', label: '全部' },
];

export function Header() {
  const { filters, setTimeWindow, refreshETL, loading, dataQualityStatus } = useDashboardStore();

  const statusColor = {
    success: 'text-success-600 bg-success-50',
    failed: 'text-danger-600 bg-danger-50',
    partial: 'text-accent-600 bg-accent-50',
  };

  const statusIcon = {
    success: CheckCircle,
    failed: AlertCircle,
    partial: AlertCircle,
  };

  const StatusIcon = dataQualityStatus
    ? statusIcon[dataQualityStatus.updateStatus]
    : AlertCircle;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <h1 className="font-display text-xl font-semibold text-gray-800">
          公共图书馆借阅行为分析
        </h1>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {timeWindows.map((tw) => (
            <button
              key={tw.value}
              onClick={() => setTimeWindow(tw.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                filters.timeWindow === tw.value
                  ? 'bg-white text-primary-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tw.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {dataQualityStatus && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              statusColor[dataQualityStatus.updateStatus]
            }`}
          >
            <StatusIcon className="w-4 h-4" />
            <span>
              {dataQualityStatus.updateStatus === 'success'
                ? '数据正常'
                : dataQualityStatus.updateStatus === 'partial'
                ? '部分数据缺失'
                : '数据更新失败'}
            </span>
          </div>
        )}

        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
          <FileOutput className="w-4 h-4" />
          导出
        </button>

        <button
          onClick={() => refreshETL()}
          disabled={loading.etl}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading.etl ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>
    </header>
  );
}
