import { Table, Button, Tag, Space, Card, Form, Input, Switch, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getAdminBuildings, createBuilding, updateBuilding, deleteBuilding } from '../../api/admin'

function AdminBuildings() {
  const [loading, setLoading] = useState(false)
  const [buildings, setBuildings] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getAdminBuildings({ page, per_page: pageSize })
      setBuildings(res.data?.items || [])
      setTotal(res.data?.total || 0)
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
        await updateBuilding(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createBuilding(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteBuilding(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '楼栋名称', dataIndex: 'name', key: 'name' },
    { title: '地址', dataIndex: 'address', key: 'address' },
    { title: '联系人', dataIndex: 'contact', key: 'contact' },
    { title: '联系电话', dataIndex: 'contact_phone', key: 'contact_phone' },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', render: v => v ? <Tag color="green">启用</Tag> : <Tag color="red">禁用</Tag> },
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确定删除该楼栋？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">楼栋管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#52c41a' }}>
          新增楼栋
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={buildings}
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
        title={editingItem ? '编辑楼栋' : '新增楼栋'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="楼栋名称" rules={[{ required: true }]}>
            <Input placeholder="如：1号楼" />
          </Form.Item>
          <Form.Item name="address" label="地址">
            <Input placeholder="如：小区东门" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input />
          </Form.Item>
          <Form.Item name="contact_phone" label="联系电话">
            <Input />
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
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

export default AdminBuildings
