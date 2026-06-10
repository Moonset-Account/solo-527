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
  Popconfirm
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import type { InspectionTask, Project, ConstructionStage } from '@/types'
import { getStatusText, getStatusColor, formatDate, formatDateOnly } from '@/utils'
import {
  getInspectionTaskList,
  createInspectionTask,
  updateInspectionTask,
  deleteInspectionTask,
  getInspectionTaskDetail,
  completeInspection
} from '@/api/inspection'
import { getProjectList } from '@/api/project'
import { getConstructionStagesByProject } from '@/api/construction'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const Inspection = () => {
  const [data, setData] = useState<InspectionTask[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<InspectionTask | null>(null)
  const [detailItem, setDetailItem] = useState<InspectionTask | null>(null)
  const [form] = Form.useForm()
  const [completeForm] = Form.useForm()
  const [projects, setProjects] = useState<Project[]>([])
  const [stages, setStages] = useState<ConstructionStage[]>([])
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

  const loadStages = async (projectId: number) => {
    try {
      const response = await getConstructionStagesByProject(projectId)
      setStages(response.data || [])
    } catch (error) {
      console.error('加载施工阶段失败', error)
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
      const response = await getInspectionTaskList(params)
      setData(response.data.list || [])
      setPagination({ current: response.data.page || 1, pageSize: response.data.pageSize || 10, total: response.data.total || 0 })
    } catch (error) {
      console.error('加载巡检任务失败', error)
      message.error('加载巡检任务失败')
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

  const getStageName = (stageId?: number) => {
    if (!stageId) return '-'
    return stages.find(s => s.id === stageId)?.name || '-'
  }

  const handleProjectChange = (projectId: number) => {
    loadStages(projectId)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setStages([])
    setModalVisible(true)
  }

  const handleEdit = async (record: InspectionTask) => {
    setEditingItem(record)
    if (record.projectId) {
      await loadStages(record.projectId)
    }
    form.setFieldsValue({
      ...record,
      planDate: record.planDate ? dayjs(record.planDate) : null,
      handleTime: record.handleTime ? dayjs(record.handleTime) : null
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteInspectionTask(id)
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
        planDate: values.planDate?.format('YYYY-MM-DD') || undefined,
        handleTime: values.handleTime?.format('YYYY-MM-DD HH:mm:ss') || undefined
      }
      
      if (editingItem) {
        await updateInspectionTask(editingItem.id, data)
        message.success('更新成功')
      } else {
        await createInspectionTask(data)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (error) {
      console.error('提交失败', error)
    }
  }

  const handleViewDetail = async (record: InspectionTask) => {
    try {
      const response = await getInspectionTaskDetail(record.id)
      setDetailItem(response.data)
      setDrawerVisible(true)
    } catch (error) {
      console.error('获取详情失败', error)
      message.error('获取详情失败')
    }
  }

  const handleComplete = (record: InspectionTask) => {
    setDetailItem(record)
    completeForm.resetFields()
    completeForm.setFieldsValue({
      result: record.result,
      issues: record.issues,
      rectificationDeadline: record.rectificationDeadline ? dayjs(record.rectificationDeadline) : undefined,
      handler: record.handler
    })
    setCompleteModalVisible(true)
  }

  const handleSubmitComplete = async () => {
    try {
      const values = await completeForm.validateFields()
      if (detailItem) {
        const response = await completeInspection(detailItem.id, {
          result: values.result,
          issues: values.issues,
          rectificationDeadline: values.rectificationDeadline?.format('YYYY-MM-DD') || undefined,
          handler: values.handler
        })
        message.success('巡检完成')
        if (response.data?.needNotifyProjectManager) {
          message.warning('已自动提醒项目经理处理巡检不合格问题')
        }
        setCompleteModalVisible(false)
        setDrawerVisible(false)
        loadData()
      }
    } catch (error) {
      console.error('处理失败', error)
      message.error('处理失败')
    }
  }

  const columns: ColumnsType<InspectionTask> = [
    { title: '项目名称', dataIndex: 'projectId', key: 'projectName', ellipsis: true, render: (projectId: number) => getProjectName(projectId) },
    { title: '阶段', dataIndex: 'stageId', key: 'stageName', width: 120, render: (stageId?: number) => getStageName(stageId) },
    { title: '标题', dataIndex: 'title', key: 'title', width: 150 },
    { title: '计划日期', dataIndex: 'planDate', key: 'planDate', width: 120, render: (d) => formatDateOnly(d || '') },
    { title: '巡检员', dataIndex: 'inspector', key: 'inspector', width: 100 },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      width: 100,
      render: (result?: string) => {
        if (!result) {
          return <Tag color="default">待检查</Tag>
        }
        if (result === 'FAIL') {
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
          {record.status !== 'COMPLETED' && (
            <Button type="link" size="small" onClick={() => handleComplete(record)}>
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

  const rowClassName = (record: InspectionTask) => {
    return record.result === 'FAIL' ? 'table-row-danger' : ''
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
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="状态筛选"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="PENDING">待处理</Option>
            <Option value="IN_PROGRESS">进行中</Option>
            <Option value="COMPLETED">已完成</Option>
          </Select>
        </Space>
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          rowClassName={rowClassName}
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
        title={editingItem ? '编辑巡检任务' : '新增巡检任务'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
        destroyOnClose
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="关联项目" rules={[{ required: true, message: '请选择项目' }]}>
            <Select
              placeholder="请选择项目"
              showSearch
              optionFilterProp="children"
              onChange={handleProjectChange}
            >
              {projects.map(p => (
                <Option key={p.id} value={p.id}>{p.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="stageId" label="施工阶段">
            <Select placeholder="请选择施工阶段">
              {stages.map(option => (
                <Option key={option.id} value={option.id}>{option.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="title" label="巡检标题" rules={[{ required: true, message: '请输入巡检标题' }]}>
            <Input placeholder="请输入巡检标题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="planDate" label="计划日期">
              <DatePicker style={{ width: '100%' }} placeholder="请选择计划日期" />
            </Form.Item>
            <Form.Item name="inspector" label="巡检员">
              <Input placeholder="请输入巡检员" />
            </Form.Item>
          </div>
          <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
            <Select placeholder="请选择状态">
              <Option value="PENDING">待处理</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
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
          <Form.Item name="issues" label="备注">
            <TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="巡检详情"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          detailItem?.status !== 'COMPLETED' && (
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
              <Descriptions.Item label="项目名称">{getProjectName(detailItem.projectId)}</Descriptions.Item>
              <Descriptions.Item label="施工阶段">{getStageName(detailItem.stageId)}</Descriptions.Item>
              <Descriptions.Item label="巡检标题">{detailItem.title}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{formatDateOnly(detailItem.planDate || '')}</Descriptions.Item>
              <Descriptions.Item label="实际日期">{formatDateOnly(detailItem.actualDate || '')}</Descriptions.Item>
              <Descriptions.Item label="巡检员">{detailItem.inspector || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={getStatusColor(detailItem.status)}>{getStatusText(detailItem.status)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="结果">
                {!detailItem.result ? (
                  <Tag color="default">待检查</Tag>
                ) : detailItem.result === 'FAIL' ? (
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
        confirmLoading={loading}
      >
        <Form form={completeForm} layout="vertical">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item name="result" label="巡检结果" rules={[{ required: true, message: '请选择巡检结果' }]}>
              <Select placeholder="请选择巡检结果">
                <Option value="PASS">通过</Option>
                <Option value="FAIL">不通过</Option>
              </Select>
            </Form.Item>
            <Form.Item name="handler" label="处理人">
              <Input placeholder="请输入处理人" />
            </Form.Item>
          </div>
          <Form.Item name="issues" label="发现问题">
            <TextArea rows={4} placeholder="请描述发现的问题" />
          </Form.Item>
          <Form.Item name="rectificationDeadline" label="整改期限">
            <DatePicker style={{ width: '100%' }} placeholder="请选择整改期限" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Inspection
