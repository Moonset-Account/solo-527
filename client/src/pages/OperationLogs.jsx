import React, { useState, useEffect } from 'react'
import {
  Table,
  Card,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  message
} from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

const OperationLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    operatorId: '',
    startDate: '',
    endDate: ''
  })
  const [users, setUsers] = useState([])
  const [searchForm] = Form.useForm()

  useEffect(() => {
    fetchUsers()
    fetchLogs()
  }, [pagination.current, pagination.pageSize])

  const fetchUsers = async () => {
    try {
      const res = await request.get('/users', { params: { pageSize: 100 } })
      setUsers(res.data.list)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(filters.action && { action: filters.action }),
        ...(filters.status && { status: filters.status }),
        ...(filters.operatorId && { operatorId: filters.operatorId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
      }
      const res = await request.get('/operation-logs', { params })
      setLogs(res.data.list)
      setPagination((prev) => ({ ...prev, total: res.data.total }))
    } catch (error) {
      console.error('获取操作日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const dateRange = values.dateRange
    setFilters({
      ...values,
      startDate: dateRange ? dayjs(dateRange[0]).format('YYYY-MM-DD') : '',
      endDate: dateRange ? dayjs(dateRange[1]).format('YYYY-MM-DD') : ''
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchLogs(), 0)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({
      action: '',
      status: '',
      operatorId: '',
      startDate: '',
      endDate: ''
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchLogs(), 0)
  }

  const columns = [
    {
      title: '操作类型',
      dataIndex: 'action',
      key: 'action',
      width: 150
    },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      key: 'operator',
      width: 100,
      render: (name, record) => name || record.operatorName
    },
    {
      title: '关联事件',
      dataIndex: ['event', 'title'],
      key: 'event',
      ellipsis: true,
      render: (title) => title || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 'SUCCESS' ? 'green' : 'red'}>
          {status === 'SUCCESS' ? '成功' : '失败'}
        </Tag>
      )
    },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      key: 'failureReason',
      ellipsis: true,
      render: (reason) => reason || '-'
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>操作日志</h2>

      <Card title="筛选条件" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="action" label="操作类型">
            <Input placeholder="请输入" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="operatorId" label="操作人">
            <Select placeholder="全部" style={{ width: 120 }} allowClear showSearch optionFilterProp="children">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 100 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILED">失败</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            }
          }}
        />
      </Card>
    </div>
  )
}

export default OperationLogs
