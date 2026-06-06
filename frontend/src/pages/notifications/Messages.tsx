import React from 'react'
import { useState } from 'react'
import { Card, List, Input, Button, Avatar, Space, Badge, Empty } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationApi } from '@/services/notifications'
import { useAuthStore } from '@/store/auth'
import dayjs from 'dayjs'
import type { Conversation, Message } from '@/types'

const { TextArea } = Input

const Messages = () => {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [inputValue, setInputValue] = useState('')

  const { data: conversations, isLoading } = useQuery(
    ['conversations'],
    () => notificationApi.getConversations().then((res) => res.data)
  )

  const { data: messages } = useQuery(
    ['messages', selectedConversation?.user.id],
    () => {
      if (!selectedConversation) return []
      const otherId = selectedConversation.user.id
      return notificationApi.getMessages({
        ordering: 'created_at',
        sender__in: `${user!.id},${otherId}`,
        receiver__in: `${user!.id},${otherId}`
      }).then((res) => res.data.results)
    },
    { enabled: !!selectedConversation }
  )

  const sendMutation = useMutation(
    (content: string) => notificationApi.sendMessage({
      receiver: selectedConversation!.user.id,
      content,
      type: 'text'
    }),
    {
      onSuccess: () => {
        setInputValue('')
        queryClient.invalidateQueries(['messages', selectedConversation?.user.id])
        queryClient.invalidateQueries(['conversations'])
      }
    }
  )

  const handleSend = () => {
    if (!inputValue.trim() || !selectedConversation) return
    sendMutation.mutate(inputValue.trim())
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">家长消息</h2>
      </div>

      <Card bordered={false}>
        <div style={{ display: 'flex', height: 600 }}>
          <div style={{ width: 280, borderRight: '1px solid #f0f0f0', overflow: 'auto' }}>
            <List
              loading={isLoading}
              dataSource={conversations}
              renderItem={(item: Conversation) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedConversation?.user.id === item.user.id ? '#e6f7ff' : undefined
                  }}
                  onClick={() => {
                    setSelectedConversation(item)
                    notificationApi.markAllRead(item.user.id)
                    queryClient.invalidateQueries(['conversations'])
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Badge count={item.unread_count} size="small">
                        <Avatar src={item.user.avatar} icon={<UserOutlined />} />
                      </Badge>
                    }
                    title={item.user.name}
                    description={
                      <Space direction="vertical" size={0}>
                        <div style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          width: 180
                        }}>
                          {item.last_message.content}
                        </div>
                        <div style={{ fontSize: 12, color: '#8c8c8c' }}>
                          {dayjs(item.last_message.created_at).format('MM-DD HH:mm')}
                        </div>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                  <Space>
                    <Avatar src={selectedConversation.user.avatar} icon={<UserOutlined />} />
                    <span style={{ fontWeight: 500 }}>{selectedConversation.user.name}</span>
                  </Space>
                </div>

                <div style={{ flex: 1, padding: 16, overflow: 'auto', background: '#f9f9f9' }}>
                  {messages?.length === 0 ? (
                    <Empty description="暂无消息" />
                  ) : (
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                      {(messages as Message[]).map((msg) => {
                        const isMine = msg.sender === user?.id
                        return (
                          <div
                            key={msg.id}
                            style={{
                              display: 'flex',
                              justifyContent: isMine ? 'flex-end' : 'flex-start'
                            }}
                          >
                            <div style={{
                              maxWidth: '60%',
                              background: isMine ? '#1677ff' : '#fff',
                              color: isMine ? '#fff' : '#333',
                              padding: '8px 12px',
                              borderRadius: 8
                            }}>
                              <div>{msg.content}</div>
                              <div style={{
                                fontSize: 11,
                                opacity: 0.7,
                                marginTop: 4,
                                textAlign: isMine ? 'right' : 'left'
                              }}>
                                {dayjs(msg.created_at).format('HH:mm')}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </Space>
                  )}
                </div>

                <div style={{ padding: 12, borderTop: '1px solid #f0f0f0' }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <TextArea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="输入消息..."
                      rows={2}
                      onPressEnter={(e) => {
                        if (!e.shiftKey) {
                          e.preventDefault()
                          handleSend()
                        }
                      }}
                    />
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleSend}
                      loading={sendMutation.isLoading}
                    >
                      发送
                    </Button>
                  </Space.Compact>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="请选择一个会话" />
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Messages
