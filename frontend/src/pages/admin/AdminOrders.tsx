import { useState, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { concertApi, orderApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  ClipboardList,
  Search,
  Filter,
  Eye,
  CreditCard,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCw,
  Ticket,
  User,
  Calendar,
  X,
} from 'lucide-react';
import {
  cn,
  formatMoney,
  formatDateTime,
  getOrderStatusText,
  getOrderStatusColor,
  getVerificationStatusText,
  getVerificationStatusColor,
} from '@/lib/utils';
import type { Order, Show } from '@/types';

const STATUS_TABS = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待支付' },
  { id: 'paid', label: '已支付' },
  { id: 'verified', label: '已审核' },
  { id: 'cancelled', label: '已取消' },
  { id: 'refunded', label: '已退款' },
] as const;

type StatusTabId = (typeof STATUS_TABS)[number]['id'];

export default function AdminOrders() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeStatus, setActiveStatus] = useState<StatusTabId>('all');
  const [searchText, setSearchText] = useState('');
  const [showId, setShowId] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [detailOrder, setDetailOrder] = useState<Order | null>(null);
  const [verifyModal, setVerifyModal] = useState<{
    order: Order;
    type: 'approve' | 'reject' | 'pay';
  } | null>(null);
  const [verifyNote, setVerifyNote] = useState('');

  const { data: showsData } = useQuery({
    queryKey: ['admin-orders-shows'],
    queryFn: () => concertApi.showList({ pageSize: 100 }),
  });

  const shows: Show[] = showsData?.list || showsData || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-orders', activeStatus, showId, searchText, page],
    queryFn: () =>
      orderApi.list({
        status: activeStatus === 'all' ? undefined : activeStatus,
        showId: showId === 'all' ? undefined : showId,
        keyword: searchText || undefined,
        page,
        pageSize,
      }),
  });

  const orders: Order[] = data?.list || data || [];
  const total = data?.total || orders.length;
  const totalPages = Math.ceil(total / pageSize);

  const markPaidMutation = useMutation({
    mutationFn: (id: number) => orderApi.pay(id),
    onSuccess: () => {
      toast.success('已标记为已支付');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setVerifyModal(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: number; status: 'approved' | 'rejected'; note?: string }) =>
      orderApi.verify(id, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'approved' ? '审核通过' : '已驳回');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setVerifyModal(null);
      setVerifyNote('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const handleVerifyConfirm = () => {
    if (!verifyModal) return;
    if (verifyModal.type === 'pay') {
      markPaidMutation.mutate(verifyModal.order.id);
    } else {
      verifyMutation.mutate({
        id: verifyModal.order.id,
        status: verifyModal.type === 'approve' ? 'approved' : 'rejected',
        note: verifyNote || undefined,
      });
    }
  };

  const handleRowClick = (order: Order) => {
    navigate({ to: `/orders/${order.id}` });
  };

  const isSubmitting = markPaidMutation.isPending || verifyMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary-600" />
            订单管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">查看和处理所有订单信息</p>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-outline"
        >
          <RotateCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号、姓名、手机号、邮箱..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                className="input pl-9"
              />
            </div>
            <div className="relative">
              <select
                value={showId}
                onChange={(e) => {
                  setShowId(e.target.value === 'all' ? 'all' : Number(e.target.value));
                  setPage(1);
                }}
                className="input appearance-none pr-9 min-w-48"
              >
                <option value="all">全部场次</option>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.concertTitle} - {dayjs(s.showDate).format('MM-DD')} {s.startTime}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <button className="btn-outline">
              <Filter className="w-4 h-4" />
              高级筛选
            </button>
          </div>

          <div className="flex gap-1 overflow-x-auto pb-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveStatus(tab.id);
                  setPage(1);
                }}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeStatus === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>用户</th>
                <th>场次</th>
                <th>票数</th>
                <th>金额</th>
                <th>订单状态</th>
                <th>实名审核</th>
                <th>下单时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="py-16 text-center">
                      <ClipboardList className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无订单数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => handleRowClick(order)}
                    className="cursor-pointer"
                  >
                    <td>
                      <div className="flex items-center gap-1.5 font-mono text-xs text-gray-700">
                        <Ticket className="w-3.5 h-3.5 text-gray-400" />
                        {order.orderNo}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                          {(order.userName || order.userRealName || 'U')[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-800 line-clamp-1">
                            {order.userName || order.userRealName || '-'}
                          </div>
                          <div className="text-xs text-gray-500 line-clamp-1">
                            {order.userPhone || order.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="max-w-40">
                        <div className="text-sm text-gray-800 line-clamp-1 font-medium">
                          {order.items?.[0]?.zoneName || '演出票'}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDateTime(order.createdAt)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm font-medium text-gray-700">{order.ticketCount} 张</span>
                    </td>
                    <td>
                      <span className="text-sm font-bold text-gray-800">{formatMoney(order.payAmount)}</span>
                    </td>
                    <td>
                      <span className={cn('badge', getOrderStatusColor(order.status))}>
                        {getOrderStatusText(order.status)}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', getVerificationStatusColor(order.verificationStatus))}>
                        {getVerificationStatusText(order.verificationStatus)}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </span>
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate({ to: `/orders/${order.id}` })}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {order.status === 'pending' && (
                          <button
                            onClick={() =>
                              setVerifyModal({ order, type: 'pay' })
                            }
                            className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="标记支付"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        {order.status === 'paid' && order.verificationStatus === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                setVerifyModal({ order, type: 'approve' })
                              }
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="审核通过"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setVerifyModal({ order, type: 'reject' })
                              }
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                              title="审核驳回"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              共 <span className="font-medium text-gray-700">{total}</span> 条，
              第 <span className="font-medium text-gray-700">{page}</span> / {totalPages} 页
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-outline !py-1.5 !px-3 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) })
                .map((_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        '!py-1.5 !px-3 text-sm rounded-lg font-medium transition-all',
                        page === pageNum
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-outline !py-1.5 !px-3 text-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {verifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setVerifyModal(null);
              setVerifyNote('');
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {verifyModal.type === 'pay'
                  ? '标记为已支付'
                  : verifyModal.type === 'approve'
                  ? '审核通过'
                  : '审核驳回'}
              </h3>
              <button
                onClick={() => {
                  setVerifyModal(null);
                  setVerifyNote('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">订单号</span>
                  <span className="font-mono font-medium text-gray-800">{verifyModal.order.orderNo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">用户</span>
                  <span className="font-medium text-gray-800">
                    {verifyModal.order.userName || verifyModal.order.userRealName || '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">支付金额</span>
                  <span className="font-bold text-gray-800">{formatMoney(verifyModal.order.payAmount)}</span>
                </div>
              </div>

              {verifyModal.type !== 'pay' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    审核意见
                    <span className="text-gray-400 font-normal ml-1">（可选）</span>
                  </label>
                  <textarea
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    placeholder={
                      verifyModal.type === 'approve'
                        ? '请输入审核通过说明...'
                        : '请输入驳回原因...'
                    }
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              )}

              {verifyModal.type === 'reject' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <div className="font-medium mb-0.5">注意事项</div>
                  <div>驳回后订单状态将变更，用户将收到通知。请明确填写驳回原因以便用户后续处理。</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setVerifyModal(null);
                  setVerifyNote('');
                }}
                className="btn-outline"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleVerifyConfirm}
                disabled={isSubmitting}
                className={cn(
                  'btn',
                  verifyModal.type === 'reject'
                    ? 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                )}
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : verifyModal.type === 'pay' ? (
                  '确认标记支付'
                ) : verifyModal.type === 'approve' ? (
                  '确认通过'
                ) : (
                  '确认驳回'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
