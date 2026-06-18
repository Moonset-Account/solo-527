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
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { recordApi, exportApi } from '@/api'
import type { EmailRecord, BaseQuery } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select

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

  const handleViewDetail = (record: EmailRecord) => {
    setCurrentRecord(record)
    setDetailVisible(true)
  }

  const handleExport = () => {
    exportApi.exportEmailRecords(queryParams)
    message.success('导出任务已提交')
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
        scroll={{ x: 1600 }}
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
        title="邮件详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentRecord && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="状态">
                {getStatusTag(currentRecord.status)}
              </Descriptions.Item>
              <Descriptions.Item label="是否风险">
                {currentRecord.isRisk ? <Tag color="warning">是</Tag> : <Tag>否</Tag>}
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
        )}
      </Drawer>
    </div>
  )
}

export default RecordList
