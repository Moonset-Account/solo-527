import { useState, useEffect } from 'react'
import {
  Card,
  List,
  Tag,
  Button,
  Space,
  Statistic,
  Row,
  Col,
  Badge,
  message,
  Empty,
  Tabs,
  Avatar,
  Divider,
} from 'antd'
import {
  BellOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { getReminderList, markReminderRead, markAllRead } from '../api/reminder'

const ReminderCenter = () => {
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState([])
  const [stats, setStats] = useState({
    urgent: 0,
    normal: 0,
    low: 0,
    total: 0,
    unread: 0,
  })
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadReminders()
  }, [])

  const loadReminders = async () => {
    setLoading(true)
    try {
      const res = await getReminderList()
      if (res.code === 0) {
        setReminders(res.data.list)
        setStats(res.data.stats)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleMarkRead = async (id) => {
    const res = await markReminderRead(id)
    if (res.code === 0) {
      message.success('已标记为已处理')
      setReminders((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: 'read' } : item
        )
      )
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }))
    }
  }

  const handleMarkAllRead = async () => {
    const res = await markAllRead()
    if (res.code === 0) {
      message.success('全部标记为已处理')
      setReminders((prev) =>
        prev.map((item) => ({ ...item, status: 'read' }))
      )
      setStats((prev) => ({ ...prev, unread: 0 }))
    }
  }

  const getTypeConfig = (type) => {
    const configs = {
      urgent: {
        color: 'red',
        icon: <WarningOutlined />,
        label: '紧急',
        bgColor: '#fff2f0',
        borderColor: '#ffccc7',
      },
      normal: {
        color: 'blue',
        icon: <InfoCircleOutlined />,
        label: '普通',
        bgColor: '#e6f7ff',
        borderColor: '#91d5ff',
      },
      low: {
        color: 'default',
        icon: <BellOutlined />,
        label: '低',
        bgColor: '#f5f5f5',
        borderColor: '#d9d9d9',
      },
    }
    return configs[type] || configs.normal
  }

  const getTypeIcon = (relatedType) => {
    const icons = {
      appointment: <CalendarOutlined />,
      member: <UserOutlined />,
      treatment: <ShoppingOutlined />,
      stock: <FileTextOutlined />,
      report: <FileTextOutlined />,
    }
    return icons[relatedType] || <BellOutlined />
  }

  const filteredReminders = reminders.filter((item) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return item.status === 'unread'
    return item.type === activeTab
  })

  const statsCards = [
    {
      title: '全部提醒',
      value: stats.total,
      icon: <BellOutlined />,
      color: '#1890ff',
      key: 'all',
    },
    {
      title: '紧急提醒',
      value: stats.urgent,
      icon: <WarningOutlined />,
      color: '#f5222d',
      key: 'urgent',
    },
    {
      title: '普通提醒',
      value: stats.normal,
      icon: <InfoCircleOutlined />,
      color: '#52c41a',
      key: 'normal',
    },
    {
      title: '未处理',
      value: stats.unread,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      key: 'unread',
    },
  ]

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'unread', label: `未处理 (${stats.unread})` },
    { key: 'urgent', label: '紧急' },
    { key: 'normal', label: '普通' },
    { key: 'low', label: '低优先级' },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((card) => (
          <Col span={6} key={card.key}>
            <Card
              hoverable
              onClick={() => setActiveTab(card.key)}
              style={{
                cursor: 'pointer',
                borderColor: activeTab === card.key ? card.color : '',
                borderWidth: activeTab === card.key ? 2 : 1,
              }}
            >
              <Statistic
                title={card.title}
                value={card.value}
                prefix={card.icon}
                valueStyle={{ color: card.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="提醒列表"
        extra={
          <Space>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllRead}
              disabled={stats.unread === 0}
            >
              全部标记已处理
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {filteredReminders.length > 0 ? (
          <List
            dataSource={filteredReminders}
            loading={loading}
            renderItem={(item) => {
              const typeConfig = getTypeConfig(item.type)
              return (
                <List.Item
                  style={{
                    padding: '16px',
                    marginBottom: 12,
                    background: item.status === 'unread' ? '#fffbe6' : '#fff',
                    borderRadius: 8,
                    borderLeft: `4px solid ${typeConfig.color}`,
                  }}
                  actions={[
                    item.status === 'unread' && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleMarkRead(item.id)}
                      >
                        标记已处理
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: typeConfig.bgColor,
                          color: typeConfig.color,
                        }}
                        icon={getTypeIcon(item.relatedType)}
                      />
                    }
                    title={
                      <Space>
                        <Badge dot={item.status === 'unread'} color={typeConfig.color}>
                          <span style={{ fontWeight: 500 }}>{item.title}</span>
                        </Badge>
                        <Tag color={typeConfig.color} style={{ marginLeft: 8 }}>
                          {typeConfig.icon} {typeConfig.label}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <p style={{ color: '#666', margin: '8px 0' }}>{item.content}</p>
                        <span style={{ color: '#999', fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.time}
                        </span>
                      </div>
                    }
                  />
                </List.Item>
              )
            }}
          />
        ) : (
          <Empty description="暂无提醒" style={{ padding: '40px 0' }} />
        )}
      </Card>
    </div>
  )
}

export default ReminderCenter
