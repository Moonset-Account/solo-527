import { useEffect, useState } from 'react';
import { statisticsApi } from '../services/statisticsApi';
import type { ProductionStatistics, EquipmentStatistics, ShiftPerformance } from '../types';
import dayjs from 'dayjs';

const Statistics = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(7, 'day').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(dayjs().add(1, 'day').format('YYYY-MM-DD'));
  const [productionStats, setProductionStats] = useState<ProductionStatistics | null>(null);
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStatistics[]>([]);
  const [shiftPerformances, setShiftPerformances] = useState<ShiftPerformance[]>([]);
  const [downtimeReasons, setDowntimeReasons] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [startDate, endDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prod, eq, shift, reasons] = await Promise.all([
        statisticsApi.getProduction(startDate, endDate),
        statisticsApi.getEquipmentUtilization(startDate, endDate),
        statisticsApi.getShiftPerformance(startDate, endDate),
        statisticsApi.getDowntimeReasons(startDate, endDate),
      ]);
      setProductionStats(prod);
      setEquipmentStats(eq);
      setShiftPerformances(shift);
      setDowntimeReasons(reasons);
    } catch (err) {
      console.error('加载统计数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const getDowntimeReasonText = (reason: number) => {
    const reasons: Record<number, string> = {
      1: '计划维护',
      2: '换模',
      3: '缺料',
      4: '设备故障',
      5: '质量问题',
      6: '计划休息',
      99: '其他',
    };
    return reasons[reason] || '未知';
  };

  const maxUtilization = Math.max(...equipmentStats.map(e => e.utilizationRate), 100);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">统计分析</h2>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-gray-400">至</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">加载中...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-2">总产量</div>
              <div className="text-3xl font-bold text-gray-800">
                {productionStats?.totalOutput || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">件</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-2">平均合格率</div>
              <div className="text-3xl font-bold text-green-600">
                {productionStats?.passRate?.toFixed(2) || '0.00'}%
              </div>
              <div className="text-sm text-gray-400 mt-1">
                不良 {productionStats?.totalDefective || 0} 件
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-2">总工时</div>
              <div className="text-3xl font-bold text-blue-600">
                {productionStats?.totalWorkHours?.toFixed(1) || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">小时</div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="text-gray-500 text-sm mb-2">工单数量</div>
              <div className="text-3xl font-bold text-purple-600">
                {productionStats?.workOrderCount || 0}
              </div>
              <div className="text-sm text-gray-400 mt-1">个</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">设备稼动率</h3>
              <div className="space-y-3">
                {equipmentStats.map((stat) => (
                  <div key={stat.equipmentId}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{stat.equipmentName}</span>
                      <span className="font-medium">{stat.utilizationRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(stat.utilizationRate, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>运行 {stat.runningHours.toFixed(1)}h</span>
                      <span>停机 {stat.downtimeHours.toFixed(1)}h</span>
                    </div>
                  </div>
                ))}
                {equipmentStats.length === 0 && (
                  <div className="text-center text-gray-400 py-8">暂无数据</div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4">停机原因分布</h3>
              <div className="space-y-3">
                {Object.entries(downtimeReasons).map(([reason, count]) => {
                  const total = Object.values(downtimeReasons).reduce((a, b) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  return (
                    <div key={reason}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{getDowntimeReasonText(Number(reason))}</span>
                        <span className="font-medium">{count} 次 ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-400 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {Object.keys(downtimeReasons).length === 0 && (
                  <div className="text-center text-gray-400 py-8">暂无停机记录</div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">班组绩效</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">班组</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日期</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总产量</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">不良数</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">合格率</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">总工时</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">设备稼动率</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {shiftPerformances.map((perf) => (
                    <tr key={perf.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{perf.shiftName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {new Date(perf.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{perf.totalOutput}</td>
                      <td className="px-4 py-3 text-right text-red-500">{perf.totalDefective}</td>
                      <td className="px-4 py-3 text-right text-green-600">{perf.passRate.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right">{perf.totalWorkHours.toFixed(1)}h</td>
                      <td className="px-4 py-3 text-right">{perf.equipmentUtilizationRate.toFixed(2)}%</td>
                    </tr>
                  ))}
                  {shiftPerformances.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Statistics;
