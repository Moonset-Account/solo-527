import { useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi, refundApi } from '@/api';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Ticket,
  CreditCard,
  User,
  Phone,
  CreditCard as IdCardIcon,
  Clock,
  RefreshCw,
  XCircle,
  Check,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { OperationPanel } from '@/components/OperationPanel';
import {
  cn,
  formatMoney,
  formatDateTime,
  getOrderStatusText,
  getOrderStatusColor,
  getVerificationStatusText,
  getVerificationStatusColor,
  maskIdCard,
  maskPhone,
} from '@/lib/utils';
import type { OrderItem } from '@/types';

export default function OrderDetailPage() {
  const { id } = useParams({ from: '/orders/$id' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const orderId = parseInt(id, 10);

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState('full');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: () => orderApi.get(orderId),
    enabled: !!orderId,
  });

  const cancelOrder = useMutation({
    mutationFn: (reason?: string) => orderApi.cancel(orderId, reason),
    onSuccess: () => {
      toast.success('订单已取消');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '取消失败'),
  });

  const payOrder = useMutation({
    mutationFn: () => orderApi.pay(orderId),
    onSuccess: () => {
      toast.success('支付成功');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '支付失败'),
  });

  const submitRefund = useMutation({
    mutationFn: (data: any) => refundApi.create(data),
    onSuccess: () => {
      toast.success('退票申请已提交');
      setShowRefundModal(false);
      setRefundReason('');
      queryClient.invalidateQueries({ queryKey: ['order-detail', orderId] });
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '提交失败'),
  });

  const handleRefund = () => {
    if (!refundReason.trim()) {
      toast.warning('请填写退票原因');
      return;
    }
    submitRefund.mutate({
      orderId,
      refundReason: refundReason.trim(),
      refundType,
      refundAmount: order?.payAmount,
      serviceFee: '0.00',
      actualRefundAmount: order?.payAmount,
    });
  };

  const isLoadingAll = isLoading || !order;

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate({ to: '/my-orders' })}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回订单列表
      </button>

      {isLoadingAll ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6 animate-pulse space-y-4">
              <div className="h-8 bg-gray-100 rounded w-1/3" />
              <div className="h-5 bg-gray-100 rounded w-1/4" />
              <div className="h-px bg-gray-100 my-4" />
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-4 bg-gray-100 rounded" />
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="card p-6 animate-pulse h-48" />
            <div className="card animate-pulse h-96" />
          </div>
        </div>
      ) : order ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-purple-50">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-xl font-bold text-gray-800">订单详情</h1>
                      <span
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          getOrderStatusColor(order.status)
                        )}
                      >
                        {getOrderStatusText(order.status)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
                      <Ticket className="w-3.5 h-3.5" />
                      订单号：{order.orderNo}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">应付金额</div>
                    <div className="text-3xl font-bold text-primary-600">
                      {formatMoney(order.payAmount)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  订单信息
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">下单时间</span>
                    <span className="text-gray-800 font-medium">{formatDateTime(order.createdAt)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">购票张数</span>
                    <span className="text-gray-800 font-medium">{order.ticketCount} 张</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">订单原价</span>
                    <span className="text-gray-800">{formatMoney(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">优惠金额</span>
                    <span className="text-gray-800">-{formatMoney(order.discountAmount)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-50">
                    <span className="text-gray-500">实付金额</span>
                    <span className="text-primary-600 font-semibold">{formatMoney(order.payAmount)}</span>
                  </div>
                  {order.paidAt && (
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">支付时间</span>
                      <span className="text-gray-800">{formatDateTime(order.paidAt)}</span>
                    </div>
                  )}
                  {order.paymentMethod && (
                    <div className="flex justify-between py-2 border-b border-gray-50">
                      <span className="text-gray-500">支付方式</span>
                      <span className="text-gray-800">{order.paymentMethod}</span>
                    </div>
                  )}
                  {order.cancelledAt && (
                    <>
                      <div className="flex justify-between py-2 border-b border-gray-50">
                        <span className="text-gray-500">取消时间</span>
                        <span className="text-gray-800">{formatDateTime(order.cancelledAt)}</span>
                      </div>
                      {order.cancelledReason && (
                        <div className="flex justify-between py-2 border-b border-gray-50">
                          <span className="text-gray-500">取消原因</span>
                          <span className="text-gray-800">{order.cancelledReason}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-gray-400" />
                持票人信息
              </h3>
              <div className="space-y-4">
                {(order.items || []).map((item: OrderItem, idx: number) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-gray-50/80 border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold">
                          {idx + 1}
                        </span>
                        <span className="font-medium text-gray-800">
                          {item.zoneName || '未知区域'} · {item.seatLabel || `第${idx + 1}张票`}
                        </span>
                        {item.ticketNo && (
                          <span className="text-xs text-gray-500 font-mono">
                            ({item.ticketNo})
                          </span>
                        )}
                      </div>
                      <span className="text-lg font-bold text-primary-600">
                        {formatMoney(item.unitPrice)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">姓名</div>
                          <div className="text-gray-800 font-medium">
                            {item.ticketHolderName || '-'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <IdCardIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">身份证号</div>
                          <div className="text-gray-800 font-medium font-mono text-xs">
                            {maskIdCard(item.ticketHolderIdCard)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-3 bg-white rounded-lg">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <div>
                          <div className="text-xs text-gray-400">手机号</div>
                          <div className="text-gray-800 font-medium font-mono">
                            {maskPhone(item.ticketHolderPhone)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {(order.items || []).length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    暂无票券信息
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-400" />
                实名认证状态
              </h3>
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/80">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    order.verificationStatus === 'approved' ? 'bg-green-100' :
                    order.verificationStatus === 'rejected' ? 'bg-red-100' : 'bg-yellow-100'
                  )}>
                    {order.verificationStatus === 'approved' ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : order.verificationStatus === 'rejected' ? (
                      <XCircle className="w-5 h-5 text-red-600" />
                    ) : (
                      <Clock className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {order.userRealName || order.userName || '未知用户'}
                    </div>
                    {order.verificationNote && (
                      <div className="text-xs text-gray-500 mt-0.5">
                        备注：{order.verificationNote}
                      </div>
                    )}
                  </div>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  getVerificationStatusColor(order.verificationStatus)
                )}>
                  {getVerificationStatusText(order.verificationStatus)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-800">订单操作</h3>
              </div>
              <div className="p-5 space-y-3">
                {order.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要支付该订单吗？')) {
                          payOrder.mutate();
                        }
                      }}
                      disabled={payOrder.isPending}
                      className="w-full btn-primary py-3"
                    >
                      <CreditCard className="w-4 h-4" />
                      {payOrder.isPending ? '支付中...' : '立即支付'}
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('确定要取消该订单吗？取消后无法恢复。')) {
                          cancelOrder.mutate('用户主动取消');
                        }
                      }}
                      disabled={cancelOrder.isPending}
                      className="w-full btn-outline py-3 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4" />
                      取消订单
                    </button>
                  </>
                )}
                {order.status === 'paid' && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    className="w-full btn-outline py-3 text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    申请退票
                  </button>
                )}
                {order.status === 'cancelled' && (
                  <div className="p-4 rounded-xl bg-gray-50 text-center">
                    <XCircle className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm text-gray-500">订单已取消</p>
                  </div>
                )}
                {order.status === 'refunded' && (
                  <div className="p-4 rounded-xl bg-purple-50 text-center">
                    <RefreshCw className="w-10 h-10 mx-auto mb-2 text-purple-300" />
                    <p className="text-sm text-purple-600">订单已退款</p>
                  </div>
                )}
              </div>
            </div>

            <OperationPanel entityType="order" entityId={orderId} />
          </div>
        </div>
      ) : (
        <div className="card p-16 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">订单不存在</h3>
          <p className="text-sm text-gray-500">该订单可能已被删除或不存在</p>
          <Link to="/my-orders" className="inline-flex items-center gap-1.5 mt-6 btn-primary">
            <ArrowLeft className="w-4 h-4" />
            返回订单列表
          </Link>
        </div>
      )}

      {showRefundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => !submitRefund.isPending && setShowRefundModal(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <RefreshCw className="w-5 h-5" />
                申请退票
              </h3>
              <p className="text-sm text-white/80 mt-1">请填写退票原因</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="rounded-xl bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">订单号</span>
                  <span className="text-gray-800 font-mono">{order?.orderNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">购票张数</span>
                  <span className="text-gray-800">{order?.ticketCount} 张</span>
                </div>
                <div className="h-px bg-gray-200 my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">预计退款</span>
                  <span className="text-xl font-bold text-primary-600">
                    {formatMoney(order?.payAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  退票类型
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setRefundType('full')}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                      refundType === 'full'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <div className="font-semibold">全额退票</div>
                    <div className="text-xs mt-1 opacity-80">退还全部票款</div>
                  </button>
                  <button
                    onClick={() => setRefundType('partial')}
                    className={cn(
                      'p-3 rounded-xl border-2 text-sm font-medium transition-all text-left',
                      refundType === 'partial'
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    )}
                  >
                    <div className="font-semibold">部分退票</div>
                    <div className="text-xs mt-1 opacity-80">退部分票款</div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  退票原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="请详细说明退票原因..."
                  rows={4}
                  className="input resize-none"
                />
              </div>

              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  提交退票申请后，工作人员将在1-3个工作日内审核。退款将原路返回您的支付账户。
                </p>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button
                onClick={() => !submitRefund.isPending && setShowRefundModal(false)}
                disabled={submitRefund.isPending}
                className="flex-1 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={submitRefund.isPending || !refundReason.trim()}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg shadow-orange-500/25 hover:shadow-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitRefund.isPending ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    提交中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    提交申请
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
