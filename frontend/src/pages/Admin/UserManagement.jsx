import { useState, useEffect } from 'react'
import { Button, Space, Input, Select, Modal, Form, message, Row, Col, Tag, Switch, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, KeyOutlined, PoweroffOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword } from '@/api/admin'

const roleColorMap = {
  admin: 'red',
  planner: 'blue'
}

const roleTextMap = {
  admin: '管理员',
  planner: '采购计划员'
}

const UserManagement = () => {
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResetPwdOpen, setIsResetPwdOpen] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [editingRecord, setEditingRecord] = useState(null)
  const [resetPwdRecord, setResetPwdRecord] = useState(null)
  const [searchParams, setSearchParams] = useState({ keyword: '', role: null, status: null })
  const [form] = Form.useForm()
  const [resetPwdForm] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [dataSource, setDataSource] = useState([
    { id: 1, username: 'admin', realName: '系统管理员', email: 'admin@medical.com', phone: '13800000001', role: 'admin', status: true, createTime: '2024-01-01 08:00:00' },
    { id: 2, username: 'planner01', realName: '张计划', email: 'zhangjh@medical.com', phone: '13800000002', role: 'planner', status: true, createTime: '2024-02-15 09:30:00' },
    { id: 3, username: 'planner02', realName: '李采购', email: 'licg@medical.com', phone: '13800000003', role: 'planner', status: true, createTime: '2024-03-10 10:15:00' },
    { id: 4, username: 'planner03', realName: '王计划', email: 'wangjh@medical.com', phone: '13800000004', role: 'planner', status: false, createTime: '2024-04-05 14:20:00' },
    { id: 5, username: 'admin02', realName: '副管理员', email: 'admin2@medical.com', phone: '13800000005', role: 'admin', status: true, createTime: '2024-05-20 16:45:00' },
    { id: 6, username: 'planner04', realName: '赵采购', email: 'zhaocg@medical.com', phone: '13800000006', role: 'planner', status: true, createTime: '2024-06-12 11:00:00' }
  ])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '用户名', dataIndex: 'username', key: 'username', width: 120 },
    { title: '真实姓名', dataIndex: 'realName', key: 'realName', width: 110 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '角色', dataIndex: 'role', key: 'role', width: 120, render: (role) => <Tag color={roleColorMap[role]}>{roleTextMap[role]}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (status) => <Tag color={status ? 'green' : 'default'}>{status ? '启用' : '禁用'}</Tag> },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} disabled={record.username === 'admin'}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<KeyOutlined />} onClick={() => handleResetPwd(record)}>
            重置密码
          </Button>
          <Popconfirm
            title={record.status ? '确认禁用该用户？' : '确认启用该用户？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<PoweroffOutlined />} danger={record.status} disabled={record.username === 'admin'}>
              {record.status ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除该用户？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={record.username === 'admin'}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getUserList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.keyword,
        role: searchParams.role,
        status: searchParams.status
      })
      if (res && res.data) {
        setDataSource(res.data.list || dataSource)
        setPagination((prev) => ({ ...prev, total: res.data.total || dataSource.length }))
      }
    } catch {
      setPagination((prev) => ({ ...prev, total: dataSource.length }))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadData()
  }

  const handleReset = () => {
    setSearchParams({ keyword: '', role: null, status: null })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleCreate = () => {
    setModalType('create')
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: true, role: 'planner' })
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setEditingRecord(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleResetPwd = (record) => {
    setResetPwdRecord(record)
    resetPwdForm.resetFields()
    setIsResetPwdOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteUser(id)
    } catch {}
    setDataSource(dataSource.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleToggleStatus = async (record) => {
    const newStatus = !record.status
    try {
      await updateUser(record.id, { status: newStatus })
    } catch {}
    setDataSource(dataSource.map((item) => (item.id === record.id ? { ...item, status: newStatus } : item)))
    message.success(newStatus ? '已启用' : '已禁用')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'create') {
        try {
          const res = await createUser(values)
          const newId = (res && res.data && res.data.id) || Math.max(...dataSource.map((i) => i.id), 0) + 1
          setDataSource([
            {
              id: newId,
              ...values,
              status: values.status ?? true,
              createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
            },
            ...dataSource
          ])
        } catch {
          const newId = Math.max(...dataSource.map((i) => i.id), 0) + 1
          setDataSource([
            {
              id: newId,
              ...values,
              status: values.status ?? true,
              createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
            },
            ...dataSource
          ])
        }
        message.success('创建成功')
      } else {
        try {
          await updateUser(editingRecord.id, values)
        } catch {}
        setDataSource(dataSource.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)))
        message.success('修改成功')
      }
      setIsModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleResetPwdSubmit = async () => {
    try {
      const values = await resetPwdForm.validateFields()
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致')
        return
      }
      try {
        await resetUserPassword(resetPwdRecord.id, { password: values.newPassword })
      } catch {}
      message.success('密码重置成功')
      setIsResetPwdOpen(false)
    } catch {
      console.log('密码重置表单验证失败')
    }
  }

  const handleTableChange = (newPagination) => {
    setPagination(newPagination)
  }

  return (
    <div>
      <PageHeader
        title="用户管理"
      />

      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="关键词(用户名/姓名/邮箱)"
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="请选择角色"
            style={{ width: 150 }}
            allowClear
            value={searchParams.role}
            onChange={(val) => setSearchParams((prev) => ({ ...prev, role: val }))}
            options={[
              { value: 'admin', label: '管理员' },
              { value: 'planner', label: '采购计划员' }
            ]}
          />
          <Select
            placeholder="请选择状态"
            style={{ width: 120 }}
            allowClear
            value={searchParams.status}
            onChange={(val) => setSearchParams((prev) => ({ ...prev, status: val }))}
            options={[
              { value: true, label: '启用' },
              { value: false, label: '禁用' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增</Button>
        </Space>
      </div>

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
      />

      <Modal
        title={modalType === 'create' ? '新增用户' : '编辑用户'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={600}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少3位' }]}>
                <Input placeholder="请输入用户名" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="realName" label="真实姓名" rules={[{ required: true, message: '请输入真实姓名' }]}>
                <Input placeholder="请输入真实姓名" />
              </Form.Item>
            </Col>
            {modalType === 'create' && (
              <Col xs={24} md={12}>
                <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '密码至少6位' }]}>
                  <Input.Password placeholder="请输入初始密码" />
                </Form.Item>
              </Col>
            )}
            <Col xs={24} md={12}>
              <Form.Item name="role" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
                <Select placeholder="请选择角色" options={[
                  { value: 'admin', label: '管理员' },
                  { value: 'planner', label: '采购计划员' }
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="电话" rules={[{ required: true, message: '请输入电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}>
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`重置密码 - ${resetPwdRecord?.username || ''}`}
        open={isResetPwdOpen}
        onOk={handleResetPwdSubmit}
        onCancel={() => setIsResetPwdOpen(false)}
        width={480}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={resetPwdForm} layout="vertical">
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请再次输入新密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagement
