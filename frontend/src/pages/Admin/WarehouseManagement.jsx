import { useState, useEffect } from 'react'
import { Button, Space, Input, Select, Modal, Form, message, Row, Col, Tag, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PoweroffOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import { getWarehouseList, createWarehouse, updateWarehouse, deleteWarehouse } from '@/api/admin'

const WarehouseManagement = () => {
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [editingRecord, setEditingRecord] = useState(null)
  const [searchParams, setSearchParams] = useState({ keyword: '', status: null })
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [dataSource, setDataSource] = useState([
    { id: 1, code: 'WH-CENTRAL-001', name: '中央仓', address: '北京市丰台区科技园西路188号', manager: '王主任', phone: '13900000001', status: true, createTime: '2024-01-01 08:00:00' },
    { id: 2, code: 'WH-EAST-002', name: '华东仓', address: '上海市浦东新区张江高科技园区博云路2号', manager: '李经理', phone: '13900000002', status: true, createTime: '2024-02-10 09:30:00' },
    { id: 3, code: 'WH-SOUTH-003', name: '华南仓', address: '广州市天河区珠江新城华夏路16号', manager: '陈主管', phone: '13900000003', status: true, createTime: '2024-03-05 10:15:00' },
    { id: 4, code: 'WH-WEST-004', name: '华西仓', address: '成都市高新区天府大道北段1700号', manager: '赵经理', phone: '13900000004', status: false, createTime: '2024-04-20 14:20:00' }
  ])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
    { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '地址', dataIndex: 'address', key: 'address', width: 280, ellipsis: true },
    { title: '负责人', dataIndex: 'manager', key: 'manager', width: 100 },
    { title: '联系电话', dataIndex: 'phone', key: 'phone', width: 130 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (status) => <Tag color={status ? 'green' : 'default'}>{status ? '启用' : '禁用'}</Tag> },
    { title: '创建时间', dataIndex: 'createTime', key: 'createTime', width: 170 },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title={record.status ? '确认禁用该仓库？' : '确认启用该仓库？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<PoweroffOutlined />} danger={record.status}>
              {record.status ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
          <Popconfirm
            title="确认删除该仓库？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
      const res = await getWarehouseList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.keyword,
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
    setSearchParams({ keyword: '', status: null })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleCreate = () => {
    setModalType('create')
    setEditingRecord(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setEditingRecord(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteWarehouse(id)
    } catch {}
    setDataSource(dataSource.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleToggleStatus = async (record) => {
    const newStatus = !record.status
    try {
      await updateWarehouse(record.id, { status: newStatus })
    } catch {}
    setDataSource(dataSource.map((item) => (item.id === record.id ? { ...item, status: newStatus } : item)))
    message.success(newStatus ? '已启用' : '已禁用')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'create') {
        try {
          const res = await createWarehouse(values)
          const newId = (res && res.data && res.data.id) || Math.max(...dataSource.map((i) => i.id), 0) + 1
          setDataSource([
            {
              id: newId,
              ...values,
              status: true,
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
              status: true,
              createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
            },
            ...dataSource
          ])
        }
        message.success('创建成功')
      } else {
        try {
          await updateWarehouse(editingRecord.id, values)
        } catch {}
        setDataSource(dataSource.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)))
        message.success('修改成功')
      }
      setIsModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleTableChange = (newPagination) => {
    setPagination(newPagination)
  }

  return (
    <div>
      <PageHeader
        title="仓库管理"
      />

      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="关键词(编码/名称/地址)"
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
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
        title={modalType === 'create' ? '新增仓库' : '编辑仓库'}
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
              <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入仓库编码' }]}>
                <Input placeholder="请输入仓库编码" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
                <Input placeholder="请输入仓库名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="manager" label="负责人" rules={[{ required: true, message: '请输入负责人' }]}>
                <Input placeholder="请输入负责人" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }, { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="地址" rules={[{ required: true, message: '请输入仓库地址' }]}>
                <Input.TextArea rows={3} placeholder="请输入仓库地址" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default WarehouseManagement
