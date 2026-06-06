import { useState } from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, DatePicker, Modal, message } from 'antd'
import { SearchOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { leaveApi } from '@/services/index'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import type { LeaveRequest } from '@/types'

const LeaveList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as string | undefined,
    leave_type: undefined as string | undefined,
    date: null as dayjs.Dayjs | null
  })

  const { data, isLoading } = useQuery(
    ['leave-requests', filters],
    () => {
      const params: any = { ordering: '-created_at' }
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.leave_type) params.leave_type = filters.leave_type
      return leaveApi.getList(params).then((res) => res.data.results)
    }
  )

  const approveMutation = useMutation(
    ({ id, comment }: { id: number; comment?: string }) => leaveApi.approve(id, comment),
    { onSuccess: () => { message.success('已批准'); queryClient.invalidateQueries(['leave-requests']) } }
  )

  const rejectMutation = useMutation(
    ({ id, comment }: { id: number; comment?: string }) => leaveApi.reject(id, comment),
    { onSuccess: () => { message.success('已拒绝'); queryClient.invalidateQueries(['leave-requests']) } }
  )

  const statusColor: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    cancelled: 'default'
  }

  const canReview = user?.role !== 'parent'

  const columns = [
    { title: '儿童', dataIndex: 'child_name' },
    {
      title: '类型',
      dataIndex: 'leave_type',
      render: (v: string, r: LeaveRequest) => r.leave_type_display
    },
    { title: '开始日期', dataIndex: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date' },
    { title: '天数', dataIndex: 'total_days', render: (v: number) => `${v}天` },
    { title: '请假原因', dataIndex: 'reason', ellipsis: true },
    { title: '提交人', dataIndex: 'submitted_by_name', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string, r: LeaveRequest) => <Tag color={statusColor[v]}>{r.status_display}</Tag>,
      width: 100
    },
    {
      title: '操作',
      width: canReview ? 160 : 100,
      render: (_, record: LeaveRequest) => (
        <Space>
          {canReview && record.status === 'pending' && (
            <>
              <Button
                type="text"
                icon={<CheckOutlined />}
                size="small"
                style={{ color: '#52c41a' }}
                onClick={() => approveMutation.mutate({ id: record.id })}
              >
                批准
              </Button>
              <Button
                type="text"
                icon={<CloseOutlined />}
                size="small"
                danger
                onClick={() => {
                  Modal.confirm({
                    title: '拒绝请假',
                    content: '请输入拒绝原因',
                    okText: '确认',
                    onOk: () => rejectMutation.mutate({ id: record.id, comment: '不符合要求' })
                  })
                }}
              >
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">请假管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/leave/create')}>
          提交请假
        </Button>
      </div>

      <Card className="filter-bar" bordered={false}>
        <Space wrap>
          <Input
            placeholder="搜索儿童姓名、原因"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            allowClear
          />
          <Select
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="pending">待审批</Select.Option>
            <Select.Option value="approved">已批准</Select.Option>
            <Select.Option value="rejected">已拒绝</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
          <Select
            placeholder="类型"
            style={{ width: 120 }}
            allowClear
            value={filters.leave_type}
            onChange={(v) => setFilters({ ...filters, leave_type: v })}
          >
            <Select.Option value="sick">病假</Select.Option>
            <Select.Option value="personal">事假</Select.Option>
            <Select.Option value="other">其他</Select.Option>
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

export default LeaveList
