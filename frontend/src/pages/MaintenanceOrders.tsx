import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Upload, Image, Descriptions } from 'antd'
import { PlusOutlined, CheckOutlined, CloseOutlined, UploadOutlined, EyeOutlined, PlayCircleOutlined, SendOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { get, post, put, del } from '../api'
import { useAuthStore } from '../store/auth'
import type { MaintenanceOrder, PaginatedResponse, Property, User, Attachment } from '../types'

const { Option } = Select
const { TextArea } = Input

const statusColors: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  in_progress: 'processing',
  submitted: 'warning',
  inspecting: 'purple',
  completed: 'success',
  rejected: 'error',
  cancelled: 'default',
}

const statusTexts: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  in_progress: '进行中',
  submitted: '待验收',
  inspecting: '验收中',
  completed: '已完成',
  rejected: '已驳回',
  cancelled: '已取消',
}

const typeTexts: Record<string, string> = {
  plumbing: '水电',
  electrical: '电器',
  appliance: '家电',
  furniture: '家具',
  painting: '油漆',
  door_window: '门窗',
  other: '其他',
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

const MaintenanceOrders: React.FC = () => {
  const { user } = useAuthStore()
  const [orders, setOrders] = useState<MaintenanceOrder[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [assignModalVisible, setAssignModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<MaintenanceOrder | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [technicians, setTechnicians] = useState<User[]>([])
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [form] = Form.useForm()
  const [assignForm] = Form.useForm()

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const data = await get<PaginatedResponse<MaintenanceOrder>>('/maintenance-orders', {
        params: { page, page_size: pageSize, status: statusFilter },
      })
      setOrders(data.data)
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

  const fetchTechnicians = async () => {
    try {
      const data = await get<User[]>('/users/technicians')
      setTechnicians(data)
    } catch (e) {}
  }

  const fetchAttachments = async (orderId: number) => {
    try {
      const data = await get<Attachment[]>(`/attachments/maintenance-order/${orderId}`)
      setAttachments(data)
    } catch (e) {}
  }

  useEffect(() => {
    fetchOrders()
    fetchProperties()
    fetchTechnicians()
  }, [page, pageSize, statusFilter])

  const handleCreate = () => {
    setSelectedOrder(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        scheduled_time: values.scheduled_time ? values.scheduled_time.toISOString() : null,
        deadline_time: values.deadline_time ? values.deadline_time.toISOString() : null,
      }
      await post('/maintenance-orders', data)
      message.success('创建成功')
      setModalVisible(false)
      fetchOrders()
    } catch (e) {}
  }

  const handleAssign = async (values: any) => {
    try {
      await post(`/maintenance-orders/${selectedOrder?.id}/assign`, {
        ...values,
        scheduled_time: values.scheduled_time ? values.scheduled_time.toISOString() : null,
      })
      message.success('分配成功')
      setAssignModalVisible(false)
      fetchOrders()
    } catch (e) {}
  }

  const handleStart = async (order: MaintenanceOrder) => {
    try {
      await post(`/maintenance-orders/${order.id}/start`)
      message.success('已开始维修')
      fetchOrders()
    } catch (e) {}
  }

  const handleSubmitOrder = async (order: MaintenanceOrder) => {
    Modal.confirm({
      title: '提交维修',
      content: (
        <Form id="submit-mt-form">
          <Form.Item name="solution" label="维修方案" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item name="actual_cost" label="实际费用">
            <Input type="number" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const solution = (document.querySelector('#submit-mt-form textarea') as HTMLTextAreaElement)?.value
        const actualCostInput = document.querySelector('#submit-mt-form input[type="number"]') as HTMLInputElement
        const actual_cost = actualCostInput ? parseFloat(actualCostInput.value) || 0 : 0
        try {
          await post(`/maintenance-orders/${order.id}/submit`, { solution, actual_cost })
          message.success('已提交')
          fetchOrders()
        } catch (e) {}
      },
    })
  }

  const handleApprove = async (order: MaintenanceOrder) => {
    try {
      await post(`/maintenance-orders/${order.id}/approve`, { remarks: '' })
      message.success('验收通过')
      fetchOrders()
    } catch (e) {}
  }

  const handleReject = async (order: MaintenanceOrder) => {
    Modal.confirm({
      title: '驳回工单',
      content: (
        <Form id="reject-mt-form">
          <Form.Item name="remarks" label="驳回原因" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        const remarks = (document.querySelector('#reject-mt-form textarea') as HTMLTextAreaElement)?.value
        try {
          await post(`/maintenance-orders/${order.id}/reject`, { remarks })
          message.success('已驳回')
          fetchOrders()
        } catch (e) {}
      },
    })
  }

  const handleViewDetail = (order: MaintenanceOrder) => {
    setSelectedOrder(order)
    fetchAttachments(order.id)
    setDetailModalVisible(true)
  }

  const handleUpload = async (options: any) => {
    const { file, onSuccess, onError } = options
    const formData = new FormData()
    formData.append('file', file)
    formData.append('maintenance_order_id', String(selectedOrder?.id))
    formData.append('purpose', 'maintenance_after')
    try {
      await post('/attachments/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      message.success('上传成功')
      fetchAttachments(selectedOrder!.id)
      onSuccess(file)
    } catch (e) {
      onError(e)
    }
  }

  const canManage = user?.role === 'admin' || user?.role === 'manager'
  const isTechnician = user?.role === 'maintenance'

  const columns = [
    { title: '工单编号', dataIndex: 'order_no', key: 'order_no', width: 140 },
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '类型', dataIndex: 'maintenance_type', key: 'maintenance_type', width: 80,
      render: (t: string) => typeTexts[t] || t },
    { title: '维修员', dataIndex: 'technician_id', key: 'technician_id', width: 100,
      render: (id: number) => id ? (technicians.find(t => t.id === id)?.full_name || id) : '-' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={statusColors[s]}>{statusTexts[s]}</Tag> },
    { title: '优先级', dataIndex: 'priority', key: 'priority', width: 80,
      render: (p: string) => <Tag color={priorityColors[p]}>{priorityTexts[p]}</Tag> },
    { title: '费用', dataIndex: 'actual_cost', key: 'actual_cost', width: 80,
      render: (v: number) => v ? `¥${v}` : '-' },
    { title: '超时', dataIndex: 'is_overdue', key: 'is_overdue', width: 60,
      render: (v: number) => v ? <Tag color="red">是</Tag> : '-' },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      fixed: 'right' as const,
      render: (_: any, record: MaintenanceOrder) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>
          {isTechnician && record.status === 'assigned' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record)}>开始</Button>
          )}
          {isTechnician && record.status === 'in_progress' && (
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => handleSubmitOrder(record)}>提交</Button>
          )}
          {canManage && record.status === 'pending' && (
            <Button type="link" size="small" onClick={() => { setSelectedOrder(record); assignForm.resetFields(); setAssignModalVisible(true) }}>分配</Button>
          )}
          {canManage && record.status === 'submitted' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record)}>通过</Button>
              <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>驳回</Button>
            </>
          )}
          {canManage && !['completed', 'cancelled'].includes(record.status) && (
            <Popconfirm title="确定取消吗？" onConfirm={async () => {
              try { await post(`/maintenance-orders/${record.id}/cancel`); message.success('已取消'); fetchOrders() } catch(e) {}
            }}>
              <Button type="link" size="small" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

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
              创建维修工单
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      <Modal
        title="创建维修工单"
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
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input placeholder="请输入问题描述" />
          </Form.Item>
          <Form.Item name="maintenance_type" label="维修类型" rules={[{ required: true }]}>
            <Select>
              {Object.entries(typeTexts).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
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
          <Form.Item name="scheduled_time" label="计划时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deadline_time" label="截止时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="estimated_cost" label="预估费用" initialValue={0}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="description" label="详细描述">
            <TextArea rows={3} placeholder="请详细描述问题" />
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
        title="分配维修员"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        footer={null}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item name="technician_id" label="选择维修员" rules={[{ required: true }]}>
            <Select placeholder="请选择维修员">
              {technicians.map(t => (
                <Option key={t.id} value={t.id}>{t.full_name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="scheduled_time" label="预约时间">
            <DatePicker showTime style={{ width: '100%' }} />
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
        title="工单详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={700}
        footer={
          <Space>
            {isTechnician && selectedOrder?.status === 'in_progress' && (
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
        {selectedOrder && (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="工单编号">{selectedOrder.order_no}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[selectedOrder.status]}>{statusTexts[selectedOrder.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="房源">
                {properties.find(p => p.id === selectedOrder.property_id)?.name || selectedOrder.property_id}
              </Descriptions.Item>
              <Descriptions.Item label="维修员">
                {selectedOrder.technician_id ? (technicians.find(t => t.id === selectedOrder.technician_id)?.full_name) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="维修类型">{typeTexts[selectedOrder.maintenance_type]}</Descriptions.Item>
              <Descriptions.Item label="预估费用">¥{selectedOrder.estimated_cost}</Descriptions.Item>
              <Descriptions.Item label="实际费用">¥{selectedOrder.actual_cost || 0}</Descriptions.Item>
              <Descriptions.Item label="优先级">{priorityTexts[selectedOrder.priority]}</Descriptions.Item>
              <Descriptions.Item label="问题描述" span={2}>{selectedOrder.description || '-'}</Descriptions.Item>
              <Descriptions.Item label="维修方案" span={2}>{selectedOrder.solution || '-'}</Descriptions.Item>
              <Descriptions.Item label="验收备注" span={2}>{selectedOrder.inspector_remarks || '-'}</Descriptions.Item>
            </Descriptions>

            {attachments.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4>照片附件</h4>
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

export default MaintenanceOrders
