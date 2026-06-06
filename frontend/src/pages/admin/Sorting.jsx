import { Table, Button, Tag, Space, Card, Select, Modal, List, Checkbox, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, ExportOutlined, InboxOutlined, CheckCircleOutlined, ShoppingOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { 
  getSortingBags, createSortingBag, getSortingBag, addOrderToBag, 
  removeBagItem, checkBagItem, packBag, completeBag, 
  getBuildingSortingSummary, getOrders, exportSorting, getBuildings 
} from '../../api/admin'

function AdminSorting() {
  const [loading, setLoading] = useState(false)
  const [bags, setBags] = useState([])
  const [summary, setSummary] = useState([])
  const [buildings, setBuildings] = useState([])
  const [bagDetail, setBagDetail] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [addOrderVisible, setAddOrderVisible] = useState(false)
  const [currentBag, setCurrentBag] = useState(null)
  const [pendingOrders, setPendingOrders] = useState([])
  const [selectedBuilding, setSelectedBuilding] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [bRes, sRes, buildRes] = await Promise.all([
        getSortingBags(),
        getBuildingSortingSummary(),
        getBuildings()
      ])
      setBags(bRes.data?.items || [])
      setSummary(sRes.data || [])
      setBuildings(buildRes.data?.items || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBag = async (buildingId) => {
    try {
      await createSortingBag({ building_id: buildingId })
      message.success('✅ 分拣袋已创建')
      loadData()
    } catch (e) {
      message.error(e?.response?.data?.message || '创建分拣袋失败，请重试')
    }
  }

  const handleViewBag = async (bag) => {
    setCurrentBag(bag)
    try {
      const res = await getSortingBag(bag.id)
      setBagDetail(res.data)
      setDetailVisible(true)
    } catch (e) {}
  }

  const handleAddOrder = async (bag) => {
    setCurrentBag(bag)
    setSelectedBuilding(bag.building_id)
    try {
      const res = await getOrders({ building_id: bag.building_id, status: 'sorting', is_cutoff: true })
      setPendingOrders(res.data?.items || [])
      setAddOrderVisible(true)
    } catch (e) {}
  }

  const handleAddOrderToBag = async (orderId) => {
    try {
      await addOrderToBag(currentBag.id, { order_id: orderId })
      message.success('已添加')
      const res = await getSortingBag(currentBag.id)
      setBagDetail(res.data)
      const oRes = await getOrders({ building_id: currentBag.building_id, status: 'sorting', is_cutoff: true })
      setPendingOrders(oRes.data?.items || [])
    } catch (e) {}
  }

  const handleRemoveItem = async (itemId) => {
    try {
      await removeBagItem(currentBag.id, itemId)
      message.success('已移除')
      const res = await getSortingBag(currentBag.id)
      setBagDetail(res.data)
    } catch (e) {}
  }

  const handleCheckItem = async (itemId, checked) => {
    try {
      await checkBagItem(currentBag.id, itemId, { checked })
      const res = await getSortingBag(currentBag.id)
      setBagDetail(res.data)
    } catch (e) {}
  }

  const handlePack = async (bagId) => {
    try {
      await packBag(bagId, {})
      message.success('✅ 分拣袋已打包，可交付取货')
      loadData()
      setDetailVisible(false)
    } catch (e) {
      message.error(e?.response?.data?.message || '打包失败，请重试')
    }
  }

  const handleComplete = async (bagId) => {
    try {
      await completeBag(bagId)
      message.success('✅ 分拣已完成')
      loadData()
      setDetailVisible(false)
    } catch (e) {
      message.error(e?.response?.data?.message || '操作失败，请重试')
    }
  }

  const handleExport = async (buildingId) => {
    try {
      await exportSorting(buildingId)
      message.success('✅ 分拣单导出成功')
    } catch (e) {
      message.error('❌ 导出失败，请检查权限后重试')
    }
  }

  const statusClass = (status) => {
    const map = {
      packing: 'status-pending',
      packed: 'status-confirmed',
      delivered: 'status-sorted',
      completed: 'status-completed'
    }
    return map[status] || ''
  }

  const bagColumns = [
    { title: '分拣袋编号', dataIndex: 'bag_no', key: 'bag_no', width: 180 },
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '订单数', dataIndex: 'total_orders', key: 'total_orders' },
    { title: '商品数', dataIndex: 'total_items', key: 'total_items' },
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
          <Button size="small" onClick={() => handleViewBag(record)}>详情</Button>
          {record.status === 'packing' && (
            <Button size="small" type="primary" onClick={() => handleAddOrder(record)} style={{ background: '#52c41a' }}>
              添加订单
            </Button>
          )}
          {record.status === 'packing' && record.total_items > 0 && (
            <Button size="small" onClick={() => handlePack(record.id)}>打包</Button>
          )}
          {record.status === 'packed' && (
            <Button size="small" type="primary" onClick={() => handleComplete(record.id)} style={{ background: '#52c41a' }}>
              完成
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">楼栋分拣</h2>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {summary.map(s => (
          <Col xs={12} md={6} key={s.building_id}>
            <Card size="small">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{s.building_name}</div>
              <Row gutter={8}>
                <Col span={12}>
                  <Statistic title="待分拣" value={s.pending_orders} valueStyle={{ fontSize: 18 }} />
                </Col>
                <Col span={12}>
                  <Statistic title="已分拣" value={s.sorted_orders} valueStyle={{ fontSize: 18, color: '#52c41a' }} />
                </Col>
              </Row>
              <div style={{ marginTop: 12 }}>
                <Space>
                  <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => handleCreateBag(s.building_id)} style={{ background: '#52c41a' }}>
                    新建分拣袋
                  </Button>
                  <Button size="small" icon={<ExportOutlined />} onClick={() => handleExport(s.building_id)}>
                    导出
                  </Button>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="分拣袋列表">
        <Table
          rowKey="id"
          columns={bagColumns}
          dataSource={bags}
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="分拣袋详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {bagDetail && (
          <div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <div><strong>分拣袋：</strong>{bagDetail.bag_no}</div>
              <div><strong>楼栋：</strong>{bagDetail.building_name}</div>
              <div><strong>订单数：</strong>{bagDetail.total_orders} | <strong>商品数：</strong>{bagDetail.total_items}</div>
              <div><strong>状态：</strong><Tag className={statusClass(bagDetail.status)}>{bagDetail.status_text}</Tag></div>
            </div>
            <List
              dataSource={bagDetail.items}
              renderItem={item => (
                <List.Item
                  actions={bagDetail.status === 'packing' ? [
                    <Button size="small" danger onClick={() => handleRemoveItem(item.id)}>移除</Button>
                  ] : []}
                >
                  <List.Item.Meta
                    avatar={
                      <Checkbox
                        checked={item.is_checked}
                        onChange={e => handleCheckItem(item.id, e.target.checked)}
                        disabled={bagDetail.status !== 'packing'}
                      />
                    }
                    title={`${item.product_name} x ${item.quantity}${item.unit}`}
                    description={`订单号: ${item.order_no}`}
                  />
                </List.Item>
              )}
            />
            {bagDetail.status === 'packing' && bagDetail.total_items > 0 && (
              <div style={{ marginTop: 16, textAlign: 'right' }}>
                <Space>
                  <Button type="primary" onClick={() => handlePack(bagDetail.id)} style={{ background: '#52c41a' }}>
                    完成打包
                  </Button>
                </Space>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title="添加订单到分拣袋"
        open={addOrderVisible}
        onCancel={() => setAddOrderVisible(false)}
        footer={null}
        width={600}
      >
        {pendingOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
            <InboxOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>该楼栋暂无待分拣订单</div>
          </div>
        ) : (
          <List
            dataSource={pendingOrders}
            renderItem={order => (
              <List.Item
                actions={[
                  <Button type="primary" size="small" onClick={() => handleAddOrderToBag(order.id)} style={{ background: '#52c41a' }}>
                    添加
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={order.order_no}
                  description={
                    <div>
                      <div>{order.user_name} - {order.building_name} {order.room_number}</div>
                      {order.items?.map((item, idx) => (
                        <div key={idx} style={{ fontSize: 12, color: '#666' }}>
                          {item.product_name} x {item.quantity}{item.unit}
                        </div>
                      ))}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  )
}

export default AdminSorting
