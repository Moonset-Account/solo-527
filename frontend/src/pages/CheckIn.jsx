import React, { useState, useEffect } from 'react'
import { Card, Table, Button, Input, Select, Space, Tag, Modal, Form, message, Statistic, Row, Col } from 'antd'
import { SearchOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { checkInAPI, notificationAPI, todoAPI } from '../services/api.js'
import FilterSaver from '../components/FilterSaver.jsx'

const { Option } = Select

function CheckIn() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', eventId: '', keyword: '' })
  const [checkInModalVisible, setCheckInModalVisible] = useState(false)
  const [checkInCode, setCheckInCode] = useState('')
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 })

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await checkInAPI.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      })
      setData(result.list)
      setPagination(p => ({ ...p, total: result.total }))

      const successCount = result.list.filter(i => i.status === 'SUCCESS').length
      const failedCount = result.list.filter(i => i.status === 'FAILED').length
      setStats({
        total: result.total,
        success: successCount,
        failed: failedCount
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleApplySavedFilter = (filterData) => {
    setFilters(filterData)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleCheckIn = async (values) => {
    try {
      await checkInAPI.doCheckIn(values.orderItemId, {
        handleRemark: values.handleRemark
      })
      message.success('核销成功')
      setCheckInModalVisible(false)
      loadData()
    } catch (e) {
      message.error('核销失败')
    }
  }

  const statusMap = {
    PENDING: { color: 'orange', text: '待核销' },
    SUCCESS: { color: 'green', text: '核销成功' },
    FAILED: { color: 'red', text: '核销失败' }
  }

  const columns = [
    { title: '订单号', dataIndex: ['order', 'orderNo'] },
    { title: '来源单据', dataIndex: ['order', 'sourceOrder'] },
    { title: '活动', dataIndex: ['event', 'name'] },
    { title: '场次', dataIndex: ['session', 'name'] },
    { title: '票种', dataIndex: ['orderItem', 'ticketName'] },
    { title: '座位', dataIndex: ['orderItem', 'seatName'], render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => {
        const info = statusMap[s] || { color: 'default', text: s }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '核销时间',
      dataIndex: 'checkedInAt',
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '失败原因',
      dataIndex: 'failureReason',
      render: (v) => v || '-',
      ellipsis: true
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>核销签到</h2>
        <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => setCheckInModalVisible(true)}>
          核销签到
        </Button>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">总核销记录</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#52c41a' }}>{stats.success}</div>
            <div className="stat-label">核销成功</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#ff4d4f' }}>{stats.failed}</div>
            <div className="stat-label">核销失败</div>
          </div>
        </Col>
        <Col span={6}>
          <div className="stat-card">
            <div className="stat-value" style={{ color: '#1890ff' }}>
              {stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0}%
            </div>
            <div className="stat-label">核销成功率</div>
          </div>
        </Col>
      </Row>

      <div className="filter-section">
        <Space wrap>
          <Input
            placeholder="搜索核销码/来源单号"
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
            allowClear
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={filters.status || undefined}
            onChange={(v) => handleFilterChange('status', v)}
          >
            <Option value="PENDING">待核销</Option>
            <Option value="SUCCESS">核销成功</Option>
            <Option value="FAILED">核销失败</Option>
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <FilterSaver
            pageKey="checkins"
            filterData={filters}
            onApply={handleApplySavedFilter}
          />
        </Space>
      </div>

      <div className="table-container">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: (page, pageSize) => setPagination(p => ({ ...p, current: page, pageSize }))
          }}
        />
      </div>

      <Modal
        title="核销签到"
        open={checkInModalVisible}
        onCancel={() => setCheckInModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form layout="vertical" onFinish={handleCheckIn}>
          <Form.Item name="orderItemId" label="票券ID" rules={[{ required: true, message: '请输入票券ID' }]}>
            <Input placeholder="请输入票券ID进行核销" />
          </Form.Item>
          <Form.Item name="handleRemark" label="处理备注">
            <Input.TextArea rows={2} placeholder="请输入处理备注（选填）" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block icon={<CheckCircleOutlined />}>
              确认核销
            </Button>
          </Form.Item>
        </Form>
        <div style={{ background: '#fffbe6', padding: 12, borderRadius: 4, marginTop: 8 }}>
          <p style={{ margin: 0, color: '#faad14' }}>
            <ExclamationCircleOutlined /> 核销失败时将自动触发提醒，并同步更新到场率数据
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default CheckIn
