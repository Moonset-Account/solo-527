import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, DatePicker, Space, Modal,
  Form, InputNumber, message, Statistic, Row, Col, Card,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, CheckOutlined, DownloadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { contractApi } from '../../services/api';
import {
  billStatusLabels, billStatusColors, paymentMethodLabels,
} from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, BillStatus, PaymentMethod } from '../../types';
import type { Bill } from '../../types';

const { RangePicker } = DatePicker;

function BillList() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Bill[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<BillStatus | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [billModal, setBillModal] = useState(false);
  const [current, setCurrent] = useState<Bill | null>(null);
  const [form] = Form.useForm();
  const [billForm] = Form.useForm();

  const canPay = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canCreate = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canExport = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await contractApi.bills({
        page, pageSize, keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      if (res.success && res.data) {
        setList(res.data.items);
        setTotal(res.data.totalCount);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, pageSize]);

  const handleSearch = () => { setPage(1); fetchData(); };

  const handleExport = async () => {
    try {
      const blob: any = await contractApi.exportBills({
        keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bills_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
  };

  const handlePay = async (values: any) => {
    if (!current) return;
    try {
      const res = await contractApi.payBill(current.id, values);
      if (res.success) {
        message.success('收款成功');
        setPayModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleCreateBill = async (values: any) => {
    try {
      const res = await contractApi.createBill({
        ...values,
        billingDate: values.billingDate.toDate(),
        dueDate: values.dueDate.toDate(),
      });
      if (res.success) {
        message.success('账单创建成功');
        setBillModal(false);
        billForm.resetFields();
        fetchData();
      }
    } catch { }
  };

  const stats = {
    total: list.reduce((s, b) => s + b.amount, 0),
    paid: list.reduce((s, b) => s + b.paidAmount, 0),
    unpaid: list.filter(b => b.status === BillStatus.Unpaid || b.status === BillStatus.Overdue).reduce((s, b) => s + (b.amount - b.paidAmount), 0),
  };

  const columns = [
    { title: '账单编号', dataIndex: 'billNo', width: 180 },
    { title: '类型', dataIndex: 'billType', width: 80 },
    { title: '租客', dataIndex: 'tenantName' },
    { title: '账期', dataIndex: 'period', width: 100 },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已付', dataIndex: 'paidAmount', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '收款进度', render: (_: any, r: Bill) => {
        const pct = r.amount > 0 ? Math.round(r.paidAmount / r.amount * 100) : 0;
        return <span>{pct}%</span>;
      },
    },
    { title: '账单日期', dataIndex: 'billingDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    { title: '到期日期', dataIndex: 'dueDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD'), width: 120 },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: BillStatus) => <Tag color={billStatusColors[v]}>{billStatusLabels[v]}</Tag>,
    },
    {
      title: '操作', width: 120,
      render: (_: any, r: Bill) => canPay && r.status !== BillStatus.Paid && r.status !== BillStatus.Void ? (
        <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setCurrent(r); setPayModal(true); }}>
          收款
        </Button>
      ) : null,
    },
  ];

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="账单总额" value={stats.total} prefix="¥" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="已收款" value={stats.paid} prefix="¥" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="待收款" value={stats.unpaid} prefix="¥" valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input placeholder="搜索账单编号/租客姓名" prefix={<SearchOutlined />} allowClear style={{ width: 260 }}
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="状态" allowClear style={{ width: 140 }} value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={Object.entries(billStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          <RangePicker value={dateRange} onChange={setDateRange as any} />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Space>
          {canExport && <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>}
          {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => setBillModal(true)}>创建账单</Button>}
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal title="账单收款" open={payModal} onCancel={() => { setPayModal(false); form.resetFields(); }} footer={null}>
        {current && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
            <div><strong>账单：</strong>{current.billNo} · {current.billType}</div>
            <div><strong>待收金额：</strong>¥{(current.amount - current.paidAmount).toLocaleString()} / 总额 ¥{current.amount.toLocaleString()}</div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handlePay}>
          <Form.Item name="amount" label="收款金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="收款方式" rules={[{ required: true }]}>
            <Select options={Object.entries(paymentMethodLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          </Form.Item>
          <Form.Item name="paymentRefNo" label="流水号"><Input /></Form.Item>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setPayModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认收款</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="创建账单" open={billModal} onCancel={() => { setBillModal(false); billForm.resetFields(); }} footer={null}>
        <Form form={billForm} layout="vertical" onFinish={handleCreateBill}>
          <Form.Item name="contractId" label="关联合同" rules={[{ required: true }]}>
            <Select options={[
              { value: '1', label: '示例合同' },
            ]} />
          </Form.Item>
          <Form.Item name="billType" label="账单类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '月租', label: '月租' },
              { value: '押金', label: '押金' },
              { value: '水费', label: '水费' },
              { value: '电费', label: '电费' },
              { value: '物业费', label: '物业费' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="period" label="账期"><Input placeholder="如：2024-01" /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="billingDate" label="账单日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="dueDate" label="到期日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setBillModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default BillList;
