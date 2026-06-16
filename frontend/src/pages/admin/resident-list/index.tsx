import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Input,
  Select,
  Button,
  Space,
  Form,
  Modal,
  message,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getResidentList,
  createResident,
  updateResident,
  deleteResident,
  exportResidents
} from '@/api'
import type { Resident, ResidentFormData } from '@/types'

const ResidentList = () => {
  const navigate = useNavigate()
  const [searchForm] = Form.useForm()
  const [modalForm] = Form.useForm<ResidentFormData>()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Resident[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitLoading, setSubmitLoading] = useState(false)

  useEffect(() => {
    loadData(1, 10)
  }, [])

  const loadData = async (pageIndex?: number, pageSize?: number) => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const res = await getResidentList({
        pageIndex: pageIndex || pagination.current,
        pageSize: pageSize || pagination.pageSize,
        ...values
      })
      setData(res.items)
      setPagination({
        current: res.pageIndex,
        pageSize: res.pageSize,
        total: res.totalCount
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData(1, pagination.pageSize)
  }

  const handleReset = () => {
    searchForm.resetFields()
    loadData(1, pagination.pageSize)
  }

  const handleExport = async () => {
    try {
      const values = searchForm.getFieldsValue()
      await exportResidents(values)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const openAddModal = () => {
    setEditingId(null)
    modalForm.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: Resident) => {
    setEditingId(record.id)
    modalForm.setFieldsValue(record as any)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await modalForm.validateFields()
      setSubmitLoading(true)
      if (editingId) {
        await updateResident(editingId, values)
        message.success('编辑成功')
      } else {
        await createResident(values)
        message.success('新增成功')
      }
      setModalOpen(false)
      loadData(pagination.current, pagination.pageSize)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteResident(id)
      message.success('删除成功')
      loadData(pagination.current, pagination.pageSize)
    } catch {}
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100
    },
    {
      title: '身份证号',
      dataIndex: 'idCard',
      width: 200
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      width: 130
    },
    {
      title: '住址',
      dataIndex: 'address',
      ellipsis: true
    },
    {
      title: '所属网格',
      dataIndex: 'gridName',
      width: 120,
      render: (name?: string) => name || '-'
    },
    {
      title: '户籍类型',
      dataIndex: 'householdType',
      width: 100,
      render: (type?: string) => (
        type ? <Tag color={type === 'local' ? 'blue' : 'green'}>{type === 'local' ? '本地户籍' : '流动人口'}</Tag> : '-'
      )
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      render: (tags?: string[]) => tags?.length ? tags.map(t => <Tag key={t}>{t}</Tag>) : '-'
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 120,
      ellipsis: true,
      render: (remark?: string) => remark || '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right' as const,
      render: (_: any, record: Resident) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除该居民？" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <Card
      title="居民信息管理"
      extra={
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            导出
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => navigate('/admin/resident-import')}>
            批量导入
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
            新增居民
          </Button>
        </Space>
      }
    >
      <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="keyword">
          <Input placeholder="搜索姓名/身份证/电话" allowClear style={{ width: 200 }} />
        </Form.Item>
        <Form.Item name="householdType">
          <Select placeholder="户籍类型" allowClear style={{ width: 130 }}>
            <Select.Option value="local">本地户籍</Select.Option>
            <Select.Option value="migrant">流动人口</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="gridId">
          <Input placeholder="网格ID" allowClear style={{ width: 120 }} />
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

      <Table
        loading={loading}
        columns={columns}
        dataSource={data}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData(page, pageSize)
        }}
      />

      <Modal
        title={editingId ? '编辑居民' : '新增居民'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitLoading}
        width={700}
        destroyOnClose
      >
        <Form form={modalForm} layout="vertical">
          <Space wrap size={[16, 0]} style={{ display: 'flex' }}>
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入姓名" />
            </Form.Item>
            <Form.Item
              label="身份证号"
              name="idCard"
              rules={[
                { required: true, message: '请输入身份证号' },
                { len: 18, message: '身份证号为18位' }
              ]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入身份证号" />
            </Form.Item>
            <Form.Item
              label="联系电话"
              name="phone"
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item
              label="所属网格ID"
              name="gridId"
              rules={[{ required: true, message: '请输入网格ID' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入网格ID" type="number" />
            </Form.Item>
            <Form.Item
              label="户籍类型"
              name="householdType"
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Select placeholder="请选择户籍类型" allowClear>
                <Select.Option value="local">本地户籍</Select.Option>
                <Select.Option value="migrant">流动人口</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="详细地址"
              name="address"
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
            <Form.Item
              label="标签"
              name="tags"
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Select mode="tags" placeholder="输入标签后回车" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="备注" name="remark" style={{ width: '100%', marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="备注信息" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}

export default ResidentList
