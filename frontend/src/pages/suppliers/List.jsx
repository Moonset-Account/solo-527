import React, { useEffect, useState } from 'react'
import { Table, Button, Input, Select, Tag, Space, Modal, Form, message, Drawer, Descriptions, Tabs, Card, Statistic, Row, Col, Rate, Upload, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined, DeleteOutlined, ExclamationCircleOutlined, UploadOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { supplierApi } from '@/api/endpoints'
import SavedFilterBar from '@/components/SavedFilterBar'
import dayjs from 'dayjs'

function SupplierList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [filters, setFilters] = useState({})
  const [riskSummary, setRiskSummary] = useState(null)
  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [riskModal, setRiskModal] = useState(false)
  const [riskForm] = Form.useForm()
  const [queryForm] = Form.useForm()

  const loadRiskSummary = async () => {
    try {
      const res = await supplierApi.riskSummary()
      setRiskSummary(res.data)
    } catch (e) {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: pagination.current, page_size: pagination.pageSize }
      const res = await supplierApi.list(params)
      setData(res.data.results || res.data)
      setPagination(p => ({ ...p, total: res.data.count || (res.data.results || res.data).length }))
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRiskSummary()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters, pagination.current, pagination.pageSize])

  const handleSearch = () => {
    const values = queryForm.getFieldsValue()
    setFilters({ ...Object.fromEntries(Object.entries(values).filter(([_, v]) => v != null && v !== '')) })
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleDelete = async (id) => {
    try {
      await supplierApi.delete(id)
      message.success('删除成功')
      loadData()
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleAddRisk = async (values) => {
    try {
      await supplierApi.risks.create({ ...values, supplier: currentItem.id })
      message.success('风险记录已添加')
      setRiskModal(false)
      riskForm.resetFields()
      openDetail(currentItem)
    } catch (e) {
      message.error('添加失败')
    }
  }

  const openDetail = async (item) => {
    try {
      const [detailRes, risksRes, evalRes] = await Promise.all([
        supplierApi.detail(item.id),
        supplierApi.risks.list({ supplier: item.id, ordering: '-created_at' }),
        supplierApi.evaluations.list({ supplier: item.id })
      ])
      setCurrentItem({
        ...detailRes.data,
        risks: risksRes.data.results || risksRes.data,
        evaluations: evalRes.data.results || evalRes.data
      })
      setDetailDrawer(true)
    } catch (e) {}
  }

  const getRiskTag = (level) => {
    const colors = { critical: 'red', high: 'orange', medium: 'gold', low: 'green' }
    const labels = { critical: '严重', high: '高', medium: '中', low: '低' }
    return <Tag color={colors[level]}>{labels[level]}</Tag>
  }

  const getStatusTag = (status) => {
    const colors = { active: 'green', suspended: 'orange', blacklisted: 'red', potential: 'blue' }
    const labels = { active: '合作中', suspended: '暂停', blacklisted: '黑名单', potential: '潜在' }
    return <Tag color={colors[status]}>{labels[status]}</Tag>
  }

  const getRatingTag = (rating) => {
    const colors = { aaa: 'green', aa: 'cyan', a: 'blue', b: 'gold', c: 'orange', d: 'red' }
    const labels = { aaa: 'AAA 优秀', aa: 'AA 良好', a: 'A 一般', b: 'B 合格', c: 'C 风险', d: 'D 不合格' }
    return <Tag color={colors[rating]}>{labels[rating]}</Tag>
  }

  const columns = [
    { title: '供应商名称', dataIndex: 'name', key: 'name' },
    { title: '统一社会信用代码', dataIndex: 'unified_social_credit_code', key: 'unified_social_credit_code' },
    { title: '联系人', dataIndex: 'contact_person', key: 'contact_person' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '合作状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '信用评级', dataIndex: 'credit_rating', key: 'credit_rating', render: v => v ? getRatingTag(v) : '-' },
    { title: '当前风险', dataIndex: 'current_risk_level', key: 'current_risk_level', render: v => v ? getRiskTag(v) : <Tag color="green">正常</Tag> },
    { title: '活跃风险数', dataIndex: 'active_risk_count', key: 'active_risk_count',
      render: v => v > 0 ? <Tag color={v > 2 ? 'red' : 'orange'}>{v} 个</Tag> : <Tag color="green">0</Tag>
    },
    {
      title: '操作', key: 'action', width: 200,
      render: (_, r) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(r)}>查看</Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/suppliers/${r.id}/edit`)}>编辑</Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">供应商管理</h2>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/suppliers/new')}>新增供应商</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="供应商总数" value={riskSummary?.total || 0} />
          </Card>
        </Col>
        {riskSummary?.by_risk?.map(r => (
          <Col span={4} key={r.level}>
            <Card size="small">
              <Statistic title={`${({ critical: '严重', high: '高', medium: '中', low: '低' })[r.level]}风险`} value={r.count}
                valueStyle={{ color: ({ critical: '#ff4d4f', high: '#fa8c16', medium: '#faad14', low: '#52c41a' })[r.level] }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <SavedFilterBar module="suppliers" filters={filters} setFilters={setFilters} />

      <Form form={queryForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
        <Form.Item name="search">
          <Input placeholder="搜索名称/代码/联系人" prefix={<SearchOutlined />} allowClear style={{ width: 220 }} />
        </Form.Item>
        <Form.Item name="status">
          <Select placeholder="合作状态" allowClear style={{ width: 130 }}
            options={[
              { value: 'active', label: '合作中' },
              { value: 'suspended', label: '暂停' },
              { value: 'blacklisted', label: '黑名单' },
              { value: 'potential', label: '潜在' }
            ]}
          />
        </Form.Item>
        <Form.Item name="credit_rating">
          <Select placeholder="信用评级" allowClear style={{ width: 130 }}
            options={[
              { value: 'aaa', label: 'AAA 优秀' },
              { value: 'aa', label: 'AA 良好' },
              { value: 'a', label: 'A 一般' },
              { value: 'b', label: 'B 合格' },
              { value: 'c', label: 'C 风险' },
              { value: 'd', label: 'D 不合格' }
            ]}
          />
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

      <Drawer title="供应商详情" width={850} open={detailDrawer} onClose={() => setDetailDrawer(false)}>
        {currentItem && (
          <Tabs
            items={[
              {
                key: 'basic',
                label: '基本信息',
                children: (
                  <Descriptions column={2} bordered size="small">
                    <Descriptions.Item label="供应商名称">{currentItem.name}</Descriptions.Item>
                    <Descriptions.Item label="统一社会信用代码">{currentItem.unified_social_credit_code}</Descriptions.Item>
                    <Descriptions.Item label="法人代表">{currentItem.legal_person || '-'}</Descriptions.Item>
                    <Descriptions.Item label="成立日期">{currentItem.establishment_date || '-'}</Descriptions.Item>
                    <Descriptions.Item label="注册资本">{currentItem.registered_capital ? `${currentItem.registered_capital} 万元` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="联系人">{currentItem.contact_person}</Descriptions.Item>
                    <Descriptions.Item label="联系电话">{currentItem.contact_phone}</Descriptions.Item>
                    <Descriptions.Item label="联系邮箱">{currentItem.contact_email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="地址" span={2}>{currentItem.address || '-'}</Descriptions.Item>
                    <Descriptions.Item label="经营范围" span={2}>{currentItem.business_scope || '-'}</Descriptions.Item>
                    <Descriptions.Item label="合作状态">{getStatusTag(currentItem.status)}</Descriptions.Item>
                    <Descriptions.Item label="信用评级">{currentItem.credit_rating ? getRatingTag(currentItem.credit_rating) : '-'}</Descriptions.Item>
                    <Descriptions.Item label="开户行">{currentItem.bank_name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="银行账号">{currentItem.bank_account || '-'}</Descriptions.Item>
                    <Descriptions.Item label="纳税人识别号">{currentItem.tax_number || '-'}</Descriptions.Item>
                    <Descriptions.Item label="创建人">{currentItem.created_by_name}</Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: 'risks',
                label: `风险明细 (${currentItem.risks?.length || 0})`,
                children: (
                  <div>
                    <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 12 }}
                      onClick={() => { riskForm.resetFields(); setRiskModal(true) }}
                    >
                      添加风险记录
                    </Button>
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={currentItem.risks || []}
                      columns={[
                        { title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', render: getRiskTag },
                        { title: '风险类型', dataIndex: 'risk_type_display', key: 'risk_type' },
                        { title: '风险标题', dataIndex: 'title', key: 'title' },
                        { title: '发现日期', dataIndex: 'discovered_date', key: 'discovered_date' },
                        { title: '状态', dataIndex: 'status_display', key: 'status' },
                        { title: '处理人', dataIndex: 'assigned_to_name', key: 'assigned_to_name', render: v => v || '-' },
                        { title: '证据数', dataIndex: 'evidences', key: 'evidences', render: v => v?.length || 0 }
                      ]}
                      pagination={false}
                      expandable={{
                        expandedRowRender: record => (
                          <div style={{ padding: '0 24px' }}>
                            <p><strong>详情：</strong>{record.description}</p>
                            <p><strong>来源：</strong>{record.source || '-'}</p>
                            <p><strong>缓解措施：</strong>{record.mitigation_measures || '-'}</p>
                            {record.evidences?.length > 0 && (
                              <div>
                                <strong>证据附件：</strong>
                                <ul>
                                  {record.evidences.map(e => (
                                    <li key={e.id}><a href={e.file_url} target="_blank" rel="noreferrer">{e.file_name}</a></li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )
                      }}
                    />
                  </div>
                )
              },
              {
                key: 'evaluations',
                label: '供应商评估',
                children: (
                  <Table
                    size="small"
                    rowKey="id"
                    dataSource={currentItem.evaluations || []}
                    columns={[
                      { title: '评估周期', dataIndex: 'evaluation_period', key: 'evaluation_period' },
                      { title: '质量评分', dataIndex: 'quality_score', key: 'quality_score',
                        render: v => <Rate disabled allowHalf value={v / 20} />
                      },
                      { title: '交付评分', dataIndex: 'delivery_score', key: 'delivery_score',
                        render: v => <Rate disabled allowHalf value={v / 20} />
                      },
                      { title: '价格评分', dataIndex: 'price_score', key: 'price_score',
                        render: v => <Rate disabled allowHalf value={v / 20} />
                      },
                      { title: '服务评分', dataIndex: 'service_score', key: 'service_score',
                        render: v => <Rate disabled allowHalf value={v / 20} />
                      },
                      { title: '综合评分', dataIndex: 'overall_score', key: 'overall_score',
                        render: v => <span style={{ fontWeight: 'bold', color: v >= 80 ? '#52c41a' : v >= 60 ? '#faad14' : '#ff4d4f' }}>{v}</span>
                      },
                      { title: '评估人', dataIndex: 'evaluated_by_name', key: 'evaluated_by_name' },
                      { title: '评估日期', dataIndex: 'evaluation_date', key: 'evaluation_date' }
                    ]}
                    pagination={false}
                  />
                )
              }
            ]}
          />
        )}
      </Drawer>

      <Modal title="添加供应商风险记录" open={riskModal} onCancel={() => setRiskModal(false)} footer={null} width={500}>
        <Form form={riskForm} layout="vertical" onFinish={handleAddRisk}
          initialValues={{ status: 'open', risk_level: 'medium' }}
        >
          <Form.Item label="风险类型" name="risk_type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'financial', label: '财务风险' },
              { value: 'operational', label: '经营风险' },
              { value: 'legal', label: '法律风险' },
              { value: 'quality', label: '质量风险' },
              { value: 'delivery', label: '交付风险' },
              { value: 'reputation', label: '声誉风险' },
              { value: 'compliance', label: '合规风险' }
            ]} />
          </Form.Item>
          <Form.Item label="风险等级" name="risk_level" rules={[{ required: true }]}>
            <Select options={[
              { value: 'critical', label: '严重' },
              { value: 'high', label: '高' },
              { value: 'medium', label: '中' },
              { value: 'low', label: '低' }
            ]} />
          </Form.Item>
          <Form.Item label="风险标题" name="title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="风险详情" name="description" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="发现日期" name="discovered_date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item label="风险来源" name="source">
            <Input placeholder="如：工商登记、新闻报道、内部投诉等" />
          </Form.Item>
          <Form.Item label="预计解决日期" name="expected_resolution_date">
            <Input type="date" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setRiskModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SupplierList
