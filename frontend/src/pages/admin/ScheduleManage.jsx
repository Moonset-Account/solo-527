import { useEffect, useState } from 'react';
import {
  Table,
  Card,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  DatePicker,
  TimePicker,
  Select,
  Input,
  message,
  Drawer,
  Descriptions,
  Row,
  Col,
  Calendar,
  Badge,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { schedulesApi, counselorApi } from '../../api';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const statusMap = {
  available: { text: '可预约', color: 'green' },
  booked: { text: '已约', color: 'blue' },
  unavailable: { text: '不可用', color: 'default' },
};

function ScheduleManage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [filters, setFilters] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [counselors, setCounselors] = useState([]);
  const [selectedCounselor, setSelectedCounselor] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();

  useEffect(() => {
    loadData();
    loadCounselors();
  }, [pagination.current, pagination.pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await schedulesApi.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      });
      setData(result.items);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('加载排班失败', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCounselors = async () => {
    try {
      const result = await counselorApi.getList({ page: 1, pageSize: 100 });
      setCounselors(result.items);
    } catch (error) {
      console.error('加载咨询师失败', error);
    }
  };

  const handleSearch = (values) => {
    setFilters(prev => ({ ...prev, ...values }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleReset = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleAdd = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ status: 'available' });
    setModalVisible(true);
  };

  const handleBatchAdd = () => {
    batchForm.resetFields();
    batchForm.setFieldsValue({ status: 'available' });
    setBatchModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      date: dayjs(record.date),
      startTime: dayjs(record.startTime, 'HH:mm'),
      endTime: dayjs(record.endTime, 'HH:mm'),
    });
    setModalVisible(true);
  };

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除？',
      content: '删除后该排班将不再可用，确定要删除吗？',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await schedulesApi.remove(record.id);
          message.success('已删除');
          loadData();
        } catch (error) {
          message.error('删除失败');
        }
      },
    });
  };

  const handleViewDetail = async (record) => {
    try {
      const detail = await schedulesApi.getDetail(record.id);
      setCurrentRecord(detail);
      setDetailVisible(true);
    } catch (error) {
      message.error('加载详情失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const submitData = {
        ...values,
        date: values.date.format('YYYY-MM-DD'),
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      };
      if (editingRecord) {
        await schedulesApi.update(editingRecord.id, submitData);
        message.success('更新成功');
      } else {
        await schedulesApi.create(submitData);
        message.success('创建成功');
      }
      setModalVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const handleBatchSubmit = async () => {
    try {
      const values = await batchForm.validateFields();
      const dates = values.dates.map(d => d.format('YYYY-MM-DD'));
      await schedulesApi.batchCreate({
        counselorId: values.counselorId,
        dates,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
        status: values.status,
      });
      message.success('批量创建成功');
      setBatchModalVisible(false);
      loadData();
    } catch (error) {
      if (error.errorFields) return;
      message.error('操作失败');
    }
  };

  const getListData = (value) => {
    if (!selectedCounselor) return [];
    const dateStr = value.format('YYYY-MM-DD');
    const dayData = data.filter(item => item.date === dateStr);
    return dayData.map(item => ({
      type: item.status === 'available' ? 'success' : item.status === 'booked' ? 'warning' : 'default',
      content: `${item.startTime}-${item.endTime}`,
    }));
  };

  const columns = [
    {
      title: '咨询师',
      dataIndex: ['counselor', 'name'],
      key: 'counselor',
      width: 120,
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      width: 100,
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '备注',
      dataIndex: 'remarks',
      key: 'remarks',
      ellipsis: true,
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="排班管理"
        extra={
          <Space>
            <Button.Group>
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                onClick={() => setViewMode('list')}
              >
                列表视图
              </Button>
              <Button
                type={viewMode === 'calendar' ? 'primary' : 'default'}
                icon={<CalendarOutlined />}
                onClick={() => setViewMode('calendar')}
              >
                日历视图
              </Button>
            </Button.Group>
            <Button onClick={handleBatchAdd}>批量排班</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增排班
            </Button>
          </Space>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <Space wrap>
            <Select
              placeholder="选择咨询师"
              allowClear
              style={{ width: 180 }}
              value={filters.counselorId || undefined}
              onChange={(value) => {
                setSelectedCounselor(value);
                handleSearch({ counselorId: value });
              }}
            >
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 120 }}
              onChange={(value) => handleSearch({ status: value })}
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <Option key={key} value={key}>{value.text}</Option>
              ))}
            </Select>
            <RangePicker
              onChange={(dates) => handleSearch({
                startDate: dates?.[0]?.format('YYYY-MM-DD'),
                endDate: dates?.[1]?.format('YYYY-MM-DD'),
              })}
              allowEmpty={[true, true]}
            />
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </div>

        {viewMode === 'list' ? (
          <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 条`,
              onChange: (page, pageSize) => setPagination(prev => ({ ...prev, current: page, pageSize })),
            }}
          />
        ) : (
          <div style={{ background: '#fff', padding: 24, borderRadius: 8 }}>
            <Select
              placeholder="选择咨询师查看排班"
              style={{ width: 200, marginBottom: 16 }}
              value={selectedCounselor || undefined}
              onChange={(value) => {
                setSelectedCounselor(value);
                handleSearch({ counselorId: value });
              }}
            >
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
            {selectedCounselor ? (
              <Calendar
                cellRender={(current) => {
                  const listData = getListData(current);
                  return listData.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {listData.map((item, idx) => (
                        <li key={idx}>
                          <Badge status={item.type} text={item.content} />
                        </li>
                      ))}
                    </ul>
                  ) : null;
                }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#999' }}>
                请选择咨询师查看排班日历
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑排班' : '新增排班'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={500}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="咨询师"
            name="counselorId"
            rules={[{ required: true, message: '请选择咨询师' }]}
          >
            <Select placeholder="请选择咨询师">
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d < dayjs().startOf('day')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始时间"
                name="startTime"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="endTime"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={30} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="状态" name="status">
            <Select>
              <Option value="available">可预约</Option>
              <Option value="unavailable">不可用</Option>
            </Select>
          </Form.Item>

          <Form.Item label="备注" name="remarks">
            <TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量排班"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        onOk={handleBatchSubmit}
        width={500}
        okText="创建"
        cancelText="取消"
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            label="咨询师"
            name="counselorId"
            rules={[{ required: true, message: '请选择咨询师' }]}
          >
            <Select placeholder="请选择咨询师">
              {counselors.map(c => (
                <Option key={c.id} value={c.id}>{c.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="选择日期"
            name="dates"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <RangePicker
              style={{ width: '100%' }}
              mode={['date', 'date']}
              disabledDate={(d) => d < dayjs().startOf('day')}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="开始时间"
                name="startTime"
                rules={[{ required: true, message: '请选择开始时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={30} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="结束时间"
                name="endTime"
                rules={[{ required: true, message: '请选择结束时间' }]}
              >
                <TimePicker format="HH:mm" style={{ width: '100%' }} minuteStep={30} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="状态" name="status">
            <Select>
              <Option value="available">可预约</Option>
              <Option value="unavailable">不可用</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="排班详情"
        placement="right"
        width={400}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="咨询师">{currentRecord.counselor?.name}</Descriptions.Item>
            <Descriptions.Item label="日期">{currentRecord.date}</Descriptions.Item>
            <Descriptions.Item label="时间">
              {currentRecord.startTime} - {currentRecord.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={statusMap[currentRecord.status]?.color}>
                {statusMap[currentRecord.status]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="备注">{currentRecord.remarks || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {new Date(currentRecord.createdAt).toLocaleString('zh-CN')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>
    </div>
  );
}

export default ScheduleManage;
