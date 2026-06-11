import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { concertApi, orderApi, refundApi, notificationApi, attendanceApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  LayoutDashboard,
  DollarSign,
  ShoppingCart,
  FileCheck,
  RefreshCw,
  Calendar,
  Users,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Eye,
  Bell,
  PieChart as PieChartIcon,
  BarChart3,
} from 'lucide-react';
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { cn, formatMoney, formatDateTime, getNotificationTypeText } from '@/lib/utils';
import type { Show, Notification, ShowStats } from '@/types';

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function AdminDashboard() {
  const navigate = useNavigate();

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-dashboard-orders'],
    queryFn: () => orderApi.list({ pageSize: 1000 }),
  });

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ['admin-dashboard-shows'],
    queryFn: () => concertApi.showList({ pageSize: 50 }),
  });

  const { data: refundsData, isLoading: refundsLoading } = useQuery({
    queryKey: ['admin-dashboard-refunds'],
    queryFn: () => refundApi.list({ pageSize: 1000 }),
  });

  const { data: verificationsData, isLoading: verificationsLoading } = useQuery({
    queryKey: ['admin-dashboard-verifications'],
    queryFn: () => orderApi.verifications({ status: 'pending', pageSize: 1000 }),
  });

  const { data: notificationsData, isLoading: notificationsLoading } = useQuery({
    queryKey: ['admin-dashboard-notifications'],
    queryFn: () => notificationApi.list({ status: 'unread', pageSize: 20, priority: 1 }),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['admin-dashboard-attendance'],
    queryFn: () => attendanceApi.stats({ days: 7 }),
  });

  const allOrders = ordersData?.list || ordersData || [];
  const shows: Show[] = showsData?.list || showsData || [];
  const refunds = refundsData?.list || refundsData || [];
  const pendingVerifications = verificationsData?.list || verificationsData || [];
  const notifications: Notification[] = notificationsData?.list || notificationsData || [];

  const totalRevenue = allOrders.reduce((sum: number, order: any) => {
    if (order.status === 'paid' || order.status === 'verified' || order.status === 'refunded') {
      return sum + parseFloat(order.payAmount || '0');
    }
    return sum;
  }, 0);

  const totalOrders = allOrders.length;
  const pendingCount = pendingVerifications.length;
  const refundProcessingCount = refunds.filter((r: any) =>
    ['pending', 'reviewing', 'approved'].includes(r.status)
  ).length;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day');
    return date.format('MM-DD');
  });

  const revenueData = last7Days.map((dayLabel, idx) => {
    const targetDate = dayjs().subtract(6 - idx, 'day').format('YYYY-MM-DD');
    const dayRevenue = allOrders.reduce((sum: number, order: any) => {
      if (order.status !== 'pending' && order.status !== 'cancelled') {
        const orderDate = dayjs(order.createdAt).format('YYYY-MM-DD');
        if (orderDate === targetDate) {
          return sum + parseFloat(order.payAmount || '0');
        }
      }
      return sum;
    }, 0);
    return {
      name: dayLabel,
      收入: Number(dayRevenue.toFixed(2)),
    };
  });

  const attendanceStats = (shows || []).map((show: Show) => {
    const totalSeats = show.zones?.reduce((sum, z) => sum + z.totalSeats, 0) || 0;
    const soldSeats = show.zones?.reduce((sum, z) => sum + z.soldSeats, 0) || 0;
    const rate = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0;
    return {
      name: show.concertTitle || `场次${show.id}`,
      value: rate,
    };
  }).filter(s => s.value > 0).slice(0, 6);

  const isLoading = ordersLoading || showsLoading || refundsLoading || verificationsLoading;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
    to,
  }: {
    icon: any;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
    to?: string;
  }) => (
    <div
      onClick={() => to && navigate({ to })}
      className={cn(
        'card p-5 transition-all',
        to && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-2 text-gray-800">{value}</p>
          {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center',
            color
          )}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary-600" />
            工作台
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            今日 {dayjs().format('YYYY年MM月DD日 dddd')}，数据更新于 {formatDateTime(new Date())}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
              <div className="h-8 bg-gray-100 rounded w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={DollarSign}
            label="总收入"
            value={formatMoney(totalRevenue)}
            subValue={`共 ${totalOrders} 笔有效订单`}
            color="bg-gradient-to-br from-emerald-500 to-emerald-600"
            to="/admin/orders"
          />
          <StatCard
            icon={ShoppingCart}
            label="订单总数"
            value={totalOrders}
            subValue={`已完成 ${allOrders.filter((o: any) => ['paid', 'verified', 'refunded'].includes(o.status)).length} 笔`}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
            to="/admin/orders"
          />
          <StatCard
            icon={FileCheck}
            label="待审核数"
            value={pendingCount}
            subValue={pendingCount > 0 ? `${pendingCount} 条待处理` : '全部已处理'}
            color="bg-gradient-to-br from-amber-500 to-amber-600"
            to="/admin/verifications"
          />
          <StatCard
            icon={RefreshCw}
            label="退票处理中"
            value={refundProcessingCount}
            subValue={`总退票 ${refunds.length} 笔`}
            color="bg-gradient-to-br from-rose-500 to-rose-600"
            to="/admin/refunds"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-gray-800">最近7天收入趋势</h3>
            </div>
            <span className="text-xs text-gray-400">单位：元</span>
          </div>
          <div className="p-5 h-72">
            {revenueData.every((d) => d.收入 === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BarChart3 className="w-12 h-12 mb-3 text-gray-200" />
                <p className="text-sm">暂无收入数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    formatter={(value: number) => [formatMoney(value), '收入']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="收入"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ fill: '#6366f1', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-gray-800">上座率分布</h3>
            </div>
          </div>
          <div className="p-5 h-72">
            {attendanceStats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <PieChartIcon className="w-12 h-12 mb-3 text-gray-200" />
                <p className="text-sm">暂无上座率数据</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, _name: string, props: any) => [
                      `${value}%`,
                      props.payload.name,
                    ]}
                  />
                  <Legend
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    formatter={(value: string) => (
                      <span className="text-xs text-gray-600">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary-600" />
              <h3 className="font-semibold text-gray-800">场次统计</h3>
            </div>
            <Link to="/admin/shows" className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            {showsLoading ? (
              <div className="p-8 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : shows.length === 0 ? (
              <div className="py-16 text-center">
                <Calendar className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-500">暂无场次</p>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>场次</th>
                    <th>日期</th>
                    <th>场馆</th>
                    <th>总座位</th>
                    <th>已售</th>
                    <th>上座率</th>
                    <th>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {shows.slice(0, 6).map((show) => {
                    const totalSeats = show.zones?.reduce((s, z) => s + z.totalSeats, 0) || 0;
                    const soldSeats = show.zones?.reduce((s, z) => s + z.soldSeats, 0) || 0;
                    const rate = totalSeats > 0 ? Math.round((soldSeats / totalSeats) * 100) : 0;
                    return (
                      <tr key={show.id}>
                        <td>
                          <div className="font-medium text-gray-800 line-clamp-1 max-w-48">
                            {show.concertTitle}
                          </div>
                        </td>
                        <td className="text-gray-600 whitespace-nowrap">
                          {dayjs(show.showDate).format('MM-DD')} {show.startTime}
                        </td>
                        <td className="text-gray-600 max-w-32">
                          <span className="line-clamp-1">{show.venueName}</span>
                        </td>
                        <td className="text-gray-800 font-medium">{totalSeats}</td>
                        <td className="text-gray-800 font-medium">{soldSeats}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  rate >= 80
                                    ? 'bg-emerald-500'
                                    : rate >= 50
                                    ? 'bg-blue-500'
                                    : rate >= 20
                                    ? 'bg-amber-500'
                                    : 'bg-gray-400'
                                )}
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600 w-10">{rate}%</span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={cn(
                              'badge',
                              show.status === 'on_sale'
                                ? 'bg-green-100 text-green-700'
                                : show.status === 'upcoming'
                                ? 'bg-blue-100 text-blue-700'
                                : show.status === 'ended'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-red-100 text-red-700'
                            )}
                          >
                            {show.status === 'on_sale'
                              ? '售票中'
                              : show.status === 'upcoming'
                              ? '即将开售'
                              : show.status === 'ended'
                              ? '已结束'
                              : '已取消'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-semibold text-gray-800">近期异常提醒</h3>
            </div>
            <Link
              to="/admin/notifications"
              className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {notificationsLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-12 bg-gray-50 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-16 text-center">
                <Bell className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                <p className="text-sm text-gray-500">暂无异常提醒</p>
                <p className="text-xs text-gray-400 mt-1">一切运行正常</p>
              </div>
            ) : (
              notifications.slice(0, 8).map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => navigate({ to: '/admin/notifications' })}
                  className="px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                        notif.type === 'refund_abnormal'
                          ? 'bg-rose-50 text-rose-600'
                          : notif.type === 'inventory_warning'
                          ? 'bg-amber-50 text-amber-600'
                          : notif.type === 'verification_alert'
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-purple-50 text-purple-600'
                      )}
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="badge bg-gray-100 text-gray-600">
                          {getNotificationTypeText(notif.type)}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDateTime(notif.triggeredAt)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-1">
                        {notif.title}
                      </p>
                      {notif.content && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{notif.content}</p>
                      )}
                    </div>
                    <Eye className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
