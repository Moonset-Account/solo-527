import React from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, Avatar } from 'antd'
import { SearchOutlined, PlusOutlined, UserOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from 'react-query'
import { childApi } from '@/services/children'
import { useNavigate } from 'react-router-dom'
import type { Child } from '@/types'

const ChildrenList = () => {
  const navigate = useNavigate()
  const [filters, setFilters] = React.useState({
    search: '',
    child_class: undefined as number | undefined,
    status: undefined as string | undefined,
    gender: undefined as string | undefined
  })

  const { data: classes } = useQuery(
    ['child-classes'],
    () => childApi.getClasses().then((res) => res.data.results)
  )

  const { data, isLoading } = useQuery(
    ['children', filters],
    () => {
      const params: any = { ordering: '-created_at' }
      if (filters.search) params.search = filters.search
      if (filters.child_class) params.child_class = filters.child_class
      if (filters.status) params.status = filters.status
      if (filters.gender) params.gender = filters.gender
      return childApi.getList(params).then((res) => res.data.results)
    }
  )

  const columns = [
    {
      title: '头像',
      dataIndex: 'avatar',
      width: 60,
      render: (v: string) => <Avatar src={v} icon={<UserOutlined />} />
    },
    { title: '姓名', dataIndex: 'name' },
    {
      title: '性别',
      dataIndex: 'gender',
      render: (_: any, r: Child) => r.gender_display
    },
    { title: '年龄', dataIndex: 'age', render: (v: number) => `${v}岁` },
    { title: '班级', dataIndex: 'class_name' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string, r: Child) => (
        <Tag color={v === 'active' ? 'green' : v === 'graduated' ? 'blue' : 'orange'}>
          {r.status_display}
        </Tag>
      )
    },
    { title: '入园日期', dataIndex: 'enrollment_date' },
    {
      title: '操作',
      width: 120,
      render: (_, record: Child) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/children/${record.id}`)}
        >
          查看
        </Button>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">儿童档案</h2>
        <Button type="primary" icon={<PlusOutlined />}>
          添加儿童
        </Button>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索姓名、身份证"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="选择班级"
            style={{ width: 150 }}
            allowClear
            value={filters.child_class}
            onChange={(v) => setFilters({ ...filters, child_class: v })}
          >
            {classes?.map((c: any) => (
              <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
            ))}
          </Select>
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="active">在园</Select.Option>
            <Select.Option value="graduated">毕业</Select.Option>
            <Select.Option value="suspended">休学</Select.Option>
          </Select>
          <Select
            placeholder="性别"
            style={{ width: 100 }}
            allowClear
            value={filters.gender}
            onChange={(v) => setFilters({ ...filters, gender: v })}
          >
            <Select.Option value="male">男</Select.Option>
            <Select.Option value="female">女</Select.Option>
          </Select>
        </Space>
      </Card>

      <Card className="table-container" bordered={false}>
        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>
    </div>
  )
}

export default ChildrenList
