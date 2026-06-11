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
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PercentageOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockReviewApi as reviewApi } from '@/api'
import type { ReviewItem, ReviewStatus, ReviewType, RiskLevel } from '@/types/api'
import { formatDate } from '@/utils'

const { RangePicker } = DatePicker
const { TextArea } = Input
const { Option } = Select
const { confirm } = Modal

const statusMap: Record<ReviewStatus | 'all', { label: string; color: string }> = {
  all: { label: '全部', color: 'default' },
  pending: { label: '待审核', color: 'orange' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' },
  followup: { label: '需关注', color: 'purple' },
}

const typeMap: Record<ReviewType | 'all', { label: string; color: string }> = {
  all: { label: '全部', color: 'default' },
  text: { label: '文本', color: 'blue' },
  image: { label: '图片', color: 'green' },
  voice: { label: '语音', color: 'orange' },
  video: { label: '视频', color: 'purple' },
}

const riskLevelMap: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'blue' },
  medium: { label: '中风险', color: 'gold' },
  high: { label: '高风险', color: 'orange' },
  critical: { label: '严重', color: 'red' },
}

const salesGroups = ['华东组', '华北组', '华南组', '西南组']
const promptVersions = ['v1.0.0', 'v1.1.0', 'v1.2.0', 'v2.0.0', 'v2.1.0']

const Reviews: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [data, setData] = useState<ReviewItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, passRate: 0 })
  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<ReviewItem | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [approveForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [actionLoading, setActionLoading] = useState(false)
  const [currentActionIds, setCurrentActionIds] = useState<string[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params = {
        page,
        pageSize,
        status: values.status,
        type: values.type,
        salesGroup: values.salesGroup,
        promptVersion: values.promptVersion,
        keyword: values.keyword,
      }
      const result = await reviewApi.getList(params)
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
      const result = await reviewApi.getStats()
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
      const detail = await reviewApi.getDetail(id)
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

  const openApproveModal = (ids: string[]) => {
    setCurrentActionIds(ids)
    approveForm.resetFields()
    setApproveModal(true)
  }

  const openRejectModal = (ids: string[]) => {
    setCurrentActionIds(ids)
    rejectForm.resetFields()
    setRejectModal(true)
  }

  const handleApprove = async () => {
    try {
      const values = await approveForm.validateFields()
      setActionLoading(true)
      await reviewApi.approve(currentActionIds, values.comment)
      message.success('审核通过成功')
      setApproveModal(false)
      setSelectedRowKeys([])
      fetchData()
      fetchStats()
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    try {
      const values = await rejectForm.validateFields()
      setActionLoading(true)
      await reviewApi.reject(currentActionIds, values.reason)
      message.success('审核拒绝成功')
      setRejectModal(false)
      setSelectedRowKeys([])
      fetchData()
      fetchStats()
    } catch (error) {
      if ((error as { errorFields?: unknown[] }).errorFields) return
      message.error('操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMarkFollowup = (id: string) => {
    confirm({
      title: '标记关注',
      icon: <ExclamationCircleOutlined />,
      content: '确定要将此条目标记为需关注吗？',
      onOk: async () => {
        try {
          await reviewApi.markFollowup(id)
          message.success('标记成功')
          fetchData()
        } catch (error) {
          message.error('操作失败')
        }
      },
    })
  }

  const handleBatchApprove = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    openApproveModal(selectedRowKeys.map(String))
  }

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    openRejectModal(selectedRowKeys.map(String))
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
  }

  const columns: ColumnsType<ReviewItem> = [
    {
      title: '消息内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 280,
      render: (text: string, record) => (
        <div>
          <div style={{ marginBottom: 4 }}>{text}</div>
          <Tag color={typeMap[record.type].color} style={{ marginRight: 0 }}>
            {typeMap[record.type].label}
          </Tag>
        </div>
      ),
    },
    {
      title: '审核类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: ReviewType) => <Tag color={typeMap[type].color}>{typeMap[type].label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ReviewStatus) => (
        <Tag color={statusMap[status].color}>{statusMap[status].label}</Tag>
      ),
    },
    {
      title: '销售运营',
      dataIndex: 'salesGroup',
      key: 'salesGroup',
      width: 100,
    },
    {
      title: '提示词版本',
      dataIndex: 'promptVersion',
      key: 'promptVersion',
      width: 110,
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
      title: '提交时间',
      dataIndex: 'submitTime',
      key: 'submitTime',
      width: 170,
      render: (time: string) => formatDate(time),
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>
            详情
          </Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm
                title="确认通过？"
                description="确定要通过此条审核吗？"
                onConfirm={() => openApproveModal([record.id])}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" style={{ color: '#52c41a' }}>
                  通过
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确认拒绝？"
                description="确定要拒绝此条审核吗？"
                onConfirm={() => openRejectModal([record.id])}
                okText="确认"
                cancelText="取消"
              >
                <Button type="link" size="small" danger>
                  拒绝
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 'followup' && (
            <Button type="link" size="small" onClick={() => handleMarkFollowup(record.id)}>
              标记关注
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>内容审核</h2>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="待审核"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="通过率"
              value={stats.passRate}
              suffix="%"
              prefix={<PercentageOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ status: 'all', type: 'all' }}>
          <Form.Item name="status" label="审核状态">
            <Select style={{ width: 120 }}>
              {Object.entries(statusMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="type" label="审核类型">
            <Select style={{ width: 100 }}>
              {Object.entries(typeMap).map(([key, val]) => (
                <Option key={key} value={key}>
                  {val.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="salesGroup" label="销售运营">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {salesGroups.map((group) => (
                <Option key={group} value={group}>
                  {group}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="promptVersion" label="提示词版本">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              {promptVersions.map((v) => (
                <Option key={v} value={v}>
                  {v}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input
              placeholder="搜索内容"
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
              <Button type="primary" size="small" onClick={handleBatchApprove}>
                批量通过
              </Button>
              <Button danger size="small" onClick={handleBatchReject}>
                批量拒绝
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
          scroll={{ x: 1200 }}
          locale={{
            emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" />,
          }}
        />
      </Card>

      <Modal
        title="审核详情"
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
                <Descriptions.Item label="消息ID">{currentDetail.id}</Descriptions.Item>
                <Descriptions.Item label="审核类型">
                  <Tag color={typeMap[currentDetail.type].color}>
                    {typeMap[currentDetail.type].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status].color}>
                    {statusMap[currentDetail.status].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskLevelMap[currentDetail.riskLevel].color}>
                    {riskLevelMap[currentDetail.riskLevel].label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="销售运营">{currentDetail.salesGroup}</Descriptions.Item>
                <Descriptions.Item label="提示词版本">{currentDetail.promptVersion}</Descriptions.Item>
                <Descriptions.Item label="提交时间" span={2}>
                  {formatDate(currentDetail.submitTime)}
                </Descriptions.Item>
              </Descriptions>

              <Card title="消息内容" size="small" style={{ marginBottom: 16 }}>
                <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentDetail.content}</p>
              </Card>

              {currentDetail.riskTags && currentDetail.riskTags.length > 0 && (
                <Card title="风险标签" size="small" style={{ marginBottom: 16 }}>
                  {currentDetail.riskTags.map((tag) => (
                    <Tag key={tag} color="red">
                      {tag}
                    </Tag>
                  ))}
                </Card>
              )}

              {currentDetail.aiSuggestion && (
                <Card title="AI 建议" size="small" style={{ marginBottom: 16 }}>
                  <p style={{ margin: 0, color: '#1890ff' }}>{currentDetail.aiSuggestion}</p>
                </Card>
              )}

              {currentDetail.reviewHistory && currentDetail.reviewHistory.length > 0 && (
                <Card title="审核历史" size="small">
                  <Timeline
                    items={currentDetail.reviewHistory.map((item) => ({
                      color: item.action.includes('通过') ? 'green' : item.action.includes('拒绝') ? 'red' : 'blue',
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
        title="审核通过"
        open={approveModal}
        onOk={handleApprove}
        onCancel={() => setApproveModal(false)}
        confirmLoading={actionLoading}
        okText="确认通过"
        cancelText="取消"
      >
        <Form form={approveForm} layout="vertical">
          <Form.Item
            name="comment"
            label="审核意见（选填）"
          >
            <TextArea rows={4} placeholder="请输入审核意见" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审核拒绝"
        open={rejectModal}
        onOk={handleReject}
        onCancel={() => setRejectModal(false)}
        confirmLoading={actionLoading}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="reason"
            label="拒绝原因"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea rows={4} placeholder="请输入拒绝原因" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Reviews
