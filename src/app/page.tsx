'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Package,
  ClipboardCheck,
  DollarSign,
  AlertTriangle,
  Clock,
  ChevronRight,
  Search,
  Tag,
  Calendar,
  Wrench,
  Bell,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { formatCurrency, formatPercent, getStatusText } from '@/lib/utils';
import AppLayout from '@/components/layout/AppLayout';
import { useSession } from 'next-auth/react';

interface ChartDataPoint {
  date: string;
  value: number;
}

interface DashboardData {
  todayRevenue: number;
  todayOrders: number;
  partTurnoverRate: number;
  qualityPassRate: number;
  pendingOrders: number;
  lowStockAlerts: number;
  deliveryAlerts: number;
  revenueTrend: ChartDataPoint[];
  orderTrend: ChartDataPoint[];
  turnoverTrend: ChartDataPoint[];
}

const mockDashboardData: DashboardData = {
  todayRevenue: 28650,
  todayOrders: 12,
  partTurnoverRate: 0.85,
  qualityPassRate: 0.92,
  pendingOrders: 8,
  lowStockAlerts: 15,
  deliveryAlerts: 3,
  revenueTrend: [
    { date: '06-15', value: 22000 },
    { date: '06-16', value: 25000 },
    { date: '06-17', value: 18000 },
    { date: '06-18', value: 32000 },
    { date: '06-19', value: 28000 },
    { date: '06-20', value: 24000 },
    { date: '06-21', value: 28650 },
  ],
  orderTrend: [
    { date: '06-15', value: 8 },
    { date: '06-16', value: 10 },
    { date: '06-17', value: 6 },
    { date: '06-18', value: 14 },
    { date: '06-19', value: 11 },
    { date: '06-20', value: 9 },
    { date: '06-21', value: 12 },
  ],
  turnoverTrend: [
    { date: '第4周', value: 0.72 },
    { date: '第3周', value: 0.78 },
    { date: '第2周', value: 0.81 },
    { date: '第1周', value: 0.85 },
  ],
};

const quickFilters = [
  {
    title: '客户价目表',
    description: '快速查询客户价格体系',
    icon: Tag,
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    href: '/price-list',
    placeholder: '搜索客户、配件名称...',
  },
  {
    title: '交付日期',
    description: '追踪订单交付进度',
    icon: Calendar,
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    href: '/delivery',
    placeholder: '搜索订单号、车牌号...',
  },
  {
    title: '订单工艺',
    description: '查看维修工序进度',
    icon: Wrench,
    color: 'from-emerald-500 to-emerald-600',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
    href: '/orders',
    placeholder: '搜索订单号、车型...',
  },
];

const todoItems = [
  {
    id: 1,
    type: 'warning',
    title: '库存预警：机油滤清器',
    description: '库存低于安全线，仅剩 5 件',
    time: '刚刚',
    href: '/parts/inventory',
  },
  {
    id: 2,
    type: 'info',
    title: '待质检：订单 AP20240621001',
    description: '宝马 530Li 大保养',
    time: '10分钟前',
    href: '/quality',
  },
  {
    id: 3,
    type: 'danger',
    title: '即将交付：订单 AP20240620003',
    description: '预计今天下午交付',
    time: '30分钟前',
    href: '/delivery',
  },
  {
    id: 4,
    type: 'warning',
    title: '库存预警：空气滤芯',
    description: '库存低于安全线，仅剩 8 件',
    time: '1小时前',
    href: '/parts/inventory',
  },
  {
    id: 5,
    type: 'info',
    title: '新订单：奔驰 E300L',
    description: '常规保养 + 刹车检测',
    time: '2小时前',
    href: '/orders',
  },
];

const kpiCards = [
  {
    title: '今日营收',
    value: 28650,
    unit: '元',
    change: 12.5,
    changeType: 'up',
    icon: DollarSign,
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    title: '今日订单',
    value: 12,
    unit: '单',
    change: 8.3,
    changeType: 'up',
    icon: ShoppingCart,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    title: '配件周转率',
    value: 0.85,
    unit: '次/日',
    change: 5.2,
    changeType: 'up',
    icon: Package,
    gradient: 'from-purple-500 to-purple-600',
    isPercent: true,
  },
  {
    title: '质检合格率',
    value: 0.92,
    unit: '',
    change: -1.5,
    changeType: 'down',
    icon: ClipboardCheck,
    gradient: 'from-orange-500 to-orange-600',
    isPercent: true,
  },
];

function KPICard({ kpi, index }: { kpi: typeof kpiCards[0]; index: number }) {
  const Icon = kpi.icon;

  return (
    <Card
      variant="dashboard"
      className="overflow-hidden animate-fade-in"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-metal-600 font-medium">{kpi.title}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-metal-900 font-mono">
                {kpi.isPercent ? formatPercent(kpi.value) : kpi.value.toLocaleString()}
              </span>
              {kpi.unit && (
                <span className="text-sm text-metal-500">{kpi.unit}</span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1">
              {kpi.changeType === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  kpi.changeType === 'up' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {kpi.changeType === 'up' ? '+' : ''}{kpi.change}%
              </span>
              <span className="text-xs text-metal-400">较昨日</span>
            </div>
          </div>
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shadow-lg`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickFilterCard({ filter }: { filter: typeof quickFilters[0] }) {
  const router = useRouter();
  const Icon = filter.icon;
  const [searchValue, setSearchValue] = useState('');

  return (
    <Card className="overflow-hidden hover:shadow-industrial-lg transition-all duration-300 group">
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-lg ${filter.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${filter.textColor}`} />
          </div>
          <div>
            <h3 className="font-semibold text-metal-900">{filter.title}</h3>
            <p className="text-xs text-metal-500">{filter.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={filter.placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => router.push(filter.href)}
            className="px-3"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TodoItem({ item }: { item: typeof todoItems[0] }) {
  const router = useRouter();

  const typeStyles = {
    warning: {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
    },
    danger: {
      badge: 'bg-red-100 text-red-800 border-red-200',
      icon: Clock,
      iconColor: 'text-red-500',
    },
    info: {
      badge: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: Bell,
      iconColor: 'text-blue-500',
    },
  };

  const style = typeStyles[item.type as keyof typeof typeStyles];
  const Icon = style.icon;

  return (
    <button
      onClick={() => router.push(item.href)}
      className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-metal-50 transition-colors text-left group"
    >
      <div className={`w-8 h-8 rounded-lg ${style.badge} flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-4 h-4 ${style.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-metal-800 group-hover:text-primary-600 transition-colors">
          {item.title}
        </p>
        <p className="text-xs text-metal-500 mt-0.5">{item.description}</p>
        <p className="text-xs text-metal-400 mt-1">{item.time}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-metal-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
    </button>
  );
}

function CustomTooltip({ active, payload, label, isCurrency = false, isPercent = false }: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  isCurrency?: boolean;
  isPercent?: boolean;
}) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white px-3 py-2 rounded-lg shadow-industrial border border-metal-200">
        <p className="text-xs text-metal-500 mb-1">{label}</p>
        <p className="text-sm font-semibold text-metal-900">
          {isCurrency
            ? formatCurrency(payload[0].value)
            : isPercent
            ? formatPercent(payload[0].value)
            : payload[0].value}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data] = useState<DashboardData>(mockDashboardData);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kpiCards.map((kpi, index) => (
            <KPICard key={kpi.title} kpi={kpi} index={index} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickFilters.map((filter) => (
            <QuickFilterCard key={filter.title} filter={filter} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>营收趋势</CardTitle>
                <Badge variant="secondary">近7天</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenueTrend}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                      tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip content={<CustomTooltip isCurrency />} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>待办提醒</CardTitle>
                <Badge variant="warning">{todoItems.length} 项</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-metal-100 max-h-64 overflow-y-auto scrollbar-thin">
                {todoItems.map((item) => (
                  <TodoItem key={item.id} item={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>订单趋势</CardTitle>
                <Badge variant="secondary">近7天</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.orderTrend}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>周转趋势</CardTitle>
                <Badge variant="secondary">近4周</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.turnoverTrend}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#718096', fontSize: 12 }}
                      tickFormatter={(value) => (value * 100).toFixed(0) + '%'}
                    />
                    <Tooltip content={<CustomTooltip isPercent />} />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-900">{data.lowStockAlerts}</p>
                  <p className="text-sm text-yellow-700">库存预警</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-900">{data.pendingOrders}</p>
                  <p className="text-sm text-blue-700">进行中订单</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-500 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-900">{data.deliveryAlerts}</p>
                  <p className="text-sm text-red-700">即将交付</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
