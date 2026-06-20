import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, DatePicker, Space, Popconfirm, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { changeApi, ChangeWindow } from '../../api/changes'
import { PaginatedResponse } from '../../api'

const ChangeWindowList: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<ChangeWindow>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (status?: string, changeType?: string, keyword?: string, startFrom?: string, startTo?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (status) params.status = status
      if (changeType) params.change_type = changeType
      if (keyword) params.search = keyword
      if (startFrom) params.start_from = startFrom
      if (startTo) params.start_to = startTo
      const res = await changeApi.list(params)
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
      values.change_type,
      values.keyword,
      values.start_range?.[0]?.toISOString(),
      values.start_range?.[1]?.toISOString(),
      1,
      pageSize
    )
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold', approved: 'blue', rejected: 'red', in_progress: 'cyan',
      success: 'green', failed: 'red', cancelled: 'default'
    }
    return map[status] || 'default'
  }

  const getPriorityColor = (p: string) => {
    const map: Record<string, string> = { low: 'blue', medium: 'orange', high: 'red', urgent: 'magenta' }
    return map[p] || 'default'
  }

  const columns = [
    { title: '变更编号', dataIndex: 'code', width: 160 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    {
      title: '类型', dataIndex: 'change_type', width: 100,
      render: (_: any, r: ChangeWindow) => r.change_type_display
    },
    {
      title: '优先级', dataIndex: 'priority', width: 80,
      render: (v: string, r: ChangeWindow) => <Tag color={getPriorityColor(v)}>{r.priority_display}</Tag>
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string, r: ChangeWindow) => <Tag color={getStatusColor(v)}>{r.status_display}</Tag>
    },
    { title: '计划开始', dataIndex: 'planned_start', width: 160 },
    { title: '计划结束', dataIndex: 'planned_end', width: 160 },
    { title: '实施人', dataIndex: 'implementer_name', width: 100 },
    { title: '审批人', dataIndex: 'approver_name', width: 100 },
    {
      title: '操作',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, r: ChangeWindow) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/changes/${r.id}`)}>详情</Button>
          {r.status === 'pending' && (
            <>
              <Button type="link" size="small" onClick={async () => {
                try { await changeApi.approve(r.id); message.success('已批准'); loadData() } catch (e) {}
              }}>批准</Button>
              <Popconfirm title="确认拒绝此变更?" onConfirm={async () => {
                try { await changeApi.reject(r.id); message.success('已拒绝'); loadData() } catch (e) {}
              }}>
                <Button type="link" size="small" danger>拒绝</Button>
              </Popconfirm>
            </>
          )}
          {r.status === 'approved' && (
            <Button type="link" size="small" onClick={async () => {
              try { await changeApi.start(r.id); message.success('已开始'); loadData() } catch (e) {}
            }}>开始</Button>
          )}
          {r.status === 'in_progress' && (
            <>
              <Button type="link" size="small" onClick={async () => {
                try { await changeApi.complete(r.id, { is_failure: false, failure_reason: '' }); message.success('已完成'); loadData() } catch (e) {}
              }}>完成</Button>
              <Button type="link" size="small" danger onClick={async () => {
                const reason = window.prompt('请输入失败原因:')
                if (reason) {
                  try { await changeApi.complete(r.id, { is_failure: true, failure_reason: reason }); message.success('已标记失败'); loadData() } catch (e) {}
                }
              }}>标记失败</Button>
            </>
          )}
          {r.status === 'pending' && (
            <Popconfirm title="确认取消此变更?" onConfirm={async () => {
              try { await changeApi.cancel(r.id); message.success('已取消'); loadData() } catch (e) {}
            }}>
              <Button type="link" size="small">取消</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>变更窗口</h2>
        <Button type="primary" icon={<PlusOutlined />}>新建变更</Button>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索编号/标题" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Select.Option value="pending">待审批</Select.Option>
              <Select.Option value="approved">已批准</Select.Option>
              <Select.Option value="rejected">已拒绝</Select.Option>
              <Select.Option value="in_progress">进行中</Select.Option>
              <Select.Option value="success">成功</Select.Option>
              <Select.Option value="failed">失败</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="change_type">
            <Select placeholder="变更类型" style={{ width: 120 }} allowClear>
              <Select.Option value="emergency">紧急变更</Select.Option>
              <Select.Option value="standard">标准变更</Select.Option>
              <Select.Option value="normal">常规变更</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="start_range">
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
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.status, values.change_type, values.keyword,
                values.start_range?.[0]?.toISOString(), values.start_range?.[1]?.toISOString(), p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
          onRow={(r) => ({ onClick: () => navigate(`/changes/${r.id}`), style: { cursor: 'pointer' } })}
        />
      </div>
    </div>
  )
}

export default ChangeWindowList
