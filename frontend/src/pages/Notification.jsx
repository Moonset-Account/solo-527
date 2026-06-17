import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Select,
  Card,
  Tag,
  App,
  Modal,
  Input,
  Badge,
  Row,
  Col,
  Form,
  Descriptions,
} from 'antd'
import {
  BellOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  SettingOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { notificationApi, notificationTypes } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const { Option } = Select
const { TextArea } = Input

const Notification = () => {
  const [data, setData] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [typeFilter, setTypeFilter] = useState('')
  const [readFilter, setReadFilter] = useState('')
  const [detail, setDetail] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [sendModalVisible, setSendModalVisible] = useState(false)
  const [sendForm] = Form.useForm()
  const { user } = useAuth()
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
    fetchUnreadCount()
  }, [typeFilter, readFilter])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (typeFilter) params.type = typeFilter
      if (readFilter !== '') params.isRead = readFilter
      const res = await notificationApi.getList(params)
      if (res.code === 200) setData(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      if (res.code === 200) setUnreadCount(res.data)
    } catch (e) {
      // ignore
    }
  }

  const markAsRead = async (id) => {
    try {
      const res = await notificationApi.markAsRead(id)
      if (res.code === 200) {
        fetchData()
        fetchUnreadCount()
      }
    } catch (e) {
      message.error('标记失败')
    }
  }

  const markAllAsRead = async () => {
    modal.confirm({
      title: '确认全部已读',
      content: '确定要将所有通知标记为已读吗？',
      onOk: async () => {
        const res = await notificationApi.markAllAsRead()
        if (res.code === 200) {
          message.success('已全部标记为已读')
          fetchData()
          fetchUnreadCount()
        }
      },
    })
  }

  const viewDetail = (record) => {
    setDetail(record)
    setDetailVisible(true)
    if (!record.isRead) {
      markAsRead(record.id)
    }
  }

  const handleSendSystem = () => {
    sendForm.resetFields()
    setSendModalVisible(true)
  }

  const handleSend = async () => {
    try {
      const values = await sendForm.validateFields()
      const res = await notificationApi.createSystem(values)
      if (res.code === 200) {
        message.success('发送成功')
        setSendModalVisible(false)
        fetchData()
      }
    } catch (e) {
      if (e.errorFields) return
      message.error('发送失败')
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      REWORK: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      WORK_ORDER: <FileTextOutlined style={{ color: '#1890ff' }} />,
      MATERIAL: <ShoppingOutlined style={{ color: '#faad14' }} />,
      PLAN_CHANGE: <SettingOutlined style={{ color: '#722ed1' }} />,
      SYSTEM: <BellOutlined style={{ color: '#13c2c2' }} />,
    }
    return icons[type] || <BellOutlined />
  }

  const getTypeColor = (type) => {
    const colors = {
      REWORK: 'error',
      WORK_ORDER: 'blue',
      MATERIAL: 'warning',
      PLAN_CHANGE: 'purple',
      SYSTEM: 'cyan',
    }
    return colors[type] || 'default'
  }

  const getTypeText = (type) => {
    const texts = {
      REWORK: '返工',
      WORK_ORDER: '工单',
      MATERIAL: '物料',
      PLAN_CHANGE: '计划变更',
      SYSTEM: '系统',
    }
    return texts[type] || type
  }

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (t) => (
        <Tag color={getTypeColor(t)} icon={getTypeIcon(t)}>
          {getTypeText(t)}
        </Tag>
      ),
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (_, record) => (
        <span style={{ fontWeight: record.isRead ? 'normal' : '600' }}>{record.title}</span>
      ),
    },
    {
      title: '内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'isRead',
      key: 'isRead',
      width: 100,
      render: (v) =>
        v ? (
          <Tag color="success" icon={<ReadOutlined />}>
            已读
          </Tag>
        ) : (
          <Badge status="processing" text="未读" />
        ),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" onClick={() => viewDetail(record)}>
            详情
          </Button>
          {!record.isRead && (
            <Button type="link" size="small" onClick={() => markAsRead(record.id)}>
              标记已读
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Space>
            通知中心
            <Badge count={unreadCount} offset={[10, 0]} />
          </Space>
        </h1>
        <Space>
          <Button icon={<ReadOutlined />} onClick={markAllAsRead} disabled={unreadCount === 0}>
            全部已读
          </Button>
          {user?.role === 'ADMIN' && (
            <Button type="primary" icon={<BellOutlined />} onClick={handleSendSystem}>
              发送系统通知
            </Button>
          )}
        </Space>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {notificationTypes.map((type) => {
          const count = data.filter((d) => d.type === type && !d.isRead).length
          return (
            <Col xs={12} md={8} lg={4} key={type}>
              <Card size="small">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    {getTypeIcon(type)}
                    <span style={{ fontWeight: 500 }}>{getTypeText(type)}</span>
                  </Space>
                  {count > 0 && (
                    <Badge
                      count={count}
                      style={{
                        backgroundColor: '#ff4d4f',
                      }}
                    />
                  )}
                </div>
              </Card>
            </Col>
          )
        })}
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Space>
            <FilterOutlined />
            <span>筛选：</span>
          </Space>
          <Select
            placeholder="通知类型"
            value={typeFilter || undefined}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            allowClear
          >
            {notificationTypes.map((t) => (
              <Option key={t} value={t}>
                {getTypeText(t)}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="阅读状态"
            value={readFilter === '' ? undefined : readFilter}
            onChange={setReadFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="false">未读</Option>
            <Option value="true">已读</Option>
          </Select>
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        onRow={(record) => ({
          onClick: () => viewDetail(record),
          style: { cursor: 'pointer' },
        })}
      />

      <Modal
        title="通知详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={600}
      >
        {detail && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space>
                <Tag color={getTypeColor(detail.type)} icon={getTypeIcon(detail.type)}>
                  {getTypeText(detail.type)}
                </Tag>
                {detail.isRead ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    已读
                  </Tag>
                ) : (
                  <Tag color="processing">未读</Tag>
                )}
              </Space>
            </div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="标题">{detail.title}</Descriptions.Item>
              <Descriptions.Item label="内容">{detail.content}</Descriptions.Item>
              {detail.relatedId && (
                <Descriptions.Item label="关联ID">{detail.relatedId}</Descriptions.Item>
              )}
              {detail.relatedType && (
                <Descriptions.Item label="关联类型">{detail.relatedType}</Descriptions.Item>
              )}
              <Descriptions.Item label="创建时间">
                {dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="发送系统通知"
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setSendModalVisible(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleSend}>
            发送
          </Button>,
        ]}
      >
        <Form form={sendForm} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入通知标题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={4} placeholder="请输入通知内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Notification
