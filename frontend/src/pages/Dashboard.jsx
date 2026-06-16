
import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Table, Tag, Space } from 'antd'
import {
  CalendarOutlined,
  BellOutlined,
  UserAddOutlined,
  DollarOutlined,
  UserOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const Dashboard = () => {
  const [stats, setStats] = useState({
    todayAppointments: 18,
    pendingFollowUps: 23,
    overdueFollowUps: 5,
    todayNewPatients: 12,
    todayRevenue: 25800,
    activeDoctors: 5,
    totalPatients: 1258,
    lostPatients: 86
  })

  const [recentAppointments] = useState([
    { id: 1, patientName: '张明', doctorName: '张医生', time: '09:30-10:00', status: 'Confirmed', type: 'Initial' },
    { id: 2, patientName: '李华', doctorName: '张医生', time: '10:00-10:30', status: 'Confirmed', type: 'Recheck' },
    { id: 3, patientName: '王芳', doctorName: '王医生', time: '14:00-14:30', status: 'Pending', type: 'FollowUp' },
    { id: 4, patientName: '赵强', doctorName: '李医生', time: '14:30-15:00', status: 'Completed', type: 'Treatment' },
    { id: 5, patientName: '孙丽', doctorName: '赵医生', time: '15:30-16:00', status: 'Pending', type: 'Initial' }
  ])

  const [overdueFollowUps] = useState([
    { id: 1, patientName: '李华', type: 'RegularCheck', plannedDate: '2024-01-15', responsiblePerson: '王护士', overdueDays: 1 },
    { id: 2, patientName: '陈伟', type: 'AfterTreatment', plannedDate: '2024-01-14', responsiblePerson: '李护士', overdueDays: 2 },
    { id: 3, patientName: '周杰', type: 'Postoperative', plannedDate: '2024-01-13', responsiblePerson: '王护士', overdueDays: 3 }
  ])

  const statusMap = {
    Pending: { color: 'gold', text: '待确认' },
    Confirmed: { color: 'blue', text: '已确认' },
    InProgress: { color: 'processing', text: '进行中' },
    Completed: { color: 'green', text: '已完成' },
    Cancelled: { color: 'default', text: '已取消' }
  }

  const appointmentTypeMap = {
    Initial: '初诊',
    Recheck: '复诊',
    FollowUp: '随访',
    Treatment: '治疗'
  }

  const followUpTypeMap = {
    AfterTreatment: '治疗后随访',
    Postoperative: '术后随访',
    RegularCheck: '定期检查'
  }

  const appointmentColumns = [
    { title: '患者', dataIndex: 'patientName', key: 'patientName' },
    { title: '医生', dataIndex: 'doctorName', key: 'doctorName' },
    { title: '时间', dataIndex: 'time', key: 'time' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => appointmentTypeMap[type] || type
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const s = statusMap[status]
        return <Tag color={s?.color}>{s?.text}</Tag>
      }
    }
  ]

  const followUpColumns = [
    { title: '患者', dataIndex: 'patientName', key: 'patientName' },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => followUpTypeMap[type] || type
    },
    { title: '计划日期', dataIndex: 'plannedDate', key: 'plannedDate' },
    { title: '负责人', dataIndex: 'responsiblePerson', key: 'responsiblePerson' },
    {
      title: '逾期天数',
      dataIndex: 'overdueDays',
      key: 'overdueDays',
      render: (days) => <Tag color="red">逾期 {days} 天</Tag>
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日预约"
              value={stats.todayAppointments}
              prefix={<CalendarOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待随访"
              value={stats.pendingFollowUps}
              prefix={<BellOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="逾期随访"
              value={stats.overdueFollowUps}
              prefix={<WarningOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日营收"
              value={stats.todayRevenue}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              precision={2}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="在职医生"
              value={stats.activeDoctors}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="患者总数"
              value={stats.totalPatients}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="流失患者"
              value={stats.lostPatients}
              prefix={<UserAddOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Card title="今日预约列表" extra={<a href="#/appointment-booking">查看全部</a>}>
            <Table
              columns={appointmentColumns}
              dataSource={recentAppointments}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#f5222d' }} />
                <span>逾期随访提醒</span>
              </Space>
            }
            extra={<a href="#/follow-ups">处理全部</a>}
          >
            <Table
              columns={followUpColumns}
              dataSource={overdueFollowUps}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
