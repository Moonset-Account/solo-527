import { useState, useEffect } from 'react'
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space,
  Form, Select, DatePicker, Input, Modal, message, Popconfirm,
  Empty, Spin, Descriptions,
} from 'antd'
import {
  ClockCircleOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FlagOutlined, EyeOutlined, SearchOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { reviewApi } from '@/api'
import type { Review, ReviewStatus, RiskLevel, DRFPaginationResult, ReviewStatsResult } from '@/types/api'

const { RangePicker } = DatePicker
const { TextArea } = Input

const statusMap: Record<ReviewStatus, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'orange' },
  approved: { label: '已通过', color: 'green' },
  rejected: { label: '已拒绝', color: 'red' },
  flagged: { label: '已标记', color: 'purple' },
}

const riskLevelMap: Record<RiskLevel, { label: string; color: string }> = {
  low: { label: '低风险', color: 'blue' },
  medium: { label: '中风险', color: 'gold' },
  high: { label: '高风险', color: 'orange' },
  critical: { label: '严重', color: 'red' },
}

const Reviews: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [statsLoading, setStatsLoading] = useState(false)
  const [data, setData] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [stats, setStats] = useState<ReviewStatsResult | null>(null)
  const [detailModal, setDetailModal] = useState(false)
  const [currentDetail, setCurrentDetail] = useState<Review | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [approveForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [actionLoading, setActionLoading] = useState(false)
  const [currentActionIds, setCurrentActionIds] = useState<number[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params: Record<string, unknown> = {
        page,
        page_size: pageSize,
        status: values.status && values.status !== 'all' ? values.status : undefined,
        review_type: values.review_type && values.review_type !== 'all' ? values.review_type : undefined,
        sales_operation: values.sales_operation || undefined,
        prompt_version: values.prompt_version || undefined,
        keyword: values.keyword || undefined,
      }
      if (values.dateRange && values.dateRange[0]) {
        params.start_date = values.dateRange[0].format('YYYY-MM-DD')
        params.end_date = values.dateRange[1].format('YYYY-MM-DD')
      }
      const result = await reviewApi.getReviews(params) as unknown as DRFPaginationResult<Review>
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
      const result = await reviewApi.getReviewStats() as unknown as ReviewStatsResult
      setStats(result)
    } catch {
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

  const handleViewDetail = async (id: number) => {
    setDetailLoading(true)
    try {
      const detail = await reviewApi.getReview(id) as unknown as Review
      setCurrentDetail(detail)
      setDetailModal(true)
    } catch {
      message.error('获取详情失败')
    } finally {
      setDetailLoading(false)
    }
  }

  const openApproveModal = (ids: number[]) => {
    setCurrentActionIds(ids)
    approveForm.resetFields()
    setApproveModal(true)
  }

  const openRejectModal = (ids: number[]) => {
    setCurrentActionIds(ids)
    rejectForm.resetFields()
    setRejectModal(true)
  }

  const handleApprove = async () => {
    try {
      const values = await approveForm.validateFields()
      setActionLoading(true)
      if (currentActionIds.length === 1) {
        await reviewApi.approveReview(currentActionIds[0], {
          comment: values.comment,
          is_accurate: values.is_accurate,
        })
      } else {
        await reviewApi.batchApproveReviews(currentActionIds, values.comment)
      }
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
      if (currentActionIds.length === 1) {
        await reviewApi.rejectReview(currentActionIds[0], {
          comment: values.comment,
          is_accurate: values.is_accurate,
          inaccuracy_reason: values.inaccuracy_reason,
        })
      } else {
        await reviewApi.batchRejectReviews(currentActionIds, values.comment)
      }
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

  const handleFlag = async (id: number) => {
    Modal.confirm({
      title: '标记关注',
      content: '确定要将此条目标记为需关注吗？',
      onOk: async () => {
        try {
          await reviewApi.flagReview(id)
          message.success('标记成功')
          fetchData()
        } catch {
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
    openApproveModal(selectedRowKeys.map(Number))
  }

  const handleBatchReject = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要操作的条目')
      return
    }
    openRejectModal(selectedRowKeys.map(Number))
  }

  const columns: ColumnsType<Review> = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    {
      title: '消息内容', dataIndex: 'message_content', key: 'message_content',
      ellipsis: true, width: 250,
      render: (text: string) => text || '-',
    },
    {
      title: '审核类型', dataIndex: 'review_type', key: 'review_type', width: 100,
      render: (type: string, record) => record.review_type_display || type,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (status: ReviewStatus) => <Tag color={statusMap[status]?.color || 'default'}>{statusMap[status]?.label || status}</Tag>,
    },
    {
      title: '销售运营', dataIndex: 'sales_operation', key: 'sales_operation', width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: '提示词版本', dataIndex: 'prompt_version', key: 'prompt_version', width: 110,
      render: (text: string) => text || '-',
    },
    {
      title: '风险等级', dataIndex: 'risk_level', key: 'risk_level', width: 100,
      render: (level: RiskLevel) => <Tag color={riskLevelMap[level]?.color || 'default'}>{riskLevelMap[level]?.label || level}</Tag>,
    },
    {
      title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170,
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作', key: 'action', width: 220, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record.id)}>详情</Button>
          {record.status === 'pending' && (
            <>
              <Popconfirm title="确认通过？" onConfirm={() => openApproveModal([record.id])} okText="确认" cancelText="取消">
                <Button type="link" size="small" style={{ color: '#52c41a' }}>通过</Button>
              </Popconfirm>
              <Popconfirm title="确认拒绝？" onConfirm={() => openRejectModal([record.id])} okText="确认" cancelText="取消">
                <Button type="link" size="small" danger>拒绝</Button>
              </Popconfirm>
            </>
          )}
          {record.status !== 'flagged' && (
            <Button type="link" size="small" onClick={() => handleFlag(record.id)}>标记关注</Button>
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
            <Statistic title="待审核" value={stats?.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="已通过" value={stats?.approved || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="已拒绝" value={stats?.rejected || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card loading={statsLoading}>
            <Statistic title="通过率" value={stats?.approval_rate || 0} suffix="%" prefix={<FlagOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Form form={filterForm} layout="inline" initialValues={{ status: 'all', review_type: 'all' }}>
          <Form.Item name="status" label="审核状态">
            <Select style={{ width: 120 }}>
              <Select.Option value="all">全部</Select.Option>
              {Object.entries(statusMap).map(([key, val]) => (
                <Select.Option key={key} value={key}>{val.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="review_type" label="审核类型">
            <Select style={{ width: 100 }}>
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="text">文本</Select.Option>
              <Select.Option value="image">图片</Select.Option>
              <Select.Option value="voice">语音</Select.Option>
              <Select.Option value="video">视频</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="sales_operation" label="销售运营">
            <Select style={{ width: 120 }} placeholder="请选择" allowClear>
              <Select.Option value="华东组">华东组</Select.Option>
              <Select.Option value="华北组">华北组</Select.Option>
              <Select.Option value="华南组">华南组</Select.Option>
              <Select.Option value="西南组">西南组</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="dateRange" label="日期范围">
            <RangePicker style={{ width: 260 }} />
          </Form.Item>
          <Form.Item name="keyword">
            <Input placeholder="搜索内容" prefix={<SearchOutlined />} style={{ width: 200 }} allowClear onPressEnter={handleSearch} />
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
            <Button type="primary" size="small" onClick={handleBatchApprove}>批量通过</Button>
            <Button danger size="small" onClick={handleBatchReject}>批量拒绝</Button>
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
          scroll={{ x: 1200 }}
          locale={{ emptyText: loading ? <Spin tip="加载中..." /> : <Empty description="暂无数据" /> }}
        />
      </Card>

      <Modal title="审核详情" open={detailModal} onCancel={() => setDetailModal(false)} width={800}
        footer={[<Button key="close" onClick={() => setDetailModal(false)}>关闭</Button>]}>
        <Spin spinning={detailLoading}>
          {currentDetail && (
            <div>
              <Descriptions title="基本信息" bordered column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="ID">{currentDetail.id}</Descriptions.Item>
                <Descriptions.Item label="审核类型">{currentDetail.review_type_display || currentDetail.review_type}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[currentDetail.status]?.color}>{statusMap[currentDetail.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="风险等级">
                  <Tag color={riskLevelMap[currentDetail.risk_level]?.color}>{riskLevelMap[currentDetail.risk_level]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="销售运营">{currentDetail.sales_operation || '-'}</Descriptions.Item>
                <Descriptions.Item label="提示词版本">{currentDetail.prompt_version || '-'}</Descriptions.Item>
                <Descriptions.Item label="AI模型">{currentDetail.ai_model || '-'}</Descriptions.Item>
                <Descriptions.Item label="审核人">{currentDetail.reviewer_name || '-'}</Descriptions.Item>
                <Descriptions.Item label="创建时间" span={2}>{dayjs(currentDetail.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              </Descriptions>
              {currentDetail.message_content && (
                <Card title="消息内容" size="small" style={{ marginBottom: 16 }}>
                  <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{currentDetail.message_content}</p>
                </Card>
              )}
              {currentDetail.comment && (
                <Card title="审核意见" size="small" style={{ marginBottom: 16 }}>
                  <p style={{ margin: 0 }}>{currentDetail.comment}</p>
                </Card>
              )}
              {currentDetail.risk_tags && currentDetail.risk_tags.length > 0 && (
                <Card title="风险标签" size="small" style={{ marginBottom: 16 }}>
                  {currentDetail.risk_tags.map(tag => <Tag key={tag} color="red">{tag}</Tag>)}
                </Card>
              )}
            </div>
          )}
        </Spin>
      </Modal>

      <Modal title="审核通过" open={approveModal} onOk={handleApprove} onCancel={() => setApproveModal(false)}
        confirmLoading={actionLoading} okText="确认通过" cancelText="取消">
        <Form form={approveForm} layout="vertical">
          <Form.Item name="comment" label="审核意见（选填）">
            <TextArea rows={4} placeholder="请输入审核意见" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="is_accurate" label="AI建议是否准确">
            <Select placeholder="请选择" allowClear>
              <Select.Option value={true}>准确</Select.Option>
              <Select.Option value={false}>不准确</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="审核拒绝" open={rejectModal} onOk={handleReject} onCancel={() => setRejectModal(false)}
        confirmLoading={actionLoading} okText="确认拒绝" cancelText="取消" okButtonProps={{ danger: true }}>
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="comment" label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <TextArea rows={4} placeholder="请输入拒绝原因" maxLength={500} showCount />
          </Form.Item>
          <Form.Item name="is_accurate" label="AI建议是否准确">
            <Select placeholder="请选择" allowClear>
              <Select.Option value={true}>准确</Select.Option>
              <Select.Option value={false}>不准确</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="inaccuracy_reason" label="不准确原因">
            <Input placeholder="如AI建议不准确，请说明原因" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Reviews
