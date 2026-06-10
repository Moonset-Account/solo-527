import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  DatePicker,
  Input,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Tabs,
  Popconfirm,
  List,
  Avatar,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StopOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { appointmentApi, recordApi, followUpApi } from '../services'

const { RangePicker } = DatePicker
const { Option } = Select

function AppointmentListPage() {
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20 })
  const [filters, setFilters] = useState({})
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [statusModalVisible, setStatusModalVisible] = useState(false)
  const [statusForm] = Form.useForm()
  const [recordModalVisible, setRecordModalVisible] = useState(false)
  const [recordForm] = Form.useForm()

  useEffect(() => {
    loadAppointments()
  }, [pagination.current, pagination.pageSize, filters])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await appointmentApi.list({
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...filters,
      })
      setAppointments(data.list || [])
      setTotal(data.total || 0)
    } catch (err) {
      message.error('加载预约列表失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (appt) => {
    try {
      const detail = await appointmentApi.get(appt.id)
      setSelectedAppointment(detail)
      setDetailVisible(true)
    } catch (err) {
      message.error('加载预约详情失败')
    }
  }

  const openStatusModal = (appt, status) => {
    setSelectedAppointment(appt)
    statusForm.setFieldsValue({ status, remark: '' })
    setStatusModalVisible(true)
  }

  const handleStatusChange = async () => {
    try {
      const values = await statusForm.validateFields()
      await appointmentApi.update(selectedAppointment.id, {
        status: values.status,
        remark: values.remark,
        operatorName: '管理员',
      })
      message.success('状态更新成功')
      setStatusModalVisible(false)
      loadAppointments()
      if (selectedAppointment) {
        const detail = await appointmentApi.get(selectedAppointment.id)
        setSelectedAppointment(detail)
      }
    } catch (err) {
      message.error('更新失败')
    }
  }

  const openRecordModal = (appt) => {
    setSelectedAppointment(appt)
    recordForm.resetFields()
    setRecordModalVisible(true)
  }

  const handleRecordSubmit = async () => {
    try {
      const values = await recordForm.validateFields()
      await recordApi.create({
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        doctorId: selectedAppointment.doctorId,
        ...values,
        operatorName: '管理员',
      })
      message.success('病历创建成功')
      setRecordModalVisible(false)
      loadAppointments()
    } catch (err) {
      message.error('创建失败')
    }
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

  const columns = [
    {
      title: '预约编号',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '患者',
      dataIndex: ['patient', 'name'],
      width: 100,
    },
    {
      title: '手机号',
      dataIndex: ['patient', 'phone'],
      width: 120,
    },
    {
      title: '医生',
      dataIndex: ['doctor', 'name'],
      width: 100,
    },
    {
      title: '预约日期',
      dataIndex: 'appointDate',
      width: 110,
      render: (v) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '时间',
      width: 100,
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '主诉',
      dataIndex: 'chiefComplaint',
      ellipsis: true,
    },
    {
      title: '类型',
      width: 80,
      render: (_, record) =>
        record.isReturnVisit ? (
          <Tag color="purple">复诊</Tag>
        ) : (
          <Tag color="cyan">初诊</Tag>
        ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (v) => getStatusTag(v),
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
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => openStatusModal(record, 'confirmed')}
            >
              确认
            </Button>
          )}
          {record.status === 'confirmed' && (
            <Button
              type="link"
              size="small"
              icon={<FileTextOutlined />}
              onClick={() => openRecordModal(record)}
            >
              写病历
            </Button>
          )}
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Popconfirm
              title="确定取消预约?"
              onConfirm={() => openStatusModal(record, 'cancelled')}
            >
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />}>
                取消
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
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Input
            placeholder="搜索患者姓名"
            style={{ width: 200 }}
            allowClear
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="预约状态"
            style={{ width: 150 }}
            allowClear
            onChange={(v) => setFilters({ ...filters, status: v })}
          >
            <Option value="pending">待确认</Option>
            <Option value="confirmed">已确认</Option>
            <Option value="completed">已完成</Option>
            <Option value="cancelled">已取消</Option>
            <Option value="no_show">爽约</Option>
          </Select>
          <RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  startDate: dates[0].toISOString(),
                  endDate: dates[1].toISOString(),
                })
              }
            }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={loadAppointments}>
            查询
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={appointments}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      <Drawer
        title="预约详情"
        width={560}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {selectedAppointment && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="基本信息" column={2} size="small" bordered>
              <Descriptions.Item label="预约编号">{selectedAppointment.id}</Descriptions.Item>
              <Descriptions.Item label="状态">{getStatusTag(selectedAppointment.status)}</Descriptions.Item>
              <Descriptions.Item label="患者">{selectedAppointment.patient?.name}</Descriptions.Item>
              <Descriptions.Item label="手机号">{selectedAppointment.patient?.phone}</Descriptions.Item>
              <Descriptions.Item label="医生">{selectedAppointment.doctor?.name}</Descriptions.Item>
              <Descriptions.Item label="诊所">{selectedAppointment.clinic?.name}</Descriptions.Item>
              <Descriptions.Item label="预约日期">
                {dayjs(selectedAppointment.appointDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="时间">
                {selectedAppointment.startTime} - {selectedAppointment.endTime}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {selectedAppointment.isReturnVisit ? '复诊' : '初诊'}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{selectedAppointment.source}</Descriptions.Item>
              <Descriptions.Item label="主诉" span={2}>
                {selectedAppointment.chiefComplaint}
              </Descriptions.Item>
              {selectedAppointment.remark && (
                <Descriptions.Item label="备注" span={2}>
                  {selectedAppointment.remark}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedAppointment.medicalRecord && (
              <Descriptions title="病历信息" column={1} size="small" bordered>
                <Descriptions.Item label="诊断">
                  {selectedAppointment.medicalRecord.diagnosis}
                </Descriptions.Item>
                <Descriptions.Item label="治疗方案">
                  {selectedAppointment.medicalRecord.treatment}
                </Descriptions.Item>
                <Descriptions.Item label="病历摘要">
                  {selectedAppointment.medicalRecord.summary}
                </Descriptions.Item>
              </Descriptions>
            )}

            {selectedAppointment.patient && (
              <Card
                size="small"
                title="患者快速信息"
                extra={
                  <Button type="link" size="small">查看完整档案</Button>
                }
              >
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <span style={{ color: '#888' }}>过敏史: </span>
                    {selectedAppointment.patient.allergy || '无'}
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>既往史: </span>
                    {selectedAppointment.patient.medicalHistory || '无'}
                  </div>
                  <div>
                    <span style={{ color: '#888' }}>就诊次数: </span>
                    {selectedAppointment.patient.appointments?.length || 0} 次
                  </div>
                  {selectedAppointment.patient.records?.slice(0, 2).map((r) => (
                    <div key={r.id} style={{ padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                      <div style={{ fontSize: 12, color: '#13c2c2', marginBottom: 4 }}>
                        {dayjs(r.createdAt).format('YYYY-MM-DD')} 就诊
                      </div>
                      <div style={{ fontSize: 12 }}>{r.summary}</div>
                    </div>
                  ))}
                </Space>
              </Card>
            )}

            <Tabs
              defaultActiveKey="status"
              size="small"
              items={[
                { key: 'status', label: '状态历史' },
                { key: 'operation', label: '操作日志' },
              ]}
            >
              <div style={{ marginTop: 12 }}>
                <Timeline
                  className="timeline-compact"
                  items={selectedAppointment.statusHistory?.map((h) => ({
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
                        {h.remark && (
                          <div style={{ fontSize: 12, marginTop: 4 }}>{h.remark}</div>
                        )}
                      </div>
                    ),
                  }))}
                />
              </div>
            </Tabs>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {(selectedAppointment.status === 'pending' || selectedAppointment.status === 'confirmed') && (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={() => openStatusModal(selectedAppointment, 'cancelled')}
                >
                  取消预约
                </Button>
              )}
              {selectedAppointment.status === 'pending' && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => openStatusModal(selectedAppointment, 'confirmed')}
                >
                  确认预约
                </Button>
              )}
            </div>
          </Space>
        )}
      </Drawer>

      <Modal
        title="状态变更"
        open={statusModalVisible}
        onOk={handleStatusChange}
        onCancel={() => setStatusModalVisible(false)}
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item label="目标状态" name="status">
            <Select disabled>
              <Option value="confirmed">已确认</Option>
              <Option value="completed">已完成</Option>
              <Option value="cancelled">已取消</Option>
              <Option value="no_show">爽约</Option>
            </Select>
          </Form.Item>
          <Form.Item label="变更原因" name="remark">
            <Input.TextArea rows={3} placeholder="请输入变更原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="填写病历"
        open={recordModalVisible}
        onOk={handleRecordSubmit}
        onCancel={() => setRecordModalVisible(false)}
        width={600}
        okText="保存病历"
      >
        <Form form={recordForm} layout="vertical">
          <Form.Item
            label="诊断"
            name="diagnosis"
            rules={[{ required: true, message: '请填写诊断' }]}
          >
            <Input placeholder="请输入诊断结果" />
          </Form.Item>
          <Form.Item
            label="治疗方案"
            name="treatment"
            rules={[{ required: true, message: '请填写治疗方案' }]}
          >
            <Input.TextArea rows={3} placeholder="请输入治疗方案" />
          </Form.Item>
          <Form.Item
            label="病历摘要"
            name="summary"
            rules={[{ required: true, message: '请填写病历摘要' }]}
            extra="摘要将在患者档案中快速显示"
          >
            <Input.TextArea rows={3} placeholder="请输入病历核心摘要（一句话总结）" maxLength={200} showCount />
          </Form.Item>
          <Form.Item label="处方" name="prescription">
            <Input.TextArea rows={2} placeholder="处方信息（可选）" />
          </Form.Item>
          <Form.Item label="费用" name="cost">
            <Input prefix="¥" placeholder="请输入费用（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AppointmentListPage
