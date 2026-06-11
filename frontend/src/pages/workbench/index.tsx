import { useState, useEffect, useRef } from 'react'
import {
  Input,
  Button,
  Tag,
  Avatar,
  Select,
  Card,
  Spin,
  Empty,
  Skeleton,
  Space,
  Divider,
  message,
} from 'antd'
import {
  SearchOutlined,
  SendOutlined,
  UserOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  BulbOutlined,
  PhoneOutlined,
  TeamOutlined,
  GlobalOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { conversationApi } from '@/api'
import type { Conversation, Message, AISuggestion, DRFPaginationResult } from '@/types/api'

const { TextArea } = Input
const { Option } = Select

const mockConversations: Conversation[] = [
  {
    id: 1,
    title: '产品咨询',
    customer_name: '张三',
    customer_phone: '13800138001',
    sales_operation: '华东组',
    channel: 'web',
    priority: 'high',
    status: 'active',
    messages_count: 12,
    last_message_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 2,
    title: '售后问题',
    customer_name: '李四',
    customer_phone: '13900139002',
    sales_operation: '华南组',
    channel: 'app',
    priority: 'normal',
    status: 'active',
    messages_count: 8,
    last_message_time: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    title: '退款申请',
    customer_name: '王五',
    customer_phone: '13700137003',
    sales_operation: '华北组',
    channel: 'wechat',
    priority: 'urgent',
    status: 'active',
    messages_count: 15,
    last_message_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    title: '功能建议',
    customer_name: '赵六',
    customer_phone: '13600136004',
    sales_operation: '华东组',
    channel: 'phone',
    priority: 'normal',
    status: 'archived',
    messages_count: 5,
    last_message_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    title: '账户问题',
    customer_name: '钱七',
    customer_phone: '13500135005',
    sales_operation: '西南组',
    channel: 'web',
    priority: 'high',
    status: 'active',
    messages_count: 20,
    last_message_time: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
]

const mockMessages: Record<number, Message[]> = {
  1: [
    {
      id: 1,
      role: 'user',
      content: '你好，我想咨询一下你们的产品价格',
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      role: 'assistant',
      content: '您好！感谢您的咨询。我们的产品有多个版本，基础版每月99元，专业版每月299元，企业版需要定制报价。请问您是个人使用还是企业使用呢？',
      created_at: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
      is_ai_suggestion: false,
    },
    {
      id: 3,
      role: 'user',
      content: '我是中小企业，大概10个人用，哪个版本比较合适？',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: 4,
      role: 'assistant',
      content: '这是AI生成的建议回复，需要人工审核...',
      created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
      is_ai_suggestion: true,
      suggested_reply: '根据您的情况，我推荐您使用专业版。专业版支持最多20个用户，包含所有核心功能，性价比最高。如果您现在购买，还可以享受首月8折优惠哦！',
      ai_model: 'gpt-4',
      prompt_version: 'v1.2.0',
      is_adopted: false,
    },
    {
      id: 5,
      role: 'user',
      content: '专业版都包含哪些功能呢？能不能详细说说',
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
  ],
  2: [
    {
      id: 1,
      role: 'user',
      content: '我的订单什么时候发货？',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      role: 'assistant',
      content: '您好，请提供一下您的订单号，我帮您查询。',
      created_at: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      role: 'user',
      content: '订单号是202401150001',
      created_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  ],
  3: [
    {
      id: 1,
      role: 'user',
      content: '我要退款！这个产品根本不好用',
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 2,
      role: 'assistant',
      content: '非常抱歉给您带来不好的体验。请问具体是哪些方面让您不满意呢？我们会尽力改进。',
      created_at: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 3,
      role: 'user',
      content: '功能太少了，而且经常卡顿',
      created_at: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString(),
    },
  ],
}

const channelMap: Record<string, string> = {
  web: '网页',
  app: 'APP',
  wechat: '微信',
  phone: '电话',
}

const priorityMap: Record<string, { text: string; color: string }> = {
  normal: { text: '普通', color: 'default' },
  high: { text: '高', color: 'orange' },
  urgent: { text: '紧急', color: 'red' },
}

const statusMap: Record<string, { text: string; color: string }> = {
  active: { text: '进行中', color: 'green' },
  archived: { text: '已归档', color: 'default' },
  deleted: { text: '已删除', color: 'red' },
}

const Workbench: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(false)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [sendingMessage, setSendingMessage] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null)
  const [loadingAiSuggestion, setLoadingAiSuggestion] = useState(false)
  const [suggestionAdopted, setSuggestionAdopted] = useState(false)

  const [searchKeyword, setSearchKeyword] = useState('')
  const [filterSalesOperation, setFilterSalesOperation] = useState<string | undefined>()
  const [filterChannel, setFilterChannel] = useState<string | undefined>()
  const [filterPriority, setFilterPriority] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<string | undefined>('active')

  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
  }, [page, filterSalesOperation, filterChannel, filterPriority, filterStatus, searchKeyword])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      loadAiSuggestion(selectedConversation.id)
    }
  }, [selectedConversation])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    setLoadingConversations(true)
    try {
      const params = {
        page,
        pageSize,
        sales_operation: filterSalesOperation,
        channel: filterChannel,
        priority: filterPriority,
        status: filterStatus,
        keyword: searchKeyword || undefined,
      }
      const result = await conversationApi.getConversations(params)
      const data = result as unknown as DRFPaginationResult<Conversation>
      if (data && data.results) {
        setConversations(data.results)
        setTotal(data.count || 0)
      } else {
        throw new Error('API返回数据格式不对')
      }
    } catch {
      setConversations(mockConversations)
      setTotal(mockConversations.length)
    } finally {
      setLoadingConversations(false)
    }
  }

  const loadMessages = async (conversationId: number) => {
    setLoadingMessages(true)
    try {
      const result = await conversationApi.getMessages(conversationId, {
        page: 1,
        pageSize: 100,
      })
      const data = result as unknown as DRFPaginationResult<Message>
      if (data && data.results) {
        setMessages(data.results)
      } else {
        throw new Error('API返回数据格式不对')
      }
    } catch {
      setMessages(mockMessages[conversationId] || [])
    } finally {
      setLoadingMessages(false)
    }
  }

  const loadAiSuggestion = async (conversationId: number) => {
    setLoadingAiSuggestion(true)
    setSuggestionAdopted(false)
    try {
      const result = await conversationApi.getAISuggestion(conversationId)
      const data = result as unknown as AISuggestion
      if (data) {
        setAiSuggestion(data)
        if (data.status === 'pending') {
          setTimeout(() => loadAiSuggestion(conversationId), 2000)
        }
      } else {
        throw new Error('API返回数据格式不对')
      }
    } catch {
      const mockSuggestion: AISuggestion = {
        message_id: 4,
        suggested_reply:
          '专业版包含以下核心功能：\n1. 无限次AI对话\n2. 自定义知识库\n3. 多渠道接入（网页、APP、微信）\n4. 数据分析报表\n5. 团队协作（最多20人）\n6. 7x24小时技术支持\n\n如果您需要更详细的功能对比，我可以发一份完整的产品手册给您参考。',
        ai_model: 'gpt-4-turbo',
        prompt_version: 'v1.2.0',
        status: 'completed',
        created_at: new Date().toISOString(),
      }
      setAiSuggestion(mockSuggestion)
    } finally {
      setLoadingAiSuggestion(false)
    }
  }

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setInputValue('')
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return

    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: inputValue.trim(),
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    const content = inputValue.trim()
    setInputValue('')
    setSendingMessage(true)
    setAiSuggestion(null)
    setSuggestionAdopted(false)

    try {
      await conversationApi.sendMessage(selectedConversation.id, content)
    } catch {
      console.log('使用模拟发送')
    }

    setLoadingAiSuggestion(true)
    setTimeout(async () => {
      try {
        const result = await conversationApi.getAISuggestion(selectedConversation.id)
        const data = result as unknown as AISuggestion
        if (data) {
          setAiSuggestion(data)
        }
      } catch {
        const mockSuggestion: AISuggestion = {
          message_id: Date.now(),
          suggested_reply:
            '感谢您的咨询！针对您的问题，我来为您详细解答...\n\n请问还有其他问题吗？我很乐意为您提供帮助。',
          ai_model: 'gpt-4-turbo',
          prompt_version: 'v1.2.0',
          status: 'completed',
          created_at: new Date().toISOString(),
        }
        setAiSuggestion(mockSuggestion)

        const aiMessage: Message = {
          id: Date.now() + 1,
          role: 'assistant',
          content: '这是AI生成的建议回复',
          created_at: new Date().toISOString(),
          is_ai_suggestion: true,
          suggested_reply: mockSuggestion.suggested_reply,
          ai_model: mockSuggestion.ai_model,
          prompt_version: mockSuggestion.prompt_version,
          is_adopted: false,
        }
        setMessages((prev) => [...prev, aiMessage])
      } finally {
        setLoadingAiSuggestion(false)
        setSendingMessage(false)
      }
    }, 1500)
  }

  const handleAdoptSuggestion = async () => {
    if (!aiSuggestion?.suggested_reply || !selectedConversation) return

    if (aiSuggestion.message_id) {
      try {
        await conversationApi.adoptSuggestion(selectedConversation.id, aiSuggestion.message_id)
      } catch {
        console.log('使用模拟采纳')
      }
    }

    setInputValue(aiSuggestion.suggested_reply)
    setSuggestionAdopted(true)
    message.success('建议已采纳，已填充到输入框')
  }

  const handleRegenerateSuggestion = async () => {
    if (!selectedConversation) return
    setLoadingAiSuggestion(true)
    setSuggestionAdopted(false)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      const result = await conversationApi.getAISuggestion(selectedConversation.id)
      const data = result as unknown as AISuggestion
      if (data) {
        setAiSuggestion(data)
      }
    } catch {
      const mockSuggestion: AISuggestion = {
        message_id: Date.now(),
        suggested_reply:
          '（重新生成）您好，这是重新生成的回复建议。根据您的需求，我建议您可以这样回复客户...\n\n如果觉得不满意，可以再次点击重新生成。',
        ai_model: 'gpt-4-turbo',
        prompt_version: 'v1.2.0',
        status: 'completed',
        created_at: new Date().toISOString(),
      }
      setAiSuggestion(mockSuggestion)
    } finally {
      setLoadingAiSuggestion(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    setPage(1)
  }

  const formatTime = (time: string) => {
    const now = dayjs()
    const target = dayjs(time)
    const diffMinutes = now.diff(target, 'minute')

    if (diffMinutes < 1) return '刚刚'
    if (diffMinutes < 60) return `${diffMinutes}分钟前`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}小时前`
    return target.format('MM-DD HH:mm')
  }

  const renderConversationItem = (item: Conversation) => {
    const isSelected = selectedConversation?.id === item.id
    const priorityInfo = priorityMap[item.priority] || priorityMap.normal
    const statusInfo = statusMap[item.status] || statusMap.active

    return (
      <div
        key={item.id}
        onClick={() => handleSelectConversation(item)}
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f5f5f5'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
            <span
              style={{
                fontWeight: 500,
                fontSize: 14,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.customer_name}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#999', flexShrink: 0, marginLeft: 8 }}>
            {item.last_message_time ? formatTime(item.last_message_time) : ''}
          </span>
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#666',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginBottom: 8,
            paddingLeft: 32,
          }}
        >
          {item.title || '暂无消息预览'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 32 }}>
          <Tag color={statusInfo.color} style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>
            {statusInfo.text}
          </Tag>
          <Tag color={priorityInfo.color} style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>
            {priorityInfo.text}优先级
          </Tag>
          <Tag style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>
            {channelMap[item.channel] || item.channel}
          </Tag>
        </div>
      </div>
    )
  }

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user'
    const isAiSuggestion = msg.is_ai_suggestion

    return (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          marginBottom: 16,
        }}
      >
        <div
          style={{
            maxWidth: '70%',
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            alignItems: 'flex-start',
            gap: 8,
          }}
        >
          <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            size={32}
            style={{
              backgroundColor: isUser ? '#1890ff' : isAiSuggestion ? '#722ed1' : '#52c41a',
            }}
          />
          <div>
            {isAiSuggestion && (
              <div style={{ marginBottom: 4 }}>
                <Tag color="purple" icon={<BulbOutlined />}>
                  AI建议
                </Tag>
              </div>
            )}
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 12,
                backgroundColor: isUser ? '#1890ff' : isAiSuggestion ? '#f9f0ff' : '#f6ffed',
                color: isUser ? 'white' : isAiSuggestion ? '#531dab' : '#389e0d',
                wordBreak: 'break-word',
                lineHeight: 1.6,
                border: isAiSuggestion ? '1px solid #d3adf7' : 'none',
              }}
            >
              {isAiSuggestion && msg.suggested_reply ? msg.suggested_reply : msg.content}
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#999',
                marginTop: 4,
                textAlign: isUser ? 'right' : 'left',
              }}
            >
              {formatTime(msg.created_at)}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 12 }}>
      {/* 左侧：会话列表 */}
      <div
        style={{
          width: 300,
          flexShrink: 0,
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
        }}
      >
        <div style={{ padding: '12px', borderBottom: '1px solid #f0f0f0' }}>
          <Input
            placeholder="搜索客户姓名/手机号"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onPressEnter={(e) => handleSearch((e.target as HTMLInputElement).value)}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Select
              placeholder="销售运营"
              style={{ width: '100%', marginBottom: 8 }}
              allowClear
              size="small"
              value={filterSalesOperation}
              onChange={(val) => {
                setFilterSalesOperation(val)
                setPage(1)
              }}
            >
              <Option value="华东组">华东组</Option>
              <Option value="华南组">华南组</Option>
              <Option value="华北组">华北组</Option>
              <Option value="西南组">西南组</Option>
            </Select>
            <Select
              placeholder="渠道"
              style={{ width: '48%' }}
              allowClear
              size="small"
              value={filterChannel}
              onChange={(val) => {
                setFilterChannel(val)
                setPage(1)
              }}
            >
              <Option value="web">网页</Option>
              <Option value="app">APP</Option>
              <Option value="wechat">微信</Option>
              <Option value="phone">电话</Option>
            </Select>
            <Select
              placeholder="优先级"
              style={{ width: '48%' }}
              allowClear
              size="small"
              value={filterPriority}
              onChange={(val) => {
                setFilterPriority(val)
                setPage(1)
              }}
            >
              <Option value="normal">普通</Option>
              <Option value="high">高</Option>
              <Option value="urgent">紧急</Option>
            </Select>
            <Select
              placeholder="状态"
              style={{ width: '100%', marginTop: 8 }}
              allowClear
              size="small"
              value={filterStatus}
              onChange={(val) => {
                setFilterStatus(val)
                setPage(1)
              }}
            >
              <Option value="active">进行中</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConversations ? (
            <div style={{ padding: 12 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ marginBottom: 12 }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <Empty description="暂无会话" style={{ marginTop: 80 }} />
          ) : (
            conversations.map(renderConversationItem)
          )}
        </div>

        <div
          style={{
            padding: '8px 12px',
            borderTop: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            fontSize: 12,
            color: '#666',
          }}
        >
          共 {total} 条会话
        </div>
      </div>

      {/* 中间：聊天区域 */}
      <div
        style={{
          flex: 1,
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
          minWidth: 0,
        }}
      >
        {selectedConversation ? (
          <>
            {/* 聊天头部 */}
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar
                  size={40}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#1890ff' }}
                />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>
                    {selectedConversation.customer_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    <Space size={12}>
                      <span>
                        <PhoneOutlined style={{ marginRight: 4 }} />
                        {selectedConversation.customer_phone}
                      </span>
                      <span>
                        <TeamOutlined style={{ marginRight: 4 }} />
                        {selectedConversation.sales_operation}
                      </span>
                      <span>
                        <GlobalOutlined style={{ marginRight: 4 }} />
                        {channelMap[selectedConversation.channel] || selectedConversation.channel}
                      </span>
                    </Space>
                  </div>
                </div>
              </div>
              <div>
                <Tag color={statusMap[selectedConversation.status]?.color || 'default'}>
                  {statusMap[selectedConversation.status]?.text || selectedConversation.status}
                </Tag>
                <Tag color={priorityMap[selectedConversation.priority]?.color || 'default'}>
                  {priorityMap[selectedConversation.priority]?.text || selectedConversation.priority}优先级
                </Tag>
              </div>
            </div>

            {/* 消息列表 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 24px',
                backgroundColor: '#fafafa',
              }}
            >
              {loadingMessages ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                  <Spin tip="加载消息中..." />
                </div>
              ) : messages.length === 0 ? (
                <Empty description="暂无消息" style={{ marginTop: 60 }} />
              ) : (
                messages.map(renderMessage)
              )}
              {loadingAiSuggestion && !aiSuggestion && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <Avatar
                      icon={<RobotOutlined />}
                      size={32}
                      style={{ backgroundColor: '#722ed1' }}
                    />
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        backgroundColor: '#f9f0ff',
                        border: '1px solid #d3adf7',
                      }}
                    >
                      <Spin size="small" />
                      <span style={{ marginLeft: 8, color: '#531dab', fontSize: 13 }}>
                        AI正在生成建议...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div
              style={{
                padding: '12px 20px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fff',
              }}
            >
              <TextArea
                rows={3}
                placeholder="输入消息，按Enter发送，Shift+Enter换行"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
                style={{ marginBottom: 8, resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSendMessage}
                  loading={sendingMessage}
                  disabled={!inputValue.trim()}
                >
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
            }}
          >
            <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16 }}>请选择一个会话开始聊天</div>
          </div>
        )}
      </div>

      {/* 右侧：AI建议面板 */}
      <div
        style={{
          width: 320,
          flexShrink: 0,
          border: '1px solid #e8e8e8',
          borderRadius: 8,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#fff',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <BulbOutlined style={{ color: '#722ed1', fontSize: 18 }} />
          <span style={{ fontWeight: 500, fontSize: 15 }}>AI建议</span>
          {selectedConversation && (
            <Button
              type="text"
              size="small"
              icon={<ReloadOutlined />}
              onClick={handleRegenerateSuggestion}
              loading={loadingAiSuggestion}
              style={{ marginLeft: 'auto' }}
            >
              重新生成
            </Button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!selectedConversation ? (
            <Empty description="请选择会话" style={{ marginTop: 80 }} />
          ) : loadingAiSuggestion && !aiSuggestion ? (
            <div style={{ padding: '20px 0' }}>
              <Skeleton active paragraph={{ rows: 8 }} />
            </div>
          ) : aiSuggestion?.status === 'error' ? (
            <Card
              type="inner"
              style={{ borderColor: '#ffa39e' }}
              title={
                <span style={{ color: '#cf1322' }}>
                  <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                  生成失败
                </span>
              }
            >
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                <strong>错误类型：</strong>
                {aiSuggestion.error_type || '未知错误'}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                <strong>错误原因：</strong>
                {aiSuggestion.error_message || '暂无详细信息'}
              </div>
            </Card>
          ) : aiSuggestion?.suggested_reply ? (
            <div>
              <Card
                size="small"
                style={{
                  marginBottom: 16,
                  borderColor: '#d3adf7',
                  backgroundColor: '#f9f0ff',
                }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="purple" icon={<BulbOutlined />}>
                      AI建议
                    </Tag>
                    {suggestionAdopted && (
                      <Tag color="green" icon={<CheckCircleOutlined />}>
                        已采纳
                      </Tag>
                    )}
                  </div>
                }
              >
                <div
                  style={{
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.7,
                    fontSize: 13,
                    color: '#333',
                  }}
                >
                  {aiSuggestion.suggested_reply}
                </div>
              </Card>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ fontSize: 12, color: '#666' }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#999' }}>提示词版本：</span>
                  <Tag color="blue" style={{ margin: 0 }}>
                    {aiSuggestion.prompt_version || 'v1.0.0'}
                  </Tag>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#999' }}>AI模型：</span>
                  <Tag color="cyan" style={{ margin: 0 }}>
                    {aiSuggestion.ai_model || 'gpt-4'}
                  </Tag>
                </div>
                {aiSuggestion.created_at && (
                  <div>
                    <span style={{ color: '#999' }}>生成时间：</span>
                    {dayjs(aiSuggestion.created_at).format('YYYY-MM-DD HH:mm:ss')}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Empty description="暂无AI建议" style={{ marginTop: 80 }} />
          )}
        </div>

        {selectedConversation && aiSuggestion?.suggested_reply && (
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid #f0f0f0',
            }}
          >
            <Button
              type="primary"
              block
              icon={suggestionAdopted ? <CheckCircleOutlined /> : <BulbOutlined />}
              onClick={handleAdoptSuggestion}
              disabled={suggestionAdopted}
              style={{ marginBottom: 8 }}
            >
              {suggestionAdopted ? '已采纳' : '采纳建议'}
            </Button>
            <Button
              block
              icon={<ReloadOutlined />}
              onClick={handleRegenerateSuggestion}
              loading={loadingAiSuggestion}
            >
              重新生成
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Workbench
