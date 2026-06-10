import { useState, useEffect } from 'react'
import { Table, Button, Input, Space, Tag, Card, Modal, Form, Select, DatePicker, message, Popconfirm } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import type { ColumnsType } from 'antd/es/table'
import type { Project, Customer } from '@/types'
import { getStatusText, getStatusColor, formatDateOnly, formatMoney } from '@/utils'
import { getProjectList, createProject, updateProject, deleteProject } from '@/api/project'
import { getCustomerList } from '@/api/customer'
import dayjs from 'dayjs'

const { Option } = Select

const ProjectList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Project[]>([])
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>()
  const [customerFilter, setCustomerFilter] = useState<number>()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Project | null>(null)
  const [form] = Form.useForm()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerLoading, setCustomerLoading] = useState(false)

  const loadCustomers = async () => {
    setCustomerLoading(true)
    try {
      const response = await getCustomerList({ page: 1, pageSize: 1000 })
      setCustomers(response.data.list || [])
    } catch (error) {
      console.error('加载客户列表失败', error)
    } finally {
      setCustomerLoading(false)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (keyword) {
        params.keyword = keyword
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      if (customerFilter) {
        params.customerId = customerFilter
      }
      
      const response = await getProjectList(params)
      setData(response.data.list || [])
      setPagination({ 
        current: response.data.page || 1, 
        pageSize: response.data.pageSize || 10, 
        total: response.data.total || 0 
      })
    } catch (error) {
      console.error('加载项目列表失败', error)
      message.error('加载项目列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize])

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 })
    setTimeout(() => loadData(), 0)
  }

  const handleReset = () => {
    setKeyword('')
    setStatusFilter(undefined)
    setCustomerFilter(undefined)
    setPagination({ current: 1, pageSize: 10, total: 0 })
    setTimeout(() => loadData(), 0)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: Project) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
      actualEndDate: record.actualEndDate ? dayjs(record.actualEndDate) : undefined
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id)
      message.success('删除成功')
      loadData()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const projectData = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
        actualEndDate: values.actualEndDate ? values.actualEndDate.format('YYYY-MM-DD') : undefined
      }
      
      if (editingItem) {
        await updateProject(editingItem.id, projectData)
        message.success('更新成功')
      } else {
        await createProject(projectData)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const columns: ColumnsType<Project> = [
    {
      title: '项目编号',
      dataIndex: 'projectNo',
      key: 'projectNo',
      width: 120
    },
    {
      title: '项目名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: Project) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '客户',
      dataIndex: ['customer', 'name'],
      key: 'customerName',
      width: 100,
      render: (_: unknown, record: Project) => record.customer?.name || '-'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      )
    },
    {
      title: '销售',
      dataIndex: 'salesPerson',
      key: 'salesPerson',
      width: 100
    },
    {
      title: '项目经理',
      dataIndex: 'projectManager',
      key: 'projectManager',
      width: 100
    },
    {
      title: '总价',
      dataIndex: 'totalPrice',
      key: 'totalPrice',
      width: 120,
      render: (price: number | string) => formatMoney(price)
    },
    {
      title: '开工日期',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: (date: string) => formatDateOnly(date)
    },
    {
      title: '竣工日期',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: (date: string) => formatDateOnly(date)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: Project) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => navigate(`/projects/${record.id}`)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除这个项目吗？" onConfirm={() => handleDelete(record.id)}>
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
      <Card
        title="项目列表"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增项目
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索关键词（项目名称/编号）"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder="选择客户"
            value={customerFilter}
            onChange={setCustomerFilter}
            style={{ width: 200 }}
            allowClear
            loading={customerLoading}
            showSearch
            optionFilterProp="children"
          >
            {customers.map(customer => (
              <Option key={customer.id} value={customer.id}>{customer.name}</Option>
            ))}
          </Select>
          <Select
            placeholder="项目状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="PENDING">待处理</Option>
            <Option value="DESIGNING">设计中</Option>
            <Option value="CONSTRUCTING">施工中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="DELAYED">已延期</Option>
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑项目' : '新增项目'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="projectNo"
              label="项目编号"
              rules={[{ required: true, message: '请输入项目编号' }]}
            >
              <Input placeholder="请输入项目编号" />
            </Form.Item>
            <Form.Item
              name="name"
              label="项目名称"
              rules={[{ required: true, message: '请输入项目名称' }]}
            >
              <Input placeholder="请输入项目名称" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="customerId"
              label="客户"
              rules={[{ required: true, message: '请选择客户' }]}
            >
              <Select placeholder="请选择客户" loading={customerLoading} showSearch optionFilterProp="children">
                {customers.map(customer => (
                  <Option key={customer.id} value={customer.id}>{customer.name}</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="status"
              label="项目状态"
              rules={[{ required: true, message: '请选择项目状态' }]}
            >
              <Select placeholder="请选择项目状态">
                <Option value="PENDING">待处理</Option>
                <Option value="DESIGNING">设计中</Option>
                <Option value="CONSTRUCTING">施工中</Option>
                <Option value="COMPLETED">已完成</Option>
                <Option value="DELAYED">已延期</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="salesPerson"
              label="销售人员"
            >
              <Input placeholder="请输入销售人员" />
            </Form.Item>
            <Form.Item
              name="projectManager"
              label="项目经理"
            >
              <Input placeholder="请输入项目经理" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="totalPrice"
              label="总价"
              rules={[{ required: true, message: '请输入总价' }]}
            >
              <Input type="number" placeholder="请输入总价" prefix="¥" />
            </Form.Item>
            <Form.Item
              name="handler"
              label="经手人"
            >
              <Input placeholder="请输入经手人" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="startDate"
              label="开工日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择开工日期" />
            </Form.Item>
            <Form.Item
              name="endDate"
              label="竣工日期"
            >
              <DatePicker style={{ width: '100%' }} placeholder="请选择竣工日期" />
            </Form.Item>
          </div>
          <Form.Item
            name="actualEndDate"
            label="实际竣工日期"
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择实际竣工日期" />
          </Form.Item>
          <Form.Item name="remark" label="项目描述">
            <Input.TextArea rows={3} placeholder="请输入项目描述" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ProjectList
