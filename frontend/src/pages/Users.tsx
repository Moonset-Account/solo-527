import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, message, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { get, post, put, del } from '../api'
import type { User, PaginatedResponse } from '../types'
import type { User as AuthUser } from '../store/auth'

const { Option } = Select

const roleTexts: Record<string, string> = {
  admin: '系统管理员',
  manager: '运营经理',
  cleaner: '保洁员',
  maintenance: '维修工',
}

const roleColors: Record<string, string> = {
  admin: 'red',
  manager: 'blue',
  cleaner: 'green',
  maintenance: 'orange',
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<AuthUser[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [roleFilter, setRoleFilter] = useState<string | undefined>()
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null)
  const [form] = Form.useForm()

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await get<PaginatedResponse<AuthUser>>('/users', {
        params: { page, page_size: pageSize },
      })
      setUsers(data.data)
      setTotal(data.total)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, pageSize, roleFilter])

  const handleCreate = () => {
    setSelectedUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AuthUser) => {
    setSelectedUser(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleSubmit = async (values: any) => {
    try {
      if (selectedUser) {
        await put(`/users/${selectedUser.id}`, values)
        message.success('更新成功')
      } else {
        await post('/users', values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchUsers()
    } catch (e) {}
  }

  const handleDelete = async (record: AuthUser) => {
    try {
      await del(`/users/${record.id}`)
      message.success('已禁用')
      fetchUsers()
    } catch (e) {}
  }

  const columns = [
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '姓名', dataIndex: 'full_name', key: 'full_name', width: 120 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 100,
      render: (r: string) => <Tag color={roleColors[r]}>{roleTexts[r]}</Tag> },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 180 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '状态', dataIndex: 'is_active', key: 'is_active', width: 80,
      render: (v: boolean) => v ? <Tag color="green">正常</Tag> : <Tag color="red">禁用</Tag> },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: AuthUser) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.role !== 'admin' && (
            <Popconfirm title="确定禁用该用户吗？" onConfirm={() => handleDelete(record)}>
              <Button type="link" size="small" danger>禁用</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            placeholder="角色筛选"
            style={{ width: 150 }}
            allowClear
            value={roleFilter}
            onChange={setRoleFilter}
          >
            {Object.entries(roleTexts).map(([key, text]) => (
              <Option key={key} value={key}>{text}</Option>
            ))}
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加用户
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          scroll={{ x: 900 }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) },
          }}
        />
      </Card>

      <Modal
        title={selectedUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {!selectedUser && (
            <>
              <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item name="password" label="初始密码" rules={[{ required: true, min: 6 }]}>
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            </>
          )}
          <Form.Item name="full_name" label="姓名" rules={[{ required: true }]}>
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="role" label="角色" rules={[{ required: true }]}>
            <Select>
              {Object.entries(roleTexts).map(([k, v]) => (
                <Option key={k} value={k}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          {selectedUser && (
            <Form.Item name="is_active" label="状态" initialValue={true}>
              <Select>
                <Option value={true}>正常</Option>
                <Option value={false}>禁用</Option>
              </Select>
            </Form.Item>
          )}
          {selectedUser && (
            <Form.Item name="password" label="重置密码(留空则不修改)">
              <Input.Password placeholder="输入新密码" />
            </Form.Item>
          )}
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

export default Users
