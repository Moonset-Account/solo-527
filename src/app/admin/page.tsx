'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/ui/StatCard';
import {
  Users,
  CreditCard,
  TrendingUp,
  DollarSign,
  Package,
  RefreshCw,
  Shield,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const stats = [
    { title: '总用户数', value: '1,256', icon: <Users className="w-6 h-6" />, trend: { value: '+12.5%', positive: true }, subtitle: '较上月' },
    { title: '活跃订阅', value: '892', icon: <CreditCard className="w-6 h-6" />, trend: { value: '+8.3%', positive: true }, subtitle: '较上月' },
    { title: '月收入', value: '¥267,600', icon: <DollarSign className="w-6 h-6" />, trend: { value: '+15.2%', positive: true }, subtitle: '较上月' },
    { title: '试用用户', value: '156', icon: <RefreshCw className="w-6 h-6" />, trend: { value: '+5.8%', positive: true }, subtitle: '较上月' },
  ];

  const recentOrders = [
    { id: 'sub_010', user: '李明', plan: '专业版', amount: 299, status: 'ACTIVE', date: '2小时前' },
    { id: 'sub_009', user: '王芳', plan: '入门版', amount: 99, status: 'TRIALING', date: '3小时前' },
    { id: 'sub_008', user: '张伟', plan: '企业版', amount: 999, status: 'ACTIVE', date: '5小时前' },
    { id: 'sub_007', user: '刘洋', plan: '专业版', amount: 299, status: 'PAST_DUE', date: '昨天' },
    { id: 'sub_006', user: '陈静', plan: '入门版', amount: 99, status: 'CANCELED', date: '昨天' },
  ];

  const recentRefunds = [
    { id: 'ref_010', user: '周杰', amount: 299, reason: '价格太高', status: 'PENDING', date: '1小时前' },
    { id: 'ref_009', user: '吴敏', amount: 99, reason: '缺少功能', status: 'PENDING', date: '3小时前' },
  ];

  const conversionData = [
    { day: '周一', visitors: 120, conversions: 15 },
    { day: '周二', visitors: 150, conversions: 18 },
    { day: '周三', visitors: 100, conversions: 12 },
    { day: '周四', visitors: 180, conversions: 22 },
    { day: '周五', visitors: 200, conversions: 25 },
    { day: '周六', visitors: 90, conversions: 10 },
    { day: '周日', visitors: 80, conversions: 8 },
  ];

  const maxVisitors = Math.max(...conversionData.map((d) => d.visitors));

  return (
    <AdminLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-slate-900">数据概览</h1>
          <p className="mt-2 text-slate-500">欢迎回来，这是您的运营数据看板</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={stat.title} className="animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                trend={stat.trend}
                subtitle={stat.subtitle}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold text-slate-900">转化漏斗</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-primary-500"></span>
                  访客
                </span>
                <span className="flex items-center gap-1 text-slate-500">
                  <span className="w-3 h-3 rounded-full bg-accent-500"></span>
                  转化
                </span>
              </div>
            </div>
            <div className="h-64 flex items-end gap-4">
              {conversionData.map((item) => {
                const visitorHeight = (item.visitors / maxVisitors) * 100;
                const conversionHeight = (item.conversions / (maxVisitors * 0.2)) * 100;
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full flex items-end gap-1 h-48">
                      <div
                        className="flex-1 bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-lg transition-all duration-500 hover:from-primary-600 hover:to-primary-500"
                        style={{ height: `${visitorHeight}%` }}
                        title={`访客: ${item.visitors}`}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-accent-500 to-accent-400 rounded-t-lg transition-all duration-500 hover:from-accent-600 hover:to-accent-500"
                        style={{ height: `${conversionHeight}%` }}
                        title={`转化: ${item.conversions}`}
                      ></div>
                    </div>
                    <span className="text-xs text-slate-500">{item.day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
              <div>
                <p className="text-sm text-slate-500">总访客数</p>
                <p className="font-display text-xl font-bold text-slate-900">920</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">总转化数</p>
                <p className="font-display text-xl font-bold text-slate-900">110</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">转化率</p>
                <p className="font-display text-xl font-bold text-success-600">11.9%</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6 animate-slide-up" style={{ animationDelay: '250ms' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">待处理退款</h3>
                <Link href="/admin/refunds" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  查看全部
                </Link>
              </div>
              <div className="space-y-3">
                {recentRefunds.map((refund) => (
                  <div key={refund.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-danger-100 flex items-center justify-center">
                        <Shield className="w-4 h-4 text-danger-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{refund.user}</p>
                        <p className="text-xs text-slate-500">¥{refund.amount}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 bg-warning-100 text-warning-700 rounded-full font-medium">
                      待审核
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
              <h3 className="font-semibold text-slate-900 mb-4">快速操作</h3>
              <div className="grid grid-cols-2 gap-3">
                <Link href="/admin/plans" className="flex flex-col items-center gap-2 p-4 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors group">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                    <Package className="w-5 h-5 text-primary-600" />
                  </div>
                  <span className="text-sm font-medium text-primary-700">套餐管理</span>
                </Link>
                <Link href="/admin/trials" className="flex flex-col items-center gap-2 p-4 bg-accent-50 rounded-xl hover:bg-accent-100 transition-colors group">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                    <Clock className="w-5 h-5 text-accent-600" />
                  </div>
                  <span className="text-sm font-medium text-accent-700">试用管理</span>
                </Link>
                <Link href="/admin/refunds" className="flex flex-col items-center gap-2 p-4 bg-danger-50 rounded-xl hover:bg-danger-100 transition-colors group">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                    <Shield className="w-5 h-5 text-danger-600" />
                  </div>
                  <span className="text-sm font-medium text-danger-700">退款审核</span>
                </Link>
                <Link href="/admin/changes" className="flex flex-col items-center gap-2 p-4 bg-success-50 rounded-xl hover:bg-success-100 transition-colors group">
                  <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow transition-shadow">
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  </div>
                  <span className="text-sm font-medium text-success-700">变更记录</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6 animate-slide-up" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-bold text-slate-900">最近订阅</h2>
            <Link href="/admin/seats" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              查看全部
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">用户</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">套餐</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">金额</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">状态</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-medium">
                          {order.user.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{order.user}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-700">{order.plan}</td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-900">¥{order.amount}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${
                        order.status === 'ACTIVE' ? 'bg-success-50 text-success-600' :
                        order.status === 'TRIALING' ? 'bg-warning-50 text-warning-600' :
                        order.status === 'PAST_DUE' ? 'bg-danger-50 text-danger-600' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          order.status === 'ACTIVE' ? 'bg-success-500' :
                          order.status === 'TRIALING' ? 'bg-warning-500' :
                          order.status === 'PAST_DUE' ? 'bg-danger-500' :
                          'bg-slate-400'
                        }`}></span>
                        {order.status === 'ACTIVE' ? '活跃' :
                         order.status === 'TRIALING' ? '试用' :
                         order.status === 'PAST_DUE' ? '逾期' : '已取消'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-slate-500">{order.date}</td>
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
