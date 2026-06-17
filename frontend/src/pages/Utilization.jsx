import React, { useState, useEffect } from 'react'
import { Table, Button, Space, Select, DatePicker, Card, Statistic, Row, Col, App } from 'antd'
import { BarChartOutlined, ClockCircleOutlined, CheckCircleOutlined, RiseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { utilizationApi, equipmentApi } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker

const Utilization = () => {
  const [data, setData] = useState([])
  const [stats, setStats] = useState(null)
  const [summary, setSummary] = useState([])
  const [equipments, setEquipments] = useState([])
  const [loading, setLoading] = useState(false)
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
    fetchEquipments()
  }, [equipmentFilter, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (equipmentFilter) params.equipmentId = equipmentFilter
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }

      const [listRes, summaryRes] = await Promise.all([
        utilizationApi.getList(params),
        utilizationApi.getSummary(params),
      ])

      if (listRes.code === 200) {
        setData(listRes.data)
        setStats(listRes.stats)
      }
      if (summaryRes.code === 200) {
        setSummary(summaryRes.data)
      }
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchEquipments = async () => {
    const res = await equipmentApi.getList()
    if (res.code === 200) setEquipments(res.data)
  }

  const statusColor = (status) => {
    const colors = {
      IDLE: 'default',
      RUNNING: 'success',
      MAINTENANCE: 'warning',
      ERROR: 'error',
    }
    return colors[status] || 'default'
  }

  const statusText = (status) => {
    const texts = {
      IDLE: '空闲',
      RUNNING: '运行中',
      MAINTENANCE: '维护中',
      ERROR: '故障',
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '记录日期',
      dataIndex: 'recordDate',
      key: 'recordDate',
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '设备',
      key: 'equipment',
      render: (_, r) => r.equipment?.name || '-',
    },
    {
      title: '设备状态',
      key: 'equipmentStatus',
      render: (_, r) => (
        <span style={{ color: statusColor(r.equipment?.status) === 'success' ? '#52c41a' : statusColor(r.equipment?.status) === 'error' ? '#ff4d4f' : '#666' }}>
          {statusText(r.equipment?.status)}
        </span>
      ),
    },
    {
      title: '计划编号',
      key: 'plan',
      render: (_, r) => r.plan?.planNo || '-',
    },
    {
      title: '运行时间(分钟)',
      dataIndex: 'runTime',
      key: 'runTime',
      sorter: (a, b) => a.runTime - b.runTime,
    },
    {
      title: '停机时间(分钟)',
      dataIndex: 'stopTime',
      key: 'stopTime',
    },
    {
      title: '空闲时间(分钟)',
      dataIndex: 'idleTime',
      key: 'idleTime',
    },
    {
      title: '产量',
      dataIndex: 'outputQuantity',
      key: 'outputQuantity',
    },
    {
      title: '稼动率',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      render: (v) => `${v}%`,
      sorter: (a, b) => a.utilizationRate - b.utilizationRate,
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">设备稼动</h1>
      </div>

      {stats && (
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={12} md={6}>
            <Card className="card-stat">
              <Statistic
                title="总运行时间(分钟)"
                value={stats.totalRunTime}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="card-stat">
              <Statistic
                title="总停机时间(分钟)"
                value={stats.totalStopTime}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="card-stat">
              <Statistic
                title="总产量"
                value={stats.totalOutput}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card className="card-stat">
              <Statistic
                title="平均稼动率"
                value={stats.avgUtilizationRate}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
                prefix={<RiseOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="设备筛选"
            value={equipmentFilter || undefined}
            onChange={setEquipmentFilter}
            style={{ width: 150 }}
            allowClear
          >
            {equipments.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.name}
              </Option>
            ))}
          </Select>
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Card title="设备稼动汇总" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          {summary.map((item) => (
            <Col key={item.equipment.id} xs={24} sm={12} md={8} lg={6}>
              <Card size="small">
                <Card.Meta
                  title={item.equipment.name}
                  description={
                    <div>
                      <p style={{ margin: 0 }}>
                        运行时间：{item.totalRunTime} 分钟
                      </p>
                      <p style={{ margin: 0 }}>
                        产量：{item.totalOutput} 件
                      </p>
                      <p style={{ margin: 0, color: item.avgUtilizationRate >= 80 ? '#52c41a' : item.avgUtilizationRate >= 60 ? '#faad14' : '#ff4d4f' }}>
                        平均稼动率：{item.avgUtilizationRate}%
                      </p>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="稼动记录明细">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  )
}

export default Utilization
