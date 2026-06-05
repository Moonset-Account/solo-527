import { useState, useEffect, useCallback } from 'react';
import { Table, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { Payment } from '@/types';
import { getPayments } from '@/api/finance';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待缴' },
  paid: { color: 'green', label: '已缴' },
  overdue: { color: 'red', label: '逾期' },
  waived: { color: 'default', label: '减免' },
};

export default function PaymentList() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPayments({ page });
      setData(res.results);
      setTotal(res.count);
    } catch {
      message.error('获取缴费记录失败');
    }
    setLoading(false);
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns: ColumnsType<Payment> = [
    { title: '费用名称', dataIndex: 'fee_item_name', key: 'fee_item_name' },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (v: string) => `¥${v}`,
    },
    {
      title: '实缴金额',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (v: string) => (v ? `¥${v}` : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v: string, record) => {
        const s = statusMap[v];
        const isPending = v === 'pending' || v === 'overdue';
        return (
          <Tag color={s?.color} style={isPending ? { fontWeight: 'bold' } : undefined}>
            {s?.label || v}
          </Tag>
        );
      },
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (v: string, record) => {
        const isOverdue = record.status === 'overdue' || (record.status === 'pending' && new Date(v) < new Date());
        return <span style={isOverdue ? { color: '#ff4d4f', fontWeight: 'bold' } : undefined}>{v}</span>;
      },
    },
    { title: '缴费日期', dataIndex: 'paid_at', key: 'paid_at', render: (v: string) => v || '-' },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true, render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>缴费记录</h2>
      <Table<Payment>
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
        rowClassName={(record) =>
          record.status === 'overdue' || record.status === 'pending' ? 'pending-payment-row' : ''
        }
      />
      <style>{`
        .pending-payment-row {
          background-color: #fffbe6 !important;
        }
        .pending-payment-row:hover > td {
          background-color: #fff1b8 !important;
        }
      `}</style>
    </div>
  );
}
