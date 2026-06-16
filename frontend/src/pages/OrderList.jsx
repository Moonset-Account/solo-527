import React, { useState, useEffect } from 'react'
import { Table, Button, Input, Select, Space, Tag, message, Modal, Form, InputNumber } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { orderAPI } from '../services/api.js'
import FilterSaver from '../components/FilterSaver.jsx'

const { Option } = Select
const { TextArea } = Input

function OrderList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', eventId: '', keyword: '' })
  const [refundModalVisible, setRefundModalVisible] = useState(false)
  const [refundOrder, setRefundOrder] = useState(null)
  const [form] = Form.useForm()

  const loadData = async () => {
    setLoading(true)
    try {
      const result = await orderAPI.getList({
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

  const handleRefund = (record) => {
    setRefundOrder(record)
    setRefundModalVisible(true)
  }

  const handleRefundSubmit = async (values) => {
    try {
      await orderAPI.refund(refundOrder.id, {
        reason: values.reason
      })
      message.success('退票申请已提交')
      setRefundModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {}
  }

  const statusMap = {
    PENDING: { color: 'orange', text: '待支付' },
    PAID: { color: 'green', text: '已支付' },
    CANCELLED: { color: 'default', text: '已取消' },
    REFUNDED: { color: 'gray', text: '已退款' },
    REFUNDING: { color: 'blue', text: '退款中' }
  }

  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      render: (text, record) => (
        <a onClick={() => navigate(`/orders/${record.id}`)}>{text}</a>
      )
    },
    { title: '活动名称', dataIndex: ['event', 'name'] },
    { title: '购票人', dataIndex: ['user', 'name'] },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      render: (v) => `¥${v}`
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
      title: '下单时间',
      dataIndex: 'createdAt',
      render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/orders/${record.id}`)}>详情</Button>
          {record.status === 'PAID' && (
            <Button type="link" size="small" danger onClick={() => handleRefund(record)}>退票</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>订单管理</h2>
        <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
      </div>

      <div className="filter-section">
        <Space wrap>
          <Input
            placeholder="搜索订单号/来源单号"
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
            <Option value="PENDING">待支付</Option>
            <Option value="PAID">已支付</Option>
            <Option value="REFUNDING">退款中</Option>
            <Option value="REFUNDED">已退款</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <Button type="primary" onClick={loadData}>查询</Button>
          <FilterSaver
            pageKey="orders"
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
        title="申请退票"
        open={refundModalVisible}
        onCancel={() => setRefundModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleRefundSubmit}>
          {refundOrder && (
            <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
              <p><strong>订单号：</strong>{refundOrder.orderNo}</p>
              <p><strong>退款金额：</strong><span style={{ color: '#f5222d', fontSize: 18, fontWeight: 'bold' }}>¥{refundOrder.totalAmount}</span></p>
            </div>
          )}
          <Form.Item name="reason" label="退票原因" rules={[{ required: true, message: '请输入退票原因' }]}>
            <TextArea rows={3} placeholder="请输入退票原因" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" danger htmlType="submit" block>确认退票</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default OrderList
