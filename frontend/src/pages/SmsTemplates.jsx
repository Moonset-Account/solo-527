import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, App, Modal, Form, Input, Switch,
  Row, Col, Alert, Tooltip,
} from 'antd'
import {
  MessageOutlined,
  PlusOutlined,
  EditOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  SendOutlined,
  ReloadOutlined,
  FileTextOutlined,
  WarningOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { api } from '../api'

const riskMap = { low: '低', medium: '中', high: '高', critical: '极高' }
const riskColor = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }

const SmsTemplates = () => {
  const { message } = App.useApp()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [editModal, setEditModal] = useState({ open: false, data: null, mode: 'create' })
  const [editForm] = Form.useForm()

  const load = () => {
    setLoading(true)
    api.sms.templates().then(setList).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    editForm.resetFields()
    editForm.setFieldsValue({ risk_level_min: 'medium', is_active: true })
    setEditModal({ open: true, data: null, mode: 'create' })
  }

  const openEdit = (tpl) => {
    editForm.setFieldsValue(tpl)
    setEditModal({ open: true, data: tpl, mode: 'edit' })
  }

  const submitEdit = async () => {
    const values = await editForm.validateFields()
    try {
      if (editModal.mode === 'create') {
        await api.sms.createTemplate(values)
        message.success('模板创建成功')
      } else {
        await api.sms.updateTemplate(editModal.data.id, values)
        message.success('模板更新成功')
      }
      setEditModal({ open: false, data: null, mode: 'create' })
      load()
    } catch (e) { message.error('操作失败') }
  }

  const autoSend = async () => {
    try {
      const res = await api.sms.autoSend()
      message.success(`已自动发送 ${res.total} 条短信：${JSON.stringify(res.sent_by_level)}`)
    } catch (e) { message.error('发送失败') }
  }

  const toggleActive = async (id, checked) => {
    try {
      await api.sms.updateTemplate(id, { is_active: checked })
      message.success('状态已更新')
      load()
    } catch (e) { message.error('更新失败') }
  }

  const columns = [
    { title: '模板编码', dataIndex: 'code', key: 'code', width: 160,
      render: v => <Tag color="blue" icon={<FileTextOutlined />}>{v}</Tag> },
    { title: '模板名称', dataIndex: 'name', key: 'name', width: 180 },
    { title: '适配最低风险', dataIndex: 'risk_level_min', key: 'rl', width: 140,
      render: v => <Tag color={riskColor[v]} icon={<ThunderboltOutlined />}>{riskMap[v]}风险及以上</Tag> },
    { title: '模板内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '占位符示例', key: 'ph', width: 200,
      render: (_, r) => {
        const placeholders = (r.content.match(/\{(\w+)\}/g) || []).map(p => p.slice(1, -1))
        if (!placeholders.length) return <Tag>纯文本</Tag>
        return <Space size={[4, 4]} wrap>{placeholders.map(p => <Tag key={p} color="purple">{`{${p}}`}</Tag>)}</Space>
      } },
    { title: '状态', dataIndex: 'is_active', key: 'st', width: 100,
      render: (v, r) => <Switch checked={v} onChange={c => toggleActive(r.id, c)} checkedChildren="启用" unCheckedChildren="禁用" /> },
    { title: '创建时间', dataIndex: 'created_at', key: 'c', width: 160,
      render: v => v?.slice(0, 19).replace('T', ' ') },
    {
      title: '操作', key: 'act', width: 120,
      render: (_, r) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          <Tooltip title="预览发送">
            <Button type="link" size="small" icon={<SendOutlined />} onClick={() => message.info('模拟发送：模板内容已预览')} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        icon={<SafetyOutlined />}
        message="合规性提示"
        description="短信内容仅用于门诊运营提醒，不涉及诊断信息。发送前需经运营人员确认，发送记录永久留存。支持 {department}{doctor}{date}{time}{patient_id} 等占位符。"
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}>
          <Card size="small"><div style={{ color: '#888' }}>模板总数</div><div style={{ fontSize: 28, fontWeight: 600 }}>{list.length}</div></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><div style={{ color: '#888' }}>已启用</div><div style={{ fontSize: 28, fontWeight: 600, color: '#52c41a' }}>{list.filter(t => t.is_active).length}</div></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><div style={{ color: '#888' }}>覆盖风险等级</div><div style={{ fontSize: 28, fontWeight: 600, color: '#722ed1' }}>
            {new Set(list.filter(t => t.is_active).map(t => t.risk_level_min)).size} 档
          </div></Card>
        </Col>
        <Col xs={12} md={6}>
          <Card size="small"><div style={{ color: '#888' }}>自动发送</div><div style={{ fontSize: 28, fontWeight: 600, color: '#1677ff' }}>待发送</div></Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        title={
          <Space>
            <MessageOutlined />
            短信策略模板管理
            <Tag color="blue">按风险等级差异化触达</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建模板</Button>
            <Button icon={<SendOutlined />} onClick={autoSend}>一键批量发送</Button>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Alert
          type="warning" showIcon icon={<WarningOutlined />} style={{ marginBottom: 16 }}
          message="智能匹配策略"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>系统根据每个患者的<strong>风险等级</strong>自动匹配满足"最低风险"条件的<strong>优先级最高</strong>的模板</li>
              <li>极高风险 → 强化提醒 + 要求确认；高风险 → 定制化提醒；中/低风险 → 标准提醒</li>
              <li>占位符将在发送时动态替换为实际预约信息</li>
              <li>所有发送记录用于后续效果分析（短信送达与爽约率关联）</li>
            </ul>
          }
        />
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={editModal.mode === 'create' ? '新建短信模板' : '编辑短信模板'}
        open={editModal.open}
        onCancel={() => setEditModal({ open: false, data: null, mode: 'create' })}
        onOk={submitEdit}
        okText={editModal.mode === 'create' ? '创建' : '保存'}
        width={640}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="模板编码" name="code" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="如: SMS_HIGH_002" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="模板名称" name="name" rules={[{ required: true }]}>
                <Input placeholder="如: 高风险重点提醒" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item label="适配最低风险等级" name="risk_level_min" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="low">🟢 低风险（及以上）</Select.Option>
                  <Select.Option value="medium">🟡 中风险（及以上）</Select.Option>
                  <Select.Option value="high">🟠 高风险（及以上）</Select.Option>
                  <Select.Option value="critical">🔴 仅极高风险</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="是否启用" name="is_active" valuePropName="checked">
                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="短信内容" name="content" rules={[{ required: true }]}
            extra={
              <span>
                可用占位符：
                <Tag>{"{department}"}</Tag>
                <Tag>{"{doctor}"}</Tag>
                <Tag>{"{date}"}</Tag>
                <Tag>{"{time}"}</Tag>
                <Tag>{"{patient_id}"}</Tag>
              </span>
            }>
            <Input.TextArea rows={4} maxLength={500} showCount
              placeholder="例如：尊敬的患者，您预约的{department} {doctor}门诊将于{date} {time}开始，请准时到院。" />
          </Form.Item>
          {editForm.getFieldValue && (
            <Alert
              type="success" showIcon icon={<CheckCircleOutlined />}
              message="预览"
              description={
                (editForm.getFieldValue?.('content') || '')
                  .replace('{department}', '【示例】神经内科')
                  .replace('{doctor}', '张医生')
                  .replace('{date}', '2024-01-15')
                  .replace('{time}', '09:30')
                  .replace('{patient_id}', 'A20240115001')
              }
            />
          )}
        </Form>
      </Modal>
    </div>
  )
}

export default SmsTemplates
