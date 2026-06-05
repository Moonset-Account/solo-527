import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { Ticket, Calendar, MapPin, QrCode } from 'lucide-react';
import { formatDate, formatCurrency } from '@/lib/utils';

export default async function OrdersPage() {
  const session = await auth();
  if (!session) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      show: {
        include: {
          production: true,
          venue: true,
        },
      },
      tickets: {
        include: {
          seat: {
            include: {
              tier: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: '待支付', className: 'bg-yellow-100 text-yellow-700' },
    PAID: { label: '已支付', className: 'bg-green-100 text-green-700' },
    CANCELLED: {
      label: '已取消',
      className: 'bg-gray-100 text-gray-500',
    },
    REFUNDED: {
      label: '已退款',
      className: 'bg-red-100 text-red-700',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-gray-900">
          我的订单
        </h1>
        <p className="text-gray-500 mt-1">查看您的所有购票订单</p>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {order.show.production.title}
                  </h3>
                  <div className="flex items-center space-x-4 mt-2 text-gray-500 text-sm">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {formatDate(order.show.startTime, 'yyyy-MM-dd HH:mm')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{order.show.venue.name}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(order.totalAmount.toString())}
                  </p>
                  <span
                    className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                      statusConfig[order.status]?.className
                    }`}
                  >
                    {statusConfig[order.status]?.label}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-2">
                订单号: {order.orderNo}
              </p>
            </div>

            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-500 mb-3">座位信息</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {order.tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="bg-gray-50 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {ticket.seat.rowLabel}排 {ticket.seat.seatNumber}号
                      </p>
                      <p className="text-sm text-gray-500">
                        {ticket.seat.tier.name}
                      </p>
                    </div>
                    {ticket.isCheckedIn ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        已验票
                      </span>
                    ) : order.status === 'PAID' ? (
                      <QrCode className="h-6 w-6 text-primary" />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl">
            <Ticket className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              暂无订单
            </h3>
            <p className="text-gray-500 mb-4">
              去看看有什么精彩演出吧
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
