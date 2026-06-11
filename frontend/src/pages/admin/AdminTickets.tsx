import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { concertApi, ticketTypeApi } from '@/api';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import {
  Ticket,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Plus,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  CheckCircle2,
  XCircle,
  Database,
  DollarSign,
  Package,
  AlertTriangle,
  RotateCw,
  Info,
} from 'lucide-react';
import {
  cn,
  formatMoney,
  formatDateTime,
  formatDate,
  getZoneTypeText,
} from '@/lib/utils';
import type { Show, TicketType } from '@/types';

export default function AdminTickets() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [showId, setShowId] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [editModal, setEditModal] = useState<{ ticketType: TicketType | null; isNew: boolean } | null>(null);
  const [stockModal, setStockModal] = useState<TicketType | null>(null);
  const [stockChange, setStockChange] = useState('');
  const [stockReason, setStockReason] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    showId: 0,
    zoneId: undefined as number | undefined,
    price: '',
    originalStock: 0,
    maxPerOrder: 4,
    requireRealName: false,
    description: '',
    salesStartAt: '',
    salesEndAt: '',
  });

  const { data: showsData } = useQuery({
    queryKey: ['admin-tickets-shows'],
    queryFn: () => concertApi.showList({ pageSize: 100 }),
  });

  const shows: Show[] = showsData?.list || showsData || [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-tickets', searchText, showId, statusFilter, page],
    queryFn: () =>
      ticketTypeApi.list({
        keyword: searchText || undefined,
        showId: showId === 'all' ? undefined : showId,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        page,
        pageSize,
      }),
  });

  const ticketTypes: TicketType[] = data?.list || data || [];
  const total = data?.total || ticketTypes.length;
  const totalPages = Math.ceil(total / pageSize);

  const openEditModal = (ticketType: TicketType | null) => {
    if (ticketType) {
      setEditForm({
        name: ticketType.name,
        showId: ticketType.showId,
        zoneId: ticketType.zoneId,
        price: ticketType.price,
        originalStock: ticketType.originalStock,
        maxPerOrder: ticketType.maxPerOrder,
        requireRealName: ticketType.requireRealName,
        description: ticketType.description || '',
        salesStartAt: ticketType.salesStartAt ? dayjs(ticketType.salesStartAt).format('YYYY-MM-DDTHH:mm') : '',
        salesEndAt: ticketType.salesEndAt ? dayjs(ticketType.salesEndAt).format('YYYY-MM-DDTHH:mm') : '',
      });
    } else {
      setEditForm({
        name: '',
        showId: shows[0]?.id || 0,
        zoneId: undefined,
        price: '',
        originalStock: 100,
        maxPerOrder: 4,
        requireRealName: false,
        description: '',
        salesStartAt: '',
        salesEndAt: '',
      });
    }
    setEditModal({ ticketType, isNew: !ticketType });
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => ticketTypeApi.create(data),
    onSuccess: () => {
      toast.success('票种创建成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setEditModal(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '创建失败'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ticketTypeApi.update(id, data),
    onSuccess: () => {
      toast.success('票种更新成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setEditModal(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '更新失败'),
  });

  const adjustStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => ticketTypeApi.adjustStock(id, data),
    onSuccess: () => {
      toast.success('库存调整成功');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
      setStockModal(null);
      setStockChange('');
      setStockReason('');
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '调整失败'),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      ticketTypeApi.update(id, { isActive }),
    onSuccess: (_, vars) => {
      toast.success(vars.isActive ? '已启用票种' : '已禁用票种');
      queryClient.invalidateQueries({ queryKey: ['admin-tickets'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error || '操作失败'),
  });

  const handleEditSubmit = () => {
    if (!editForm.name.trim()) {
      toast.error('请输入票种名称');
      return;
    }
    if (!editForm.price || parseFloat(editForm.price) < 0) {
      toast.error('请输入有效的价格');
      return;
    }
    if (!editForm.showId) {
      toast.error('请选择场次');
      return;
    }
    const data = {
      ...editForm,
      salesStartAt: editForm.salesStartAt || undefined,
      salesEndAt: editForm.salesEndAt || undefined,
      zoneId: editForm.zoneId || undefined,
      price: String(parseFloat(editForm.price).toFixed(2)),
    };
    if (editModal?.isNew) {
      createMutation.mutate(data);
    } else if (editModal?.ticketType) {
      updateMutation.mutate({ id: editModal.ticketType.id, data });
    }
  };

  const handleStockSubmit = () => {
    if (!stockModal) return;
    const change = parseInt(stockChange);
    if (isNaN(change) || change === 0) {
      toast.error('请输入有效的增减数量');
      return;
    }
    if (!stockReason.trim()) {
      toast.error('请输入调整原因');
      return;
    }
    adjustStockMutation.mutate({
      id: stockModal.id,
      data: {
        change,
        reason: stockReason,
      },
    });
  };

  const selectedShow = shows.find((s) => s.id === editForm.showId);

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || adjustStockMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-primary-600" />
            票种库存管理
          </h1>
          <p className="text-sm text-gray-500 mt-1">管理各场次票种、价格和库存数量</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => refetch()} className="btn-outline">
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
          <button onClick={() => openEditModal(null)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建票种
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-64 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索票种名称..."
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
                className="input appearance-none pr-9 min-w-52"
              >
                <option value="all">全部场次</option>
                {shows.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.concertTitle} - {formatDate(s.showDate)} {s.startTime}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex gap-1">
              {[
                { id: 'all', label: '全部' },
                { id: 'active', label: '已启用' },
                { id: 'inactive', label: '已禁用' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setStatusFilter(s.id);
                    setPage(1);
                  }}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    statusFilter === s.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>票种名称</th>
                <th>场次</th>
                <th>价格</th>
                <th>总库存</th>
                <th>剩余</th>
                <th>已售</th>
                <th>退款</th>
                <th>销售进度</th>
                <th>状态</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j}>
                        <div className="h-5 bg-gray-50 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : ticketTypes.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <div className="py-16 text-center">
                      <Ticket className="w-14 h-14 mx-auto mb-3 text-gray-200" />
                      <p className="text-sm text-gray-500">暂无票种数据</p>
                      <button
                        onClick={() => openEditModal(null)}
                        className="mt-4 btn-primary !py-2 text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        新建第一个票种
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                ticketTypes.map((tt) => {
                  const soldRate =
                    tt.originalStock > 0
                      ? Math.round((tt.soldCount / tt.originalStock) * 100)
                      : 0;
                  const lowStock = tt.remainingStock <= Math.ceil(tt.originalStock * 0.1);
                  return (
                    <tr key={tt.id}>
                      <td>
                        <div className="font-medium text-gray-800">{tt.name}</div>
                        {tt.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-48">
                            {tt.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="max-w-48">
                          <div className="text-sm text-gray-800 line-clamp-1 font-medium">
                            {shows.find((s) => s.id === tt.showId)?.concertTitle || `#${tt.showId}`}
                          </div>
                          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(
                              shows.find((s) => s.id === tt.showId)?.showDate || ''
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-bold text-gray-800">
                          {formatMoney(tt.price)}
                        </span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-gray-700">
                          {tt.originalStock}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span
                            className={cn(
                              'text-sm font-medium',
                              lowStock ? 'text-rose-600' : 'text-emerald-600'
                            )}
                          >
                            {tt.remainingStock}
                          </span>
                          {lowStock && tt.remainingStock > 0 && (
                            <span className="relative group">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded z-10">
                                库存紧张
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-blue-600">{tt.soldCount}</span>
                      </td>
                      <td>
                        <span className="text-sm font-medium text-purple-600">
                          {tt.refundedCount}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                soldRate >= 90
                                  ? 'bg-rose-500'
                                  : soldRate >= 70
                                  ? 'bg-emerald-500'
                                  : soldRate >= 40
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              )}
                              style={{ width: `${Math.min(soldRate, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-gray-600 w-10">
                            {soldRate}%
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={cn(
                            'badge',
                            tt.isActive
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {tt.isActive ? '已启用' : '已禁用'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setStockModal(tt)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                            title="调整库存"
                          >
                            <Database className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(tt)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="编辑"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {tt.isActive ? (
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({ id: tt.id, isActive: false })
                              }
                              disabled={toggleActiveMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 hover:text-amber-700 transition-colors"
                              title="禁用"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                toggleActiveMutation.mutate({ id: tt.id, isActive: true })
                              }
                              disabled={toggleActiveMutation.isPending}
                              className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="启用"
                            >
                              <CheckCircle2 className="w-4 h-4" />
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

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditModal(null)}
          />
          <div className="relative w-full max-w-xl card shadow-xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary-600" />
                {editModal.isNew ? '新建票种' : '编辑票种'}
              </h3>
              <button
                onClick={() => setEditModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    票种名称 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="如：早鸟票、VIP票、普通票等"
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    场次 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.showId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, showId: Number(e.target.value) })
                      }
                      className="input appearance-none pr-9 w-full"
                    >
                      <option value={0}>请选择场次</option>
                      {shows.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.concertTitle} - {formatDate(s.showDate)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    关联区域
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.zoneId || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          zoneId: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      className="input appearance-none pr-9 w-full"
                    >
                      <option value="">不关联区域</option>
                      {(selectedShow?.zones || []).map((z) => (
                        <option key={z.id} value={z.id}>
                          {z.name} ({getZoneTypeText(z.zoneType)})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    价格 (元) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.price}
                      onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                      placeholder="0.00"
                      className="input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    总库存 <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      min="1"
                      value={editForm.originalStock}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          originalStock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="input pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    每单限购数量
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editForm.maxPerOrder}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        maxPerOrder: parseInt(e.target.value) || 1,
                      })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    实名认证
                  </label>
                  <div className="flex items-center h-[42px]">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.requireRealName}
                        onChange={(e) =>
                          setEditForm({ ...editForm, requireRealName: e.target.checked })
                        }
                        className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">购票需实名</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    开售时间
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.salesStartAt}
                    onChange={(e) =>
                      setEditForm({ ...editForm, salesStartAt: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    结束时间
                  </label>
                  <input
                    type="datetime-local"
                    value={editForm.salesEndAt}
                    onChange={(e) =>
                      setEditForm({ ...editForm, salesEndAt: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    票种说明
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="可选：票种适用说明、退换政策等"
                    rows={3}
                    className="input resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
              <button onClick={() => setEditModal(null)} className="btn-outline" disabled={isSubmitting}>
                取消
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    保存中...
                  </>
                ) : editModal.isNew ? (
                  '创建票种'
                ) : (
                  '保存修改'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {stockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => {
              setStockModal(null);
              setStockChange('');
              setStockReason('');
            }}
          />
          <div className="relative w-full max-w-md card shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-600" />
                调整库存
              </h3>
              <button
                onClick={() => {
                  setStockModal(null);
                  setStockChange('');
                  setStockReason('');
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">票种</span>
                  <span className="font-medium text-gray-800">{stockModal.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">当前剩余库存</span>
                  <span className="font-bold text-emerald-600">{stockModal.remainingStock}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">总库存</span>
                  <span className="font-medium text-gray-700">{stockModal.originalStock}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  调整数量 <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setStockChange(String((parseInt(stockChange) || 0) - 10))
                      }
                      className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStockChange(String((parseInt(stockChange) || 0) - 1))
                      }
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <div className="relative flex-1">
                      <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 opacity-0 transition-opacity" />
                      <TrendingDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500 opacity-0 transition-opacity" />
                      <input
                        type="number"
                        value={stockChange}
                        onChange={(e) => setStockChange(e.target.value)}
                        placeholder="正数增加，负数减少"
                        className={cn(
                          'input text-center font-semibold',
                          parseInt(stockChange) > 0 && 'text-emerald-600 bg-emerald-50/50',
                          parseInt(stockChange) < 0 && 'text-rose-600 bg-rose-50/50'
                        )}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setStockChange(String((parseInt(stockChange) || 0) + 1))
                      }
                      className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStockChange(String((parseInt(stockChange) || 0) + 10))
                      }
                      className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
                    >
                      +10
                    </button>
                  </div>
                  {stockChange && parseInt(stockChange) !== 0 && (
                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-gray-500">调整后库存</span>
                      <span
                        className={cn(
                          'font-bold',
                          stockModal.remainingStock + parseInt(stockChange) < 0
                            ? 'text-rose-600'
                            : 'text-emerald-600'
                        )}
                      >
                        {stockModal.remainingStock + parseInt(stockChange)}
                      </span>
                    </div>
                  )}
                  {stockChange &&
                    stockModal.remainingStock + parseInt(stockChange) < 0 && (
                      <div className="flex items-start gap-1.5 p-3 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-700">
                        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>调整后库存为负数，请检查调整数量</span>
                      </div>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  调整原因 <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={stockReason}
                  onChange={(e) => setStockReason(e.target.value)}
                  placeholder="请详细说明库存调整的原因，如：临时增加座位、取消部分订单释放库存等..."
                  rows={3}
                  className="input resize-none"
                />
              </div>

              <div className="flex items-start gap-1.5 p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium mb-0.5">操作说明</div>
                  <div>库存调整将记录操作日志，请谨慎操作。调整后会实时同步到销售系统。</div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
              <button
                onClick={() => {
                  setStockModal(null);
                  setStockChange('');
                  setStockReason('');
                }}
                className="btn-outline"
                disabled={isSubmitting}
              >
                取消
              </button>
              <button
                onClick={handleStockSubmit}
                disabled={isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    调整中...
                  </>
                ) : (
                  '确认调整'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
