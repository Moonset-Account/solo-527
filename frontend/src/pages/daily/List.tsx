import React from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, DatePicker, Avatar } from 'antd'
import { SearchOutlined, PlusOutlined, EyeOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import axios from 'axios'
import dayjs from 'dayjs'

const DailyRecords = () => {
  const [filters, setFilters] = React.useState({
    search: '',
    child_class: undefined as number | undefined,
    record_date: null as dayjs.Dayjs | null
  })

  const { data: classes } = useQuery(
    ['classes'],
    () => axios.get('/api/children/classes/').then((res) => res.data.results)
  )

  const { data, isLoading } = useQuery(
    ['daily-records', filters],
    () => {
      const params: any = { ordering: '-record_date' }
      if (filters.search) params.search = filters.search
      if (filters.record_date) params.record_date = filters.record_date.format('YYYY-MM-DD')
      return axios.get('/api/daily-records/daily/', { params }).then((res) => res.data.results)
    }
  )

  const columns = [
    {
      title: '儿童',
      dataIndex: 'child_name',
      render: (v: string) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {v}
        </Space>
      )
    },
    { title: '记录日期', dataIndex: 'record_date' },
    { title: '记录老师', dataIndex: 'teacher_name' },
    { title: '情绪', dataIndex: 'mood', render: (v: string) => v || '-' },
    { title: '健康状况', dataIndex: 'health_status', render: (v: string) => v || '-' },
    {
      title: '午睡次数',
      render: (_: any, r: any) => r.nap_records?.length || 0
    },
    {
      title: '用餐次数',
      render: (_: any, r: any) => r.meal_records?.length || 0
    },
    {
      title: '操作',
      width: 100,
      render: () => <Button type="link" icon={<EyeOutlined />}>查看</Button>
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">每日记录</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          新增记录
        </Button>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索儿童姓名"
            prefix={<SearchOutlined />}
            style={{ width: 200 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="班级"
            style={{ width: 150 }}
            allowClear
            value={filters.child_class}
            onChange={(v) => setFilters({ ...filters, child_class: v })}
          >
            {classes?.map((c: any) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <DatePicker
            placeholder="记录日期"
            value={filters.record_date}
            onChange={(d) => setFilters({ ...filters, record_date: d })}
            allowClear
          />
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

export default DailyRecords
