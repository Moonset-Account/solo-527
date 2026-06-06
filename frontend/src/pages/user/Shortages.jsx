import { Table, Button, Tag, Space, Card, Modal, message, Descriptions } from 'antd'
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getMyShortages, confirmShortage } from '../../api/user'

function UserShortages() {
  const [loading, setLoading] = useState(false)
  const [shortages, setShortages] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getMyShortages()
      setShortages(res.data?.items || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (item, confirm) => {
    try {
      await confirmShortage(item.id, { confirm })
      message.success(confirm ? '已确认替换方案' : '已拒绝')
      loadData()
    } catch (e) {}
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      rejected: 'status-rejected',
      refunded: 'status-refunded',
      completed: 'status-completed'
    }
    return map[status] || ''
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '缺货商品', dataIndex: 'product_name', key: 'product_name' },
    { title: '缺货数量', key: 'shortage', render: r => `${r.shortage_quantity}` },
    {
      title: '替换方案',
      key: 'replace',
      render: r => r.replace_product_name 
        ? `${r.replace_product_name} x${r.replace_quantity || ''}`
        : <Tag color="orange">待提供</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s, r) => <Tag className={statusClass(s)}>{r.status_text}</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrentItem(record); setDetailVisible(true) }}>
            详情
          </Button>
          {record.status === 'pending' && record.replace_product_name && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleConfirm(record, true)} style={{ background: '#52c41a' }}>
                确认
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleConfirm(record, false)}>
                拒绝
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">缺货确认</h2>
        <Button onClick={loadData}>刷新</Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={shortages}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="缺货详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="订单号">{currentItem.order_no}</Descriptions.Item>
            <Descriptions.Item label="缺货商品">{currentItem.product_name}</Descriptions.Item>
            <Descriptions.Item label="缺货数量">{currentItem.shortage_quantity}</Descriptions.Item>
            <Descriptions.Item label="替换商品">{currentItem.replace_product_name || '-'}</Descriptions.Item>
            <Descriptions.Item label="替换数量">{currentItem.replace_quantity || '-'}</Descriptions.Item>
            <Descriptions.Item label="用户确认">
              {currentItem.user_confirm === true ? '已确认' : currentItem.user_confirm === false ? '已拒绝' : '待确认'}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag className={statusClass(currentItem.status)}>{currentItem.status_text}</Tag>
            </Descriptions.Item>
            {currentItem.remark && (
              <Descriptions.Item label="备注">{currentItem.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default UserShortages
