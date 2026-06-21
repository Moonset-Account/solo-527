'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Wrench,
  Eye,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import AppLayout from '@/components/layout/AppLayout';
import { formatDate, formatCurrency, getStatusColor, getStatusText } from '@/lib/utils';

interface OrderRow {
  id: string;
  orderNo: string;
  status: string;
  repairType: string;
  totalAmount: number;
  estimatedDelivery: string;
  createdAt: string;
  customer: { name: string; phone: string };
  vehicle: { plateNumber: string; brand: string; model: string };
  technician: { name: string } | null;
  _count: { items: number };
}

const mockOrders: OrderRow[] = [
  {
    id: '1', orderNo: 'AP20240621001', status: 'in_progress',
    repairType: '大保养', totalAmount: 2850,
    estimatedDelivery: '2024-06-22T18:00:00', createdAt: '2024-06-21T09:30:00',
    customer: { name: '张三', phone: '13800138001' },
    vehicle: { plateNumber: '京A12345', brand: '宝马', model: '530Li' },
    technician: { name: '李师傅' }, _count: { items: 5 },
  },
  {
    id: '2', orderNo: 'AP20240621002', status: 'quality_check',
    repairType: '常规保养', totalAmount: 1580,
    estimatedDelivery: '2024-06-21T17:00:00', createdAt: '2024-06-21T10:15:00',
    customer: { name: '李四', phone: '13800138002' },
    vehicle: { plateNumber: '京B67890', brand: '奔驰', model: 'E300L' },
    technician: { name: '王师傅' }, _count: { items: 3 },
  },
  {
    id: '3', orderNo: 'AP20240620003', status: 'pending',
    repairType: '刹车系统维修', totalAmount: 3200,
    estimatedDelivery: '2024-06-23T12:00:00', createdAt: '2024-06-20T16:45:00',
    customer: { name: '王五', phone: '13800138003' },
    vehicle: { plateNumber: '京C11111', brand: '奥迪', model: 'A6L' },
    technician: null, _count: { items: 2 },
  },
  {
    id: '4', orderNo: 'AP20240620002', status: 'completed',
    repairType: '空调维修', totalAmount: 880,
    estimatedDelivery: '2024-06-20T15:00:00', createdAt: '2024-06-20T09:00:00',
    customer: { name: '赵六', phone: '13800138004' },
    vehicle: { plateNumber: '京D22222', brand: '丰田', model: '凯美瑞' },
    technician: { name: '张师傅' }, _count: { items: 1 },
  },
  {
    id: '5', orderNo: 'AP20240619001', status: 'completed',
    repairType: '发动机检修', totalAmount: 4500,
    estimatedDelivery: '2024-06-20T18:00:00', createdAt: '2024-06-19T11:30:00',
    customer: { name: '钱七', phone: '13800138005' },
    vehicle: { plateNumber: '京E33333', brand: '本田', model: '雅阁' },
    technician: { name: '李师傅' }, _count: { items: 4 },
  },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'in_progress', label: '进行中' },
  { value: 'quality_check', label: '质检中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function OrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<OrderRow[]>(mockOrders);
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  useEffect(() => {
    async function fetchOrders() {
      try {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (search) params.set('search', search);
        const res = await fetch(`/api/orders?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [search, status]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = !search ||
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.customer.name.includes(search) ||
      order.vehicle.plateNumber.includes(search) ||
      order.vehicle.brand.includes(search) ||
      order.vehicle.model.includes(search);
    const matchesStatus = !status || order.status === status;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / pageSize);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>订单列表</CardTitle>
              <Button onClick={() => router.push('/orders/new')}>
                <Plus className="w-4 h-4 mr-2" />
                新建订单
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="搜索订单号、客户、车牌号、车型..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={statusOptions}
                  className="w-40"
                />
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-metal-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>客户/车辆</TableHead>
                    <TableHead>维修类型</TableHead>
                    <TableHead>技师</TableHead>
                    <TableHead>金额</TableHead>
                    <TableHead>预计交付</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
                      </TableCell>
                    </TableRow>
                  ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                      <TableCell>
                        <div className="font-medium text-metal-900">{order.orderNo}</div>
                        <div className="text-xs text-metal-500">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-metal-900">{order.customer.name}</div>
                        <div className="text-xs text-metal-500">
                          {order.vehicle.plateNumber} · {order.vehicle.brand} {order.vehicle.model}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-metal-400" />
                          <span className="text-metal-700">{order.repairType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.technician?.name ? (
                          <span className="text-metal-700">{order.technician.name}</span>
                        ) : (
                          <span className="text-metal-400 text-sm">未分配</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-metal-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-metal-400" />
                          <span className="text-metal-700 text-sm">{formatDate(order.estimatedDelivery)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/orders/${order.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-metal-500">
                共 {filteredOrders.length} 条记录
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-metal-600 px-2">
                  {currentPage} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
