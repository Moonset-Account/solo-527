import { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Spin } from 'antd'
import {
  FileTextOutlined,
  ThunderboltOutlined,
  MailOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { statsApi } from '@/api'

const Dashboard = () => {
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<any>({})

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await statsApi.getOverview()
      setOverview(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div>
      <div className="page-header">
        <div className="page-title">首页概览</div>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Card>
              <Statistic
                title="模板总数"
                value={overview.totalTasks || 0}
                prefix={<FileTextOutlined style={{ color: '#1677ff' }} />}
                valueStyle={{ color: '#1677ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="批处理任务"
                value={overview.totalRecords || 0}
                prefix={<ThunderboltOutlined style={{ color: '#52c41a' }} />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="生成邮件数"
                value={overview.totalRisks || 0}
                prefix={<MailOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="风险样本"
                value={overview.totalCalls || 0}
                prefix={<WarningOutlined style={{ color: '#ff4d4f' }} />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card title="快速入口">
              <div style={{ display: 'flex', gap: 16 }}>
                <Card type="inner" title="新建模板" style={{ flex: 1, cursor: 'pointer' }}>
                  快速创建新的邮件模板，支持版本管理
                </Card>
                <Card type="inner" title="发起批处理" style={{ flex: 1, cursor: 'pointer' }}>
                  配置批量生成任务，一键执行
                </Card>
                <Card type="inner" title="风险复核" style={{ flex: 1, cursor: 'pointer' }}>
                  人工复核风险样本，保障合规
                </Card>
                <Card type="inner" title="数据导出" style={{ flex: 1, cursor: 'pointer' }}>
                  导出明细报表，支持多维度筛选
                </Card>
              </div>
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  )
}

export default Dashboard
