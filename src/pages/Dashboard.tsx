import { useEffect, useState } from 'react';
import { Truck, Thermometer, Clock, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import KPICard from '@/components/ui/KPICard';
import FilterBar from '@/components/filters/FilterBar';
import TemperatureChart from '@/components/charts/TemperatureChart';
import AnomalyBarChart from '@/components/charts/AnomalyBarChart';
import { api } from '@/services/api';
import { useFilterStore } from '@/store';
import type { KPIData, TemperatureRecord, AnomalyStatistics, AnomalyEvent } from '@shared/types';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';

export default function Dashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [tempData, setTempData] = useState<TemperatureRecord[]>([]);
  const [anomalyStats, setAnomalyStats] = useState<AnomalyStatistics[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { selectedVehicleId } = useFilterStore();

  useEffect(() => {
    loadData();
  }, [selectedVehicleId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [kpi, temp, stats, anomalyList] = await Promise.all([
        api.getKPIData(),
        api.getTemperatureTrend(selectedVehicleId || undefined),
        api.getAnomalyStatistics('vehicle'),
        api.getAnomalyList(1, 5),
      ]);
      setKpiData(kpi);
      setTempData(temp);
      setAnomalyStats(stats);
      setAnomalies(anomalyList.list);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      temp_high: '温度过高',
      temp_low: '温度过低',
      door_open: '车门异常开启',
      delay: '配送延迟',
    };
    return map[type] || type;
  };

  const getSeverityColor = (severity: string) => {
    const map: Record<string, string> = {
      low: 'bg-green-100 text-green-700',
      medium: 'bg-yellow-100 text-yellow-700',
      high: 'bg-red-100 text-red-700',
    };
    return map[severity] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div>
      <FilterBar />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KPICard
          title="在途车辆"
          value={kpiData?.activeVehicles || 0}
          unit="辆"
          icon={Truck}
          color="blue"
          trend={2.5}
        />
        <KPICard
          title="温度异常率"
          value={kpiData?.temperatureAnomalyRate || 0}
          unit="%"
          icon={Thermometer}
          color="red"
          trend={-1.2}
        />
        <KPICard
          title="平均配送时长"
          value={kpiData?.avgDeliveryDuration || 0}
          unit="分钟"
          icon={Clock}
          color="purple"
        />
        <KPICard
          title="准时到货率"
          value={kpiData?.onTimeRate || 0}
          unit="%"
          icon={CheckCircle}
          color="green"
          trend={0.8}
        />
        <KPICard
          title="待处理异常"
          value={kpiData?.pendingAnomalies || 0}
          unit="个"
          icon={AlertTriangle}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">温度趋势监控</h3>
              <Link
                to="/temperature"
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看详情
              </Link>
            </div>
            <TemperatureChart data={tempData} loading={loading} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">异常告警</h3>
              <Link
                to="/exception"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                全部
              </Link>
            </div>
            <div className="space-y-3">
              {anomalies.map((anomaly) => (
                <div
                  key={anomaly.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {getAnomalyTypeLabel(anomaly.type)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {dayjs(anomaly.startTime).format('MM-DD HH:mm')}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getSeverityColor(anomaly.severity)}`}>
                      {anomaly.severity === 'high' ? '高' : anomaly.severity === 'medium' ? '中' : '低'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">{anomaly.description}</p>
                </div>
              ))}
              {anomalies.length === 0 && !loading && (
                <p className="text-sm text-gray-500 text-center py-4">暂无异常</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              各车辆异常时长统计
            </h3>
          </div>
          <AnomalyBarChart data={anomalyStats} loading={loading} />
        </div>
      </div>
    </div>
  );
}
