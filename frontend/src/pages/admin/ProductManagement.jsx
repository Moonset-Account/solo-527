import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Input, Select, Modal, Form, InputNumber, Image, Tag, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, InboxOutlined, ExportOutlined } from '@ant-design/icons'
import { getProducts, createProduct, updateProduct, deleteProduct, getStockSummary, adjustStock } from '../../api/products'

const { Option } = Select

const ProductManagement = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [stockSummary, setStockSummary] = useState({})
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [stockModalVisible, setStockModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [stockItem, setStockItem] = useState(null)
  const [stockType, setStockType] = useState('in')
  const [form] = Form.useForm()
  const [stockForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadStockSummary()
  }, [])

  const loadData = async () => {
    const params = {}
    if (searchText) params.keyword = searchText
    if (categoryFilter) params.category = categoryFilter
    if (statusFilter) params.status = statusFilter
    const res = await getProducts(params)
    if (res.success) {
      setData(res.data.list)
      setTotal(res.data.total)
    }
  }

  const loadStockSummary = async () => {
    const res = await getStockSummary()
    if (res.success) {
      setStockSummary(res.data)
    }
  }

  const categories = ['精华类', '耗材类', '面膜类', '防晒类', '护肤类', '洁面类', '功效类']

  useEffect(() => {
    loadData()
  }, [searchText, categoryFilter, statusFilter])

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该产品吗？',
      onOk: async () => {
        const res = await deleteProduct(id)
        if (res.success) {
          message.success('删除成功')
          loadData()
          loadStockSummary()
        } else {
          message.error('删除失败')
        }
      },
    })
  }

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields()
      if (editingItem) {
        const res = await updateProduct(editingItem.id, values)
        if (res.success) {
          message.success('修改成功')
          setModalVisible(false)
          loadData()
          loadStockSummary()
        }
      } else {
        const res = await createProduct(values)
        if (res.success) {
          message.success('添加成功')
          setModalVisible(false)
          loadData()
          loadStockSummary()
        }
      }
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleStockAdjust = (record, type) => {
    setStockItem(record)
    setStockType(type)
    stockForm.resetFields()
    setStockModalVisible(true)
  }

  const handleStockOk = async () => {
    try {
      const values = await stockForm.validateFields()
      const res = await adjustStock(stockItem.id, {
        type: stockType,
        quantity: values.quantity,
        reason: values.remark || '',
      })
      if (res.success) {
        message.success(stockType === 'in' ? '入库成功' : '出库成功')
        setStockModalVisible(false)
        loadData()
        loadStockSummary()
      } else {
        message.error(res.message || '操作失败')
      }
    } catch (err) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '图片',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (text) => <Image width={50} height={50} src={text} style={{ objectFit: 'cover', borderRadius: 4 }} />,
    },
    { title: '产品名称', dataIndex: 'name', key: 'name' },
    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    {
      title: '库存',
      dataIndex: 'stock',
      key: 'stock',
      sorter: (a, b) => a.stock - b.stock,
      render: (text, record) => (
        <span style={{ color: record.status === 'warning' ? '#ff4d4f' : 'inherit' }}>
          {text}
        </span>
      ),
    },
    { title: '价格', dataIndex: 'price', key: 'price', render: (text) => `¥${text}` },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => (
        text === 'warning' ? <Tag color="orange">库存预警</Tag> : <Tag color="green">正常</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => handleStockAdjust(record, 'in')}>入库</Button>
          <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => handleStockAdjust(record, 'out')}>出库</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>删除</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>产品库存管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="产品总数" value={stockSummary.totalProducts || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总库存" value={stockSummary.totalStock || 0} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="库存预警" value={stockSummary.warningCount || 0} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
      </Row>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Input
              placeholder="搜索产品名称/SKU"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
            />
            <Select
              placeholder="产品分类"
              value={categoryFilter || undefined}
              onChange={setCategoryFilter}
              allowClear
              style={{ width: 150 }}
            >
              {categories.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
            </Select>
            <Select
              placeholder="库存状态"
              value={statusFilter || undefined}
              onChange={setStatusFilter}
              allowClear
              style={{ width: 120 }}
            >
              <Option value="normal">正常</Option>
              <Option value="warning">预警</Option>
            </Select>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增产品
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: () => `共 ${total} 条`, total }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑产品' : '新增产品'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="产品名称" rules={[{ required: true, message: '请输入产品名称' }]}>
            <Input />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sku" label="SKU" rules={[{ required: true, message: '请输入SKU' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select>
                  {categories.map(cat => <Option key={cat} value={cat}>{cat}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="stock" label="库存数量" rules={[{ required: true, message: '请输入库存数量' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="price" label="价格(元)" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={stockType === 'in' ? '入库操作' : '出库操作'}
        open={stockModalVisible}
        onOk={handleStockOk}
        onCancel={() => setStockModalVisible(false)}
      >
        <Form form={stockForm} layout="vertical">
          <p>产品：{stockItem?.name}</p>
          <p>当前库存：{stockItem?.stock}</p>
          <Form.Item name="quantity" label={stockType === 'in' ? '入库数量' : '出库数量'} rules={[{ required: true, message: '请输入数量' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProductManagement
