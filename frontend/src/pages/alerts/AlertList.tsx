import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, DatePicker, Space, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { alertApi, Alert } from '../../api/alerts'
import { assetApi } from '../../api/assets'
import { dictionaryApi } from '../../api/dictionaries'
import { PaginatedResponse } from '../../api'

const AlertList: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<Alert>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [servers, setServers] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  useEffect(() => {
    loadSelectOptions()
    const status = searchParams.get('status')
    const level = searchParams.get('level')
    if (status || level) {
      form.setFieldsValue({ status, level })
    }
    loadData(status || undefined, level || undefined)
  }, [])

  const loadSelectOptions = async () => {
    try {
      const [serversRes, categoriesRes] = await Promise.all([
        assetApi.list({ page_size: 100 }),
        dictionaryApi.getByCode('alert_category'),
      ])
      setServers(serversRes.results.map(s => ({ label: `${s.name}(${s.ip_address})`, value: s.id })))
      setCategories(categoriesRes.map(c => ({ label: c.name, value: c.id })))
    } catch (e) {}
  }

  const loadData = async (status?: string, level?: string, source?: string, server?: number, keyword?: string, occurredFrom?: string, occurredTo?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-occurred_at' }
      if (status) params.status = status
      if (level) params.level = level
      if (source) params.source = source
      if (server) params.server = server
      if (keyword) params.search = keyword
      if (occurredFrom) params.occurred_from = occurredFrom
      if (occurredTo) params.occurred_to = occurredTo
      const res = await alertApi.list(params)
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
      values.status,
      values.level,
      values.source,
      values.server,
      values.keyword,
      values.occurred_range?.[0]?.toISOString(),
      values.occurred_range?.[1]?.toISOString(),
      1,
      pageSize
    )
  }

  const onReset = () => {
    form.resetFields()
    loadData(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1, pageSize)
  }

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = { info: 'blue', warning: 'orange', critical: 'red', emergency: 'magenta' }
    return map[level] || 'default'
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { pending: 'gold', acknowledged: 'blue', processing: 'cyan', closed: 'green' }
    return map[status] || 'default'
  }

  const getSourceColor = (source: string) => {
    const map: Record<string, string> = { auto: 'blue', manual: 'purple', inspection: 'green' }
    return map[source] || 'default'
  }

  const columns = [
    { title: '告警编号', dataIndex: 'code', width: 160 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '来源', dataIndex: 'source', width: 100, render: (v: string, r: Alert) => <Tag color={getSourceColor(v)}>{r.source_display}</Tag> },
    { title: '级别', dataIndex: 'level', width: 80, render: (v: string, r: Alert) => <Tag color={getLevelColor(v)}>{r.level_display}</Tag> },
    { title: '状态', dataIndex: 'status', width: 90, render: (v: string, r: Alert) => <Tag color={getStatusColor(v)}>{r.status_display}</Tag> },
    { title: '服务器', width: 150, render: (_: any, r: Alert) => r.server_ip ? `${r.server_name}(${r.server_ip})` : '-' },
    { title: '处理人', dataIndex: 'handler_name', width: 100 },
    { title: '发生时间', dataIndex: 'occurred_at', width: 160 },
    {
      title: '操作',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, r: Alert) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/alerts/${r.id}`)}>详情</Button>
          {r.status === 'pending' && (
            <Popconfirm title="确认处理此告警?" onConfirm={async () => {
              try { await alertApi.acknowledge(r.id); message.success('已确认'); loadData() } catch (e) {}
            }}>
              <Button type="link" size="small">确认</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>告警管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => {}}>新增告警</Button>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索标题/编号/内容" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="处理状态" style={{ width: 130 }} allowClear>
              <Select.Option value="pending">待处理</Select.Option>
              <Select.Option value="acknowledged">已确认</Select.Option>
              <Select.Option value="processing">处理中</Select.Option>
              <Select.Option value="closed">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="level">
            <Select placeholder="告警级别" style={{ width: 110 }} allowClear>
              <Select.Option value="info">提示</Select.Option>
              <Select.Option value="warning">告警</Select.Option>
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="emergency">紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="source">
            <Select placeholder="来源" style={{ width: 110 }} allowClear>
              <Select.Option value="auto">自动检测</Select.Option>
              <Select.Option value="manual">人工录入</Select.Option>
              <Select.Option value="inspection">巡检发现</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="server">
            <Select placeholder="服务器" style={{ width: 180 }} allowClear options={servers} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="occurred_range">
            <DatePicker.RangePicker showTime placeholder={['开始时间', '结束时间']} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={onReset}>重置</Button>
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
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(
                values.status, values.level, values.source, values.server, values.keyword,
                values.occurred_range?.[0]?.toISOString(), values.occurred_range?.[1]?.toISOString(), p, ps
              )
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
          onRow={(r) => ({ onClick: () => navigate(`/alerts/${r.id}`), style: { cursor: 'pointer' } })}
        />
      </div>
    </div>
  )
}

export default AlertList
