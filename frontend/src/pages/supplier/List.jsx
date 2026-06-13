import React, { useState, useEffect } from 'react'
import {
  Table, Button, Input, Modal, Form, InputNumber,
  message, Space, Popconfirm, Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../../services/api'

const riskLevelMap = {
  1: { text: '低风险', color: 'success' },
  2: { text: '较低风险', color: 'blue' },
  3: { text: '中等风险', color: 'warning' },
  4: { text: '较高风险', color: 'orange' },
  5: { text: '高风险', color: 'error' },
}

const SupplierList = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [form] = Form.useForm()

  const fetchData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const res = await getSuppliers({ page, pageSize, keyword })
      setData(res.list)
      setPagination({ current: page, pageSize, total: res.total })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    fetchData(1, pagination.pageSize)
  }

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
      await deleteSupplier(id)
      message.success('删除成功')
      fetchData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        await updateSupplier(editingRecord.id, values)
        message.success('更新成功')
      } else {
        await createSupplier(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const columns = [
    { title: '供应商编码', dataIndex: 'code', width: 120 },
    { title: '供应商名称', dataIndex: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact', width: 100 },
    { title: '联系电话', dataIndex: 'phone', width: 130 },
    { title: '地址', dataIndex: 'address', ellipsis: true },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 120,
      render: (v) => {
        const level = riskLevelMap[v] || riskLevelMap[1]
        return <Tag color={level.color}>{level.text}</Tag>
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            详情
          </Button>
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
        <span>供应商管理</span>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增供应商
        </Button>
      </div>

      <div className="table-toolbar">
        <div className="filter-section">
          <Input
            placeholder="搜索名称/编码/联系人"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            onPressEnter={handleSearch}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            查询
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 家供应商`,
          onChange: (page, pageSize) => fetchData(page, pageSize),
        }}
        scroll={{ x: 1100 }}
      />

      <Modal
        title={editingRecord ? '编辑供应商' : '新增供应商'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="code"
              label="供应商编码"
              rules={[{ required: true, message: '请输入供应商编码' }]}
            >
              <Input placeholder="请输入" disabled={!!editingRecord} />
            </Form.Item>
            <Form.Item
              name="name"
              label="供应商名称"
              rules={[{ required: true, message: '请输入供应商名称' }]}
            >
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="contact" label="联系人">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="phone" label="联系电话">
              <Input placeholder="请输入" />
            </Form.Item>
          </div>
          <Form.Item name="address" label="地址">
            <Input placeholder="请输入" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="bankAccount" label="银行账号">
              <Input placeholder="请输入" />
            </Form.Item>
            <Form.Item name="taxNumber" label="税号">
              <Input placeholder="请输入" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="riskLevel" label="风险等级">
              <InputNumber min={1} max={5} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="riskNote" label="风险说明">
            <Input.TextArea rows={2} placeholder="请输入风险说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierList
