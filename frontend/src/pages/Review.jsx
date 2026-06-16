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
  Rate,
  Modal,
  Form,
  Input,
  Button,
  message,
  Space,
  Tooltip,
  Alert
} from 'antd'
import {
  BarChartOutlined,
  UserOutlined,
  MessageOutlined,
  EditOutlined,
  WarningOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  Legend,
  ResponsiveContainer
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
    },
    {
      title: '核销失败数',
      dataIndex: 'failedCount',
      render: (v) => v > 0
        ? <Tag color="red"><WarningOutlined /> {v}</Tag>
        : <Tag>0</Tag>
    },
    {
      title: '调整后到场率',
      dataIndex: 'adjustedAttendanceRate',
      render: (v, record) => {
        const delta = record.attendanceRateDelta
        return (
          <Space>
            <Tag color={v >= 80 ? 'green' : v >= 50 ? 'orange' : 'red'}>{v}%</Tag>
            {delta !== 0 && (
              <Tooltip title={`核销失败导致到场率变化 ${delta}%`}>
                <span style={{ color: delta < 0 ? '#ff4d4f' : '#52c41a', fontSize: 12 }}>
                  <ArrowDownOutlined /> {delta}%
                </span>
              </Tooltip>
            )}
          </Space>
        )
      }
    }
  ]

  const failedCheckInColumns = [
    { title: '订单号', dataIndex: ['order', 'orderNo'], width: 150 },
    {
      title: '来源单据',
      dataIndex: ['order', 'sourceOrder'],
      width: 130,
      render: (v) => v ? <Tag color="blue">{v}</Tag> : '-'
    },
    { title: '场次', dataIndex: ['session', 'name'], width: 120 },
    { title: '票种/座位', dataIndex: 'orderItem', width: 130,
      render: (v) => v ? `${v.ticketName}${v.seatName ? ` / ${v.seatName}` : ''}` : '-'
    },
    { title: '购票人', dataIndex: ['user', 'name'], width: 80 },
    { title: '操作人', dataIndex: ['operator', 'name'], width: 80, render: (v) => v || '-' },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      width: 180,
      ellipsis: true,
      render: (v) => <Tag color="red">{v}</Tag>
    },
    {
      title: '处理备注',
      dataIndex: 'handleRemark',
      width: 150,
      ellipsis: true,
      render: (v) => v || <span style={{ color: '#d9d9d9' }}>未处理</span>
    },
    { title: '来源单号', dataIndex: 'sourceOrder', width: 130, render: (v) => v || '-' },
    {
      title: '时间',
      dataIndex: 'createdAt',
      width: 150,
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
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

  const totalFailed = reviewData.failedCheckIns?.length || 0
  const avgAttendanceDelta = reviewData.sessionStats?.length > 0
    ? (reviewData.sessionStats.reduce((s, r) => s + r.attendanceRateDelta, 0) / reviewData.sessionStats.length).toFixed(2)
    : 0

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
        <Col span={4}>
          <Card>
            <Statistic
              title="总订单"
              value={reviewData.totalOrders}
              prefix={<MessageOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
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
        <Col span={4}>
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
        <Col span={4}>
          <Card>
            <Statistic
              title="反馈数量"
              value={reviewData.totalFeedbacks}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="核销失败"
              value={totalFailed}
              valueStyle={{ color: totalFailed > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="到场率影响"
              value={avgAttendanceDelta}
              precision={2}
              suffix="%"
              valueStyle={{ color: parseFloat(avgAttendanceDelta) < 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={parseFloat(avgAttendanceDelta) < 0 ? <ArrowDownOutlined /> : null}
            />
          </Card>
        </Col>
      </Row>

      {totalFailed > 0 && (
        <Alert
          message={`当前活动有 ${totalFailed} 条核销失败记录，已导致平均到场率变化 ${avgAttendanceDelta}%`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card title="场次到场数据 & 核销影响" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={14}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={reviewData.sessionStats || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="sessionName" />
                <YAxis />
                <RTooltip />
                <Legend />
                <Bar dataKey="totalSeats" name="总座位" fill="#1890ff" />
                <Bar dataKey="soldSeats" name="售出" fill="#52c41a" />
                <Bar dataKey="checkedIn" name="到场" fill="#722ed1" />
                <Bar dataKey="failedCount" name="核销失败" fill="#ff4d4f" />
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
              scroll={{ x: 700 }}
            />
          </Col>
        </Row>
      </Card>

      <Card
        tabList={[
          { key: 'failedCheckins', tab: <span><WarningOutlined /> 核销失败记录</span> },
          { key: 'feedback', tab: '到场反馈' },
          { key: 'revenue', tab: '收入明细' }
        ]}
        defaultActiveKey="failedCheckins"
      >
        <Tabs defaultActiveKey="failedCheckins" items={[
          {
            key: 'failedCheckins',
            label: <span><WarningOutlined /> 核销失败记录</span>,
            children: (
              <>
                {totalFailed === 0 ? (
                  <div style={{ textAlign: 'center', padding: 40, color: '#52c41a' }}>
                    <WarningOutlined style={{ fontSize: 40, marginBottom: 16 }} />
                    <p>当前活动暂无核销失败记录</p>
                  </div>
                ) : (
                  <Table
                    rowKey="id"
                    columns={failedCheckInColumns}
                    dataSource={reviewData.failedCheckIns || []}
                    pagination={{ pageSize: 10 }}
                    scroll={{ x: 1200 }}
                  />
                )}
              </>
            )
          },
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
