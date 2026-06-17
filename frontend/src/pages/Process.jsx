import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, InputNumber, App, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { processApi } from '../services/api'

const Process = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const response = await processApi.getList()
      if (response.code === 200) {
        setData(response.data)
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const response = await processApi.delete(id)
      if (response.code === 200) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const response = await processApi.update(editingItem.id, values)
        if (response.code === 200) {
          message.success('更新成功')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(response.message)
        }
      } else {
        const response = await processApi.create(values)
        if (response.code === 200) {
          message.success('创建成功')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(response.message)
        }
      }
    } catch (error) {
      if (error.errorFields) return
      message.error('保存失败')
    }
  }

  const columns = [
    {
      title: '工序编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '工序名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '顺序',
      dataIndex: 'sequence',
      key: 'sequence',
      sorter: (a, b) => a.sequence - b.sequence,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该工序吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">工序管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工序
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑工序' : '新增工序'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="工序编码"
            rules={[{ required: true, message: '请输入工序编码' }]}
          >
            <Input placeholder="请输入工序编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="工序名称"
            rules={[{ required: true, message: '请输入工序名称' }]}
          >
            <Input placeholder="请输入工序名称" />
          </Form.Item>
          <Form.Item
            name="sequence"
            label="顺序"
            rules={[{ required: true, message: '请输入顺序' }]}
            initialValue={1}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入顺序" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Process
