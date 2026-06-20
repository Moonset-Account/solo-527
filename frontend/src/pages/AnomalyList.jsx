import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Modal, Form, Input, Select, Drawer, Descriptions, message } from 'antd'
import {
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { anomalyApi } from '@/services/api'
import dayjs from 'dayjs'
import FilterTemplateManager from '@/components/FilterTemplateManager'

const { TextArea } = Input
const { Option } = Select

export default function AnomalyList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [detailVisible, setDetailVisible] = useState(false)
  const [resolveVisible, setResolveVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [form] = Form.useForm()
  const [resolveForm] = Form.useForm()
  const [filters, setFilters] = useState({})

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current - 1,
        size: pagination.pageSize,
        ...filters,
      }
      const result = await anomalyApi.getList(params)
      setData(result?.content || result || [])
      setTotal(result?.totalElements || result?.length || 0)
    } catch (error) {
      console.error('加载异常列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'CRITICAL': return 'red'
      case 'HIGH': return 'orange'
      case 'MEDIUM': return 'gold'
      default: return 'blue'
    }
  }

  const getSeverityText = (severity) => {
    switch (severity) {
      case 'CRITICAL': return '严重'
      case 'HIGH': return '高'
      case 'MEDIUM': return '中'
      default: return '低'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'orange'
      case 'HANDLING': return 'blue'
      case 'RESOLVED': return 'green'
      default: return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING': return '待处理'
      case 'HANDLING': return '处理中'
      case 'RESOLVED': return '已解决'
      default: return status
    }
  }

  const handleViewDetail = async (record) => {
    try {
      const detail = await anomalyApi.getDetail(record.id)
      setCurrentRecord(detail)
      setDetailVisible(true)
    } catch (error) {
      console.error('获取异常详情失败', error)
    }
  }

  const handleHandle = async (record) => {
    try {
      await anomalyApi.handle(record.id)
      message.success('已标记为处理中')
      loadData()
    } catch (error) {
      console.error('处理异常失败', error)
    }
  }

  const handleResolveClick = (record) => {
    setCurrentRecord(record)
    resolveForm.resetFields()
    setResolveVisible(true)
  }

  const handleResolve = async (values) => {
    try {
      await anomalyApi.resolve(currentRecord.id, values)
      message.success('异常已解决')
      setResolveVisible(false)
      loadData()
    } catch (error) {
      console.error('解决异常失败', error)
    }
  }

  const handleSearch = (values) => {
    setFilters(values)
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    form.resetFields()
    setFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleApplyTemplate = (conditions) => {
    form.setFieldsValue(conditions)
    setFilters(conditions)
    setPagination({ ...pagination, current: 1 })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      render: (text) => <strong>{text}</strong>,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm }) => (
        <Input
          placeholder="请输入指标名称"
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={confirm}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
      ),
      onFilter: (value, record) => record.metricName.includes(value),
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (text, record) => text ? `${text}: ${record.dimensionValue}` : '-',
    },
    {
      title: '当前值',
      dataIndex: 'currentValue',
      key: 'currentValue',
      render: (v) => v?.toFixed?.(2) || v,
    },
    {
      title: '期望值',
      dataIndex: 'expectedValue',
      key: 'expectedValue',
      render: (v) => v?.toFixed?.(2) || v,
    },
    {
      title: '偏离率',
      dataIndex: 'deviationRate',
      key: 'deviationRate',
      render: (text) => (
        <span style={{ color: text < 0 ? '#ff4d4f' : '#52c41a' }}>
          {text > 0 ? '+' : ''}{text}%
        </span>
      ),
      sorter: (a, b) => a.deviationRate - b.deviationRate,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (text) => <Tag color={getSeverityColor(text)}>{getSeverityText(text)}</Tag>,
      filters: [
        { text: '严重', value: 'CRITICAL' },
        { text: '高', value: 'HIGH' },
        { text: '中', value: 'MEDIUM' },
        { text: '低', value: 'LOW' },
      ],
      onFilter: (value, record) => record.severity === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
      filters: [
        { text: '待处理', value: 'PENDING' },
        { text: '处理中', value: 'HANDLING' },
        { text: '已解决', value: 'RESOLVED' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '异常时间',
      dataIndex: 'anomalyTime',
      key: 'anomalyTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
      sorter: (a, b) => dayjs(a.anomalyTime).valueOf() - dayjs(b.anomalyTime).valueOf(),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 'PENDING' && (
            <Button
              type="link"
              size="small"
              icon={<ToolOutlined />}
              onClick={() => handleHandle(record)}
            >
              处理
            </Button>
          )}
          {record.status === 'HANDLING' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolveClick(record)}
            >
              解决
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title={
          <Space>
            <WarningOutlined />
            异常原因列表
          </Space>
        }
        extra={
          <Space>
            <FilterTemplateManager
              pageCode="anomaly_list"
              currentFilters={filters}
              onApplyTemplate={handleApplyTemplate}
            />
            <Button icon={<ReloadOutlined />} onClick={loadData}>
              刷新
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="inline" onFinish={handleSearch} style={{ marginBottom: 16 }}>
          <Form.Item name="metricName" label="指标名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="severity" label="严重程度">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="CRITICAL">严重</Option>
              <Option value="HIGH">高</Option>
              <Option value="MEDIUM">中</Option>
              <Option value="LOW">低</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" allowClear style={{ width: 120 }}>
              <Option value="PENDING">待处理</Option>
              <Option value="HANDLING">处理中</Option>
              <Option value="RESOLVED">已解决</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table
          dataSource={data}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          rowClassName={(record) => {
            switch (record.severity) {
              case 'CRITICAL': return 'anomaly-critical'
              case 'HIGH': return 'anomaly-high'
              case 'MEDIUM': return 'anomaly-medium'
              default: return 'anomaly-low'
            }
          }}
        />
      </Card>

      <Drawer
        title="异常详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentRecord && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID">{currentRecord.id}</Descriptions.Item>
            <Descriptions.Item label="指标名称">{currentRecord.metricName}</Descriptions.Item>
            <Descriptions.Item label="维度">
              {currentRecord.dimension ? `${currentRecord.dimension}: ${currentRecord.dimensionValue}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="当前值">{currentRecord.currentValue?.toFixed?.(2) || currentRecord.currentValue}</Descriptions.Item>
            <Descriptions.Item label="期望值">{currentRecord.expectedValue?.toFixed?.(2) || currentRecord.expectedValue}</Descriptions.Item>
            <Descriptions.Item label="偏离率">
              <span style={{ color: currentRecord.deviationRate < 0 ? '#ff4d4f' : '#52c41a' }}>
                {currentRecord.deviationRate > 0 ? '+' : ''}{currentRecord.deviationRate}%
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="严重程度">
              <Tag color={getSeverityColor(currentRecord.severity)}>
                {getSeverityText(currentRecord.severity)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={getStatusColor(currentRecord.status)}>
                {getStatusText(currentRecord.status)}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="异常时间">
              {dayjs(currentRecord.anomalyTime).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
            <Descriptions.Item label="异常原因">
              {currentRecord.anomalyReason || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="分析建议">
              {currentRecord.suggestion || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理方案">
              {currentRecord.resolution || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理人">
              {currentRecord.handlerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="处理时间">
              {currentRecord.resolvedAt ? dayjs(currentRecord.resolvedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal
        title="解决异常"
        open={resolveVisible}
        onCancel={() => setResolveVisible(false)}
        footer={null}
      >
        <Form form={resolveForm} layout="vertical" onFinish={handleResolve}>
          <Form.Item
            name="resolution"
            label="处理方案"
            rules={[{ required: true, message: '请输入处理方案' }]}
          >
            <TextArea rows={4} placeholder="请详细描述处理方案" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                确认解决
              </Button>
              <Button onClick={() => setResolveVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
