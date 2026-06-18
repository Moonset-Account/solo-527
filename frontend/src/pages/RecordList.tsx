import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Form,
  Input,
  Select,
  Tag,
  message,
  DatePicker,
  Drawer,
  Descriptions,
  Tabs,
  Modal,
  Popconfirm,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  EditOutlined,
  HistoryOutlined,
  RollbackOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { recordApi, exportApi } from '@/api'
import type { EmailRecord, BaseQuery, EmailRecordVersion } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const RecordList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<EmailRecord[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [queryParams, setQueryParams] = useState<BaseQuery>({})
  const [form] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState<EmailRecord | null>(null)
  const [activeTab, setActiveTab] = useState('basic')

  const [draftForm] = Form.useForm()
  const [draftSaving, setDraftSaving] = useState(false)

  const [versions, setVersions] = useState<EmailRecordVersion[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)
  const [viewVersionVisible, setViewVersionVisible] = useState(false)
  const [viewVersionData, setViewVersionData] = useState<EmailRecordVersion | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await recordApi.list({
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
      errorReason: values.errorReason,
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

  const handleViewDetail = async (record: EmailRecord) => {
    setCurrentRecord(record)
    setActiveTab('basic')
    setDetailVisible(true)
    draftForm.setFieldsValue({
      subject: record.subject,
      content: record.content,
      recipientEmail: record.recipientEmail,
      recipientName: record.recipientName,
      changeLog: '',
    })
  }

  const handleExport = () => {
    exportApi.exportEmailRecords(queryParams)
    message.success('导出任务已提交')
  }

  const fetchVersions = async (recordId: number) => {
    setVersionsLoading(true)
    try {
      const list = await recordApi.listVersions(recordId)
      setVersions(list)
    } finally {
      setVersionsLoading(false)
    }
  }

  const handleTabChange = (key: string) => {
    setActiveTab(key)
    if (key === 'versions' && currentRecord) {
      fetchVersions(currentRecord.id)
    }
  }

  const handleSaveDraft = async () => {
    if (!currentRecord) return
    try {
      const values = await draftForm.validateFields()
      setDraftSaving(true)
      const updated = await recordApi.updateDraft(currentRecord.id, {
        subject: values.subject,
        content: values.content,
        recipientEmail: values.recipientEmail,
        recipientName: values.recipientName,
        changeLog: values.changeLog || '编辑草稿',
      })
      setCurrentRecord(updated)
      setData((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      message.success('草稿保存成功，已生成新版本')
      draftForm.setFieldsValue({ changeLog: '' })
    } catch (err: any) {
      if (err?.errorFields) return
      message.error('草稿保存失败')
    } finally {
      setDraftSaving(false)
    }
  }

  const handleViewVersion = async (version: number) => {
    if (!currentRecord) return
    try {
      const v = await recordApi.getVersion(currentRecord.id, version)
      setViewVersionData(v)
      setViewVersionVisible(true)
    } catch {
      message.error('获取版本详情失败')
    }
  }

  const handleRevertVersion = async (version: number) => {
    if (!currentRecord) return
    try {
      const updated = await recordApi.revertToVersion(currentRecord.id, version)
      setCurrentRecord(updated)
      setData((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      draftForm.setFieldsValue({
        subject: updated.subject,
        content: updated.content,
        recipientEmail: updated.recipientEmail,
        recipientName: updated.recipientName,
        changeLog: '',
      })
      fetchVersions(currentRecord.id)
      message.success(`已回滚到版本 v${version}`)
    } catch {
      message.error('回滚失败')
    }
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      SUCCESS: { color: 'success', text: '成功' },
      FAILED: { color: 'error', text: '失败' },
      PENDING: { color: 'default', text: '待处理' },
      PROCESSING: { color: 'processing', text: '处理中' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns: ColumnsType<EmailRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '任务名称',
      dataIndex: 'taskName',
      width: 180,
    },
    {
      title: '模板名称',
      dataIndex: 'templateName',
      width: 180,
    },
    {
      title: '收件人',
      dataIndex: 'recipientEmail',
      width: 200,
    },
    {
      title: '收件人姓名',
      dataIndex: 'recipientName',
      width: 120,
    },
    {
      title: '主题',
      dataIndex: 'subject',
      width: 250,
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      render: (v) => `v${v || 1}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '是否风险',
      dataIndex: 'isRisk',
      width: 100,
      render: (isRisk) => (isRisk ? <Tag color="warning">是</Tag> : <Tag>否</Tag>),
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
      title: '错误信息',
      dataIndex: 'errorMessage',
      width: 150,
      ellipsis: true,
    },
    {
      title: '生成时间',
      dataIndex: 'generateTime',
      width: 180,
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </Space>
      ),
    },
  ]

  const versionColumns: ColumnsType<EmailRecordVersion> = [
    {
      title: '版本号',
      dataIndex: 'version',
      width: 90,
      render: (v) => <strong>v{v}</strong>,
    },
    {
      title: '变更说明',
      dataIndex: 'changeLog',
      width: 200,
      ellipsis: true,
    },
    {
      title: '操作人',
      dataIndex: 'createBy',
      width: 100,
    },
    {
      title: '保存时间',
      dataIndex: 'createTime',
      width: 180,
      render: (t) => (t ? dayjs(t).format('YYYY-MM-DD HH:mm:ss') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewVersion(record.version)}
          >
            查看
          </Button>
          <Popconfirm
            title="确认回滚"
            description={`确定要回滚到版本 v${record.version} 吗？当前内容将先自动保存为新版本。`}
            okText="确定"
            cancelText="取消"
            onConfirm={() => handleRevertVersion(record.version)}
          >
            <Button type="link" size="small" danger icon={<RollbackOutlined />}>
              回滚
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const renderBasicTab = () => {
    if (!currentRecord) return null
    return (
      <>
        <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="状态">
            {getStatusTag(currentRecord.status)}
          </Descriptions.Item>
          <Descriptions.Item label="是否风险">
            {currentRecord.isRisk ? <Tag color="warning">是</Tag> : <Tag>否</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="当前版本">
            <Tag color="blue">v{currentRecord.version || 1}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="最近变更">
            {currentRecord.changeLog || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="任务名称">{currentRecord.taskName}</Descriptions.Item>
          <Descriptions.Item label="模板名称">{currentRecord.templateName}</Descriptions.Item>
          <Descriptions.Item label="收件人">{currentRecord.recipientEmail}</Descriptions.Item>
          <Descriptions.Item label="收件人姓名">{currentRecord.recipientName}</Descriptions.Item>
          <Descriptions.Item label="来源">{currentRecord.source}</Descriptions.Item>
          <Descriptions.Item label="负责人">{currentRecord.owner}</Descriptions.Item>
          <Descriptions.Item label="法务负责人">{currentRecord.legalOwner}</Descriptions.Item>
          <Descriptions.Item label="生成时间">
            {currentRecord.generateTime ? dayjs(currentRecord.generateTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
          </Descriptions.Item>
          {currentRecord.errorMessage && (
            <Descriptions.Item label="错误信息" span={2}>
              <span style={{ color: '#ff4d4f' }}>{currentRecord.errorMessage}</span>
            </Descriptions.Item>
          )}
          {currentRecord.riskReason && (
            <Descriptions.Item label="风险原因" span={2}>
              <span style={{ color: '#faad14' }}>{currentRecord.riskReason}</span>
            </Descriptions.Item>
          )}
        </Descriptions>
        <div style={{ marginBottom: 8 }}>
          <strong>邮件主题：</strong>{currentRecord.subject}
        </div>
        <div>
          <strong>邮件内容：</strong>
          <div
            style={{
              marginTop: 8,
              padding: 16,
              background: '#f5f5f5',
              borderRadius: 4,
              whiteSpace: 'pre-wrap',
              maxHeight: 400,
              overflow: 'auto',
            }}
          >
            {currentRecord.content}
          </div>
        </div>
      </>
    )
  }

  const renderDraftTab = () => {
    return (
      <Form
        form={draftForm}
        layout="vertical"
        style={{ marginTop: 8 }}
      >
        <Form.Item
          label="收件人邮箱"
          name="recipientEmail"
          rules={[
            { required: true, message: '请输入收件人邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="请输入收件人邮箱" />
        </Form.Item>
        <Form.Item
          label="收件人姓名"
          name="recipientName"
          rules={[{ required: true, message: '请输入收件人姓名' }]}
        >
          <Input placeholder="请输入收件人姓名" />
        </Form.Item>
        <Form.Item
          label="邮件主题"
          name="subject"
          rules={[{ required: true, message: '请输入邮件主题' }]}
        >
          <Input placeholder="请输入邮件主题" />
        </Form.Item>
        <Form.Item
          label="邮件内容"
          name="content"
          rules={[{ required: true, message: '请输入邮件内容' }]}
        >
          <TextArea
            rows={12}
            placeholder="请输入邮件内容"
            style={{ resize: 'vertical' }}
          />
        </Form.Item>
        <Form.Item
          label="变更说明（保存到版本记录）"
          name="changeLog"
        >
          <Input placeholder="请描述本次修改内容，如：调整话术措辞" />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={draftSaving}
            onClick={handleSaveDraft}
          >
            保存草稿（生成新版本）
          </Button>
        </Form.Item>
      </Form>
    )
  }

  const renderVersionsTab = () => {
    if (!currentRecord) return null
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ marginBottom: 12, color: '#666' }}>
          共 {versions.length} 个版本记录，回滚操作会先将当前内容自动快照保存为新版本
        </div>
        <Table
          columns={versionColumns}
          dataSource={versions}
          rowKey="id"
          size="small"
          loading={versionsLoading}
          pagination={false}
          locale={{ emptyText: '暂无版本记录' }}
        />
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">生成结果</div>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          导出报表
        </Button>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="收件人邮箱" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILED">失败</Option>
              <Option value="PENDING">待处理</Option>
              <Option value="PROCESSING">处理中</Option>
            </Select>
          </Form.Item>
          <Form.Item name="owner" label="负责人">
            <Input placeholder="请输入" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select placeholder="请选择" style={{ width: 100 }} allowClear>
              <Option value="MARKETING">市场部</Option>
              <Option value="SALES">销售部</Option>
              <Option value="CUSTOMER_SERVICE">客服部</Option>
            </Select>
          </Form.Item>
          <Form.Item name="legalOwner" label="法务负责人">
            <Input placeholder="请输入" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="errorReason" label="异常原因">
            <Input placeholder="请输入" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="日期">
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
        scroll={{ x: 1700 }}
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

      <Drawer
        title={
          <Space>
            <span>邮件详情</span>
            {currentRecord && (
              <Tag color="blue">v{currentRecord.version || 1}</Tag>
            )}
          </Space>
        }
        width={720}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentRecord && (
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              {
                key: 'basic',
                label: (
                  <span>
                    <EyeOutlined /> 基本信息
                  </span>
                ),
                children: renderBasicTab(),
              },
              {
                key: 'draft',
                label: (
                  <span>
                    <EditOutlined /> 编辑草稿
                  </span>
                ),
                children: renderDraftTab(),
              },
              {
                key: 'versions',
                label: (
                  <span>
                    <HistoryOutlined /> 版本历史
                  </span>
                ),
                children: renderVersionsTab(),
              },
            ]}
          />
        )}
      </Drawer>

      <Modal
        title={
          viewVersionData
            ? `版本详情 - v${viewVersionData.version}（${viewVersionData.changeLog || '无变更说明'}）`
            : '版本详情'
        }
        open={viewVersionVisible}
        onCancel={() => setViewVersionVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewVersionVisible(false)}>
            关闭
          </Button>,
        ]}
        width={700}
      >
        {viewVersionData && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="版本号">v{viewVersionData.version}</Descriptions.Item>
              <Descriptions.Item label="变更说明">
                {viewVersionData.changeLog || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="收件人">{viewVersionData.recipientEmail}</Descriptions.Item>
              <Descriptions.Item label="收件人姓名">{viewVersionData.recipientName}</Descriptions.Item>
              <Descriptions.Item label="操作人">{viewVersionData.createBy}</Descriptions.Item>
              <Descriptions.Item label="保存时间">
                {viewVersionData.createTime
                  ? dayjs(viewVersionData.createTime).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginBottom: 8 }}>
              <strong>邮件主题：</strong>{viewVersionData.subject}
            </div>
            <div>
              <strong>邮件内容：</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 16,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  maxHeight: 360,
                  overflow: 'auto',
                }}
              >
                {viewVersionData.content}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default RecordList
