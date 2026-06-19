import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getOrders } from '../services/api'
import dayjs from 'dayjs'

function Schedules() {
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
      const res = await getSchedules()
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
      startTime: record.startTime ? dayjs(record.startTime) : null,
      endTime: record.endTime ? dayjs(record.endTime) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deleteSchedule(id)
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
        startTime: values.startTime?.toDate(),
        endTime: values.endTime?.toDate()
      }
      if (currentRecord) {
        await updateSchedule(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createSchedule(data)
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
    { title: '档期标题', dataIndex: 'title', key: 'title' },
    { title: '关联订单', dataIndex: ['order', 'title'], key: 'order', render: (v, r) => r.order?.orderNo + ' - ' + v },
    { title: '品牌', dataIndex: ['order', 'brand', 'name'], key: 'brand', render: v => v || '-' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime', render: t => dayjs(t).format('YYYY-MM-DD HH:mm') },
    { title: '地点', dataIndex: 'location', key: 'location' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { SCHEDULED: 'blue', IN_PROGRESS: 'processing', COMPLETED: 'green', CANCELLED: 'default' }
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
        <h2>拍摄档期</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增档期</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title={currentRecord ? '编辑档期' : '新增档期'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderId" label="关联订单" rules={[{ required: true }]}>
            <Select placeholder="请选择订单">
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="档期标题" rules={[{ required: true }]}>
            <Input placeholder="请输入档期标题" />
          </Form.Item>
          <Form.Item name="startTime" label="开始时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endTime" label="结束时间" rules={[{ required: true }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label="拍摄地点">
            <Input placeholder="请输入拍摄地点" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="SCHEDULED">
            <Select>
              <Select.Option value="SCHEDULED">已排期</Select.Option>
              <Select.Option value="IN_PROGRESS">进行中</Select.Option>
              <Select.Option value="COMPLETED">已完成</Select.Option>
              <Select.Option value="CANCELLED">已取消</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
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

export default Schedules
