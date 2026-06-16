import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin } from 'antd'
import {
  ToolOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  BellOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import axios from '@/utils/request'
import { useAuthStore } from '@/store/auth'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    if (user?.role === 'admin' || user?.role === 'dorm_manager') {
      const fetchStats = async () => {
        setLoading(true)
        try {
          const { data } = await axios.get('/api/repairs/statistics/')
          setStats(data)
        } finally {
          setLoading(false)
        }
      }
      fetchStats()
    }
  }, [user])

  const statusChart = stats ? {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      label: { show: false },
      data: [
        { value: stats.by_status?.pending || 0, name: '待处理', itemStyle: { color: '#faad14' } },
        { value: stats.by_status?.assigned || 0, name: '已分配', itemStyle: { color: '#1677ff' } },
        { value: stats.by_status?.in_progress || 0, name: '处理中', itemStyle: { color: '#13c2c2' } },
        { value: stats.by_status?.completed || 0, name: '已完成', itemStyle: { color: '#52c41a' } },
        { value: stats.by_status?.cancelled || 0, name: '已取消', itemStyle: { color: '#8c8c8c' } },
      ],
    }],
  } : null

  const typeChart = stats ? {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['水电', '家具', '电器', '门窗', '网络', '其他'],
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        stats.by_type?.plumbing || 0,
        stats.by_type?.furniture || 0,
        stats.by_type?.electrical || 0,
        stats.by_type?.door_window || 0,
        stats.by_type?.network || 0,
        stats.by_type?.other || 0,
      ],
      itemStyle: { color: '#1677ff' },
    }],
  } : null

  if (user?.role === 'admin' || user?.role === 'dorm_manager') {
    return (
      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="报修总数"
                value={stats?.total || 0}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待处理"
                value={stats?.by_status?.pending || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats?.completed_count || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均处理时长(小时)"
                value={stats?.avg_processing_hours || 0}
                valueStyle={{ color: '#1677ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <Card title="报修状态分布">
              {statusChart && <ReactECharts option={statusChart} style={{ height: 300 }} />}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="报修类型分布">
              {typeChart && <ReactECharts option={typeChart} style={{ height: 300 }} />}
            </Card>
          </Col>
        </Row>
      </Spin>
    )
  }

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic title="欢迎回来" value={user?.real_name || user?.username} prefix={<UserOutlined />} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic title="角色" value={user?.role_display} />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={8}>
        <Card>
          <Statistic title="身份认证" value={user?.is_verified ? '已认证' : '待审核'} />
        </Card>
      </Col>
    </Row>
  )
}
