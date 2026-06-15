import { useState, useEffect } from 'react'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  List,
  Avatar,
  Input,
  Upload,
  Empty,
  Divider,
  Statistic,
  Row,
  Col,
  Rate,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  AuditOutlined,
  FileTextOutlined,
  PaperClipOutlined,
  UserOutlined,
  CustomerServiceOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { sessionService } from '@/services/sessionService'
import { ticketService } from '@/services/ticketService'
import type { Session, Attachment } from '@/types'
import { formatDateTime, formatDuration, formatFileSize } from '@/utils'

const { TextArea } = Input

export default function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(false)
  const [replyContent, setReplyContent] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [showTicketForm, setShowTicketForm] = useState(false)

  useEffect(() => {
    if (id) {
      loadSession(parseInt(id))
      loadMessages(parseInt(id))
    }
  }, [id])

  const loadSession = async (sessionId: number) => {
    setLoading(true)
    try {
      const res = await sessionService.getSession(sessionId)
      if (res.success) {
        setSession(res.data!)
      }
    } catch (error) {
      console.error('加载会话详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (sessionId: number) => {
    const mockMessages = [
      {
        id: 1,
        senderType: 0,
        senderName: '客户',
        content: '你好，我想咨询一下产品使用问题。',
        sentAt: '2024-01-15 10:30:00',
        attachments: []
      },
      {
        id: 2,
        senderType: 1,
        senderName: '李客服',
        content: '您好！请问有什么可以帮您的？',
        sentAt: '2024-01-15 10:30:45',
        attachments: []
      },
      {
        id: 3,
        senderType: 0,
        senderName: '客户',
        content: '我在使用过程中遇到了登录问题，一直提示密码错误，但我确定密码是对的。',
        sentAt: '2024-01-15 10:32:00',
        attachments: [
          { id: 1, fileName: '错误截图.png', fileType: 'image', fileSize: 102400 }
        ]
      },
      {
        id: 4,
        senderType: 1,
        senderName: '李客服',
        content: '非常抱歉给您带来不便。请问您是使用什么方式登录的？账号名是什么？',
        sentAt: '2024-01-15 10:33:20',
        attachments: []
      },
      {
        id: 5,
        senderType: 0,
        senderName: '客户',
        content: '我是用手机号登录的，138****8001',
        sentAt: '2024-01-15 10:34:00',
        attachments: []
      },
      {
        id: 6,
        senderType: 1,
        senderName: '李客服',
        content: '好的，我帮您查询一下。您的账号确实存在，可能是您输入时大小写有误。您可以尝试点击"忘记密码"重新设置一下。另外，我这边也可以帮您重置密码，需要验证一下您的身份信息。',
        sentAt: '2024-01-15 10:36:30',
        attachments: []
      },
      {
        id: 7,
        senderType: 0,
        senderName: '客户',
        content: '好的，那我自己重置一下吧，谢谢！',
        sentAt: '2024-01-15 10:37:00',
        attachments: []
      }
    ]
    setMessages(mockMessages)
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) return

    try {
      const res = await sessionService.addMessage({
        sessionId: parseInt(id!),
        senderType: 1,
        senderId: 2,
        senderName: '张质检',
        content: replyContent
      })
      if (res.success) {
        message.success('消息发送成功')
        setReplyContent('')
        loadMessages(parseInt(id!))
      }
    } catch (error) {
      console.error('发送消息失败', error)
    }
  }

  const handleCreateTicket = async () => {
    try {
      const res = await ticketService.createTicket({
        type: 0,
        title: session?.title + ' - 跟进工单',
        description: session?.problemDescription || '',
        priority: 1,
        assigneeDepartmentId: 1,
        relatedSessionId: parseInt(id!)
      })
      if (res.success) {
        message.success('工单创建成功')
        setShowTicketForm(false)
        navigate(`/tickets/${res.data!.id}`)
      }
    } catch (error) {
      console.error('创建工单失败', error)
    }
  }

  if (!session && !loading) {
    return (
      <div className="page-container">
        <Empty description="会话不存在" />
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h1 className="page-title">会话详情 - {session?.sessionNumber}</h1>
          <Tag color={session?.isInspected ? 'green' : 'orange'}>
            {session?.isInspected ? '已质检' : '待质检'}
          </Tag>
        </Space>
        <Space>
          {!session?.isInspected && (
            <Button
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => navigate(`/inspections/new/${id}`)}
            >
              开始质检
            </Button>
          )}
          <Button icon={<FileTextOutlined />} onClick={() => setShowTicketForm(true)}>
            创建工单
          </Button>
          <Button>转发</Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="会话内容" bordered={false} loading={loading}>
            <div className="message-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${msg.senderType === 0 ? 'message-item-customer' : 'message-item-agent'}`}
                >
                  <Avatar icon={msg.senderType === 0 ? <UserOutlined /> : <CustomerServiceOutlined />} />
                  <div style={{ maxWidth: '70%' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 4,
                      justifyContent: msg.senderType === 0 ? 'flex-start' : 'flex-end'
                    }}>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {msg.senderName}
                      </span>
                      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                        {msg.sentAt}
                      </span>
                    </div>
                    <div
                      className={`message-bubble ${msg.senderType === 0 ? 'message-bubble-customer' : 'message-bubble-agent'}`}
                      style={{ float: msg.senderType === 1 ? 'right' : 'left' }}
                    >
                      {msg.content}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div style={{ marginTop: 8 }}>
                          {msg.attachments.map((att: Attachment) => (
                            <div key={att.id} style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '4px 8px',
                              background: 'rgba(0,0,0,0.04)',
                              borderRadius: 4,
                              fontSize: 12
                            }}>
                              <PaperClipOutlined />
                              <span>{att.fileName}</span>
                              <span style={{ color: 'rgba(0,0,0,0.45)' }}>
                                {formatFileSize(att.fileSize)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ clear: 'both' }}></div>
                  </div>
                </div>
              ))}
            </div>

            <Divider />

            <div>
              <TextArea
                rows={3}
                placeholder="输入回复内容..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Upload>
                  <Button icon={<PaperClipOutlined />}>附件</Button>
                </Upload>
                <Button type="primary" onClick={handleSendReply}>
                  发送
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="会话信息" bordered={false} style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="会话编号">
                {session?.sessionNumber}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {session?.customerName}
              </Descriptions.Item>
              <Descriptions.Item label="客服人员">
                {session?.agentName}
              </Descriptions.Item>
              <Descriptions.Item label="标题">
                {session?.title}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="blue">{session?.statusText}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="渠道">
                {session?.channel}
              </Descriptions.Item>
              <Descriptions.Item label="标签">
                {session?.tags?.split(',').map((tag, i) => (
                  <Tag key={i} color="blue">{tag}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(session?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="首次响应">
                {formatDateTime(session?.firstResponseAt)}
              </Descriptions.Item>
              <Descriptions.Item label="响应时长">
                <span style={{ color: session?.responseTimeSeconds && session.responseTimeSeconds > 180 ? '#f5222d' : '#52c41a' }}>
                  {formatDuration(session?.responseTimeSeconds)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {formatDateTime(session?.resolvedAt)}
              </Descriptions.Item>
              <Descriptions.Item label="解决时长">
                {formatDuration(session?.resolutionTimeSeconds)}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {session?.hasRating && (
            <Card title="客户评价" bordered={false} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="总体评分"
                    value={session.ratingScore || 0}
                    suffix="/ 5"
                    valueStyle={{ fontSize: 24 }}
                  />
                  <Rate disabled value={session.ratingScore || 0} style={{ fontSize: 14 }} />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>
                    问题是否解决
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500 }}>
                    {true ? '是' : '否'}
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {session?.isInspected && (
            <Card
              title="质检结果"
              bordered={false}
              extra={
                <Button type="link" size="small" onClick={() => navigate('/inspections')}>
                  查看详情
                </Button>
              }
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="质检分数"
                    value={session.inspectionScore || 0}
                    precision={1}
                    suffix="分"
                    valueStyle={{
                      color: (session.inspectionScore || 0) >= 80 ? '#52c41a' : '#f5222d',
                      fontSize: 24
                    }}
                  />
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginBottom: 4 }}>
                    质检时间
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {formatDateTime(session.inspectedAt)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 8 }}>
                    质检员
                  </div>
                  <div style={{ fontSize: 14 }}>
                    {session.inspectorName}
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          {session?.relatedTicketId && (
            <Card
              title="关联工单"
              bordered={false}
              style={{ marginTop: 16 }}
              extra={
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate(`/tickets/${session.relatedTicketId}`)}
                >
                  查看
                </Button>
              }
            >
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                工单编号：TK20240115001
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {showTicketForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 24,
            width: 500
          }}>
            <h3 style={{ marginBottom: 16 }}>创建跟进工单</h3>
            <p style={{ color: 'rgba(0,0,0,0.65)', marginBottom: 16 }}>
              确定要为此会话创建一个跟进工单吗？
            </p>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setShowTicketForm(false)}>取消</Button>
                <Button type="primary" onClick={handleCreateTicket}>确定创建</Button>
              </Space>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
