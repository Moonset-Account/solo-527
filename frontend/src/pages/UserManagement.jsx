import { Table, Button, Space, Modal, Form, Input, message } from 'antd'
import { useState } from 'react'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'

const UserManagement = () => {
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form] = Form.useForm()

  const mockData = [
    {
      key: '1',
      name: '张三',
      age: 32,
      email: 'zhangsan@example.com',
      role: '管理员',
    },
    {
      key: '2',
      name: '李四',
      age: 28,
      email: 'lisi@example.com',
      role: '普通用户',
    },
    {
      key: '3',
      name: '王五',
      age: 35,
      email: 'wangwu@example.com',
      role: '编辑',
    },
  ]

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
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
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ]

  const handleAdd = () => {
    setEditingUser(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingUser(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除用户 ${record.name} 吗？`,
      onOk: () => {
        message.success('删除成功')
      },
    })
  }

  const handleSubmit = () => {
    form.validateFields().then(() => {
      message.success(editingUser ? '编辑成功' : '添加成功')
      setModalVisible(false)
    })
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          添加用户
        </Button>
      </div>
      <Table columns={columns} dataSource={mockData} />
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
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
            name="age"
            label="年龄"
            rules={[{ required: true, message: '请输入年龄' }]}
          >
            <Input placeholder="请输入年龄" />
          </Form.Item>
          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' },
            ]}
          >
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请输入角色' }]}
          >
            <Input placeholder="请输入角色" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
