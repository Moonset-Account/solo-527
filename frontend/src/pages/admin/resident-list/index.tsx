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
  DatePicker,
  Radio,
  message,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import {
  getResidentList,
  createResident,
  updateResident,
  deleteResident
} from '@/api'
import type { Resident, PageParams, ResidentFormData } from '@/types'
import dayjs from 'dayjs'

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
    loadData({ page: 1, pageSize: 10 })
  }, [])

  const loadData = async (params: PageParams) => {
    setLoading(true)
    try {
      const values = searchForm.getFieldsValue()
      const res = await getResidentList({ ...params, ...values })
      setData(res.data.list)
      setPagination({
        current: res.data.page,
        pageSize: res.data.pageSize,
        total: res.data.total
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const handleReset = () => {
    searchForm.resetFields()
    loadData({ page: 1, pageSize: pagination.pageSize })
  }

  const openAddModal = () => {
    setEditingId(null)
    modalForm.resetFields()
    setModalOpen(true)
  }

  const openEditModal = (record: Resident) => {
    setEditingId(record.id)
    modalForm.setFieldsValue({
      ...record,
      birthDate: record.birthDate ? dayjs(record.birthDate) : undefined
    } as any)
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await modalForm.validateFields()
      setSubmitLoading(true)
      const submitData: ResidentFormData = {
        ...values,
        birthDate: values.birthDate ? dayjs(values.birthDate).format('YYYY-MM-DD') : ''
      }
      if (editingId) {
        await updateResident(editingId, submitData)
        message.success('编辑成功')
      } else {
        await createResident(submitData)
        message.success('新增成功')
      }
      setModalOpen(false)
      loadData({ page: pagination.current, pageSize: pagination.pageSize })
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteResident(id)
      message.success('删除成功')
      loadData({ page: pagination.current, pageSize: pagination.pageSize })
    } catch {}
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 80,
      render: (gender: string) => (gender === 'male' ? '男' : '女')
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
      title: '出生日期',
      dataIndex: 'birthDate',
      width: 110
    },
    {
      title: '户籍类型',
      dataIndex: 'householdType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'local' ? 'blue' : 'green'}>
          {type === 'local' ? '本地户籍' : '流动人口'}
        </Tag>
      )
    },
    {
      title: '住址',
      dataIndex: 'address',
      ellipsis: true
    },
    {
      title: '楼栋信息',
      width: 150,
      render: (_: any, record: Resident) => (
        <span>{record.building}栋 {record.unit}单元 {record.room}室</span>
      )
    },
    {
      title: '特殊人群',
      dataIndex: 'specialType',
      width: 100,
      render: (type?: string) => type ? <Tag color="red">{type}</Tag> : '-'
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
        <Form.Item name="building">
          <Input placeholder="楼栋" allowClear style={{ width: 120 }} />
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
        scroll={{ x: 1300 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) => loadData({ page, pageSize })
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
              label="性别"
              name="gender"
              rules={[{ required: true, message: '请选择性别' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Radio.Group>
                <Radio value="male">男</Radio>
                <Radio value="female">女</Radio>
              </Radio.Group>
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
              rules={[{ required: true, message: '请输入联系电话' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Input placeholder="请输入联系电话" />
            </Form.Item>
            <Form.Item
              label="出生日期"
              name="birthDate"
              rules={[{ required: true, message: '请选择出生日期' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <DatePicker style={{ width: '100%' }} placeholder="选择出生日期" />
            </Form.Item>
            <Form.Item
              label="户籍类型"
              name="householdType"
              rules={[{ required: true, message: '请选择户籍类型' }]}
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Select placeholder="请选择户籍类型">
                <Select.Option value="local">本地户籍</Select.Option>
                <Select.Option value="migrant">流动人口</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="楼栋"
              name="building"
              rules={[{ required: true, message: '请输入楼栋' }]}
              style={{ width: 'calc(33.33% - 11px)', marginBottom: 16 }}
            >
              <Input placeholder="楼栋号" />
            </Form.Item>
            <Form.Item
              label="单元"
              name="unit"
              rules={[{ required: true, message: '请输入单元' }]}
              style={{ width: 'calc(33.33% - 11px)', marginBottom: 16 }}
            >
              <Input placeholder="单元号" />
            </Form.Item>
            <Form.Item
              label="房号"
              name="room"
              rules={[{ required: true, message: '请输入房号' }]}
              style={{ width: 'calc(33.33% - 11px)', marginBottom: 16 }}
            >
              <Input placeholder="房号" />
            </Form.Item>
            <Form.Item
              label="详细地址"
              name="address"
              rules={[{ required: true, message: '请输入详细地址' }]}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Input placeholder="请输入详细地址" />
            </Form.Item>
            <Form.Item
              label="特殊人群类型"
              name="specialType"
              style={{ width: 'calc(50% - 8px)', marginBottom: 16 }}
            >
              <Select placeholder="如为空则不选" allowClear>
                <Select.Option value="低保户">低保户</Select.Option>
                <Select.Option value="残疾人">残疾人</Select.Option>
                <Select.Option value="空巢老人">空巢老人</Select.Option>
                <Select.Option value="留守儿童">留守儿童</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="备注" name="remark" style={{ width: 'calc(50% - 8px)', marginBottom: 0 }}>
              <Input.TextArea rows={3} placeholder="备注信息" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}

export default ResidentList
