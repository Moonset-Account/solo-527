import { AlertTriangle, Clock, Send } from 'lucide-react';
import type { Alert } from '@shared/types';

interface AlertListProps {
  alerts: Alert[];
}

export default function AlertList({ alerts }: AlertListProps) {
  const levelConfig = {
    high: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', label: '高危' },
    medium: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', label: '中等' },
    low: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', label: '低' },
  };

  const typeLabels: Record<Alert['type'], string> = {
    shortage: '车辆不足',
    overflow: '车辆堆积',
    maintenance_timeout: '维修超时',
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    return `${hours}小时前`;
  };

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
      {alerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle size={32} className="mx-auto mb-2 opacity-50" />
          <p>暂无告警</p>
        </div>
      ) : (
        alerts.map((alert) => {
          const config = levelConfig[alert.level];
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${config.bg} ${config.border} transition-all hover:scale-[1.02]`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className={`mt-0.5 ${config.text}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-200">
                        {alert.stationName || alert.stationId}
                      </span>
                      <span className={`badge ${config.text} border-current`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {typeLabels[alert.type]}: {alert.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock size={12} />
                        {formatTime(alert.createTime)}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary !px-2 !py-1 text-xs flex items-center gap-1">
                  <Send size={12} />
                  派单
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
