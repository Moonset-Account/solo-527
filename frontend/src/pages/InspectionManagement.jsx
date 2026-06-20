import React, { useState, useEffect } from 'react'
import { Table, Tag, Button, Form, Input, Select, Space, Modal, message, Spin, DatePicker, Drawer, Descriptions, InputNumber } from 'antd'
import { SearchOutlined, DownloadOutlined, PlusOutlined, PlayCircleOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { queryInspections, createInspectionTask, startInspection, completeInspection, exportInspections } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  PENDING: { color: 'default', text: '待执行' },
  IN_PROGRESS: { color: 'processing', text: '进行中' },
  COMPLETED: { color: 'green', text: '已完成' },
  EXPIRED: { color: 'red', text: '已过期' }
}

export default function InspectionManagement() {
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({})
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [completeModalVisible, setCompleteModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)
  const [form] = Form.useForm()
  const [completeForm] = Form.useForm()
  const [searchForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const data = await queryInspections({
        ...filters,
        current: pagination.current,
        size: pagination.pageSize
      })
      setList(data.records || [])
      setPagination(p => ({ ...p, total: data.total || 0 }))
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const params = {}
    if (values.title) params.title = values.title
    if (values.inspectionType) params.inspectionType = values.inspectionType
    if (values.status) params.status = values.status
    if (values.planDate) params.planDate = values.planDate.format('YYYY-MM-DD')
    setFilters(params)
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({})
    setPagination(p => ({ ...p, current: 1 }))
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setSubmitting(true)
      await createInspectionTask({
        ...values,
        planDate: values.planDate.format('YYYY-MM-DD')
      })
      message.success('创建成功')
      setCreateModalVisible(false)
      form.resetFields()
      loadData()
    } catch (e) {
      message.error(e.message || '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStart = async (id) => {
    try {
      await startInspection(id)
      message.success('已开始执行')
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    }
  }

  const handleOpenComplete = (item) => {
    setCurrentItem(item)
    completeForm.resetFields()
    setCompleteModalVisible(true)
  }

  const handleComplete = async () => {
    try {
      const values = await completeForm.validateFields()
      setSubmitting(true)
      await completeInspection(currentItem.id, values)
      message.success('已完成巡检')
      setCompleteModalVisible(false)
      loadData()
    } catch (e) {
      message.error(e.message || '操作失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewDetail = (item) => {
    setCurrentItem(item)
    setDetailVisible(true)
  }

  const columns = [
    { title: '任务编号', dataIndex: 'taskNo', width: 150 },
    { title: '标题', dataIndex: 'title', width: 200 },
    { title: '类型', dataIndex: 'inspectionType', width: 100 },
    { title: '区域', dataIndex: 'area', width: 150 },
    { title: '计划日期', dataIndex: 'planDate', width: 110, render: v => dayjs(v).format('YYYY-MM-DD') },
    {
      title: '负责人', dataIndex: 'assigneeId', width: 100,
      render: v => v ? `员工#${v}` : '-'
    },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: v => statusMap[v] ? <Tag color={statusMap[v].color}>{statusMap[v].text}</Tag> : v
    },
    { title: '发现问题', dataIndex: 'issuesFound', ellipsis: true },
    {
      title: '操作', key: 'action', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(r)}>详情</Button>
          {r.status === 'PENDING' && (
            <Button size="small" type="primary" icon={<PlayCircleOutlined />} onClick={() => handleStart(r.id)}>开始</Button>
          )}
          {r.status === 'IN_PROGRESS' && (
            <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={() => handleOpenComplete(r)}>完成</Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">巡检管理</h2>
          <Space>
            <Button icon={<DownloadOutlined />} onClick={() => exportInspections(filters)}>导出Excel</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新增任务</Button>
          </Space>
        </div>

        <Form form={searchForm} layout="inline" className="filter-bar" onFinish={handleSearch}>
          <Form.Item name="title" label="任务标题">
            <Input placeholder="关键词" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="inspectionType" label="类型">
            <Select placeholder="全部" allowClear style={{ width: 130 }} options={[
              { value: '消防安全', label: '消防安全' },
              { value: '电梯安全', label: '电梯安全' },
              { value: '设备巡检', label: '设备巡检' },
              { value: '环境检查', label: '环境检查' },
              { value: '其他', label: '其他' }
            ]} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" allowClear style={{ width: 110 }} options={[
              { value: 'PENDING', label: '待执行' },
              { value: 'IN_PROGRESS', label: '进行中' },
              { value: 'COMPLETED', label: '已完成' }
            ]} />
          </Form.Item>
          <Form.Item name="planDate" label="计划日期">
            <DatePicker style={{ width: 150 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} htmlType="submit">查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={list}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: total => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize, total: pagination.total })
          }}
        />

        <Modal
          title="新增巡检任务"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
          destroyOnClose
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleCreate}>
            <Form.Item label="任务标题" name="title" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Space size={16} style={{ display: 'flex' }}>
              <Form.Item label="巡检类型" name="inspectionType" rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={[
                  { value: '消防安全', label: '消防安全' },
                  { value: '电梯安全', label: '电梯安全' },
                  { value: '设备巡检', label: '设备巡检' },
                  { value: '环境检查', label: '环境检查' },
                  { value: '其他', label: '其他' }
                ]} />
              </Form.Item>
              <Form.Item label="计划日期" name="planDate" rules={[{ required: true }]} style={{ flex: 1 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Form.Item label="巡检区域" name="area" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item label="负责人" name="assigneeId">
              <Select options={[
                { value: 2, label: '张工 (S002)' },
                { value: 3, label: '李工 (S003)' }
              ]} />
            </Form.Item>
            <Form.Item label="任务描述" name="description">
              <Input.TextArea rows={3} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>提交</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="完成巡检"
          open={completeModalVisible}
          onCancel={() => setCompleteModalVisible(false)}
          footer={null}
          destroyOnClose
          width={500}
        >
          <Form form={completeForm} layout="vertical" onFinish={handleComplete}>
            <Form.Item label="巡检结果" name="result" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="请描述巡检结果" />
            </Form.Item>
            <Form.Item label="发现问题" name="issuesFound">
              <Input.TextArea rows={3} placeholder="如有问题请描述，没有可留空" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={submitting} block>确认完成</Button>
            </Form.Item>
          </Form>
        </Modal>

        <Drawer
          title="巡检任务详情"
          open={detailVisible}
          onClose={() => setDetailVisible(false)}
          width={500}
        >
          {currentItem && (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="任务编号">{currentItem.taskNo}</Descriptions.Item>
              <Descriptions.Item label="标题">{currentItem.title}</Descriptions.Item>
              <Descriptions.Item label="类型">{currentItem.inspectionType}</Descriptions.Item>
              <Descriptions.Item label="区域">{currentItem.area}</Descriptions.Item>
              <Descriptions.Item label="计划日期">{dayjs(currentItem.planDate).format('YYYY-MM-DD')}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentItem.assigneeId ? `员工#${currentItem.assigneeId}` : '未指派'}</Descriptions.Item>
              <Descriptions.Item label="状态">{statusMap[currentItem.status]?.text}</Descriptions.Item>
              {currentItem.description && <Descriptions.Item label="描述">{currentItem.description}</Descriptions.Item>}
              {currentItem.result && <Descriptions.Item label="巡检结果">{currentItem.result}</Descriptions.Item>}
              {currentItem.issuesFound && <Descriptions.Item label="发现问题">{currentItem.issuesFound}</Descriptions.Item>}
              {currentItem.startedAt && <Descriptions.Item label="开始时间">{dayjs(currentItem.startedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>}
              {currentItem.completedAt && <Descriptions.Item label="完成时间">{dayjs(currentItem.completedAt).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>}
            </Descriptions>
          )}
        </Drawer>
      </div>
    </Spin>
  )
}
