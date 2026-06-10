import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Select,
  Modal,
  Form,
  Input,
  message,
  Drawer,
  Descriptions,
  List,
  Avatar,
  Tabs,
  Radio,
  Checkbox,
  Divider,
  Badge,
} from 'antd'
import {
  WarningOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined,
  UserOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { conflictApi, appointmentApi } from '../services'

const { Option } = Select
const { TextArea } = Input

function ConflictPage() {
  const [conflicts, setConflicts] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('pending')
  const [detailVisible, setDetailVisible] = useState(false)
  const [selectedConflict, setSelectedConflict] = useState(null)
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [resolveForm] = Form.useForm()
  const [selectedAppointments, setSelectedAppointments] = useState([])

  useEffect(() => {
    loadConflicts()
  }, [status])

  const loadConflicts = async () => {
    setLoading(true)
    try {
      const data = await conflictApi.list({ status })
      setConflicts(data)
    } catch (err) {
      message.error('加载冲突列表失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (conflict) => {
    try {
      const detail = await conflictApi.get(conflict.id)
      setSelectedConflict(detail)
      setDetailVisible(true)
      setSelectedAppointments([])
    } catch (err) {
      message.error('加载冲突详情失败')
    }
  }

  const openResolveModal = async (conflict) => {
    try {
      let detail = conflict
      if (!conflict.timeSlot?.appointments || conflict.timeSlot.appointments.length === 0
        || !conflict.timeSlot?.appointments[0]?.patient) {
        detail = await conflictApi.get(conflict.id)
      }
      setSelectedConflict(detail)
      resolveForm.resetFields()
      setSelectedAppointments([])
      setResolveModalVisible(true)
    } catch (err) {
      message.error('加载冲突详情失败')
    }
  }

  const handleResolve = async () => {
    try {
      const values = await resolveForm.validateFields()
      const cancelIds = values.appointmentIdsToCancel || selectedAppointments
      await conflictApi.resolve(selectedConflict.id, {
        resolutionNote: values.resolutionNote,
        resolverName: '管理员',
        action: values.action,
        appointmentIdsToCancel: cancelIds,
      })
      message.success('冲突已处理，已同步更新号源状态和复诊率统计')
      setResolveModalVisible(false)
      setSelectedAppointments([])
      loadConflicts()
    } catch (err) {
      if (err?.errorFields) {
        message.warning('请完善表单必填项')
        return
      }
      message.error('处理失败：' + (err?.response?.data?.error || err.message || '未知错误'))
    }
  }

  const handleDismiss = async (conflict) => {
    try {
      await conflictApi.dismiss(conflict.id, {
        resolutionNote: '无需处理',
        resolverName: '管理员',
      })
      message.success('已标记为无需处理')
      loadConflicts()
    } catch (err) {
      message.error('操作失败')
    }
  }

  const getConflictTypeTag = (type) => {
    const map = {
      double_booking: { color: 'red', text: '重复预约' },
      schedule_overlap: { color: 'orange', text: '排班冲突' },
      other: { color: 'default', text: '其他' },
    }
    const cfg = map[type] || { color: 'default', text: type }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const getStatusTag = (status) => {
    const map = {
      pending: { color: 'red', text: '待处理' },
      resolved: { color: 'green', text: '已解决' },
      dismissed: { color: 'default', text: '已忽略' },
    }
    const cfg = map[status] || { color: 'default', text: status }
    return <Tag color={cfg.color}>{cfg.text}</Tag>
  }

  const columns = [
    {
      title: '冲突编号',
      dataIndex: 'id',
      width: 80,
    },
    {
      title: '冲突类型',
      dataIndex: 'conflictType',
      width: 120,
      render: (v) => getConflictTypeTag(v),
    },
    {
      title: '号源时段',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <span>
            {record.timeSlot?.schedule?.doctor?.name} -{' '}
            {dayjs(record.timeSlot?.schedule?.date).format('MM-DD')}
          </span>
          <span style={{ color: '#888', fontSize: 12 }}>
            {record.timeSlot?.startTime} - {record.timeSlot?.endTime}
          </span>
        </Space>
      ),
    },
    {
      title: '诊所',
      dataIndex: ['timeSlot', 'schedule', 'clinic', 'name'],
      width: 120,
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (v) => getStatusTag(v),
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
          {record.status === 'pending' && (
            <>
              <Button
                type="link"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => openResolveModal(record)}
              >
                处理
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleDismiss(record)}
              >
                忽略
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Badge count={conflicts.filter((c) => c.status === 'pending').length} size="small">
            <span style={{ fontWeight: 500 }}>号源冲突</span>
          </Badge>
          <Select value={status} onChange={setStatus} style={{ width: 150 }}>
            <Option value="pending">待处理</Option>
            <Option value="resolved">已解决</Option>
            <Option value="dismissed">已忽略</Option>
          </Select>
          <Button onClick={loadConflicts}>刷新</Button>
        </div>

        <Table
          columns={columns}
          dataSource={conflicts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <span>号源冲突详情</span>
            {getStatusTag(selectedConflict?.status)}
          </Space>
        }
        width={560}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
        extra={
          selectedConflict?.status === 'pending' && (
            <Space>
              <Button danger icon={<CloseOutlined />} size="small" onClick={() => handleDismiss(selectedConflict)}>
                忽略
              </Button>
              <Button type="primary" icon={<CheckOutlined />} size="small" onClick={() => openResolveModal(selectedConflict)}>
                处理冲突
              </Button>
            </Space>
          )
        }
      >
        {selectedConflict && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Descriptions title="冲突信息" column={1} size="small" bordered>
              <Descriptions.Item label="冲突类型">
                {getConflictTypeTag(selectedConflict.conflictType)}
              </Descriptions.Item>
              <Descriptions.Item label="冲突描述">{selectedConflict.description}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedConflict.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              {selectedConflict.resolvedAt && (
                <>
                  <Descriptions.Item label="处理时间">
                    {dayjs(selectedConflict.resolvedAt).format('YYYY-MM-DD HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="处理人">{selectedConflict.resolverName}</Descriptions.Item>
                  <Descriptions.Item label="处理说明">{selectedConflict.resolutionNote}</Descriptions.Item>
                </>
              )}
            </Descriptions>

            <Card size="small" title="涉及号源">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div>
                  <span style={{ color: '#888' }}>医生: </span>
                  {selectedConflict.timeSlot?.schedule?.doctor?.name}
                </div>
                <div>
                  <span style={{ color: '#888' }}>日期: </span>
                  {dayjs(selectedConflict.timeSlot?.schedule?.date).format('YYYY-MM-DD')}
                </div>
                <div>
                  <span style={{ color: '#888' }}>时段: </span>
                  {selectedConflict.timeSlot?.startTime} - {selectedConflict.timeSlot?.endTime}
                </div>
                <div>
                  <span style={{ color: '#888' }}>诊所: </span>
                  {selectedConflict.timeSlot?.schedule?.clinic?.name}
                </div>
              </Space>
            </Card>

            <Card size="small" title={`涉及预约 (${selectedConflict.timeSlot?.appointments?.length || 0})`}>
              <List
                size="small"
                dataSource={selectedConflict.timeSlot?.appointments || []}
                renderItem={(appt) => (
                  <List.Item key={appt.id}>
                    <List.Item.Meta
                      avatar={<Avatar size="small">{appt.patient?.name?.[0]}</Avatar>}
                      title={
                        <Space>
                          <span>{appt.patient?.name}</span>
                          <Tag color={appt.status === 'confirmed' ? 'green' : 'orange'}>
                            {appt.status === 'confirmed' ? '已确认' : '待确认'}
                          </Tag>
                        </Space>
                      }
                      description={
                        <Space size="large" style={{ fontSize: 12 }}>
                          <span>{appt.patient?.phone}</span>
                          <span>{appt.chiefComplaint?.slice(0, 15)}</span>
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Space>
        )}
      </Drawer>

      <Modal
        title="处理号源冲突"
        open={resolveModalVisible}
        onOk={handleResolve}
        onCancel={() => setResolveModalVisible(false)}
        okText="确认处理"
        width={560}
        maskClosable={false}
        destroyOnClose
      >
        <Form form={resolveForm} layout="vertical">
          <Descriptions
            column={2}
            size="small"
            style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6 }}
          >
            <Descriptions.Item label="冲突类型">
              {getConflictTypeTag(selectedConflict?.conflictType)}
            </Descriptions.Item>
            <Descriptions.Item label="涉及号源">
              {selectedConflict?.timeSlot?.schedule?.doctor?.name} {' '}
              {dayjs(selectedConflict?.timeSlot?.schedule?.date).format('MM-DD')} {' '}
              {selectedConflict?.timeSlot?.startTime}
            </Descriptions.Item>
          </Descriptions>

          <Form.Item
            label="处理方式"
            name="action"
            rules={[{ required: true, message: '请选择处理方式' }]}
          >
            <Radio.Group>
              <Radio value="cancel">取消部分预约（解决号源冲突）</Radio>
              <Radio value="adjust">调整号源安排（后续手动处理）</Radio>
              <Radio value="other">其他处理（记录说明）</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => {
              const action = getFieldValue('action')
              const appointments = selectedConflict?.timeSlot?.appointments || []
              return action === 'cancel' ? (
                <Form.Item
                  label={
                    <Space>
                      <span>选择要取消的预约</span>
                      <Tag color="red" style={{ margin: 0 }}>
                        共 {appointments.length} 个冲突预约，需选择至少 1 个取消
                      </Tag>
                    </Space>
                  }
                  name="appointmentIdsToCancel"
                  rules={[
                    { required: true, message: '请选择要取消的预约' },
                    {
                      validator: (_, value) => {
                        if (value && value.length > 0) return Promise.resolve()
                        return Promise.reject(new Error('请至少选择一个预约取消'))
                      },
                    },
                  ]}
                >
                  <Checkbox.Group
                    style={{ width: '100%' }}
                    value={selectedAppointments}
                    onChange={(values) => {
                      setSelectedAppointments(values)
                      resolveForm.setFieldsValue({ appointmentIdsToCancel: values })
                    }}
                  >
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {appointments.length === 0 ? (
                        <div style={{ color: '#999', padding: 12, textAlign: 'center' }}>
                          暂无冲突预约数据
                        </div>
                      ) : (
                        appointments.map((appt) => (
                          <div
                            key={appt.id}
                            style={{
                              padding: 10,
                              border: '1px solid #f0f0f0',
                              borderRadius: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#fff',
                            }}
                          >
                            <Checkbox value={appt.id} />
                            <Avatar size="small">{appt.patient?.name?.[0]}</Avatar>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>
                                {appt.patient?.name}
                                <span style={{ marginLeft: 8 }}>
                                  <Tag color={appt.status === 'confirmed' ? 'green' : 'orange'}>
                                    {appt.status === 'confirmed' ? '已确认' : '待确认'}
                                  </Tag>
                                  {appt.isReturnVisit && <Tag color="purple">复诊</Tag>}
                                </span>
                              </div>
                              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                                <Space size="large">
                                  <span>{appt.patient?.phone}</span>
                                  <span>
                                    {dayjs(appt.appointDate).format('MM-DD')} {appt.startTime}
                                  </span>
                                </Space>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  marginTop: 4,
                                  padding: 4,
                                  background: '#e6fffb',
                                  borderRadius: 4,
                                }}
                              >
                                主诉：{appt.chiefComplaint}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </Space>
                  </Checkbox.Group>
                </Form.Item>
              ) : null
            }}
          </Form.Item>

          <Form.Item
            label="处理说明"
            name="resolutionNote"
            rules={[{ required: true, message: '请输入处理说明' }]}
            extra="负责人处理说明将记录到操作留痕，并同步更新复诊率报表"
          >
            <TextArea rows={3} placeholder="请详细说明处理方式和原因，将永久记录到操作留痕中" />
          </Form.Item>

          <div style={{ padding: 12, background: '#fffbe6', borderRadius: 6, fontSize: 12, color: '#d46b08' }}>
            <WarningOutlined /> 负责人确认处理后：
            <br />• 被取消的预约将记录状态历史并释放号源
            <br />• 系统将按剩余预约数重新计算号源 bookedCount
            <br />• 处理结果将自动同步到复诊率统计报表
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default ConflictPage
