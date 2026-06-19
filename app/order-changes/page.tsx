'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileEdit,
  Clock,
  Settings,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  CalendarDays,
  User,
  Ticket,
  Car,
  Package,
  Wrench,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, Badge, StatCard } from '@/components/DataTable';
import { Modal } from '@/components/Modal';
import {
  changeStatusLabel,
  changeStatusColor,
  formatDate,
  cn,
} from '@/lib/utils';
import type { ChangeStatus, OrderChange, AffectedObject } from '@/lib/types';

const STATUS_OPTIONS: { value: ChangeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'open', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'closed', label: '已关闭' },
];

const AFFECTED_TYPE_LABEL: Record<AffectedObject['type'], string> = {
  vehicle: '车辆',
  part: '配件',
  workorder: '工单',
};

const AFFECTED_TYPE_ICON: Record<AffectedObject['type'], typeof Car> = {
  vehicle: Car,
  part: Package,
  workorder: Wrench,
};

const AFFECTED_TYPE_LINK: Record<AffectedObject['type'], string> = {
  vehicle: '/vehicles',
  part: '/parts',
  workorder: '/workorders',
};

export default function OrderChangesPage() {
  const orderChanges = useAppStore((s) => s.orderChanges);
  const users = useAppStore((s) => s.users);
  const workOrders = useAppStore((s) => s.workOrders);
  const closeOrderChange = useAppStore((s) => s.closeOrderChange);

  const [statusFilter, setStatusFilter] = useState<ChangeStatus | 'all'>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [workorderFilter, setWorkorderFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchValue, setSearchValue] = useState('');

  const [selectedChange, setSelectedChange] = useState<OrderChange | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [closeNoteError, setCloseNoteError] = useState('');

  const filteredChanges = useMemo(() => {
    return orderChanges.filter((oc) => {
      if (statusFilter !== 'all' && oc.status !== statusFilter) return false;
      if (responsibleFilter !== 'all' && oc.responsible_id !== responsibleFilter) return false;
      if (workorderFilter !== 'all' && oc.workorder_id !== workorderFilter) return false;
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(oc.created_at) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(oc.created_at) > end) return false;
      }
      if (searchValue) {
        const kw = searchValue.toLowerCase();
        const matchType = oc.change_type.toLowerCase().includes(kw);
        const matchContent = oc.content.toLowerCase().includes(kw);
        const matchResponsible = (oc.responsible_name ?? '').toLowerCase().includes(kw);
        const matchWorkOrder = (oc.workorder_title ?? '').toLowerCase().includes(kw);
        if (!matchType && !matchContent && !matchResponsible && !matchWorkOrder) return false;
      }
      return true;
    });
  }, [orderChanges, statusFilter, responsibleFilter, workorderFilter, startDate, endDate, searchValue]);

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      open: orderChanges.filter((oc) => oc.status === 'open').length,
      processing: orderChanges.filter((oc) => oc.status === 'processing').length,
      closed: orderChanges.filter((oc) => oc.status === 'closed').length,
      thisMonth: orderChanges.filter((oc) => new Date(oc.created_at) >= monthStart).length,
    };
  }, [orderChanges]);

  const columns = [
    {
      key: 'change_type',
      header: '变更类型',
      render: (r: OrderChange) => (
        <div className="font-medium text-slate-900">{r.change_type}</div>
      ),
    },
    {
      key: 'content',
      header: '内容摘要',
      render: (r: OrderChange) => (
        <div className="max-w-xs truncate text-slate-600" title={r.content}>
          {r.content}
        </div>
      ),
    },
    {
      key: 'affected_count',
      header: '影响对象数量',
      render: (r: OrderChange) => (
        <span className="inline-flex items-center gap-1 text-slate-700">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          {r.affected_objects.length}
        </span>
      ),
    },
    {
      key: 'responsible_name',
      header: '责任人',
      render: (r: OrderChange) => (
        <div className="flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{r.responsible_name ?? '—'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (r: OrderChange) => (
        <Badge className={changeStatusColor[r.status]}>
          {changeStatusLabel[r.status]}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: '创建时间',
      render: (r: OrderChange) => formatDate(r.created_at),
      className: 'text-slate-500',
    },
    {
      key: 'actions',
      header: '操作',
      render: (r: OrderChange) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedChange(r);
            setCloseNote(r.close_note ?? '');
            setCloseNoteError('');
            setViewModalOpen(true);
          }}
          className="inline-flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          <Eye className="w-4 h-4" />
          查看/处理
        </button>
      ),
    },
  ];

  const handleStatusChange = (newStatus: ChangeStatus) => {
    if (!selectedChange) return;
    if (newStatus === 'closed') {
      if (!closeNote.trim()) {
        setCloseNoteError('关闭说明为必填项');
        return;
      }
      closeOrderChange(selectedChange.id, closeNote.trim());
    } else {
      useAppStore.setState((s) => ({
        orderChanges: s.orderChanges.map((oc) =>
          oc.id === selectedChange.id ? { ...oc, status: newStatus } : oc,
        ),
      }));
    }
    setViewModalOpen(false);
    setSelectedChange(null);
  };

  return (
    <div>
      <PageHeader
        title="订单变更管理"
        description="跟踪和处理工单执行过程中的变更申请，确保变更可控。"
        addHref="/order-changes/new"
        addLabel="新增变更"
      />

      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="待处理变更"
          value={stats.open}
          icon={<AlertTriangle className="w-4 h-4" />}
          accent="danger"
          onClick={() => setStatusFilter('open')}
        />
        <StatCard
          label="处理中"
          value={stats.processing}
          icon={<Settings className="w-4 h-4" />}
          accent="warn"
          onClick={() => setStatusFilter('processing')}
        />
        <StatCard
          label="已关闭"
          value={stats.closed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="success"
          onClick={() => setStatusFilter('closed')}
        />
        <StatCard
          label="本月变更数"
          value={stats.thisMonth}
          icon={<FileEdit className="w-4 h-4" />}
          accent="default"
        />
      </section>

      <FilterBar
        searchPlaceholder="搜索变更类型、内容、责任人、关联工单..."
        searchValue={searchValue}
        onSearchChange={setSearchValue}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChangeStatus | 'all')}
            className="w-36"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="w-40"
          >
            <option value="all">全部责任人</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name}
              </option>
            ))}
          </Select>

          <Select
            value={workorderFilter}
            onChange={(e) => setWorkorderFilter(e.target.value)}
            className="w-48"
          >
            <option value="all">全部工单</option>
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
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

          {(statusFilter !== 'all' || responsibleFilter !== 'all' || workorderFilter !== 'all' || startDate || endDate || searchValue) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setResponsibleFilter('all');
                setWorkorderFilter('all');
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

      <DataTable
        data={filteredChanges}
        rowKey={(r) => r.id}
        columns={columns}
        emptyText="暂无符合条件的变更记录"
      />

      <Modal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedChange(null);
          setCloseNoteError('');
        }}
        title="变更详情"
        size="lg"
        footer={
          selectedChange && selectedChange.status !== 'closed' ? (
            <div className="flex justify-between w-full">
              <div className="flex gap-2">
                {selectedChange.status === 'open' && (
                  <button
                    onClick={() => handleStatusChange('processing')}
                    className="btn-secondary"
                  >
                    标记处理中
                  </button>
                )}
                {selectedChange.status === 'processing' && (
                  <button
                    onClick={() => handleStatusChange('open')}
                    className="btn-secondary"
                  >
                    退回待处理
                  </button>
                )}
              </div>
              <button
                onClick={() => handleStatusChange('closed')}
                className="btn-primary"
              >
                <XCircle className="w-4 h-4" />
                关闭变更
              </button>
            </div>
          ) : null
        }
      >
        {selectedChange && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">变更类型</div>
                <div className="font-medium text-slate-900">{selectedChange.change_type}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">状态</div>
                <Badge className={changeStatusColor[selectedChange.status]}>
                  {changeStatusLabel[selectedChange.status]}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">责任人</div>
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{selectedChange.responsible_name ?? '—'}</span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">创建时间</div>
                <div className="text-slate-700">{formatDate(selectedChange.created_at)}</div>
              </div>
              {selectedChange.workorder_id && (
                <div className="sm:col-span-2">
                  <div className="text-xs text-slate-500 mb-1">关联工单</div>
                  <Link
                    href={`/workorders/${selectedChange.workorder_id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    {selectedChange.workorder_title}
                  </Link>
                </div>
              )}
              {selectedChange.created_by_name && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">创建人</div>
                  <div className="text-slate-700">{selectedChange.created_by_name}</div>
                </div>
              )}
              {selectedChange.closed_at && (
                <div>
                  <div className="text-xs text-slate-500 mb-1">关闭时间</div>
                  <div className="text-slate-700">{formatDate(selectedChange.closed_at)}</div>
                </div>
              )}
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-1.5">变更内容</div>
              <div className="card p-4 bg-slate-50 text-slate-700 whitespace-pre-wrap leading-relaxed">
                {selectedChange.content}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 mb-2">影响对象（{selectedChange.affected_objects.length}）</div>
              <div className="flex flex-wrap gap-2">
                {selectedChange.affected_objects.map((obj, idx) => {
                  const IconComp = AFFECTED_TYPE_ICON[obj.type];
                  return (
                    <Link
                      key={idx}
                      href={`${AFFECTED_TYPE_LINK[obj.type]}/${obj.type === 'workorder' ? obj.id : ''}`}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition',
                        obj.type === 'vehicle' && 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
                        obj.type === 'part' && 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
                        obj.type === 'workorder' && 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
                      )}
                    >
                      <IconComp className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{AFFECTED_TYPE_LABEL[obj.type]}</span>
                      <Clock className="w-3 h-3 opacity-60" />
                      <span>{obj.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                关闭说明 {selectedChange.status !== 'closed' && <span className="text-red-500">*</span>}
              </label>
              <textarea
                rows={3}
                value={closeNote}
                onChange={(e) => {
                  setCloseNote(e.target.value);
                  if (closeNoteError) setCloseNoteError('');
                }}
                disabled={selectedChange.status === 'closed'}
                placeholder={selectedChange.status === 'closed' ? '该变更已关闭' : '请输入变更关闭原因、处理结果等说明...'}
                className={cn(
                  'input resize-none',
                  closeNoteError && 'border-red-400 focus:ring-red-200 focus:border-red-400',
                  selectedChange.status === 'closed' && 'bg-slate-50 text-slate-500',
                )}
              />
              {closeNoteError && (
                <p className="mt-1 text-sm text-red-500">{closeNoteError}</p>
              )}
            </div>

            {selectedChange.status === 'closed' && selectedChange.close_note && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">关闭说明</div>
                <div className="text-slate-700 whitespace-pre-wrap">{selectedChange.close_note}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
