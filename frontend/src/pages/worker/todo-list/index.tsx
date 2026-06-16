import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Button, Space, Form, message, Popconfirm } from 'antd'
import { CheckCircleOutlined } from '@ant-design/icons'
import { getTodoList, completeTodo } from '@/api'
import type { TodoItem, TodoType } from '@/types'
import dayjs from 'dayjs'

const typeMap: Record<TodoType, { label: string; color: string }> = {
  event_process: { label: '事件处理', color: 'blue' },
  patrol: { label: '巡查任务', color: 'green' },
  review: { label: '整改复查', color: 'orange' },
  follow_up: { label: '随访回访', color: 'purple' }
}

const TodoListPage = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<TodoItem[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData(1, 10)
  }, [])

  const loadData = async (pageIndex?: number, pageSize?: number) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getTodoList({
        pageIndex: pageIndex || pagination.current,
        pageSize: pageSize || pagination.pageSize,
        ...values
      })
      setData(res.items)
      setPagination({
        current: res.pageIndex,
        pageSize: res.pageSize,
        total: res.totalCount
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const handleReset = () => {
    form.resetFields()
    loadData(1, pagination.pageSize)
  }

  const handleComplete = async (id: number) => {
    try {
      await completeTodo(id)
      message.success('操作成功')
      loadData(pagination.current, pagination.pageSize)
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
        <Tag color={typeMap[type]?.color || 'default'}>{typeMap[type]?.label || type}</Tag>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'isCompleted',
      width: 100,
      render: (isCompleted: boolean) => (
        <Tag color={isCompleted ? 'green' : 'orange'}>
          {isCompleted ? '已完成' : '待处理'}
        </Tag>
      )
    },
    {
      title: '截止时间',
      dataIndex: 'dueDate',
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
          {!record.isCompleted && (
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
        <Form.Item name="isCompleted">
          <Select placeholder="选择状态" allowClear style={{ width: 150 }}>
            <Select.Option value={false}>待处理</Select.Option>
            <Select.Option value={true}>已完成</Select.Option>
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
        scroll={{ x: 900 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />
    </Card>
  )
}

export default TodoListPage
