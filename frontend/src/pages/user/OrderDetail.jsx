import { Card, Descriptions, Button, Tag, Table, Space, message, Modal, Form, Input } from 'antd'
import { ArrowLeftOutlined, DollarOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrderDetail, createRefund, cancelOrder } from '../../api/user'

function UserOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [refundVisible, setRefundVisible] = useState(false)
  const [refundItem, setRefundItem] = useState(null)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    setLoading(true)
    try {
      const res = await getOrderDetail(id)
      setOrder(res.data)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    try {
      await cancelOrder(id)
      message.success('取消成功')
      navigate('/orders')
    } catch (e) {}
  }

  const handleRefund = (item) => {
    setRefundItem(item)
    setRefundVisible(true)
  }

  const handleSubmitRefund = async (values) => {
    try {
      await createRefund({
        order_id: order.id,
        order_item_id: refundItem?.id,
        amount: refundItem ? refundItem.subtotal : order.total_amount,
        reason: values.reason
      })
      message.success('退款申请已提交')
      setRefundVisible(false)
      loadOrder()
    } catch (e) {}
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      sorting: 'status-sorting',
      sorted: 'status-sorted',
      picked: 'status-picked',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded'
    }
    return map[status] || ''
  }

  if (!order) return null

  const itemColumns = [
    { title: '商品名称', dataIndex: 'product_name', key: 'product_name' },
    { title: '单价', dataIndex: 'price', key: 'price', render: v => `¥${v.toFixed(2)}` },
    { title: '数量', key: 'qty', render: r => `${r.quantity}${r.unit}` },
    { title: '小计', dataIndex: 'subtotal', key: 'subtotal', render: v => `¥${v.toFixed(2)}` },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        if (order.status === 'cancelled' || order.status === 'refunded') return null
        return (
          <Button size="small" icon={<DollarOutlined />} onClick={() => handleRefund(record)}>
            申请退款
          </Button>
        )
      }
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/orders')}>返回</Button>
          <h2 className="page-title">订单详情</h2>
        </Space>
        <Space>
          {!order.is_cutoff && order.status !== 'cancelled' && (
            <Button danger onClick={handleCancel}>取消订单</Button>
          )}
        </Space>
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="订单号">{order.order_no}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag className={statusClass(order.status)}>{order.status_text}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="下单时间">{order.created_at}</Descriptions.Item>
          <Descriptions.Item label="截单状态">{order.is_cutoff ? '已截单' : '未截单'}</Descriptions.Item>
          <Descriptions.Item label="楼栋">{order.building_name}</Descriptions.Item>
          <Descriptions.Item label="房号">{order.room_number || '-'}</Descriptions.Item>
          <Descriptions.Item label="订单金额" span={2}>
            <span style={{ color: '#f5222d', fontSize: 18, fontWeight: 600 }}>¥{order.total_amount.toFixed(2)}</span>
          </Descriptions.Item>
          {order.remark && (
            <Descriptions.Item label="备注" span={2}>{order.remark}</Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      <Card title="商品清单">
        <Table
          rowKey="id"
          columns={itemColumns}
          dataSource={order.items}
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>合计</Table.Summary.Cell>
              <Table.Summary.Cell style={{ color: '#f5222d', fontWeight: 600 }}>¥{order.total_amount.toFixed(2)}</Table.Summary.Cell>
              <Table.Summary.Cell />
            </Table.Summary.Row>
          )}
        />
      </Card>

      <Modal
        title="申请退款"
        open={refundVisible}
        onCancel={() => setRefundVisible(false)}
        footer={null}
      >
        <Form layout="vertical" onFinish={handleSubmitRefund}>
          {refundItem && (
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <div>商品：{refundItem.product_name}</div>
              <div>退款金额：<span style={{ color: '#f5222d' }}>¥{refundItem.subtotal.toFixed(2)}</span></div>
            </div>
          )}
          <Form.Item name="reason" label="退款原因" rules={[{ required: true, message: '请输入退款原因' }]}>
            <Input.TextArea rows={3} placeholder="请输入退款原因" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交申请</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserOrderDetail
