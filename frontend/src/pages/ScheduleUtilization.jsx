
import React, { useState } from 'react'
import {
  Row,
  Col,
  Card,
  Statistic,
  DatePicker,
  Select,
  Table,
  Tag,
  Space,
  Progress,
  Tabs,
  Tooltip,
  Divider
} from 'antd'
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const ScheduleUtilization = () => {
  const [clinicId, setClinicId] = useState(null)
  const [doctorId, setDoctorId] = useState(null)
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'day'), dayjs().add(30, 'day')])

  const clinics = [
    { id: 1, name: '总院口腔诊所' },
    { id: 2, name: '海淀分院' },
    { id: 3, name: '西城分院' }
  ]

  const doctors = [
    { id: 1, name: '张医生', title: '主任医师', department: '口腔内科' },
    { id: 2, name: '李医生', title: '副主任医师', department: '口腔修复科' },
    { id: 3, name: '王医生', title: '主治医师', department: '口腔正畸科' },
    { id: 4, name: '赵医生', title: '主任医师', department: '口腔种植科' }
  ]

  const overallStats = {
    totalSlots: 2880,
    bookedSlots: 2016,
    utilizationRate: 70.0,
    availableSlots: 864,
    closedSlots: 144
  }

  const byStatus = [
    { status: 'Available', statusText: '可预约', count: 72, percentage: 30.0, color: '#52c41a' },
    { status: 'PartiallyBooked', statusText: '部分预约', count: 96, percentage: 40.0, color: '#1890ff' },
    { status: 'FullyBooked', statusText: '已满', count: 48, percentage: 20.0, color: '#fa8c16' },
    { status: 'Closed', statusText: '停诊', count: 24, percentage: 10.0, color: '#8c8c8c' }
  ]

  const byDoctor = [
    { id: 1, doctorName: '张医生', department: '口腔内科', totalSlots: 720, bookedSlots: 576, utilizationRate: 80.0 },
    { id: 2, doctorName: '李医生', department: '口腔修复科', totalSlots: 720, bookedSlots: 504, utilizationRate: 70.0 },
    { id: 3, doctorName: '王医生', department: '口腔正畸科', totalSlots: 720, bookedSlots: 540, utilizationRate: 75.0 },
    { id: 4, doctorName: '赵医生', department: '口腔种植科', totalSlots: 720, bookedSlots: 396, utilizationRate: 55.0 }
  ]

  const trendData = []
  for (let i = 30; i >= 0; i -= 3) {
    const date = dayjs().subtract(i, 'day')
    const totalSlots = 96
    const bookedSlots = Math.floor(50 + Math.random() * 40)
    trendData.push({
      date: date.format('MM-DD'),
      totalSlots,
      bookedSlots,
      utilizationRate: Math.round((bookedSlots / totalSlots) * 100)
    })
  }

  const slotHistory = [
    {
      id: 1,
      date: dayjs().format('YYYY-MM-DD'),
      doctorName: '张医生',
      timeRange: '09:00-12:00',
      totalSlots: 12,
      bookedSlots: 10,
      availableSlots: 2,
      status: 'PartiallyBooked',
      statusText: '部分预约',
      utilizationRate: 83.3,
      appointments: [
        { id: 101, patientName: '张明', time: '09:00-09:30', status: 'Completed', statusText: '已完成' },
        { id: 102, patientName: '李华', time: '09:30-10:00', status: 'Completed', statusText: '已完成' },
        { id: 103, patientName: '王芳', time: '10:00-10:30', status: 'InProgress', statusText: '进行中' },
        { id: 104, patientName: '赵强', time: '10:30-11:00', status: 'Confirmed', statusText: '已确认' },
        { id: 105, patientName: '孙丽', time: '11:00-11:30', status: 'Pending', statusText: '待确认' }
      ]
    },
    {
      id: 2,
      date: dayjs().format('YYYY-MM-DD'),
      doctorName: '张医生',
      timeRange: '14:00-17:00',
      totalSlots: 12,
      bookedSlots: 12,
      availableSlots: 0,
      status: 'FullyBooked',
      statusText: '已满',
      utilizationRate: 100
    },
    {
      id: 3,
      date: dayjs().format('YYYY-MM-DD'),
      doctorName: '李医生',
      timeRange: '09:00-12:00',
      totalSlots: 12,
      bookedSlots: 6,
      availableSlots: 6,
      status: 'PartiallyBooked',
      statusText: '部分预约',
      utilizationRate: 50.0
    }
  ]

  const getStatusIcon = (status) => {
    const map = {
      Available: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      PartiallyBooked: <ClockCircleOutlined style={{ color: '#1890ff' }} />,
      FullyBooked: <CloseCircleOutlined style={{ color: '#fa8c16' }} />,
      Closed: <PauseCircleOutlined style={{ color: '#8c8c8c' }} />
    }
    return map[status] || null
  }

  const getStatusColor = (status) => {
    const map = {
      Available: 'green',
      PartiallyBooked: 'blue',
      FullyBooked: 'orange',
      Closed: 'default'
    }
    return map[status] || 'default'
  }

  const getAppointmentStatusColor = (status) => {
    const map = {
      Pending: 'gold',
      Confirmed: 'blue',
      InProgress: 'processing',
      Completed: 'green',
      Cancelled: 'default',
      NoShow: 'red'
    }
    return map[status] || 'default'
  }

  const historyColumns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      fixed: 'left'
    },
    {
      title: '医生',
      dataIndex: 'doctorName',
      key: 'doctorName',
      width: 90
    },
    {
      title: '时段',
      dataIndex: 'timeRange',
      key: 'timeRange',
      width: 110
    },
    {
      title: '总号源',
      dataIndex: 'totalSlots',
      key: 'totalSlots',
      width: 70,
      align: 'center'
    },
    {
      title: '已预约',
      dataIndex: 'bookedSlots',
      key: 'bookedSlots',
      width: 70,
      align: 'center'
    },
    {
      title: '可预约',
      dataIndex: 'availableSlots',
      key: 'availableSlots',
      width: 70,
      align: 'center'
    },
    {
      title: '利用率',
      dataIndex: 'utilizationRate',
      key: 'utilizationRate',
      width: 140,
      render: (rate) => (
        <Progress
          percent={rate}
          size="small"
          status={rate >= 90 ? 'success' : rate >= 70 ? 'active' : 'exception'}
        />
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {record.statusText}
        </Tag>
      )
    }
  ]

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <span style={{ fontWeight: 500 }}>诊所：</span>
          <Select
            placeholder="全部诊所"
            value={clinicId}
            onChange={(v) => { setClinicId(v); setDoctorId(null) }}
            style={{ width: 160 }}
            allowClear
          >
            {clinics.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
          <span style={{ fontWeight: 500 }}>医生：</span>
          <Select
            placeholder="全部医生"
            value={doctorId}
            onChange={setDoctorId}
            style={{ width: 180 }}
            allowClear
          >
            {doctors.map(d => <Option key={d.id} value={d.id}>{d.name} - {d.title}</Option>)}
          </Select>
          <span style={{ fontWeight: 500 }}>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 260 }}
          />
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="号源总数"
              value={overallStats.totalSlots}
              prefix={<CalendarOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已预约"
              value={overallStats.bookedSlots}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="可预约"
              value={overallStats.availableSlots}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="整体利用率"
              value={overallStats.utilizationRate}
              suffix="%"
              prefix={<BarChartOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Tabs defaultActiveKey="status" size="large">
        <TabPane
          tab={
            <Space>
              <PauseCircleOutlined />
              <span>按状态回看</span>
            </Space>
          }
          key="status"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="号源状态分布">
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {byStatus.map(item => (
                    <div key={item.status}>
                      <Row justify="space-between" style={{ marginBottom: 4 }}>
                        <Col>
                          <Space>
                            {getStatusIcon(item.status)}
                            <span style={{ fontWeight: 500 }}>{item.statusText}</span>
                            <Tag color={getStatusColor(item.status)}>{item.count} 个时段</Tag>
                          </Space>
                        </Col>
                        <Col>
                          <span style={{ color: item.color, fontWeight: 600 }}>{item.percentage.toFixed(1)}%</span>
                        </Col>
                      </Row>
                      <Progress
                        percent={item.percentage}
                        showInfo={false}
                        strokeColor={item.color}
                        size="small"
                      />
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="号源时段明细">
                <Table
                  columns={historyColumns}
                  dataSource={slotHistory}
                  rowKey="id"
                  size="small"
                  pagination={{ pageSize: 5 }}
                  expandable={{
                    expandedRowRender: (record) => (
                      record.appointments && record.appointments.length > 0 ? (
                        <div style={{ padding: '8px 24px' }}>
                          <Divider orientation="left" style={{ margin: '8px 0' }}>时段内预约明细</Divider>
                          <Row gutter={[16, 8]}>
                            {record.appointments.map(apt => (
                              <Col span={8} key={apt.id}>
                                <Card size="small" type="inner">
                                  <Descriptions column={1} size="small">
                                    <Descriptions.Item label="时间">{apt.time}</Descriptions.Item>
                                    <Descriptions.Item label="患者">{apt.patientName}</Descriptions.Item>
                                    <Descriptions.Item label="状态">
                                      <Tag color={getAppointmentStatusColor(apt.status)}>{apt.statusText}</Tag>
                                    </Descriptions.Item>
                                  </Descriptions>
                                </Card>
                              </Col>
                            ))}
                          </Row>
                        </div>
                      ) : <div style={{ padding: 16, color: '#8c8c8c', textAlign: 'center' }}>暂无预约明细</div>
                    )
                  }}
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <TeamOutlined />
              <span>按医生统计</span>
            </Space>
          }
          key="doctor"
        >
          <Card>
            <Table
              dataSource={byDoctor}
              rowKey="id"
              size="middle"
              pagination={false}
            >
              <Table.Column title="医生" dataIndex="doctorName" key="doctorName" />
              <Table.Column title="科室" dataIndex="department" key="department" />
              <Table.Column title="总号源" dataIndex="totalSlots" key="totalSlots" align="center" />
              <Table.Column title="已预约" dataIndex="bookedSlots" key="bookedSlots" align="center" />
              <Table.Column
                title="利用率"
                dataIndex="utilizationRate"
                key="utilizationRate"
                render={(rate) => (
                  <Tooltip title={`利用率：${rate}%`}>
                    <Progress
                      percent={rate}
                      status={rate >= 80 ? 'success' : rate >= 60 ? 'active' : 'exception'}
                    />
                  </Tooltip>
                )}
              />
            </Table>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <BarChartOutlined />
              <span>趋势分析</span>
            </Space>
          }
          key="trend"
        >
          <Card title="号源利用率趋势（每3天）">
            <Table
              dataSource={trendData}
              rowKey="date"
              size="small"
              pagination={false}
            >
              <Table.Column title="日期" dataIndex="date" key="date" width: 100 />
              <Table.Column title="总号源" dataIndex="totalSlots" key="totalSlots" width: 100 align="center" />
              <Table.Column title="已预约" dataIndex="bookedSlots" key="bookedSlots" width: 100 align="center" />
              <Table.Column
                title="利用率"
                dataIndex="utilizationRate"
                key="utilizationRate"
                render={(rate) => (
                  <Progress
                    percent={rate}
                    size="small"
                    status={rate >= 80 ? 'success' : rate >= 60 ? 'active' : 'exception'}
                  />
                )}
              />
            </Table>
          </Card>
        </TabPane>
      </Tabs>
    </div>
  )
}

export default ScheduleUtilization
