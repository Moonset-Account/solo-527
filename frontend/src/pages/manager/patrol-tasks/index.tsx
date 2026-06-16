import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Button, Space, Form } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getPatrolTaskList } from '@/api'
import type { PatrolTask, TaskStatus } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'orange' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' }
}

const PatrolTasks = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PatrolTask[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData(1, 10)
  }, [])

  const loadData = async (pageIndex?: number, pageSize?: number) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getPatrolTaskList({
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

  const columns = [
    {
      title: '任务编号',
      dataIndex: 'id',
      width: 100
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      ellipsis: true
    },
    {
      title: '所属网格',
      dataIndex: 'gridName',
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '计划日期',
      dataIndex: 'planDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>
      )
    },
    {
      title: '关联事件',
      dataIndex: 'relatedEventTitle',
      width: 150,
      render: (title?: string) => title || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right' as const,
      render: () => (
        <Space>
          <Button type="link">查看</Button>
        </Space>
      )
    }
  ]

  return (
    <Card title="巡查任务管理">
      <Form form={form} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="status">
          <Select placeholder="选择状态" allowClear style={{ width: 150 }}>
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.label}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="assigneeId">
          <Select placeholder="选择负责人" allowClear style={{ width: 150 }}>
          </Select>
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

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1000 }}
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

export default PatrolTasks
