import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Typography, Modal, Form, Input, Select, message, Popconfirm, Tag } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined, SearchOutlined } from '@ant-design/icons'
import { user } from '@/api'
import { formatDate } from '@/utils'
import type { User, PageParams, CreateUserRequest, UpdateUserRequest, AssignRolesRequest, RoleCode } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography
const { Option } = Select
const { Password } = Input

const roleOptions: { value: RoleCode; label: string; color: string }[] = [
  { value: 'ADMIN', label: '管理员', color: 'magenta' },
  { value: 'FINANCE_MANAGER', label: '财务经理', color: 'blue' },
  { value: 'APPROVER', label: '审批人', color: 'cyan' },
  { value: 'APPLICANT', label: '申请人', color: 'green' }
]

const Users: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  const [department, setDepartment] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [modalVisible, setModalVisible] = useState(false)
  const [roleModalVisible, setRoleModalVisible] = useState(false)
  const [editingRecord, setEditingRecord] = useState<User | null>(null)
  const [roleUser, setRoleUser] = useState<User | null>(null)
  const [form] = Form.useForm<CreateUserRequest & { id?: number }>()
  const [roleForm] = Form.useForm<{ roles: RoleCode[] }>()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params: PageParams & { department?: string; role?: string } = {
        ...pagination,
        ...(department ? { department } : {}),
        ...(role ? { role } : {})
      }
      const result = await user.list(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      console.error('Fetch users failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination, department, role])

  const handleTableChange = (page: number, pageSize: number) => {
    setPagination({ page, pageSize })
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleReset = () => {
    setDepartment('')
    setRole('')
    setPagination({ page: 1, pageSize: 10 })
  }

  const handleAdd = () => {
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ roles: ['APPLICANT'] })
    setModalVisible(true)
  }

  const handleEdit = (record: User) => {
    setEditingRecord(record)
    form.setFieldsValue({
      id: record.id,
      username: record.username,
      realName: record.realName,
      email: record.email,
      phone: record.phone,
      department: record.department,
      roles: record.roles
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    console.log('Delete user:', id)
    try {
      message.success('删除成功')
      fetchData()
    } catch (error) {
      console.error('Delete user failed:', error)
    }
  }

  const handleAssignRoles = (record: User) => {
    setRoleUser(record)
    roleForm.setFieldsValue({ roles: record.roles })
    setRoleModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingRecord) {
        const updateData: UpdateUserRequest = {
          id: values.id!,
          realName: values.realName,
          email: values.email,
          phone: values.phone,
          department: values.department,
          roles: values.roles
        }
        if (values.password) {
          updateData.password = values.password
        }
        await user.update(updateData)
        message.success('更新成功')
      } else {
        const createData: CreateUserRequest = {
          username: values.username,
          password: values.password!,
          realName: values.realName,
          email: values.email,
          phone: values.phone,
          department: values.department,
          roles: values.roles
        }
        await user.create(createData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Submit user failed:', error)
    }
  }

  const handleRoleSubmit = async () => {
    if (!roleUser) return
    try {
      const values = await roleForm.validateFields()
      const request: AssignRolesRequest = {
        userId: roleUser.id,
        roles: values.roles
      }
      await user.assignRoles(request)
      message.success('角色分配成功')
      setRoleModalVisible(false)
      fetchData()
    } catch (error) {
      console.error('Assign roles failed:', error)
    }
  }

  const columns: ColumnsType<User> = [
    {
      title: '用户ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      render: (id: number) => <span style={{ fontFamily: 'monospace' }}>#{id}</span>
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 100
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 120
    },
    {
      title: '部门',
      dataIndex: 'department',
      key: 'department',
      width: 120
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: RoleCode[]) => (
        <Space wrap>
          {roles.map(role => {
            const option = roleOptions.find(o => o.value === role)
            return (
              <Tag key={role} color={option?.color || 'default'}>
                {option?.label || role}
              </Tag>
            )
          })}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date?: string) => date ? formatDate(date) : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={<KeyOutlined />}
            onClick={() => handleAssignRoles(record)}
          >
            角色
          </Button>
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Form layout="inline">
          <Form.Item label="部门">
            <Input
              placeholder="请输入部门"
              style={{ width: 150 }}
              value={department}
              onChange={e => setDepartment(e.target.value)}
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item label="角色">
            <Select
              placeholder="全部角色"
              style={{ width: 150 }}
              value={role || undefined}
              onChange={value => setRole(value || '')}
              allowClear
            >
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Title level={4} style={{ margin: 0 }}>用户管理</Title>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        </div>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handleTableChange
          }}
        />
      </Card>

      <Modal
        title={editingRecord ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' }
              ]}
            >
              <Input placeholder="请输入用户名" disabled={!!editingRecord} />
            </Form.Item>
            <Form.Item
              name="realName"
              label="姓名"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入邮箱" />
            </Form.Item>
            <Form.Item
              name="phone"
              label="电话"
              rules={[{ required: true, message: '请输入电话' }]}
            >
              <Input placeholder="请输入电话" />
            </Form.Item>
            <Form.Item
              name="department"
              label="部门"
              rules={[{ required: true, message: '请输入部门' }]}
            >
              <Input placeholder="请输入部门" />
            </Form.Item>
            {!editingRecord && (
              <Form.Item
                name="password"
                label="密码"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' }
                ]}
              >
                <Password placeholder="请输入密码" />
              </Form.Item>
            )}
            {editingRecord && (
              <Form.Item
                name="password"
                label="新密码"
                rules={editingRecord ? [] : [{ required: true, message: '请输入密码' }]}
              >
                <Password placeholder="不修改请留空" />
              </Form.Item>
            )}
          </div>
          <Form.Item
            name="roles"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色">
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="分配角色"
        open={roleModalVisible}
        onOk={handleRoleSubmit}
        onCancel={() => setRoleModalVisible(false)}
        destroyOnClose
      >
        <p>用户：{roleUser?.realName} ({roleUser?.username})</p>
        <Form form={roleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="roles"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select mode="multiple" placeholder="请选择角色">
              {roleOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
