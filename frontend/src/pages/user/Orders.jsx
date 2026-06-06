import { Table, Button, Tag, Space, Card, message, Popconfirm } from 'antd'
import { EyeOutlined, CloseOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMyOrders, cancelOrder } from '../../api/user'

function UserOrders() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await getMyOrders()
      setOrders(res.data?.items || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    try {
      await cancelOrder(id)
      message.success('取消成功')
      loadOrders()
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

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 180 },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '房号', dataIndex: 'room_number', key: 'room_number' },
    {
      title: '商品',
      key: 'items',
      render: (_, record) => (
        <div style={{ maxWidth: 200 }}>
          {record.items?.slice(0, 2).map((item, idx) => (
            <div key={idx} style={{ fontSize: 12 }}>{item.product_name} x{item.quantity}{item.unit}</div>
          ))}
          {record.items?.length > 2 && <div style={{ fontSize: 12, color: '#999' }}>...等{record.items.length}件</div>}
        </div>
      )
    },
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: v => `¥${v.toFixed(2)}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Tag className={statusClass(status)}>{record.status_text}</Tag>
      )
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/orders/${record.id}`)}>查看</Button>
          {!record.is_cutoff && record.status !== 'cancelled' && (
            <Popconfirm title="确定取消订单？" onConfirm={() => handleCancel(record.id)}>
              <Button size="small" danger icon={<CloseOutlined />}>取消</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">我的订单</h2>
        <Button onClick={loadOrders}>刷新</Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default UserOrders
