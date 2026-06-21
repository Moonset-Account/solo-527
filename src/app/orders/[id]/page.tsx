'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Car,
  FileText,
  Package,
  Wrench,
  Clock,
  CheckCircle2,
  Circle,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Phone,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import AppLayout from '@/components/layout/AppLayout';
import { formatDate, formatCurrency, getStatusColor, getStatusText } from '@/lib/utils';

interface ProcessItem {
  id: string;
  step: number;
  name: string;
  description: string | null;
  status: string;
  technicianId: string | null;
  startedAt: string | null;
  completedAt: string | null;
  technician: { name: string } | null;
}

interface OrderItem {
  id: string;
  type: string;
  name: string;
  partId: string | null;
  quantity: number;
  unitPrice: number;
  amount: number;
}

interface QualityCheckItem {
  id: string;
  result: string;
  checkedAt: string;
  inspector: { name: string };
  failedItems: { item: string; impact: string; action: string; nextStep: string }[];
}

interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  repairType: string;
  faultDescription: string;
  estimatedDelivery: string;
  actualDelivery: string | null;
  totalAmount: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string };
  vehicle: { id: string; plateNumber: string; brand: string; model: string; year: number; color: string };
  technician: { name: string } | null;
  creator: { name: string };
  items: OrderItem[];
  processes: ProcessItem[];
  qualityChecks: QualityCheckItem[];
}

const mockOrderDetail: OrderDetail = {
  id: '1',
  orderNo: 'AP20240621001',
  status: 'in_progress',
  repairType: '大保养',
  faultDescription: '客户反映发动机怠速抖动，空调制冷效果差，已行驶6万公里需做大保养',
  estimatedDelivery: '2024-06-22T18:00:00',
  actualDelivery: null,
  totalAmount: 2850,
  createdAt: '2024-06-21T09:30:00',
  customer: { id: '1', name: '张三', phone: '13800138001' },
  vehicle: { id: '1', plateNumber: '京A12345', brand: '宝马', model: '530Li', year: 2020, color: '白色' },
  technician: { name: '李师傅' },
  creator: { name: '前台小王' },
  items: [
    { id: '1', type: 'part', name: '机油滤清器', partId: '1', quantity: 1, unitPrice: 85, amount: 85 },
    { id: '2', type: 'part', name: '空气滤芯', partId: '2', quantity: 1, unitPrice: 120, amount: 120 },
    { id: '3', type: 'part', name: '空调滤芯', partId: '3', quantity: 1, unitPrice: 95, amount: 95 },
    { id: '4', type: 'part', name: '火花塞', partId: '4', quantity: 4, unitPrice: 180, amount: 720 },
    { id: '5', type: 'part', name: '全合成机油', partId: '6', quantity: 1, unitPrice: 480, amount: 480 },
    { id: '6', type: 'service', name: '更换机油工时', partId: null, quantity: 1, unitPrice: 150, amount: 150 },
    { id: '7', type: 'service', name: '更换刹车片工时', partId: null, quantity: 1, unitPrice: 200, amount: 200 },
    { id: '8', type: 'service', name: '常规检查', partId: null, quantity: 1, unitPrice: 80, amount: 80 },
    { id: '9', type: 'service', name: '空调清洗', partId: null, quantity: 1, unitPrice: 180, amount: 180 },
  ],
  processes: [
    { id: 'p1', step: 1, name: '车辆预检', description: '车辆外观、里程、油液检查', status: 'completed', technicianId: '2', startedAt: '2024-06-21T09:45:00', completedAt: '2024-06-21T10:15:00', technician: { name: '李师傅' } },
    { id: 'p2', step: 2, name: '配件准备', description: '根据工单准备所需配件', status: 'completed', technicianId: '3', startedAt: '2024-06-21T10:20:00', completedAt: '2024-06-21T10:40:00', technician: { name: '库管老赵' } },
    { id: 'p3', step: 3, name: '维修施工', description: '按工艺要求进行维修作业', status: 'in_progress', technicianId: '2', startedAt: '2024-06-21T10:45:00', completedAt: null, technician: { name: '李师傅' } },
    { id: 'p4', step: 4, name: '内部质检', description: '维修项目自检互检', status: 'pending', technicianId: null, startedAt: null, completedAt: null, technician: null },
    { id: 'p5', step: 5, name: '终检交付', description: '最终质检合格后交付客户', status: 'pending', technicianId: null, startedAt: null, completedAt: null, technician: null },
  ],
  qualityChecks: [],
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const res = await fetch(`/api/orders/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setOrder(mockOrderDetail);
        }
      } catch {
        setOrder(mockOrderDetail);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [params.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      </AppLayout>
    );
  }

  if (!order) {
    return (
      <AppLayout>
        <div className="text-center py-12 text-metal-500">订单不存在</div>
      </AppLayout>
    );
  }

  const partItems = order.items.filter((i) => i.type === 'part');
  const serviceItems = order.items.filter((i) => i.type === 'service');

  const getProcessIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />;
      default:
        return <Circle className="w-5 h-5 text-metal-300" />;
    }
  };

  const getProcessLineColor = (status: string, nextStatus: string | undefined) => {
    if (status === 'completed') return 'bg-green-500';
    if (status === 'in_progress') return 'bg-primary-300';
    return 'bg-metal-200';
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/orders')}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              返回列表
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-metal-900">{order.orderNo}</h1>
              <p className="text-sm text-metal-500">创建于 {formatDate(order.createdAt)}</p>
            </div>
          </div>
          <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
            {getStatusText(order.status)}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary-500" />
                  工艺工序
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {order.processes.map((process, idx) => (
                    <div key={process.id} className="flex gap-4 pb-6 last:pb-0">
                      <div className="flex flex-col items-center">
                        {getProcessIcon(process.status)}
                        {idx < order.processes.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-1 ${getProcessLineColor(process.status, order.processes[idx + 1]?.status)}`} />
                        )}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-metal-900">{process.name}</span>
                              <Badge
                                variant={
                                  process.status === 'completed' ? 'success' :
                                  process.status === 'in_progress' ? 'info' : 'secondary'
                                }
                              >
                                {process.status === 'completed' ? '已完成' :
                                 process.status === 'in_progress' ? '进行中' : '待处理'}
                              </Badge>
                            </div>
                            {process.description && (
                              <p className="text-sm text-metal-500 mt-1">{process.description}</p>
                            )}
                          </div>
                          <div className="text-right text-sm">
                            {process.technician && (
                              <p className="text-metal-600">{process.technician.name}</p>
                            )}
                            {process.startedAt && (
                              <p className="text-metal-400">{formatDate(process.startedAt)}</p>
                            )}
                            {process.completedAt && (
                              <p className="text-green-600">完成于 {formatDate(process.completedAt)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary-500" />
                  项目明细
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {partItems.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-metal-600 mb-2">配件</p>
                    <div className="space-y-2">
                      {partItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-metal-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="info">配件</Badge>
                            <span className="font-medium text-metal-900">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-metal-500">¥{item.unitPrice} × {item.quantity}</span>
                            <span className="font-semibold text-metal-900">¥{item.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {serviceItems.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-metal-600 mb-2">服务</p>
                    <div className="space-y-2">
                      {serviceItems.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-metal-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">服务</Badge>
                            <span className="font-medium text-metal-900">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-metal-500">¥{item.unitPrice} × {item.quantity}</span>
                            <span className="font-semibold text-metal-900">¥{item.amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-metal-200 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-metal-500">合计金额</p>
                    <p className="text-2xl font-bold text-primary-600">¥{order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.qualityChecks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    质检记录
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.qualityChecks.map((qc) => (
                    <div key={qc.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={qc.result === 'pass' ? 'success' : 'danger'}>
                          {qc.result === 'pass' ? '合格' : '不合格'}
                        </Badge>
                        <span className="text-sm text-metal-500">
                          {qc.inspector.name} · {formatDate(qc.checkedAt)}
                        </span>
                      </div>
                      {qc.failedItems.length > 0 && (
                        <div className="mt-3 space-y-3">
                          {qc.failedItems.map((fi, idx) => (
                            <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <p className="font-medium text-red-800">{fi.item}</p>
                              <div className="mt-2 space-y-1 text-sm">
                                <p><span className="text-red-600">影响范围：</span>{fi.impact}</p>
                                <p><span className="text-amber-600">处理动作：</span>{fi.action}</p>
                                <p><span className="text-blue-600">下一步：</span>{fi.nextStep}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  客户信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-metal-900">{order.customer.name}</p>
                    <div className="flex items-center gap-1 text-sm text-metal-500">
                      <Phone className="w-3 h-3" />
                      {order.customer.phone}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-primary-500" />
                  车辆信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">车牌号</span>
                  <span className="font-medium text-metal-900">{order.vehicle.plateNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">品牌车型</span>
                  <span className="font-medium text-metal-900">{order.vehicle.brand} {order.vehicle.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">年份</span>
                  <span className="font-medium text-metal-900">{order.vehicle.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">颜色</span>
                  <span className="font-medium text-metal-900">{order.vehicle.color}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-500" />
                  维修需求
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">维修类型</span>
                  <span className="font-medium text-metal-900">{order.repairType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">故障描述</span>
                </div>
                <p className="text-sm text-metal-700 bg-metal-50 p-3 rounded-lg">{order.faultDescription}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">负责技师</span>
                  <span className="font-medium text-metal-900">{order.technician?.name || '未分配'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  交付信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">预计交付</span>
                  <span className="font-medium text-metal-900 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(order.estimatedDelivery)}
                  </span>
                </div>
                {order.actualDelivery && (
                  <div className="flex justify-between text-sm">
                    <span className="text-metal-500">实际交付</span>
                    <span className="font-medium text-green-600">{formatDate(order.actualDelivery)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">创建人</span>
                  <span className="text-metal-700">{order.creator.name}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
