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

  const hasErrors = status.errors.length > 0;
  const hasWarnings = status.warnings.length > 0;
  const hasMissing = status.missingFields.length > 0;

  if (!hasErrors && !hasWarnings && !hasMissing) return null;

  const severity = hasErrors ? 'error' : hasWarnings ? 'warning' : 'info';

  const colors = {
    error: 'bg-danger/15 border-danger/40 text-danger',
    warning: 'bg-warning/15 border-warning/40 text-warning',
    info: 'bg-brand-400/15 border-brand-400/40 text-brand-300',
  };

  const icons = {
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertTriangle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
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
                {hasErrors ? '发现数据问题' : hasWarnings ? '数据存在警告' : '数据提示'}
              </p>
              <p className="text-xs opacity-80">
                样本量: {status.sampleSize} | 最后更新: {new Date(status.lastUpdated).toLocaleString('zh-CN')}
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
                {status.errors.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">错误:</p>
                    <ul className="text-xs space-y-1">
                      {status.errors.map((err, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                {status.missingFields.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-1">缺失字段:</p>
                    <ul className="text-xs space-y-1">
                      {status.missingFields.map((field, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{field}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {status.updateSuccess ? (
                  <p className="text-xs flex items-center gap-1 text-success">
                    <CheckCircle className="w-3 h-3" />
                    数据更新成功
                  </p>
                ) : (
                  <p className="text-xs flex items-center gap-1 text-danger">
                    <XCircle className="w-3 h-3" />
                    数据更新失败，请重试
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
