import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { api } from '@/utils/api';
import { Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { ExchangeOrder, PaginatedResponse } from '@shared/types';
import { formatDate, getStatusColor, getStatusText } from '@/utils';

export const Route = createFileRoute('/my/orders')({
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const [orders, setOrders] = useState<ExchangeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;

  const tabs = [
    { value: '', label: '全部' },
    { value: 'pending', label: '待核销' },
    { value: 'redeemed', label: '已核销' },
    { value: 'cancelled', label: '已取消' },
  ];

  useEffect(() => {
    fetchOrders();
  }, [page, status]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<ExchangeOrder>>('/orders/mine', {
        page,
        pageSize,
        status: status || undefined,
      });
      setOrders(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="animate-fadeIn">
      <h2 className="text-xl font-bold text-gray-800 mb-4">兑换记录</h2>

      <div className="bg-white rounded-2xl shadow-soft">
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatus(tab.value); setPage(1); }}
              className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                status === tab.value
                  ? 'text-brand-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {status === tab.value && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-brand-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">暂无兑换记录</p>
            <Link
              to="/products"
              className="inline-block mt-4 px-6 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
            >
              去兑换
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {orders.map((order, index) => (
              <Link
                key={order.id}
                to="/my/orders/$id"
                params={{ id: order.id }}
                className="block p-5 hover:bg-gray-50 transition-colors animate-fadeInUp"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-xl bg-cream-100 overflow-hidden shrink-0">
                    {(order as any).product?.imageUrl ? (
                      <img
                        src={(order as any).product?.imageUrl}
                        alt={(order as any).product?.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-cream-300">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-medium text-gray-800 line-clamp-1">
                        {(order as any).product?.name || '商品'}
                      </h3>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500 mt-1">
                      数量：{order.quantity}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <div className="text-brand-600 font-semibold">
                        {order.totalPoints} 积分
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 py-6 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
