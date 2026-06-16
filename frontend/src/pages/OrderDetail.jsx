import React, { useState, useEffect } from 'react'
import { Card, Button, Descriptions, Table, Tag, Space, Timeline, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { orderAPI } from '../services/api.js'

function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDetail()
  }, [id])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await orderAPI.getDetail(id)
      setOrder(data)
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async () => {
    try {
      await orderAPI.refund(id, { reason: '用户申请退票' })
      message.success('退票成功')
      loadDetail()
    } catch (e) {}
  }

  const statusMap = {
    PENDING: { color: 'orange', text: '待支付' },
    PAID: { color: 'green', text: '已支付' },
    CANCELLED: { color: 'default', text: '已取消' },
    REFUNDED: { color: 'gray', text: '已退款' },
    REFUNDING: { color: 'blue', text: '退款中' }
  }

  const itemColumns = [
    { title: '票种', dataIndex: 'ticketName' },
    { title: '座位', dataIndex: 'seatName', render: (v) => v || '-' },
    { title: '场次', dataIndex: ['session', 'name'], render: (v) => v || '-' },
    { title: '单价', dataIndex: 'price', render: (v) => `¥${v}` },
    { title: '数量', dataIndex: 'quantity' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => <Tag color={s === 'VALID' ? 'green' : 'gray'}>{s === 'VALID' ? '有效' : '已退票'}</Tag>
    }
  ]

  const getTimeline = () => {
    const events = []
    events.push({
      color: 'blue',
      children: `订单创建 - ${dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}`
    })
    if (order.paidAt) {
      events.push({
        color: 'green',
        children: `支付成功 - ${dayjs(order.paidAt).format('YYYY-MM-DD HH:mm')}`
      })
    }
    if (order.checkIns?.length > 0) {
      order.checkIns.forEach(c => {
        events.push({
          color: c.status === 'SUCCESS' ? 'green' : 'red',
          children: `${c.status === 'SUCCESS' ? '核销成功' : '核销失败'} - ${dayjs(c.createdAt).format('YYYY-MM-DD HH:mm')}${c.failureReason ? `（${c.failureReason}）` : ''}`
        })
      })
    }
    if (order.refunds?.length > 0) {
      order.refunds.forEach(r => {
        events.push({
          color: 'orange',
          children: `退款${r.status === 'COMPLETED' ? '完成' : '申请'} - ¥${r.amount} - ${dayjs(r.createdAt).format('YYYY-MM-DD HH:mm')}`
        })
      })
    }
    return events
  }

  if (!order) return <div style={{ padding: 24 }}>加载中...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <h2>订单详情 - {order.orderNo}</h2>
          <Tag color={statusMap[order.status]?.color}>{statusMap[order.status]?.text}</Tag>
        </Space>
        <Space>
          {order.status === 'PAID' && (
            <Button danger onClick={handleRefund}>申请退票</Button>
          )}
        </Space>
      </div>

      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Card title="订单信息" loading={loading}>
          <Descriptions column={3}>
            <Descriptions.Item label="订单号">{order.orderNo}</Descriptions.Item>
            <Descriptions.Item label="来源单据">{order.sourceOrder || '-'}</Descriptions.Item>
            <Descriptions.Item label="订单金额"><span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{order.totalAmount}</span></Descriptions.Item>
            <Descriptions.Item label="支付方式">{order.paymentMethod || '-'}</Descriptions.Item>
            <Descriptions.Item label="支付时间">{order.paidAt ? dayjs(order.paidAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            <Descriptions.Item label="下单时间">{dayjs(order.createdAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
            <Descriptions.Item label="备注" span={3}>{order.remark || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="活动信息">
          <Descriptions column={2}>
            <Descriptions.Item label="活动名称">{order.event?.name}</Descriptions.Item>
            <Descriptions.Item label="场馆">{order.event?.venue}</Descriptions.Item>
          </Descriptions>
        </Card>

        <Card title="票品详情">
          <Table
            rowKey="id"
            columns={itemColumns}
            dataSource={order.items || []}
            pagination={false}
          />
        </Card>

        <Card title="订单进度">
          <Timeline items={getTimeline()} />
        </Card>
      </Space>
    </div>
  )
}

export default OrderDetail
