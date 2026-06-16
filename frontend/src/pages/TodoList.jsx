import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { todoAPI } from '../services/api.js'
import FilterSaver from '../components/FilterSaver.jsx'

const { Option } = Select
const { TextArea } = Input

function TodoList({ onRefresh }) {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', priority: '', keyword: '' })
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingRecord, setEditingRecord] = useState(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await todoAPI.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      })
      setData(result.list)
      setStats(result.stats)
      setPagination(p => ({ ...p, total: result.total }))
      onRefresh?.()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleApplySavedFilter = (filterData) => {
    setFilters(filterData)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue({
      title: record.title,
      description: record.description,
      priority: record.priority,
      status: record.status
    })
    setModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      if (editingRecord) {
        await todoAPI.update(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await todoAPI.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await todoAPI.remove(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const statusMap = {
    PENDING: { color: 'orange', text: '待处理', icon: <ClockCircleOutlined /> },
    IN_PROGRESS: { color: 'blue', text: '进行中', icon: <ExclamationCircleOutlined /> },
    DONE: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
    OVERDUE: { color: 'red', text: '已超时', icon: <ExclamationCircleOutlined /> }
  }

  const priorityMap = {
    LOW: { color: 'default', text: '低' },
    MEDIUM: { color: 'blue', text: '中' },
    HIGH: { color: 'orange', text: '高' },
    URGENT: { color: 'red', text: '紧急' }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (text, record) => (
        <Space>
          {record.isOverdue && <Badge status="error" text="超时" />}
          <span>{text}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (s) => {
        const info = statusMap[s] || { color: 'default', text: s }
        return <Tag color={info.color}>{info.icon} {info.text}</Tag>
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 80,
      render: (p) => {
        const info = priorityMap[p] || { color: 'default', text: p }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '截止日期',
      dataIndex: 'dueDate',
      width: 160,
      render: (d) => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>待办事项</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建待办
        </Button>
      </div>

      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={5}>
            <Card>
              <Statistic title="全部" value={stats.total} />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic title="待处理" value={stats.pending} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic title="进行中" value={stats.inProgress} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col span={5}>
            <Card>
              <Statistic title="已超时" value={stats.overdue} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col span={4}>
            <Card>
              <Statistic title="已完成" value={stats.done} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
        </Row>
      )}

      <div className="filter-section">
        <Space wrap>
          <Input
            placeholder="搜索待办标题"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={filters.status || undefined}
            onChange={(v) => handleFilterChange('status', v)}
          >
            <Option value="PENDING">待处理</Option>
            <Option value="IN_PROGRESS">进行中</Option>
            <Option value="DONE">已完成</Option>
            <Option value="OVERDUE">已超时</Option>
          </Select>
          <Select
            placeholder="优先级"
            style={{ width: 120 }}
            allowClear
            value={filters.priority || undefined}
            onChange={(v) => handleFilterChange('priority', v)}
          >
            <Option value="LOW">低</Option>
            <Option value="MEDIUM">中</Option>
            <Option value="HIGH">高</Option>
            <Option value="URGENT">紧急</Option>
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <FilterSaver
            pageKey="todos"
            filterData={filters}
            onApply={handleApplySavedFilter}
          />
        </Space>
      </div>

      <div className="table-container">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
          }}
        />
      </div>

      <Modal
        title={editingRecord ? '编辑待办' : '新建待办'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入待办标题" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入待办描述" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="priority" label="优先级" initialValue="MEDIUM">
                <Select>
                  <Option value="LOW">低</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="URGENT">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态" initialValue="PENDING">
                <Select>
                  <Option value="PENDING">待处理</Option>
                  <Option value="IN_PROGRESS">进行中</Option>
                  <Option value="DONE">已完成</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              {editingRecord ? '保存' : '创建'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TodoList
