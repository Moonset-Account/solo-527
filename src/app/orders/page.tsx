'use client';

import { useState } from 'react';
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

const mockOrders = [
  {
    id: '1',
    orderNo: 'AP20240621001',
    status: 'in_progress',
    customerName: '张三',
    customerPhone: '13800138001',
    plateNumber: '京A12345',
    vehicleBrand: '宝马',
    vehicleModel: '530Li',
    repairType: '大保养',
    totalAmount: 2850,
    technicianName: '李师傅',
    estimatedDelivery: '2024-06-22 18:00',
    createdAt: '2024-06-21 09:30',
  },
  {
    id: '2',
    orderNo: 'AP20240621002',
    status: 'quality_check',
    customerName: '李四',
    customerPhone: '13800138002',
    plateNumber: '京B67890',
    vehicleBrand: '奔驰',
    vehicleModel: 'E300L',
    repairType: '常规保养',
    totalAmount: 1580,
    technicianName: '王师傅',
    estimatedDelivery: '2024-06-21 17:00',
    createdAt: '2024-06-21 10:15',
  },
  {
    id: '3',
    orderNo: 'AP20240620003',
    status: 'pending',
    customerName: '王五',
    customerPhone: '13800138003',
    plateNumber: '京C11111',
    vehicleBrand: '奥迪',
    vehicleModel: 'A6L',
    repairType: '刹车系统维修',
    totalAmount: 3200,
    technicianName: null,
    estimatedDelivery: '2024-06-23 12:00',
    createdAt: '2024-06-20 16:45',
  },
  {
    id: '4',
    orderNo: 'AP20240620002',
    status: 'completed',
    customerName: '赵六',
    customerPhone: '13800138004',
    plateNumber: '京D22222',
    vehicleBrand: '丰田',
    vehicleModel: '凯美瑞',
    repairType: '空调维修',
    totalAmount: 880,
    technicianName: '张师傅',
    estimatedDelivery: '2024-06-20 15:00',
    createdAt: '2024-06-20 09:00',
  },
  {
    id: '5',
    orderNo: 'AP20240619001',
    status: 'completed',
    customerName: '钱七',
    customerPhone: '13800138005',
    plateNumber: '京E33333',
    vehicleBrand: '本田',
    vehicleModel: '雅阁',
    repairType: '发动机检修',
    totalAmount: 4500,
    technicianName: '李师傅',
    estimatedDelivery: '2024-06-20 18:00',
    createdAt: '2024-06-19 11:30',
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
  const pageSize = 10;

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch = !search ||
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.customerName.includes(search) ||
      order.plateNumber.includes(search) ||
      order.vehicleBrand.includes(search) ||
      order.vehicleModel.includes(search);
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
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                      <TableCell>
                        <div className="font-medium text-metal-900">{order.orderNo}</div>
                        <div className="text-xs text-metal-500">{formatDate(order.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-metal-900">{order.customerName}</div>
                        <div className="text-xs text-metal-500">
                          {order.plateNumber} · {order.vehicleBrand} {order.vehicleModel}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-metal-400" />
                          <span className="text-metal-700">{order.repairType}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.technicianName ? (
                          <span className="text-metal-700">{order.technicianName}</span>
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
                          <span className="text-metal-700 text-sm">{order.estimatedDelivery}</span>
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
                  ))}
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
