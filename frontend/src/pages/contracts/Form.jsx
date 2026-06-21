import React, { useEffect, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, DatePicker, Upload, Card, Space, Row, Col, message, Tabs, Table } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftOutlined, UploadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { contractApi, supplierApi, consumableApi, userApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function ContractForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [categories, setCategories] = useState([])
  const [projectManagers, setProjectManagers] = useState([])
  const [specifications, setSpecifications] = useState([])
  const [prices, setPrices] = useState([])

  const loadSelectData = async () => {
    try {
      const [sRes, cRes, pmRes, specRes] = await Promise.all([
        supplierApi.list({ page_size: 500 }),
        consumableApi.categories.all(),
        userApi.list({ page_size: 500 }),
        consumableApi.specifications.list({ page_size: 500 })
      ])
      setSuppliers(sRes.data.results || sRes.data)
      setCategories(cRes.data.results || cRes.data)
      setProjectManagers((pmRes.data.results || pmRes.data).filter(u => ['procurement_manager', 'project_manager', 'admin'].includes(u.role)))
      setSpecifications(specRes.data.results || specRes.data)
    } catch (e) {}
  }

  const loadDetail = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await contractApi.detail(id)
      form.setFieldsValue({
        ...res.data,
        start_date: res.data.start_date ? dayjs(res.data.start_date) : null,
        end_date: res.data.end_date ? dayjs(res.data.end_date) : null,
        signed_date: res.data.signed_date ? dayjs(res.data.signed_date) : null
      })
      setPrices(res.data.prices || [])
    } catch (e) {
      message.error('加载详情失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSelectData()
    loadDetail()
  }, [id])

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const cleaned = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
        signed_date: values.signed_date?.format('YYYY-MM-DD')
      }
      if (id) {
        await contractApi.update(id, cleaned)
        message.success('更新成功')
      } else {
        await contractApi.create(cleaned)
        message.success('创建成功')
      }
      navigate('/contracts')
    } catch (e) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const addPrice = () => {
    setPrices([...prices, { id: Date.now(), is_new: true }])
  }

  const removePrice = (idx) => {
    setPrices(prices.filter((_, i) => i !== idx))
  }

  const updatePrice = (idx, field, value) => {
    const newPrices = [...prices]
    newPrices[idx] = { ...newPrices[idx], [field]: value }
    setPrices(newPrices)
  }

  const priceColumns = [
    { title: '耗材规格', dataIndex: 'specification', key: 'specification',
      render: (v, _, idx) => (
        <Select showSearch optionFilterProp="children" style={{ width: 280 }}
          value={v}
          onChange={val => updatePrice(idx, 'specification', val)}
          options={specifications.map(s => ({ value: s.id, label: `${s.name} - ${s.specification}` }))}
        />
      )
    },
    { title: '协议单价(元)', dataIndex: 'unit_price', key: 'unit_price',
      render: (v, _, idx) => (
        <InputNumber min={0} precision={2} value={v} onChange={val => updatePrice(idx, 'unit_price', val)} />
      )
    },
    { title: '最小采购量', dataIndex: 'minimum_quantity', key: 'minimum_quantity',
      render: (v, _, idx) => (
        <InputNumber min={0} value={v} onChange={val => updatePrice(idx, 'minimum_quantity', val)} />
      )
    },
    { title: '折扣率(%)', dataIndex: 'discount_rate', key: 'discount_rate',
      render: (v, _, idx) => (
        <InputNumber min={0} max={100} precision={2} value={v || 0} onChange={val => updatePrice(idx, 'discount_rate', val)} />
      )
    },
    { title: '生效日期', dataIndex: 'effective_date', key: 'effective_date',
      render: (v, _, idx) => (
        <DatePicker value={v ? dayjs(v) : null} onChange={val => updatePrice(idx, 'effective_date', val?.format('YYYY-MM-DD'))} />
      )
    },
    { title: '操作', key: 'action',
      render: (_, __, idx) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removePrice(idx)} />
      )
    }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          {id ? '编辑合同' : '新建合同'}
        </h2>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSubmit}
        initialValues={{ status: 'draft', payment_terms: 'monthly' }}
      >
        <Tabs
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: (
                <Card>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="合同编号" name="contract_number" rules={[{ required: true }]}>
                        <Input placeholder="如：HT-2024-001" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="合同名称" name="title" rules={[{ required: true }]}>
                        <Input placeholder="请输入合同名称" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="供应商" name="supplier" rules={[{ required: true }]}>
                        <Select showSearch optionFilterProp="children"
                          options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="项目负责人" name="project_manager" rules={[{ required: true }]}>
                        <Select options={projectManagers.map(u => ({ value: u.id, label: u.full_name || u.email }))} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="开始日期" name="start_date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="结束日期" name="end_date" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="合同总金额(元)" name="total_amount" rules={[{ required: true }]}>
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="最小起订金额(元)" name="minimum_order_amount">
                        <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="付款方式" name="payment_terms" rules={[{ required: true }]}>
                        <Select options={[
                          { value: 'monthly', label: '月结' },
                          { value: 'quarterly', label: '季结' },
                          { value: 'semiannual', label: '半年结' },
                          { value: 'annual', label: '年结' },
                          { value: 'delivery', label: '货到付款' }
                        ]} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="状态" name="status" rules={[{ required: true }]}>
                        <Select options={[
                          { value: 'draft', label: '草稿' },
                          { value: 'pending_approval', label: '待审批' },
                          { value: 'active', label: '执行中' },
                          { value: 'expiring_soon', label: '即将到期' },
                          { value: 'expired', label: '已到期' },
                          { value: 'terminated', label: '已终止' }
                        ]} />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="覆盖品类" name="categories" rules={[{ required: true }]}>
                        <Select mode="multiple"
                          options={categories.map(c => ({ value: c.id, label: c.name }))}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="覆盖规格" name="specifications">
                        <Select mode="multiple" showSearch optionFilterProp="children"
                          options={specifications.map(s => ({ value: s.id, label: `${s.name} - ${s.specification}` }))}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={24}>
                    <Col span={12}>
                      <Form.Item label="签订日期" name="signed_date">
                        <DatePicker style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item label="签订地点" name="signing_location">
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Form.Item label="合同条款" name="terms_and_conditions">
                    <Input.TextArea rows={3} />
                  </Form.Item>
                  <Form.Item label="交货条款" name="delivery_terms">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="质量要求" name="quality_requirements">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                  <Form.Item label="违约条款" name="penalty_clause">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Card>
              )
            },
            {
              key: 'prices',
              label: '合同价格',
              children: (
                <Card extra={<Button icon={<PlusOutlined />} onClick={addPrice}>添加价格</Button>}>
                  <Table
                    size="small"
                    rowKey={(r, idx) => r.id || idx}
                    columns={priceColumns}
                    dataSource={prices}
                    pagination={false}
                  />
                </Card>
              )
            }
          ]}
        />

        <Form.Item style={{ marginTop: 24 }}>
          <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
          <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>取消</Button>
        </Form.Item>
      </Form>
    </div>
  )
}

export default ContractForm
