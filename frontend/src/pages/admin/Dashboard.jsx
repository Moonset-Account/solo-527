import { Card, Row, Col, Statistic, Button, Table, Tag, Space, message } from 'antd'
import { WarningOutlined, ShoppingCartOutlined, CarryOutOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getCutoffReminder, getBuildingSortingSummary, cutoffOrders } from '../../api/admin'

function AdminDashboard() {
  const [reminder, setReminder] = useState(null)
  const [sortingSummary, setSortingSummary] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [rRes, sRes] = await Promise.all([
        getCutoffReminder(),
        getBuildingSortingSummary()
      ])
      setReminder(rRes.data)
      setSortingSummary(sRes.data || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleCutoffBuilding = async (buildingId) => {
    try {
      await cutoffOrders({ building_id: buildingId })
      message.success('已截单')
      loadData()
    } catch (e) {}
  }

  const handleCutoffAll = async () => {
    try {
      await cutoffOrders({})
      message.success('已全部截单')
      loadData()
    } catch (e) {}
  }

  const buildingColumns = [
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '待分拣订单', dataIndex: 'pending_orders', key: 'pending_orders', 
      render: v => v > 0 ? <Tag color="orange">{v}</Tag> : v },
    { title: '已分拣订单', dataIndex: 'sorted_orders', key: 'sorted_orders' },
    { title: '分拣中袋子', dataIndex: 'packing_bags', key: 'packing_bags' },
    { title: '已打包袋子', dataIndex: 'packed_bags', key: 'packed_bags' },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        record.pending_orders > 0 && (
          <Button size="small" type="primary" onClick={() => handleCutoffBuilding(record.building_id)} style={{ background: '#52c41a' }}>
            截单
          </Button>
        )
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">截单提醒</h2>
        <Space>
          <Button onClick={loadData}>刷新</Button>
          <Button type="primary" onClick={handleCutoffAll} style={{ background: '#fa8c16' }}>
            全部截单
          </Button>
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="待截单总数"
              value={reminder?.total_pending || 0}
              prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="涉及楼栋数"
              value={reminder?.building_stats?.length || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="分拣中楼栋"
              value={sortingSummary.filter(s => s.pending_orders > 0).length}
              prefix={<CarryOutOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title="已完成楼栋"
              value={sortingSummary.filter(s => s.pending_orders === 0 && s.sorted_orders > 0).length}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
      </Row>

      {reminder?.building_stats?.length > 0 && (
        <Card title="待截单楼栋" style={{ marginBottom: 24 }}>
          <Row gutter={[16, 16]}>
            {reminder.building_stats.map(bs => (
              <Col xs={12} md={8} lg={6} key={bs.building_id}>
                <Card size="small" style={{ background: '#fff7e6', borderColor: '#ffd591' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{bs.building_name}</div>
                      <div style={{ color: '#fa8c16' }}>{bs.pending_count} 单待截单</div>
                    </div>
                    <Button size="small" type="primary" onClick={() => handleCutoffBuilding(bs.building_id)} style={{ background: '#fa8c16' }}>
                      截单
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Card title="楼栋分拣状态">
        <Table
          rowKey="building_id"
          columns={buildingColumns}
          dataSource={sortingSummary}
          pagination={false}
          loading={loading}
        />
      </Card>
    </div>
  )
}

export default AdminDashboard
