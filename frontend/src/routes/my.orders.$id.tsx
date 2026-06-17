import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Package, QrCode, Clock, CheckCircle, MapPin } from 'lucide-react';
import type { ExchangeOrder } from '@shared/types';
import { formatDate, getStatusColor, getStatusText } from '@/utils';

export const Route = createFileRoute('/my/orders/$id')({
  component: OrderDetailPage,
});

function OrderDetailPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<ExchangeOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    try {
      const data = await api.get<ExchangeOrder>(`/orders/${id}`);
      setOrder(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-32 mb-6" />
        <div className="bg-white rounded-2xl p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-xl mt-6" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">订单不存在</p>
      </div>
    );
  }

  const product = (order as any).product;
  const member = (order as any).member;

  const statusSteps = [
    { key: 'pending', label: '待核销', icon: Clock },
    { key: 'redeemed', label: '已核销', icon: CheckCircle },
  ];

  const currentStep = order.status === 'redeemed' ? 1 : 0;

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-6">订单详情</h2>

      <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-6 text-white">
          <div className="flex items-center gap-3">
            {order.status === 'redeemed' ? (
              <CheckCircle className="w-8 h-8" />
            ) : (
              <Clock className="w-8 h-8" />
            )}
            <div>
              <h3 className="text-lg font-semibold">{getStatusText(order.status)}</h3>
              <p className="text-brand-100 text-sm">
                订单号：{order.orderNo}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-center mb-8">
            <div className="flex items-center">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index <= currentStep;
                return (
                  <div key={step.key} className="flex items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isActive ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div className={`w-20 h-1 mx-2 rounded ${
                        index < currentStep ? 'bg-brand-500' : 'bg-gray-100'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {order.redeemCode && order.status === 'pending' && (
            <div className="text-center p-6 bg-cream-50 rounded-2xl mb-6">
              <QrCode className="w-16 h-16 mx-auto text-brand-500 mb-3" />
              <p className="text-sm text-gray-500 mb-2">核销码</p>
              <p className="text-3xl font-bold text-brand-600 tracking-widest">
                {order.redeemCode}
              </p>
              <p className="text-xs text-gray-400 mt-3">
                请前往门店出示此核销码进行兑换
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
            <div className="w-20 h-20 rounded-xl bg-white overflow-hidden shrink-0 border border-gray-100">
              {product?.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Package className="w-8 h-8" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-800">{product?.name || '商品'}</h4>
              <p className="text-sm text-gray-500 mt-1">数量：{order.quantity}</p>
              <p className="text-brand-600 font-semibold mt-2">
                {order.totalPoints} 积分
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">订单编号</span>
              <span className="text-gray-800 font-mono">{order.orderNo}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">下单时间</span>
              <span className="text-gray-800">{formatDate(order.createdAt)}</span>
            </div>
            {order.redeemedAt && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">核销时间</span>
                <span className="text-gray-800">{formatDate(order.redeemedAt)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">订单状态</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
