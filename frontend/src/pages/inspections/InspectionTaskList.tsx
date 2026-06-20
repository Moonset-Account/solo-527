import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Space, message, Progress, Popconfirm } from 'antd'
import { useNavigate } from 'react-router-dom'
import { inspectionApi, InspectionTask } from '../../api/inspections'
import { PaginatedResponse } from '../../api'

const InspectionTaskList: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<InspectionTask>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (status?: string, keyword?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (status) params.status = status
      if (keyword) params.search = keyword
      const res = await inspectionApi.tasks(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(values.status, values.keyword, 1, pageSize)
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold', running: 'cyan', success: 'green', failed: 'red', partial: 'orange', cancelled: 'default'
    }
    return map[status] || 'default'
  }

  const columns = [
    { title: '任务编号', dataIndex: 'code', width: 160 },
    { title: '任务名称', dataIndex: 'name', ellipsis: true },
    { title: '模板', dataIndex: 'template_name', width: 160 },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string, r: InspectionTask) => <Tag color={getStatusColor(v)}>{r.status_display}</Tag>
    },
    {
      title: '进度', width: 160,
      render: (_: any, r: InspectionTask) => {
        const total = r.total_count || 0
        const success = r.success_count || 0
        const failed = r.failed_count || 0
        const pct = total > 0 ? Math.round(((success + failed) / total) * 100) : 0
        return (
          <Space>
            <Progress percent={pct} size="small" />
            <span style={{ color: '#999', fontSize: 12 }}>{success}/{total}</span>
          </Space>
        )
      }
    },
    { title: '成功数', dataIndex: 'success_count', width: 80 },
    { title: '失败数', dataIndex: 'failed_count', width: 80 },
    { title: '超时', dataIndex: 'timeout_count', width: 80 },
    { title: '执行耗时', dataIndex: 'duration_seconds', width: 100, render: (v: number) => v ? `${v}s` : '-' },
    { title: '触发方式', width: 90, render: (_: any, r: InspectionTask) => r.trigger_type_display },
    { title: '执行人', dataIndex: 'executed_by_name', width: 100 },
    { title: '开始时间', dataIndex: 'started_at', width: 160 },
    { title: '结束时间', dataIndex: 'finished_at', width: 160 },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: InspectionTask) => (
        <Space>
          {['success', 'failed', 'partial', 'cancelled'].includes(r.status) && (
            <Button type="link" size="small" onClick={async () => {
              try { await inspectionApi.rerunTask(r.id); message.success('已重新执行'); loadData() } catch (e) {}
            }}>重跑</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>巡检任务</h2>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索编号/名称/模板" style={{ width: 220 }} allowClear />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Select.Option value="pending">待执行</Select.Option>
              <Select.Option value="running">执行中</Select.Option>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="partial">部分成功</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { form.resetFields(); loadData() }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-container">
        <Table
          loading={loading}
          columns={columns}
          dataSource={data.results}
          rowKey="id"
          scroll={{ x: 1700 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.status, values.keyword, p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>
    </div>
  )
}

export default InspectionTaskList
