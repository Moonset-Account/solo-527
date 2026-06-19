'use client';

import { useState, useMemo } from 'react';
import { Card, Button, StatusBadge, DataTable } from '@/components/ui';
import { mockProjectNodes, mockProjects } from '@/lib/mockData';
import type { ProjectNode, NodeStatus } from '@/lib/types';
import { Bell, FileEdit, Search, RefreshCw } from 'lucide-react';

export default function DelaysPage() {
  const [minDelayDays, setMinDelayDays] = useState<string>('');
  const [maxDelayDays, setMaxDelayDays] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const [handledIds, setHandledIds] = useState<Set<string>>(new Set());

  const filteredNodes = useMemo(() => {
    return mockProjectNodes.filter((node) => {
      if (minDelayDays !== '' && node.delay_days < Number(minDelayDays)) return false;
      if (maxDelayDays !== '' && node.delay_days > Number(maxDelayDays)) return false;
      if (selectedProject && node.project_id !== selectedProject) return false;
      if (selectedStatus && node.status !== selectedStatus) return false;
      return true;
    });
  }, [minDelayDays, maxDelayDays, selectedProject, selectedStatus]);

  const handleSendReminder = (node: ProjectNode) => {
    setRemindedIds((prev) => new Set(prev).add(node.id));
    alert(`已向「${node.assignee_name}」发送关于「${node.name}」的延期提醒`);
  };

  const handleProcess = (node: ProjectNode) => {
    setHandledIds((prev) => new Set(prev).add(node.id));
    alert(`已打开「${node.name}」的处理填写表单`);
  };

  const resetFilters = () => {
    setMinDelayDays('');
    setMaxDelayDays('');
    setSelectedProject('');
    setSelectedStatus('');
  };

  const getProcessStatus = (node: ProjectNode) => {
    if (handledIds.has(node.id)) return '已处理';
    if (remindedIds.has(node.id)) return '已提醒';
    return '待处理';
  };

  const getProcessStatusBadge = (node: ProjectNode) => {
    const status = getProcessStatus(node);
    if (status === '已处理') return <StatusBadge status="completed">已处理</StatusBadge>;
    if (status === '已提醒') return <StatusBadge status="in_progress">已提醒</StatusBadge>;
    return <StatusBadge status="pending">待处理</StatusBadge>;
  };

  const columns = [
    {
      key: 'project_name',
      title: '项目名',
      width: '200px',
      render: (row: ProjectNode) => (
        <span className="font-medium text-zinc-900">{row.project_name}</span>
      ),
    },
    {
      key: 'name',
      title: '节点名',
      width: '160px',
      render: (row: ProjectNode) => <span>{row.name}</span>,
    },
    {
      key: 'delay_days',
      title: '延期天数',
      width: '100px',
      render: (row: ProjectNode) => (
        <span className={row.delay_days > 0 ? 'font-semibold text-danger-600' : 'text-zinc-500'}>
          {row.delay_days > 0 ? `${row.delay_days} 天` : '-'}
        </span>
      ),
    },
    {
      key: 'delay_reason',
      title: '延期原因',
      width: '240px',
      render: (row: ProjectNode) => (
        <span className="text-zinc-600">{row.delay_reason ?? '-'}</span>
      ),
    },
    {
      key: 'assignee_name',
      title: '负责人',
      width: '100px',
      render: (row: ProjectNode) => <span>{row.assignee_name ?? '-'}</span>,
    },
    {
      key: 'status',
      title: '节点状态',
      width: '100px',
      render: (row: ProjectNode) => <StatusBadge status={row.status} />,
    },
    {
      key: 'process_status',
      title: '处理状态',
      width: '100px',
      render: (row: ProjectNode) => getProcessStatusBadge(row),
    },
    {
      key: 'actions',
      title: '操作',
      width: '200px',
      render: (row: ProjectNode) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleSendReminder(row)}
            disabled={remindedIds.has(row.id)}
          >
            <Bell className="h-3.5 w-3.5" />
            发送提醒
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => handleProcess(row)}
            disabled={handledIds.has(row.id)}
          >
            <FileEdit className="h-3.5 w-3.5" />
            填写处理
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900">延期节点维护</h1>
        <p className="mt-1 text-sm text-zinc-500">管理项目延期节点，发送提醒并跟踪处理进度</p>
      </div>

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600">延期天数范围</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                placeholder="最小"
                value={minDelayDays}
                onChange={(e) => setMinDelayDays(e.target.value)}
                className="h-9 w-24 rounded border border-zinc-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-zinc-400">—</span>
              <input
                type="number"
                min="0"
                placeholder="最大"
                value={maxDelayDays}
                onChange={(e) => setMaxDelayDays(e.target.value)}
                className="h-9 w-24 rounded border border-zinc-300 px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <span className="text-xs text-zinc-500">天</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600">项目</label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="h-9 w-56 rounded border border-zinc-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">全部项目</option>
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-zinc-600">节点状态</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 w-40 rounded border border-zinc-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
            >
              <option value="">全部状态</option>
              <option value="not_started">未开始</option>
              <option value="in_progress">进行中</option>
              <option value="delayed">已延期</option>
              <option value="completed">已完成</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button size="md" variant="primary">
              <Search className="h-4 w-4" />
              查询
            </Button>
            <Button size="md" variant="secondary" onClick={resetFilters}>
              <RefreshCw className="h-4 w-4" />
              重置
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-zinc-500">
            共 <span className="font-medium text-zinc-900">{filteredNodes.length}</span> 条记录
          </span>
        </div>
        <DataTable<ProjectNode>
          columns={columns}
          data={filteredNodes}
          rowKey={(row) => row.id}
          highlightRow={(row) => (row as ProjectNode).delay_days > 0}
        />
      </Card>
    </div>
  );
}
