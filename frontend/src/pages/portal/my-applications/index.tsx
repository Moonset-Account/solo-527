import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Space, Card, Typography, Select, Input, Form } from 'antd'
import { EyeOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { application } from '@/api'
import { formatDate, formatMoney } from '@/utils'
import type { ExpenseApplication, ApplicationStatus, PageParams } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select

const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING: { text: '审批中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
}

const MyApplications: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ExpenseApplication[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [status, setStatus] = useState<string>('')
  const [keyword, setKeyword] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: PageParams & { status?: string; keyword?: string } = {
        ...pagination,
        ...(status ? { status } : {}),
        ...(keyword ? { keyword } : {})
      }
      const result = await application.list(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch applications failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, status, keyword])

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleReset = () => {
    setStatus('')
    setKeyword('')
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const columns: ColumnsType<ExpenseApplication> = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      width: 150,
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '费用类型',
      dataIndex: 'expenseType',
      key: 'expenseType',
      width: 100
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{formatMoney(amount)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ApplicationStatus) => {
        const { text, color } = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={color as any}>{text}</Tag>
      }
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeName',
      key: 'currentNodeName',
      width: 120,
      render: (text?: string) => text || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/portal/application-detail/${record.id}`)}
          >
            详情
          </Button>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              style={{ width: 150 }}
              value={status || undefined}
              onChange={value => setStatus(value || '')}
              allowClear
            >
              <Option value="DRAFT">草稿</Option>
              <Option value="PENDING">审批中</Option>
              <Option value="APPROVED">已通过</Option>
              <Option value="REJECTED">已拒绝</Option>
            </Select>
          </Form.Item>
          <Form.Item label="关键词">
            <Input
              placeholder="搜索标题/编号"
              style={{ width: 200 }}
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
            />
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
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>我的申请</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/portal/apply')}>
            新建申请
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>
    </div>
  )
}

export default MyApplications
