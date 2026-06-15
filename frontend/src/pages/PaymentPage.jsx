import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Tag,
  Button,
  Select,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Space,
  message,
  Popconfirm,
} from 'antd';
import {
  DollarOutlined,
  WarningOutlined,
  UndoOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { PAYMENTS } from '../api/endpoints';
import {
  PAYMENT_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatMoney, formatDateTime } from '../utils/format';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';

const PaymentPage = () => {
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [methodFilter, setMethodFilter] = useState(undefined);
  const [discrepancyFilter, setDiscrepancyFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);

  const [payModalOpen, setPayModalOpen] = useState(false);
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [payForm] = Form.useForm();
  const [discrepancyForm] = Form.useForm();
  const [resolveForm] = Form.useForm();
  const [refundForm] = Form.useForm();

  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrManager = hasRole('admin') || hasRole('manager');

  const { data: ordersData, isLoading } = useQuery({
    queryKey: [
      'payments',
      typeFilter,
      statusFilter,
      methodFilter,
      discrepancyFilter,
      dateRange,
    ],
    queryFn: () => {
      const params = {};
      if (typeFilter) params.order_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (methodFilter) params.payment_method = methodFilter;
      if (discrepancyFilter !== undefined)
        params.has_discrepancy = discrepancyFilter;
      if (dateRange?.[0]) params.created_at_after = dateRange[0];
      if (dateRange?.[1]) params.created_at_before = dateRange[1];
      return request.get(PAYMENTS.ORDERS, params);
    },
  });

  const orders = ordersData?.results || ordersData || [];

  const payMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(PAYMENTS.PROCESS_PAYMENT(id), data),
    onSuccess: () => {
      message.success('支付处理成功');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setPayModalOpen(false);
      payForm.resetFields();
      setCurrentOrder(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (id) =>
      request.post(PAYMENTS.CANCEL_ORDER(id)),
    onSuccess: () => {
      message.success('订单已取消');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
    },
  });

  const discrepancyMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(PAYMENTS.MARK_DISCREPANCY(id), data),
    onSuccess: () => {
      message.success('差异已标记，进入未处理差异列表');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancy-orders'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
      setDiscrepancyModalOpen(false);
      discrepancyForm.resetFields();
      setCurrentOrder(null);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(PAYMENTS.RESOLVE_DISCREPANCY(id), data),
    onSuccess: () => {
      message.success('差异已处理，转化报表已刷新');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['discrepancy-orders'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setResolveModalOpen(false);
      resolveForm.resetFields();
      setCurrentOrder(null);
    },
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.post(PAYMENTS.REFUND(id), data),
    onSuccess: () => {
      message.success('退款已处理');
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setRefundModalOpen(false);
      refundForm.resetFields();
      setCurrentOrder(null);
    },
  });

  const handlePay = async () => {
    try {
      const values = await payForm.validateFields();
      payMutation.mutate({ id: currentOrder.id, ...values });
    } catch {}
  };

  const handleDiscrepancy = async () => {
    try {
      const values = await discrepancyForm.validateFields();
      discrepancyMutation.mutate({ id: currentOrder.id, ...values });
    } catch {}
  };

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      resolveMutation.mutate({ id: currentOrder.id, ...values });
    } catch {}
  };

  const handleRefund = async () => {
    try {
      const values = await refundForm.validateFields();
      refundMutation.mutate({ id: currentOrder.id, ...values });
    } catch {}
  };

  const getActionButtons = (record) => {
    const { status, has_discrepancy, discrepancy_resolved, id } = record;
    const buttons = [];

    if (status === PAYMENT_STATUS.PENDING) {
      buttons.push(
        <Button
          key="pay"
          size="small"
          type="primary"
          icon={<DollarOutlined />}
          onClick={() => {
            setCurrentOrder(record);
            setPayModalOpen(true);
          }}
        >
          处理支付
        </Button>,
        <Popconfirm
          key="cancel"
          title="确认取消该订单？"
          onConfirm={() => cancelMutation.mutate(id)}
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" danger icon={<CloseOutlined />}>
            取消
          </Button>
        </Popconfirm>
      );
    }

    if (status === PAYMENT_STATUS.PAID) {
      if (!has_discrepancy) {
        buttons.push(
          <Button
            key="mark-discrepancy"
            size="small"
            icon={<WarningOutlined />}
            onClick={() => {
              setCurrentOrder(record);
              setDiscrepancyModalOpen(true);
            }}
          >
            标记差异
          </Button>
        );
      } else if (!discrepancy_resolved) {
        buttons.push(
          <Button
            key="resolve-discrepancy"
            size="small"
            type="primary"
            icon={<WarningOutlined />}
            onClick={() => {
              setCurrentOrder(record);
              if (isAdminOrManager) {
                setResolveModalOpen(true);
              } else {
                setDiscrepancyModalOpen(true);
              }
            }}
          >
            处理差异
          </Button>
        );
      }
      buttons.push(
        <Button
          key="refund"
          size="small"
          danger
          icon={<UndoOutlined />}
          onClick={() => {
            setCurrentOrder(record);
            setRefundModalOpen(true);
          }}
        >
          退款
        </Button>
      );
    }

    return buttons;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '订单类型',
      dataIndex: 'order_type',
      key: 'order_type',
      render: (v) => (
        <Tag color={getColorByValue(ORDER_TYPE_OPTIONS, v)}>
          {getLabelByValue(ORDER_TYPE_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '会员',
      dataIndex: 'member',
      key: 'member',
      render: (v) => v?.name || '-',
    },
    {
      title: '总金额',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (v) => formatMoney(v),
    },
    {
      title: '应付金额',
      dataIndex: 'payable_amount',
      key: 'payable_amount',
      render: (v) => formatMoney(v),
    },
    {
      title: '实付金额',
      dataIndex: 'paid_amount',
      key: 'paid_amount',
      render: (v) => formatMoney(v),
    },
    {
      title: '支付方式',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (v) => (
        <Tag color={getColorByValue(PAYMENT_METHOD_OPTIONS, v)}>
          {getLabelByValue(PAYMENT_METHOD_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={getColorByValue(PAYMENT_STATUS_OPTIONS, v)}>
          {getLabelByValue(PAYMENT_STATUS_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '差异',
      dataIndex: 'has_discrepancy',
      key: 'has_discrepancy',
      render: (v, record) => {
        if (!v) return <Tag color="green">无</Tag>;
        if (record.discrepancy_resolved)
          return <Tag color="blue">已处理</Tag>;
        return <Tag color="red">未处理</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v) => formatDateTime(v),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" wrap>
          {getActionButtons(record)}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">支付管理</div>
        <div className="page-description">管理订单支付与交易记录</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="订单类型"
            allowClear
            style={{ width: 150 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={ORDER_TYPE_OPTIONS}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={PAYMENT_STATUS_OPTIONS}
          />
          <Select
            placeholder="支付方式"
            allowClear
            style={{ width: 150 }}
            value={methodFilter}
            onChange={setMethodFilter}
            options={PAYMENT_METHOD_OPTIONS}
          />
          <Select
            placeholder="差异状态"
            allowClear
            style={{ width: 130 }}
            value={discrepancyFilter}
            onChange={setDiscrepancyFilter}
            options={[
              { value: true, label: '有差异' },
              { value: false, label: '无差异' },
            ]}
          />
          <DatePicker.RangePicker
            value={
              dateRange
                ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                : null
            }
            onChange={(dates) =>
              setDateRange(
                dates
                  ? [
                      dates[0]?.format('YYYY-MM-DD'),
                      dates[1]?.format('YYYY-MM-DD'),
                    ]
                  : null
              )
            }
          />
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="处理支付"
        open={payModalOpen}
        onOk={handlePay}
        onCancel={() => {
          setPayModalOpen(false);
          payForm.resetFields();
        }}
        confirmLoading={payMutation.isPending}
        destroyOnClose
      >
        <Form form={payForm} layout="vertical" preserve={false}>
          <Form.Item
            name="payment_method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select options={PAYMENT_METHOD_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="paid_amount"
            label="实付金额"
            rules={[{ required: true, message: '请输入实付金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
            />
          </Form.Item>
          <Form.Item name="transaction_id" label="交易号">
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="标记差异"
        open={discrepancyModalOpen}
        onOk={handleDiscrepancy}
        onCancel={() => {
          setDiscrepancyModalOpen(false);
          discrepancyForm.resetFields();
        }}
        confirmLoading={discrepancyMutation.isPending}
        destroyOnClose
      >
        <Form form={discrepancyForm} layout="vertical" preserve={false}>
          <Form.Item
            name="discrepancy_note"
            label="差异说明"
            rules={[{ required: true, message: '请输入差异说明' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理差异"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => {
          setResolveModalOpen(false);
          resolveForm.resetFields();
        }}
        confirmLoading={resolveMutation.isPending}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical" preserve={false}>
          <Form.Item
            name="resolution_note"
            label="处理说明"
            rules={[{ required: true, message: '请输入处理说明' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="退款"
        open={refundModalOpen}
        onOk={handleRefund}
        onCancel={() => {
          setRefundModalOpen(false);
          refundForm.resetFields();
        }}
        confirmLoading={refundMutation.isPending}
        destroyOnClose
      >
        <Form form={refundForm} layout="vertical" preserve={false}>
          <Form.Item
            name="refund_amount"
            label="退款金额"
            rules={[{ required: true, message: '请输入退款金额' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              prefix="¥"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default PaymentPage;
