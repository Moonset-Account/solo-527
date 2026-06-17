'use client';

import { useEffect, useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  Upload,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Alert } from '@/components/ui/Alert';
import { mockParts } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';

export default function PartsPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    setCurrentPageTitle('配件管理');
  }, [setCurrentPageTitle]);

  const categories = [
    { value: 'all', label: '全部分类' },
    { value: '机油', label: '机油' },
    { value: '滤清器', label: '滤清器' },
    { value: '点火系统', label: '点火系统' },
    { value: '变速箱油', label: '变速箱油' },
    { value: '制动系统', label: '制动系统' },
    { value: '轮胎', label: '轮胎' },
    { value: '电气系统', label: '电气系统' },
    { value: '空调系统', label: '空调系统' },
  ];

  const filteredParts = mockParts.filter((part) => {
    if (category !== 'all' && part.category !== category) return false;
    if (lowStockOnly && part.stock > part.min_stock) return false;
    if (searchQuery && !part.name.includes(searchQuery) && !part.sku.includes(searchQuery)) return false;
    return true;
  });

  const lowStockParts = mockParts.filter((p) => p.stock <= p.min_stock);
  const totalStockValue = mockParts.reduce((sum, p) => sum + p.cost_price * p.stock, 0);

  return (
    <div className="space-y-6">
      {/* 库存预警 */}
      {lowStockParts.length > 0 && (
        <Alert type="warning" title="库存预警" dismissible>
          有 {lowStockParts.length} 种配件库存低于安全库存，请及时补货
        </Alert>
      )}

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">配件种类</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  {mockParts.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-primary-50 text-primary-600">
                <Package className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">库存总值</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  {formatCurrency(totalStockValue)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-success-50 text-success-600">
                <ArrowUpDown className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">库存预警</p>
                <p className="text-2xl font-bold text-amber-600 font-display">
                  {lowStockParts.length}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-dark-500 mb-1">分类数量</p>
                <p className="text-2xl font-bold text-dark-900 font-display">
                  {new Set(mockParts.map((p) => p.category)).size}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
                <Filter className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">配件列表</CardTitle>
          <div className="flex items-center gap-3">
            <div className="w-64">
              <Input
                placeholder="搜索配件名称/SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                prefix={<Search className="h-4 w-4 text-dark-400" />}
              />
            </div>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories}
              className="w-36"
            />
            <Button
              variant={lowStockOnly ? 'secondary' : 'outline'}
              onClick={() => setLowStockOnly(!lowStockOnly)}
              size="sm"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              库存预警
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增配件
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>配件信息</TableHead>
                <TableHead>SKU编码</TableHead>
                <TableHead>分类</TableHead>
                <TableHead>成本价</TableHead>
                <TableHead>销售价</TableHead>
                <TableHead>库存</TableHead>
                <TableHead>单位</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.map((part) => {
                const isLowStock = part.stock <= part.min_stock;
                return (
                  <TableRow key={part.id}>
                    <TableCell>
                      <div className="font-medium text-dark-900">{part.name}</div>
                      {part.description && (
                        <div className="text-xs text-dark-500 mt-0.5">{part.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-dark-100 px-2 py-1 rounded text-dark-700">
                        {part.sku}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" size="sm">
                        {part.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-dark-500">
                      {formatCurrency(part.cost_price)}
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary-600">
                        {formatCurrency(part.sale_price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={isLowStock ? 'text-amber-600 font-medium' : ''}>
                          {part.stock}
                        </span>
                        {isLowStock && (
                          <Badge variant="warning" size="sm">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            预警
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-dark-500">{part.unit}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger-600 hover:text-danger-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
