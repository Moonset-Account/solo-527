import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, Drawer, Descriptions, Alert } from 'antd'
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons'
import { queryCallbacks, getCallbackDetail, retryCallback } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'default', text: '待执行' },
  SUCCESS: { color: 'green', text: '成功' },
  FAILED: { color: 'red', text: '失败' },
  RETRYING: { color: 'orange', text: '重试中' }
}

export default function CallbackMonitor() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [searchForm] = Form.useForm()
  const [retrying, setRetrying] = useState(false)

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
      const detail = await getCallbackDetail(item.id)
      setCurrentItem(detail)
      setDetailVisible(true)
    } catch (e) {
      message.error('加载详情失败')
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

  const columns = [
    { title: '回调ID', dataIndex: 'callbackId', width: 180 },
    { title: '回调类型', dataIndex: 'callbackType', width: 130 },
    { title: '业务ID', dataIndex: 'businessId', width: 130 },
    { title: '业务类型', dataIndex: 'businessType', width: 100 },
    { title: '回调URL', dataIndex: 'url', ellipsis: true, width: 200 },
    {
      title: '重试次数', width: 90,
      render: (_, r) => `${r.retryCount}/${r.maxRetries}`
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '下次重试', dataIndex: 'nextRetryAt', width: 160, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    { title: '最后尝试', dataIndex: 'lastAttemptAt', width: 160, render: v => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
    {
      title: '操作', key: 'action', width: 150, fixed: 'right',
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

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">外部回调监控</h2>
        </div>

        {failedCount > 0 && (
          <Alert
            message={`当前有 ${failedCount} 个回调执行失败，请及时处理`}
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

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
          scroll={{ x: 1400 }}
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
          title="回调详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={600}
          extra={
            currentItem && (currentItem.status === 'FAILED' || currentItem.status === 'RETRYING') && (
              <Button type="primary" icon={<ReloadOutlined />} onClick={() => handleRetry(currentItem)} loading={retrying}>
                手动重试
              </Button>
            )
          }
        >
          {currentItem && (
            <div>
              {currentItem.failureReason && (
                <Alert
                  message="失败原因"
                  description={currentItem.failureReason}
                  type="error"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              )}
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="回调ID">{currentItem.callbackId}</Descriptions.Item>
                <Descriptions.Item label="回调类型">{currentItem.callbackType}</Descriptions.Item>
                <Descriptions.Item label="业务ID">{currentItem.businessId || '-'}</Descriptions.Item>
                <Descriptions.Item label="业务类型">{currentItem.businessType || '-'}</Descriptions.Item>
                <Descriptions.Item label="回调URL">{currentItem.url}</Descriptions.Item>
                <Descriptions.Item label="状态">{statusMap[currentItem.status]?.text}</Descriptions.Item>
                <Descriptions.Item label="重试次数">{currentItem.retryCount} / {currentItem.maxRetries}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{dayjs(currentItem.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                {currentItem.lastAttemptAt && <Descriptions.Item label="最后尝试时间">{dayjs(currentItem.lastAttemptAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>}
                {currentItem.nextRetryAt && <Descriptions.Item label="下次重试时间">{dayjs(currentItem.nextRetryAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>}
              </Descriptions>
              <h3 style={{ marginTop: 16 }}>请求数据</h3>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                {currentItem.requestBody || '-'}
              </pre>
              <h3 style={{ marginTop: 16 }}>响应数据</h3>
              <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, maxHeight: 200, overflow: 'auto' }}>
                {currentItem.responseBody || '-'}
              </pre>
            </div>
          )}
        </Drawer>
      </div>
    </Spin>
  )
}
