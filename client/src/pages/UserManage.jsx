import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const { Option } = Select

const roleMap = {
  ADMIN: { text: '管理员', color: 'purple' },
  GRID_WORKER: { text: '网格员', color: 'blue' }
}

const UserManage = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ keyword: '', role: '', gridId: '' })
  const [grids, setGrids] = useState([])

  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState(false)
  const [searchForm] = Form.useForm()

  useEffect(() => {
    fetchGrids()
    fetchUsers()
  }, [pagination.current, pagination.pageSize])

  const fetchGrids = async () => {
    try {
      const res = await request.get('/grids/all')
      setGrids(res.data)
    } catch (error) {
      console.error('获取网格列表失败:', error)
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.role && { role: filters.role }),
        ...(filters.gridId && { gridId: filters.gridId })
      }
      const res = await request.get('/users', { params })
      setUsers(res.data.list)
      setPagination((prev) => ({ ...prev, total: res.data.total }))
    } catch (error) {
      console.error('获取用户列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setFilters(values)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchUsers(), 0)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({ keyword: '', role: '', gridId: '' })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchUsers(), 0)
  }

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue({
      ...record,
      gridId: record.gridId
    })
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户「${record.name}」吗？`,
      onOk: async () => {
        try {
          await request.delete(`/users/${record.id}`)
          message.success('删除成功')
          fetchUsers()
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
    })
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitLoading(true)

      const submitData = {
        ...values,
        gridId: values.gridId ? parseInt(values.gridId) : null
      }

      if (editingUser) {
        const updateData = { ...submitData }
        if (!updateData.password) {
          delete updateData.password
        }
        await request.put(`/users/${editingUser.id}`, updateData)
        message.success('更新成功')
      } else {
        await request.post('/users', submitData)
        message.success('创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      fetchUsers()
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      width: 100
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => {
        const info = roleMap[role] || { text: role, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '所属网格',
      dataIndex: ['grid', 'name'],
      key: 'grid',
      width: 120,
      render: (name) => name || '-'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      render: (phone) => phone || '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            删除
          </Button>
        </Space>
      )
    }
  ]

  const workerCount = users.filter((u) => u.role === 'GRID_WORKER').length
  const adminCount = users.filter((u) => u.role === 'ADMIN').length

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>用户管理</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TeamOutlined style={{ fontSize: 24, color: '#1890ff' }} />
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>总用户数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
                  {pagination.total}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>网格员</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#722ed1' }}>
                  {workerCount}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>管理员</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fa8c16' }}>
                  {adminCount}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <UserOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              <div>
                <div style={{ color: '#666', fontSize: 14 }}>网格数</div>
                <div style={{ fontSize: 24, fontWeight: 'bold', color: '#52c41a' }}>
                  {grids.length}
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card title="筛选条件" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="姓名/用户名" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="role" label="角色">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="ADMIN">管理员</Option>
              <Option value="GRID_WORKER">网格员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="gridId" label="网格">
            <Select placeholder="全部" style={{ width: 120 }} allowClear showSearch optionFilterProp="children">
              {grids.map((grid) => (
                <Option key={grid.id} value={grid.id}>
                  {grid.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            }
          }}
        />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="username"
                label="用户名"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" disabled={!!editingUser} />
              </Form.Item>
            </Col>
          </Row>

          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}

          {editingUser && (
            <Form.Item name="password" label="新密码">
              <Input.Password placeholder="不修改请留空" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="role"
                label="角色"
                rules={[{ required: true, message: '请选择角色' }]}
              >
                <Select placeholder="请选择角色">
                  <Option value="ADMIN">管理员</Option>
                  <Option value="GRID_WORKER">网格员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gridId"
                label="所属网格"
              >
                <Select placeholder="请选择网格" allowClear showSearch optionFilterProp="children">
                  {grids.map((grid) => (
                    <Option key={grid.id} value={grid.id}>
                      {grid.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="phone" label="联系电话">
            <Input placeholder="请输入联系电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManage
