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
  Divider
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { InspectionTask } from '@/types'
import { getStatusText, getStatusColor, formatDate, formatDateOnly } from '@/utils'
import { mockInspectionTasks, mockProjects, mockConstructionStages } from '@/mock/data'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const Inspection = () => {
  const [data, setData] = useState<InspectionTask[]>(mockInspectionTasks)
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<InspectionTask | null>(null)
  const [detailItem, setDetailItem] = useState<InspectionTask | null>(null)
  const [form] = Form.useForm()
  const [completeForm] = Form.useForm()
  const [completeModalVisible, setCompleteModalVisible] = useState(false)

  const projectOptions = mockProjects.map(p => ({ value: p.id, label: p.name }))

  const getStageOptions = (projectId: string) => {
    return mockConstructionStages
      .filter(s => s.projectId === projectId)
      .map(s => ({ value: s.id, label: s.name }))
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: InspectionTask) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      planDate: record.planDate ? dayjs(record.planDate) : null,
      handleTime: record.handleTime ? dayjs(record.handleTime) : null
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
        planDate: values.planDate?.format('YYYY-MM-DD') || '',
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      const stageName = mockConstructionStages.find(s => s.id === values.stageId)?.name
      if (editingItem) {
        setData(prev => prev.map(item =>
          item.id === editingItem.id ? { ...item, ...data, projectName, stageName } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: InspectionTask = {
          ...data,
          projectName,
          stageName,
          result: 'pending',
          status: 'pending',
          id: String(Date.now()),
          createdAt: new Date().toISOString()
        }
        setData(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setModalVisible(false)
    })
  }

  const handleViewDetail = (record: InspectionTask) => {
    setDetailItem(record)
    setDrawerVisible(true)
  }

  const handleComplete = (record: InspectionTask) => {
    setDetailItem(record)
    completeForm.resetFields()
    completeForm.setFieldsValue({
      result: record.result,
      issues: record.issues,
      rectificationDeadline: record.rectificationDeadline
    })
    setCompleteModalVisible(true)
  }

  const handleSubmitComplete = () => {
    completeForm.validateFields().then(values => {
      if (detailItem) {
        setData(prev => prev.map(item =>
          item.id === detailItem.id
            ? {
                ...item,
                ...values,
                status: 'completed',
                actualDate: new Date().toISOString(),
                handleTime: new Date().toISOString()
              }
            : item
        ))
        message.success('巡检完成')
      }
      setCompleteModalVisible(false)
      setDrawerVisible(false)
    })
  }

  const columns: ColumnsType<InspectionTask> = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName', ellipsis: true },
    { title: '阶段', dataIndex: 'stageName', key: 'stageName', width: 120 },
    { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
    { title: '计划日期', dataIndex: 'planDate', key: 'planDate', width: 120, render: (d) => formatDateOnly(d || '') },
    { title: '巡检员', dataIndex: 'inspector', key: 'inspector', width: 100 },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result?: string) => {
        if (!result || result === 'pending') {
          return <Tag color="default">待检查</Tag>
        }
        if (result === 'fail') {
          return <Tag color="red" icon={<ExclamationCircleOutlined />}>不通过</Tag>
        }
        return <Tag color={getStatusColor(result)}>{getStatusText(result)}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
    },
    { title: '经手人', dataIndex: 'handler', key: 'handler', width: 100 },
    { title: '处理时间', dataIndex: 'handleTime', key: 'handleTime', width: 160, render: (t) => formatDate(t || '') },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_: unknown, record: InspectionTask) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {record.status !== 'completed' && (
            <Button type="link" size="small" onClick={() => handleComplete(record)}>
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

  const rowClassName = (record: InspectionTask) => {
    return record.result === 'fail' ? 'table-row-danger' : ''
  }

  return (
    <div>
      <style>{`
        .table-row-danger td {
          background-color: #fff1f0 !important;
        }
        .table-row-danger:hover td {
          background-color: #ffccc7 !important;
        }
      `}</style>
      <Card
        title="巡检管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增巡检任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowClassName={rowClassName}
          scroll={{ x: 1200 }}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>

      <Modal
        title={editingItem ? '编辑巡检任务' : '新增巡检任务'}
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
          <Form.Item name="stageId" label="施工阶段">
            <Select placeholder="请选择施工阶段">
              {getStageOptions(form.getFieldValue('projectId') || '').map(option => (
                <Option key={option.value} value={option.value}>{option.label}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="巡检标题" rules={[{ required: true, message: '请输入巡检标题' }]}>
            <Input placeholder="请输入巡检标题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="planDate" label="计划日期" rules={[{ required: true, message: '请选择计划日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择计划日期" />
            </Form.Item>
            <Form.Item name="inspector" label="巡检员" rules={[{ required: true, message: '请输入巡检员' }]}>
              <Input placeholder="请输入巡检员" />
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
        title="巡检详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          detailItem?.status !== 'completed' && (
            <Space>
              <Button type="primary" onClick={() => handleComplete(detailItem!)}>
                处理巡检
              </Button>
            </Space>
          )
        }
      >
        {detailItem && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="项目名称">{detailItem.projectName}</Descriptions.Item>
              <Descriptions.Item label="施工阶段">{detailItem.stageName || '-'}</Descriptions.Item>
              <Descriptions.Item label="巡检标题">{detailItem.title}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{formatDateOnly(detailItem.planDate || '')}</Descriptions.Item>
              <Descriptions.Item label="巡检员">{detailItem.inspector}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailItem.status)}>{getStatusText(detailItem.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结果">
                {!detailItem.result || detailItem.result === 'pending' ? (
                  <Tag color="default">待检查</Tag>
                ) : detailItem.result === 'fail' ? (
                  <Tag color="red" icon={<ExclamationCircleOutlined />}>不通过</Tag>
                ) : (
                  <Tag color={getStatusColor(detailItem.result)}>{getStatusText(detailItem.result)}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="经手人">{detailItem.handler || '-'}</Descriptions.Item>
              <Descriptions.Item label="处理时间">{formatDate(detailItem.handleTime || '')}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">问题描述</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.issues || '暂无问题描述'}
            </div>

            <Divider orientation="left">整改要求</Divider>
            <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: 4, minHeight: 80 }}>
              {detailItem.rectificationDeadline || '暂无整改要求'}
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title="处理巡检"
        open={completeModalVisible}
        onOk={handleSubmitComplete}
        onCancel={() => setCompleteModalVisible(false)}
        width={600}
        destroyOnClose
      >
        <Form form={completeForm} layout="vertical">
          <Form.Item name="result" label="巡检结果" rules={[{ required: true, message: '请选择巡检结果' }]}>
            <Select placeholder="请选择巡检结果">
              <Option value="pass">通过</Option>
              <Option value="fail">不通过</Option>
            </Select>
          </Form.Item>
          <Form.Item name="issues" label="发现问题">
            <TextArea rows={4} placeholder="请描述发现的问题" />
          </Form.Item>
          <Form.Item name="rectificationDeadline" label="整改期限">
            <TextArea rows={4} placeholder="请填写整改期限" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inspection
