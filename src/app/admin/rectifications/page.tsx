'use client';

import { useEffect, useState } from 'react';
import { Plus, ClipboardCheck, MapPin, User, Clock, Eye, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Rectification, RectificationStatus, RectificationLog, RECTIFICATION_TYPES, STATUS_LABELS } from '@/types';
import { formatDate, formatDateTime } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label, Textarea, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DataTableFilter } from '@/components/ui/DataTable';
import { Modal, ModalConfirm } from '@/components/ui/Modal';
import { Stepper } from '@/components/ui/Charts';

const statusOptions = [
  { label: '全部', value: '' },
  { label: '待处理', value: 'pending' },
  { label: '处理中', value: 'in_progress' },
  { label: '待复查', value: 'review' },
  { label: '已完成', value: 'completed' },
  { label: '需返工', value: 'rework' },
];

const typeOptions = [
  { label: '全部', value: '' },
  ...RECTIFICATION_TYPES.map((t) => ({ label: t, value: t })),
];

const statusFlow: Record<RectificationStatus, RectificationStatus[]> = {
  pending: ['in_progress'],
  in_progress: ['review'],
  review: ['completed', 'rework'],
  completed: [],
  rework: ['in_progress'],
};

export default function AdminRectificationsPage() {
  const [loading, setLoading] = useState(true);
  const [rectifications, setRectifications] = useState<Rectification[]>([]);
  const [filteredRectifications, setFilteredRectifications] = useState<Rectification[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRect, setSelectedRect] = useState<Rectification | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [statusConfirm, setStatusConfirm] = useState<{
    id: string;
    status: RectificationStatus;
    remark: string;
  } | null>(null);

  const [newRect, setNewRect] = useState({
    title: '',
    description: '',
    type: RECTIFICATION_TYPES[0],
    location: '',
    assignee_id: '',
    deadline: '',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getRectifications();
        setRectifications(data);
        setFilteredRectifications(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredRectifications(rectifications);
      return;
    }
    const filtered = rectifications.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.location.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredRectifications(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...rectifications];

    if (filters.status) {
      filtered = filtered.filter((r) => r.status === filters.status);
    }
    if (filters.type) {
      filtered = filtered.filter((r) => r.type === filters.type);
    }

    setFilteredRectifications(filtered);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRect.title || !newRect.location || !newRect.assignee_id || !newRect.deadline) {
      alert('请填写完整信息');
      return;
    }

    try {
      const created = await api.createRectification({
        ...newRect,
        deadline: new Date(newRect.deadline).toISOString(),
      });
      setRectifications([created, ...rectifications]);
      setFilteredRectifications([created, ...filteredRectifications]);
      setShowCreateModal(false);
      setNewRect({
        title: '',
        description: '',
        type: RECTIFICATION_TYPES[0],
        location: '',
        assignee_id: '',
        deadline: '',
      });
    } catch (error) {
      alert('创建失败，请稍后重试');
    }
  };

  const handleStatusChange = async () => {
    if (!statusConfirm) return;

    try {
      const updated = await api.updateRectificationStatus(
        statusConfirm.id,
        statusConfirm.status,
        'admin-001',
        statusConfirm.remark
      );

      if (updated) {
        setRectifications(
          rectifications.map((r) => (r.id === statusConfirm.id ? updated : r))
        );
        setFilteredRectifications(
          filteredRectifications.map((r) => (r.id === statusConfirm.id ? updated : r))
        );
        if (selectedRect?.id === statusConfirm.id) {
          setSelectedRect(updated);
        }
      }
    } catch (error) {
      alert('状态更新失败');
    } finally {
      setStatusConfirm(null);
    }
  };

  const getStepperSteps = (status: RectificationStatus) => {
    const statusOrder: RectificationStatus[] = ['pending', 'in_progress', 'review', 'completed'];
    return statusOrder.map((s) => ({
      label: STATUS_LABELS[s],
      status:
        s === status
          ? 'current'
          : statusOrder.indexOf(s) < statusOrder.indexOf(status) ||
            (status === 'rework' && s !== 'completed')
          ? 'completed'
          : 'pending',
    }));
  };

  const toggleLogs = (id: string) => {
    setExpandedLogs(
      expandedLogs.includes(id)
        ? expandedLogs.filter((i) => i !== id)
        : [...expandedLogs, id]
    );
  };

  const stats = {
    pending: rectifications.filter((r) => r.status === 'pending').length,
    in_progress: rectifications.filter((r) => r.status === 'in_progress').length,
    review: rectifications.filter((r) => r.status === 'review').length,
    completed: rectifications.filter((r) => r.status === 'completed').length,
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="整改复查"
        description="管理整改任务，跟踪处理进度，记录复查结果"
        action={
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            新建议题
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">待处理</p>
                <p className="text-3xl font-bold text-warning-600 mt-1">{stats.pending}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning-50 text-warning-600">
                <AlertCircle className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">处理中</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">{stats.in_progress}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary-50 text-primary-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">待复查</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.review}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                <Eye className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">已完成</p>
                <p className="text-3xl font-bold text-success-600 mt-1">{stats.completed}</p>
              </div>
              <div className="p-3 rounded-lg bg-success-50 text-success-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>整改任务列表</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DataTableFilter
            filters={[
              { key: 'status', label: '状态', type: 'select', options: statusOptions },
              { key: 'type', label: '类型', type: 'select', options: typeOptions },
            ]}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="搜索任务标题、位置..."
          />

          <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务标题</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>位置</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>截止日期</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRectifications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <EmptyState
                        icon={<ClipboardCheck className="w-12 h-12" />}
                        title="暂无整改任务"
                        description="点击右上角按钮创建新的整改任务"
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRectifications.map((rect, index) => (
                    <TableRow
                      key={rect.id}
                      className="animate-fade-in-up"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell>
                        <div className="font-medium text-slate-900">{rect.title}</div>
                      </TableCell>
                      <TableCell>
                        <span className="text-slate-600">{rect.type}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate max-w-[150px]">{rect.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs">
                            {rect.assignee?.name?.slice(0, 1)}
                          </div>
                          <span className="text-slate-700">{rect.assignee?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(rect.deadline)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge status={rect.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRect(rect);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            详情
                          </Button>
                          <button
                            onClick={() => toggleLogs(rect.id)}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
                          >
                            {expandedLogs.includes(rect.id) ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {expandedLogs.length > 0 && (
            <div className="mt-4 space-y-4">
              {rectifications
                .filter((r) => expandedLogs.includes(r.id))
                .map((rect) => (
                  <div key={rect.id} className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-3">
                      「{rect.title}」操作记录
                    </h4>
                    <div className="space-y-3">
                      {rect.logs?.length === 0 ? (
                        <p className="text-sm text-slate-500">暂无操作记录</p>
                      ) : (
                        rect.logs?.map((log) => (
                          <div
                            key={log.id}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm flex-shrink-0">
                              {log.operator?.name?.slice(0, 1)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-slate-900 text-sm">
                                  {log.operator?.name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {log.action}
                                </span>
                              </div>
                              {log.remark && (
                                <p className="text-sm text-slate-600 mt-1">{log.remark}</p>
                              )}
                              <p className="text-xs text-slate-400 mt-1">
                                {formatDateTime(log.created_at)}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Modal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="新建议题"
        className="max-w-lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <Label htmlFor="title">任务标题 *</Label>
            <Input
              id="title"
              value={newRect.title}
              onChange={(e) => setNewRect({ ...newRect, title: e.target.value })}
              placeholder="请输入任务标题"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">类型 *</Label>
              <Select
                id="type"
                value={newRect.type}
                onChange={(e) => setNewRect({ ...newRect, type: e.target.value })}
              >
                {RECTIFICATION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="assignee">负责人 *</Label>
              <Select
                id="assignee"
                value={newRect.assignee_id}
                onChange={(e) => setNewRect({ ...newRect, assignee_id: e.target.value })}
                required
              >
                <option value="">请选择负责人</option>
                {[
                  { id: 'resident-001', name: '李居民' },
                  { id: 'resident-002', name: '王代表' },
                  { id: 'resident-003', name: '赵大妈' },
                  { id: 'resident-004', name: '刘大爷' },
                ].map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="location">位置 *</Label>
            <Input
              id="location"
              value={newRect.location}
              onChange={(e) => setNewRect({ ...newRect, location: e.target.value })}
              placeholder="请输入具体位置"
              required
            />
          </div>

          <div>
            <Label htmlFor="deadline">截止日期 *</Label>
            <Input
              id="deadline"
              type="datetime-local"
              value={newRect.deadline}
              onChange={(e) => setNewRect({ ...newRect, deadline: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">详细描述</Label>
            <Textarea
              id="description"
              value={newRect.description}
              onChange={(e) => setNewRect({ ...newRect, description: e.target.value })}
              placeholder="请详细描述问题"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              取消
            </Button>
            <Button type="submit">创建任务</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="整改任务详情"
        className="max-w-2xl"
      >
        {selectedRect && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {selectedRect.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {selectedRect.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedRect.assignee?.name}
                </span>
                <Badge status={selectedRect.status} />
              </div>
            </div>

            <Stepper steps={getStepperSteps(selectedRect.status)} />

            <div>
              <h4 className="font-medium text-slate-900 mb-3">问题描述</h4>
              <p className="text-slate-600 leading-relaxed">
                {selectedRect.description || '暂无详细描述'}
              </p>
            </div>

            <div>
              <h4 className="font-medium text-slate-900 mb-3">时间信息</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">创建时间</p>
                  <p className="font-medium text-slate-700 mt-1">
                    {formatDateTime(selectedRect.created_at)}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">截止时间</p>
                  <p className="font-medium text-slate-700 mt-1">
                    {formatDateTime(selectedRect.deadline)}
                  </p>
                </div>
              </div>
            </div>

            {statusFlow[selectedRect.status].length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <h4 className="font-medium text-slate-900 mb-3">状态变更</h4>
                <div className="flex flex-wrap gap-2">
                  {statusFlow[selectedRect.status].map((nextStatus) => (
                    <Button
                      key={nextStatus}
                      variant={nextStatus === 'completed' ? 'primary' : 'secondary'}
                      onClick={() =>
                        setStatusConfirm({
                          id: selectedRect.id,
                          status: nextStatus,
                          remark: '',
                        })
                      }
                    >
                      标记为「{STATUS_LABELS[nextStatus]}」
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="font-medium text-slate-900 mb-3">操作记录</h4>
              <div className="space-y-3">
                {selectedRect.logs?.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">暂无操作记录</p>
                ) : (
                  selectedRect.logs?.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm flex-shrink-0">
                        {log.operator?.name?.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 text-sm">
                            {log.operator?.name}
                          </span>
                          <span className="text-xs text-slate-500">{log.action}</span>
                          {log.from_status && log.to_status && (
                            <span className="text-xs text-slate-400">
                              {STATUS_LABELS[log.from_status]} → {STATUS_LABELS[log.to_status]}
                            </span>
                          )}
                        </div>
                        {log.remark && (
                          <p className="text-sm text-slate-600 mt-1">{log.remark}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDateTime(log.created_at)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!statusConfirm}
        onClose={() => setStatusConfirm(null)}
        title="确认状态变更"
        className="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleStatusChange();
          }}
          className="space-y-4"
        >
          <p className="text-slate-600">
            确定要将任务标记为「
            {statusConfirm && STATUS_LABELS[statusConfirm.status]}
            」吗？
          </p>
          <div>
            <Label htmlFor="remark">备注说明</Label>
            <Textarea
              id="remark"
              value={statusConfirm?.remark || ''}
              onChange={(e) =>
                setStatusConfirm(
                  statusConfirm ? { ...statusConfirm, remark: e.target.value } : null
                )
              }
              placeholder="请输入变更说明（可选）"
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setStatusConfirm(null)}>
              取消
            </Button>
            <Button type="submit">确认变更</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
