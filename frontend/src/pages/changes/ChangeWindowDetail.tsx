import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Descriptions, Tag, Button, Space, Card, List, Timeline, Empty } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { changeApi, ChangeWindow } from '../../api/changes'

const ChangeWindowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [change, setChange] = useState<ChangeWindow | null>(null)

  useEffect(() => {
    if (id) loadDetail(Number(id))
  }, [id])

  const loadDetail = async (changeId: number) => {
    try {
      const res = await changeApi.detail(changeId)
      setChange(res)
    } catch (e) {}
  }

  if (!change) return <div style={{ padding: 24 }}>加载中...</div>

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: 'gold', approved: 'blue', rejected: 'red', in_progress: 'cyan',
      success: 'green', failed: 'red', cancelled: 'default'
    }
    return map[status] || 'default'
  }

  const getPriorityColor = (p: string) => {
    const map: Record<string, string> = { low: 'blue', medium: 'orange', high: 'red', urgent: 'magenta' }
    return map[p] || 'default'
  }

  const logs = change.logs || []

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/changes')}>返回</Button>
          <h2 style={{ margin: 0 }}>{change.code} - {change.title}</h2>
          <Tag color={getPriorityColor(change.priority)}>{change.priority_display}</Tag>
          <Tag color={getStatusColor(change.status)}>{change.status_display}</Tag>
        </Space>
      </div>

      <div className="detail-section">
        <Descriptions title="变更信息" bordered column={2} size="small">
          <Descriptions.Item label="变更编号">{change.code}</Descriptions.Item>
          <Descriptions.Item label="变更标题">{change.title}</Descriptions.Item>
          <Descriptions.Item label="变更类型">{change.change_type_display}</Descriptions.Item>
          <Descriptions.Item label="优先级"><Tag color={getPriorityColor(change.priority)}>{change.priority_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="状态"><Tag color={getStatusColor(change.status)}>{change.status_display}</Tag></Descriptions.Item>
          <Descriptions.Item label="关联服务器">{change.affected_servers_count || 0} 台</Descriptions.Item>
          <Descriptions.Item label="计划开始">{change.planned_start}</Descriptions.Item>
          <Descriptions.Item label="计划结束">{change.planned_end}</Descriptions.Item>
          <Descriptions.Item label="实际开始">{change.actual_start || '-'}</Descriptions.Item>
          <Descriptions.Item label="实际结束">{change.actual_end || '-'}</Descriptions.Item>
          <Descriptions.Item label="申请人">{change.applicant_name}</Descriptions.Item>
          <Descriptions.Item label="申请时间">{change.created_at}</Descriptions.Item>
          <Descriptions.Item label="实施人">{change.implementer_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="审批人">{change.approver_name || '-'}</Descriptions.Item>
          <Descriptions.Item label="变更描述" span={2}>{change.description}</Descriptions.Item>
          <Descriptions.Item label="实施步骤" span={2}>{change.implementation_plan || '-'}</Descriptions.Item>
          <Descriptions.Item label="回滚方案" span={2}>{change.rollback_plan || '-'}</Descriptions.Item>
          <Descriptions.Item label="风险评估" span={2}>{change.risk_assessment || '-'}</Descriptions.Item>
          <Descriptions.Item label="测试结果" span={2}>{change.test_result || '-'}</Descriptions.Item>
        </Descriptions>
      </div>

      <div className="detail-section">
        <div className="detail-section-title">变更日志</div>
        {logs.length > 0 ? (
          <Timeline
            items={logs.map((log: any) => ({
              color: log.is_failure ? 'red' : 'blue',
              children: (
                <Card size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Space>
                      <strong>{log.action}</strong>
                      {log.is_failure && <Tag color="red">失败</Tag>}
                      <span style={{ color: '#999' }}>{log.created_at}</span>
                      <span style={{ color: '#999' }}>操作人: {log.operator_name || '系统'}</span>
                    </Space>
                    {log.old_status && (
                      <div>
                        <Tag>{log.old_status_display}</Tag> → <Tag color="blue">{log.new_status_display}</Tag>
                      </div>
                    )}
                    {log.failure_reason && <div style={{ color: 'red' }}>失败原因: {log.failure_reason}</div>}
                    {log.comment && <div style={{ color: '#555' }}>{log.comment}</div>}
                  </Space>
                </Card>
              ),
            }))}
          />
        ) : <Empty description="暂无变更日志" />}
      </div>
    </div>
  )
}

export default ChangeWindowDetail
