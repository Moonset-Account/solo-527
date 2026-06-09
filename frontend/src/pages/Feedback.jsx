import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, App, Modal, Row, Col, Statistic,
  Progress, Drawer, Form, Input, Tooltip, Alert, Checkbox, Popconfirm,
} from 'antd'
import {
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  WarningOutlined,
  BgColorsOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '../api'

const levelColor = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }
const levelText = { low: '低', medium: '中', high: '高', critical: '极高' }
const reviewStatusColor = { pending: 'gold', confirmed: 'green', rejected: 'red' }
const reviewStatusText = { pending: '待复核', confirmed: '已确认', rejected: '已驳回' }

const Feedback = () => {
  const { message, modal } = App.useApp()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({ review_status: undefined, feedback_type: undefined, is_error_sample: undefined })
  const [stats, setStats] = useState({ total_errors: 0, total_feedback: 0, error_rate: 0, by_error_type: {}, by_level_mismatch: [] })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [reviewComment, setReviewComment] = useState('')

  const load = () => {
    setLoading(true)
    api.feedback.list({ limit: 200, ...filters }).then(setList).finally(() => setLoading(false))
    api.feedback.errorStats().then(setStats).catch(() => {})
  }

  useEffect(() => { load() }, [filters])

  const batchConfirm = () => {
    if (!selectedRowKeys.length) return message.warning('请先选择记录')
    Modal.confirm({
      title: `批量确认 ${selectedRowKeys.length} 条反馈？`,
      icon: <SafetyCertificateOutlined />,
      content: (
        <div>
          <p>确认后将按反馈内容自动修正评分结果</p>
          <Input.TextArea rows={3} value={reviewComment} onChange={e => setReviewComment(e.target.value)}
            placeholder="复核意见（可选）" style={{ marginTop: 8 }} />
        </div>
      ),
      onOk: async () => {
        try {
          const count = await api.feedback.batchConfirm(selectedRowKeys, reviewComment)
          message.success(`已确认 ${count} 条反馈`)
          setSelectedRowKeys([])
          setReviewComment('')
          load()
        } catch (e) { message.error('批量确认失败') }
      },
    })
  }

  const singleConfirm = async (id) => {
    try {
      await api.feedback.batchConfirm([id], '单条确认')
      message.success('已确认')
      load()
    } catch (e) { message.error('确认失败') }
  }

  const columns = [
    { title: '预约号', dataIndex: 'appointment_no', key: 'no', width: 130, fixed: 'left' },
    { title: '科室', dataIndex: 'department_name', key: 'dept', width: 100 },
    { title: '原始等级', dataIndex: 'original_risk_level', key: 'ol', width: 100,
      render: v => v ? <Tag color={levelColor[v]}>{levelText[v]}</Tag> : '-' },
    { title: '修正等级', dataIndex: 'corrected_risk_level', key: 'cl', width: 100,
      render: v => v ? <Tag color={levelColor[v]}>{levelText[v]}</Tag> : '-' },
    { title: '原始分', dataIndex: 'original_score', key: 'os', width: 80,
      render: v => v != null ? `${(v * 100).toFixed(0)}%` : '-' },
    { title: '修正分', dataIndex: 'corrected_score', key: 'cs', width: 80,
      render: v => v != null ? `${(v * 100).toFixed(0)}%` : '-' },
    { title: '反馈类型', dataIndex: 'feedback_type', key: 'ft', width: 100,
      render: v => <Tag icon={<EditOutlined />}>{v}</Tag> },
    { title: '错误样本', dataIndex: 'is_error_sample', key: 'es', width: 90,
      render: v => v ? <Tag color="red" icon={<WarningOutlined />}>是</Tag> : <Tag color="green">否</Tag> },
    { title: '错误类型', dataIndex: 'error_type', key: 'et', width: 130,
      render: v => v ? <Tag color="orange">{v}</Tag> : '-' },
    { title: '原因/备注', dataIndex: 'reason', key: 'r', ellipsis: true, width: 160 },
    { title: '操作人', dataIndex: 'operator_name', key: 'op', width: 100 },
    { title: '复核状态', dataIndex: 'review_status', key: 'rs', width: 100,
      render: v => <Tag color={reviewStatusColor[v]} icon={<SafetyCertificateOutlined />}>{reviewStatusText[v]}</Tag> },
    {
      title: '操作', key: 'act', width: 160, fixed: 'right',
      render: (_, r) => (
        <Space size="small">
          {r.review_status === 'pending' && (
            <Tooltip title="确认此反馈">
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => singleConfirm(r.id)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  const sankeyOption = {
    tooltip: {},
    series: [{
      type: 'sankey',
      left: 20, right: 120, top: 20, bottom: 20,
      data: [
        { name: '原始低' }, { name: '原始中' }, { name: '原始高' }, { name: '原始极高' },
        { name: '修正低' }, { name: '修正中' }, { name: '修正高' }, { name: '修正极高' },
      ],
      links: stats.by_level_mismatch.map(m => ({
        source: `原始${levelText[m.from] || m.from}`,
        target: `修正${levelText[m.to] || m.to}`,
        value: m.count,
      })).filter(l => l.value > 0),
      lineStyle: { color: 'gradient', curveness: 0.5 },
      label: { fontSize: 12 },
    }],
  }

  const errTypePie = {
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie', radius: ['40%', '70%'],
      data: Object.entries(stats.by_error_type || {}).map(([k, v]) => ({ name: k, value: v })),
      label: { formatter: '{b}\n{d}%' },
    }],
  }

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={5}>
          <Card size="small" className="stat-card" style={{ borderTop: '3px solid #1677ff' }}>
            <Statistic title="总反馈数" value={stats.total_feedback} prefix={<FileTextOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={5}>
          <Card size="small" className="stat-card" style={{ borderTop: '3px solid #f5222d' }}>
            <Statistic title="错误样本数" value={stats.total_errors} prefix={<WarningOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} md={5}>
          <Card size="small" className="stat-card" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="整体错误率" value={stats.error_rate} suffix="%" prefix={<BgColorsOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={9}>
          <Card size="small">
            <Progress
              percent={stats.error_rate || 0}
              status={stats.error_rate > 20 ? 'exception' : 'active'}
              format={p => `模型与人工一致率: ${100 - p}%`}
            />
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              {list.filter(r => r.review_status === 'pending').length} 条待复核
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card title="错误类型分布" className="card-shadow" size="small">
            <ReactECharts option={errTypePie} style={{ height: 240 }} notMerge />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="风险等级修正流向（桑基图）" className="card-shadow" size="small">
            {stats.by_level_mismatch?.length > 0 ? (
              <ReactECharts option={sankeyOption} style={{ height: 240 }} notMerge />
            ) : (
              <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>暂无修正流向数据</div>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        title="人工反馈闭环工作台"
        extra={
          <Space wrap>
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={batchConfirm} disabled={!selectedRowKeys.length}>
              批量确认 ({selectedRowKeys.length})
            </Button>
            <Select placeholder="复核状态" style={{ width: 130 }} allowClear
              onChange={v => setFilters(f => ({ ...f, review_status: v }))}>
              {Object.entries(reviewStatusText).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
            </Select>
            <Select placeholder="错误样本" style={{ width: 130 }} allowClear
              onChange={v => setFilters(f => ({ ...f, is_error_sample: v }))}>
              <Select.Option value={true}>仅错误样本</Select.Option>
              <Select.Option value={false}>非错误样本</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="质量追踪说明"
          description="所有人工改标操作均记录在此，由管理员复核。复核通过的修正将用于下一轮模型训练的增量样本，形成闭环迭代。"
        />
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 1500 }}
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </Card>
    </div>
  )
}

export default Feedback
