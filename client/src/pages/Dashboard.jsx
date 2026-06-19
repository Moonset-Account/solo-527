import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space, Alert } from 'antd'
import {
  FileTextOutlined,
  ShopOutlined,
  DollarOutlined,
  TeamOutlined,
  WarningOutlined,
  CalendarOutlined,
  SyncOutlined
} from '@ant-design/icons'
import {
  getStatsOverview,
  getRecentActivities
} from '../services/api'

function Dashboard() {
  const [stats, setStats] = useState({})
  const [activities, setActivities] = useState({})
  const [loading, setLoading] = useState(false)
  const [syncError, setSyncError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [overviewData, activitiesData] = await Promise.all([
        getStatsOverview(),
        getRecentActivities()
      ])
      setStats(overviewData)
      setActivities(activitiesData)
      setSyncError(null)
    } catch (err) {
      setSyncError({
        message: '数据同步失败',
        suggestion: '请检查后端服务是否正常运行，或刷新页面重试。如问题持续，请联系技术支持。'
      })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: '总订单数', value: stats.totalOrders, icon: <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />, color: '#1890ff' },
    { title: '待处理订单', value: stats.pendingOrders, icon: <FileTextOutlined style={{ fontSize: 24, color: '#faad14' }} />, color: '#faad14' },
    { title: '品牌数量', value: stats.totalBrands, icon: <ShopOutlined style={{ fontSize: 24, color: '#52c41a' }} />, color: '#52c41a' },
    { title: '累计收入', value: stats.totalRevenue, prefix: '¥', icon: <DollarOutlined style={{ fontSize: 24, color: '#13c2c2' }} />, color: '#13c2c2' },
    { title: '活跃会员', value: stats.activeMembers, icon: <TeamOutlined style={{ fontSize: 24, color: '#722ed1' }} />, color: '#722ed1' },
    { title: '活跃订阅', value: stats.activeSubscriptions, icon: <TeamOutlined style={{ fontSize: 24, color: '#eb2f96' }} />, color: '#eb2f96' },
    { title: '待处理异常', value: stats.pendingExceptions, icon: <WarningOutlined style={{ fontSize: 24, color: '#f5222d' }} />, color: '#f5222d' },
    { title: '拍摄档期', value: stats.totalSchedules, icon: <CalendarOutlined style={{ fontSize: 24, color: '#fa8c16' }} />, color: '#fa8c16' }
  ]

  const orderColumns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '订单标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand' },
    { title: '状态', dataIndex: 'status', key: 'status', render: s => <Tag color="blue">{s}</Tag> }
  ]

  const exceptionColumns = [
    { title: '异常标题', dataIndex: 'title', key: 'title' },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand', render: v => v || '-' },
    { title: '优先级', dataIndex: 'priority', key: 'priority', render: p => (
      <Tag color={p === 'HIGH' ? 'red' : p === 'MEDIUM' ? 'orange' : 'green'}>{p}</Tag>
    )}
  ]

  return (
    <div>
      {syncError && (
        <Alert
          className="sync-error-tip"
          message={syncError.message}
          description={syncError.suggestion}
          type="error"
          showIcon
          action={
            <Space>
              <SyncOutlined spin />
              <a onClick={loadData}>重试</a>
            </Space>
          }
          closable
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <Card loading={loading} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Statistic
                  title={card.title}
                  value={card.value || 0}
                  prefix={card.prefix}
                />
                {card.icon}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近订单" loading={loading}>
            <Table
              size="small"
              dataSource={activities.recentOrders || []}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="最近异常" loading={loading}>
            <Table
              size="small"
              dataSource={activities.recentExceptions || []}
              columns={exceptionColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
