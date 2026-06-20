
import { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Input, Select, Button, Space, Row, Col, Drawer, Descriptions,
  Typography, DatePicker, Empty, Divider
} from 'antd'
import { SearchOutlined, EyeOutlined, SyncOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { logs } from '../services/http'
import { OperationLog, AuditAction } from '../types'

const { RangePicker } = DatePicker
const { Option } = Select
const { Text, Paragraph } = Typography

const ACTION_NAME: Record<AuditAction, string> = {
  [AuditAction.Create]: '创建',
  [AuditAction.Update]: '更新',
  [AuditAction.Delete]: '删除',
  [AuditAction.Approve]: '通过',
  [AuditAction.Reject]: '拒绝',
  [AuditAction.Cancel]: '取消',
  [AuditAction.Export]: '导出',
  [AuditAction.Retry]: '重试',
  [AuditAction.Login]: '登录'
}

const ACTION_COLOR: Record<AuditAction, string> = {
  [AuditAction.Create]: 'green',
  [AuditAction.Update]: 'blue',
  [AuditAction.Delete]: 'red',
  [AuditAction.Approve]: 'cyan',
  [AuditAction.Reject]: 'magenta',
  [AuditAction.Cancel]: 'orange',
  [AuditAction.Export]: 'purple',
  [AuditAction.Retry]: 'gold',
  [AuditAction.Login]: 'geekblue'
}

export default function Logs() {
  const [query, setQuery] = useState<any>({
    pageNumber: 1, pageSize: 50, action: undefined, entityType: undefined,
    entityId: undefined, operator: undefined, isSuccess: undefined,
    startDate: undefined, endDate: undefined
  })
  const [data, setData] = useState<any>({ totalCount: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<OperationLog | null>(null)
  const [changedView, setChangedView] = useState<'fields' | 'original' | 'new'>('fields')

  const entityTypeOptions = ['Session', 'Seat', 'TicketStock', 'Registration', 'TodoItem', 'ApiRetryRecord']

  useEffect(() => { load() }, [query])

  const load = () => {
    setLoading(true)
    const payload = { ...query }
    if (payload.startDate) payload.startDate = payload.startDate.toDate()
    if (payload.endDate) payload.endDate = payload.endDate.toDate()
    logs.query(payload).then(setData).finally(() => setLoading(false))
  }

  const formatJSON = (v?: string) => {
    if (!v) return '-'
    try {
      const obj = JSON.parse(v)
      return JSON.stringify(obj, null, 2)
    } catch {
      return v
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>操作留痕日志</h2>
        <p className="desc">所有管理端关键操作完整留痕，可按实体、操作人、时间、结果等条件查询</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={4}>
            <Input allowClear prefix={<SearchOutlined />} placeholder="操作人"
              value={query.operator} onChange={e => setQuery({ ...query, operator: e.target.value || undefined, pageNumber: 1 })} />
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="操作类型" value={query.action}
              onChange={v => setQuery({ ...query, action: v, pageNumber: 1 })}>
              {Object.entries(ACTION_NAME).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="实体类型" value={query.entityType}
              onChange={v => setQuery({ ...query, entityType: v, pageNumber: 1 })}>
              {entityTypeOptions.map(t => <Option key={t} value={t}>{t}</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <Input allowClear placeholder="实体ID"
              value={query.entityId} onChange={e => setQuery({ ...query, entityId: e.target.value || undefined, pageNumber: 1 })} />
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="执行结果" value={query.isSuccess}
              onChange={v => setQuery({ ...query, isSuccess: v, pageNumber: 1 })}>
              <Option value={true}>成功</Option>
              <Option value={false}>失败</Option>
            </Select>
          </Col>
          <Col span={5}>
            <RangePicker showTime style={{ width: '100%' }}
              value={query.startDate && query.endDate ? [dayjs(query.startDate), dayjs(query.endDate)] : null}
              onChange={(v: any) => setQuery({ ...query, startDate: v?.[0], endDate: v?.[1], pageNumber: 1 })} />
          </Col>
          <Col span={2}>
            <Space>
              <Button icon={<SyncOutlined />} onClick={load}>刷新</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<OperationLog>
          size="small" rowKey="id" loading={loading}
          dataSource={data.items as any}
          pagination={{
            current: query.pageNumber, pageSize: query.pageSize, total: data.totalCount,
            showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => setQuery({ ...query, pageNumber: p, pageSize: ps })
          }}
          columns={[
            { title: '时间', dataIndex: 'operatedAt', width: 160, fixed: 'left',
              render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
            { title: '操作', dataIndex: 'action', width: 90,
              render: (a: AuditAction) => (
                <Tag color={ACTION_COLOR[a]}>{ACTION_NAME[a] || a}</Tag>
              ) },
            { title: '实体类型', dataIndex: 'entityType', width: 120 },
            { title: '实体名称', dataIndex: 'entityName', ellipsis: true, width: 200,
              render: (v) => v || '-' },
            { title: '实体ID', dataIndex: 'entityId', width: 180, ellipsis: true, render: (v) => v || '-' },
            { title: '操作人', dataIndex: 'operator', width: 110 },
            { title: '角色', dataIndex: 'operatorRole', width: 90, render: (v) => v || '-' },
            { title: '变更字段', dataIndex: 'changedFields', ellipsis: true, width: 180, render: (v) => v || '-' },
            { title: 'IP', dataIndex: 'ipAddress', width: 120, render: (v) => v || '-' },
            { title: '结果', dataIndex: 'isSuccess', width: 80, align: 'center',
              render: (s: boolean) => s ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag> },
            { title: '操作', width: 90, fixed: 'right',
              render: (_, r) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
              ) }
          ]} />
      </Card>

      <Drawer title="日志详情" placement="right" width={720} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="时间">{dayjs(detail.operatedAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="操作">
                <Tag color={ACTION_COLOR[detail.action]}>{ACTION_NAME[detail.action]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="实体类型">{detail.entityType}</Descriptions.Item>
              <Descriptions.Item label="实体ID">{detail.entityId || '-'}</Descriptions.Item>
              <Descriptions.Item label="实体名称">{detail.entityName || '-'}</Descriptions.Item>
              <Descriptions.Item label="操作人">{detail.operator} {detail.operatorRole ? `(${detail.operatorRole})` : ''}</Descriptions.Item>
              <Descriptions.Item label="IP地址">{detail.ipAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="UserAgent">{detail.userAgent || '-'}</Descriptions.Item>
              <Descriptions.Item label="执行结果">
                {detail.isSuccess ? <Tag color="green">成功</Tag> : <Tag color="red">失败</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="变更字段">{detail.changedFields || '-'}</Descriptions.Item>
              {detail.errorMessage && (
                <Descriptions.Item label="错误信息">
                  <Text type="danger">{detail.errorMessage}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left">变更详情</Divider>
            <Space style={{ marginBottom: 12 }}>
              <Button type={changedView === 'fields' ? 'primary' : 'default'} size="small" onClick={() => setChangedView('fields')}>
                变更字段
              </Button>
              <Button type={changedView === 'original' ? 'primary' : 'default'} size="small" onClick={() => setChangedView('original')}>
                变更前 (Original)
              </Button>
              <Button type={changedView === 'new' ? 'primary' : 'default'} size="small" onClick={() => setChangedView('new')}>
                变更后 (New)
              </Button>
            </Space>

            <pre style={{
              background: '#f5f5f5', padding: 12, borderRadius: 4,
              maxHeight: 400, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {changedView === 'fields' ? (detail.changedFields || '（无字段级变更信息）') :
                changedView === 'original' ? formatJSON(detail.originalValues) : formatJSON(detail.newValues)}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}
