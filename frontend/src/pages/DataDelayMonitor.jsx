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
    const timer = setInterval(loadData, 60000)
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
      setData(list?.content || list || [])
      setTotal(list?.totalElements || list?.length || 0)
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
      setNotifications(result || [])
    } catch (error) {
      console.error('加载通知失败', error)
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
      default: return status
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
      loadNotifications()
    } catch (error) {
      console.error('清除通知失败', error)
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      await delayApi.clearAllNotifications()
      message.success('已清除所有通知')
      setNotifications([])
    } catch (error) {
      console.error('清除通知失败', error)
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
      render: (text) => <code>{text}</code>,
    },
    {
      title: '数据集名称',
      dataIndex: 'datasetName',
      key: 'datasetName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '最后更新时间',
      dataIndex: 'lastUpdateTime',
      key: 'lastUpdateTime',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '预期更新时间',
      dataIndex: 'expectedUpdateTime',
      key: 'expectedUpdateTime',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '延迟时间',
      dataIndex: 'delayMinutes',
      key: 'delayMinutes',
      render: (text) => (
        <span style={{ color: getDelayColor(text), fontWeight: 'bold' }}>
          {text > 0 ? `${text} 分钟` : '0 分钟'}
        </span>
      ),
      sorter: (a, b) => a.delayMinutes - b.delayMinutes,
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
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '通知用户',
      dataIndex: 'notifyUsers',
      key: 'notifyUsers',
      render: (text) => {
        if (!text) return '-'
        const users = Array.isArray(text) ? text : JSON.parse(text || '[]')
        return (
          <Space wrap>
            {users.slice(0, 3).map((u, i) => (
              <Tag key={i} color="blue">{u}</Tag>
            ))}
            {users.length > 3 && <Tag>+{users.length - 3}</Tag>}
          </Space>
        )
      },
    },
    {
      title: '监控时间',
      dataIndex: 'monitoredAt',
      key: 'monitoredAt',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ]

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
              {notifications.slice(0, 3).map((n, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{n}</span>
                  <Button type="link" size="small" onClick={() => handleClearNotification(i)}>
                    清除
                  </Button>
                </div>
              ))}
              {notifications.length > 3 && (
                <div>...还有 {notifications.length - 3} 条通知</div>
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
              value={stats.delayed || 0}
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
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          rowClassName={(record) => {
            switch (record.status) {
              case 'CRITICAL': return 'delay-critical'
              case 'DELAYED': return 'delay-delayed'
              case 'WARNING': return 'delay-warning'
              default: return ''
            }
          }}
        />
      </Card>
    </div>
  )
}
