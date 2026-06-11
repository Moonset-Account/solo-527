import { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Form,
  Select,
  DatePicker,
  Input,
  Modal,
  message,
  Popconfirm,
  Empty,
  Spin,
  Descriptions,
  Timeline,
} from 'antd'
import {
  SafetyOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  RiseOutlined,
  EyeOutlined,
  SearchOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockRiskApi as riskApi } from '@/api'
import type { RiskItem, RiskLevel, RiskStatus } from '@/types/api'
import { formatDate } from '@/utils'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select
const { confirm } = Modal

const riskLevelMap: Record<RiskLevel | 'all', { label: string; color: string }> = {
  all: { label: '全部', color: 'default' },
  low: { label: '低风险', color: 'blue' },
  medium: { label: '中风险', color: 'gold' },
  high: { label: '高风险', color: 'orange' },
  critical: { label: '严重', color: 'red' },
}

const statusMap: Record<RiskStatus | 'all', { label: string; color: string }> = {
  all: { label: '全部', color: 'default' },
  pending: { label: '待处理', color: 'orange' },
  confirmed: { label: '已确认', color: 'blue' },
  processed: { label: '已处理', color: 'green' },
  false_positive: { label: '误报', color: 'default' },
}

const categories = ['敏感词', '违规内容', '安全风险', '欺诈行为', '其他']
const sources = ['AI检测', '人工举报', '系统监控', '第三方告警']

const Risks: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [data, setData] = useState<RiskItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [stats, setStats] = useState({ total: 0, pending: 0, highRisk: 0, weeklyNew: 0 })
  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<RiskItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [processModal, setProcessModal] = useState(false)
  const [processForm] = Form.useForm()
  const [processLoading, setProcessLoading] = useState(false)
  const [filterForm] = Form.useForm()
  const [currentActionIds, setCurrentActionIds] = useState<string[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params = {
        page,
        pageSize,
        riskLevel: values.riskLevel,
        category: values.category,
        source: values.source,
        status: values.status,
        keyword: values.keyword,
      }
      const result = await riskApi.getList(params)
      setData(result.list)
      setTotal(result.total)
    } catch (error) {
      message.error('获取数据失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const result = await riskApi.getStats()
      setStats(result)
    } catch (error) {
      message.error('获取统计数据失败')
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    fetchStats()
  }, [page])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const handleReset = () => {
    filterForm.resetFields()
    setPage(1)
    setTimeout(fetchData, 0)
  }

  const handleViewDetail = async (id: string) => {
    setDetailLoading(true)
    try {
      const detail = await riskApi.getDetail(id)
      if (detail) {
        setCurrentDetail(detail)
        setDetailModal(true)
      }
    } catch (error) {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleConfirm = (ids: string[]) => {
    confirm({
      title: '确认风险',
      icon: <ExclamationCircleOutlined />,
      content: `确定要确认选中的 ${ids.length} 条风险吗？`,
      onOk: async () => {
        try {
          await riskApi.confirm(ids)
          message.success('确认成功')
          setSelectedRowKeys([])
          fetchData()
          fetchStats()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const openProcessModal = (ids: string[]) => {
    setCurrentActionIds(ids)
    processForm.resetFields()
    setProcessModal(true)
  }

  const handleProcess = async () => {
    try {
      const values = await processForm.validateFields()
      setProcessLoading(true)
      await riskApi.process(currentActionIds, values.comment)
      message.success('处理成功')
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

  const handleMarkFalsePositive = (ids: string[]) => {
    confirm({
      title: '标记误报',
      icon: <ExclamationCircleOutlined />,
      content: `确定要将选中的 ${ids.length} 条标记为误报吗？`,
      onOk: async () => {
        try {
          await riskApi.markFalsePositive(ids)
          message.success('标记成功')
          setSelectedRowKeys([])
          fetchData()
          fetchStats()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleBatchConfirm = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    handleConfirm(selectedRowKeys.map(String))
  }

  const handleBatchProcess = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    openProcessModal(selectedRowKeys.map(String))
  }

  const handleBatchFalsePositive = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    handleMarkFalsePositive(selectedRowKeys.map(String))
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  const columns: ColumnsType<RiskItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 220,
      ellipsis: true,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level: RiskLevel) => (
        <Tag color={riskLevelMap[level].color}>{riskLevelMap[level].label}</Tag>
      ),
    },
    {
      title: '风险分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: RiskStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '标签',
      dataIndex: 'tags',
      key: 'tags',
      width: 150,
      render: (tags: string[]) => (
        <Space wrap size={[4, 4]}>
          {tags.map((tag) => (
            <Tag key={tag} color="blue" style={{ fontSize: 11, margin: 0 }}>
              {tag}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170,
      render: (time: string) => formatDate(time),
    },
    {
      title: '处理人',
      dataIndex: 'handler',
      key: 'handler',
      width: 90,
      render: (handler?: string) => handler || '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 240,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认风险？"
                description="确定要确认此风险吗？"
                onConfirm={() => handleConfirm([record.id])}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" style={{ color: '#1890ff' }}>
                  确认
                </Button>
              </Popconfirm>
              <Button type="link" size="small" onClick={() => openProcessModal([record.id])}>
                处理
              </Button>
            </>
          )}
          {record.status !== 'false_positive' && (
            <Popconfirm
              title="标记误报？"
              description="确定要将此条标记为误报吗？"
              onConfirm={() => handleMarkFalsePositive([record.id])}
              okText="确认"
              cancelText="取消"
            >
              <Button type="link" size="small">
                标记误报
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>风险样本库</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="总数"
              value={stats.total}
              prefix={<SafetyOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="高风险"
              value={stats.highRisk}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="本周新增"
              value={stats.weeklyNew}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ riskLevel: 'all', status: 'all' }}>
          <Form.Item name="riskLevel" label="风险等级">
            <Select style={{ width: 120 }}>
              {Object.entries(riskLevelMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="category" label="风险分类">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {categories.map((c) => (
                <Option key={c} value={c}>
                  {c}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {sources.map((s) => (
                <Option key={s} value={s}>
                  {s}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input
              placeholder="搜索标题"
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
              onPressEnter={handleSearch}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>
                查询
              </Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          selectedRowKeys.length > 0 && (
            <Space>
              <span style={{ color: '#666' }}>已选择 {selectedRowKeys.length} 项</span>
              <Button type="primary" size="small" onClick={handleBatchConfirm}>
                批量确认
              </Button>
              <Button size="small" onClick={handleBatchProcess}>
                批量处理
              </Button>
              <Button size="small" onClick={handleBatchFalsePositive}>
                批量误报
              </Button>
            </Space>
          )
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={loading}
          rowSelection={rowSelection}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p) => setPage(p),
          }}
          scroll={{ x: 1300 }}
          locale={{
            emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" />,
          }}
        />
      </Card>

      <Modal
        title="风险详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
      >
        <Spin spinning={detailLoading}>
          {currentDetail && (
            <div>
              <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="风险ID">{currentDetail.id}</Descriptions.Item>
                <Descriptions.Item label="标题">{currentDetail.title}</Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskLevelMap[currentDetail.riskLevel].color}>
                    {riskLevelMap[currentDetail.riskLevel].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险分类">{currentDetail.category}</Descriptions.Item>
                <Descriptions.Item label="来源">{currentDetail.source}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status].color}>
                    {statusMap[currentDetail.status].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="处理人">{currentDetail.handler || '-'}</Descriptions.Item>
                <Descriptions.Item label="关联会话">
                  {currentDetail.relatedSessionId || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>
                  {formatDate(currentDetail.createTime)}
                </Descriptions.Item>
              </Descriptions>

              <Card title="风险标签" size="small" style={{ marginBottom: 16 }}>
                {currentDetail.tags.map((tag) => (
                  <Tag key={tag} color="red">
                    {tag}
                  </Tag>
                ))}
              </Card>

              <Card title="完整内容" size="small" style={{ marginBottom: 16 }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentDetail.content}</p>
              </Card>

              {currentDetail.relatedSessionId && (
                <Card title="关联会话" size="small" style={{ marginBottom: 16 }}>
                  <p style={{ margin: 0 }}>
                    会话ID：<code>{currentDetail.relatedSessionId}</code>
                  </p>
                </Card>
              )}

              {currentDetail.processHistory && currentDetail.processHistory.length > 0 && (
                <Card title="处理历史" size="small">
                  <Timeline
                    items={currentDetail.processHistory.map((item) => ({
                      color:
                        item.action === '风险检测'
                          ? 'orange'
                          : item.action.includes('确认')
                          ? 'blue'
                          : item.action.includes('处理')
                          ? 'green'
                          : item.action.includes('误报')
                          ? 'gray'
                          : 'blue',
                      children: (
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.action}</div>
                          <div style={{ color: '#666', fontSize: 12 }}>
                            操作人：{item.operator} · {formatDate(item.time)}
                          </div>
                          {item.comment && <div style={{ marginTop: 4 }}>{item.comment}</div>}
                        </div>
                      ),
                    }))}
                  />
                </Card>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal
        title="处理风险"
        open={processModal}
        onOk={handleProcess}
        onCancel={() => setProcessModal(false)}
        confirmLoading={processLoading}
        okText="确认处理"
        cancelText="取消"
      >
        <Form form={processForm} layout="vertical">
          <Form.Item
            name="comment"
            label="处理意见"
            rules={[{ required: true, message: '请输入处理意见' }]}
          >
            <TextArea rows={4} placeholder="请输入处理意见" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Risks
