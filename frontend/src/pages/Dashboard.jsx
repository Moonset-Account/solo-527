import React, { useState, useEffect } from 'react'
import { Row, Col, Statistic, Card, Table, Tag, Space } from 'antd'
import {
  WarningOutlined,
  AlertOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  RiseOutlined,
} from '@ant-design/icons'
import { anomalyApi, delayApi, approvalApi, efficiencyApi } from '@/services/api'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [anomalyStats, setAnomalyStats] = useState({})
  const [delayStats, setDelayStats] = useState({})
  const [approvalStats, setApprovalStats] = useState({})
  const [efficiencyData, setEfficiencyData] = useState(null)
  const [recentAnomalies, setRecentAnomalies] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [anomaly, delay, approval, efficiency, anomalies] = await Promise.all([
        anomalyApi.getStats(),
        delayApi.getStats(),
        approvalApi.getStats(),
        efficiencyApi.getDashboard({}),
        anomalyApi.getList({ size: 5, page: 0 }),
      ])
      setAnomalyStats(anomaly || {})
      setDelayStats(delay || {})
      setApprovalStats(approval || {})
      setEfficiencyData(efficiency || {})
      setRecentAnomalies(anomalies?.content || anomalies || [])
    } catch (error) {
      console.error('加载看板数据失败', error)
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

  const anomalyColumns = [
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      render: (text) => <strong>{text}</strong>,
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (text, record) => text ? `${text}: ${record.dimensionValue}` : '-',
    },
    {
      title: '偏离率',
      dataIndex: 'deviationRate',
      key: 'deviationRate',
      render: (text) => <span style={{ color: text < 0 ? '#ff4d4f' : '#52c41a' }}>{text}%</span>,
    },
    {
      title: '严重程度',
      dataIndex: 'severity',
      key: 'severity',
      render: (text) => <Tag color={getSeverityColor(text)}>{getSeverityText(text)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (text) => <Tag color={getStatusColor(text)}>{getStatusText(text)}</Tag>,
    },
    {
      title: '异常时间',
      dataIndex: 'anomalyTime',
      key: 'anomalyTime',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
  ]

  return (
    <div>
      <div className="dashboard-grid">
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa8c16' }} />
                待处理异常
              </Space>
            }
            value={anomalyStats.pending || 0}
            valueStyle={{ color: '#fa8c16' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <AlertOutlined style={{ color: '#1890ff' }} />
                处理中异常
              </Space>
            }
            value={anomalyStats.handling || 0}
            valueStyle={{ color: '#1890ff' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
                已解决异常
              </Space>
            }
            value={anomalyStats.resolved || 0}
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
                延迟数据集
              </Space>
            }
            value={delayStats.delayed || 0}
            valueStyle={{ color: '#ff4d4f' }}
            suffix="个"
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <FileTextOutlined style={{ color: '#722ed1' }} />
                待审批申请
              </Space>
            }
            value={approvalStats.pending || 0}
            valueStyle={{ color: '#722ed1' }}
          />
        </Card>
        <Card className="stat-card">
          <Statistic
            title={
              <Space>
                <RiseOutlined style={{ color: '#13c2c2' }} />
                报表成功率
              </Space>
            }
            value={efficiencyData?.successRate || '0.00'}
            valueStyle={{ color: '#13c2c2' }}
            suffix="%"
          />
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="报表生成效率概览" loading={loading}>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="总生成次数"
                  value={efficiencyData?.totalGenerationCount || 0}
                  valueStyle={{ fontSize: 24 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="平均生成耗时"
                  value={efficiencyData?.avgGenerationTimeMs || 0}
                  valueStyle={{ fontSize: 24 }}
                  suffix="ms"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="成功次数"
                  value={efficiencyData?.successCount || 0}
                  valueStyle={{ color: '#52c41a', fontSize: 20 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="失败次数"
                  value={efficiencyData?.failCount || 0}
                  valueStyle={{ color: '#ff4d4f', fontSize: 20 }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="按报表统计" loading={loading}>
            <Table
              dataSource={efficiencyData?.byReport || []}
              pagination={false}
              size="small"
              rowKey="reportName"
              columns={[
                { title: '报表名称', dataIndex: 'reportName', key: 'reportName' },
                {
                  title: '平均耗时',
                  dataIndex: 'avgGenerationTimeMs',
                  key: 'avgGenerationTimeMs',
                  render: (v) => `${v}ms`,
                  sorter: (a, b) => a.avgGenerationTimeMs - b.avgGenerationTimeMs,
                },
                {
                  title: '生成次数',
                  dataIndex: 'totalCount',
                  key: 'totalCount',
                  sorter: (a, b) => a.totalCount - b.totalCount,
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Card
        title="最近异常记录"
        style={{ marginTop: 16 }}
        loading={loading}
        extra={<a href="#/anomalies">查看全部</a>}
      >
        <Table
          dataSource={recentAnomalies?.content || recentAnomalies}
          pagination={false}
          columns={anomalyColumns}
          rowKey="id"
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
    </div>
  )
}
