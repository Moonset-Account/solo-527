import { useState, useEffect, useCallback } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button, message } from 'antd';
import { PayCircleOutlined, ClockCircleOutlined, CheckCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { Payment } from '@/types';
import { getPayments, exportPayments } from '@/api/finance';

const statusMap: Record<string, { color: string; label: string }> = {
  pending: { color: 'orange', label: '待缴' },
  paid: { color: 'green', label: '已缴' },
  overdue: { color: 'red', label: '逾期' },
  waived: { color: 'default', label: '减免' },
};

export default function PaymentOverview() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ totalAmount: '0', pendingAmount: '0', paidAmount: '0' });

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const allRes = await getPayments({ page_size: 1000 });
        let totalAmt = 0;
        let pendingAmt = 0;
        let paidAmt = 0;
        allRes.results.forEach((p) => {
          const amt = parseFloat(p.amount || '0');
          totalAmt += amt;
          if (p.status === 'pending' || p.status === 'overdue') pendingAmt += amt;
          if (p.status === 'paid') paidAmt += parseFloat(p.paid_amount || '0');
        });
        setStats({
          totalAmount: totalAmt.toFixed(2),
          pendingAmount: pendingAmt.toFixed(2),
          paidAmount: paidAmt.toFixed(2),
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const handleExport = async () => {
    try {
      const blob = await exportPayments();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `缴费记录_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const columns: ColumnsType<Payment> = [
    { title: '幼儿', dataIndex: 'child_name', key: 'child_name' },
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
      render: (v: string) => {
        const s = statusMap[v];
        return s ? <Tag color={s.color}>{s.label}</Tag> : v;
      },
    },
    { title: '截止日期', dataIndex: 'due_date', key: 'due_date' },
    { title: '缴费日期', dataIndex: 'paid_at', key: 'paid_at', render: (v: string) => v || '-' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2>缴费概览</h2>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          导出CSV
        </Button>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="本月应收" value={stats.totalAmount} prefix={<PayCircleOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="待缴金额" value={stats.pendingAmount} prefix={<ClockCircleOutlined />} suffix="元" />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic title="已收金额" value={stats.paidAmount} prefix={<CheckCircleOutlined />} suffix="元" />
          </Card>
        </Col>
      </Row>
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
      />
    </div>
  );
}
