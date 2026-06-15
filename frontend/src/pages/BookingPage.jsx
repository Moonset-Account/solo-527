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
  DatePicker,
  TimePicker,
  Space,
  message,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  LoginOutlined,
  FlagOutlined,
  StopOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { request } from '../api/client';
import { BOOKINGS, AUTH, SERVICES } from '../api/endpoints';
import {
  BOOKING_TYPE_OPTIONS,
  BOOKING_STATUS_OPTIONS,
  BOOKING_TYPE,
  BOOKING_STATUS,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatDate } from '../utils/format';
import dayjs from 'dayjs';

const BookingPage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState(undefined);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [dateRange, setDateRange] = useState(null);
  const [form] = Form.useForm();
  const bookingType = Form.useWatch('booking_type', form);

  const { data: bookingsData, isLoading } = useQuery({
    queryKey: ['bookings', typeFilter, statusFilter, dateRange],
    queryFn: () => {
      const params = {};
      if (typeFilter) params.booking_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (dateRange?.[0]) params.booking_date_after = dateRange[0];
      if (dateRange?.[1]) params.booking_date_before = dateRange[1];
      return request.get(BOOKINGS.BOOKINGS, params);
    },
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-list'],
    queryFn: () => request.get(AUTH.MEMBER_PROFILES),
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-list'],
    queryFn: () => request.get(AUTH.VEHICLES),
  });

  const { data: servicesData } = useQuery({
    queryKey: ['service-items-list'],
    queryFn: () => request.get(SERVICES.ITEMS),
  });

  const { data: slotsData } = useQuery({
    queryKey: ['test-drive-slots'],
    queryFn: () => request.get(SERVICES.TEST_DRIVE_SLOTS),
  });

  const bookings = bookingsData?.results || bookingsData || [];
  const members = membersData?.results || membersData || [];
  const vehicles = vehiclesData?.results || vehiclesData || [];
  const services = servicesData?.results || servicesData || [];
  const slots = slotsData?.results || slotsData || [];

  const createMutation = useMutation({
    mutationFn: (values) => request.post(BOOKINGS.BOOKINGS, values),
    onSuccess: () => {
      message.success('预约创建成功');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) =>
      request.patch(BOOKINGS.BOOKING_DETAIL(id), data),
    onSuccess: () => {
      message.success('操作成功');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (data) => request.post(BOOKINGS.REMINDERS, data),
    onSuccess: () => {
      message.success('提醒已发送');
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    form.resetFields();
  };

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const order_no = `BK${dayjs().format('YYYYMMDDHHmmss')}${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`;
      createMutation.mutate({
        ...values,
        order_no,
        booking_date: values.booking_date?.format('YYYY-MM-DD'),
        booking_time: values.booking_time?.format('HH:mm'),
      });
    } catch {}
  };

  const getActionButtons = (record) => {
    const { status, id } = record;
    const buttons = [];

    if (status === BOOKING_STATUS.PENDING) {
      buttons.push(
        <Popconfirm
          key="confirm"
          title="确认该预约？"
          onConfirm={() =>
            updateMutation.mutate({ id, status: BOOKING_STATUS.CONFIRMED })
          }
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" type="primary" icon={<CheckOutlined />}>
            确认
          </Button>
        </Popconfirm>
      );
    }

    if (status === BOOKING_STATUS.CONFIRMED) {
      buttons.push(
        <Button
          key="checkin"
          size="small"
          type="primary"
          icon={<LoginOutlined />}
          onClick={() =>
            updateMutation.mutate({
              id,
              check_in_time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            })
          }
        >
          签到
        </Button>,
        <Popconfirm
          key="complete"
          title="确认完成该预约？"
          onConfirm={() =>
            updateMutation.mutate({ id, status: BOOKING_STATUS.COMPLETED })
          }
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" icon={<FlagOutlined />}>
            完成
          </Button>
        </Popconfirm>,
        <Popconfirm
          key="noshow"
          title="标记为未到店？"
          onConfirm={() =>
            updateMutation.mutate({ id, status: BOOKING_STATUS.NO_SHOW })
          }
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" danger icon={<StopOutlined />}>
            未到店
          </Button>
        </Popconfirm>
      );
    }

    if (
      status === BOOKING_STATUS.PENDING ||
      status === BOOKING_STATUS.CONFIRMED
    ) {
      buttons.push(
        <Popconfirm
          key="cancel"
          title="确认取消该预约？"
          onConfirm={() =>
            updateMutation.mutate({ id, status: BOOKING_STATUS.CANCELLED })
          }
          okText="确认"
          cancelText="取消"
        >
          <Button size="small" danger icon={<CloseOutlined />}>
            取消
          </Button>
        </Popconfirm>,
        <Button
          key="reminder"
          size="small"
          icon={<BellOutlined />}
          onClick={() => reminderMutation.mutate({ booking: id })}
        >
          提醒
        </Button>
      );
    }

    return buttons;
  };

  const columns = [
    {
      title: '预约单号',
      dataIndex: 'order_no',
      key: 'order_no',
    },
    {
      title: '预约类型',
      dataIndex: 'booking_type',
      key: 'booking_type',
      render: (v) => (
        <Tag color={getColorByValue(BOOKING_TYPE_OPTIONS, v)}>
          {getLabelByValue(BOOKING_TYPE_OPTIONS, v)}
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
      title: '联系人',
      dataIndex: 'contact_name',
      key: 'contact_name',
    },
    {
      title: '联系电话',
      dataIndex: 'contact_phone',
      key: 'contact_phone',
    },
    {
      title: '服务项目',
      dataIndex: 'service_item',
      key: 'service_item',
      render: (v) => v?.name || '-',
    },
    {
      title: '预约日期',
      dataIndex: 'booking_date',
      key: 'booking_date',
      render: (v) => formatDate(v),
    },
    {
      title: '预约时间',
      dataIndex: 'booking_time',
      key: 'booking_time',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={getColorByValue(BOOKING_STATUS_OPTIONS, v)}>
          {getLabelByValue(BOOKING_STATUS_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '指派员工',
      dataIndex: 'assigned_staff',
      key: 'assigned_staff',
      render: (v) => v?.name || '-',
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
        <div className="page-title">预约管理</div>
        <div className="page-description">管理客户预约信息</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="预约类型"
            allowClear
            style={{ width: 150 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={BOOKING_TYPE_OPTIONS}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={BOOKING_STATUS_OPTIONS}
          />
          <DatePicker.RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
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
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalOpen(true)}
          >
            新建预约
          </Button>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={bookings}
          loading={isLoading}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title="新建预约"
        open={modalOpen}
        onOk={handleCreate}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending}
        destroyOnClose
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          preserve={false}
          initialValues={{ booking_type: BOOKING_TYPE.SERVICE }}
        >
          <Form.Item
            name="booking_type"
            label="预约类型"
            rules={[{ required: true, message: '请选择预约类型' }]}
          >
            <Select options={BOOKING_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="member" label="会员">
            <Select
              showSearch
              placeholder="搜索会员"
              filterOption={(input, option) =>
                (option?.label ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              options={members.map((m) => ({
                value: m.id,
                label: m.name || m.user?.username || String(m.id),
              }))}
            />
          </Form.Item>
          {bookingType !== BOOKING_TYPE.MEMBERSHIP && (
            <Form.Item name="vehicle" label="车辆">
              <Select
                showSearch
                placeholder="选择车辆"
                filterOption={(input, option) =>
                  (option?.label ?? '')
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
                options={vehicles.map((v) => ({
                  value: v.id,
                  label: v.plate_number || String(v.id),
                }))}
              />
            </Form.Item>
          )}
          <Form.Item name="service_item" label="服务项目">
            <Select
              placeholder="选择服务项目"
              options={services.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
            />
          </Form.Item>
          {bookingType === BOOKING_TYPE.TEST_DRIVE && (
            <Form.Item name="test_drive_slot" label="试驾时段">
              <Select
                placeholder="选择试驾时段"
                options={slots.map((s) => ({
                  value: s.id,
                  label: `${s.date || ''} ${s.start_time || ''}-${s.end_time || ''}`,
                }))}
              />
            </Form.Item>
          )}
          <Form.Item
            name="booking_date"
            label="预约日期"
            rules={[{ required: true, message: '请选择预约日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="booking_time"
            label="预约时间"
            rules={[{ required: true, message: '请选择预约时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="contact_name"
            label="联系人"
            rules={[{ required: true, message: '请输入联系人' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contact_phone"
            label="联系电话"
            rules={[{ required: true, message: '请输入联系电话' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookingPage;
