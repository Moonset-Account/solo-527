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
  Tabs,
  Row,
  Col,
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { templateApi } from '@/api'
import type { EmailTemplate, EmailTemplateVersion, BaseQuery } from '@/types'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

const TemplateList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmailTemplate[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [queryParams, setQueryParams] = useState<BaseQuery>({})
  const [form] = Form.useForm()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<EmailTemplate | null>(null)
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await templateApi.list({
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

  useEffect(() => {
    fetchData()
  }, [pageNum, pageSize, queryParams])

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

  const handleEdit = (record: EmailTemplate) => {
    setEditingId(record.id)
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      subject: record.subject,
      content: record.content,
      category: record.category,
      source: record.source,
      owner: record.owner,
      legalOwner: record.legalOwner,
      status: record.status,
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: number) => {
    try {
      await templateApi.delete(id)
      message.success('删除成功')
      fetchData()
    } catch (error) {
      // error handled by interceptor
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingId) {
        await templateApi.update({ id: editingId, ...values })
        message.success('更新成功')
      } else {
        await templateApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      fetchData()
    } catch (error) {
      // error handled by interceptor
    }
  }

  const handleViewDetail = async (record: EmailTemplate) => {
    setCurrentTemplate(record)
    const versionList = await templateApi.listVersions(record.id)
    setVersions(versionList)
    setDetailVisible(true)
  }

  const handleRevert = async (version: number) => {
    if (!currentTemplate) return
    Modal.confirm({
      title: '确认回滚',
      content: `确定要回滚到版本 ${version} 吗？`,
      onOk: async () => {
        try {
          await templateApi.revertToVersion(currentTemplate.id, version)
          message.success('回滚成功')
          fetchData()
          const versionList = await templateApi.listVersions(currentTemplate.id)
          setVersions(versionList)
        } catch (error) {
          // error handled by interceptor
        }
      },
    })
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      DRAFT: { color: 'default', text: '草稿' },
      PUBLISHED: { color: 'success', text: '已发布' },
      ARCHIVED: { color: 'warning', text: '已归档' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns: ColumnsType<EmailTemplate> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '主题',
      dataIndex: 'subject',
      width: 250,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 100,
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
      title: '版本',
      dataIndex: 'version',
      width: 80,
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
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewDetail(record)}>
            版本
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const versionColumns: ColumnsType<EmailTemplateVersion> = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 100,
    },
    {
      title: '模板名称',
      dataIndex: 'name',
      width: 200,
    },
    {
      title: '变更说明',
      dataIndex: 'changeLog',
      width: 200,
    },
    {
      title: '操作人',
      dataIndex: 'createBy',
      width: 100,
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
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => handleRevert(record.version)}>
          回滚到此版本
        </Button>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">模板管理</div>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新建模板
        </Button>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="模板名称" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="DRAFT">草稿</Option>
              <Option value="PUBLISHED">已发布</Option>
              <Option value="ARCHIVED">已归档</Option>
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
        scroll={{ x: 1400 }}
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
        title={editingId ? '编辑模板' : '新建模板'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSubmit}
        width={800}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Row>
            <Col span={12}>
              <Form.Item
                name="name"
                label="模板名称"
                rules={[{ required: true, message: '请输入模板名称' }]}
              >
                <Input placeholder="请输入模板名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="category" label="分类">
                <Select placeholder="请选择分类">
                  <Option value="PROMOTION">推广邮件</Option>
                  <Option value="NOTIFICATION">通知邮件</Option>
                  <Option value="FOLLOW_UP">跟进邮件</Option>
                  <Option value="WELCOME">欢迎邮件</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="subject"
            label="邮件主题"
            rules={[{ required: true, message: '请输入邮件主题' }]}
          >
            <Input placeholder="请输入邮件主题" />
          </Form.Item>
          <Form.Item
            name="content"
            label="邮件内容"
            rules={[{ required: true, message: '请输入邮件内容' }]}
          >
            <TextArea rows={8} placeholder="请输入邮件内容，支持变量如 {name}, {company}" />
          </Form.Item>
          <Form.Item name="description" label="模板描述">
            <TextArea rows={2} placeholder="请输入模板描述" />
          </Form.Item>
          <Row>
            <Col span={8}>
              <Form.Item name="source" label="来源">
                <Select placeholder="请选择">
                  <Option value="MARKETING">市场部</Option>
                  <Option value="SALES">销售部</Option>
                  <Option value="CUSTOMER_SERVICE">客服部</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="owner" label="负责人">
                <Input placeholder="请输入负责人" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="legalOwner" label="法务负责人">
                <Input placeholder="请输入法务负责人" />
              </Form.Item>
            </Col>
          </Row>
          {editingId && (
            <Form.Item name="changeLog" label="变更说明">
              <Input placeholder="请描述本次变更内容" />
            </Form.Item>
          )}
          {!editingId && (
            <Form.Item name="status" label="状态" initialValue="DRAFT">
              <Select>
                <Option value="DRAFT">草稿</Option>
                <Option value="PUBLISHED">已发布</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Drawer
        title="模板详情"
        width={800}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        <Tabs
          items={[
            {
              key: 'basic',
              label: '基本信息',
              children: currentTemplate ? (
                <Descriptions column={2} bordered>
                  <Descriptions.Item label="模板名称">{currentTemplate.name}</Descriptions.Item>
                  <Descriptions.Item label="分类">{currentTemplate.category}</Descriptions.Item>
                  <Descriptions.Item label="主题" span={2}>
                    {currentTemplate.subject}
                  </Descriptions.Item>
                  <Descriptions.Item label="来源">{currentTemplate.source}</Descriptions.Item>
                  <Descriptions.Item label="负责人">{currentTemplate.owner}</Descriptions.Item>
                  <Descriptions.Item label="法务负责人">{currentTemplate.legalOwner}</Descriptions.Item>
                  <Descriptions.Item label="版本">v{currentTemplate.version}</Descriptions.Item>
                  <Descriptions.Item label="状态">
                    {getStatusTag(currentTemplate.status)}
                  </Descriptions.Item>
                  <Descriptions.Item label="内容" span={2}>
                    <div style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                      {currentTemplate.content}
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {dayjs(currentTemplate.createTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {dayjs(currentTemplate.updateTime).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                </Descriptions>
              ) : null,
            },
            {
              key: 'versions',
              label: '版本历史',
              children: (
                <Table
                  columns={versionColumns}
                  dataSource={versions}
                  rowKey="id"
                  size="small"
                  pagination={false}
                />
              ),
            },
          ]}
        />
      </Drawer>
    </div>
  )
}

export default TemplateList
