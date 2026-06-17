import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Select,
  Modal,
  Form,
  Input,
  Tag,
  App,
  Popconfirm,
  Card,
  Switch,
  Avatar,
} from 'antd'
import {
  UserOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SafetyOutlined,
  LockOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { authApi } from '../services/api'

const { Option } = Select

const Users = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form] = Form.useForm()
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await authApi.getUsers()
      if (res.code === 200) setData(res.data)
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    form.setFieldsValue({
      role: 'WORKSHOP_DIRECTOR',
      status: 'ACTIVE',
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingId(record.id)
    form.setFieldsValue({
      username: record.username,
      name: record.name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      let res
      if (editingId) {
        res = await authApi.updateUser(editingId, values)
      } else {
        res = await authApi.createUser(values)
      }
      if (res.code === 200) {
        message.success(editingId ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchData()
      }
    } catch (e) {
      if (e.errorFields) return
      message.error(editingId ? '更新失败' : '创建失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await authApi.deleteUser(id)
      if (res.code === 200) {
        message.success('删除成功')
        fetchData()
      }
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleResetPassword = (record) => {
    modal.confirm({
      title: '重置密码',
      content: `确定要重置用户 "${record.name}" 的密码为默认密码 "123456" 吗？`,
      onOk: async () => {
        message.success('密码已重置为 123456')
      },
    })
  }

  const handleToggleStatus = async (record, checked) => {
    try {
      const res = await authApi.updateUser(record.id, {
        status: checked ? 'ACTIVE' : 'INACTIVE',
      })
      if (res.code === 200) {
        message.success(checked ? '用户已启用' : '用户已禁用')
        fetchData()
      }
    } catch (e) {
      message.error('操作失败')
      fetchData()
    }
  }

  const getRoleColor = (role) => {
    return role === 'ADMIN' ? 'red' : 'blue'
  }

  const getRoleText = (role) => {
    return role === 'ADMIN' ? '管理员' : '车间主任'
  }

  const getStatusColor = (status) => {
    return status === 'ACTIVE' ? 'success' : 'error'
  }

  const getStatusText = (status) => {
    return status === 'ACTIVE' ? '启用' : '禁用'
  }

  const columns = [
    {
      title: '用户',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <span>{record.name}</span>
        </Space>
      ),
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (r) => (
        <Tag color={getRoleColor(r)} icon={<SafetyOutlined />}>
          {getRoleText(r)}
        </Tag>
      ),
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      ellipsis: true,
    },
    {
      title: '电话',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (s, record) => (
        <Space>
          <Tag color={getStatusColor(s)}>{getStatusText(s)}</Tag>
          <Switch
            size="small"
            checked={s === 'ACTIVE'}
            onChange={(checked) => handleToggleStatus(record, checked)}
          />
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (d) => dayjs(d).format('YYYY-MM-DD HH:mm'),
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
            icon={<LockOutlined />}
            onClick={() => handleResetPassword(record)}
          >
            重置密码
          </Button>
          {record.username !== 'admin' && (
            <Popconfirm
              title="确定删除"
              description="删除后无法恢复，确定要删除此用户吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Space>
            <UserOutlined />
            用户管理
          </Space>
        </h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增用户
          </Button>
        </Space>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editingId ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            取消
          </Button>,
          <Button key="ok" type="primary" onClick={handleSubmit}>
            {editingId ? '保存' : '创建'}
          </Button>,
        ]}
        width={500}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6位' },
              ]}
            >
              <Input.Password placeholder="请输入密码（至少6位）" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select>
              <Option value="WORKSHOP_DIRECTOR">车间主任</Option>
              <Option value="ADMIN">管理员</Option>
            </Select>
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Users
