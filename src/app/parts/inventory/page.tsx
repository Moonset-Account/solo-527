'use client';

import { useState } from 'react';
import {
  TrendingUp,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Download,
  Search,
  Filter,
  Package,
  Clock,
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
import { formatCurrency } from '@/lib/utils';

const mockInventory = [
  {
    id: '1',
    sku: 'OF-001',
    name: '机油滤清器',
    category: '滤清器',
    brand: '曼牌',
    stock: 50,
    minStock: 20,
    maxStock: 100,
    costPrice: 45,
    salePrice: 85,
    turnoverRate: 0.85,
    turnoverDays: 35,
    lastOutDate: '2024-06-20',
    status: 'normal',
  },
  {
    id: '2',
    sku: 'AF-001',
    name: '空气滤芯',
    category: '滤清器',
    brand: '曼牌',
    stock: 8,
    minStock: 15,
    maxStock: 80,
    costPrice: 65,
    salePrice: 120,
    turnoverRate: 0.72,
    turnoverDays: 42,
    lastOutDate: '2024-06-19',
    status: 'low',
  },
  {
    id: '3',
    sku: 'CF-001',
    name: '空调滤芯',
    category: '滤清器',
    brand: '马勒',
    stock: 45,
    minStock: 20,
    maxStock: 80,
    costPrice: 52,
    salePrice: 95,
    turnoverRate: 0.92,
    turnoverDays: 32,
    lastOutDate: '2024-06-21',
    status: 'normal',
  },
  {
    id: '4',
    sku: 'SP-001',
    name: '火花塞',
    category: '点火系统',
    brand: 'NGK',
    stock: 20,
    minStock: 10,
    maxStock: 50,
    costPrice: 95,
    salePrice: 180,
    turnoverRate: 0.65,
    turnoverDays: 46,
    lastOutDate: '2024-06-18',
    status: 'normal',
  },
  {
    id: '5',
    sku: 'BP-F-001',
    name: '刹车片(前)',
    category: '制动系统',
    brand: '博世',
    stock: 5,
    minStock: 10,
    maxStock: 30,
    costPrice: 380,
    salePrice: 680,
    turnoverRate: 0.45,
    turnoverDays: 67,
    lastOutDate: '2024-06-15',
    status: 'low',
  },
  {
    id: '6',
    sku: 'MO-001',
    name: '全合成机油',
    category: '润滑系统',
    brand: '美孚',
    stock: 120,
    minStock: 30,
    maxStock: 150,
    costPrice: 280,
    salePrice: 480,
    turnoverRate: 1.25,
    turnoverDays: 24,
    lastOutDate: '2024-06-21',
    status: 'high',
  },
];

const categories = [
  { value: '', label: '全部分类' },
  { value: '滤清器', label: '滤清器' },
  { value: '制动系统', label: '制动系统' },
  { value: '点火系统', label: '点火系统' },
  { value: '润滑系统', label: '润滑系统' },
];

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'normal', label: '正常' },
  { value: 'low', label: '库存不足' },
  { value: 'high', label: '库存过高' },
  { value: 'slow', label: '周转缓慢' },
];

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  const filteredParts = mockInventory.filter((part) => {
    const matchesSearch = !search ||
      part.name.includes(search) ||
      part.sku.toLowerCase().includes(search.toLowerCase()) ||
      part.brand.includes(search);
    const matchesCategory = !category || part.category === category;
    const matchesStatus = !status || part.status === status || 
      (status === 'slow' && part.turnoverRate < 0.6);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValue = mockInventory.reduce((sum, p) => sum + p.stock * p.costPrice, 0);
  const lowStockCount = mockInventory.filter((p) => p.stock <= p.minStock).length;
  const highStockCount = mockInventory.filter((p) => p.stock >= p.maxStock).length;
  const avgTurnover = (mockInventory.reduce((sum, p) => sum + p.turnoverRate, 0) / mockInventory.length).toFixed(2);

  const getStatusBadge = (partStatus: string, turnoverRate: number, stock: number, minStock: number, maxStock: number) => {
    if (stock <= minStock) return { label: '库存不足', variant: 'danger' as const, icon: AlertTriangle };
    if (stock >= maxStock) return { label: '库存过高', variant: 'warning' as const, icon: ArrowUp };
    if (turnoverRate < 0.6) return { label: '周转缓慢', variant: 'secondary' as const, icon: Clock };
    return { label: '正常', variant: 'success' as const, icon: TrendingUp };
  };

  const handleExport = async (type: 'excel' | 'csv') => {
    try {
      const format = type === 'excel' ? 'xlsx' : 'csv';
      const res = await fetch(`/api/parts/export?format=${format}`);

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || '导出失败');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `parts-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      alert('导出失败，请检查网络连接');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-metal-900">{mockInventory.length}</p>
                  <p className="text-sm text-metal-600">配件种类</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-600">{avgTurnover}</p>
                  <p className="text-sm text-metal-600">平均周转率</p>
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
                  <p className="text-2xl font-bold text-red-600">{lowStockCount}</p>
                  <p className="text-sm text-metal-600">库存预警</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <ArrowUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalValue)}</p>
                  <p className="text-sm text-metal-600">库存总值</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>库存周转分析</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  导出Excel
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                  导出CSV
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="搜索配件名称、SKU、品牌..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={categories}
                  className="w-40"
                />
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={statusOptions}
                  className="w-40"
                />
              </div>
            </div>

            <div className="rounded-xl border border-metal-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>配件名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>当前库存</TableHead>
                    <TableHead>库存范围</TableHead>
                    <TableHead>周转率</TableHead>
                    <TableHead>周转天数</TableHead>
                    <TableHead>上次出库</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => {
                    const statusInfo = getStatusBadge(part.status, part.turnoverRate, part.stock, part.minStock, part.maxStock);
                    const StatusIcon = statusInfo.icon;
                    const stockPercent = Math.min(100, (part.stock / part.maxStock) * 100);
                    
                    return (
                      <TableRow key={part.id} className="hover:bg-primary-50/50">
                        <TableCell>
                          <span className="font-mono text-sm text-metal-600">{part.sku}</span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-metal-900">{part.name}</div>
                          <div className="text-xs text-metal-500">{part.brand}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{part.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`font-semibold ${
                            part.stock <= part.minStock ? 'text-red-600' :
                            part.stock >= part.maxStock ? 'text-yellow-600' :
                            'text-metal-900'
                          }`}>
                            {part.stock}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-24">
                            <div className="flex justify-between text-xs text-metal-500 mb-1">
                              <span>{part.minStock}</span>
                              <span>{part.maxStock}</span>
                            </div>
                            <div className="w-full h-2 bg-metal-200 rounded-full relative overflow-hidden">
                              <div
                                className={`h-full rounded-full absolute left-0 ${
                                  part.stock <= part.minStock
                                    ? 'bg-red-500'
                                    : part.stock >= part.maxStock
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                                }`}
                                style={{ width: `${stockPercent}%` }}
                              />
                              <div
                                className="absolute top-0 h-full w-0.5 bg-metal-400"
                                style={{ left: `${(part.minStock / part.maxStock) * 100}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {part.turnoverRate >= 0.8 ? (
                              <ArrowUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className={`font-medium ${
                              part.turnoverRate >= 0.8 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {part.turnoverRate.toFixed(2)}
                            </span>
                            <span className="text-xs text-metal-400">次/日</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-metal-600">
                          {part.turnoverDays} 天
                        </TableCell>
                        <TableCell className="text-metal-500 text-sm">
                          {part.lastOutDate}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {filteredParts.length === 0 && (
              <div className="text-center py-12 text-metal-400">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>暂无匹配的配件数据</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
