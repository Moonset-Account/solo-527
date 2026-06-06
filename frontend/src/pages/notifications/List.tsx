import { Card, Table, Tag, Input, Select, Button, Space, DatePicker, Badge } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery, useQueryClient } from 'react-query'
import { notificationApi } from '@/services/notifications'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import type { Notification } from '@/types'

const Notifications = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filters, setFilters] = React.useState({
    search: '',
    type: undefined as string | undefined,
    status: 'published',
    target_type: undefined as string | undefined
  })

  const { data, isLoading } = useQuery(
    ['notifications', filters],
    () => {
      const params: any = { ordering: '-published_at' }
      if (filters.search) params.search = filters.search
      if (filters.type) params.type = filters.type
      if (filters.status) params.status = filters.status
      if (filters.target_type) params.target_type = filters.target_type
      return notificationApi.getList(params).then((res) => res.data.results)
    }
  )

  const typeColor: Record<string, string> = {
    system: 'blue',
    urgent: 'red',
    daily: 'green',
    activity: 'purple',
    payment: 'orange'
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (v: string, record: Notification) => (
        <Space>
          {!record.is_read && <Badge status="processing" />}
          <a onClick={() => navigate(`/notifications/${record.id}`)}>{v}</a>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (v: string, record: Notification) => (
        <Tag color={typeColor[v]}>{record.type_display}</Tag>
      )
    },
    {
      title: '接收范围',
      dataIndex: 'target_type_display',
      width: 100
    },
    {
      title: '需要确认',
      dataIndex: 'need_ack',
      width: 100,
      render: (v: boolean, record: Notification) => (
        v ? (record.is_ack ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>) : '-'
      )
    },
    { title: '阅读数', dataIndex: 'read_count', width: 80 },
    { title: '发布人', dataIndex: 'published_by_name', width: 100 },
    {
      title: '发布时间',
      dataIndex: 'published_at',
      width: 160,
      render: (v: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作',
      width: 80,
      render: (_, record: Notification) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/notifications/${record.id}`)}>
          查看
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">通知</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          发布通知
        </Button>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索标题、内容"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="通知类型"
            style={{ width: 120 }}
            allowClear
            value={filters.type}
            onChange={(v) => setFilters({ ...filters, type: v })}
          >
            <Select.Option value="system">系统通知</Select.Option>
            <Select.Option value="urgent">紧急通知</Select.Option>
            <Select.Option value="daily">日常通知</Select.Option>
            <Select.Option value="activity">活动通知</Select.Option>
            <Select.Option value="payment">缴费通知</Select.Option>
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="published">已发布</Select.Option>
            <Select.Option value="draft">草稿</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card className="table-container" bordered={false}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  )
}

export default Notifications
