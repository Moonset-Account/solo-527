import React, { useEffect, useState, useMemo } from 'react'
import {
  Card, Table, Tag, Button, Space, Row, Col, Input, Select, Drawer, Descriptions,
  Progress, Modal, Form, App, Tooltip, Divider, Badge, Popconfirm, Statistic,
} from 'antd'
import {
  ThunderboltOutlined,
  EyeOutlined,
  EditOutlined,
  SendOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  ExclamationCircleFilled,
  CheckCircleFilled,
  MinusCircleFilled,
  ExperimentOutlined,
} from '@ant-design/icons'
import { api } from '../api'

const { Option } = Select
const { confirm } = Modal

const levelColor = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }
const levelText = { low: '低风险', medium: '中风险', high: '高风险', critical: '极高风险' }
const levelEmoji = { low: '🟢', medium: '🟡', high: '🟠', critical: '🔴' }

const ScoringWorkbench = () => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [scores, setScores] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [detailDrawer, setDetailDrawer] = useState({ open: false, data: null, loading: false })
  const [overrideModal, setOverrideModal] = useState({ open: false, data: null })
  const [overrideForm] = Form.useForm()
  const [filters, setFilters] = useState({ risk_level: undefined, needs_callback: undefined })
  const [scoringLoading, setScoringLoading] = useState(false)
  const [departments, setDepartments] = useState([])

  const loadDepartments = async () => {
    try { const r = await api.departments.list(); setDepartments(r) } catch (_) {}
  }

  const loadScores = async (extra = {}) => {
    setLoading(true)
    try {
      const params = { limit: 200, ...filters, ...extra }
      const res = await api.models.scores(params)
      setScores(res)
    } finally { setLoading(false) }
  }

  useEffect(() => { loadDepartments() }, [])
  useEffect(() => { loadScores() }, [filters])

  const runScoring = async () => {
    setScoringLoading(true)
    try {
      const res = await api.models.score({})
      message.success(`评分完成：成功 ${res.success_count}，失败 ${res.failed_count}`)
      loadScores()
    } catch (e) {
      message.error('评分任务执行失败')
    } finally { setScoringLoading(false) }
  }

  const openDetail = async (id) => {
    setDetailDrawer({ open: true, data: null, loading: true })
    try {
      const res = await api.models.scoreDetail(id)
      setDetailDrawer({ open: true, data: res, loading: false })
    } catch (e) {
      setDetailDrawer({ open: false, data: null, loading: false })
    }
  }

  const openOverride = (record) => {
    overrideForm.setFieldsValue({
      corrected_risk_level: record.risk_level,
      corrected_score: record.risk_score,
      reason: '', remark: '',
    })
    setOverrideModal({ open: true, data: record })
  }

  const submitOverride = async () => {
    const values = await overrideForm.validateFields()
    const { data } = overrideModal
    try {
      await api.models.override(data.id, values.corrected_risk_level, values.corrected_score, values.reason)

      await api.feedback.create({
        appointment_id: data.appointment_id,
        risk_score_id: data.id,
        original_risk_level: data.risk_level,
        corrected_risk_level: values.corrected_risk_level,
        original_score: data.risk_score,
        corrected_score: values.corrected_score,
        feedback_type: 'override',
        reason: values.reason,
        remark: values.remark,
        is_error_sample: values.corrected_risk_level !== data.risk_level,
        error_type: values.corrected_risk_level !== data.risk_level ? 'manual_override' : undefined,
      })

      message.success('已人工覆盖评分结果')
      setOverrideModal({ open: false, data: null })
      loadScores()
    } catch (e) {
      message.error('覆盖失败')
    }
  }

  const batchSendSms = () => {
    if (!selectedRowKeys.length) return message.warning('请先选择记录')
    confirm({
      title: `确认发送短信给 ${selectedRowKeys.length} 位患者？`,
      icon: <ExclamationCircleFilled />,
      onOk: async () => {
        try {
          const res = await api.sms.send({ risk_score_ids: selectedRowKeys })
          message.success(`发送完成：成功 ${res.success_count}，失败 ${res.failed_count}`)
          setSelectedRowKeys([])
        } catch (e) { message.error('发送失败') }
      },
    })
  }

  const batchGenerateCallbacks = async () => {
    try {
      const res = await api.callbacks.generate({
        min_risk_level: 'high',
        max_count: selectedRowKeys.length || 100,
      })
      message.success(`已生成 ${res.length} 条回访任务`)
    } catch (e) { message.error('生成回访名单失败') }
  }

  const stats = useMemo(() => {
    const s = { total: 0, low: 0, medium: 0, high: 0, critical: 0, override: 0, needCallback: 0 }
    scores.forEach(r => {
      s.total++
      s[r.risk_level] = (s[r.risk_level] || 0) + 1
      if (r.is_override) s.override++
      if (r.needs_callback) s.needCallback++
    })
    return s
  }, [scores])

  const columns = [
    { title: '预约号', dataIndex: 'appointment_no', key: 'no', width: 120, fixed: 'left' },
    { title: '患者', dataIndex: '', key: 'p', width: 90,
      render: (_, r) => <span>{r.patient_gender || '-'} / {r.patient_age || '-'}岁</span> },
    { title: '科室', dataIndex: 'department_name', key: 'dept', width: 110 },
    { title: '医生', dataIndex: 'doctor_name', key: 'doc', width: 90 },
    { title: '就诊时间', dataIndex: '', key: 't', width: 140,
      render: (_, r) => <span>{r.appointment_date?.slice(5)} {r.appointment_time?.slice(0, 5)}</span> },
    { title: '类型', dataIndex: 'appointment_type', key: 'type', width: 90,
      render: v => <Tag color="blue">{v}</Tag> },
    {
      title: '风险评分', key: 'score', width: 180, fixed: 'left',
      render: (_, r) => (
        <Space>
          <Progress
            type="circle" size={50} strokeColor={levelColor[r.risk_level]}
            percent={Math.round(r.risk_score * 100)}
            format={p => <span style={{ fontSize: 10 }}>{p}%</span>}
          />
          <div>
            <Tag color={levelColor[r.risk_level]} icon={null}>
              {levelEmoji[r.risk_level]} {levelText[r.risk_level]}
            </Tag>
            {r.is_override && <div><Badge status="processing" text={<span style={{ fontSize: 11, color: '#722ed1' }}>已人工修正</span>} /></div>}
          </div>
        </Space>
      ),
    },
    { title: '实际状态', dataIndex: 'actual_status', key: 'st', width: 90,
      render: v => {
        if (!v || v === 'pending') return <Tag color="default">待确认</Tag>
        return ['noshow', 'no_show', '爽约'].includes(v)
          ? <Tag color="red">爽约</Tag>
          : <Tag color="green">已就诊</Tag>
      } },
    { title: '需回访', dataIndex: 'needs_callback', key: 'cb', width: 80,
      render: v => v ? <Tag color="red"><PhoneOutlined /> 是</Tag> : <Tag color="green">否</Tag> },
    { title: '模型版本', dataIndex: 'model_version', key: 'v', width: 90 },
    {
      title: '操作', key: 'actions', width: 180, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => openDetail(r.id)} />
          </Tooltip>
          <Tooltip title="人工改标">
            <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openOverride(r)} />
          </Tooltip>
          <Tooltip title="发送短信">
            <Button size="small" type="link" icon={<SendOutlined />}
              onClick={() => api.sms.send({ risk_score_ids: [r.id] }).then(() => message.success('短信已发送'))} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="总评分" value={stats.total} prefix={<ThunderboltOutlined />} /></Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="极高风险" value={stats.critical} valueStyle={{ color: '#f5222d' }} prefix="🔴" /></Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="高风险" value={stats.high} valueStyle={{ color: '#fa8c16' }} prefix="🟠" /></Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="中风险" value={stats.medium} valueStyle={{ color: '#faad14' }} prefix="🟡" /></Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="低风险" value={stats.low} valueStyle={{ color: '#52c41a' }} prefix="🟢" /></Card>
        </Col>
        <Col xs={12} sm={6} md={4}>
          <Card size="small" className="stat-card"><Statistic title="人工修正" value={stats.override} valueStyle={{ color: '#722ed1' }} prefix={<ExperimentOutlined />} /></Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        title="风险评分工作台"
        extra={
          <Space wrap>
            <Button type="primary" icon={<ThunderboltOutlined />} loading={scoringLoading} onClick={runScoring}>
              运行模型评分
            </Button>
            <Popconfirm title="确认发送短信？" onConfirm={batchSendSms} disabled={!selectedRowKeys.length}>
              <Button icon={<SendOutlined />} disabled={!selectedRowKeys.length}>
                批量发短信 ({selectedRowKeys.length})
              </Button>
            </Popconfirm>
            <Button icon={<PhoneOutlined />} onClick={batchGenerateCallbacks}>
              生成回访名单
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => loadScores()}>刷新</Button>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索预约号"
            style={{ width: 200 }}
            allowClear
            onChange={e => {
              const kw = e.target.value
              setScores(prev => prev.filter(r => r.appointment_no.includes(kw) || !kw))
            }}
          />
          <Select placeholder="风险等级" style={{ width: 140 }} allowClear
            onChange={v => setFilters(f => ({ ...f, risk_level: v }))}>
            <Option value="low">🟢 低风险</Option>
            <Option value="medium">🟡 中风险</Option>
            <Option value="high">🟠 高风险</Option>
            <Option value="critical">🔴 极高风险</Option>
          </Select>
          <Select placeholder="回访需求" style={{ width: 140 }} allowClear
            onChange={v => setFilters(f => ({ ...f, needs_callback: v }))}>
            <Option value={true}>需要回访</Option>
            <Option value={false}>无需回访</Option>
          </Select>
          <Select placeholder="实际状态" style={{ width: 140 }} allowClear
            onChange={v => loadScores({ status: v })}>
            <Option value="pending">待确认</Option>
            <Option value="attended">已就诊</Option>
            <Option value="noshow">爽约</Option>
          </Select>
        </Space>

        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={scores}
          columns={columns}
          scroll={{ x: 1400 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              {
                key: 'high',
                text: '选择高/极高风险',
                onSelect: () => {
                  const keys = scores.filter(s => ['high', 'critical'].includes(s.risk_level)).map(s => s.id)
                  setSelectedRowKeys(keys)
                },
              },
            ],
          }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="评分详情与模型解释"
        open={detailDrawer.open}
        onClose={() => setDetailDrawer({ open: false, data: null, loading: false })}
        width={720}
        loading={detailDrawer.loading}
      >
        {detailDrawer.data && (
          <>
            <Descriptions title="预约信息" bordered size="small" column={2} style={{ marginBottom: 24 }}>
              <Descriptions.Item label="预约号">{detailDrawer.data.appointment?.appointment_no}</Descriptions.Item>
              <Descriptions.Item label="实际状态">
                {detailDrawer.data.appointment?.actual_status === 'noshow' ? <Tag color="red">爽约</Tag> :
                 detailDrawer.data.appointment?.actual_status === 'attended' ? <Tag color="green">已就诊</Tag> :
                 <Tag>待确认</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="科室/医生">{detailDrawer.data.features?.department} / {detailDrawer.data.appointment?.doctor_name}</Descriptions.Item>
              <Descriptions.Item label="就诊时间">{detailDrawer.data.features?.appointment_date} {detailDrawer.data.features?.appointment_time}</Descriptions.Item>
              <Descriptions.Item label="患者">年龄 {detailDrawer.data.features?.patient_age}，{detailDrawer.data.features?.patient_gender}</Descriptions.Item>
              <Descriptions.Item label="类型">{detailDrawer.data.appointment?.appointment_type}</Descriptions.Item>
            </Descriptions>

            <Card
              type="inner"
              title={
                <Space>
                  <span>风险评分结果</span>
                  <Tag color={levelColor[detailDrawer.data.risk_level]}>
                    {levelEmoji[detailDrawer.data.risk_level]} {levelText[detailDrawer.data.risk_level]}
                  </Tag>
                  <Progress
                    percent={Math.round(detailDrawer.data.risk_score * 100)}
                    strokeColor={levelColor[detailDrawer.data.risk_level]}
                    style={{ width: 200 }}
                    showInfo={false}
                  />
                  <span style={{ fontWeight: 600, fontSize: 18, color: levelColor[detailDrawer.data.risk_level] }}>
                    {(detailDrawer.data.risk_score * 100).toFixed(1)}%
                  </span>
                  {detailDrawer.data.is_override && <Tag color="purple">人工覆盖</Tag>}
                </Space>
              }
              style={{ marginBottom: 16 }}
            >
              <Alert
                type="info" showIcon
                message="模型建议"
                description={detailDrawer.data.recommendation}
                style={{ marginBottom: 12 }}
              />
              <div>
                <span style={{ fontSize: 12, color: '#888', marginRight: 8 }}>
                  模型：{detailDrawer.data.model_name} {detailDrawer.data.model_version}
                </span>
                <span style={{ fontSize: 12, color: '#888' }}>
                  推理时间：{detailDrawer.data.created_at}
                </span>
              </div>
            </Card>

            <Card type="inner" title="SHAP 特征贡献分析（Top 因素）" style={{ marginBottom: 16 }}>
              {detailDrawer.data.top_features?.length > 0 ? (
                detailDrawer.data.top_features.map((f, idx) => {
                  const absC = Math.abs(f.contribution) * 1000
                  const pct = Math.min(100, absC * 2)
                  const color = f.impact === 'increase_risk' ? '#f5222d' : f.impact === 'decrease_risk' ? '#52c41a' : '#888'
                  const arrow = f.impact === 'increase_risk' ? '↑' : f.impact === 'decrease_risk' ? '↓' : '→'
                  return (
                    <div className="feature-bar" key={idx}>
                      <span className="feature-name">{f.display_name}</span>
                      <span style={{ width: 80, fontSize: 12, color: '#666' }}>值: {f.value}</span>
                      <div className="feature-bar-bg">
                        <div className="feature-bar-fill" style={{ width: `${pct}%`, background: color }} />
                      </div>
                      <span style={{ width: 90, color, fontSize: 12, fontWeight: 500 }}>
                        {arrow} {(f.contribution * 100).toFixed(2)}%
                      </span>
                    </div>
                  )
                })
              ) : <Empty description="暂无特征解释" />}
            </Card>

            <Card type="inner" title="完整特征快照">
              <Descriptions size="small" column={2} bordered>
                {Object.entries(detailDrawer.data.features || {}).map(([k, v]) => (
                  <Descriptions.Item key={k} label={k}>{String(v)}</Descriptions.Item>
                ))}
              </Descriptions>
            </Card>

            <Divider />

            <Space>
              <Button type="primary" icon={<EditOutlined />} onClick={() => {
                setDetailDrawer({ open: false, data: null, loading: false })
                openOverride({ id: detailDrawer.data.id, ...detailDrawer.data })
              }}>
                人工修正评分
              </Button>
              <Popconfirm
                title="确认发送短信提醒？"
                onConfirm={() => {
                  api.sms.send({ risk_score_ids: [detailDrawer.data.id] })
                  message.success('短信已发送')
                }}
              >
                <Button icon={<SendOutlined />}>发送短信</Button>
              </Popconfirm>
            </Space>
          </>
        )}
      </Drawer>

      <Modal
        title="人工修正评分（改标）"
        open={overrideModal.open}
        onOk={submitOverride}
        onCancel={() => setOverrideModal({ open: false, data: null })}
        width={560}
        okText="确认改标"
      >
        <Alert
          type="warning"
          showIcon
          message="人工改标将记录为模型错误样本，用于后续迭代"
          style={{ marginBottom: 16 }}
        />
        <Form form={overrideForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="原始风险等级">
                  <Tag color={levelColor[overrideModal.data?.risk_level]}>
                    {levelText[overrideModal.data?.risk_level]} {(overrideModal.data?.risk_score * 100)?.toFixed(1)}%
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col span={12}>
              <Form.Item label="修正后风险等级" name="corrected_risk_level" rules={[{ required: true }]}>
                <Select>
                  <Option value="low">🟢 低风险（<20%）</Option>
                  <Option value="medium">🟡 中风险（20%-50%）</Option>
                  <Option value="high">🟠 高风险（50%-80%）</Option>
                  <Option value="critical">🔴 极高风险（>80%）</Option>
                </Select>
              </Form.Item>
              <Form.Item label="修正后评分值（0-1）" name="corrected_score" rules={[{ required: true }]}>
                <Input type="number" step={0.01} min={0} max={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="改标原因" name="reason" rules={[{ required: true, message: '请说明改标原因' }]}>
            <Select>
              <Option value="domain_knowledge">领域知识判断（患者特殊情况）</Option>
              <Option value="model_bias">模型偏差/特征缺失</Option>
              <Option value="data_error">数据录入错误</Option>
              <Option value="context_info">上下文信息补充</Option>
              <Option value="other">其他原因</Option>
            </Select>
          </Form.Item>
          <Form.Item label="备注说明" name="remark">
            <Input.TextArea rows={3} placeholder="详细说明改标依据，用于模型迭代分析" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ScoringWorkbench
