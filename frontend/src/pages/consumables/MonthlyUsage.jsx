import React, { useEffect, useState } from 'react'
import { Table, Button, Form, Select, InputNumber, Modal, Space, message, Tag, Card, Statistic, Row, Col } from 'antd'
import { PlusOutlined, ImportOutlined, ExportOutlined } from '@ant-design/icons'
import { consumableApi } from '@/api/endpoints'
import SavedFilterBar from '@/components/SavedFilterBar'
import dayjs from 'dayjs'

function MonthlyUsage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 })
  const [filters, setFilters] = useState({ year: dayjs().year(), month: dayjs().month() + 1 })
  const [specifications, setSpecifications] = useState([])
  const [addModal, setAddModal] = useState(false)
  const [batchModal, setBatchModal] = useState(false)
  const [summary, setSummary] = useState([])
  const [form] = Form.useForm()
  const [batchForm] = Form.useForm()

  const loadSpecifications = async () => {
    try {
      const res = await consumableApi.specifications.list({ page_size: 500 })
      setSpecifications(res.data.results || res.data)
    } catch (e) {}
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: pagination.current, page_size: pagination.pageSize }
      const [dataRes, summaryRes] = await Promise.all([
        consumableApi.monthlyUsages.list(params),
        consumableApi.monthlyUsages.summary({ year: filters.year })
      ])
      setData(dataRes.data.results || dataRes.data)
      setPagination(p => ({ ...p, total: dataRes.data.count || (dataRes.data.results || dataRes.data).length }))
      setSummary(summaryRes.data || [])
    } catch (e) {
      message.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSpecifications()
  }, [])

  useEffect(() => {
    loadData()
  }, [filters, pagination.current, pagination.pageSize])

  const handleAdd = async (values) => {
    try {
      await consumableApi.monthlyUsages.create(values)
      message.success('登记成功')
      setAddModal(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error('登记失败')
    }
  }

  const handleBatchAdd = async (values) => {
    try {
      await consumableApi.monthlyUsages.batchCreate({ usages: values.usages })
      message.success('批量登记成功')
      setBatchModal(false)
      loadData()
    } catch (e) {
      message.error('批量登记失败')
    }
  }

  const columns = [
    { title: '年份', dataIndex: 'year', key: 'year', width: 80 },
    { title: '月份', dataIndex: 'month', key: 'month', width: 80 },
    { title: '耗材名称', dataIndex: 'specification_name', key: 'specification_name' },
    { title: '规格', dataIndex: 'specification_spec', key: 'specification_spec' },
    { title: '使用数量', dataIndex: 'quantity', key: 'quantity' },
    { title: '实际金额(元)', dataIndex: 'actual_amount', key: 'actual_amount' },
    { title: '使用部门', dataIndex: 'department', key: 'department' },
    { title: '登记人', dataIndex: 'recorded_by_name', key: 'recorded_by_name' },
    { title: '登记时间', dataIndex: 'created_at', key: 'created_at', render: v => dayjs(v).format('YYYY-MM-DD') }
  ]

  const years = Array.from({ length: 5 }, (_, i) => dayjs().year() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">月度用量登记</h2>
        <Space>
          <Button icon={<ImportOutlined />} onClick={() => setBatchModal(true)}>批量登记</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModal(true)}>登记用量</Button>
        </Space>
      </div>

      <SavedFilterBar module="monthly_usage" filters={filters} setFilters={setFilters} defaultFilters={{ year: dayjs().year(), month: dayjs().month() + 1 }} />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="记录数" value={pagination.total} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总用量" value={summary.reduce((s, i) => s + (i.total_quantity || 0), 0)} precision={0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="总金额(元)" value={summary.reduce((s, i) => s + (i.total_amount || 0), 0)} precision={2} />
          </Card>
        </Col>
      </Row>

      <Form layout="inline" className="filter-bar">
        <Form.Item label="年份">
          <Select value={filters.year} style={{ width: 120 }}
            onChange={v => setFilters({ ...filters, year: v })}
            options={years.map(y => ({ value: y, label: `${y}年` }))}
          />
        </Form.Item>
        <Form.Item label="月份">
          <Select value={filters.month} style={{ width: 100 }} allowClear
            onChange={v => setFilters({ ...filters, month: v })}
            options={months.map(m => ({ value: m, label: `${m}月` }))}
          />
        </Form.Item>
        <Form.Item label="部门">
          <Select mode="tags" style={{ width: 180 }} allowClear placeholder="选择/输入部门"
            value={filters.department ? [filters.department] : []}
            onChange={v => setFilters({ ...filters, department: v[0] })}
          />
        </Form.Item>
      </Form>

      <Table
        loading={loading}
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ ...pagination, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        onChange={(p) => setPagination({ ...pagination, current: p.current, pageSize: p.pageSize })}
      />

      <Modal title="登记月度用量" open={addModal} onCancel={() => setAddModal(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleAdd}
          initialValues={{ year: filters.year || dayjs().year(), month: filters.month || dayjs().month() + 1 }}
        >
          <Space style={{ width: '100%' }}>
            <Form.Item label="年份" name="year" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={years.map(y => ({ value: y, label: `${y}年` }))} />
            </Form.Item>
            <Form.Item label="月份" name="month" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={months.map(m => ({ value: m, label: `${m}月` }))} />
            </Form.Item>
          </Space>
          <Form.Item label="耗材规格" name="specification" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="children"
              options={specifications.map(s => ({ value: s.id, label: `${s.name} - ${s.specification}` }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item label="使用数量" name="quantity" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="实际金额(元)" name="actual_amount" style={{ flex: 1 }}>
              <InputNumber min={0} precision={2} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item label="使用部门" name="department">
            <Input placeholder="如：行政部" />
          </Form.Item>
          <Form.Item label="备注" name="remarks">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">保存</Button>
            <Button onClick={() => setAddModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="批量登记月度用量" open={batchModal} onCancel={() => setBatchModal(false)} footer={null} width={600}>
        <Form form={batchForm} layout="vertical" onFinish={handleBatchAdd}>
          <Form.List name="usages">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item {...restField} name={[name, 'specification']} rules={[{ required: true }]}>
                      <Select showSearch optionFilterProp="children" style={{ width: 220 }}
                        options={specifications.map(s => ({ value: s.id, label: `${s.name} - ${s.specification}` }))}
                      />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder="数量" min={0} />
                    </Form.Item>
                    <Form.Item {...restField} name={[name, 'actual_amount']}>
                      <InputNumber placeholder="金额" min={0} precision={2} />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>-</Button>
                  </Space>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  添加一行
                </Button>
              </>
            )}
          </Form.List>
          <Form.Item style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit">批量保存</Button>
            <Button onClick={() => setBatchModal(false)} style={{ marginLeft: 8 }}>取消</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default MonthlyUsage
