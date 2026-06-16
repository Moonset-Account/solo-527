import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Select, Table, Tag, Space } from 'antd'
import {
  CalendarOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  UserOutlined
} from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { dashboardAPI } from '../services/api.js'

const { Option } = Select

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [conversion, setConversion] = useState([])
  const [revenueTrend, setRevenueTrend] = useState([])
  const [eventId, setEventId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSummary()
    loadConversion()
    loadRevenueTrend()
  }, [eventId])

  const loadSummary = async () => {
    try {
      const data = await dashboardAPI.getSummary(eventId ? { eventId } : {})
      setSummary(data)
    } catch (e) {}
  }

  const loadConversion = async () => {
    try {
      const data = await dashboardAPI.getConversion(eventId ? { eventId } : {})
      setConversion(data)
    } catch (e) {}
  }

  const loadRevenueTrend = async () => {
    try {
      const data = await dashboardAPI.getRevenueTrend(eventId ? { eventId } : {})
      setRevenueTrend(data)
    } catch (e) {}
  }

  const conversionColumns = [
    { title: '活动名称', dataIndex: 'eventName' },
    {
      title: '总库存',
      dataIndex: 'totalInventory',
      render: (v) => <span style={{ color: '#1890ff' }}>{v}</span>
    },
    {
      title: '已售出',
      dataIndex: 'totalSold',
      render: (v) => <span style={{ color: '#52c41a' }}>{v}</span>
    },
    {
      title: '转化率',
      dataIndex: 'conversionRate',
      render: (v) => (
        <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag>
      )
    },
    {
      title: '到场数',
      dataIndex: 'totalCheckedIn',
      render: (v) => <span style={{ color: '#722ed1' }}>{v}</span>
    },
    {
      title: '到场率',
      dataIndex: 'attendanceRate',
      render: (v) => (
        <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>数据总览</h2>
        <Select
          placeholder="选择活动"
          style={{ width: 200 }}
          allowClear
          value={eventId || undefined}
          onChange={setEventId}
        >
          <Option value="">全部活动</Option>
        </Select>
      </div>

      <Row gutter={16} className="dashboard-summary" style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="活动总数"
              value={summary?.totalEvents || 0}
              prefix={<CalendarOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="订单总数"
              value={summary?.totalOrders || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="票务收入"
              value={summary?.totalRevenue || 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="到场率"
              value={summary?.attendanceRate || 0}
              suffix="%"
              prefix={<RiseOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card title="收入趋势" className="chart-container" style={{ marginBottom: 16 }}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" name="收入" stroke="#52c41a" strokeWidth={2} />
                <Line type="monotone" dataKey="refund" name="退款" stroke="#ff4d4f" strokeWidth={2} />
                <Line type="monotone" dataKey="net" name="净收入" stroke="#1890ff" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col span={10}>
          <Card title="待处理事项" className="chart-container">
            <Row gutter={[0, 16]}>
              <Col span={12}>
                <Statistic
                  title="待核销"
                  value={0}
                  valueStyle={{ color: '#faad14' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="待退款"
                  value={summary?.pendingRefunds || 0}
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="待办事项"
                  value={0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="未读通知"
                  value={0}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card title="转化与到场数据" style={{ marginTop: 16 }}>
        <Table
          rowKey="eventId"
          columns={conversionColumns}
          dataSource={conversion}
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard
