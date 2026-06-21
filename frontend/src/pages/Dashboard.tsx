import { useEffect, useState } from 'react';
import { equipmentApi } from '../services/equipmentApi';
import { statisticsApi } from '../services/statisticsApi';
import type { Equipment, ProductionStatistics, EquipmentStatistics } from '../types';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [productionStats, setProductionStats] = useState<ProductionStatistics | null>(null);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const today = dayjs().format('YYYY-MM-DD');
      const endDate = dayjs().add(1, 'day').format('YYYY-MM-DD');

      const [eq, prod, eqStats] = await Promise.all([
        equipmentApi.getAll(),
        statisticsApi.getProduction(today, endDate),
        statisticsApi.getEquipmentUtilization(today, endDate),
      ]);

      setEquipments(eq);
      setProductionStats(prod);
      setEquipmentStats(eqStats);
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-red-500';
      case 4: return 'bg-gray-500';
      case 5: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBgColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-green-50 border-green-200';
      case 2: return 'bg-blue-50 border-blue-200';
      case 3: return 'bg-red-50 border-red-200';
      case 4: return 'bg-gray-50 border-gray-200';
      case 5: return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return <div className="text-center py-20">加载中...</div>;
  }

  const runningCount = equipments.filter(e => e.status === 1 || e.status === 2).length;
  const abnormalCount = equipments.filter(e => e.status === 3).length;
  const stoppedCount = equipments.filter(e => e.status === 4 || e.status === 5).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-gray-500 text-sm mb-2">今日产量</div>
          <div className="text-3xl font-bold text-gray-800">
            {productionStats?.totalOutput || 0}
          </div>
          <div className="text-sm text-gray-400 mt-1">件</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-gray-500 text-sm mb-2">合格率</div>
          <div className="text-3xl font-bold text-green-600">
            {productionStats?.passRate?.toFixed(2) || '0.00'}%
          </div>
          <div className="text-sm text-gray-400 mt-1">
            不良 {productionStats?.totalDefective || 0} 件
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-gray-500 text-sm mb-2">运行设备</div>
          <div className="text-3xl font-bold text-blue-600">
            {runningCount}/{equipments.length}
          </div>
          <div className="text-sm text-gray-400 mt-1">台</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <div className="text-gray-500 text-sm mb-2">异常设备</div>
          <div className="text-3xl font-bold text-red-600">
            {abnormalCount}
          </div>
          <div className="text-sm text-gray-400 mt-1">台</div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-semibold mb-4">设备状态总览</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {equipments.map((eq) => (
            <div
              key={eq.id}
              className={`p-4 rounded-lg border ${getStatusBgColor(eq.status)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(eq.status)}`}></div>
                <span className="font-medium text-sm">{eq.code}</span>
              </div>
              <div className="text-xs text-gray-600">{eq.name}</div>
              <div className="text-xs text-gray-500 mt-1">{eq.statusText}</div>
              {eq.currentWorkOrderCode && (
                <div className="text-xs text-primary mt-1 truncate">
                  {eq.currentWorkOrderCode}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">设备稼动率</h3>
          <div className="space-y-3">
            {equipmentStats.slice(0, 6).map((stat) => (
              <div key={stat.equipmentId}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{stat.equipmentName}</span>
                  <span className="font-medium">{stat.utilizationRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(stat.utilizationRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">生产概览</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">今日工单</span>
              <span className="font-semibold">{productionStats?.workOrderCount || 0} 个</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">总工时</span>
              <span className="font-semibold">{productionStats?.totalWorkHours?.toFixed(1) || 0} 小时</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">运行设备数</span>
              <span className="font-semibold text-green-600">{runningCount} 台</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">停机设备数</span>
              <span className="font-semibold text-gray-500">{stoppedCount} 台</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
