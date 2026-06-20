import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Progress, Space } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { assetApi, ServerAsset } from '../../api/assets'
import { PaginatedResponse } from '../../api'

const AssetList: React.FC = () => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<ServerAsset>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (status?: string, serverType?: string, keyword?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (status) params.status = status
      if (serverType) params.server_type = serverType
      if (keyword) params.search = keyword
      const res = await assetApi.list(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(values.status, values.server_type, values.keyword, 1, pageSize)
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      normal: 'green', warning: 'orange', critical: 'red', offline: 'default', maintenance: 'purple'
    }
    return map[status] || 'default'
  }

  const getUsageColor = (v: number) => {
    if (v >= 90) return 'exception'
    if (v >= 70) return 'normal'
    return 'success'
  }

  const columns = [
    { title: '服务器名称', dataIndex: 'name', width: 160 },
    { title: 'IP地址', dataIndex: 'ip_address', width: 130 },
    { title: '主机名', dataIndex: 'hostname', width: 140 },
    {
      title: '类型', dataIndex: 'server_type', width: 90,
      render: (v: string, r: ServerAsset) => r.server_type_display
    },
    {
      title: '状态', dataIndex: 'status', width: 90,
      render: (v: string, r: ServerAsset) => <Tag color={getStatusColor(v)}>{r.status_display}</Tag>
    },
    {
      title: 'CPU使用率', width: 140,
      render: (_: any, r: ServerAsset) => <Progress percent={Math.round(r.cpu_usage)} size="small" status={getUsageColor(r.cpu_usage)} />
    },
    {
      title: '内存使用率', width: 140,
      render: (_: any, r: ServerAsset) => <Progress percent={Math.round(r.memory_usage)} size="small" status={getUsageColor(r.memory_usage)} />
    },
    {
      title: '磁盘使用率', width: 140,
      render: (_: any, r: ServerAsset) => <Progress percent={Math.round(r.disk_usage)} size="small" status={getUsageColor(r.disk_usage)} />
    },
    { title: '负责人', dataIndex: 'responsible_name', width: 100 },
    { title: '标签', dataIndex: 'tags', width: 120, ellipsis: true },
    { title: '最后检测', dataIndex: 'last_check_time', width: 160 },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>资产管理</h2>
        <Button type="primary" icon={<PlusOutlined />}>新增资产</Button>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索名称/IP/主机名" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="status">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="warning">告警</Select.Option>
              <Select.Option value="critical">严重</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
              <Select.Option value="maintenance">维护中</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="server_type">
            <Select placeholder="服务器类型" style={{ width: 120 }} allowClear>
              <Select.Option value="physical">物理机</Select.Option>
              <Select.Option value="virtual">虚拟机</Select.Option>
              <Select.Option value="container">容器</Select.Option>
              <Select.Option value="cloud">云主机</Select.Option>
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
          scroll={{ x: 1500 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.status, values.server_type, values.keyword, p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>
    </div>
  )
}

export default AssetList
