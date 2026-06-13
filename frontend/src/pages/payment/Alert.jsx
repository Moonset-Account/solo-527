import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Modal, Form, Input, message, Space, Tabs } from 'antd'
import { CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getPaymentAlerts, resolvePaymentAlert, createPaymentAlert } from '../../services/api'

const PaymentAlert = () => {
  const [pendingData, setPendingData] = useState([])
  const [resolvedData, setResolvedData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [currentAlert, setCurrentAlert] = useState(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [addForm] = Form.useForm()
  const navigate = useNavigate()

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await getPaymentAlerts({ status: 'pending', pageSize: 100 })
      setPendingData(res.list)
    } finally {
      setLoading(false)
    }
  }

  const fetchResolved = async () => {
    setLoading(true)
    try {
      const res = await getPaymentAlerts({ status: 'resolved', pageSize: 50 })
      setResolvedData(res.list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPending()
  }, [])

  const handleResolve = (record) => {
    setCurrentAlert(record)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await resolvePaymentAlert(currentAlert.id, values)
      message.success('处理完成，已更新供应商风险')
      setModalVisible(false)
      fetchPending()
      fetchResolved()
    } catch (e) {}
  }

  const handleAdd = () => {
    addForm.resetFields()
    setAddModalVisible(true)
  }

  const handleAddSubmit = async () => {
    try {
      const values = await addForm.validateFields()
      await createPaymentAlert(values)
      message.success('创建成功')
      setAddModalVisible(false)
      fetchPending()
    } catch (e) {}
  }

  const columns = [
    { title: '需求编号', dataIndex: ['order', 'request', 'requestNo'], width: 150 },
    { title: '需求标题', dataIndex: ['order', 'request', 'title'], ellipsis: true },
    { title: '供应商', dataIndex: ['order', 'supplier', 'name'], width: 150 },
    {
      title: '订单金额',
      dataIndex: 'orderAmount',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '实付金额',
      dataIndex: 'actualPayment',
      width: 120,
      render: (v) => `¥${Number(v).toLocaleString()}`,
    },
    {
      title: '差异金额',
      dataIndex: 'difference',
      width: 120,
      render: (v) => (
        <span style={{ color: v > 0 ? '#f5222d' : '#52c41a', fontWeight: 'bold' }}>
          {v > 0 ? '+' : ''}¥{Number(v).toLocaleString()}
        </span>
      ),
    },
    {
      title: '差异率',
      dataIndex: 'diffPercent',
      width: 100,
      render: (v) => (
        <Tag color={Math.abs(v) > 10 ? 'red' : Math.abs(v) > 5 ? 'orange' : 'green'}>
          {v > 0 ? '+' : ''}{v}%
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => v === 'pending' ? <Tag color="warning">待处理</Tag> : <Tag color="success">已处理</Tag>,
    },
    { title: '创建时间', dataIndex: 'createdAt', width: 180, render: (v) => new Date(v).toLocaleString() },
    {
      title: '操作',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => handleResolve(record)}
            >
              处理
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>付款差异提醒</span>
        <Space>
          <Button type="primary" onClick={handleAdd}>
            录入差异
          </Button>
          <Button onClick={() => navigate('/payment/risk-board')}>
            供应商风险看板
          </Button>
        </Space>
      </div>

      <Tabs
        defaultActiveKey="pending"
        onChange={(key) => {
          if (key === 'pending') fetchPending()
          else fetchResolved()
        }}
        items={[
          {
            key: 'pending',
            label: `待处理 (${pendingData.length})`,
            children: (
              <Table
                columns={columns}
                dataSource={pendingData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1100 }}
              />
            ),
          },
          {
            key: 'resolved',
            label: '已处理',
            children: (
              <Table
                columns={columns}
                dataSource={resolvedData}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1100 }}
              />
            ),
          },
        ]}
      />

      <Modal
        title="处理付款差异"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        okText="确认处理"
        cancelText="取消"
        width={500}
      >
        {currentAlert && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fff1f0', borderRadius: 8 }}>
            <p><strong>供应商：</strong>{currentAlert.order?.supplier?.name}</p>
            <p><strong>订单金额：</strong>¥{Number(currentAlert.orderAmount).toLocaleString()}</p>
            <p><strong>实付金额：</strong>¥{Number(currentAlert.actualPayment).toLocaleString()}</p>
            <p><strong>差异金额：</strong>
              <span style={{ color: currentAlert.difference > 0 ? '#f5222d' : '#52c41a' }}>
                {currentAlert.difference > 0 ? '+' : ''}¥{Number(currentAlert.difference).toLocaleString()}
              </span>
            </p>
            <p><strong>差异率：</strong>{currentAlert.diffPercent}%</p>
          </div>
        )}
        <Form form={form} layout="vertical">
          <Form.Item
            name="handleNote"
            label="处理说明"
            rules={[{ required: true, message: '请输入处理说明' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入处理说明，处理后将自动更新供应商风险等级" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="录入付款差异"
        open={addModalVisible}
        onOk={handleAddSubmit}
        onCancel={() => setAddModalVisible(false)}
        okText="确定"
        cancelText="取消"
        width={400}
      >
        <Form form={addForm} layout="vertical">
          <Form.Item name="orderId" label="订单ID" rules={[{ required: true, message: '请输入订单ID' }]}>
            <Input type="number" placeholder="请输入订单ID" />
          </Form.Item>
          <Form.Item name="orderAmount" label="订单金额" rules={[{ required: true, message: '请输入订单金额' }]}>
            <Input type="number" placeholder="请输入订单金额" />
          </Form.Item>
          <Form.Item name="actualPayment" label="实付金额" rules={[{ required: true, message: '请输入实付金额' }]}>
            <Input type="number" placeholder="请输入实付金额" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PaymentAlert
