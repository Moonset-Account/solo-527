import { useState, useEffect } from 'react';
import { Search, Calendar, User, FileText, Eye } from 'lucide-react';
import { configApi } from '@/api';
import { AuditLog } from '@/types';
import { formatDateTime } from '@/utils';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';

const actionTypeOptions = [
  { value: '', label: '全部类型' },
  { value: 'CREATE', label: '创建' },
  { value: 'UPDATE', label: '更新' },
  { value: 'DELETE', label: '删除' },
  { value: 'APPROVE', label: '审批通过' },
  { value: 'REJECT', label: '审批驳回' },
];

const entityTypeOptions = [
  { value: '', label: '全部对象' },
  { value: 'REAGENT', label: '试剂' },
  { value: 'HAZARD_LABEL', label: '危化标签' },
  { value: 'MAINTENANCE_CONFIG', label: '维保配置' },
  { value: 'APPLICATION', label: '领用申请' },
  { value: 'SCHEDULE', label: '排期' },
];

const operatorOptions = [
  { value: '', label: '全部操作人' },
  { value: 'admin001', label: '系统管理员' },
  { value: 'teacher001', label: '张老师' },
  { value: 'principal001', label: '李负责人' },
  { value: 'researcher001', label: '王研究员' },
  { value: 'researcher002', label: '刘研究员' },
];

const actionBadgeVariants: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  CREATE: 'success',
  UPDATE: 'primary',
  DELETE: 'danger',
  APPROVE: 'success',
  REJECT: 'danger',
};

export default function ConfigAudit() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionType, setActionType] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await configApi.getAuditLogs({
        page,
        size: 10,
        entityType: entityType || undefined,
        operatorId: operatorId || undefined,
      });
      setData(res.content);
      setTotal(res.total);
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, actionType, operatorId, entityType]);

  const handleViewDetail = (record: AuditLog) => {
    setSelectedLog(record);
    setDetailModalOpen(true);
  };

  const formatJsonDiff = (oldVal?: string, newVal?: string) => {
    try {
      const old = oldVal ? JSON.parse(oldVal) : {};
      const newObj = newVal ? JSON.parse(newVal) : {};
      return { old, new: newObj };
    } catch {
      return { old: oldVal, new: newVal };
    }
  };

  const columns = [
    {
      key: 'timestamp',
      title: '时间',
      render: (record: AuditLog) => formatDateTime(record.timestamp),
    },
    {
      key: 'operatorName',
      title: '操作人',
      render: (record: AuditLog) => (
        <div className="flex items-center gap-1">
          <User className="w-4 h-4 text-neutral-400" />
          <span>{record.operatorName}</span>
        </div>
      ),
    },
    {
      key: 'action',
      title: '操作类型',
      render: (record: AuditLog) => (
        <Badge variant={actionBadgeVariants[record.action] || 'neutral'}>
          {actionTypeOptions.find((o) => o.value === record.action)?.label || record.action}
        </Badge>
      ),
    },
    {
      key: 'entityType',
      title: '操作对象',
      render: (record: AuditLog) => (
        <div className="flex items-center gap-1">
          <FileText className="w-4 h-4 text-neutral-400" />
          <span>{entityTypeOptions.find((o) => o.value === record.entityType)?.label || record.entityType}</span>
        </div>
      ),
    },
    { key: 'entityId', title: '对象ID', dataIndex: 'entityId' as const },
    { key: 'ipAddress', title: 'IP地址', render: () => '192.168.1.100' },
    {
      key: 'actions',
      title: '操作',
      width: 100,
      render: (record: AuditLog) => (
        <Button variant="ghost" size="sm" onClick={() => handleViewDetail(record)}>
          <Eye className="w-4 h-4" />
          详情
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">操作审计日志</h1>
        <p className="text-sm text-neutral-500 mt-1">查看和追踪系统所有操作记录</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">操作类型</label>
            <Select
              options={actionTypeOptions}
              value={actionType}
              onChange={(val) => { setActionType(val as string); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">操作对象</label>
            <Select
              options={entityTypeOptions}
              value={entityType}
              onChange={(val) => { setEntityType(val as string); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">操作人</label>
            <Select
              options={operatorOptions}
              value={operatorId}
              onChange={(val) => { setOperatorId(val as string); setPage(1); }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">关键词</label>
            <Input
              placeholder="搜索对象ID"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              prefix={<Search className="w-4 h-4 text-neutral-400" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">开始日期</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              prefix={<Calendar className="w-4 h-4 text-neutral-400" />}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">结束日期</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              prefix={<Calendar className="w-4 h-4 text-neutral-400" />}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4 gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setActionType('');
              setEntityType('');
              setOperatorId('');
              setKeyword('');
              setStartDate('');
              setEndDate('');
              setPage(1);
            }}
          >
            重置
          </Button>
          <Button onClick={() => { setPage(1); loadData(); }}>搜索</Button>
        </div>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        rowKey="id"
        pagination={{
          current: page,
          pageSize: 10,
          total,
          onChange: (p) => setPage(p),
        }}
      />

      <Modal
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="操作详情"
        width={600}
      >
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-neutral-500">操作时间</p>
                <p className="text-sm text-neutral-900 font-medium">{formatDateTime(selectedLog.timestamp)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">操作人</p>
                <p className="text-sm text-neutral-900 font-medium">{selectedLog.operatorName}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">操作类型</p>
                <Badge variant={actionBadgeVariants[selectedLog.action] || 'neutral'}>
                  {actionTypeOptions.find((o) => o.value === selectedLog.action)?.label || selectedLog.action}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-neutral-500">操作对象</p>
                <p className="text-sm text-neutral-900 font-medium">
                  {entityTypeOptions.find((o) => o.value === selectedLog.entityType)?.label || selectedLog.entityType}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-2">变更内容</p>
              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                {selectedLog.oldValue && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">原值 (oldValue)</p>
                    <pre className="text-xs bg-white p-3 rounded border border-neutral-200 overflow-x-auto text-neutral-600">
                      {JSON.stringify(formatJsonDiff(selectedLog.oldValue).old, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.newValue && (
                  <div>
                    <p className="text-xs text-neutral-500 mb-1">新值 (newValue)</p>
                    <pre className="text-xs bg-white p-3 rounded border border-neutral-200 overflow-x-auto text-neutral-900">
                      {JSON.stringify(formatJsonDiff(undefined, selectedLog.newValue).new, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-sm text-neutral-500">操作人ID</p>
                <p className="text-sm text-neutral-900 font-mono">{selectedLog.operatorId}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">对象ID</p>
                <p className="text-sm text-neutral-900 font-mono">{selectedLog.entityId}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
