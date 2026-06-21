
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
  Input,
  Modal,
  Form,
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
  SearchOutlined,
  ReloadOutlined,
} from '@ant-design/icons'
import { getReminders, getReminderStats, handleReminder, handleAllReminders, generateReminders } from '../api/reminders'
import dayjs from 'dayjs'

const { TextArea } = Input

const ReminderCenter = () => {
  const [loading, setLoading] = useState(false)
  const [reminders, setReminders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({
    byUrgency: { urgent: 0, normal: 0, low: 0 },
    byStatus: { pending: 0, handled: 0, ignored: 0 },
    total: 0,
  })
  const [activeTab, setActiveTab] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [handlingId, setHandlingId] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadAll()
  }, [page, activeTab, keyword])

  const loadAll = async () => {
    setLoading(true)
    try {
      const params = { page, pageSize: 20 }
      if (activeTab === 'pending') {
        params.status = 'pending'
      } else if (activeTab === 'urgent' || activeTab === 'normal' || activeTab === 'low') {
        params.urgencyLevel = activeTab
      }
      if (keyword) {
        params.keyword = keyword
      }
      const [listRes, statsRes] = await Promise.all([
        getReminders(params),
        getReminderStats(),
      ])
      if (listRes.success) {
        setReminders(listRes.data.list || [])
        setTotal(listRes.data.total || 0)
      }
      if (statsRes.success) {
        setStats(statsRes.data)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHandleClick = (id) => {
    setHandlingId(id)
    form.resetFields()
    setHandleModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await handleReminder(handlingId, values)
      if (res.success) {
        message.success('处理成功')
        setHandleModalVisible(false)
        loadAll()
      }
    } catch {
      // validation error
    }
  }

  const handleMarkAll = async () => {
    Modal.confirm({
      title: '确认批量处理',
      content: '确定将所有待处理提醒标记为已处理？',
      onOk: async () => {
        const res = await handleAllReminders()
        if (res.success) {
          message.success('已全部标记为已处理')
          loadAll()
        }
      },
    })
  }

  const handleGenerate = async () => {
    const res = await generateReminders()
    if (res.success) {
      message.success(`生成提醒成功：新增${res.data.generated || 0}条，跳过${res.data.skipped || 0}条`)
      loadAll()
    }
  }

  const getUrgencyConfig = (urgencyLevel) => {
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
    return configs[urgencyLevel] || configs.normal
  }

  const getRelatedIcon = (relatedType) => {
    const icons = {
      appointment: <CalendarOutlined />,
      memberTreatment: <ShoppingOutlined />,
      member: <UserOutlined />,
      stock: <FileTextOutlined />,
      report: <FileTextOutlined />,
    }
    return icons[relatedType] || <BellOutlined />
  }

  const unreadCount = stats.byStatus?.pending || 0

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
      value: stats.byUrgency?.urgent || 0,
      icon: <WarningOutlined />,
      color: '#f5222d',
      key: 'urgent',
    },
    {
      title: '普通提醒',
      value: stats.byUrgency?.normal || 0,
      icon: <InfoCircleOutlined />,
      color: '#1890ff',
      key: 'normal',
    },
    {
      title: '待处理',
      value: unreadCount,
      icon: <ClockCircleOutlined />,
      color: '#faad14',
      key: 'pending',
    },
  ]

  const tabItems = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: `待处理 (${unreadCount})` },
    { key: 'urgent', label: `紧急 (${stats.byUrgency?.urgent || 0})` },
    { key: 'normal', label: `普通 (${stats.byUrgency?.normal || 0})` },
    { key: 'low', label: `低优先级 (${stats.byUrgency?.low || 0})` },
    { key: 'handled', label: `已处理 (${stats.byStatus?.handled || 0})` },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>提醒中心</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statsCards.map((card) => (
          <Col xs={12} sm={12} md={6} key={card.key}>
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
          <Space wrap>
            <Input
              placeholder="搜索关键词"
              prefix={<SearchOutlined />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={() => setPage(1)}
              style={{ width: 200 }}
              allowClear
            />
            <Button icon={<ReloadOutlined />} onClick={loadAll}>刷新</Button>
            <Button icon={<CheckCircleOutlined />} type="primary" onClick={handleGenerate}>
              按规则生成
            </Button>
            <Button
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
            >
              全部标记已处理
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={(k) => { setActiveTab(k); setPage(1) }}
          items={tabItems}
          style={{ marginBottom: 16 }}
        />

        {reminders.length > 0 ? (
          <List
            dataSource={reminders}
            loading={loading}
            pagination={{
              current: page,
              pageSize: 20,
              total,
              onChange: setPage,
              showTotal: (t) => `共 ${t} 条`,
            }}
            renderItem={(item) => {
              const urgency = getUrgencyConfig(item.urgencyLevel)
              const isPending = item.status === 'pending'
              return (
                <List.Item
                  style={{
                    padding: '16px',
                    marginBottom: 12,
                    background: isPending ? '#fffbe6' : '#fff',
                    borderRadius: 8,
                    borderLeft: `4px solid ${urgency.color}`,
                  }}
                  actions={[
                    isPending && (
                      <Button
                        type="link"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => handleHandleClick(item.id)}
                      >
                        处理
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: urgency.bgColor,
                          color: urgency.color,
                        }}
                        icon={getRelatedIcon(item.relatedType)}
                      />
                    }
                    title={
                      <Space>
                        <Badge dot={isPending} color={urgency.color}>
                          <span style={{ fontWeight: 500 }}>{item.title}</span>
                        </Badge>
                        <Tag color={urgency.color} style={{ marginLeft: 8 }}>
                          {urgency.icon} {urgency.label}
                        </Tag>
                        {item.rule?.name && (
                          <Tag color="purple">规则：{item.rule.name}</Tag>
                        )}
                        {!isPending && (
                          <Tag color="green">已处理 {item.handledBy?.name || ''}</Tag>
                        )}
                      </Space>
                    }
                    description={
                      <div>
                        <p style={{ color: '#666', margin: '8px 0' }}>{item.content}</p>
                        {item.member?.name && (
                          <Tag color="blue" style={{ marginRight: 8 }}>
                            <UserOutlined /> {item.member.name}
                          </Tag>
                        )}
                        <span style={{ color: '#999', fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} />
                          {item.createdAt ? dayjs(item.createdAt).format('YYYY-MM-DD HH:mm') : ''}
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

      <Modal
        title="处理提醒"
        open={handleModalVisible}
        onOk={handleSubmit}
        onCancel={() => setHandleModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="处理备注" name="handleRemark">
            <TextArea rows={4} placeholder="请输入处理备注（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReminderCenter
