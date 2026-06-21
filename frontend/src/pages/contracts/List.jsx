import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Space, Modal, Form, DatePicker, message, Popconfirm, Drawer, Descriptions, Upload, Card, Statistic, Row, Col } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, DeleteOutlined, UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { contractApi } from '@/api/endpoints'
import SavedFilterBar from '@/components/SavedFilterBar'
import dayjs from 'dayjs'

function ContractList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [statusSummary, setStatusSummary] = useState([])
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [renewalModal, setRenewalModal] = useState(false)
  const [renewalForm] = Form.useForm()
  const [queryForm] = Form.useForm()

  const loadStatusSummary = async () => {
    try {
      const res = await contractApi.statusSummary()
      setStatusSummary(res.data || [])
    } catch (e) {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: pagination.current, page_size: pagination.pageSize }
      const res = await contractApi.list(params)
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
      cleaned.start_date_after = cleaned.date_range[0].format('YYYY-MM-DD')
      cleaned.end_date_before = cleaned.date_range[1].format('YYYY-MM-DD')
      delete cleaned.date_range
    }
    setFilters(cleaned)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleDelete = async (id) => {
    try {
      await contractApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleSubmitApproval = async (id) => {
    try {
      await contractApi.submitForApproval(id)
      message.success('已提交审批')
      loadData()
    } catch (e) {
      message.error('提交失败')
    }
  }

  const handleRenewal = async (values) => {
    try {
      await contractApi.renewals.handle(currentItem.id, values)
      message.success('处理成功')
      setRenewalModal(false)
      loadData()
    } catch (e) {
      message.error('处理失败')
    }
  }

  const openDetail = async (item) => {
    try {
      const res = await contractApi.detail(item.id)
      setCurrentItem(res.data)
      setDetailDrawer(true)
    } catch (e) {}
  }

  const getStatusTag = (status) => {
    const map = {
      draft: { color: 'default', label: '草稿' },
      pending_approval: { color: 'processing', label: '待审批' },
      active: { color: 'green', label: '执行中' },
      expiring_soon: { color: 'orange', label: '即将到期' },
      expired: { color: 'red', label: '已到期' },
      terminated: { color: 'default', label: '已终止' }
    }
    const s = map[status] || { color: 'default', label: status }
    return <Tag color={s.color}>{s.label}</Tag>
  }

  const getDaysTag = (days) => {
    if (days == null) return null
    if (days < 0) return <Tag color="red">已过期{-days}天</Tag>
    if (days <= 15) return <Tag color="red">{days}天</Tag>
    if (days <= 30) return <Tag color="orange">{days}天</Tag>
    if (days <= 90) return <Tag color="gold">{days}天</Tag>
    return <Tag color="green">{days}天</Tag>
  }

  const columns = [
    { title: '合同编号', dataIndex: 'contract_number', key: 'contract_number' },
    { title: '合同名称', dataIndex: 'title', key: 'title' },
    { title: '供应商', dataIndex: 'supplier_name', key: 'supplier_name' },
    { title: '开始日期', dataIndex: 'start_date', key: 'start_date' },
    { title: '结束日期', dataIndex: 'end_date', key: 'end_date' },
    { title: '剩余天数', dataIndex: 'days_to_expiry', key: 'days_to_expiry', render: getDaysTag },
    { title: '合同金额(元)', dataIndex: 'total_amount', key: 'total_amount', render: v => v?.toLocaleString() },
    { title: '覆盖品类', dataIndex: 'category_names', key: 'category_names', render: v => v?.map(n => <Tag key={n}>{n}</Tag>) },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    {
      title: '操作', key: 'action', width: 240,
      render: (_, r) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/contracts/${r.id}/edit`)}>编辑</Button>
          {r.status === 'draft' && (
            <Button type="link" icon={<CheckCircleOutlined />} onClick={() => handleSubmitApproval(r.id)}>提交审批</Button>
          )}
          {(r.status === 'expiring_soon' || r.status === 'active') && (
            <Button type="link" onClick={() => { setCurrentItem(r); renewalForm.resetFields(); setRenewalModal(true) }}>续签处理</Button>
          )}
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const statusMap = {
    draft: '草稿', pending_approval: '待审批', active: '执行中',
    expiring_soon: '即将到期', expired: '已到期', terminated: '已终止'
  }

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">框架协议管理</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/contracts/new')}>新建合同</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        {statusSummary.map(s => (
          <Col span={4} key={s.status}>
            <Card size="small">
              <Statistic title={statusMap[s.status]} value={s.count} />
              <div style={{ color: '#999', fontSize: 12 }}>金额: {s.total_amount?.toLocaleString()} 元</div>
            </Card>
          </Col>
        ))}
      </Row>

      <SavedFilterBar module="contracts" filters={filters} setFilters={setFilters} />

      <Form form={queryForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索编号/名称/供应商" prefix={<SearchOutlined />} allowClear style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="合同状态" allowClear style={{ width: 130 }}
            options={Object.entries(statusMap).map(([k, v]) => ({ value: k, label: v }))}
          />
        </Form.Item>
        <Form.Item name="payment_terms">
          <Select placeholder="付款方式" allowClear style={{ width: 120 }}
            options={[
              { value: 'monthly', label: '月结' },
              { value: 'quarterly', label: '季结' },
              { value: 'semiannual', label: '半年结' },
              { value: 'annual', label: '年结' },
              { value: 'delivery', label: '货到付款' }
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

      <Drawer title="合同详情" width={800} open={detailDrawer} onClose={() => setDetailDrawer(false)}>
        {currentItem && (
          <div>
            <Descriptions column={2} bordered size="small" title="基本信息">
              <Descriptions.Item label="合同编号">{currentItem.contract_number}</Descriptions.Item>
              <Descriptions.Item label="合同名称">{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="供应商">{currentItem.supplier_name}</Descriptions.Item>
              <Descriptions.Item label="项目负责人">{currentItem.project_manager_name}</Descriptions.Item>
              <Descriptions.Item label="开始日期">{currentItem.start_date}</Descriptions.Item>
              <Descriptions.Item label="结束日期">{currentItem.end_date} ({getDaysTag(currentItem.days_to_expiry)})</Descriptions.Item>
              <Descriptions.Item label="合同金额">{currentItem.total_amount?.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="最小起订金额">{currentItem.minimum_order_amount?.toLocaleString()} 元</Descriptions.Item>
              <Descriptions.Item label="付款方式">{currentItem.payment_terms_display}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(currentItem.status)}</Descriptions.Item>
              <Descriptions.Item label="签订日期">{currentItem.signed_date || '-'}</Descriptions.Item>
              <Descriptions.Item label="签订地点">{currentItem.signing_location || '-'}</Descriptions.Item>
              <Descriptions.Item label="覆盖品类" span={2}>
                {currentItem.category_names?.map(n => <Tag key={n}>{n}</Tag>)}
              </Descriptions.Item>
            </Descriptions>

            <h4 style={{ marginTop: 20, marginBottom: 12 }}>合同价格 ({currentItem.prices?.length || 0})</h4>
            <Table
              size="small"
              rowKey="id"
              dataSource={currentItem.prices || []}
              columns={[
                { title: '耗材规格', dataIndex: 'specification_name', key: 'specification_name' },
                { title: '规格', dataIndex: 'specification_spec', key: 'specification_spec' },
                { title: '协议单价(元)', dataIndex: 'unit_price', key: 'unit_price' },
                { title: '最小采购量', dataIndex: 'minimum_quantity', key: 'minimum_quantity' },
                { title: '折扣率(%)', dataIndex: 'discount_rate', key: 'discount_rate' },
                { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date' }
              ]}
              pagination={false}
            />

            <Descriptions column={1} size="small" title="合同条款" style={{ marginTop: 20 }}>
              <Descriptions.Item label="合同条款">{currentItem.terms_and_conditions || '-'}</Descriptions.Item>
              <Descriptions.Item label="交货条款">{currentItem.delivery_terms || '-'}</Descriptions.Item>
              <Descriptions.Item label="质量要求">{currentItem.quality_requirements || '-'}</Descriptions.Item>
              <Descriptions.Item label="违约条款">{currentItem.penalty_clause || '-'}</Descriptions.Item>
              {currentItem.contract_file_url && (
                <Descriptions.Item label="合同文件">
                  <a href={currentItem.contract_file_url} target="_blank" rel="noreferrer">下载查看</a>
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>

      <Modal title="合同续签处理" open={renewalModal} onCancel={() => setRenewalModal(false)} footer={null}>
        <Form form={renewalForm} layout="vertical" onFinish={handleRenewal}>
          <Form.Item label="处理结果" name="decision" rules={[{ required: true, message: '请选择处理结果' }]}>
            <Select options={[
              { value: 'renewed', label: '已续签' },
              { value: 'not_renewed', label: '不续签' }
            ]} />
          </Form.Item>
          <Form.Item label="新合同ID (如已创建)" name="new_contract">
            <Input placeholder="输入新合同的ID" />
          </Form.Item>
          <Form.Item label="决策原因" name="decision_reason" rules={[{ required: true, message: '请说明决策原因' }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">确认</Button>
            <Button onClick={() => setRenewalModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ContractList
