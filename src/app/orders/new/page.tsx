'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Car,
  User,
  FileText,
  Package,
  Wrench,
  Plus,
  Trash2,
  Save,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import AppLayout from '@/components/layout/AppLayout';

const customers = [
  { value: '1', label: '张三 - 13800138001' },
  { value: '2', label: '李四 - 13800138002' },
  { value: '3', label: '王五 - 13800138003' },
];

const vehicles = [
  { value: '1', label: '京A12345 宝马530Li' },
  { value: '2', label: '京B67890 奔驰E300L' },
  { value: '3', label: '京C11111 奥迪A6L' },
];

const parts = [
  { id: '1', name: '机油滤清器', sku: 'OF-001', price: 85, stock: 50 },
  { id: '2', name: '空气滤芯', sku: 'AF-001', price: 120, stock: 30 },
  { id: '3', name: '空调滤芯', sku: 'CF-001', price: 95, stock: 45 },
  { id: '4', name: '火花塞', sku: 'SP-001', price: 180, stock: 20 },
  { id: '5', name: '刹车片(前)', sku: 'BP-F-001', price: 680, stock: 15 },
];

const services = [
  { id: '1', name: '更换机油工时', price: 150 },
  { id: '2', name: '更换刹车片工时', price: 200 },
  { id: '3', name: '常规检查', price: 80 },
  { id: '4', name: '空调清洗', price: 180 },
];

const defaultProcesses = [
  { step: 1, name: '车辆预检', description: '车辆外观、里程、油液检查', status: 'pending' },
  { step: 2, name: '配件准备', description: '根据工单准备所需配件', status: 'pending' },
  { step: 3, name: '维修施工', description: '按工艺要求进行维修作业', status: 'pending' },
  { step: 4, name: '内部质检', description: '维修项目自检互检', status: 'pending' },
  { step: 5, name: '终检交付', description: '最终质检合格后交付客户', status: 'pending' },
];

interface OrderItem {
  id: string;
  type: 'part' | 'service';
  name: string;
  quantity: number;
  unitPrice: number;
}

export default function NewOrderPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [repairType, setRepairType] = useState('');
  const [faultDescription, setFaultDescription] = useState('');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [processes] = useState(defaultProcesses);
  const [showPartPicker, setShowPartPicker] = useState(false);
  const [showServicePicker, setShowServicePicker] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const addPart = (part: typeof parts[0]) => {
    const existing = items.find((i) => i.id === `part-${part.id}`);
    if (existing) {
      setItems(items.map((i) =>
        i.id === `part-${part.id}` ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        id: `part-${part.id}`,
        type: 'part',
        name: part.name,
        quantity: 1,
        unitPrice: part.price,
      }]);
    }
    setShowPartPicker(false);
  };

  const addService = (service: typeof services[0]) => {
    const existing = items.find((i) => i.id === `service-${service.id}`);
    if (existing) {
      setItems(items.map((i) =>
        i.id === `service-${service.id}` ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, {
        id: `service-${service.id}`,
        type: 'service',
        name: service.name,
        quantity: 1,
        unitPrice: service.price,
      }]);
    }
    setShowServicePicker(false);
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter((i) => i.id !== id));
    } else {
      setItems(items.map((i) => (i.id === id ? { ...i, quantity } : i)));
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  const handleSubmit = () => {
    alert('订单创建成功！');
    router.push('/orders');
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </Button>
          <h1 className="text-xl font-semibold text-metal-900">新建维修订单</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary-500" />
                  客户信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="选择客户"
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    options={[{ value: '', label: '请选择客户' }, ...customers]}
                  />
                  <Select
                    label="选择车辆"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    options={[{ value: '', label: '请选择车辆' }, ...vehicles]}
                  />
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="维修类型"
                    value={repairType}
                    onChange={(e) => setRepairType(e.target.value)}
                    options={[
                      { value: '', label: '请选择类型' },
                      { value: '常规保养', label: '常规保养' },
                      { value: '大保养', label: '大保养' },
                      { value: '刹车维修', label: '刹车维修' },
                      { value: '发动机维修', label: '发动机维修' },
                      { value: '空调维修', label: '空调维修' },
                      { value: '其他', label: '其他' },
                    ]}
                  />
                  <Input
                    label="预计交付时间"
                    type="datetime-local"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                  />
                </div>
                <Textarea
                  label="故障描述"
                  placeholder="请详细描述车辆故障现象和客户需求..."
                  value={faultDescription}
                  onChange={(e) => setFaultDescription(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary-500" />
                    项目明细
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowPartPicker(!showPartPicker)}>
                      <Plus className="w-4 h-4 mr-1" />
                      添加配件
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setShowServicePicker(!showServicePicker)}>
                      <Wrench className="w-4 h-4 mr-1" />
                      添加服务
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {showPartPicker && (
                  <div className="mb-4 p-4 bg-metal-50 rounded-lg">
                    <p className="text-sm font-medium text-metal-700 mb-2">选择配件</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {parts.map((part) => (
                        <button
                          key={part.id}
                          onClick={() => addPart(part)}
                          className="p-3 text-left bg-white rounded-lg border border-metal-200 hover:border-primary-500 hover:shadow-sm transition-all"
                        >
                          <p className="text-sm font-medium text-metal-900">{part.name}</p>
                          <p className="text-xs text-metal-500">{part.sku}</p>
                          <p className="text-sm font-semibold text-primary-600 mt-1">¥{part.price}</p>
                          <p className="text-xs text-metal-400">库存: {part.stock}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showServicePicker && (
                  <div className="mb-4 p-4 bg-metal-50 rounded-lg">
                    <p className="text-sm font-medium text-metal-700 mb-2">选择服务</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {services.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => addService(service)}
                          className="p-3 text-left bg-white rounded-lg border border-metal-200 hover:border-primary-500 hover:shadow-sm transition-all"
                        >
                          <p className="text-sm font-medium text-metal-900">{service.name}</p>
                          <p className="text-sm font-semibold text-primary-600 mt-1">¥{service.price}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {items.length === 0 ? (
                  <div className="text-center py-8 text-metal-400">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>暂无项目，请添加配件或服务</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 bg-metal-50 rounded-lg"
                      >
                        <Badge variant={item.type === 'part' ? 'info' : 'secondary'}>
                          {item.type === 'part' ? '配件' : '服务'}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium text-metal-900">{item.name}</p>
                          <p className="text-sm text-metal-500">单价: ¥{item.unitPrice}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded bg-white border border-metal-300 text-metal-600 hover:bg-metal-100"
                          >
                            -
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-white border border-metal-300 text-metal-600 hover:bg-metal-100"
                          >
                            +
                          </button>
                        </div>
                        <div className="w-24 text-right font-semibold text-metal-900">
                          ¥{(item.quantity * item.unitPrice).toFixed(2)}
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1 text-metal-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-metal-200 flex justify-end">
                  <div className="text-right">
                    <p className="text-sm text-metal-500">合计金额</p>
                    <p className="text-2xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary-500" />
                  工艺工序
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {processes.map((process) => (
                    <div
                      key={process.step}
                      className="flex items-center gap-4 p-3 bg-metal-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-semibold text-sm">
                        {process.step}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-metal-900">{process.name}</p>
                        <p className="text-sm text-metal-500">{process.description}</p>
                      </div>
                      <Badge variant="secondary">待处理</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>订单摘要</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">项目数量</span>
                  <span className="font-medium text-metal-900">{items.length} 项</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">工序数量</span>
                  <span className="font-medium text-metal-900">{processes.length} 道</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-metal-500">预计交付</span>
                  <span className="font-medium text-metal-900 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {estimatedDelivery || '未设置'}
                  </span>
                </div>

                <div className="pt-4 border-t border-metal-200">
                  <div className="flex justify-between">
                    <span className="text-metal-700 font-medium">订单总额</span>
                    <span className="text-xl font-bold text-primary-600">¥{totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Button className="w-full" size="lg" onClick={handleSubmit}>
                    <Save className="w-4 h-4 mr-2" />
                    创建订单
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => router.back()}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
