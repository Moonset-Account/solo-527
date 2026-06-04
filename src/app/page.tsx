'use client';

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Package,
  Calendar,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';

const mockStats = {
  totalDevices: 48,
  availableDevices: 32,
  activeBookings: 156,
  pendingApprovals: 23,
  activeMaintenance: 5,
  totalUsers: 312,
};

const bookingTrendData = [
  { month: '1月', bookings: 120 },
  { month: '2月', bookings: 150 },
  { month: '3月', bookings: 180 },
  { month: '4月', bookings: 165 },
  { month: '5月', bookings: 210 },
  { month: '6月', bookings: 245 },
];

const deviceStatusData = [
  { name: '可用', value: 32, color: '#0d9488' },
  { name: '使用中', value: 10, color: '#3b82f6' },
  { name: '维护中', value: 5, color: '#f59e0b' },
  { name: '故障', value: 1, color: '#ef4444' },
];

const recentBookings = [
  {
    id: '1',
    device: '扫描电子显微镜',
    user: '张三',
    startTime: '2024-06-05 09:00',
    endTime: '2024-06-05 12:00',
    status: 'APPROVED',
  },
  {
    id: '2',
    device: 'X射线衍射仪',
    user: '李四',
    startTime: '2024-06-05 14:00',
    endTime: '2024-06-05 17:00',
    status: 'PENDING_ADMIN',
  },
  {
    id: '3',
    device: '核磁共振仪',
    user: '王五',
    startTime: '2024-06-06 08:00',
    endTime: '2024-06-06 16:00',
    status: 'PENDING_MENTOR',
  },
];

const pendingApprovals = [
  {
    id: '1',
    student: '李四',
    device: 'X射线衍射仪',
    project: '纳米材料研究',
    time: '2024-06-05 14:00 - 17:00',
  },
  {
    id: '2',
    student: '赵六',
    device: '高效液相色谱',
    project: '药物分析实验',
    time: '2024-06-06 09:00 - 12:00',
  },
];

const statusColors: Record<string, string> = {
  APPROVED: 'success',
  PENDING_MENTOR: 'warning',
  PENDING_ADMIN: 'warning',
  REJECTED: 'destructive',
  CANCELLED: 'secondary',
};

const statusLabels: Record<string, string> = {
  APPROVED: '已批准',
  PENDING_MENTOR: '待导师确认',
  PENDING_ADMIN: '待管理员审核',
  REJECTED: '已拒绝',
  CANCELLED: '已取消',
};

export default function DashboardPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">仪表板</h1>
          <p className="text-slate-500 mt-1">实验室设备预约概览</p>
        </div>
        <Button asChild>
          <Link href="/bookings/new">
            <Plus className="w-4 h-4 mr-2" />
            新建预约
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">设备总数</p>
                <p className="text-3xl font-bold mt-1">{mockStats.totalDevices}</p>
                <p className="text-white/60 text-xs mt-2">
                  <span className="text-green-300">●</span> {mockStats.availableDevices} 台可用
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-500 to-secondary-700 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">本月预约</p>
                <p className="text-3xl font-bold mt-1">{mockStats.activeBookings}</p>
                <p className="text-white/60 text-xs mt-2">
                  <Clock className="w-3 h-3 inline mr-1" />
                  使用率 78%
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">待审批</p>
                <p className="text-3xl font-bold mt-1">{mockStats.pendingApprovals}</p>
                <p className="text-white/60 text-xs mt-2">
                  需要您的处理
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-500 to-red-600 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">维护中</p>
                <p className="text-3xl font-bold mt-1">{mockStats.activeMaintenance}</p>
                <p className="text-white/60 text-xs mt-2">
                  设备故障处理中
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>预约趋势</CardTitle>
                <CardDescription>近6个月预约数量统计</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedPeriod === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('week')}
                >
                  周
                </Button>
                <Button
                  variant={selectedPeriod === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('month')}
                >
                  月
                </Button>
                <Button
                  variant={selectedPeriod === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod('year')}
                >
                  年
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>设备状态</CardTitle>
            <CardDescription>当前设备状态分布</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {deviceStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-4 justify-center mt-4">
              {deviceStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>近期预约</CardTitle>
                <CardDescription>最近的预约申请记录</CardDescription>
              </div>
              <Link
                href="/bookings"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBookings.map((booking, index) => (
                <div
                  key={booking.id}
                  className={`flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors ${
                    index !== recentBookings.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">{booking.device}</div>
                    <div className="text-sm text-slate-500">
                      {booking.user} · {booking.startTime} - {booking.endTime.split(' ')[1]}
                    </div>
                  </div>
                  <Badge variant={statusColors[booking.status] as any}>
                    {statusLabels[booking.status]}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>待我审批</CardTitle>
                <CardDescription>需要您处理的审批申请</CardDescription>
              </div>
              <Link
                href="/approvals"
                className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
              >
                查看全部 <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingApprovals.map((approval, index) => (
                <div
                  key={approval.id}
                  className={`p-4 rounded-lg bg-amber-50 border border-amber-100 ${
                    index !== pendingApprovals.length - 1 ? 'mb-3' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-slate-800">
                        {approval.student} - {approval.device}
                      </div>
                      <div className="text-sm text-slate-500 mt-1">
                        课题: {approval.project}
                      </div>
                      <div className="text-sm text-slate-500">{approval.time}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                        通过
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                        驳回
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
