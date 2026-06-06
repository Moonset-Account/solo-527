import { Card, Table, Space, Button, Modal, Form, Input, Select, message, InputNumber, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { get, post, put, del } from '../api'
import { useAuthStore } from '../store/auth'
import type { Property, PaginatedResponse } from '../types'

const { Option } = Select
const { TextArea } = Input

const statusTexts: Record<string, string> = {
  active: '正常',
  inactive: '停用',
  maintenance: '维修中',
}

const Properties: React.FC = () => {
  const { user } = useAuthStore()
  const [properties, setProperties] = useState<Property[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [form] = Form.useForm()

  const canManage = user?.role === 'admin' || user?.role === 'manager'

  const fetchProperties = async () => {
    setLoading(true)
    try {
      const data = await get<PaginatedResponse<Property>>('/properties', {
        params: { page, page_size: pageSize },
      })
      setProperties(data.data)
      setTotal(data.total)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProperties()
  }, [page, pageSize])

  const handleCreate = () => {
    setSelectedProperty(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Property) => {
    setSelectedProperty(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (selectedProperty) {
        await put(`/properties/${selectedProperty.id}`, values)
        message.success('更新成功')
      } else {
        await post('/properties', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchProperties()
    } catch (e) {}
  }

  const handleDelete = async (record: Property) => {
    try {
      await del(`/properties/${record.id}`)
      message.success('已停用')
      fetchProperties()
    } catch (e) {}
  }

  const columns = [
    { title: '房源名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '小区', dataIndex: 'community', key: 'community', width: 120 },
    { title: '楼号', dataIndex: 'building', key: 'building', width: 80 },
    { title: '房号', dataIndex: 'room_number', key: 'room_number', width: 80 },
    { title: '面积', dataIndex: 'area', key: 'area', width: 80, render: (v: number) => v ? `${v}㎡` : '-' },
    { title: '卧室', dataIndex: 'bedroom_count', key: 'bedroom_count', width: 60 },
    { title: '卫生间', dataIndex: 'bathroom_count', key: 'bathroom_count', width: 70 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => statusTexts[s] || s },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: Property) => (
        <Space size="small">
          {canManage && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
              <Popconfirm title="确定停用吗？" onConfirm={() => handleDelete(record)}>
                <Button type="link" size="small" danger>停用</Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          {canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              添加房源
            </Button>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={properties}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      <Modal
        title={selectedProperty ? '编辑房源' : '添加房源'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="房源名称" rules={[{ required: true }]}>
            <Input placeholder="如：阳光花园-101" />
          </Form.Item>
          <Form.Item name="community" label="所属小区" rules={[{ required: true }]}>
            <Input placeholder="请输入小区名称" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="building" label="楼号" style={{ flex: 1 }}>
              <Input placeholder="如：1号楼" />
            </Form.Item>
            <Form.Item name="room_number" label="房号" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="如：101" />
            </Form.Item>
          </Space>
          <Form.Item name="address" label="详细地址">
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="area" label="面积(㎡)" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="bedroom_count" label="卧室数" initialValue={1} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
            <Form.Item name="bathroom_count" label="卫生间数" initialValue={1} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={1} />
            </Form.Item>
          </Space>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select>
              {Object.entries(statusTexts).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <TextArea rows={2} placeholder="备注信息" />
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

export default Properties
