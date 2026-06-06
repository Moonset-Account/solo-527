import { Table, Button, Tag, Space, Card, Form, Input, Select, Modal, message, Row, Col } from 'antd'
import { SearchOutlined, ExportOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getShortages, createShortage, proposeReplace, completeShortage, exportShortages, getOrders, getAdminProducts } from '../../api/admin'
import FilterSaver from '../../components/FilterSaver'

function AdminShortages() {
  const [loading, setLoading] = useState(false)
  const [shortages, setShortages] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [addVisible, setAddVisible] = useState(false)
  const [replaceVisible, setReplaceVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [form] = Form.useForm()
  const [replaceForm] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadShortages()
    loadProducts()
  }, [page, pageSize, filters])

  const loadShortages = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, per_page: pageSize }
      const res = await getShortages(params)
      setShortages(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const loadProducts = async () => {
    try {
      const res = await getAdminProducts({ per_page: 100 })
      setProducts(res.data?.items || [])
    } catch (e) {}
  }

  const loadOrderItems = async (orderId) => {
    try {
      const res = await getOrders({})
      const order = res.data?.items?.find(o => o.id === orderId)
      setSelectedOrder(order)
    } catch (e) {}
  }

  const handleSearch = (values) => {
    const params = { ...values }
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key]
      }
    })
    setFilters(params)
    setPage(1)
  }

  const handleAdd = () => {
    form.resetFields()
    setSelectedOrder(null)
    setAddVisible(true)
  }

  const handleSaveShortage = async (values) => {
    try {
      await createShortage(values)
      message.success('已记录缺货')
      setAddVisible(false)
      loadShortages()
    } catch (e) {}
  }

  const handleProposeReplace = (record) => {
    setCurrentItem(record)
    replaceForm.setFieldsValue({
      replace_product_id: record.replace_product_id,
      replace_quantity: record.replace_quantity,
      remark: record.remark
    })
    setReplaceVisible(true)
  }

  const handleSaveReplace = async (values) => {
    try {
      await proposeReplace(currentItem.id, values)
      message.success('已提交替换方案')
      setReplaceVisible(false)
      loadShortages()
    } catch (e) {}
  }

  const handleComplete = async (record) => {
    try {
      await completeShortage(record.id)
      message.success('已完成')
      loadShortages()
    } catch (e) {}
  }

  const handleExport = () => {
    exportShortages(filters)
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      rejected: 'status-rejected',
      refunded: 'status-refunded',
      completed: 'status-completed'
    }
    return map[status] || ''
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '用户', dataIndex: 'user_name', key: 'user_name' },
    { title: '缺货商品', dataIndex: 'product_name', key: 'product_name' },
    { title: '缺货数量', key: 'shortage', render: r => `${r.shortage_quantity}` },
    {
      title: '替换方案',
      key: 'replace',
      render: r => r.replace_product_name
        ? `${r.replace_product_name} x${r.replace_quantity || ''}`
        : <Tag color="orange">待提供</Tag>
    },
    { title: '用户确认', key: 'confirm', render: r => 
      r.user_confirm === true ? <Tag color="green">已确认</Tag> :
      r.user_confirm === false ? <Tag color="red">已拒绝</Tag> :
      <Tag color="orange">待确认</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s, r) => <Tag className={statusClass(s)}>{r.status_text}</Tag>
    },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button size="small" icon={<EditOutlined />} onClick={() => handleProposeReplace(record)}>
              替换方案
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleComplete(record)} style={{ background: '#52c41a' }}>
              完成
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">缺货替换</h2>
        <Space>
          <FilterSaver pageName="admin_shortages" filters={filters} onApplyFilter={setFilters} />
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" onClick={handleAdd} style={{ background: '#52c41a' }}>
            记录缺货
          </Button>
        </Space>
      </div>

      <Card className="filter-section">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Row gutter={16}>
            <Col>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" style={{ width: 120 }} allowClear>
                  <Select.Option value="pending">待处理</Select.Option>
                  <Select.Option value="confirmed">已确认替换</Select.Option>
                  <Select.Option value="rejected">用户拒绝</Select.Option>
                  <Select.Option value="refunded">已退款</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="keyword" label="商品">
                <Input placeholder="搜索商品" style={{ width: 150 }} />
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
          dataSource={shortages}
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
        title="记录缺货"
        open={addVisible}
        onCancel={() => setAddVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveShortage}>
          <Form.Item name="order_id" label="选择订单" rules={[{ required: true }]}>
            <Select
              placeholder="选择订单"
              showSearch
              optionFilterProp="children"
              onChange={loadOrderItems}
            >
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.order_no} - {o.user_name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          {selectedOrder && (
            <Form.Item name="order_item_id" label="选择商品" rules={[{ required: true }]}>
              <Select placeholder="选择缺货商品">
                {selectedOrder.items?.map(item => (
                  <Select.Option key={item.id} value={item.id}>
                    {item.product_name} - 订购{item.quantity}{item.unit}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          )}
          <Form.Item name="shortage_quantity" label="缺货数量" rules={[{ required: true }]}>
            <Input type="number" step="0.1" min="0" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="提交替换方案"
        open={replaceVisible}
        onCancel={() => setReplaceVisible(false)}
        footer={null}
      >
        <Form form={replaceForm} layout="vertical" onFinish={handleSaveReplace}>
          <Form.Item name="replace_product_id" label="替换商品">
            <Select placeholder="选择替换商品" showSearch optionFilterProp="children">
              {products.map(p => (
                <Select.Option key={p.id} value={p.id}>{p.name} - ¥{p.price}/{p.unit}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="replace_quantity" label="替换数量">
            <Input type="number" step="0.1" min="0" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminShortages
