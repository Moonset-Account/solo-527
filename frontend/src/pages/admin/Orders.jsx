import { Table, Button, Tag, Space, Card, Form, Input, Select, DatePicker, Modal, message, Row, Col } from 'antd'
import { SearchOutlined, ExportOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getOrders, updateOrder, cutoffOrders, exportOrders, getBuildings } from '../../api/admin'
import FilterSaver from '../../components/FilterSaver'
import dayjs from 'dayjs'

function AdminOrders() {
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [buildings, setBuildings] = useState([])
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)
  const [editVisible, setEditVisible] = useState(false)
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
      const res = await getOrders(params)
      setOrders(res.data?.items || [])
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

  const handleReset = () => {
    filterForm.resetFields()
    setFilters({})
    setPage(1)
  }

  const handleCutoffSelected = async () => {
    try {
      await cutoffOrders({})
      message.success('已截单')
      loadOrders()
    } catch (e) {}
  }

  const handleEdit = (record) => {
    setCurrentOrder(record)
    form.setFieldsValue({ status: record.status, remark: record.remark })
    setEditVisible(true)
  }

  const handleSaveEdit = async (values) => {
    try {
      await updateOrder(currentOrder.id, values)
      message.success('更新成功')
      setEditVisible(false)
      loadOrders()
    } catch (e) {}
  }

  const handleExport = () => {
    exportOrders(filters)
  }

  const statusClass = (status) => {
    const map = {
      pending: 'status-pending',
      confirmed: 'status-confirmed',
      sorting: 'status-sorting',
      sorted: 'status-sorted',
      picked: 'status-picked',
      cancelled: 'status-cancelled',
      refunded: 'status-refunded'
    }
    return map[status] || ''
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
    { title: '金额', dataIndex: 'total_amount', key: 'total_amount', render: v => `¥${v.toFixed(2)}` },
    { title: '截单', dataIndex: 'is_cutoff', key: 'is_cutoff', render: v => v ? <Tag color="green">已截单</Tag> : <Tag color="orange">未截单</Tag> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s, r) => <Tag className={statusClass(s)}>{r.status_text}</Tag>
    },
    { title: '下单时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setCurrentOrder(record); setDetailVisible(true) }}>详情</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">订单管理</h2>
        <Space>
          <FilterSaver pageName="admin_orders" filters={filters} onApplyFilter={setFilters} />
          <Button icon={<ExportOutlined />} onClick={handleExport}>导出</Button>
          <Button type="primary" onClick={handleCutoffSelected} style={{ background: '#fa8c16' }}>
            批量截单
          </Button>
        </Space>
      </div>

      <Card className="filter-section">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Row gutter={16} style={{ width: '100%' }}>
            <Col>
              <Form.Item name="keyword" label="关键字">
                <Input placeholder="订单号/姓名/手机号" style={{ width: 200 }} />
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" style={{ width: 120 }} allowClear>
                  <Select.Option value="pending">待确认</Select.Option>
                  <Select.Option value="confirmed">已确认</Select.Option>
                  <Select.Option value="sorting">分拣中</Select.Option>
                  <Select.Option value="sorted">待取货</Select.Option>
                  <Select.Option value="picked">已取货</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                  <Select.Option value="refunded">已退款</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col>
              <Form.Item name="building_id" label="楼栋">
                <Select placeholder="全部" style={{ width: 120 }} allowClear>
                  {buildings.map(b => (
                    <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
                  ))}
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
                  <Button onClick={handleReset}>重置</Button>
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
          dataSource={orders}
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
        title="订单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={700}
      >
        {currentOrder && (
          <div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <div><strong>订单号：</strong>{currentOrder.order_no}</div>
              <div><strong>用户：</strong>{currentOrder.user_name} {currentOrder.user_phone}</div>
              <div><strong>楼栋：</strong>{currentOrder.building_name} {currentOrder.room_number}</div>
              <div><strong>金额：</strong><span style={{ color: '#f5222d', fontSize: 16, fontWeight: 600 }}>¥{currentOrder.total_amount.toFixed(2)}</span></div>
              <div><strong>状态：</strong><Tag className={statusClass(currentOrder.status)}>{currentOrder.status_text}</Tag></div>
              {currentOrder.remark && <div><strong>备注：</strong>{currentOrder.remark}</div>}
            </div>
            <Table
              rowKey="id"
              columns={[
                { title: '商品', dataIndex: 'product_name' },
                { title: '单价', dataIndex: 'price', render: v => `¥${v.toFixed(2)}` },
                { title: '数量', key: 'qty', render: r => `${r.quantity}${r.unit}` },
                { title: '小计', dataIndex: 'subtotal', render: v => `¥${v.toFixed(2)}` }
              ]}
              dataSource={currentOrder.items}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      <Modal
        title="编辑订单"
        open={editVisible}
        onCancel={() => setEditVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item name="status" label="订单状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="pending">待确认</Select.Option>
              <Select.Option value="confirmed">已确认</Select.Option>
              <Select.Option value="sorting">分拣中</Select.Option>
              <Select.Option value="sorted">待取货</Select.Option>
              <Select.Option value="picked">已取货</Select.Option>
              <Select.Option value="cancelled">已取消</Select.Option>
              <Select.Option value="refunded">已退款</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminOrders
