import React, { useState, useEffect } from 'react'
import {
  List,
  Card,
  Button,
  Tag,
  Space,
  Empty,
  Badge,
  Select,
  message,
  Avatar
} from 'antd'
import {
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { notificationAPI } from '../services/api.js'

const { Option } = Select

function NotificationList({ onRefresh }) {
  const [list, setList] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [filterType, setFilterType] = useState('')
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await notificationAPI.getList({
        isRead: filterType === 'unread' ? false : filterType === 'read' ? true : undefined
      })
      setList(result.list)
      setUnreadCount(result.unreadCount)
      onRefresh?.()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [filterType])

  const handleReadAll = async () => {
    try {
      await notificationAPI.readAll()
      message.success('全部已读')
      loadData()
    } catch (e) {}
  }

  const handleReadOne = async (id) => {
    try {
      await notificationAPI.readOne(id)
      loadData()
    } catch (e) {}
  }

  const getTypeIcon = (type) => {
    const map = {
      CHECKIN_FAILED: <ExclamationCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />,
      REFUND_REQUEST: <InfoCircleOutlined style={{ color: '#faad14', fontSize: 20 }} />,
      SYSTEM: <BellOutlined style={{ color: '#1890ff', fontSize: 20 }} />,
      default: <BellOutlined style={{ color: '#999', fontSize: 20 }} />
    }
    return map[type] || map.default
  }

  const getTypeColor = (type) => {
    const map = {
      CHECKIN_FAILED: 'red',
      REFUND_REQUEST: 'orange',
      SYSTEM: 'blue',
      default: 'default'
    }
    return map[type] || map.default
  }

  const getTypeText = (type) => {
    const map = {
      CHECKIN_FAILED: '核销失败',
      REFUND_REQUEST: '退款申请',
      SYSTEM: '系统通知',
      default: type
    }
    return map[type] || map.default
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <h2>通知中心</h2>
          <Badge count={unreadCount} showZero>
            <Tag color="blue">未读</Tag>
          </Badge>
        </Space>
        <Space>
          <Select
            style={{ width: 120 }}
            value={filterType || undefined}
            onChange={setFilterType}
            placeholder="全部通知"
            allowClear
          >
            <Option value="unread">未读</Option>
            <Option value="read">已读</Option>
          </Select>
          <Button type="primary" ghost onClick={handleReadAll}>
            全部已读
          </Button>
        </Space>
      </div>

      <Card>
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={list}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={(item) => (
            <List.Item
              style={{
                background: item.isRead ? '#fff' : '#f0f7ff',
                padding: '12px 16px',
                borderRadius: 4,
                marginBottom: 8
              }}
              onClick={() => !item.isRead && handleReadOne(item.id)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    style={{ backgroundColor: item.isRead ? '#d9d9d9' : '#1890ff' }}
                    icon={getTypeIcon(item.type)}
                  />
                }
                title={
                  <Space>
                    <span style={{ fontWeight: item.isRead ? 'normal' : 'bold' }}>{item.title}</span>
                    <Tag color={getTypeColor(item.type)} style={{ marginLeft: 8 }}>
                      {getTypeText(item.type)}
                    </Tag>
                    {!item.isRead && <Badge status="processing" text="新" />}
                  </Space>
                }
                description={
                  <div>
                    <p style={{ marginBottom: 4 }}>{item.content}</p>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                    </span>
                  </div>
                }
              />
              {!item.isRead && (
                <Button size="small" type="link" onClick={(e) => {
                  e.stopPropagation()
                  handleReadOne(item.id)
                }}>
                  标记已读
                </Button>
              )}
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}

export default NotificationList
