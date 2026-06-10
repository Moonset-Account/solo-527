import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Form,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Space,
  Tag,
  Drawer,
  Descriptions,
  Divider,
  Popconfirm,
  InputNumber
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { AfterSales, Project } from '@/types'
import {
  getStatusText,
  getStatusColor,
  getAfterSalesTypeText,
  getAfterSalesTypeColor,
  formatDate,
  formatMoney
} from '@/utils'
import {
  getAfterSalesList,
  createAfterSales,
  updateAfterSales,
  deleteAfterSales,
  getAfterSalesDetail,
  processAfterSales
} from '@/api/aftersales'
import { getProjectList } from '@/api/project'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const AfterSalesPage = () => {
  const [data, setData] = useState<AfterSales[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [processModalVisible, setProcessModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<AfterSales | null>(null)
  const [detailItem, setDetailItem] = useState<AfterSales | null>(null)
  const [form] = Form.useForm()
  const [processForm] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [statusFilter, setStatusFilter] = useState<string>()

  const loadProjects = async () => {
    try {
      const response = await getProjectList({ page: 1, pageSize: 1000 })
      setProjects(response.data.list || [])
    } catch (error) {
      console.error('加载项目列表失败', error)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (statusFilter) {
        params.status = statusFilter
      }
      const response = await getAfterSalesList(params)
      setData(response.data.list || [])
      setPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载售后报修失败', error)
      message.error('加载售后报修失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, statusFilter])

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || '-'
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AfterSales) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      reportTime: record.reportTime ? dayjs(record.reportTime) : null,
      handleTime: record.handleTime ? dayjs(record.handleTime) : null,
      cost: Number(record.cost) || 0
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAfterSales(id)
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
      const data = {
        ...values,
        reportTime: values.reportTime?.format('YYYY-MM-DD HH:mm:ss') || undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      
      if (editingItem) {
        await updateAfterSales(editingItem.id, data)
        message.success('更新成功')
      } else {
        await createAfterSales(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handleViewDetail = async (record: AfterSales) => {
    try {
      const response = await getAfterSalesDetail(record.id)
      setDetailItem(response.data)
      setDrawerVisible(true)
    } catch (error) {
      console.error('获取详情失败', error)
      message.error('获取详情失败')
    }
  }

  const handleProcess = (record: AfterSales) => {
    setDetailItem(record)
    processForm.resetFields()
    processForm.setFieldsValue({
      solution: record.solution,
      cost: Number(record.cost) || 0,
      handler: record.handler
    })
    setProcessModalVisible(true)
  }

  const handleSubmitProcess = async () => {
    try {
      const values = await processForm.validateFields()
      if (detailItem) {
        await processAfterSales(detailItem.id, {
          solution: values.solution,
          cost: values.cost,
          handler: values.handler
        })
        message.success('处理成功')
        setProcessModalVisible(false)
        setDrawerVisible(false)
        loadData()
      }
    } catch (error) {
      console.error('处理失败', error)
      message.error('处理失败')
    }
  }

  const columns: ColumnsType<AfterSales> = [
    { title: '项目名称', dataIndex: 'projectId', key: 'projectName', ellipsis: true, render: (projectId: number) => getProjectName(projectId) },
    { title: '售后标题', dataIndex: 'title', key: 'title', width: 150 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color={getAfterSalesTypeColor(type)}>{getAfterSalesTypeText(type)}</Tag>
    },
    { title: '报修人', dataIndex: 'reporter', key: 'reporter', width: 100 },
    { title: '报修时间', dataIndex: 'reportTime', key: 'reportTime', width: 160, render: (t) => formatDate(t || '') },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '费用(元)', dataIndex: 'cost', key: 'cost', width: 120, render: (cost) => formatMoney(cost || 0) },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: AfterSales) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status !== 'COMPLETED' && record.status !== 'CLOSED' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDelete(record.id)}>
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
        title="售后报修"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增售后报修
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="PENDING">待处理</Option>
            <Option value="PROCESSING">处理中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CLOSED">已关闭</Option>
          </Select>
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
            onChange: (page, pageSize) => setPagination({ ...pagination, current: page, pageSize })
          }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑售后报修' : '新增售后报修'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              placeholder="请选择项目"
              showSearch
              optionFilterProp="children"
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="title" label="售后标题" rules={[{ required: true, message: '请输入售后标题' }]}>
              <Input placeholder="请输入售后标题" />
            </Form.Item>
            <Form.Item name="type" label="售后类型" rules={[{ required: true, message: '请选择售后类型' }]}>
              <Select placeholder="请选择售后类型">
                <Option value="REPAIR">维修</Option>
                <Option value="MAINTENANCE">维护</Option>
                <Option value="CONSULT">咨询</Option>
              </Select>
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="reporter" label="报修人" rules={[{ required: true, message: '请输入报修人' }]}>
              <Input placeholder="请输入报修人" />
            </Form.Item>
            <Form.Item name="reportTime" label="报修时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择报修时间" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="PENDING">待处理</Option>
              <Option value="PROCESSING">处理中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="CLOSED">已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="问题描述">
            <TextArea rows={4} placeholder="请描述问题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人">
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="售后详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          detailItem?.status !== 'COMPLETED' && detailItem?.status !== 'CLOSED' && (
            <Space>
              <Button type="primary" onClick={() => handleProcess(detailItem!)}>
                处理售后
              </Button>
            </Space>
          )
        }
      >
        {detailItem && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">{getProjectName(detailItem.projectId)}</Descriptions.Item>
              <Descriptions.Item label="售后标题">{detailItem.title}</Descriptions.Item>
              <Descriptions.Item label="售后类型">
                <Tag color={getAfterSalesTypeColor(detailItem.type)}>{getAfterSalesTypeText(detailItem.type)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailItem.status)}>{getStatusText(detailItem.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="报修人">{detailItem.reporter || '-'}</Descriptions.Item>
              <Descriptions.Item label="报修时间">{formatDate(detailItem.reportTime || '')}</Descriptions.Item>
              <Descriptions.Item label="处理人">{detailItem.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{formatDate(detailItem.handleTime || '')}</Descriptions.Item>
              <Descriptions.Item label="费用">{formatMoney(detailItem.cost || 0)}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">问题描述</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.description || '暂无描述'}
            </div>

            <Divider orientation="left">解决方案</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.solution || '暂无解决方案'}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="处理售后"
        open={processModalVisible}
        onOk={handleSubmitProcess}
        onCancel={() => setProcessModalVisible(false)}
        width={600}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={processForm} layout="vertical">
          <Form.Item name="solution" label="解决方案" rules={[{ required: true, message: '请输入解决方案' }]}>
            <TextArea rows={4} placeholder="请输入解决方案" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="cost" label="费用(元)">
              <InputNumber style={{ width: '100%' }} min={0} placeholder="请输入费用" />
            </Form.Item>
            <Form.Item name="handler" label="处理人">
              <Input placeholder="请输入处理人" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default AfterSalesPage
