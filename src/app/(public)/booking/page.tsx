'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Calendar,
  Clock,
  Car,
  User,
  Phone,
  FileText,
  CheckCircle,
  ChevronLeft,
  Plus,
  Minus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { mockServiceTemplates } from '@/lib/mockData';
import { formatCurrency } from '@/lib/utils';

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30',
  '11:00', '13:00', '13:30', '14:00',
  '14:30', '15:00', '15:30', '16:00',
  '16:30', '17:00', '17:30', '18:00',
];

export default function BookingPage() {
  const searchParams = useSearchParams();
  const defaultServiceId = searchParams.get('service');

  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState<{ id: string; quantity: number }[]>(
    defaultServiceId ? [{ id: defaultServiceId, quantity: 1 }] : []
  );
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [carInfo, setCarInfo] = useState({
    plate: '',
    model: '',
    mileage: '',
    customerName: '',
    customerPhone: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const servicesWithInfo = selectedServices.map((s) => {
    const template = mockServiceTemplates.find((t) => t.id === s.id);
    return { ...s, template };
  });

  const totalAmount = servicesWithInfo.reduce(
    (sum, s) => sum + (s.template?.price || 0) * s.quantity,
    0
  );

  const totalDuration = servicesWithInfo.reduce(
    (sum, s) => sum + (s.template?.duration_minutes || 0) * s.quantity,
    0
  );

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) => {
      const exists = prev.find((s) => s.id === serviceId);
      if (exists) {
        return prev.filter((s) => s.id !== serviceId);
      }
      return [...prev, { id: serviceId, quantity: 1 }];
    });
  };

  const updateQuantity = (serviceId: string, delta: number) => {
    setSelectedServices((prev) =>
      prev.map((s) => {
        if (s.id === serviceId) {
          const newQty = Math.max(1, s.quantity + delta);
          return { ...s, quantity: newQty };
        }
        return s;
      })
    );
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  // 生成未来7天日期
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      value: d.toISOString().split('T')[0],
      label: `${d.getMonth() + 1}月${d.getDate()}日`,
      weekday: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()],
    };
  });

  if (submitted) {
    return (
      <div className="py-16">
        <div className="max-w-lg mx-auto px-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-success-100 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-dark-900 font-display mb-2">
                预约成功！
              </h2>
              <p className="text-dark-500 mb-6">
                我们已收到您的预约，稍后会有客服与您联系确认
              </p>
              <div className="bg-dark-50 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-dark-500">预约单号</span>
                    <span className="font-medium">APT{Date.now().toString().slice(-8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">预约时间</span>
                    <span className="font-medium">{selectedDate} {selectedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-dark-500">预计费用</span>
                    <span className="font-medium text-primary-600">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/" className="flex-1">
                  <Button variant="outline" className="w-full">返回首页</Button>
                </Link>
                <Link href="/member" className="flex-1">
                  <Button className="w-full">查看我的预约</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-12 bg-dark-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= s
                      ? 'bg-primary-600 text-white'
                      : 'bg-dark-200 text-dark-500'
                  }`}
                >
                  {step > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                <span className={`ml-2 text-sm ${step >= s ? 'text-dark-900 font-medium' : 'text-dark-400'}`}>
                  {s === 1 ? '选择项目' : s === 2 ? '选择时间' : '填写信息'}
                </span>
                {s < 3 && <div className={`w-12 md:w-20 h-0.5 mx-2 md:mx-4 ${step > s ? 'bg-primary-600' : 'bg-dark-200'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 主内容区 */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>选择服务项目</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mockServiceTemplates.filter((s) => s.is_active).map((service) => {
                      const selected = selectedServices.find((s) => s.id === service.id);
                      return (
                        <div
                          key={service.id}
                          className={`p-4 border rounded-xl cursor-pointer transition-all ${
                            selected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-dark-200 hover:border-primary-300'
                          }`}
                          onClick={() => toggleService(service.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-dark-900">{service.name}</h4>
                                <Badge variant="secondary" size="sm">{service.category}</Badge>
                              </div>
                              <p className="text-sm text-dark-500 mt-1">{service.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-dark-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  {service.duration_minutes}分钟
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="text-lg font-bold text-primary-600 font-display">
                                {formatCurrency(service.price)}
                              </div>
                              {selected && (
                                <div className="flex items-center gap-1 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(service.id, -1);
                                    }}
                                    className="w-6 h-6 rounded bg-white border border-dark-300 flex items-center justify-center hover:bg-dark-50"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="w-8 text-center text-sm">{selected.quantity}</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateQuantity(service.id, 1);
                                    }}
                                    className="w-6 h-6 rounded bg-white border border-dark-300 flex items-center justify-center hover:bg-dark-50"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>选择预约时间</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* 日期选择 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-dark-700 mb-3">选择日期</h4>
                    <div className="grid grid-cols-7 gap-2">
                      {dates.map((date) => (
                        <button
                          key={date.value}
                          onClick={() => setSelectedDate(date.value)}
                          className={`p-2 rounded-lg border text-center transition-all ${
                            selectedDate === date.value
                              ? 'border-primary-500 bg-primary-50 text-primary-700'
                              : 'border-dark-200 hover:border-primary-300'
                          }`}
                        >
                          <div className="text-xs text-dark-500">{date.weekday}</div>
                          <div className="text-sm font-medium">{date.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 时间选择 */}
                  <div>
                    <h4 className="text-sm font-medium text-dark-700 mb-3">选择时段</h4>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                      {timeSlots.map((time) => {
                        const isAvailable = time !== '12:00' && time !== '17:30';
                        return (
                          <button
                            key={time}
                            disabled={!isAvailable}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 px-3 rounded-lg border text-sm transition-all ${
                              selectedTime === time
                                ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                                : isAvailable
                                ? 'border-dark-200 hover:border-primary-300'
                                : 'border-dark-100 bg-dark-50 text-dark-300 cursor-not-allowed line-through'
                            }`}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {step === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>填写车辆信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="车牌号码"
                        placeholder="请输入车牌号"
                        value={carInfo.plate}
                        onChange={(e) => setCarInfo({ ...carInfo, plate: e.target.value })}
                        prefix={<Car className="h-4 w-4" />}
                      />
                      <Input
                        label="车辆型号"
                        placeholder="如：大众迈腾 2021款"
                        value={carInfo.model}
                        onChange={(e) => setCarInfo({ ...carInfo, model: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="行驶里程 (公里)"
                        type="number"
                        placeholder="请输入当前里程"
                        value={carInfo.mileage}
                        onChange={(e) => setCarInfo({ ...carInfo, mileage: e.target.value })}
                      />
                      <Input
                        label="车主姓名"
                        placeholder="请输入姓名"
                        value={carInfo.customerName}
                        onChange={(e) => setCarInfo({ ...carInfo, customerName: e.target.value })}
                        prefix={<User className="h-4 w-4" />}
                      />
                    </div>
                    <Input
                      label="联系电话"
                      placeholder="请输入手机号码"
                      value={carInfo.customerPhone}
                      onChange={(e) => setCarInfo({ ...carInfo, customerPhone: e.target.value })}
                      prefix={<Phone className="h-4 w-4" />}
                    />
                    <Textarea
                      label="备注说明"
                      placeholder="请描述车辆状况或其他需要说明的事项"
                      value={carInfo.notes}
                      onChange={(e) => setCarInfo({ ...carInfo, notes: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右侧订单摘要 */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-base">预约摘要</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedServices.length > 0 ? (
                  <>
                    <div className="space-y-3 mb-4">
                      {servicesWithInfo.map((s) => (
                        <div key={s.id} className="flex justify-between text-sm">
                          <span className="text-dark-600">
                            {s.template?.name} × {s.quantity}
                          </span>
                          <span className="font-medium text-dark-900">
                            {formatCurrency((s.template?.price || 0) * s.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {selectedDate && selectedTime && (
                      <div className="py-3 border-t border-dark-100">
                        <div className="flex items-center gap-2 text-sm text-dark-600">
                          <Calendar className="h-4 w-4" />
                          {selectedDate} {selectedTime}
                        </div>
                      </div>
                    )}

                    <div className="py-3 border-t border-dark-100">
                      <div className="flex items-center justify-between">
                        <span className="text-dark-600">预计时长</span>
                        <span className="text-sm">{totalDuration} 分钟</span>
                      </div>
                    </div>

                    <div className="py-3 border-t border-dark-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-dark-600">合计</span>
                        <span className="text-2xl font-bold text-primary-600 font-display">
                          {formatCurrency(totalAmount)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-center text-dark-400 py-8">
                    请选择服务项目
                  </p>
                )}

                <div className="flex gap-3 mt-4">
                  {step > 1 && (
                    <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                      上一步
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      className="flex-1"
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && selectedServices.length === 0 || step === 2 && (!selectedDate || !selectedTime)}
                    >
                      下一步
                    </Button>
                  ) : (
                    <Button
                      className="flex-1"
                      onClick={handleSubmit}
                      disabled={!carInfo.plate || !carInfo.customerName || !carInfo.customerPhone}
                    >
                      提交预约
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
