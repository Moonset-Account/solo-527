'use client';

import { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Search,
  Calendar,
  ChevronRight,
  Wrench,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import AppLayout from '@/components/layout/AppLayout';
import { formatDate, getStatusColor, getStatusText } from '@/lib/utils';
import { differenceInHours, parseISO } from 'date-fns';

const mockDeliveries = [
  {
    id: '1',
    orderNo: 'AP20240621001',
    customerName: '张三',
    plateNumber: '京A12345',
    vehicleModel: '宝马530Li',
    repairType: '大保养',
    status: 'in_progress',
    estimatedDelivery: '2024-06-22 18:00',
    progress: 60,
    currentStep: '维修施工',
    technician: '李师傅',
    createdAt: '2024-06-21 09:30',
  },
  {
    id: '2',
    orderNo: 'AP20240621002',
    customerName: '李四',
    plateNumber: '京B67890',
    vehicleModel: '奔驰E300L',
    repairType: '常规保养',
    status: 'quality_check',
    estimatedDelivery: '2024-06-21 17:00',
    progress: 90,
    currentStep: '质量检验',
    technician: '王师傅',
    createdAt: '2024-06-21 10:15',
  },
  {
    id: '3',
    orderNo: 'AP20240620003',
    customerName: '王五',
    plateNumber: '京C11111',
    vehicleModel: '奥迪A6L',
    repairType: '刹车系统维修',
    status: 'pending',
    estimatedDelivery: '2024-06-23 12:00',
    progress: 10,
    currentStep: '等待配件',
    technician: null,
    createdAt: '2024-06-20 16:45',
  },
  {
    id: '4',
    orderNo: 'AP20240621003',
    customerName: '赵六',
    plateNumber: '京D22222',
    vehicleModel: '丰田凯美瑞',
    repairType: '空调维修',
    status: 'in_progress',
    estimatedDelivery: '2024-06-21 19:00',
    progress: 45,
    currentStep: '配件安装',
    technician: '张师傅',
    createdAt: '2024-06-21 08:00',
  },
  {
    id: '5',
    orderNo: 'AP20240620004',
    customerName: '钱七',
    plateNumber: '京E33333',
    vehicleModel: '本田雅阁',
    repairType: '发动机检修',
    status: 'completed',
    estimatedDelivery: '2024-06-21 15:00',
    actualDelivery: '2024-06-21 14:30',
    progress: 100,
    currentStep: '已交付',
    technician: '李师傅',
    createdAt: '2024-06-19 11:30',
  },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'quality_check', label: '质检中' },
  { value: 'completed', label: '已完成' },
];

function getUrgencyStatus(estimatedDelivery: string, status: string) {
  if (status === 'completed') return { label: '已完成', variant: 'success' as const, icon: CheckCircle2 };
  
  const now = new Date();
  const delivery = new Date(estimatedDelivery);
  const diffHours = differenceInHours(delivery, now);
  
  if (diffHours < 0) return { label: '已逾期', variant: 'danger' as const, icon: AlertTriangle };
  if (diffHours <= 24) return { label: '即将交付', variant: 'warning' as const, icon: Clock };
  return { label: '正常', variant: 'secondary' as const, icon: Calendar };
}

export default function DeliveryPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');

  const filteredDeliveries = mockDeliveries.filter((order) => {
    const matchesSearch = !search ||
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.includes(search) ||
      order.plateNumber.includes(search);
    const matchesStatus = !status || order.status === status;
    
    const urgency = getUrgencyStatus(order.estimatedDelivery, order.status);
    const matchesUrgency = !urgencyFilter || urgency.variant === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const urgentCount = mockDeliveries.filter(
    (o) => o.status !== 'completed' && differenceInHours(new Date(o.estimatedDelivery), new Date()) <= 24
  ).length;

  const overdueCount = mockDeliveries.filter(
    (o) => o.status !== 'completed' && differenceInHours(new Date(o.estimatedDelivery), new Date()) < 0
  ).length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-metal-900">{mockDeliveries.length}</p>
                  <p className="text-sm text-metal-600">全部订单</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{urgentCount}</p>
                  <p className="text-sm text-metal-600">24小时内交付</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
                  <p className="text-sm text-metal-600">已逾期</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {mockDeliveries.filter((o) => o.status === 'completed').length}
                  </p>
                  <p className="text-sm text-metal-600">已交付</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>交付日期追踪</CardTitle>
              <div className="flex gap-2">
                <Badge
                  variant="secondary"
                  className="cursor-pointer hover:bg-metal-200"
                  onClick={() => setUrgencyFilter('')}
                >
                  全部
                </Badge>
                <Badge
                  variant="warning"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setUrgencyFilter(urgencyFilter === 'warning' ? '' : 'warning')}
                >
                  即将交付
                </Badge>
                <Badge
                  variant="danger"
                  className="cursor-pointer hover:opacity-80"
                  onClick={() => setUrgencyFilter(urgencyFilter === 'danger' ? '' : 'danger')}
                >
                  已逾期
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="搜索订单号、客户、车牌号..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={statusOptions}
                className="w-40"
              />
            </div>

            <div className="space-y-4">
              {filteredDeliveries.map((order) => {
                const urgency = getUrgencyStatus(order.estimatedDelivery, order.status);
                const UrgencyIcon = urgency.icon;
                
                return (
                  <div
                    key={order.id}
                    className="p-4 bg-white border border-metal-200 rounded-xl hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-metal-900">{order.orderNo}</span>
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusText(order.status)}
                          </Badge>
                          <Badge variant={urgency.variant} className="flex items-center gap-1">
                            <UrgencyIcon className="w-3 h-3" />
                            {urgency.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-metal-600 mb-2">
                          {order.customerName} · {order.plateNumber} · {order.vehicleModel}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-metal-500">
                          <span className="flex items-center gap-1">
                            <Wrench className="w-3 h-3" />
                            {order.repairType}
                          </span>
                          <span>{order.technician || '未分配技师'}</span>
                        </div>
                      </div>

                      <div className="flex-1 md:max-w-xs">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-metal-600">{order.currentStep}</span>
                          <span className="font-medium text-metal-900">{order.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-metal-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              order.status === 'completed'
                                ? 'bg-green-500'
                                : order.status === 'quality_check'
                                ? 'bg-purple-500'
                                : 'bg-primary-500'
                            }`}
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6">
                        <div className="text-right">
                          <p className="text-xs text-metal-500">预计交付</p>
                          <p className={`font-medium ${
                            urgency.variant === 'danger'
                              ? 'text-red-600'
                              : urgency.variant === 'warning'
                              ? 'text-yellow-600'
                              : 'text-metal-900'
                          }`}>
                            {formatDate(order.estimatedDelivery)}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-metal-300 group-hover:text-primary-500 transition-colors" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredDeliveries.length === 0 && (
              <div className="text-center py-12 text-metal-400">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无匹配的交付记录</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
