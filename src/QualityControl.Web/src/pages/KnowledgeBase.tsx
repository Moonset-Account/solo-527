import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Card,
  Tag,
  Modal,
  Form,
  DatePicker,
  Statistic,
  Row,
  Col,
  List,
  Badge,
  Tooltip,
  message
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  BookOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { knowledgeService } from '@/services/knowledgeService'
import type { KnowledgeBase, KnowledgeBaseQuery, KnowledgeStatistics } from '@/types'
import { formatDateTime } from '@/utils'

const { Option } = Select
const { RangePicker } = DatePicker

export default function KnowledgeBasePage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<KnowledgeBase[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<KnowledgeStatistics | null>(null)
  const [expiringList, setExpiringList] = useState<KnowledgeBase[]>([])
  const [query, setQuery] = useState<KnowledgeBaseQuery>({
    pageIndex: 1,
    pageSize: 20,
    sortDesc: true,
    sortBy: 'createdAt'
  })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadStats()
    loadExpiring()
  }, [query])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await knowledgeService.getKnowledgeBases(query)
      if (res.success) {
        setData(res.data!.items)
        setTotal(res.data!.totalCount)
      }
    } catch (error) {
      console.error('加载知识库失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await knowledgeService.getStatistics()
      if (res.success) {
        setStats(res.data!)
      }
    } catch (error) {
      console.error('加载统计数据失败', error)
    }
  }

  const loadExpiring = async () => {
    try {
      const res = await knowledgeService.getExpiringSoon(7)
      if (res.success) {
        setExpiringList(res.data || [])
      }
    } catch (error) {
      console.error('加载即将失效知识失败', error)
    }
  }

  const handleSearch = () => {
    setQuery({ ...query, pageIndex: 1 })
  }

  const handleReset = () => {
    setQuery({
      pageIndex: 1,
      pageSize: 20,
      sortDesc: true,
      sortBy: 'createdAt'
    })
  }

  const handlePageChange = (page: number, pageSize: number) => {
    setQuery({ ...query, pageIndex: page, pageSize })
  }

  const handleCreate = async (values: any) => {
    try {
      const res = await knowledgeService.createKnowledgeBase({
        ...values,
        authorId: 2,
        expiryDate: values.expiryDate?.toISOString()
      })
      if (res.success) {
        message.success('知识创建成功')
        setCreateModalVisible(false)
        form.resetFields()
        loadData()
        loadStats()
      }
    } catch (error) {
      console.error('创建知识失败', error)
    }
  }

  const getStatusColor = (status: number) => {
    const colors: Record<number, string> = {
      0: 'default',
      1: 'processing',
      2: 'success',
      3: 'warning',
      4: 'default',
      5: 'error'
    }
    return colors[status] || 'default'
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: KnowledgeBase) => (
        <div>
          <a onClick={() => navigate(`/knowledge/${record.id}`)}>{text}</a>
          {record.isExpired && (
            <Tag color="red" style={{ marginLeft: 8 }}>已失效</Tag>
          )}
          {!record.isExpired && record.daysUntilExpiry > 0 && record.daysUntilExpiry <= 7 && (
            <Tag color="orange" style={{ marginLeft: 8 }}>
              {record.daysUntilExpiry}天后失效
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'status',
      width: 90,
      render: (text: string, record: KnowledgeBase) => (
        <Tag color={getStatusColor(record.status)}>{text}</Tag>
      )
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorId',
      width: 100
    },
    {
      title: '浏览量',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 80
    },
    {
      title: '使用量',
      dataIndex: 'useCount',
      key: 'useCount',
      width: 80
    },
    {
      title: '有用率',
      key: 'helpfulRate',
      width: 100,
      render: (_: any, record: KnowledgeBase) => {
        const total = record.helpfulCount + record.notHelpfulCount
        const rate = total > 0 ? (record.helpfulCount / total * 100).toFixed(0) : '-'
        return <span>{rate}{total > 0 ? '%' : ''}</span>
      }
    },
    {
      title: '失效日期',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (text?: string) => text ? formatDateTime(text) : '永不过期'
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      render: (text?: string) => formatDateTime(text)
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: KnowledgeBase) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/knowledge/${record.id}`)}>
            查看
          </Button>
          <Button type="link" size="small">编辑</Button>
          <Button type="link" size="small">审核</Button>
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">知识库管理</h1>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
            新建知识
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={5}>
          <Card bordered={false}>
            <Statistic
              title="知识总数"
              value={stats?.totalKnowledge || 0}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card bordered={false}>
            <Statistic
              title="已发布"
              value={stats?.publishedKnowledge || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card bordered={false}>
            <Statistic
              title="即将失效"
              value={expiringList.length}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={5}>
          <Card bordered={false}>
            <Statistic
              title="已失效"
              value={stats?.expiredKnowledge || 0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card bordered={false}>
            <Statistic
              title="待审核"
              value={stats?.needReviewKnowledge || 0}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col flex="auto">
          <Card className="filter-card" bordered={false}>
            <Form layout="inline" onFinish={handleSearch}>
              <Form.Item label="关键词">
                <Input
                  placeholder="搜索标题或内容"
                  prefix={<SearchOutlined />}
                  allowClear
                  style={{ width: 200 }}
                  value={query.keyword}
                  onChange={(e) => setQuery({ ...query, keyword: e.target.value })}
                />
              </Form.Item>
              <Form.Item label="分类">
                <Select
                  placeholder="全部分类"
                  allowClear
                  style={{ width: 120 }}
                  value={query.category}
                  onChange={(v) => setQuery({ ...query, category: v })}
                >
                  <Option value="产品使用">产品使用</Option>
                  <Option value="常见问题">常见问题</Option>
                  <Option value="政策法规">政策法规</Option>
                  <Option value="操作指南">操作指南</Option>
                  <Option value="故障排查">故障排查</Option>
                </Select>
              </Form.Item>
              <Form.Item label="状态">
                <Select
                  placeholder="全部状态"
                  allowClear
                  style={{ width: 120 }}
                  value={query.status}
                  onChange={(v) => setQuery({ ...query, status: v })}
                >
                  <Option value={0}>草稿</Option>
                  <Option value={1}>审核中</Option>
                  <Option value={2}>已发布</Option>
                  <Option value={3}>待更新</Option>
                  <Option value={5}>已失效</Option>
                </Select>
              </Form.Item>
              <Form.Item label="是否失效">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 100 }}
                  value={query.isExpired}
                  onChange={(v) => setQuery({ ...query, isExpired: v })}
                >
                  <Option value={false}>有效</Option>
                  <Option value={true}>已失效</Option>
                </Select>
              </Form.Item>
              <Form.Item label="需要审核">
                <Select
                  placeholder="全部"
                  allowClear
                  style={{ width: 100 }}
                  value={query.needReview}
                  onChange={(v) => setQuery({ ...query, needReview: v })}
                >
                  <Option value={true}>是</Option>
                  <Option value={false}>否</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                    查询
                  </Button>
                  <Button onClick={handleReset} icon={<ReloadOutlined />}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>

          <Card bordered={false}>
            <div className="table-toolbar">
              <div className="table-toolbar-left">
                <Space>
                  <Button icon={<FileTextOutlined />}>批量导出</Button>
                </Space>
              </div>
              <div className="table-toolbar-right">
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={loadData}>刷新</Button>
                </Space>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
              pagination={{
                current: query.pageIndex,
                pageSize: query.pageSize,
                total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                onChange: handlePageChange
              }}
            />
          </Card>
        </Col>

        <Col style={{ width: 280, flexShrink: 0 }}>
          <Card
            title="即将失效提醒"
            bordered={false}
            extra={<Badge count={expiringList.length} />}
            style={{ marginBottom: 16 }}
          >
            {expiringList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'rgba(0,0,0,0.45)' }}>
                <WarningOutlined style={{ fontSize: 24, marginBottom: 8, display: 'block' }} />
                暂无即将失效的知识
              </div>
            ) : (
              <List
                size="small"
                dataSource={expiringList.slice(0, 5)}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        size="small"
                        key="view"
                        onClick={() => navigate(`/knowledge/${item.id}`)}
                      >
                        处理
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={<WarningOutlined style={{ color: '#faad14', fontSize: 16 }} />}
                      title={
                        <Tooltip title={item.title}>
                          <a onClick={() => navigate(`/knowledge/${item.id}`)} style={{ fontSize: 13 }}>
                            {item.title.length > 20 ? item.title.slice(0, 20) + '...' : item.title}
                          </a>
                        </Tooltip>
                      }
                      description={
                        <span style={{ color: '#faad14' }}>
                          {item.daysUntilExpiry > 0 ? `${item.daysUntilExpiry}天后失效` : '今天失效'}
                        </span>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>

          <Card title="知识分类" bordered={false}>
            <List
              size="small"
              dataSource={stats?.categoryCounts || []}
              renderItem={(item) => (
                <List.Item>
                  <span>{item.category}</span>
                  <Tag color="blue">{item.count}篇</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="新建知识"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
        maskClosable={false}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            label="知识标题"
            name="title"
            rules={[{ required: true, message: '请输入知识标题' }]}
          >
            <Input placeholder="请输入知识标题" maxLength={500} />
          </Form.Item>
          <Form.Item
            label="分类"
            name="category"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              <Option value="产品使用">产品使用</Option>
              <Option value="常见问题">常见问题</Option>
              <Option value="政策法规">政策法规</Option>
              <Option value="操作指南">操作指南</Option>
              <Option value="故障排查">故障排查</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="摘要"
            name="summary"
          >
            <Input.TextArea rows={2} placeholder="请输入知识摘要" maxLength={200} />
          </Form.Item>
          <Form.Item
            label="知识内容"
            name="content"
            rules={[{ required: true, message: '请输入知识内容' }]}
          >
            <Input.TextArea rows={6} placeholder="请输入详细的知识内容" maxLength={10000} showCount />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="失效日期"
                name="expiryDate"
              >
                <DatePicker style={{ width: '100%' }} placeholder="选择失效日期" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="标签"
                name="tags"
              >
                <Input placeholder="多个标签用逗号分隔" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            label="备注"
            name="remark"
          >
            <Input.TextArea rows={2} placeholder="可选：添加备注信息" maxLength={2000} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
