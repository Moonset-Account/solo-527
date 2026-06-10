import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Input,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Tabs,
  Select,
  DatePicker,
  List,
  Avatar,
  Empty,
} from 'antd'
import {
  SearchOutlined,
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  BellOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { patientApi, appointmentApi, followUpApi } from '../services'

const { Option } = Select

function PatientListPage() {
  const [patients, setPatients] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [searchText, setSearchText] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [addForm] = Form.useForm()
  const [followUpModalVisible, setFollowUpModalVisible] = useState(false)
  const [followUpForm] = Form.useForm()

  useEffect(() => {
    loadPatients()
  }, [pagination.current, pagination.pageSize, searchText])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const data = await patientApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        name: searchText || undefined,
      })
      setPatients(data.list || [])
      setTotal(data.total || 0)
    } catch (err) {
      message.error('加载患者列表失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (patient) => {
    try {
      const detail = await patientApi.get(patient.id)
      setSelectedPatient(detail)
      setDetailVisible(true)
    } catch (err) {
      message.error('加载患者详情失败')
    }
  }

  const handleAddPatient = async () => {
    try {
      const values = await addForm.validateFields()
      await patientApi.create({
        ...values,
        birthDate: values.birthDate?.toISOString(),
        clinicId: 1,
      })
      message.success('患者创建成功')
      setAddModalVisible(false)
      addForm.resetFields()
      loadPatients()
    } catch (err) {
      message.error('创建失败')
    }
  }

  const handleAddFollowUp = async () => {
    try {
      const values = await followUpForm.validateFields()
      await followUpApi.create({
        patientId: selectedPatient.id,
        ...values,
        planDate: values.planDate?.toISOString(),
        operatorName: '管理员',
      })
      message.success('随访任务创建成功')
      setFollowUpModalVisible(false)
      followUpForm.resetFields()
      if (selectedPatient) {
        const detail = await patientApi.get(selectedPatient.id)
        setSelectedPatient(detail)
      }
    } catch (err) {
      message.error('创建失败')
    }
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      width: 100,
    },
    {
      title: '性别',
      dataIndex: 'gender',
      width: 60,
      render: (v) => (
        <Tag color={v === 'male' ? 'blue' : 'pink'}>
          {v === 'male' ? '男' : '女'}
        </Tag>
      ),
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      width: 130,
    },
    {
      title: '出生日期',
      dataIndex: 'birthDate',
      width: 110,
      render: (v) => (v ? dayjs(v).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '就诊次数',
      dataIndex: ['_count', 'appointments'],
      width: 90,
      render: (v) => `${v || 0} 次`,
    },
    {
      title: '过敏史',
      dataIndex: 'allergy',
      ellipsis: true,
      render: (v) => v || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      width: 160,
      render: (v) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<CalendarOutlined />}>
            预约
          </Button>
          <Button
            type="link"
            size="small"
            icon={<BellOutlined />}
            onClick={() => {
              setSelectedPatient(record)
              setFollowUpModalVisible(true)
            }}
          >
            加随访
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Input
            placeholder="搜索患者姓名或手机号"
            style={{ width: 300 }}
            allowClear
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={loadPatients}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            新增患者
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <Avatar size="large">{selectedPatient?.name?.[0]}</Avatar>
            <div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{selectedPatient?.name}</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {selectedPatient?.gender === 'male' ? '男' : '女'} · {selectedPatient?.phone}
              </div>
            </div>
          </Space>
        }
        width={600}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          <Space>
            <Button type="primary" icon={<CalendarOutlined />} size="small">
              立即预约
            </Button>
            <Button icon={<BellOutlined />} size="small" onClick={() => setFollowUpModalVisible(true)}>
              加随访
            </Button>
          </Space>
        }
      >
        {selectedPatient && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Descriptions title="基本信息" column={2} size="small" bordered>
              <Descriptions.Item label="手机号">{selectedPatient.phone}</Descriptions.Item>
              <Descriptions.Item label="身份证号">
                {selectedPatient.idCard || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="出生日期">
                {selectedPatient.birthDate
                  ? dayjs(selectedPatient.birthDate).format('YYYY-MM-DD')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="所属诊所">
                {selectedPatient.clinic?.name}
              </Descriptions.Item>
              <Descriptions.Item label="过敏史" span={2}>
                {selectedPatient.allergy || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="既往病史" span={2}>
                {selectedPatient.medicalHistory || '无'}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={2}>
                {selectedPatient.address || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="appointments"
              items={[
                {
                  key: 'appointments',
                  label: `就诊记录 (${selectedPatient.appointments?.length || 0})`,
                },
                {
                  key: 'records',
                  label: `病历 (${selectedPatient.records?.length || 0})`,
                },
                {
                  key: 'followups',
                  label: `随访任务 (${selectedPatient.followUps?.length || 0})`,
                },
                { key: 'status', label: '状态历史' },
              ]}
            >
              <div style={{ marginTop: 12, maxHeight: 400, overflow: 'auto' }}>
                {selectedPatient.appointments?.length > 0 ? (
                  <Timeline
                    className="timeline-compact"
                    items={selectedPatient.appointments.map((appt) => ({
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
                            <div
                              style={{
                                fontSize: 12,
                                color: '#13c2c2',
                                marginTop: 4,
                                padding: 6,
                                background: '#e6fffb',
                                borderRadius: 4,
                              }}
                            >
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
                ) : (
                  <Empty description="暂无就诊记录" />
                )}
              </div>
            </Tabs>
          </Space>
        )}
      </Drawer>

      <Modal
        title="新增患者"
        open={addModalVisible}
        onOk={handleAddPatient}
        onCancel={() => setAddModalVisible(false)}
        okText="保存"
      >
        <Form form={addForm} layout="vertical">
          <Form.Item
            label="姓名"
            name="name"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入患者姓名" />
          </Form.Item>
          <Form.Item
            label="手机号"
            name="phone"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
            ]}
          >
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item
            label="性别"
            name="gender"
            rules={[{ required: true, message: '请选择性别' }]}
          >
            <Select placeholder="请选择性别">
              <Option value="male">男</Option>
              <Option value="female">女</Option>
            </Select>
          </Form.Item>
          <Form.Item label="出生日期" name="birthDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="过敏史" name="allergy">
            <Input.TextArea rows={2} placeholder="请输入过敏史（选填）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加随访任务"
        open={followUpModalVisible}
        onOk={handleAddFollowUp}
        onCancel={() => setFollowUpModalVisible(false)}
        okText="创建"
      >
        <Form form={followUpForm} layout="vertical">
          <Form.Item
            label="随访类型"
            name="type"
            rules={[{ required: true, message: '请选择随访类型' }]}
          >
            <Select placeholder="请选择随访类型">
              <Option value="post_op">术后随访</Option>
              <Option value="return_reminder">复诊提醒</Option>
              <Option value="treatment_follow">疗效跟踪</Option>
              <Option value="other">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="计划随访日期"
            name="planDate"
            rules={[{ required: true, message: '请选择日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            label="随访内容"
            name="content"
            rules={[{ required: true, message: '请输入随访内容' }]}
          >
            <Input.TextArea rows={4} placeholder="请输入随访内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default PatientListPage
