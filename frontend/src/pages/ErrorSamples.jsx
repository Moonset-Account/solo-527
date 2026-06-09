import React, { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Button, Space, Select, App, Row, Col, Statistic,
  Progress, Drawer, Descriptions, Tooltip, Alert, Badge, Empty,
} from 'antd'
import {
  BugOutlined,
  EyeOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  FileSearchOutlined,
  WarningOutlined,
  ExperimentOutlined,
  FilterOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { api } from '../api'

const levelColor = { low: 'green', medium: 'gold', high: 'orange', critical: 'red' }
const levelText = { low: '低', medium: '中', high: '高', critical: '极高' }

const ErrorSamples = () => {
  const { message } = App.useApp()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({})
  const [filter, setFilter] = useState({ error_type: undefined })
  const [detail, setDetail] = useState({ open: false, data: null })

  const load = () => {
    setLoading(true)
    api.feedback.errorSamples({ limit: 200, ...filter }).then(setList).finally(() => setLoading(false))
    api.feedback.errorStats().then(setStats).catch(() => {})
  }

  useEffect(() => { load() }, [filter])

  const openDetail = (rec) => setDetail({ open: true, data: rec })

  const exportSamples = () => {
    const rows = [
      ['id', 'appointment_no', 'department', 'original_level', 'corrected_level',
       'original_score', 'corrected_score', 'error_type', 'reason', 'remark',
       'patient_age', 'patient_gender', 'doctor_name', 'appointment_type', 'actual_status', 'created_at'],
      ...list.map(r => [
        r.id, r.appointment_no, r.department_name,
        r.original_risk_level, r.corrected_risk_level,
        r.original_score, r.corrected_score, r.error_type, r.reason, r.remark,
        r.patient_age, r.patient_gender, r.doctor_name, r.appointment_type, r.actual_status, r.created_at,
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `error_samples_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    message.success('已导出')
  }

  const mismatchOption = {
    tooltip: {},
    legend: { top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['低→中', '低→高', '低→极高', '中→低', '中→高', '中→极高', '高→低', '高→中', '高→极高', '极高→低', '极高→中', '极高→高'],
      axisLabel: { fontSize: 10, rotate: 30 },
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: stats.by_level_mismatch?.map(m => {
        const key = `${levelText[m.from] || m.from}→${levelText[m.to] || m.to}`
        return { value: m.count, itemStyle: { color: m.from === m.to ? '#ccc' : '#f5222d' } }
      }) || [],
      label: { show: true, position: 'top' },
    }],
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    { title: '预约号', dataIndex: 'appointment_no', key: 'no', width: 130, fixed: 'left' },
    { title: '科室', dataIndex: 'department_name', key: 'dept', width: 100 },
    { title: '医生', dataIndex: 'doctor_name', key: 'doc', width: 90 },
    { title: '患者', key: 'p', width: 90,
      render: (_, r) => <span>{r.patient_gender || '-'}/{r.patient_age || '-'}岁</span> },
    { title: '就诊日期', dataIndex: 'appointment_date', key: 'd', width: 110 },
    { title: '原始→修正等级', key: 'll', width: 180,
      render: (_, r) => (
        <Space>
          {r.original_risk_level && <Tag color={levelColor[r.original_risk_level]}>{levelText[r.original_risk_level]} {(r.original_score * 100).toFixed(0)}%</Tag>}
          <span style={{ color: '#999' }}>→</span>
          {r.corrected_risk_level && <Tag color={levelColor[r.corrected_risk_level]}>{levelText[r.corrected_risk_level]} {(r.corrected_score * 100).toFixed(0)}%</Tag>}
        </Space>
      ) },
    { title: '偏差程度', key: 'dev', width: 100,
      render: (_, r) => {
        const dev = Math.abs((r.corrected_score || 0) - (r.original_score || 0))
        return <Badge
          status={dev > 0.5 ? 'error' : dev > 0.2 ? 'warning' : 'processing'}
          text={`${(dev * 100).toFixed(1)}%`} />
      } },
    { title: '实际状态', dataIndex: 'actual_status', key: 'st', width: 100,
      render: v => !v || v === 'pending' ? <Tag>未确认</Tag> :
        ['noshow', '爽约'].includes(v) ? <Tag color="red">爽约</Tag> : <Tag color="green">已就诊</Tag> },
    { title: '错误类型', dataIndex: 'error_type', key: 'et', width: 130,
      render: v => <Tag color="orange" icon={<BugOutlined />}>{v || '未分类'}</Tag> },
    { title: '原因', dataIndex: 'reason', key: 'r', ellipsis: true, width: 150 },
    { title: '操作人', dataIndex: 'operator_name', key: 'op', width: 100 },
    {
      title: '操作', key: 'act', width: 80, fixed: 'right',
      render: (_, r) => (
        <Tooltip title="查看样本详情">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)} />
        </Tooltip>
      ),
    },
  ]

  return (
    <div className="page-container">
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #f5222d' }}>
            <Statistic title="错误样本总数" value={stats.total_errors || 0} prefix={<BugOutlined />} valueStyle={{ color: '#f5222d' }} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #722ed1' }}>
            <Statistic title="错误样本占比" value={stats.error_rate || 0} suffix="%" prefix={<FileSearchOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
            <Statistic title="需复核数量" value={list.filter(r => r.review_status === 'pending').length} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col xs={12} md={12}>
          <Card size="small">
            <Progress
              percent={100 - (stats.error_rate || 0)}
              format={p => `模型准确率: ${p}%`}
              status={100 - (stats.error_rate || 0) >= 80 ? 'success' : 'exception'}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24}>
          <Card title="风险等级修正分布（错误模式分析）" className="card-shadow" size="small">
            <ReactECharts option={mismatchOption} style={{ height: 280 }} notMerge />
          </Card>
        </Col>
      </Row>

      <Card
        className="card-shadow"
        title="错误样本库（用于模型迭代）"
        extra={
          <Space>
            <Button type="primary" icon={<DownloadOutlined />} onClick={exportSamples}>
              导出样本集
            </Button>
            <Select placeholder="错误类型筛选" style={{ width: 160 }} allowClear
              onChange={v => setFilter(f => ({ ...f, error_type: v }))}>
              <Select.Option value="risk_level_mismatch">风险等级不匹配</Select.Option>
              <Select.Option value="score_deviation">评分值偏差</Select.Option>
              <Select.Option value="manual_override">人工覆盖</Select.Option>
              <Select.Option value="domain_knowledge">领域知识修正</Select.Option>
              <Select.Option value="data_error">数据错误</Select.Option>
              <Select.Option value="context_info">上下文补充</Select.Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          </Space>
        }
      >
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="样本验证与复核流程"
          description={
            <div>
              <p>1. 所有错误样本自动进入样本库，保留完整上下文信息</p>
              <p>2. 错误样本经过管理员复核后，将用于下一轮模型训练（增量学习）</p>
              <p>3. 提供一键导出功能，支持离线深度分析与模式挖掘</p>
              <p>4. 模型回滚后，错误样本库保留历史记录用于效果对比</p>
            </div>
          }
        />
        <Table
          size="small"
          rowKey="id"
          loading={loading}
          dataSource={list}
          columns={columns}
          scroll={{ x: 1600 }}
          locale={{ emptyText: <Empty description="暂无错误样本，模型运行良好！" /> }}
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: t => `共 ${t} 条` }}
        />
      </Card>

      <Drawer
        title="错误样本详情与上下文"
        open={detail.open}
        onClose={() => setDetail({ open: false, data: null })}
        width={640}
      >
        {detail.data && (
          <>
            <Alert
              type="error"
              showIcon
              icon={<ExperimentOutlined />}
              message={`样本 #${detail.data.id} —— 错误类型：${detail.data.error_type || '未分类'}`}
              description={`偏差 ${Math.abs(((detail.data.corrected_score || 0) - (detail.data.original_score || 0)) * 100).toFixed(1)}%，原因：${detail.data.reason || '未填写'}`}
              style={{ marginBottom: 20 }}
            />
            <Descriptions title="基础信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="预约号">{detail.data.appointment_no}</Descriptions.Item>
              <Descriptions.Item label="就诊日期">{detail.data.appointment_date}</Descriptions.Item>
              <Descriptions.Item label="科室">{detail.data.department_name}</Descriptions.Item>
              <Descriptions.Item label="医生">{detail.data.doctor_name || '-'}</Descriptions.Item>
              <Descriptions.Item label="患者">{detail.data.patient_gender || '-'} / {detail.data.patient_age || '-'}岁</Descriptions.Item>
              <Descriptions.Item label="就诊类型">{detail.data.appointment_type}</Descriptions.Item>
              <Descriptions.Item label="实际状态">
                {detail.data.actual_status === 'noshow' ? <Tag color="red">爽约</Tag> :
                 detail.data.actual_status === 'attended' ? <Tag color="green">已就诊</Tag> : <Tag>待确认</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="操作人">{detail.data.operator_name}</Descriptions.Item>
            </Descriptions>

            <Card type="inner" title="评分修正对比" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
                    <div style={{ color: '#888', fontSize: 12 }}>模型原始输出</div>
                    <Tag color={levelColor[detail.data.original_risk_level]} style={{ fontSize: 16, marginTop: 8 }}>
                      {levelText[detail.data.original_risk_level]} {(detail.data.original_score * 100).toFixed(1)}%
                    </Tag>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <div style={{ color: '#888', fontSize: 12 }}>人工修正结果</div>
                    <Tag color={levelColor[detail.data.corrected_risk_level]} style={{ fontSize: 16, marginTop: 8 }}>
                      {levelText[detail.data.corrected_risk_level]} {(detail.data.corrected_score * 100).toFixed(1)}%
                    </Tag>
                  </Card>
                </Col>
              </Row>
            </Card>

            <Descriptions title="特征快照（部分）" bordered size="small" column={2}>
              {detail.data.top_features?.map((f, i) => (
                <Descriptions.Item key={i} label={f.display_name || f.feature}>
                  <Space>
                    <span>{f.value}</span>
                    <Tag color={f.impact === 'increase_risk' ? 'red' : 'green'}>
                      {f.impact === 'increase_risk' ? '提升风险' : '降低风险'} {(f.contribution * 100).toFixed(2)}%
                    </Tag>
                  </Space>
                </Descriptions.Item>
              ))}
            </Descriptions>

            <Card type="inner" title="人工备注" style={{ marginTop: 16 }}>
              <div style={{ color: '#666', whiteSpace: 'pre-wrap' }}>
                {detail.data.remark || '（无备注）'}
              </div>
            </Card>
          </>
        )}
      </Drawer>
    </div>
  )
}

export default ErrorSamples
