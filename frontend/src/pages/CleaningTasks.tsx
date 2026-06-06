import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Upload, Image, Descriptions } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  UploadOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { get, post, put, del } from '../api'
import { useAuthStore } from '../store/auth'
import type { CleaningTask, PaginatedResponse, Property, User, Attachment } from '../types'

const { Option } = Select
const { TextArea } = Input

const statusColors: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'processing',
  submitted: 'warning',
  inspecting: 'purple',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

const statusTexts: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  submitted: '待验收',
  inspecting: '验收中',
  approved: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
}

const priorityColors: Record<string, string> = {
  low: 'default',
  normal: 'blue',
  high: 'orange',
  urgent: 'red',
}

const priorityTexts: Record<string, string> = {
  low: '低',
  normal: '普通',
  high: '高',
  urgent: '紧急',
}

const CleaningTasks: React.FC = () => {
  const { user } = useAuthStore()
  const [tasks, setTasks] = useState<CleaningTask[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedTask, setSelectedTask] = useState<CleaningTask | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [cleaners, setCleaners] = useState<User[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [form] = Form.useForm()
  const [assignForm] = Form.useForm()

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await get<PaginatedResponse<CleaningTask>>('/cleaning-tasks', {
        params: { page, page_size: pageSize, status: statusFilter },
      })
      setTasks(data.data)
      setTotal(data.total)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const fetchProperties = async () => {
    try {
      const data = await get<PaginatedResponse<Property>>('/properties', {
        params: { page_size: 100 },
      })
      setProperties(data.data)
    } catch (e) {}
  }

  const fetchCleaners = async () => {
    try {
      const data = await get<User[]>('/users/cleaners')
      setCleaners(data)
    } catch (e) {}
  }

  const fetchAttachments = async (taskId: number) => {
    try {
      const data = await get<Attachment[]>(`/attachments/cleaning-task/${taskId}`)
      setAttachments(data)
    } catch (e) {}
  }

  useEffect(() => {
    fetchTasks()
    fetchProperties()
    fetchCleaners()
  }, [page, pageSize, statusFilter])

  const handleCreate = () => {
    setSelectedTask(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        scheduled_time: values.scheduled_time.toISOString(),
        deadline_time: values.deadline_time ? values.deadline_time.toISOString() : null,
      }
      if (selectedTask) {
        await put(`/cleaning-tasks/${selectedTask.id}`, data)
        message.success('更新成功')
      } else {
        await post('/cleaning-tasks', data)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchTasks()
    } catch (e) {}
  }

  const handleAssign = async (values: any) => {
    try {
      await post(`/cleaning-tasks/${selectedTask?.id}/assign`, values)
      message.success('分配成功')
      setAssignModalVisible(false)
      fetchTasks()
    } catch (e) {}
  }

  const handleStart = async (task: CleaningTask) => {
    try {
      await post(`/cleaning-tasks/${task.id}/start`)
      message.success('已开始任务')
      fetchTasks()
    } catch (e) {}
  }

  const handleSubmitTask = async (task: CleaningTask) => {
    try {
      await post(`/cleaning-tasks/${task.id}/submit`, { description: '' })
      message.success('任务已提交')
      fetchTasks()
    } catch (e) {}
  }

  const handleApprove = async (task: CleaningTask) => {
    try {
      await post(`/cleaning-tasks/${task.id}/approve`, { remarks: '' })
      message.success('验收通过')
      fetchTasks()
    } catch (e) {}
  }

  const handleReject = async (task: CleaningTask) => {
    Modal.confirm({
      title: '驳回任务',
      content: (
        <Form id="reject-form">
          <Form.Item name="remarks" label="驳回原因" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const remarks = (document.querySelector('#reject-form textarea') as HTMLTextAreaElement)?.value
        try {
          await post(`/cleaning-tasks/${task.id}/reject`, { remarks })
          message.success('已驳回')
          fetchTasks()
        } catch (e) {}
      },
    })
  }

  const handleViewDetail = (task: CleaningTask) => {
    setSelectedTask(task)
    fetchAttachments(task.id)
    setDetailModalVisible(true)
  }

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    const formData = new FormData()
    formData.append('file', file)
    formData.append('cleaning_task_id', String(selectedTask?.id))
    formData.append('purpose', 'after_cleaning')
    try {
      await post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('上传成功')
      fetchAttachments(selectedTask!.id)
      onSuccess(file)
    } catch (e) {
      onError(e)
    }
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isCleaner = user?.role === 'cleaner'

  const columns = [
    { title: '任务编号', dataIndex: 'task_no', key: 'task_no', width: 140 },
    { title: '房源', dataIndex: 'property_id', key: 'property_id', width: 120,
      render: (id: number) => properties.find(p => p.id === id)?.name || id },
    { title: '保洁员', dataIndex: 'cleaner_id', key: 'cleaner_id', width: 100,
      render: (id: number) => id ? (cleaners.find(c => c.id === id)?.full_name || id) : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={statusColors[s]}>{statusTexts[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: string) => <Tag color={priorityColors[p]}>{priorityTexts[p]}</Tag> },
    { title: '计划时间', dataIndex: 'scheduled_time', key: 'scheduled_time', width: 160,
      render: (t: string) => t ? dayjs(t).format('MM-DD HH:mm') : '-' },
    { title: '超时', dataIndex: 'is_overdue', key: 'is_overdue', width: 60,
      render: (v: number) => v ? <Tag color="red">是</Tag> : '-' },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: CleaningTask) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {isCleaner && record.status === 'assigned' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record)}>开始</Button>
          )}
          {isCleaner && record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmitTask(record)}>提交</Button>
          )}
          {canManage && record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => { setSelectedTask(record); assignForm.resetFields(); setAssignModalVisible(true) }}>分配</Button>
          )}
          {canManage && record.status === 'submitted' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>驳回</Button>
            </>
          )}
          {canManage && !['approved', 'cancelled'].includes(record.status) && (
            <Popconfirm title="确定取消吗？" onConfirm={() => handleCancel(record)}>
              <Button type="link" size="small" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const handleCancel = async (task: CleaningTask) => {
    try {
      await post(`/cleaning-tasks/${task.id}/cancel`)
      message.success('已取消')
      fetchTasks()
    } catch (e) {}
  }

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={statusFilter}
            onChange={setStatusFilter}
          >
            {Object.entries(statusTexts).map(([key, text]) => (
              <Option key={key} value={key}>{text}</Option>
            ))}
          </Select>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              创建保洁任务
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      <Modal
        title={selectedTask ? '编辑保洁任务' : '创建保洁任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="property_id" label="选择房源" rules={[{ required: true }]}>
            <Select placeholder="请选择房源">
              {properties.map(p => (
                <Option key={p.id} value={p.id}>{p.name} - {p.community}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="normal">
            <Select>
              {Object.entries(priorityTexts).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="scheduled_time" label="计划时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deadline_time" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="estimated_duration" label="预计时长(小时)" initialValue={2}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={3} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配保洁员"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="cleaner_id" label="选择保洁员" rules={[{ required: true }]}>
            <Select placeholder="请选择保洁员">
              {cleaners.map(c => (
                <Option key={c.id} value={c.id}>{c.full_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setAssignModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="任务详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={
          <Space>
            {isCleaner && selectedTask?.status === 'in_progress' && (
              <Upload
                customRequest={handleUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>上传照片</Button>
              </Upload>
            )}
            <Button onClick={() => setDetailModalVisible(false)}>关闭</Button>
          </Space>
        }
      >
        {selectedTask && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="任务编号">{selectedTask.task_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedTask.status]}>{statusTexts[selectedTask.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="房源">
                {properties.find(p => p.id === selectedTask.property_id)?.name || selectedTask.property_id}
              </Descriptions.Item>
              <Descriptions.Item label="保洁员">
                {selectedTask.cleaner_id ? (cleaners.find(c => c.id === selectedTask.cleaner_id)?.full_name) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="计划时间">
                {selectedTask.scheduled_time ? dayjs(selectedTask.scheduled_time).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {selectedTask.deadline_time ? dayjs(selectedTask.deadline_time).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>
                {selectedTask.description || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="验收备注" span={2}>
                {selectedTask.inspector_remarks || '-'}
              </Descriptions.Item>
            </Descriptions>

            {attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>验收照片</h4>
                <Image.PreviewGroup>
                  <Space wrap>
                    {attachments.map(att => (
                      <Image
                        key={att.id}
                        width={120}
                        height={120}
                        src={att.file_url}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                      />
                    ))}
                  </Space>
                </Image.PreviewGroup>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CleaningTasks
