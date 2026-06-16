import { useState, useEffect } from 'react'
import {
  Table, Tag, Button, Space, Select, DatePicker, Input, Card, Row, Col,
  Modal, Form, message, Popconfirm,
} from 'antd'
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { RangePicker } = DatePicker

interface Repair {
  id: number
  title: string
  repair_type_display: string
  priority_display: string
  status_display: string
  status: string
  priority: string
  dorm_building: string
  dorm_room: string
  contact_name: string
  created_at: string
  applicant_info?: any
  assignee_info?: any
  processing_time_hours?: number
}

const statusColorMap: Record<string, string> = {
  pending: 'orange',
  assigned: 'blue',
  in_progress: 'cyan',
  completed: 'green',
  cancelled: 'default',
}
const priorityColorMap: Record<string, string> = {
  low: 'default', medium: 'blue', high: 'orange', urgent: 'red',
}

export default function AdminRepairs() {
  const navigate = useNavigate()
  const [data, setData] = useState<Repair[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<any>({})
  const [assignModal, setAssignModal] = useState(false)
  const [statusModal, setStatusModal] = useState(false)
  const [currentRepair, setCurrentRepair] = useState<Repair | null>(null)
  const [staffList, setStaffList] = useState<any[]>([])
  const [assignForm] = Form.useForm()
  const [statusForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: res } = await axios.get('/api/repairs/', {
        params: { page, ...params },
      })
      setData(res.results)
      setTotal(res.count)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const fetchStaff = async () => {
      const { data } = await axios.get('/api/users/', {
        params: { role__in: 'admin,dorm_manager,maintenance', page_size: 100 },
      })
      setStaffList(data.results || data)
    }
    fetchStaff()
  }, [page, params])

  const buildExportUrl = () => {
    const qs = new URLSearchParams(params).toString()
    return `/api/repairs/export/${qs ? '?' + qs : ''}`
  }

  const handleAssign = async (values: any) => {
    try {
      await axios.post(`/api/repairs/${currentRepair?.id}/assign/`, values)
      message.success('分配成功')
      setAssignModal(false)
      assignForm.resetFields()
      fetchData()
    } catch {}
  }

  const handleUpdateStatus = async (values: any) => {
    try {
      await axios.post(`/api/repairs/${currentRepair?.id}/update_status/`, values)
      message.success('状态更新成功')
      setStatusModal(false)
      statusForm.resetFields()
      fetchData()
    } catch {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '标题', dataIndex: 'title',
      render: (t: string, r: Repair) => (
        <a onClick={() => navigate(`/admin/repairs/${r.id}`)}>{t}</a>
      ),
    },
    { title: '类型', dataIndex: 'repair_type_display', width: 100 },
    {
      title: '优先级', dataIndex: 'priority', width: 90,
      render: (v: string, r: Repair) => <Tag color={priorityColorMap[v]}>{r.priority_display}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string, r: Repair) => <Tag color={statusColorMap[v]}>{r.status_display}</Tag>,
    },
    { title: '位置', dataIndex: 'dorm_building', width: 100, render: (b: string, r: Repair) => `${b}-${r.dorm_room}` },
    { title: '申请人', dataIndex: 'applicant_info', width: 100, render: (a: any) => a?.real_name || a?.username || '-' },
    { title: '处理人', dataIndex: 'assignee_info', width: 100, render: (a: any) => a?.real_name || a?.username || '-' },
    { title: '处理时长(时)', dataIndex: 'processing_time_hours', width: 110, render: (v: number) => v ?? '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_: any, r: Repair) => (
        <Space>
          <Button size="small" onClick={() => { setCurrentRepair(r); setAssignModal(true) }}>
            分配
          </Button>
          <Button size="small" onClick={() => { setCurrentRepair(r); setStatusModal(true) }}>
            更新状态
          </Button>
          <Button size="small" type="link" onClick={() => navigate(`/admin/repairs/${r.id}`)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col>
            <Select
              placeholder="状态" allowClear style={{ width: 140 }}
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'assigned', label: '已分配' },
                { value: 'in_progress', label: '处理中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
              onChange={(v) => setParams((p: any) => ({ ...p, status: v }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="类型" allowClear style={{ width: 140 }}
              options={[
                { value: 'plumbing', label: '水电维修' },
                { value: 'furniture', label: '家具维修' },
                { value: 'electrical', label: '电器维修' },
                { value: 'door_window', label: '门窗维修' },
                { value: 'network', label: '网络维修' },
                { value: 'other', label: '其他' },
              ]}
              onChange={(v) => setParams((p: any) => ({ ...p, repair_type: v }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="处理人" allowClear style={{ width: 150 }}
              options={staffList.map((u) => ({ value: u.id, label: u.real_name || u.username }))}
              onChange={(v) => setParams((p: any) => ({ ...p, assignee: v }))}
            />
          </Col>
          <Col>
            <Input
              placeholder="宿舍楼" allowClear style={{ width: 120 }}
              onPressEnter={(e: any) => setParams((p: any) => ({ ...p, dorm_building: e.target.value }))}
            />
          </Col>
          <Col>
            <RangePicker
              onChange={(dates: any) => setParams((p: any) => ({
                ...p,
                created_from: dates?.[0]?.format('YYYY-MM-DD'),
                created_to: dates?.[1]?.format('YYYY-MM-DD'),
              }))}
            />
          </Col>
          <Col>
            <Input
              allowClear placeholder="搜索" prefix={<SearchOutlined />} style={{ width: 200 }}
              onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Space>
              <Button icon={<DownloadOutlined />} onClick={() => window.open(buildExportUrl(), '_blank')}>
                导出数据
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          scroll={{ x: 1400 }}
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }}
        />
      </Card>

      <Modal
        title={`分配报修 #${currentRepair?.id}`}
        open={assignModal}
        onCancel={() => setAssignModal(false)}
        onOk={() => assignForm.submit()}
      >
        <Form form={assignForm} layout="vertical" onFinish={handleAssign}>
          <Form.Item label="处理人" name="assignee_id" rules={[{ required: true }]}>
            <Select
              options={staffList.map((u) => ({
                value: u.id,
                label: `${u.real_name || u.username} (${u.role_display})`,
              }))}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`更新状态 #${currentRepair?.id}`}
        open={statusModal}
        onCancel={() => setStatusModal(false)}
        onOk={() => statusForm.submit()}
      >
        <Form form={statusForm} layout="vertical" onFinish={handleUpdateStatus}>
          <Form.Item label="状态" name="status" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'pending', label: '待处理' },
                { value: 'assigned', label: '已分配' },
                { value: 'in_progress', label: '处理中' },
                { value: 'completed', label: '已完成' },
                { value: 'cancelled', label: '已取消' },
              ]}
            />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
