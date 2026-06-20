import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Empty } from 'antd'
import {
  UserOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ShopOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { getStatistics, getFunnelData } from '../api/dashboard'
import dayjs from 'dayjs'

const Dashboard = () => {
  const [stats, setStats] = useState({})
  const [funnelData, setFunnelData] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, funnelRes] = await Promise.all([
        getStatistics(),
        getFunnelData(),
      ])
      setStats(statsRes)
      setFunnelData(funnelRes || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>数据看板</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="总线索数"
              value={stats.totalLeads || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="新增线索"
              value={stats.newLeads || 0}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="已成交"
              value={stats.dealLeads || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="已流失"
              value={stats.lostLeads || 0}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="公海线索"
              value={stats.publicSeaLeads || 0}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card loading={loading}>
            <Statistic
              title="转化率"
              value={stats.conversionRate || 0}
              suffix="%"
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="销售漏斗" loading={loading} style={{ marginBottom: 24 }}>
        {funnelData.length > 0 ? (
          <div className="funnel-container">
            {funnelData.map((item, index) => (
              <div key={item.stageId || index} className="funnel-item">
                <div
                  className="funnel-count"
                  style={{ color: item.color || '#1890ff' }}
                >
                  {item.count || 0}
                </div>
                <div className="funnel-name">{item.stageName}</div>
                {index < funnelData.length - 1 && (
                  <div style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', fontSize: 24, color: '#d9d9d9' }}>
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty description="暂无数据" />
        )}
      </Card>
    </div>
  )
}

export default Dashboard
