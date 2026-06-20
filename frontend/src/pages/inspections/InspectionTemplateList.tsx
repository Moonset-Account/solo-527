import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Space, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { inspectionApi, InspectionTemplate } from '../../api/inspections'
import { PaginatedResponse } from '../../api'

const InspectionTemplateList: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<InspectionTemplate>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (isEnabled?: string, templateType?: string, keyword?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (isEnabled !== undefined && isEnabled !== '') params.is_enabled = isEnabled
      if (templateType) params.template_type = templateType
      if (keyword) params.search = keyword
      const res = await inspectionApi.templates(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(values.is_enabled, values.template_type, values.keyword, 1, pageSize)
  }

  const columns = [
    { title: '模板名称', dataIndex: 'name', width: 200 },
    { title: '模板编码', dataIndex: 'code', width: 160 },
    {
      title: '模板类型', dataIndex: 'template_type', width: 100,
      render: (_: any, r: InspectionTemplate) => r.template_type_display
    },
    { title: '巡检项数', dataIndex: 'items_count', width: 90 },
    {
      title: '是否启用', dataIndex: 'is_enabled', width: 90,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '已启用' : '已停用'}</Tag>
    },
    { title: '定时调度', dataIndex: 'cron_expression', width: 130 },
    { title: '超时(秒)', dataIndex: 'timeout_seconds', width: 90 },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    { title: '创建人', dataIndex: 'created_by_name', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
    {
      title: '操作',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, r: InspectionTemplate) => (
        <Space>
          <Button type="link" size="small" onClick={async () => {
            try { await inspectionApi.runTemplate(r.id); message.success('巡检任务已触发') } catch (e) {}
          }}>执行</Button>
          <Button type="link" size="small">编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={async () => {
            try { await inspectionApi.deleteTemplate(r.id); message.success('已删除'); loadData() } catch (e) {}
          }}>
            <Button type="link" size="small" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>巡检模板</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />}>新建模板</Button>
        </Space>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索名称/编码" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="template_type">
            <Select placeholder="模板类型" style={{ width: 120 }} allowClear>
              <Select.Option value="server">服务器巡检</Select.Option>
              <Select.Option value="database">数据库巡检</Select.Option>
              <Select.Option value="application">应用巡检</Select.Option>
              <Select.Option value="network">网络巡检</Select.Option>
              <Select.Option value="security">安全巡检</Select.Option>
              <Select.Option value="custom">自定义</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_enabled">
            <Select placeholder="启用状态" style={{ width: 120 }} allowClear>
              <Select.Option value="true">已启用</Select.Option>
              <Select.Option value="false">已停用</Select.Option>
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
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.is_enabled, values.template_type, values.keyword, p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>
    </div>
  )
}

export default InspectionTemplateList
