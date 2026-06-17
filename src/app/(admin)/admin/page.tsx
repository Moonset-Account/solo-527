'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  Calendar,
  DollarSign,
  AlertTriangle,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Clock,
  Wrench,
  Car,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { mockDashboardStats, mockAppointments, mockStations, mockTechnicians } from '@/lib/mockData';
import { formatCurrency, formatDateTime, getStatusLabel, getStatusColor } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export default function AdminDashboardPage() {
  const { setCurrentPageTitle } = useUIStore();

  useEffect(() => {
    setCurrentPageTitle('仪表盘');
  }, [setCurrentPageTitle]);

  const stats = [
    {
      title: '今日预约',
      value: mockDashboardStats.today_appointments,
      icon: Calendar,
      trend: '+12%',
      trendUp: true,
      color: 'primary',
    },
    {
      title: '今日营收',
      value: formatCurrency(mockDashboardStats.today_revenue),
      icon: DollarSign,
      trend: '+8.5%',
      trendUp: true,
      color: 'success',
    },
    {
      title: '待处理返修',
      value: mockDashboardStats.pending_repairs,
      icon: AlertTriangle,
      trend: '-2',
      trendUp: false,
      color: 'warning',
    },
    {
      title: '会员总数',
      value: mockDashboardStats.total_members,
      icon: Users,
      trend: '+15',
      trendUp: true,
      color: 'secondary',
    },
  ];

  const stationStatusMap: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    available: { label: '空闲', color: 'success', icon: CheckCircle },
    occupied: { label: '使用中', color: 'warning', icon: AlertCircle },
    maintenance: { label: '维护中', color: 'danger', icon: XCircle },
  };

  const todayAppointments = mockAppointments.slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            primary: 'bg-primary-50 text-primary-600',
            success: 'bg-success-50 text-success-600',
            warning: 'bg-amber-50 text-amber-600',
            secondary: 'bg-purple-50 text-purple-600',
          };

          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-dark-500 mb-1">{stat.title}</p>
                    <p className="text-3xl font-bold text-dark-900 font-display">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-sm">
                  {stat.trendUp ? (
                    <TrendingUp className="h-4 w-4 text-success-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-danger-600" />
                  )}
                  <span className={stat.trendUp ? 'text-success-600' : 'text-danger-600'}>
                    {stat.trend}
                  </span>
                  <span className="text-dark-400">较昨日</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 工位状态 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">工位状态</CardTitle>
            <Link href="/admin/technicians" className="text-sm text-primary-600 hover:text-primary-700">
              查看全部
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockStations.map((station) => {
                const statusInfo = stationStatusMap[station.status] || stationStatusMap.available;
                const StatusIcon = statusInfo.icon;
                return (
                  <div
                    key={station.id}
                    className="flex items-center justify-between p-3 bg-dark-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-dark-200 flex items-center justify-center">
                        <Car className="h-5 w-5 text-dark-500" />
                      </div>
                      <div>
                        <div className="font-medium text-dark-900 text-sm">{station.name}</div>
                        <div className="text-xs text-dark-500">{station.type}</div>
                      </div>
                    </div>
                    <Badge variant={statusInfo.color === 'warning' ? 'warning' : statusInfo.color === 'danger' ? 'danger' : 'success'} size="sm">
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 今日预约 */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">今日预约</CardTitle>
            <Link href="/admin/appointments" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              查看全部
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>客户</TableHead>
                  <TableHead>车牌</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>技师</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <div className="font-medium text-dark-900">{apt.customer_name}</div>
                      <div className="text-xs text-dark-500">{apt.customer_phone}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{apt.car_plate}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-dark-600">
                        {formatDateTime(apt.appointment_time)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {apt.technician?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(apt.status)} size="sm">
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/orders/${apt.id}`}>
                        <Button variant="ghost" size="sm">
                          详情
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Calendar, label: '新建预约', href: '/booking', color: 'primary' },
          { icon: Wrench, label: '检测模板', href: '/admin/templates', color: 'success' },
          { icon: DollarSign, label: '收银开单', href: '/admin/invoices', color: 'warning' },
          { icon: Users, label: '会员管理', href: '/admin/members', color: 'secondary' },
        ].map((item, index) => {
          const Icon = item.icon;
          const colorClasses = {
            primary: 'from-primary-500 to-primary-600',
            success: 'from-success-500 to-success-600',
            warning: 'from-amber-500 to-amber-600',
            secondary: 'from-purple-500 to-purple-600',
          };
          return (
            <Link key={index} href={item.href}>
              <Card hoverable className="h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[item.color as keyof typeof colorClasses]}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-dark-900">{item.label}</div>
                    <div className="text-xs text-dark-500">点击进入</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
