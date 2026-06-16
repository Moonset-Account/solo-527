import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Input, Button, Space, Form } from 'antd'
import { PlusOutlined, SearchOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getEventList } from '@/api'
import type { GridEvent, EventStatus, EventType } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<EventStatus, { label: string; color: string }> = {
  reported: { label: '已上报', color: 'orange' },
  assigned: { label: '已指派', color: 'blue' },
  processing: { label: '处理中', color: 'geekblue' },
  reviewing: { label: '待复查', color: 'purple' },
  following_up: { label: '跟进中', color: 'cyan' },
  closed: { label: '已关闭', color: 'green' },
  abnormal_closed: { label: '异常关闭', color: 'red' }
}

const eventTypeMap: Record<EventType, string> = {
  environmental_hygiene: '环境卫生',
  security_issue: '治安安全',
  facility_damage: '设施损坏',
  dispute_resolution: '民事纠纷',
  other: '其他'
}

const EventList = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<GridEvent[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData(1, 10)
  }, [])

  const loadData = async (pageIndex?: number, pageSize?: number) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getEventList({
        pageIndex: pageIndex || pagination.current,
        pageSize: pageSize || pagination.pageSize,
        ...values
      })
      setData(res.items)
      setPagination({
        current: res.pageIndex,
        pageSize: res.pageSize,
        total: res.totalCount
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const handleReset = () => {
    form.resetFields()
    loadData(1, pagination.pageSize)
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
      dataIndex: 'eventType',
      width: 100,
      render: (type: EventType) => eventTypeMap[type]
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: EventStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>
      )
    },
    {
      title: '发生地点',
      dataIndex: 'locationAddress',
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
      width: 100,
      render: (name?: string) => name || '-'
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
        <Form.Item name="eventType">
          <Select placeholder="选择类型" allowClear style={{ width: 150 }}>
            {Object.entries(eventTypeMap).map(([key, val]) => (
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
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />
    </Card>
  )
}

export default EventList
