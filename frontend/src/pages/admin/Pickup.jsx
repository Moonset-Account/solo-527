import { Table, Button, Card, Form, Input, Select, Modal, message, Space, Tag, Descriptions } from 'antd'
import { SearchOutlined, QrcodeOutlined, CheckOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getPendingPickup, verifyPickup, confirmPickup, getBuildings } from '../../api/admin'

function AdminPickup() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [buildings, setBuildings] = useState([])
  const [verifyVisible, setVerifyVisible] = useState(false)
  const [verifyResult, setVerifyResult] = useState(null)
  const [pickupCode, setPickupCode] = useState('')
  const [form] = Form.useForm()
  const [filterForm] = Form.useForm()

  useEffect(() => {
    loadBuildings()
  }, [])

  useEffect(() => {
    loadOrders()
  }, [page, pageSize, filters])

  const loadBuildings = async () => {
    try {
      const res = await getBuildings()
      setBuildings(res.data?.items || [])
    } catch (e) {}
  }

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page, per_page: pageSize }
      const res = await getPendingPickup(params)
      setOrders(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
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

  const handleVerify = async (values) => {
    try {
      const res = await verifyPickup(values)
      setVerifyResult(res.data)
      setVerifyVisible(true)
    } catch (e) {}
  }

  const handleConfirmPickup = async () => {
    try {
      const res = await confirmPickup({ order_id: verifyResult.id })
      setPickupCode(res.data.pickup_code)
      message.success('取货成功')
      setVerifyVisible(false)
      setVerifyResult(null)
      form.resetFields()
      loadOrders()
    } catch (e) {}
  }

  const handleQuickPickup = async (order) => {
    try {
      const res = await confirmPickup({ order_id: order.id })
      message.success(`取货成功，取货码：${res.data.pickup_code}`)
      loadOrders()
    } catch (e) {}
  }

  const columns = [
    { title: '订单号', dataIndex: 'order_no', key: 'order_no', width: 160 },
    { title: '用户', key: 'user', render: r => `${r.user_name || ''} ${r.user_phone || ''}` },
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '房号', dataIndex: 'room_number', key: 'room_number' },
    {
      title: '商品',
      key: 'items',
      render: r => (
        <div style={{ maxWidth: 200 }}>
          {r.items?.slice(0, 2).map((item, idx) => (
            <div key={idx} style={{ fontSize: 12 }}>{item.product_name} x{item.quantity}{item.unit}</div>
          ))}
          {r.items?.length > 2 && <div style={{ fontSize: 12, color: '#999' }}>...等{r.items.length}件</div>}
        </div>
      )
    },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleQuickPickup(record)} style={{ background: '#52c41a' }}>
          确认取货
        </Button>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">取货核销</h2>
        <Button type="primary" icon={<QrcodeOutlined />} onClick={() => form.resetFields(), setVerifyResult(null), setVerifyVisible(true)} style={{ background: '#52c41a' }}>
          扫码/输入取货
        </Button>
      </div>

      <Card className="filter-section">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Space>
            <Form.Item name="building_id" label="楼栋">
              <Select placeholder="全部" style={{ width: 120 }} allowClear>
                {buildings.map(b => (
                  <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="keyword" label="搜索">
              <Input placeholder="订单号/姓名/手机号" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} style={{ background: '#52c41a' }}>查询</Button>
                <Button onClick={() => { filterForm.resetFields(); setFilters({}) }}>重置</Button>
              </Space>
            </Form.Item>
          </Space>
        </Form>
      </Card>

      <Card className="table-section">
        <Table
          rowKey="id"
          columns={columns}
          dataSource={orders}
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: t => `共 ${t} 条待取货`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </Card>

      <Modal
        title="取货核验"
        open={verifyVisible}
        onCancel={() => { setVerifyVisible(false); setVerifyResult(null) }}
        footer={null}
        width={600}
      >
        {!verifyResult ? (
          <Form form={form} layout="vertical" onFinish={handleVerify}>
            <Form.Item name="order_no" label="订单号">
              <Input placeholder="请输入订单号" />
            </Form.Item>
            <div style={{ textAlign: 'center', margin: '16px 0', color: '#999' }}>或</div>
            <Form.Item name="pickup_code" label="取货码">
              <Input placeholder="请输入取货码" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>核验</Button>
            </Form.Item>
          </Form>
        ) : (
          <div>
            <Descriptions column={1} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="订单号">{verifyResult.order_no}</Descriptions.Item>
              <Descriptions.Item label="用户">{verifyResult.user_name} {verifyResult.user_phone}</Descriptions.Item>
              <Descriptions.Item label="楼栋">{verifyResult.building_name} {verifyResult.room_number}</Descriptions.Item>
              <Descriptions.Item label="订单金额">
                <span style={{ color: '#f5222d', fontSize: 16, fontWeight: 600 }}>¥{verifyResult.total_amount.toFixed(2)}</span>
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>商品清单：</div>
              {verifyResult.items?.map((item, idx) => (
                <div key={idx} style={{ padding: '4px 0' }}>
                  {item.product_name} x {item.quantity}{item.unit} - ¥{item.subtotal.toFixed(2)}
                </div>
              ))}
            </div>
            <Space>
              <Button type="primary" onClick={handleConfirmPickup} style={{ background: '#52c41a' }}>
                确认取货
              </Button>
              <Button onClick={() => { setVerifyResult(null); form.resetFields() }}>重新核验</Button>
            </Space>
          </div>
        )}
      </Modal>

      {pickupCode && (
        <Modal
          title="取货成功"
          open={!!pickupCode}
          onOk={() => setPickupCode('')}
          onCancel={() => setPickupCode('')}
        >
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }}>✓</div>
            <div style={{ fontSize: 18, marginBottom: 16 }}>取货码</div>
            <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: 8, color: '#52c41a' }}>{pickupCode}</div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminPickup
