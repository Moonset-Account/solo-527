import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Tag, Button, Spin, Typography, Space, Row, Col, Statistic } from 'antd'
import { ArrowLeftOutlined, EnvironmentOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons'
import { getPublicRouteById } from '@/api/route'
import type { TourRoute } from '@/types'

const { Title, Paragraph } = Typography

const RouteDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [route, setRoute] = useState<TourRoute | null>(null)

  useEffect(() => {
    if (id) {
      fetchRoute(Number(id))
    }
  }, [id])

  const fetchRoute = async (routeId: number) => {
    setLoading(true)
    try {
      const res = await getPublicRouteById(routeId)
      if (res.data.code === 200) {
        setRoute(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch route:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!route && !loading) {
    return <div>路线不存在</div>
  }

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Spin spinning={loading}>
        {route && (
          <div>
            <div
              style={{
                height: 300,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 80,
                marginBottom: 24,
              }}
            >
              <EnvironmentOutlined />
            </div>

            <Card>
              <Title level={2}>{route.routeName}</Title>

              <Space wrap style={{ marginBottom: 24 }}>
                <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
                  <EnvironmentOutlined /> {route.city}
                </Tag>
                <Tag color="green" style={{ fontSize: 14, padding: '4px 12px' }}>
                  <CalendarOutlined /> {route.durationDays}天行程
                </Tag>
                <Tag color="orange" style={{ fontSize: 14, padding: '4px 12px' }}>
                  <UserOutlined /> 最多{route.maxCapacity}人
                </Tag>
                <Tag color={route.status === 'ACTIVE' ? 'success' : 'default'} style={{ fontSize: 14, padding: '4px 12px' }}>
                  {route.status === 'ACTIVE' ? '可预订' : '已下架'}
                </Tag>
              </Space>

              <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Statistic
                    title="基础价格"
                    value={route.basePrice}
                    precision={2}
                    prefix="¥"
                    suffix="/人"
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic title="行程天数" value={route.durationDays} suffix="天" />
                </Col>
                <Col span={8}>
                  <Statistic title="最大容量" value={route.maxCapacity} suffix="人" />
                </Col>
              </Row>

              <Title level={4}>路线介绍</Title>
              <Paragraph>{route.description}</Paragraph>

              <Space style={{ marginTop: 24 }}>
                <Button type="primary" size="large" disabled={route.status !== 'ACTIVE'}>
                  立即预订
                </Button>
                <Button size="large">收藏路线</Button>
              </Space>
            </Card>
          </div>
        )}
      </Spin>
    </div>
  )
}

export default RouteDetail
