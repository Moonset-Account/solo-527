import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Alert, Statistic, Row, Col, message, Badge } from 'antd'
import {
  ClockCircleOutlined,
  ReloadOutlined,
  BellOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { delayApi } from '@/services/api'
import dayjs from 'dayjs'

function parseNotifyUsers(notifyUsers) {
  if (!notifyUsers) return []
  if (Array.isArray(notifyUsers)) return notifyUsers
  if (typeof notifyUsers === 'string') {
    return notifyUsers
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0)
  }
  try {
    const parsed = JSON.parse(notifyUsers)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    return []
  }
}

function formatNotification(n) {
  if (!n) return ''
  if (typeof n === 'string') return n
  const datasetName = n.datasetName || n.dataset_code || n.datasetCode || '未知数据集'
  const delayMinutes = n.delayMinutes ?? n.delay_minutes ?? 0
  const severity = n.severity
  const expectedTime = n.expectedTime || n.expected_time || n.expectedUpdateTime
  let timeStr = ''
  if (expectedTime) {
    try {
      timeStr = `(预期更新: ${dayjs(expectedTime).format('MM-DD HH:mm')})`
    } catch (e) {
      timeStr = ''
    }
  }
  const severityText = severity === 'HIGH' ? '【严重】' : severity === 'MEDIUM' ? '【中等】' : ''
  return `${severityText}${datasetName} 延迟 ${delayMinutes} 分钟 ${timeStr}`
}

export default function DataDelayMonitor() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [stats, setStats] = useState({})
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    loadData()
    loadNotifications()
    const timer = setInterval(() => {
      loadData()
      loadNotifications()
    }, 60000)
    return () => clearInterval(timer)
  }, [pagination.current, pagination.pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current - 1,
        size: pagination.pageSize,
      }
      const [list, statsResult] = await Promise.all([
        delayApi.getList(params),
        delayApi.getStats(),
      ])
      const listData = list?.content || list || []
      const totalCount = list?.totalElements != null ? list.totalElements : (list?.length || 0)
      setData(listData)
      setTotal(totalCount)
      setStats(statsResult || {})
    } catch (error) {
      console.error('加载延迟监控数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadNotifications = async () => {
    try {
      const result = await delayApi.getNotifications()
      const notifList = Array.isArray(result) ? result : (Array.isArray(result?.data) ? result.data : [])
      setNotifications(notifList)
    } catch (error) {
      console.error('加载通知失败', error)
      setNotifications([])
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'NORMAL': return 'green'
      case 'WARNING': return 'gold'
      case 'DELAYED': return 'orange'
      case 'CRITICAL': return 'red'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'NORMAL': return '正常'
      case 'WARNING': return '预警'
      case 'DELAYED': return '延迟'
      case 'CRITICAL': return '严重延迟'
      default: return status || '未知'
    }
  }

  const getDelayColor = (minutes) => {
    if (minutes <= 0) return '#52c41a'
    if (minutes < 30) return '#faad14'
    if (minutes < 60) return '#fa8c16'
    return '#ff4d4f'
  }

  const handleClearNotification = async (index) => {
    try {
      await delayApi.clearNotification(index)
      message.success('已清除通知')
      setNotifications(prev => prev.filter((_, i) => i !== index))
    } catch (error) {
      console.error('清除通知失败', error)
      loadNotifications()
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      await delayApi.clearAllNotifications()
      message.success('已清除所有通知')
      setNotifications([])
    } catch (error) {
      console.error('清除通知失败', error)
      loadNotifications()
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '数据集编码',
      dataIndex: 'datasetCode',
      key: 'datasetCode',
      render: (text, record) => <code>{text || record.dataset_code || '-'}</code>,
    },
    {
      title: '数据集名称',
      dataIndex: 'datasetName',
      key: 'datasetName',
      render: (text, record) => <strong>{text || record.dataset_name || '-'}</strong>,
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdateTime',
      key: 'lastUpdateTime',
      render: (text, record) => {
        const t = text || record.last_update_time
        return t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'
      },
    },
    {
      title: '预期更新时间',
      dataIndex: 'expectedUpdateTime',
      key: 'expectedUpdateTime',
      render: (text, record) => {
        const t = text || record.expected_update_time
        return t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'
      },
    },
    {
      title: '延迟时间',
      dataIndex: 'delayMinutes',
      key: 'delayMinutes',
      render: (text, record) => {
        const m = text ?? record.delay_minutes ?? 0
        return (
          <span style={{ color: getDelayColor(m), fontWeight: 'bold' }}>
            {m > 0 ? `${m} 分钟` : '0 分钟'}
          </span>
        )
      },
      sorter: (a, b) => (a.delayMinutes ?? a.delay_minutes ?? 0) - (b.delayMinutes ?? b.delay_minutes ?? 0),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
      filters: [
        { text: '正常', value: 'NORMAL' },
        { text: '预警', value: 'WARNING' },
        { text: '延迟', value: 'DELAYED' },
        { text: '严重延迟', value: 'CRITICAL' },
      ],
      onFilter: (value, record) => (record.status || '') === value,
    },
    {
      title: '通知对象',
      dataIndex: 'notifyUsers',
      key: 'notifyUsers',
      render: (text, record) => {
        const raw = text || record.notify_users
        const users = parseNotifyUsers(raw)
        if (users.length === 0) return '-'
        return (
          <Space wrap>
            {users.slice(0, 5).map((u, i) => (
              <Tag key={i} color="geekblue">{u}</Tag>
            ))}
            {users.length > 5 && <Tag>+{users.length - 5}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '监控时间',
      dataIndex: 'monitoredAt',
      key: 'monitoredAt',
      render: (text, record) => {
        const t = text || record.notifiedAt || record.notified_at || record.updatedAt || record.updated_at
        return t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
      },
    },
  ]

  const totalCount = stats.total || 0
  const delayedCount = stats.delayed ?? (totalCount - (stats.normal ?? 0))

  return (
    <div>
      {notifications.length > 0 && (
        <Alert
          message={
            <Space>
              <Badge count={notifications.length} size="small">
                <BellOutlined style={{ fontSize: 16 }} />
              </Badge>
              <span>有 {notifications.length} 条数据延迟通知</span>
            </Space>
          }
          description={
            <Space direction="vertical" style={{ width: '100%' }}>
              {notifications.slice(0, 5).map((n, i) => {
                const notifyUsers = parseNotifyUsers(n.notifyUsers || n.notify_users)
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 500 }}>{formatNotification(n)}</div>
                      {notifyUsers.length > 0 && (
                        <div style={{ marginTop: 4 }}>
                          <Space wrap size={[4, 4]}>
                            <span style={{ color: '#888', fontSize: 12 }}>通知：</span>
                            {notifyUsers.map((u, j) => (
                              <Tag key={j} color="geekblue" style={{ margin: 0 }}>{u}</Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                    </div>
                    <Button type="link" size="small" onClick={() => handleClearNotification(i)}>
                      清除
                    </Button>
                  </div>
                )
              })}
              {notifications.length > 5 && (
                <div style={{ color: '#888', fontSize: 12 }}>...还有 {notifications.length - 5} 条通知</div>
              )}
            </Space>
          }
          type="warning"
          showIcon
          closable
          onClose={handleClearAllNotifications}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  正常数据集
                </Space>
              }
              value={stats.normal || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  预警数据集
                </Space>
              }
              value={stats.warning || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#fa8c16' }} />
                  延迟数据集
                </Space>
              }
              value={delayedCount}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <BellOutlined style={{ color: '#ff4d4f' }} />
                  严重延迟
                </Space>
              }
              value={stats.critical || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            数据延迟监控
          </Space>
        }
        extra={
          <Space>
            <span style={{ color: '#888', fontSize: 12 }}>每分钟自动刷新</span>
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey={(record) => record.id || `${record.datasetCode}-${record.datasetCode}`}
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          rowClassName={(record) => {
            const s = record.status
            if (s === 'CRITICAL') return 'delay-critical'
            if (s === 'DELAYED') return 'delay-delayed'
            if (s === 'WARNING') return 'delay-warning'
            return ''
          }}
        />
      </Card>
    </div>
  )
}
