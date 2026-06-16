import { useState, useEffect } from 'react'
import { List, Tag, Empty, Card, Space, Typography } from 'antd'
import { NotificationOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

const { Title, Paragraph } = Typography

export default function Announcements() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const { data: res } = await axios.get('/api/notifications/announcements/')
        setData(res.results || res)
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  return (
    <Card title={<Space><NotificationOutlined />公告列表</Space>}>
      {data.length === 0 ? (
        <Empty description="暂无公告" />
      ) : (
        <List
          loading={loading}
          dataSource={data}
          renderItem={(item: any) => (
            <List.Item style={{ alignItems: 'flex-start' }}>
              <List.Item.Meta
                avatar={item.is_top ? <Tag color="red">置顶</Tag> : <NotificationOutlined style={{ fontSize: 24, color: '#1677ff' }} />}
                title={
                  <Space>
                    <Title level={5} style={{ margin: 0 }}>{item.title}</Title>
                    <span style={{ color: '#999', fontSize: 12 }}>
                      {dayjs(item.published_at || item.created_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                    {item.author_info && (
                      <Tag color="blue">发布人: {item.author_info?.real_name || item.author_info?.username}</Tag>
                    )}
                    {item.expires_at && (
                      <Tag>过期: {dayjs(item.expires_at).format('YYYY-MM-DD')}</Tag>
                    )}
                  </Space>
                }
                description={
                  <div style={{ whiteSpace: 'pre-wrap', color: '#333' }}>
                    {item.content}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  )
}
