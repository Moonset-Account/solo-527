import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Progress, App, Spin, Empty } from 'antd'
import {
  UserOutlined,
  ThunderboltOutlined,
  MessageOutlined,
  PhoneOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '../api'

const riskLevelColor = {
  low: '#52c41a',
  medium: '#faad14',
  high: '#fa8c16',
  critical: '#f5222d',
}

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const { message } = App.useApp()

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await api.dashboard.get(30)
      setData(res)
    } catch (e) {
      message.error('加载看板数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  if (loading) return (
    <div className="page-container">
      <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
    </div>
  )

  if (!data) return <div className="page-container"><Empty /></div>

  const { kpis, risk_trend, department_distribution, risk_level_distribution, top_error_samples, model_metrics_history } = data

  const trendOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: risk_trend.map(d => d.date?.slice(5) || ''),
      axisLabel: { fontSize: 11 },
    },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      name: '高风险占比',
      type: 'line',
      smooth: true,
      data: risk_trend.map(d => d.value),
      areaStyle: { opacity: 0.2 },
      lineStyle: { color: '#f5222d', width: 3 },
      itemStyle: { color: '#f5222d' },
    }],
  }

  const levelPieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['45%', '75%'],
      avoidLabelOverlap: true,
      label: { show: true, formatter: '{b}\n{d}%' },
      data: risk_level_distribution.map(d => ({
        name: d.level, value: d.count, itemStyle: { color: d.color }
      })),
    }],
  }

  const deptBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 110, right: 30, top: 20, bottom: 40 },
    xAxis: { type: 'value' },
    yAxis: { type: 'category', data: department_distribution.map(d => d.name) },
    series: [
      {
        name: '高风险数',
        type: 'bar',
        stack: 'total',
        data: department_distribution.map(d => d.high_risk),
        itemStyle: { color: '#f5222d' },
      },
      {
        name: '其他',
        type: 'bar',
        stack: 'total',
        data: department_distribution.map(d => d.total - d.high_risk),
        itemStyle: { color: '#e8e8e8' },
      },
    ],
  }

  const modelMetricsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['AUC', '准确率', 'F1'], top: 0 },
    grid: { left: 50, right: 30, top: 40, bottom: 40 },
    xAxis: {
      type: 'category',
      data: model_metrics_history.map(m => m.version),
      axisLabel: { fontSize: 11, rotate: 30 },
    },
    yAxis: { type: 'value', min: 0, max: 1 },
    series: [
      { name: 'AUC', type: 'line', data: model_metrics_history.map(m => m.auc || 0), smooth: true, color: '#1677ff' },
      { name: '准确率', type: 'line', data: model_metrics_history.map(m => m.accuracy || 0), smooth: true, color: '#52c41a' },
      { name: 'F1', type: 'line', data: model_metrics_history.map(m => m.f1 || 0), smooth: true, color: '#722ed1' },
    ],
  }

  const errColumns = [
    { title: '预约号', dataIndex: 'appointment_no', key: 'no', width: 120 },
    { title: '科室', dataIndex: 'department_name', key: 'dept', width: 110 },
    { title: '原始等级', dataIndex: 'original_risk_level', key: 'orig', width: 100,
      render: v => v ? <Tag color={riskLevelColor[v]}>{v}</Tag> : '-' },
    { title: '修正等级', dataIndex: 'corrected_risk_level', key: 'corr', width: 100,
      render: v => v ? <Tag color={riskLevelColor[v]}>{v}</Tag> : '-' },
    { title: '错误类型', dataIndex: 'error_type', key: 'et', width: 140 },
    { title: '原因', dataIndex: 'reason', key: 'rs', ellipsis: true },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card className="kpi-card">
            <Statistic
              title={<><UserOutlined /> 总预约数（30天）</>}
              value={kpis.total_appointments}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="kpi-card">
            <Statistic
              title={<><ThunderboltOutlined /> 高/极高风险</>}
              value={kpis.high_risk_count}
              valueStyle={{ color: '#f5222d' }}
              suffix={<Tag color="red" style={{ marginLeft: 8 }}>
                {kpis.total_scored ? `${(kpis.high_risk_count / kpis.total_scored * 100).toFixed(1)}%` : '0%'}
              </Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="kpi-card">
            <Statistic
              title={<><MessageOutlined /> 短信已发送</>}
              value={kpis.sms_sent_count}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="kpi-card">
            <Statistic
              title={<><PhoneOutlined /> 待回访/已完成</>}
              value={kpis.callbacks_pending}
              valueStyle={{ color: '#fa8c16' }}
              suffix={<span style={{ fontSize: 14, color: '#52c41a', marginLeft: 8 }}>
                <CheckCircleOutlined /> {kpis.callbacks_completed}
              </span>}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="预测效果指标" className="card-shadow">
            <Row gutter={16}>
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={kpis.precision_rate || 0}
                  status={kpis.precision_rate >= 70 ? 'success' : 'exception'}
                  format={p => `${p}%`}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <RiseOutlined style={{ color: '#52c41a' }} /> 精准率
                </div>
              </Col>
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={kpis.recall_rate || 0}
                  format={p => `${p}%`}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>召回率</div>
              </Col>
              <Col span={8}>
                <Progress
                  type="dashboard"
                  percent={kpis.actual_no_show_count ? Math.round((1 - kpis.actual_no_show_count / kpis.total_appointments) * 100) : 100}
                  status="active"
                  format={p => `${p}%`}
                />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <FallOutlined style={{ color: '#f5222d' }} /> 就诊率
                </div>
              </Col>
            </Row>
            <Row style={{ marginTop: 16 }}>
              <Col span={12}>
                <div><ExclamationCircleOutlined style={{ color: '#faad14' }} /> 实际爽约数：
                  <span style={{ color: '#f5222d', fontWeight: 600 }}>{kpis.actual_no_show_count}</span>
                </div>
              </Col>
              <Col span={12}>
                <div><ThunderboltOutlined style={{ color: '#f5222d' }} /> 预测高风险：
                  <span style={{ color: '#f5222d', fontWeight: 600 }}>{kpis.predicted_no_show_count}</span>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="风险等级分布" className="card-shadow">
            <ReactECharts option={levelPieOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="高风险占比趋势（30天）" className="card-shadow">
            <ReactECharts option={trendOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="各科室风险分布" className="card-shadow">
            <ReactECharts option={deptBarOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>

        <Col xs={24}>
          <Card title="模型性能历史版本" className="card-shadow">
            <ReactECharts option={modelMetricsOption} style={{ height: 320 }} notMerge />
          </Card>
        </Col>

        <Col xs={24}>
          <Card title={`近期错误样本 TOP ${top_error_samples?.length || 0}`} className="card-shadow">
            <Table
              size="small"
              dataSource={top_error_samples}
              columns={errColumns}
              rowKey="id"
              pagination={false}
              locale={{ emptyText: '暂无错误样本，继续积累数据...' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
