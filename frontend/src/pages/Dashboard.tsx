import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, DatePicker, Spin, Select } from 'antd'
import {
  UserOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  TeamOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dashboardApi, coachApi } from '@/api'
import type { DashboardStats, FunnelItem, Coach } from '@/types'
import dayjs from 'dayjs'
import { useUserStore } from '@/store'

const { RangePicker } = DatePicker

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [funnel, setFunnel] = useState<FunnelItem[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs()
  ])
  const [statusFilter, setStatusFilter] = useState<string | undefined>()
  const [coachFilter, setCoachFilter] = useState<number | undefined>()
  const { isAdmin } = useUserStore()

  useEffect(() => {
    loadCoaches()
  }, [])

  useEffect(() => {
    loadData()
  }, [dateRange, statusFilter, coachFilter])

  const loadCoaches = async () => {
    try {
      const data = await coachApi.list()
      setCoaches(data)
    } catch (e) {
      console.error(e)
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsData, funnelData] = await Promise.all([
        dashboardApi.getStats({
          startDate: dateRange[0].format('YYYY-MM-DD'),
          endDate: dateRange[1].format('YYYY-MM-DD'),
          coachId: coachFilter,
          status: statusFilter
        }),
        dashboardApi.getRenewalFunnel()
      ])
      setStats(statsData)
      setFunnel(funnelData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const bookingChartOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [
      {
        name: '预约类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: [
          { value: stats?.privateBookings || 0, name: '私教课', itemStyle: { color: '#3B82F6' } },
          { value: stats?.groupBookings || 0, name: '团课', itemStyle: { color: '#10B981' } }
        ]
      }
    ]
  }

  const funnelChartOption = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}' },
    series: [
      {
        name: '续费漏斗',
        type: 'funnel',
        left: '10%',
        width: '80%',
        label: { show: true, position: 'inside' },
        itemStyle: { borderColor: '#fff', borderWidth: 2 },
        data: funnel.map((item) => ({
          value: item.count,
          name: item.stage,
          itemStyle: { color: item.color }
        }))
      }
    ]
  }

  return (
    <Spin spinning={loading}>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>时间范围：</span>
        <RangePicker
          value={dateRange}
          onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
        />
        <span>预约状态：</span>
        <Select
          style={{ width: 150 }}
          placeholder="全部状态"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
        >
          <Select.Option value="BOOKED">已预约</Select.Option>
          <Select.Option value="CHECKED_IN">已签到</Select.Option>
          <Select.Option value="COMPLETED">已完成</Select.Option>
          <Select.Option value="CANCELLED">已取消</Select.Option>
          <Select.Option value="NO_SHOW">未到场</Select.Option>
        </Select>
        {isAdmin() && (
          <>
            <span>负责人：</span>
            <Select
              style={{ width: 180 }}
              placeholder="全部教练"
              allowClear
              value={coachFilter}
              onChange={setCoachFilter}
            >
              {coaches.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.coachNo}
                </Select.Option>
              ))}
            </Select>
          </>
        )}
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃会员"
              value={stats?.activeMembers || 0}
              prefix={<UserOutlined style={{ color: '#3B82F6' }} />}
              valueStyle={{ color: '#3B82F6' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="有效课包会员"
              value={stats?.activePackageMembers || 0}
              prefix={<TeamOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总预约数"
              value={stats?.totalBookings || 0}
              prefix={<CalendarOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="完成预约"
              value={stats?.completedBookings || 0}
              prefix={<ClockCircleOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={12}>
          <Card title="预约类型分布">
            <ReactECharts option={bookingChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="续费漏斗分析">
            <ReactECharts option={funnelChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="团课总数"
              value={stats?.totalGroupClasses || 0}
              prefix={<CalendarOutlined style={{ color: '#8B5CF6' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="预约完成率"
              value={`${stats?.completionRate || 0}%`}
              prefix={<ArrowUpOutlined style={{ color: '#06B6D4' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="活跃课包"
              value={stats?.activePackages || 0}
              prefix={<WarningOutlined style={{ color: '#F59E0B' }} />}
              valueStyle={{ color: '#F59E0B' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="剩余总课时"
              value={stats?.totalRemainingSessions || 0}
              prefix={<WarningOutlined style={{ color: '#10B981' }} />}
              valueStyle={{ color: '#10B981' }}
            />
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default Dashboard
