import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Tag,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  Space,
  Tooltip,
  Dropdown,
  message,
  Spin,
  Empty,
  Statistic,
  Progress,
  ColumnsType,
  TableRowSelection,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SearchOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { orderApi, batchApi } from '@/api';
import {
  Order,
  OrderStatus,
  FulfillmentStatsDto,
  HarvestBatch,
  Guid,
  BatchOperationResultDto,
  BatchOperationFailedItem,
} from '@/types';
import {
  ORDER_STATUS_COLORS,
  ORDER_STATUS_NAMES,
} from '@/constants/mappings';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const columns: ColumnsType<Order> = [
  { title: '订单号', dataIndex: 'orderNumber', key: 'orderNumber', width: 160 },
  { title: '客户', dataIndex: 'customerName', key: 'customerName', width: 140 },
  {
    title: '关联批次',
    key: 'batch',
    width: 160,
    render: (_, r) => r.harvestBatch?.batchNumber || '-',
  },
  { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 100, render: (v) => v.toFixed(2) },
  { title: '单价', dataIndex: 'unitPrice', key: 'unitPrice', width: 100, render: (v) => `¥${v.toFixed(2)}` },
  {
    title: '总金额',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    width: 120,
    render: (v) => <span style={{ fontWeight: 600, color: '#cf1322' }}>¥{v.toFixed(2)}</span>,
  },
  {
    title: '交货日期',
    dataIndex: 'deliveryDate',
    key: 'deliveryDate',
    width: 130,
    render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    render: (v: OrderStatus) => <Tag color={ORDER_STATUS_COLORS[v]}>{ORDER_STATUS_NAMES[v]}</Tag>,
  },
  {
    title: '履约日期',
    key: 'fulfillDate',
    width: 130,
    render: (_, r) => (r.status === OrderStatus.Fulfilled && r.deliveryDate ? dayjs(r.deliveryDate).format('YYYY-MM-DD') : '-'),
  },
];

function Orders() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [stats, setStats] = useState<FulfillmentStatsDto | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<Guid[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Order | null>(null);
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [operationResult, setOperationResult] = useState<BatchOperationResultDto | null>(null);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });

  const loadStats = async () => {
    try {
      const s = await orderApi.getStats();
      setStats(s);
    } catch {
      setStats(null);
    }
  };

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const filterParams: any = {
        orderNumber: values.orderNumber || undefined,
        status: values.status || undefined,
        startDate: values.dateRange?.[0]?.toISOString() || undefined,
        endDate: values.dateRange?.[1]?.toISOString() || undefined,
      };
      let result;
      try {
        result = await orderApi.getPaged(page, pageSize, filterParams);
      } catch {
        const all = await orderApi.getAll({
          orderNumber: filterParams.orderNumber,
          status: filterParams.status,
        });
        const start = (page - 1) * pageSize;
        result = {
          items: all.slice(start, start + pageSize),
          totalCount: all.length,
          page,
          pageSize,
          totalPages: Math.ceil(all.length / pageSize),
        };
      }
      setOrders(result.items);
      setPagination({ current: result.page, pageSize: result.pageSize, total: result.totalCount });
    } catch {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const loadBatches = async () => {
    try {
      const b = await batchApi.getAll();
      setBatches(b);
    } catch {
      setBatches([]);
    }
  };

  useEffect(() => {
    loadBatches();
    loadStats();
    loadData();
  }, []);

  const handleSearch = () => {
    setPagination((p) => ({ ...p, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  const handleReset = () => {
    form.resetFields();
    setSelectedRowKeys([]);
    setPagination((p) => ({ ...p, current: 1 }));
    loadData(1, pagination.pageSize);
  };

  const openModal = (record?: Order) => {
    setEditingRecord(record || null);
    if (record) {
      editForm.setFieldsValue({
        ...record,
        harvestBatchId: record.harvestBatchId,
        orderDate: record.orderDate ? dayjs(record.orderDate) : null,
        deliveryDate: record.deliveryDate ? dayjs(record.deliveryDate) : null,
      });
    } else {
      editForm.resetFields();
      editForm.setFieldsValue({ status: OrderStatus.Created, orderDate: dayjs() });
    }
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = {
        ...values,
        harvestBatchId: values.harvestBatchId,
        orderDate: values.orderDate?.toISOString() || dayjs().toISOString(),
        deliveryDate: values.deliveryDate?.toISOString() || undefined,
        totalAmount: (values.quantity || 0) * (values.unitPrice || 0),
      };
      if (editingRecord) {
        await orderApi.update(editingRecord.id, payload);
        message.success('更新成功');
      } else {
        await orderApi.create(payload);
        message.success('创建成功');
      }
      setModalOpen(false);
      loadData(pagination.current, pagination.pageSize);
      loadStats();
    } catch (e: any) {
      if (e?.errorFields) return;
      message.error('保存失败');
    }
  };

  const openBatchStatus = async (status: OrderStatus) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择订单');
      return;
    }
    try {
      const result = await orderApi.batchStatus(selectedRowKeys, status);
      setOperationResult(result);
      setResultModalOpen(true);
      setSelectedRowKeys([]);
      loadData(pagination.current, pagination.pageSize);
      loadStats();
    } catch {
      message.error('批量操作失败');
    }
  };

  const handleDelete = async (id: Guid) => {
    try {
      await orderApi.remove(id);
      message.success('删除成功');
      loadData(pagination.current, pagination.pageSize);
      loadStats();
    } catch {
      message.error('删除失败');
    }
  };

  const rowSelection: TableRowSelection<Order> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys as Guid[]),
  };

  const batchMenuItems = [
    {
      key: OrderStatus.Fulfilling,
      label: <Space><ClockCircleOutlined style={{ color: '#1677ff' }} /> 开始履约</Space>,
    },
    {
      key: OrderStatus.Fulfilled,
      label: <Space><CheckCircleOutlined style={{ color: '#52c41a' }} /> 标记已履约</Space>,
    },
    {
      key: OrderStatus.Overdue,
      label: <Space><WarningOutlined style={{ color: '#cf1322' }} /> 标记逾期</Space>,
    },
  ];

  const opColumns: ColumnsType<Order> = [
    ...columns,
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 180,
      render: (_, record) => (
        <Space>
          <Tooltip title="编辑">
            <Button size="small" icon={<EditOutlined />} onClick={() => openModal(record)}>
              编辑
            </Button>
          </Tooltip>
          <Popconfirm
            title="确定删除此订单？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="履约统计">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={8}>
              <Card size="small">
                <Statistic
                  title="总订单数"
                  value={stats?.totalOrders || 0}
                  prefix={<ShoppingOutlined style={{ color: '#1677ff' }} />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small">
                <Row align="middle" justify="space-between">
                  <Statistic
                    title="履约率"
                    value={stats?.fulfillmentRate || 0}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                  />
                  <Progress
                    type="dashboard"
                    percent={Math.round(stats?.fulfillmentRate || 0)}
                    size={60}
                    strokeColor="#52c41a"
                  />
                </Row>
              </Card>
            </Col>
            <Col xs={24} sm={8} md={8}>
              <Card size="small">
                <Statistic
                  title="逾期数"
                  value={stats?.overdueCount || 0}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<WarningOutlined />}
                />
              </Card>
            </Col>
          </Row>
        </Card>

        <Card title="筛选条件">
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="orderNumber" label="订单号">
                  <Input.Search placeholder="输入订单号" allowClear enterButton={<SearchOutlined />} onSearch={handleSearch} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="batchNumber" label="批次号">
                  <Input placeholder="输入批次号" allowClear />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Form.Item name="status" label="状态">
                  <Select placeholder="选择状态" allowClear>
                    {Object.values(OrderStatus).map((s) => (
                      <Option key={s} value={s}>{ORDER_STATUS_NAMES[s]}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={24} md={6}>
                <Form.Item label=" ">
                  <Space>
                    <RangePicker
                      style={{ width: '100%' }}
                      value={form.getFieldValue('dateRange') as any}
                      onChange={(v) => form.setFieldsValue({ dateRange: v })}
                    />
                  </Space>
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </Form>
        </Card>

        <Card
          title={
            <Space>
              <span>订单列表</span>
              {selectedRowKeys.length > 0 && (
                <Dropdown
                  menu={{
                    items: batchMenuItems,
                    onClick: ({ key }) => openBatchStatus(key as OrderStatus),
                  }}
                >
                  <Button type="primary">批量更新状态 ({selectedRowKeys.length}) ▼</Button>
                </Dropdown>
              )}
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                新增订单
              </Button>
            </Space>
          }
        >
          {orders.length === 0 ? (
            <Empty description="暂无订单数据" />
          ) : (
            <Table
              rowKey="id"
              columns={opColumns}
              dataSource={orders}
              rowSelection={rowSelection}
              scroll={{ x: 1400 }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (t) => `共 ${t} 条`,
                onChange: (page, pageSize) => {
                  setPagination((p) => ({ ...p, current: page, pageSize }));
                  loadData(page, pageSize);
                },
              }}
            />
          )}
        </Card>
      </Space>

      <Modal
        open={modalOpen}
        title={editingRecord ? '编辑订单' : '新增订单'}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        destroyOnClose={true}
        width={700}
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="orderNumber" label="订单号" rules={[{ required: true, message: '请输入订单号' }]}>
                <Input placeholder="如：SO2024001" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="customerName" label="客户名称" rules={[{ required: true, message: '请输入客户' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="harvestBatchId" label="关联批次" rules={[{ required: true, message: '请选择批次' }]}>
                <Select showSearch optionFilterProp="children">
                  {batches.map((b) => (
                    <Option key={b.id} value={b.id}>
                      {b.batchNumber} - {b.variety?.name} ({[b.plot?.greenhouseName, b.plot?.plotCode].filter(Boolean).join('-')})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="unitPrice" label="单价(¥)" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.01} prefix="¥" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="状态" rules={[{ required: true }]}>
                <Select>
                  {Object.values(OrderStatus).map((s) => (
                    <Option key={s} value={s}>{ORDER_STATUS_NAMES[s]}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="orderDate" label="下单日期" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="deliveryDate" label="交货日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="shippingAddress" label="收货地址">
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={2} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        open={resultModalOpen}
        title="批量操作结果摘要"
        onCancel={() => setResultModalOpen(false)}
        footer={[<Button key="ok" type="primary" onClick={() => setResultModalOpen(false)}>确定</Button>]}
        width={600}
      >
        {operationResult && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Row gutter={16}>
              <Col span={8}><Card size="small"><Statistic title="总数" value={operationResult.totalCount} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="成功" value={operationResult.successCount} valueStyle={{ color: '#52c41a' }} /></Card></Col>
              <Col span={8}><Card size="small"><Statistic title="失败" value={operationResult.failedCount} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
            </Row>
            {operationResult.summary && (
              <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                <strong>摘要：</strong>{operationResult.summary}
              </div>
            )}
            {operationResult.failedItems && operationResult.failedItems.length > 0 && (
              <Table
                rowKey="entityId"
                size="small"
                columns={[
                  { title: 'ID', dataIndex: 'entityId', key: 'entityId', ellipsis: true },
                  { title: '类型', dataIndex: 'entityType', key: 'entityType' },
                  { title: '错误信息', dataIndex: 'errorMessage', key: 'errorMessage', ellipsis: true },
                ]}
                dataSource={operationResult.failedItems as BatchOperationFailedItem[]}
                pagination={false}
              />
            )}
          </Space>
        )}
      </Modal>
    </Spin>
  );
}

import { Popconfirm } from 'antd';

export default Orders;
