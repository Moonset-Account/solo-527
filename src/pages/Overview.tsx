import { useEffect, useState } from 'react';
import { Bike, Users, Wrench, Truck, AlertTriangle, Activity } from 'lucide-react';
import KPICard from '@/components/KPICard';
import StationMap from '@/components/StationMap';
import AlertList from '@/components/AlertList';
import HourlyHeatmap from '@/components/HourlyHeatmap';
import { useDashboardStore } from '@/store/useDashboardStore';
import type { Station, ODRoute } from '@shared/types';

export default function Overview() {
  const {
    kpi,
    stations,
    alerts,
    hourlyData,
    selectedStation,
    setSelectedStation,
    setKpi,
    setStations,
    setAlerts,
    setHourlyData,
    setEtlInfo,
    setLoading,
    setError,
  } = useDashboardStore();

  const [odRoutes, setOdRoutes] = useState<ODRoute[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/overview');
        const result = await res.json();
        if (result.code === 0) {
          setKpi(result.data.kpi);
          setStations(result.data.stations);
          setAlerts(result.data.alerts);
          setHourlyData(result.data.hourlyData);
          if (result.etlInfo) {
            setEtlInfo(result.etlInfo.updateTime, result.etlInfo.dataVersion, result.etlInfo.warnings);
          }
        } else {
          setError(result.message);
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    };

    const fetchOD = async () => {
      try {
        const res = await fetch('/api/routes/od');
        const result = await res.json();
        if (result.code === 0) {
          setOdRoutes(result.data);
        }
      } catch (e) {
        console.error('Failed to fetch OD routes:', e);
      }
    };

    fetchData();
    fetchOD();
  }, [setKpi, setStations, setAlerts, setHourlyData, setEtlInfo, setLoading, setError]);

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-white">总览仪表盘</h2>
          <p className="text-sm text-gray-400 mt-1">城市共享单车运营实时监控</p>
        </div>
        {selectedStation && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">已选择: {selectedStation.name}</span>
            <button
              className="text-xs text-gray-500 hover:text-gray-300"
              onClick={() => setSelectedStation(null)}
            >
              清除
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-6 gap-4">
        {kpi && (
          <>
            <KPICard
              title="今日骑行量"
              value={kpi.todayTrips.toLocaleString()}
              icon={Activity}
              trend={kpi.tripGrowth}
              unit="次"
            />
            <KPICard
              title="活跃车辆"
              value={kpi.activeBikes.toLocaleString()}
              icon={Bike}
              unit="辆"
            />
            <KPICard
              title="可调度库存"
              value={kpi.availableBikes.toLocaleString()}
              icon={Users}
              status={kpi.availabilityRate > 80 ? 'good' : kpi.availabilityRate > 60 ? 'warning' : 'danger'}
              unit="辆"
            />
            <KPICard
              title="维修中车辆"
              value={kpi.maintenanceBikes.toLocaleString()}
              icon={Wrench}
              status={kpi.maintenanceBikes > 30 ? 'warning' : 'good'}
              unit="辆"
            />
            <KPICard
              title="今日调度次数"
              value={kpi.dispatchCount}
              icon={Truck}
              unit="次"
            />
            <KPICard
              title="告警数量"
              value={kpi.alertCount}
              icon={AlertTriangle}
              status={kpi.alertCount > 10 ? 'danger' : kpi.alertCount > 5 ? 'warning' : 'good'}
              unit="条"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 glass-card p-5">
          <h3 className="section-title mb-4">站点地图 & OD流向</h3>
          <div className="h-[500px]">
            <StationMap
              stations={stations}
              odRoutes={odRoutes}
              onStationClick={handleStationClick}
            />
          </div>
        </div>

        <div className="col-span-4 glass-card p-5">
          <h3 className="section-title mb-4">实时告警</h3>
          <AlertList alerts={alerts} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8 glass-card p-5">
          <h3 className="section-title mb-4">24小时骑行热力</h3>
          {hourlyData.length > 0 && <HourlyHeatmap data={hourlyData} />}
        </div>

        <div className="col-span-4 glass-card p-5">
          <h3 className="section-title mb-4">站点状态分布</h3>
          <div className="space-y-4">
            {[
              { label: '正常', count: stations.filter(s => s.status === 'normal').length, color: 'bg-emerald-500' },
              { label: '车辆不足', count: stations.filter(s => s.status === 'low').length, color: 'bg-red-500' },
              { label: '车辆堆积', count: stations.filter(s => s.status === 'full').length, color: 'bg-blue-500' },
              { label: '维护中', count: stations.filter(s => s.status === 'maintenance').length, color: 'bg-amber-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-300 flex-1">{item.label}</span>
                <span className="font-mono text-lg font-bold text-white">{item.count}</span>
                <span className="text-xs text-gray-500">站</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
