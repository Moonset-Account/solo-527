import { useEffect, useState } from 'react';
import FilterBar from '@/components/filters/FilterBar';
import TemperatureChart from '@/components/charts/TemperatureChart';
import AnomalyBarChart from '@/components/charts/AnomalyBarChart';
import { api } from '@/services/api';
import { useFilterStore } from '@/store';
import type { TemperatureRecord, AnomalyStatistics, TemperatureProbe } from '@shared/types';
import { Thermometer, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';

export default function Temperature() {
  const [tempData, setTempData] = useState<TemperatureRecord[]>([]);
  const [anomalyStats, setAnomalyStats] = useState<AnomalyStatistics[]>([]);
  const [probes, setProbes] = useState<TemperatureProbe[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsDimension, setStatsDimension] = useState<'vehicle' | 'route'>('vehicle');
  
  const { selectedVehicleId } = useFilterStore();

  useEffect(() => {
    loadData();
  }, [selectedVehicleId, statsDimension]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [temp, stats, probeData] = await Promise.all([
        api.getTemperatureTrend(selectedVehicleId || undefined),
        api.getAnomalyStatistics(statsDimension),
        api.getProbeStatus(),
      ]);
      setTempData(temp);
      setAnomalyStats(stats);
      setProbes(probeData);
    } catch (error) {
      console.error('Failed to load temperature data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProbeStatusColor = (status: string) => {
    const map: Record<string, string> = {
      valid: 'text-green-600 bg-green-50',
      expiring: 'text-yellow-600 bg-yellow-50',
      expired: 'text-red-600 bg-red-50',
    };
    return map[status] || 'bg-gray-50 text-gray-600';
  };

  const getProbeStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      valid: '校准正常',
      expiring: '即将到期',
      expired: '已过期',
    };
    return map[status] || status;
  };

  return (
    <div>
      <FilterBar />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">温度趋势曲线</h3>
            <TemperatureChart data={tempData} loading={loading} />
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">温度探头校准状态</h3>
            <div className="space-y-3">
              {probes.map((probe) => (
                <div key={probe.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-800">{probe.boxId}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getProbeStatusColor(probe.calibrationStatus)}`}>
                      {getProbeStatusLabel(probe.calibrationStatus)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>上次校准: {dayjs(probe.lastCalibrationDate).format('YYYY-MM-DD')}</p>
                    <p>下次校准: {dayjs(probe.nextCalibrationDate).format('YYYY-MM-DD')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">异常时长统计</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setStatsDimension('vehicle')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statsDimension === 'vehicle'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              按车辆
            </button>
            <button
              onClick={() => setStatsDimension('route')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                statsDimension === 'route'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              按路线
            </button>
          </div>
        </div>
        <AnomalyBarChart data={anomalyStats} loading={loading} />
      </div>
    </div>
  );
}
