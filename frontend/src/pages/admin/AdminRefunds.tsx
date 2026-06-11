import { useState, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { refundApi, attendanceApi, concertApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  RefreshCw,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Ticket,
  DollarSign,
  User,
  Clock,
  X,
  RotateCw,
  Calendar,
  Users,
  MapPin,
  CheckCheck,
  Send,
  FileText,
  LayoutGrid,
} from 'lucide-react';
import {
  cn,
  formatMoney,
  formatDateTime,
  getRefundStatusText,
  getRefundStatusColor,
  maskPhone,
} from '@/lib/utils';
import type { Refund, Show, AttendanceRecord } from '@/types';

const MAIN_TABS = [
  { id: 'refunds', label: '退款申请', icon: RefreshCw },
  { id: 'shows', label: '按场次座位', icon: LayoutGrid },
  { id: 'attendance', label: '到场反馈', icon: Users },
] as const;

type MainTabId = (typeof MAIN_TABS)[number]['id'];

export default function AdminRefunds() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<MainTabId>('refunds');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [detailRefund, setDetailRefund] = useState<Refund | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    refund: Refund;
    type: 'approve' | 'reject' | 'abnormal';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [abnormalReason, setAbnormalReason] = useState('');

  const { data: refundsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-refunds', searchText, statusFilter, page],
    queryFn: () =>
      refundApi.list({
        keyword: searchText || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
        page,
        pageSize,
      }),
    enabled: activeTab === 'refunds',
  });

  const { data: showsData, isLoading: showsLoading } = useQuery({
    queryKey: ['admin-refunds-shows'],
    queryFn: () => concertApi.showList({ pageSize: 50 }),
    enabled: activeTab === 'shows',
  });

  const { data: attendanceData, isLoading: attendanceLoading, refetch: refetchAttendance } = useQuery({
    queryKey: ['admin-refunds-attendance'],
    queryFn: () => attendanceApi.list({ pageSize: 100 }),
    enabled: activeTab === 'attendance',
  });

  const refunds: Refund[] = refundsData?.list || refundsData || [];
  const total = refundsData?.total || refunds.length;
  const totalPages = Math.ceil(total / pageSize);
  const shows: Show[] = showsData?.list || showsData || [];
  const attendanceRecords: AttendanceRecord[] = attendanceData?.list || attendanceData || [];

  const stats = useMemo(() => {
    const all = refundsData?.list || refundsData || [];
    return {
      total: all.length,
      pending: all.filter((r: any) => r.status === 'pending').length,
      processing: all.filter((r: any) => ['reviewing', 'approved'].includes(r.status)).length,
      completed: all.filter((r: any) => r.status === 'completed').length,
      abnormal: all.filter((r: any) => r.status === 'abnormal' || r.isAbnormal).length,
    };
  }, [refundsData, refunds]);

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        status: 'approved' | 'rejected' | 'abnormal';
        note?: string;
        abnormalReason?: string;
      };
    }) => refundApi.review(id, data),
    onSuccess: (_, vars) => {
      const messages: Record<string, string> = {
        approved: '退款已批准',
        rejected: '退款已驳回',
        abnormal: '已标记为异常',
      };
      toast.success(messages[vars.data.status] || '操作成功');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setReviewModal(null);
      setReviewNote('');
      setAbnormalReason('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const processMutation = useMutation({
    mutationFn: (id: number) => refundApi.process(id),
    onSuccess: () => {
      toast.success('退款处理完成');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      setDetailRefund(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '处理失败'),
  });

  const syncAttendanceMutation = useMutation({
    mutationFn: (showId: number) => concertApi.syncShowStats(showId),
    onSuccess: () => {
      toast.success('已同步场次统计数据');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds-shows'] });
      queryClient.invalidateQueries({ queryKey: ['admin-refunds-attendance'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '同步失败'),
  });

  const handleReviewConfirm = () => {
    if (!reviewModal) return;
    const statusMap = {
      approve: 'approved',
      reject: 'rejected',
      abnormal: 'abnormal',
    } as const;

    reviewMutation.mutate({
      id: reviewModal.refund.id,
      data: {
        status: statusMap[reviewModal.type],
        note: reviewNote || undefined,
        abnormalReason: reviewModal.type === 'abnormal' ? abnormalReason || undefined : undefined,
      },
    });
  };

  const isSubmitting = reviewMutation.isPending || processMutation.isPending;

  const renderRefundsTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '全部退款', value: stats.total, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '待审核', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '处理中', value: stats.processing, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: '已完成', value: stats.completed, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '异常', value: stats.abnormal, color: 'text-rose-600', bg: 'bg-rose-50' },
        ].map((s, idx) => (
          <div key={idx} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-gray-500">{s.label}</div>
                <div className={cn('text-2xl font-bold mt-1', s.color)}>{s.value}</div>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', s.bg)}>
                {idx === 0 && <RefreshCw className={cn('w-5 h-5', s.color)} />}
                {idx === 1 && <Clock className={cn('w-5 h-5', s.color)} />}
                {idx === 2 && <Send className={cn('w-5 h-5', s.color)} />}
                {idx === 3 && <CheckCheck className={cn('w-5 h-5', s.color)} />}
                {idx === 4 && <AlertTriangle className={cn('w-5 h-5', s.color)} />}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative max-w-md flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索退款单号、订单号、用户姓名..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(1);
                  }}
                  className="input pl-9"
                />
              </div>
              <div className="flex gap-1">
                {[
                  { id: 'all', label: '全部状态' },
                  { id: 'pending', label: '待审核' },
                  { id: 'reviewing', label: '审核中' },
                  { id: 'approved', label: '已批准' },
                  { id: 'rejected', label: '已驳回' },
                  { id: 'completed', label: '已完成' },
                  { id: 'abnormal', label: '异常' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setStatusFilter(s.id);
                      setPage(1);
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                      statusFilter === s.id
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => refetch()} className="btn-outline !py-1.5 text-sm">
              <RotateCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>退款单号</th>
                <th>关联订单</th>
                <th>用户</th>
                <th>退款金额</th>
                <th>退款原因</th>
                <th>状态</th>
                <th>提交时间</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : refunds.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className="py-16 text-center">
                      <RefreshCw className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无退款数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                refunds.map((refund) => {
                  const isAbnormal = refund.isAbnormal || refund.status === 'abnormal';
                  return (
                    <tr
                      key={refund.id}
                      className={cn(isAbnormal && 'bg-rose-50/30')}
                    >
                      <td>
                        <div className="flex items-center gap-2">
                          {isAbnormal && (
                            <span className="relative group">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                                异常退款
                              </span>
                            </span>
                          )}
                          <span
                            className={cn(
                              'font-mono text-xs',
                              isAbnormal ? 'text-rose-700 font-semibold' : 'text-gray-700'
                            )}
                          >
                            {refund.refundNo}
                          </span>
                        </div>
                      </td>
                      <td>
                        {refund.orderId && (
                          <Link
                            to={`/orders/${refund.orderId}`}
                            className="flex items-center gap-1.5 font-mono text-xs text-primary-600 hover:text-primary-700 hover:underline"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                            {refund.orderNo || `#${refund.orderId}`}
                          </Link>
                        )}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                            {(refund.userName || 'U')[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-800 line-clamp-1">
                              {refund.userName}
                            </div>
                            {refund.userPhone && (
                              <div className="text-xs text-gray-500">{maskPhone(refund.userPhone)}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="space-y-0.5">
                          <div className="text-sm font-bold text-gray-800">
                            {formatMoney(refund.actualRefundAmount || refund.refundAmount)}
                          </div>
                          {refund.serviceFee && parseFloat(refund.serviceFee) > 0 && (
                            <div className="text-xs text-gray-400">
                              含手续费 {formatMoney(refund.serviceFee)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div
                          className={cn(
                            'text-sm line-clamp-2 max-w-48',
                            isAbnormal ? 'text-rose-700' : 'text-gray-600'
                          )}
                        >
                          {refund.refundReason}
                        </div>
                        {isAbnormal && refund.abnormalReason && (
                          <div className="text-xs text-rose-600 mt-0.5 line-clamp-1">
                            异常：{refund.abnormalReason}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            isAbnormal
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : getRefundStatusColor(refund.status)
                          )}
                        >
                          {isAbnormal ? '异常' : getRefundStatusText(refund.status)}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDateTime(refund.submittedAt)}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setDetailRefund(refund)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(refund.status === 'pending' || refund.status === 'reviewing') &&
                            !isAbnormal && (
                              <>
                                <button
                                  onClick={() =>
                                    setReviewModal({ refund, type: 'approve' })
                                  }
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                                  title="审核通过"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setReviewModal({ refund, type: 'reject' })
                                  }
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                                  title="审核驳回"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setReviewModal({ refund, type: 'abnormal' })
                                  }
                                  disabled={isSubmitting}
                                  className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors"
                                  title="标记异常"
                                >
                                  <AlertTriangle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          {refund.status === 'approved' && !isAbnormal && (
                            <button
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `确认处理退款 ${refund.refundNo}？金额 ${formatMoney(
                                      refund.actualRefundAmount || refund.refundAmount
                                    )}`
                                  )
                                ) {
                                  processMutation.mutate(refund.id);
                                }
                              }}
                              disabled={processMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 transition-colors"
                              title="执行退款"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
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
    </div>
  );

  const renderShowsTab = () => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-600" />
            场次座位退款统计
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">按场次查看退款情况</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        {showsLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : shows.length === 0 ? (
          <div className="py-16 text-center">
            <Calendar className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-500">暂无场次数据</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>场次</th>
                <th>日期时间</th>
                <th>场馆</th>
                <th>总座位</th>
                <th>已售</th>
                <th>已退款</th>
                <th>退款率</th>
                <th>状态</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {shows.map((show) => {
                const totalSeats = show.zones?.reduce((s, z) => s + z.totalSeats, 0) || 0;
                const soldSeats = show.zones?.reduce((s, z) => s + z.soldSeats, 0) || 0;
                const refundedSeats = show.zones?.reduce((s, z) => s + (z.totalSeats - z.availableSeats - z.soldSeats), 0) || 0;
                const refundRate = soldSeats > 0 ? Math.round((refundedSeats / soldSeats) * 100) : 0;
                return (
                  <tr key={show.id}>
                    <td>
                      <div className="font-medium text-gray-800 line-clamp-1 max-w-56">
                        {show.concertTitle}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {show.artist}
                      </div>
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="text-sm text-gray-700">
                        {dayjs(show.showDate).format('YYYY-MM-DD')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {show.startTime} - {show.endTime}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-start gap-1.5 max-w-40">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-600 line-clamp-2">
                          {show.venueName || '-'}
                        </span>
                      </div>
                    </td>
                    <td className="text-sm font-medium text-gray-700">{totalSeats}</td>
                    <td className="text-sm font-medium text-blue-600">{soldSeats}</td>
                    <td className="text-sm font-medium text-amber-600">{refundedSeats}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              refundRate >= 20
                                ? 'bg-rose-500'
                                : refundRate >= 10
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            )}
                            style={{ width: `${Math.min(refundRate, 100)}%` }}
                          />
                        </div>
                        <span
                          className={cn(
                            'text-xs font-medium w-10',
                            refundRate >= 20
                              ? 'text-rose-600'
                              : refundRate >= 10
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          )}
                        >
                          {refundRate}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={cn(
                          'badge',
                          show.status === 'on_sale'
                            ? 'bg-green-100 text-green-700'
                            : show.status === 'upcoming'
                            ? 'bg-blue-100 text-blue-700'
                            : show.status === 'ended'
                            ? 'bg-gray-100 text-gray-600'
                            : 'bg-red-100 text-red-700'
                        )}
                      >
                        {show.status === 'on_sale'
                          ? '售票中'
                          : show.status === 'upcoming'
                          ? '即将开售'
                          : show.status === 'ended'
                          ? '已结束'
                          : '已取消'}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => syncAttendanceMutation.mutate(show.id)}
                          disabled={syncAttendanceMutation.isPending}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          <RotateCw className={cn('w-4 h-4', syncAttendanceMutation.isPending && 'animate-spin')} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderAttendanceTab = () => (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h3 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-600" />
            到场反馈记录
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">查看用户到场签到及评价反馈</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-gray-500">
            共 <span className="font-semibold text-gray-700">{attendanceRecords.length}</span> 条记录
          </div>
          <button
            onClick={() => refetchAttendance()}
            className="btn-outline !py-1.5 text-sm"
          >
            <RotateCw className="w-4 h-4" />
            同步
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        {attendanceLoading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-gray-50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-14 h-14 mx-auto mb-3 text-gray-200" />
            <p className="text-sm text-gray-500">暂无到场记录</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>用户</th>
                <th>场次ID</th>
                <th>座位</th>
                <th>扫描方式</th>
                <th>是否到场</th>
                <th>扫描时间</th>
                <th>评价</th>
                <th>反馈</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.slice(0, 50).map((record) => (
                <tr key={record.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                        {(record.userName || 'U')[0]}
                      </div>
                      <div className="text-sm text-gray-700">{record.userName || '-'}</div>
                    </div>
                  </td>
                  <td>
                    <span className="font-mono text-xs text-gray-600">#{record.showId}</span>
                  </td>
                  <td>
                    <span className="text-sm text-gray-700">
                      {record.seatId ? `座位 #${record.seatId}` : '-'}
                    </span>
                  </td>
                  <td>
                    <span className="badge bg-blue-50 text-blue-700">
                      {record.scanType === 'manual' ? '人工' : record.scanType === 'qrcode' ? '扫码' : record.scanType}
                    </span>
                  </td>
                  <td>
                    {record.hasAttended ? (
                      <span className="badge bg-emerald-100 text-emerald-700 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="w-3 h-3" />
                        已到场
                      </span>
                    ) : (
                      <span className="badge bg-gray-100 text-gray-600">未到场</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(record.scannedAt)}
                    </span>
                  </td>
                  <td>
                    {record.feedbackScore ? (
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'text-sm',
                              i < Math.round(record.feedbackScore!)
                                ? 'text-amber-400'
                                : 'text-gray-200'
                            )}
                          >
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{record.feedbackScore}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td>
                    {record.feedbackComment ? (
                      <div className="max-w-48 text-sm text-gray-600 line-clamp-2">
                        {record.feedbackComment}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">无反馈</span>
                    )}
                    {record.feedbackSubmittedAt && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(record.feedbackSubmittedAt)}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary-600" />
            退款处理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理退款申请、场次统计和到场反馈</p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {MAIN_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={cn(
                  'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2',
                  isActive
                    ? 'border-primary-500 text-primary-700 bg-primary-50/50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === 'refunds' && renderRefundsTab()}
      {activeTab === 'shows' && renderShowsTab()}
      {activeTab === 'attendance' && renderAttendanceTab()}

      {detailRefund && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailRefund(null)}
          />
          <div className="relative w-full max-w-2xl card shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <div>
                <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  退款详情
                </h3>
                <div className="text-xs text-gray-400 font-mono mt-0.5">
                  {detailRefund.refundNo}
                </div>
              </div>
              <button
                onClick={() => setDetailRefund(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      detailRefund.isAbnormal || detailRefund.status === 'abnormal'
                        ? 'bg-rose-100 text-rose-600'
                        : 'bg-primary-100 text-primary-600'
                    )}
                  >
                    {detailRefund.isAbnormal || detailRefund.status === 'abnormal' ? (
                      <AlertTriangle className="w-6 h-6" />
                    ) : (
                      <RefreshCw className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">退款状态</div>
                    <div className="mt-1">
                      <span
                        className={cn(
                          'badge',
                          detailRefund.isAbnormal || detailRefund.status === 'abnormal'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : getRefundStatusColor(detailRefund.status)
                        )}
                      >
                        {detailRefund.isAbnormal || detailRefund.status === 'abnormal'
                          ? '异常'
                          : getRefundStatusText(detailRefund.status)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">退款金额</div>
                  <div className="text-2xl font-bold text-gray-800 mt-1">
                    {formatMoney(detailRefund.actualRefundAmount || detailRefund.refundAmount)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">关联订单</div>
                  {detailRefund.orderId && (
                    <Link
                      to={`/orders/${detailRefund.orderId}`}
                      className="text-sm font-mono text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      {detailRefund.orderNo || `订单 #${detailRefund.orderId}`}
                    </Link>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">退款类型</div>
                  <div className="text-sm text-gray-700">{detailRefund.refundType || '-'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">用户</div>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                      {(detailRefund.userName || 'U')[0]}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {detailRefund.userName}
                      </div>
                      {detailRefund.userPhone && (
                        <div className="text-xs text-gray-500">
                          {maskPhone(detailRefund.userPhone)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">原订单金额</div>
                  <div className="text-sm font-medium text-gray-700">
                    {formatMoney(detailRefund.payAmount)}
                  </div>
                </div>
                {detailRefund.serviceFee && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">手续费</div>
                    <div className="text-sm text-gray-700">
                      {formatMoney(detailRefund.serviceFee)}
                    </div>
                  </div>
                )}
                {detailRefund.reviewerName && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">审核人</div>
                    <div className="text-sm text-gray-700">{detailRefund.reviewerName}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700">退款原因</div>
                <div className="p-4 bg-gray-50 rounded-xl text-sm text-gray-700">
                  {detailRefund.refundReason || '-'}
                </div>
              </div>

              {(detailRefund.isAbnormal || detailRefund.status === 'abnormal') &&
                detailRefund.abnormalReason && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-rose-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      异常原因
                    </div>
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-sm text-rose-700">
                      {detailRefund.abnormalReason}
                    </div>
                  </div>
                )}

              {detailRefund.reviewNote && (
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-700">审核备注</div>
                  <div
                    className={cn(
                      'p-4 rounded-xl text-sm border',
                      detailRefund.status === 'approved' || detailRefund.status === 'completed'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : detailRefund.status === 'rejected'
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-gray-50 border-gray-100 text-gray-700'
                    )}
                  >
                    {detailRefund.reviewNote}
                  </div>
                </div>
              )}

              {detailRefund.bankName && (
                <div className="p-4 bg-blue-50/50 rounded-xl space-y-3 border border-blue-100">
                  <div className="text-xs font-medium text-blue-700 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5" />
                    退款账户信息
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs text-blue-600/70">开户行</div>
                      <div className="text-sm font-medium text-blue-900">
                        {detailRefund.bankName}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-blue-600/70">账户名</div>
                      <div className="text-sm font-medium text-blue-900">
                        {detailRefund.accountHolder}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-blue-600/70">银行卡号</div>
                      <div className="text-sm font-mono text-blue-900">
                        {detailRefund.bankCard}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">提交时间</div>
                  <div className="text-sm text-gray-700">{formatDateTime(detailRefund.submittedAt)}</div>
                </div>
                {detailRefund.reviewedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">审核时间</div>
                    <div className="text-sm text-gray-700">{formatDateTime(detailRefund.reviewedAt)}</div>
                  </div>
                )}
                {detailRefund.processedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">处理时间</div>
                    <div className="text-sm text-gray-700">{formatDateTime(detailRefund.processedAt)}</div>
                  </div>
                )}
                {detailRefund.completedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">完成时间</div>
                    <div className="text-sm text-gray-700">{formatDateTime(detailRefund.completedAt)}</div>
                  </div>
                )}
              </div>
            </div>

            {(detailRefund.status === 'pending' ||
              detailRefund.status === 'reviewing' ||
              detailRefund.status === 'approved') &&
              !detailRefund.isAbnormal && (
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl sticky bottom-0">
                  {(detailRefund.status === 'pending' || detailRefund.status === 'reviewing') && (
                    <>
                      <button
                        onClick={() => {
                          setDetailRefund(null);
                          setReviewModal({ refund: detailRefund, type: 'abnormal' });
                        }}
                        disabled={isSubmitting}
                        className="btn-outline text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        标记异常
                      </button>
                      <button
                        onClick={() => {
                          setDetailRefund(null);
                          setReviewModal({ refund: detailRefund, type: 'reject' });
                        }}
                        disabled={isSubmitting}
                        className="btn-danger"
                      >
                        <XCircle className="w-4 h-4" />
                        驳回
                      </button>
                      <button
                        onClick={() => {
                          setDetailRefund(null);
                          setReviewModal({ refund: detailRefund, type: 'approve' });
                        }}
                        disabled={isSubmitting}
                        className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        通过
                      </button>
                    </>
                  )}
                  {detailRefund.status === 'approved' && (
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            `确认执行退款？\n退款单号：${detailRefund.refundNo}\n金额：${formatMoney(
                              detailRefund.actualRefundAmount || detailRefund.refundAmount
                            )}`
                          )
                        ) {
                          processMutation.mutate(detailRefund.id);
                        }
                      }}
                      disabled={processMutation.isPending}
                      className="btn-primary"
                    >
                      {processMutation.isPending ? (
                        <>
                          <RotateCw className="w-4 h-4 animate-spin" />
                          处理中...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          执行退款
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setReviewModal(null);
              setReviewNote('');
              setAbnormalReason('');
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                {reviewModal.type === 'approve' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                )}
                {reviewModal.type === 'reject' && <XCircle className="w-5 h-5 text-red-600" />}
                {reviewModal.type === 'abnormal' && (
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                )}
                {reviewModal.type === 'approve' && '审核通过退款'}
                {reviewModal.type === 'reject' && '审核驳回退款'}
                {reviewModal.type === 'abnormal' && '标记为异常退款'}
              </h3>
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewNote('');
                  setAbnormalReason('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">退款单号</div>
                  <div className="font-mono text-sm font-medium text-gray-800 mt-0.5">
                    {reviewModal.refund.refundNo}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">金额</div>
                  <div className="text-lg font-bold text-gray-800 mt-0.5">
                    {formatMoney(
                      reviewModal.refund.actualRefundAmount || reviewModal.refund.refundAmount
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    用户
                  </span>
                  <span className="font-medium text-gray-800">{reviewModal.refund.userName}</span>
                </div>
                <div className="flex items-start justify-between text-sm gap-2">
                  <span className="text-gray-500 flex items-center gap-1.5 flex-shrink-0">
                    <FileText className="w-3.5 h-3.5 mt-0.5" />
                    退款原因
                  </span>
                  <span className="text-gray-700 text-right line-clamp-2">
                    {reviewModal.refund.refundReason}
                  </span>
                </div>
              </div>

              {reviewModal.type === 'abnormal' && (
                <div>
                  <label className="block text-sm font-medium text-rose-700 mb-1.5">
                    异常原因
                    <span className="text-rose-500 font-normal ml-1">*</span>
                  </label>
                  <textarea
                    value={abnormalReason}
                    onChange={(e) => setAbnormalReason(e.target.value)}
                    placeholder="请详细说明异常情况，如：支付信息不一致、用户重复申请、系统检测到风险等..."
                    rows={3}
                    className="input resize-none border-rose-200 focus:ring-rose-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  审核备注
                  <span
                    className={cn(
                      'font-normal ml-1',
                      reviewModal.type === 'reject' ? 'text-red-500' : 'text-gray-400'
                    )}
                  >
                    ({reviewModal.type === 'reject' ? '必填' : '可选'})
                  </span>
                </label>
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder={
                    reviewModal.type === 'approve'
                      ? '请输入审核通过说明（可选）'
                      : reviewModal.type === 'reject'
                      ? '请输入驳回原因（必填）'
                      : '补充说明（可选）'
                  }
                  rows={3}
                  className="input resize-none"
                />
              </div>

              {reviewModal.type === 'reject' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <div className="font-medium mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    驳回须知
                  </div>
                  <div>驳回后用户将收到通知。请详细说明驳回原因，以便用户了解情况。</div>
                </div>
              )}
              {reviewModal.type === 'abnormal' && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-700">
                  <div className="font-medium mb-0.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    异常标记须知
                  </div>
                  <div>标记异常后，此退款单将被高亮显示，需要人工介入进一步核查处理。</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewNote('');
                  setAbnormalReason('');
                }}
                className="btn-outline"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleReviewConfirm}
                disabled={
                  isSubmitting ||
                  (reviewModal.type === 'reject' && !reviewNote.trim()) ||
                  (reviewModal.type === 'abnormal' && !abnormalReason.trim())
                }
                className={cn(
                  'btn',
                  reviewModal.type === 'approve' &&
                    'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
                  reviewModal.type === 'reject' &&
                    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
                  reviewModal.type === 'abnormal' &&
                    'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
                )}
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    {reviewModal.type === 'approve' && '确认通过'}
                    {reviewModal.type === 'reject' && '确认驳回'}
                    {reviewModal.type === 'abnormal' && '确认标记'}
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
