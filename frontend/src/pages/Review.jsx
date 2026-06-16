import React, { useState, useEffect } from 'react'
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Tabs,
  List,
  Avatar,
  Rate,
  Modal,
  Form,
  Input,
  Button,
  message,
  Divider,
  Space
} from 'antd'
import {
  BarChartOutlined,
  DollarOutlined,
  UserOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  EditOutlined
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import dayjs from 'dayjs'
import { dashboardAPI, feedbackAPI, revenueAPI } from '../services/api.js'

const { Option } = Select
const { TextArea } = Input

function Review() {
  const [selectedEvent, setSelectedEvent] = useState('')
  const [reviewData, setReviewData] = useState(null)
  const [events, setEvents] = useState([])
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [currentFeedback, setCurrentFeedback] = useState(null)
  const [form] = Form.useForm()
  const [revenueSummary, setRevenueSummary] = useState(null)

  useEffect(() => {
    loadEvents()
  }, [])

  useEffect(() => {
    if (selectedEvent) {
      loadReviewData()
      loadRevenueSummary()
    }
  }, [selectedEvent])

  const loadEvents = async () => {
    try {
      const result = await fetch('/api/events?pageSize=100', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
      const data = await result.json()
      if (data.code === 0) {
        setEvents(data.data.list)
        if (data.data.list.length > 0) {
          setSelectedEvent(data.data.list[0].id.toString())
        }
      }
    } catch (e) {}
  }

  const loadReviewData = async () => {
    try {
      const data = await dashboardAPI.getReviewSummary({ eventId: selectedEvent })
      setReviewData(data)
    } catch (e) {}
  }

  const loadRevenueSummary = async () => {
    try {
      const data = await revenueAPI.getSummary(selectedEvent)
      setRevenueSummary(data)
    } catch (e) {}
  }

  const handleEditFeedback = (record) => {
    setCurrentFeedback(record)
    form.setFieldsValue({ handleRemark: record.handleRemark })
    setFeedbackModalVisible(true)
  }

  const handleFeedbackSubmit = async (values) => {
    try {
      await feedbackAPI.update(currentFeedback.id, values)
      message.success('保存成功')
      setFeedbackModalVisible(false)
      loadReviewData()
    } catch (e) {}
  }

  const sessionColumns = [
    { title: '场次名称', dataIndex: 'sessionName' },
    {
      title: '总座位',
      dataIndex: 'totalSeats',
      render: (v) => <span style={{ color: '#1890ff' }}>{v}</span>
    },
    {
      title: '售出',
      dataIndex: 'soldSeats',
      render: (v) => <span style={{ color: '#52c41a' }}>{v}</span>
    },
    {
      title: '到场',
      dataIndex: 'checkedIn',
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

  const revenueColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      render: (v) => (
        <Tag color={v === 'SALE' ? 'green' : 'red'}>
          {v === 'SALE' ? '售票收入' : '退款支出'}
        </Tag>
      )
    },
    {
      title: '金额',
      dataIndex: 'amount',
      render: (v) => (
        <span style={{ color: parseFloat(v) > 0 ? '#52c41a' : '#ff4d4f', fontWeight: 'bold' }}>
          {parseFloat(v) > 0 ? '+' : ''}¥{v}
        </span>
      )
    },
    { title: '描述', dataIndex: 'description' },
    { title: '来源单据', dataIndex: 'sourceOrder', render: (v) => v || '-' },
    {
      title: '操作人',
      dataIndex: ['operator', 'name'],
      render: (v) => v || '-'
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    }
  ]

  const feedbackColumns = [
    { title: '订单号', dataIndex: ['order', 'orderNo'] },
    { title: '来源单据', dataIndex: ['order', 'sourceOrder'], render: (v) => v || '-' },
    {
      title: '评分',
      dataIndex: 'rating',
      render: (v) => <Rate disabled value={v} allowHalf style={{ fontSize: 14 }} />
    },
    { title: '反馈类型', dataIndex: 'feedbackType', render: (v) => <Tag>{v}</Tag> },
    { title: '反馈内容', dataIndex: 'content', ellipsis: true },
    { title: '处理备注', dataIndex: 'handleRemark', ellipsis: true },
    {
      title: '时间',
      dataIndex: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditFeedback(record)}>
          处理
        </Button>
      )
    }
  ]

  if (!reviewData) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h2>业务复盘</h2>
          <Select
            placeholder="选择活动"
            style={{ width: 250 }}
            value={selectedEvent || undefined}
            onChange={setSelectedEvent}
          >
            {events.map(e => (
              <Option key={e.id} value={e.id.toString()}>{e.name}</Option>
            ))}
          </Select>
        </div>
        <Card>
          <p style={{ textAlign: 'center', color: '#999' }}>请选择活动查看复盘数据</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <BarChartOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          <h2>业务复盘 - {reviewData.event?.name}</h2>
        </Space>
        <Select
          placeholder="选择活动"
          style={{ width: 250 }}
          value={selectedEvent || undefined}
          onChange={setSelectedEvent}
        >
          {events.map(e => (
            <Option key={e.id} value={e.id.toString()}>{e.name}</Option>
          ))}
        </Select>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总订单"
              value={reviewData.totalOrders}
              prefix={<MessageOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="票务总收入"
              value={reviewData.totalRevenue}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均评分"
              value={reviewData.avgRating}
              precision={1}
              suffix="/ 5"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="反馈数量"
              value={reviewData.totalFeedbacks}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="场次到场数据" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={14}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={reviewData.sessionStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sessionName" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="totalSeats" name="总座位" fill="#1890ff" />
                <Bar dataKey="soldSeats" name="售出" fill="#52c41a" />
                <Bar dataKey="checkedIn" name="到场" fill="#722ed1" />
              </BarChart>
            </ResponsiveContainer>
          </Col>
          <Col span={10}>
            <Table
              size="small"
              rowKey="sessionId"
              columns={sessionColumns}
              dataSource={reviewData.sessionStats || []}
              pagination={false}
            />
          </Col>
        </Row>
      </Card>

      <Card
        tabList={[
          { key: 'feedback', tab: '到场反馈' },
          { key: 'revenue', tab: '收入明细' }
        ]}
        defaultActiveKey="feedback"
      >
        <Tabs defaultActiveKey="feedback" items={[
          {
            key: 'feedback',
            label: '到场反馈',
            children: (
              <Table
                rowKey="id"
                columns={feedbackColumns}
                dataSource={reviewData.feedbacks || []}
                pagination={false}
              />
            )
          },
          {
            key: 'revenue',
            label: '收入明细',
            children: (
              <>
                {revenueSummary && (
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={8}>
                      <Statistic title="总收入" value={revenueSummary.totalIncome} prefix="¥" valueStyle={{ color: '#52c41a' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="总退款" value={revenueSummary.totalRefund} prefix="¥" valueStyle={{ color: '#ff4d4f' }} />
                    </Col>
                    <Col span={8}>
                      <Statistic title="净收入" value={revenueSummary.netRevenue} prefix="¥" valueStyle={{ color: '#1890ff', fontWeight: 'bold' }} />
                    </Col>
                  </Row>
                )}
                <Table
                  rowKey="id"
                  columns={revenueColumns}
                  dataSource={reviewData.revenueLogs || []}
                  pagination={{ pageSize: 10 }}
                />
              </>
            )
          }
        ]} />
      </Card>

      <Modal
        title="处理反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={500}
      >
        {currentFeedback && (
          <div>
            <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <p><strong>订单号：</strong>{currentFeedback.order?.orderNo}</p>
              <p><strong>来源单据：</strong>{currentFeedback.order?.sourceOrder || '-'}</p>
              <p><strong>评分：</strong><Rate disabled value={currentFeedback.rating} allowHalf style={{ fontSize: 16 }} /></p>
              <p><strong>反馈内容：</strong>{currentFeedback.content}</p>
            </div>
            <Form form={form} layout="vertical" onFinish={handleFeedbackSubmit}>
              <Form.Item name="handleRemark" label="处理备注" rules={[{ required: true, message: '请输入处理备注' }]}>
                <TextArea rows={4} placeholder="请输入处理备注" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block>保存处理结果</Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Review
