import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Button, Space, Table, Tag, Progress, List, Alert } from 'antd'
import {
  AuditOutlined,
  MessageOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  BookOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '@/services/sessionService'
import { inspectionService } from '@/services/inspectionService'
import { ticketService } from '@/services/ticketService'
import { knowledgeService } from '@/services/knowledgeService'
import type { Session, Ticket, KnowledgeBase, SessionStatistics, InspectionStatistics } from '@/types'
import { formatDateTime, formatDuration, getScoreColor } from '@/utils'

export default function Dashboard() {
  const navigate = useNavigate()
  const [sessionStats, setSessionStats] = useState<SessionStatistics | null>(null)
  const [inspectionStats, setInspectionStats] = useState<InspectionStatistics | null>(null)
  const [pendingTickets, setPendingTickets] = useState(0)
  const [recentSessions, setRecentSessions] = useState<Session[]>([])
  const [expiringKnowledge, setExpiringKnowledge] = useState<KnowledgeBase[]>([])
  const [randomSessions, setRandomSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [sessionRes, inspectionRes, ticketRes, sessionsRes, knowledgeRes] = await Promise.all([
        sessionService.getStatistics(),
        inspectionService.getStatistics(),
        ticketService.getPendingCount(),
        sessionService.getSessions({ pageIndex: 1, pageSize: 5, sortDesc: true, sortBy: 'createdAt' }),
        knowledgeService.getExpiringSoon(7)
      ])

      if (sessionRes.success) setSessionStats(sessionRes.data!)
      if (inspectionRes.success) setInspectionStats(inspectionRes.data!)
      if (ticketRes.success) setPendingTickets(ticketRes.data!)
      if (sessionsRes.success) setRecentSessions(sessionsRes.data!.items)
      if (knowledgeRes.success) setExpiringKnowledge(knowledgeRes.data!)
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRandomInspection = async () => {
    try {
      const res = await sessionService.getRandomForInspection({
        count: 5,
        onlyUninspected: true
      })
      if (res.success) {
        setRandomSessions(res.data || [])
      }
    } catch (error) {
      console.error('随机抽检失败', error)
    }
  }

  const handleStartInspection = (sessionId: number) => {
    navigate(`/inspections/new/${sessionId}`)
  }

  const getScoreChartOption = () => ({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['质检平均分', '合格率']
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: [
      {
        type: 'value',
        name: '分数',
        min: 0,
        max: 100
      },
      {
        type: 'value',
        name: '合格率(%)',
        min: 0,
        max: 100
      }
    ],
    series: [
      {
        name: '质检平均分',
        type: 'line',
        smooth: true,
        data: [85, 88, 82, 90, 87, 89, 86],
        itemStyle: { color: '#1677ff' }
      },
      {
        name: '合格率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        data: [92, 95, 88, 96, 94, 93, 91],
        itemStyle: { color: '#52c41a' }
      }
    ]
  })

  const getResponseTimeChartOption = () => ({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['0-1分钟', '1-3分钟', '3-5分钟', '5-10分钟', '10分钟以上']
    },
    yAxis: {
      type: 'value',
      name: '会话数'
    },
    series: [
      {
        name: '会话数',
        type: 'bar',
        data: [120, 200, 150, 80, 30],
        itemStyle: {
          color: ['#52c41a', '#1677ff', '#faad14', '#fa8c16', '#f5222d']
        }
      }
    ]
  })

  const sessionColumns = [
    {
      title: '会话编号',
      dataIndex: 'sessionNumber',
      key: 'sessionNumber',
      width: 140
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 100
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '客服',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'status',
      width: 80,
      render: (text: string, record: Session) => (
        <Tag color={record.isInspected ? 'green' : 'default'}>
          {record.isInspected ? '已质检' : '待质检'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => formatDateTime(text)
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Session) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/sessions/${record.id}`)}>
            查看
          </Button>
          {!record.isInspected && (
            <Button type="link" size="small" onClick={() => handleStartInspection(record.id)}>
              质检
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">质检看板</h1>
        <Space>
          <Button type="primary" icon={<AuditOutlined />} onClick={handleRandomInspection}>
            随机抽检
          </Button>
          <Button onClick={() => navigate('/response-time')}>响应时长分析</Button>
        </Space>
      </div>

      {randomSessions.length > 0 && (
        <Alert
          message="随机抽检结果"
          description={`已为您抽取 ${randomSessions.length} 条待质检会话，请点击"开始质检"进行评分。`}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          action={
            <Space>
              {randomSessions.slice(0, 3).map(s => (
                <Button key={s.id} size="small" type="primary" onClick={() => handleStartInspection(s.id)}>
                  质检{s.sessionNumber}
                </Button>
              ))}
            </Space>
          }
        />
      )}

      <div className="summary-grid">
        <Card className="stat-card" bordered={false}>
          <Statistic
            title="今日会话"
            value={sessionStats?.todaySessions || 0}
            prefix={<MessageOutlined />}
            valueStyle={{ color: '#1677ff' }}
          />
          <div className="stat-card-trend">
            <span style={{ color: '#52c41a' }}><ArrowUpOutlined /> 12.5%</span>
            <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>较昨日</span>
          </div>
        </Card>

        <Card className="stat-card" bordered={false}>
          <Statistic
            title="待质检会话"
            value={sessionStats?.uninspectedSessions || 0}
            prefix={<AuditOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
          <div className="stat-card-trend">
            <Button type="link" size="small" style={{ padding: 0 }} onClick={() => navigate('/sessions')}>
              去质检 →
            </Button>
          </div>
        </Card>

        <Card className="stat-card" bordered={false}>
          <Statistic
            title="质检平均分"
            value={inspectionStats?.averageScore || 0}
            precision={1}
            suffix="分"
            valueStyle={{ color: getScoreColor(inspectionStats?.averageScore || 0) }}
          />
          <div className="stat-card-trend">
            <Progress
              percent={Math.round(inspectionStats?.passRate || 0)}
              size="small"
              showInfo={true}
              format={percent => `合格率 ${percent}%`}
            />
          </div>
        </Card>

        <Card className="stat-card" bordered={false}>
          <Statistic
            title="平均响应时长"
            value={sessionStats?.averageResponseTime ? Math.round(sessionStats.averageResponseTime / 60) : 0}
            suffix="分钟"
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
          <div className="stat-card-trend">
            <span style={{ color: '#52c41a' }}><ArrowDownOutlined /> 8.3%</span>
            <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>较上周</span>
          </div>
        </Card>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="质检趋势" bordered={false} extra={<Button type="link" size="small" onClick={() => navigate('/inspections')}>查看详情</Button>}>
            <ReactECharts option={getScoreChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card
            title="待办事项"
            bordered={false}
            extra={<Tag color="red">{pendingTickets + expiringKnowledge.length} 项</Tag>}
          >
            <List
              size="small"
              dataSource={[
                { icon: <FileTextOutlined />, text: `待处理工单 ${pendingTickets} 条`, type: 'ticket' },
                { icon: <BookOutlined />, text: `即将失效知识 ${expiringKnowledge.length} 条`, type: 'knowledge' },
                { icon: <AuditOutlined />, text: `待质检会话 ${sessionStats?.uninspectedSessions || 0} 条`, type: 'inspection' },
              ]}
              renderItem={(item: any) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      key="go"
                      onClick={() => {
                        if (item.type === 'ticket') navigate('/tickets')
                        else if (item.type === 'knowledge') navigate('/knowledge')
                        else navigate('/inspections')
                      }}
                    >
                      去处理
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.text}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card
            title="最近会话"
            bordered={false}
            extra={<Button type="link" size="small" onClick={() => navigate('/sessions')}>查看全部</Button>}
          >
            <Table
              columns={sessionColumns}
              dataSource={recentSessions}
              rowKey="id"
              size="middle"
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {expiringKnowledge.length > 0 && (
        <Card
          title="即将失效的知识"
          bordered={false}
          style={{ marginTop: 16 }}
          type="inner"
          extra={<Button type="link" size="small" onClick={() => navigate('/knowledge')}>查看全部</Button>}
        >
          <List
            size="small"
            dataSource={expiringKnowledge.slice(0, 5)}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" key="view" onClick={() => navigate(`/knowledge/${item.id}`)}>
                    查看
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={<ExclamationCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />}
                  title={item.title}
                  description={`还有 ${item.daysUntilExpiry} 天失效 · 分类：${item.category}`}
                />
              </List.Item>
            )}
          />
        </Card>
      )}
    </div>
  )
}
