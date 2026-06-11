import { useState, useMemo } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  FileCheck,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Phone,
  CreditCard,
  X,
  Clock,
  AlertCircle,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  maskIdCard,
  maskPhone,
  getVerificationStatusText,
  getVerificationStatusColor,
} from '@/lib/utils';
import type { Verification } from '@/types';

const VERIFY_TABS = [
  { id: 'pending', label: '待审核', color: 'text-amber-600 bg-amber-50' },
  { id: 'approved', label: '已通过', color: 'text-emerald-600 bg-emerald-50' },
  { id: 'rejected', label: '已驳回', color: 'text-red-600 bg-red-50' },
] as const;

type VerifyTabId = (typeof VERIFY_TABS)[number]['id'];

export default function AdminVerifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<VerifyTabId>('pending');
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [detailItem, setDetailItem] = useState<Verification | null>(null);
  const [reviewModal, setReviewModal] = useState<{
    item: Verification;
    type: 'approve' | 'reject';
  } | null>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-verifications', activeTab, searchText, page],
    queryFn: () =>
      orderApi.verifications({
        status: activeTab,
        keyword: searchText || undefined,
        page,
        pageSize,
      }),
  });

  const verifications: Verification[] = data?.list || data || [];
  const total = data?.total || verifications.length;
  const totalPages = Math.ceil(total / pageSize);

  const { data: countsData } = useQuery({
    queryKey: ['admin-verifications-counts'],
    queryFn: () =>
      Promise.all([
        orderApi.verifications({ status: 'pending', pageSize: 1 }),
        orderApi.verifications({ status: 'approved', pageSize: 1 }),
        orderApi.verifications({ status: 'rejected', pageSize: 1 }),
      ]),
  });

  const counts = useMemo(() => {
    if (!countsData) return { pending: 0, approved: 0, rejected: 0 };
    return {
      pending: countsData[0]?.total ?? 0,
      approved: countsData[1]?.total ?? 0,
      rejected: countsData[2]?.total ?? 0,
    };
  }, [countsData]);

  const reviewMutation = useMutation({
    mutationFn: ({
      id,
      status,
      note,
    }: {
      id: number;
      status: 'approved' | 'rejected';
      note?: string;
    }) => orderApi.verify(id, { status, note }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'approved' ? '审核通过成功' : '已驳回申请');
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setReviewModal(null);
      setReviewNote('');
      setSelectedIds([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const batchApproveMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      for (const id of ids) {
        await orderApi.verify(id, { status: 'approved' });
      }
    },
    onSuccess: (_, vars) => {
      toast.success(`已批量通过 ${vars.length} 条审核`);
      queryClient.invalidateQueries({ queryKey: ['admin-verifications'] });
      setSelectedIds([]);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '批量操作失败'),
  });

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === verifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(verifications.map((v) => v.id));
    }
  };

  const handleReviewConfirm = () => {
    if (!reviewModal) return;
    reviewMutation.mutate({
      id: reviewModal.item.id,
      status: reviewModal.type === 'approve' ? 'approved' : 'rejected',
      note: reviewNote || undefined,
    });
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`确认批量通过 ${selectedIds.length} 条审核申请？`)) {
      batchApproveMutation.mutate(selectedIds);
    }
  };

  const isSubmitting = reviewMutation.isPending || batchApproveMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-primary-600" />
            实名审核
          </h1>
          <p className="text-sm text-gray-500 mt-1">审核用户提交的实名身份信息</p>
        </div>
        <button onClick={() => refetch()} className="btn-outline">
          <RotateCw className="w-4 h-4" />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {VERIFY_TABS.map((tab) => {
          const count = counts[tab.id as keyof typeof counts] || 0;
          const isActive = activeTab === tab.id;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
                setSelectedIds([]);
              }}
              className={cn(
                'card p-5 cursor-pointer transition-all',
                isActive ? 'ring-2 ring-primary-500 shadow-md' : 'hover:shadow-sm'
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {tab.id === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                    {tab.id === 'approved' && <UserCheck className="w-4 h-4 text-emerald-500" />}
                    {tab.id === 'rejected' && <UserX className="w-4 h-4 text-red-500" />}
                    <span className="text-sm font-medium text-gray-600">{tab.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{count}</p>
                </div>
                <div
                  className={cn(
                    'w-12 h-12 rounded-xl flex items-center justify-center',
                    tab.color
                  )}
                >
                  {tab.id === 'pending' && <Clock className="w-6 h-6" />}
                  {tab.id === 'approved' && <UserCheck className="w-6 h-6" />}
                  {tab.id === 'rejected' && <UserX className="w-6 h-6" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative max-w-md flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单号、姓名、身份证号、手机号..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setPage(1);
                  }}
                  className="input pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'pending' && selectedIds.length > 0 && (
                <button
                  onClick={handleBatchApprove}
                  disabled={batchApproveMutation.isPending}
                  className="btn-primary"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {batchApproveMutation.isPending
                    ? '批量处理中...'
                    : `批量通过 (${selectedIds.length})`}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {activeTab === 'pending' && (
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === verifications.length && verifications.length > 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </th>
                )}
                <th>订单号</th>
                <th>姓名</th>
                <th>身份证号</th>
                <th>手机号</th>
                <th>提交时间</th>
                <th>状态</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {activeTab === 'pending' && (
                      <td>
                        <div className="h-4 w-4 bg-gray-50 rounded animate-pulse" />
                      </td>
                    )}
                    {Array.from({ length: activeTab === 'pending' ? 7 : 6 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : verifications.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'pending' ? 8 : 7}>
                    <div className="py-16 text-center">
                      <FileCheck className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无审核数据</p>
                      {activeTab === 'pending' && (
                        <p className="text-xs text-gray-400 mt-1">暂无待审核的实名申请</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                verifications.map((v) => (
                  <tr key={v.id}>
                    {activeTab === 'pending' && (
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(v.id)}
                          onChange={() => handleToggleSelect(v.id)}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                    )}
                    <td>
                      <Link
                        to={`/orders/${v.orderId}`}
                        className="flex items-center gap-1.5 font-mono text-xs text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        订单 #{v.orderId}
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                          {v.realName?.[0] || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-800">{v.realName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm text-gray-700 font-mono">
                        {maskIdCard(v.idCardNumber)}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-sm text-gray-700">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {maskPhone(v.phone)}
                      </div>
                    </td>
                    <td>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDateTime(v.submittedAt)}
                      </span>
                    </td>
                    <td>
                      <span className={cn('badge', getVerificationStatusColor(v.status))}>
                        {getVerificationStatusText(v.status)}
                      </span>
                      {v.status !== 'pending' && v.reviewNote && (
                        <div
                          className="text-xs text-gray-400 mt-1 cursor-help"
                          title={v.reviewNote}
                        >
                          {v.reviewNote.length > 10
                            ? `${v.reviewNote.slice(0, 10)}...`
                            : v.reviewNote}
                        </div>
                      )}
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailItem(v)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {v.status === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                setReviewModal({ item: v, type: 'approve' })
                              }
                              disabled={isSubmitting}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="审核通过"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setReviewModal({ item: v, type: 'reject' })
                              }
                              disabled={isSubmitting}
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

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDetailItem(null)}
          />
          <div className="relative w-full max-w-lg card shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h3 className="font-semibold text-gray-800">实名信息详情</h3>
              <button
                onClick={() => setDetailItem(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <div className="text-xs text-gray-500">审核状态</div>
                  <div className="mt-1">
                    <span
                      className={cn(
                        'badge',
                        getVerificationStatusColor(detailItem.status)
                      )}
                    >
                      {getVerificationStatusText(detailItem.status)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-10 h-10 rounded-full bg-primary-100 text-primary-700 justify-center text-lg font-bold">
                  {detailItem.realName?.[0]}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">订单号</div>
                  <Link
                    to={`/orders/${detailItem.orderId}`}
                    className="text-sm font-mono text-primary-600 hover:underline flex items-center gap-1"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    #{detailItem.orderId}
                  </Link>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">用户ID</div>
                  <div className="text-sm font-mono text-gray-700">
                    {detailItem.userId}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">姓名</div>
                  <div className="text-sm font-medium text-gray-800">
                    {detailItem.realName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">性别</div>
                  <div className="text-sm text-gray-700">
                    {detailItem.gender === 'male'
                      ? '男'
                      : detailItem.gender === 'female'
                      ? '女'
                      : '其他'}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">身份证号</div>
                  <div className="text-sm font-mono text-gray-700 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    {detailItem.idCardNumber}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-gray-500 mb-1">联系电话</div>
                  <div className="text-sm text-gray-700 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {detailItem.phone}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs font-medium text-gray-700">证件照片</div>
                <div className="grid grid-cols-3 gap-3">
                  {['身份证正面', '身份证背面', '手持证件'].map((label, idx) => {
                    const keys = ['idCardFront', 'idCardBack', 'idCardHolding'] as const;
                    const url = detailItem[keys[idx]];
                    return (
                      <div key={label} className="space-y-1.5">
                        {url ? (
                          <div className="aspect-[4/3] rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                            <img
                              src={url}
                              alt={label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[4/3] rounded-lg border border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
                            <AlertCircle className="w-6 h-6 mb-1" />
                            <span className="text-xs">暂无</span>
                          </div>
                        )}
                        <div className="text-xs text-center text-gray-500">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {detailItem.reason && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">提交备注</div>
                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                    {detailItem.reason}
                  </div>
                </div>
              )}

              {detailItem.reviewNote && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">审核意见</div>
                  <div
                    className={cn(
                      'p-3 rounded-lg text-sm',
                      detailItem.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                    )}
                  >
                    {detailItem.reviewNote}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <div className="text-xs text-gray-500 mb-1">提交时间</div>
                  <div className="text-sm text-gray-700">
                    {formatDateTime(detailItem.submittedAt)}
                  </div>
                </div>
                {detailItem.reviewedAt && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">审核时间</div>
                    <div className="text-sm text-gray-700">
                      {formatDateTime(detailItem.reviewedAt)}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {detailItem.status === 'pending' && (
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl sticky bottom-0">
                <button
                  onClick={() => {
                    setDetailItem(null);
                    setReviewModal({ item: detailItem, type: 'reject' });
                  }}
                  className="btn-danger"
                >
                  <XCircle className="w-4 h-4" />
                  驳回
                </button>
                <button
                  onClick={() => {
                    setDetailItem(null);
                    setReviewModal({ item: detailItem, type: 'approve' });
                  }}
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  通过
                </button>
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
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                {reviewModal.type === 'approve' ? '审核通过' : '审核驳回'}
              </h3>
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewNote('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
                  {reviewModal.item.realName?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800">{reviewModal.item.realName}</div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {maskIdCard(reviewModal.item.idCardNumber)}
                  </div>
                </div>
                <span
                  className={cn(
                    'badge',
                    reviewModal.type === 'approve'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  )}
                >
                  {reviewModal.type === 'approve' ? '通过' : '驳回'}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  审核意见
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
                      ? '请输入审核通过说明...'
                      : '请输入驳回原因（必填）'
                  }
                  rows={4}
                  className="input resize-none"
                />
              </div>

              {reviewModal.type === 'reject' && (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
                  <div className="font-medium mb-0.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    驳回须知
                  </div>
                  <div>驳回后用户将收到通知，可补充资料后重新提交。请详细说明驳回原因。</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setReviewModal(null);
                  setReviewNote('');
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
                  (reviewModal.type === 'reject' && !reviewNote.trim())
                }
                className={cn(
                  'btn',
                  reviewModal.type === 'approve'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                    : 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
                )}
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : reviewModal.type === 'approve' ? (
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
