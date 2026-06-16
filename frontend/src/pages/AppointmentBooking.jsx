
import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Card,
  Row,
  Col,
  Steps,
  message,
  Divider,
  Tag,
  Space,
  Radio,
  Progress,
  Result
} from 'antd'
import { UserOutlined, CalendarOutlined, FileTextOutlined, CheckOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { Step } = Steps
const { Option } = Select
const { TextArea } = Input

const AppointmentBooking = () => {
  const [current, setCurrent] = useState(0)
  const [form] = Form.useForm()
  const [clinics] = useState([
    { id: 1, name: '总院口腔诊所' },
    { id: 2, name: '海淀分院' },
    { id: 3, name: '西城分院' }
  ])
  const [doctors, setDoctors] = useState([
    { id: 1, name: '张医生', title: '主任医师', department: '口腔内科' },
    { id: 2, name: '李医生', title: '副主任医师', department: '口腔修复科' },
    { id: 3, name: '王医生', title: '主治医师', department: '口腔正畸科' },
    { id: 4, name: '赵医生', title: '主任医师', department: '口腔种植科' }
  ])
  const [availableSlots, setAvailableSlots] = useState([
    { id: 1, startTime: '09:00', endTime: '12:00', totalSlots: 12, bookedSlots: 5 },
    { id: 2, startTime: '14:00', endTime: '17:00', totalSlots: 12, bookedSlots: 2 }
  ])
  const [selectedDoctor, setSelectedDoctor] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [patientInfo, setPatientInfo] = useState(null)

  const appointmentTypes = [
    { value: 1, label: '初诊' },
    { value: 2, label: '复诊' },
    { value: 3, label: '复查' },
    { value: 4, label: '急诊' }
  ]

  useEffect(() => {
    if (selectedDoctor && selectedDate) {
      // 模拟加载号源
      setAvailableSlots([
        { id: 1, startTime: '09:00', endTime: '12:00', totalSlots: 12, bookedSlots: 5 },
        { id: 2, startTime: '14:00', endTime: '17:00', totalSlots: 12, bookedSlots: 2 }
      ])
    }
  }, [selectedDoctor, selectedDate])

  const handlePhoneBlur = async (e) => {
    const phone = e.target.value
    if (phone && phone.length >= 11) {
      // 模拟查询患者信息
      if (phone === '13900000001') {
        setPatientInfo({
          id: 1,
          name: '张明',
          gender: '男',
          birthDate: '1985-05-15',
          phone: '13900000001'
        })
        form.setFieldsValue({
          patientName: '张明',
          gender: '男',
          birthDate: dayjs('1985-05-15')
        })
        message.success('已找到患者信息，自动填充')
      } else {
        setPatientInfo(null)
        message.info('新患者，请填写完整信息')
      }
    }
  }

  const next = () => {
    form.validateFields()
      .then(() => {
        setCurrent(current + 1)
      })
      .catch(() => {
        message.error('请完善当前步骤信息')
      })
  }

  const prev = () => {
    setCurrent(current - 1)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      // 模拟提交
      message.success('预约成功！已为患者生成待办事项')
      setCurrent(3)
    } catch {
      message.error('请完善预约信息')
    }
  }

  const steps = [
    { title: '患者信息', icon: <UserOutlined /> },
    { title: '选择医生', icon: <CalendarOutlined /> },
    { title: '填写主诉', icon: <FileTextOutlined /> },
    { title: '预约完成', icon: <CheckOutlined /> }
  ]

  return (
    <div>
      <Card title="预约挂号">
        <Steps current={current} items={steps} style={{ marginBottom: 32 }} />

        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {current === 0 && (
            <Form
              form={form}
              layout="vertical"
              initialValues={{ gender: '男' }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="phone"
                    label="手机号"
                    rules={[{ required: true, message: '请输入手机号' }]}
                  >
                    <Input
                      placeholder="请输入患者手机号"
                      onBlur={handlePhoneBlur}
                      size="large"
                      maxLength={11}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="patientName"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  >
                    <Input placeholder="请输入患者姓名" size="large" />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  >
                    <Select size="large">
                      <Option value="男">男</Option>
                      <Option value="女">女</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="birthDate" label="出生日期">
                    <DatePicker style={{ width: '100%' }} size="large" />
                  </Form.Item>
                </Col>
              </Row>
              {patientInfo && (
                <Card type="inner" title="历史就诊记录" size="small" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" size="small">
                    <div>最近就诊：2024-01-10 - 张医生 - 深龋治疗</div>
                    <div>诊断结果：16牙深龋近髓</div>
                    <Space>
                      <Tag color="blue">有复诊计划</Tag>
                      <Tag color="green">依从性好</Tag>
                    </Space>
                  </Space>
                </Card>
              )}
              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button type="primary" size="large" onClick={next}>
                  下一步
                </Button>
              </div>
            </Form>
          )}

          {current === 1 && (
            <Form form={form} layout="vertical">
              <Form.Item
                name="clinicId"
                label="选择诊所"
                rules={[{ required: true, message: '请选择诊所' }]}
              >
                <Select
                  size="large"
                  placeholder="请选择诊所"
                  onChange={() => form.setFieldsValue({ doctorId: null, date: null })}
                >
                  {clinics.map(c => (
                    <Option key={c.id} value={c.id}>{c.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="doctorId"
                label="选择医生"
                rules={[{ required: true, message: '请选择医生' }]}
              >
                <Select
                  size="large"
                  placeholder="请选择医生"
                  onChange={(val) => {
                    setSelectedDoctor(val)
                    form.setFieldsValue({ date: null })
                  }}
                  optionLabelProp="label"
                >
                  {doctors.map(d => (
                    <Option key={d.id} value={d.id} label={`${d.name} - ${d.title}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{d.name} <Tag color="blue">{d.title}</Tag></span>
                        <span style={{ color: '#999' }}>{d.department}</span>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="appointmentDate"
                label="选择日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                  onChange={(date) => {
                    setSelectedDate(date)
                    form.setFieldsValue({ slotId: null, startTime: null, endTime: null })
                  }}
                />
              </Form.Item>

              {selectedDoctor && selectedDate && (
                <Form.Item
                  name="slotId"
                  label="选择时段"
                  rules={[{ required: true, message: '请选择时段' }]}
                >
                  <Radio.Group style={{ width: '100%' }}>
                    <Row gutter={16}>
                      {availableSlots.map(slot => (
                        <Col span={12} key={slot.id}>
                          <Card
                            size="small"
                            hoverable
                            style={{
                              borderColor: slot.totalSlots - slot.bookedSlots === 0 ? '#d9d9d9' : undefined,
                              opacity: slot.totalSlots - slot.bookedSlots === 0 ? 0.5 : 1
                            }}
                            onClick={() => {
                              if (slot.totalSlots - slot.bookedSlots > 0) {
                                form.setFieldsValue({
                                  slotId: slot.id,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime
                                })
                              }
                            }}
                          >
                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                              {slot.startTime} - {slot.endTime}
                            </div>
                            <div style={{ color: '#8c8c8c', marginTop: 4 }}>
                              剩余 {slot.totalSlots - slot.bookedSlots} 个号源
                            </div>
                            <div style={{ marginTop: 8 }}>
                              <Progress
                                percent={Math.round(slot.bookedSlots / slot.totalSlots * 100)}
                                size="small"
                                status={slot.totalSlots - slot.bookedSlots === 0 ? 'exception' : 'active'}
                              />
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  </Radio.Group>
                </Form.Item>
              )}

              <Form.Item
                name="appointmentType"
                label="预约类型"
                rules={[{ required: true, message: '请选择预约类型' }]}
                initialValue={1}
              >
                <Select size="large">
                  {appointmentTypes.map(t => (
                    <Option key={t.value} value={t.value}>{t.label}</Option>
                  ))}
                </Select>
              </Form.Item>

              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button size="large" onClick={prev} style={{ marginRight: 16 }}>
                  上一步
                </Button>
                <Button type="primary" size="large" onClick={next}>
                  下一步
                </Button>
              </div>
            </Form>
          )}

          {current === 2 && (
            <Form form={form} layout="vertical">
              <Form.Item
                name="chiefComplaint"
                label="主诉"
                rules={[{ required: true, message: '请填写主诉' }]}
              >
                <TextArea
                  rows={3}
                  placeholder="请简要描述患者的主要症状和就诊原因"
                  maxLength={500}
                  showCount
                  size="large"
                />
              </Form.Item>

              <Divider orientation="left">快速选择常见主诉</Divider>
              <Space wrap>
                {['牙痛', '牙齿松动', '牙龈出血', '牙齿美白', '补牙', '拔牙', '洗牙', '正畸咨询'].map(item => (
                  <Tag
                    key={item}
                    color="blue"
                    style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
                    onClick={() => {
                      const current = form.getFieldValue('chiefComplaint') || ''
                      form.setFieldsValue({ chiefComplaint: current ? current + '、' + item : item })
                    }}
                  >
                    {item}
                  </Tag>
                ))}
              </Space>

              <Form.Item
                name="remark"
                label="备注"
                style={{ marginTop: 24 }}
              >
                <TextArea
                  rows={2}
                  placeholder="其他需要说明的情况"
                  maxLength={200}
                  showCount
                />
              </Form.Item>

              <Card type="inner" title="预约信息确认" style={{ marginTop: 16 }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <p><strong>患者：</strong>{form.getFieldValue('patientName') || '-'}</p>
                    <p><strong>手机：</strong>{form.getFieldValue('phone') || '-'}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong>医生：</strong>{doctors.find(d => d.id === form.getFieldValue('doctorId'))?.name || '-'}</p>
                    <p><strong>时间：</strong>{selectedDate?.format('YYYY-MM-DD') || '-'} {form.getFieldValue('startTime') || ''}</p>
                  </Col>
                </Row>
              </Card>

              <div style={{ textAlign: 'right', marginTop: 24 }}>
                <Button size="large" onClick={prev} style={{ marginRight: 16 }}>
                  上一步
                </Button>
                <Button type="primary" size="large" onClick={handleSubmit}>
                  提交预约
                </Button>
              </div>
            </Form>
          )}

          {current === 3 && (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <Result
                status="success"
                title="预约成功"
                subTitle="预约信息已发送至患者手机，同时已生成待办事项提醒"
                extra={[
                  <Button type="primary" key="continue" onClick={() => { setCurrent(0); form.resetFields() }}>
                    继续预约
                  </Button>,
                  <Button key="view">查看预约详情</Button>
                ]}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AppointmentBooking
