import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Input, Button, Tag, Avatar, Select, Card, Spin, Empty, Skeleton,
  Space, Divider, message,
} from 'antd'
import {
  SearchOutlined, SendOutlined, UserOutlined, RobotOutlined,
  CheckCircleOutlined, ReloadOutlined, BulbOutlined, PhoneOutlined,
  TeamOutlined, GlobalOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { conversationApi } from '@/api'
import type { Conversation, Message, AISuggestion, DRFPaginationResult } from '@/types/api'

const { TextArea } = Input

const channelMap: Record<string, string> = {
  web: '网页', app: 'APP', wechat: '微信', phone: '电话',
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
  const pollingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadConversations = useCallback(async () => {
    setLoadingConversations(true)
    try {
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
        sales_operation: filterSalesOperation,
        channel: filterChannel,
        priority: filterPriority,
        status: filterStatus,
        keyword: searchKeyword || undefined,
      }
      const data = await conversationApi.getConversations(params) as unknown as DRFPaginationResult<Conversation>
      setConversations(data.results || [])
      setTotal(data.count || 0)
    } catch {
      message.error('加载会话列表失败')
      setConversations([])
      setTotal(0)
    } finally {
      setLoadingConversations(false)
    }
  }, [page, filterSalesOperation, filterChannel, filterPriority, filterStatus, searchKeyword])

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoadingMessages(true)
    try {
      const data = await conversationApi.getMessages(conversationId, {
        page: 1, page_size: 100,
      }) as unknown as DRFPaginationResult<Message>
      setMessages(data.results || [])
    } catch {
      message.error('加载消息失败')
      setMessages([])
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  const loadAiSuggestion = useCallback(async (conversationId: number) => {
    setLoadingAiSuggestion(true)
    setSuggestionAdopted(false)
    try {
      const data = await conversationApi.getAISuggestion(conversationId) as unknown as AISuggestion
      setAiSuggestion(data)
      if (data.status === 'pending') {
        pollingRef.current = setTimeout(() => loadAiSuggestion(conversationId), 2000)
      }
    } catch {
      setAiSuggestion(null)
    } finally {
      setLoadingAiSuggestion(false)
    }
  }, [])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id)
      loadAiSuggestion(selectedConversation.id)
    }
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [selectedConversation, loadMessages, loadAiSuggestion])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSelectConversation = (conversation: Conversation) => {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    setSelectedConversation(conversation)
    setInputValue('')
    setAiSuggestion(null)
    setSuggestionAdopted(false)
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation) return

    const content = inputValue.trim()
    setInputValue('')
    setSendingMessage(true)
    setAiSuggestion(null)
    setSuggestionAdopted(false)

    const optimisticUserMsg: Message = {
      id: Date.now(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticUserMsg])

    try {
      const result = await conversationApi.sendMessage(selectedConversation.id, content) as unknown as {
        user_message: Message; ai_message: Message
      }
      if (result.ai_message) {
        setMessages(prev => [...prev, result.ai_message])
        const suggestion: AISuggestion = {
          message_id: result.ai_message.id,
          suggested_reply: result.ai_message.suggested_reply || result.ai_message.content,
          ai_model: result.ai_message.ai_model,
          prompt_version: result.ai_message.prompt_version,
          status: 'completed',
          created_at: result.ai_message.created_at,
        }
        setAiSuggestion(suggestion)
      } else {
        loadAiSuggestion(selectedConversation.id)
      }
      loadConversations()
    } catch {
      message.error('发送消息失败')
      loadAiSuggestion(selectedConversation.id)
    } finally {
      setSendingMessage(false)
    }
  }

  const handleAdoptSuggestion = async () => {
    if (!aiSuggestion?.suggested_reply || !selectedConversation) return

    if (aiSuggestion.message_id) {
      try {
        await conversationApi.adoptSuggestion(selectedConversation.id, aiSuggestion.message_id)
      } catch {
        message.error('采纳失败')
      }
    }

    setInputValue(aiSuggestion.suggested_reply)
    setSuggestionAdopted(true)
    message.success('建议已采纳，已填充到输入框')
  }

  const handleRegenerateSuggestion = async () => {
    if (!selectedConversation) return
    if (pollingRef.current) clearTimeout(pollingRef.current)
    setLoadingAiSuggestion(true)
    setSuggestionAdopted(false)
    setAiSuggestion(null)
    try {
      await loadAiSuggestion(selectedConversation.id)
    } catch {
      message.error('重新生成失败')
    }
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
          padding: '12px 16px', cursor: 'pointer',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: isSelected ? '#e6f4ff' : 'transparent',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = '#f5f5f5' }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
            <Avatar icon={<UserOutlined />} size="small" style={{ backgroundColor: '#1890ff' }} />
            <span style={{ fontWeight: 500, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {item.customer_name}
            </span>
          </div>
          <span style={{ fontSize: 12, color: '#999', flexShrink: 0, marginLeft: 8 }}>
            {item.last_message_time ? formatTime(item.last_message_time) : ''}
          </span>
        </div>
        <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8, paddingLeft: 32 }}>
          {item.title || '暂无消息预览'}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingLeft: 32 }}>
          <Tag color={statusInfo.color} style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>{statusInfo.text}</Tag>
          <Tag color={priorityInfo.color} style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>{priorityInfo.text}优先级</Tag>
          <Tag style={{ margin: 0, fontSize: 11, padding: '0 6px' }}>{channelMap[item.channel] || item.channel}</Tag>
        </div>
      </div>
    )
  }

  const renderMessage = (msg: Message) => {
    const isUser = msg.role === 'user'
    const isAiSuggestion = msg.is_ai_suggestion

    return (
      <div key={msg.id} style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: 16 }}>
        <div style={{ maxWidth: '70%', display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 8 }}>
          <Avatar
            icon={isUser ? <UserOutlined /> : <RobotOutlined />}
            size={32}
            style={{ backgroundColor: isUser ? '#1890ff' : isAiSuggestion ? '#722ed1' : '#52c41a' }}
          />
          <div>
            {isAiSuggestion && (
              <div style={{ marginBottom: 4 }}>
                <Tag color="purple" icon={<BulbOutlined />}>AI建议</Tag>
                {msg.is_adopted && <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginLeft: 4 }}>已采纳</Tag>}
              </div>
            )}
            <div style={{
              padding: '10px 14px', borderRadius: 12, lineHeight: 1.6, wordBreak: 'break-word',
              backgroundColor: isUser ? '#1890ff' : isAiSuggestion ? '#f9f0ff' : '#f6ffed',
              color: isUser ? 'white' : isAiSuggestion ? '#531dab' : '#389e0d',
              border: isAiSuggestion ? '1px solid #d3adf7' : 'none',
            }}>
              {isAiSuggestion && msg.suggested_reply ? msg.suggested_reply : msg.content}
            </div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 4, textAlign: isUser ? 'right' : 'left' }}>
              {formatTime(msg.created_at)}
              {isAiSuggestion && msg.ai_model && (
                <span style={{ marginLeft: 8, color: '#722ed1' }}>{msg.ai_model}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: 'calc(100vh - 140px)', display: 'flex', gap: 12 }}>
      <div style={{ width: 300, flexShrink: 0, border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <div style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
          <Input
            placeholder="搜索客户姓名/手机号"
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            allowClear value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            onPressEnter={e => { setSearchKeyword((e.target as HTMLInputElement).value); setPage(1) }}
            style={{ marginBottom: 12 }}
          />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Select placeholder="销售运营" style={{ width: '100%', marginBottom: 8 }} allowClear size="small"
              value={filterSalesOperation} onChange={val => { setFilterSalesOperation(val); setPage(1) }}>
              <Select.Option value="华东组">华东组</Select.Option>
              <Select.Option value="华南组">华南组</Select.Option>
              <Select.Option value="华北组">华北组</Select.Option>
              <Select.Option value="西南组">西南组</Select.Option>
            </Select>
            <Select placeholder="渠道" style={{ width: '48%' }} allowClear size="small"
              value={filterChannel} onChange={val => { setFilterChannel(val); setPage(1) }}>
              <Select.Option value="web">网页</Select.Option>
              <Select.Option value="app">APP</Select.Option>
              <Select.Option value="wechat">微信</Select.Option>
              <Select.Option value="phone">电话</Select.Option>
            </Select>
            <Select placeholder="优先级" style={{ width: '48%' }} allowClear size="small"
              value={filterPriority} onChange={val => { setFilterPriority(val); setPage(1) }}>
              <Select.Option value="normal">普通</Select.Option>
              <Select.Option value="high">高</Select.Option>
              <Select.Option value="urgent">紧急</Select.Option>
            </Select>
            <Select placeholder="状态" style={{ width: '100%', marginTop: 8 }} allowClear size="small"
              value={filterStatus} onChange={val => { setFilterStatus(val); setPage(1) }}>
              <Select.Option value="active">进行中</Select.Option>
              <Select.Option value="archived">已归档</Select.Option>
            </Select>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConversations ? (
            <div style={{ padding: 12 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} active avatar paragraph={{ rows: 2 }} style={{ marginBottom: 12 }} />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <Empty description="暂无会话" style={{ marginTop: 80 }} />
          ) : (
            conversations.map(renderConversationItem)
          )}
        </div>

        <div style={{ padding: '8px 12px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'center', fontSize: 12, color: '#666' }}>
          共 {total} 条会话
        </div>
      </div>

      <div style={{ flex: 1, border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', flexDirection: 'column', backgroundColor: '#fff', minWidth: 0 }}>
        {selectedConversation ? (
          <>
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar size={40} icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{selectedConversation.customer_name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                    <Space size={12}>
                      <span><PhoneOutlined style={{ marginRight: 4 }} />{selectedConversation.customer_phone}</span>
                      <span><TeamOutlined style={{ marginRight: 4 }} />{selectedConversation.sales_operation}</span>
                      <span><GlobalOutlined style={{ marginRight: 4 }} />{channelMap[selectedConversation.channel] || selectedConversation.channel}</span>
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

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', backgroundColor: '#fafafa' }}>
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
                    <Avatar icon={<RobotOutlined />} size={32} style={{ backgroundColor: '#722ed1' }} />
                    <div style={{ padding: '10px 14px', borderRadius: 12, backgroundColor: '#f9f0ff', border: '1px solid #d3adf7' }}>
                      <Spin size="small" />
                      <span style={{ marginLeft: 8, color: '#531dab', fontSize: 13 }}>AI正在生成建议...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', backgroundColor: '#fff' }}>
              <TextArea
                rows={3}
                placeholder="输入消息，按Enter发送，Shift+Enter换行"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onPressEnter={e => { if (!e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                style={{ marginBottom: 8, resize: 'none' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<SendOutlined />} onClick={handleSendMessage} loading={sendingMessage} disabled={!inputValue.trim()}>
                  发送
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
            <RobotOutlined style={{ fontSize: 64, color: '#d9d9d9', marginBottom: 16 }} />
            <div style={{ fontSize: 16 }}>请选择一个会话开始聊天</div>
          </div>
        )}
      </div>

      <div style={{ width: 320, flexShrink: 0, border: '1px solid #e8e8e8', borderRadius: 8, display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8 }}>
          <BulbOutlined style={{ color: '#722ed1', fontSize: 18 }} />
          <span style={{ fontWeight: 500, fontSize: 15 }}>AI建议</span>
          {selectedConversation && (
            <Button type="text" size="small" icon={<ReloadOutlined />} onClick={handleRegenerateSuggestion} loading={loadingAiSuggestion} style={{ marginLeft: 'auto' }}>
              重新生成
            </Button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {!selectedConversation ? (
            <Empty description="请选择会话" style={{ marginTop: 80 }} />
          ) : loadingAiSuggestion && !aiSuggestion ? (
            <div style={{ padding: '20px 0' }}><Skeleton active paragraph={{ rows: 8 }} /></div>
          ) : aiSuggestion?.status === 'error' ? (
            <Card type="inner" style={{ borderColor: '#ffa39e' }}
              title={<span style={{ color: '#cf1322' }}><ExclamationCircleOutlined style={{ marginRight: 6 }} />生成失败</span>}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
                <strong>错误类型：</strong>{aiSuggestion.error_type || '未知错误'}
              </div>
              <div style={{ fontSize: 13, color: '#666' }}>
                <strong>错误原因：</strong>{aiSuggestion.error_message || '暂无详细信息'}
              </div>
            </Card>
          ) : aiSuggestion?.suggested_reply ? (
            <div>
              <Card size="small" style={{ marginBottom: 16, borderColor: '#d3adf7', backgroundColor: '#f9f0ff' }}
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Tag color="purple" icon={<BulbOutlined />}>AI建议</Tag>
                    {suggestionAdopted && <Tag color="green" icon={<CheckCircleOutlined />}>已采纳</Tag>}
                  </div>
                }>
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 13, color: '#333' }}>
                  {aiSuggestion.suggested_reply}
                </div>
              </Card>
              <Divider style={{ margin: '12px 0' }} />
              <div style={{ fontSize: 12, color: '#666' }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#999' }}>提示词版本：</span>
                  <Tag color="blue" style={{ margin: 0 }}>{aiSuggestion.prompt_version || '-'}</Tag>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: '#999' }}>AI模型：</span>
                  <Tag color="cyan" style={{ margin: 0 }}>{aiSuggestion.ai_model || '-'}</Tag>
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
          <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0' }}>
            <Button type="primary" block icon={suggestionAdopted ? <CheckCircleOutlined /> : <BulbOutlined />}
              onClick={handleAdoptSuggestion} disabled={suggestionAdopted} style={{ marginBottom: 8 }}>
              {suggestionAdopted ? '已采纳' : '采纳建议'}
            </Button>
            <Button block icon={<ReloadOutlined />} onClick={handleRegenerateSuggestion} loading={loadingAiSuggestion}>
              重新生成
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Workbench
