import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Tag,
  Card,
  Progress,
  Statistic,
  Row,
  Col
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  PlusOutlined,
  FilterOutlined,
  AuditOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { inspectionService } from '@/services/inspectionService'
import type { QualityInspection, InspectionQuery, InspectionStatistics } from '@/types'
import { formatDateTime, getScoreColor } from '@/utils'

const { RangePicker } = DatePicker
const { Option } = Select

export default function InspectionList() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<QualityInspection[]>([])
  const [total, setTotal] = useState(0)
  const [stats, setStats] = useState<InspectionStatistics | null>(null)
  const [query, setQuery] = useState<InspectionQuery>({
    pageIndex: 1,
    pageSize: 20,
    sortDesc: true,
    sortBy: 'createdAt'
  })

  useEffect(() => {
    loadData()
    loadStats()
  }, [query])

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await inspectionService.getInspections(query)
      if (res.success) {
        setData(res.data!.items)
        setTotal(res.data!.totalCount)
      }
    } catch (error) {
      console.error('加载质检记录失败', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await inspectionService.getStatistics()
      if (res.success) {
        setStats(res.data!)
      }
    } catch (error) {
      console.error('加载统计数据失败', error)
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

  const handleGoToRandom = () => {
    navigate('/sessions')
  }

  const columns = [
    {
      title: '质检编号',
      dataIndex: 'inspectionNumber',
      key: 'inspectionNumber',
      width: 140,
      render: (text: string, record: QualityInspection) => (
        <a onClick={() => navigate(`/inspections/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '关联会话',
      dataIndex: 'sessionNumber',
      key: 'sessionNumber',
      width: 140,
      render: (text: string, record: QualityInspection) => (
        <a onClick={() => navigate(`/sessions/${record.sessionId}`)}>{text}</a>
      )
    },
    {
      title: '会话标题',
      dataIndex: 'sessionTitle',
      key: 'sessionTitle',
      ellipsis: true
    },
    {
      title: '质检员',
      dataIndex: 'inspectorName',
      key: 'inspectorName',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'statusText',
      key: 'status',
      width: 90,
      render: (text: string, record: QualityInspection) => {
        const colorMap: Record<number, string> = {
          0: 'default',
          1: 'processing',
          2: 'success',
          3: 'warning',
          4: 'purple'
        }
        return <Tag color={colorMap[record.status] || 'default'}>{text}</Tag>
      }
    },
    {
      title: '得分',
      dataIndex: 'scorePercentage',
      key: 'scorePercentage',
      width: 150,
      render: (score: number, record: QualityInspection) => (
        <div>
          <span style={{
            color: getScoreColor(score),
            fontWeight: 600,
            fontSize: 16
          }}>
            {score.toFixed(1)}分
          </span>
          <span style={{ color: 'rgba(0,0,0,0.45)', marginLeft: 4 }}>
            ({record.totalScore}/{record.maxScore})
          </span>
        </div>
      ),
      sorter: true
    },
    {
      title: '需培训',
      dataIndex: 'isRequiresRetrain',
      key: 'isRequiresRetrain',
      width: 80,
      render: (v: boolean) => v ? <Tag color="red">是</Tag> : <span style={{ color: 'rgba(0,0,0,0.45)' }}>否</span>
    },
    {
      title: '质检时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text: string) => formatDateTime(text),
      sorter: true
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_: any, record: QualityInspection) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/inspections/${record.id}`)}>
            查看
          </Button>
          {record.status !== 2 && (
            <Button type="link" size="small" onClick={() => navigate(`/inspections/edit/${record.id}`)}>
              编辑
            </Button>
          )}
          {record.relatedTicketId && (
            <Button type="link" size="small" onClick={() => navigate(`/tickets/${record.relatedTicketId}`)}>
              工单
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">质检评分</h1>
        <Space>
          <Button icon={<AuditOutlined />} onClick={handleGoToRandom}>
            去抽检
          </Button>
          <Button icon={<FileTextOutlined />}>质检报告</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="质检总数"
              value={stats?.totalInspections || 0}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="待质检"
              value={stats?.pendingInspections || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="平均分"
              value={stats?.averageScore || 0}
              precision={1}
              suffix="分"
              valueStyle={{ color: getScoreColor(stats?.averageScore || 0) }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card bordered={false}>
            <Statistic
              title="合格率"
              value={stats?.passRate || 0}
              precision={1}
              suffix="%"
              valueStyle={{ color: stats && stats.passRate >= 90 ? '#52c41a' : '#faad14' }}
            />
            <Progress
              percent={Math.round(stats?.passRate || 0)}
              size="small"
              showInfo={false}
              style={{ marginTop: 8 }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" bordered={false}>
        <Form layout="inline" onFinish={handleSearch}>
          <Form.Item label="关键词">
            <Input
              placeholder="搜索质检编号或会话标题"
              prefix={<SearchOutlined />}
              allowClear
              style={{ width: 220 }}
              value={query.keyword}
              onChange={(e) => setQuery({ ...query, keyword: e.target.value })}
            />
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
              <Option value={1}>进行中</Option>
              <Option value={2}>已完成</Option>
              <Option value={3}>申诉中</Option>
              <Option value={4}>已申诉</Option>
            </Select>
          </Form.Item>
          <Form.Item label="质检员">
            <Select
              placeholder="全部质检员"
              allowClear
              style={{ width: 120 }}
              value={query.inspectorId}
              onChange={(v) => setQuery({ ...query, inspectorId: v })}
            >
              <Option value={2}>张质检</Option>
            </Select>
          </Form.Item>
          <Form.Item label="分数">
            <Input.Group compact style={{ width: 180 }}>
              <InputNumber
                style={{ width: '45%' }}
                placeholder="最低分"
                min={0}
                max={100}
                value={query.minScore}
                onChange={(v) => setQuery({ ...query, minScore: v as number })}
              />
              <Input
                style={{ width: '10%', textAlign: 'center', borderLeft: 0, borderRight: 0 }}
                placeholder="~"
                disabled
              />
              <InputNumber
                style={{ width: '45%' }}
                placeholder="最高分"
                min={0}
                max={100}
                value={query.maxScore}
                onChange={(v) => setQuery({ ...query, maxScore: v as number })}
              />
            </Input.Group>
          </Form.Item>
          <Form.Item label="时间范围">
            <RangePicker
              showTime
              style={{ width: 360 }}
              value={query.startTime && query.endTime ? [dayjs(query.startTime), dayjs(query.endTime)] : undefined}
              onChange={(dates) => setQuery({
                ...query,
                startTime: dates?.[0]?.toISOString(),
                endTime: dates?.[1]?.toISOString()
              })}
            />
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
              <Button icon={<FilterOutlined />}>高级筛选</Button>
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
    </div>
  )
}

import { Form, InputNumber } from 'antd'
