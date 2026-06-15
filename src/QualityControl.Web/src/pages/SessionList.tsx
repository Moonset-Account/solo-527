import { useState, useEffect } from 'react'
import { Table, Button, Space, Input, Select, DatePicker, Tag, Card, Modal, Form, InputNumber, Upload, message } from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  AuditOutlined,
  PlusOutlined,
  ExportOutlined,
  FilterOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { sessionService } from '@/services/sessionService'
import type { Session, SessionQuery } from '@/types'
import { formatDateTime, formatDuration, downloadFile } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

export default function SessionList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<SessionQuery>({
    pageIndex: 1,
    pageSize: 20,
    sortDesc: true,
    sortBy: 'createdAt'
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [exportModalVisible, setExportModalVisible] = useState(false)
  const [exportForm] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [query])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await sessionService.getSessions(query)
      if (res.success) {
        setData(res.data!.items)
        setTotal(res.data!.totalCount)
      }
    } catch (error) {
      console.error('加载会话列表失败', error)
    } finally {
      setLoading(false)
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
      const res = await sessionService.createSession({
        ...values,
        channel: 'web'
      })
      if (res.success) {
        message.success('会话创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        loadData()
      }
    } catch (error) {
      console.error('创建会话失败', error)
    }
  }

  const handleExport = async (values: any) => {
    try {
      const exportData = {
        ...values,
        startTime: values.timeRange?.[0]?.toISOString(),
        endTime: values.timeRange?.[1]?.toISOString(),
      }
      delete exportData.timeRange

      const blob = await sessionService.exportSessions(exportData)
      downloadFile(blob, `会话记录_${dayjs().format('YYYYMMDDHHmmss')}.csv`)
      message.success('导出成功')
      setExportModalVisible(false)
    } catch (error) {
      console.error('导出失败', error)
    }
  }

  const columns = [
    {
      title: '会话编号',
      dataIndex: 'sessionNumber',
      key: 'sessionNumber',
      width: 140,
      fixed: 'left' as const,
      render: (text: string, record: Session) => (
        <a onClick={() => navigate(`/sessions/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 200
    },
    {
      title: '客服人员',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'status',
      width: 90,
      render: (text: string) => (
        <Tag color="blue">{text}</Tag>
      )
    },
    {
      title: '渠道',
      dataIndex: 'channel',
      key: 'channel',
      width: 80
    },
    {
      title: '响应时长',
      dataIndex: 'responseTimeDisplay',
      key: 'responseTimeSeconds',
      width: 100,
      render: (text: string, record: Session) => (
        text || <Tag color="red">未响应</Tag>
      ),
      sorter: true
    },
    {
      title: '质检状态',
      key: 'inspectionStatus',
      width: 100,
      render: (_: any, record: Session) => (
        record.isInspected ? (
          <Tag color="green">已质检</Tag>
        ) : (
          <Tag color="orange">待质检</Tag>
        )
      )
    },
    {
      title: '质检分数',
      dataIndex: 'inspectionScore',
      key: 'inspectionScore',
      width: 100,
      render: (score?: number) => (
        score ? (
          <span style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#faad14' : '#f5222d', fontWeight: 600 }}>
            {score.toFixed(1)}分
          </span>
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
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Session) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/sessions/${record.id}`)}>
            查看
          </Button>
          {!record.isInspected && (
            <Button
              type="link"
              size="small"
              icon={<AuditOutlined />}
              onClick={() => navigate(`/inspections/new/${record.id}`)}
            >
              质检
            </Button>
          )}
          {record.relatedTicketId && (
            <Button
              type="link"
              size="small"
              onClick={() => navigate(`/tickets/${record.relatedTicketId}`)}
            >
              工单
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">会话管理</h1>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建会话
          </Button>
          <Button icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)}>
            导出
          </Button>
        </Space>
      </div>

      <Card className="filter-card" bordered={false}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item label="关键词">
            <Input
              placeholder="搜索标题或描述"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 200 }}
              value={query.keyword}
              onChange={(e) => setQuery({ ...query, keyword: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="状态">
            <Select
              placeholder="全部状态"
              allowClear
              style={{ width: 120 }}
              value={query.status}
              onChange={(v) => setQuery({ ...query, status: v })}
            >
              <Option value={0}>待处理</Option>
              <Option value={1}>处理中</Option>
              <Option value={2}>待客户回复</Option>
              <Option value={3}>已解决</Option>
              <Option value={4}>已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item label="质检状态">
            <Select
              placeholder="全部"
              allowClear
              style={{ width: 120 }}
              value={query.isInspected}
              onChange={(v) => setQuery({ ...query, isInspected: v })}
            >
              <Option value={true}>已质检</Option>
              <Option value={false}>待质检</Option>
            </Select>
          </Form.Item>
          <Form.Item label="时间范围">
            <RangePicker
              showTime
              style={{ width: 360 }}
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
          scroll={{ x: 1200 }}
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
        title="新建会话"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="客户"
            name="customerId"
            rules={[{ required: true, message: '请选择客户' }]}
          >
            <Select placeholder="请选择客户">
              <Option value={1}>北京科技公司</Option>
              <Option value={2}>上海贸易公司</Option>
              <Option value={3}>广州制造集团</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="客服人员"
            name="agentId"
            rules={[{ required: true, message: '请选择客服人员' }]}
          >
            <Select placeholder="请选择客服人员">
              <Option value={3}>李客服</Option>
              <Option value={4}>王客服</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="问题标题"
            name="title"
            rules={[{ required: true, message: '请输入问题标题' }]}
          >
            <Input placeholder="请输入问题标题" maxLength={200} />
          </Form.Item>
          <Form.Item
            label="问题描述"
            name="problemDescription"
          >
            <Input.TextArea rows={4} placeholder="请详细描述问题" maxLength={2000} />
          </Form.Item>
          <Form.Item
            label="初始消息"
            name="initialMessage"
          >
            <Input.TextArea rows={3} placeholder="客户初始消息内容" />
          </Form.Item>
          <Form.Item
            label="标签"
            name="tags"
          >
            <Input placeholder="多个标签用逗号分隔" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="导出场馆数据"
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={exportForm}
          layout="vertical"
          onFinish={handleExport}
        >
          <Form.Item label="客服人员" name="agentId">
            <Select placeholder="全部客服" allowClear>
              <Option value={3}>李客服</Option>
              <Option value={4}>王客服</Option>
            </Select>
          </Form.Item>
          <Form.Item label="会话状态" name="status">
            <Select placeholder="全部状态" allowClear>
              <Option value={3}>已解决</Option>
              <Option value={4}>已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item label="时间范围" name="timeRange">
            <RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="响应时长（秒）" name="responseTime">
            <Input.Group compact>
              <Form.Item name="minResponseTime" noStyle>
                <InputNumber style={{ width: '45%' }} placeholder="最小值" min={0} />
              </Form.Item>
              <Input
                style={{ width: '10%', textAlign: 'center', borderLeft: 0, borderRight: 0, pointerEvents: 'none' }}
                placeholder="~"
                disabled
              />
              <Form.Item name="maxResponseTime" noStyle>
                <InputNumber style={{ width: '45%' }} placeholder="最大值" min={0} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" icon={<ExportOutlined />}>
                导出 CSV
              </Button>
              <Button onClick={() => setExportModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
