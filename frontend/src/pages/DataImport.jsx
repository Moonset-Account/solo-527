import React, { useState } from 'react'
import { Card, Row, Col, Upload, Button, App, Tabs, Progress, Alert, Divider, Tag, Space, Steps } from 'antd'
import {
  CloudUploadOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  DownloadOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { api } from '../api'

const { Dragger } = Upload
const { Step } = Steps

const departmentTemplate = `code,name,description,default_no_show_rate
NEU,神经内科,主治神经系统疾病,18
CAR,心血管内科,心脏与血管疾病诊疗,12
PED,儿科,儿童疾病诊疗,25
DER,皮肤科,皮肤疾病诊疗,20
ORT,骨科,骨骼肌肉系统,15`

const appointmentTemplate = `appointment_no,patient_age,patient_gender,department_code,doctor_name,appointment_date,appointment_time,appointment_type,is_revisit,channel,reminder_method,days_in_advance,historical_no_show_count,historical_total_count,distance_km,weather_condition,is_holiday,actual_status,remark
A202401001,45,男,NEU,张医生,2024-01-15,09:00,专家门诊,0,APP预约,sms,3,1,5,8.5,晴,0,pending,初诊
A202401002,32,女,CAR,李医生,2024-01-15,10:30,普通门诊,1,电话预约,call,1,0,2,3.2,多云,0,attended,复诊
A202401003,6,男,PED,王医生,2024-01-15,14:00,普通门诊,0,微信预约,wechat,2,2,4,12,小雨,0,noshow,儿童感冒`

const slotTemplate = `department_code,day_of_week,start_time,end_time,capacity,historical_no_show_count,historical_total_count
NEU,1,08:00,12:00,30,45,250
NEU,1,14:00,17:30,25,32,200
CAR,2,08:00,12:00,40,35,280
PED,3,08:30,12:00,50,110,420`

const DataImport = () => {
  const { message } = App.useApp()
  const [importState, setImportState] = useState({ department: null, appointments: null, slots: null })

  const uploadProps = (type) => ({
    name: 'file',
    multiple: false,
    accept: type === 'appointments' ? '.csv,.xlsx,.xls,.json' : '.csv,.xlsx,.xls',
    showUploadList: false,
    beforeUpload: () => false,
    customRequest: async ({ file }) => {
      setImportState(s => ({ ...s, [type]: { status: 'uploading', progress: 0 } }))
      try {
        let res
        if (type === 'department') res = await api.departments.import(file)
        else if (type === 'appointments') res = await api.appointments.import(file)
        else res = await api.timeSlots.import(file)

        const success = type === 'appointments' ? res.success_count : res.success
        const failed = type === 'appointments' ? res.failed_count : res.failed
        setImportState(s => ({
          ...s,
          [type]: {
            status: success > 0 ? 'success' : 'warning',
            success, failed,
            errors: res.errors || [],
            batch_id: res.batch_id,
            progress: 100,
          }
        }))
        message.success(`导入完成：成功 ${success} 条，失败 ${failed} 条`)
      } catch (e) {
        setImportState(s => ({ ...s, [type]: { status: 'error' } }))
      }
    },
  })

  const downloadTemplate = (content, name) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }

  const renderResult = (state) => {
    if (!state) return null
    if (state.status === 'uploading') return <Progress percent={state.progress} status="active" />
    if (state.status === 'success') return (
      <Alert
        type="success" showIcon
        message={<Space><CheckCircleOutlined /> 导入成功</Space>}
        description={
          <div>
            成功：<Tag color="green">{state.success}</Tag>
            {state.failed > 0 && <>失败：<Tag color="red">{state.failed}</Tag></>}
            {state.batch_id && <div style={{ marginTop: 4 }}>批次号：<code>{state.batch_id}</code></div>}
            {state.errors?.length > 0 && (
              <div style={{ marginTop: 8, maxHeight: 120, overflow: 'auto', background: '#fffbe6', padding: 8, borderRadius: 4 }}>
                {state.errors.slice(0, 10).map((e, i) => <div key={i} style={{ fontSize: 12 }}>• {e}</div>)}
              </div>
            )}
          </div>
        }
      />
    )
    if (state.status === 'warning') return (
      <Alert type="warning" showIcon message="导入完成（存在失败项）"
        description={`成功 ${state.success} 条，失败 ${state.failed} 条`} />
    )
    if (state.status === 'error') return <Alert type="error" showIcon message="导入失败，请检查文件格式" />
  }

  return (
    <div className="page-container">
      <Card className="card-shadow" style={{ marginBottom: 16 }}>
        <Steps size="small" current={3}>
          <Step title="接入数据" description="科室/时段/预约" icon={<CloudUploadOutlined />} />
          <Step title="模型评分" description="LightGBM推理" icon={<FileTextOutlined />} />
          <Step title="运营干预" description="短信/回访/人工复核" icon={<CheckCircleOutlined />} />
        </Steps>
      </Card>

      <Card title="数据导入中心" className="card-shadow" extra={
        <Tag color="blue" icon={<FileTextOutlined />}>支持 CSV / XLSX / JSON 格式</Tag>
      }>
        <Tabs
          defaultActiveKey="appointments"
          size="large"
          items={[
            {
              key: 'appointments',
              label: <span><CalendarOutlined /> 预约记录数据</span>,
              children: (
                <Row gutter={24}>
                  <Col xs={24} md={14}>
                    <Dragger {...uploadProps('appointments')} style={{ padding: 20 }}>
                      <p className="ant-upload-drag-icon"><CalendarOutlined style={{ fontSize: 48, color: '#1677ff' }} /></p>
                      <p className="ant-upload-text">点击或拖拽上传预约记录文件</p>
                      <p className="ant-upload-hint">
                        包含：预约号、患者年龄性别、科室、日期时间、挂号渠道、提醒方式、历史爽约记录等
                      </p>
                    </Dragger>
                    <div style={{ marginTop: 16 }}>{renderResult(importState.appointments)}</div>
                  </Col>
                  <Col xs={24} md={10}>
                    <Card title="字段说明" size="small" style={{ background: '#fafafa' }}>
                      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                        <p><Tag color="red">必填</Tag> appointment_no, department_code, appointment_date, appointment_time</p>
                        <p><Tag color="blue">推荐</Tag> patient_age, patient_gender, reminder_method, days_in_advance</p>
                        <p><Tag color="green">增强</Tag> historical_no_show_count, historical_total_count, distance_km, weather_condition</p>
                        <p><Tag color="purple">训练用</Tag> actual_status（已标注历史数据：attended/noshow）</p>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <Button icon={<DownloadOutlined />} block onClick={() => downloadTemplate(appointmentTemplate, 'appointments_template.csv')}>
                        下载预约记录模板
                      </Button>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'departments',
              label: <span><TeamOutlined /> 科室数据</span>,
              children: (
                <Row gutter={24}>
                  <Col xs={24} md={14}>
                    <Dragger {...uploadProps('department')} style={{ padding: 20 }}>
                      <p className="ant-upload-drag-icon"><TeamOutlined style={{ fontSize: 48, color: '#52c41a' }} /></p>
                      <p className="ant-upload-text">上传科室配置文件</p>
                      <p className="ant-upload-hint">科室编码、名称、历史爽约率基线等</p>
                    </Dragger>
                    <div style={{ marginTop: 16 }}>{renderResult(importState.department)}</div>
                  </Col>
                  <Col xs={24} md={10}>
                    <Card title="字段说明" size="small" style={{ background: '#fafafa' }}>
                      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                        <p><Tag color="red">必填</Tag> code, name</p>
                        <p><Tag color="blue">推荐</Tag> default_no_show_rate（科室基线爽约率%）</p>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <Button icon={<DownloadOutlined />} block onClick={() => downloadTemplate(departmentTemplate, 'departments_template.csv')}>
                        下载科室模板
                      </Button>
                    </Card>
                  </Col>
                </Row>
              ),
            },
            {
              key: 'slots',
              label: <span><ClockCircleOutlined /> 时段配置数据</span>,
              children: (
                <Row gutter={24}>
                  <Col xs={24} md={14}>
                    <Dragger {...uploadProps('slots')} style={{ padding: 20 }}>
                      <p className="ant-upload-drag-icon"><ClockCircleOutlined style={{ fontSize: 48, color: '#722ed1' }} /></p>
                      <p className="ant-upload-text">上传时段配置文件</p>
                      <p className="ant-upload-hint">各科室每周时段排班、容量、历史爽约统计等</p>
                    </Dragger>
                    <div style={{ marginTop: 16 }}>{renderResult(importState.slots)}</div>
                  </Col>
                  <Col xs={24} md={10}>
                    <Card title="字段说明" size="small" style={{ background: '#fafafa' }}>
                      <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                        <p><Tag color="red">必填</Tag> department_code, day_of_week(0-6), start_time, end_time</p>
                        <p><Tag color="blue">推荐</Tag> capacity, historical_no_show_count, historical_total_count</p>
                      </div>
                      <Divider style={{ margin: '12px 0' }} />
                      <Button icon={<DownloadOutlined />} block onClick={() => downloadTemplate(slotTemplate, 'timeslots_template.csv')}>
                        下载时段模板
                      </Button>
                    </Card>
                  </Col>
                </Row>
              ),
            },
          ]}
        />
      </Card>

      <Alert
        style={{ marginTop: 16 }}
        type="info"
        showIcon
        message="数据合规说明"
        description={
          <div>
            <p>1. 本系统<strong>不涉及诊断</strong>，仅用于门诊运营层面的爽约风险提醒</p>
            <p>2. 系统会<strong>自动过滤歧视性字段</strong>（种族、民族、宗教、收入、婚姻等），确保模型公平性</p>
            <p>3. 评分仅用于运营决策参考，最终是否回访/提醒由<strong>人工确认</strong>后执行</p>
            <p>4. 每次模型版本变化均会<strong>完整记录</strong>，支持复核和回滚</p>
          </div>
        }
      />
    </div>
  )
}

export default DataImport
