import { Table, Button, Tag, Space, Card, Popconfirm, message, Modal, Descriptions } from 'antd'
import { EyeOutlined, UndoOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getMyRefunds, withdrawRefund } from '../../api/user'

function UserRefunds() {
  const [loading, setLoading] = useState(false)
  const [refunds, setRefunds] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getMyRefunds()
      setRefunds(res.data?.items || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleWithdraw = async (id) => {
    try {
      await withdrawRefund(id)
      message.success('已撤回')
      loadData()
    } catch (e) {}
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed'
    }
    return map[status] || ''
  }

  const columns = [
    { title: '退款单号', dataIndex: 'refund_no', key: 'refund_no', width: 180 },
    { title: '关联订单', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '退款金额', dataIndex: 'amount', key: 'amount', render: v => <span style={{ color: '#f5222d' }}>¥{v.toFixed(2)}</span> },
    { title: '退款原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s, r) => <Tag className={statusClass(s)}>{r.status_text}</Tag>
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrentItem(record); setDetailVisible(true) }}>
            详情
          </Button>
          {record.status === 'pending' && (
            <Popconfirm title="确定撤回退款申请？" onConfirm={() => handleWithdraw(record.id)}>
              <Button size="small" icon={<UndoOutlined />}>撤回</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">退款申请</h2>
        <Button onClick={loadData}>刷新</Button>
      </div>
      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={refunds}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="退款详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={500}
      >
        {currentItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="退款单号">{currentItem.refund_no}</Descriptions.Item>
            <Descriptions.Item label="关联订单">{currentItem.order_no}</Descriptions.Item>
            <Descriptions.Item label="退款金额">
              <span style={{ color: '#f5222d', fontSize: 16, fontWeight: 600 }}>¥{currentItem.amount.toFixed(2)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="退款原因">{currentItem.reason}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag className={statusClass(currentItem.status)}>{currentItem.status_text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="申请时间">{currentItem.created_at}</Descriptions.Item>
            {currentItem.approved_at && (
              <Descriptions.Item label="审批时间">{currentItem.approved_at}</Descriptions.Item>
            )}
            {currentItem.remark && (
              <Descriptions.Item label="备注">{currentItem.remark}</Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default UserRefunds
