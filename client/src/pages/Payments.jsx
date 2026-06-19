import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Modal, Form, Input, Select, DatePicker, InputNumber, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { getPayments, createPayment, updatePayment, deletePayment, getOrders } from '../services/api'
import dayjs from 'dayjs'

function Payments() {
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
      const res = await getPayments()
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
      paymentDate: record.paymentDate ? dayjs(record.paymentDate) : null,
      amount: Number(record.amount)
    })
    setModalVisible(true)
  }

  const handleDelete = async id => {
    try {
      await deletePayment(id)
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
        paymentDate: values.paymentDate?.toDate(),
        amount: String(values.amount || 0)
      }
      if (currentRecord) {
        await updatePayment(currentRecord.id, data)
        message.success('更新成功')
      } else {
        await createPayment(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    { title: '回款编号', dataIndex: 'paymentNo', key: 'paymentNo', width: 140 },
    { title: '关联订单', dataIndex: ['order', 'title'], key: 'order', render: (v, r) => r.order?.orderNo + ' - ' + v },
    { title: '品牌', dataIndex: ['order', 'brand', 'name'], key: 'brand', render: v => v || '-' },
    { title: '回款金额', dataIndex: 'amount', key: 'amount', render: v => `¥${v}` },
    { title: '回款日期', dataIndex: 'paymentDate', key: 'paymentDate', render: t => t ? dayjs(t).format('YYYY-MM-DD') : '-' },
    { title: '回款方式', dataIndex: 'paymentMethod', key: 'paymentMethod', render: v => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: s => {
        const colors = { PENDING: 'orange', PAID: 'green', OVERDUE: 'red', PARTIAL: 'blue' }
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
        <h2>回款管理</h2>
      </div>

      <div className="table-toolbar">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增回款</Button>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
      />

      <Modal title={currentRecord ? '编辑回款' : '新增回款'} open={modalVisible} onCancel={() => setModalVisible(false)} footer={null} width={500}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="orderId" label="关联订单" rules={[{ required: true }]}>
            <Select placeholder="请选择订单">
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="amount" label="回款金额" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} prefix="¥" />
          </Form.Item>
          <Form.Item name="paymentDate" label="回款日期">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="paymentMethod" label="回款方式">
            <Select placeholder="请选择回款方式">
              <Select.Option value="BANK_TRANSFER">银行转账</Select.Option>
              <Select.Option value="WECHAT">微信支付</Select.Option>
              <Select.Option value="ALIPAY">支付宝</Select.Option>
              <Select.Option value="CASH">现金</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待回款</Select.Option>
              <Select.Option value="PAID">已回款</Select.Option>
              <Select.Option value="PARTIAL">部分回款</Select.Option>
              <Select.Option value="OVERDUE">逾期</Select.Option>
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

export default Payments
