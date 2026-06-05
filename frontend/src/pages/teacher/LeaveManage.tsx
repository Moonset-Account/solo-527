import { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Modal, Input, Select, message, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { LeaveRequest } from '@/types';
import { getLeaves, reviewLeave } from '@/api/finance';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待审批' },
  approved: { color: 'green', label: '已批准' },
  rejected: { color: 'red', label: '已拒绝' },
};

export default function LeaveManage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<LeaveRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page };
      if (statusFilter) params.status = statusFilter;
      const res = await getLeaves(params);
      setData(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取请假列表失败');
    }
    setLoading(false);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReview = (record: LeaveRequest, action: 'approved' | 'rejected') => {
    let remark = '';
    Modal.confirm({
      title: action === 'approved' ? '确认批准此请假？' : '确认拒绝此请假？',
      content: (
        <Input.TextArea
          placeholder={action === 'rejected' ? '请输入拒绝原因' : '备注（可选）'}
          rows={3}
          onChange={(e) => { remark = e.target.value; }}
        />
      ),
      onOk: async () => {
        try {
          await reviewLeave(record.id, action, remark || undefined);
          message.success(action === 'approved' ? '已批准' : '已拒绝');
          fetchData();
        } catch {
          message.error('操作失败');
        }
      },
    });
  };

  const columns: ColumnsType<LeaveRequest> = [
    { title: '幼儿', dataIndex: 'child_name', key: 'child_name' },
    { title: '申请人', dataIndex: 'requester_name', key: 'requester_name' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => {
        const s = statusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Button type="primary" size="small" onClick={() => handleReview(record, 'approved')}>
              批准
            </Button>
            <Button danger size="small" onClick={() => handleReview(record, 'rejected')}>
              拒绝
            </Button>
          </Space>
        ) : (
          <span style={{ color: '#999' }}>
            {record.reviewed_by_name ? `由 ${record.reviewed_by_name} 处理` : ''}
          </span>
        ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>请假管理</h2>
        <Select
          placeholder="筛选状态"
          allowClear
          style={{ width: 140 }}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); setPage(1); }}
          options={[
            { value: 'pending', label: '待审批' },
            { value: 'approved', label: '已批准' },
            { value: 'rejected', label: '已拒绝' },
          ]}
        />
      </div>
      <Table<LeaveRequest>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </div>
  );
}
