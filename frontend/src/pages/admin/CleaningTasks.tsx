import { useEffect, useState } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Select,
  DatePicker,
  Modal,
  Form,
  Input,
  message,
  Drawer,
  Descriptions,
  Popconfirm,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useAppStore } from '@/store/appStore';
import {
  formatDateTime,
  formatDate,
  TASK_STATUS_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_COLORS,
} from '@/utils';
import type { CleaningTask, TaskStatus, TaskPriority } from '@/types';

const { Option } = Select;
const { TextArea } = Input;

export default function CleaningTasks() {
  const {
    properties,
    rooms,
    cleaningTasks,
    fetchProperties,
    fetchRooms,
    fetchCleaningTasks,
    createCleaningTask,
    updateCleaningTask,
    deleteCleaningTask,
    isLoading,
  } = useAppStore();

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CleaningTask | null>(null);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null);
  const [filters, setFilters] = useState({
    status: undefined as TaskStatus | undefined,
    priority: undefined as TaskPriority | undefined,
    property_id: undefined as string | undefined,
    scheduled_date: undefined as dayjs.Dayjs | undefined,
  });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchProperties();
    fetchRooms();
  }, [fetchProperties, fetchRooms]);

  useEffect(() => {
    loadTasks();
  }, [filters]);

  const loadTasks = () => {
    const params: Record<string, unknown> = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.property_id) params.property_id = filters.property_id;
    if (filters.scheduled_date) params.scheduled_date = filters.scheduled_date.format('YYYY-MM-DD');
    fetchCleaningTasks(params);
  };

  const handleSubmit = async (values: Partial<CleaningTask>) => {
    try {
      const taskData: Partial<CleaningTask> = {
        ...values,
        scheduled_date: values.scheduled_date
          ? (values.scheduled_date as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
          : undefined,
      };

      if (editingTask) {
        await updateCleaningTask(editingTask.id, taskData);
        message.success('任务更新成功');
      } else {
        await createCleaningTask(taskData);
        message.success('任务创建成功');
      }

      setShowModal(false);
      form.resetFields();
      setEditingTask(null);
      loadTasks();
    } catch {
      message.error('保存失败');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCleaningTask(id);
      message.success('删除成功');
      loadTasks();
    } catch {
      message.error('删除失败');
    }
  };

  const handleComplete = async (task: CleaningTask) => {
    try {
      await updateCleaningTask(task.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
      });
      message.success('任务已完成');
      loadTasks();
    } catch {
      message.error('操作失败');
    }
  };

  const filteredRooms = rooms.filter((r) => r.property === form.getFieldValue('property'));

  const columns = [
    {
      title: '任务标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: CleaningTask) => (
        <div>
          <span
            className="font-medium cursor-pointer hover:text-primary-600"
            onClick={() => {
              setSelectedTask(record);
              setShowDetailDrawer(true);
            }}
          >
            {text}
          </span>
          {record.description && (
            <div className="text-sm text-gray-500 mt-1">{record.description}</div>
          )}
        </div>
      ),
    },
    {
      title: '房型',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: TaskPriority) => (
        <Tag className={TASK_PRIORITY_COLORS[priority]}>
          {TASK_PRIORITY_LABELS[priority]}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const colorMap: Record<TaskStatus, string> = {
          pending: 'gold',
          in_progress: 'blue',
          completed: 'green',
          cancelled: 'gray',
        };
        return <Tag color={colorMap[status]}>{TASK_STATUS_LABELS[status]}</Tag>;
      },
    },
    {
      title: '指派给',
      dataIndex: 'assigned_to',
      key: 'assigned_to',
      width: 120,
      render: (userId?: string) => (
        userId ? (
          <div className="flex items-center gap-1">
            <UserOutlined />
            <span>工作人员</span>
          </div>
        ) : (
          <span className="text-gray-400">未指派</span>
        )
      ),
    },
    {
      title: '计划日期',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: string) => formatDateTime(date),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: CleaningTask) => (
        <Space>
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <Button
              type="link"
              icon={<CheckCircleOutlined />}
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingTask(record);
              form.setFieldsValue({
                ...record,
                scheduled_date: dayjs(record.scheduled_date),
              });
              setShowModal(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个任务吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800 m-0">
          <SwapOutlined className="mr-2" />
          清洁任务管理
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingTask(null);
            form.resetFields();
            form.setFieldsValue({
              status: 'pending',
              priority: 'medium',
              scheduled_date: dayjs(),
            });
            setShowModal(true);
          }}
        >
          新建任务
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="任务状态"
              className="w-full"
              allowClear
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              placeholder="优先级"
              className="w-full"
              allowClear
              value={filters.priority}
              onChange={(value) => setFilters({ ...filters, priority: value })}
            >
              {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
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
            <DatePicker
              className="w-full"
              placeholder="计划日期"
              value={filters.scheduled_date}
              onChange={(date) =>
                setFilters({ ...filters, scheduled_date: date as dayjs.Dayjs | undefined })
              }
            />
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={cleaningTasks}
          rowKey="id"
          loading={isLoading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条任务`,
          }}
        />
      </Card>

      <Modal
        title={editingTask ? '编辑清洁任务' : '新建清洁任务'}
        open={showModal}
        onCancel={() => {
          setShowModal(false);
          form.resetFields();
          setEditingTask(null);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="property"
            label="所属民宿"
            rules={[{ required: true, message: '请选择民宿' }]}
          >
            <Select
              onChange={() => form.setFieldsValue({ room: undefined })}
            >
              {properties.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="room"
            label="清洁房型"
            rules={[{ required: true, message: '请选择房型' }]}
          >
            <Select>
              {filteredRooms.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label="任务标题"
            rules={[{ required: true, message: '请输入任务标题' }]}
          >
            <Input placeholder="例如：退房清洁" />
          </Form.Item>

          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="priority"
                label="优先级"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select>
                  {Object.entries(TASK_PRIORITY_LABELS).map(([value, label]) => (
                    <Option key={value} value={value}>
                      {label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="scheduled_date"
                label="计划日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="status"
            label="任务状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select>
              {Object.entries(TASK_STATUS_LABELS).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button
                onClick={() => {
                  setShowModal(false);
                  form.resetFields();
                  setEditingTask(null);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={isLoading}>
                {editingTask ? '更新任务' : '创建任务'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="任务详情"
        open={showDetailDrawer}
        onClose={() => setShowDetailDrawer(false)}
        width={600}
      >
        {selectedTask && (
          <div className="space-y-6">
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="任务标题" span={2}>
                {selectedTask.title}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedTask.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="房型">{selectedTask.room_name}</Descriptions.Item>
              <Descriptions.Item label="计划日期">
                {formatDate(selectedTask.scheduled_date)}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag className={TASK_PRIORITY_COLORS[selectedTask.priority]}>
                  {TASK_PRIORITY_LABELS[selectedTask.priority]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedTask.status === 'pending' && <Tag color="gold">待处理</Tag>}
                {selectedTask.status === 'in_progress' && <Tag color="blue">进行中</Tag>}
                {selectedTask.status === 'completed' && <Tag color="green">已完成</Tag>}
                {selectedTask.status === 'cancelled' && <Tag color="gray">已取消</Tag>}
              </Descriptions.Item>
              {selectedTask.completed_at && (
                <Descriptions.Item label="完成时间" span={2}>
                  {formatDateTime(selectedTask.completed_at)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间" span={2}>
                {formatDateTime(selectedTask.created_at)}
              </Descriptions.Item>
            </Descriptions>

            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                <Button
                  type="primary"
                  onClick={() => {
                    handleComplete(selectedTask);
                    setShowDetailDrawer(false);
                  }}
                >
                  标记完成
                </Button>
              )}
              <Button
                onClick={() => {
                  setEditingTask(selectedTask);
                  form.setFieldsValue({
                    ...selectedTask,
                    scheduled_date: dayjs(selectedTask.scheduled_date),
                  });
                  setShowDetailDrawer(false);
                  setShowModal(true);
                }}
              >
                编辑任务
              </Button>
              <Button onClick={() => setShowDetailDrawer(false)}>关闭</Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
