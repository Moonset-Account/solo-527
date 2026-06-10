import { useState, useEffect } from 'react'
import {
  Card,
  Tabs,
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
  List,
  Image,
  Popconfirm
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  MessageOutlined
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type {
  ConstructionStage,
  StagePhoto,
  CustomerFeedback,
  DelayReminder,
  Project
} from '@/types'
import {
  getStatusText,
  getStatusColor,
  formatDate,
  formatDateOnly,
  getFeedbackTypeText,
  getFeedbackTypeColor
} from '@/utils'
import {
  getConstructionStageList,
  createConstructionStage,
  updateConstructionStage,
  deleteConstructionStage,
  getConstructionStagesByProject
} from '@/api/construction'
import {
  getStagePhotoList,
  createStagePhoto,
  deleteStagePhoto
} from '@/api/stage-photo'
import {
  getCustomerFeedbackList,
  replyCustomerFeedback
} from '@/api/customer-feedback'
import {
  getDelayReminderList,
  resolveDelayReminder
} from '@/api/delay-reminder'
import { getProjectList } from '@/api/project'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const ConstructionManagement = () => {
  const [activeTab, setActiveTab] = useState('stages')
  const [stages, setStages] = useState<ConstructionStage[]>([])
  const [photoStages, setPhotoStages] = useState<ConstructionStage[]>([])
  const [photos, setPhotos] = useState<StagePhoto[]>([])
  const [feedbacks, setFeedbacks] = useState<CustomerFeedback[]>([])
  const [reminders, setReminders] = useState<DelayReminder[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const [stageLoading, setStageLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [reminderLoading, setReminderLoading] = useState(false)

  const [stageModalVisible, setStageModalVisible] = useState(false)
  const [photoModalVisible, setPhotoModalVisible] = useState(false)
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false)
  const [editingStage, setEditingStage] = useState<ConstructionStage | null>(null)
  const [replyFeedback, setReplyFeedback] = useState<CustomerFeedback | null>(null)
  const [stageForm] = Form.useForm()
  const [photoForm] = Form.useForm()
  const [feedbackForm] = Form.useForm()

  const [stagePagination, setStagePagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [feedbackPagination, setFeedbackPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [reminderPagination, setReminderPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const loadProjects = async () => {
    try {
      const response = await getProjectList({ page: 1, pageSize: 1000 })
      setProjects(response.data.list || [])
    } catch (error) {
      console.error('加载项目列表失败', error)
    }
  }

  const loadStages = async (page = stagePagination.current, pageSize = stagePagination.pageSize) => {
    setStageLoading(true)
    try {
      const response = await getConstructionStageList({ page, pageSize })
      setStages(response.data.list || [])
      setStagePagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载施工阶段失败', error)
      message.error('加载施工阶段失败')
    } finally {
      setStageLoading(false)
    }
  }

  const loadPhotos = async () => {
    setPhotoLoading(true)
    try {
      const response = await getStagePhotoList({ page: 1, pageSize: 1000 })
      setPhotos(response.data.list || [])
    } catch (error) {
      console.error('加载节点照片失败', error)
      message.error('加载节点照片失败')
    } finally {
      setPhotoLoading(false)
    }
  }

  const loadFeedbacks = async (page = feedbackPagination.current, pageSize = feedbackPagination.pageSize) => {
    setFeedbackLoading(true)
    try {
      const response = await getCustomerFeedbackList({ page, pageSize })
      setFeedbacks(response.data.list || [])
      setFeedbackPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载客户反馈失败', error)
      message.error('加载客户反馈失败')
    } finally {
      setFeedbackLoading(false)
    }
  }

  const loadReminders = async (page = reminderPagination.current, pageSize = reminderPagination.pageSize) => {
    setReminderLoading(true)
    try {
      const response = await getDelayReminderList({ page, pageSize })
      setReminders(response.data.list || [])
      setReminderPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载延期提醒失败', error)
      message.error('加载延期提醒失败')
    } finally {
      setReminderLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (activeTab === 'stages') {
      loadStages()
    }
  }, [activeTab, stagePagination.current, stagePagination.pageSize])

  useEffect(() => {
    if (activeTab === 'photos') {
      loadPhotos()
    }
  }, [activeTab])

  useEffect(() => {
    if (activeTab === 'feedbacks') {
      loadFeedbacks()
    }
  }, [activeTab, feedbackPagination.current, feedbackPagination.pageSize])

  useEffect(() => {
    if (activeTab === 'reminders') {
      loadReminders()
    }
  }, [activeTab, reminderPagination.current, reminderPagination.pageSize])

  const getProjectName = (projectId: number) => {
    return projects.find(p => p.id === projectId)?.name || '-'
  }

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

  const handleDeleteStage = async (id: number) => {
    try {
      await deleteConstructionStage(id)
      message.success('删除成功')
      loadStages()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleSubmitStage = async () => {
    try {
      const values = await stageForm.validateFields()
      const data = {
        ...values,
        order: values.order !== undefined && values.order !== '' ? Number(values.order) : undefined,
        startDate: values.startDate?.format('YYYY-MM-DD') || undefined,
        endDate: values.endDate?.format('YYYY-MM-DD') || undefined,
        actualStartDate: values.actualStartDate?.format('YYYY-MM-DD') || undefined,
        actualEndDate: values.actualEndDate?.format('YYYY-MM-DD') || undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }

      if (editingStage) {
        await updateConstructionStage(editingStage.id, data)
        message.success('更新成功')
      } else {
        await createConstructionStage(data)
        message.success('创建成功')
      }
      setStageModalVisible(false)
      loadStages()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handlePhotoProjectChange = async (projectId: number) => {
    try {
      const response = await getConstructionStagesByProject(projectId)
      setPhotoStages(response.data || [])
      photoForm.setFieldsValue({ stageId: undefined })
    } catch (error) {
      console.error('加载施工阶段失败', error)
      message.error('加载施工阶段失败')
    }
  }

  const handleAddPhoto = () => {
    photoForm.resetFields()
    setPhotoStages([])
    setPhotoModalVisible(true)
  }

  const handleSubmitPhoto = async () => {
    try {
      const values = await photoForm.validateFields()
      const data = {
        ...values,
        uploadTime: values.uploadTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      await createStagePhoto(data)
      message.success('上传成功')
      setPhotoModalVisible(false)
      loadPhotos()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handleDeletePhoto = async (id: number) => {
    try {
      await deleteStagePhoto(id)
      message.success('删除成功')
      loadPhotos()
    } catch (error) {
      console.error('删除失败', error)
      message.error('删除失败')
    }
  }

  const handleReplyFeedback = (record: CustomerFeedback) => {
    setReplyFeedback(record)
    feedbackForm.resetFields()
    feedbackForm.setFieldsValue({ reply: record.reply })
    setFeedbackModalVisible(true)
  }

  const handleSubmitReply = async () => {
    try {
      const values = await feedbackForm.validateFields()
      if (replyFeedback) {
        await replyCustomerFeedback(replyFeedback.id, { reply: values.reply, handler: values.handler })
        message.success('回复成功')
        setFeedbackModalVisible(false)
        loadFeedbacks()
      }
    } catch (error) {
      console.error('回复失败', error)
      message.error('回复失败')
    }
  }

  const handleResolveReminder = async (id: number) => {
    try {
      await resolveDelayReminder(id)
      message.success('已标记为已解决')
      loadReminders()
    } catch (error) {
      console.error('操作失败', error)
      message.error('操作失败')
    }
  }

  const stageColumns: ColumnsType<ConstructionStage> = [
    { title: '项目名称', dataIndex: 'projectId', key: 'projectName', render: (projectId: number) => getProjectName(projectId) },
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
          <Popconfirm title="确定要删除吗？" onConfirm={() => handleDeleteStage(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
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
            loading={stageLoading}
            scroll={{ x: 1200 }}
            pagination={{
              current: stagePagination.current,
              pageSize: stagePagination.pageSize,
              total: stagePagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setStagePagination({ ...stagePagination, current: page, pageSize })
            }}
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
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddPhoto}>
              上传照片
            </Button>
          }
        >
          {photos.length > 0 ? (
            <Image.PreviewGroup>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                {photos.map((photo) => (
                  <div key={photo.id} style={{ textAlign: 'center', width: 180, position: 'relative' }}>
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
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(255,255,255,0.8)' }}
                      onClick={() => handleDeletePhoto(photo.id)}
                    />
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
        <Card loading={feedbackLoading}>
          <List
            dataSource={feedbacks}
            renderItem={(item) => (
              <List.Item key={item.id} actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<MessageOutlined />}
                  onClick={() => handleReplyFeedback(item)}
                >
                  {item.reply ? '查看回复' : '处理回复'}
                </Button>
              ]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={getFeedbackTypeColor(item.type)}>{getFeedbackTypeText(item.type)}</Tag>
                      <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div style={{ marginBottom: 8 }}>
                        <span style={{ color: '#666' }}>项目: {getProjectName(item.projectId)}</span>
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
            pagination={{
              current: feedbackPagination.current,
              pageSize: feedbackPagination.pageSize,
              total: feedbackPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setFeedbackPagination({ ...feedbackPagination, current: page, pageSize })
            }}
          />
        </Card>
      )
    },
    {
      key: 'reminders',
      label: '延期提醒',
      children: (
        <Card loading={reminderLoading}>
          <List
            dataSource={reminders}
            renderItem={(item) => (
              <List.Item key={item.id} actions={[
                item.status === 'PENDING' && (
                  <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleResolveReminder(item.id)}>
                    标记已解决
                  </Button>
                )
              ]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <span>延期提醒</span>
                      <Tag color="orange">延期 {item.days} 天</Tag>
                      <Tag color={getStatusColor(item.status)}>{getStatusText(item.status)}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <div>项目: {getProjectName(item.projectId)}</div>
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
            pagination={{
              current: reminderPagination.current,
              pageSize: reminderPagination.pageSize,
              total: reminderPagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
              onChange: (page, pageSize) => setReminderPagination({ ...reminderPagination, current: page, pageSize })
            }}
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
        confirmLoading={stageLoading}
      >
        <Form form={stageForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select placeholder="请选择项目" showSearch optionFilterProp="children">
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
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
            <Form.Item name="startDate" label="计划开始日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择" />
            </Form.Item>
            <Form.Item name="endDate" label="计划结束日期">
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
              <Option value="PENDING">待开始</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="DELAYED">已延期</Option>
            </Select>
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="handler" label="经手人">
              <Input placeholder="请输入经手人" />
            </Form.Item>
            <Form.Item name="handleTime" label="处理时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择处理时间" />
            </Form.Item>
          </div>
          <Form.Item name="description" label="阶段描述">
            <TextArea rows={3} placeholder="请输入阶段描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="上传节点照片"
        open={photoModalVisible}
        onOk={handleSubmitPhoto}
        onCancel={() => setPhotoModalVisible(false)}
        width={600}
        destroyOnClose
        confirmLoading={photoLoading}
      >
        <Form form={photoForm} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              placeholder="请选择项目"
              showSearch
              optionFilterProp="children"
              onChange={handlePhotoProjectChange}
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="stageId" label="施工阶段" rules={[{ required: true, message: '请选择施工阶段' }]}>
            <Select placeholder="请选择施工阶段" showSearch optionFilterProp="children">
              {photoStages.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="照片标题" rules={[{ required: true, message: '请输入照片标题' }]}>
            <Input placeholder="请输入照片标题" />
          </Form.Item>
          <Form.Item name="photoUrl" label="照片地址" rules={[{ required: true, message: '请输入照片地址' }]}>
            <Input placeholder="请输入照片URL地址" />
          </Form.Item>
          <Form.Item name="description" label="照片描述">
            <TextArea rows={3} placeholder="请输入照片描述" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="uploader" label="上传人">
              <Input placeholder="请输入上传人" />
            </Form.Item>
            <Form.Item name="uploadTime" label="上传时间">
              <DatePicker showTime style={{ width: '100%' }} placeholder="请选择上传时间" />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        title="处理客户反馈"
        open={feedbackModalVisible}
        onOk={handleSubmitReply}
        onCancel={() => setFeedbackModalVisible(false)}
        width={600}
        destroyOnClose
        confirmLoading={feedbackLoading}
      >
        {replyFeedback && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Space style={{ marginBottom: 8 }}>
                <Tag color={getFeedbackTypeColor(replyFeedback.type)}>{getFeedbackTypeText(replyFeedback.type)}</Tag>
                <Tag color={getStatusColor(replyFeedback.status)}>{getStatusText(replyFeedback.status)}</Tag>
              </Space>
              <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
                {replyFeedback.content}
              </div>
            </div>
            <Form form={feedbackForm} layout="vertical">
              <Form.Item name="reply" label="回复内容" rules={[{ required: true, message: '请输入回复内容' }]}>
                <TextArea rows={4} placeholder="请输入回复内容" />
              </Form.Item>
              <Form.Item name="handler" label="处理人">
                <Input placeholder="请输入处理人" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ConstructionManagement
