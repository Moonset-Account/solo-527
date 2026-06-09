import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, Drawer, Form, Input, App,
  Modal, Row, Col, Progress, Badge, Tooltip, Alert,
} from 'antd'
import {
  PhoneOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  FilterOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { api } from '../api'

const priorityColor = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }
const priorityText = { low: '低', medium: '中', high: '高', critical: '紧急' }

const statusColor = {
  pending: 'default', in_progress: 'processing', completed: 'success', cancelled: 'error',
}
const statusText = {
  pending: '待回访', in_progress: '回访中', completed: '已完成', cancelled: '已取消',
}
const statusIcon = {
  pending: <ClockCircleOutlined />,
  in_progress: <PlayCircleOutlined />,
  completed: <CheckCircleOutlined />,
  cancelled: <CloseCircleOutlined />,
}

const Callbacks = () => {
  const { message, modal } = App.useApp()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState({ status: undefined, priority: undefined })
  const [editDrawer, setEditDrawer] = useState({ open: false, data: null })
  const [editForm] = Form.useForm()
  const [genModal, setGenModal] = useState({ open: false })
  const [genForm] = Form.useForm()

  const load = () => {
    setLoading(true)
    api.callbacks.list({ limit: 200, ...filter })
      .then(setList)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [filter])

  const stats = list.reduce((acc, r) => {
    acc.total++
    acc[r.callback_status] = (acc[r.callback_status] || 0) + 1
    acc[r.priority] = (acc[r.priority] || 0) + 1
    return acc
  }, { total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0, critical: 0, high: 0, medium: 0, low: 0 })

  const openEdit = (rec) => {
    editForm.setFieldsValue({
      callback_status: rec.callback_status,
      callback_result: rec.callback_result,
      patient_response: rec.patient_response,
      notes: rec.notes,
      assigned_to: rec.assigned_to,
    })
    setEditDrawer({ open: true, data: rec })
  }

  const submitEdit = async () => {
    const values = await editForm.validateFields()
    try {
      await api.callbacks.update(editDrawer.data.id, values)
      message.success('回访记录已更新')
      setEditDrawer({ open: false, data: null })
      load()
    } catch (e) { message.error('更新失败') }
  }

  const generateCallbacks = async () => {
    const values = await genForm.validateFields()
    try {
      const res = await api.callbacks.generate(values)
      message.success(`已生成 ${res.length} 条回访任务`)
      setGenModal({ open: false })
      load()
    } catch (e) { message.error('生成失败') }
  }

  const columns = [
    { title: '优先级', dataIndex: 'priority', key: 'p', width: 90,
      render: v => <Tag color={priorityColor[v]}>{priorityText[v]}</Tag> },
    { title: '状态', dataIndex: 'callback_status', key: 's', width: 100,
      render: v => <Badge status={statusColor[v]} text={<span>{statusIcon[v]} {statusText[v]}</span>} /> },
    { title: '预约号', dataIndex: 'appointment_no', key: 'no', width: 130 },
    { title: '患者', key: 'p2', width: 90,
      render: (_, r) => <span>{r.patient_gender || '-'} / {r.patient_age || '-'}岁</span> },
    { title: '科室', dataIndex: 'department_name', key: 'dept', width: 110 },
    { title: '就诊时间', key: 't', width: 140,
      render: (_, r) => <span>{r.appointment_date?.slice(5)} {r.appointment_time?.slice(0, 5)}</span> },
    { title: '风险', key: 'r', width: 120,
      render: (_, r) => (
        <Space>
          <Progress percent={Math.round((r.risk_score || 0) * 100)} size="small"
            strokeColor={priorityColor[r.priority]} showInfo={false} style={{ width: 60 }} />
          <Tag color={priorityColor[r.priority]}>{Math.round((r.risk_score || 0) * 100)}%</Tag>
        </Space>
      ) },
    { title: '负责人', dataIndex: 'assigned_to_name', key: 'a', width: 100,
      render: v => v || <Tag color="default">未分配</Tag> },
    { title: '回访结果', dataIndex: 'callback_result', key: 'res', width: 110,
      render: v => v ? <Tag>{v}</Tag> : '-' },
    { title: '患者反馈', dataIndex: 'patient_response', key: 'pr', width: 100,
      render: v => v ? <Tag color="blue">{v}</Tag> : '-' },
    {
      title: '操作', key: 'op', width: 100,
      render: (_, r) => (
        <Space>
          <Tooltip title="更新回访状态">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}><Card size="small"><Progress type="dashboard" size={80} percent={stats.total ? Math.round(stats.completed / stats.total * 100) : 0} format={p => <span>{p}%</span>} /><div style={{ textAlign: 'center' }}>完成率</div></Card></Col>
        <Col xs={6} md={3}><Card size="small" style={{ borderTop: '3px solid #1677ff' }}><div style={{ color: '#888' }}>总任务</div><div style={{ fontSize: 28, fontWeight: 600 }}>{stats.total}</div></Card></Col>
        <Col xs={6} md={3}><Card size="small" style={{ borderTop: '3px solid #faad14' }}><div style={{ color: '#888' }}>待回访</div><div style={{ fontSize: 28, fontWeight: 600, color: '#faad14' }}>{stats.pending}</div></Card></Col>
        <Col xs={6} md={3}><Card size="small" style={{ borderTop: '3px solid #f5222d' }}><div style={{ color: '#888' }}>紧急</div><div style={{ fontSize: 28, fontWeight: 600, color: '#f5222d' }}>{stats.critical + stats.high}</div></Card></Col>
        <Col xs={6} md={3}><Card size="small" style={{ borderTop: '3px solid #52c41a' }}><div style={{ color: '#888' }}>已完成</div><div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>{stats.completed}</div></Card></Col>
      </Row>

      <Card
        className="card-shadow"
        title="人工回访名单管理"
        extra={
          <Space>
            <Button type="primary" icon={<PhoneOutlined />} onClick={() => setGenModal({ open: true })}>
              智能生成回访名单
            </Button>
            <Select placeholder="状态筛选" style={{ width: 130 }} allowClear
              onChange={v => setFilter(f => ({ ...f, status: v }))}>
              {Object.entries(statusText).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
            </Select>
            <Select placeholder="优先级" style={{ width: 120 }} allowClear
              onChange={v => setFilter(f => ({ ...f, priority: v }))}>
              {Object.entries(priorityText).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
            </Select>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="运营策略说明"
          description="高/极高风险患者优先回访；建议在就诊前24小时和2小时分别提醒；回访记录将作为模型迭代的反馈数据"
        />
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 1300 }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="更新回访记录"
        open={editDrawer.open}
        onClose={() => setEditDrawer({ open: false, data: null })}
        width={520}
      >
        {editDrawer.data && (
          <>
            <Alert type="info" showIcon style={{ marginBottom: 16 }}
              message={`预约号：${editDrawer.data.appointment_no}`}
              description={`${editDrawer.data.department_name} - ${editDrawer.data.doctor_name || ''}，${editDrawer.data.appointment_date} ${editDrawer.data.appointment_time}`} />
            <Form form={editForm} layout="vertical">
              <Form.Item label="回访状态" name="callback_status" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="pending">待回访</Select.Option>
                  <Select.Option value="in_progress">回访中</Select.Option>
                  <Select.Option value="completed">已完成</Select.Option>
                  <Select.Option value="cancelled">已取消</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="回访结果" name="callback_result">
                <Select>
                  <Select.Option value="confirmed">确认就诊</Select.Option>
                  <Select.Option value="rescheduled">已改约</Select.Option>
                  <Select.Option value="cancelled">主动取消</Select.Option>
                  <Select.Option value="unreachable">联系不上</Select.Option>
                  <Select.Option value="reject">拒绝回访</Select.Option>
                  <Select.Option value="other">其他</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="患者反馈" name="patient_response">
                <Select>
                  <Select.Option value="will_attend">会准时到院</Select.Option>
                  <Select.Option value="may_delay">可能会迟到</Select.Option>
                  <Select.Option value="maybe_cancel">考虑取消</Select.Option>
                  <Select.Option value="unsure">不确定</Select.Option>
                  <Select.Option value="no_response">无明确答复</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="回访备注" name="notes">
                <Input.TextArea rows={4} placeholder="记录与患者的沟通内容、特殊情况等" />
              </Form.Item>
            </Form>
            <Space style={{ marginTop: 16 }}>
              <Button type="primary" onClick={submitEdit}>保存更新</Button>
              <Button onClick={() => setEditDrawer({ open: false, data: null })}>取消</Button>
            </Space>
          </>
        )}
      </Drawer>

      <Modal
        title="智能生成回访名单"
        open={genModal.open}
        onCancel={() => setGenModal({ open: false })}
        onOk={generateCallbacks}
        okText="生成任务"
      >
        <Alert type="info" showIcon style={{ marginBottom: 16 }}
          message="系统将根据风险等级自动选出需要回访的患者"
          description="极高/高风险优先，支持按科室、时间范围筛选" />
        <Form form={genForm} layout="vertical" initialValues={{ min_risk_level: 'high', max_count: 50 }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="最低风险等级" name="min_risk_level" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="medium">🟡 中风险及以上</Select.Option>
                  <Select.Option value="high">🟠 高风险及以上</Select.Option>
                  <Select.Option value="critical">🔴 仅极高风险</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="最大数量" name="max_count" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value={20}>20 条</Select.Option>
                  <Select.Option value={50}>50 条</Select.Option>
                  <Select.Option value={100}>100 条</Select.Option>
                  <Select.Option value={200}>200 条</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Callbacks
