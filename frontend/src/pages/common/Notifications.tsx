import { useState, useEffect } from 'react'
import { List, Tag, Button, Empty, Badge, Space, Card, message } from 'antd'
import { BellOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

export default function Notifications() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: res } = await axios.get('/api/notifications/my/')
      setData(res.results || res)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const markAllRead = async () => {
    await axios.post('/api/notifications/list/mark_all_read/')
    message.success('已全部标记为已读')
    fetchData()
  }

  const markRead = async (id: number) => {
    await axios.post(`/api/notifications/list/${id}/mark_read/`)
    fetchData()
  }

  const typeColor: Record<string, string> = {
    announcement: 'blue',
    repair_status: 'green',
    system: 'purple',
    verification: 'orange',
  }

  return (
    <Card
      title={<Space><BellOutlined />我的消息</Space>}
      extra={<Button onClick={markAllRead} icon={<CheckOutlined />}>全部已读</Button>}
    >
      {data.length === 0 ? (
        <Empty description="暂无消息" />
      ) : (
        <List
          loading={loading}
          dataSource={data}
          renderItem={(item: any) => (
            <List.Item
              onClick={() => !item.is_read && markRead(item.notification?.id)}
              style={{ cursor: 'pointer', background: item.is_read ? 'transparent' : '#f0f7ff' }}
            >
              <List.Item.Meta
                avatar={<Badge dot={!item.is_read}><BellOutlined style={{ fontSize: 24, color: '#1677ff' }} /></Badge>}
                title={
                  <Space>
                    <Tag color={typeColor[item.notification?.type] || 'default'}>
                      {item.notification?.type_display}
                    </Tag>
                    <span style={{ fontWeight: item.is_read ? 400 : 600 }}>
                      {item.notification?.title}
                    </span>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={4}>
                    <span>{item.notification?.content}</span>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.notification?.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
