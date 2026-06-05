'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Ticket,
  Calendar,
  MapPin,
  User,
  CreditCard,
  QrCode,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface TicketItem {
  id: string;
  seat: {
    rowLabel: string;
    seatNumber: number;
    tier: {
      name: string;
      price: string;
    };
  };
  isCheckedIn: boolean;
  checkedInAt: string | null;
}

interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  paidAt: string | null;
  user: {
    name: string;
    email: string;
  };
  show: {
    startTime: string;
    production: {
      title: string;
    };
    venue: {
      name: string;
    };
  };
  tickets: TicketItem[];
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/v1/orders/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      }
    } catch (error) {
      console.error('Failed to fetch order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(`/api/v1/orders/${params.id}/pay`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchOrder();
      }
    } catch (error) {
      console.error('Failed to pay order:', error);
    } finally {
      setPaying(false);
    }
  };

  const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
    PENDING: {
      label: '待支付',
      className: 'bg-yellow-100 text-yellow-700',
      icon: Clock,
    },
    PAID: {
      label: '已支付',
      className: 'bg-green-100 text-green-700',
      icon: CheckCircle,
    },
    CANCELLED: {
      label: '已取消',
      className: 'bg-red-100 text-red-700',
      icon: XCircle,
    },
    REFUNDED: {
      label: '已退款',
      className: 'bg-gray-100 text-gray-500',
      icon: XCircle,
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">订单不存在</h3>
        <Link href="/tickets/orders" className="text-primary hover:underline">
          返回我的订单
        </Link>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.PENDING;
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/tickets/orders"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            订单详情
          </h1>
          <p className="text-gray-500 mt-1">订单号：{order.orderNo}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {order.show.production.title}
                  </h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(order.show.startTime, 'yyyy-MM-dd HH:mm')}
                    </span>
                    <span className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      {order.show.venue.name}
                    </span>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${status.className}`}
                >
                  <StatusIcon className="h-4 w-4 mr-1.5" />
                  {status.label}
                </span>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                座位信息 ({order.tickets.length} 张)
              </h3>
              <div className="space-y-3">
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Ticket className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {ticket.seat.rowLabel}排 {ticket.seat.seatNumber} 座
                        </p>
                        <p className="text-sm text-gray-500">
                          {ticket.seat.tier.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(ticket.seat.tier.price)}
                      </p>
                      {ticket.isCheckedIn ? (
                        <span className="text-xs text-green-600 flex items-center justify-end">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          已验票
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">未验票</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-5 w-5 mr-2 text-gray-400" />
              购票人信息
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">姓名</p>
                <p className="font-medium text-gray-900">{order.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">邮箱</p>
                <p className="font-medium text-gray-900">{order.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">下单时间</p>
                <p className="font-medium text-gray-900">
                  {formatDate(order.createdAt, 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">支付时间</p>
                <p className="font-medium text-gray-900">
                  {order.paidAt
                    ? formatDate(order.paidAt, 'yyyy-MM-dd HH:mm:ss')
                    : '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-6">
            <h3 className="font-semibold text-gray-900 mb-4">订单金额</h3>
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">票价合计</span>
                <span className="text-gray-900">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">服务费</span>
                <span className="text-gray-900">免费</span>
              </div>
              <div className="border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">应付金额</span>
                  <span className="text-2xl font-bold text-primary">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {order.status === 'PENDING' && (
              <button
                onClick={handlePay}
                disabled={paying}
                className="w-full btn-primary flex items-center justify-center space-x-2 mb-3 disabled:opacity-50"
              >
                <CreditCard className="h-5 w-5" />
                <span>{paying ? '支付中...' : '立即支付'}</span>
              </button>
            )}

            {order.status === 'PAID' && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">支付成功</p>
                  <p className="text-sm text-green-600 mt-1">
                    请提前 30 分钟到场验票
                  </p>
                </div>
                <Link
                  href={`/tickets/scan?orderId=${order.id}`}
                  className="w-full btn-secondary flex items-center justify-center space-x-2"
                >
                  <QrCode className="h-5 w-5" />
                  <span>查看验票码</span>
                </Link>
              </div>
            )}

            {order.status === 'CANCELLED' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700 font-medium">订单已取消</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
