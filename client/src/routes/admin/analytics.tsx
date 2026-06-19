import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { analyticsApi } from '../../api';
import dayjs from 'dayjs';

export const Route = createFileRoute('/admin/analytics')({
  component: AnalyticsPage,
});

const delayReasonMap: Record<string, string> = {
  technician_shortage: '师傅人手不足',
  parts_unavailable: '配件缺货',
  customer_reschedule: '客户改约',
  weather: '天气原因',
  traffic: '交通拥堵',
  complex_repair: '维修难度大',
  other: '其他原因',
};

function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [onTimeByDate, setOnTimeByDate] = useState<any[]>([]);
  const [onTimeByManager, setOnTimeByManager] = useState<any[]>([]);
  const [delayReasons, setDelayReasons] = useState<any>(null);
  const [workloadByTech, setWorkloadByTech] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    city: '',
    startDate: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
    endDate: dayjs().format('YYYY-MM-DD'),
  });

  useEffect(() => {
    fetchAllData();
  }, [filters]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filters.city) params.city = filters.city;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const [overviewData, dateData, managerData, reasonData, techData] = await Promise.all([
        analyticsApi.overview(params),
        analyticsApi.onTimeByDate(params),
        analyticsApi.onTimeByManager(params),
        analyticsApi.delayReasons(params),
        analyticsApi.workloadByTech(params),
      ]);

      setOverview(overviewData);
      setOnTimeByDate(dateData as any[]);
      setOnTimeByManager(managerData as any[]);
      setDelayReasons(reasonData);
      setWorkloadByTech(techData as any[]);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const maxOnTimeRate = Math.max(...onTimeByDate.map((d) => parseFloat(d.onTimeRate) || 0), 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">履约准时率分析</h1>
          <p className="text-gray-500 mt-1">按城市经理、日期、原因多维度分析履约情况</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">筛选条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <select
              name="city"
              value={filters.city}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            >
              <option value="">全部城市</option>
              {['北京', '上海', '广州', '深圳', '杭州', '成都'].map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">总订单数</p>
          <p className="text-2xl font-bold text-gray-800 mt-1">{overview?.orders?.total || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">已完成</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{overview?.orders?.completed || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">准时履约率</p>
          <p className="text-2xl font-bold text-primary-600 mt-1">
            {(overview?.orders?.onTimeRate || 0).toFixed(1)}%
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-500">平均负载率</p>
          <p className={`text-2xl font-bold mt-1 ${
            (overview?.workload?.avgLoadRate || 0) > 90 ? 'text-red-600' :
            (overview?.workload?.avgLoadRate || 0) > 70 ? 'text-yellow-600' : 'text-green-600'
          }`}>
            {(overview?.workload?.avgLoadRate || 0).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">准时率趋势（按日期）</h3>
          <div className="h-64 flex items-end gap-1">
            {onTimeByDate.map((item, idx) => {
              const rate = parseFloat(item.onTimeRate) || 0;
              const height = (rate / maxOnTimeRate) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t transition-all ${
                      rate >= 90 ? 'bg-green-500' :
                      rate >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${item.date}: ${rate.toFixed(1)}%`}
                  />
                  <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left whitespace-nowrap">
                    {dayjs(item.date).format('MM-DD')}
                  </span>
                </div>
              );
            })}
          </div>
          {onTimeByDate.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无数据</div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">延迟原因分布</h3>
          <div className="space-y-4">
            {delayReasons?.reasons?.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">
                    {delayReasonMap[item.reason] || item.reason || '未知'}
                  </span>
                  <span className="text-sm text-gray-500">
                    {item.count} 单 ({item.percentage}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {(!delayReasons?.reasons || delayReasons.reasons.length === 0) && (
              <div className="text-center py-8 text-gray-400">暂无延迟数据</div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">城市经理履约排名</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">城市经理</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">城市</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">完成单数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">准时单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">延迟单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">准时率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {onTimeByManager.map((manager, idx) => (
                <tr key={manager.cityManagerId || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                      idx === 1 ? 'bg-gray-100 text-gray-800' :
                      idx === 2 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {manager.cityManagerName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{manager.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{manager.total}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{manager.onTime}</td>
                  <td className="px-4 py-3 text-sm text-red-600">{manager.delayed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(manager.onTimeRate) >= 90 ? 'bg-green-500' :
                            parseFloat(manager.onTimeRate) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${manager.onTimeRate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {parseFloat(manager.onTimeRate).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {onTimeByManager.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无数据</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">师傅负载排行</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">师傅</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">城市</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">总派单</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">已完成</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">平均负载率</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">统计天数</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {workloadByTech.map((tech, idx) => (
                <tr key={tech.technicianId || idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-500">{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {tech.technicianName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tech.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{tech.totalAssigned}</td>
                  <td className="px-4 py-3 text-sm text-green-600">{tech.totalCompleted}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${
                      parseFloat(tech.avgLoadRate) > 100 ? 'text-red-600' :
                      parseFloat(tech.avgLoadRate) > 80 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {parseFloat(tech.avgLoadRate).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{tech.days} 天</td>
                </tr>
              ))}
            </tbody>
          </table>
          {workloadByTech.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无数据</div>
          )}
        </div>
      </div>
    </div>
  );
}
