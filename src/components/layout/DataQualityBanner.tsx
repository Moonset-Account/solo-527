import { AlertTriangle, X } from 'lucide-react';
import { useMetaStore, useUIStore } from '@/store';

export default function DataQualityBanner() {
  const { dataQuality } = useMetaStore();
  const { showDataQualityWarning, setShowDataQualityWarning } = useUIStore();

  if (!showDataQualityWarning || !dataQuality) return null;

  const hasIssues = dataQuality.isUpdateFailed || dataQuality.completeness < 90;
  if (!hasIssues) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-sm font-medium text-amber-800">
              数据质量警告
            </span>
            {dataQuality.isUpdateFailed && (
              <span className="text-sm text-amber-700">
                • 数据更新失败: {dataQuality.errorMessage || '未知错误'}
              </span>
            )}
            {dataQuality.completeness < 90 && (
              <span className="text-sm text-amber-700">
                • 数据完整度仅 {dataQuality.completeness.toFixed(1)}%，部分分析可能不准确
              </span>
            )}
            {dataQuality.missingFields.length > 0 && (
              <span className="text-sm text-amber-700">
                • 缺失字段: {dataQuality.missingFields.map(f => f.field).join(', ')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowDataQualityWarning(false)}
          className="p-1 hover:bg-amber-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-amber-600" />
        </button>
      </div>
    </div>
  );
}
