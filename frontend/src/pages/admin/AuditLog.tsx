import { useState, useEffect, useCallback } from 'react';
import { Table, Input, Select, message, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { AuditLog } from '@/types';
import client from '@/api/client';

const actionLabels: Record<string, { color: string; label: string }> = {
  create: { color: 'green', label: '创建' },
  update: { color: 'blue', label: '更新' },
  delete: { color: 'red', label: '删除' },
  verify: { color: 'cyan', label: '核验' },
  approve: { color: 'green', label: '审批' },
  reject: { color: 'red', label: '拒绝' },
  login: { color: 'purple', label: '登录' },
  export: { color: 'orange', label: '导出' },
};

export default function AuditLogPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (search) params.search = search;
      if (actionFilter) params.action = actionFilter;
      const res = await client.get('/audit-log/', { params });
      setData(res.data.results || res.data);
      setTotal(res.data.count || res.data.length);
    } catch {
      message.error('获取审计日志失败');
    }
    setLoading(false);
  }, [page, search, actionFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<AuditLog> = [
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180 },
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 100,
      render: (v: string) => {
        const s = actionLabels[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    { title: '模型', dataIndex: 'model_name', key: 'model_name', width: 120 },
    { title: '对象ID', dataIndex: 'object_id', key: 'object_id', width: 100 },
    { title: '详情', dataIndex: 'detail', key: 'detail', ellipsis: true },
    { title: 'IP地址', dataIndex: 'ip_address', key: 'ip_address', width: 130 },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>审计日志</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <Select
            placeholder="操作类型"
            allowClear
            style={{ width: 140 }}
            value={actionFilter}
            onChange={(v) => { setActionFilter(v); setPage(1); }}
            options={Object.entries(actionLabels).map(([value, { label }]) => ({ value, label }))}
          />
          <Input.Search
            placeholder="搜索日志"
            style={{ width: 260 }}
            allowClear
            onSearch={(v) => { setSearch(v); setPage(1); }}
          />
        </div>
      </div>
      <Table<AuditLog>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </div>
  );
}
