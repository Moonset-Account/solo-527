import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Switch, Space, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { notificationApi, NotificationRule } from '../../api/notifications'
import { PaginatedResponse } from '../../api'

const NotificationRuleList: React.FC = () => {
  const [form] = Form.useForm()
  const [ruleForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<NotificationRule>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (eventType?: string, isEnabled?: string, keyword?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-created_at' }
      if (eventType) params.event_type = eventType
      if (isEnabled !== undefined && isEnabled !== '') params.is_enabled = isEnabled
      if (keyword) params.search = keyword
      const res = await notificationApi.rules(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(values.event_type, values.is_enabled, values.keyword, 1, pageSize)
  }

  const handleOpenModal = (rule?: NotificationRule) => {
    setEditingRule(rule || null)
    ruleForm.setFieldsValue({
      name: rule?.name || '',
      event_type: rule?.event_type || 'alert_created',
      severity_level: rule?.severity_level || '',
      channels: rule?.channels || ['in_app'],
      recipients: rule?.recipients || [],
      is_enabled: rule?.is_enabled ?? true,
      description: rule?.description || '',
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await ruleForm.validateFields()
      if (editingRule) {
        await notificationApi.updateRule(editingRule.id, values)
        message.success('更新成功')
      } else {
        await notificationApi.createRule(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleToggle = async (rule: NotificationRule, checked: boolean) => {
    try {
      await notificationApi.updateRule(rule.id, { is_enabled: checked })
      message.success(checked ? '已启用' : '已停用')
      loadData()
    } catch (e) {}
  }

  const columns = [
    { title: '规则名称', dataIndex: 'name', width: 200 },
    { title: '事件类型', width: 140, render: (_: any, r: NotificationRule) => r.event_type_display },
    {
      title: '告警级别', dataIndex: 'severity_level', width: 120,
      render: (v: string) => v ? (
        {
          'info': <Tag color="blue">提示及以上</Tag>,
          'warning': <Tag color="orange">告警及以上</Tag>,
          'critical': <Tag color="red">严重及以上</Tag>,
          'emergency': <Tag color="magenta">仅紧急</Tag>,
        }[v]
      ) : <span style={{ color: '#999' }}>全部</span>
    },
    {
      title: '通知渠道', width: 200,
      render: (_: any, r: NotificationRule) => (
        <Space size={4}>
          {r.channels?.map(c => (
            <Tag key={c}>
              {{ email: '邮件', sms: '短信', in_app: '站内', webhook: 'Webhook' } as any}[c] || c}
            </Tag>
          ))}
        </Space>
      )
    },
    { title: '收件人数量', dataIndex: 'recipients', width: 100, render: (v: number[]) => `${v?.length || 0} 人` },
    {
      title: '启用', dataIndex: 'is_enabled', width: 80,
      render: (v: boolean, r: NotificationRule) => (
        <Switch checked={v} onChange={(c) => handleToggle(r, c)} />
      )
    },
    { title: '描述', dataIndex: 'description', ellipsis: true },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, r: NotificationRule) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleOpenModal(r)}>编辑</Button>
          <Popconfirm title="确认删除?" onConfirm={async () => {
            try { await notificationApi.deleteRule(r.id); message.success('已删除'); loadData() } catch (e) {}
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
        <h2>通知规则</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>新增规则</Button>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索规则名称" style={{ width: 200 }} allowClear />
          </Form.Item>
          <Form.Item name="event_type">
            <Select placeholder="事件类型" style={{ width: 150 }} allowClear>
              <Select.Option value="alert_created">告警创建</Select.Option>
              <Select.Option value="alert_level_escalated">告警升级</Select.Option>
              <Select.Option value="alert_auto_closed">告警自动关闭</Select.Option>
              <Select.Option value="inspection_completed">巡检完成</Select.Option>
              <Select.Option value="inspection_failed">巡检失败</Select.Option>
              <Select.Option value="change_window_started">变更开始</Select.Option>
              <Select.Option value="change_window_completed">变更完成</Select.Option>
              <Select.Option value="change_window_failed">变更失败</Select.Option>
              <Select.Option value="change_window_approved">变更审批</Select.Option>
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
              loadData(values.event_type, values.is_enabled, values.keyword, p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>

      <Modal
        title={editingRule ? '编辑通知规则' : '新增通知规则'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="保存"
        width={600}
      >
        <Form form={ruleForm} layout="vertical">
          <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="event_type" label="事件类型" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="alert_created">告警创建</Select.Option>
              <Select.Option value="alert_level_escalated">告警升级</Select.Option>
              <Select.Option value="alert_auto_closed">告警自动关闭</Select.Option>
              <Select.Option value="inspection_completed">巡检完成</Select.Option>
              <Select.Option value="inspection_failed">巡检失败</Select.Option>
              <Select.Option value="change_window_started">变更开始</Select.Option>
              <Select.Option value="change_window_completed">变更完成</Select.Option>
              <Select.Option value="change_window_failed">变更失败</Select.Option>
              <Select.Option value="change_window_approved">变更审批</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="severity_level" label="告警级别（仅告警类事件适用）">
            <Select allowClear placeholder="全部级别">
              <Select.Option value="info">提示及以上</Select.Option>
              <Select.Option value="warning">告警及以上</Select.Option>
              <Select.Option value="critical">严重及以上</Select.Option>
              <Select.Option value="emergency">仅紧急</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="channels" label="通知渠道" rules={[{ required: true }]}>
            <Select mode="multiple">
              <Select.Option value="in_app">站内消息</Select.Option>
              <Select.Option value="email">邮件</Select.Option>
              <Select.Option value="sms">短信</Select.Option>
              <Select.Option value="webhook">Webhook</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="is_enabled" label="启用" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NotificationRuleList
