import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Typography, Modal, Form, Input, InputNumber, Switch, message, Popconfirm, Select } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { rule } from '@/api'
import { formatDate } from '@/utils'
import type { ApprovalRule, PageParams, CreateRuleRequest, UpdateRuleRequest, ApprovalNode, RoleCode } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select

const roleOptions: { value: RoleCode; label: string }[] = [
  { value: 'APPROVER', label: '审批人' },
  { value: 'FINANCE_MANAGER', label: '财务经理' },
  { value: 'ADMIN', label: '管理员' }
]

const Rules: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<ApprovalRule[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<ApprovalRule | null>(null)
  const [form] = Form.useForm<CreateRuleRequest & { id?: number }>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await rule.list(pagination)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch rules failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination])

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({
      nodes: [
        { nodeName: '部门审批', nodeOrder: 1, approverRole: 'APPROVER', timeoutHours: 24 }
      ]
    })
    setModalVisible(true)
  }

  const handleEdit = (record: ApprovalRule) => {
    setEditingRecord(record)
    form.setFieldsValue({
      id: record.id,
      ruleName: record.ruleName,
      department: record.department,
      minAmount: record.minAmount,
      maxAmount: record.maxAmount,
      nodes: record.nodes
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await rule.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete rule failed:', error)
    }
  }

  const handleToggleEnabled = async (record: ApprovalRule, enabled: boolean) => {
    try {
      await rule.update({ id: record.id, enabled })
      message.success(enabled ? '已启用' : '已禁用')
      fetchData()
    } catch (error) {
      console.error('Toggle rule failed:', error)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        const updateData: UpdateRuleRequest = {
          id: values.id!,
          ruleName: values.ruleName,
          department: values.department,
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          nodes: values.nodes
        }
        await rule.update(updateData)
        message.success('更新成功')
      } else {
        const createData: CreateRuleRequest = {
          ruleName: values.ruleName,
          department: values.department,
          minAmount: values.minAmount,
          maxAmount: values.maxAmount,
          nodes: values.nodes
        }
        await rule.create(createData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit rule failed:', error)
    }
  }

  const addNode = () => {
    const nodes = form.getFieldValue('nodes') || []
    const newNode: ApprovalNode = {
      id: 0,
      ruleId: 0,
      nodeName: `节点${nodes.length + 1}`,
      nodeOrder: nodes.length + 1,
      approverRole: 'APPROVER',
      timeoutHours: 24
    }
    form.setFieldsValue({ nodes: [...nodes, newNode] })
  }

  const removeNode = (index: number) => {
    const nodes = form.getFieldValue('nodes') || []
    if (nodes.length <= 1) {
      message.warning('至少需要一个审批节点')
      return
    }
    const newNodes = nodes.filter((_: any, i: number) => i !== index)
    form.setFieldsValue({ nodes: newNodes })
  }

  const columns: ColumnsType<ApprovalRule> = [
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName'
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '金额范围 (元)',
      key: 'amount',
      width: 180,
      render: (_, record) => `${record.minAmount.toLocaleString()} - ${record.maxAmount.toLocaleString()}`
    },
    {
      title: '审批节点数',
      key: 'nodes',
      width: 120,
      render: (_, record) => record.nodes.length
    },
    {
      title: '状态',
      key: 'enabled',
      width: 100,
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>审批规则配置</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增规则
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条规则`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑规则' : '新增规则'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={720}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="ruleName"
              label="规则名称"
              rules={[{ required: true, message: '请输入规则名称' }]}
            >
              <Input placeholder="请输入规则名称" />
            </Form.Item>
            <Form.Item
              name="department"
              label="适用部门"
              rules={[{ required: true, message: '请输入适用部门' }]}
            >
              <Input placeholder="请输入适用部门" />
            </Form.Item>
            <Form.Item
              name="minAmount"
              label="最小金额 (元)"
              rules={[{ required: true, message: '请输入最小金额' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100}
                precision={2}
                placeholder="请输入最小金额"
              />
            </Form.Item>
            <Form.Item
              name="maxAmount"
              label="最大金额 (元)"
              rules={[
                { required: true, message: '请输入最大金额' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || value > getFieldValue('minAmount')) {
                      return Promise.resolve()
                    }
                    return Promise.reject(new Error('最大金额必须大于最小金额'))
                  }
                })
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                step={100}
                precision={2}
                placeholder="请输入最大金额"
              />
            </Form.Item>
          </div>
          <Form.Item label="审批节点">
            <Button type="dashed" onClick={addNode} block style={{ marginBottom: 8 }}>
              <PlusOutlined /> 添加审批节点
            </Button>
            <Form.List name="nodes">
              {(fields, { remove }) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {fields.map((field, index) => (
                    <Card
                      key={field.key}
                      size="small"
                      title={`节点 ${index + 1}`}
                      extra={
                        fields.length > 1 && (
                          <Button type="link" danger size="small" onClick={() => { remove(index); removeNode(index) }}>
                            删除
                          </Button>
                        )
                      }
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        <Form.Item
                          name={[field.name, 'nodeName']}
                          label="节点名称"
                          rules={[{ required: true, message: '请输入节点名称' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="节点名称" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'approverRole']}
                          label="审批角色"
                          rules={[{ required: true, message: '请选择审批角色' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Select placeholder="请选择审批角色">
                            {roleOptions.map(option => (
                              <Option key={option.value} value={option.value}>
                                {option.label}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'timeoutHours']}
                          label="超时时间 (小时)"
                          rules={[{ required: true, message: '请输入超时时间' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            min={1}
                            step={1}
                            placeholder="24"
                          />
                        </Form.Item>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Rules
