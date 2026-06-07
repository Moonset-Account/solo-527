import { AlertTriangle, X, AlertCircle, Database, RefreshCw } from 'lucide-react';
import { useMetaStore, useUIStore } from '@/store';
import { api } from '@/services/api';
import { useState } from 'react';

export default function DataQualityBanner() {
  const { dataQuality, setDataQuality } = useMetaStore();
  const { showDataQualityWarning, setShowDataQualityWarning } = useUIStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (!showDataQualityWarning || !dataQuality) return null;

  const hasCriticalIssues = dataQuality.isUpdateFailed || dataQuality.completeness < 80;
  const hasMissingFields = dataQuality.missingFields && dataQuality.missingFields.length > 0;
  const hasWarnings = !hasCriticalIssues && (dataQuality.completeness < 95 || hasMissingFields);
  const hasOnlyMissingFields = !hasCriticalIssues && dataQuality.completeness >= 95 && hasMissingFields;
  
  if (!hasCriticalIssues && !hasWarnings) return null;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await api.getDataQualityReport();
      setDataQuality(data);
    } catch (error) {
      console.error('Failed to refresh data quality:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const bgColor = hasCriticalIssues ? 'bg-red-50' : hasOnlyMissingFields ? 'bg-blue-50' : 'bg-amber-50';
  const borderColor = hasCriticalIssues ? 'border-red-200' : hasOnlyMissingFields ? 'border-blue-200' : 'border-amber-200';
  const textColor = hasCriticalIssues ? 'text-red-800' : hasOnlyMissingFields ? 'text-blue-800' : 'text-amber-800';
  const subTextColor = hasCriticalIssues ? 'text-red-700' : hasOnlyMissingFields ? 'text-blue-700' : 'text-amber-700';
  const iconColor = hasCriticalIssues ? 'text-red-600' : hasOnlyMissingFields ? 'text-blue-600' : 'text-amber-600';
  const Icon = hasCriticalIssues ? AlertCircle : AlertTriangle;

  return (
    <div className={`${bgColor} border-b ${borderColor} px-6 py-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${iconColor} flex-shrink-0 animate-pulse-slow`} />
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className={`text-sm font-semibold ${textColor}`}>
                {hasCriticalIssues ? '❌ 数据质量严重警告' : hasOnlyMissingFields ? '📋 数据字段缺失提醒' : '⚠️ 数据质量提醒'}
              </span>
              {dataQuality.isUpdateFailed && (
                <span className={`text-sm ${subTextColor} font-medium`}>
                  数据更新失败：{dataQuality.errorMessage || '请检查数据源连接'}
                </span>
              )}
              {hasOnlyMissingFields && !dataQuality.isUpdateFailed && (
                <span className={`text-sm ${subTextColor} font-medium`}>
                  检测到 {dataQuality.missingFields.length} 个字段存在缺失记录
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              {(dataQuality.completeness < 95 || hasOnlyMissingFields) && (
                <span className={subTextColor}>
                  <Database className="w-3 h-3 inline mr-1" />
                  数据完整度：<span className="font-semibold">{dataQuality.completeness.toFixed(1)}%</span>
                  {dataQuality.completeness < 80 ? '（严重缺失，分析结果不可靠）' : dataQuality.completeness < 95 ? '（部分缺失，请注意甄别）' : ''}
                </span>
              )}
              {dataQuality.missingFields.length > 0 && (
                <span className={`font-medium ${subTextColor}`}>
                  缺失：{dataQuality.missingFields.map(f => 
                    `${f.field.replace('_records', '')} (${f.missingCount}条)`
                  ).join('、')}
                </span>
              )}
              {dataQuality.sampleSize && dataQuality.sampleSize.length > 0 && (
                <span className={subTextColor}>
                  样本量：{dataQuality.sampleSize.slice(0, 3).map(s => 
                    `${s.dimension.replace('_records', '')}: ${s.count.toLocaleString()}`
                  ).join(' | ')}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-colors ${hasCriticalIssues ? 'hover:bg-red-100' : 'hover:bg-amber-100'} disabled:opacity-50`}
            title="刷新数据质量"
          >
            <RefreshCw className={`w-4 h-4 ${iconColor} ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowDataQualityWarning(false)}
            className={`p-2 rounded-lg transition-colors ${hasCriticalIssues ? 'hover:bg-red-100' : 'hover:bg-amber-100'}`}
            title="暂时隐藏"
          >
            <X className={`w-4 h-4 ${iconColor}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
