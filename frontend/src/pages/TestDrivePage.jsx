import { useState, useMemo } from 'react';
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
  Space,
  message,
  Popconfirm,
  DatePicker,
  TimePicker,
  Alert,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { request } from '../api/client';
import { SERVICES } from '../api/endpoints';
import {
  TEST_DRIVE_SLOT_STATUS_OPTIONS,
  SERVICE_TYPE,
  getColorByValue,
  getLabelByValue,
} from '../utils/constants';
import { formatDate, formatTimeRange } from '../utils/format';

const generateTimeSlots = (startTime, endTime) => {
  const slots = [];
  let current = dayjs(startTime, 'HH:mm');
  const end = dayjs(endTime, 'HH:mm');
  while (current.isBefore(end)) {
    const next = current.add(30, 'minute');
    if (next.isAfter(end)) break;
    slots.push({
      start_time: current.format('HH:mm'),
      end_time: next.format('HH:mm'),
    });
    current = next;
  }
  return slots;
};

const generateDatesInRange = (startDate, endDate) => {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);
  while (current.isBefore(end) || current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }
  return dates;
};

const TestDrivePage = () => {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [batchCreateOpen, setBatchCreateOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [vehicleModelFilter, setVehicleModelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [batchStatusOpen, setBatchStatusOpen] = useState(false);
  const [batchStatusValue, setBatchStatusValue] = useState(undefined);
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  const { data: slotsData, isLoading } = useQuery({
    queryKey: ['test-drive-slots', dateRange, vehicleModelFilter, statusFilter],
    queryFn: () => {
      const params = {};
      if (dateRange?.[0]) params.date_after = dateRange[0];
      if (dateRange?.[1]) params.date_before = dateRange[1];
      if (vehicleModelFilter) params.vehicle_model = vehicleModelFilter;
      if (statusFilter) params.status = statusFilter;
      return request.get(SERVICES.TEST_DRIVE_SLOTS, params);
    },
  });

  const { data: serviceItemsData } = useQuery({
    queryKey: ['service-items-test-drive'],
    queryFn: () => request.get(SERVICES.ITEMS, { service_type: SERVICE_TYPE.TEST_DRIVE }),
  });

  const slots = slotsData?.results || slotsData || [];
  const serviceItems = serviceItemsData?.results || serviceItemsData || [];

  const serviceItemOptions = serviceItems.map((s) => ({
    value: s.id,
    label: s.name,
  }));

  const createMutation = useMutation({
    mutationFn: (values) => request.post(SERVICES.TEST_DRIVE_SLOTS, values),
    onSuccess: () => {
      message.success('创建成功');
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...values }) =>
      request.patch(SERVICES.TEST_DRIVE_SLOT_DETAIL(id), values),
    onSuccess: () => {
      message.success('更新成功');
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => request.delete(SERVICES.TEST_DRIVE_SLOT_DETAIL(id)),
    onSuccess: () => {
      message.success('删除成功');
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
    },
  });

  const batchCreateMutation = useMutation({
    mutationFn: (slotsList) =>
      Promise.all(slotsList.map((slot) => request.post(SERVICES.TEST_DRIVE_SLOTS, slot))),
    onSuccess: (_, variables) => {
      message.success(`成功创建 ${variables.length} 个时段`);
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
      closeBatchCreateModal();
    },
  });

  const batchStatusMutation = useMutation({
    mutationFn: ({ ids, status }) =>
      Promise.all(ids.map((id) => request.patch(SERVICES.TEST_DRIVE_SLOT_DETAIL(id), { status }))),
    onSuccess: () => {
      message.success('批量更新状态成功');
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
      setSelectedRowKeys([]);
      setBatchStatusOpen(false);
      setBatchStatusValue(undefined);
    },
  });

  const batchDeleteMutation = useMutation({
    mutationFn: (ids) =>
      Promise.all(ids.map((id) => request.delete(SERVICES.TEST_DRIVE_SLOT_DETAIL(id)))),
    onSuccess: () => {
      message.success('批量删除成功');
      queryClient.invalidateQueries({ queryKey: ['test-drive-slots'] });
      setSelectedRowKeys([]);
    },
  });

  const openCreateModal = () => {
    setEditingSlot(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (record) => {
    setEditingSlot(record);
    form.setFieldsValue({
      service_item_id: record.service_item_id || record.service_item,
      date: record.date ? dayjs(record.date) : undefined,
      start_time: record.start_time ? dayjs(record.start_time, 'HH:mm') : undefined,
      end_time: record.end_time ? dayjs(record.end_time, 'HH:mm') : undefined,
      vehicle_model: record.vehicle_model,
      location: record.location,
      max_bookings: record.max_bookings,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingSlot(null);
    form.resetFields();
  };

  const openBatchCreateModal = () => {
    batchForm.resetFields();
    setBatchCreateOpen(true);
  };

  const closeBatchCreateModal = () => {
    setBatchCreateOpen(false);
    batchForm.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        date: values.date?.format('YYYY-MM-DD'),
        start_time: values.start_time?.format('HH:mm'),
        end_time: values.end_time?.format('HH:mm'),
      };
      if (editingSlot) {
        updateMutation.mutate({ id: editingSlot.id, ...payload });
      } else {
        createMutation.mutate(payload);
      }
    } catch {}
  };

  const handleBatchCreate = async () => {
    try {
      const values = await batchForm.validateFields();
      const dates = generateDatesInRange(
        values.date_range[0].format('YYYY-MM-DD'),
        values.date_range[1].format('YYYY-MM-DD')
      );
      const timeSlots = generateTimeSlots(
        values.start_time.format('HH:mm'),
        values.end_time.format('HH:mm')
      );
      const slotsList = [];
      dates.forEach((date) => {
        timeSlots.forEach((slot) => {
          slotsList.push({
            service_item_id: values.service_item_id,
            date,
            start_time: slot.start_time,
            end_time: slot.end_time,
            vehicle_model: values.vehicle_model,
            location: values.location,
            max_bookings: values.max_bookings,
          });
        });
      });
      batchCreateMutation.mutate(slotsList);
    } catch {}
  };

  const batchDateRange = Form.useWatch('date_range', batchForm);
  const batchStartTime = Form.useWatch('start_time', batchForm);
  const batchEndTime = Form.useWatch('end_time', batchForm);

  const batchPreview = useMemo(() => {
    if (!batchDateRange || !batchStartTime || !batchEndTime) return 0;
    const dates = generateDatesInRange(
      batchDateRange[0].format('YYYY-MM-DD'),
      batchDateRange[1].format('YYYY-MM-DD')
    );
    const timeSlots = generateTimeSlots(
      batchStartTime.format('HH:mm'),
      batchEndTime.format('HH:mm')
    );
    return dates.length * timeSlots.length;
  }, [batchDateRange, batchStartTime, batchEndTime]);

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      render: (v) => formatDate(v),
    },
    {
      title: '时间段',
      key: 'time_range',
      render: (_, record) => formatTimeRange(record.start_time, record.end_time),
    },
    {
      title: '车型',
      dataIndex: 'vehicle_model',
      key: 'vehicle_model',
    },
    {
      title: '地点',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '最大预约数',
      dataIndex: 'max_bookings',
      key: 'max_bookings',
    },
    {
      title: '当前预约数',
      dataIndex: 'current_bookings',
      key: 'current_bookings',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={getColorByValue(TEST_DRIVE_SLOT_STATUS_OPTIONS, v)}>
          {getLabelByValue(TEST_DRIVE_SLOT_STATUS_OPTIONS, v)}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
          />
          <Popconfirm
            title="确认删除该时段？"
            onConfirm={() => deleteMutation.mutate(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">试驾时段</div>
        <div className="page-description">管理试驾时段预约</div>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <DatePicker.RangePicker
            value={dateRange ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
            onChange={(dates) =>
              setDateRange(
                dates
                  ? [dates[0]?.format('YYYY-MM-DD'), dates[1]?.format('YYYY-MM-DD')]
                  : null
              )
            }
          />
          <Input.Search
            placeholder="搜索车型"
            allowClear
            style={{ width: 180 }}
            onSearch={setVehicleModelFilter}
            onChange={(e) => {
              if (!e.target.value) setVehicleModelFilter('');
            }}
          />
          <Select
            placeholder="状态"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={TEST_DRIVE_SLOT_STATUS_OPTIONS}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新建时段
          </Button>
          <Button
            icon={<ScheduleOutlined />}
            onClick={openBatchCreateModal}
          >
            批量创建
          </Button>
        </Space>
      </Card>

      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>已选择 {selectedRowKeys.length} 项</span>
            <Button
              size="small"
              onClick={() => {
                setBatchStatusOpen(true);
              }}
            >
              批量更新状态
            </Button>
            <Popconfirm
              title={`确认删除选中的 ${selectedRowKeys.length} 个时段？`}
              onConfirm={() => batchDeleteMutation.mutate(selectedRowKeys)}
              okText="确认"
              cancelText="取消"
            >
              <Button size="small" danger loading={batchDeleteMutation.isPending}>
                批量删除
              </Button>
            </Popconfirm>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>
              取消选择
            </Button>
          </Space>
        </Card>
      )}

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={slots}
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </Card>

      <Modal
        title={editingSlot ? '编辑时段' : '新建时段'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            name="service_item_id"
            label="试驾服务"
            rules={[{ required: true, message: '请选择试驾服务' }]}
          >
            <Select placeholder="请选择试驾服务" options={serviceItemOptions} />
          </Form.Item>
          <Form.Item
            name="date"
            label="日期"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="start_time"
            label="开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_time"
            label="结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vehicle_model" label="车型">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Form.Item name="max_bookings" label="最大预约数" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量创建时段"
        open={batchCreateOpen}
        onOk={handleBatchCreate}
        onCancel={closeBatchCreateModal}
        confirmLoading={batchCreateMutation.isPending}
        destroyOnClose
        width={600}
      >
        <Form form={batchForm} layout="vertical" preserve={false}>
          <Form.Item
            name="service_item_id"
            label="试驾服务"
            rules={[{ required: true, message: '请选择试驾服务' }]}
          >
            <Select placeholder="请选择试驾服务" options={serviceItemOptions} />
          </Form.Item>
          <Form.Item
            name="date_range"
            label="日期范围"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="start_time"
            label="每日开始时间"
            rules={[{ required: true, message: '请选择开始时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="end_time"
            label="每日结束时间"
            rules={[{ required: true, message: '请选择结束时间' }]}
          >
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="vehicle_model" label="车型">
            <Input />
          </Form.Item>
          <Form.Item name="location" label="地点">
            <Input />
          </Form.Item>
          <Form.Item name="max_bookings" label="每时段最大预约数" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
        {batchPreview > 0 && (
          <Alert
            message={`将创建 ${batchPreview} 个试驾时段`}
            type="info"
            showIcon
            style={{ marginTop: 8 }}
          />
        )}
      </Modal>

      <Modal
        title="批量更新状态"
        open={batchStatusOpen}
        onOk={() => {
          if (!batchStatusValue) {
            message.warning('请选择新状态');
            return;
          }
          batchStatusMutation.mutate({ ids: selectedRowKeys, status: batchStatusValue });
        }}
        onCancel={() => {
          setBatchStatusOpen(false);
          setBatchStatusValue(undefined);
        }}
        confirmLoading={batchStatusMutation.isPending}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          将更新 {selectedRowKeys.length} 个时段的状态
        </div>
        <Select
          placeholder="选择新状态"
          style={{ width: '100%' }}
          value={batchStatusValue}
          onChange={setBatchStatusValue}
          options={TEST_DRIVE_SLOT_STATUS_OPTIONS}
        />
      </Modal>
    </div>
  );
};

export default TestDrivePage;
