import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Table,
  Tag,
  Space,
  Button,
  Tabs,
  Progress,
  List,
  Avatar,
  Divider,
} from 'antd'
import {
  RiseOutlined,
  CalendarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { statsApi } from '../services'

const { RangePicker } = DatePicker
const { Option } = Select

function StatsPage() {
  const [overview, setOverview] = useState({})
  const [returnVisitData, setReturnVisitData] = useState([])
  const [utilizationData, setUtilizationData] = useState([])
  const [doctorRanking, setDoctorRanking] = useState([])
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState('month')
  const [dateRange, setDateRange] = useState(null)
  const [clinicId, setClinicId] = useState(null)

  useEffect(() => {
    loadAllStats()
  }, [period, dateRange, clinicId])

  const loadAllStats = async () => {
    setLoading(true)
    try {
      const params = {}
      if (clinicId) params.clinicId = clinicId
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].toISOString()
        params.endDate = dateRange[1]?.toISOString()
      }

      const [overviewData, returnData, utilData, rankingData] = await Promise.all([
        statsApi.overview(params),
        statsApi.returnVisit({ ...params, period }),
        statsApi.slotUtilization({ ...params, period }),
        statsApi.doctorRanking(params),
      ])

      setOverview(overviewData)
      setReturnVisitData(returnData)
      setUtilizationData(utilData)
      setDoctorRanking(rankingData)
    } catch (err) {
      console.error('加载统计数据失败', err)
    } finally {
      setLoading(false)
    }
  }

  const maxReturnRate = Math.max(...returnVisitData.map((d) => d.rate), 0)
  const maxUtilization = Math.max(...utilizationData.map((d) => d.utilizationRate), 0)

  const rankingColumns = [
    {
      title: '排名',
      dataIndex: 'rank',
      width: 60,
      render: (_, __, index) => {
        const rank = index + 1
        if (rank === 1) return <Tag color="gold">🥇 第1名</Tag>
        if (rank === 2) return <Tag color="silver">🥈 第2名</Tag>
        if (rank === 3) return <Tag color="bronze">🥉 第3名</Tag>
        return <span style={{ color: '#888' }}>第{rank}名</span>
      },
    },
    {
      title: '医生',
      dataIndex: 'name',
      width: 100,
      render: (v, record) => (
        <Space>
          <Avatar size="small">{v?.[0]}</Avatar>
          <span>{v}</span>
        </Space>
      ),
    },
    {
      title: '职称',
      dataIndex: 'title',
      width: 100,
    },
    {
      title: '专长',
      dataIndex: 'specialty',
      width: 100,
    },
    {
      title: '总就诊量',
      dataIndex: 'totalAppointments',
      width: 100,
      render: (v) => <strong>{v}</strong>,
    },
    {
      title: '复诊量',
      dataIndex: 'returnVisits',
      width: 100,
      render: (v) => <span style={{ color: '#13c2c2' }}>{v}</span>,
    },
    {
      title: '复诊率',
      dataIndex: 'returnRate',
      width: 150,
      render: (v) => (
        <Progress percent={v} size="small" strokeColor="#13c2c2" format={(p) => `${p}%`} />
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 500 }}>统计周期:</span>
          <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
            <Option value="day">按日</Option>
            <Option value="week">按周</Option>
            <Option value="month">按月</Option>
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Button type="primary" icon={<BarChartOutlined />} onClick={loadAllStats}>
            查询
          </Button>
          <div style={{ flex: 1 }} />
          <Select
            placeholder="选择诊所"
            style={{ width: 150 }}
            allowClear
            value={clinicId}
            onChange={setClinicId}
          >
            <Option value={1}>总店</Option>
          </Select>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #e6fffb 0%, #b5f5ec 100%)' }}>
              <Statistic
                title={<span style={{ color: '#08979c' }}>总预约量</span>}
                value={overview.totalAppointments || 0}
                valueStyle={{ color: '#08979c' }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #f6ffed 0%, #d9f7be 100%)' }}>
              <Statistic
                title={<span style={{ color: '#389e0d' }}>已完成</span>}
                value={overview.completedAppointments || 0}
                valueStyle={{ color: '#389e0d' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)' }}>
              <Statistic
                title={<span style={{ color: '#d46b08' }}>复诊率</span>}
                value={overview.returnRate || 0}
                suffix="%"
                valueStyle={{ color: '#d46b08' }}
                prefix={<RiseOutlined />}
              />
              <div style={{ fontSize: 12, color: '#d46b08', marginTop: 4 }}>
                复诊 {overview.returnVisits || 0} 人
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card className="stat-card" bordered={false} style={{ background: 'linear-gradient(135deg, #f9f0ff 0%, #d3adf7 100%)' }}>
              <Statistic
                title={<span style={{ color: '#531dab' }}>患者总数</span>}
                value={overview.totalPatients || 0}
                valueStyle={{ color: '#531dab' }}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '24px 0' }} />

        <Tabs
          defaultActiveKey="return"
          items={[
            { key: 'return', label: '复诊率趋势' },
            { key: 'utilization', label: '号源利用率' },
            { key: 'ranking', label: '医生排行' },
          ]}
        >
          <div style={{ padding: '16px 0' }}>
            <Row gutter={[16, 16]}>
              {returnVisitData.map((item) => (
                <Col span={12} key={item.date}>
                  <Card size="small">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontWeight: 500 }}>{item.date}</span>
                      <Tag color="cyan">{item.rate}%</Tag>
                    </div>
                    <Progress
                      percent={item.rate}
                      strokeColor="#13c2c2"
                      trailColor="#f0f0f0"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 12, color: '#888' }}>
                      <span>总就诊: {item.total}</span>
                      <span>复诊: {item.return}</span>
                    </div>
                  </Card>
                </Col>
              ))}
              {returnVisitData.length === 0 && (
                <Col span={24} style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                  暂无数据
                </Col>
              )}
            </Row>
          </div>
        </Tabs>

        <Divider style={{ margin: '24px 0' }} />

        <Card title="医生工作量排行" size="small">
          <Table
            columns={rankingColumns}
            dataSource={doctorRanking}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>

        <Divider style={{ margin: '24px 0' }} />

        <Row gutter={16}>
          <Col span={12}>
            <Card title="号源利用率趋势" size="small">
              <List
                size="small"
                dataSource={utilizationData}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={item.date}
                      description={
                        <div>
                          <Progress
                            percent={item.utilizationRate}
                            size="small"
                            strokeColor="#faad14"
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#888', marginTop: 4 }}>
                            <span>总号源: {item.totalSlots}</span>
                            <span>已预约: {item.bookedSlots}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="关键指标" size="small">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                <div className="patient-quick-info">
                  <div className="info-item">
                    <span className="label">总预约数:</span>
                    <span className="value" style={{ fontSize: 18, fontWeight: 600, color: '#13c2c2' }}>
                      {overview.totalAppointments || 0}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">完成率:</span>
                    <span className="value">
                      {overview.totalAppointments
                        ? (((overview.completedAppointments || 0) / overview.totalAppointments) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">取消数:</span>
                    <span className="value" style={{ color: '#ff4d4f' }}>
                      {overview.cancelledAppointments || 0}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">爽约数:</span>
                    <span className="value" style={{ color: '#faad14' }}>
                      {overview.noShowAppointments || 0}
                    </span>
                  </div>
                </div>

                <div className="patient-quick-info" style={{ background: '#f6ffed' }}>
                  <div className="info-item">
                    <span className="label">患者总数:</span>
                    <span className="value" style={{ fontSize: 16, fontWeight: 600, color: '#389e0d' }}>
                      {overview.totalPatients || 0}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="label">复诊人数:</span>
                    <span className="value">{overview.returnVisits || 0}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">复诊率:</span>
                    <span className="value" style={{ color: '#389e0d', fontWeight: 500 }}>
                      {overview.returnRate || 0}%
                    </span>
                  </div>
                </div>

                <div style={{ padding: 12, background: '#fffbe6', borderRadius: 8, fontSize: 12, color: '#d46b08' }}>
                  <RiseOutlined /> 提示：复诊率是衡量诊所服务质量和患者满意度的重要指标，建议持续跟踪。
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default StatsPage
