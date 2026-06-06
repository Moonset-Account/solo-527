import { ReactNode } from 'react';
import { Info, MoreHorizontal, Loader2 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  sampleSize?: number;
  onDrillDown?: () => void;
  action?: ReactNode;
}

export function ChartCard({
  title,
  subtitle,
  children,
  loading = false,
  error = null,
  sampleSize,
  onDrillDown,
  action,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm card-hover overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {sampleSize !== undefined && (
            <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">
              样本: {sampleSize.toLocaleString()}
            </span>
          )}
          {action}
          <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-5 relative min-h-[280px]">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-danger-50 flex items-center justify-center mx-auto mb-3">
                <Info className="w-6 h-6 text-danger-500" />
              </div>
              <p className="text-sm text-gray-600 mb-2">数据加载失败</p>
              <p className="text-xs text-gray-400">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && children}
      </div>
    </div>
  );
}
