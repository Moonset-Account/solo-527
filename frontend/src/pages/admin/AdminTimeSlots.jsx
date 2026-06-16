import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Modal,
  Form,
  Select,
  Input,
  InputNumber,
  DatePicker,
  Checkbox,
  Tag,
  message,
  Popconfirm,
  Typography,
  Row,
  Col,
} from 'antd';
import dayjs from 'dayjs';
import { counselorApi, timeSlotApi } from '../../services/api.js';

const { Title } = Typography;

const WEEKDAYS = [
  { label: '周一', value: 1 },
  { label: '周二', value: 2 },
  { label: '周三', value: 3 },
  { label: '周四', value: 4 },
  { label: '周五', value: 5 },
  { label: '周六', value: 6 },
  { label: '周日', value: 0 },
];

export default function AdminTimeSlots() {
  const [loading, setLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [counselors, setCounselors] = useState([]);
  const [filters, setFilters] = useState({ counselorId: null, startDate: dayjs().startOf('week'), endDate: dayjs().endOf('week') });
  const [singleModal, setSingleModal] = useState(false);
  const [batchModal, setBatchModal] = useState(false);
  const [singleForm] = Form.useForm();
  const [batchForm] = Form.useForm();

  useEffect(() => {
    loadCounselors();
  }, []);

  useEffect(() => {
    loadSlots();
  }, [filters]);

  const loadCounselors = async () => {
    try {
      const res = await counselorApi.list({ active: true });
      if (res.success) setCounselors(res.data);
    } catch (e) {
      message.error('加载咨询师列表失败');
    }
  };

  const loadSlots = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: filters.startDate.format('YYYY-MM-DD'),
        endDate: filters.endDate.format('YYYY-MM-DD'),
      };
      if (filters.counselorId) params.counselorId = filters.counselorId;
      const res = await timeSlotApi.list(params);
      if (res.success) setSlots(res.data);
    } catch (e) {
      message.error('加载时段失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSingle = async (values) => {
    try {
      const res = await timeSlotApi.create({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
      if (res.success) {
        message.success('创建成功');
        setSingleModal(false);
        singleForm.resetFields();
        loadSlots();
      }
    } catch (e) {
      message.error(e.message || '创建失败');
    }
  };

  const handleCreateBatch = async (values) => {
    try {
      const res = await timeSlotApi.createBatch({
        ...values,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        weekdays: values.weekdays || [],
      });
      if (res.success) {
        message.success(`批量创建成功，共生成 ${res.count} 个时段`);
        setBatchModal(false);
        batchForm.resetFields();
        loadSlots();
      }
    } catch (e) {
      message.error(e.message || '创建失败');
    }
  };

  const handleToggleActive = async (slot) => {
    try {
      const res = await timeSlotApi.update(slot.id, { isActive: !slot.isActive });
      if (res.success) {
        message.success('更新成功');
        loadSlots();
      }
    } catch (e) {
      message.error('更新失败');
    }
  };

  const handleUpdateCapacity = async (slot, capacity) => {
    try {
      const res = await timeSlotApi.update(slot.id, { capacity });
      if (res.success) {
        message.success('容量已更新');
        loadSlots();
      }
    } catch (e) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      render: (v) => dayjs(v).format('YYYY-MM-DD ddd'),
      width: 160,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
    },
    { title: '时段', dataIndex: 'startTime', render: (v, r) => `${v} - ${r.endTime}`, width: 140 },
    {
      title: '咨询师',
      dataIndex: ['counselor', 'name'],
      render: (v, r) => `${v}${r.counselor.title ? `（${r.counselor.title}）` : ''}`,
    },
    { title: '时长', dataIndex: 'duration', render: (v) => `${v}分钟`, width: 100 },
    {
      title: '容量/已约',
      dataIndex: 'capacity',
      render: (v, r) => (
        <Space>
          <InputNumber
            size="small"
            min={1}
            max={20}
            value={v}
            onChange={(val) => val && handleUpdateCapacity(r, val)}
            style={{ width: 70 }}
          />
          <span>/ {r.bookedCount}</span>
          <Tag color={r.available > 0 ? 'green' : 'orange'}>剩余 {r.available}</Tag>
        </Space>
      ),
      width: 220,
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      render: (v) => (v ? <Tag color="green">启用</Tag> : <Tag color="default">停用</Tag>),
      width: 100,
    },
    {
      title: '操作',
      width: 160,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => handleToggleActive(r)}>
            {r.isActive ? '停用' : '启用'}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={5} style={{ margin: 0 }}>筛选条件</Title>
          </Col>
          <Col>
            <Select
              placeholder="全部咨询师"
              style={{ width: 200 }}
              allowClear
              value={filters.counselorId}
              onChange={(v) => setFilters({ ...filters, counselorId: v })}
              options={counselors.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Col>
          <Col>
            <DatePicker.RangePicker
              value={[filters.startDate, filters.endDate]}
              onChange={(val) => val && setFilters({ ...filters, startDate: val[0], endDate: val[1] })}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button type="primary" onClick={() => setSingleModal(true)}>新增单个时段</Button>
              <Button onClick={() => setBatchModal(true)}>批量生成</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          loading={loading}
          dataSource={slots}
          rowKey="id"
          columns={columns}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title="新增时段"
        open={singleModal}
        onCancel={() => setSingleModal(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={singleForm} layout="vertical" onFinish={handleCreateSingle}>
          <Form.Item label="咨询师" name="counselorId" rules={[{ required: true }]}>
            <Select options={counselors.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="日期" name="date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
                <Select
                  options={Array.from({ length: 24 }, (_, i) => ({
                    value: `${String(i).padStart(2, '0')}:00`,
                    label: `${String(i).padStart(2, '0')}:00`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]}>
                <Select
                  options={Array.from({ length: 24 }, (_, i) => ({
                    value: `${String(i).padStart(2, '0')}:50`,
                    label: `${String(i).padStart(2, '0')}:50`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="服务时长（分钟）" name="duration" initialValue={50}>
                <InputNumber min={15} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="容纳人数" name="capacity" initialValue={1}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">创建</Button>
              <Button onClick={() => setSingleModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量生成时段"
        open={batchModal}
        onCancel={() => setBatchModal(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={batchForm} layout="vertical" onFinish={handleCreateBatch}>
          <Form.Item label="咨询师" name="counselorId" rules={[{ required: true }]}>
            <Select options={counselors.map((c) => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item label="日期范围" name="dateRange" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="选择星期" name="weekdays" valuePropName="checked">
            <Checkbox.Group options={WEEKDAYS} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
                <Select
                  options={Array.from({ length: 24 }, (_, i) => ({
                    value: `${String(i).padStart(2, '0')}:00`,
                    label: `${String(i).padStart(2, '0')}:00`,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]}>
                <Select
                  options={Array.from({ length: 24 }, (_, i) => ({
                    value: `${String(i).padStart(2, '0')}:50`,
                    label: `${String(i).padStart(2, '0')}:50`,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="服务时长（分钟）" name="duration" initialValue={50}>
                <InputNumber min={15} max={180} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="容纳人数" name="capacity" initialValue={1}>
                <InputNumber min={1} max={20} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">批量创建</Button>
              <Button onClick={() => setBatchModal(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
