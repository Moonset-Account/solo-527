import { Card, Table, Space, Button, Modal, Form, Input, Select, message, InputNumber } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { get, post } from '../api'
import { useAuthStore } from '../store/auth'
import type { Material, PaginatedResponse } from '../types'

const { Option } = Select
const { TextArea } = Input

const Materials: React.FC = () => {
  const { user } = useAuthStore()
  const [materials, setMaterials] = useState<Material[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
  const [form] = Form.useForm()

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const fetchMaterials = async () => {
    setLoading(true)
    try {
      const data = await get<PaginatedResponse<Material>>('/materials', {
        params: { page, page_size: pageSize },
      })
      setMaterials(data.data)
      setTotal(data.total)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [page, pageSize])

  const handleCreate = () => {
    setSelectedMaterial(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      await post('/materials', values)
      message.success('创建成功')
      setModalVisible(false)
      fetchMaterials()
    } catch (e) {}
  }

  const columns = [
    { title: '物料名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 100 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 60 },
    { title: '单价', dataIndex: 'unit_price', key: 'unit_price', width: 80, render: (v: number) => `¥${v}` },
    { title: '库存', dataIndex: 'stock_quantity', key: 'stock_quantity', width: 80,
      render: (v: number) => v <= 10 ? <span style={{ color: 'red' }}>{v}(低)</span> : v },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
  ]

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加物料
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={materials}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      <Modal
        title="添加物料"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="物料名称" rules={[{ required: true }]}>
            <Input placeholder="请输入物料名称" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="sku" label="SKU编码" style={{ flex: 1 }}>
              <Input placeholder="SKU编码" />
            </Form.Item>
            <Form.Item name="category" label="分类" style={{ flex: 1 }}>
              <Select placeholder="选择分类">
                <Option value="清洁用品">清洁用品</Option>
                <Option value="维修配件">维修配件</Option>
                <Option value="其他">其他</Option>
              </Select>
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="unit" label="单位" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="如：瓶、个、条" />
            </Form.Item>
            <Form.Item name="unit_price" label="单价" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} />
            </Form.Item>
            <Form.Item name="stock_quantity" label="初始库存" initialValue={0} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="物料描述" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Materials
