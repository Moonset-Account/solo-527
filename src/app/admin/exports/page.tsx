'use client';

import { useEffect, useState } from 'react';
import { Plus, Download, Clock, CheckCircle2, AlertCircle, FileSpreadsheet, Settings, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';
import { ExportTask, ExportFormat, STATUS_LABELS } from '@/types';
import { formatDate, formatDateTime, formatFileSize } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader, StatsCard } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { Modal } from '@/components/ui/Modal';

const exportTypes = [
  { value: 'residents', label: '居民台账' },
  { value: 'topics', label: '议题数据' },
  { value: 'votes', label: '投票记录' },
  { value: 'rectifications', label: '整改任务' },
  { value: 'patrols', label: '巡逻记录' },
  { value: 'reports', label: '上报统计' },
];

const formatOptions = [
  { value: 'xlsx', label: 'Excel (.xlsx)' },
  { value: 'csv', label: 'CSV (.csv)' },
  { value: 'pdf', label: 'PDF (.pdf)' },
];

export default function AdminExportsPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<ExportTask[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [newExport, setNewExport] = useState({
    type: 'residents',
    name: '',
    format: 'xlsx' as ExportFormat,
    filters: {
      dateRange: {
        start: '',
        end: '',
      },
      status: '',
      area: '',
    },
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getExportTasks();
        setTasks(data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExport.name.trim()) {
      alert('请输入导出任务名称');
      return;
    }

    try {
      const created = await api.createExportTask(
        newExport.type,
        newExport.name,
        newExport.filters,
        newExport.format
      );
      setTasks([created, ...tasks]);
      setShowCreateModal(false);
      setNewExport({
        type: 'residents',
        name: '',
        format: 'xlsx',
        filters: {
          dateRange: {
            start: '',
            end: '',
          },
          status: '',
          area: '',
        },
      });

      setTimeout(async () => {
        const updated = await api.getExportTasks();
        setTasks(updated.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }, 2500);
    } catch (error) {
      alert('创建导出任务失败，请稍后重试');
    }
  };

  const handleDownload = async (task: ExportTask) => {
    if (task.status !== 'completed' || downloading) return;

    setDownloading(task.id);
    try {
      await api.downloadExport(task.id, 'admin-001');
      const updated = tasks.map((t) =>
        t.id === task.id ? { ...t, download_count: t.download_count + 1 } : t
      );
      setTasks(updated);

      alert(`文件「${task.name}」下载成功！\n已记录下载人、时间，并更新下载次数。`);
    } catch (error) {
      alert('下载失败，请稍后重试');
    } finally {
      setDownloading(null);
    }
  };

  const toggleFilters = (id: string) => {
    setExpandedFilters(
      expandedFilters.includes(id)
        ? expandedFilters.filter((i) => i !== id)
        : [...expandedFilters, id]
    );
  };

  const formatFilterDisplay = (filters: Record<string, any>) => {
    const parts: string[] = [];
    if (filters.dateRange?.start || filters.dateRange?.end) {
      parts.push(
        `时间范围: ${filters.dateRange.start || '不限'} - ${filters.dateRange.end || '不限'}`
      );
    }
    if (filters.status) {
      parts.push(`状态: ${STATUS_LABELS[filters.status] || filters.status}`);
    }
    if (filters.area) {
      parts.push(`区域: ${filters.area}`);
    }
    return parts.length > 0 ? parts : ['无筛选条件'];
  };

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'completed').length,
    processing: tasks.filter((t) => t.status === 'processing').length,
    totalDownloads: tasks.reduce((sum, t) => sum + t.download_count, 0),
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="导出任务"
        description="创建和管理数据导出任务，系统保留导出条件、时间和下载次数"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建导出
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="总任务数"
          value={stats.total}
          icon={<FileSpreadsheet className="w-6 h-6" />}
          className="animate-stagger-1"
        />
        <StatsCard
          title="已完成"
          value={stats.completed}
          icon={<CheckCircle2 className="w-6 h-6" />}
          className="animate-stagger-2"
        />
        <StatsCard
          title="处理中"
          value={stats.processing}
          icon={<Clock className="w-6 h-6" />}
          className="animate-stagger-3"
        />
        <StatsCard
          title="总下载次数"
          value={stats.totalDownloads}
          icon={<Download className="w-6 h-6" />}
          className="animate-stagger-4"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>导出任务列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>格式</TableHead>
                  <TableHead>创建人</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>完成时间</TableHead>
                  <TableHead>文件大小</TableHead>
                  <TableHead>下载次数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10}>
                      <EmptyState
                        icon={<Download className="w-12 h-12" />}
                        title="暂无导出任务"
                        description="点击右上角按钮创建新的导出任务"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.map((task, index) => (
                    <>
                      <TableRow
                        key={task.id}
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <TableCell>
                          <div className="font-medium text-slate-900">{task.name}</div>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {exportTypes.find((t) => t.value === task.type)?.label || task.type}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600 uppercase">{task.format}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {task.created_by_profile?.name}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {formatDateTime(task.created_at)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {task.completed_at ? formatDateTime(task.completed_at) : '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">
                            {formatFileSize(task.file_size)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-primary-600">
                            {task.download_count} 次
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge status={task.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleFilters(task.id)}
                            >
                              <Filter className="w-4 h-4 mr-1" />
                              条件
                              {expandedFilters.includes(task.id) ? (
                                <ChevronUp className="w-4 h-4 ml-1" />
                              ) : (
                                <ChevronDown className="w-4 h-4 ml-1" />
                              )}
                            </Button>
                            <Button
                              variant={task.status === 'completed' ? 'primary' : 'outline'}
                              size="sm"
                              disabled={task.status !== 'completed' || downloading === task.id}
                              onClick={() => handleDownload(task)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              {downloading === task.id ? '下载中...' : '下载'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedFilters.includes(task.id) && (
                        <TableRow>
                          <TableCell colSpan={10} className="bg-slate-50">
                            <div className="p-4">
                              <h5 className="text-sm font-medium text-slate-700 mb-3">导出条件</h5>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {formatFilterDisplay(task.filters).map((filter, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-white rounded-lg text-sm text-slate-600"
                                  >
                                    {filter}
                                  </div>
                                ))}
                              </div>
                              {task.download_logs && task.download_logs.length > 0 && (
                                <div className="mt-4">
                                  <h5 className="text-sm font-medium text-slate-700 mb-3">
                                    下载记录
                                  </h5>
                                  <div className="space-y-2">
                                    {task.download_logs.map((log) => (
                                      <div
                                        key={log.id}
                                        className="flex items-center justify-between p-2 bg-white rounded-lg text-sm"
                                      >
                                        <span className="text-slate-700">
                                          {log.downloaded_by_profile?.name}
                                        </span>
                                        <span className="text-slate-500">
                                          {formatDateTime(log.downloaded_at)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建导出任务"
        className="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="name">任务名称 *</Label>
            <Input
              id="name"
              value={newExport.name}
              onChange={(e) => setNewExport({ ...newExport, name: e.target.value })}
              placeholder="请输入导出任务名称"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">数据类型 *</Label>
              <Select
                id="type"
                value={newExport.type}
                onChange={(e) => setNewExport({ ...newExport, type: e.target.value })}
              >
                {exportTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="format">导出格式 *</Label>
              <Select
                id="format"
                value={newExport.format}
                onChange={(e) =>
                  setNewExport({ ...newExport, format: e.target.value as ExportFormat })
                }
              >
                {formatOptions.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg space-y-3">
            <h5 className="font-medium text-slate-700 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              筛选条件
            </h5>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">开始日期</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newExport.filters.dateRange.start}
                  onChange={(e) =>
                    setNewExport({
                      ...newExport,
                      filters: {
                        ...newExport.filters,
                        dateRange: { ...newExport.filters.dateRange, start: e.target.value },
                      },
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="endDate">结束日期</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newExport.filters.dateRange.end}
                  onChange={(e) =>
                    setNewExport({
                      ...newExport,
                      filters: {
                        ...newExport.filters,
                        dateRange: { ...newExport.filters.dateRange, end: e.target.value },
                      },
                    })
                  }
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">状态筛选</Label>
              <Select
                id="status"
                value={newExport.filters.status}
                onChange={(e) =>
                  setNewExport({
                    ...newExport,
                    filters: { ...newExport.filters, status: e.target.value },
                  })
                }
              >
                <option value="">全部状态</option>
                <option value="completed">已完成</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="area">区域筛选</Label>
              <Select
                id="area"
                value={newExport.filters.area}
                onChange={(e) =>
                  setNewExport({
                    ...newExport,
                    filters: { ...newExport.filters, area: e.target.value },
                  })
                }
              >
                <option value="">全部区域</option>
                <option value="阳光社区">阳光社区</option>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit">创建导出任务</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
