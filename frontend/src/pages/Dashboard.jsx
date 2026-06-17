import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, App } from 'antd'
import {
  DesktopOutlined,
  FileTextOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { equipmentApi, workOrderApi, planApi, utilizationApi } from '../services/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    equipment: 0,
    equipmentRunning: 0,
    workOrder: 0,
    plan: 0,
    planInProgress: 0,
    planCompleted: 0,
  })
  const [recentPlans, setRecentPlans] = useState([])
  const [equipmentStatus, setEquipmentStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const { message } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [equipmentRes, workOrderRes, planRes, utilizationRes] = await Promise.all([
        equipmentApi.getList(),
        workOrderApi.getList(),
        planApi.getList(),
        utilizationApi.getList(),
      ])

      if (equipmentRes.code === 200) {
        const equipments = equipmentRes.data
        setEquipmentStatus(equipments)
        setStats((prev) => ({
          ...prev,
          equipment: equipments.length,
          equipmentRunning: equipments.filter((e) => e.status === 'RUNNING').length,
        }))
      }

      if (workOrderRes.code === 200) {
        setStats((prev) => ({ ...prev, workOrder: workOrderRes.data.length }))
      }

      if (planRes.code === 200) {
        const plans = planRes.data
        setRecentPlans(plans.slice(0, 10))
        setStats((prev) => ({
          ...prev,
          plan: plans.length,
          planInProgress: plans.filter((p) => p.status === 'IN_PROGRESS').length,
          planCompleted: plans.filter((p) => p.status === 'COMPLETED').length,
        }))
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
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

  const planStatusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      CONFIRMED: 'blue',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      CANCELLED: 'error',
    }
    return colors[status] || 'default'
  }

  const planStatusText = (status) => {
    const texts = {
      DRAFT: '草稿',
      CONFIRMED: '已确认',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    }
    return texts[status] || status
  }

  const equipmentColumns = [
    {
      title: '设备编码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusColor(s)}>{statusText(s)}</Tag>,
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location',
    },
  ]

  const planColumns = [
    {
      title: '计划编号',
      dataIndex: 'planNo',
      key: 'planNo',
    },
    {
      title: '工单',
      dataIndex: ['workOrder', 'orderNo'],
      key: 'orderNo',
    },
    {
      title: '设备',
      dataIndex: ['equipment', 'name'],
      key: 'equipment',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={planStatusColor(s)}>{planStatusText(s)}</Tag>,
    },
    {
      title: '计划时间',
      key: 'time',
      render: (_, r) => (
        <span>
          {dayjs(r.plannedStart).format('MM-DD HH:mm')} ~{' '}
          {dayjs(r.plannedEnd).format('MM-DD HH:mm')}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">首页概览</h1>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card className="card-stat">
            <Statistic
              title="设备总数"
              value={stats.equipment}
              prefix={<DesktopOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-stat">
            <Statistic
              title="运行中设备"
              value={stats.equipmentRunning}
              valueStyle={{ color: '#3f8600' }}
              prefix={<PlayCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-stat">
            <Statistic
              title="生产工单"
              value={stats.workOrder}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="card-stat">
            <Statistic
              title="生产计划"
              value={stats.plan}
              prefix={<ScheduleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card className="card-stat">
            <Statistic
              title="进行中计划"
              value={stats.planInProgress}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="card-stat">
            <Statistic
              title="已完成计划"
              value={stats.planCompleted}
              valueStyle={{ color: '#3f8600' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card className="card-stat">
            <Statistic
              title="待处理返工"
              value={0}
              valueStyle={{ color: '#cf1322' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col lg={12}>
          <Card title="设备状态" loading={loading}>
            <Table
              columns={equipmentColumns}
              dataSource={equipmentStatus}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
        <Col lg={12}>
          <Card title="最近计划" loading={loading}>
            <Table
              columns={planColumns}
              dataSource={recentPlans}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
