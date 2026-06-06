import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Clock, Filter } from 'lucide-react';
import type { AlarmItem } from '../types';
import { apiService } from '../services/api';
import dayjs from 'dayjs';

export default function AlarmList() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'acknowledged' | 'resolved'>('all');

  const fetchAlarms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getAlarms({ limit: 20 });
      setAlarms(data);
    } catch (error) {
      console.error('Failed to fetch alarms:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  const filteredAlarms = filter === 'all' 
    ? alarms 
    : alarms.filter(a => a.status === filter);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-orange-400 bg-orange-500/20';
      default: return 'text-blue-400 bg-blue-500/20';
    }
  };

  const getLevelText = (level: string) => {
    switch (level) {
      case 'critical': return '严重';
      case 'warning': return '警告';
      default: return '信息';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '待处理';
      case 'acknowledged': return '已确认';
      case 'resolved': return '已解决';
      default: return status;
    }
  };

  return (
    <div className="chart-card h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-orange-400" />
          <h3 className="text-base font-semibold text-white">实时告警</h3>
        </div>
        <div className="flex items-center gap-1 bg-slate-700/50 rounded-lg p-1">
          {(['all', 'active', 'acknowledged', 'resolved'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2 py-1 text-xs rounded-md transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {f === 'all' ? '全部' : getStatusText(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredAlarms.length > 0 ? (
          filteredAlarms.map((alarm) => (
            <div
              key={alarm.id}
              className="p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getLevelColor(alarm.level)}`}>
                      {getLevelText(alarm.level)}
                    </span>
                    <span className="text-xs text-slate-500 truncate">{alarm.deviceName}</span>
                  </div>
                  <p className="text-sm text-slate-300 line-clamp-2">{alarm.message}</p>
                  <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{dayjs(alarm.timestamp).format('MM-DD HH:mm')}</span>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${
                  alarm.status === 'resolved' ? 'badge-success' :
                  alarm.status === 'acknowledged' ? 'badge-info' : 'badge-warning'
                }`}>
                  {getStatusText(alarm.status)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">暂无告警记录</p>
          </div>
        )}
      </div>
    </div>
  );
}
