import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getDeliveryNodes, createDeliveryNode, updateDeliveryNode, deleteDeliveryNode, getOrders } from '../services/api'
import dayjs from 'dayjs'

function DeliveryNodes() {
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [orders, setOrders] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadOrders()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getDeliveryNodes()
      setList(res.list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await getOrders({ pageSize: 100 })
      setOrders(res.list)
    } catch (err) {
      console.error(err)
    }
  }

  const handleAdd = () => {
    setCurrentRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = record => {
    setCurrentRecord(record)
    form.setFieldsValue({
      ...record,
      plannedDate: record.plannedDate ? dayjs(record.plannedDate) : null,
      actualDate: record.actualDate ? dayjs(record.actualDate) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteDeliveryNode(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      const data = {
        ...values,
        plannedDate: values.plannedDate?.toDate(),
        actualDate: values.actualDate?.toDate()
      }
      if (currentRecord) {
        await updateDeliveryNode(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createDeliveryNode(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '节点名称', dataIndex: 'nodeName', key: 'nodeName' },
    { title: '节点类型', dataIndex: 'nodeType', key: 'nodeType', render: t => <Tag color="blue">{t}</Tag> },
    { title: '关联订单', dataIndex: ['order', 'title'], key: 'order', render: (v, r) => r.order?.orderNo + ' - ' + v },
    { title: '计划日期', dataIndex: 'plannedDate', key: 'plannedDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '实际日期', dataIndex: 'actualDate', key: 'actualDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { PENDING: 'default', IN_PROGRESS: 'processing', COMPLETED: 'green', DELAYED: 'red' }
        return <Tag color={colors[s]}>{s}</Tag>
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, r) => (
        <Space>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>交付节点</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增节点</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title={currentRecord ? '编辑节点' : '新增节点'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderId" label="关联订单" rules={[{ required: true }]}>
            <Select placeholder="请选择订单">
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="nodeName" label="节点名称" rules={[{ required: true }]}>
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item name="nodeType" label="节点类型" initialValue="NORMAL">
            <Select>
              <Select.Option value="NORMAL">普通节点</Select.Option>
              <Select.Option value="MILESTONE">里程碑</Select.Option>
              <Select.Option value="REVIEW">评审节点</Select.Option>
              <Select.Option value="DELIVERY">交付节点</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="plannedDate" label="计划日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="actualDate" label="实际日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待开始</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="DELAYED">已延期</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default DeliveryNodes
