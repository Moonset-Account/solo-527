import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/api';
import { toast } from 'sonner';
import {
  Ticket,
  Music,
  Calendar,
  Clock,
  Eye,
  CreditCard,
  XCircle,
  RefreshCw,
  ChevronRight,
  Package,
  AlertCircle,
} from 'lucide-react';
import { cn, formatMoney, formatDateTime, getOrderStatusText, getOrderStatusColor } from '@/lib/utils';
import type { Order } from '@/types';

const TABS = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待支付' },
  { id: 'paid', label: '已支付' },
  { id: 'cancelled', label: '已取消' },
  { id: 'refunded', label: '已退款' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function MyOrdersPage() {
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders', activeTab],
    queryFn: () =>
      orderApi.list({
        status: activeTab === 'all' ? undefined : activeTab,
        pageSize: 50,
      }),
  });

  const orders: Order[] = data?.list || data || [];

  const cancelOrder = useMutation({
    mutationFn: (id: number) => orderApi.cancel(id, '用户主动取消'),
    onSuccess: () => {
      toast.success('订单已取消');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '取消失败'),
  });

  const payOrder = useMutation({
    mutationFn: (id: number) => orderApi.pay(id),
    onSuccess: (res: any, variables: number) => {
      toast.success('支付成功');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      navigate({ to: `/orders/${res.id || variables}` });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '支付失败'),
  });

  const handlePay = (order: Order) => {
    if (window.confirm('确定要支付该订单吗？')) {
      payOrder.mutate(order.id);
    }
  };

  const handleCancel = (order: Order) => {
    if (window.confirm('确定要取消该订单吗？取消后无法恢复。')) {
      cancelOrder.mutate(order.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">我的订单</h1>
          <p className="text-sm text-gray-500 mt-1">查看您的所有购票记录</p>
        </div>
        <Link
          to="/concerts"
          className="btn-primary"
        >
          <Music className="w-4 h-4" />
          去购票
        </Link>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors border-b-2',
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-700 bg-primary-50/50'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-gray-100 p-5 animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-5 bg-gray-100 rounded w-40" />
                    <div className="h-5 bg-gray-100 rounded w-16" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded w-3/4 mb-3" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                    <div className="h-4 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-200" />
              <p className="text-base font-medium text-gray-600">暂无订单</p>
              <p className="text-sm text-gray-400 mt-1">
                {activeTab === 'all' ? '您还没有任何订单' : '该分类下暂无订单'}
              </p>
              <Link to="/concerts" className="inline-flex items-center gap-1.5 mt-6 btn-primary">
                <Music className="w-4 h-4" />
                去选购演出
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between px-5 py-3 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                        <Ticket className="w-3.5 h-3.5" />
                        订单号：{order.orderNo}
                      </div>
                      <span className="text-xs text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {formatDateTime(order.createdAt)}
                      </span>
                    </div>
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 md:mt-0 inline-flex w-fit',
                        getOrderStatusColor(order.status)
                      )}
                    >
                      {getOrderStatusText(order.status)}
                    </span>
                  </div>

                  <div
                    className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => navigate({ to: `/orders/${order.id}` })}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 line-clamp-1 mb-2">
                          {order.items?.[0]?.zoneName || '演出门票'}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Ticket className="w-3.5 h-3.5 text-gray-400" />
                            <span>{order.ticketCount} 张</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatMoney(order.payAmount)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{order.ticketCount} 张</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDateTime(order.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 mt-1" />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-50 bg-gray-50/30">
                    <Link
                      to={`/orders/${order.id}`}
                      className="btn-outline text-sm py-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      查看详情
                    </Link>
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleCancel(order)}
                          disabled={cancelOrder.isPending}
                          className="btn-outline text-sm py-1.5 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          取消订单
                        </button>
                        <button
                          onClick={() => handlePay(order)}
                          disabled={payOrder.isPending}
                          className="btn-primary text-sm py-1.5"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          立即支付
                        </button>
                      </>
                    )}
                    {order.status === 'paid' && (
                      <button
                        onClick={() => navigate({ to: `/orders/${order.id}` })}
                        className="btn-outline text-sm py-1.5 text-orange-600 border-orange-200 hover:bg-orange-50"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        申请退票
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
