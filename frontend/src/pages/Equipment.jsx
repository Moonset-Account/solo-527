import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  Tag,
  App,
  Popconfirm,
  Card,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { equipmentApi } from '../services/api'

const { Option } = Select

const Equipment = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [keyword, statusFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      const response = await equipmentApi.getList(params)
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
      const response = await equipmentApi.delete(id)
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
        const response = await equipmentApi.update(editingItem.id, values)
        if (response.code === 200) {
          message.success('更新成功')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(response.message)
        }
      } else {
        const response = await equipmentApi.create(values)
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

  const statusColor = (status) => {
    const colors = {
      IDLE: 'default',
      RUNNING: 'success',
      MAINTENANCE: 'warning',
      ERROR: 'error',
    }
    return colors[status] || 'default'
  }

  const statusText = (status) => {
    const texts = {
      IDLE: '空闲',
      RUNNING: '运行中',
      MAINTENANCE: '维护中',
      ERROR: '故障',
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '设备编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '型号',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: '二维码',
      dataIndex: 'qrCode',
      key: 'qrCode',
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusColor(s)}>{statusText(s)}</Tag>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: '当前计划',
      key: 'currentPlan',
      render: (_, r) =>
        r.currentPlan ? `${r.currentPlan.planNo} (${r.currentPlan.workOrder?.productName})` : '-',
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
            title="确定删除该设备吗？"
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
        <h1 className="page-title">设备管理</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增设备
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <Input
            placeholder="搜索设备编码/名称"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
          <Select
            placeholder="状态筛选"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="IDLE">空闲</Option>
            <Option value="RUNNING">运行中</Option>
            <Option value="MAINTENANCE">维护中</Option>
            <Option value="ERROR">故障</Option>
          </Select>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑设备' : '新增设备'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="code"
            label="设备编码"
            rules={[{ required: true, message: '请输入设备编码' }]}
          >
            <Input placeholder="请输入设备编码" />
          </Form.Item>
          <Form.Item
            name="name"
            label="设备名称"
            rules={[{ required: true, message: '请输入设备名称' }]}
          >
            <Input placeholder="请输入设备名称" />
          </Form.Item>
          <Form.Item name="model" label="型号">
            <Input placeholder="请输入型号" />
          </Form.Item>
          <Form.Item
            name="qrCode"
            label="二维码"
            rules={[{ required: true, message: '请输入二维码内容' }]}
          >
            <Input placeholder="请输入二维码内容" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="IDLE">
            <Select>
              <Option value="IDLE">空闲</Option>
              <Option value="RUNNING">运行中</Option>
              <Option value="MAINTENANCE">维护中</Option>
              <Option value="ERROR">故障</Option>
            </Select>
          </Form.Item>
          <Form.Item name="location" label="位置">
            <Input placeholder="请输入位置" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Equipment
