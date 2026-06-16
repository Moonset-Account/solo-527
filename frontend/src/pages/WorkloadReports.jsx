
import React, { useState, useEffect } from 'react'
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
  Button,
  Descriptions,
  Modal,
  Tooltip,
  Divider,
  List,
  Empty,
  Spin
} from 'antd'
import {
  TeamOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  BellOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  CalendarOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
  ExportOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { getWorkloadReports, getDoctors } from '../services/api'

const { RangePicker } = DatePicker
const { Option } = Select

const clinics = [
  { id: 1, name: '总院口腔诊所' },
  { id: 2, name: '海淀分院' },
  { id: 3, name: '西城分院' }
]

const dayOfWeekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

const WorkloadReports = () => {
  const [clinicId, setClinicId] = useState(null)
  const [doctorId, setDoctorId] = useState(null)
  const [dateRange, setDateRange] = useState([dayjs().subtract(6, 'day'), dayjs()])
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports, setReports] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [doctorsLoading, setDoctorsLoading] = useState(false)

  useEffect(() => {
    const fetchDoctors = async () => {
      setDoctorsLoading(true)
      try {
        const res = await getDoctors({ pageSize: 100 })
        const data = res.data || []
        const list = Array.isArray(data) ? data : (data.items || [])
        setDoctors(list)
      } catch {
        setDoctors([])
      } finally {
        setDoctorsLoading(false)
      }
    }
    fetchDoctors()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {}
      if (clinicId) params.clinicId = clinicId
      if (doctorId) params.doctorId = doctorId
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getWorkloadReports(params)
      const data = res.data || []
      const list = Array.isArray(data) ? data : (data.items || [])
      setReports(list)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const filteredReports = reports.filter(r => {
    if (clinicId && r.clinicId !== clinicId) return false
    if (doctorId && r.doctorId !== doctorId) return false
    return true
  })

  const summaryStats = {
    totalWorkload: filteredReports.length,
    avgWorkloadScore: filteredReports.length > 0
      ? Math.round(filteredReports.reduce((sum, r) => sum + r.workloadScore, 0) / filteredReports.length * 10) / 10
      : 0,
    totalAppointments: filteredReports.reduce((sum, r) => sum + r.totalAppointments, 0),
    completedFollowUps: filteredReports.reduce((sum, r) => sum + r.completedFollowUps, 0),
    overdueFollowUps: filteredReports.reduce((sum, r) => sum + r.overdueFollowUps, 0),
    totalRevenue: filteredReports.reduce((sum, r) => sum + r.totalRevenue, 0)
  }

  const getDoctorInfo = (doctorId) => doctors.find(d => d.id === doctorId) || {}

  const openDetail = (report) => {
    setSelectedReport(report)
    setDetailModalVisible(true)
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#52c41a'
    if (score >= 75) return '#1890ff'
    if (score >= 60) return '#fa8c16'
    return '#f5222d'
  }

  const getScoreStatus = (score) => {
    if (score >= 90) return 'success'
    if (score >= 75) return 'active'
    if (score >= 60) return 'normal'
    return 'exception'
  }

  const getScoreTag = (score) => {
    if (score >= 90) return { color: 'green', text: '优秀' }
    if (score >= 75) return { color: 'blue', text: '良好' }
    if (score >= 60) return { color: 'orange', text: '合格' }
    return { color: 'red', text: '待提升' }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'reportDate',
      key: 'reportDate',
      width: 110,
      fixed: 'left',
      render: (date) => (
        <Space direction="vertical" size={0}>
          <span style={{ fontWeight: 600 }}>{date}</span>
          <span style={{ fontSize: 12, color: '#8c8c8c' }}>{dayOfWeekMap[dayjs(date).day()]}</span>
        </Space>
      )
    },
    {
      title: '医生',
      key: 'doctor',
      width: 160,
      render: (_, record) => {
        const doc = getDoctorInfo(record.doctorId)
        return (
          <Space direction="vertical" size={0}>
            <Space>
              <UserOutlined style={{ color: '#1890ff' }} />
              <span style={{ fontWeight: 500 }}>{record.doctorName}</span>
              {doc.title && <Tag color="purple" style={{ fontSize: 11 }}>{doc.title}</Tag>}
            </Space>
            {doc.department && <span style={{ fontSize: 12, color: '#8c8c8c', paddingLeft: 20 }}>{doc.department}</span>}
          </Space>
        )
      }
    },
    {
      title: '诊所',
      dataIndex: 'clinicName',
      key: 'clinicName',
      width: 110,
      render: (name) => <Tag color="cyan">{name}</Tag>
    },
    {
      title: '预约情况',
      key: 'appointments',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <span>总计</span>
            <Tag color="blue">{record.totalAppointments}</Tag>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>|</span>
            <span style={{ fontSize: 12 }}>完成</span>
            <Tag color="green">{record.completedAppointments}</Tag>
          </Space>
          <Progress
            percent={record.totalAppointments > 0 ? Math.round(record.completedAppointments / record.totalAppointments * 100) : 0}
            size="small"
            showInfo={false}
          />
          <Space size={4} style={{ fontSize: 12 }}>
            <Tag color="default">取消 {record.cancelledAppointments}</Tag>
          </Space>
        </Space>
      )
    },
    {
      title: '爽约',
      dataIndex: 'noShowAppointments',
      key: 'noShowAppointments',
      width: 80,
      align: 'center',
      render: (v) => (
        <Tag color={v > 0 ? 'red' : 'default'}>{v}</Tag>
      ),
      sorter: (a, b) => a.noShowAppointments - b.noShowAppointments
    },
    {
      title: '随访情况',
      key: 'followups',
      width: 170,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Space size={4}>
            <span>总数</span>
            <Tag color="purple">{record.followUpCount}</Tag>
            <span style={{ color: '#8c8c8c', fontSize: 12 }}>|</span>
            <span style={{ fontSize: 12 }}>完成</span>
            <Tag color="green">{record.completedFollowUps}</Tag>
          </Space>
          <Progress
            percent={record.followUpCount > 0 ? Math.round(record.completedFollowUps / record.followUpCount * 100) : 0}
            size="small"
            showInfo={false}
            strokeColor="#722ed1"
          />
          {record.overdueFollowUps > 0 && (
            <Tag color="red" icon={<ExclamationCircleOutlined />} style={{ fontSize: 12 }}>
              逾期 {record.overdueFollowUps}
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '营收',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 100,
      align: 'right',
      render: (v) => (
        <Space>
          <DollarOutlined style={{ color: '#52c41a' }} />
          <span style={{ fontWeight: 600, color: '#52c41a' }}>¥{v.toLocaleString()}</span>
        </Space>
      ),
      sorter: (a, b) => a.totalRevenue - b.totalRevenue
    },
    {
      title: '负荷评分',
      dataIndex: 'workloadScore',
      key: 'workloadScore',
      width: 140,
      render: (score) => {
        const tag = getScoreTag(score)
        return (
          <Space direction="vertical" size={2} style={{ width: '100%' }}>
            <Progress
              percent={score}
              size="small"
              status={getScoreStatus(score)}
              strokeColor={getScoreColor(score)}
            />
            <Space justify="space-between" style={{ width: '100%' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(score) }}>
                {score} 分
              </span>
              <Tag color={tag.color} style={{ fontSize: 11, margin: 0 }}>{tag.text}</Tag>
            </Space>
          </Space>
        )
      },
      sorter: (a, b) => a.workloadScore - b.workloadScore
    },
    {
      title: '数据来源',
      key: 'source',
      width: 130,
      render: (_, record) => (
        <Tooltip title={record.syncedAtText || ''}>
          <Tag color={record.syncSource && record.syncSource.includes('随访') ? 'cyan' : 'default'}>
            <ReloadOutlined /> {record.syncSource}
          </Tag>
        </Tooltip>
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Button type="link" size="small" icon={<FileTextOutlined />} onClick={() => openDetail(record)}>
          详情
        </Button>
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
            loading={doctorsLoading}
          >
            {doctors.map(d => <Option key={d.id} value={d.id}>{d.name} - {d.title}</Option>)}
          </Select>
          <span style={{ fontWeight: 500 }}>日期范围：</span>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            style={{ width: 260 }}
          />
          <Button type="primary" icon={<BarChartOutlined />} onClick={fetchReports} loading={loading}>查询</Button>
          <Button icon={<ExportOutlined />}>导出报表</Button>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="统计天数"
              value={dateRange ? dateRange[1].diff(dateRange[0], 'day') + 1 : 0}
              suffix="天"
              prefix={<CalendarOutlined style={{ color: '#13c2c2' }} />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="平均负荷评分"
              value={summaryStats.avgWorkloadScore}
              suffix="分"
              prefix={<ThunderboltOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总预约数"
              value={summaryStats.totalAppointments}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="随访完成"
              value={summaryStats.completedFollowUps}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="逾期随访"
              value={summaryStats.overdueFollowUps}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="总营收"
              value={summaryStats.totalRevenue}
              prefix="¥"
              precision={0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card title="医生负荷评分排名" size="small">
            <Spin spinning={loading}>
              {doctors.map((doc, idx) => {
                const doctorReports = filteredReports.filter(r => r.doctorId === doc.id)
                const avgScore = doctorReports.length > 0
                  ? Math.round(doctorReports.reduce((sum, r) => sum + r.workloadScore, 0) / doctorReports.length)
                  : 0
                const totalRevenue = doctorReports.reduce((sum, r) => sum + r.totalRevenue, 0)
                const tag = getScoreTag(avgScore)
                return (
                  <div key={doc.id} style={{ padding: idx < doctors.length - 1 ? '0 0 12px 0' : 0, borderBottom: idx < doctors.length - 1 ? '1px dashed #f0f0f0' : 'none', marginBottom: idx < doctors.length - 1 ? 12 : 0 }}>
                    <Row align="middle" gutter={[8, 8]}>
                      <Col span={10}>
                        <Space>
                          <span style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            backgroundColor: idx < 3 ? (idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : '#cd7f32') : '#f0f0f0',
                            color: idx < 3 ? '#fff' : '#8c8c8c',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            fontWeight: 600
                          }}>{idx + 1}</span>
                          <span style={{ fontWeight: 500 }}>{doc.name}</span>
                        </Space>
                      </Col>
                      <Col span={14}>
                        <Progress
                          percent={avgScore}
                          size="small"
                          strokeColor={getScoreColor(avgScore)}
                          status={getScoreStatus(avgScore)}
                        />
                      </Col>
                    </Row>
                    <Row justify="space-between" style={{ marginTop: 4, paddingLeft: 30 }}>
                      <Col>
                        <Tag color={tag.color} style={{ fontSize: 11 }}>{tag.text}</Tag>
                        <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>{doc.department}</span>
                      </Col>
                      <Col>
                        <span style={{ fontSize: 12, fontWeight: 600, color: getScoreColor(avgScore) }}>{avgScore} 分</span>
                        <span style={{ fontSize: 12, color: '#52c41a', marginLeft: 12 }}>¥{totalRevenue.toLocaleString()}</span>
                      </Col>
                    </Row>
                  </div>
                )
              })}
            </Spin>
          </Card>
        </Col>
        <Col span={16}>
          <Card
            title="排班负荷报表明细"
            size="small"
            extra={
              <Tooltip title="随访办结后会自动同步到当天的排班负荷报表">
                <Tag color="cyan" icon={<ReloadOutlined />}>
                  实时同步
                </Tag>
              </Tooltip>
            }
          >
            {filteredReports.length > 0 ? (
              <Table
                columns={columns}
                dataSource={filteredReports}
                rowKey="id"
                size="small"
                scroll={{ x: 1380 }}
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            ) : (
              <Empty description="暂无符合条件的报表数据" />
            )}
          </Card>
        </Col>
      </Row>

      <Modal
        title={
          <Space>
            <BarChartOutlined style={{ color: '#1890ff' }} />
            <span>排班负荷详情</span>
            {selectedReport && (
              <Tag color={getScoreTag(selectedReport.workloadScore).color}>
                {selectedReport.workloadScore} 分 - {getScoreTag(selectedReport.workloadScore).text}
              </Tag>
            )}
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        width={820}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
          <Button key="export" type="primary" icon={<ExportOutlined />}>导出详情</Button>
        ]}
      >
        {selectedReport && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions bordered column={3} size="small">
              <Descriptions.Item label="日期">
                <strong>{selectedReport.reportDate}</strong>（{dayOfWeekMap[dayjs(selectedReport.reportDate).day()]}）
              </Descriptions.Item>
              <Descriptions.Item label="医生">
                <Space>
                  {selectedReport.doctorName}
                  {getDoctorInfo(selectedReport.doctorId).title && (
                    <Tag color="purple">{getDoctorInfo(selectedReport.doctorId).title}</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="科室">{getDoctorInfo(selectedReport.doctorId).department || '-'}</Descriptions.Item>
              <Descriptions.Item label="诊所">
                <Tag color="cyan">{selectedReport.clinicName}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="数据来源">
                <Tag color={selectedReport.syncSource && selectedReport.syncSource.includes('随访') ? 'cyan' : 'default'}>
                  <ReloadOutlined /> {selectedReport.syncSource}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="同步时间">{selectedReport.syncedAtText || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: 0 }}>关键指标</Divider>

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="总预约数"
                    value={selectedReport.totalAppointments}
                    prefix={<CalendarOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: 22 }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="完成预约"
                    value={selectedReport.completedAppointments}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: 22 }}
                    suffix={
                      <span style={{ fontSize: 12 }}>
                        / {selectedReport.totalAppointments}
                        （{selectedReport.totalAppointments > 0 ? Math.round(selectedReport.completedAppointments / selectedReport.totalAppointments * 100) : 0}%）
                      </span>
                    }
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="当日营收"
                    value={selectedReport.totalRevenue}
                    prefix="¥"
                    valueStyle={{ color: '#fa8c16', fontSize: 22 }}
                  />
                </Card>
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="预约完成情况">
                  <List
                    size="small"
                    dataSource={[
                      { label: '完成预约', value: selectedReport.completedAppointments, color: 'green', icon: <CheckCircleOutlined /> },
                      { label: '取消预约', value: selectedReport.cancelledAppointments, color: 'default', icon: <CloseCircleOutlined /> },
                      { label: '患者爽约', value: selectedReport.noShowAppointments, color: 'red', icon: <ExclamationCircleOutlined /> }
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <Space>
                          <span style={{ color: item.color === 'default' ? '#8c8c8c' : undefined }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Space>
                        <Tag color={item.color}>{item.value} 次</Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  title={
                    <Space>
                      <BellOutlined style={{ color: '#722ed1' }} />
                      <span>随访完成情况</span>
                    </Space>
                  }
                >
                  <List
                    size="small"
                    dataSource={[
                      { label: '随访总数', value: selectedReport.followUpCount, color: 'purple' },
                      { label: '已完成随访', value: selectedReport.completedFollowUps, color: 'green', note: '办结后自动同步到此报表' },
                      { label: '逾期随访', value: selectedReport.overdueFollowUps, color: 'red' }
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <Space>
                          <span>{item.label}</span>
                          {item.note && (
                            <Tooltip title={item.note}>
                              <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                            </Tooltip>
                          )}
                        </Space>
                        <Tag color={item.color}>{item.value} 次</Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            <Divider orientation="left" style={{ margin: 0 }}>负荷评分构成</Divider>

            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {(() => {
                  const aptScore = selectedReport.totalAppointments * 5
                  const completionRate = selectedReport.totalAppointments > 0 ? selectedReport.completedAppointments / selectedReport.totalAppointments : 0
                  const completionScore = completionRate * 30
                  const fuScore = selectedReport.followUpCount * 3
                  const fuCompletionRate = selectedReport.followUpCount > 0 ? selectedReport.completedFollowUps / selectedReport.followUpCount : 0
                  const fuCompletionScore = fuCompletionRate * 20
                  const revenueScore = (selectedReport.totalRevenue / 1000) * 2
                  const items = [
                    { name: '预约量得分', score: aptScore, max: 50, desc: `${selectedReport.totalAppointments}次 × 5分/次`, color: '#1890ff' },
                    { name: '预约完成率得分', score: Math.round(completionScore), max: 30, desc: `${Math.round(completionRate * 100)}% × 30分`, color: '#52c41a' },
                    { name: '随访量得分', score: fuScore, max: 30, desc: `${selectedReport.followUpCount}次 × 3分/次`, color: '#722ed1' },
                    { name: '随访完成率得分', score: Math.round(fuCompletionScore), max: 20, desc: `${Math.round(fuCompletionRate * 100)}% × 20分`, color: '#13c2c2' },
                    { name: '营收贡献得分', score: Math.round(revenueScore), max: 20, desc: `¥${selectedReport.totalRevenue}/1000 × 2`, color: '#fa8c16' }
                  ]
                  return items.map(item => (
                    <div key={item.name}>
                      <Row justify="space-between" style={{ marginBottom: 4 }}>
                        <Col>
                          <Space>
                            <span style={{
                              display: 'inline-block',
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              backgroundColor: item.color
                            }} />
                            <span style={{ fontWeight: 500 }}>{item.name}</span>
                            <span style={{ fontSize: 12, color: '#8c8c8c' }}>（{item.desc}）</span>
                          </Space>
                        </Col>
                        <Col>
                          <span style={{ fontSize: 13, fontWeight: 600, color: item.color }}>
                            {item.score} 分
                          </span>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>/{item.max}</span>
                        </Col>
                      </Row>
                      <Progress
                        percent={Math.round(item.score / item.max * 100)}
                        showInfo={false}
                        size="small"
                        strokeColor={item.color}
                        trailColor="#f0f0f0"
                      />
                    </div>
                  ))
                })()}
                <Divider style={{ margin: '8px 0' }} />
                <Row justify="space-between" align="middle">
                  <Col>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>综合负荷评分</span>
                    <Tag color={getScoreTag(selectedReport.workloadScore).color} style={{ marginLeft: 12 }}>
                      {getScoreTag(selectedReport.workloadScore).text}
                    </Tag>
                  </Col>
                  <Col>
                    <span style={{
                      fontSize: 28,
                      fontWeight: 700,
                      color: getScoreColor(selectedReport.workloadScore)
                    }}>
                      {selectedReport.workloadScore}
                    </span>
                    <span style={{ fontSize: 14, color: '#8c8c8c' }}>/100 分</span>
                  </Col>
                </Row>
              </Space>
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default WorkloadReports
