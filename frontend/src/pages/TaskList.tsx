import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Modal,
  Tag,
  message,
  Popconfirm,
  DatePicker,
  Drawer,
  Descriptions,
  Progress,
  Card,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { taskApi, templateApi } from '@/api'
import type { BatchTask, BaseQuery, EmailTemplate } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const TaskList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<BatchTask[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [queryParams, setQueryParams] = useState<BaseQuery>({})
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentTask, setCurrentTask] = useState<BatchTask | null>(null)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await taskApi.list({
        ...queryParams,
        pageNum,
        pageSize,
      })
      setData(result.records)
      setTotal(result.total)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const result = await templateApi.list({ pageNum: 1, pageSize: 100 })
      setTemplates(result.records)
    } catch (error) {
      // error handled
    }
  }

  useEffect(() => {
    fetchData()
  }, [pageNum, pageSize, queryParams])

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSearch = () => {
    setPageNum(1)
    const values = form.getFieldsValue()
    const params: BaseQuery = {
      keyword: values.keyword,
      status: values.status,
      owner: values.owner,
      source: values.source,
      legalOwner: values.legalOwner,
    }
    if (values.dateRange) {
      params.startTime = values.dateRange[0].format('YYYY-MM-DD HH:mm:ss')
      params.endTime = values.dateRange[1].format('YYYY-MM-DD HH:mm:ss')
    }
    setQueryParams(params)
  }

  const handleReset = () => {
    form.resetFields()
    setQueryParams({})
    setPageNum(1)
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record: BatchTask) => {
    setEditingId(record.id)
    form.setFieldsValue({
      taskName: record.taskName,
      description: record.description,
      templateId: record.templateId,
      scheduleTime: record.scheduleTime ? dayjs(record.scheduleTime) : null,
      dataSource: record.dataSource,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await taskApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      // error handled
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        scheduleTime: values.scheduleTime ? values.scheduleTime.format('YYYY-MM-DD HH:mm:ss') : null,
      }
      if (editingId) {
        await taskApi.update({ id: editingId, ...submitData })
        message.success('更新成功')
      } else {
        await taskApi.create(submitData)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      // error handled
    }
  }

  const handleStart = async (record: BatchTask) => {
    try {
      await taskApi.start(record.id)
      message.success('任务已启动')
      fetchData()
    } catch (error) {
      // error handled
    }
  }

  const handleViewDetail = (record: BatchTask) => {
    setCurrentTask(record)
    setDetailVisible(true)
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待执行' },
      RUNNING: { color: 'processing', text: '执行中' },
      COMPLETED: { color: 'success', text: '已完成' },
      FAILED: { color: 'error', text: '失败' },
      CANCELLED: { color: 'warning', text: '已取消' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getSuccessRate = (record: BatchTask) => {
    if (record.totalCount === 0) return 0
    return ((record.successCount / record.totalCount) * 100).toFixed(1)
  }

  const columns: ColumnsType<BatchTask> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      width: 200,
    },
    {
      title: '模板',
      dataIndex: 'templateName',
      width: 200,
    },
    {
      title: '总数',
      dataIndex: 'totalCount',
      width: 80,
    },
    {
      title: '成功/失败/风险',
      width: 180,
      render: (_, record) => (
        <span>
          <Tag color="success">{record.successCount}</Tag>
          <Tag color="error">{record.failCount}</Tag>
          <Tag color="warning">{record.riskCount}</Tag>
        </span>
      ),
    },
    {
      title: '成功率',
      width: 150,
      render: (_, record) => (
        <Progress percent={Number(getSuccessRate(record))} size="small" />
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
    },
    {
      title: '负责人',
      dataIndex: 'owner',
      width: 100,
    },
    {
      title: '法务负责人',
      dataIndex: 'legalOwner',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              编辑
            </Button>
          )}
          {(record.status === 'PENDING' || record.status === 'FAILED') && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStart(record)}
            >
              启动
            </Button>
          )}
          {record.status !== 'RUNNING' && (
            <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">批处理任务</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建任务
        </Button>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="任务名称" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="PENDING">待执行</Option>
              <Option value="RUNNING">执行中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="FAILED">失败</Option>
            </Select>
          </Form.Item>
          <Form.Item name="owner" label="负责人">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="MARKETING">市场部</Option>
              <Option value="SALES">销售部</Option>
              <Option value="CUSTOMER_SERVICE">客服部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="legalOwner" label="法务负责人">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="创建时间">
            <RangePicker showTime />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1500 }}
        pagination={{
          current: pageNum,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, size) => {
            setPageNum(page)
            setPageSize(size)
          },
        }}
      />

      <Modal
        title={editingId ? '编辑任务' : '新建任务'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="taskName"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>
          <Form.Item
            name="templateId"
            label="邮件模板"
            rules={[{ required: true, message: '请选择模板' }]}
          >
            <Select placeholder="请选择模板">
              {templates.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label="任务描述">
            <TextArea rows={2} placeholder="请输入任务描述" />
          </Form.Item>
          <Form.Item name="scheduleTime" label="计划执行时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dataSource" label="数据源配置">
            <TextArea rows={3} placeholder="JSON格式的数据源配置" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="任务详情"
        width={700}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentTask && (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card>
                  <Statistic title="总数" value={currentTask.totalCount} />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="成功"
                    value={currentTask.successCount}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic
                    title="失败"
                    value={currentTask.failCount}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            <Descriptions column={2} bordered>
              <Descriptions.Item label="任务名称">{currentTask.taskName}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {getStatusTag(currentTask.status)}
              </Descriptions.Item>
              <Descriptions.Item label="模板名称">{currentTask.templateName}</Descriptions.Item>
              <Descriptions.Item label="风险数">
                <Tag color="warning">{currentTask.riskCount}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="来源">{currentTask.source}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentTask.owner}</Descriptions.Item>
              <Descriptions.Item label="法务负责人">{currentTask.legalOwner}</Descriptions.Item>
              <Descriptions.Item label="成功率">
                {getSuccessRate(currentTask)}%
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentTask.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="开始时间">
                {currentTask.startTime ? dayjs(currentTask.startTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="结束时间">
                {currentTask.endTime ? dayjs(currentTask.endTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{currentTask.createBy}</Descriptions.Item>
              <Descriptions.Item label="任务描述" span={2}>
                {currentTask.description || '-'}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default TaskList
