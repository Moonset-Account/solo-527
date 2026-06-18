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
  DatePicker,
  Drawer,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { riskSampleApi, exportApi } from '@/api'
import type { RiskSample, BaseQuery } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

const RiskSampleList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<RiskSample[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [queryParams, setQueryParams] = useState<BaseQuery>({})
  const [form] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentSample, setCurrentSample] = useState<RiskSample | null>(null)
  const [reviewModalVisible, setReviewModalVisible] = useState(false)
  const [reviewForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await riskSampleApi.list({
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
      status: values.reviewStatus,
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

  const handleViewDetail = (record: RiskSample) => {
    setCurrentSample(record)
    setDetailVisible(true)
  }

  const handleReview = (record: RiskSample) => {
    setCurrentSample(record)
    reviewForm.resetFields()
    setReviewModalVisible(true)
  }

  const handleReviewSubmit = async () => {
    if (!currentSample) return
    try {
      const values = await reviewForm.validateFields()
      await riskSampleApi.review(currentSample.id, values.reviewStatus, values.reviewComment)
      message.success('复核成功')
      setReviewModalVisible(false)
      fetchData()
    } catch (error) {
      // error handled
    }
  }

  const handleExport = () => {
    exportApi.exportRiskSamples(queryParams)
    message.success('导出任务已提交')
  }

  const getRiskLevelTag = (level: string) => {
    const levelMap: Record<string, { color: string; text: string }> = {
      LOW: { color: 'green', text: '低' },
      MEDIUM: { color: 'orange', text: '中' },
      HIGH: { color: 'red', text: '高' },
    }
    const info = levelMap[level] || { color: 'default', text: level }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const getReviewStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      PENDING: { color: 'default', text: '待复核' },
      PASSED: { color: 'success', text: '已通过' },
      REJECTED: { color: 'error', text: '已驳回' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns: ColumnsType<RiskSample> = [
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
      title: '邮件主题',
      dataIndex: 'subject',
      width: 250,
      ellipsis: true,
    },
    {
      title: '风险类型',
      dataIndex: 'riskType',
      width: 120,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      width: 100,
      render: (level) => getRiskLevelTag(level),
    },
    {
      title: '风险描述',
      dataIndex: 'riskDescription',
      width: 200,
      ellipsis: true,
    },
    {
      title: '复核状态',
      dataIndex: 'reviewStatus',
      width: 100,
      render: (status) => getReviewStatusTag(status),
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
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {record.reviewStatus === 'PENDING' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleReview(record)}
              >
                复核
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <div className="page-title">风险样本</div>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          导出报表
        </Button>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="风险描述" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="reviewStatus" label="复核状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="PENDING">待复核</Option>
              <Option value="PASSED">已通过</Option>
              <Option value="REJECTED">已驳回</Option>
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
        title="风险样本详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentSample && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="风险等级">
                {getRiskLevelTag(currentSample.riskLevel)}
              </Descriptions.Item>
              <Descriptions.Item label="复核状态">
                {getReviewStatusTag(currentSample.reviewStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="任务名称">{currentSample.taskName}</Descriptions.Item>
              <Descriptions.Item label="模板名称">{currentSample.templateName}</Descriptions.Item>
              <Descriptions.Item label="风险类型">{currentSample.riskType}</Descriptions.Item>
              <Descriptions.Item label="来源">{currentSample.source}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentSample.owner}</Descriptions.Item>
              <Descriptions.Item label="法务负责人">{currentSample.legalOwner}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(currentSample.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="复核人">
                {currentSample.reviewBy || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="风险描述" span={2}>
                {currentSample.riskDescription}
              </Descriptions.Item>
              {currentSample.reviewComment && (
                <Descriptions.Item label="复核意见" span={2}>
                  {currentSample.reviewComment}
                </Descriptions.Item>
              )}
            </Descriptions>
            <div style={{ marginBottom: 8 }}>
              <strong>邮件主题：</strong>{currentSample.subject}
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
                  maxHeight: 300,
                  overflow: 'auto',
                }}
              >
                {currentSample.content}
              </div>
            </div>
          </>
        )}
      </Drawer>

      <Modal
        title="风险复核"
        open={reviewModalVisible}
        onCancel={() => setReviewModalVisible(false)}
        onOk={handleReviewSubmit}
        destroyOnClose
      >
        <Form form={reviewForm} layout="vertical">
          <Form.Item
            name="reviewStatus"
            label="复核结果"
            rules={[{ required: true, message: '请选择复核结果' }]}
          >
            <Select placeholder="请选择复核结果">
              <Option value="PASSED">通过</Option>
              <Option value="REJECTED">驳回</Option>
            </Select>
          </Form.Item>
          <Form.Item name="reviewComment" label="复核意见">
            <TextArea rows={4} placeholder="请输入复核意见" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default RiskSampleList
