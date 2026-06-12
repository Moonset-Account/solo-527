import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Typography, Table, Tag } from 'antd'
import {
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { application, approval } from '@/api'
import { formatMoney } from '@/utils'
import type { ExpenseApplication, PageParams, ApplicationStatus } from '@/types'
import type { ColumnsType } from 'antd/es/table'

const { Title } = Typography

const statusMap: Record<ApplicationStatus, { text: string; color: string }> = {
  DRAFT: { text: '草稿', color: 'default' },
  PENDING: { text: '审批中', color: 'processing' },
  APPROVED: { text: '已通过', color: 'success' },
  REJECTED: { text: '已拒绝', color: 'error' }
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [pagination] = useState<PageParams>({ page: 1, pageSize: 10 })
  console.log('Pagination:', pagination)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalAmount: 0
  })
  const [recentApps, setRecentApps] = useState<ExpenseApplication[]>([])
  const [pendingApps, setPendingApps] = useState<ExpenseApplication[]>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [allResult, pendingResult] = await Promise.all([
        application.list({ page: 1, pageSize: 100 }),
        approval.getPendingList({ page: 1, pageSize: 5 })
      ])

      const approvedCount = allResult.list.filter(a => a.status === 'APPROVED').length
      const rejectedCount = allResult.list.filter(a => a.status === 'REJECTED').length
      const pendingCount = allResult.list.filter(a => a.status === 'PENDING').length
      const totalAmount = allResult.list
        .filter(a => a.status === 'APPROVED')
        .reduce((sum, a) => sum + a.amount, 0)

      setStats({
        total: allResult.total,
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        totalAmount
      })
      setRecentApps(allResult.list.slice(0, 5))
      setPendingApps(pendingResult.list)
    } catch (error) {
      console.error('Fetch dashboard data failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: {
      data: ['申请数量', '审批通过数量']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '申请数量',
        type: 'bar',
        data: [12, 19, 15, 22, 18, 25],
        itemStyle: { color: '#1890ff' }
      },
      {
        name: '审批通过数量',
        type: 'bar',
        data: [10, 17, 13, 20, 16, 22],
        itemStyle: { color: '#52c41a' }
      }
    ]
  }

  const pieOption = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '费用类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '差旅费' },
          { value: 25, name: '招待费' },
          { value: 20, name: '办公用品' },
          { value: 15, name: '交通费' },
          { value: 5, name: '其他' }
        ]
      }
    ]
  }

  const columns: ColumnsType<ExpenseApplication> = [
    {
      title: '申请编号',
      dataIndex: 'applicationNo',
      key: 'applicationNo',
      render: (text: string) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: '申请人',
      dataIndex: 'applicantName',
      key: 'applicantName'
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => <span style={{ fontWeight: 'bold' }}>{formatMoney(amount)}</span>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: ApplicationStatus) => {
        const { text, color } = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={color as any}>{text}</Tag>
      }
    }
  ]

  return (
    <div>
      <Title level={4} style={{ marginBottom: 16 }}>数据概览</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="申请总数"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="待审批"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="已通过"
              value={stats.approved}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <Card>
            <Statistic
              title="已拒绝"
              value={stats.rejected}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="月度申请趋势" loading={loading}>
            <ReactECharts option={chartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="费用类型分布" loading={loading}>
            <ReactECharts option={pieOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title="待我审批" loading={loading} extra={<a href="#/admin/approval">查看全部</a>}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={pendingApps}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近申请" loading={loading} extra={<a href="#/admin/approved">查看全部</a>}>
            <Table
              rowKey="id"
              columns={columns}
              dataSource={recentApps}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard
