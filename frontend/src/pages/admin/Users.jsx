import { Table, Button, Tag, Space, Card, Form, Input, Select, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getUsers, createUser, updateUser, deleteUser, getAdminBuildings } from '../../api/admin'

function AdminUsers() {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [buildings, setBuildings] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadBuildings()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getUsers({ page, per_page: pageSize })
      setUsers(res.data?.items || [])
      setTotal(res.data?.total || 0)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const loadBuildings = async () => {
    try {
      const res = await getAdminBuildings({ per_page: 100 })
      setBuildings(res.data?.items || [])
    } catch (e) {}
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
        await updateUser(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      loadData()
    } catch (e) {}
  }

  const roleColor = (role) => {
    const map = { admin: 'red', staff: 'blue', user: 'green' }
    return map[role] || 'default'
  }

  const roleText = (role) => {
    const map = { admin: '管理员', staff: '工作人员', user: '居民' }
    return map[role] || role
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '手机号', dataIndex: 'phone', key: 'phone' },
    { title: '角色', dataIndex: 'role', key: 'role', render: r => <Tag color={roleColor(r)}>{roleText(r)}</Tag> },
    { title: '楼栋', dataIndex: 'building_name', key: 'building_name' },
    { title: '房号', dataIndex: 'room_number', key: 'room_number' },
    { title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 160 },
    {
      title: '操作',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.role !== 'admin' && (
            <Popconfirm title="确定删除该用户？" onConfirm={() => handleDelete(record.id)}>
              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2 className="page-title">用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ background: '#52c41a' }}>
          新增用户
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
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
        title={editingItem ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          {!editingItem && (
            <Form.Item name="password" label="初始密码" rules={[{ required: true }]}>
              <Input.Password placeholder="默认123456" />
            </Form.Item>
          )}
          {editingItem && (
            <Form.Item name="password" label="重置密码">
              <Input.Password placeholder="不填则不修改" />
            </Form.Item>
          )}
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="user">居民</Select.Option>
              <Select.Option value="staff">工作人员</Select.Option>
              <Select.Option value="admin">管理员</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="building_id" label="楼栋">
            <Select allowClear>
              {buildings.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="room_number" label="房号">
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ background: '#52c41a' }}>保存</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AdminUsers
