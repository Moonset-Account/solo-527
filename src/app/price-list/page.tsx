'use client';

import { useState } from 'react';
import {
  Tag,
  Search,
  Filter,
  Star,
  Building2,
  User,
  ChevronDown,
  ChevronUp,
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

const priceLevels = [
  { level: 1, name: '零售价', description: '散客零售价格' },
  { level: 2, name: '会员价', description: '普通会员价格' },
  { level: 3, name: 'VIP价', description: 'VIP客户专享价' },
  { level: 4, name: '企业价', description: '企业合作价' },
];

const customerTypes = [
  { value: '', label: '全部客户类型' },
  { value: 'retail', label: '零售客户' },
  { value: 'vip', label: 'VIP客户' },
  { value: 'enterprise', label: '企业客户' },
];

const categories = [
  { value: '', label: '全部分类' },
  { value: '滤清器', label: '滤清器' },
  { value: '制动系统', label: '制动系统' },
  { value: '点火系统', label: '点火系统' },
  { value: '润滑系统', label: '润滑系统' },
  { value: '服务项目', label: '服务项目' },
];

const mockPriceList = [
  {
    id: '1',
    partId: '1',
    partName: '机油滤清器',
    sku: 'OF-001',
    category: '滤清器',
    brand: '曼牌',
    unit: '个',
    prices: [
      { level: 1, price: 85 },
      { level: 2, price: 78 },
      { level: 3, price: 72 },
      { level: 4, price: 65 },
    ],
  },
  {
    id: '2',
    partId: '2',
    partName: '空气滤芯',
    sku: 'AF-001',
    category: '滤清器',
    brand: '曼牌',
    unit: '个',
    prices: [
      { level: 1, price: 120 },
      { level: 2, price: 110 },
      { level: 3, price: 100 },
      { level: 4, price: 90 },
    ],
  },
  {
    id: '3',
    partId: '3',
    partName: '空调滤芯',
    sku: 'CF-001',
    category: '滤清器',
    brand: '马勒',
    unit: '个',
    prices: [
      { level: 1, price: 95 },
      { level: 2, price: 88 },
      { level: 3, price: 80 },
      { level: 4, price: 72 },
    ],
  },
  {
    id: '4',
    partId: '5',
    partName: '刹车片(前)',
    sku: 'BP-F-001',
    category: '制动系统',
    brand: '博世',
    unit: '套',
    prices: [
      { level: 1, price: 680 },
      { level: 2, price: 620 },
      { level: 3, price: 580 },
      { level: 4, price: 520 },
    ],
  },
  {
    id: '5',
    partId: '7',
    partName: '全合成机油',
    sku: 'MO-001',
    category: '润滑系统',
    brand: '美孚',
    unit: '桶',
    prices: [
      { level: 1, price: 480 },
      { level: 2, price: 440 },
      { level: 3, price: 400 },
      { level: 4, price: 360 },
    ],
  },
  {
    id: '6',
    serviceName: '更换机油工时',
    category: '服务项目',
    unit: '次',
    prices: [
      { level: 1, price: 150 },
      { level: 2, price: 130 },
      { level: 3, price: 120 },
      { level: 4, price: 100 },
    ],
  },
  {
    id: '7',
    serviceName: '更换刹车片工时',
    category: '服务项目',
    unit: '次',
    prices: [
      { level: 1, price: 200 },
      { level: 2, price: 180 },
      { level: 3, price: 160 },
      { level: 4, price: 140 },
    ],
  },
];

export default function PriceListPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [customerType, setCustomerType] = useState('');
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  const filteredItems = mockPriceList.filter((item) => {
    const name = 'partName' in item ? item.partName : item.serviceName;
    const matchesSearch = !search ||
      name?.includes(search) ||
      ('sku' in item && item.sku?.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !category || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const getPriceByLevel = (prices: { level: number; price: number }[], level: number) => {
    return prices.find((p) => p.level === level)?.price || 0;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {priceLevels.map((level) => (
            <Card key={level.level} variant="dashboard">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    level.level === 1 ? 'bg-blue-100 text-blue-600' :
                    level.level === 2 ? 'bg-green-100 text-green-600' :
                    level.level === 3 ? 'bg-yellow-100 text-yellow-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>
                    {level.level === 3 ? <Star className="w-5 h-5" /> :
                     level.level === 4 ? <Building2 className="w-5 h-5" /> :
                     <User className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-semibold text-metal-900">{level.name}</p>
                    <p className="text-xs text-metal-500">{level.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-primary-500" />
                客户价目表
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="搜索配件名称、SKU、服务项目..."
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
                  value={customerType}
                  onChange={(e) => setCustomerType(e.target.value)}
                  options={customerTypes}
                  className="w-40"
                />
              </div>
            </div>

            <div className="rounded-xl border border-metal-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>名称</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>品牌</TableHead>
                    <TableHead>单位</TableHead>
                    <TableHead className="text-right">零售价</TableHead>
                    <TableHead className="text-right">会员价</TableHead>
                    <TableHead className="text-right">VIP价</TableHead>
                    <TableHead className="text-right">企业价</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const name = 'partName' in item ? item.partName : item.serviceName;
                    const sku = 'sku' in item ? item.sku : '';
                    const brand = 'brand' in item ? item.brand : '-';
                    
                    return (
                      <TableRow key={item.id} className="hover:bg-primary-50/50">
                        <TableCell>
                          <div className="font-medium text-metal-900">{name}</div>
                          {sku && <div className="text-xs text-metal-500 font-mono">{sku}</div>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.category}</Badge>
                        </TableCell>
                        <TableCell className="text-metal-700">{brand}</TableCell>
                        <TableCell className="text-metal-600">{item.unit}</TableCell>
                        {item.prices.map((price) => (
                          <TableCell key={price.level} className="text-right">
                            <span className={`font-medium ${
                              price.level === 1 ? 'text-metal-900' :
                              price.level === 2 ? 'text-green-600' :
                              price.level === 3 ? 'text-yellow-600' :
                              'text-purple-600'
                            }`}>
                              {formatCurrency(price.price)}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-200">
              <button
                onClick={() => setExpandedLevel(expandedLevel === 1 ? null : 1)}
                className="w-full flex items-center justify-between"
              >
                <span className="font-medium text-primary-900">价格等级说明</span>
                {expandedLevel === 1 ? (
                  <ChevronUp className="w-5 h-5 text-primary-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-primary-600" />
                )}
              </button>
              {expandedLevel === 1 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {priceLevels.map((level) => (
                    <div key={level.level} className="p-3 bg-white rounded-lg">
                      <p className="font-semibold text-metal-900">{level.name}</p>
                      <p className="text-xs text-metal-500 mt-1">{level.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
