import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  message,
  Space,
  Popconfirm,
  Select,
  Switch,
  Tag,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import {
  getUserList,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from '../../api/user'

const { Option } = Select

const roleMap = {
  ADMIN: { text: '管理员', color: 'red' },
  SALES: { text: '销售', color: 'blue' },
  DESIGNER: { text: '设计师', color: 'green' },
  MANAGER: { text: '经理', color: 'purple' },
}

const UserManage = () => {
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        pageNum: page,
        pageSize,
        keyword: keyword || undefined,
      }
      const res = await getUserList(params)
      setData(res.records || [])
      setPagination({
        current: res.current,
        pageSize: res.size,
        total: res.total,
      })
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
    form.setFieldsValue({
      ...record,
      password: '',
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
      message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const handleSubmit = async (values) => {
    try {
      if (editingItem) {
        await updateUser(editingItem.id, values)
        message.success('更新成功')
      } else {
        await createUser(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const handleToggleStatus = async (record, status) => {
    try {
      await updateUserStatus(record.id, status)
      message.success('状态更新成功')
      loadData(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      width: 120,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      width: 120,
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (role) => {
        const info = roleMap[role] || { text: role, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '部门',
      dataIndex: 'department',
      width: 120,
      render: (dept) => dept || '-',
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 130,
      render: (phone) => phone || '-',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      ellipsis: true,
      render: (email) => email || '-',
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status, record) => (
        <Switch
          checked={status}
          onChange={(checked) => handleToggleStatus(record, checked)}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>用户管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增用户
        </Button>
      </div>

      <div className="filter-bar">
        <Space>
          <Input
            placeholder="搜索用户名/姓名/电话"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            onPressEnter={() => loadData(1, pagination.pageSize)}
          />
          <Button type="primary" onClick={() => loadData(1, pagination.pageSize)}>搜索</Button>
          <Button onClick={() => { setKeyword(''); loadData(1, pagination.pageSize) }}>重置</Button>
        </Space>
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadData(page, pageSize),
          }}
          scroll={{ x: 1000 }}
        />
      </div>

      <Modal
        title={editingItem ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" disabled={!!editingItem} />
          </Form.Item>
          <Form.Item
            name="password"
            label={editingItem ? '新密码(不填则不修改)' : '密码'}
            rules={editingItem ? [] : [{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder={editingItem ? '留空表示不修改密码' : '请输入密码'} />
          </Form.Item>
          <Form.Item
            name="realName"
            label="真实姓名"
            rules={[{ required: true, message: '请输入真实姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="ADMIN">管理员</Option>
              <Option value="SALES">销售</Option>
              <Option value="DESIGNER">设计师</Option>
              <Option value="MANAGER">经理</Option>
            </Select>
          </Form.Item>
          <Form.Item name="department" label="部门">
            <Input placeholder="请输入部门" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="请输入电话" />
          </Form.Item>
          <Form.Item name="email" label="邮箱">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">确定</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManage
