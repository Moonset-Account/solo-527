import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api';
import { toast } from 'sonner';
import {
  Bell,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  ShoppingCart,
  CheckCircle2,
  Clock,
  CheckCheck,
  X,
  RotateCw,
  Package,
  Inbox,
  Filter,
  Square,
  CheckSquare,
  ArrowRight,
} from 'lucide-react';
import {
  cn,
  formatDateTime,
  getNotificationTypeText,
} from '@/lib/utils';
import type { Notification } from '@/types';

const TYPE_FILTERS = [
  { id: 'all', label: '全部类型' },
  { id: 'refund_abnormal', label: '退票异常' },
  { id: 'inventory_warning', label: '库存预警' },
  { id: 'verification_alert', label: '审核提醒' },
  { id: 'order_anomaly', label: '订单异常' },
] as const;

const STATUS_FILTERS = [
  { id: 'all', label: '全部状态' },
  { id: 'unread', label: '未读' },
  { id: 'read', label: '已读' },
  { id: 'resolved', label: '已解决' },
] as const;

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'refund_abnormal':
      return RefreshCw;
    case 'inventory_warning':
      return Package;
    case 'verification_alert':
      return Clock;
    case 'order_anomaly':
      return ShoppingCart;
    default:
      return Bell;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'refund_abnormal':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-600',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'inventory_warning':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-600',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'verification_alert':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'order_anomaly':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-600',
        border: 'border-gray-200',
        dot: 'bg-gray-500',
      };
  }
};

export default function AdminNotifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [resolveModal, setResolveModal] = useState<Notification | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [batchResolveModal, setBatchResolveModal] = useState(false);
  const [batchResolveNote, setBatchResolveNote] = useState('');

  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['admin-notifications-unread-count'],
    queryFn: () => notificationApi.unreadCount(),
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', typeFilter, statusFilter, searchText, page],
    queryFn: () =>
      notificationApi.list({
        type: typeFilter === 'all' ? undefined : typeFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        keyword: searchText || undefined,
        page,
        pageSize,
      }),
  });

  const notifications: Notification[] = data?.list || data || [];
  const total = data?.total || notifications.length;
  const totalPages = Math.ceil(total / pageSize);
  const unreadCount = unreadCountData?.count || unreadCountData || 0;

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      toast.success('已标记为已读');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      refetchUnreadCount();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const readAllMutation = useMutation({
    mutationFn: () => notificationApi.readAll(),
    onSuccess: () => {
      toast.success('已全部标记为已读');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      refetchUnreadCount();
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, note }: { id: number; note?: string }) =>
      notificationApi.resolve(id, { note }),
    onSuccess: () => {
      toast.success('已标记为已解决');
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      refetchUnreadCount();
      setResolveModal(null);
      setResolveNote('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const batchResolveMutation = useMutation({
    mutationFn: ({ ids, note }: { ids: number[]; note?: string }) =>
      notificationApi.resolveBatch({ ids, note }),
    onSuccess: () => {
      toast.success(`已批量处理 ${selectedIds.size} 条提醒`);
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
      refetchUnreadCount();
      setSelectedIds(new Set());
      setBatchResolveModal(false);
      setBatchResolveNote('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === notifications.length && notifications.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n) => n.id)));
    }
  };

  const handleBatchResolve = () => {
    if (selectedIds.size === 0) {
      toast.error('请先选择要处理的提醒');
      return;
    }
    batchResolveMutation.mutate({
      ids: Array.from(selectedIds),
      note: batchResolveNote || undefined,
    });
  };

  const isSubmitting =
    markReadMutation.isPending ||
    resolveMutation.isPending ||
    batchResolveMutation.isPending ||
    readAllMutation.isPending;

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const renderPriorityBadge = (priority: number) => {
    if (priority === 1) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 text-xs font-medium">
          <AlertOctagon className="w-3 h-3" />
          紧急
        </span>
      );
    }
    if (priority === 2) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
          <AlertTriangle className="w-3 h-3" />
          重要
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
        <Bell className="w-3 h-3" />
        普通
      </span>
    );
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            未读
          </span>
        );
      case 'read':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 text-xs">
            已读
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" />
            已解决
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell className="w-6 h-6 text-primary-600" />
              异常提醒
            </h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                {unreadCount} 条未读
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">查看和处理系统异常提醒、审核通知</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="btn-outline"
            >
              {readAllMutation.isPending ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4" />
              )}
              全部已读
            </button>
          )}
          <button onClick={() => refetch()} className="btn-outline">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </div>

      {unreadCount > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['refund_abnormal', 'inventory_warning', 'verification_alert', 'order_anomaly'] as const).map(
            (type) => {
              const count = notifications.filter(
                (n) => n.type === type && n.status === 'unread'
              ).length;
              const color = getNotificationColor(type);
              const Icon = getNotificationIcon(type);
              return (
                <div
                  key={type}
                  onClick={() => {
                    setTypeFilter(type);
                    setStatusFilter('unread');
                    setPage(1);
                  }}
                  className="card p-4 cursor-pointer hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">{getNotificationTypeText(type)}</div>
                      <div className={cn('text-2xl font-bold mt-1', color.text)}>
                        {count > 0 ? count : 0}
                      </div>
                    </div>
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color.bg)}>
                      <Icon className={cn('w-5 h-5', color.text)} />
                    </div>
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索标题、内容..."
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
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none pr-9 min-w-40"
              >
                {TYPE_FILTERS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="input appearance-none pr-9 min-w-36"
              >
                {STATUS_FILTERS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {someSelected || allSelected ? (
            <div className="flex items-center justify-between p-3 bg-primary-50 border border-primary-100 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-sm text-primary-700 font-medium">
                  已选择 <span className="font-bold">{selectedIds.size}</span> 条提醒
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedIds(new Set());
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  取消选择
                </button>
                <button
                  onClick={() => setBatchResolveModal(true)}
                  disabled={isSubmitting}
                  className="btn-primary !py-1.5 text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  批量标记已解决
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-gray-50">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-50 rounded w-48 animate-pulse" />
                    <div className="h-3 bg-gray-50 rounded w-72 animate-pulse" />
                  </div>
                </div>
              </div>
            ))
          ) : notifications.length === 0 ? (
            <div className="py-20 text-center">
              <Inbox className="w-16 h-16 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-500">暂无提醒数据</p>
              <p className="text-xs text-gray-400 mt-1">一切运行正常</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50/50 border-b border-gray-100">
                <button
                  onClick={toggleSelectAll}
                  className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-primary-600" />
                  ) : someSelected ? (
                    <Square className="w-4 h-4 text-primary-600" strokeDasharray="2 2" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
                <span className="text-xs text-gray-500">全选</span>
              </div>
              {notifications.map((notif) => {
                const color = getNotificationColor(notif.type);
                const Icon = getNotificationIcon(notif.type);
                const isSelected = selectedIds.has(notif.id);
                const isUnread = notif.status === 'unread';
                return (
                  <div
                    key={notif.id}
                    className={cn(
                      'px-5 py-4 transition-colors relative',
                      isSelected && 'bg-primary-50/50',
                      isUnread && !isSelected && 'bg-blue-50/30',
                      'hover:bg-gray-50'
                    )}
                  >
                    {isUnread && (
                      <span
                        className={cn(
                          'absolute left-0 top-0 bottom-0 w-0.5',
                          color.dot
                        )}
                      />
                    )}
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => toggleSelect(notif.id)}
                        className="mt-1 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-primary-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5',
                          color.bg
                        )}
                      >
                        <Icon className={cn('w-5 h-5', color.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-start gap-2 mb-1.5">
                          <h4
                            className={cn(
                              'text-sm line-clamp-1',
                              isUnread
                                ? 'font-semibold text-gray-900'
                                : 'font-medium text-gray-700'
                            )}
                          >
                            {notif.title}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {renderPriorityBadge(notif.priority)}
                            {renderStatusBadge(notif.status)}
                          </div>
                        </div>
                        {notif.content && (
                          <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                            {notif.content}
                          </p>
                        )}
                        {notif.resolutionNote && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg mb-2">
                            <div className="flex items-start gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <div className="text-xs font-medium text-emerald-700">
                                  解决备注
                                  {notif.resolverName && (
                                    <span className="text-emerald-600/70 font-normal ml-1">
                                      - {notif.resolverName}
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-emerald-600/80 mt-0.5">
                                  {notif.resolutionNote}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(notif.triggeredAt)}
                            </span>
                            <span className="badge bg-gray-100 text-gray-600">
                              {getNotificationTypeText(notif.type)}
                            </span>
                            {notif.readerName && notif.status !== 'unread' && (
                              <span className="inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-blue-500" />
                                {notif.readerName} 已读
                              </span>
                            )}
                            {notif.resolvedAt && (
                              <span className="inline-flex items-center gap-1 text-emerald-600">
                                <CheckCircle2 className="w-3 h-3" />
                                {formatDateTime(notif.resolvedAt)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {isUnread && (
                              <button
                                onClick={() => markReadMutation.mutate(notif.id)}
                                disabled={markReadMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors text-xs font-medium flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                已读
                              </button>
                            )}
                            {notif.status !== 'resolved' && (
                              <button
                                onClick={() => {
                                  setResolveModal(notif);
                                  setResolveNote('');
                                }}
                                className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors text-xs font-medium flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                解决
                              </button>
                            )}
                            <Link
                              to={
                                notif.type === 'refund_abnormal'
                                  ? '/admin/refunds'
                                  : notif.type === 'inventory_warning'
                                  ? '/admin/tickets'
                                  : notif.type === 'verification_alert'
                                  ? '/admin/verifications'
                                  : '/admin/orders'
                              }
                              className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-600 hover:text-primary-700 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              查看详情
                              <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
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

      {resolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setResolveModal(null);
              setResolveNote('');
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                标记为已解决
              </h3>
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolveNote('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  {renderPriorityBadge(resolveModal.priority)}
                  <span className="badge bg-gray-100 text-gray-600">
                    {getNotificationTypeText(resolveModal.type)}
                  </span>
                </div>
                <div className="font-medium text-gray-800">{resolveModal.title}</div>
                {resolveModal.content && (
                  <div className="text-sm text-gray-500 line-clamp-2">
                    {resolveModal.content}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  解决备注
                  <span className="text-gray-400 font-normal ml-1">（建议填写）</span>
                </label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="请填写解决措施或说明..."
                  rows={4}
                  className="input resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setResolveModal(null);
                  setResolveNote('');
                }}
                className="btn-outline"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={() =>
                  resolveMutation.mutate({
                    id: resolveModal.id,
                    note: resolveNote || undefined,
                  })
                }
                disabled={isSubmitting}
                className="btn bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500"
              >
                {resolveMutation.isPending ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    确认解决
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {batchResolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setBatchResolveModal(false);
              setBatchResolveNote('');
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-primary-600" />
                批量标记已解决
              </h3>
              <button
                onClick={() => {
                  setBatchResolveModal(false);
                  setBatchResolveNote('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-primary-50 border border-primary-100 rounded-xl">
                <div className="text-sm text-primary-700">
                  即将标记 <span className="font-bold">{selectedIds.size}</span> 条提醒为已解决
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  处理备注
                  <span className="text-gray-400 font-normal ml-1">（建议填写）</span>
                </label>
                <textarea
                  value={batchResolveNote}
                  onChange={(e) => setBatchResolveNote(e.target.value)}
                  placeholder="请填写批量处理的说明..."
                  rows={4}
                  className="input resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setBatchResolveModal(false);
                  setBatchResolveNote('');
                }}
                className="btn-outline"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleBatchResolve}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {batchResolveMutation.isPending ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    确认批量处理
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
