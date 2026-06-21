import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, List, Button, Modal, Form, Input, message } from 'antd'
import {
  FileTextOutlined,
  TeamOutlined,
  FileSearchOutlined,
  AlertOutlined,
  CheckSquareOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { dashboardApi, contractApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function Dashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [expiringContracts, setExpiringContracts] = useState([])
  const [loading, setLoading] = useState(false)
  const [handleModal, setHandleModal] = useState(false)
  const [currentNotification, setCurrentNotification] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, notifRes, expiringRes] = await Promise.all([
        dashboardApi.stats(),
        dashboardApi.notifications.list({ ordering: '-priority,-created_at' }),
        contractApi.expiringSoon({ days: 30 })
      ])
      setStats(statsRes.data)
      setNotifications(notifRes.data.results || notifRes.data)
      setExpiringContracts(expiringRes.data.results || expiringRes.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await dashboardApi.notifications.markRead(id)
      dashboardApi.notifications.unreadCount()
      loadData()
    } catch (e) {}
  }

  const handleMarkAllRead = async () => {
    try {
      await dashboardApi.notifications.markAllRead()
      loadData()
    } catch (e) {}
  }

  const openHandleModal = (notif) => {
    setCurrentNotification(notif)
    form.resetFields()
    setHandleModal(true)
  }

  const handleNotification = async (values) => {
    try {
      await dashboardApi.notifications.handle(currentNotification.id, values)
      message.success('处理成功')
      setHandleModal(false)
      loadData()
    } catch (e) {
      message.error('处理失败')
    }
  }

  const getRiskTag = (level) => {
    const colors = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' }
    const labels = { critical: '严重', high: '高', medium: '中', low: '低' }
    return <Tag color={colors[level]}>{labels[level]}</Tag>
  }

  const getPriorityTag = (priority) => {
    const colors = { high: 'red', medium: 'gold', low: 'green' }
    const labels = { high: '高', medium: '中', low: '低' }
    return <Tag color={colors[priority]}>{labels[priority]}</Tag>
  }

  const statCards = stats && [
    { title: '合同总数', value: stats.total_contracts, icon: <FileTextOutlined />, color: '#1677ff', onClick: () => navigate('/contracts') },
    { title: '供应商总数', value: stats.total_suppliers, icon: <TeamOutlined />, color: '#52c41a', onClick: () => navigate('/suppliers') },
    { title: '即将到期合同', value: stats.expiring_contracts, icon: <ExclamationCircleOutlined />, color: '#fa8c16', onClick: () => navigate('/contracts') },
    { title: '待审批', value: stats.pending_approvals, icon: <CheckSquareOutlined />, color: '#722ed1', onClick: () => navigate('/approvals') }
  ]

  const expiringColumns = [
    { title: '合同编号', dataIndex: 'contract_number', key: 'contract_number' },
    { title: '合同名称', dataIndex: 'title', key: 'title' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '剩余天数', dataIndex: 'days_to_expiry', key: 'days_to_expiry',
      render: (v) => <Tag color={v <= 15 ? 'red' : v <= 30 ? 'orange' : 'blue'}>{v}天</Tag>
    },
    { title: '操作', key: 'action',
      render: (_, r) => <Button type="link" onClick={() => navigate(`/contracts/${r.id}`)}>查看</Button>
    }
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {statCards?.map((s, i) => (
          <Col span={6} key={i}>
            <Card hoverable onClick={s.onClick} style={{ cursor: 'pointer' }}>
              <Statistic
                title={s.title}
                value={s.value}
                valueStyle={{ color: s.color }}
                prefix={s.icon}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={14}>
          <Card
            title="即将到期合同"
            extra={<Button type="link" onClick={() => navigate('/contracts')}>查看全部</Button>}
          >
            <Table
              loading={loading}
              dataSource={expiringContracts}
              columns={expiringColumns}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card
            title="通知消息"
            extra={<Button type="link" onClick={handleMarkAllRead}>全部已读</Button>}
          >
            <List
              loading={loading}
              dataSource={notifications.slice(0, 8)}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  onClick={() => handleMarkRead(item.id)}
                  style={{ cursor: 'pointer', background: item.is_read ? 'transparent' : '#f6ffed' }}
                >
                  <List.Item.Meta
                    avatar={getPriorityTag(item.priority)}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: item.is_read ? 'normal' : 600 }}>{item.title}</span>
                        <span style={{ fontSize: 12, color: '#999' }}>{dayjs(item.created_at).format('MM-DD HH:mm')}</span>
                      </div>
                    }
                    description={
                      <div>
                        <div style={{ marginBottom: 8 }}>{item.content}</div>
                        {!item.is_handled && (
                          <Button size="small" type="primary" onClick={(e) => { e.stopPropagation(); openHandleModal(item) }}>
                            处理
                          </Button>
                        )}
                        {item.is_handled && <Tag color="green">已处理</Tag>}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal title="处理通知" open={handleModal} onCancel={() => setHandleModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleNotification}>
          <Form.Item label="处理结果" name="handle_result" rules={[{ required: true, message: '请输入处理结果' }]}>
            <Input.TextArea rows={4} placeholder="请输入处理结果..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">提交</Button>
            <Button onClick={() => setHandleModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Dashboard
