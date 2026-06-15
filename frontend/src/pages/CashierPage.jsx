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
  Tabs,
  Descriptions,
  Statistic,
  message,
} from 'antd';
import {
  PlusOutlined,
  SwapOutlined,
  AuditOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { PAYMENTS } from '../api/endpoints';
import {
  CASHIER_SHIFT_STATUS_OPTIONS,
  CASHIER_SHIFT_STATUS,
  PAYMENT_METHOD_OPTIONS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatMoney, formatDateTime } from '../utils/format';
import useAuthStore from '../store/authStore';
import dayjs from 'dayjs';

const OpenShiftTab = () => {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [openForm] = Form.useForm();
  const [closeForm] = Form.useForm();
  const [reconcileForm] = Form.useForm();
  const [summaryData, setSummaryData] = useState(null);

  const { data: currentShift, isLoading } = useQuery({
    queryKey: ['current-shift'],
    queryFn: () => request.get(PAYMENTS.SHIFT_CURRENT),
    select: (data) => data?.detail ? null : data,
  });

  const openMutation = useMutation({
    mutationFn: (values) => request.post(PAYMENTS.SHIFT_OPEN, values),
    onSuccess: () => {
      message.success('开班成功');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setOpenModalOpen(false);
      openForm.resetFields();
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, ...data }) => request.post(PAYMENTS.SHIFT_CLOSE(id), data),
    onSuccess: () => {
      message.success('交班成功');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setCloseModalOpen(false);
      closeForm.resetFields();
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: ({ id, ...data }) => request.post(PAYMENTS.SHIFT_RECONCILE(id), data),
    onSuccess: () => {
      message.success('对账成功，转换报告已触发重新生成');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setReconcileModalOpen(false);
      reconcileForm.resetFields();
    },
  });

  const summaryMutation = useMutation({
    mutationFn: (id) => request.get(PAYMENTS.SHIFT_SUMMARY(id)),
    onSuccess: (data) => {
      setSummaryData(data);
      setSummaryModalOpen(true);
    },
  });

  const handleOpen = async () => {
    try {
      const values = await openForm.validateFields();
      openMutation.mutate(values);
    } catch {}
  };

  const handleClose = async () => {
    try {
      const values = await closeForm.validateFields();
      if (currentShift) {
        closeMutation.mutate({ id: currentShift.id, ...values });
      }
    } catch {}
  };

  const handleReconcile = async () => {
    try {
      const values = await reconcileForm.validateFields();
      if (currentShift) {
        reconcileMutation.mutate({ id: currentShift.id, ...values });
      }
    } catch {}
  };

  if (isLoading) {
    return <Card loading />;
  }

  if (!currentShift) {
    return (
      <>
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <p style={{ fontSize: 16, color: '#999', marginBottom: 24 }}>当前没有营业中的班次</p>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenModalOpen(true)}>
              开班
            </Button>
          </div>
        </Card>
        <Modal
          title="开班"
          open={openModalOpen}
          onOk={handleOpen}
          onCancel={() => { setOpenModalOpen(false); openForm.resetFields(); }}
          confirmLoading={openMutation.isPending}
          destroyOnClose
        >
          <Form form={openForm} layout="vertical" preserve={false}>
            <Form.Item name="opening_cash" label="开班备用金" rules={[{ required: true, message: '请输入开班备用金' }]}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
            </Form.Item>
          </Form>
        </Modal>
      </>
    );
  }

  const isClosed = currentShift.status === CASHIER_SHIFT_STATUS.CLOSED;
  const isReconciled = currentShift.status === CASHIER_SHIFT_STATUS.RECONCILED;
  const hasDiscrepancy = currentShift.cash_discrepancy !== 0 && currentShift.cash_discrepancy !== null && currentShift.cash_discrepancy !== undefined;

  return (
    <>
      <Card title={`班次 ${currentShift.shift_no || ''}`}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="班次编号">{currentShift.shift_no || '-'}</Descriptions.Item>
          <Descriptions.Item label="收银员">{currentShift.cashier?.name || currentShift.cashier_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{formatDateTime(currentShift.start_time)}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{formatDateTime(currentShift.end_time)}</Descriptions.Item>
          <Descriptions.Item label="开班备用金">{formatMoney(currentShift.opening_cash)}</Descriptions.Item>
          <Descriptions.Item label="订单数">{currentShift.orders_count ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="总金额">{formatMoney(currentShift.total_amount)}</Descriptions.Item>
          <Descriptions.Item label="预期现金">{formatMoney(currentShift.expected_cash)}</Descriptions.Item>
          {isClosed && (
            <>
              <Descriptions.Item label="实际现金">{formatMoney(currentShift.actual_cash)}</Descriptions.Item>
              <Descriptions.Item label="现金差异">
                {hasDiscrepancy ? (
                  <span style={{ color: '#cf1322', fontWeight: 'bold', fontSize: 16 }}>
                    {formatMoney(currentShift.cash_discrepancy)}
                  </span>
                ) : (
                  <span style={{ color: '#389e0d', fontWeight: 'bold' }}>{formatMoney(currentShift.cash_discrepancy)}</span>
                )}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="状态">
            <Tag color={getColorByValue(CASHIER_SHIFT_STATUS_OPTIONS, currentShift.status)}>
              {getLabelByValue(CASHIER_SHIFT_STATUS_OPTIONS, currentShift.status)}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Space>
            {currentShift.status === CASHIER_SHIFT_STATUS.OPEN && (
              <Button type="primary" icon={<SwapOutlined />} onClick={() => setCloseModalOpen(true)}>
                交班
              </Button>
            )}
            {isClosed && isAdminOrManager && (
              <Button type="primary" icon={<AuditOutlined />} onClick={() => setReconcileModalOpen(true)}>
                对账
              </Button>
            )}
            {(isClosed || isReconciled) && (
              <Button icon={<EyeOutlined />} onClick={() => summaryMutation.mutate(currentShift.id)} loading={summaryMutation.isPending}>
                查看汇总
              </Button>
            )}
          </Space>
        </div>
      </Card>

      <Modal
        title="交班"
        open={closeModalOpen}
        onOk={handleClose}
        onCancel={() => { setCloseModalOpen(false); closeForm.resetFields(); }}
        confirmLoading={closeMutation.isPending}
        destroyOnClose
      >
        <Form form={closeForm} layout="vertical" preserve={false}>
          <Form.Item name="actual_cash" label="实际现金" rules={[{ required: true, message: '请输入实际现金金额' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="对账"
        open={reconcileModalOpen}
        onOk={handleReconcile}
        onCancel={() => { setReconcileModalOpen(false); reconcileForm.resetFields(); }}
        confirmLoading={reconcileMutation.isPending}
        destroyOnClose
      >
        <Form form={reconcileForm} layout="vertical" preserve={false}>
          <Form.Item name="reconciliation_note" label="对账备注" rules={[{ required: true, message: '请输入对账备注' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="班次汇总"
        open={summaryModalOpen}
        onCancel={() => { setSummaryModalOpen(false); setSummaryData(null); }}
        footer={null}
        width={700}
      >
        {summaryData && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="班次编号">{summaryData.shift_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="收银员">{summaryData.cashier?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(summaryData.start_time)}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{formatDateTime(summaryData.end_time)}</Descriptions.Item>
              <Descriptions.Item label="订单数">{summaryData.orders_count ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">{formatMoney(summaryData.total_amount)}</Descriptions.Item>
            </Descriptions>
            {summaryData.payment_method_breakdown && (
              <Card title="支付方式汇总" size="small" style={{ marginBottom: 16 }}>
                <Table
                  rowKey="payment_method"
                  dataSource={summaryData.payment_method_breakdown}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '支付方式', dataIndex: 'payment_method', render: (v) => <Tag color={getColorByValue(PAYMENT_METHOD_OPTIONS, v)}>{getLabelByValue(PAYMENT_METHOD_OPTIONS, v)}</Tag> },
                    { title: '订单数', dataIndex: 'count' },
                    { title: '金额', dataIndex: 'amount', render: (v) => formatMoney(v) },
                  ]}
                />
              </Card>
            )}
            {summaryData.order_status_summary && (
              <Card title="订单状态汇总" size="small">
                <Table
                  rowKey="status"
                  dataSource={summaryData.order_status_summary}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '状态', dataIndex: 'status', render: (v) => v || '-' },
                    { title: '数量', dataIndex: 'count' },
                    { title: '金额', dataIndex: 'amount', render: (v) => formatMoney(v) },
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

const ShiftListTab = () => {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [cashierFilter, setCashierFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [summaryData, setSummaryData] = useState(null);
  const [reconcileForm] = Form.useForm();

  const { data: shiftsData, isLoading } = useQuery({
    queryKey: ['shifts', statusFilter, cashierFilter, dateRange],
    queryFn: () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (cashierFilter) params.cashier = cashierFilter;
      if (dateRange?.[0]) params.start_time_after = dateRange[0];
      if (dateRange?.[1]) params.start_time_before = dateRange[1];
      return request.get(PAYMENTS.SHIFTS, params);
    },
  });

  const shifts = shiftsData?.results || shiftsData || [];

  const reconcileMutation = useMutation({
    mutationFn: ({ id, ...data }) => request.post(PAYMENTS.SHIFT_RECONCILE(id), data),
    onSuccess: () => {
      message.success('对账成功，转换报告已触发重新生成');
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      setReconcileModalOpen(false);
      reconcileForm.resetFields();
      setCurrentShift(null);
    },
  });

  const summaryMutation = useMutation({
    mutationFn: (id) => request.get(PAYMENTS.SHIFT_SUMMARY(id)),
    onSuccess: (data) => {
      setSummaryData(data);
      setSummaryModalOpen(true);
    },
  });

  const handleReconcile = async () => {
    try {
      const values = await reconcileForm.validateFields();
      reconcileMutation.mutate({ id: currentShift.id, ...values });
    } catch {}
  };

  const columns = [
    { title: '班次编号', dataIndex: 'shift_no', key: 'shift_no' },
    { title: '收银员', dataIndex: 'cashier', key: 'cashier', render: (v) => v?.name || v?.username || '-' },
    { title: '开始时间', dataIndex: 'start_time', key: 'start_time', render: (v) => formatDateTime(v) },
    { title: '结束时间', dataIndex: 'end_time', key: 'end_time', render: (v) => formatDateTime(v) },
    { title: '开班备用金', dataIndex: 'opening_cash', key: 'opening_cash', render: (v) => formatMoney(v) },
    { title: '预期现金', dataIndex: 'expected_cash', key: 'expected_cash', render: (v) => formatMoney(v) },
    { title: '实际现金', dataIndex: 'actual_cash', key: 'actual_cash', render: (v) => formatMoney(v) },
    {
      title: '现金差异',
      dataIndex: 'cash_discrepancy',
      key: 'cash_discrepancy',
      render: (v) => {
        if (v === null || v === undefined) return '-';
        const color = v === 0 ? '#389e0d' : '#cf1322';
        return <span style={{ color, fontWeight: 'bold' }}>{formatMoney(v)}</span>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={getColorByValue(CASHIER_SHIFT_STATUS_OPTIONS, v)}>
          {getLabelByValue(CASHIER_SHIFT_STATUS_OPTIONS, v)}
        </Tag>
      ),
    },
    { title: '订单数', dataIndex: 'orders_count', key: 'orders_count' },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => formatMoney(v) },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        const buttons = [];
        const isClosed = record.status === CASHIER_SHIFT_STATUS.CLOSED;
        const isReconciled = record.status === CASHIER_SHIFT_STATUS.RECONCILED;
        if (isClosed || isReconciled) {
          buttons.push(
            <Button key="summary" size="small" icon={<EyeOutlined />} onClick={() => summaryMutation.mutate(record.id)} loading={summaryMutation.isPending}>
              汇总
            </Button>
          );
        }
        if (isClosed && isAdminOrManager) {
          buttons.push(
            <Button key="reconcile" size="small" type="primary" icon={<AuditOutlined />} onClick={() => { setCurrentShift(record); setReconcileModalOpen(true); }}>
              对账
            </Button>
          );
        }
        return <Space size="small" wrap>{buttons}</Space>;
      },
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 130 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={CASHIER_SHIFT_STATUS_OPTIONS}
          />
          <Select
            placeholder="收银员"
            allowClear
            style={{ width: 150 }}
            value={cashierFilter}
            onChange={setCashierFilter}
            options={[]}
          />
          <DatePicker.RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) =>
              setDateRange(dates ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')] : null)
            }
          />
        </Space>
      </Card>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={shifts}
          loading={isLoading}
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="对账"
        open={reconcileModalOpen}
        onOk={handleReconcile}
        onCancel={() => { setReconcileModalOpen(false); reconcileForm.resetFields(); setCurrentShift(null); }}
        confirmLoading={reconcileMutation.isPending}
        destroyOnClose
      >
        <Form form={reconcileForm} layout="vertical" preserve={false}>
          <Form.Item name="reconciliation_note" label="对账备注" rules={[{ required: true, message: '请输入对账备注' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="班次汇总"
        open={summaryModalOpen}
        onCancel={() => { setSummaryModalOpen(false); setSummaryData(null); }}
        footer={null}
        width={700}
      >
        {summaryData && (
          <>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="班次编号">{summaryData.shift_no || '-'}</Descriptions.Item>
              <Descriptions.Item label="收银员">{summaryData.cashier?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="开始时间">{formatDateTime(summaryData.start_time)}</Descriptions.Item>
              <Descriptions.Item label="结束时间">{formatDateTime(summaryData.end_time)}</Descriptions.Item>
              <Descriptions.Item label="订单数">{summaryData.orders_count ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="总金额">{formatMoney(summaryData.total_amount)}</Descriptions.Item>
            </Descriptions>
            {summaryData.payment_method_breakdown && (
              <Card title="支付方式汇总" size="small" style={{ marginBottom: 16 }}>
                <Table
                  rowKey="payment_method"
                  dataSource={summaryData.payment_method_breakdown}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '支付方式', dataIndex: 'payment_method', render: (v) => <Tag color={getColorByValue(PAYMENT_METHOD_OPTIONS, v)}>{getLabelByValue(PAYMENT_METHOD_OPTIONS, v)}</Tag> },
                    { title: '订单数', dataIndex: 'count' },
                    { title: '金额', dataIndex: 'amount', render: (v) => formatMoney(v) },
                  ]}
                />
              </Card>
            )}
            {summaryData.order_status_summary && (
              <Card title="订单状态汇总" size="small">
                <Table
                  rowKey="status"
                  dataSource={summaryData.order_status_summary}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: '状态', dataIndex: 'status', render: (v) => v || '-' },
                    { title: '数量', dataIndex: 'count' },
                    { title: '金额', dataIndex: 'amount', render: (v) => formatMoney(v) },
                  ]}
                />
              </Card>
            )}
          </>
        )}
      </Modal>
    </>
  );
};

const DiscrepancyTab = () => {
  const queryClient = useQueryClient();
  const hasRole = useAuthStore((s) => s.hasRole);
  const isAdminOrManager = hasRole('admin') || hasRole('manager');
  const [resolvedFilter, setResolvedFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [resolveForm] = Form.useForm();

  const { data: discrepancyData, isLoading } = useQuery({
    queryKey: ['discrepancy-orders', resolvedFilter, dateRange],
    queryFn: () => {
      const params = { has_discrepancy: true };
      if (resolvedFilter !== undefined) params.discrepancy_resolved = resolvedFilter;
      if (dateRange?.[0]) params.created_at_after = dateRange[0];
      if (dateRange?.[1]) params.created_at_before = dateRange[1];
      return request.get(PAYMENTS.CASHIER_DISCREPANCY, params);
    },
  });

  const orders = discrepancyData?.results || discrepancyData || [];
  const unresolvedCount = orders.filter((o) => !o.discrepancy_resolved).length;

  const resolveMutation = useMutation({
    mutationFn: ({ id, ...data }) => request.post(PAYMENTS.RESOLVE_DISCREPANCY(id), data),
    onSuccess: () => {
      message.success('差异已处理，转化报表已刷新');
      queryClient.invalidateQueries({ queryKey: ['discrepancy-orders'] });
      queryClient.invalidateQueries({ queryKey: ['conversion-reports'] });
      queryClient.invalidateQueries({ queryKey: ['funnels'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setResolveModalOpen(false);
      resolveForm.resetFields();
      setCurrentOrder(null);
    },
  });

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields();
      resolveMutation.mutate({ id: currentOrder.id, ...values });
    } catch {}
  };

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no' },
    { title: '会员', dataIndex: 'member', key: 'member', render: (v) => v?.name || '-' },
    { title: '总金额', dataIndex: 'total_amount', key: 'total_amount', render: (v) => formatMoney(v) },
    { title: '实付金额', dataIndex: 'paid_amount', key: 'paid_amount', render: (v) => formatMoney(v) },
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
    { title: '差异说明', dataIndex: 'discrepancy_note', key: 'discrepancy_note', render: (v) => v || '-' },
    {
      title: '差异状态',
      dataIndex: 'discrepancy_resolved',
      key: 'discrepancy_resolved',
      render: (v) => v ? <Tag color="green">已处理</Tag> : <Tag color="red">未处理</Tag>,
    },
    { title: '处理人', dataIndex: 'discrepancy_resolved_by', key: 'discrepancy_resolved_by', render: (v) => v?.name || v?.username || '-' },
    { title: '处理时间', dataIndex: 'discrepancy_resolved_at', key: 'discrepancy_resolved_at', render: (v) => formatDateTime(v) },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => {
        if (record.discrepancy_resolved || !isAdminOrManager) return null;
        return (
          <Button
            size="small"
            type="primary"
            onClick={() => { setCurrentOrder(record); setResolveModalOpen(true); }}
          >
            处理差异
          </Button>
        );
      },
    },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Statistic title="未处理差异" value={unresolvedCount} valueStyle={{ color: unresolvedCount > 0 ? '#cf1322' : '#389e0d' }} />
        </Space>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="差异状态"
            allowClear
            style={{ width: 130 }}
            value={resolvedFilter}
            onChange={setResolvedFilter}
            options={[
              { value: true, label: '已处理' },
              { value: false, label: '未处理' },
            ]}
          />
          <DatePicker.RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) =>
              setDateRange(dates ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')] : null)
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
          pagination={{ showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Modal
        title="处理差异"
        open={resolveModalOpen}
        onOk={handleResolve}
        onCancel={() => { setResolveModalOpen(false); resolveForm.resetFields(); setCurrentOrder(null); }}
        confirmLoading={resolveMutation.isPending}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical" preserve={false}>
          <Form.Item name="resolution_note" label="处理说明" rules={[{ required: true, message: '请输入处理说明' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

const CashierPage = () => {
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [openForm] = Form.useForm();
  const queryClient = useQueryClient();

  const openMutation = useMutation({
    mutationFn: (values) => request.post(PAYMENTS.SHIFT_OPEN, values),
    onSuccess: () => {
      message.success('开班成功');
      queryClient.invalidateQueries({ queryKey: ['current-shift'] });
      queryClient.invalidateQueries({ queryKey: ['shifts'] });
      setOpenModalOpen(false);
      openForm.resetFields();
    },
  });

  const handleOpen = async () => {
    try {
      const values = await openForm.validateFields();
      openMutation.mutate(values);
    } catch {}
  };

  const tabItems = [
    { key: 'current', label: '当前班次', children: <OpenShiftTab /> },
    { key: 'list', label: '班次列表', children: <ShiftListTab /> },
    { key: 'discrepancy', label: '收银差异', children: <DiscrepancyTab /> },
  ];

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="page-title">收银班次</div>
            <div className="page-description">管理收银员班次与对账</div>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenModalOpen(true)}>
            开班
          </Button>
        </div>
      </div>

      <Tabs items={tabItems} />

      <Modal
        title="开班"
        open={openModalOpen}
        onOk={handleOpen}
        onCancel={() => { setOpenModalOpen(false); openForm.resetFields(); }}
        confirmLoading={openMutation.isPending}
        destroyOnClose
      >
        <Form form={openForm} layout="vertical" preserve={false}>
          <Form.Item name="opening_cash" label="开班备用金" rules={[{ required: true, message: '请输入开班备用金' }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} prefix="¥" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CashierPage;
