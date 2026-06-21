import React, { useEffect, useState } from 'react'
import { Form, Input, Select, InputNumber, Button, DatePicker, Upload, Card, Row, Col, message, Table, Space } from 'antd'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftOutlined, PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { invoiceApi, contractApi, supplierApi } from '@/api/endpoints'
import dayjs from 'dayjs'

function InvoiceForm() {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState([])
  const [contracts, setContracts] = useState([])
  const [items, setItems] = useState([{ id: Date.now() }])
  const [fileList, setFileList] = useState([])

  const loadSelectData = async () => {
    try {
      const [sRes, cRes] = await Promise.all([
        supplierApi.list({ page_size: 500 }),
        contractApi.list({ page_size: 500 })
      ])
      setSuppliers(sRes.data.results || sRes.data)
      setContracts(cRes.data.results || cRes.data)
    } catch (e) {}
  }

  useEffect(() => {
    loadSelectData()
  }, [])

  const addItem = () => {
    setItems([...items, { id: Date.now() }])
  }

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  const updateItem = (idx, field, value) => {
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], [field]: value }
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const q = Number(newItems[idx].quantity || 0)
      const p = Number(newItems[idx].unit_price || 0)
      const r = Number(newItems[idx].tax_rate || 13)
      newItems[idx].amount = (q * p).toFixed(2)
      newItems[idx].tax_amount = ((q * p) * r / 100).toFixed(2)
    }
    setItems(newItems)
  }

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const cleaned = {
        ...values,
        invoice_date: values.invoice_date?.format('YYYY-MM-DD'),
        due_date: values.due_date?.format('YYYY-MM-DD'),
        items: items.filter(i => i.item_name && i.quantity).map(i => ({
          ...i,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          amount: Number(i.amount),
          tax_amount: Number(i.tax_amount),
          tax_rate: Number(i.tax_rate || 13)
        }))
      }
      await invoiceApi.create(cleaned)
      message.success('创建成功')
      navigate('/invoices')
    } catch (e) {
      message.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  const itemColumns = [
    { title: '项目名称', dataIndex: 'item_name', key: 'item_name',
      render: (v, _, idx) => <Input value={v} onChange={e => updateItem(idx, 'item_name', e.target.value)} placeholder="项目名称" />
    },
    { title: '规格型号', dataIndex: 'specification', key: 'specification',
      render: (v, _, idx) => <Input value={v} onChange={e => updateItem(idx, 'specification', e.target.value)} placeholder="规格" />
    },
    { title: '单位', dataIndex: 'unit', key: 'unit',
      render: (v, _, idx) => <Input value={v} onChange={e => updateItem(idx, 'unit', e.target.value)} placeholder="单位" style={{ width: 80 }} />
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity',
      render: (v, _, idx) => <InputNumber value={v} min={0} onChange={val => updateItem(idx, 'quantity', val)} />
    },
    { title: '单价(元)', dataIndex: 'unit_price', key: 'unit_price',
      render: (v, _, idx) => <InputNumber value={v} min={0} precision={2} onChange={val => updateItem(idx, 'unit_price', val)} />
    },
    { title: '税率(%)', dataIndex: 'tax_rate', key: 'tax_rate',
      render: (v, _, idx) => <InputNumber value={v || 13} min={0} precision={2} onChange={val => updateItem(idx, 'tax_rate', val)} style={{ width: 100 }} />
    },
    { title: '金额(元)', dataIndex: 'amount', key: 'amount', render: v => v || 0 },
    { title: '税额(元)', dataIndex: 'tax_amount', key: 'tax_amount', render: v => v || 0 },
    { title: '操作', key: 'action', render: (_, __, idx) => <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(idx)} /> }
  ]

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          录入发票
        </h2>
      </div>
      <Card style={{ maxWidth: 1000 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit} initialValues={{ tax_rate: 13, status: 'draft' }}>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="发票号码" name="invoice_number" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="发票代码" name="invoice_code">
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="发票类型" name="invoice_type" rules={[{ required: true }]}>
                <Select options={[
                  { value: 'vat_special', label: '增值税专票' },
                  { value: 'vat_general', label: '增值税普票' },
                  { value: 'electronic_special', label: '电子专票' },
                  { value: 'electronic_general', label: '电子普票' }
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={8}>
              <Form.Item label="开票日期" name="invoice_date" rules={[{ required: true }]}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="供应商" name="supplier" rules={[{ required: true }]}>
                <Select showSearch optionFilterProp="children"
                  options={suppliers.map(s => ({ value: s.id, label: s.name }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="关联合同" name="contract">
                <Select showSearch optionFilterProp="children" allowClear
                  options={contracts.map(c => ({ value: c.id, label: c.contract_number }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col span={6}>
              <Form.Item label="价税合计(元)" name="total_amount" rules={[{ required: true }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="税额(元)" name="tax_amount">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="税率(%)" name="tax_rate">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="到期付款日" name="due_date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>

          <h4 style={{ marginTop: 16, marginBottom: 12 }}>
            发票明细
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addItem} style={{ marginLeft: 16 }}>添加行</Button>
          </h4>
          <Table
            size="small"
            rowKey={(r, idx) => r.id || idx}
            columns={itemColumns}
            dataSource={items}
            pagination={false}
          />

          <Form.Item style={{ marginTop: 24 }}>
            <Button type="primary" htmlType="submit" loading={loading}>保存</Button>
            <Button onClick={() => navigate(-1)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}

export default InvoiceForm
