import { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Select, DatePicker, Input, Card, Row, Col } from 'antd'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import axios from '@/utils/request'
import { useAuthStore } from '@/store/auth'

const { RangePicker } = DatePicker

interface Repair {
  id: number
  title: string
  repair_type: string
  repair_type_display: string
  priority: string
  priority_display: string
  status: string
  status_display: string
  dorm_building: string
  dorm_room: string
  contact_name: string
  created_at: string
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
  low: 'default',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
}

export default function RepairList() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [data, setData] = useState<Repair[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [params, setParams] = useState<any>({})

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
  }, [page, params])

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    {
      title: '标题',
      dataIndex: 'title',
      render: (t: string, r: Repair) => (
        <a onClick={() => navigate(`/repairs/${r.id}`)}>{t}</a>
      ),
    },
    { title: '类型', dataIndex: 'repair_type_display', width: 100 },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 90,
      render: (v: string, r: Repair) => (
        <Tag color={priorityColorMap[v]}>{r.priority_display}</Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v: string, r: Repair) => (
        <Tag color={statusColorMap[v]}>{r.status_display}</Tag>
      ),
    },
    { title: '位置', dataIndex: 'dorm_building', width: 100, render: (b: string, r: Repair) => `${b}-${r.dorm_room}` },
    { title: '联系人', dataIndex: 'contact_name', width: 100 },
    { title: '处理人', dataIndex: 'assignee_info', width: 100, render: (a: any) => a?.real_name || '-' },
    { title: '处理时长(时)', dataIndex: 'processing_time_hours', width: 110, render: (v: number) => v ?? '-' },
    { title: '创建时间', dataIndex: 'created_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Select
              placeholder="状态"
              allowClear
              style={{ width: 140 }}
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
              placeholder="类型"
              allowClear
              style={{ width: 140 }}
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
            <RangePicker
              onChange={(dates: any) => {
                setParams((p: any) => ({
                  ...p,
                  created_from: dates?.[0]?.format('YYYY-MM-DD'),
                  created_to: dates?.[1]?.format('YYYY-MM-DD'),
                }))
              }}
            />
          </Col>
          <Col>
            <Input
              allowClear
              placeholder="搜索"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              onPressEnter={(e: any) => setParams((p: any) => ({ ...p, search: e.target.value }))}
            />
          </Col>
          <Col flex="auto" style={{ textAlign: 'right' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/repairs/submit')}>
              提交报修
            </Button>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          rowKey="id"
          loading={loading}
          dataSource={data}
          columns={columns}
          pagination={{
            current: page,
            total,
            pageSize: 20,
            onChange: setPage,
          }}
        />
      </Card>
    </div>
  )
}
