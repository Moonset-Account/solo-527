import React, { useState, useEffect } from 'react'
import {
  Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, Drawer, Descriptions, Alert,
  Timeline, Badge, Card, Collapse, Tooltip
} from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined, ExclamationCircleOutlined, CheckCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import { queryCallbacks, getCallbackDetail, retryCallback, getCallbackCompensationLogs } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'default', text: '待执行' },
  SUCCESS: { color: 'green', text: '成功' },
  FAILED: { color: 'red', text: '失败' },
  RETRYING: { color: 'orange', text: '重试中' }
}

const actionIconMap = {
  CREATE: <HistoryOutlined style={{ color: '#1890ff' }} />,
  SUCCESS: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
  FAILED_MAX_RETRY: <ExclamationCircleOutlined style={{ color: '#f5222d' }} />,
  MANUAL_RETRY: <ReloadOutlined style={{ color: '#722ed1' }} />
}

export default function CallbackMonitor() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [compensationLogs, setCompensationLogs] = useState([])
  const [searchForm] = Form.useForm()
  const [retrying, setRetrying] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await queryCallbacks({
        ...filters,
        current: pagination.current,
        size: pagination.pageSize
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params = {}
    if (values.callbackType) params.callbackType = values.callbackType
    if (values.businessId) params.businessId = values.businessId
    if (values.status) params.status = values.status
    setFilters(params)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleViewDetail = async (item) => {
    try {
      setLoadingLogs(true)
      const detail = await getCallbackDetail(item.id)
      setCurrentItem(detail)
      const logs = await getCallbackCompensationLogs(detail.callbackId)
      setCompensationLogs(logs || [])
      setDetailVisible(true)
    } catch (e) {
      message.error('加载详情失败')
    } finally {
      setLoadingLogs(false)
    }
  }

  const handleRetry = async (item) => {
    try {
      setRetrying(true)
      await retryCallback(item.id)
      message.success('已触发重试')
      loadData()
    } catch (e) {
      message.error(e.message || '重试失败')
    } finally {
      setRetrying(false)
    }
  }

  const failedCount = list.filter(r => r.status === 'FAILED').length
  const retryingCount = list.filter(r => r.status === 'RETRYING').length

  const columns = [
    {
      title: '回调ID', dataIndex: 'callbackId', width: 200,
      render: v => (
        <Tooltip title={v}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v.substring(0, 16)}...</span>
        </Tooltip>
      )
    },
    { title: '类型', dataIndex: 'callbackType', width: 100 },
    { title: '业务ID', dataIndex: 'businessId', width: 130, render: v => v || '-' },
    { title: '业务类型', dataIndex: 'businessType', width: 100, render: v => v || '-' },
    {
      title: '回调URL', dataIndex: 'url', ellipsis: true, width: 200,
      render: v => <Tooltip title={v}>{v}</Tooltip>
    },
    {
      title: '重试次数', width: 90,
      render: (_, r) => (
        <Space>
          <span>{r.retryCount}</span>
          <span style={{ color: '#999' }}>/ {r.maxRetries}</span>
        </Space>
      )
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => {
        const cfg = statusMap[v]
        const badgeColor = v === 'FAILED' ? 'red' : v === 'SUCCESS' ? 'green' : v === 'RETRYING' ? 'orange' : 'default'
        return (
          <Badge status={badgeColor} text={cfg ? cfg.text : v} />
        )
      }
    },
    {
      title: '失败原因', dataIndex: 'failureReason', width: 180, ellipsis: true,
      render: v => v ? (
        <Tooltip title={v}>
          <span style={{ color: '#f5222d' }}><ExclamationCircleOutlined /> {v.substring(0, 20)}...</span>
        </Tooltip>
      ) : <span style={{ color: '#999' }}>-</span>
    },
    {
      title: '下次重试', dataIndex: 'nextRetryAt', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '最后尝试', dataIndex: 'lastAttemptAt', width: 160,
      render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '操作', key: 'action', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {(r.status === 'FAILED' || r.status === 'RETRYING') && (
            <Button size="small" type="primary" icon={<ReloadOutlined />} onClick={() => handleRetry(r)} loading={retrying}>
              重试
            </Button>
          )}
        </Space>
      )
    }
  ]

  const actionLabelMap = {
    CREATE: '创建回调任务',
    SUCCESS: '回调执行成功',
    FAILED_MAX_RETRY: '达到最大重试次数, 标记失败',
    MANUAL_RETRY: '手动触发重试'
  }

  const renderTimelineItems = () => {
    if (!compensationLogs || compensationLogs.length === 0) {
      return [{ children: <span style={{ color: '#999' }}>暂无补偿记录</span> }]
    }
    return compensationLogs.map(log => ({
      color: log.action === 'SUCCESS' ? 'green' : log.action.startsWith('FAILED') ? 'red' : log.action.startsWith('RETRY') ? 'orange' : 'blue',
      dot: actionIconMap[log.action] || <HistoryOutlined />,
      children: (
        <Card size="small" style={{ marginBottom: 8 }}>
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Space>
              <Tag color="blue">{log.action}</Tag>
              <span style={{ fontWeight: 600 }}>
                {actionLabelMap[log.action] || log.action}
              </span>
            </Space>
            <div style={{ fontSize: 12, color: '#666' }}>
              <Space split={<span>|</span>}>
                <span>操作人: {log.operatorName || '-'}</span>
                <span>时间: {log.createdAt ? dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss') : '-'}</span>
              </Space>
            </div>
            {log.note && (
              <Alert
                message="详细说明"
                description={log.note}
                type={log.action.startsWith('FAILED') ? 'error' : log.action === 'SUCCESS' ? 'success' : 'info'}
                showIcon
                style={{ fontSize: 12 }}
              />
            )}
          </Space>
        </Card>
      )
    }))
  }

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">外部回调监控 & 补偿管理</h2>
        </div>

        <Space style={{ marginBottom: 16 }}>
          {failedCount > 0 && (
            <Alert
              message={`当前有 ${failedCount} 个回调执行失败，请及时处理`}
              type="error"
              showIcon
              closable
            />
          )}
          {retryingCount > 0 && (
            <Alert
              message={`${retryingCount} 个回调正在自动重试中`}
              type="warning"
              showIcon
              closable
            />
          )}
        </Space>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="callbackType" label="回调类型">
            <Select placeholder="全部" allowClear style={{ width: 140 }} options={[
              { value: 'PAYMENT', label: '支付回调' },
              { value: 'WORK_ORDER', label: '工单回调' },
              { value: 'NOTIFICATION', label: '通知回调' },
              { value: 'OTHER', label: '其他' }
            ]} />
          </Form.Item>
          <Form.Item name="businessId" label="业务ID">
            <Input placeholder="业务ID" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 120 }} options={[
              { value: 'PENDING', label: '待执行' },
              { value: 'SUCCESS', label: '成功' },
              { value: 'FAILED', label: '失败' },
              { value: 'RETRYING', label: '重试中' }
            ]} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          scroll={{ x: 1500 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Drawer
          title={
            <Space>
              <span>回调详情</span>
              {currentItem?.status === 'FAILED' && (
                <Tag color="red">需要关注</Tag>
              )}
            </Space>
          }
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={720}
          extra={
            currentItem && (currentItem.status === 'FAILED' || currentItem.status === 'RETRYING') && (
              <Button type="primary" icon={<ReloadOutlined />} onClick={() => handleRetry(currentItem)} loading={retrying}>
                手动补偿重试
              </Button>
            )
          }
        >
          <Spin spinning={loadingLogs}>
            {currentItem && (
              <div>
                {currentItem.failureReason && (
                  <Alert
                    message="最新失败原因"
                    description={currentItem.failureReason}
                    type="error"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                )}

                <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
                  <Descriptions.Item label="回调ID" span={2}>
                    <span style={{ fontFamily: 'monospace' }}>{currentItem.callbackId}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="回调类型">{currentItem.callbackType}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {statusMap[currentItem.status]
                      ? <Tag color={statusMap[currentItem.status].color}>{statusMap[currentItem.status].text}</Tag>
                      : currentItem.status}
                  </Descriptions.Item>
                  <Descriptions.Item label="业务ID">{currentItem.businessId || '-'}</Descriptions.Item>
                  <Descriptions.Item label="业务类型">{currentItem.businessType || '-'}</Descriptions.Item>
                  <Descriptions.Item label="重试次数" span={2}>
                    {currentItem.retryCount} / {currentItem.maxRetries}
                    {currentItem.retryCount >= currentItem.maxRetries && currentItem.status === 'FAILED' && (
                      <Tag color="red" style={{ marginLeft: 8 }}>已达上限</Tag>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间" span={2}>
                    {dayjs(currentItem.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="最后尝试时间" span={2}>
                    {currentItem.lastAttemptAt ? dayjs(currentItem.lastAttemptAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="下次计划重试" span={2}>
                    {currentItem.nextRetryAt ? dayjs(currentItem.nextRetryAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="回调URL" span={2}>
                    <a href={currentItem.url} target="_blank" rel="noreferrer">{currentItem.url}</a>
                  </Descriptions.Item>
                </Descriptions>

                <Collapse
                  defaultActiveKey={['request', 'logs']}
                  style={{ marginBottom: 16 }}
                  items={[
                    {
                      key: 'request',
                      label: '请求数据 (Request Body)',
                      children: currentItem.requestBody ? (
                        <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                          {currentItem.requestBody}
                        </pre>
                      ) : <span style={{ color: '#999' }}>无请求数据</span>
                    },
                    {
                      key: 'response',
                      label: '响应数据 (Response Body)',
                      children: currentItem.responseBody ? (
                        <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto', fontSize: 12 }}>
                          {currentItem.responseBody}
                        </pre>
                      ) : <span style={{ color: '#999' }}>无响应数据</span>
                    }
                  ]}
                />

                <Card
                  title={
                    <Space>
                      <HistoryOutlined />
                      <span>补偿操作记录</span>
                      <Tag color="purple">{compensationLogs.length} 条</Tag>
                    </Space>
                  }
                  style={{ background: '#fafafa' }}
                >
                  {compensationLogs.length > 0 ? (
                    <Timeline
                      mode="left"
                      items={renderTimelineItems()}
                    />
                  ) : (
                    <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>暂无补偿操作记录</p>
                  )}
                </Card>
              </div>
            )}
          </Spin>
        </Drawer>
      </div>
    </Spin>
  )
}
