'use client';

import { useEffect, useState } from 'react';
import {
  Settings,
  ListChecks,
  ClipboardList,
  ShieldCheck,
  User,
  Clock,
  Edit2,
  Trash2,
  Plus,
  History,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '@/lib/api';
import { OperationLog, RECTIFICATION_TYPES, PATROL_FACILITY_TYPES, REPORT_TYPES } from '@/types';
import { formatDateTime } from '@/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Label, Select } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading, EmptyState, PageHeader } from '@/components/ui/Feedback';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { DataTableFilter } from '@/components/ui/DataTable';
import { Modal, ModalConfirm } from '@/components/ui/Modal';

const moduleOptions = [
  { label: '全部模块', value: '' },
  { label: '议题管理', value: 'topics' },
  { label: '整改复查', value: 'rectifications' },
  { label: '巡逻任务', value: 'patrol_tasks' },
  { label: '导出任务', value: 'export_tasks' },
];

const actionOptions = [
  { label: '全部操作', value: '' },
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '删除', value: 'delete' },
];

const moduleLabels: Record<string, string> = {
  topics: '议题管理',
  rectifications: '整改复查',
  patrol_tasks: '巡逻任务',
  export_tasks: '导出任务',
  votes: '投票记录',
  profiles: '用户管理',
};

const actionLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  delete: '删除',
};

type ConfigType = 'rectification' | 'patrol' | 'report';

interface ConfigItem {
  id: string;
  name: string;
}

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<OperationLog[]>([]);
  const [activeTab, setActiveTab] = useState<'maintenance' | 'logs'>('maintenance');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<ConfigType>('rectification');
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: ConfigType; id: string } | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string[]>([]);
  const [newItemName, setNewItemName] = useState('');

  const [configs, setConfigs] = useState<Record<ConfigType, ConfigItem[]>>({
    rectification: RECTIFICATION_TYPES.map((name, i) => ({ id: `rect-${i}`, name })),
    patrol: PATROL_FACILITY_TYPES.map((name, i) => ({ id: `patrol-${i}`, name })),
    report: REPORT_TYPES.map((name, i) => ({ id: `report-${i}`, name })),
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await api.getOperationLogs();
        setLogs(data);
        setFilteredLogs(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleSearch = (query: string) => {
    if (!query) {
      setFilteredLogs(logs);
      return;
    }
    const filtered = logs.filter(
      (l) =>
        (l.operator?.name && l.operator.name.toLowerCase().includes(query.toLowerCase())) ||
        (l.module && moduleLabels[l.module]?.toLowerCase().includes(query.toLowerCase())) ||
        (l.action && actionLabels[l.action]?.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredLogs(filtered);
  };

  const handleFilterChange = (filters: Record<string, string>) => {
    let filtered = [...logs];

    if (filters.module) {
      filtered = filtered.filter((l) => l.module === filters.module);
    }
    if (filters.action) {
      filtered = filtered.filter((l) => l.action === filters.action);
    }

    setFilteredLogs(filtered);
  };

  const openAddModal = (type: ConfigType) => {
    setModalType(type);
    setEditingItem(null);
    setNewItemName('');
    setShowModal(true);
  };

  const openEditModal = (type: ConfigType, item: ConfigItem) => {
    setModalType(type);
    setEditingItem(item);
    setNewItemName(item.name);
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!newItemName.trim()) {
      alert('请输入名称');
      return;
    }

    const typeConfig = [...configs[modalType]];

    if (editingItem) {
      const index = typeConfig.findIndex((i) => i.id === editingItem.id);
      if (index !== -1) {
        typeConfig[index] = { ...typeConfig[index], name: newItemName.trim() };
      }
    } else {
      typeConfig.push({
        id: `${modalType}-${Date.now()}`,
        name: newItemName.trim(),
      });
    }

    setConfigs({ ...configs, [modalType]: typeConfig });
    setShowModal(false);
  };

  const handleDeleteItem = () => {
    if (!deleteConfirm) return;

    const typeConfig = configs[deleteConfirm.type].filter((i) => i.id !== deleteConfirm.id);
    setConfigs({ ...configs, [deleteConfirm.type]: typeConfig });
    setDeleteConfirm(null);
  };

  const toggleLogDetail = (id: string) => {
    setExpandedLogs(
      expandedLogs.includes(id) ? expandedLogs.filter((i) => i !== id) : [...expandedLogs, id]
    );
  };

  const diffChanges = (oldVal: Record<string, any> | undefined, newVal: Record<string, any> | undefined) => {
    if (!oldVal || !newVal) return [];
    const changes: string[] = [];
    const keys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);
    keys.forEach((key) => {
      if (oldVal[key] !== newVal[key]) {
        changes.push(
          `${key}: ${JSON.stringify(oldVal[key])} → ${JSON.stringify(newVal[key])}`
        );
      }
    });
    return changes;
  };

  const tabConfig = {
    title: modalType === 'rectification' ? '整改复查类型' : modalType === 'patrol' ? '设施类型' : '上报类型',
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        title="系统设置"
        description="维护系统配置，查看操作日志，追踪所有数据变更记录"
      />

      <div className="flex border-b border-slate-200 mb-6">
        <button
          onClick={() => setActiveTab('maintenance')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'maintenance'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <ListChecks className="w-4 h-4 inline mr-2" />
          维护配置
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
            activeTab === 'logs'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          操作日志
        </button>
      </div>

      {activeTab === 'maintenance' ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-100 text-primary-600">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">整改复查类型</CardTitle>
              </div>
              <Button size="sm" onClick={() => openAddModal('rectification')}>
                <Plus className="w-4 h-4 mr-2" />
                添加类型
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {configs.rectification.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group"
                  >
                    <span className="text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('rectification', item)}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-primary-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'rectification', id: item.id })}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-danger-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success-100 text-success-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">巡逻设施类型</CardTitle>
              </div>
              <Button size="sm" onClick={() => openAddModal('patrol')}>
                <Plus className="w-4 h-4 mr-2" />
                添加类型
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {configs.patrol.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group"
                  >
                    <span className="text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('patrol', item)}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-primary-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'patrol', id: item.id })}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-danger-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning-100 text-warning-600">
                  <FileText className="w-5 h-5" />
                </div>
                <CardTitle className="text-base">重复上报类型</CardTitle>
              </div>
              <Button size="sm" onClick={() => openAddModal('report')}>
                <Plus className="w-4 h-4 mr-2" />
                添加类型
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {configs.report.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg group"
                  >
                    <span className="text-slate-700">{item.name}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditModal('report', item)}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-primary-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ type: 'report', id: item.id })}
                        className="p-1.5 rounded hover:bg-white text-slate-400 hover:text-danger-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <History className="w-5 h-5 text-primary-600" />
              操作日志
              <span className="text-sm font-normal text-slate-500">
                （记录所有修改操作，包含操作人、时间、变更内容）
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <DataTableFilter
              filters={[
                { key: 'module', label: '模块', type: 'select', options: moduleOptions },
                { key: 'action', label: '操作', type: 'select', options: actionOptions },
              ]}
              onFilterChange={handleFilterChange}
              onSearch={handleSearch}
              searchPlaceholder="搜索操作人、模块、操作类型..."
            />

            <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>操作人</TableHead>
                    <TableHead>模块</TableHead>
                    <TableHead>操作</TableHead>
                    <TableHead>目标ID</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>操作时间</TableHead>
                    <TableHead className="text-right">详情</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7}>
                        <EmptyState
                          icon={<History className="w-12 h-12" />}
                          title="暂无操作记录"
                          description="没有找到符合条件的操作日志"
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map((log, index) => (
                      <>
                        <TableRow
                          key={log.id}
                          className="animate-fade-in-up"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm">
                                {log.operator?.name?.slice(0, 1)}
                              </div>
                              <span className="font-medium text-slate-900">
                                {log.operator?.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="info">{moduleLabels[log.module] || log.module}</Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                log.action === 'create'
                                  ? 'text-success-600'
                                  : log.action === 'update'
                                  ? 'text-primary-600'
                                  : 'text-danger-600'
                              }
                            >
                              {actionLabels[log.action] || log.action}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-slate-500">
                              {log.target_id?.slice(0, 8)}...
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs text-slate-500">
                              {log.ip_address || '-'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-slate-600">
                              <Clock className="w-4 h-4" />
                              {formatDateTime(log.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            {(log.old_value || log.new_value) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleLogDetail(log.id)}
                              >
                                {expandedLogs.includes(log.id) ? '收起' : '查看变更'}
                                {expandedLogs.includes(log.id) ? (
                                  <ChevronUp className="w-4 h-4 ml-1" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 ml-1" />
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                        {expandedLogs.includes(log.id) && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-slate-50">
                              <div className="p-4 space-y-3">
                                {log.old_value && (
                                  <div>
                                    <p className="text-sm font-medium text-slate-500 mb-2">
                                      变更前：
                                    </p>
                                    <pre className="p-3 bg-danger-50 rounded text-xs text-danger-700 overflow-x-auto">
                                      {JSON.stringify(log.old_value, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.new_value && (
                                  <div>
                                    <p className="text-sm font-medium text-slate-500 mb-2">
                                      变更后：
                                    </p>
                                    <pre className="p-3 bg-success-50 rounded text-xs text-success-700 overflow-x-auto">
                                      {JSON.stringify(log.new_value, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.old_value && log.new_value && (
                                  <div>
                                    <p className="text-sm font-medium text-slate-500 mb-2">
                                      变更摘要：
                                    </p>
                                    <div className="space-y-1">
                                      {diffChanges(log.old_value, log.new_value).map(
                                        (change, i) => (
                                          <div
                                            key={i}
                                            className="p-2 bg-white rounded text-sm text-slate-600"
                                          >
                                            {change}
                                          </div>
                                        )
                                      )}
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
      )}

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={`${editingItem ? '编辑' : '添加'}${tabConfig.title}`}
        className="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveItem();
          }}
          className="space-y-4"
        >
          <div>
            <Label htmlFor="itemName">名称 *</Label>
            <Input
              id="itemName"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="请输入名称"
              required
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              取消
            </Button>
            <Button type="submit">{editingItem ? '保存修改' : '添加'}</Button>
          </div>
        </form>
      </Modal>

      <ModalConfirm
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDeleteItem}
        title="确认删除"
        description="确定要删除这个配置项吗？此操作不可撤销。"
        confirmText="确认删除"
        variant="danger"
      />
    </div>
  );
}
