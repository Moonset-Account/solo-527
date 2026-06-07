import { AlertTriangle, CheckCircle, XCircle, Info, RefreshCw, ChevronDown, ChevronUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import type { DataQualityStatus } from '@shared/types';
import { useUIStore } from '../store';

interface DataQualityBannerProps {
  status: DataQualityStatus;
  onRefresh?: () => void;
}

export function DataQualityBanner({ status, onRefresh }: DataQualityBannerProps) {
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
                最后更新: {new Date(status.lastUpdated).toLocaleString('zh-CN')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
              <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                {status.warnings.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">警告:</p>
                    <ul className="text-xs space-y-1">
                      {status.warnings.map((warn, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{warn}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold mb-1">ETL 状态:</p>
                  <p className="text-xs flex items-center gap-1">
                    {status.etlStatus === 'completed' ? (
                      <><CheckCircle className="w-3 h-3 text-emerald-400" /> ETL 执行成功</>
                    ) : status.etlStatus === 'running' ? (
                      <><RefreshCw className="w-3 h-3 animate-spin" /> ETL 执行中...</>
                    ) : status.etlStatus === 'failed' ? (
                      <><XCircle className="w-3 h-3 text-red-400" /> ETL 执行失败</>
                    ) : (
                      <><Info className="w-3 h-3" /> ETL 状态未知</>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold mb-1">样本量统计:</p>
                  <ul className="text-xs space-y-1 grid grid-cols-2 gap-1">
                    <li>训练数据: {status.sampleSizes.training} 条</li>
                    <li>力量数据: {status.sampleSizes.strength} 条</li>
                    <li>恢复数据: {status.sampleSizes.recovery} 条</li>
                    <li>伤病记录: {status.sampleSizes.injuries} 条</li>
                    <li>队员数量: {status.sampleSizes.athletes} 人</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
