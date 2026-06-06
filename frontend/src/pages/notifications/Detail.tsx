import React from 'react'
import { Card, Descriptions, Tag, Button, Space, List, Divider, message } from 'antd'
import { ArrowLeftOutlined, CheckCircleOutlined, FileOutlined } from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { notificationApi } from '@/services/notifications'
import dayjs from 'dayjs'

const NotificationDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: notification, isLoading } = useQuery(
    ['notification', id],
    () => notificationApi.getDetail(Number(id)).then((res) => res.data),
    {
      onSuccess: (data) => {
        if (!data.is_read) {
          notificationApi.markRead(Number(id))
          queryClient.invalidateQueries(['unread-count'])
        }
      }
    }
  )

  const ackMutation = useMutation(
    () => notificationApi.markAck(Number(id)),
    {
      onSuccess: () => {
        message.success('已确认')
        queryClient.invalidateQueries(['notification', id])
      }
    }
  )

  if (isLoading || !notification) {
    return <Card loading />
  }

  const typeColor: Record<string, string> = {
    system: 'blue',
    urgent: 'red',
    daily: 'green',
    activity: 'purple',
    payment: 'orange'
  }

  return (
    <div>
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>
            返回
          </Button>
          <h2 className="page-title">通知详情</h2>
        </Space>
        <Space>
          {notification.need_ack && !notification.is_ack && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => ackMutation.mutate()}
              loading={ackMutation.isLoading}
            >
              确认收到
            </Button>
          )}
        </Space>
      </div>

      <Card bordered={false}>
        <div style={{ marginBottom: 24 }}>
          <Space style={{ marginBottom: 16 }}>
            <Tag color={typeColor[notification.type]}>{notification.type_display}</Tag>
            {notification.is_read ? <Tag color="green">已读</Tag> : <Tag color="orange">未读</Tag>}
            {notification.need_ack && (
              notification.is_ack
                ? <Tag color="green">已确认</Tag>
                : <Tag color="red">待确认</Tag>
            )}
          </Space>
          <h1 style={{ fontSize: 24, marginBottom: 12 }}>{notification.title}</h1>
          <Descriptions size="small" column={3}>
            <Descriptions.Item label="发布人">{notification.published_by_name}</Descriptions.Item>
            <Descriptions.Item label="发布时间">
              {notification.published_at ? dayjs(notification.published_at).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="接收范围">{notification.target_type_display}</Descriptions.Item>
          </Descriptions>
        </div>

        <Divider />

        <div style={{ marginBottom: 24, lineHeight: 1.8, fontSize: 15 }}>
          {notification.content}
        </div>

        {notification.attachments?.length > 0 && (
          <>
            <Divider />
            <h4 style={{ marginBottom: 12 }}>附件</h4>
            <List
              dataSource={notification.attachments}
              renderItem={(item: any) => (
                <List.Item>
                  <Space>
                    <FileOutlined />
                    <a href={item.file} target="_blank" rel="noreferrer">
                      {item.file_name}
                    </a>
                    <span style={{ color: '#8c8c8c' }}>
                      {(item.file_size / 1024).toFixed(1)} KB
                    </span>
                  </Space>
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    </div>
  )
}

export default NotificationDetail
