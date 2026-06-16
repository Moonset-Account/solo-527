import React, { useState, useEffect } from 'react'
import { Card, Descriptions, Button, Tabs, Table, Tag, Space, Statistic, Row, Col } from 'antd'
import { ArrowLeftOutlined, ShopOutlined, CheckCircleOutlined, UserOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { eventAPI, checkInAPI } from '../services/api.js'

function EventDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [checkInStats, setCheckInStats] = useState([])

  useEffect(() => {
    loadDetail()
    loadCheckInStats()
  }, [id])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await eventAPI.getDetail(id)
      setEvent(data)
    } finally {
      setLoading(false)
    }
  }

  const loadCheckInStats = async () => {
    try {
      const data = await checkInAPI.getStats(id)
      setCheckInStats(data)
    } catch (e) {}
  }

  const ticketColumns = [
    { title: '票种名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type' },
    { title: '价格', dataIndex: 'price', render: (p) => `¥${p}` },
    { title: '库存', dataIndex: 'quantity' },
    { title: '已售', dataIndex: 'sold' },
    {
      title: '状态',
      dataIndex: 'sold',
      render: (sold, record) => {
        const rate = record.quantity > 0 ? (sold / record.quantity * 100).toFixed(1) : 0
        return <Tag color="blue">已售 {rate}%</Tag>
      }
    }
  ]

  const sessionColumns = [
    { title: '场次名称', dataIndex: 'sessionName' },
    { title: '总座位', dataIndex: 'totalSeats' },
    { title: '已售', dataIndex: 'soldSeats' },
    { title: '已核销', dataIndex: 'checkedIn' },
    {
      title: '到场率',
      dataIndex: 'attendanceRate',
      render: (rate) => <Tag color={rate >= 80 ? 'green' : rate >= 50 ? 'orange' : 'red'}>{rate}%</Tag>
    },
    {
      title: '核销失败',
      dataIndex: 'failed'
    }
  ]

  if (!event) return <div style={{ padding: 24 }}>加载中...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <h2>{event.name}</h2>
        </Space>
        <Space>
          <Button type="primary" onClick={() => navigate(`/events/${id}/buy`)}>
            <ShopOutlined /> 购票
          </Button>
        </Space>
      </div>

      <Card loading={loading} style={{ marginBottom: 16 }}>
        <Descriptions column={3}>
          <Descriptions.Item label="场馆">{event.venue}</Descriptions.Item>
          <Descriptions.Item label="开始时间">{dayjs(event.startTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="结束时间">{dayjs(event.endTime).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color="green">{event.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="场次数量">{event.sessions?.length || 0} 场</Descriptions.Item>
          <Descriptions.Item label="票种数量">{event.tickets?.length || 0} 种</Descriptions.Item>
        </Descriptions>
        {event.description && (
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <h4>活动介绍</h4>
            <p style={{ color: '#666' }}>{event.description}</p>
          </div>
        )}
      </Card>

      <Card
        tabList={[
          { key: 'tickets', tab: '票种信息' },
          { key: 'sessions', tab: '场次签到' }
        ]}
        defaultActiveKey="tickets"
      >
        <Tabs defaultActiveKey="tickets" items={[
          {
            key: 'tickets',
            label: '票种信息',
            children: (
              <Table
                rowKey="id"
                columns={ticketColumns}
                dataSource={event.tickets || []}
                pagination={false}
              />
            )
          },
          {
            key: 'sessions',
            label: '场次签到',
            children: (
              <Table
                rowKey="sessionId"
                columns={sessionColumns}
                dataSource={checkInStats}
                pagination={false}
              />
            )
          }
        ]} />
      </Card>
    </div>
  )
}

export default EventDetail
