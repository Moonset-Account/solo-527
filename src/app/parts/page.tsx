'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Filter,
  Download,
  AlertTriangle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUp,
  ArrowDown,
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
import { formatCurrency, getStatusText } from '@/lib/utils';

const mockParts = [
  {
    id: '1',
    sku: 'OF-001',
    name: '机油滤清器',
    category: '滤清器',
    brand: '曼牌',
    spec: 'HU7008Z',
    unit: '个',
    costPrice: 45,
    salePrice: 85,
    stock: 50,
    minStock: 20,
    maxStock: 100,
    supplier: '北京汽配贸易',
    turnoverRate: 0.85,
  },
  {
    id: '2',
    sku: 'AF-001',
    name: '空气滤芯',
    category: '滤清器',
    brand: '曼牌',
    spec: 'C30005',
    unit: '个',
    costPrice: 65,
    salePrice: 120,
    stock: 8,
    minStock: 15,
    maxStock: 80,
    supplier: '北京汽配贸易',
    turnoverRate: 0.72,
  },
  {
    id: '3',
    sku: 'CF-001',
    name: '空调滤芯',
    category: '滤清器',
    brand: '马勒',
    spec: 'LAK1184',
    unit: '个',
    costPrice: 52,
    salePrice: 95,
    stock: 45,
    minStock: 20,
    maxStock: 80,
    supplier: '上海汽配批发',
    turnoverRate: 0.92,
  },
  {
    id: '4',
    sku: 'SP-001',
    name: '火花塞',
    category: '点火系统',
    brand: 'NGK',
    spec: 'ILZKR7B-11S',
    unit: '支',
    costPrice: 95,
    salePrice: 180,
    stock: 20,
    minStock: 10,
    maxStock: 50,
    supplier: '广州汽配供应',
    turnoverRate: 0.65,
  },
  {
    id: '5',
    sku: 'BP-F-001',
    name: '刹车片(前)',
    category: '制动系统',
    brand: '博世',
    spec: '0986AB9423',
    unit: '套',
    costPrice: 380,
    salePrice: 680,
    stock: 5,
    minStock: 10,
    maxStock: 30,
    supplier: '北京汽配贸易',
    turnoverRate: 0.45,
  },
  {
    id: '6',
    sku: 'BR-001',
    name: '刹车油',
    category: '制动系统',
    brand: '博世',
    spec: 'DOT4 1L',
    unit: '瓶',
    costPrice: 45,
    salePrice: 80,
    stock: 35,
    minStock: 15,
    maxStock: 60,
    supplier: '上海汽配批发',
    turnoverRate: 0.58,
  },
  {
    id: '7',
    sku: 'MO-001',
    name: '全合成机油',
    category: '润滑系统',
    brand: '美孚',
    spec: '5W-40 4L',
    unit: '桶',
    costPrice: 280,
    salePrice: 480,
    stock: 120,
    minStock: 30,
    maxStock: 150,
    supplier: '广州汽配供应',
    turnoverRate: 1.25,
  },
];

const categories = [
  { value: '', label: '全部分类' },
  { value: '滤清器', label: '滤清器' },
  { value: '制动系统', label: '制动系统' },
  { value: '点火系统', label: '点火系统' },
  { value: '润滑系统', label: '润滑系统' },
];

export default function PartsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const filteredParts = mockParts.filter((part) => {
    const matchesSearch = !search ||
      part.name.includes(search) ||
      part.sku.toLowerCase().includes(search.toLowerCase()) ||
      part.brand.includes(search);
    const matchesCategory = !category || part.category === category;
    const matchesLowStock = !lowStockOnly || part.stock <= part.minStock;
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalPages = Math.ceil(filteredParts.length / pageSize);
  const paginatedParts = filteredParts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExport = () => {
    alert('导出功能：将配件数据导出为Excel文件');
  };

  const getStockStatus = (stock: number, minStock: number, maxStock: number) => {
    if (stock <= minStock) return { text: '库存不足', variant: 'danger' as const, icon: AlertTriangle };
    if (stock >= maxStock) return { text: '库存过高', variant: 'warning' as const, icon: ArrowUp };
    return { text: '库存正常', variant: 'success' as const, icon: Package };
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-metal-900">{mockParts.length}</p>
                  <p className="text-sm text-metal-600">配件种类</p>
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
                  <p className="text-2xl font-bold text-red-600">
                    {mockParts.filter((p) => p.stock <= p.minStock).length}
                  </p>
                  <p className="text-sm text-metal-600">库存预警</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">0.85</p>
                  <p className="text-sm text-metal-600">平均周转率</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card variant="dashboard">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500 flex items-center justify-center">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-purple-600">¥12.5万</p>
                  <p className="text-sm text-metal-600">库存总值</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>配件档案</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  导出
                </Button>
                <Button onClick={() => alert('新建配件')}>
                  <Plus className="w-4 h-4 mr-2" />
                  新增配件
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
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  icon={<Search className="w-4 h-4" />}
                />
              </div>
              <div className="flex gap-3">
                <Select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  options={categories}
                  className="w-40"
                />
                <Button
                  variant={lowStockOnly ? 'warning' : 'outline'}
                  size="icon"
                  onClick={() => {
                    setLowStockOnly(!lowStockOnly);
                    setCurrentPage(1);
                  }}
                  title="只看库存预警"
                >
                  <AlertTriangle className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-metal-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>配件名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>品牌/规格</TableHead>
                    <TableHead>库存</TableHead>
                    <TableHead>售价</TableHead>
                    <TableHead>周转率</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedParts.map((part) => {
                    const status = getStockStatus(part.stock, part.minStock, part.maxStock);
                    const StatusIcon = status.icon;
                    return (
                      <TableRow key={part.id} className="cursor-pointer hover:bg-primary-50/50">
                        <TableCell>
                          <span className="font-mono text-sm text-metal-600">{part.sku}</span>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-metal-900">{part.name}</div>
                          <div className="text-xs text-metal-500">{part.supplier}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{part.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-metal-700">{part.brand}</div>
                          <div className="text-xs text-metal-500">{part.spec}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${part.stock <= part.minStock ? 'text-red-600' : 'text-metal-900'}`}>
                              {part.stock}
                            </span>
                            <span className="text-xs text-metal-400">{part.unit}</span>
                          </div>
                          <div className="w-20 h-1.5 bg-metal-200 rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                part.stock <= part.minStock
                                  ? 'bg-red-500'
                                  : part.stock >= part.maxStock
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(100, (part.stock / part.maxStock) * 100)}%` }}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-metal-900">
                            {formatCurrency(part.salePrice)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {part.turnoverRate >= 0.8 ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-red-500" />
                            )}
                            <span className={part.turnoverRate >= 0.8 ? 'text-green-600' : 'text-red-600'}>
                              {part.turnoverRate.toFixed(2)}
                            </span>
                            <span className="text-xs text-metal-400">次/日</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                            <StatusIcon className="w-3 h-3" />
                            {status.text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-metal-500">
                共 {filteredParts.length} 条记录
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
