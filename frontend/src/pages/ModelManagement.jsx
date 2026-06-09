import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, App, Modal, Row, Col, Statistic,
  Progress, Drawer, Form, Input, Tooltip, Alert, Badge, Empty, Popconfirm,
  Descriptions, DatePicker, InputNumber, Collapse, List,
} from 'antd'
import {
  ExperimentOutlined,
  PlayCircleOutlined,
  ThunderboltOutlined,
  RollbackOutlined,
  EyeOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  HistoryOutlined,
  FileSearchOutlined,
  BarChartOutlined,
  DownloadOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import dayjs from 'dayjs'
import { api } from '../api'

const { RangePicker } = DatePicker
const { Panel } = Collapse

const reviewColor = { pending: 'gold', approved: 'green', rejected: 'red', not_registered: 'default' }
const reviewText = { pending: '待审核', approved: '已上线', rejected: '已驳回', not_registered: '未登记' }

const ModelManagement = () => {
  const { message, modal } = App.useApp()
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(false)
  const [trainModal, setTrainModal] = useState({ open: false })
  const [trainForm] = Form.useForm()
  const [trainLoading, setTrainLoading] = useState(false)
  const [detail, setDetail] = useState({ open: false, data: null })
  const [rollbackModal, setRollbackModal] = useState({ open: false })
  const [rollbackForm] = Form.useForm()

  const load = () => {
    setLoading(true)
    api.models.versions().then(setVersions).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const activeVersion = versions.find(v => v.is_active)
  const approvedCount = versions.filter(v => v.review_status === 'approved').length

  const submitTrain = async () => {
    const values = await trainForm.validateFields()
    setTrainLoading(true)
    try {
      const payload = {
        version: values.version,
        description: values.description,
        hyperparameters: values.hyperparameters ? {
          num_leaves: values.num_leaves || 63,
          learning_rate: values.learning_rate || 0.05,
          max_depth: values.max_depth || 8,
          n_estimators: values.n_estimators || 500,
        } : undefined,
        test_size: values.test_size || 0.2,
        random_state: values.random_state || 42,
      }
      if (values.date_range) {
        payload.date_from = values.date_range[0]?.format('YYYY-MM-DD')
        payload.date_to = values.date_range[1]?.format('YYYY-MM-DD')
      }
      const res = await api.models.train(payload)
      message.success(`模型训练完成！版本 ${res.version}，AUC=${(res.metrics.auc * 100).toFixed(2)}%`)
      setTrainModal({ open: false })
      trainForm.resetFields()
      load()
    } catch (e) {
      message.error('训练失败，请确保有足够的已标注数据')
    } finally {
      setTrainLoading(false)
    }
  }

  const activate = async (id) => {
    try {
      await api.models.activate(id)
      message.success('模型已上线激活')
      load()
    } catch (e) { message.error('激活失败') }
  }

  const review = async (id, status, comment = '') => {
    try {
      await api.models.review(id, status, comment)
      message.success(`已${status === 'approved' ? '通过' : '驳回'}审核`)
      load()
    } catch (e) { message.error('操作失败') }
  }

  const submitRollback = async () => {
    const values = await rollbackForm.validateFields()
    try {
      await api.models.rollback(values)
      message.success('已成功回滚到指定版本')
      setRollbackModal({ open: false })
      rollbackForm.resetFields()
      load()
    } catch (e) { message.error('回滚失败') }
  }

  const metricsOption = (metrics) => {
    const keys = ['auc', 'accuracy', 'precision', 'recall', 'f1', 'ks']
    const labels = ['AUC', '准确率', '精确率', '召回率', 'F1', 'KS值']
    return {
      tooltip: {},
      radar: {
        indicator: labels.map((l, i) => ({ name: l, max: 1 })),
        center: ['50%', '55%'], radius: 90,
      },
      series: [{
        type: 'radar',
        data: [{
          value: keys.map(k => metrics?.[k] || 0),
          name: '模型指标',
          areaStyle: { opacity: 0.3 },
          lineStyle: { width: 2 },
          itemStyle: { color: '#1677ff' },
        }],
      }],
    }
  }

  const versionColumns = [
    { title: '版本', dataIndex: 'version', key: 'v', width: 140, fixed: 'left',
      render: (v, r) => (
        <Space>
          {r.is_active && <Badge status="processing" color="#52c41a" />}
          {r.is_rollback && <Tag color="purple">回滚</Tag>}
          <span style={{ fontWeight: r.is_active ? 700 : 400 }}>{v}</span>
        </Space>
      ) },
    { title: '模型', dataIndex: 'model_name', key: 'm', width: 100,
      render: v => <Tag color="blue" icon={<ExperimentOutlined />}>{v}</Tag> },
    { title: '状态', dataIndex: 'review_status', key: 'st', width: 100,
      render: v => <Tag color={reviewColor[v] || 'default'} icon={<SafetyCertificateOutlined />}>{reviewText[v] || v}</Tag> },
    { title: '样本量', dataIndex: 'training_sample_count', key: 's', width: 100,
      render: v => v?.toLocaleString() },
    { title: 'AUC', dataIndex: ['metrics', 'auc'], key: 'auc', width: 100,
      render: v => v != null ? <span style={{ color: v >= 0.8 ? '#52c41a' : v >= 0.7 ? '#faad14' : '#f5222d', fontWeight: 600 }}>{(v * 100).toFixed(1)}%</span> : '-' },
    { title: '准确率', dataIndex: ['metrics', 'accuracy'], key: 'acc', width: 100,
      render: v => v != null ? `${(v * 100).toFixed(1)}%` : '-' },
    { title: 'F1', dataIndex: ['metrics', 'f1'], key: 'f1', width: 100,
      render: v => v != null ? v.toFixed(3) : '-' },
    { title: 'KS', dataIndex: ['metrics', 'ks'], key: 'ks', width: 100,
      render: v => v != null ? v.toFixed(3) : '-' },
    { title: '创建时间', dataIndex: 'created_at', key: 'c', width: 170,
      render: v => v?.slice(0, 19).replace('T', ' ') },
    { title: '回滚来源', dataIndex: 'rollback_from_version', key: 'rb', width: 120,
      render: v => v ? <Tag color="purple">{v}</Tag> : '-' },
    {
      title: '操作', key: 'act', width: 260, fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Tooltip title="查看详情">
            <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => setDetail({ open: true, data: r })} />
          </Tooltip>
          {r.review_status === 'pending' && r.id && (
            <>
              <Button size="small" type="link" icon={<CheckCircleOutlined />} style={{ color: '#52c41a' }}
                onClick={() => review(r.id, 'approved')}>通过</Button>
              <Button size="small" type="link" icon={<CloseCircleOutlined />} danger
                onClick={() => review(r.id, 'rejected', '')}>驳回</Button>
            </>
          )}
          {!r.is_active && r.id && r.review_status !== 'rejected' && (
            <Popconfirm title={`确认激活版本 ${r.version}？`} onConfirm={() => activate(r.id)}>
              <Button size="small" type="link" icon={<PlayCircleOutlined />} style={{ color: '#1677ff' }}>上线</Button>
            </Popconfirm>
          )}
          {r.is_active && (
            <Tag color="green" icon={<ThunderboltOutlined />}>当前在线</Tag>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic title="模型版本总数" value={versions.length} prefix={<ExperimentOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
            <Statistic title="已上线版本" value={approvedCount} prefix={<SafetyCertificateOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
            <div style={{ color: '#888', fontSize: 13 }}>在线版本</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1677ff', marginTop: 4 }}>
              {activeVersion?.version || <span style={{ fontSize: 14, color: '#999' }}>未激活</span>}
            </div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
              {activeVersion?.metrics?.auc != null ? `AUC: ${(activeVersion.metrics.auc * 100).toFixed(1)}%` : ''}
            </div>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #faad14' }}>
            <Statistic title="待审核版本" value={versions.filter(v => v.review_status === 'pending').length}
              prefix={<WarningOutlined />} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small">
            <Progress
              type="line" percent={activeVersion?.metrics?.auc ? Math.round(activeVersion.metrics.auc * 100) : 0}
              format={p => `在线模型 AUC: ${p}%`} strokeColor="#52c41a"
            />
            <Row gutter={12} style={{ marginTop: 8 }}>
              <Col span={8}>
                <div style={{ fontSize: 11, color: '#888' }}>准确率</div>
                <div style={{ fontWeight: 600 }}>{activeVersion?.metrics?.accuracy != null ? `${(activeVersion.metrics.accuracy * 100).toFixed(1)}%` : '-'}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 11, color: '#888' }}>F1分数</div>
                <div style={{ fontWeight: 600 }}>{activeVersion?.metrics?.f1 != null ? activeVersion.metrics.f1.toFixed(3) : '-'}</div>
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 11, color: '#888' }}>KS值</div>
                <div style={{ fontWeight: 600 }}>{activeVersion?.metrics?.ks != null ? activeVersion.metrics.ks.toFixed(3) : '-'}</div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        title={
          <Space>
            <ExperimentOutlined />
            LightGBM 模型版本管理
            <Tag color="blue" icon={<BarChartOutlined />}>支持训练 / 评估 / 审核 / 上线 / 回滚 全流程</Tag>
          </Space>
        }
        extra={
          <Space>
            <Button type="primary" icon={<ExperimentOutlined />} onClick={() => setTrainModal({ open: true })}>
              训练新版本
            </Button>
            <Popconfirm title="确认执行回滚？" description="将模型切换为历史版本"
              onConfirm={() => setRollbackModal({ open: true })}>
              <Button icon={<RollbackOutlined />}>版本回滚</Button>
            </Popconfirm>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="info"
          showIcon
          message="模型全生命周期管理"
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              <li>每次训练产生独立版本，保留完整超参数、特征、评估指标、训练样本范围</li>
              <li>新模型需经<strong>管理员审核</strong>后方可上线；审核记录永久保留</li>
              <li>支持<strong>一键回滚</strong>到任意历史版本，回滚操作留痕可追踪</li>
              <li>模型变更自动通知下游推理服务，清除缓存热加载</li>
            </ul>
          }
        />
        <Table
          size="small"
          rowKey={r => r.id || r.version}
          loading={loading}
          dataSource={versions}
          columns={versionColumns}
          scroll={{ x: 1600 }}
          locale={{ emptyText: <Empty description="暂无模型版本，点击【训练新版本】开始" /> }}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: t => `共 ${t} 个版本` }}
        />
      </Card>

      <Modal
        title={<Space><ExperimentOutlined /> 训练 LightGBM 新版本</Space>}
        open={trainModal.open}
        onCancel={() => setTrainModal({ open: false })}
        onOk={submitTrain}
        confirmLoading={trainLoading}
        okText="开始训练"
        width={680}
      >
        <Alert
          type="info" showIcon style={{ marginBottom: 16 }}
          message="训练将使用已标注的历史数据"
          description="需要 actual_status 字段已标注（attended/noshow）。建议样本量≥500以获得稳定效果。"
        />
        <Form form={trainForm} layout="vertical"
          initialValues={{
            version: `v${dayjs().format('YYYYMMDD')}_01`,
            hyperparameters: true, num_leaves: 63, learning_rate: 0.05, max_depth: 8, n_estimators: 500,
            test_size: 0.2, random_state: 42,
          }}>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="版本号" name="version" rules={[{ required: true }]}>
                <Input placeholder="例如: v20240115_01" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="训练数据范围" name="date_range">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="版本描述" name="description">
            <Input.TextArea rows={2} placeholder="描述训练目的、数据变化等" />
          </Form.Item>

          <Collapse defaultActiveKey={[]} size="small" ghost>
            <Panel header="LightGBM 超参数（点击展开）" key="hp">
              <Row gutter={12}>
                <Col span={6}>
                  <Form.Item label="num_leaves" name="num_leaves"><InputNumber min={8} max={255} /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="learning_rate" name="learning_rate"><InputNumber step={0.01} min={0.001} max={1} /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="max_depth" name="max_depth"><InputNumber min={3} max={15} /></Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="n_estimators" name="n_estimators"><InputNumber min={100} max={5000} step={100} /></Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="测试集占比" name="test_size"><InputNumber step={0.05} min={0.1} max={0.5} /></Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="随机种子" name="random_state"><InputNumber /></Form.Item>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Form>
      </Modal>

      <Modal
        title={<Space><RollbackOutlined /> 模型版本回滚</Space>}
        open={rollbackModal.open}
        onCancel={() => setRollbackModal({ open: false })}
        onOk={submitRollback}
        okText="确认回滚"
        okButtonProps={{ danger: true }}
      >
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="版本回滚是严肃操作"
          description="回滚后线上推理将立即切换到目标版本，并完整记录回滚来源与原因。" />
        <Form form={rollbackForm} layout="vertical">
          <Form.Item label="目标版本" name="target_version" rules={[{ required: true }]}>
            <Select placeholder="选择要回滚到的版本">
              {versions.filter(v => !v.is_active && v.id).map(v => (
                <Select.Option key={v.version} value={v.version}>
                  {v.version} - AUC: {v.metrics?.auc ? (v.metrics.auc * 100).toFixed(1) + '%' : '-'}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="回滚原因" name="reason" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="新模型效果下降">新模型效果下降</Select.Option>
              <Select.Option value="线上评分异常">线上评分异常</Select.Option>
              <Select.Option value="业务策略调整">业务策略调整</Select.Option>
              <Select.Option value="数据分布偏移">数据分布偏移</Select.Option>
              <Select.Option value="其他">其他</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={<Space><HistoryOutlined /> 模型版本详情与评估</Space>}
        open={detail.open}
        onClose={() => setDetail({ open: false, data: null })}
        width={720}
      >
        {detail.data && (
          <>
            <Alert
              type={detail.data.is_active ? 'success' : 'info'} showIcon
              icon={<BarChartOutlined />}
              message={`版本 ${detail.data.version} - ${detail.data.model_name}`}
              description={detail.data.description || '（无描述）'}
              style={{ marginBottom: 20 }}
            />

            <Descriptions title="基础信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="审核状态">
                <Tag color={reviewColor[detail.data.review_status]}>{reviewText[detail.data.review_status] || detail.data.review_status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="是否线上">
                {detail.data.is_active ? <Tag color="green">在线运行中</Tag> : <Tag>离线</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="训练样本量">{detail.data.training_sample_count?.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="创建时间">{detail.data.created_at?.slice(0, 19).replace('T', ' ')}</Descriptions.Item>
              <Descriptions.Item label="训练时间范围">
                {detail.data.training_date_range_start?.slice(0, 10)} ~ {detail.data.training_date_range_end?.slice(0, 10)}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">{detail.data.created_by || '-'}</Descriptions.Item>
              {detail.data.is_rollback && (
                <Descriptions.Item label="回滚信息" span={2}>
                  <Tag color="purple">从 {detail.data.rollback_from_version} 回滚</Tag>
                  <span style={{ marginLeft: 8, color: '#888', fontSize: 12 }}>
                    审核意见: {detail.data.review_comment || '-'}
                  </span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col xs={24} md={14}>
                <Card title="六维评估雷达图" size="small" type="inner">
                  <ReactECharts option={metricsOption(detail.data.metrics)} style={{ height: 300 }} notMerge />
                </Card>
              </Col>
              <Col xs={24} md={10}>
                <Card title="核心指标" size="small" type="inner">
                  <List
                    size="small"
                    dataSource={[
                      { k: 'AUC', v: detail.data.metrics?.auc, fmt: v => `${(v * 100).toFixed(2)}%`, good: v => v >= 0.8 },
                      { k: '准确率', v: detail.data.metrics?.accuracy, fmt: v => `${(v * 100).toFixed(2)}%` },
                      { k: '精确率', v: detail.data.metrics?.precision, fmt: v => `${(v * 100).toFixed(2)}%` },
                      { k: '召回率', v: detail.data.metrics?.recall, fmt: v => `${(v * 100).toFixed(2)}%` },
                      { k: 'F1', v: detail.data.metrics?.f1, fmt: v => v.toFixed(4) },
                      { k: 'KS', v: detail.data.metrics?.ks, fmt: v => v.toFixed(4), good: v => v >= 0.3 },
                    ]}
                    renderItem={item => (
                      <List.Item>
                        <span>{item.k}</span>
                        {item.v != null ? (
                          <Tag color={item.good?.(item.v) ? 'green' : item.v != null ? 'default' : 'default'}>
                            {item.fmt(item.v)}
                          </Tag>
                        ) : <Tag color="default">-</Tag>}
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>

            {detail.data.feature_importance?.length > 0 && (
              <Card title="Top 10 特征重要性（Gain）" size="small" type="inner">
                <List
                  size="small"
                  dataSource={detail.data.feature_importance.slice(0, 10)}
                  renderItem={(fi, idx) => (
                    <List.Item>
                      <Space style={{ width: '100%' }}>
                        <Tag color="blue">#{idx + 1}</Tag>
                        <span style={{ width: 180, fontWeight: 500 }}>{fi.feature}</span>
                        <Progress percent={fi.importance_ratio} size="small" showInfo={false} style={{ flex: 1 }} />
                        <span style={{ width: 60, textAlign: 'right', fontSize: 12 }}>
                          {fi.importance_ratio.toFixed(2)}%
                        </span>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ModelManagement
