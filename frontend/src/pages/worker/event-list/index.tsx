import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Input, Button, Space, Form } from 'antd'
import { PlusOutlined, SearchOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getEventList } from '@/api'
import type { GridEvent, EventStatus, EventCategory, PageParams } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<EventStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  pending_review: { label: '待复查', color: 'purple' },
  pending_visit: { label: '待回访', color: 'cyan' },
  completed: { label: '已完成', color: 'green' },
  rejected: { label: '已驳回', color: 'red' }
}

const categoryMap: Record<EventCategory, string> = {
  environment: '环境卫生',
  security: '治安安全',
  facility: '设施损坏',
  civil: '民事纠纷',
  other: '其他'
}

const EventList = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GridEvent[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData({ page: 1, pageSize: 10 })
  }, [])

  const loadData = async (params: PageParams) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getEventList({ ...params, ...values })
      setData(res.data.list)
      setPagination({
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const handleReset = () => {
    form.resetFields()
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const columns = [
    {
      title: '事件编号',
      dataIndex: 'id',
      width: 100
    },
    {
      title: '事件标题',
      dataIndex: 'title',
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'category',
      width: 100,
      render: (category: EventCategory) => categoryMap[category]
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: EventStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      )
    },
    {
      title: '发生地点',
      dataIndex: 'address',
      ellipsis: true,
      render: (address: string) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {address}
        </span>
      )
    },
    {
      title: '上报人',
      dataIndex: 'reporterName',
      width: 100
    },
    {
      title: '上报时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: GridEvent) => (
        <Space>
          <Button type="link" onClick={() => navigate(`/manager/event-detail/${record.id}`)}>
            查看
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="事件列表"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/worker/event-report')}>
          上报事件
        </Button>
      }
    >
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="keyword">
          <Input placeholder="搜索标题/地址" allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="选择状态" allowClear style={{ width: 150 }}>
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="category">
          <Select placeholder="选择类型" allowClear style={{ width: 150 }}>
            {Object.entries(categoryMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1000 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData({ page, pageSize })
        }}
      />
    </Card>
  )
}

export default EventList
