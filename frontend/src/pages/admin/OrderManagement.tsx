import { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Input,
  Form,
  Modal,
  message,
  Drawer,
  Descriptions,
  List,
  Timeline,
  InputNumber,
  Row,
  Col,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  CalendarOutlined,
  PhoneOutlined,
  UserOutlined,
  DollarOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import { useOrderStore } from '@/store/orderStore';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  CONVERSION_STAGE_LABELS,
} from '@/utils';
import type { Order, OrderStatus, ConversionStage } from '@/types';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Search } = Input;

export default function OrderManagement() {
  const navigate = useNavigate();
  const { properties, rooms, fetchProperties, fetchRooms } = useAppStore();
  const { orders, fetchOrders, updateOrderStatus, updateConversionStage, addPayment, isLoading } =
    useOrderStore();

  const [filters, setFilters] = useState({
    status: undefined as OrderStatus | undefined,
    conversion_stage: undefined as ConversionStage | undefined,
    property_id: undefined as string | undefined,
    search: '',
    date_range: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [createForm] = Form.useForm();
  const [statusForm] = Form.useForm();
  const [stageForm] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    fetchProperties();
    fetchRooms();
  }, [fetchProperties, fetchRooms]);

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = () => {
    const params: Record<string, unknown> = {};
    if (filters.status) params.status = filters.status;
    if (filters.conversion_stage) params.conversion_stage = filters.conversion_stage;
    if (filters.property_id) params.property_id = filters.property_id;
    if (filters.search) params.search = filters.search;
    if (filters.date_range) {
      params.start_date = filters.date_range[0].format('YYYY-MM-DD');
      params.end_date = filters.date_range[1].format('YYYY-MM-DD');
    }
    fetchOrders(params);
  };

  const handleUpdateStatus = async (values: { status: OrderStatus; remarks?: string }) => {
    if (!selectedOrder) return;
    try {
      await updateOrderStatus(selectedOrder.id, values.status, values.remarks);
      message.success('订单状态已更新');
      setShowStatusModal(false);
      statusForm.resetFields();
      loadOrders();
    } catch {
      message.error('更新失败');
    }
  };

  const handleUpdateStage = async (values: { stage: ConversionStage; remarks?: string }) => {
    if (!selectedOrder) return;
    try {
      await updateConversionStage(selectedOrder.id, values.stage, values.remarks);
      message.success('转化阶段已更新');
      setShowStageModal(false);
      stageForm.resetFields();
      loadOrders();
    } catch {
      message.error('更新失败');
    }
  };

  const handleAddPayment = async (values: {
    amount: number;
    method: string;
    transaction_no?: string;
    remarks?: string;
  }) => {
    if (!selectedOrder) return;
    try {
      await addPayment(selectedOrder.id, values);
      message.success('支付记录已添加');
      setShowPaymentModal(false);
      paymentForm.resetFields();
      loadOrders();
    } catch {
      message.error('添加失败');
    }
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      key: 'order_no',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: '入住人',
      key: 'guest',
      render: (_: unknown, record: Order) => (
        <div>
          <div className="font-medium">{record.guest_name}</div>
          <div className="text-sm text-gray-500">{record.guest_phone}</div>
        </div>
      ),
    },
    {
      title: '房型',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: '入住日期',
      key: 'dates',
      render: (_: unknown, record: Order) => (
        <div>
          <div className="text-sm">
            {formatDate(record.check_in_date)} - {formatDate(record.check_out_date)}
          </div>
          <div className="text-xs text-gray-500">{record.nights} 晚 · 成人 {record.adults} 人，儿童 {record.children} 人</div>
        </div>
      ),
    },
    {
      title: '金额',
      key: 'amount',
      render: (_: unknown, record: Order) => (
        <div className="text-right">
          <div className="font-bold text-primary-600">{formatCurrency(record.total_amount)}</div>
          <div className="text-xs text-gray-500">
            已付: {formatCurrency(record.payments.reduce((sum, p) => sum + p.amount, 0))}
          </div>
        </div>
      ),
    },
    {
      title: '订单状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: OrderStatus) => (
        <Tag className={ORDER_STATUS_COLORS[status]}>{ORDER_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '转化阶段',
      dataIndex: 'conversion_stage',
      key: 'conversion_stage',
      render: (stage: ConversionStage) => (
        <Tag color="blue">{CONVERSION_STAGE_LABELS[stage]}</Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: unknown, record: Order) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setShowDetailDrawer(true);
            }}
          >
            详情
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              statusForm.setFieldsValue({ status: record.status });
              setShowStatusModal(true);
            }}
          >
            状态
          </Button>
          <Button
            type="link"
            icon={<HistoryOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              stageForm.setFieldsValue({ stage: record.conversion_stage });
              setShowStageModal(true);
            }}
          >
            转化
          </Button>
          <Button
            type="link"
            icon={<DollarOutlined />}
            onClick={() => {
              setSelectedOrder(record);
              setShowPaymentModal(true);
            }}
          >
            收款
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">订单管理</h1>
        <Space>
          <Button onClick={() => navigate('/admin/orders/conversion')}>
            转化漏斗
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
            新建订单
          </Button>
        </Space>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="订单状态"
              className="w-full"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="转化阶段"
              className="w-full"
              allowClear
              value={filters.conversion_stage}
              onChange={(value) => setFilters({ ...filters, conversion_stage: value })}
            >
              {Object.entries(CONVERSION_STAGE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="选择民宿"
              className="w-full"
              allowClear
              value={filters.property_id}
              onChange={(value) => setFilters({ ...filters, property_id: value })}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="搜索订单号/姓名/电话"
              allowClear
              onSearch={(value) => setFilters({ ...filters, search: value })}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24}>
            <RangePicker
              className="w-full"
              value={filters.date_range}
              onChange={(dates) =>
                setFilters({ ...filters, date_range: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined })
              }
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条订单`,
          }}
        />
      </Card>

      <Drawer
        title="订单详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={720}
      >
        {selectedOrder && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="订单号" span={2}>
            {selectedOrder.order_no}
          </Descriptions.Item>
              <Descriptions.Item label="订单状态">
                <Tag className={ORDER_STATUS_COLORS[selectedOrder.status]}>
                  {ORDER_STATUS_LABELS[selectedOrder.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="转化阶段">
                <Tag color="blue">{CONVERSION_STAGE_LABELS[selectedOrder.conversion_stage]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="入住人">
                <Space>
                  <UserOutlined />
                  {selectedOrder.guest_name}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space>
                  <PhoneOutlined />
                  {selectedOrder.guest_phone}
                </Space>
              </Descriptions.Item>
              {selectedOrder.guest_email && (
                <Descriptions.Item label="邮箱" span={2}>
                  {selectedOrder.guest_email}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="入住日期" span={2}>
            <Space>
              <CalendarOutlined />
              {formatDate(selectedOrder.check_in_date)} - {formatDate(selectedOrder.check_out_date)}
              <Tag color="blue">{selectedOrder.nights} 晚</Tag>
              <Tag color="green">成人 {selectedOrder.adults} 人，儿童 {selectedOrder.children} 人</Tag>
            </Space>
          </Descriptions.Item>
              <Descriptions.Item label="房型" span={2}>
                {selectedOrder.room_name}
              </Descriptions.Item>
              {selectedOrder.guest_remarks && (
                <Descriptions.Item label="特殊要求" span={2}>
                  {selectedOrder.guest_remarks}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="订单金额" span={2}>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">房费总额</span>
                    <span>{formatCurrency(selectedOrder.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">已付</span>
                    <span className="text-green-600">{formatCurrency(selectedOrder.paid_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">待付</span>
                    <span className="text-orange-600">{formatCurrency(selectedOrder.remaining_amount)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>总计</span>
                    <span className="text-primary-600">
                      {formatCurrency(selectedOrder.total_amount)}
                    </span>
                  </div>
                </div>
              </Descriptions.Item>
            </Descriptions>

            <Card title="支付记录" size="small">
              <List
                dataSource={selectedOrder.payments}
                renderItem={(payment) => (
                  <List.Item key={payment.id}>
                    <List.Item.Meta
                      title={
                        <div className="flex justify-between w-full">
                          <span className="font-medium">
                            {formatCurrency(payment.amount)} - {payment.method_display || payment.method}
                          </span>
                        </div>
                      }
                      description={
                        <div className="text-sm text-gray-500">
                          {payment.transaction_no && `交易号: ${payment.transaction_no}`}
                          {payment.paid_at && ` · 支付时间: ${formatDateTime(payment.paid_at)}`}
                        </div>
                      }
                    />
                  </List.Item>
                )}
                locale={{ emptyText: '暂无支付记录' }}
              />
            </Card>

            <Card title="订单动态" size="small">
              <Timeline
                items={selectedOrder.timeline.map((item) => ({
                  color: 'green',
                  children: (
                    <div>
                      <div className="font-medium">{item.action}</div>
                      <div className="text-sm text-gray-600">{item.description}</div>
                      <div className="text-xs text-gray-400">{formatDateTime(item.created_at)}</div>
                    </div>
                  ),
                }))}
              />
            </Card>

            <div className="flex justify-end gap-3">
              <Button
                onClick={() => {
                  statusForm.setFieldsValue({ status: selectedOrder.status });
                  setShowStatusModal(true);
                }}
              >
                更新状态
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  setShowPaymentModal(true);
                }}
              >
                登记收款
              </Button>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="更新订单状态"
        open={showStatusModal}
        onCancel={() => setShowStatusModal(false)}
        footer={null}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item
            name="status"
            label="订单状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowStatusModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="更新转化阶段"
        open={showStageModal}
        onCancel={() => setShowStageModal(false)}
        footer={null}
      >
        <Form form={stageForm} layout="vertical" onFinish={handleUpdateStage}>
          <Form.Item
            name="stage"
            label="转化阶段"
            rules={[{ required: true, message: '请选择阶段' }]}
          >
            <Select>
              {Object.entries(CONVERSION_STAGE_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowStageModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="登记收款"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleAddPayment}>
          <Form.Item
            name="amount"
            label="收款金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber className="w-full" min={0} prefix="¥" />
          </Form.Item>
          <Form.Item
            name="method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
          >
            <Select>
              <Option value="cash">现金</Option>
              <Option value="wechat">微信支付</Option>
              <Option value="alipay">支付宝</Option>
              <Option value="card">银行卡</Option>
              <Option value="transfer">银行转账</Option>
            </Select>
          </Form.Item>
          <Form.Item name="transaction_no" label="交易单号">
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="选填" />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowPaymentModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确认收款</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="新建订单"
        open={showCreateModal}
        onCancel={() => setShowCreateModal(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const [checkIn, checkOut] = values.check_in_date as [dayjs.Dayjs, dayjs.Dayjs];

              await useOrderStore.getState().createOrder({
                room_id: values.room_id,
                check_in_date: checkIn.format('YYYY-MM-DD'),
                check_out_date: checkOut.format('YYYY-MM-DD'),
                guest_name: values.guest_name,
                guest_phone: values.guest_phone,
                guest_email: values.guest_email,
                adults: values.adults,
                children: values.children,
                guest_remarks: values.guest_remarks,
              });
              message.success('订单创建成功');
              setShowCreateModal(false);
              createForm.resetFields();
              loadOrders();
            } catch {
              message.error('创建失败');
            }
          }}
        >
          <Form.Item
            name="room_id"
            label="选择房型"
            rules={[{ required: true, message: '请选择房型' }]}
          >
            <Select>
              {rooms.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} - {formatCurrency(r.base_price)}/晚
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name={['check_in_date', 'check_out_date']}
            label="入住日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <RangePicker className="w-full" minDate={dayjs()} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="guest_name"
                label="入住人姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="adults"
                label="成人人数"
                rules={[{ required: true, message: '请输入人数' }]}
              >
                <InputNumber className="w-full" min={1} max={10} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="children"
                label="儿童人数"
                rules={[{ required: true, message: '请输入人数' }]}
              >
                <InputNumber className="w-full" min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guest_phone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="guest_email"
            label="邮箱"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="guest_remarks"
            label="特殊要求"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setShowCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建订单</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
