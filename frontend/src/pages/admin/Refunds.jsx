import { Table, Button, Tag, Space, Card, Form, Select, DatePicker, Modal, Input, message, Row, Col } from 'antd'
import { SearchOutlined, ExportOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getRefunds, approveRefund, rejectRefund, completeRefund, exportRefunds } from '../../api/admin'
import FilterSaver from '../../components/FilterSaver'

function AdminRefunds() {
  const [loading, setLoading] = useState(false)
  const [refunds, setRefunds] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [reviewVisible, setReviewVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [reviewType, setReviewType] = useState('approve')
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadRefunds()
  }, [page, pageSize, filters])

  const loadRefunds = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, per_page: pageSize }
      const res = await getRefunds(params)
      setRefunds(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values) => {
    const params = { ...values }
    if (values.date_range) {
      params.start_date = values.date_range[0].format('YYYY-MM-DD')
      params.end_date = values.date_range[1].format('YYYY-MM-DD')
      delete params.date_range
    }
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    setFilters(params)
    setPage(1)
  }

  const handleApprove = (record) => {
    setCurrentItem(record)
    setReviewType('approve')
    form.resetFields()
    setReviewVisible(true)
  }

  const handleReject = (record) => {
    setCurrentItem(record)
    setReviewType('reject')
    form.resetFields()
    setReviewVisible(true)
  }

  const handleReview = async (values) => {
    try {
      if (reviewType === 'approve') {
        await approveRefund(currentItem.id, values)
        message.success('已通过')
      } else {
        await rejectRefund(currentItem.id, values)
        message.success('已拒绝')
      }
      setReviewVisible(false)
      loadRefunds()
    } catch (e) {}
  }

  const handleComplete = async (record) => {
    try {
      await completeRefund(record.id)
      message.success('退款已完成')
      loadRefunds()
    } catch (e) {}
  }

  const handleExport = () => {
    exportRefunds(filters)
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      approved: 'status-approved',
      rejected: 'status-rejected',
      completed: 'status-completed'
    }
    return map[status] || ''
  }

  const columns = [
    { title: '退款单号', dataIndex: 'refund_no', key: 'refund_no', width: 180 },
    { title: '关联订单', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '退款金额', dataIndex: 'amount', key: 'amount', render: v => <span style={{ color: '#f5222d' }}>¥{v.toFixed(2)}</span> },
    { title: '退款原因', dataIndex: 'reason', key: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s, r) => <Tag className={statusClass(s)}>{r.status_text}</Tag>
    },
    { title: '申请时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(record)} style={{ background: '#52c41a' }}>
                通过
              </Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(record)}>
                拒绝
              </Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" type="primary" onClick={() => handleComplete(record)} style={{ background: '#52c41a' }}>
              完成退款
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">退款确认</h2>
        <Space>
          <FilterSaver pageName="admin_refunds" filters={filters} onApplyFilter={setFilters} />
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
        </Space>
      </div>

      <Card className="filter-section">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" style={{ width: 120 }} allowClear>
                  <Select.Option value="pending">待审核</Select.Option>
                  <Select.Option value="approved">已通过</Select.Option>
                  <Select.Option value="rejected">已拒绝</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="date_range" label="日期">
                <DatePicker.RangePicker />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ background: '#52c41a' }}>查询</Button>
                  <Button onClick={() => { filterForm.resetFields(); setFilters({}) }}>重置</Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      <Card className="table-section">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={refunds}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title={reviewType === 'approve' ? '通过退款' : '拒绝退款'}
        open={reviewVisible}
        onCancel={() => setReviewVisible(false)}
        footer={null}
      >
        {currentItem && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
            <div><strong>退款单号：</strong>{currentItem.refund_no}</div>
            <div><strong>退款金额：</strong><span style={{ color: '#f5222d' }}>¥{currentItem.amount.toFixed(2)}</span></div>
            <div><strong>退款原因：</strong>{currentItem.reason}</div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleReview}>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder={reviewType === 'approve' ? '备注（选填）' : '请输入拒绝原因'} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: reviewType === 'approve' ? '#52c41a' : '#f5222d' }}>
              {reviewType === 'approve' ? '确认通过' : '确认拒绝'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminRefunds
