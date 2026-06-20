
import { useEffect, useState } from 'react'
import {
  Card, Table, Tag, Input, Select, Button, Space, Row, Col, Modal, Drawer,
  Typography, DatePicker, Empty, message, Descriptions, Badge, Alert, Tooltip
} from 'antd'
import {
  SearchOutlined, SyncOutlined, ReloadOutlined, DownloadOutlined,
  CloudFilled, EyeOutlined, ExperimentOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { apiRetry } from '../services/http'
import { ApiRetryRecord, ApiRetryStatus, RETRY_STATUS_LABEL } from '../types'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text, Paragraph } = Typography

export default function ApiRetry() {
  const [query, setQuery] = useState<any>({
    pageNumber: 1, pageSize: 20, retryStatus: undefined,
    apiName: '', startDate: undefined, endDate: undefined
  })
  const [data, setData] = useState<any>({ totalCount: 0, items: [] })
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState<ApiRetryRecord[]>([])
  const [detail, setDetail] = useState<ApiRetryRecord | null>(null)
  const [retryingId, setRetryingId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [bodyView, setBodyView] = useState<'request' | 'response' | 'headers'>('request')

  useEffect(() => { load() }, [query])
  useEffect(() => {
    apiRetry.pending().then((r: any) => setPending(r)).catch(() => {})
  }, [query.retryStatus])

  const load = () => {
    setLoading(true)
    const payload = { ...query }
    if (!payload.apiName) delete payload.apiName
    if (payload.startDate) payload.startDate = payload.startDate.toDate()
    if (payload.endDate) payload.endDate = payload.endDate.toDate()
    apiRetry.query(payload).then(setData).finally(() => setLoading(false))
  }

  const statusCount = (s: ApiRetryStatus) =>
    data.items.filter((r: ApiRetryRecord) => r.retryStatus === s).length

  const doRetry = async (r: ApiRetryRecord) => {
    try {
      setRetryingId(r.id)
      await apiRetry.retry(r.id)
      message.success('已发起重试')
      await apiRetry.getById(r.id).then((d: any) => {
        if (detail && detail.id === r.id) setDetail(d)
      })
      load()
    } finally {
      setRetryingId(null)
    }
  }

  const retryAllPending = async () => {
    for (const r of pending) {
      await doRetry(r)
    }
    message.success('所有待重试已处理完成')
  }

  const doExport = async () => {
    try {
      setExporting(true)
      const payload = { ...query }
      if (!payload.apiName) delete payload.apiName
      if (payload.startDate) payload.startDate = payload.startDate.toDate()
      if (payload.endDate) payload.endDate = payload.endDate.toDate()
      const res: any = await apiRetry.export(payload)
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `ApiRetryRecords_${dayjs().format('YYYYMMDD_HHmmss')}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      message.success('导出成功，可交给技术排查')
    } catch (e) {
      message.error('导出失败')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>接口失败记录 · 重试 · 导出</h2>
          <p className="desc" style={{ margin: 0, marginTop: 4 }}>
            所有接口失败自动记录，支持手动/自动重试与CSV导出（给技术排查）
          </p>
        </div>
        <Space>
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={doExport}>导出CSV</Button>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        </Space>
      </div>

      {pending.length > 0 && (
        <Alert
          type="warning" showIcon
          style={{ marginBottom: 16 }}
          message={`当前有 ${pending.length} 条待重试记录，达到重试时间可批量重试。`}
          action={
            <Button size="small" type="primary" onClick={retryAllPending}>
              <ExperimentOutlined /> 批量重试全部
            </Button>
          }
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input allowClear prefix={<SearchOutlined />} placeholder="接口名称"
              value={query.apiName}
              onChange={e => setQuery({ ...query, apiName: e.target.value, pageNumber: 1 })} />
          </Col>
          <Col span={4}>
            <Select style={{ width: '100%' }} allowClear placeholder="重试状态" value={query.retryStatus}
              onChange={v => setQuery({ ...query, retryStatus: v, pageNumber: 1 })}>
              {Object.entries(RETRY_STATUS_LABEL).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v.text}</Option>
              ))}
            </Select>
          </Col>
          <Col span={8}>
            <RangePicker showTime style={{ width: '100%' }}
              value={query.startDate && query.endDate ? [dayjs(query.startDate), dayjs(query.endDate)] : null}
              onChange={(v: any) => setQuery({ ...query, startDate: v?.[0], endDate: v?.[1], pageNumber: 1 })} />
          </Col>
          <Col span={6} style={{ textAlign: 'right' }}>
            <Text type="secondary">共 {data.totalCount} 条</Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        {Object.entries(RETRY_STATUS_LABEL).map(([k, v]) => (
          <Col key={k} span={6}>
            <Badge.Ribbon text={v.text} color={v.color === 'success' ? 'green' : v.color === 'processing' ? 'blue' : v.color === 'warning' ? 'orange' : 'red'}>
              <Card size="small" style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{statusCount(Number(k))}</div>
              </Card>
            </Badge.Ribbon>
          </Col>
        ))}
      </Row>

      <Card bodyStyle={{ padding: 0 }}>
        <Table<ApiRetryRecord>
          size="small" rowKey="id" loading={loading}
          dataSource={data.items as any}
          pagination={{
            current: query.pageNumber, pageSize: query.pageSize, total: data.totalCount,
            showSizeChanger: true, showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => setQuery({ ...query, pageNumber: p, pageSize: ps })
          }}
          columns={[
            { title: '时间', dataIndex: 'createdAt', width: 160, fixed: 'left',
              render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss') },
            { title: '接口名称', dataIndex: 'apiName', width: 200, ellipsis: true },
            { title: '方法', dataIndex: 'httpMethod', width: 80,
              render: (m: string) => <Tag color={m === 'GET' ? 'green' : m === 'POST' ? 'blue' : m === 'DELETE' ? 'red' : 'orange'}>{m}</Tag> },
            { title: 'URL', dataIndex: 'requestUrl', width: 260, ellipsis: true,
              render: (v: string) => <Tooltip title={v}><Text code>{v.length > 50 ? v.slice(0, 50) + '...' : v}</Text></Tooltip> },
            { title: '状态码', dataIndex: 'statusCode', width: 90, align: 'center',
              render: (c: number) => c >= 200 && c < 300 ? <Tag color="green">{c}</Tag> : <Tag color="red">{c}</Tag> },
            { title: '重试状态', dataIndex: 'retryStatus', width: 120,
              render: (s: ApiRetryStatus) => (
                <Tag color={RETRY_STATUS_LABEL[s].color}>{RETRY_STATUS_LABEL[s].text}</Tag>
              ) },
            { title: '进度', dataIndex: 'retryCount', width: 130,
              render: (_: any, r: ApiRetryRecord) => (
                <Text>{r.retryCount} / {r.maxRetryCount}</Text>
              ) },
            { title: '下次重试', dataIndex: 'nextRetryAt', width: 150,
              render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
            { title: '成功时间', dataIndex: 'succeededAt', width: 150,
              render: (v: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-' },
            { title: '错误信息', dataIndex: 'errorMessage', width: 200, ellipsis: true,
              render: (v) => <Text type="danger">{v || '-'}</Text> },
            { title: '操作', width: 160, fixed: 'right',
              render: (_, r) => (
                <Space size={4}>
                  <Button size="small" icon={<EyeOutlined />} onClick={() => setDetail(r)}>详情</Button>
                  {(r.retryStatus === ApiRetryStatus.Failed ||
                    r.retryStatus === ApiRetryStatus.Retrying ||
                    r.retryStatus === ApiRetryStatus.MaxRetriesExceeded) && (
                    <Button size="small" type="primary" icon={<SyncOutlined />}
                      loading={retryingId === r.id}
                      disabled={r.retryStatus === ApiRetryStatus.Success}
                      onClick={() => doRetry(r)}>
                      重试
                    </Button>
                  )}
                </Space>
              ) }
          ]} />
      </Card>

      <Drawer title="接口失败详情（可复制给技术排查）" placement="right" width={800} open={!!detail} onClose={() => setDetail(null)}>
        {detail && (
          <div>
            <Descriptions column={1} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="创建时间">{dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
              <Descriptions.Item label="接口名称">{detail.apiName}</Descriptions.Item>
              <Descriptions.Item label="请求方法">
                <Tag>{detail.httpMethod}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="请求URL">
                <Text code>{detail.requestUrl}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="HTTP状态码">{detail.statusCode}</Descriptions.Item>
              <Descriptions.Item label="重试状态">
                <Tag color={RETRY_STATUS_LABEL[detail.retryStatus].color}>{RETRY_STATUS_LABEL[detail.retryStatus].text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="重试进度">{detail.retryCount} / {detail.maxRetryCount}</Descriptions.Item>
              <Descriptions.Item label="上次重试">
                {detail.lastRetriedAt ? dayjs(detail.lastRetriedAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="下次重试">
                {detail.nextRetryAt ? dayjs(detail.nextRetryAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="成功时间">
                {detail.succeededAt ? dayjs(detail.succeededAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联ID (CorrelationId)">
                {detail.correlationId ? <Text code>{detail.correlationId}</Text> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="错误信息">
                {detail.errorMessage ? <Text type="danger">{detail.errorMessage}</Text> : '-'}
              </Descriptions.Item>
              {detail.stackTrace && (
                <Descriptions.Item label="堆栈">
                  <Paragraph type="danger" style={{ whiteSpace: 'pre-wrap', fontSize: 12, margin: 0 }}>
                    {detail.stackTrace}
                  </Paragraph>
                </Descriptions.Item>
              )}
            </Descriptions>

            <div style={{ marginBottom: 12 }}>
              <Space>
                <Button type={bodyView === 'request' ? 'primary' : 'default'} size="small" onClick={() => setBodyView('request')}>
                  请求体
                </Button>
                <Button type={bodyView === 'response' ? 'primary' : 'default'} size="small" onClick={() => setBodyView('response')}>
                  响应体
                </Button>
                <Button type={bodyView === 'headers' ? 'primary' : 'default'} size="small" onClick={() => setBodyView('headers')}>
                  请求头
                </Button>
                {detail.retryStatus !== ApiRetryStatus.Success && (
                  <Button type="primary" icon={<SyncOutlined />} size="small"
                    loading={retryingId === detail.id} onClick={() => doRetry(detail)}>
                    立即重试
                  </Button>
                )}
                <Button icon={<DownloadOutlined />} size="small" onClick={doExport}>
                  导出全部CSV
                </Button>
              </Space>
            </div>

            <pre style={{
              background: '#001529', color: '#fff', padding: 16, borderRadius: 4,
              maxHeight: 400, overflow: 'auto', fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-all'
            }}>
              {bodyView === 'request' ? (detail.requestBody || '（无）') :
                bodyView === 'response' ? (detail.responseBody || '（无）') :
                  (detail.requestHeaders || '（无）')}
            </pre>
          </div>
        )}
      </Drawer>
    </div>
  )
}
