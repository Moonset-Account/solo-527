
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

const AppointmentBooking = () =&gt; {
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

  useEffect(() =&gt; {
    if (selectedDoctor &amp;&amp; selectedDate) {
      // 模拟加载号源
      setAvailableSlots([
        { id: 1, startTime: '09:00', endTime: '12:00', totalSlots: 12, bookedSlots: 5 },
        { id: 2, startTime: '14:00', endTime: '17:00', totalSlots: 12, bookedSlots: 2 }
      ])
    }
  }, [selectedDoctor, selectedDate])

  const handlePhoneBlur = async (e) =&gt; {
    const phone = e.target.value
    if (phone &amp;&amp; phone.length &gt;= 11) {
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

  const next = () =&gt; {
    form.validateFields()
      .then(() =&gt; {
        setCurrent(current + 1)
      })
      .catch(() =&gt; {
        message.error('请完善当前步骤信息')
      })
  }

  const prev = () =&gt; {
    setCurrent(current - 1)
  }

  const handleSubmit = async () =&gt; {
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
    { title: '患者信息', icon: &lt;UserOutlined /&gt; },
    { title: '选择医生', icon: &lt;CalendarOutlined /&gt; },
    { title: '填写主诉', icon: &lt;FileTextOutlined /&gt; },
    { title: '预约完成', icon: &lt;CheckOutlined /&gt; }
  ]

  return (
    &lt;div&gt;
      &lt;Card title="预约挂号"&gt;
        &lt;Steps current={current} items={steps} style={{ marginBottom: 32 }} /&gt;

        &lt;div style={{ maxWidth: 800, margin: '0 auto' }}&gt;
          {current === 0 &amp;&amp; (
            &lt;Form
              form={form}
              layout="vertical"
              initialValues={{ gender: '男' }}
            &gt;
              &lt;Row gutter={16}&gt;
                &lt;Col span={12}&gt;
                  &lt;Form.Item
                    name="phone"
                    label="手机号"
                    rules={[{ required: true, message: '请输入手机号' }]}
                  &gt;
                    &lt;Input
                      placeholder="请输入患者手机号"
                      onBlur={handlePhoneBlur}
                      size="large"
                      maxLength={11}
                    /&gt;
                  &lt;/Form.Item&gt;
                &lt;/Col&gt;
                &lt;Col span={12}&gt;
                  &lt;Form.Item
                    name="patientName"
                    label="姓名"
                    rules={[{ required: true, message: '请输入姓名' }]}
                  &gt;
                    &lt;Input placeholder="请输入患者姓名" size="large" /&gt;
                  &lt;/Form.Item&gt;
                &lt;/Col&gt;
              &lt;/Row&gt;
              &lt;Row gutter={16}&gt;
                &lt;Col span={12}&gt;
                  &lt;Form.Item
                    name="gender"
                    label="性别"
                    rules={[{ required: true, message: '请选择性别' }]}
                  &gt;
                    &lt;Select size="large"&gt;
                      &lt;Option value="男"&gt;男&lt;/Option&gt;
                      &lt;Option value="女"&gt;女&lt;/Option&gt;
                    &lt;/Select&gt;
                  &lt;/Form.Item&gt;
                &lt;/Col&gt;
                &lt;Col span={12}&gt;
                  &lt;Form.Item name="birthDate" label="出生日期"&gt;
                    &lt;DatePicker style={{ width: '100%' }} size="large" /&gt;
                  &lt;/Form.Item&gt;
                &lt;/Col&gt;
              &lt;/Row&gt;
              {patientInfo &amp;&amp; (
                &lt;Card type="inner" title="历史就诊记录" size="small" style={{ marginBottom: 16 }}&gt;
                  &lt;Space direction="vertical" size="small"&gt;
                    &lt;div&gt;最近就诊：2024-01-10 - 张医生 - 深龋治疗&lt;/div&gt;
                    &lt;div&gt;诊断结果：16牙深龋近髓&lt;/div&gt;
                    &lt;Space&gt;
                      &lt;Tag color="blue"&gt;有复诊计划&lt;/Tag&gt;
                      &lt;Tag color="green"&gt;依从性好&lt;/Tag&gt;
                    &lt;/Space&gt;
                  &lt;/Space&gt;
                &lt;/Card&gt;
              )}
              &lt;div style={{ textAlign: 'right', marginTop: 24 }}&gt;
                &lt;Button type="primary" size="large" onClick={next}&gt;
                  下一步
                &lt;/Button&gt;
              &lt;/div&gt;
            &lt;/Form&gt;
          )}

          {current === 1 &amp;&amp; (
            &lt;Form form={form} layout="vertical"&gt;
              &lt;Form.Item
                name="clinicId"
                label="选择诊所"
                rules={[{ required: true, message: '请选择诊所' }]}
              &gt;
                &lt;Select
                  size="large"
                  placeholder="请选择诊所"
                  onChange={() =&gt; form.setFieldsValue({ doctorId: null, date: null })}
                &gt;
                  {clinics.map(c =&gt; (
                    &lt;Option key={c.id} value={c.id}&gt;{c.name}&lt;/Option&gt;
                  ))}
                &lt;/Select&gt;
              &lt;/Form.Item&gt;

              &lt;Form.Item
                name="doctorId"
                label="选择医生"
                rules={[{ required: true, message: '请选择医生' }]}
              &gt;
                &lt;Select
                  size="large"
                  placeholder="请选择医生"
                  onChange={(val) =&gt; {
                    setSelectedDoctor(val)
                    form.setFieldsValue({ date: null })
                  }}
                  optionLabelProp="label"
                &gt;
                  {doctors.map(d =&gt; (
                    &lt;Option key={d.id} value={d.id} label={`${d.name} - ${d.title}`}&gt;
                      &lt;div style={{ display: 'flex', justifyContent: 'space-between' }}&gt;
                        &lt;span&gt;{d.name} &lt;Tag color="blue"&gt;{d.title}&lt;/Tag&gt;&lt;/span&gt;
                        &lt;span style={{ color: '#999' }}&gt;{d.department}&lt;/span&gt;
                      &lt;/div&gt;
                    &lt;/Option&gt;
                  ))}
                &lt;/Select&gt;
              &lt;/Form.Item&gt;

              &lt;Form.Item
                name="appointmentDate"
                label="选择日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              &gt;
                &lt;DatePicker
                  style={{ width: '100%' }}
                  size="large"
                  disabledDate={(current) =&gt; current &amp;&amp; current &lt; dayjs().startOf('day')}
                  onChange={(date) =&gt; {
                    setSelectedDate(date)
                    form.setFieldsValue({ slotId: null, startTime: null, endTime: null })
                  }}
                /&gt;
              &lt;/Form.Item&gt;

              {selectedDoctor &amp;&amp; selectedDate &amp;&amp; (
                &lt;Form.Item
                  name="slotId"
                  label="选择时段"
                  rules={[{ required: true, message: '请选择时段' }]}
                &gt;
                  &lt;Radio.Group style={{ width: '100%' }}&gt;
                    &lt;Row gutter={16}&gt;
                      {availableSlots.map(slot =&gt; (
                        &lt;Col span={12} key={slot.id}&gt;
                          &lt;Card
                            size="small"
                            hoverable
                            style={{
                              borderColor: slot.totalSlots - slot.bookedSlots === 0 ? '#d9d9d9' : undefined,
                              opacity: slot.totalSlots - slot.bookedSlots === 0 ? 0.5 : 1
                            }}
                            onClick={() =&gt; {
                              if (slot.totalSlots - slot.bookedSlots &gt; 0) {
                                form.setFieldsValue({
                                  slotId: slot.id,
                                  startTime: slot.startTime,
                                  endTime: slot.endTime
                                })
                              }
                            }}
                          &gt;
                            &lt;div style={{ fontSize: 16, fontWeight: 600 }}&gt;
                              {slot.startTime} - {slot.endTime}
                            &lt;/div&gt;
                            &lt;div style={{ color: '#8c8c8c', marginTop: 4 }}&gt;
                              剩余 {slot.totalSlots - slot.bookedSlots} 个号源
                            &lt;/div&gt;
                            &lt;div style={{ marginTop: 8 }}&gt;
                              &lt;Progress
                                percent={Math.round(slot.bookedSlots / slot.totalSlots * 100)}
                                size="small"
                                status={slot.totalSlots - slot.bookedSlots === 0 ? 'exception' : 'active'}
                              /&gt;
                            &lt;/div&gt;
                          &lt;/Card&gt;
                        &lt;/Col&gt;
                      ))}
                    &lt;/Row&gt;
                  &lt;/Radio.Group&gt;
                &lt;/Form.Item&gt;
              )}

              &lt;Form.Item
                name="appointmentType"
                label="预约类型"
                rules={[{ required: true, message: '请选择预约类型' }]}
                initialValue={1}
              &gt;
                &lt;Select size="large"&gt;
                  {appointmentTypes.map(t =&gt; (
                    &lt;Option key={t.value} value={t.value}&gt;{t.label}&lt;/Option&gt;
                  ))}
                &lt;/Select&gt;
              &lt;/Form.Item&gt;

              &lt;div style={{ textAlign: 'right', marginTop: 24 }}&gt;
                &lt;Button size="large" onClick={prev} style={{ marginRight: 16 }}&gt;
                  上一步
                &lt;/Button&gt;
                &lt;Button type="primary" size="large" onClick={next}&gt;
                  下一步
                &lt;/Button&gt;
              &lt;/div&gt;
            &lt;/Form&gt;
          )}

          {current === 2 &amp;&amp; (
            &lt;Form form={form} layout="vertical"&gt;
              &lt;Form.Item
                name="chiefComplaint"
                label="主诉"
                rules={[{ required: true, message: '请填写主诉' }]}
              &gt;
                &lt;TextArea
                  rows={3}
                  placeholder="请简要描述患者的主要症状和就诊原因"
                  maxLength={500}
                  showCount
                  size="large"
                /&gt;
              &lt;/Form.Item&gt;

              &lt;Divider orientation="left"&gt;快速选择常见主诉&lt;/Divider&gt;
              &lt;Space wrap&gt;
                {['牙痛', '牙齿松动', '牙龈出血', '牙齿美白', '补牙', '拔牙', '洗牙', '正畸咨询'].map(item =&gt; (
                  &lt;Tag
                    key={item}
                    color="blue"
                    style={{ cursor: 'pointer', padding: '4px 12px', fontSize: 14 }}
                    onClick={() =&gt; {
                      const current = form.getFieldValue('chiefComplaint') || ''
                      form.setFieldsValue({ chiefComplaint: current ? current + '、' + item : item })
                    }}
                  &gt;
                    {item}
                  &lt;/Tag&gt;
                ))}
              &lt;/Space&gt;

              &lt;Form.Item
                name="remark"
                label="备注"
                style={{ marginTop: 24 }}
              &gt;
                &lt;TextArea
                  rows={2}
                  placeholder="其他需要说明的情况"
                  maxLength={200}
                  showCount
                /&gt;
              &lt;/Form.Item&gt;

              &lt;Card type="inner" title="预约信息确认" style={{ marginTop: 16 }}&gt;
                &lt;Row gutter={16}&gt;
                  &lt;Col span={12}&gt;
                    &lt;p&gt;&lt;strong&gt;患者：&lt;/strong&gt;{form.getFieldValue('patientName') || '-'}&lt;/p&gt;
                    &lt;p&gt;&lt;strong&gt;手机：&lt;/strong&gt;{form.getFieldValue('phone') || '-'}&lt;/p&gt;
                  &lt;/Col&gt;
                  &lt;Col span={12}&gt;
                    &lt;p&gt;&lt;strong&gt;医生：&lt;/strong&gt;{doctors.find(d =&gt; d.id === form.getFieldValue('doctorId'))?.name || '-'}&lt;/p&gt;
                    &lt;p&gt;&lt;strong&gt;时间：&lt;/strong&gt;{selectedDate?.format('YYYY-MM-DD') || '-'} {form.getFieldValue('startTime') || ''}&lt;/p&gt;
                  &lt;/Col&gt;
                &lt;/Row&gt;
              &lt;/Card&gt;

              &lt;div style={{ textAlign: 'right', marginTop: 24 }}&gt;
                &lt;Button size="large" onClick={prev} style={{ marginRight: 16 }}&gt;
                  上一步
                &lt;/Button&gt;
                &lt;Button type="primary" size="large" onClick={handleSubmit}&gt;
                  提交预约
                &lt;/Button&gt;
              &lt;/div&gt;
            &lt;/Form&gt;
          )}

          {current === 3 &amp;&amp; (
            &lt;div style={{ textAlign: 'center', padding: '48px 0' }}&gt;
              &lt;Result
                status="success"
                title="预约成功"
                subTitle="预约信息已发送至患者手机，同时已生成待办事项提醒"
                extra={[
                  &lt;Button type="primary" key="continue" onClick={() =&gt; { setCurrent(0); form.resetFields() }}&gt;
                    继续预约
                  &lt;/Button&gt;,
                  &lt;Button key="view"&gt;查看预约详情&lt;/Button&gt;
                ]}
              /&gt;
            &lt;/div&gt;
          )}
        &lt;/div&gt;
      &lt;/Card&gt;
    &lt;/div&gt;
  )
}

export default AppointmentBooking
