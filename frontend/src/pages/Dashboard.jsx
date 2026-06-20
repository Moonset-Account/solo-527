import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, Spin, message } from 'antd'
import {
  FileTextOutlined,
  ToolOutlined,
  TeamOutlined,
  WarningOutlined,
  DollarOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import { getWorkOrderStats, queryBills, queryContractRisks, queryVisitors } from '../api'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    workOrderStats: { pendingCount: 0, processingCount: 0, completedCount: 0 },
    unpaidBills: 0,
    unpaidAmount: 0,
    activeRisks: 0,
    todayVisitors: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [orderStats, bills, risks, visitors] = await Promise.all([
        getWorkOrderStats(),
        queryBills({ status: 'UNPAID', current: 1, size: 1 }),
        queryContractRisks({ status: 'OPEN', current: 1, size: 1 }),
        queryVisitors({ visitDate: dayjs().format('YYYY-MM-DD'), current: 1, size: 1 })
      ])

      let unpaidAmount = 0
      if (bills && bills.records) {
        for (const b of bills.records) {
          unpaidAmount += Number(b.totalAmount - b.paidAmount)
        }
      }

      setStats({
        workOrderStats: orderStats || { pendingCount: 0, processingCount: 0, completedCount: 0 },
        unpaidBills: bills?.total || 0,
        unpaidAmount: unpaidAmount,
        activeRisks: risks?.total || 0,
        todayVisitors: visitors?.total || 0
      })
    } catch (e) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Spin spinning={loading}>
      <div>
        <div className="page-header">
          <h2 className="page-title">数据概览</h2>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="待处理工单"
                value={stats.workOrderStats.pendingCount}
                prefix={<ToolOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="处理中工单"
                value={stats.workOrderStats.processingCount}
                prefix={<ToolOutlined style={{ color: '#1890ff' }} />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="已完成工单"
                value={stats.workOrderStats.completedCount}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="未缴账单数"
                value={stats.unpaidBills}
                prefix={<FileTextOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="未缴金额(元)"
                value={stats.unpaidAmount.toFixed(2)}
                prefix={<DollarOutlined style={{ color: '#f5222d' }} />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="今日访客预约"
                value={stats.todayVisitors}
                prefix={<TeamOutlined style={{ color: '#722ed1' }} />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
          <Col xs={24}>
            <Card>
              <Statistic
                title="待处理合同风险"
                value={stats.activeRisks}
                prefix={<WarningOutlined style={{ color: '#eb2f96' }} />}
                valueStyle={{ color: '#eb2f96' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  )
}
