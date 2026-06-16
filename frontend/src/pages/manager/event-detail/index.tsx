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
  Empty,
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
  EventType,
  EventStatusLog,
  RectificationReview,
  FollowUpVisit,
  PatrolTask,
  TaskStatus
} from '@/types'
import dayjs from 'dayjs'

const statusMap: Record<EventStatus, { label: string; color: string }> = {
  reported: { label: '已上报', color: 'orange' },
  assigned: { label: '已指派', color: 'blue' },
  processing: { label: '处理中', color: 'geekblue' },
  reviewing: { label: '待复查', color: 'purple' },
  following_up: { label: '跟进中', color: 'cyan' },
  closed: { label: '已关闭', color: 'green' },
  abnormal_closed: { label: '异常关闭', color: 'red' }
}

const eventTypeMap: Record<EventType, string> = {
  environmental_hygiene: '环境卫生',
  security_issue: '治安安全',
  facility_damage: '设施损坏',
  dispute_resolution: '民事纠纷',
  other: '其他'
}

const statusTimelineMap: Record<EventStatus, string> = {
  reported: '事件上报',
  assigned: '已指派',
  processing: '开始处理',
  reviewing: '待复查',
  following_up: '跟进中',
  closed: '事件关闭',
  abnormal_closed: '异常关闭'
}

const taskStatusMap: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'orange' },
  in_progress: { label: '进行中', color: 'blue' },
  completed: { label: '已完成', color: 'green' }
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
        getPatrolTaskList({ pageIndex: 1, pageSize: 100 })
      ])
      setEvent(eRes)
      setLogs(lRes)
      setReviews(rRes)
      setVisits(vRes)
      setTasks(tRes.items)
    } finally {
      setLoading(false)
    }
  }

  const reviewColumns = [
    {
      title: '复查人',
      dataIndex: 'reviewerName',
      width: 120,
      render: (name?: string) => name || '-'
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
      title: '备注',
      dataIndex: 'remark',
      render: (remark?: string) => remark || '-'
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
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '回访日期',
      dataIndex: 'visitDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
    },
    {
      title: '回访结果',
      dataIndex: 'visitResult',
      render: (result?: string) => result || '-'
    },
    {
      title: '是否完成',
      dataIndex: 'isCompleted',
      width: 100,
      render: (completed: boolean) => (
        <Tag color={completed ? 'green' : 'orange'}>{completed ? '已完成' : '未完成'}</Tag>
      )
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
      title: '所属网格',
      dataIndex: 'gridName',
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status: TaskStatus) => {
        const s = taskStatusMap[status]
        return s ? <Tag color={s.color}>{s.label}</Tag> : <Tag>{status}</Tag>
      }
    },
    {
      title: '计划日期',
      dataIndex: 'planDate',
      width: 120,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD')
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
                  <Tag color={statusMap[event.status]?.color || 'default'}>
                    {statusMap[event.status]?.label || event.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="事件标题" span={2}>
                  {event.title}
                </Descriptions.Item>
                <Descriptions.Item label="事件类型">
                  {eventTypeMap[event.eventType] || event.eventType}
                </Descriptions.Item>
                <Descriptions.Item label="上报人">{event.reporterName || '-'}</Descriptions.Item>
                <Descriptions.Item label="优先级">{event.priority}</Descriptions.Item>
                <Descriptions.Item label="所属网格">{event.gridName || '-'}</Descriptions.Item>
                <Descriptions.Item label="发生地点" span={2}>
                  <Space>
                    <EnvironmentOutlined />
                    {event.locationAddress}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label="经度">{event.locationLng}</Descriptions.Item>
                <Descriptions.Item label="纬度">{event.locationLat}</Descriptions.Item>
                <Descriptions.Item label="事件描述" span={2}>
                  {event.description}
                </Descriptions.Item>
                {event.closeReason && (
                  <Descriptions.Item label="关闭原因" span={2}>
                    {event.closeReason}
                  </Descriptions.Item>
                )}
                {event.sourceBillNo && (
                  <Descriptions.Item label="来源单号" span={2}>
                    {event.sourceBillNo}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="上报时间" span={2}>
                  {dayjs(event.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="状态流转时间线" style={{ marginBottom: 16 }}>
              {logs.length > 0 ? (
                <Timeline
                  items={logs.map(log => ({
                    color: log.toStatus === 'closed' ? 'green' : log.toStatus === 'abnormal_closed' ? 'red' : 'blue',
                    dot: log.toStatus === 'closed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />,
                    children: (
                      <div>
                        <Space>
                          <Tag color={statusMap[log.toStatus]?.color}>
                            {statusTimelineMap[log.toStatus] || log.toStatus}
                          </Tag>
                          <strong>{log.operatorName || '-'}</strong>
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
