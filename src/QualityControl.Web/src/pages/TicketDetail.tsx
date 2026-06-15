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
  Select,
  Upload,
  Empty,
  Divider,
  Timeline,
  Modal,
  Form,
  message
} from 'antd'
import {
  ArrowLeftOutlined,
  UserOutlined,
  PaperClipOutlined,
  MessageOutlined,
  FileTextOutlined,
  AuditOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { ticketService } from '@/services/ticketService'
import type { Ticket, TicketComment } from '@/types'
import { formatDateTime, formatFileSize, getPriorityColor, getStatusColor } from '@/utils'

const { TextArea } = Input
const { Option } = Select

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [replyContent, setReplyContent] = useState('')
  const [isInternal, setIsInternal] = useState(true)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [statusForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      loadTicket(parseInt(id))
      loadComments(parseInt(id))
    }
  }, [id])

  const loadTicket = async (ticketId: number) => {
    setLoading(true)
    try {
      const res = await ticketService.getTicket(ticketId)
      if (res.success) {
        setTicket(res.data!)
      }
    } catch (error) {
      console.error('加载工单详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadComments = async (ticketId: number) => {
    try {
      const res = await ticketService.getComments(ticketId)
      if (res.success) {
        setComments(res.data || [])
      }
    } catch (error) {
      console.error('加载评论失败', error)
    }
  }

  const handleSendReply = async () => {
    if (!replyContent.trim()) return

    try {
      const res = await ticketService.addComment({
        ticketId: parseInt(id!),
        commenterId: 2,
        commenterName: '张质检',
        commenterRole: '质检员',
        content: replyContent,
        isInternal
      })
      if (res.success) {
        message.success('评论添加成功')
        setReplyContent('')
        loadComments(parseInt(id!))
      }
    } catch (error) {
      console.error('添加评论失败', error)
    }
  }

  const handleStatusChange = async (values: any) => {
    try {
      const res = await ticketService.updateStatus({
        id: parseInt(id!),
        status: values.status,
        remark: values.remark,
        operatorId: 2
      })
      if (res.success) {
        message.success('状态更新成功')
        setStatusModalVisible(false)
        statusForm.resetFields()
        loadTicket(parseInt(id!))
        loadComments(parseInt(id!))
      }
    } catch (error) {
      console.error('更新状态失败', error)
    }
  }

  const timelineEvents = [
    {
      time: ticket?.createdAt,
      color: 'blue',
      title: '工单创建',
      description: `由 ${ticket?.creatorName || '系统'} 创建`
    },
    ...comments.map(c => ({
      time: c.createdAt,
      color: c.isInternal ? 'gray' : 'green',
      title: `${c.commenterName} ${c.isInternal ? '(内部)' : '(公开)'}`,
      description: c.content
    }))
  ].sort((a, b) => new Date(a.time || '').getTime() - new Date(b.time || '').getTime())

  if (!ticket && !loading) {
    return (
      <div className="page-container">
        <Empty description="工单不存在" />
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
          <h1 className="page-title">工单详情 - {ticket?.ticketNumber}</h1>
          <Tag color={ticket?.type ? (ticket.type === 0 ? 'red' : 'blue') : 'default'}>
            {ticket?.typeText}
          </Tag>
          <Tag color={ticket?.status ? (ticket.status === 0 ? 'warning' : ticket.status === 3 ? 'success' : 'processing') : 'default'}>
            {ticket?.statusText}
          </Tag>
        </Space>
        <Space>
          <Button onClick={() => setStatusModalVisible(true)}>
            更新状态
          </Button>
          <Button icon={<FileTextOutlined />}>转派</Button>
          <Button type="primary" icon={<CheckCircleOutlined />}>
            解决工单
          </Button>
        </Space>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card title="工单详情" bordered={false} loading={loading}>
            <Descriptions column={2} size="small">
              <Descriptions.Item label="工单标题">
                {ticket?.title}
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <span style={{ color: getPriorityColor(ticket?.priority || 1), fontWeight: 500 }}>
                  {ticket?.priorityText}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="工单类型">
                <Tag>{ticket?.typeText}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={ticket?.status === 3 ? 'success' : 'processing'}>
                  {ticket?.statusText}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="处理部门">
                {ticket?.assigneeDepartmentName}
              </Descriptions.Item>
              <Descriptions.Item label="处理人">
                {ticket?.assigneeName || '未分配'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {ticket?.creatorName || '系统'}
              </Descriptions.Item>
              <Descriptions.Item label="客户">
                {ticket?.customerName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {formatDateTime(ticket?.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="截止时间">
                {ticket?.dueDate ? formatDateTime(ticket.dueDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="解决时间">
                {ticket?.resolvedAt ? formatDateTime(ticket.resolvedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关闭时间">
                {ticket?.closedAt ? formatDateTime(ticket.closedAt) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联会话" span={2}>
                {ticket?.relatedSessionId ? (
                  <a onClick={() => navigate(`/sessions/${ticket.relatedSessionId}`)}>
                    {ticket.relatedSessionNumber || '查看会话'}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联质检" span={2}>
                {ticket?.relatedInspectionId ? (
                  <a onClick={() => navigate(`/inspections/${ticket.relatedInspectionId}`)}>
                    {ticket.relatedInspectionNumber || '查看质检'}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="标签" span={2}>
                {ticket?.tags?.split(',').map((tag, i) => (
                  <Tag key={i} color="blue">{tag}</Tag>
                ))}
              </Descriptions.Item>
              <Descriptions.Item label="详细描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{ticket?.description}</div>
              </Descriptions.Item>
              {ticket?.resolution && (
                <Descriptions.Item label="解决方案" span={2}>
                  <div style={{
                    padding: '12px 16px',
                    background: '#f6ffed',
                    border: '1px solid #b7eb8f',
                    borderRadius: 4,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {ticket.resolution}
                  </div>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card
            title={`评论记录 (${comments.length})`}
            bordered={false}
            style={{ marginTop: 16 }}
          >
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
                <Button
                  type={!isInternal ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setIsInternal(false)}
                >
                  公开评论
                </Button>
                <Button
                  type={isInternal ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setIsInternal(true)}
                >
                  内部评论
                </Button>
              </div>
              <TextArea
                rows={3}
                placeholder={isInternal ? '输入内部评论，客户不可见' : '输入公开评论，客户可见'}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <Upload>
                  <Button icon={<PaperClipOutlined />} size="small">添加附件</Button>
                </Upload>
                <Button type="primary" onClick={handleSendReply} disabled={!replyContent.trim()}>
                  发送
                </Button>
              </div>
            </div>

            <Divider />

            {comments.length === 0 ? (
              <Empty description="暂无评论" />
            ) : (
              <List
                dataSource={comments}
                itemLayout="horizontal"
                renderItem={(item) => (
                  <List.Item style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{item.commenterName}</span>
                          {item.commenterRole && (
                            <Tag color="blue" style={{ fontSize: 12 }}>{item.commenterRole}</Tag>
                          )}
                          {item.isInternal ? (
                            <Tag color="default" style={{ fontSize: 12 }}>内部</Tag>
                          ) : (
                            <Tag color="green" style={{ fontSize: 12 }}>公开</Tag>
                          )}
                          <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                            {formatDateTime(item.createdAt)}
                          </span>
                        </div>
                      }
                      description={
                        <div style={{ whiteSpace: 'pre-wrap', marginTop: 4 }}>
                          {item.content}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </div>

        <div style={{ width: 280, flexShrink: 0 }}>
          <Card title="处理时间线" bordered={false} style={{ position: 'sticky', top: 24 }}>
            <Timeline
              items={timelineEvents.map(event => ({
                color: event.color,
                children: (
                  <div>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>{event.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{event.description}</div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 4 }}>
                      {formatDateTime(event.time)}
                    </div>
                  </div>
                )
              }))}
            />
          </Card>

          <Card
            title="快捷操作"
            bordered={false}
            style={{ marginTop: 16, position: 'sticky', top: 300 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button block icon={<MessageOutlined />}>
                联系客服
              </Button>
              <Button block icon={<AuditOutlined />} onClick={() => ticket?.relatedSessionId && navigate(`/inspections/new/${ticket.relatedSessionId}`)}>
                关联质检
              </Button>
              <Button block icon={<FileTextOutlined />}>
                查看知识库
              </Button>
              <Button block icon={<ReloadOutlined />} onClick={() => loadTicket(parseInt(id!))}>
                刷新
              </Button>
            </Space>
          </Card>
        </div>
      </div>

      <Modal
        title="更新工单状态"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          form={statusForm}
          layout="vertical"
          onFinish={handleStatusChange}
        >
          <Form.Item
            label="新状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择新的状态">
              <Option value={0}>待处理</Option>
              <Option value={1}>处理中</Option>
              <Option value={2}>待确认</Option>
              <Option value={3}>已解决</Option>
              <Option value={4}>已关闭</Option>
              <Option value={5}>已重开</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="备注说明"
            name="remark"
          >
            <TextArea rows={3} placeholder="请输入状态变更的说明" maxLength={500} showCount />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setStatusModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">确定</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
