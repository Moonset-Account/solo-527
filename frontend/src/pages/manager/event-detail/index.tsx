import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Timeline,
  Tabs,
  Table,
  Button,
  Space,
  Row,
  Col,
  Empty,
  Image,
  Spin
} from 'antd'
import {
  ArrowLeftOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getEventDetail,
  getEventStatusLogs,
  getEventReviews,
  getEventVisits,
  getPatrolTaskList
} from '@/api'
import type {
  GridEvent,
  EventStatus,
  EventCategory,
  EventStatusLog,
  RectificationReview,
  FollowUpVisit,
  PatrolTask
} from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<EventStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  processing: { label: '处理中', color: 'blue' },
  pending_review: { label: '待复查', color: 'purple' },
  pending_visit: { label: '待回访', color: 'cyan' },
  completed: { label: '已完成', color: 'green' },
  rejected: { label: '已驳回', color: 'red' }
}

const categoryMap: Record<EventCategory, string> = {
  environment: '环境卫生',
  security: '治安安全',
  facility: '设施损坏',
  civil: '民事纠纷',
  other: '其他'
}

const statusTimelineMap: Record<EventStatus, string> = {
  pending: '事件上报',
  processing: '开始处理',
  pending_review: '申请复查',
  pending_visit: '等待回访',
  completed: '事件完成',
  rejected: '事件驳回'
}

const EventDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [event, setEvent] = useState<GridEvent | null>(null)
  const [logs, setLogs] = useState<EventStatusLog[]>([])
  const [reviews, setReviews] = useState<RectificationReview[]>([])
  const [visits, setVisits] = useState<FollowUpVisit[]>([])
  const [tasks, setTasks] = useState<PatrolTask[]>([])

  useEffect(() => {
    if (id) loadData(Number(id))
  }, [id])

  const loadData = async (eventId: number) => {
    setLoading(true)
    try {
      const [eRes, lRes, rRes, vRes, tRes] = await Promise.all([
        getEventDetail(eventId),
        getEventStatusLogs(eventId),
        getEventReviews(eventId),
        getEventVisits(eventId),
        getPatrolTaskList({ page: 1, pageSize: 100 })
      ])
      setEvent(eRes.data)
      setLogs(lRes.data)
      setReviews(rRes.data)
      setVisits(vRes.data)
      setTasks(tRes.data.list)
    } finally {
      setLoading(false)
    }
  }

  const reviewColumns = [
    {
      title: '复查人',
      dataIndex: 'reviewerName',
      width: 120
    },
    {
      title: '复查结果',
      dataIndex: 'result',
      width: 100,
      render: (result: string) => (
        <Tag color={result === 'pass' ? 'green' : 'red'}>
          {result === 'pass' ? '合格' : '不合格'}
        </Tag>
      )
    },
    {
      title: '复查意见',
      dataIndex: 'comment'
    },
    {
      title: '复查时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ]

  const visitColumns = [
    {
      title: '回访人',
      dataIndex: 'visitorName',
      width: 120
    },
    {
      title: '居民姓名',
      dataIndex: 'residentName',
      width: 120
    },
    {
      title: '联系电话',
      dataIndex: 'residentPhone',
      width: 140
    },
    {
      title: '回访结果',
      dataIndex: 'visitResult'
    },
    {
      title: '回访时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ]

  const taskColumns = [
    {
      title: '任务标题',
      dataIndex: 'title'
    },
    {
      title: '巡查区域',
      dataIndex: 'area',
      width: 150
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      width: 120
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: string) => {
        const map: Record<string, { label: string; color: string }> = {
          pending: { label: '待开始', color: 'orange' },
          in_progress: { label: '进行中', color: 'blue' },
          completed: { label: '已完成', color: 'green' },
          expired: { label: '已超时', color: 'red' }
        }
        const s = map[status]
        return s ? <Tag color={s.color}>{s.label}</Tag> : status
      }
    },
    {
      title: '截止时间',
      dataIndex: 'endTime',
      width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回列表
          </Button>
        </Space>

        {event && (
          <>
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="事件编号">{event.id}</Descriptions.Item>
                <Descriptions.Item label="事件状态">
                  <Tag color={statusMap[event.status].color}>
                    {statusMap[event.status].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="事件标题" span={2}>
                  {event.title}
                </Descriptions.Item>
                <Descriptions.Item label="事件类型">
                  {categoryMap[event.category]}
                </Descriptions.Item>
                <Descriptions.Item label="上报人">{event.reporterName}</Descriptions.Item>
                <Descriptions.Item label="处理人">
                  {event.handlerName || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="发生地点" span={2}>
                  <Space>
                    <EnvironmentOutlined />
                    {event.address}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="经度">{event.longitude}</Descriptions.Item>
                <Descriptions.Item label="纬度">{event.latitude}</Descriptions.Item>
                <Descriptions.Item label="事件描述" span={2}>
                  {event.description}
                </Descriptions.Item>
                <Descriptions.Item label="上报时间" span={2}>
                  {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {event.images && event.images.length > 0 && (
                  <Descriptions.Item label="现场照片" span={2}>
                    <Image.PreviewGroup>
                      <Row gutter={[8, 8]}>
                        {event.images.map((img, idx) => (
                          <Col key={idx} span={6}>
                            <Image
                              width="100%"
                              height={120}
                              src={img}
                              style={{ objectFit: 'cover', borderRadius: 4 }}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Image.PreviewGroup>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card title="状态流转时间线" style={{ marginBottom: 16 }}>
              {logs.length > 0 ? (
                <Timeline
                  items={logs.map(log => ({
                    color: log.toStatus === 'completed' ? 'green' : log.toStatus === 'rejected' ? 'red' : 'blue',
                    dot: log.toStatus === 'completed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                    children: (
                      <div>
                        <Space>
                          <Tag color={statusMap[log.toStatus]?.color}>
                            {statusTimelineMap[log.toStatus] || log.toStatus}
                          </Tag>
                          <strong>{log.operatorName}</strong>
                          <span style={{ color: '#999' }}>
                            {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </span>
                        </Space>
                        {log.remark && (
                          <div style={{ marginTop: 4, color: '#666' }}>{log.remark}</div>
                        )}
                      </div>
                    )
                  }))}
                />
              ) : (
                <Empty description="暂无状态流转记录" />
              )}
            </Card>

            <Card>
              <Tabs
                defaultActiveKey="tasks"
                items={[
                  {
                    key: 'tasks',
                    label: `关联巡查任务 (${tasks.length})`,
                    children: tasks.length > 0 ? (
                      <Table
                        columns={taskColumns}
                        dataSource={tasks}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无关联任务" />
                    )
                  },
                  {
                    key: 'reviews',
                    label: `整改复查记录 (${reviews.length})`,
                    children: reviews.length > 0 ? (
                      <Table
                        columns={reviewColumns}
                        dataSource={reviews}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无复查记录" />
                    )
                  },
                  {
                    key: 'visits',
                    label: `随访回访记录 (${visits.length})`,
                    children: visits.length > 0 ? (
                      <Table
                        columns={visitColumns}
                        dataSource={visits}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    ) : (
                      <Empty description="暂无回访记录" />
                    )
                  }
                ]}
              />
            </Card>
          </>
        )}
      </div>
    </Spin>
  )
}

export default EventDetail
