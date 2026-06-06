import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Percent, BarChart3, Download, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { financeApi } from '../services/api';
import { ProfitReport as ProfitReportType, MonthlyTrend } from '../types';
import { formatCurrency, formatPercent } from '../utils/format';

const COLORS = ['#0d9488', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export const ProfitReportPage: React.FC = () => {
  const [report, setReport] = useState<ProfitReportType | null>(null);
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    createdById: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [reportData, trendData] = await Promise.all([
          financeApi.getProfitReport(filters),
          financeApi.getMonthlyTrend(12),
        ]);
        setReport(reportData);
        setMonthlyTrend(trendData);
      } catch (error) {
        console.error('Failed to fetch finance data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  const summary = report?.summary || {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    overallMargin: 0,
    quoteCount: 0,
  };

  const pieData = [
    { name: '毛利', value: summary.totalProfit },
    { name: '成本', value: summary.totalCost },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">利润统计</h1>
            <p className="text-slate-500 mt-1">查看营收、成本和利润分析报表</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg">
              <Calendar size={16} className="text-slate-400" />
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="text-sm text-slate-600 bg-transparent outline-none"
              />
              <span className="text-slate-400">至</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="text-sm text-slate-600 bg-transparent outline-none"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg transition-colors">
              <Download size={16} />
              导出报表
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="总营收"
            value={summary.totalRevenue}
            icon={DollarSign}
            color="teal"
            formatValue={(v) => formatCurrency(v as number)}
          />
          <StatCard
            title="总成本"
            value={summary.totalCost}
            icon={BarChart3}
            color="blue"
            formatValue={(v) => formatCurrency(v as number)}
          />
          <StatCard
            title="总利润"
            value={summary.totalProfit}
            icon={TrendingUp}
            color="green"
            formatValue={(v) => formatCurrency(v as number)}
          />
          <StatCard
            title="综合毛利率"
            value={summary.overallMargin}
            icon={Percent}
            color="amber"
            formatValue={(v) => formatPercent(v as number)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-6">月度营收趋势</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="#0d9488" radius={[4, 4, 0, 0]} name="营收" />
                  <Bar dataKey="cost" fill="#94a3b8" radius={[4, 4, 0, 0]} name="成本" />
                  <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} name="利润" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="font-semibold text-slate-800 mb-6">营收构成</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {pieData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className="text-sm text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">报价明细</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase">客户</th>
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase">创建人</th>
                  <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">营收</th>
                  <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">成本</th>
                  <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">利润</th>
                  <th className="text-right py-3 text-xs font-medium text-slate-500 uppercase">毛利率</th>
                  <th className="text-left py-3 text-xs font-medium text-slate-500 uppercase">创建时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report?.details?.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="py-3 text-sm font-medium text-slate-800">{item.customerName}</td>
                    <td className="py-3 text-sm text-slate-600">{item.createdByName}</td>
                    <td className="py-3 text-sm text-right text-slate-700">{formatCurrency(item.revenue)}</td>
                    <td className="py-3 text-sm text-right text-slate-500">{formatCurrency(item.cost)}</td>
                    <td className="py-3 text-sm text-right font-medium text-slate-800">{formatCurrency(item.profit)}</td>
                    <td className="py-3 text-sm text-right">
                      <span
                        className={`font-medium ${
                          item.profitMargin < 15
                            ? 'text-red-600'
                            : item.profitMargin < 25
                            ? 'text-amber-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatPercent(item.profitMargin)}
                      </span>
                    </td>
                    <td className="py-3 text-sm text-slate-500">{item.createdAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};
