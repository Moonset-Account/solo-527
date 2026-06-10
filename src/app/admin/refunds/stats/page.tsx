'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import {
  BarChart3,
  TrendingUp,
  Shield,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import Link from 'next/link';

const byReasonData = [
  { reason: '价格太高', count: 12, amount: 3588, percent: 37.5 },
  { reason: '缺少功能', count: 8, amount: 2392, percent: 25 },
  { reason: '产品太复杂', count: 5, amount: 1495, percent: 15.6 },
  { reason: '客服问题', count: 3, amount: 897, percent: 9.4 },
  { reason: 'Bug太多', count: 2, amount: 598, percent: 6.3 },
  { reason: '其他', count: 2, amount: 598, percent: 6.3 },
];

const monthlyTrend = [
  { month: '1月', count: 5, amount: 1495 },
  { month: '2月', count: 4, amount: 1196 },
  { month: '3月', count: 7, amount: 2093 },
  { month: '4月', count: 3, amount: 897 },
  { month: '5月', count: 6, amount: 1794 },
  { month: '6月', count: 8, amount: 2392 },
  { month: '7月', count: 3, amount: 897 },
];

const planRefundData = [
  { plan: '免费版', count: 2, amount: 0 },
  { plan: '入门版', count: 15, amount: 1485 },
  { plan: '专业版', count: 12, amount: 3588 },
  { plan: '企业版', count: 3, amount: 2997 },
];

const reasonColors = [
  'bg-danger-500',
  'bg-warning-500',
  'bg-primary-500',
  'bg-success-500',
  'bg-accent-500',
  'bg-slate-400',
];

export default function AdminRefundStatsPage() {
  const maxCount = Math.max(...monthlyTrend.map((d) => d.count));
  const maxAmount = Math.max(...monthlyTrend.map((d) => d.amount));

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-slate-900">退款统计</h1>
            <p className="mt-2 text-slate-500">退款数据分析与趋势洞察</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/refunds" className="btn-secondary text-sm">
              返回列表
            </Link>
            <button className="btn-secondary text-sm flex items-center gap-2">
              <Download className="w-4 h-4" />
              导出报表
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">总退款单数</p>
              <div className="p-2 bg-danger-50 rounded-lg">
                <Shield className="w-5 h-5 text-danger-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">32</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-danger-600" />
              <span className="text-danger-600 font-medium">+12.5%</span>
              <span className="text-slate-400">较上月</span>
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">总退款金额</p>
              <div className="p-2 bg-warning-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-warning-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">¥9,568</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-warning-600" />
              <span className="text-warning-600 font-medium">+8.3%</span>
              <span className="text-slate-400">较上月</span>
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">退款率</p>
              <div className="p-2 bg-primary-50 rounded-lg">
                <PieChart className="w-5 h-5 text-primary-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">3.2%</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowDownRight className="w-4 h-4 text-success-600" />
              <span className="text-success-600 font-medium">-0.5%</span>
              <span className="text-slate-400">较上月</span>
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-slate-500">审核通过率</p>
              <div className="p-2 bg-success-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success-600" />
              </div>
            </div>
            <p className="font-display text-3xl font-bold text-slate-900">78.5%</p>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <ArrowUpRight className="w-4 h-4 text-success-600" />
              <span className="text-success-600 font-medium">+2.1%</span>
              <span className="text-slate-400">较上月</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <h2 className="font-display text-lg font-bold text-slate-900 mb-6">月度趋势</h2>
            <div className="h-64 flex items-end gap-4">
              {monthlyTrend.map((item, index) => {
                const countHeight = (item.count / maxCount) * 100;
                const amountHeight = (item.amount / maxAmount) * 100;
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end gap-1 h-48">
                      <div
                        className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-primary-500 cursor-pointer relative group"
                        style={{ height: `${countHeight}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {item.count} 单
                        </div>
                      </div>
                      <div
                        className="flex-1 bg-gradient-to-t from-accent-400 to-accent-300 rounded-t-lg transition-all duration-500 hover:from-accent-500 hover:to-accent-400 cursor-pointer relative group"
                        style={{ height: `${amountHeight}%` }}
                      >
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          ¥{item.amount}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{item.month}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-primary-500"></span>
                <span className="text-sm text-slate-600">退款单数</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-accent-400"></span>
                <span className="text-sm text-slate-600">退款金额</span>
              </div>
            </div>
          </div>

          <div className="card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
            <h2 className="font-display text-lg font-bold text-slate-900 mb-6">原因分布</h2>
            <div className="space-y-4">
              {byReasonData.map((item, index) => (
                <div key={item.reason}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-700">{item.reason}</span>
                    <span className="text-sm font-medium text-slate-900">{item.count} 单</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${reasonColors[index]} rounded-full transition-all duration-500`}
                      style={{ width: `${item.percent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-400">{item.percent.toFixed(1)}%</span>
                    <span className="text-xs text-slate-400">¥{item.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <h2 className="font-display text-lg font-bold text-slate-900 mb-6">各套餐退款情况</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">套餐</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">退款单数</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">退款金额</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">占比</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">趋势</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {planRefundData.map((item) => (
                  <tr key={item.plan} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{item.plan}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">{item.count}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">¥{item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm text-slate-600">
                        {((item.count / 32) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${(item.count / 15) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
