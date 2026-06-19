'use client';

import { useState, useMemo } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  Button,
  StatusBadge,
  DataTable,
} from '@/components/ui';
import {
  mockProjects,
  mockProjectNodes,
  mockDrawingFiles,
  mockInspectionTasks,
  mockBudgetChangeLogs,
} from '@/lib/mockData';
import {
  formatDate,
  formatCurrency,
  formatFileSize,
  formatDateTime,
  cn,
} from '@/lib/utils';
import type {
  Project,
  ProjectNode,
  DrawingFile,
  InspectionTask,
  BudgetChangeLog,
  NodeStatus,
} from '@/lib/types';

type TabKey = 'nodes' | 'drawings' | 'inspections' | 'budget';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'nodes', label: '节点进度', icon: '📋' },
  { key: 'drawings', label: '图纸版本', icon: '📐' },
  { key: 'inspections', label: '巡检记录', icon: '🔍' },
  { key: 'budget', label: '预算概览', icon: '💰' },
];

const NODE_STATUS_COLORS: Record<NodeStatus, string> = {
  not_started: 'bg-zinc-300',
  in_progress: 'bg-brand-500',
  completed: 'bg-green-500',
  delayed: 'bg-danger-500',
};

const BUDGET_CHANGE_TYPE_LABEL: Record<string, string> = {
  quotation: '报价确认',
  addon: '增项变更',
  adjustment: '预算调整',
};

export default function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('nodes');
  const [expandedInspection, setExpandedInspection] = useState<string | null>(null);

  const project = useMemo<Project | undefined>(
    () => mockProjects.find((p) => p.id === params.id),
    [params.id]
  );

  const nodes = useMemo<ProjectNode[]>(
    () =>
      mockProjectNodes
        .filter((n) => n.project_id === params.id)
        .sort((a, b) => a.sequence - b.sequence),
    [params.id]
  );

  const drawings = useMemo<DrawingFile[]>(
    () =>
      mockDrawingFiles
        .filter((d) => d.project_id === params.id)
        .sort((a, b) => b.version - a.version),
    [params.id]
  );

  const inspections = useMemo<InspectionTask[]>(
    () =>
      mockInspectionTasks
        .filter((i) => i.project_id === params.id)
        .sort((a, b) => (a.planned_date < b.planned_date ? 1 : -1)),
    [params.id]
  );

  const budgetLogs = useMemo<BudgetChangeLog[]>(
    () =>
      mockBudgetChangeLogs
        .filter((b) => b.project_id === params.id)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1)),
    [params.id]
  );

  if (!project) {
    notFound();
  }

  const currentNodeIndex = nodes.findIndex(
    (n) => n.status === 'in_progress' || n.status === 'delayed'
  );

  const budgetUsedPercent = Math.min(
    (project.budget_used / project.budget_total) * 100,
    100
  );
  const budgetRemaining = project.budget_total - project.budget_used;
  const isOverBudget = budgetRemaining < 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/" className="hover:text-brand-700 transition-colors">
          项目列表
        </Link>
        <span>/</span>
        <span className="text-zinc-700">{project.name}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-zinc-900">{project.name}</h1>
            <StatusBadge status={project.status} />
            {project.delay_days && project.delay_days > 0 ? (
              <span className="text-xs text-danger-600 bg-danger-50 rounded px-2 py-0.5">
                延期 {project.delay_days} 天
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-zinc-500">
            <span>📍 {project.address}</span>
            <span>👤 {project.customer_name} ({project.customer_phone})</span>
            <span>🏗️ 项目经理：{project.project_manager_name}</span>
            <span>📅 工期：{formatDate(project.start_date)} ~ {formatDate(project.planned_end_date)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">返回</Button>
          <Button variant="primary" size="sm">编辑项目</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="!p-4">
          <div className="text-xs text-zinc-500 mb-1">预算总额</div>
          <div className="text-lg font-semibold text-zinc-900">{formatCurrency(project.budget_total)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-zinc-500 mb-1">已用金额</div>
          <div className="text-lg font-semibold text-brand-700">{formatCurrency(project.budget_used)}</div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-zinc-500 mb-1">剩余预算</div>
          <div className={cn('text-lg font-semibold', isOverBudget ? 'text-danger-600' : 'text-green-700')}>
            {formatCurrency(Math.abs(budgetRemaining))}
            {isOverBudget && <span className="text-xs ml-1">(超支)</span>}
          </div>
        </Card>
        <Card className="!p-4">
          <div className="text-xs text-zinc-500 mb-1">整体进度</div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${budgetUsedPercent.toFixed(1)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-zinc-700 whitespace-nowrap">
              {budgetUsedPercent.toFixed(1)}%
            </span>
          </div>
        </Card>
      </div>

      <Card>
        <div className="border-b border-zinc-100 -mx-5 -mt-5 px-5">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px',
                  activeTab === tab.key
                    ? 'text-brand-700 border-brand-600'
                    : 'text-zinc-500 border-transparent hover:text-zinc-700 hover:border-zinc-200'
                )}
              >
                <span className="mr-1.5">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-5">
          {activeTab === 'nodes' && (
            <NodeTimeline nodes={nodes} currentNodeIndex={currentNodeIndex} />
          )}
          {activeTab === 'drawings' && <DrawingList drawings={drawings} />}
          {activeTab === 'inspections' && (
            <InspectionList
              inspections={inspections}
              expandedId={expandedInspection}
              onToggle={setExpandedInspection}
            />
          )}
          {activeTab === 'budget' && (
            <BudgetOverview
              project={project}
              logs={budgetLogs}
              usedPercent={budgetUsedPercent}
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function NodeTimeline({
  nodes,
  currentNodeIndex,
}: {
  nodes: ProjectNode[];
  currentNodeIndex: number;
}) {
  if (nodes.length === 0) {
    return <div className="py-10 text-center text-sm text-zinc-400">暂无节点数据</div>;
  }

  return (
    <div className="relative pl-8">
      <div className="absolute left-3 top-2 bottom-2 w-px bg-zinc-200" />
      <div className="space-y-6">
        {nodes.map((node, index) => {
          const isCurrent = index === currentNodeIndex;
          const dotColor = NODE_STATUS_COLORS[node.status];
          return (
            <div key={node.id} className="relative">
              <div
                className={cn(
                  'absolute -left-5 top-1 w-4 h-4 rounded-full border-2 border-white z-10',
                  dotColor,
                  isCurrent && 'ring-4 ring-brand-100 animate-pulse-slow'
                )}
              />
              <div
                className={cn(
                  'rounded border p-4 bg-white transition-all',
                  isCurrent
                    ? 'border-brand-300 shadow-sm shadow-brand-100'
                    : 'border-zinc-200'
                )}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 font-mono">#{String(node.sequence).padStart(2, '0')}</span>
                    <span className="font-medium text-zinc-900">{node.name}</span>
                    <StatusBadge status={node.status} />
                    {node.delay_days > 0 && (
                      <span className="text-xs text-danger-600 bg-danger-50 rounded px-1.5 py-0.5">
                        延期 {node.delay_days} 天
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-zinc-500">
                    负责人：<span className="text-zinc-700">{node.assignee_name || '-'}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="text-zinc-500">
                    计划：
                    <span className="text-zinc-700">
                      {formatDate(node.planned_start_date)} ~ {formatDate(node.planned_end_date)}
                    </span>
                  </div>
                  <div className="text-zinc-500">
                    实际：
                    <span className="text-zinc-700">
                      {formatDate(node.actual_start_date) || '-'} ~ {formatDate(node.actual_end_date) || '-'}
                    </span>
                  </div>
                </div>
                {node.delay_reason && (
                  <div className="mt-2 text-sm">
                    <span className="text-danger-600">延期原因：</span>
                    <span className="text-zinc-600">{node.delay_reason}</span>
                  </div>
                )}
                {node.remark && (
                  <div className="mt-1 text-sm">
                    <span className="text-zinc-500">备注：</span>
                    <span className="text-zinc-600">{node.remark}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DrawingList({ drawings }: { drawings: DrawingFile[] }) {
  const columns = [
    {
      key: 'version',
      title: '版本',
      width: '80px',
      render: (row: DrawingFile) => (
        <span className="inline-flex items-center justify-center min-w-[32px] h-6 px-2 rounded bg-brand-50 text-brand-700 text-xs font-semibold">
          V{row.version}
        </span>
      ),
    },
    {
      key: 'file_name',
      title: '文件名',
      render: (row: DrawingFile) => (
        <div className="flex items-center gap-2">
          <span className="text-lg">📄</span>
          <span className="text-zinc-800">{row.file_name}</span>
        </div>
      ),
    },
    {
      key: 'file_size',
      title: '大小',
      width: '100px',
      render: (row: DrawingFile) => (
        <span className="text-zinc-600">{formatFileSize(row.file_size)}</span>
      ),
    },
    {
      key: 'uploaded_by_name',
      title: '上传人',
      width: '100px',
      render: (row: DrawingFile) => (
        <span className="text-zinc-600">{row.uploaded_by_name || '-'}</span>
      ),
    },
    {
      key: 'remark',
      title: '备注',
      render: (row: DrawingFile) => (
        <span className="text-zinc-500 text-xs">{row.remark || '-'}</span>
      ),
    },
    {
      key: 'created_at',
      title: '上传时间',
      width: '160px',
      render: (row: DrawingFile) => (
        <span className="text-zinc-500 text-xs">{formatDateTime(row.created_at)}</span>
      ),
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: () => (
        <Button variant="secondary" size="sm">
          ⬇ 下载
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={drawings}
      rowKey={(row) => (row as DrawingFile).id}
      emptyText="暂无图纸文件"
    />
  );
}

function InspectionList({
  inspections,
  expandedId,
  onToggle,
}: {
  inspections: InspectionTask[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
}) {
  if (inspections.length === 0) {
    return <div className="py-10 text-center text-sm text-zinc-400">暂无巡检记录</div>;
  }

  return (
    <div className="space-y-3">
      {inspections.map((task) => {
        const isExpanded = expandedId === task.id;
        const failedItems = task.items.filter((item) => item.is_passed === false);
        return (
          <div
            key={task.id}
            className={cn(
              'rounded border transition-all overflow-hidden',
              isExpanded ? 'border-brand-300' : 'border-zinc-200'
            )}
          >
            <div
              className="flex items-center justify-between gap-3 p-4 cursor-pointer hover:bg-zinc-50 transition-colors flex-wrap"
              onClick={() => onToggle(isExpanded ? null : task.id)}
            >
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full transition-transform',
                    isExpanded && 'rotate-90',
                    'bg-zinc-400'
                  )}
                />
                <div>
                  <div className="font-medium text-zinc-900">
                    {task.node_name || '未关联节点'} - 巡检
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    计划日期：{formatDate(task.planned_date)}
                    {task.executed_by_name && ` · 执行人：${task.executed_by_name}`}
                    {task.executed_at && ` · 执行时间：${formatDateTime(task.executed_at)}`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {typeof task.score === 'number' && (
                  <div
                    className={cn(
                      'flex items-center gap-1 px-2 py-1 rounded text-sm font-semibold',
                      task.score >= 85
                        ? 'bg-green-50 text-green-700'
                        : task.score >= 70
                          ? 'bg-warn-50 text-warn-600'
                          : 'bg-danger-50 text-danger-600'
                    )}
                  >
                    ⭐ {task.score} 分
                  </div>
                )}
                <StatusBadge status={task.status} />
                {failedItems.length > 0 && (
                  <span className="text-xs text-danger-600 bg-danger-50 rounded px-2 py-0.5">
                    {failedItems.length} 项不合格
                  </span>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-zinc-100 bg-zinc-50/50 p-4">
                <div className="text-sm font-medium text-zinc-700 mb-3">巡检项详情</div>
                <div className="space-y-2">
                  {task.items.map((item) => {
                    const isFailed = item.is_passed === false;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded border p-3 text-sm',
                          isFailed
                            ? 'border-danger-200 bg-danger-50/60'
                            : 'border-zinc-200 bg-white'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className={cn('font-medium', isFailed && 'text-danger-700')}>
                                {isFailed && '❌ '}
                                {item.is_passed && '✅ '}
                                {item.name}
                              </span>
                              {typeof item.score === 'number' && (
                                <span
                                  className={cn(
                                    'text-xs font-semibold px-1.5 py-0.5 rounded',
                                    isFailed
                                      ? 'bg-danger-100 text-danger-700'
                                      : 'bg-green-100 text-green-700'
                                  )}
                                >
                                  {item.score} 分
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1">
                              标准：{item.standard}
                            </div>
                            {isFailed && item.issue_description && (
                              <div className="text-xs text-danger-600 mt-1">
                                问题：{item.issue_description}
                              </div>
                            )}
                            {isFailed && item.rectification_deadline && (
                              <div className="text-xs text-danger-600 mt-0.5">
                                整改期限：{formatDate(item.rectification_deadline)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BudgetOverview({
  project,
  logs,
  usedPercent,
}: {
  project: Project;
  logs: BudgetChangeLog[];
  usedPercent: number;
}) {
  const isOverBudget = usedPercent >= 100;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600">预算总额</span>
          <span className="font-medium text-zinc-900">{formatCurrency(project.budget_total)}</span>
        </div>
        <div className="h-4 bg-zinc-100 rounded-full overflow-hidden relative">
          <div
            className={cn(
              'h-full rounded-full transition-all relative',
              isOverBudget ? 'bg-danger-500' : 'bg-brand-500'
            )}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
          {usedPercent > 5 && (
            <span
              className="absolute top-1/2 -translate-y-1/2 text-xs font-semibold text-white"
              style={{ left: `${Math.min(usedPercent, 98)}%`, transform: 'translate(-100%, -50%)' }}
            >
              {usedPercent.toFixed(1)}%
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-sm flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              <span className="text-zinc-600">
                已用：<span className="font-medium text-zinc-900">{formatCurrency(project.budget_used)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
              <span className="text-zinc-600">
                剩余：
                <span className={cn('font-medium', isOverBudget ? 'text-danger-600' : 'text-green-700')}>
                  {formatCurrency(Math.abs(project.budget_total - project.budget_used))}
                  {isOverBudget && ' (超支)'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-sm font-medium text-zinc-900 mb-3">预算变更历史</h4>
        <div className="space-y-2">
          {logs.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-400 border border-dashed border-zinc-200 rounded">
              暂无预算变更记录
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 p-3 rounded border border-zinc-200 hover:border-zinc-300 transition-colors flex-wrap"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5',
                      log.change_amount >= 0 ? 'bg-green-50 text-green-700' : 'bg-danger-50 text-danger-600'
                    )}
                  >
                    {log.change_amount >= 0 ? '↑' : '↓'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-zinc-900">
                        {BUDGET_CHANGE_TYPE_LABEL[log.change_type] || log.change_type}
                      </span>
                      <span
                        className={cn(
                          'text-xs font-semibold px-1.5 py-0.5 rounded',
                          log.change_amount >= 0
                            ? 'bg-green-50 text-green-700'
                            : 'bg-danger-50 text-danger-600'
                        )}
                      >
                        {log.change_amount >= 0 ? '+' : ''}
                        {formatCurrency(log.change_amount)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {log.reason}
                    </div>
                    <div className="text-xs text-zinc-400 mt-0.5">
                      {formatDateTime(log.created_at)} · {log.operator_name || '-'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-right">
                  <div className="text-zinc-400">变更前</div>
                  <div className="text-zinc-600">{formatCurrency(log.before_budget)}</div>
                  <div className="text-zinc-400 mt-1">变更后</div>
                  <div className="font-medium text-zinc-900">{formatCurrency(log.after_budget)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
