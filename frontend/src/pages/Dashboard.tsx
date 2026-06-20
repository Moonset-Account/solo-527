import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Table, Tag, Progress } from 'antd'
import { AlertOutlined, DatabaseOutlined, FileSearchOutlined, ScheduleOutlined, WarningFilled } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { alertApi, Alert } from '../api/alerts'
import { assetApi } from '../api/assets'
import { inspectionApi, InspectionTask } from '../api/inspections'
import { changeApi } from '../api/changes'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    pendingAlerts: 0,
    criticalAlerts: 0,
    totalServers: 0,
    warningServers: 0,
    todayInspections: 0,
    pendingChanges: 0,
  })
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([])
  const [recentTasks, setRecentTasks] = useState<InspectionTask[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [alertsRes, assetsRes, tasksRes, changesRes] = await Promise.all([
        alertApi.list({ page_size: 5, ordering: '-occurred_at' }),
        assetApi.list({ page_size: 1 }),
        inspectionApi.taskList({ page_size: 5, ordering: '-created_at' }),
        changeApi.list({ page_size: 1, status: 'pending' }),
      ])
      const pendingCountRes = await alertApi.list({ status: 'pending', page_size: 1 })
      const criticalCountRes = await alertApi.list({ level: 'critical', page_size: 1 })
      const warningServersRes = await assetApi.list({ status: 'warning', page_size: 1 })

      setStats({
        pendingAlerts: pendingCountRes.count,
        criticalAlerts: criticalCountRes.count,
        totalServers: assetsRes.count,
        warningServers: warningServersRes.count,
        todayInspections: tasksRes.count,
        pendingChanges: changesRes.count,
      })
      setRecentAlerts(alertsRes.results)
      setRecentTasks(tasksRes.results)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level: string) => {
    const map: Record<string, string> = {
      info: 'blue',
      warning: 'orange',
      critical: 'red',
      emergency: 'magenta',
    }
    return map[level] || 'default'
  }

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold',
      acknowledged: 'blue',
      processing: 'cyan',
      closed: 'green',
    }
    return map[status] || 'default'
  }

  const alertColumns = [
    { title: '告警编号', dataIndex: 'code', width: 140 },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: '级别', dataIndex: 'level', width: 80, render: (v: string, r: Alert) => <Tag color={getLevelColor(v)}>{r.level_display}</Tag> },
    { title: '状态', dataIndex: 'status', width: 80, render: (v: string, r: Alert) => <Tag color={getStatusColor(v)}>{r.status_display}</Tag> },
    { title: '服务器', dataIndex: 'server_ip', width: 120 },
    { title: '发生时间', dataIndex: 'occurred_at', width: 160 },
  ]

  const taskColumns = [
    { title: '任务编号', dataIndex: 'code', width: 140 },
    { title: '名称', dataIndex: 'name', ellipsis: true },
    { title: '模板', dataIndex: 'template_name', width: 140 },
    {
      title: '结果',
      width: 200,
      render: (_: any, r: InspectionTask) => (
        <span>
          <Tag color="green">正常{r.success_count}</Tag>
          {r.warning_count > 0 && <Tag color="orange">告警{r.warning_count}</Tag>}
          {r.critical_count > 0 && <Tag color="red">严重{r.critical_count}</Tag>}
          {r.failed_count > 0 && <Tag color="magenta">失败{r.failed_count}</Tag>}
        </span>
      ),
    },
    { title: '状态', dataIndex: 'status_display', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 160 },
  ]

  const serverHealthPercent = stats.totalServers > 0
    ? Math.round(((stats.totalServers - stats.warningServers) / stats.totalServers) * 100)
    : 0

  return (
    <div className="page-container">
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/alerts?status=pending')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-card-title">待处理告警</div>
                <div className="stat-card-value" style={{ color: '#fa8c16' }}>{stats.pendingAlerts}</div>
              </div>
              <AlertOutlined className="stat-card-icon" style={{ color: '#fa8c16' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/alerts?level=critical')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-card-title">严重告警</div>
                <div className="stat-card-value" style={{ color: '#ff4d4f' }}>{stats.criticalAlerts}</div>
              </div>
              <WarningFilled className="stat-card-icon" style={{ color: '#ff4d4f' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/assets')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-card-title">服务器总数</div>
                <div className="stat-card-value">{stats.totalServers}</div>
                <Progress percent={serverHealthPercent} size="small" showInfo={false} />
              </div>
              <DatabaseOutlined className="stat-card-icon" style={{ color: '#1677ff' }} />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="stat-card" onClick={() => navigate('/inspections/tasks')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="stat-card-title">巡检任务</div>
                <div className="stat-card-value" style={{ color: '#52c41a' }}>{stats.todayInspections}</div>
              </div>
              <FileSearchOutlined className="stat-card-icon" style={{ color: '#52c41a' }} />
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={14}>
          <Card title="最近告警" extra={<a onClick={() => navigate('/alerts')}>查看全部</a>}>
            <Table
              loading={loading}
              columns={alertColumns}
              dataSource={recentAlerts}
              rowKey="id"
              pagination={false}
              size="small"
              onRow={(r) => ({ onClick: () => navigate(`/alerts/${r.id}`), style: { cursor: 'pointer' } })}
            />
          </Card>
        </Col>
        <Col span={10}>
          <Card title="最近巡检任务" extra={<a onClick={() => navigate('/inspections/tasks')}>查看全部</a>}>
            <Table
              loading={loading}
              columns={taskColumns}
              dataSource={recentTasks}
              rowKey="id"
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
