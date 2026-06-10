import { useState } from 'react'
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
  InputNumber
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { AfterSales } from '@/types'
import {
  getStatusText,
  getStatusColor,
  formatDate,
  formatMoney,
  getAfterSalesTypeText
} from '@/utils'
import { mockAfterSales, mockProjects } from '@/mock/data'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const AfterSales = () => {
  const [data, setData] = useState<AfterSales[]>(mockAfterSales)
  const [modalVisible, setModalVisible] = useState(false)
  const [handleModalVisible, setHandleModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<AfterSales | null>(null)
  const [detailItem, setDetailItem] = useState<AfterSales | null>(null)
  const [form] = Form.useForm()
  const [handleForm] = Form.useForm()

  const projectOptions = mockProjects.map(p => ({ value: p.id, label: p.name }))

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: AfterSales) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      reportTime: dayjs(record.reportTime),
      handleTime: dayjs(record.handleTime)
    })
    setModalVisible(true)
  }

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(item => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const data = {
        ...values,
        reportTime: values.reportTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString(),
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString()
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      if (editingItem) {
        setData(prev => prev.map(item =>
          item.id === editingItem.id ? { ...item, ...data, projectName, updatedAt: new Date().toISOString() } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: AfterSales = {
          ...data,
          projectName,
          status: 'pending',
          id: String(Date.now()),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setData(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setModalVisible(false)
    })
  }

  const handleViewDetail = (record: AfterSales) => {
    setDetailItem(record)
    setDrawerVisible(true)
  }

  const handleProcess = (record: AfterSales) => {
    setDetailItem(record)
    handleForm.resetFields()
    handleForm.setFieldsValue({
      solution: record.solution,
      cost: record.cost,
      status: record.status
    })
    setHandleModalVisible(true)
  }

  const handleSubmitProcess = () => {
    handleForm.validateFields().then(values => {
      if (detailItem) {
        setData(prev => prev.map(item =>
          item.id === detailItem.id
            ? {
                ...item,
                ...values,
                updatedAt: new Date().toISOString(),
                handleTime: new Date().toISOString()
              }
            : item
        ))
        message.success('处理成功')
      }
      setHandleModalVisible(false)
      setDrawerVisible(false)
    })
  }

  const columns: ColumnsType<AfterSales> = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName', ellipsis: true },
    { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getAfterSalesTypeText(type)
    },
    { title: '报修时间', dataIndex: 'reportTime', key: 'reportTime', width: 160, render: (t) => formatDate(t) },
    { title: '报修人', dataIndex: 'reporter', key: 'reporter', width: 100 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t) },
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
          {record.status !== 'resolved' && (
            <Button type="link" size="small" onClick={() => handleProcess(record)}>
              处理
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>
            删除
          </Button>
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
            新增报修
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑报修' : '新增报修'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projectOptions} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="title" label="报修标题" rules={[{ required: true, message: '请输入报修标题' }]}>
              <Input placeholder="请输入报修标题" />
            </Form.Item>
            <Form.Item name="type" label="报修类型" rules={[{ required: true, message: '请选择报修类型' }]}>
              <Select placeholder="请选择报修类型">
                <Option value="quality">质量问题</Option>
                <Option value="installation">安装问题</Option>
                <Option value="material">材料问题</Option>
                <Option value="other">其他</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item name="description" label="问题描述" rules={[{ required: true, message: '请输入问题描述' }]}>
            <TextArea rows={4} placeholder="请详细描述问题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="reporter" label="报修人" rules={[{ required: true, message: '请输入报修人' }]}>
              <Input placeholder="请输入报修人" />
            </Form.Item>
            <Form.Item name="reportTime" label="报修时间" rules={[{ required: true, message: '请选择报修时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择报修时间" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人" rules={[{ required: true, message: '请输入经手人' }]}>
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间" rules={[{ required: true, message: '请选择处理时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Drawer
        title="报修详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          detailItem?.status !== 'resolved' && (
            <Space>
              <Button type="primary" onClick={() => handleProcess(detailItem!)}>
                处理报修
              </Button>
            </Space>
          )
        }
      >
        {detailItem && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">{detailItem.projectName}</Descriptions.Item>
              <Descriptions.Item label="报修标题">{detailItem.title}</Descriptions.Item>
              <Descriptions.Item label="报修类型">{getAfterSalesTypeText(detailItem.type)}</Descriptions.Item>
              <Descriptions.Item label="报修人">{detailItem.reporter}</Descriptions.Item>
              <Descriptions.Item label="报修时间">{formatDate(detailItem.reportTime || '')}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailItem.status)}>{getStatusText(detailItem.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="费用">
                {detailItem.cost !== undefined ? formatMoney(detailItem.cost) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="经手人">{detailItem.handler}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{formatDate(detailItem.handleTime || '')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">问题描述</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.description}
            </div>

            <Divider orientation="left">解决方案</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.solution || '暂无解决方案'}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="处理报修"
        open={handleModalVisible}
        onOk={handleSubmitProcess}
        onCancel={() => setHandleModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={handleForm} layout="vertical">
          <Form.Item name="solution" label="解决方案" rules={[{ required: true, message: '请输入解决方案' }]}>
            <TextArea rows={4} placeholder="请输入解决方案" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="cost" label="费用(元)">
              <InputNumber style={{ width: '100%' }} placeholder="请输入费用" min={0} />
            </Form.Item>
            <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
              <Select placeholder="请选择状态">
                <Option value="processing">处理中</Option>
                <Option value="resolved">已解决</Option>
              </Select>
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default AfterSales
