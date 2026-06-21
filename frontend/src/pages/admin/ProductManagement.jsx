
import { useState } from 'react'
import { Card, Table, Button, Space, Input, Select, Modal, Form, InputNumber, Image, Tag, message, Row, Col, Statistic } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, InboxOutlined, ExportOutlined } from '@ant-design/icons'
import { productList } from './mockData'

const { Option } = Select

const ProductManagement = () => {
  const [data, setData] = useState(productList)
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

  const categories = ['精华类', '耗材类', '面膜类', '防晒类', '护肤类', '洁面类', '功效类']

  const filteredData = data.filter(item => {
    const matchSearch = !searchText || item.name.includes(searchText) || item.sku.includes(searchText)
    const matchCategory = !categoryFilter || item.category === categoryFilter
    const matchStatus = !statusFilter || item.status === statusFilter
    return matchSearch && matchCategory && matchStatus
  })

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
      onOk: () => {
        setData(data.filter(item => item.id !== id))
        message.success('删除成功')
      },
    })
  }

  const handleModalOk = () => {
    form.validateFields().then(values => {
      if (editingItem) {
        setData(data.map(item => item.id === editingItem.id ? { ...item, ...values } : item))
        message.success('修改成功')
      } else {
        const newItem = {
          ...values,
          id: Math.max(...data.map(d => d.id)) + 1,
          status: values.stock < 20 ? 'warning' : 'normal',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20product%20bottle&image_size=square',
        }
        setData([...data, newItem])
        message.success('添加成功')
      }
      setModalVisible(false)
    })
  }

  const handleStockAdjust = (record, type) => {
    setStockItem(record)
    setStockType(type)
    stockForm.resetFields()
    setStockModalVisible(true)
  }

  const handleStockOk = () => {
    stockForm.validateFields().then(values => {
      const quantity = values.quantity
      const newStock = stockType === 'in' ? stockItem.stock + quantity : stockItem.stock - quantity
      if (newStock < 0) {
        message.error('库存不足')
        return
      }
      setData(data.map(item =>
        item.id === stockItem.id
          ? { ...item, stock: newStock, status: newStock < 20 ? 'warning' : 'normal' }
          : item
      ))
      message.success(stockType === 'in' ? '入库成功' : '出库成功')
      setStockModalVisible(false)
    })
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

  const totalStock = data.reduce((sum, item) => sum + item.stock, 0)
  const totalValue = data.reduce((sum, item) => sum + item.stock * item.price, 0)
  const warningCount = data.filter(item => item.status === 'warning').length

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>产品库存管理</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic title="产品总数" value={data.length} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="总库存" value={totalStock} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="库存预警" value={warningCount} valueStyle={{ color: '#faad14' }} />
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
          dataSource={filteredData}
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 条` }}
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
