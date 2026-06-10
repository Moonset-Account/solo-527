import React, { useState } from 'react'
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
  Col,
  Statistic
} from 'antd'
import {
  UserAddOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons'

const { Option } = Select

const mockUsers = [
  {
    key: '1',
    name: '张三',
    username: 'zhangsan',
    role: 'worker',
    phone: '13800138001',
    status: 'active',
    area: 'A区'
  },
  {
    key: '2',
    name: '李四',
    username: 'lisi',
    role: 'worker',
    phone: '13800138002',
    status: 'active',
    area: 'B区'
  },
  {
    key: '3',
    name: '王五',
    username: 'wangwu',
    role: 'admin',
    phone: '13800138003',
    status: 'active',
    area: '全部'
  },
  {
    key: '4',
    name: '赵六',
    username: 'zhaoliu',
    role: 'worker',
    phone: '13800138004',
    status: 'inactive',
    area: 'C区'
  }
]

const Admin = () => {
  const [users, setUsers] = useState(mockUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  const roleMap = {
    admin: { text: '管理员', color: 'purple' },
    worker: { text: '网格员', color: 'blue' }
  }

  const statusMap = {
    active: { text: '启用', color: 'green' },
    inactive: { text: '禁用', color: 'red' }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={roleMap[role].color}>{roleMap[role].text}</Tag>
      )
    },
    {
      title: '负责区域',
      dataIndex: 'area',
      key: 'area'
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={statusMap[status].color}>{statusMap[status].text}</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.key)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = (key) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该用户吗？',
      onOk: () => {
        setUsers(users.filter((user) => user.key !== key))
        message.success('删除成功')
      }
    })
  }

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      if (editingUser) {
        setUsers(
          users.map((user) =>
            user.key === editingUser.key ? { ...user, ...values } : user
          )
        )
        message.success('编辑成功')
      } else {
        const newUser = {
          key: Date.now().toString(),
          ...values,
          status: 'active'
        }
        setUsers([...users, newUser])
        message.success('添加成功')
      }
      setIsModalOpen(false)
      form.resetFields()
    })
  }

  const activeUsers = users.filter((u) => u.status === 'active').length
  const workerCount = users.filter((u) => u.role === 'worker').length

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>管理员后台</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总用户数"
              value={users.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<TeamOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃用户"
              value={activeUsers}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="网格员"
              value={workerCount}
              valueStyle={{ color: '#722ed1' }}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="管理员"
              value={users.length - workerCount}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<UserOutlined />}
              suffix="人"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="用户管理"
        extra={
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={handleAdd}
          >
            添加用户
          </Button>
        }
      >
        <Table columns={columns} dataSource={users} />
      </Card>

      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={500}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>

          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="初始密码"
              rules={[{ required: true, message: '请输入初始密码' }]}
            >
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="worker">网格员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="area"
            label="负责区域"
            rules={[{ required: true, message: '请输入负责区域' }]}
          >
            <Input placeholder="请输入负责区域" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="联系电话"
            rules={[
              { required: true, message: '请输入联系电话' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
            ]}
          >
            <Input placeholder="请输入联系电话" />
          </Form.Item>

          {editingUser && (
            <Form.Item
              name="status"
              label="状态"
              rules={[{ required: true, message: '请选择状态' }]}
            >
              <Select placeholder="请选择状态">
                <Option value="active">启用</Option>
                <Option value="inactive">禁用</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default Admin
