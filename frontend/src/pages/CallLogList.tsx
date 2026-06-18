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
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { callLogApi } from '@/api'
import type { CallLog, BaseQuery } from '@/types'

const { RangePicker } = DatePicker
const { Option } = Select

const CallLogList = () => {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CallLog[]>([])
  const [total, setTotal] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [queryParams, setQueryParams] = useState<BaseQuery>({})
  const [form] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLog, setCurrentLog] = useState<CallLog | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const result = await callLogApi.list({
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

  const handleViewDetail = (record: CallLog) => {
    setCurrentLog(record)
    setDetailVisible(true)
  }

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      SUCCESS: { color: 'success', text: '成功' },
      FAILED: { color: 'error', text: '失败' },
    }
    const info = statusMap[status] || { color: 'default', text: status }
    return <Tag color={info.color}>{info.text}</Tag>
  }

  const columns: ColumnsType<CallLog> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '请求ID',
      dataIndex: 'requestId',
      width: 200,
      ellipsis: true,
    },
    {
      title: '接口名称',
      dataIndex: 'apiName',
      width: 200,
    },
    {
      title: '请求方法',
      dataIndex: 'method',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
    },
    {
      title: '耗时(ms)',
      dataIndex: 'costTime',
      width: 100,
    },
    {
      title: '错误码',
      dataIndex: 'errorCode',
      width: 120,
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
      title: '操作人',
      dataIndex: 'createBy',
      width: 100,
    },
    {
      title: '调用时间',
      dataIndex: 'createTime',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
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
        <div className="page-title">调用日志</div>
      </div>

      <div className="filter-form">
        <Form form={form} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键字">
            <Input placeholder="接口名称" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILED">失败</Option>
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
        title="调用日志详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        destroyOnClose
      >
        {currentLog && (
          <>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="状态">
                {getStatusTag(currentLog.status)}
              </Descriptions.Item>
              <Descriptions.Item label="耗时">
                {currentLog.costTime}ms
              </Descriptions.Item>
              <Descriptions.Item label="请求ID" span={2}>
                {currentLog.requestId}
              </Descriptions.Item>
              <Descriptions.Item label="接口名称">{currentLog.apiName}</Descriptions.Item>
              <Descriptions.Item label="请求方法">{currentLog.method}</Descriptions.Item>
              <Descriptions.Item label="来源">{currentLog.source}</Descriptions.Item>
              <Descriptions.Item label="负责人">{currentLog.owner}</Descriptions.Item>
              <Descriptions.Item label="法务负责人">{currentLog.legalOwner}</Descriptions.Item>
              <Descriptions.Item label="操作人">{currentLog.createBy}</Descriptions.Item>
              <Descriptions.Item label="调用时间">
                {dayjs(currentLog.createTime).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              {currentLog.errorCode && (
                <Descriptions.Item label="错误码">{currentLog.errorCode}</Descriptions.Item>
              )}
              {currentLog.errorMessage && (
                <Descriptions.Item label="错误信息" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{currentLog.errorMessage}</span>
                </Descriptions.Item>
              )}
            </Descriptions>
            <div style={{ marginBottom: 16 }}>
              <strong>请求参数：</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                {currentLog.requestParams || '-'}
              </div>
            </div>
            <div>
              <strong>响应数据：</strong>
              <div
                style={{
                  marginTop: 8,
                  padding: 12,
                  background: '#f5f5f5',
                  borderRadius: 4,
                  maxHeight: 200,
                  overflow: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                {currentLog.responseData || '-'}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default CallLogList
