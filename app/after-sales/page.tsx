'use client';

import { useState, useMemo } from 'react';
import { X, Filter, UserRound, Clock, AlertTriangle } from 'lucide-react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { mockAfterSalesTickets, mockUsers } from '@/lib/mockData';
import { formatDateTime } from '@/lib/utils';
import type { AfterSalesTicket, TicketPriority, TicketStatus } from '@/lib/types';

const PRIORITY_OPTIONS: { value: TicketPriority | 'all'; label: string }[] = [
  { value: 'all', label: '全部优先级' },
  { value: 'high', label: '高优先' },
  { value: 'medium', label: '中优先' },
  { value: 'low', label: '低优先' },
];

const STATUS_OPTIONS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
];

export default function AfterSalesPage() {
  const [priorityFilter, setPriorityFilter] = useState<TicketPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all');
  const [detailTicket, setDetailTicket] = useState<AfterSalesTicket | null>(null);

  const filteredTickets = useMemo(() => {
    return mockAfterSalesTickets.filter((t) => {
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      return true;
    });
  }, [priorityFilter, statusFilter]);

  const columns = [
    {
      key: 'title',
      title: '工单标题',
      render: (row: AfterSalesTicket) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-2">
            <StatusBadge status={row.priority} />
            <span className="font-medium text-zinc-900 truncate">{row.title}</span>
          </div>
          <div className="mt-0.5 text-xs text-zinc-500 truncate">
            {row.project_name}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: '状态',
      render: (row: AfterSalesTicket) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'reporter_name',
      title: '提交人',
      render: (row: AfterSalesTicket) => (
        <div className="flex items-center gap-1.5">
          <UserRound className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-zinc-700">{row.reporter_name}</span>
        </div>
      ),
    },
    {
      key: 'assignee_name',
      title: '分配人',
      render: (row: AfterSalesTicket) => (
        <div className="flex items-center gap-1.5">
          {row.assignee_name ? (
            <>
              <UserRound className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-zinc-700">{row.assignee_name}</span>
            </>
          ) : (
            <span className="text-zinc-400">未分配</span>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      title: '提交时间',
      render: (row: AfterSalesTicket) => (
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-sm text-zinc-700">{formatDateTime(row.created_at)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '120px',
      render: (row: AfterSalesTicket) => (
        <Button size="sm" variant="secondary" onClick={() => setDetailTicket(row)}>
          查看详情
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">售后报修</h1>
        <p className="mt-1 text-sm text-zinc-500">
          管理客户售后报修工单，跟踪处理进度
        </p>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-zinc-400" />
            <span className="text-sm text-zinc-600">筛选：</span>
          </div>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TicketPriority | 'all')}
            className="h-9 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
            className="h-9 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="ml-auto">
            <Button>新建工单</Button>
          </div>
        </div>
      </Card>

      <Card className="!p-0">
        <DataTable<AfterSalesTicket>
          columns={columns}
          data={filteredTickets}
          rowKey={(row) => row.id}
          emptyText="暂无工单数据"
        />
      </Card>

      {detailTicket && (
        <DetailModal ticket={detailTicket} onClose={() => setDetailTicket(null)} />
      )}
    </div>
  );
}

interface DetailModalProps {
  ticket: AfterSalesTicket;
  onClose: () => void;
}

function DetailModal({ ticket, onClose }: DetailModalProps) {
  const [assigneeId, setAssigneeId] = useState<string | null>(ticket.assignee_id);
  const [status, setStatus] = useState<TicketStatus>(ticket.status);

  const projectManagers = mockUsers.filter((u) => u.role === 'project_manager');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-lg bg-white shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={ticket.priority}>
              <span className="flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {ticket.priority === 'high' ? '高优先' : ticket.priority === 'medium' ? '中优先' : '低优先'}
              </span>
            </StatusBadge>
            <h3 className="font-serif text-lg font-semibold text-zinc-900">
              {ticket.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5 space-y-5 scrollbar-thin">
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-zinc-50 p-4">
            <div>
              <div className="text-xs text-zinc-500">所属项目</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {ticket.project_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">提交人</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {ticket.reporter_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">提交时间</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatDateTime(ticket.created_at)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">完成时间</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {ticket.completed_at ? formatDateTime(ticket.completed_at) : '-'}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-zinc-900">问题描述</h4>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 text-sm text-zinc-700 whitespace-pre-wrap">
              {ticket.description}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                分配处理人
              </label>
              <select
                value={assigneeId ?? ''}
                onChange={(e) => setAssigneeId(e.target.value || null)}
                className="w-full h-9 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="">未分配</option>
                {projectManagers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                更新状态
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TicketStatus)}
                className="w-full h-9 rounded border border-zinc-300 bg-white px-3 text-sm text-zinc-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="closed">已关闭</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onClose}>保存更改</Button>
        </div>
      </div>
    </div>
  );
}
