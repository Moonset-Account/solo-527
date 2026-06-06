import { useState, useCallback, useEffect } from 'react';
import EnergyTrendChart from '../components/EnergyTrendChart';
import EnergyBreakdownChart from '../components/EnergyBreakdownChart';
import WeekCompareChart from '../components/WeekCompareChart';
import AnomalyDetailModal from '../components/AnomalyDetailModal';
import GlobalFilterBar from '../components/GlobalFilterBar';
import { apiService } from '../services/api';
import { useFilterStore } from '../stores/filterStore';
import type { AnomalyPoint } from '../types';
import dayjs from 'dayjs';
import { AlertTriangle, Clock, ChevronRight } from 'lucide-react';

export default function EnergyAnalysis() {
  const [selectedAnomalyId, setSelectedAnomalyId] = useState<string | null>(null);
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);
  const { timeRange, roomIds, weekType } = useFilterStore();

  const fetchAnomalies = useCallback(async () => {
    try {
      const data = await apiService.getAnomalies({
        startTime: timeRange.start,
        endTime: timeRange.end,
        roomIds: roomIds.length > 0 ? roomIds : undefined,
        weekType: weekType !== 'all' ? weekType : undefined,
      });
      setAnomalies(data as AnomalyPoint[]);
    } catch (error) {
      console.error('Failed to fetch anomalies:', error);
    }
  }, [timeRange, roomIds, weekType]);

  useEffect(() => {
    fetchAnomalies();
  }, [fetchAnomalies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500/20 border-red-500/30 text-red-400';
      case 'medium': return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
      default: return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-6">
        <GlobalFilterBar />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <EnergyTrendChart onAnomalyClick={setSelectedAnomalyId} />
          </div>
          <div className="chart-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
                <h3 className="text-base font-semibold text-white">异常能耗点</h3>
              </div>
              <span className="text-xs text-slate-400">{anomalies.length} 个</span>
            </div>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {anomalies.slice(0, 15).map((anomaly) => (
                <div
                  key={anomaly.id}
                  onClick={() => setSelectedAnomalyId(anomaly.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.01] ${getSeverityColor(anomaly.severity)}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{anomaly.value.toFixed(2)} kWh</span>
                        {anomaly.deviation && (
                          <span className="text-xs opacity-75">
                            偏离 {(anomaly.deviation * 100).toFixed(0)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs opacity-75">
                        <Clock className="w-3 h-3" />
                        {dayjs(anomaly.timestamp).format('MM-DD HH:mm')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              ))}
              {anomalies.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">暂无异常数据</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EnergyBreakdownChart />
          <WeekCompareChart />
        </div>
      </div>

      <AnomalyDetailModal
        anomalyId={selectedAnomalyId}
        onClose={() => setSelectedAnomalyId(null)}
      />
    </div>
  );
}
