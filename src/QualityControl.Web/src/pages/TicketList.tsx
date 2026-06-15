import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Card,
  Modal,
  Form,
  Statistic,
  Row,
  Col,
  Tooltip,
  message
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilterOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { ticketService } from '@/services/ticketService'
import type { Ticket, TicketQuery } from '@/types'
import { formatDateTime, getPriorityColor } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

export default function TicketList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Ticket[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<TicketQuery>({
    pageIndex: 1,
    pageSize: 20,
    sortDesc: true,
    sortBy: 'createdAt'
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    loadData()
    loadPendingCount()
  }, [query])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await ticketService.getTickets(query)
      if (res.success) {
        setData(res.data!.items)
        setTotal(res.data!.totalCount)
      }
    } catch (error) {
      console.error('加载工单列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPendingCount = async () => {
    try {
      const res = await ticketService.getPendingCount()
      if (res.success) {
        setPendingCount(res.data!)
      }
    } catch (error) {
      console.error('加载待处理工单数失败', error)
    }
  }

  const handleSearch = () => {
    setQuery({ ...query, pageIndex: 1 })
  }

  const handleReset = () => {
    setQuery({
      pageIndex: 1,
      pageSize: 20,
      sortDesc: true,
      sortBy: 'createdAt'
    })
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ ...query, pageIndex: page, pageSize })
  }

  const handleCreate = async (values: any) => {
    try {
      const res = await ticketService.createTicket({
        ...values,
        creatorId: 2
      })
      if (res.success) {
        message.success('工单创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        loadData()
        loadPendingCount()
      }
    } catch (error) {
      console.error('创建工单失败', error)
    }
  }

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: 'warning',
      1: 'processing',
      2: 'default',
      3: 'success',
      4: 'default',
      5: 'warning'
    }
    return colors[status] || 'default'
  }

  const getTypeColor = (type: number) => {
    const colors: Record<number, string> = {
      0: 'red',
      1: 'orange',
      2: 'blue',
      3: 'purple',
      4: 'cyan',
      5: 'default'
    }
    return colors[type] || 'default'
  }

  const columns = [
    {
      title: '工单编号',
      dataIndex: 'ticketNumber',
      key: 'ticketNumber',
      width: 140,
      render: (text: string, record: Ticket) => (
        <a onClick={() => navigate(`/tickets/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '类型',
      dataIndex: 'typeText',
      key: 'type',
      width: 100,
      render: (text: string, record: Ticket) => (
        <Tag color={getTypeColor(record.type)}>{text}</Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      render: (text: string, record: Ticket) => (
        <div>
          {record.priority === 3 && (
            <Tooltip title="紧急优先级">
              <ExclamationCircleOutlined style={{ color: '#f5222d', marginRight: 4 }} />
            </Tooltip>
          )}
          {text}
        </div>
      )
    },
    {
      title: '优先级',
      dataIndex: 'priorityText',
      key: 'priority',
      width: 80,
      render: (text: string, record: Ticket) => (
        <span style={{ color: getPriorityColor(record.priority), fontWeight: 500 }}>
          {text}
        </span>
      ),
      sorter: true
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'status',
      width: 90,
      render: (text: string, record: Ticket) => (
        <Tag color={getStatusColor(record.status)}>{text}</Tag>
      )
    },
    {
      title: '处理部门',
      dataIndex: 'assigneeDepartmentName',
      key: 'assigneeDepartmentId',
      width: 100
    },
    {
      title: '处理人',
      dataIndex: 'assigneeName',
      key: 'assigneeId',
      width: 100
    },
    {
      title: '关联会话',
      dataIndex: 'relatedSessionNumber',
      key: 'relatedSessionId',
      width: 120,
      render: (text: string, record: Ticket) => (
        record.relatedSessionId ? (
          <a onClick={() => navigate(`/sessions/${record.relatedSessionId}`)}>
            {text || '查看'}
          </a>
        ) : '-'
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => formatDateTime(text),
      sorter: true
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 160,
      render: (text?: string) => {
        if (!text) return '-'
        const isOverdue = dayjs(text).isBefore(dayjs())
        return (
          <span style={{ color: isOverdue ? '#f5222d' : undefined }}>
            {formatDateTime(text)}
            {isOverdue && ' (已逾期)'}
          </span>
        )
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Ticket) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/tickets/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small">处理</Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">工单协同</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            创建工单
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="待处理"
              value={pendingCount}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="处理中"
              value={0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="已解决"
              value={0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="已逾期"
              value={0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" bordered={false}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item label="关键词">
            <Input
              placeholder="搜索工单标题或描述"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
              value={query.keyword}
              onChange={(e) => setQuery({ ...query, keyword: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="类型">
            <Select
              placeholder="全部类型"
              allowClear
              style={{ width: 120 }}
              value={query.type}
              onChange={(v) => setQuery({ ...query, type: v })}
            >
              <Option value={0}>质量问题</Option>
              <Option value={1}>服务投诉</Option>
              <Option value={2}>知识需求</Option>
              <Option value={3}>系统缺陷</Option>
              <Option value={4}>功能需求</Option>
              <Option value={5}>其他</Option>
            </Select>
          </Form.Item>
          <Form.Item label="优先级">
            <Select
              placeholder="全部优先级"
              allowClear
              style={{ width: 100 }}
              value={query.priority}
              onChange={(v) => setQuery({ ...query, priority: v })}
            >
              <Option value={0}>低</Option>
              <Option value={1}>中</Option>
              <Option value={2}>高</Option>
              <Option value={3}>紧急</Option>
            </Select>
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 100 }}
              value={query.status}
              onChange={(v) => setQuery({ ...query, status: v })}
            >
              <Option value={0}>待处理</Option>
              <Option value={1}>处理中</Option>
              <Option value={2}>待确认</Option>
              <Option value={3}>已解决</Option>
              <Option value={4}>已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item label="处理部门">
            <Select
              placeholder="全部部门"
              allowClear
              style={{ width: 120 }}
              value={query.assigneeDepartmentId}
              onChange={(v) => setQuery({ ...query, assigneeDepartmentId: v })}
            >
              <Option value={1}>客服一部</Option>
              <Option value={2}>客服二部</Option>
              <Option value={3}>质检部</Option>
              <Option value={4}>技术支持部</Option>
            </Select>
          </Form.Item>
          <Form.Item label="时间范围">
            <RangePicker
              showTime
              style={{ width: 320 }}
              value={query.startTime && query.endTime ? [dayjs(query.startTime), dayjs(query.endTime)] : undefined}
              onChange={(dates) => setQuery({
                ...query,
                startTime: dates?.[0]?.toISOString(),
                endTime: dates?.[1]?.toISOString()
              })}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Space>
              <Button icon={<FilterOutlined />}>高级筛选</Button>
              <Button icon={<FileTextOutlined />}>批量导出</Button>
            </Space>
          </div>
          <div className="table-toolbar-right">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange
          }}
        />
      </Card>

      <Modal
        title="创建工单"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="工单类型"
                name="type"
                rules={[{ required: true, message: '请选择工单类型' }]}
              >
                <Select placeholder="请选择工单类型">
                  <Option value={0}>质量问题</Option>
                  <Option value={1}>服务投诉</Option>
                  <Option value={2}>知识需求</Option>
                  <Option value={3}>系统缺陷</Option>
                  <Option value={4}>功能需求</Option>
                  <Option value={5}>其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="优先级"
                name="priority"
                rules={[{ required: true, message: '请选择优先级' }]}
              >
                <Select placeholder="请选择优先级">
                  <Option value={0}>低</Option>
                  <Option value={1}>中</Option>
                  <Option value={2}>高</Option>
                  <Option value={3}>紧急</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="工单标题"
            name="title"
            rules={[{ required: true, message: '请输入工单标题' }]}
          >
            <Input placeholder="请简要描述问题" maxLength={200} />
          </Form.Item>
          <Form.Item
            label="详细描述"
            name="description"
            rules={[{ required: true, message: '请输入详细描述' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细描述问题或需求" maxLength={2000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="处理部门"
                name="assigneeDepartmentId"
                rules={[{ required: true, message: '请选择处理部门' }]}
              >
                <Select placeholder="请选择处理部门">
                  <Option value={1}>客服一部</Option>
                  <Option value={2}>客服二部</Option>
                  <Option value={3}>质检部</Option>
                  <Option value={4}>技术支持部</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="处理人"
                name="assigneeId"
              >
                <Select placeholder="可选，指定具体处理人" allowClear>
                  <Option value={3}>李客服</Option>
                  <Option value={4}>王客服</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="截止时间"
            name="dueDate"
          >
            <DatePicker showTime style={{ width: '100%' }} placeholder="请选择截止时间" />
          </Form.Item>
          <Form.Item
            label="标签"
            name="tags"
          >
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

