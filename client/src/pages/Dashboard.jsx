import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  Input,
  Button,
  Select,
  Space,
  List,
  Tag,
  Image,
  Spin,
  Empty
} from 'antd'
import {
  RiseOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ToolOutlined,
  WarningOutlined,
  TeamOutlined,
  ApartmentOutlined,
  SearchOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { useNavigate } from 'react-router-dom'

const { Search } = Input
const { Option } = Select

const eventTypeMap = {
  FACILITY_DAMAGE: '设施损坏',
  ENVIRONMENT: '环境卫生',
  SECURITY: '治安问题',
  PUBLIC_SERVICE: '公共服务',
  OTHER: '其他'
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({})
  const [trendData, setTrendData] = useState([])
  const [typeData, setTypeData] = useState([])
  const [gridData, setGridData] = useState([])
  const [completedEvents, setCompletedEvents] = useState([])
  const [damagedFacilities, setDamagedFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchType, setSearchType] = useState('event')
  const [searchKeyword, setSearchKeyword] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, trendRes, typeRes, gridRes, eventsRes, facilitiesRes] = await Promise.all([
        request.get('/stats/dashboard'),
        request.get('/stats/event-trend', { params: { days: 30 } }),
        request.get('/stats/event-type'),
        request.get('/stats/event-by-grid'),
        request.get('/events', { params: { status: 'COMPLETED', pageSize: 5 } }),
        request.get('/facilities', { params: { status: 'DAMAGED', pageSize: 6 } })
      ])

      setStats(statsRes.data)
      setTrendData(trendRes.data)
      setTypeData(typeRes.data)
      setGridData(gridRes.data)
      setCompletedEvents(eventsRes.data.list)
      setDamagedFacilities(facilitiesRes.data.list)
    } catch (error) {
      console.error('获取看板数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (!searchKeyword) return
    if (searchType === 'event') {
      navigate(`/events?keyword=${encodeURIComponent(searchKeyword)}`)
    } else {
      navigate(`/facilities?keyword=${encodeURIComponent(searchKeyword)}`)
    }
  }

  const lineChartOption = {
    title: {
      text: '事件闭环趋势',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['上报数量', '完成数量'],
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.map((item) => dayjs(item.date).format('MM-DD'))
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '上报数量',
        type: 'line',
        smooth: true,
        data: trendData.map((item) => item.count || item.reported || 0),
        itemStyle: { color: '#1890ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '完成数量',
        type: 'line',
        smooth: true,
        data: trendData.map((item) => item.completed || 0),
        itemStyle: { color: '#52c41a' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(82, 196, 26, 0.3)' },
              { offset: 1, color: 'rgba(82, 196, 26, 0.05)' }
            ]
          }
        }
      }
    ]
  }

  const pieChartOption = {
    title: {
      text: '事件类型分布',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      type: 'scroll'
    },
    series: [
      {
        name: '事件类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: typeData.map((item) => ({
          value: item.count,
          name: eventTypeMap[item.type] || item.type
        }))
      }
    ]
  }

  const barChartOption = {
    title: {
      text: '网格事件分布',
      left: 'center',
      textStyle: { fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: gridData.map((item) => item.gridName),
      axisLabel: { rotate: 30, interval: 0 }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '事件数',
        type: 'bar',
        data: gridData.map((item) => item.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#722ed1' },
              { offset: 1, color: '#9254de' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        },
        barWidth: '40%'
      }
    ]
  }

  const statCards = [
    {
      title: '今日上报',
      value: stats.totalEvents || 0,
      prefix: <RiseOutlined />,
      suffix: '件',
      color: '#3f8600',
      bgColor: '#f6ffed'
    },
    {
      title: '待处理',
      value: stats.pendingEvents || 0,
      prefix: <ClockCircleOutlined />,
      suffix: '件',
      color: '#cf1322',
      bgColor: '#fff1f0'
    },
    {
      title: '处理中',
      value: stats.processingEvents || 0,
      prefix: <SyncOutlined spin />,
      suffix: '件',
      color: '#1890ff',
      bgColor: '#e6f7ff'
    },
    {
      title: '已完成',
      value: stats.completedEvents || 0,
      prefix: <CheckCircleOutlined />,
      suffix: '件',
      color: '#52c41a',
      bgColor: '#f6ffed'
    },
    {
      title: '设施总数',
      value: stats.totalFacilities || 0,
      prefix: <ToolOutlined />,
      suffix: '个',
      color: '#722ed1',
      bgColor: '#f9f0ff'
    },
    {
      title: '损坏设施',
      value: stats.damagedFacilities || 0,
      prefix: <WarningOutlined />,
      suffix: '个',
      color: '#fa8c16',
      bgColor: '#fff7e6'
    },
    {
      title: '网格员',
      value: stats.totalGridWorkers || 0,
      prefix: <TeamOutlined />,
      suffix: '人',
      color: '#13c2c2',
      bgColor: '#e6fffb'
    },
    {
      title: '责任部门',
      value: stats.totalDepartments || 0,
      prefix: <ApartmentOutlined />,
      suffix: '个',
      color: '#eb2f96',
      bgColor: '#fff0f6'
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>日常看板</h2>

      <Card style={{ marginBottom: 16 }}>
        <Space>
          <span>搜索类型：</span>
          <Select value={searchType} onChange={setSearchType} style={{ width: 120 }}>
            <Option value="event">事件</Option>
            <Option value="facility">设施</Option>
          </Select>
          <Search
            placeholder="输入关键词搜索..."
            allowClear
            enterButton
            size="large"
            style={{ width: 400 }}
            onSearch={handleSearch}
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </Space>
      </Card>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          {statCards.map((card, index) => (
            <Col span={6} key={index}>
              <Card style={{ backgroundColor: card.bgColor }}>
                <Statistic
                  title={card.title}
                  value={card.value}
                  valueStyle={{ color: card.color }}
                  prefix={card.prefix}
                  suffix={card.suffix}
                />
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={14}>
            <Card>
              <ReactECharts option={lineChartOption} style={{ height: 350 }} />
            </Card>
          </Col>
          <Col span={10}>
            <Card>
              <ReactECharts option={pieChartOption} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={14}>
            <Card title="结果公示" extra={<Button type="link" onClick={() => navigate('/events')}>更多</Button>}>
              {completedEvents.length > 0 ? (
                <List
                  dataSource={completedEvents}
                  renderItem={(item) => (
                    <List.Item key={item.id}>
                      <List.Item.Meta
                        title={
                          <Space>
                            <span>{item.title}</span>
                            <Tag color="green">已完成</Tag>
                          </Space>
                        }
                        description={
                          <Space>
                            <span>{item.grid?.name}</span>
                            <span>·</span>
                            <span>{dayjs(item.completedAt || item.updatedAt).format('YYYY-MM-DD')}</span>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="暂无完成的事件" />
              )}
            </Card>
          </Col>
          <Col span={10}>
            <Card>
              <ReactECharts option={barChartOption} style={{ height: 350 }} />
            </Card>
          </Col>
        </Row>

        <Card
          title="设施照片展示"
          extra={<Button type="link" onClick={() => navigate('/facilities')}>更多</Button>}
        >
          <Row gutter={[16, 16]}>
            {damagedFacilities.length > 0 ? (
              damagedFacilities.map((facility) => (
                <Col span={4} key={facility.id}>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 120,
                          background: facility.image
                            ? `url(${facility.image}) center/cover`
                            : '#f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#999',
                          fontSize: 12
                        }}
                      >
                        {!facility.image && '暂无照片'}
                      </div>
                    }
                    bodyStyle={{ padding: 12 }}
                  >
                    <Card.Meta
                      title={<span style={{ fontSize: 14 }}>{facility.name}</span>}
                      description={
                        <Space>
                          <Tag color="red" size="small">损坏</Tag>
                          <span style={{ fontSize: 12, color: '#999' }}>
                            {facility.grid?.name}
                          </span>
                        </Space>
                      }
                    />
                  </Card>
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty description="暂无损坏设施照片" />
              </Col>
            )}
          </Row>
        </Card>

        <div style={{ marginTop: 16, textAlign: 'right', color: '#999', fontSize: 12 }}>
          数据更新时间：{dayjs().format('YYYY-MM-DD HH:mm:ss')}
        </div>
      </Spin>
    </div>
  )
}

export default Dashboard
