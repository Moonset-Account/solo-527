import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Modal,
  Form,
  InputNumber,
  message,
  Drawer,
  List,
  Divider,
  Popconfirm,
  Row,
  Col,
  Badge,
  Timeline,
} from 'antd'
import {
  PlusOutlined,
  CalendarOutlined,
  SettingOutlined,
  EyeOutlined,
  StopOutlined,
  PlayCircleOutlined,
  HistoryOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { doctorApi, scheduleApi, appointmentApi } from '../services'

const { Option } = Select
const { RangePicker } = DatePicker

function SchedulePage() {
  const [doctors, setDoctors] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [dateRange, setDateRange] = useState(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [batchModalVisible, setBatchModalVisible] = useState(false)
  const [addForm] = Form.useForm()
  const [batchForm] = Form.useForm()
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  useEffect(() => {
    loadDoctors()
  }, [])

  useEffect(() => {
    if (selectedDoctor) {
      loadSchedules()
    }
  }, [selectedDoctor, dateRange])

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.list()
      setDoctors(data)
    } catch (err) {
      message.error('加载医生列表失败')
    }
  }

  const loadSchedules = async () => {
    setLoading(true)
    try {
      const params = { doctorId: selectedDoctor }
      if (dateRange && dateRange[0]) {
        params.startDate = dateRange[0].toISOString()
        params.endDate = dateRange[1]?.toISOString() || dateRange[0].add(7, 'day').toISOString()
      } else {
        params.startDate = dayjs().toISOString()
        params.endDate = dayjs().add(14, 'day').toISOString()
      }
      const data = await scheduleApi.list(params)
      setSchedules(data)
    } catch (err) {
      message.error('加载排班失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (schedule) => {
    try {
      const detail = await scheduleApi.get(schedule.id)
      setSelectedSchedule(detail)
      setDetailVisible(true)
    } catch (err) {
      message.error('加载排班详情失败')
    }
  }

  const handleAddSchedule = async () => {
    try {
      const values = await addForm.validateFields()
      await scheduleApi.create({
        ...values,
        doctorId: selectedDoctor,
        clinicId: 1,
        date: values.date?.toISOString(),
        operatorName: '管理员',
      })
      message.success('排班创建成功')
      setAddModalVisible(false)
      addForm.resetFields()
      loadSchedules()
    } catch (err) {
      message.error('创建失败')
    }
  }

  const handleBatchCreate = async () => {
    try {
      const values = await batchForm.validateFields()
      const dates = []
      let current = values.dateRange[0]
      const end = values.dateRange[1]
      while (current.isBefore(end) || current.isSame(end, 'day')) {
        if (values.weekdays?.includes(current.day())) {
          dates.push(current.toISOString())
        }
        current = current.add(1, 'day')
      }
      if (dates.length === 0) {
        message.warning('所选日期范围内没有符合条件的排班日')
        return
      }
      await scheduleApi.createBatch({
        doctorId: selectedDoctor,
        clinicId: 1,
        dates,
        startTime: values.startTime,
        endTime: values.endTime,
        shiftType: values.shiftType,
        slotDuration: values.slotDuration || 30,
        operatorName: '管理员',
      })
      message.success(`成功创建 ${dates.length} 天排班`)
      setBatchModalVisible(false)
      batchForm.resetFields()
      loadSchedules()
    } catch (err) {
      message.error('批量创建失败')
    }
  }

  const toggleScheduleStatus = async (schedule, toStatus) => {
    try {
      await scheduleApi.update(schedule.id, {
        status: toStatus,
        remark: toStatus === 'cancelled' ? '停诊' : '恢复排班',
        operatorName: '管理员',
      })
      message.success('操作成功')
      loadSchedules()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const toggleSlotStatus = async (slot, toStatus) => {
    try {
      await scheduleApi.updateSlot(slot.id, {
        status: toStatus,
        remark: toStatus === 'cancelled' ? '号源停诊' : '恢复号源',
        operatorName: '管理员',
      })
      message.success('操作成功')
      if (selectedSchedule) {
        const detail = await scheduleApi.get(selectedSchedule.id)
        setSelectedSchedule(detail)
      }
    } catch (err) {
      message.error('操作失败')
    }
  }

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      width: 120,
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '班次',
      dataIndex: 'shiftType',
      width: 80,
      render: (v) => {
        const map = { morning: '上午', afternoon: '下午', full: '全天' }
        return map[v] || v
      },
    },
    {
      title: '时间',
      width: 140,
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '号源',
      width: 120,
      render: (_, record) => (
        <span>
          {record.bookedSlots}/{record.totalSlots} 号
          <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 3, marginTop: 4 }}>
            <div
              style={{
                width: `${(record.bookedSlots / record.totalSlots) * 100}%`,
                height: '100%',
                background: '#13c2c2',
                borderRadius: 3,
              }}
            />
          </div>
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => {
        const map = {
          active: { color: 'green', text: '正常' },
          full: { color: 'orange', text: '约满' },
          cancelled: { color: 'default', text: '停诊' },
        }
        const cfg = map[v] || { color: 'default', text: v }
        return <Tag color={cfg.color}>{cfg.text}</Tag>
      },
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'active' ? (
            <Popconfirm title="确定停诊?" onConfirm={() => toggleScheduleStatus(record, 'cancelled')}>
              <Button type="link" size="small" danger icon={<StopOutlined />}>
                停诊
              </Button>
            </Popconfirm>
          ) : (
            <Popconfirm title="确定恢复排班?" onConfirm={() => toggleScheduleStatus(record, 'active')}>
              <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                恢复
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select
            placeholder="选择医生"
            style={{ width: 250 }}
            value={selectedDoctor}
            onChange={setSelectedDoctor}
          >
            {doctors.map((doc) => (
              <Option key={doc.id} value={doc.id}>
                {doc.name} - {doc.title} ({doc.specialty})
              </Option>
            ))}
          </Select>

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
          />

          <Button onClick={loadSchedules} icon={<CalendarOutlined />}>
            查询
          </Button>

          <div style={{ flex: 1 }} />

          <Button
            icon={<PlusOutlined />}
            disabled={!selectedDoctor}
            onClick={() => setAddModalVisible(true)}
          >
            单日排班
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            disabled={!selectedDoctor}
            onClick={() => setBatchModalVisible(true)}
          >
            批量排班
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={schedules}
          rowKey="id"
          loading={loading}
          pagination={false}
          scroll={{ x: 700 }}
        />
      </Card>

      <Drawer
        title="排班详情"
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedSchedule && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small" title="排班信息">
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>医生</div>
                  <div style={{ fontWeight: 500 }}>{selectedSchedule.doctor?.name}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>日期</div>
                  <div style={{ fontWeight: 500 }}>
                    {dayjs(selectedSchedule.date).format('YYYY-MM-DD')}
                  </div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>状态</div>
                  <Tag color={selectedSchedule.status === 'active' ? 'green' : 'default'}>
                    {selectedSchedule.status === 'active' ? '正常' : selectedSchedule.status === 'cancelled' ? '停诊' : selectedSchedule.status}
                  </Tag>
                </Col>
              </Row>
              <Divider style={{ margin: '12px 0' }} />
              <Row gutter={16}>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>开始时间</div>
                  <div>{selectedSchedule.startTime}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>结束时间</div>
                  <div>{selectedSchedule.endTime}</div>
                </Col>
                <Col span={8}>
                  <div style={{ color: '#888', fontSize: 13 }}>号源</div>
                  <div>
                    {selectedSchedule.bookedSlots}/{selectedSchedule.totalSlots}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card
              size="small"
              title="号源时段"
              extra={
                <Button type="link" size="small">
                  <HistoryOutlined /> 状态历史
                </Button>
              }
            >
              <div className="slot-grid">
                {selectedSchedule.slots?.map((slot) => (
                  <div
                    key={slot.id}
                    className={`slot-item ${slot.status}`}
                    style={{ position: 'relative' }}
                  >
                    <div style={{ fontWeight: 500 }}>{slot.startTime}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      {slot.status === 'available' && '可约'}
                      {slot.status === 'booked' && '已约'}
                      {slot.status === 'cancelled' && '停诊'}
                    </div>
                    {slot.bookedCount > 0 && slot.status !== 'cancelled' && (
                      <Badge
                        count={slot.bookedCount}
                        size="small"
                        style={{ position: 'absolute', top: -4, right: -4 }}
                      />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card size="small" title="状态历史">
              <Timeline
                className="timeline-compact"
                size="small"
                items={selectedSchedule.statusHistory?.map((h) => ({
                  children: (
                    <div>
                      <div style={{ fontSize: 13 }}>
                        {h.fromStatus && <Tag>{h.fromStatus}</Tag>}
                        {h.fromStatus && ' → '}
                        <Tag color="blue">{h.toStatus}</Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        {h.operatorName} · {dayjs(h.createdAt).format('YYYY-MM-DD HH:mm')}
                      </div>
                      {h.remark && <div style={{ fontSize: 12, marginTop: 4 }}>{h.remark}</div>}
                    </div>
                  ),
                }))}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="新增单日排班"
        open={addModalVisible}
        onOk={handleAddSchedule}
        onCancel={() => setAddModalVisible(false)}
        okText="创建"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="排班日期"
            name="date"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="班次类型"
            name="shiftType"
            rules={[{ required: true, message: '请选择班次' }]}
          >
            <Select placeholder="请选择班次">
              <Option value="morning">上午</Option>
              <Option value="afternoon">下午</Option>
              <Option value="full">全天</Option>
            </Select>
          </Form.Item>
          <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
            <Select placeholder="请选择开始时间">
              <Option value="08:00">08:00</Option>
              <Option value="08:30">08:30</Option>
              <Option value="09:00">09:00</Option>
              <Option value="14:00">14:00</Option>
              <Option value="14:30">14:30</Option>
            </Select>
          </Form.Item>
          <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]}>
            <Select placeholder="请选择结束时间">
              <Option value="12:00">12:00</Option>
              <Option value="12:30">12:30</Option>
              <Option value="17:30">17:30</Option>
              <Option value="18:00">18:00</Option>
            </Select>
          </Form.Item>
          <Form.Item label="号源间隔(分钟)" name="slotDuration" initialValue={30}>
            <Select>
              <Option value={15}>15 分钟</Option>
              <Option value={30}>30 分钟</Option>
              <Option value={45}>45 分钟</Option>
              <Option value={60}>60 分钟</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量排班"
        open={batchModalVisible}
        onOk={handleBatchCreate}
        onCancel={() => setBatchModalVisible(false)}
        okText="批量创建"
        width={500}
      >
        <Form form={batchForm} layout="vertical">
          <Form.Item
            label="日期范围"
            name="dateRange"
            rules={[{ required: true, message: '请选择日期范围' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="排班日"
            name="weekdays"
            rules={[{ required: true, message: '请选择排班日' }]}
          >
            <Select mode="multiple" placeholder="选择星期几排班">
              <Option value={1}>周一</Option>
              <Option value={2}>周二</Option>
              <Option value={3}>周三</Option>
              <Option value={4}>周四</Option>
              <Option value={5}>周五</Option>
              <Option value={6}>周六</Option>
              <Option value={0}>周日</Option>
            </Select>
          </Form.Item>
          <Form.Item label="班次类型" name="shiftType" rules={[{ required: true }]}>
            <Select placeholder="请选择班次">
              <Option value="morning">上午</Option>
              <Option value="afternoon">下午</Option>
              <Option value="full">全天</Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="开始时间" name="startTime" rules={[{ required: true }]}>
                <Select placeholder="开始时间">
                  <Option value="08:00">08:00</Option>
                  <Option value="08:30">08:30</Option>
                  <Option value="09:00">09:00</Option>
                  <Option value="14:00">14:00</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="结束时间" name="endTime" rules={[{ required: true }]}>
                <Select placeholder="结束时间">
                  <Option value="12:00">12:00</Option>
                  <Option value="17:30">17:30</Option>
                  <Option value="18:00">18:00</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="号源间隔(分钟)" name="slotDuration" initialValue={30}>
            <Select>
              <Option value={15}>15 分钟</Option>
              <Option value={30}>30 分钟</Option>
              <Option value={60}>60 分钟</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SchedulePage
