import { useState, useEffect } from 'react';
import {
  Table, Tag, Button, Input, Select, DatePicker, Space, Modal, Form,
  InputNumber, message, Descriptions, Card, Row, Col, Timeline,
  Avatar,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, CheckOutlined, StopOutlined,
  DownloadOutlined, EyeOutlined, ShoppingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { orderApi } from '../../services/api';
import {
  orderStatusLabels, orderStatusColors,
  fulfillmentStatusLabels, fulfillmentStatusColors, paymentMethodLabels,
} from '../../utils/enums';
import { useAuthStore } from '../../store/auth';
import { UserRole, OrderStatus, FulfillmentStatus, PaymentMethod } from '../../types';
import type { Order, Fulfillment } from '../../types';

const { RangePicker } = DatePicker;

function OrderList() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<OrderStatus | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);
  const [payModal, setPayModal] = useState(false);
  const [createModal, setCreateModal] = useState(false);
  const [current, setCurrent] = useState<Order | null>(null);
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();

  const canPay = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canCreate = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance || user.role === UserRole.ConsultantManager);
  const canExport = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance);
  const canCancel = user && (user.role === UserRole.SuperAdmin || user.role === UserRole.Finance || user.role === UserRole.ConsultantManager);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await orderApi.list({
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
      const blob: any = await orderApi.export({
        keyword, status,
        startDate: dateRange?.[0]?.toDate(),
        endDate: dateRange?.[1]?.toDate(),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `orders_${dayjs().format('YYYYMMDD')}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { }
  };

  const handlePay = async (values: any) => {
    if (!current) return;
    try {
      const res = await orderApi.pay(current.id, values);
      if (res.success) {
        message.success('支付成功');
        setPayModal(false);
        form.resetFields();
        fetchData();
      }
    } catch { }
  };

  const handleCancel = (record: Order) => {
    Modal.confirm({
      title: '确认取消订单？',
      onOk: async () => {
        try {
          const res = await orderApi.cancel(record.id, '管理员取消');
          if (res.success) { message.success('已取消'); fetchData(); }
        } catch { }
      },
    });
  };

  const handleCreate = async (values: any) => {
    try {
      const res = await orderApi.create(values);
      if (res.success) {
        message.success('订单创建成功');
        setCreateModal(false);
        createForm.resetFields();
        fetchData();
      }
    } catch { }
  };

  const columns = [
    { title: '订单编号', dataIndex: 'orderNo', width: 180, fixed: 'left' as const },
    { title: '类型', dataIndex: 'orderType', width: 100 },
    { title: '客户', render: (_: any, r: Order) => `${r.customerName} · ${r.customerPhone}` },
    { title: '关联合同', dataIndex: 'contractNo', render: (v: string) => v || '-' },
    { title: '金额', dataIndex: 'totalAmount', render: (v: number) => `¥${v.toLocaleString()}` },
    { title: '已付', dataIndex: 'paidAmount', render: (v: number) => `¥${v.toLocaleString()}` },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: OrderStatus) => <Tag color={orderStatusColors[v]}>{orderStatusLabels[v]}</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'), width: 150 },
    {
      title: '操作', width: 200, fixed: 'right' as const,
      render: (_: any, r: Order) => (
        <Space>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/admin/orders/${r.id}`)}>详情</Button>
          {canPay && r.status === OrderStatus.Pending && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => { setCurrent(r); setPayModal(true); }}>收款</Button>
          )}
          {canCancel && (r.status === OrderStatus.Pending || r.status === OrderStatus.Paid) && (
            <Button type="link" size="small" danger onClick={() => handleCancel(r)}>取消</Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <Space size="middle" wrap>
          <Input placeholder="搜索订单编号/客户姓名" prefix={<SearchOutlined />} allowClear style={{ width: 260 }}
            value={keyword} onChange={(e) => setKeyword(e.target.value)} onPressEnter={handleSearch} />
          <Select placeholder="状态" allowClear style={{ width: 140 }} value={status} onChange={(v) => { setStatus(v); setPage(1); }}
            options={Object.entries(orderStatusLabels).map(([k, v]) => ({ value: Number(k), label: v }))} />
          <RangePicker value={dateRange} onChange={setDateRange as any} showTime />
          <Button type="primary" onClick={handleSearch}>查询</Button>
        </Space>
        <Space>
          {canExport && <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>}
          {canCreate && <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>创建订单</Button>}
        </Space>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        dataSource={list}
        columns={columns}
        scroll={{ x: 1200 }}
        pagination={{
          current: page, pageSize, total, showSizeChanger: true,
          onChange: (p, ps) => { setPage(p); setPageSize(ps); },
        }}
      />

      <Modal title="订单收款" open={payModal} onCancel={() => { setPayModal(false); form.resetFields(); }} footer={null}>
        {current && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', borderRadius: 4 }}>
            <div><strong>订单：</strong>{current.orderNo}</div>
            <div><strong>待付金额：</strong>¥{(current.totalAmount - current.paidAmount).toLocaleString()} / 总额 ¥{current.totalAmount.toLocaleString()}</div>
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

      <Modal title="创建订单" open={createModal} onCancel={() => { setCreateModal(false); createForm.resetFields(); }} footer={null}>
        <Form form={createForm} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="orderType" label="订单类型" rules={[{ required: true }]}>
            <Select options={[
              { value: '租房', label: '租房' },
              { value: '服务费', label: '服务费' },
              { value: '押金', label: '押金' },
              { value: '其他', label: '其他' },
            ]} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="customerName" label="客户姓名" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="customerPhone" label="联系电话" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="totalAmount" label="订单金额" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="contractId" label="关联合同"><Select allowClear options={[]} /></Form.Item>
          <Form.Item name="remarks" label="备注"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default OrderList;
