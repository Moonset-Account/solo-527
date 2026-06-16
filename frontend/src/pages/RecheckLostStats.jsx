
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
  Descriptions,
  Button,
  Modal,
  List,
  Divider,
  Tooltip
} from 'antd'
import {
  BellOutlined,
  UserOutlined,
  UserSwitchOutlined,
  WarningOutlined,
  LineChartOutlined,
  PieChartOutlined,
  InfoCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TabPane } = Tabs

const RecheckLostStats = () => {
  const [clinicId, setClinicId] = useState(null)
  const [dateRange, setDateRange] = useState([dayjs().subtract(3, 'month'), dayjs()])
  const [modalType, setModalType] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)

  const clinics = [
    { id: 1, name: '总院口腔诊所' },
    { id: 2, name: '海淀分院' },
    { id: 3, name: '西城分院' }
  ]

  const recheckStats = {
    totalRecheck: 356,
    completedRecheck: 268,
    pendingRecheck: 72,
    recheckRate: 68.5,
    comparedLastPeriod: 5.2
  }

  const recheckTrend = []
  for (let i = 0; i < 12; i++) {
    const date = dayjs().subtract(11 - i, 'week')
    recheckTrend.push({
      week: `第${date.week()}周 (${date.format('MM/DD')})`,
      total: Math.floor(20 + Math.random() * 15),
      completed: Math.floor(15 + Math.random() * 12),
      rate: Math.floor(60 + Math.random() * 30)
    })
  }

  const recheckByDoctor = [
    { id: 1, doctorName: '张医生', totalPatients: 156, recheckCount: 120, recheckRate: 76.9 },
    { id: 2, doctorName: '李医生', totalPatients: 142, recheckCount: 98, recheckRate: 69.0 },
    { id: 3, doctorName: '王医生', totalPatients: 128, recheckCount: 86, recheckRate: 67.2 },
    { id: 4, doctorName: '赵医生', totalPatients: 94, recheckCount: 52, recheckRate: 55.3 }
  ]

  const lostStats = {
    totalLost: 86,
    thisMonthLost: 12,
    lostRate: 6.8,
    comparedLastPeriod: -1.5
  }

  const lostTrend = []
  for (let i = 5; i >= 0; i--) {
    const date = dayjs().subtract(i, 'month')
    lostTrend.push({
      month: date.format('YYYY-MM'),
      lostCount: Math.floor(8 + Math.random() * 10),
      newCount: Math.floor(40 + Math.random() * 30)
    })
  }

  const lostByReason = [
    { reason: '距离太远', count: 12, percentage: 24, color: '#f5222d', suggestion: '开通分院绿色通道或线上复诊服务' },
    { reason: '费用太高', count: 10, percentage: 20, color: '#fa8c16', suggestion: '推出套餐优惠、分期支付方案' },
    { reason: '服务不满意', count: 8, percentage: 16, color: '#faad14', suggestion: '加强员工培训，优化就诊流程' },
    { reason: '治疗效果不佳', count: 7, percentage: 14, color: '#722ed1', suggestion: '加强医疗质量管控，开展病例讨论' },
    { reason: '搬家/换工作', count: 6, percentage: 12, color: '#13c2c2', suggestion: '建立跨区域转诊合作机制' },
    { reason: '其他', count: 7, percentage: 14, color: '#8c8c8c', suggestion: '通过回访了解具体原因，持续优化' }
  ]

  const pendingRecheckPatients = [
    {
      id: 1,
      patientName: '李明',
      phone: '13900000010',
      age: 35,
      gender: '男',
      lastVisit: '2023-10-15',
      plannedRecheck: '2024-01-15',
      overdueDays: 1,
      doctorName: '张医生',
      diagnosis: '慢性牙周炎',
      lastTreatment: '牙周基础治疗'
    },
    {
      id: 2,
      patientName: '王静',
      phone: '13900000011',
      age: 28,
      gender: '女',
      lastVisit: '2023-09-20',
      plannedRecheck: '2024-01-10',
      overdueDays: 6,
      doctorName: '王医生',
      diagnosis: '牙列不齐',
      lastTreatment: '正畸调整'
    }
  ]

  const lostPatientsDetail = [
    {
      id: 1,
      patientName: '陈强',
      phone: '13900000020',
      age: 42,
      gender: '男',
      lastVisit: '2023-07-10',
      totalVisits: 8,
      lostMonths: 6,
      totalRevenue: 12580,
      reason: '搬家',
      lastDoctor: '张医生'
    },
    {
      id: 2,
      patientName: '刘梅',
      phone: '13900000021',
      age: 33,
      gender: '女',
      lastVisit: '2023-08-15',
      totalVisits: 5,
      lostMonths: 5,
      totalRevenue: 6800,
      reason: '服务不满意',
      lastDoctor: '李医生'
    }
  ]

  const openDetail = (type, patient) => {
    setModalType(type)
    setSelectedPatient(patient)
    setModalVisible(true)
  }

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <span style={{ fontWeight: 500 }}>诊所：</span>
          <Select
            placeholder="全部诊所"
            value={clinicId}
            onChange={setClinicId}
            style={{ width: 160 }}
            allowClear
          >
            {clinics.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
          <span style={{ fontWeight: 500 }}>统计区间：</span>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 260 }}
          />
          <Button type="primary">导出报表</Button>
        </Space>
      </Card>

      <Tabs defaultActiveKey="recheck" size="large">
        <TabPane
          tab={
            <Space>
              <BellOutlined />
              <span>复诊统计</span>
            </Space>
          }
          key="recheck"
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="复诊总数"
                  value={recheckStats.totalRecheck}
                  prefix={<BellOutlined style={{ color: '#1890ff' }} />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="已完成复诊"
                  value={recheckStats.completedRecheck}
                  prefix={<UserOutlined style={{ color: '#52c41a' }} />}
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="待复诊"
                  value={recheckStats.pendingRecheck}
                  prefix={<WarningOutlined style={{ color: '#faad14' }} />}
                  valueStyle={{ color: '#faad14' }}
                  extra={
                    <Button type="link" size="small" onClick={() => openDetail('pendingRecheck')}>
                      查看待复诊列表
                    </Button>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="复诊率"
                  value={recheckStats.recheckRate}
                  suffix="%"
                  prefix={<LineChartOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                  extra={
                    <Space>
                      {recheckStats.comparedLastPeriod >= 0 ? (
                        <span style={{ color: '#52c41a', fontSize: 12 }}>
                          <ArrowUpOutlined /> 较上期 {recheckStats.comparedLastPeriod}%
                        </span>
                      ) : (
                        <span style={{ color: '#f5222d', fontSize: 12 }}>
                          <ArrowDownOutlined /> 较上期 {Math.abs(recheckStats.comparedLastPeriod)}%
                        </span>
                      )}
                    </Space>
                  }
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title={
                <Space>
                  <LineChartOutlined />
                  <span>复诊趋势（按周）</span>
                </Space>
              }>
                <Table
                  dataSource={recheckTrend}
                  rowKey="week"
                  size="small"
                  pagination={false}
                  scroll={{ y: 360 }}
                >
                  <Table.Column title="周期" dataIndex="week" key="week" width: 140 />
                  <Table.Column title="计划复诊" dataIndex="total" key="total" width: 90 align="center" />
                  <Table.Column title="已完成" dataIndex="completed" key="completed" width: 90 align="center" />
                  <Table.Column
                    title="完成率"
                    dataIndex="rate"
                    key="rate"
                    render={(rate) => (
                      <Progress percent={rate} size="small" />
                    )}
                  />
                </Table>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={
                <Space>
                  <PieChartOutlined />
                  <span>医生复诊率排名</span>
                </Space>
              }>
                <Table
                  dataSource={recheckByDoctor}
                  rowKey="id"
                  size="small"
                  pagination={false}
                >
                  <Table.Column title="医生" dataIndex="doctorName" key="doctorName" />
                  <Table.Column title="接诊患者" dataIndex="totalPatients" key="totalPatients" align="center" />
                  <Table.Column title="复诊数" dataIndex="recheckCount" key="recheckCount" align="center" />
                  <Table.Column
                    title="复诊率"
                    dataIndex="recheckRate"
                    key="recheckRate"
                    render={(rate) => (
                      <Tooltip title={`复诊率 ${rate}%`}>
                        <Tag color={rate >= 70 ? 'green' : rate >= 60 ? 'blue' : 'orange'}>
                          {rate.toFixed(1)}%
                        </Tag>
                      </Tooltip>
                    )}
                    sorter={(a, b) => a.recheckRate - b.recheckRate}
                  />
                </Table>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane
          tab={
            <Space>
              <UserSwitchOutlined />
              <span>流失患者</span>
            </Space>
          }
          key="lost"
        >
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="累计流失"
                  value={lostStats.totalLost}
                  prefix={<UserSwitchOutlined style={{ color: '#f5222d' }} />}
                  valueStyle={{ color: '#f5222d' }}
                  extra={
                    <Button type="link" size="small" onClick={() => openDetail('lostPatients')}>
                      查看流失列表
                    </Button>
                  }
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="本月流失"
                  value={lostStats.thisMonthLost}
                  prefix={<WarningOutlined style={{ color: '#fa8c16' }} />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="患者流失率"
                  value={lostStats.lostRate}
                  suffix="%"
                  prefix={<PieChartOutlined style={{ color: '#722ed1' }} />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="环比变化"
                  value={Math.abs(lostStats.comparedLastPeriod)}
                  suffix="%"
                  valueStyle={{ color: lostStats.comparedLastPeriod < 0 ? '#52c41a' : '#f5222d' }}
                  prefix={lostStats.comparedLastPeriod < 0 ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title={
                <Space>
                  <PieChartOutlined />
                  <span>流失原因分析</span>
                </Space>
              }>
                <Space direction="vertical" style={{ width: '100%' }} size={16}>
                  {lostByReason.map(item => (
                    <div key={item.reason}>
                      <Row justify="space-between" style={{ marginBottom: 4 }}>
                        <Col span={12}>
                          <Space>
                            <Tag color={item.color} style={{ margin: 0 }}>{item.count} 人</Tag>
                            <span style={{ fontWeight: 500 }}>{item.reason}</span>
                            <Tooltip title={item.suggestion}>
                              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                            </Tooltip>
                          </Space>
                        </Col>
                        <Col span={4} style={{ textAlign: 'right' }}>
                          <span style={{ color: item.color, fontWeight: 600 }}>{item.percentage}%</span>
                        </Col>
                      </Row>
                      <Progress
                        percent={item.percentage}
                        showInfo={false}
                        strokeColor={item.color}
                        size="small"
                      />
                      <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                        💡 建议：{item.suggestion}
                      </div>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card title={
                <Space>
                  <LineChartOutlined />
                  <span>月度流失/新增趋势</span>
                </Space>
              }>
                <Table
                  dataSource={lostTrend}
                  rowKey="month"
                  size="small"
                  pagination={false}
                >
                  <Table.Column title="月份" dataIndex="month" key="month" width: 100 />
                  <Table.Column
                    title="新增患者"
                    dataIndex="newCount"
                    key="newCount"
                    align="center"
                    render={(v) => <Tag color="green">{v} 人</Tag>}
                  />
                  <Table.Column
                    title="流失患者"
                    dataIndex="lostCount"
                    key="lostCount"
                    align="center"
                    render={(v) => <Tag color="red">{v} 人</Tag>}
                  />
                  <Table.Column
                    title="净增长"
                    key="net"
                    align="center"
                    render={(_, record) => {
                      const net = record.newCount - record.lostCount
                      return (
                        <Tag color={net >= 0 ? 'green' : 'red'}>
                          {net >= 0 ? '+' : ''}{net} 人
                        </Tag>
                      )
                    }}
                  />
                </Table>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      <Modal
        title={modalType === 'pendingRecheck' ? '待复诊患者列表' : '流失患者详情'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>关闭</Button>,
          <Button key="export" type="primary">导出列表</Button>
        ]}
      >
        {modalType === 'pendingRecheck' && (
          <List
            dataSource={pendingRecheckPatients}
            renderItem={item => (
              <List.Item key={item.id}>
                <Card size="small" style={{ width: '100%' }}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="患者">{item.patientName}（{item.gender}，{item.age}岁）</Descriptions.Item>
                    <Descriptions.Item label="手机号">{item.phone}</Descriptions.Item>
                    <Descriptions.Item label="主治医生">{item.doctorName}</Descriptions.Item>
                    <Descriptions.Item label="上次就诊">{item.lastVisit}</Descriptions.Item>
                    <Descriptions.Item label="计划复诊">
                      <span style={{ color: '#f5222d', fontWeight: 600 }}>{item.plannedRecheck}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="逾期天数">
                      <Tag color="red">逾期 {item.overdueDays} 天</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="诊断" span={3}>{item.diagnosis}</Descriptions.Item>
                    <Descriptions.Item label="上次治疗" span={3}>{item.lastTreatment}</Descriptions.Item>
                  </Descriptions>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space>
                    <Button size="small" type="primary">发送短信提醒</Button>
                    <Button size="small">拨打电话</Button>
                    <Button size="small">安排复诊预约</Button>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
        {modalType === 'lostPatients' && (
          <List
            dataSource={lostPatientsDetail}
            renderItem={item => (
              <List.Item key={item.id}>
                <Card size="small" style={{ width: '100%' }}>
                  <Descriptions column={3} size="small">
                    <Descriptions.Item label="患者">{item.patientName}（{item.gender}，{item.age}岁）</Descriptions.Item>
                    <Descriptions.Item label="手机号">{item.phone}</Descriptions.Item>
                    <Descriptions.Item label="累计就诊">
                      <Tag color="blue">{item.totalVisits} 次</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="最后就诊">{item.lastVisit}</Descriptions.Item>
                    <Descriptions.Item label="流失时长">
                      <Tag color="red">{item.lostMonths} 个月</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="累计消费">
                      <span style={{ color: '#52c41a', fontWeight: 600 }}>¥{item.totalRevenue.toLocaleString()}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="流失原因" span={2}>
                      <Tag color="orange">{item.reason}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="主治医生">{item.lastDoctor}</Descriptions.Item>
                  </Descriptions>
                  <Divider style={{ margin: '8px 0' }} />
                  <Space>
                    <Button size="small" type="primary">发送召回活动</Button>
                    <Button size="small">电话回访</Button>
                    <Button size="small">查看完整病历</Button>
                  </Space>
                </Card>
              </List.Item>
            )}
          />
        )}
      </Modal>
    </div>
  )
}

export default RecheckLostStats
