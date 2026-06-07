import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, ChevronDown, ChevronUp, X, Database, Clock, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { DataQualityStatus } from '@shared/types';
import { useUIStore } from '../store';

interface DataQualityBannerProps {
  status: DataQualityStatus;
  onRefresh?: () => void;
  onTriggerEtl?: () => void;
}

export function DataQualityBanner({ status, onRefresh, onTriggerEtl }: DataQualityBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const { dataQualityBannerOpen, setDataQualityBannerOpen } = useUIStore();

  if (!dataQualityBannerOpen) return null;

  const hasWarnings = status.warnings.length > 0;
  const isError = status.status === 'error';
  const isWarning = status.status === 'warning';

  const severity = isError ? 'error' : isWarning ? 'warning' : 'info';

  const colors = {
    error: 'bg-red-500/15 border-red-500/40 text-red-400',
    warning: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    info: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  };

  const icons = {
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <CheckCircle className="w-5 h-5" />,
  };

  const totalSamples = status.sampleSizes.training + status.sampleSizes.strength + status.sampleSizes.recovery;

  const formatDate = (d: Date | string) => {
    try {
      return new Date(d).toLocaleString('zh-CN');
    } catch {
      return String(d);
    }
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-full border-b ${colors[severity]} backdrop-blur-sm`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icons[severity]}
            <div className="flex-1">
              <p className="text-sm font-medium">
                {isError ? '数据服务异常' : isWarning ? '数据存在警告' : hasWarnings ? '数据提示' : '数据状态良好'}
              </p>
              <p className="text-xs opacity-80">
                训练:{status.sampleSizes.training} | 力量:{status.sampleSizes.strength} | 恢复:{status.sampleSizes.recovery} | 
                最后更新: {formatDate(status.lastUpdated)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onTriggerEtl && (status.etlStatus !== 'running') && (
              <button
                onClick={onTriggerEtl}
                className="px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-1"
                title="触发数据同步"
              >
                <RefreshCw className="w-3 h-3" />
                同步
              </button>
            )}
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setDataQualityBannerOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Database className="w-3 h-3" /> 样本量统计
                    </p>
                    <ul className="text-xs space-y-1">
                      <li>训练数据: {status.sampleSizes.training} 条</li>
                      <li>力量数据: {status.sampleSizes.strength} 条</li>
                      <li>恢复数据: {status.sampleSizes.recovery} 条</li>
                      <li>伤病记录: {status.sampleSizes.injuries} 条</li>
                      <li>队员数量: {status.sampleSizes.athletes} 人</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3" /> ETL 状态
                    </p>
                    <ul className="text-xs space-y-1">
                      <li className="flex items-center gap-1">
                        {status.etlStatus === 'completed' ? (
                          <><CheckCircle className="w-3 h-3 text-emerald-400" /> 执行成功</>
                        ) : status.etlStatus === 'running' ? (
                          <><RefreshCw className="w-3 h-3 animate-spin" /> 执行中...</>
                        ) : status.etlStatus === 'failed' ? (
                          <><XCircle className="w-3 h-3 text-red-400" /> 执行失败</>
                        ) : (
                          <><Info className="w-3 h-3" /> 状态未知</>
                        )}
                      </li>
                      {status.pendingRawRecords !== undefined && status.pendingRawRecords > 0 && (
                        <li className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          待处理原始数据: {status.pendingRawRecords} 条
                        </li>
                      )}
                      {status.failedRawRecords !== undefined && status.failedRawRecords > 0 && (
                        <li className="flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-red-400" />
                          处理失败: {status.failedRawRecords} 条
                        </li>
                      )}
                    </ul>
                    {status.lastEtlError && (
                      <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                        错误: {status.lastEtlError}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> 字段缺失统计
                    </p>
                    {status.missingFields ? (
                      <ul className="text-xs space-y-1">
                        <li>训练心率缺失: {status.missingFields.trainingHeartRate} 条</li>
                        <li>有氧配速缺失: {status.missingFields.trainingPace} 条</li>
                        <li>睡眠评分缺失: {status.missingFields.recoverySleep} 条</li>
                        <li>力量1RM缺失: {status.missingFields.strength1Rm} 条</li>
                      </ul>
                    ) : (
                      <p className="text-xs opacity-70">暂无缺失统计</p>
                    )}
                  </div>
                </div>

                {status.warnings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">警告详情:</p>
                    <ul className="text-xs space-y-1 max-h-32 overflow-y-auto">
                      {status.warnings.map((warn, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
