import { useState, useEffect } from 'react'
import { Card, Row, Col, Tag, Button, Input, Select, Empty, Spin, Typography, Space } from 'antd'
import { EnvironmentOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getAllActiveRoutes } from '@/api/route'
import type { TourRoute } from '@/types'

const { Title, Paragraph } = Typography
const { Search } = Input
const { Option } = Select

const RouteList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [routes, setRoutes] = useState<TourRoute[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<TourRoute[]>([])
  const [searchText, setSearchText] = useState('')
  const [cityFilter, setCityFilter] = useState<string | undefined>()

  useEffect(() => {
    fetchRoutes()
  }, [])

  useEffect(() => {
    let result = routes
    if (searchText) {
      result = result.filter(
        (r) =>
          r.routeName.includes(searchText) ||
          r.description?.includes(searchText)
      )
    }
    if (cityFilter) {
      result = result.filter((r) => r.city === cityFilter)
    }
    setFilteredRoutes(result)
  }, [routes, searchText, cityFilter])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const res = await getAllActiveRoutes()
      if (res.data.code === 200) {
        setRoutes(res.data.data)
        setFilteredRoutes(res.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch routes:', error)
    } finally {
      setLoading(false)
    }
  }

  const cities = [...new Set(routes.map((r) => r.city).filter(Boolean))]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>精选导览路线</Title>
        <Paragraph type="secondary">探索城市之美，发现不一样的风景</Paragraph>
      </div>

      <Space wrap style={{ marginBottom: 24 }}>
        <Search
          placeholder="搜索路线名称或描述"
          allowClear
          style={{ width: 300 }}
          onSearch={setSearchText}
          onChange={(e) => !e.target.value && setSearchText('')}
        />
        <Select
          placeholder="选择城市"
          allowClear
          style={{ width: 150 }}
          value={cityFilter}
          onChange={setCityFilter}
        >
          {cities.map((city) => (
            <Option key={city} value={city}>
              {city}
            </Option>
          ))}
        </Select>
      </Space>

      <Spin spinning={loading}>
        {filteredRoutes.length === 0 && !loading ? (
          <Empty description="暂无路线" />
        ) : (
          <Row gutter={[24, 24]}>
            {filteredRoutes.map((route) => (
              <Col xs={24} sm={12} lg={8} key={route.id}>
                <Card
                  hoverable
                  style={{ height: '100%' }}
                  cover={
                    <div
                      style={{
                        height: 160,
                        background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 48,
                      }}
                    >
                      <EnvironmentOutlined />
                    </div>
                  }
                  actions={[
                    <Button
                      type="primary"
                      onClick={() => navigate(`/route/${route.id}`)}
                    >
                      查看详情
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    title={route.routeName}
                    description={
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space>
                          <Tag color="blue">{route.city}</Tag>
                          <Tag color="green">{route.durationDays}天</Tag>
                        </Space>
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ marginBottom: 8 }}
                          type="secondary"
                        >
                          {route.description}
                        </Paragraph>
                        <Space>
                          <span style={{ color: '#ff4d4f', fontSize: 18, fontWeight: 'bold' }}>
                            ¥{route.basePrice}
                          </span>
                          <span style={{ color: '#999' }}>/人</span>
                          <span style={{ marginLeft: 'auto', color: '#999' }}>
                            <UserOutlined /> 最多{route.maxCapacity}人
                          </span>
                        </Space>
                      </Space>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </div>
  )
}

export default RouteList
