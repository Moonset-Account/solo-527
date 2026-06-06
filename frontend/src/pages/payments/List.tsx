import React from 'react'
import { Card, Table, Tag, Input, Select, Button, Space, Modal, message, Statistic, Row, Col } from 'antd'
import { SearchOutlined, PlusOutlined, CheckCircleOutlined, BellOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { paymentApi } from '@/services/index'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import type { Invoice } from '@/types'

const Payments = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [filters, setFilters] = React.useState({
    search: '',
    status: undefined as string | undefined,
    item: undefined as number | undefined
  })

  const { data: invoices, isLoading } = useQuery(
    ['invoices', filters],
    () => {
      const params: any = { ordering: '-bill_date' }
      if (filters.search) params.search = filters.search
      if (filters.status) params.status = filters.status
      if (filters.item) params.item = filters.item
      return paymentApi.getInvoices(params).then((res) => res.data.results)
    }
  )

  const { data: stats } = useQuery(
    ['payment-stats'],
    () => paymentApi.getStatistics().then((res) => res.data),
    { enabled: user?.role !== 'parent' }
  )

  const { data: items } = useQuery(
    ['payment-items'],
    () => paymentApi.getItems().then((res) => res.data.results)
  )

  const markPaidMutation = useMutation(
    ({ id, amount }: { id: number; amount: number }) => paymentApi.markPaid(id, { amount }),
    { onSuccess: () => { message.success('已标记为已缴费'); queryClient.invalidateQueries(['invoices']) } }
  )

  const reminderMutation = useMutation(
    (id: number) => paymentApi.sendReminder(id),
    { onSuccess: () => { message.success('提醒已发送'); queryClient.invalidateQueries(['invoices']) } }
  )

  const statusColor: Record<string, string> = {
    pending: 'orange',
    paid: 'green',
    overdue: 'red',
    cancelled: 'default',
    refunded: 'blue'
  }

  const canManage = user?.role !== 'parent'

  const columns = [
    { title: '儿童', dataIndex: 'child_name' },
    { title: '收费项目', dataIndex: 'item_name' },
    { title: '金额', dataIndex: 'amount', render: (v: number) => `¥${v}` },
    { title: '已缴', dataIndex: 'paid_amount', render: (v: number) => `¥${v}` },
    {
      title: '待缴',
      dataIndex: 'remaining_amount',
      render: (v: number) => <span style={{ color: v > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 500 }}>¥{v}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (v: string, r: Invoice) => <Tag color={statusColor[v]}>{r.status_display}</Tag>,
      width: 100
    },
    { title: '账单日期', dataIndex: 'bill_date', width: 110 },
    { title: '到期日期', dataIndex: 'due_date', width: 110 },
    {
      title: '操作',
      width: canManage ? 180 : 80,
      render: (_, record: Invoice) => (
        <Space>
          {canManage && record.status !== 'paid' && (
            <>
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                size="small"
                style={{ color: '#52c41a' }}
                onClick={() => {
                  Modal.confirm({
                    title: '确认缴费',
                    content: `确认收到 ¥${record.remaining_amount} 吗？`,
                    onOk: () => markPaidMutation.mutate({ id: record.id, amount: record.remaining_amount })
                  })
                }}
              >
                缴费
              </Button>
              <Button
                type="text"
                icon={<BellOutlined />}
                size="small"
                onClick={() => reminderMutation.mutate(record.id)}
              >
                提醒
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
        <h2 className="page-title">缴费管理</h2>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/payments/create')}>
            创建账单
          </Button>
        )}
      </div>

      {stats && canManage && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title="待缴费" value={stats.pending_count} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title="已逾期" value={stats.overdue_count} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title="应收金额" prefix="¥" value={stats.total_receivable || 0} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card className="stat-card">
              <Statistic title="已收金额" prefix="¥" value={stats.paid_amount || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
        </Row>
      )}

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
            placeholder="状态"
            style={{ width: 120 }}
            allowClear
            value={filters.status}
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Select.Option value="pending">待缴费</Select.Option>
            <Select.Option value="paid">已缴费</Select.Option>
            <Select.Option value="overdue">已逾期</Select.Option>
          </Select>
          <Select
            placeholder="收费项目"
            style={{ width: 150 }}
            allowClear
            value={filters.item}
            onChange={(v) => setFilters({ ...filters, item: v })}
          >
            {items?.map((item: any) => (
              <Select.Option key={item.id} value={item.id}>{item.name}</Select.Option>
            ))}
          </Select>
        </Space>
      </Card>

      <Card className="table-container" bordered={false}>
        <Table
          dataSource={invoices}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  )
}

export default Payments
