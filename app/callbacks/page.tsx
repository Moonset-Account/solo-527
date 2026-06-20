'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  RotateCw,
  FileText,
  CalendarDays,
  AlertTriangle,
  Check,
  User,
  Lock,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { apiGet, apiPost } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, StatCard, EmptyState } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  callbackStatusLabel,
  callbackStatusColor,
  formatDate,
  cn,
  roleCanAccess,
} from '@/lib/utils';
import type { CallbackStatus, CallbackRecord, CompensationRecord } from '@/lib/types';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const STATUS_OPTIONS: { value: CallbackStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'success', label: '成功' },
  { value: 'failed', label: '失败' },
];

const compensationSchema = z.object({
  action: z.string().min(2, '操作描述至少2个字符'),
  result: z.enum(['success', 'failed']),
  remark: z.string().optional(),
});

type CompensationFormData = z.infer<typeof compensationSchema>;

export default function CallbacksPage() {
  const currentUser = useAppStore((s) => s.currentUser);

  const [callbacks, setCallbacks] = useState<CallbackRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const canAccess = currentUser ? roleCanAccess(currentUser.role, ['store_manager']) : false;

  const [statusFilter, setStatusFilter] = useState<CallbackStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [compModalOpen, setCompModalOpen] = useState(false);
  const [selectedCallback, setSelectedCallback] = useState<CallbackRecord | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<CompensationFormData>({
    resolver: zodResolver(compensationSchema),
    defaultValues: {
      action: '',
      result: 'success',
      remark: '',
    },
  });

  const fetchCallbacks = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (sourceFilter !== 'all') params.source = sourceFilter;
      if (eventTypeFilter !== 'all') params.event_type = eventTypeFilter;
      if (startDate) params.from = startDate;
      if (endDate) params.to = endDate;
      const data = await apiGet<CallbackRecord[]>('/api/callbacks', params);
      setCallbacks(data);
    } catch (e) {
      console.error('Failed to load callbacks', e);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sourceFilter, eventTypeFilter, startDate, endDate]);

  useEffect(() => {
    fetchCallbacks();
  }, [fetchCallbacks]);

  const sources = useMemo(() => {
    const set = new Set(callbacks.map((c) => c.source));
    return Array.from(set);
  }, [callbacks]);

  const eventTypes = useMemo(() => {
    const set = new Set(callbacks.map((c) => c.event_type));
    return Array.from(set);
  }, [callbacks]);

  const filteredCallbacks = useMemo(() => {
    return callbacks.filter((cb) => {
      if (searchValue) {
        const kw = searchValue.toLowerCase();
        const matchSource = cb.source.toLowerCase().includes(kw);
        const matchEvent = cb.event_type.toLowerCase().includes(kw);
        const matchReason = (cb.failure_reason ?? '').toLowerCase().includes(kw);
        if (!matchSource && !matchEvent && !matchReason) return false;
      }
      return true;
    });
  }, [callbacks, searchValue]);

  const stats = useMemo(() => {
    return {
      total: callbacks.length,
      success: callbacks.filter((c) => c.status === 'success').length,
      failed: callbacks.filter((c) => c.status === 'failed').length,
      pending: callbacks.filter((c) => c.status === 'pending').length,
    };
  }, [callbacks]);

  const openViewModal = (cb: CallbackRecord) => {
    setSelectedCallback(cb);
    setViewModalOpen(true);
  };

  const openCompModal = (cb: CallbackRecord) => {
    setSelectedCallback(cb);
    reset({ action: '', result: 'success', remark: '' });
    setCompModalOpen(true);
  };

  const handleRetry = async (cb: CallbackRecord, success: boolean) => {
    try {
      await apiPost('/api/callbacks', { action: 'retry', id: cb.id, payload: { success } });
      await fetchCallbacks();
    } catch (e) {
      console.error('Failed to retry callback', e);
    }
  };

  const handleCompensationSubmit = async (data: CompensationFormData) => {
    if (!selectedCallback) return;
    if (!currentUser) return;
    try {
      await apiPost('/api/callbacks', {
        action: 'compensate',
        id: selectedCallback.id,
        payload: {
          action: data.action,
          executed_by: currentUser.id,
          executed_by_name: currentUser.full_name,
          result: data.result,
          remark: data.remark || undefined,
        },
      });
      await fetchCallbacks();
      setCompModalOpen(false);
      setSelectedCallback(null);
    } catch (e) {
      console.error('Failed to add compensation', e);
    }
  };

  const columns = [
    {
      key: 'source',
      header: '来源',
      render: (r: CallbackRecord) => (
        <div>
          <div className="font-medium text-slate-900">{r.source}</div>
          <div className="text-xs text-slate-500">{r.event_type}</div>
        </div>
      ),
    },
    {
      key: 'event_type',
      header: '事件类型',
      render: (r: CallbackRecord) => (
        <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono">
          {r.event_type}
        </span>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (r: CallbackRecord) => (
        <Badge className={callbackStatusColor[r.status]}>
          {callbackStatusLabel[r.status]}
        </Badge>
      ),
    },
    {
      key: 'failure_reason',
      header: '失败原因',
      render: (r: CallbackRecord) => {
        if (!r.failure_reason) return <span className="text-slate-300">—</span>;
        return (
          <div
            className="max-w-xs truncate px-2 py-1 rounded bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
            title={r.failure_reason}
          >
            <AlertTriangle className="w-3 h-3 inline mr-1 text-red-500" />
            {r.failure_reason}
          </div>
        );
      },
    },
    {
      key: 'retry_count',
      header: '重试次数',
      render: (r: CallbackRecord) => (
        <span
          className={cn(
            'inline-flex items-center gap-1',
            r.retry_count > 0 ? 'text-amber-600 font-medium' : 'text-slate-400',
          )}
        >
          <RotateCw className="w-3.5 h-3.5" />
          {r.retry_count}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: '创建时间',
      render: (r: CallbackRecord) => formatDate(r.created_at),
      className: 'text-slate-500',
    },
    {
      key: 'actions',
      header: '操作',
      render: (r: CallbackRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openViewModal(r);
            }}
            className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800"
          >
            <Eye className="w-4 h-4" />
            详情
          </button>
          {r.status !== 'success' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry(r, true);
                }}
                className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
              >
                <Check className="w-4 h-4" />
                重试成功
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRetry(r, false);
                }}
                className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
                重试失败
              </button>
            </>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openCompModal(r);
            }}
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            <FileText className="w-4 h-4" />
            登记补偿
          </button>
        </div>
      ),
    },
  ];

  if (!canAccess) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <EmptyState
          icon={<Lock className="w-8 h-8" />}
          title="无访问权限"
          description="回调监控功能仅店长可见。如需访问，请联系门店管理员。"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="回调监控"
        description="监控外部系统回调的处理状态，对失败回调进行重试或人工补偿。"
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="总回调数"
          value={stats.total}
          icon={<Bell className="w-4 h-4" />}
          accent="default"
        />
        <StatCard
          label="成功"
          value={stats.success}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="success"
          onClick={() => setStatusFilter('success')}
        />
        <StatCard
          label="失败"
          value={stats.failed}
          icon={<XCircle className="w-4 h-4" />}
          accent="danger"
          onClick={() => setStatusFilter('failed')}
        />
        <StatCard
          label="待处理"
          value={stats.pending}
          icon={<Clock className="w-4 h-4" />}
          accent="warn"
          onClick={() => setStatusFilter('pending')}
        />
      </section>

      <FilterBar
        searchPlaceholder="搜索来源、事件类型、失败原因..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CallbackStatus | 'all')}
            className="w-32"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="w-40"
          >
            <option value="all">全部来源</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>

          <Select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="w-44"
          >
            <option value="all">全部事件类型</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>

          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input w-auto"
            />
            <span className="text-slate-400">至</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input w-auto"
            />
          </div>

          {(statusFilter !== 'all' || sourceFilter !== 'all' || eventTypeFilter !== 'all' || startDate || endDate || searchValue) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setSourceFilter('all');
                setEventTypeFilter('all');
                setStartDate('');
                setEndDate('');
                setSearchValue('');
              }}
              className="btn-secondary text-xs"
            >
              重置筛选
            </button>
          )}
        </div>
      </FilterBar>

      {loading ? (
        <div className="text-center py-20 text-slate-500">加载中...</div>
      ) : (
        <DataTable
          data={filteredCallbacks}
          rowKey={(r) => r.id}
          columns={columns}
          emptyText="暂无符合条件的回调记录"
        />
      )}

      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedCallback(null);
        }}
        title="回调详情"
        size="lg"
      >
        {selectedCallback && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">来源</div>
                <div className="font-medium text-slate-900">{selectedCallback.source}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">事件类型</div>
                <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-mono">
                  {selectedCallback.event_type}
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <Badge className={callbackStatusColor[selectedCallback.status]}>
                  {callbackStatusLabel[selectedCallback.status]}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">重试次数</div>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 font-medium',
                    selectedCallback.retry_count > 0 ? 'text-amber-600' : 'text-slate-400',
                  )}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  {selectedCallback.retry_count} 次
                </span>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">创建时间</div>
                <div className="text-slate-700">{formatDate(selectedCallback.created_at)}</div>
              </div>
              {selectedCallback.processed_at && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">处理时间</div>
                  <div className="text-slate-700">{formatDate(selectedCallback.processed_at)}</div>
                </div>
              )}
            </div>

            {selectedCallback.failure_reason && (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  失败原因
                </div>
                <div className="text-red-700 whitespace-pre-wrap font-mono text-sm bg-white/60 p-3 rounded">
                  {selectedCallback.failure_reason}
                </div>
              </div>
            )}

            <div>
              <div className="text-xs text-slate-500 mb-2">Payload</div>
              <pre className="card p-4 bg-slate-900 text-slate-100 text-xs overflow-auto font-mono rounded-lg">
                {JSON.stringify(selectedCallback.payload, null, 2)}
              </pre>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs text-slate-500">
                  补偿记录（{selectedCallback.compensation_records.length}）
                </div>
                <button
                  onClick={() => openCompModal(selectedCallback)}
                  className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  <FileText className="w-4 h-4" />
                  新增补偿
                </button>
              </div>
              {selectedCallback.compensation_records.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-6 bg-slate-50 rounded-lg">
                  暂无补偿记录
                </div>
              ) : (
                <div className="relative pl-6">
                  <div className="absolute left-2.5 top-2 bottom-2 w-px bg-slate-200" />
                  <div className="space-y-4">
                    {selectedCallback.compensation_records.map((rec: CompensationRecord, idx: number) => (
                      <div key={rec.id} className="relative">
                        <div
                          className={cn(
                            'absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-white',
                            rec.result === 'success' ? 'bg-emerald-500' : 'bg-red-500',
                          )}
                        />
                        <div className="card p-3 bg-white border border-slate-200">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded',
                                    rec.result === 'success'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-red-50 text-red-700',
                                  )}
                                >
                                  {rec.result === 'success' ? '补偿成功' : '补偿失败'}
                                </span>
                                <span className="text-xs text-slate-400">
                                  #{idx + 1}
                                </span>
                              </div>
                              <div className="text-sm text-slate-800 font-medium mb-1">
                                {rec.action}
                              </div>
                              {rec.remark && (
                                <div className="text-xs text-slate-500 mb-2">
                                  {rec.remark}
                                </div>
                              )}
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {rec.executed_by_name ?? rec.executed_by}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDate(rec.executed_at)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={compModalOpen}
        onClose={() => {
          setCompModalOpen(false);
          setSelectedCallback(null);
        }}
        title="登记补偿记录"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setCompModalOpen(false);
                setSelectedCallback(null);
              }}
              className="btn-secondary"
            >
              取消
            </button>
            <button
              onClick={handleSubmit(handleCompensationSubmit)}
              disabled={isSubmitting}
              className="btn-primary"
            >
              <Check className="w-4 h-4" />
              提交
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit(handleCompensationSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              操作描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              placeholder="描述补偿操作的具体内容，如：手动同步数据至DMS、电话告知客户、调整库存等"
              {...register('action')}
              className={cn(
                'input resize-none',
                errors.action && 'border-red-400 focus:ring-red-200 focus:border-red-400',
              )}
            />
            {errors.action && (
              <p className="mt-1 text-sm text-red-500">{errors.action.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              处理结果 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3">
              {([
                { value: 'success', label: '成功', color: 'emerald', icon: CheckCircle2 },
                { value: 'failed', label: '失败', color: 'red', icon: XCircle },
              ] as const).map((opt) => {
                const IconComp = opt.icon;
                return (
                  <label
                    key={opt.value}
                    className={cn(
                      'flex-1 cursor-pointer border rounded-lg p-3 transition',
                      'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <input
                      type="radio"
                      value={opt.value}
                      {...register('result')}
                      onChange={(e) => setValue('result', e.target.value as 'success' | 'failed')}
                      className="sr-only peer"
                    />
                    <div
                      className={cn(
                        'flex items-center gap-2 font-medium',
                        'peer-checked:text-slate-900 text-slate-500',
                      )}
                    >
                      <IconComp
                        className={cn(
                          'w-4 h-4',
                          opt.color === 'emerald' && 'peer-checked:text-emerald-600',
                          opt.color === 'red' && 'peer-checked:text-red-600',
                        )}
                      />
                      {opt.label}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              备注
            </label>
            <textarea
              rows={2}
              placeholder="可选：补充说明、参考链接、关联单据等"
              {...register('remark')}
              className="input resize-none"
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
