import { useState } from 'react';
import {
  Car,
  Clock,
  CalendarDays,
  ChevronLeft,
  Check,
  CreditCard,
  Smartphone,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Receipt,
  MapPin,
  User,
} from 'lucide-react';
import { appointments } from '@/data/mockData';
import { PaymentMethod } from '@/types';
import type { Appointment } from '@/types';
import { cn } from '@/lib/utils';

const DEEP_BLUE = '#0F2B46';
const VIBRANT_ORANGE = '#FF6B35';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'failed';

export default function PaymentPage() {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('微信支付');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');

  const appointment: Appointment = appointments[2] || appointments[0];

  const paymentMethods = [
    {
      id: 'wechat',
      name: '微信支付',
      icon: <Smartphone className="w-6 h-6" />,
      color: '#07C160',
      value: PaymentMethod.WeChat,
    },
    {
      id: 'alipay',
      name: '支付宝',
      icon: <CreditCard className="w-6 h-6" />,
      color: '#1677FF',
      value: PaymentMethod.Alipay,
    },
  ];

  const handlePayment = () => {
    setPaymentStatus('processing');
    setTimeout(() => {
      setPaymentStatus('success');
    }, 2000);
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (paymentStatus === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: '#22C55E20' }}
          >
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">支付成功</h1>
          <p className="text-gray-500 mb-6">您的订单已支付成功，请按时到店享受服务</p>

          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">订单编号</span>
              <span className="text-gray-900 font-medium text-sm">
                {appointment.appointmentNo}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">服务项目</span>
              <span className="text-gray-900 font-medium text-sm">
                {appointment.servicePackage?.name}
              </span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-500 text-sm">预约时间</span>
              <span className="text-gray-900 font-medium text-sm">
                {formatDate(appointment.appointmentDate)} {appointment.startTime}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 text-sm">支付金额</span>
              <span className="text-xl font-bold" style={{ color: VIBRANT_ORANGE }}>
                ¥{appointment.estimatedPrice}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              返回首页
            </button>
            <button
              className="flex-1 py-3 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: DEEP_BLUE }}
            >
              查看订单
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div
            className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center"
            style={{ backgroundColor: '#EF444420' }}
          >
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">支付失败</h1>
          <p className="text-gray-500 mb-6">支付过程中出现问题，请重新尝试或选择其他支付方式</p>

          <button
            onClick={() => setPaymentStatus('idle')}
            className="w-full py-3 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: VIBRANT_ORANGE }}
          >
            重新支付
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center">
          <button className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold ml-2" style={{ color: DEEP_BLUE }}>
            订单支付
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Order Summary Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6" style={{ backgroundColor: DEEP_BLUE }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {appointment.servicePackage?.name}
                </h2>
                <p className="text-sm text-gray-300">
                  订单号：{appointment.appointmentNo}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">预约日期</span>
              <span className="ml-auto font-medium text-gray-900">
                {formatDate(appointment.appointmentDate)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">预约时段</span>
              <span className="ml-auto font-medium text-gray-900">
                {appointment.startTime} - {appointment.endTime}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">车辆信息</span>
              <span className="ml-auto font-medium text-gray-900">
                {appointment.vehicle?.plateNumber} · {appointment.vehicle?.brand}{appointment.vehicle?.model}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">客户姓名</span>
              <span className="ml-auto font-medium text-gray-900">
                {appointment.customer?.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">服务门店</span>
              <span className="ml-auto font-medium text-gray-900">
                靓车坊·朝阳店
              </span>
            </div>
          </div>
        </div>

        {/* Price Detail */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" style={{ color: VIBRANT_ORANGE }} />
            价格明细
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">服务原价</span>
              <span className="text-gray-900">
                ¥{appointment.servicePackage?.price}
              </span>
            </div>
            {appointment.servicePackage?.discountPrice && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500">优惠折扣</span>
                <span style={{ color: VIBRANT_ORANGE }}>
                  -¥{(appointment.servicePackage.price - appointment.servicePackage.discountPrice).toFixed(1)}
                </span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
              <span className="font-medium text-gray-900">应付金额</span>
              <span className="text-2xl font-bold" style={{ color: VIBRANT_ORANGE }}>
                ¥{appointment.estimatedPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">选择支付方式</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.value)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200',
                  selectedMethod === method.value
                    ? 'border-opacity-100'
                    : 'border-gray-100 hover:border-gray-200'
                )}
                style={{
                  borderColor: selectedMethod === method.value ? VIBRANT_ORANGE : undefined,
                  backgroundColor: selectedMethod === method.value ? `${VIBRANT_ORANGE}05` : 'white',
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${method.color}15` }}
                >
                  <div style={{ color: method.color }}>
                    {method.icon}
                  </div>
                </div>
                <span className="font-medium text-gray-900">{method.name}</span>
                <div className="ml-auto">
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
                      selectedMethod === method.value
                        ? 'border-transparent'
                        : 'border-gray-300'
                    )}
                    style={{
                      backgroundColor: selectedMethod === method.value ? VIBRANT_ORANGE : 'transparent',
                    }}
                  >
                    {selectedMethod === method.value && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Security Note */}
        <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
          <ShieldCheck className="w-4 h-4" />
          <span>支付安全由银联提供保障，您的支付信息将被加密处理</span>
        </div>
      </div>

      {/* Bottom Payment Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">应付金额</p>
            <p className="text-2xl font-bold" style={{ color: VIBRANT_ORANGE }}>
              ¥{appointment.estimatedPrice}
            </p>
          </div>
          <button
            onClick={handlePayment}
            disabled={paymentStatus === 'processing'}
            className={cn(
              'px-10 py-3.5 rounded-xl font-medium text-white transition-all duration-200 flex items-center gap-2',
              paymentStatus === 'processing'
                ? 'bg-gray-400 cursor-not-allowed'
                : 'shadow-lg hover:shadow-xl'
            )}
            style={{
              backgroundColor: paymentStatus === 'processing' ? undefined : VIBRANT_ORANGE,
            }}
          >
            {paymentStatus === 'processing' ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                支付中...
              </>
            ) : (
              <>
                确认支付
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
