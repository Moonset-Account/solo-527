import { useEffect, useState } from 'react';
import { useDashboardStore } from '../store/useDashboardStore';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Database,
  Clock,
  FileCheck,
  Hash,
  RefreshCw,
  Eye,
  Shield,
} from 'lucide-react';

export default function DataQuality() {
  const {
    dataQualityStatus,
    rawRecords,
    loading,
    errors,
    filters,
    loadDataQualityStatus,
    loadRawRecords,
    refreshETL,
  } = useDashboardStore();

  const [showRawRecords, setShowRawRecords] = useState(false);

  useEffect(() => {
    loadDataQualityStatus();
    if (showRawRecords) {
      loadRawRecords(50);
    }
  }, [filters, showRawRecords]);

  const statusConfig = {
    success: {
      icon: CheckCircle,
      color: 'text-success-600 bg-success-50 border-success-200',
      text: '数据正常',
    },
    partial: {
      icon: AlertTriangle,
      color: 'text-accent-600 bg-accent-50 border-accent-200',
      text: '部分数据缺失',
    },
    failed: {
      icon: XCircle,
      color: 'text-danger-600 bg-danger-50 border-danger-200',
      text: '数据更新失败',
    },
  };

  const currentStatus = dataQualityStatus
    ? statusConfig[dataQualityStatus.updateStatus]
    : statusConfig.success;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-display">数据质量监控</h2>
          <p className="text-sm text-gray-500 mt-1">
            ETL状态、数据完整性检查及原始记录验证
          </p>
        </div>
        <button
          onClick={() => refreshETL()}
          disabled={loading.etl}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading.etl ? 'animate-spin' : ''}`} />
          重新运行ETL
        </button>
      </div>

      <div className={`p-6 rounded-xl border ${currentStatus.color}`}>
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-full bg-white/50">
            <StatusIcon className="w-8 h-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{currentStatus.text}</h3>
            <p className="text-sm opacity-80 mt-0.5">
              最后更新时间：{dataQualityStatus?.lastUpdate || '加载中...'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">
              {dataQualityStatus?.recordCount?.toLocaleString() || 0}
            </p>
            <p className="text-sm opacity-80">总记录数</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
              <Database className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">有效记录数</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 font-display">
            {dataQualityStatus?.sampleSize?.toLocaleString() || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">通过字段完整性检查</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-danger-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">缺失字段数</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 font-display">
            {dataQualityStatus?.missingFields?.length || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {dataQualityStatus?.missingFields?.join(', ') || '无缺失'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-accent-50 flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-accent-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">数据完整性</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 font-display">
            {dataQualityStatus
              ? Math.round(
                  ((dataQualityStatus.sampleSize || 0) / (dataQualityStatus.recordCount || 1)) *
                    100
                )
              : 0}
            %
          </p>
          <p className="text-xs text-gray-500 mt-1">字段完整度</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-success-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-success-600" />
            </div>
            <span className="text-sm font-medium text-gray-600">更新频率</span>
          </div>
          <p className="text-2xl font-bold text-gray-800 font-display">每日</p>
          <p className="text-xs text-gray-500 mt-1">08:00 自动执行</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">数据血统 (Lineage)</h3>
            <p className="text-sm text-gray-500 mt-0.5">ETL处理流程追溯</p>
          </div>
          <div className="p-5">
            <div className="space-y-3">
              {dataQualityStatus?.dataLineage?.map((step, index) => (
                <div key={step} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{step}</p>
                  </div>
                  {index < (dataQualityStatus?.dataLineage?.length || 0) - 1 && (
                    <CheckCircle className="w-5 h-5 text-success-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">原始记录验证</h3>
              <p className="text-sm text-gray-500 mt-0.5">通过哈希校验验证数据完整性</p>
            </div>
            <button
              onClick={() => setShowRawRecords(!showRawRecords)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {showRawRecords ? '隐藏' : '查看'}
            </button>
          </div>
          <div className="p-5">
            {!showRawRecords ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">点击查看按钮加载原始记录样本</p>
                <p className="text-xs text-gray-400 mt-1">系统将验证每条记录的数据哈希</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {loading.rawRecords ? (
                  <div className="text-center py-8">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full mx-auto mb-3" />
                    <p className="text-sm text-gray-500">加载中...</p>
                  </div>
                ) : (
                  rawRecords.slice(0, 10).map((item) => (
                    <div
                      key={item.record.id}
                      className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-gray-500">
                          {item.record.id}
                        </span>
                        {item.hashMatch ? (
                          <span className="flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded">
                            <Hash className="w-3 h-3" />
                            哈希匹配
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-danger-600 bg-danger-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            哈希不匹配
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">借阅日期：</span>
                          <span className="text-gray-700">{item.record.borrowDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">分馆：</span>
                          <span className="text-gray-700">{item.record.branch}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">续借：</span>
                          <span className="text-gray-700">{item.record.renewCount}次</span>
                        </div>
                      </div>
                      {item.validationErrors.length > 0 && (
                        <div className="mt-2 p-2 bg-danger-50 rounded text-xs text-danger-600">
                          {item.validationErrors.join(', ')}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {rawRecords.length > 0 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    显示前 10 条记录，共 {rawRecords.length} 条
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {dataQualityStatus?.errors && dataQualityStatus.errors.length > 0 && (
        <div className="bg-danger-50 border border-danger-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-danger-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-danger-800">数据处理错误</h4>
              <ul className="mt-2 space-y-1">
                {dataQualityStatus.errors.map((err, i) => (
                  <li key={i} className="text-sm text-danger-700">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
