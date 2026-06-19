'use client';

import { useState } from 'react';
import { X, Play, Eye, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { mockInspectionTasks } from '@/lib/mockData';
import { formatDate } from '@/lib/utils';
import type { InspectionTask, InspectionTaskStatus } from '@/lib/types';

type TabKey = 'pending' | 'rectifying' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: '待执行' },
  { key: 'rectifying', label: '整改中' },
  { key: 'completed', label: '已完成' },
];

export default function InspectionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('pending');
  const [detailTask, setDetailTask] = useState<InspectionTask | null>(null);

  const filteredTasks = mockInspectionTasks.filter(
    (t) => t.status === activeTab
  );

  const tabCounts = {
    pending: mockInspectionTasks.filter((t) => t.status === 'pending').length,
    rectifying: mockInspectionTasks.filter((t) => t.status === 'rectifying').length,
    completed: mockInspectionTasks.filter((t) => t.status === 'completed').length,
  };

  const columns = [
    {
      key: 'project_name',
      title: '项目',
      render: (row: InspectionTask) => (
        <div>
          <div className="font-medium text-zinc-900">{row.project_name}</div>
          <div className="text-xs text-zinc-500">{row.node_name}</div>
        </div>
      ),
    },
    {
      key: 'node_name',
      title: '节点',
      render: (row: InspectionTask) => (
        <span className="text-zinc-700">{row.node_name}</span>
      ),
    },
    {
      key: 'planned_date',
      title: '计划日期',
      render: (row: InspectionTask) => (
        <span className="text-zinc-700">{formatDate(row.planned_date)}</span>
      ),
    },
    {
      key: 'executed_by_name',
      title: '执行人',
      render: (row: InspectionTask) => (
        <span className="text-zinc-700">{row.executed_by_name}</span>
      ),
    },
    {
      key: 'score',
      title: '评分',
      render: (row: InspectionTask) => {
        if (row.score === undefined) return <span className="text-zinc-400">-</span>;
        const scoreColor =
          row.score >= 90
            ? 'text-green-600'
            : row.score >= 80
            ? 'text-brand-700'
            : row.score >= 70
            ? 'text-warn-600'
            : 'text-danger-600';
        return (
          <span className={`font-semibold ${scoreColor}`}>{row.score}</span>
        );
      },
    },
    {
      key: 'status',
      title: '状态',
      render: (row: InspectionTask) => (
        <StatusBadge status={row.status as InspectionTaskStatus} />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (row: InspectionTask) => (
        <div className="flex gap-2">
          {row.status === 'pending' && (
            <Button size="sm" variant="primary">
              <Play className="h-3.5 w-3.5" />
              开始巡检
            </Button>
          )}
          <Button size="sm" variant="secondary" onClick={() => setDetailTask(row)}>
            <Eye className="h-3.5 w-3.5" />
            查看详情
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">巡检任务中心</h1>
        <p className="mt-1 text-sm text-zinc-500">
          跟踪各项目节点的质量巡检执行情况
        </p>
      </div>

      <Card className="!p-0">
        <div className="flex border-b border-zinc-200 px-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'text-brand-700'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              {tab.label}
              <span
                className={`ml-1.5 rounded px-1.5 py-0.5 text-xs ${
                  activeTab === tab.key
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-zinc-100 text-zinc-500'
                }`}
              >
                {tabCounts[tab.key]}
              </span>
              {activeTab === tab.key && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 bg-brand-600 rounded-t" />
              )}
            </button>
          ))}
        </div>
        <div className="p-2">
          <DataTable<InspectionTask>
            columns={columns}
            data={filteredTasks}
            rowKey={(row) => row.id}
            emptyText={`暂无${TABS.find((t) => t.key === activeTab)?.label}任务`}
          />
        </div>
      </Card>

      {detailTask && (
        <DetailModal task={detailTask} onClose={() => setDetailTask(null)} />
      )}
    </div>
  );
}

interface DetailModalProps {
  task: InspectionTask;
  onClose: () => void;
}

function DetailModal({ task, onClose }: DetailModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-zinc-900">
              巡检详情
            </h3>
            <p className="mt-0.5 text-sm text-zinc-500">
              {task.project_name} · {task.node_name}
            </p>
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
              <div className="text-xs text-zinc-500">计划日期</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {formatDate(task.planned_date)}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">执行人</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {task.executed_by_name}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">状态</div>
              <div className="mt-1">
                <StatusBadge status={task.status} />
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">综合评分</div>
              <div className="mt-1 text-sm font-medium text-zinc-900">
                {task.score !== undefined ? (
                  <span
                    className={`text-lg font-semibold ${
                      task.score >= 90
                        ? 'text-green-600'
                        : task.score >= 80
                        ? 'text-brand-700'
                        : task.score >= 70
                        ? 'text-warn-600'
                        : 'text-danger-600'
                    }`}
                  >
                    {task.score} / 100
                  </span>
                ) : (
                  <span className="text-zinc-400">未评分</span>
                )}
              </div>
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold text-zinc-900">
              巡检项评分
            </h4>
            <div className="space-y-3">
              {task.items.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-lg border p-4 ${
                    item.is_passed === false
                      ? 'border-danger-200 bg-danger-50/50'
                      : item.is_passed === true
                      ? 'border-green-200 bg-green-50/50'
                      : 'border-zinc-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-900">
                          {item.name}
                        </span>
                        {item.is_passed !== undefined &&
                          (item.is_passed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-danger-600" />
                          ))}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        标准：{item.standard}
                      </div>
                      {item.issue_description && (
                        <div className="mt-2 rounded-md bg-white/70 px-3 py-2 text-xs text-danger-700 border border-danger-200">
                          <span className="font-medium">问题：</span>
                          {item.issue_description}
                        </div>
                      )}
                      {item.rectification_deadline && (
                        <div className="mt-1 text-xs text-warn-700">
                          整改截止：{formatDate(item.rectification_deadline)}
                        </div>
                      )}
                    </div>
                    <div className="ml-4 text-right">
                      {item.score !== undefined ? (
                        <span
                          className={`text-xl font-bold ${
                            item.score >= 90
                              ? 'text-green-600'
                              : item.score >= 80
                              ? 'text-brand-700'
                              : item.score >= 70
                              ? 'text-warn-600'
                              : 'text-danger-600'
                          }`}
                        >
                          {item.score}
                        </span>
                      ) : (
                        <span className="text-zinc-400">未评分</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-5 py-3">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
          {task.status === 'pending' && <Button>开始巡检</Button>}
          {task.status === 'rectifying' && <Button>审核整改</Button>}
        </div>
      </div>
    </div>
  );
}
