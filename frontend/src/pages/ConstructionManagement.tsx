import { useState } from 'react'
import { Card, Tabs, Table, Button, Form, Input, Select, DatePicker, Modal, message, Space, Tag, List, Image, Upload } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { ConstructionStage, CustomerFeedback, DelayReminder } from '@/types'
import { getStatusText, getStatusColor, formatDate, formatDateOnly } from '@/utils'
import { mockConstructionStages, mockStagePhotos, mockCustomerFeedbacks, mockDelayReminders, mockProjects } from '@/mock/data'
import dayjs from 'dayjs'

const { Option } = Select

const ConstructionManagement = () => {
  const [activeTab, setActiveTab] = useState('stages')
  const [stages, setStages] = useState<ConstructionStage[]>(mockConstructionStages)
  const photos = mockStagePhotos
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>(mockCustomerFeedbacks)
  const [reminders, setReminders] = useState<DelayReminder[]>(mockDelayReminders)

  const [stageModalVisible, setStageModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [editingStage, setEditingStage] = useState<ConstructionStage | null>(null)
  const [replyFeedback, setReplyFeedback] = useState<CustomerFeedback | null>(null)
  const [stageForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()

  const projectOptions = mockProjects.map(p => ({ value: p.id, label: p.name }))

  const handleAddStage = () => {
    setEditingStage(null)
    stageForm.resetFields()
    setStageModalVisible(true)
  }

  const handleEditStage = (record: ConstructionStage) => {
    setEditingStage(record)
    stageForm.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : null,
      endDate: record.endDate ? dayjs(record.endDate) : null,
      actualStartDate: record.actualStartDate ? dayjs(record.actualStartDate) : null,
      actualEndDate: record.actualEndDate ? dayjs(record.actualEndDate) : null,
      handleTime: record.handleTime ? dayjs(record.handleTime) : null
    })
    setStageModalVisible(true)
  }

  const handleDeleteStage = (id: string) => {
    setStages(prev => prev.filter(item => item.id !== id))
    message.success('删除成功')
  }

  const handleSubmitStage = () => {
    stageForm.validateFields().then(values => {
      const data = {
        ...values,
        startDate: values.startDate?.format('YYYY-MM-DD') || '',
        endDate: values.endDate?.format('YYYY-MM-DD') || '',
        actualStartDate: values.actualStartDate?.format('YYYY-MM-DD') || undefined,
        actualEndDate: values.actualEndDate?.format('YYYY-MM-DD') || undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || new Date().toISOString()
      }
      const projectName = mockProjects.find(p => p.id === values.projectId)?.name || ''
      if (editingStage) {
        setStages(prev => prev.map(item =>
          item.id === editingStage.id ? { ...item, ...data, projectName, updatedAt: new Date().toISOString() } : item
        ))
        message.success('更新成功')
      } else {
        const newItem: ConstructionStage = {
          ...data,
          projectName,
          id: String(Date.now()),
          status: 'pending',
          order: 0,
          name: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        setStages(prev => [newItem, ...prev])
        message.success('创建成功')
      }
      setStageModalVisible(false)
    })
  }

  const handleReplyFeedback = (record: CustomerFeedback) => {
    setReplyFeedback(record)
    feedbackForm.resetFields()
    feedbackForm.setFieldsValue({ reply: record.reply })
    setFeedbackModalVisible(true)
  }

  const handleSubmitReply = () => {
    feedbackForm.validateFields().then(values => {
      if (replyFeedback) {
        setFeedbacks(prev => prev.map(item =>
          item.id === replyFeedback.id
            ? { ...item, reply: values.reply, status: 'resolved', updatedAt: new Date().toISOString() }
            : item
        ))
        message.success('回复成功')
      }
      setFeedbackModalVisible(false)
    })
  }

  const handleResolveReminder = (id: string) => {
    setReminders(prev => prev.map(item =>
      item.id === id ? { ...item, status: 'resolved', updatedAt: new Date().toISOString() } : item
    ))
    message.success('已标记为已解决')
  }

  const stageColumns: ColumnsType<ConstructionStage> = [
    { title: '项目名称', dataIndex: 'projectName', key: 'projectName' },
    { title: '阶段名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '顺序', dataIndex: 'order', key: 'order', width: 60 },
    { title: '计划开始', dataIndex: 'startDate', key: 'startDate', width: 110, render: (d) => formatDateOnly(d || '') },
    { title: '计划结束', dataIndex: 'endDate', key: 'endDate', width: 110, render: (d) => formatDateOnly(d || '') },
    { title: '实际开始', dataIndex: 'actualStartDate', key: 'actualStartDate', width: 110, render: (d) => formatDateOnly(d || '') },
    { title: '实际结束', dataIndex: 'actualEndDate', key: 'actualEndDate', width: 110, render: (d) => formatDateOnly(d || '') },
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
      width: 150,
      fixed: 'right',
      render: (_: unknown, record: ConstructionStage) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditStage(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteStage(record.id)}>删除</Button>
        </Space>
      )
    }
  ]

  const tabItems = [
    {
      key: 'stages',
      label: '施工阶段',
      children: (
        <Card
          extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddStage}>
              新增阶段
            </Button>
          }
        >
          <Table
            columns={stageColumns}
            dataSource={stages}
            rowKey="id"
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 10, showSizeChanger: true }}
          />
        </Card>
      )
    },
    {
      key: 'photos',
      label: '节点照片',
      children: (
        <Card
          extra={
            <Upload action="/upload" listType="picture-card" beforeUpload={() => false}>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>上传</div>
            </Upload>
          }
        >
          {photos.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {photos.map((photo) => (
                  <div key={photo.id} style={{ textAlign: 'center', width: 180 }}>
                    <Image
                      width={180}
                      height={180}
                      src={photo.photoUrl}
                      style={{ objectFit: 'cover', borderRadius: 8 }}
                    />
                    <div style={{ marginTop: 8, fontWeight: 500 }}>{photo.title}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>{photo.description}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                      {photo.uploader} · {formatDateOnly(photo.uploadTime || '')}
                    </div>
                  </div>
                ))}
              </div>
            </Image.PreviewGroup>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>暂无照片</div>
          )}
        </Card>
      )
    },
    {
      key: 'feedbacks',
      label: '客户反馈',
      children: (
        <Card>
          <List
            dataSource={feedbacks}
            renderItem={(item) => (
              <List.Item key={item.id} actions={[
                <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleReplyFeedback(item)}>
                  {item.reply ? '查看回复' : '处理回复'}
                </Button>
              ]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color="blue">{item.type === 'quality' ? '质量问题' : item.type === 'schedule' ? '进度问题' : item.type === 'service' ? '服务问题' : '其他'}</Tag>
                      <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#666' }}>项目: {item.projectName}</span>
                        <span style={{ margin: '0 8px', color: '#d9d9d9' }}>|</span>
                        <span style={{ color: '#666' }}>{formatDate(item.feedbackTime || item.createdAt)}</span>
                      </div>
                      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, marginBottom: 8 }}>
                        {item.content}
                      </div>
                      {item.reply && (
                        <div style={{ background: '#e6f7ff', padding: 12, borderRadius: 4, borderLeft: '3px solid #1890ff' }}>
                          <strong>回复:</strong> {item.reply}
                          <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                            回复时间: {formatDate(item.replyTime || '')}
                          </div>
                        </div>
                      )}
                      <div style={{ marginTop: 8, fontSize: 12, color: '#999' }}>
                        经手人: {item.handler || '-'}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    },
    {
      key: 'reminders',
      label: '延期提醒',
      children: (
        <Card>
          <List
            dataSource={reminders}
            renderItem={(item) => (
              <List.Item key={item.id} actions={[
                item.status === 'pending' && (
                  <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleResolveReminder(item.id)}>
                    标记已解决
                  </Button>
                )
              ]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>{item.stageName || '未指定阶段'}</span>
                      <Tag color="orange">延期 {item.days} 天</Tag>
                      <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>项目: {item.projectName}</div>
                      <div style={{ marginTop: 4 }}>原因: {item.reason || '-'}</div>
                      <div style={{ marginTop: 4, fontSize: 12, color: '#999' }}>
                        提醒时间: {formatDate(item.remindTime || item.createdAt)}
                      </div>
                      <div style={{ fontSize: 12, color: '#999' }}>
                        经手人: {item.handler || '-'}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      <Modal
        title={editingStage ? '编辑施工阶段' : '新增施工阶段'}
        open={stageModalVisible}
        onOk={handleSubmitStage}
        onCancel={() => setStageModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form form={stageForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" options={projectOptions} />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="name" label="阶段名称" rules={[{ required: true, message: '请输入阶段名称' }]}>
              <Input placeholder="请输入阶段名称" />
            </Form.Item>
            <Form.Item name="order" label="顺序" rules={[{ required: true, message: '请输入顺序' }]}>
              <Input type="number" placeholder="请输入顺序" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="startDate" label="计划开始日期" rules={[{ required: true, message: '请选择计划开始日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="endDate" label="计划结束日期" rules={[{ required: true, message: '请选择计划结束日期' }]}>
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="actualStartDate" label="实际开始日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="actualEndDate" label="实际结束日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="pending">待开始</Option>
              <Option value="in_progress">进行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="delayed">已延期</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人" rules={[{ required: true, message: '请输入经手人' }]}>
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="阶段描述">
            <Input.TextArea rows={3} placeholder="请输入阶段描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="处理客户反馈"
        open={feedbackModalVisible}
        onOk={handleSubmitReply}
        onCancel={() => setFeedbackModalVisible(false)}
        width={600}
        destroyOnClose
      >
        {replyFeedback && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Tag color="blue" style={{ marginBottom: 8 }}>
                {replyFeedback.type === 'quality' ? '质量问题' : replyFeedback.type === 'schedule' ? '进度问题' : replyFeedback.type === 'service' ? '服务问题' : '其他'}
              </Tag>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {replyFeedback.content}
              </div>
            </div>
            <Form form={feedbackForm} layout="vertical">
              <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
                <Input.TextArea rows={4} placeholder="请输入回复内容" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ConstructionManagement
