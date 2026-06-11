import { useState, useEffect, useMemo } from 'react'
import {
  Card, Row, Col, DatePicker, Button, Space, Table, Tag, Spin,
} from 'antd'
import {
  ReloadOutlined, MessageOutlined, CommentOutlined,
  RobotOutlined, CheckCircleOutlined, BulbOutlined,
  AuditOutlined, WarningOutlined, RiseOutlined, FallOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import type { ColumnsType } from 'antd/es/table'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { statsApi } from '@/api'
import type {
  OverviewStats, DailyStats, AccuracyStats,
  ErrorStatsResult, SalesOperationRankingItem, PromptVersionRankingItem,
  DRFPaginationResult,
} from '@/types/api'

const { RangePicker } = DatePicker

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
          width: 48, height: 48, borderRadius: '50%', background: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 24,
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
  error_type: string
  count: number
  ratio: number
}

const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(6, 'day'), dayjs(),
  ])
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [dailyList, setDailyList] = useState<DailyStats[]>([])
  const [accuracyList, setAccuracyList] = useState<AccuracyStats[]>([])
  const [errorStats, setErrorStats] = useState<ErrorStatsResult | null>(null)
  const [soRanking, setSoRanking] = useState<SalesOperationRankingItem[]>([])
  const [pvRanking, setPvRanking] = useState<PromptVersionRankingItem[]>([])

  const loadAllData = async () => {
    setLoading(true)
    const [start_date, end_date] = [
      dateRange[0].format('YYYY-MM-DD'),
      dateRange[1].format('YYYY-MM-DD'),
    ]
    try {
      const [
        ovRes, dailyRes, accRes, errRes, soRes, pvRes,
      ] = await Promise.all([
        statsApi.getOverviewStats() as unknown as OverviewStats,
        statsApi.getDailyStats({ start_date, end_date }) as unknown as DRFPaginationResult<DailyStats>,
        statsApi.getAccuracyStats({ start_date, end_date }) as unknown as DRFPaginationResult<AccuracyStats>,
        statsApi.getErrorStats({ start_date, end_date }) as unknown as ErrorStatsResult,
        statsApi.getSalesOperationRanking({ start_date, end_date }) as unknown as SalesOperationRankingItem[],
        statsApi.getPromptVersionRanking({ start_date, end_date }) as unknown as PromptVersionRankingItem[],
      ])
      setOverview(ovRes || null)
      setDailyList((dailyRes?.results) || [])
      setAccuracyList((accRes?.results) || [])
      setErrorStats(errRes || null)
      setSoRanking(soRes || [])
      setPvRanking(pvRes || [])
    } catch {
      // fallback: try to get some data
      try {
        const ov = await statsApi.getOverviewStats() as unknown as OverviewStats
        setOverview(ov)
      } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadAllData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = () => loadAllData()
  const handleDateChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    if (dates && dates[0] && dates[1]) {
      setDateRange(dates as [Dayjs, Dayjs])
    }
  }

  const chartStyle = { height: 320 }

  const dates = useMemo(
    () => dailyList.map(d => dayjs(d.date).format('MM-DD')),
    [dailyList],
  )

  const sessionTrendOption = useMemo(() => ({
    title: { text: '会话量趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e8e8e8', textStyle: { color: '#333' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
    xAxis: {
      type: 'category', boundaryGap: false, data: dates.length ? dates : ['暂无数据'],
      axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#666' },
    },
    yAxis: {
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666' },
    },
    series: [{
      name: '会话数', type: 'line', smooth: true, symbol: 'circle', symbolSize: 6,
      lineStyle: { width: 3, color: '#1890ff' }, itemStyle: { color: '#1890ff' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(24, 144, 255, 0.3)' },
            { offset: 1, color: 'rgba(24, 144, 255, 0.02)' },
          ],
        },
      },
      data: dailyList.length ? dailyList.map(d => d.total_conversations) : [0],
    }],
  }), [dailyList, dates])

  const aiCallAccuracyOption = useMemo(() => ({
    title: { text: 'AI调用量与准确率趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#e8e8e8', textStyle: { color: '#333' }, axisPointer: { type: 'cross' } },
    legend: { data: ['AI调用量', '准确率'], top: 28 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: 70, containLabel: true },
    xAxis: [{ type: 'category', data: dates.length ? dates : ['暂无数据'], axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#666' } }],
    yAxis: [
      {
        type: 'value', name: '调用量', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666' },
      },
      {
        type: 'value', name: '准确率', min: 50, max: 100, interval: 10,
        axisLabel: { formatter: '{value}%', color: '#666' }, axisLine: { show: false },
        axisTick: { show: false }, splitLine: { show: false },
      },
    ],
    series: [
      {
        name: 'AI调用量', type: 'bar', barWidth: '40%',
        itemStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#69c0ff' }],
          },
          borderRadius: [4, 4, 0, 0],
        },
        data: dailyList.length ? dailyList.map(d => d.ai_suggestion_count) : [0],
      },
      {
        name: '准确率', type: 'line', yAxisIndex: 1, smooth: true, symbol: 'circle', symbolSize: 8,
        lineStyle: { width: 3, color: '#52c41a' }, itemStyle: { color: '#52c41a' },
        data: dailyList.length ? dailyList.map(d => d.ai_adoption_rate) : [0],
      },
    ],
  }), [dailyList, dates])

  const groupComparisonOption = useMemo(() => {
    const groups = soRanking.map(r => r.sales_operation)
    const calls = soRanking.map(r => r.total_calls)
    const accuracy = soRanking.map(r => r.accuracy_rate)
    return {
      title: { text: '销售运营分组对比', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
      tooltip: { trigger: 'axis' },
      legend: { data: ['AI调用数', '准确数', '准确率'], top: 28 },
      grid: { left: '3%', right: '4%', bottom: '3%', top: 70, containLabel: true },
      xAxis: {
        type: 'category', data: groups.length ? groups : ['暂无数据'],
        axisLine: { lineStyle: { color: '#e8e8e8' } }, axisLabel: { color: '#666' },
      },
      yAxis: {
        type: 'value', axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666' },
      },
      series: [
        {
          name: 'AI调用数', type: 'bar', barWidth: '25%',
          itemStyle: { color: '#1890ff', borderRadius: [4, 4, 0, 0] },
          data: calls.length ? calls : [0],
        },
        {
          name: '准确数', type: 'bar', barWidth: '25%',
          itemStyle: { color: '#52c41a', borderRadius: [4, 4, 0, 0] },
          data: soRanking.length ? soRanking.map(r => r.accurate_calls) : [0],
        },
        {
          name: '准确率', type: 'bar', barWidth: '25%',
          itemStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: '#722ed1' }, { offset: 1, color: '#b37feb' }],
            },
            borderRadius: [4, 4, 0, 0],
          },
          label: { show: true, position: 'top', formatter: '{c}%', color: '#666' },
          data: accuracy.length ? accuracy : [0],
        },
      ],
    }
  }, [soRanking])

  const errorTypeOption = useMemo(() => {
    const errorNameMap: Record<string, string> = {
      timeout: '超时', rate_limit: '限流', api_error: 'API错误',
      content_filter: '内容过滤', other: '其他',
    }
    const colorMap: Record<string, string> = {
      timeout: '#faad14', rate_limit: '#ff4d4f', api_error: '#722ed1',
      content_filter: '#13c2c2', other: '#8c8c8c',
    }
    const data = (errorStats?.errors || []).map(e => ({
      value: e.count,
      name: errorNameMap[e.error_type] || e.error_type_name || e.error_type,
      itemStyle: { color: colorMap[e.error_type] || '#8c8c8c' },
    }))
    return {
      title: { text: '调用异常原因分布', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#666' } },
      series: [{
        name: '错误类型', type: 'pie', radius: ['45%', '70%'], center: ['35%', '55%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        labelLine: { show: false },
        data: data.length ? data : [{ value: 1, name: '暂无数据', itemStyle: { color: '#d9d9d9' } }],
      }],
    }
  }, [errorStats])

  const versionRankOption = useMemo(() => {
    const sorted = [...pvRanking].sort((a, b) => a.accuracy_rate - b.accuracy_rate)
    const versions = sorted.map(r => r.prompt_version)
    const accuracy = sorted.map(r => r.accuracy_rate)
    return {
      title: { text: '提示词版本准确率排名', left: 'center', textStyle: { fontSize: 14, fontWeight: 500 } },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const param = params[0]
          const idx = versions.indexOf(param.name)
          const usage = sorted[idx]?.total_calls || 0
          return `${param.name}<br/>准确率: ${accuracy[idx]}%<br/>使用次数: ${usage.toLocaleString()}`
        },
      },
      grid: { left: '3%', right: '8%', bottom: '3%', top: 40, containLabel: true },
      xAxis: {
        type: 'value', min: 50, max: 100, axisLine: { show: false }, axisTick: { show: false },
        splitLine: { lineStyle: { color: '#f0f0f0' } }, axisLabel: { color: '#666', formatter: '{value}%' },
      },
      yAxis: {
        type: 'category', data: versions.length ? versions : ['暂无数据'], inverse: true,
        axisLine: { lineStyle: { color: '#e8e8e8' } }, axisTick: { show: false },
        axisLabel: { color: '#333', fontWeight: 500 },
      },
      series: [{
        name: '准确率', type: 'bar', barWidth: '50%',
        itemStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [{ offset: 0, color: '#9254de' }, { offset: 1, color: '#d3adf7' }] },
          borderRadius: [0, 4, 4, 0],
        },
        label: { show: true, position: 'right', formatter: '{c}%', color: '#666' },
        data: accuracy.length ? accuracy : [0],
      }],
    }
  }, [pvRanking])

  const exceptionColumns: ColumnsType<ExceptionItem> = [
    { title: '日期', dataIndex: 'date', key: 'date', width: 120 },
    {
      title: '错误类型', dataIndex: 'error_type', key: 'error_type', width: 140,
      render: (type: string) => {
        const colorMap: Record<string, string> = {
          timeout: 'orange', rate_limit: 'red', api_error: 'purple',
          content_filter: 'cyan', other: 'default',
        }
        const nameMap: Record<string, string> = {
          timeout: '超时', rate_limit: '限流', api_error: 'API错误',
          content_filter: '内容过滤', none: '无错误', other: '其他',
        }
        return <Tag color={colorMap[type] || 'default'}>{nameMap[type] || type}</Tag>
      },
    },
    { title: '数量', dataIndex: 'count', key: 'count', width: 100, sorter: (a, b) => a.count - b.count },
    {
      title: '占比', dataIndex: 'ratio', key: 'ratio', width: 120,
      render: (r: number) => `${r?.toFixed?.(1) ?? r}%`,
    },
  ]

  const exceptionData: ExceptionItem[] = useMemo(() => {
    const result: ExceptionItem[] = []
    let idx = 0
    accuracyList.forEach(a => {
      const date = dayjs(a.date).format('MM-DD')
      const errors = [
        { type: 'timeout', count: a.error_timeout },
        { type: 'rate_limit', count: a.error_rate_limit },
        { type: 'api_error', count: a.error_api_error },
        { type: 'content_filter', count: a.error_content_filter },
        { type: 'other', count: a.error_other },
      ]
      errors.forEach(e => {
        if (e.count > 0) {
          result.push({
            key: `${idx++}`, date, error_type: e.type,
            count: e.count, ratio: a.total_calls > 0 ? (e.count / a.total_calls) * 100 : 0,
          })
        }
      })
    })
    return result.sort((a, b) => b.count - a.count).slice(0, 20)
  }, [accuracyList])

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 16 }}>统计仪表盘</h2>

      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <Space wrap size="middle">
          <span style={{ color: '#666' }}>日期范围：</span>
          <RangePicker value={dateRange} onChange={handleDateChange} style={{ width: 260 }} />
          <Button type="primary" icon={<ReloadOutlined />} onClick={handleRefresh} style={{ marginLeft: 16 }}>
            刷新
          </Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="总会话数" value={overview?.total_conversations || 0} icon={<MessageOutlined />} color="#1890ff" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="总消息数" value={overview?.total_messages || 0} icon={<CommentOutlined />} color="#52c41a" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="AI调用次数" value={overview?.total_ai_calls || 0} icon={<RobotOutlined />} color="#722ed1" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="生成准确率" value={`${overview?.accuracy_rate ?? 0}%`} icon={<CheckCircleOutlined />} color="#13c2c2" loading={loading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="建议采纳率" value={`${overview?.ai_adoption_rate ?? 0}%`} icon={<BulbOutlined />} color="#fa8c16" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="待审核数量" value={overview?.total_reviews || 0} icon={<AuditOutlined />} color="#faad14" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="风险样本数" value={overview?.total_risks || 0} icon={<WarningOutlined />} color="#ff4d4f" loading={loading} />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <StatCard title="总Token消耗" value={(overview?.total_tokens || 0).toLocaleString()} icon={<RobotOutlined />} color="#eb2f96" loading={loading} />
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
          <Card style={{ borderRadius: 8 }}>
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
          <Card title="调用异常原因明细" style={{ borderRadius: 8 }} headStyle={{ fontSize: 14, fontWeight: 500 }}>
            <Spin spinning={loading}>
              <Table
                columns={exceptionColumns} dataSource={exceptionData}
                pagination={{ pageSize: 6, size: 'small' }} size="small"
              />
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Analytics
