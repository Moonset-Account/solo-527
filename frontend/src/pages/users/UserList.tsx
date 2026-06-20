import React, { useEffect, useState } from 'react'
import { Table, Tag, Button, Form, Select, Input, Space, Modal, message, Popconfirm } from 'antd'
import { PlusOutlined, UserOutlined } from '@ant-design/icons'
import { authApi, User } from '../../api/auth'
import { PaginatedResponse } from '../../api'

const UserList: React.FC = () => {
  const [form] = Form.useForm()
  const [userForm] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<PaginatedResponse<User>>({ count: 0, next: null, previous: null, results: [] })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (role?: string, isActive?: string, keyword?: string, p: number = 1, ps: number = 20) => {
    setLoading(true)
    try {
      const params: any = { page: p, page_size: ps, ordering: '-date_joined' }
      if (role) params.role = role
      if (isActive !== undefined && isActive !== '') params.is_active = isActive
      if (keyword) params.search = keyword
      const res = await authApi.users(params)
      setData(res)
      setPage(p)
      setPageSize(ps)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const onSearch = (values: any) => {
    loadData(values.role, values.is_active, values.keyword, 1, pageSize)
  }

  const handleOpenModal = (user?: User) => {
    setEditingUser(user || null)
    userForm.setFieldsValue({
      username: user?.username || '',
      email: user?.email || '',
      real_name: user?.real_name || '',
      phone: user?.phone || '',
      role: user?.role || 'normal',
      is_active: user?.is_active ?? true,
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      const values = await userForm.validateFields()
      if (editingUser) {
        await authApi.updateUser(editingUser.id, values)
        message.success('更新成功')
      } else {
        await authApi.createUser({ ...values, password: '123456' })
        message.success('创建成功，默认密码 123456')
      }
      setModalVisible(false)
      loadData()
    } catch (e) {}
  }

  const getRoleColor = (role: string) => {
    const map: Record<string, string> = { admin: 'red', security_owner: 'orange', normal: 'blue' }
    return map[role] || 'default'
  }

  const columns = [
    {
      title: '用户', width: 180,
      render: (_: any, r: User) => (
        <Space>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: '#1890ff', color: '#fff', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <UserOutlined />
          </div>
          <div>
            <div>{r.real_name || r.username}</div>
            <div style={{ color: '#999', fontSize: 12 }}>@{r.username}</div>
          </div>
        </Space>
      )
    },
    { title: '邮箱', dataIndex: 'email', width: 180 },
    { title: '手机号', dataIndex: 'phone', width: 130 },
    {
      title: '角色', dataIndex: 'role', width: 100,
      render: (v: string, r: User) => <Tag color={getRoleColor(v)}>{r.role_display}</Tag>
    },
    {
      title: '状态', dataIndex: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '正常' : '禁用'}</Tag>
    },
    { title: '加入时间', dataIndex: 'date_joined', width: 160 },
    { title: '最后登录', dataIndex: 'last_login', width: 160 },
    {
      title: '操作',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, r: User) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleOpenModal(r)}>编辑</Button>
          <Popconfirm title="确认重置密码为 123456?" onConfirm={async () => {
            try { await authApi.resetPassword(r.id); message.success('密码已重置为 123456') } catch (e) {}
          }}>
            <Button type="link" size="small">重置密码</Button>
          </Popconfirm>
          <Popconfirm title="确认禁用?" onConfirm={async () => {
            try { await authApi.updateUser(r.id, { is_active: false }); message.success('已禁用'); loadData() } catch (e) {}
          }}>
            <Button type="link" size="small" danger>禁用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>新增用户</Button>
      </div>

      <div className="filter-bar">
        <Form form={form} layout="inline" onFinish={onSearch}>
          <Form.Item name="keyword">
            <Input placeholder="搜索用户名/姓名/邮箱" style={{ width: 220 }} allowClear />
          </Form.Item>
          <Form.Item name="role">
            <Select placeholder="角色" style={{ width: 120 }} allowClear>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="security_owner">安全负责人</Select.Option>
              <Select.Option value="normal">普通用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active">
            <Select placeholder="状态" style={{ width: 120 }} allowClear>
              <Select.Option value="true">正常</Select.Option>
              <Select.Option value="false">禁用</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">查询</Button>
              <Button onClick={() => { form.resetFields(); loadData() }}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-container">
        <Table
          loading={loading}
          columns={columns}
          dataSource={data.results}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total: data.count,
            showSizeChanger: true,
            onChange: (p, ps) => {
              const values = form.getFieldsValue()
              loadData(values.role, values.is_active, values.keyword, p, ps)
            },
            showTotal: (t) => `共 ${t} 条`,
          }}
        />
      </div>

      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSave}
        okText="保存"
      >
        <Form form={userForm} layout="vertical">
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input disabled={!!editingUser} />
          </Form.Item>
          <Form.Item name="real_name" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="手机号">
            <Input />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="admin">管理员</Select.Option>
              <Select.Option value="security_owner">安全负责人</Select.Option>
              <Select.Option value="normal">普通用户</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="is_active" label="启用" valuePropName="checked">
            <Select>
              <Select.Option value={true}>启用</Select.Option>
              <Select.Option value={false}>禁用</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserList
