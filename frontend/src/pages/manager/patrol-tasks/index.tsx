import { useState, useEffect } from 'react'
import { Card, Table, Tag, Select, Button, Space, Form, Progress } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { getPatrolTaskList } from '@/api'
import type { PatrolTask, TaskStatus, PageParams } from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'orange' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' },
  expired: { label: '已超时', color: 'red' }
}

const PatrolTasks = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PatrolTask[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  useEffect(() => {
    loadData({ page: 1, pageSize: 10 })
  }, [])

  const loadData = async (params: PageParams) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await getPatrolTaskList({ ...params, ...values })
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

  const getProgress = (record: PatrolTask) => {
    const start = dayjs(record.startTime)
    const end = dayjs(record.endTime)
    const now = dayjs()
    if (record.status === 'completed') return 100
    if (now.isBefore(start)) return 0
    if (now.isAfter(end)) return 100
    const total = end.diff(start, 'minute')
    const passed = now.diff(start, 'minute')
    return Math.min(100, Math.round((passed / total) * 100))
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
      title: '巡查区域',
      dataIndex: 'area',
      width: 150
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: TaskStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      width: 200,
      render: (_: any, record: PatrolTask) => (
        <Progress
          percent={getProgress(record)}
          size="small"
          status={record.status === 'expired' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
        />
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
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
        <Form.Item name="keyword">
          <Select
            placeholder="搜索标题/区域"
            allowClear
            style={{ width: 200 }}
            showSearch
            optionFilterProp="label"
            options={[]}
          />
        </Form.Item>
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
        scroll={{ x: 1200 }}
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

export default PatrolTasks
