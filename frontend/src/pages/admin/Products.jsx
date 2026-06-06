import { Table, Button, Tag, Space, Card, Form, Input, InputNumber, Switch, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getAdminProducts, createProduct, updateProduct, deleteProduct, getProductCategories } from '../../api/admin'

function AdminProducts() {
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [categories, setCategories] = useState([])

  useEffect(() => {
    loadData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getAdminProducts({ page, per_page: pageSize })
      setProducts(res.data?.items || [])
      setTotal(res.data?.total || 0)
      const catRes = await getProductCategories()
      setCategories(catRes.data || [])
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

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

  const handleSave = async (values) => {
    try {
      if (editingItem) {
        await updateProduct(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createProduct(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id)
      message.success('已下架')
      loadData()
    } catch (e) {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '商品名称', dataIndex: 'name', key: 'name' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    { title: '价格', dataIndex: 'price', key: 'price', render: v => `¥${v.toFixed(2)}` },
    { title: '库存', dataIndex: 'stock', key: 'stock' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: v => v ? <Tag color="green">上架</Tag> : <Tag color="red">下架</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定下架该商品？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>下架</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">商品管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#52c41a' }}>
          新增商品
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={products}
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
        title={editingItem ? '编辑商品' : '新增商品'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input placeholder="如：蔬菜、水果、肉类" />
          </Form.Item>
          <Form.Item name="unit" label="单位" rules={[{ required: true }]}>
            <Input placeholder="如：斤、个、盒" />
          </Form.Item>
          <Form.Item name="price" label="价格" rules={[{ required: true }]}>
            <InputNumber step="0.1" min="0" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="stock" label="库存">
            <InputNumber min="0" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="image" label="图片URL">
            <Input />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="is_active" label="上架" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminProducts
