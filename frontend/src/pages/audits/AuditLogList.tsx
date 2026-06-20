import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, DatePicker, Space } from 'antd'
import { auditApi, AuditLog } from '../../api/audits'
import { PaginatedResponse } from '../../api'

const AuditLogList: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<AuditLog>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (method?: string, status?: string, keyword?: string, createdFrom?: string, createdTo?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (method) params.method = method
      if (status) params.status = status
      if (keyword) params.search = keyword
      if (createdFrom) params.created_from = createdFrom
      if (createdTo) params.created_to = createdTo
      const res = await auditApi.list(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(
      values.method,
      values.status,
      values.keyword,
      values.created_range?.[0]?.toISOString(),
      values.created_range?.[1]?.toISOString(),
      1,
      pageSize
    )
  }

  const getMethodColor = (m: string) => {
    const map: Record<string, string> = { GET: 'green', POST: 'blue', PUT: 'orange', PATCH: 'cyan', DELETE: 'red' }
    return map[m] || 'default'
  }

  const getStatusColor = (s: number) => {
    if (s >= 500) return 'red'
    if (s >= 400) return 'orange'
    if (s >= 300) return 'cyan'
    return 'green'
  }

  const columns = [
    { title: '用户', dataIndex: 'username', width: 120 },
    { title: 'IP地址', dataIndex: 'ip_address', width: 140 },
    {
      title: '方法', dataIndex: 'method', width: 80,
      render: (v: string) => <Tag color={getMethodColor(v)}>{v}</Tag>
    },
    {
      title: '状态码', dataIndex: 'status_code', width: 90,
      render: (v: number) => <Tag color={getStatusColor(v)}>{v}</Tag>
    },
    { title: '耗时(ms)', dataIndex: 'duration_ms', width: 100, sorter: true },
    { title: '动作', dataIndex: 'action', width: 100 },
    { title: '资源类型', dataIndex: 'resource_type', width: 120 },
    { title: '资源ID', dataIndex: 'resource_id', width: 100 },
    { title: '路径', dataIndex: 'path', ellipsis: true, width: 200 },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>审计日志</h2>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索用户/动作/资源/路径" style={{ width: 220 }} allowClear />
          </Form.Item>
          <Form.Item name="method">
            <Select placeholder="请求方法" style={{ width: 110 }} allowClear>
              <Select.Option value="GET">GET</Select.Option>
              <Select.Option value="POST">POST</Select.Option>
              <Select.Option value="PUT">PUT</Select.Option>
              <Select.Option value="PATCH">PATCH</Select.Option>
              <Select.Option value="DELETE">DELETE</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 110 }} allowClear>
              <Select.Option value="success">成功(2xx/3xx)</Select.Option>
              <Select.Option value="error">错误(4xx/5xx)</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="created_range">
            <DatePicker.RangePicker showTime placeholder={['开始', '结束']} />
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
          scroll={{ x: 1600 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.method, values.status, values.keyword,
                values.created_range?.[0]?.toISOString(), values.created_range?.[1]?.toISOString(), p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>
    </div>
  )
}

export default AuditLogList
