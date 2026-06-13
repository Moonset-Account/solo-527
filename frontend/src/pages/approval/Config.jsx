import React, { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, InputNumber, Switch, message, Space, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getApprovalLevels, createApprovalLevel, updateApprovalLevel, deleteApprovalLevel } from '../../services/api'

const roleOptions = [
  { value: 'project_manager', label: '项目经理' },
  { value: 'procurement_manager', label: '采购经理' },
  { value: 'finance', label: '财务' },
  { value: 'admin', label: '管理员' },
]

const ApprovalConfig = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getApprovalLevels()
      setData(res || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteApprovalLevel(id)
      message.success('删除成功')
      fetchData()
    } catch (e) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateApprovalLevel(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await createApprovalLevel(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (e) {}
  }

  const handleToggleEnabled = async (record, enabled) => {
    try {
      await updateApprovalLevel(record.id, { ...record, enabled })
      message.success('更新成功')
      fetchData()
    } catch (e) {}
  }

  const columns = [
    { title: '层级', dataIndex: 'level', width: 80 },
    { title: '层级名称', dataIndex: 'name', width: 150 },
    {
      title: '审批角色',
      dataIndex: 'role',
      width: 150,
      render: (v) => roleOptions.find(r => r.value === v)?.label || v,
    },
    {
      title: '金额范围（元）',
      width: 200,
      render: (_, record) => `${record.minAmount?.toLocaleString() || 0} - ${record.maxAmount?.toLocaleString() || '不限'}`,
    },
    {
      title: '是否启用',
      dataIndex: 'enabled',
      width: 100,
      render: (v, record) => (
        <Switch
          checked={v}
          onChange={(checked) => handleToggleEnabled(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>审批层级配置</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增层级
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={false}
      />

      <Modal
        title={editingRecord ? '编辑审批层级' : '新增审批层级'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="level"
            label="层级"
            rules={[{ required: true, message: '请输入层级' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入层级数字" />
          </Form.Item>
          <Form.Item
            name="name"
            label="层级名称"
            rules={[{ required: true, message: '请输入层级名称' }]}
          >
            <Input placeholder="如：一级审批" />
          </Form.Item>
          <Form.Item
            name="role"
            label="审批角色"
            rules={[{ required: true, message: '请选择审批角色' }]}
          >
            <select style={{ width: '100%', height: 32, borderRadius: 6, border: '1px solid #d9d9d9', padding: '0 11px' }}>
              {roleOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Form.Item>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              name="minAmount"
              label="最小金额"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入最小金额' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
            </Form.Item>
            <Form.Item
              name="maxAmount"
              label="最大金额"
              style={{ flex: 1 }}
              rules={[{ required: true, message: '请输入最大金额' }]}
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="9999999" />
            </Form.Item>
          </div>
          <Form.Item name="enabled" label="是否启用" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ApprovalConfig
