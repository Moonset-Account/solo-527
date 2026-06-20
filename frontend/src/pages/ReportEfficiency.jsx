import React, { useState, useEffect } from 'react'
import { Table, Card, Tag, Button, Space, Form, Input, Select, DatePicker, Statistic, Row, Col, message } from 'antd'
import {
  RiseOutlined,
  ReloadOutlined,
  SearchOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons'
import { efficiencyApi } from '@/services/api'
import dayjs from 'dayjs'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import FilterTemplateManager from '@/components/FilterTemplateManager'

const { RangePicker } = DatePicker
const { Option } = Select

export default function ReportEfficiency() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [trendData, setTrendData] = useState([])
  const [summary, setSummary] = useState(null)
  const [form] = Form.useForm()
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
      const [list, trend, summaryResult] = await Promise.all([
        efficiencyApi.getList(params),
        efficiencyApi.getTrend({ days: 7, ...filters }),
        efficiencyApi.getSummary(filters),
      ])
      setData(list?.content || list || [])
      setTotal(list?.totalElements || list?.length || 0)
      setTrendData(trend || [])
      setSummary(summaryResult)
    } catch (error) {
      console.error('加载报表效率数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values) => {
    const newFilters = {
      ...values,
      startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
      endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
    }
    delete newFilters.dateRange
    setFilters(newFilters)
    setPagination({ ...pagination, current: 1 })
  }

  const handleReset = () => {
    form.resetFields()
    setFilters({})
    setPagination({ ...pagination, current: 1 })
  }

  const handleApplyTemplate = (template) => {
    const filterData = template.filterConditions
    form.setFieldsValue({
      ...filterData,
      dateRange: filterData.startDate && filterData.endDate ? [
        dayjs(filterData.startDate),
        dayjs(filterData.endDate),
      ] : null,
    })
    setFilters(filterData)
    setPagination({ ...pagination, current: 1 })
  }

  const getSuccessRateColor = (rate) => {
    if (rate >= 99) return '#52c41a'
    if (rate >= 95) return '#faad14'
    if (rate >= 90) return '#fa8c16'
    return '#ff4d4f'
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: '报表编码',
      dataIndex: 'reportCode',
      key: 'reportCode',
      render: (text) => <code>{text}</code>,
    },
    {
      title: '报表名称',
      dataIndex: 'reportName',
      key: 'reportName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '统计日期',
      dataIndex: 'statDate',
      key: 'statDate',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.statDate).valueOf() - dayjs(b.statDate).valueOf(),
    },
    {
      title: '生成次数',
      dataIndex: 'generationCount',
      key: 'generationCount',
      sorter: (a, b) => a.generationCount - b.generationCount,
    },
    {
      title: '平均耗时',
      dataIndex: 'avgGenerationTimeMs',
      key: 'avgGenerationTimeMs',
      render: (text) => `${text} ms`,
      sorter: (a, b) => a.avgGenerationTimeMs - b.avgGenerationTimeMs,
    },
    {
      title: '最大耗时',
      dataIndex: 'maxGenerationTimeMs',
      key: 'maxGenerationTimeMs',
      render: (text) => `${text} ms`,
    },
    {
      title: '最小耗时',
      dataIndex: 'minGenerationTimeMs',
      key: 'minGenerationTimeMs',
      render: (text) => `${text} ms`,
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (text) => (
        <span style={{ color: getSuccessRateColor(text), fontWeight: 'bold' }}>
          {text}%
        </span>
      ),
      sorter: (a, b) => a.successRate - b.successRate,
    },
    {
      title: '成功/失败',
      key: 'result',
      render: (_, record) => (
        <Space>
          <Tag color="green">{record.successCount || 0}</Tag>
          <Tag color="red">{record.failCount || 0}</Tag>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <BarChartOutlined style={{ color: '#1890ff' }} />
                  总生成次数
                </Space>
              }
              value={summary?.totalGenerationCount || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <ClockCircleOutlined style={{ color: '#722ed1' }} />
                  平均耗时
                </Space>
              }
              value={summary?.avgGenerationTimeMs || 0}
              valueStyle={{ color: '#722ed1' }}
              suffix="ms"
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                  成功次数
                </Space>
              }
              value={summary?.successCount || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic
              title={
                <Space>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                  失败次数
                </Space>
              }
              value={summary?.failCount || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="生成耗时趋势（最近7天）" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="avgGenerationTimeMs"
                  name="平均耗时(ms)"
                  stroke="#1890ff"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="maxGenerationTimeMs"
                  name="最大耗时(ms)"
                  stroke="#ff4d4f"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="生成次数趋势（最近7天）" loading={loading}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successCount" name="成功" fill="#52c41a" />
                <Bar dataKey="failCount" name="失败" fill="#ff4d4f" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <RiseOutlined />
            报表生成效率详情
          </Space>
        }
        extra={
          <Space>
            <FilterTemplateManager
              pageCode="report_efficiency"
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
          <Form.Item name="reportCode" label="报表编码">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="reportName" label="报表名称">
            <Input placeholder="请输入" allowClear style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 260 }} />
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
          scroll={{ x: 1300 }}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
        />
      </Card>
    </div>
  )
}
