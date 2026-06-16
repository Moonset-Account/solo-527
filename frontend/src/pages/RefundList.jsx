import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, Modal, Form, message, Badge } from 'antd'
import { SearchOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { refundAPI } from '../services/api.js'
import FilterSaver from '../components/FilterSaver.jsx'

const { Option } = Select
const { TextArea } = Input

function RefundList() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', eventId: '', keyword: '' })
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [handleRecord, setHandleRecord] = useState(null)
  const [handleType, setHandleType] = useState('approve')
  const [form] = Form.useForm()
  const [pendingCount, setPendingCount] = useState(0)

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await refundAPI.getList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters
      })
      setData(result.list)
      setPagination(p => ({ ...p, total: result.total }))
    } finally {
      setLoading(false)
    }
  }

  const loadPendingCount = async () => {
    try {
      const count = await refundAPI.getPendingCount()
      setPendingCount(count)
    } catch (e) {}
  }

  useEffect(() => {
    loadData()
    loadPendingCount()
  }, [pagination.current, pagination.pageSize, filters])

  const handleFilterChange = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }))
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleApplySavedFilter = (filterData) => {
    setFilters(filterData)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const openHandleModal = (record, type) => {
    setHandleRecord(record)
    setHandleType(type)
    setHandleModalVisible(true)
  }

  const handleSubmit = async (values) => {
    try {
      if (handleType === 'approve') {
        await refundAPI.approve(handleRecord.id, { handleRemark: values.handleRemark })
        message.success('已批准退款')
      } else {
        await refundAPI.reject(handleRecord.id, { handleRemark: values.handleRemark })
        message.success('已拒绝退款')
      }
      setHandleModalVisible(false)
      form.resetFields()
      loadData()
      loadPendingCount()
    } catch (e) {}
  }

  const statusMap = {
    PENDING: { color: 'orange', text: '待处理' },
    APPROVED: { color: 'blue', text: '已批准' },
    REJECTED: { color: 'red', text: '已拒绝' },
    COMPLETED: { color: 'green', text: '已完成' }
  }

  const columns = [
    { title: '退款单号', dataIndex: 'id', width: 80 },
    { title: '订单号', dataIndex: ['order', 'orderNo'] },
    { title: '活动名称', dataIndex: ['order', 'event', 'name'] },
    { title: '申请人', dataIndex: ['user', 'name'] },
    {
      title: '退款金额',
      dataIndex: 'amount',
      render: (v) => <span style={{ color: '#f5222d', fontWeight: 'bold' }}>¥{v}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s) => {
        const info = statusMap[s] || { color: 'default', text: s }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    { title: '来源单据', dataIndex: 'sourceOrder' },
    {
      title: '申请时间',
      dataIndex: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        record.status === 'PENDING' ? (
          <Space>
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => openHandleModal(record, 'approve')}>
              通过
            </Button>
            <Button type="link" size="small" danger icon={<CloseOutlined />} onClick={() => openHandleModal(record, 'reject')}>
              拒绝
            </Button>
          </Space>
        ) : null
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <h2>退票管理</h2>
          <Badge count={pendingCount} size="small">
            <Tag color="orange">待处理</Tag>
          </Badge>
        </Space>
      </div>

      <div className="filter-section">
        <Space wrap>
          <Input
            placeholder="搜索来源单据号"
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
            <Option value="PENDING">待处理</Option>
            <Option value="APPROVED">已批准</Option>
            <Option value="REJECTED">已拒绝</Option>
            <Option value="COMPLETED">已完成</Option>
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <FilterSaver
            pageKey="refunds"
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
        title={handleType === 'approve' ? '批准退款' : '拒绝退款'}
        open={handleModalVisible}
        onCancel={() => setHandleModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {handleRecord && (
            <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <p><strong>订单号：</strong>{handleRecord.order?.orderNo}</p>
              <p><strong>退款金额：</strong><span style={{ color: '#f5222d', fontSize: 18, fontWeight: 'bold' }}>¥{handleRecord.amount}</span></p>
              <p><strong>退款原因：</strong>{handleRecord.reason || '-'}</p>
            </div>
          )}
          <Form.Item name="handleRemark" label="处理备注" rules={[{ required: true, message: '请输入处理备注' }]}>
            <TextArea rows={3} placeholder="请输入处理备注" />
          </Form.Item>
          <Form.Item>
            <Button type={handleType === 'approve' ? 'primary' : 'primary'} danger={handleType === 'reject'} htmlType="submit" block>
              确认{handleType === 'approve' ? '批准' : '拒绝'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RefundList
