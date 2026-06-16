import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Button, Space, Form, message, Popconfirm } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { getTodoList, updateTodoStatus } from '@/api'
import type { TodoItem, TodoType, TodoStatus, PageParams } from '@/types'
import dayjs from 'dayjs'

const typeMap: Record<TodoType, { label: string; color: string }> = {
  event: { label: '事件处理', color: 'blue' },
  task: { label: '巡查任务', color: 'green' },
  review: { label: '整改复查', color: 'orange' },
  visit: { label: '随访回访', color: 'purple' }
}

const priorityMap = {
  high: { label: '高', color: 'red' },
  medium: { label: '中', color: 'orange' },
  low: { label: '低', color: 'green' }
}

const statusMap: Record<TodoStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  completed: { label: '已完成', color: 'green' }
}

const TodoList = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TodoItem[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData({ page: 1, pageSize: 10 })
  }, [])

  const loadData = async (params: PageParams) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getTodoList({ ...params, ...values })
      setData(res.data.list)
      setPagination({
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const handleReset = () => {
    form.resetFields()
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const handleComplete = async (id: number) => {
    try {
      await updateTodoStatus(id, 'completed')
      message.success('操作成功')
      loadData({ page: pagination.current, pageSize: pagination.pageSize })
    } catch {}
  }

  const columns = [
    {
      title: '待办编号',
      dataIndex: 'id',
      width: 100
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: TodoType) => (
        <Tag color={typeMap[type].color}>{typeMap[type].label}</Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={priorityMap[priority as keyof typeof priorityMap].color}>
          {priorityMap[priority as keyof typeof priorityMap].label}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: TodoStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'deadline',
      width: 170,
      render: (time?: string) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: TodoItem) => (
        <Space>
          {record.status === 'pending' && (
            <Popconfirm title="确认标记为已完成？" onConfirm={() => handleComplete(record.id)}>
              <Button type="link" icon={<CheckCircleOutlined />}>
                完成
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <Card title="待办列表">
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="type">
          <Select placeholder="选择类型" allowClear style={{ width: 150 }}>
            {Object.entries(typeMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="选择状态" allowClear style={{ width: 150 }}>
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="priority">
          <Select placeholder="选择优先级" allowClear style={{ width: 150 }}>
            {Object.entries(priorityMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" onClick={handleSearch}>搜索</Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1100 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData({ page, pageSize })
        }}
      />
    </Card>
  )
}

export default TodoList
