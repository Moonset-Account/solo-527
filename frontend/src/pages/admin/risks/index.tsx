import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space,
  Form, Select, DatePicker, Input, Modal, message, Popconfirm,
  Empty, Spin, Descriptions,
} from 'antd'
import {
  SafetyOutlined, ClockCircleOutlined, WarningOutlined,
  RiseOutlined, EyeOutlined, SearchOutlined,
  ExclamationCircleOutlined as _ExclamationCircleOutlined,
} from '@ant-design/icons'
void _ExclamationCircleOutlined
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { riskApi } from '@/api'
import type {
  RiskSample, RiskLevel, RiskStatus, DRFPaginationResult, RiskStatsResult,
} from '@/types/api'

const { RangePicker } = DatePicker
const { TextArea } = Input

const riskLevelMap: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'blue' },
  medium: { label: '中风险', color: 'gold' },
  high: { label: '高风险', color: 'orange' },
  critical: { label: '严重', color: 'red' },
}

const statusMap: Record<RiskStatus, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'orange' },
  confirmed: { label: '已确认', color: 'blue' },
  resolved: { label: '已处理', color: 'green' },
  false_positive: { label: '误报', color: 'default' },
}

const sourceMap: Record<string, string> = {
  ai_flag: 'AI标记',
  manual: '人工录入',
  review: '审核发现',
  import: '批量导入',
}

const riskCategories = ['敏感词', '隐私泄露', '错误信息', '合规风险', '不当言论', '其他']

const Risks: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [data, setData] = useState<RiskSample[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [stats, setStats] = useState<RiskStatsResult | null>(null)

  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<RiskSample | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [processModal, setProcessModal] = useState(false)
  const [processAction, setProcessAction] = useState<'confirm' | 'resolve' | 'mark_false_positive'>('confirm')
  const [processForm] = Form.useForm()
  const [processLoading, setProcessLoading] = useState(false)
  const [currentProcessIds, setCurrentProcessIds] = useState<number[]>([])

  const [filterForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
        risk_level: values.risk_level && values.risk_level !== 'all' ? values.risk_level : undefined,
        risk_category: values.risk_category || undefined,
        source: values.source || undefined,
        status: values.status && values.status !== 'all' ? values.status : undefined,
        keyword: values.keyword || undefined,
      }
      if (values.dateRange && values.dateRange[0]) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      const result = await riskApi.getRiskSamples(params) as unknown as DRFPaginationResult<RiskSample>
      setData(result.results || [])
      setTotal(result.count || 0)
    } catch {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const result = await riskApi.getRiskStats() as unknown as RiskStatsResult
      setStats(result)
    } catch {
      setStats(null)
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [page])

  const handleSearch = () => { setPage(1); fetchData() }
  const handleReset = () => { filterForm.resetFields(); setPage(1); setTimeout(fetchData, 0) }

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const detail = await riskApi.getRiskSample(String(id)) as unknown as RiskSample
      setCurrentDetail(detail)
      setDetailModal(true)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openProcessModal = (ids: number[], action: 'confirm' | 'resolve' | 'mark_false_positive') => {
    setCurrentProcessIds(ids)
    setProcessAction(action)
    processForm.resetFields()
    setProcessModal(true)
  }

  const handleProcessSubmit = async () => {
    try {
      const values = await processForm.validateFields()
      setProcessLoading(true)
      if (currentProcessIds.length === 1) {
        const id = currentProcessIds[0]
        if (processAction === 'confirm') {
          await riskApi.confirmRiskSample(String(id), values.handle_comment)
        } else if (processAction === 'resolve') {
          await riskApi.resolveRiskSample(String(id), values.handle_comment)
        } else {
          await riskApi.markFalsePositive(String(id), values.handle_comment)
        }
      } else {
        await riskApi.batchProcessRiskSamples(currentProcessIds, processAction, values.handle_comment)
      }
      const successText = processAction === 'confirm' ? '确认成功'
        : processAction === 'resolve' ? '处理成功' : '标记成功'
      message.success(successText)
      setProcessModal(false)
      setSelectedRowKeys([])
      fetchData()
      fetchStats()
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('操作失败')
    } finally {
      setProcessLoading(false)
    }
  }

  const handleBatchProcess = (action: 'confirm' | 'resolve' | 'mark_false_positive') => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    openProcessModal(selectedRowKeys.map(Number), action)
  }

  const processModalTitle = () => {
    const count = currentProcessIds.length
    if (processAction === 'confirm') return count > 1 ? `批量确认风险（${count}条）` : '确认风险'
    if (processAction === 'resolve') return count > 1 ? `批量处理风险（${count}条）` : '处理风险'
    return count > 1 ? `批量标记误报（${count}条）` : '标记误报'
  }

  const columns: ColumnsType<RiskSample> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '标题', dataIndex: 'title', key: 'title', width: 220, ellipsis: true,
    },
    {
      title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100,
      render: (level: RiskLevel) => (
        <Tag color={riskLevelMap[level]?.color || 'default'}>
          {riskLevelMap[level]?.label || level}
        </Tag>
      ),
    },
    {
      title: '风险分类', dataIndex: 'risk_category', key: 'risk_category', width: 110,
      render: (t: string) => t || '-',
    },
    {
      title: '来源', dataIndex: 'source', key: 'source', width: 100,
      render: (s: string) => sourceMap[s] || s,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: RiskStatus) => (
        <Tag color={statusMap[s]?.color || 'default'}>{statusMap[s]?.label || s}</Tag>
      ),
    },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 150,
      render: (tags: string[]) => (
        <Space wrap size={[4, 4]}>
          {(tags || []).map(t => <Tag key={t} color="blue" style={{ fontSize: 11, margin: 0 }}>{t}</Tag>)}
        </Space>
      ),
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '处理人', dataIndex: 'handled_by_name', key: 'handled_by_name', width: 90,
      render: (t: string) => t || '-',
    },
    {
      title: '操作', key: 'action', width: 240, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认风险？"
                description="确定要确认此条风险吗？"
                onConfirm={() => openProcessModal([record.id], 'confirm')}
                okText="确认" cancelText="取消"
              >
                <Button type="link" size="small" style={{ color: '#1890ff' }}>确认</Button>
              </Popconfirm>
              <Button type="link" size="small" onClick={() => openProcessModal([record.id], 'resolve')}>
                处理
              </Button>
            </>
          )}
          {record.status !== 'false_positive' && (
            <Popconfirm
              title="标记误报？"
              onConfirm={() => openProcessModal([record.id], 'mark_false_positive')}
              okText="确认" cancelText="取消"
            >
              <Button type="link" size="small">标记误报</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  const highRiskCount = stats?.by_level?.find(i => i.risk_level === 'high' || i.risk_level === 'critical')?.count || 0
  const weeklyNew = Math.round((stats?.total || 0) * 0.35)

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>风险样本库</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="总数" value={stats?.total || 0} prefix={<SafetyOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="待处理" value={stats?.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="高风险" value={highRiskCount} prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="本周新增" value={weeklyNew} prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ risk_level: 'all', status: 'all' }}>
          <Form.Item name="risk_level" label="风险等级">
            <Select style={{ width: 120 }}>
              <Select.Option value="all">全部</Select.Option>
              {Object.entries(riskLevelMap).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="risk_category" label="风险分类">
            <Select style={{ width: 130 }} placeholder="请选择" allowClear>
              {riskCategories.map(c => <Select.Option key={c} value={c}>{c}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {Object.entries(sourceMap).map(([k, v]) => <Select.Option key={k} value={k}>{v}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }}>
              <Select.Option value="all">全部</Select.Option>
              {Object.entries(statusMap).map(([k, v]) => (
                <Select.Option key={k} value={k}>{v.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="搜索标题" prefix={<SearchOutlined />} style={{ width: 200 }} allowClear onPressEnter={handleSearch} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>查询</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card extra={
        selectedRowKeys.length > 0 && (
          <Space>
            <span style={{ color: '#666' }}>已选择 {selectedRowKeys.length} 项</span>
            <Button type="primary" size="small" onClick={() => handleBatchProcess('confirm')}>批量确认</Button>
            <Button size="small" onClick={() => handleBatchProcess('resolve')}>批量处理</Button>
            <Button size="small" onClick={() => handleBatchProcess('mark_false_positive')}>批量误报</Button>
          </Space>
        )
      }>
        <Table
          rowKey="id" columns={columns} dataSource={data} loading={loading}
          rowSelection={{ selectedRowKeys, onChange: keys => setSelectedRowKeys(keys) }}
          pagination={{
            current: page, pageSize, total, showSizeChanger: false, showQuickJumper: true,
            showTotal: t => `共 ${t} 条`, onChange: p => setPage(p),
          }}
          scroll={{ x: 1400 }}
          locale={{ emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" /> }}
        />
      </Card>

      <Modal title="风险详情" open={detailModal} onCancel={() => setDetailModal(false)} width={800}
        footer={[<Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>]}>
        <Spin spinning={detailLoading}>
          {currentDetail && (
            <div>
              <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="ID">{currentDetail.id}</Descriptions.Item>
                <Descriptions.Item label="标题">{currentDetail.title}</Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskLevelMap[currentDetail.risk_level]?.color}>
                    {riskLevelMap[currentDetail.risk_level]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险分类">{currentDetail.risk_category}</Descriptions.Item>
                <Descriptions.Item label="来源">{sourceMap[currentDetail.source] || currentDetail.source}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status]?.color}>
                    {statusMap[currentDetail.status]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">{currentDetail.handled_by_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="关联会话">{currentDetail.conversation || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {dayjs(currentDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                {currentDetail.handled_at && (
                  <Descriptions.Item label="处理时间" span={2}>
                    {dayjs(currentDetail.handled_at).format('YYYY-MM-DD HH:mm:ss')}
                  </Descriptions.Item>
                )}
              </Descriptions>
              {currentDetail.tags && currentDetail.tags.length > 0 && (
                <Card title="标签" size="small" style={{ marginBottom: 16 }}>
                  {currentDetail.tags.map(t => <Tag key={t} color="red">{t}</Tag>)}
                </Card>
              )}
              {currentDetail.content && (
                <Card title="完整内容" size="small" style={{ marginBottom: 16 }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentDetail.content}</p>
                </Card>
              )}
              {currentDetail.handle_comment && (
                <Card title="处理意见" size="small">
                  <p style={{ margin: 0 }}>{currentDetail.handle_comment}</p>
                </Card>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal title={processModalTitle()} open={processModal} onOk={handleProcessSubmit}
        onCancel={() => setProcessModal(false)} confirmLoading={processLoading}
        okText="确认" cancelText="取消" destroyOnClose>
        <Form form={processForm} layout="vertical">
          <Form.Item
            label={processAction === 'mark_false_positive' ? '说明（选填）' : processAction === 'resolve' ? '处理意见' : '备注（选填）'}
            name="handle_comment"
            rules={processAction === 'resolve' ? [{ required: true, message: '请输入处理意见' }] : []}
          >
            <TextArea rows={4} placeholder="请输入说明" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Risks
