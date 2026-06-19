'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  PlayCircle,
  CheckCircle2,
  Clock,
  Hourglass,
  ChevronDown,
  ChevronRight,
  Layers,
  List,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { PageHeader } from '@/components/PageHeader';
import { FilterBar, Select } from '@/components/FilterBar';
import { DataTable, StatCard, Badge } from '@/components/DataTable';
import type { NodeStatus } from '@/lib/types';
import {
  nodeStatusLabel,
  nodeStatusColor,
  formatDate,
  cn,
} from '@/lib/utils';

const STATUS_OPTIONS: { value: NodeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待开始' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
];

export default function ProductionNodesPage() {
  const router = useRouter();
  const productionNodes = useAppStore((s) => s.productionNodes);
  const workOrders = useAppStore((s) => s.workOrders);
  const users = useAppStore((s) => s.users);
  const updateProductionNode = useAppStore((s) => s.updateProductionNode);
  const currentUser = useAppStore((s) => s.currentUser);

  const [workOrderFilter, setWorkOrderFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<NodeStatus | 'all'>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [grouped, setGrouped] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedWorkOrders, setExpandedWorkOrders] = useState<Set<string>>(new Set());

  const teamLeads = useMemo(
    () => users.filter((u) => u.role === 'team_lead' && u.is_active),
    [users],
  );

  const filteredNodes = useMemo(() => {
    return productionNodes.filter((node) => {
      if (workOrderFilter !== 'all' && node.workorder_id !== workOrderFilter) return false;
      if (statusFilter !== 'all' && node.status !== statusFilter) return false;
      if (teamFilter !== 'all') {
        const wo = workOrders.find((w) => w.id === node.workorder_id);
        if (!wo || wo.team_id !== teamFilter) return false;
      }
      return true;
    });
  }, [productionNodes, workOrderFilter, statusFilter, teamFilter, workOrders]);

  const stats = useMemo(() => {
    const pending = productionNodes.filter((n) => n.status === 'pending').length;
    const inProgress = productionNodes.filter((n) => n.status === 'in_progress').length;
    const completed = productionNodes.filter((n) => n.status === 'completed');

    let avgDuration = 0;
    if (completed.length > 0) {
      const durations = completed
        .filter((n) => n.started_at && n.completed_at)
        .map((n) => {
          const start = new Date(n.started_at!).getTime();
          const end = new Date(n.completed_at!).getTime();
          return (end - start) / (1000 * 60);
        });
      if (durations.length > 0) {
        avgDuration = Math.round(
          durations.reduce((a, b) => a + b, 0) / durations.length,
        );
      }
    }

    return { pending, inProgress, completed: completed.length, avgDuration };
  }, [productionNodes]);

  const nodesByWorkOrder = useMemo(() => {
    const map: Record<string, typeof filteredNodes> = {};
    for (const node of filteredNodes) {
      if (!map[node.workorder_id]) {
        map[node.workorder_id] = [];
      }
      map[node.workorder_id].push(node);
    }
    for (const woId of Object.keys(map)) {
      map[woId].sort((a, b) => a.sequence - b.sequence);
    }
    return map;
  }, [filteredNodes]);

  function toggleWorkOrder(woId: string) {
    const next = new Set(expandedWorkOrders);
    if (next.has(woId)) {
      next.delete(woId);
    } else {
      next.add(woId);
    }
    setExpandedWorkOrders(next);
  }

  function toggleSelectNode(nodeId: string) {
    const next = new Set(selectedIds);
    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }
    setSelectedIds(next);
  }

  function toggleSelectAllForWorkOrder(woId: string) {
    const nodes = nodesByWorkOrder[woId] || [];
    const allSelected = nodes.every((n) => selectedIds.has(n.id));
    const next = new Set(selectedIds);
    if (allSelected) {
      nodes.forEach((n) => next.delete(n.id));
    } else {
      nodes.forEach((n) => next.add(n.id));
    }
    setSelectedIds(next);
  }

  function batchStart() {
    const now = new Date().toISOString();
    const operatorId = currentUser?.id || '';
    const operatorName = currentUser?.full_name || '';
    for (const id of selectedIds) {
      const node = productionNodes.find((n) => n.id === id);
      if (node && node.status === 'pending') {
        updateProductionNode(id, {
          status: 'in_progress',
          started_at: now,
          operator_id: operatorId,
          operator_name: operatorName,
        });
      }
    }
    setSelectedIds(new Set());
  }

  function batchComplete() {
    const now = new Date().toISOString();
    for (const id of selectedIds) {
      const node = productionNodes.find((n) => n.id === id);
      if (node && (node.status === 'pending' || node.status === 'in_progress')) {
        updateProductionNode(id, {
          status: 'completed',
          completed_at: now,
          started_at: node.started_at || now,
        });
      }
    }
    setSelectedIds(new Set());
  }

  const flatColumns = [
    {
      key: 'select',
      header: '',
      className: 'w-10',
      render: (row: any) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.id)}
          onChange={(e) => {
            e.stopPropagation();
            toggleSelectNode(row.id);
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
        />
      ),
    },
    {
      key: 'workorder',
      header: '工单',
      render: (row: any) => (
        <div>
          <div className="font-medium text-slate-800">{row.workorder_title}</div>
          <div className="text-xs text-slate-400">#{row.workorder_id}</div>
        </div>
      ),
    },
    {
      key: 'node_name',
      header: '节点名',
      render: (row: any) => (
        <div className="font-medium text-slate-800">
          <span className="text-slate-400 mr-2">{row.sequence}.</span>
          {row.node_name}
        </div>
      ),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: any) => (
        <Badge className={nodeStatusColor[row.status]}>
          {nodeStatusLabel[row.status]}
        </Badge>
      ),
    },
    {
      key: 'planned',
      header: '计划开始',
      render: () => <span className="text-slate-400">—</span>,
    },
    {
      key: 'started_at',
      header: '实际开始',
      render: (row: any) =>
        row.started_at ? formatDate(row.started_at) : <span className="text-slate-400">—</span>,
    },
    {
      key: 'completed_at',
      header: '完成时间',
      render: (row: any) =>
        row.completed_at ? formatDate(row.completed_at) : <span className="text-slate-400">—</span>,
    },
    {
      key: 'operator_name',
      header: '操作人',
      render: (row: any) =>
        row.operator_name || <span className="text-slate-400">—</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="生产节点查询"
        description="批量查询和管理维修工单的施工节点进度，支持批量开始和完成。"
      />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="待开始节点"
          value={stats.pending}
          icon={<Clock className="w-4 h-4" />}
          accent="default"
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          label="进行中节点"
          value={stats.inProgress}
          icon={<PlayCircle className="w-4 h-4" />}
          accent="warn"
          onClick={() => setStatusFilter('in_progress')}
        />
        <StatCard
          label="已完成节点"
          value={stats.completed}
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="success"
          onClick={() => setStatusFilter('completed')}
        />
        <StatCard
          label="平均耗时"
          value={`${stats.avgDuration} 分钟`}
          icon={<Hourglass className="w-4 h-4" />}
          accent="default"
        />
      </section>

      <FilterBar>
        <Select
          value={workOrderFilter}
          onChange={(e) => setWorkOrderFilter(e.target.value)}
          className="w-56"
        >
          <option value="all">全部工单</option>
          {workOrders.map((wo) => (
            <option key={wo.id} value={wo.id}>
              {wo.title}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as NodeStatus | 'all')}
          className="w-40"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </Select>
        <Select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          className="w-40"
        >
          <option value="all">全部班组</option>
          {teamLeads.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}组
            </option>
          ))}
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setGrouped(false)}
            className={cn(
              'btn-ghost flex items-center gap-1 text-sm',
              !grouped && 'bg-slate-100',
            )}
          >
            <List className="w-4 h-4" />
            平铺
          </button>
          <button
            onClick={() => setGrouped(true)}
            className={cn(
              'btn-ghost flex items-center gap-1 text-sm',
              grouped && 'bg-slate-100',
            )}
          >
            <Layers className="w-4 h-4" />
            按工单分组
          </button>
        </div>
      </FilterBar>

      {selectedIds.size > 0 && (
        <div className="card p-3 mb-4 flex items-center justify-between bg-brand-50/50 border-brand-200">
          <div className="text-sm text-slate-700">
            已选择 <span className="font-semibold text-brand-600">{selectedIds.size}</span> 个节点
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={batchStart}
              className="btn-secondary flex items-center gap-1"
            >
              <PlayCircle className="w-4 h-4" />
              批量开始
            </button>
            <button
              onClick={batchComplete}
              className="btn-primary flex items-center gap-1"
            >
              <CheckCircle2 className="w-4 h-4" />
              标记完成
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="btn-ghost text-sm"
            >
              取消选择
            </button>
          </div>
        </div>
      )}

      {!grouped ? (
        <DataTable
          data={filteredNodes}
          rowKey={(r) => r.id}
          onRowClick={(r) => router.push(`/workorders/${r.workorder_id}`)}
          columns={flatColumns}
          emptyText="暂无符合条件的节点"
        />
      ) : (
        <div className="space-y-4">
          {Object.keys(nodesByWorkOrder).length === 0 && (
            <div className="card p-10 flex flex-col items-center justify-center text-slate-400">
              <Layers className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">暂无符合条件的节点</p>
            </div>
          )}
          {Object.entries(nodesByWorkOrder).map(([woId, nodes]) => {
            const wo = workOrders.find((w) => w.id === woId);
            const allSelected = nodes.every((n) => selectedIds.has(n.id));
            const someSelected = nodes.some((n) => selectedIds.has(n.id));
            const isExpanded = expandedWorkOrders.has(woId);
            const completedCount = nodes.filter((n) => n.status === 'completed').length;
            const progress = Math.round((completedCount / nodes.length) * 100);

            return (
              <div
                key={woId}
                className="card overflow-hidden"
              >
                <div
                  className="px-5 py-3 flex items-center gap-3 bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                  onClick={() => toggleWorkOrder(woId)}
                >
                  <button
                    className="text-slate-400 hover:text-slate-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWorkOrder(woId);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = !allSelected && someSelected;
                    }}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelectAllForWorkOrder(woId);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-slate-800 truncate">
                      {wo?.title || woId}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      共 {nodes.length} 个节点 · 已完成 {completedCount} · 进度 {progress}%
                    </div>
                  </div>
                  <div className="w-40 hidden sm:block">
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          progress === 100
                            ? 'bg-emerald-500'
                            : progress > 0
                              ? 'bg-amber-500'
                              : 'bg-slate-300',
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    className="btn-ghost text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/workorders/${woId}`);
                    }}
                  >
                    查看工单
                  </button>
                </div>

                {isExpanded && (
                  <div className="overflow-x-auto scrollbar-thin">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr>
                          <th className="th w-10"></th>
                          <th className="th">序号</th>
                          <th className="th">节点名</th>
                          <th className="th">状态</th>
                          <th className="th">计划开始</th>
                          <th className="th">实际开始</th>
                          <th className="th">完成时间</th>
                          <th className="th">操作人</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {nodes.map((node, idx) => (
                          <tr
                            key={node.id}
                            className={cn(
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60',
                              'cursor-pointer hover:bg-brand-50/40 transition-colors',
                            )}
                            onClick={() => router.push(`/workorders/${node.workorder_id}`)}
                          >
                            <td className="td w-10">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(node.id)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleSelectNode(node.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                              />
                            </td>
                            <td className="td text-slate-500 font-mono text-sm">{node.sequence}</td>
                            <td className="td font-medium text-slate-800">{node.node_name}</td>
                            <td className="td">
                              <Badge className={nodeStatusColor[node.status]}>
                                {nodeStatusLabel[node.status]}
                              </Badge>
                            </td>
                            <td className="td text-slate-400">—</td>
                            <td className="td">
                              {node.started_at
                                ? formatDate(node.started_at)
                                : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="td">
                              {node.completed_at
                                ? formatDate(node.completed_at)
                                : <span className="text-slate-400">—</span>}
                            </td>
                            <td className="td">
                              {node.operator_name || <span className="text-slate-400">—</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
