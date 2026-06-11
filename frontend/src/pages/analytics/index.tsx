import { useState, useEffect, useMemo } from 'react'
import {
  Card,
  Row,
  Col,
  DatePicker,
  Select,
  Button,
  Space,
  Table,
  Tag,
  Spin,
} from 'antd'
import {
  ReloadOutlined,
  MessageOutlined,
  CommentOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  BulbOutlined,
  AuditOutlined,
  WarningOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
  change?: number
  loading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change, loading }) => (
  <Card loading={loading} style={{ borderRadius: 8 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ color: '#666', fontSize: 14, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 28, fontWeight: 600, color: '#1f1f1f' }}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        {change !== undefined && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', fontSize: 12 }}>
            {change >= 0 ? (
              <RiseOutlined style={{ color: '#52c41a', marginRight: 4 }} />
            ) : (
              <FallOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
            )}
            <span style={{ color: change >= 0 ? '#52c41a' : '#ff4d4f' }}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
            <span style={{ color: '#999', marginLeft: 4 }}>环比</span>
          </div>
        )}
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: 24,
        }}
      >
        {icon}
      </div>
    </div>
  </Card>
)

interface ExceptionItem {
  key: string
  date: string
  errorType: string
  count: number
  ratio: number
  trend: 'up' | 'down' | 'stable'
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'day'),
    dayjs(),
  ])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [groupMetric, setGroupMetric] = useState<'calls' | 'accuracy'>('calls')

  const groupOptions = ['华东组', '华北组', '华南组', '西南组', '西北组']
  const versionOptions = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v1.3.0', 'v2.0.0']

  const mockStats = useMemo(() => ({
    totalSessions: 12856,
    totalMessages: 89432,
    aiCalls: 45231,
    accuracyRate: 92.5,
    adoptionRate: 78.3,
    pendingReviews: 156,
    riskSamples: 23,
    todaySessions: 892,
    sessionChange: 12.5,
    messageChange: 8.3,
    aiCallChange: 15.7,
    accuracyChange: 2.1,
    adoptionChange: -1.2,
    pendingChange: 5.3,
    riskChange: -8.5,
    todayChange: 18.2,
  }), [])

  const dates = useMemo(() => {
    const result = []
    for (let i = 6; i >= 0; i--) {
      result.push(dayjs().subtract(i, 'day').format('MM-DD'))
    }
    return result
  }, [])

  const sessionTrendOption = useMemo(() => ({
    title: {
      text: '会话量趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      textStyle: {
        color: '#333',
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 40,
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
      axisLine: {
        lineStyle: {
          color: '#e8e8e8',
        },
      },
      axisLabel: {
        color: '#666',
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
        },
      },
      axisLabel: {
        color: '#666',
      },
    },
    series: [
      {
        name: '会话数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: {
          width: 3,
          color: '#1890ff',
        },
        itemStyle: {
          color: '#1890ff',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
              { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
            ],
          },
        },
        data: [1200, 1350, 1100, 1450, 1380, 1520, 1600],
      },
    ],
  }), [dates])

  const aiCallAccuracyOption = useMemo(() => ({
    title: {
      text: 'AI调用量与准确率趋势',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      textStyle: {
        color: '#333',
      },
      axisPointer: {
        type: 'cross',
      },
    },
    legend: {
      data: ['AI调用量', '准确率'],
      top: 28,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: 70,
      containLabel: true,
    },
    xAxis: [
      {
        type: 'category',
        data: dates,
        axisPointer: {
          type: 'shadow',
        },
        axisLine: {
          lineStyle: {
            color: '#e8e8e8',
          },
        },
        axisLabel: {
          color: '#666',
        },
      },
    ],
    yAxis: [
      {
        type: 'value',
        name: '调用量',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
        axisLabel: {
          color: '#666',
        },
      },
      {
        type: 'value',
        name: '准确率',
        min: 80,
        max: 100,
        interval: 5,
        axisLabel: {
          formatter: '{value}%',
          color: '#666',
        },
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: [
      {
        name: 'AI调用量',
        type: 'bar',
        barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#1890ff' },
              { offset: 1, color: '#69c0ff' },
            ],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: [3200, 3500, 2900, 4100, 3800, 4300, 4500],
      },
      {
        name: '准确率',
        type: 'line',
        yAxisIndex: 1,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: {
          width: 3,
          color: '#52c41a',
        },
        itemStyle: {
          color: '#52c41a',
        },
        data: [91.2, 92.5, 90.8, 93.1, 92.7, 93.5, 94.2],
      },
    ],
  }), [dates])

  const groupComparisonOption = useMemo(() => {
    const groups = ['华东组', '华北组', '华南组', '西南组', '西北组']
    const calls = [8500, 7200, 6800, 5400, 4200]
    const accuracy = [93.2, 91.8, 94.5, 90.2, 92.7]

    return {
      title: {
        text: '销售运营分组对比',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8e8e8',
        textStyle: {
          color: '#333',
        },
        axisPointer: {
          type: 'shadow',
        },
      },
      legend: {
        data: groupMetric === 'calls' ? ['AI调用数', '准确数'] : ['准确率'],
        top: 28,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 70,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: groups,
        axisLine: {
          lineStyle: {
            color: '#e8e8e8',
          },
        },
        axisLabel: {
          color: '#666',
          interval: 0,
          rotate: 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
        axisLabel: {
          color: '#666',
          formatter: groupMetric === 'accuracy' ? '{value}%' : '{value}',
        },
        ...(groupMetric === 'accuracy' ? { min: 85, max: 100 } : {}),
      },
      series: groupMetric === 'calls'
        ? [
            {
              name: 'AI调用数',
              type: 'bar',
              barWidth: '30%',
              itemStyle: {
                color: '#1890ff',
                borderRadius: [4, 4, 0, 0],
              },
              data: calls,
            },
            {
              name: '准确数',
              type: 'bar',
              barWidth: '30%',
              itemStyle: {
                color: '#52c41a',
                borderRadius: [4, 4, 0, 0],
              },
              data: calls.map((c, i) => Math.round(c * accuracy[i] / 100)),
            },
          ]
        : [
            {
              name: '准确率',
              type: 'bar',
              barWidth: '40%',
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 0,
                  y2: 1,
                  colorStops: [
                    { offset: 0, color: '#722ed1' },
                    { offset: 1, color: '#b37feb' },
                  ],
                },
                borderRadius: [4, 4, 0, 0],
              },
              label: {
                show: true,
                position: 'top',
                formatter: '{c}%',
                color: '#666',
              },
              data: accuracy,
            },
          ],
    }
  }, [groupMetric])

  const errorTypeOption = useMemo(() => ({
    title: {
      text: '错误类型分布',
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 500,
      },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e8e8e8',
      textStyle: {
        color: '#333',
      },
      formatter: '{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: {
        color: '#666',
      },
    },
    series: [
      {
        name: '错误类型',
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold',
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          { value: 156, name: 'timeout', itemStyle: { color: '#faad14' } },
          { value: 89, name: 'rate_limit', itemStyle: { color: '#ff4d4f' } },
          { value: 67, name: 'api_error', itemStyle: { color: '#722ed1' } },
          { value: 45, name: 'content_filter', itemStyle: { color: '#13c2c2' } },
          { value: 32, name: 'other', itemStyle: { color: '#8c8c8c' } },
        ],
      },
    ],
  }), [])

  const versionRankOption = useMemo(() => {
    const versions = ['v2.0.0', 'v1.3.0', 'v1.2.0', 'v1.1.0', 'v1.0.0']
    const accuracy = [94.5, 93.2, 91.8, 90.5, 88.3]
    const usage = [12500, 15800, 22300, 18200, 25600]

    return {
      title: {
        text: '提示词版本准确率排名',
        left: 'center',
        textStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e8e8e8',
        textStyle: {
          color: '#333',
        },
        axisPointer: {
          type: 'shadow',
        },
        formatter: (params: any) => {
          const param = params[0]
          const idx = versions.indexOf(param.name)
          return `${param.name}<br/>准确率: ${accuracy[idx]}%<br/>使用次数: ${usage[idx].toLocaleString()}`
        },
      },
      grid: {
        left: '3%',
        right: '8%',
        bottom: '3%',
        top: 40,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        min: 85,
        max: 100,
        axisLine: {
          show: false,
        },
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: '#f0f0f0',
          },
        },
        axisLabel: {
          color: '#666',
          formatter: '{value}%',
        },
      },
      yAxis: {
        type: 'category',
        data: versions,
        inverse: true,
        axisLine: {
          lineStyle: {
            color: '#e8e8e8',
          },
        },
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#333',
          fontWeight: 500,
        },
      },
      series: [
        {
          name: '准确率',
          type: 'bar',
          barWidth: '50%',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: '#9254de' },
                { offset: 1, color: '#d3adf7' },
              ],
            },
            borderRadius: [0, 4, 4, 0],
          },
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
            color: '#666',
          },
          data: accuracy,
        },
      ],
    }
  }, [])

  const exceptionColumns: ColumnsType<ExceptionItem> = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '错误类型',
      dataIndex: 'errorType',
      key: 'errorType',
      width: 140,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          timeout: 'orange',
          rate_limit: 'red',
          api_error: 'purple',
          content_filter: 'cyan',
          other: 'default',
        }
        return <Tag color={colorMap[type] || 'default'}>{type}</Tag>
      },
    },
    {
      title: '数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      sorter: (a, b) => a.count - b.count,
    },
    {
      title: '占比',
      dataIndex: 'ratio',
      key: 'ratio',
      width: 120,
      render: (ratio: number) => `${ratio.toFixed(1)}%`,
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 100,
      render: (trend: string) => {
        const iconMap: Record<string, React.ReactNode> = {
          up: <RiseOutlined style={{ color: '#ff4d4f' }} />,
          down: <FallOutlined style={{ color: '#52c41a' }} />,
          stable: <ClockCircleOutlined style={{ color: '#faad14' }} />,
        }
        const textMap: Record<string, string> = {
          up: '上升',
          down: '下降',
          stable: '持平',
        }
        return (
          <span>
            {iconMap[trend]} {textMap[trend]}
          </span>
        )
      },
    },
  ]

  const exceptionData: ExceptionItem[] = [
    { key: '1', date: '06-11', errorType: 'timeout', count: 23, ratio: 32.4, trend: 'up' },
    { key: '2', date: '06-11', errorType: 'rate_limit', count: 18, ratio: 25.4, trend: 'stable' },
    { key: '3', date: '06-11', errorType: 'api_error', count: 14, ratio: 19.7, trend: 'down' },
    { key: '4', date: '06-10', errorType: 'content_filter', count: 10, ratio: 14.1, trend: 'up' },
    { key: '5', date: '06-10', errorType: 'timeout', count: 19, ratio: 26.8, trend: 'stable' },
    { key: '6', date: '06-10', errorType: 'other', count: 6, ratio: 8.5, trend: 'down' },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 800)
  }

  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates as [Dayjs, Dayjs])
    }
  }

  const chartStyle = { height: 320 }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>统计仪表盘</h2>

      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap size="middle">
          <span style={{ color: '#666' }}>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={handleDateChange}
            style={{ width: 260 }}
          />
          <span style={{ color: '#666', marginLeft: 16 }}>销售分组：</span>
          <Select
            mode="multiple"
            placeholder="请选择分组"
            value={selectedGroups}
            onChange={setSelectedGroups}
            style={{ minWidth: 200 }}
            allowClear
          >
            {groupOptions.map((group) => (
              <Option key={group} value={group}>
                {group}
              </Option>
            ))}
          </Select>
          <span style={{ color: '#666', marginLeft: 16 }}>提示词版本：</span>
          <Select
            mode="multiple"
            placeholder="请选择版本"
            value={selectedVersions}
            onChange={setSelectedVersions}
            style={{ minWidth: 200 }}
            allowClear
          >
            {versionOptions.map((version) => (
              <Option key={version} value={version}>
                {version}
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            style={{ marginLeft: 16 }}
          >
            刷新
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="总会话数"
            value={mockStats.totalSessions}
            icon={<MessageOutlined />}
            color="#1890ff"
            change={mockStats.sessionChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="总消息数"
            value={mockStats.totalMessages}
            icon={<CommentOutlined />}
            color="#52c41a"
            change={mockStats.messageChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="AI调用次数"
            value={mockStats.aiCalls}
            icon={<RobotOutlined />}
            color="#722ed1"
            change={mockStats.aiCallChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="生成准确率"
            value={`${mockStats.accuracyRate}%`}
            icon={<CheckCircleOutlined />}
            color="#13c2c2"
            change={mockStats.accuracyChange}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="建议采纳率"
            value={`${mockStats.adoptionRate}%`}
            icon={<BulbOutlined />}
            color="#fa8c16"
            change={mockStats.adoptionChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="待审核数量"
            value={mockStats.pendingReviews}
            icon={<AuditOutlined />}
            color="#faad14"
            change={mockStats.pendingChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="风险样本数"
            value={mockStats.riskSamples}
            icon={<WarningOutlined />}
            color="#ff4d4f"
            change={mockStats.riskChange}
            loading={loading}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard
            title="今日新增会话"
            value={mockStats.todaySessions}
            icon={<RiseOutlined />}
            color="#eb2f96"
            change={mockStats.todayChange}
            loading={loading}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8 }}>
            <Spin spinning={loading}>
              <ReactECharts option={sessionTrendOption} style={chartStyle} />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8 }}>
            <Spin spinning={loading}>
              <ReactECharts option={aiCallAccuracyOption} style={chartStyle} />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            style={{ borderRadius: 8 }}
            extra={
              <Select
                value={groupMetric}
                onChange={(value) => setGroupMetric(value)}
                size="small"
                style={{ width: 120 }}
              >
                <Option value="calls">调用数对比</Option>
                <Option value="accuracy">准确率对比</Option>
              </Select>
            }
          >
            <Spin spinning={loading}>
              <ReactECharts option={groupComparisonOption} style={chartStyle} />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 8 }}>
            <Spin spinning={loading}>
              <ReactECharts option={errorTypeOption} style={chartStyle} />
            </Spin>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card style={{ borderRadius: 8 }}>
            <Spin spinning={loading}>
              <ReactECharts option={versionRankOption} style={chartStyle} />
            </Spin>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="调用异常原因分析"
            style={{ borderRadius: 8 }}
            headStyle={{ fontSize: 14, fontWeight: 500 }}
          >
            <Spin spinning={loading}>
              <Table
                columns={exceptionColumns}
                dataSource={exceptionData}
                pagination={{ pageSize: 5, size: 'small' }}
                size="small"
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Analytics
