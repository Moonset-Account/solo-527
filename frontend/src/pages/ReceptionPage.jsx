import React, { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Input,
  Button,
  Select,
  DatePicker,
  Tag,
  List,
  Avatar,
  Drawer,
  Descriptions,
  Timeline,
  Space,
  Form,
  InputNumber,
  Modal,
  message,
  Tabs,
  Divider,
  Statistic,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  UserAddOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BellOutlined,
  HistoryOutlined,
  PlusOutlined,
  CheckOutlined,
  ClockCircleOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { patientApi, doctorApi, scheduleApi, appointmentApi, recordApi, followUpApi } from '../services'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select

function ReceptionPage() {
  const [doctors, setDoctors] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [patientSearchText, setPatientSearchText] = useState('')
  const [patientList, setPatientList] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [patientDrawerOpen, setPatientDrawerOpen] = useState(false)
  const [appointModalOpen, setAppointModalOpen] = useState(false)
  const [appointForm] = Form.useForm()
  const [todayAppointments, setTodayAppointments] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadDoctors()
    loadTodayAppointments()
  }, [])

  useEffect(() => {
    if (selectedDoctor) {
      loadSchedules(selectedDoctor)
    } else {
      setSchedules([])
    }
  }, [selectedDoctor, selectedDate])

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.list()
      setDoctors(data)
      if (data.length > 0) {
        setSelectedDoctor(data[0].id)
      }
    } catch (err) {
      console.error('加载医生失败', err)
    }
  }

  const loadSchedules = async (doctorId) => {
    try {
      const data = await scheduleApi.list({
        doctorId,
        startDate: selectedDate.startOf('day').toISOString(),
        endDate: selectedDate.endOf('day').toISOString(),
      })
      setSchedules(data)
      if (data.length > 0) {
        setSelectedSchedule(data[0])
        setSelectedSlot(null)
      } else {
        setSelectedSchedule(null)
        setSelectedSlot(null)
      }
    } catch (err) {
      console.error('加载排班失败', err)
    }
  }

  const loadTodayAppointments = async () => {
    try {
      const data = await appointmentApi.list({
        startDate: dayjs().startOf('day').toISOString(),
        endDate: dayjs().endOf('day').toISOString(),
        pageSize: 50,
      })
      setTodayAppointments(data.list || [])
    } catch (err) {
      console.error('加载今日预约失败', err)
    }
  }

  const searchPatients = async (value) => {
    if (!value) {
      setPatientList([])
      return
    }
    try {
      const data = await patientApi.list({ name: value, pageSize: 10 })
      setPatientList(data.list || [])
    } catch (err) {
      console.error('搜索患者失败', err)
    }
  }

  const selectPatient = async (patient) => {
    try {
      const detail = await patientApi.get(patient.id)
      setSelectedPatient(detail)
      setPatientDrawerOpen(true)
    } catch (err) {
      message.error('加载患者详情失败')
    }
  }

  const openAppointModal = () => {
    if (!selectedPatient) {
      message.warning('请先选择患者')
      return
    }
    if (!selectedSlot) {
      message.warning('请先选择号源')
      return
    }
    appointForm.setFieldsValue({
      patientName: selectedPatient.name,
      doctorName: selectedSchedule?.doctor?.name,
      time: `${selectedSlot.startTime} - ${selectedSlot.endTime}`,
    })
    setAppointModalOpen(true)
  }

  const handleAppointSubmit = async () => {
    try {
      const values = await appointForm.validateFields()
      await appointmentApi.create({
        patientId: selectedPatient.id,
        doctorId: selectedDoctor,
        clinicId: selectedSchedule?.clinicId || 1,
        scheduleId: selectedSchedule?.id,
        timeSlotId: selectedSlot?.id,
        appointDate: selectedDate.toISOString(),
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        chiefComplaint: values.chiefComplaint,
        source: '线下',
        remark: values.remark,
        operatorName: '管理员',
      })
      message.success('预约成功')
      setAppointModalOpen(false)
      appointForm.resetFields()
      loadSchedules(selectedDoctor)
      loadTodayAppointments()
    } catch (err) {
      message.error(err.response?.data?.error || '预约失败')
    }
  }

  const handleSlotClick = (schedule, slot) => {
    if (slot.status === 'booked' || slot.status === 'cancelled') return
    setSelectedSchedule(schedule)
    setSelectedSlot(slot)
  }

  const getStatusTag = (status) => {
    const statusMap = {
      pending: { color: 'orange', text: '待确认' },
      confirmed: { color: 'green', text: '已确认' },
      completed: { color: 'blue', text: '已完成' },
      cancelled: { color: 'default', text: '已取消' },
      no_show: { color: 'red', text: '爽约' },
    }
    const cfg = statusMap[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const getSlotStatusClass = (status) => {
    const map = {
      available: 'available',
      booked: 'booked',
      cancelled: 'cancelled',
    }
    return map[status] || 'available'
  }

  return (
    <div>
      <Row gutter={16}>
        <Col span={8}>
          <Card
            title={
              <div className="card-header">
                <h3>
                  <UserAddOutlined /> 患者选择
                </h3>
              </div>
            }
            style={{ marginBottom: 16 }}
          >
            <Input.Search
              placeholder="搜索患者姓名或手机号"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={searchPatients}
              value={patientSearchText}
              onChange={(e) => {
                setPatientSearchText(e.target.value)
                if (!e.target.value) setPatientList([])
              }}
            />
            {patientList.length > 0 && (
              <List
                style={{ marginTop: 12, maxHeight: 400, overflow: 'auto' }}
                dataSource={patientList}
                renderItem={(patient) => (
                  <List.Item
                    key={patient.id}
                    onClick={() => selectPatient(patient)}
                    style={{ cursor: 'pointer' }}
                    hoverable
                  >
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserAddOutlined />} />}
                      title={
                        <Space>
                          {patient.name}
                          <Tag color={patient.gender === 'male' ? 'blue' : 'pink'}>
                            {patient.gender === 'male' ? '男' : '女'}
                          </Tag>
                          {patient._count?.appointments > 0 && (
                            <Tag color="purple">复诊</Tag>
                          )}
                        </Space>
                      }
                      description={
                        <Space size="large">
                          <span>{patient.phone}</span>
                          <span>{patient._count?.appointments || 0}次就诊</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
            {selectedPatient && (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  background: '#e6fffb',
                  borderRadius: 8,
                  border: '1px solid #87e8de',
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8 }}>
                  当前患者: {selectedPatient.name}
                  <Button
                    type="link"
                    size="small"
                    onClick={() => setPatientDrawerOpen(true)}
                  >
                    查看详情
                  </Button>
                </div>
                <Space size="large" style={{ fontSize: 13 }}>
                  <span>
                    {selectedPatient.gender === 'male' ? '男' : '女'}
                  </span>
                  <span>{selectedPatient.phone}</span>
                  <span>
                    就诊 {selectedPatient.appointments?.length || 0} 次
                  </span>
                </Space>
              </div>
            )}
          </Card>

          <Card
            title={
              <div className="card-header">
                <h3>
                  <ClockCircleOutlined /> 今日预约
                </h3>
                <Tag color="cyan">{todayAppointments.length} 位</Tag>
              </div>
            }
            style={{ height: 'calc(100vh - 480px)', overflow: 'auto' }}
          >
            {todayAppointments.length === 0 ? (
              <Empty description="暂无今日预约" />
            ) : (
              <List
                size="small"
                dataSource={todayAppointments}
                renderItem={(appt) => (
                  <List.Item key={appt.id}>
                    <List.Item.Meta
                      avatar={<Avatar size="small">{appt.patient?.name?.[0]}</Avatar>}
                      title={
                        <Space>
                          <span style={{ fontSize: 13 }}>{appt.patient?.name}</span>
                          {getStatusTag(appt.status)}
                        </Space>
                      }
                      description={
                        <span style={{ fontSize: 12 }}>
                          {appt.startTime} · {appt.doctor?.name} · {appt.chiefComplaint?.slice(0, 10)}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col span={16}>
          <Card title={<h3 style={{ margin: 0 }}><CalendarOutlined /> 预约挂号</h3>}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Space wrap>
                <span>医生:</span>
                <Select
                  style={{ width: 200 }}
                  value={selectedDoctor}
                  onChange={setSelectedDoctor}
                  placeholder="选择医生"
                >
                  {doctors.map((doc) => (
                    <Option key={doc.id} value={doc.id}>
                      {doc.name} - {doc.title} ({doc.specialty})
                    </Option>
                  ))}
                </Select>

                <span>日期:</span>
                <DatePicker
                  value={selectedDate}
                  onChange={(date) => date && setSelectedDate(date)}
                  style={{ width: 180 }}
                />

                {selectedSchedule && (
                  <Tag color="cyan">
                    {selectedSchedule.startTime} - {selectedSchedule.endTime}
                    <span style={{ marginLeft: 8 }}>
                      {selectedSchedule.bookedSlots}/{selectedSchedule.totalSlots} 号
                    </span>
                  </Tag>
                )}
              </Space>

              <Divider style={{ margin: '8px 0' }} />

              {schedules.length === 0 ? (
                <Empty description="该医生当日暂无排班" />
              ) : (
                schedules.map((schedule) => (
                  <div key={schedule.id}>
                    <div style={{ marginBottom: 12 }}>
                      <Space>
                        <span style={{ fontWeight: 500 }}>
                          {schedule.shiftType === 'morning' ? '上午' : schedule.shiftType === 'afternoon' ? '下午' : '全天'}
                        </span>
                        <span style={{ color: '#888' }}>
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                        <Tag color={schedule.status === 'active' ? 'green' : 'default'}>
                          {schedule.status === 'active' ? '正常' : schedule.status === 'full' ? '约满' : '停诊'}
                        </Tag>
                      </Space>
                    </div>
                    <div className="slot-grid">
                      {schedule.slots?.map((slot) => (
                        <div
                          key={slot.id}
                          className={`slot-item ${getSlotStatusClass(slot.status)} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                          onClick={() => handleSlotClick(schedule, slot)}
                        >
                          <div style={{ fontWeight: 500 }}>
                            {slot.startTime}
                          </div>
                          <div style={{ fontSize: 11, marginTop: 2 }}>
                            {slot.status === 'available' && '可约'}
                            {slot.status === 'booked' && '已约'}
                            {slot.status === 'cancelled' && '停诊'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}

              <Divider style={{ margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Space>
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={openAppointModal}
                    disabled={!selectedSlot || !selectedPatient}
                  >
                    确认预约
                  </Button>
                </Space>
              </div>
            </Space>
          </Card>

          {selectedPatient && (
            <Card
              style={{ marginTop: 16 }}
              title={
                <Tabs
                  defaultActiveKey="summary"
                  items={[
                    { key: 'summary', label: '病历摘要' },
                    { key: 'followup', label: '随访任务' },
                    { key: 'history', label: '就诊历史' },
                  ]}
                />
              }
              extra={
                <Button type="link" onClick={() => setPatientDrawerOpen(true)}>
                  完整档案
                </Button>
              }
            >
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {selectedPatient.records?.slice(0, 3).map((record) => (
                  <div key={record.id} className="patient-quick-info">
                    <div style={{ fontWeight: 500, marginBottom: 8, color: '#13c2c2' }}>
                      <FileTextOutlined /> {dayjs(record.createdAt).format('YYYY-MM-DD')} 就诊
                    </div>
                    <div className="info-item">
                      <span className="label">诊断:</span>
                      <span className="value">{record.diagnosis}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">摘要:</span>
                      <span className="value">{record.summary}</span>
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <Button size="small" type="primary" ghost>
                        查看详情
                      </Button>
                      <Button size="small">再次预约</Button>
                    </div>
                  </div>
                ))}
                {(!selectedPatient.records || selectedPatient.records.length === 0) && (
                  <Empty description="暂无病历记录" />
                )}
              </Space>
            </Card>
          )}
        </Col>
      </Row>

      <Drawer
        title={
          <Space>
            <Avatar>{selectedPatient?.name?.[0]}</Avatar>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{selectedPatient?.name}</span>
            <Tag color={selectedPatient?.gender === 'male' ? 'blue' : 'pink'}>
              {selectedPatient?.gender === 'male' ? '男' : '女'}
            </Tag>
            {selectedPatient?.appointments?.length > 1 && <Tag color="purple">复诊患者</Tag>}
          </Space>
        }
        width={520}
        open={patientDrawerOpen}
        onClose={() => setPatientDrawerOpen(false)}
        className="sidebar-drawer"
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} size="small">
              新建预约
            </Button>
            <Button icon={<FileTextOutlined />} size="small">
              写病历
            </Button>
          </Space>
        }
      >
        <Descriptions title="基本信息" column={2} size="small" style={{ marginBottom: 16 }}>
          <Descriptions.Item label="手机号">{selectedPatient?.phone}</Descriptions.Item>
          <Descriptions.Item label="就诊次数">
            {selectedPatient?.appointments?.length || 0} 次
          </Descriptions.Item>
          <Descriptions.Item label="过敏史">{selectedPatient?.allergy || '无'}</Descriptions.Item>
          <Descriptions.Item label="既往史">
            {selectedPatient?.medicalHistory || '无'}
          </Descriptions.Item>
        </Descriptions>

        <Divider style={{ margin: '12px 0' }} />

        <div className="quick-actions">
          <Button type="primary" size="small" icon={<CalendarOutlined />}>
            立即预约
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            写病历
          </Button>
          <Button size="small" icon={<BellOutlined />}>
            加随访
          </Button>
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <Tabs
          defaultActiveKey="appointments"
          size="small"
          items={[
            {
              key: 'appointments',
              label: `就诊记录 (${selectedPatient?.appointments?.length || 0})`,
            },
            {
              key: 'records',
              label: `病历 (${selectedPatient?.records?.length || 0})`,
            },
            {
              key: 'followups',
              label: `随访 (${selectedPatient?.followUps?.length || 0})`,
            },
            { key: 'status', label: '状态历史' },
          ]}
        >
          <div style={{ marginTop: 12, maxHeight: 400, overflow: 'auto' }}>
            <Timeline
              className="timeline-compact"
              items={selectedPatient?.appointments?.map((appt) => ({
                color: appt.status === 'completed' ? 'green' : appt.status === 'cancelled' ? 'gray' : 'blue',
                children: (
                  <div>
                    <div style={{ fontWeight: 500 }}>
                      {dayjs(appt.appointDate).format('YYYY-MM-DD')} {appt.startTime}
                    </div>
                    <div style={{ fontSize: 12, color: '#666' }}>
                      {appt.doctor?.name} · {appt.chiefComplaint}
                    </div>
                    {appt.medicalRecord && (
                      <div style={{ fontSize: 12, color: '#13c2c2', marginTop: 4 }}>
                        <FileTextOutlined /> {appt.medicalRecord.summary}
                      </div>
                    )}
                    <div style={{ marginTop: 6 }}>
                      <Button size="small" type="link">查看详情</Button>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </Tabs>
      </Drawer>

      <Modal
        title="确认预约"
        open={appointModalOpen}
        onOk={handleAppointSubmit}
        onCancel={() => setAppointModalOpen(false)}
        okText="确认预约"
        cancelText="取消"
      >
        <Form form={appointForm} layout="vertical">
          <Form.Item label="患者" name="patientName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="医生" name="doctorName">
            <Input disabled />
          </Form.Item>
          <Form.Item label="预约时间" name="time">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="主诉"
            name="chiefComplaint"
            rules={[{ required: true, message: '请填写主诉' }]}
          >
            <TextArea rows={3} placeholder="请描述患者主要症状或就诊原因" maxLength={200} showCount />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <TextArea rows={2} placeholder="其他需要说明的信息" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ReceptionPage
