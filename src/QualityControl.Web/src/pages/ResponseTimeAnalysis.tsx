import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Form,
  Select,
  DatePicker,
  Button,
  Space,
  Table,
  Tag,
  Progress,
  message,
  InputNumber
} from 'antd'
import {
  ReloadOutlined,
  ExportOutlined,
  SearchOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  FilterOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { sessionService } from '@/services/sessionService'
import type { Session, SessionQuery } from '@/types'
import { formatDateTime, formatDuration, formatFileSize, downloadFile } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

export default function ResponseTimeAnalysis() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<Session[]>([])
  const [total, setTotal] = useState(0)
  const [exportLoading, setExportLoading] = useState(false)
  const [query, setQuery] = useState<SessionQuery>({
    pageIndex: 1,
    pageSize: 20,
    sortDesc: true,
    sortBy: 'responseTimeSeconds',
    status: 4
  })
  const [form] = Form.useForm()

  const statsData = {
    avgResponseTime: 180,
    maxResponseTime: 600,
    minResponseTime: 30,
    avgResolutionTime: 1800,
    complianceRate: 85.5,
    totalSessions: 1256
  }

  useEffect(() => {
    loadData()
  }, [query])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await sessionService.getSessions(query)
      if (res.success) {
        setData(res.data!.items)
        setTotal(res.data!.totalCount)
      }
    } catch (error) {
      console.error('加载数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (values: any) => {
    setQuery({
      ...query,
      pageIndex: 1,
      ...values,
      startTime: values.timeRange?.[0]?.toISOString(),
      endTime: values.timeRange?.[1]?.toISOString(),
    })
  }

  const handleReset = () => {
    form.resetFields()
    setQuery({
      pageIndex: 1,
      pageSize: 20,
      sortDesc: true,
      sortBy: 'responseTimeSeconds',
      status: 4
    })
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ ...query, pageIndex: page, pageSize })
  }

  const handleExport = async () => {
    setExportLoading(true)
    try {
      const exportData = {
        agentId: query.agentId,
        status: query.status,
        startTime: query.startTime,
        endTime: query.endTime,
        minResponseTime: query.minResponseTime,
        maxResponseTime: query.maxResponseTime,
        exportFormat: 'csv'
      }

      const blob = await sessionService.exportSessions(exportData)
      downloadFile(blob, `响应时长分析_${dayjs().format('YYYYMMDDHHmmss')}.csv`)
      message.success('导出成功')
    } catch (error) {
      console.error('导出失败', error)
      message.error('导出失败，请稍后重试')
    } finally {
      setExportLoading(false)
    }
  }

  const getDistributionChartOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['0-30秒', '30秒-1分', '1-3分钟', '3-5分钟', '5-10分钟', '10-30分钟', '30分钟以上'],
      axisLabel: {
        interval: 0,
        rotate: 30
      }
    },
    yAxis: {
      type: 'value',
      name: '会话数'
    },
    series: [
      {
        name: '会话数',
        type: 'bar',
        data: [320, 480, 256, 120, 58, 15, 7],
        itemStyle: {
          color: function(params: any) {
            const colors = ['#52c41a', '#52c41a', '#1677ff', '#faad14', '#fa8c16', '#fa541c', '#f5222d']
            return colors[params.dataIndex]
          }
        },
        label: {
          show: true,
          position: 'top'
        }
      }
    ]
  })

  const getTrendChartOption = () => ({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['平均响应时长', '平均解决时长']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '时长(秒)'
    },
    series: [
      {
        name: '平均响应时长',
        type: 'line',
        smooth: true,
        data: [150, 180, 165, 200, 175, 220, 190],
        itemStyle: { color: '#1677ff' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(22, 119, 255, 0.3)' },
              { offset: 1, color: 'rgba(22, 119, 255, 0.05)' }
            ]
          }
        }
      },
      {
        name: '平均解决时长',
        type: 'line',
        smooth: true,
        data: [1600, 1800, 1500, 2100, 1700, 2400, 2000],
        itemStyle: { color: '#52c41a' }
      }
    ]
  })

  const getAgentRankChartOption = () => ({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '平均响应时长(秒)'
    },
    yAxis: {
      type: 'category',
      data: ['李客服', '王客服', '张客服', '刘客服', '陈客服']
    },
    series: [
      {
        name: '平均响应时长',
        type: 'bar',
        data: [120, 145, 180, 210, 250],
        itemStyle: {
          color: function(params: any) {
            if (params.data < 150) return '#52c41a'
            if (params.data < 200) return '#1677ff'
            if (params.data < 250) return '#faad14'
            return '#f5222d'
          }
        }
      }
    ]
  })

  const getResponseTimeLevel = (seconds?: number) => {
    if (!seconds) return { color: 'default', text: '未响应' }
    if (seconds < 60) return { color: 'success', text: '< 1分钟' }
    if (seconds < 180) return { color: 'success', text: '1-3分钟' }
    if (seconds < 300) return { color: 'processing', text: '3-5分钟' }
    if (seconds < 600) return { color: 'warning', text: '5-10分钟' }
    return { color: 'error', text: '> 10分钟' }
  }

  const columns = [
    {
      title: '会话编号',
      dataIndex: 'sessionNumber',
      key: 'sessionNumber',
      width: 140,
      render: (text: string, record: Session) => (
        <a onClick={() => navigate(`/sessions/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 120
    },
    {
      title: '客服人员',
      dataIndex: 'agentName',
      key: 'agentName',
      width: 100
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '响应时长',
      dataIndex: 'responseTimeSeconds',
      key: 'responseTimeSeconds',
      width: 120,
      render: (seconds: number, record: Session) => (
        <div>
          <span style={{
            color: seconds && seconds < 180 ? '#52c41a' : seconds && seconds < 300 ? '#faad14' : '#f5222d',
            fontWeight: 500
          }}>
            {record.responseTimeDisplay || '未响应'}
          </span>
          <Tag color={getResponseTimeLevel(seconds).color} style={{ marginLeft: 8 }}>
            {getResponseTimeLevel(seconds).text}
          </Tag>
        </div>
      ),
      sorter: true
    },
    {
      title: '解决时长',
      dataIndex: 'resolutionTimeSeconds',
      key: 'resolutionTimeSeconds',
      width: 110,
      render: (seconds?: number) => formatDuration(seconds),
      sorter: true
    },
    {
      title: '质检状态',
      key: 'isInspected',
      width: 90,
      render: (_: any, record: Session) => (
        record.isInspected ? (
          <Tag color="green">已质检</Tag>
        ) : (
          <Tag color="orange">待质检</Tag>
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => formatDateTime(text),
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_: any, record: Session) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/sessions/${record.id}`)}>
            查看
          </Button>
          {!record.isInspected && (
            <Button type="link" size="small" onClick={() => navigate(`/inspections/new/${record.id}`)}>
              质检
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">响应时长分析</h1>
        <Space>
          <Button icon={<ExportOutlined />} onClick={handleExport} loading={exportLoading}>
            导出数据
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="平均响应时长"
              value={statsData.avgResponseTime}
              suffix="秒"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
            <div className="stat-card-trend">
              <span style={{ color: '#52c41a' }}><ArrowDownOutlined /> 12.3%</span>
              <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 8 }}>较上周</span>
            </div>
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="最快响应"
              value={statsData.minResponseTime}
              suffix="秒"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="最慢响应"
              value={statsData.maxResponseTime}
              suffix="秒"
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="平均解决时长"
              value={Math.round(statsData.avgResolutionTime / 60)}
              suffix="分钟"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="响应达标率"
              value={statsData.complianceRate}
              precision={1}
              suffix="%"
              valueStyle={{ color: statsData.complianceRate >= 90 ? '#52c41a' : '#faad14' }}
            />
            <Progress
              percent={statsData.complianceRate}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="统计会话数"
              value={statsData.totalSessions}
              valueStyle={{ color: 'rgba(0,0,0,0.88)' }}
            />
            <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
              本次统计范围内
            </div>
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" bordered={false}>
        <Form
          form={form}
          layout="inline"
          onFinish={handleSearch}
          initialValues={{ status: 4 }}
        >
          <Form.Item label="客服人员" name="agentId">
            <Select placeholder="全部客服" allowClear style={{ width: 140 }}>
              <Option value={3}>李客服</Option>
              <Option value={4}>王客服</Option>
            </Select>
          </Form.Item>
          <Form.Item label="会话状态" name="status">
            <Select placeholder="全部状态" allowClear style={{ width: 120 }}>
              <Option value={3}>已解决</Option>
              <Option value={4}>已关闭</Option>
            </Select>
          </Form.Item>
          <Form.Item label="响应时长（秒）" name="responseTime">
            <Input.Group compact style={{ width: 200 }}>
              <Form.Item name="minResponseTime" noStyle>
                <InputNumber style={{ width: '45%' }} placeholder="最小值" min={0} />
              </Form.Item>
              <Input
                style={{ width: '10%', textAlign: 'center', borderLeft: 0, borderRight: 0, pointerEvents: 'none' }}
                placeholder="~"
                disabled
              />
              <Form.Item name="maxResponseTime" noStyle>
                <InputNumber style={{ width: '45%' }} placeholder="最大值" min={0} />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item label="时间范围" name="timeRange">
            <RangePicker showTime style={{ width: 360 }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                查询
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={16}>
          <Card title="响应时长分布" bordered={false}>
            <ReactECharts option={getDistributionChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col span={8}>
          <Card title="客服响应时长排名" bordered={false}>
            <ReactECharts option={getAgentRankChartOption()} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Card title="响应时长趋势" bordered={false} style={{ marginBottom: 16 }}>
        <ReactECharts option={getTrendChartOption()} style={{ height: 280 }} />
      </Card>

      <Card
        title="会话列表"
        bordered={false}
        extra={
          <Button type="link" size="small" onClick={handleExport}>
            导出当前筛选结果
          </Button>
        }
      >
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <Space>
              <Button icon={<FilterOutlined />}>高级筛选</Button>
            </Space>
          </div>
          <div className="table-toolbar-right">
            <Space>
              <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
            </Space>
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: query.pageIndex,
            pageSize: query.pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: handlePageChange
          }}
        />
      </Card>
    </div>
  )
}
