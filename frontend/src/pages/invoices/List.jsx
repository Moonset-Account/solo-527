import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Space, Modal, Form, DatePicker, message, Popconfirm, Drawer, Descriptions, Card, Statistic, Row, Col, Upload, InputNumber, List } from 'antd'
import { PlusOutlined, SearchOutlined, CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, SendOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { invoiceApi, contractApi, supplierApi } from '@/api/endpoints'
import SavedFilterBar from '@/components/SavedFilterBar'
import dayjs from 'dayjs'

function InvoiceList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [statusSummary, setStatusSummary] = useState([])
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [reviewModal, setReviewModal] = useState(false)
  const [payModal, setPayModal] = useState(false)
  const [reviewForm] = Form.useForm()
  const [payForm] = Form.useForm()
  const [queryForm] = Form.useForm()

  const loadStatusSummary = async () => {
    try {
      const res = await invoiceApi.statusSummary()
      setStatusSummary(res.data || [])
    } catch (e) {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: pagination.current, page_size: pagination.pageSize }
      const res = await invoiceApi.list(params)
      setData(res.data.results || res.data)
      setPagination(p => ({ ...p, total: res.data.count || (res.data.results || res.data).length }))
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatusSummary()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters, pagination.current, pagination.pageSize])

  const handleSearch = () => {
    const values = queryForm.getFieldsValue()
    const cleaned = { ...Object.fromEntries(Object.entries(values).filter(([_, v]) => v != null && v !== '')) }
    if (cleaned.date_range) {
      cleaned.invoice_date_after = cleaned.date_range[0].format('YYYY-MM-DD')
      cleaned.invoice_date_before = cleaned.date_range[1].format('YYYY-MM-DD')
      delete cleaned.date_range
    }
    setFilters(cleaned)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const openDetail = async (item) => {
    try {
      const res = await invoiceApi.detail(item.id)
      setCurrentItem(res.data)
      setDetailDrawer(true)
    } catch (e) {}
  }

  const handleSubmit = async (id) => {
    try {
      await invoiceApi.submit(id)
      message.success('已提交审核')
      loadData()
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleReview = async (values) => {
    try {
      await invoiceApi.review(currentItem.id, values)
      message.success('审核完成')
      setReviewModal(false)
      loadData()
      openDetail(currentItem)
    } catch (e) {
      message.error('操作失败')
    }
  }

  const handlePay = async (values) => {
    try {
      await invoiceApi.pay(currentItem.id, values)
      message.success('付款完成')
      setPayModal(false)
      loadData()
      openDetail(currentItem)
    } catch (e) {
      message.error('操作失败')
    }
  }

  const getStatusTag = (status) => {
    const map = {
      draft: { color: 'default', label: '待提交' },
      pending_review: { color: 'processing', label: '待审核' },
      reviewed: { color: 'blue', label: '已审核' },
      pending_payment: { color: 'orange', label: '待付款' },
      paid: { color: 'green', label: '已付款' },
      rejected: { color: 'red', label: '已驳回' },
      cancelled: { color: 'default', label: '已作废' }
    }
    const s = map[status] || { color: 'default', label: status }
    return <Tag color={s.color}>{s.label}</Tag>
  }

  const getTypeTag = (type) => {
    const map = {
      vat_special: '增值税专票',
      vat_general: '增值税普票',
      electronic_special: '电子专票',
      electronic_general: '电子普票'
    }
    return <Tag>{map[type] || type}</Tag>
  }

  const columns = [
    { title: '发票号码', dataIndex: 'invoice_number', key: 'invoice_number' },
    { title: '发票类型', dataIndex: 'invoice_type', key: 'invoice_type', render: getTypeTag },
    { title: '开票日期', dataIndex: 'invoice_date', key: 'invoice_date' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '关联合同', dataIndex: 'contract_number', key: 'contract_number', render: v => v || '-' },
    { title: '价税合计(元)', dataIndex: 'total_amount', key: 'total_amount', render: v => v?.toLocaleString() },
    { title: '税额(元)', dataIndex: 'tax_amount', key: 'tax_amount' },
    { title: '到期付款日', dataIndex: 'due_date', key: 'due_date',
      render: v => v ? (dayjs(v).isBefore(dayjs()) ? <Tag color="red">{v} (已逾期)</Tag> : v) : '-'
    },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    {
      title: '操作', key: 'action', width: 260,
      render: (_, r) => (
        <Space>
          <Button type="link" onClick={() => openDetail(r)}>详情</Button>
          {r.status === 'draft' && (
            <Button type="link" icon={<SendOutlined />} onClick={() => handleSubmit(r.id)}>提交审核</Button>
          )}
          {r.status === 'pending_review' && (
            <Button type="link" icon={<CheckCircleOutlined />} onClick={() => { setCurrentItem(r); reviewForm.resetFields(); setReviewModal(true) }}>审核</Button>
          )}
          {(r.status === 'reviewed' || r.status === 'pending_payment') && (
            <Button type="link" icon={<DollarOutlined />} onClick={() => { setCurrentItem(r); payForm.resetFields(); setPayModal(true) }}>付款</Button>
          )}
        </Space>
      )
    }
  ]

  const statusMap = {
    draft: '待提交', pending_review: '待审核', reviewed: '已审核',
    pending_payment: '待付款', paid: '已付款', rejected: '已驳回', cancelled: '已作废'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">发票管理</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/invoices/new')}>录入发票</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statusSummary.map(s => (
          <Col span={3} key={s.status}>
            <Card size="small">
              <Statistic title={statusMap[s.status]} value={s.count} />
              <div style={{ color: '#999', fontSize: 12 }}>金额: {(s.total_amount || 0).toLocaleString()} 元</div>
            </Card>
          </Col>
        ))}
      </Row>

      <SavedFilterBar module="invoices" filters={filters} setFilters={setFilters} />

      <Form form={queryForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索发票号/供应商" prefix={<SearchOutlined />} allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="状态" allowClear style={{ width: 120 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Form.Item>
        <Form.Item name="invoice_type">
          <Select placeholder="发票类型" allowClear style={{ width: 130 }}
            options={[
              { value: 'vat_special', label: '增值税专票' },
              { value: 'vat_general', label: '增值税普票' },
              { value: 'electronic_special', label: '电子专票' },
              { value: 'electronic_general', label: '电子普票' }
            ]}
          />
        </Form.Item>
        <Form.Item name="date_range">
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">查询</Button>
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ ...pagination, showSizeChanger: true, showQuickJumper: true, showTotal: t => `共 ${t} 条` }}
        onChange={(p) => setPagination({ ...pagination, current: p.current, pageSize: p.pageSize })}
      />

      <Drawer title="发票详情" width={750} open={detailDrawer} onClose={() => setDetailDrawer(false)}>
        {currentItem && (
          <div>
            <Descriptions column={2} bordered size="small" title="发票基本信息">
              <Descriptions.Item label="发票号码">{currentItem.invoice_number}</Descriptions.Item>
              <Descriptions.Item label="发票代码">{currentItem.invoice_code || '-'}</Descriptions.Item>
              <Descriptions.Item label="发票类型">{getTypeTag(currentItem.invoice_type)}</Descriptions.Item>
              <Descriptions.Item label="开票日期">{currentItem.invoice_date}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentItem.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="关联合同">{currentItem.contract_number || '-'}</Descriptions.Item>
              <Descriptions.Item label="价税合计">{currentItem.total_amount?.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="税额">{currentItem.tax_amount} 元 (税率 {currentItem.tax_rate}%)</Descriptions.Item>
              <Descriptions.Item label="到期付款日">{currentItem.due_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="实际付款日">{currentItem.actual_payment_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态" span={2}>{getStatusTag(currentItem.status)}</Descriptions.Item>
              <Descriptions.Item label="创建人">{currentItem.created_by_name}</Descriptions.Item>
              <Descriptions.Item label="审核人">{currentItem.reviewed_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="付款人">{currentItem.paid_by_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="付款方式">{currentItem.payment_method || '-'}</Descriptions.Item>
              <Descriptions.Item label="发票文件" span={2}>
                {currentItem.invoice_file_url ? (
                  <a href={currentItem.invoice_file_url} target="_blank" rel="noreferrer">查看/下载</a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="备注" span={2}>{currentItem.remarks || '-'}</Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 20, marginBottom: 12 }}>发票明细</h4>
            <Table
              size="small"
              rowKey="id"
              dataSource={currentItem.items || []}
              columns={[
                { title: '项目名称', dataIndex: 'item_name', key: 'item_name' },
                { title: '规格型号', dataIndex: 'specification', key: 'specification', render: v => v || '-' },
                { title: '单位', dataIndex: 'unit', key: 'unit', render: v => v || '-' },
                { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
                { title: '金额(元)', dataIndex: 'amount', key: 'amount' },
                { title: '税额(元)', dataIndex: 'tax_amount', key: 'tax_amount' }
              ]}
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}><strong>合计</strong></Table.Summary.Cell>
                    <Table.Summary.Cell index={5}>
                      <strong>{(currentItem.items || []).reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString()} 元</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={6}>
                      <strong>{(currentItem.items || []).reduce((s, i) => s + Number(i.tax_amount || 0), 0).toLocaleString()} 元</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            <h4 style={{ marginTop: 20, marginBottom: 12 }}>状态变更日志</h4>
            <List
              size="small"
              dataSource={currentItem.status_logs || []}
              renderItem={log => (
                <List.Item>
                  <List.Item.Meta
                    title={`${log.from_status_display || '初始'} → ${log.to_status_display}`}
                    description={`${log.operated_by_name} - ${dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}${log.remark ? ' - ' + log.remark : ''}`}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>

      <Modal title="发票审核" open={reviewModal} onCancel={() => setReviewModal(false)} footer={null}>
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item label="审核结果" name="action" rules={[{ required: true }]}>
            <Select options={[
              { value: 'approve', label: '审核通过' },
              { value: 'reject', label: '驳回' }
            ]} />
          </Form.Item>
          <Form.Item label="审核意见" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认</Button>
            <Button onClick={() => setReviewModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="发票付款" open={payModal} onCancel={() => setPayModal(false)} footer={null}>
        <Form form={payForm} layout="vertical" onFinish={handlePay}>
          <Form.Item label="付款方式" name="payment_method">
            <Select options={[
              { value: 'bank_transfer', label: '银行转账' },
              { value: 'check', label: '支票' },
              { value: 'cash', label: '现金' },
              { value: 'online', label: '在线支付' }
            ]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认付款</Button>
            <Button onClick={() => setPayModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default InvoiceList
