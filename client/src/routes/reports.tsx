import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { apiClient } from '@/api/client';
import { APARTMENT_STATUS, VIEWING_STATUS } from '@/utils/constants';

interface Statistics {
  apartments: {
    total: number;
    vacant: number;
    occupied: number;
    reserved: number;
    maintenance: number;
  };
  viewings: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  followups: {
    total: number;
    signed: number;
    lost: number;
    pending: number;
  };
  deposits: {
    total: number;
    held: number;
    refunded: number;
    disputed: number;
    totalAmount: number;
    refundedAmount: number;
  };
  consultantStats: Array<{
    consultantId: number;
    consultantName: string;
    followups: number;
    signed: number;
  }>;
}

interface MonthlySummary {
  month: string;
  newCustomers: number;
  viewings: number;
  signings: number;
}

export const Route = createFileRoute('/reports')({
  component: ReportsPage,
});

function ReportsPage() {
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<MonthlySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const fetchStatistics = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    apiClient
      .get('/reports/statistics', { params })
      .then((res) => {
        setStatistics(res.data);
      })
      .finally(() => setLoading(false));
  };

  const fetchMonthlySummary = () => {
    apiClient
      .get('/reports/monthly-summary', { params: { year } })
      .then((res) => {
        setMonthlySummary(res.data);
      });
  };

  useEffect(() => {
    fetchStatistics();
    fetchMonthlySummary();
  }, [startDate, endDate, year]);

  const apartmentStats = statistics?.apartments;
  const viewingStats = statistics?.viewings;
  const followupStats = statistics?.followups;
  const depositStats = statistics?.deposits;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">统计报表</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">统计开始日期</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">统计结束日期</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">月度统计年份</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {[0, 1, 2, 3].map((offset) => {
                const y = new Date().getFullYear() - offset;
                return (
                  <option key={y} value={y.toString()}>{y}年</option>
                );
              })}
            </select>
          </div>
          <button
            onClick={fetchStatistics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            刷新统计
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="text-lg text-gray-500">加载中...</div>
        </div>
      )}

      {!loading && statistics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 房源统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总房源</span>
                  <span className="text-xl font-bold">{apartmentStats?.total || 0}</span>
                </div>
                {APARTMENT_STATUS.map((status) => {
                  const key = status.value as keyof typeof apartmentStats;
                  const count = Number(apartmentStats?.[key]) || 0;
                  const percent = apartmentStats?.total ? ((count / apartmentStats.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={status.value}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{status.label}</span>
                        <span className="font-medium">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${status.color.replace('text-', 'bg-').split(' ')[0]}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📅 看房统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总预约</span>
                  <span className="text-xl font-bold">{viewingStats?.total || 0}</span>
                </div>
                {VIEWING_STATUS.map((status) => {
                  const key = status.value as keyof typeof viewingStats;
                  const count = Number(viewingStats?.[key]) || 0;
                  const percent = viewingStats?.total ? ((count / viewingStats.total) * 100).toFixed(1) : '0';
                  return (
                    <div key={status.value}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{status.label}</span>
                        <span className="font-medium">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${status.color.replace('text-', 'bg-').split(' ')[0]}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">📝 跟进统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总跟进</span>
                  <span className="text-xl font-bold">{followupStats?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">已签约</span>
                  <span className="font-medium text-green-600">{followupStats?.signed || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">已流失</span>
                  <span className="font-medium text-red-600">{followupStats?.lost || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">待跟进</span>
                  <span className="font-medium text-yellow-600">{followupStats?.pending || 0}</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">转化率</span>
                    <span className="font-bold text-blue-600">
                      {followupStats?.total ? ((followupStats.signed / followupStats.total) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">💰 押金统计</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">总押金笔数</span>
                  <span className="text-xl font-bold">{depositStats?.total || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">托管中</span>
                  <span className="font-medium">{depositStats?.held || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">已退还</span>
                  <span className="font-medium text-green-600">{depositStats?.refunded || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">有争议</span>
                  <span className="font-medium text-red-600">{depositStats?.disputed || 0}</span>
                </div>
                <div className="pt-3 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">押金总额</span>
                    <span className="font-bold">¥{Number(depositStats?.totalAmount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">已退金额</span>
                    <span className="font-bold text-green-600">¥{Number(depositStats?.refundedAmount || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">👥 顾问业绩排行</h3>
            </div>
            <div className="p-6">
              {statistics.consultantStats && statistics.consultantStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">排名</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">顾问</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">跟进次数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">签约数</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">转化率</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {statistics.consultantStats
                        .sort((a, b) => b.signed - a.signed)
                        .map((stat, index) => (
                          <tr key={stat.consultantId} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              {index === 0 && <span className="text-yellow-500 font-bold">🥇</span>}
                              {index === 1 && <span className="text-gray-400 font-bold">🥈</span>}
                              {index === 2 && <span className="text-orange-500 font-bold">🥉</span>}
                              {index > 2 && <span className="text-gray-500">{index + 1}</span>}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium">{stat.consultantName}</td>
                            <td className="px-4 py-3 text-sm">{stat.followups}</td>
                            <td className="px-4 py-3 text-sm font-medium text-green-600">{stat.signed}</td>
                            <td className="px-4 py-3 text-sm">
                              {stat.followups > 0 ? ((stat.signed / stat.followups) * 100).toFixed(1) : '0'}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-800">📊 {year}年月度趋势</h3>
            </div>
            <div className="p-6">
              {monthlySummary.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-end justify-between h-48 px-4">
                    {monthlySummary.map((item) => {
                      const maxValue = Math.max(...monthlySummary.map((m) => Math.max(m.newCustomers, m.viewings, m.signings)), 1);
                      return (
                        <div key={item.month} className="flex flex-col items-center flex-1 mx-1">
                          <div className="flex items-end space-x-1 h-32">
                            <div
                              className="w-3 bg-blue-500 rounded-t"
                              style={{ height: `${(item.newCustomers / maxValue) * 100}%` }}
                              title={`新增客户: ${item.newCustomers}`}
                            />
                            <div
                              className="w-3 bg-green-500 rounded-t"
                              style={{ height: `${(item.viewings / maxValue) * 100}%` }}
                              title={`看房: ${item.viewings}`}
                            />
                            <div
                              className="w-3 bg-yellow-500 rounded-t"
                              style={{ height: `${(item.signings / maxValue) * 100}%` }}
                              title={`签约: ${item.signings}`}
                            />
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            {item.month.split('-')[1]}月
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center space-x-6 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
                      <span className="text-gray-600">新增客户</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded mr-2" />
                      <span className="text-gray-600">看房预约</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded mr-2" />
                      <span className="text-gray-600">签约数</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">暂无数据</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
