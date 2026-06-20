
import { useEffect, useState } from 'react'
import { Card, Select, Table, Tag, Progress, Button, Space, Row, Col, Statistic, Alert } from 'antd'
import { ReloadOutlined, ExclamationCircleFilled } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { dashboard, ticketStock, sessions } from '../services/http'
import { InventoryOccupancy, Session, TICKET_TYPE_LABEL, TicketType } from '../types'

const { Option } = Select

export default function Inventory() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined)
  const [sessionList, setSessionList] = useState<Session[]>([])
  const [data, setData] = useState<InventoryOccupancy[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    sessions.getAll().then(setSessionList).catch(() => {})
  }, [])
  useEffect(() => { load() }, [sessionId])

  const load = () => {
    setLoading(true)
    dashboard.inventory(sessionId)
      .then((r: any) => setData(r))
      .finally(() => setLoading(false))
  }

  const totals = data.reduce((acc, i) => {
    acc.total += i.totalCapacity
    acc.approved += i.approvedOccupancy
    acc.pending += i.pendingReviewOccupancy
    acc.missing += i.missingDataOccupancy
    acc.reserved += i.reservedOccupancy
    return acc
  }, { total: 0, approved: 0, pending: 0, missing: 0, reserved: 0 })
  const occupied = totals.approved + totals.pending + totals.missing + totals.reserved
  const available = totals.total - occupied
  const rate = totals.total > 0 ? Math.round(occupied / totals.total * 100) : 0

  const pieOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['45%', '70%'], center: ['50%', '45%'],
      avoidLabelOverlap: false, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: totals.approved, name: '已通过', itemStyle: { color: '#52c41a' } },
        { value: totals.pending, name: '审核中', itemStyle: { color: '#1677ff' } },
        { value: totals.missing, name: '缺失资料', itemStyle: { color: '#faad14' } },
        { value: totals.reserved, name: '预留', itemStyle: { color: '#722ed1' } },
        { value: available, name: '可用', itemStyle: { color: '#d9d9d9' } }
      ]
    }]
  }

  const stackedBarOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['已通过', '审核中', '缺失资料', '预留', '可用'] },
    grid: { left: 40, right: 20, top: 40, bottom: 80 },
    xAxis: {
      type: 'category',
      data: data.map(i => `${i.sessionName}\n${TICKET_TYPE_LABEL[i.ticketType]}`),
      axisLabel: { interval: 0, rotate: 30 }
    },
    yAxis: { type: 'value' },
    series: [
      { name: '已通过', type: 'bar', stack: 't', data: data.map(i => i.approvedOccupancy), itemStyle: { color: '#52c41a' } },
      { name: '审核中', type: 'bar', stack: 't', data: data.map(i => i.pendingReviewOccupancy), itemStyle: { color: '#1677ff' } },
      { name: '缺失资料', type: 'bar', stack: 't', data: data.map(i => i.missingDataOccupancy), itemStyle: { color: '#faad14' } },
      { name: '预留', type: 'bar', stack: 't', data: data.map(i => i.reservedOccupancy), itemStyle: { color: '#722ed1' } },
      { name: '可用', type: 'bar', stack: 't', data: data.map(i => i.availableCount), itemStyle: { color: '#d9d9d9' } }
    ]
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>票种库存统计</h2>
          <p className="desc" style={{ margin: 0, marginTop: 4 }}>
            库存占用包含审核中与资料缺失占用，确保口头确认信息也体现在占用统计中
          </p>
        </div>
        <Space>
          <Select style={{ width: 260 }} allowClear placeholder="全部场次" showSearch
            value={sessionId} onChange={v => setSessionId(v)}>
            {sessionList.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
          </Select>
          <Button icon={<ReloadOutlined />} onClick={() => {
            ticketStock.refresh(sessionId).then(() => { load() })
          }}>重新计算占用</Button>
        </Space>
      </div>

      {totals.missing > 0 && (
        <Alert
          type="warning" showIcon
          icon={<ExclamationCircleFilled />}
          style={{ marginBottom: 16 }}
          message={`有 ${totals.missing} 个座位因"资料缺失"被占用，请跟进"资料缺失待办"补齐资料后释放或确认通过。`}
        />
      )}

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={4}><Card bordered={false} style={{ background: '#fff' }}>
          <Statistic title="总座位数" value={totals.total} valueStyle={{ color: '#1677ff' }} />
        </Card></Col>
        <Col span={4}><Card bordered={false}><Statistic title="已通过占用" value={totals.approved} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card bordered={false}><Statistic title="审核中占用" value={totals.pending} valueStyle={{ color: '#1677ff' }} /></Card></Col>
        <Col span={4}><Card bordered={false}><Statistic title="资料缺失占用" value={totals.missing} valueStyle={{ color: '#faad14' }} /></Card></Col>
        <Col span={4}><Card bordered={false}><Statistic title="预留占用" value={totals.reserved} valueStyle={{ color: '#722ed1' }} /></Card></Col>
        <Col span={4}><Card bordered={false}>
          <Statistic title="可用座位" value={available} valueStyle={{ color: '#8c8c8c' }} suffix={`/ ${rate}%`} />
        </Card></Col>
      </Row>

      <Row gutter={16}>
        <Col xs={24} lg={10}>
          <Card title="整体占用构成" loading={loading} style={{ marginBottom: 16 }}>
            {totals.total === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>暂无数据</div> :
              <ReactECharts option={pieOption} style={{ height: 360 }} />}
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title="场次×票种 占用堆叠" loading={loading} style={{ marginBottom: 16 }}>
            {data.length === 0 ? <div style={{ padding: 40, textAlign: 'center', color: '#999' }}>暂无数据</div> :
              <ReactECharts option={stackedBarOption} style={{ height: 360 }} />}
          </Card>
        </Col>
      </Row>

      <Card title="明细数据" loading={loading} bodyStyle={{ padding: 0 }}>
        <Table<InventoryOccupancy>
          size="small" rowKey={(r) => `${r.sessionId}-${r.ticketType}`} dataSource={data} pagination={false}
          expandable={{
            expandedRowRender: (record) => (
              <div style={{ paddingLeft: 24 }}>
                <p style={{ margin: 0 }}>
                  每一类占座已在库存中扣减，审核通过 / 补齐资料 / 拒绝 会同步刷新占用统计。
                </p>
              </div>
            )
          }}
          columns={[
            { title: '场次', dataIndex: 'sessionName', width: 220, fixed: 'left' },
            { title: '票种', dataIndex: 'ticketType', width: 110,
              render: (t: TicketType) => <Tag color="geekblue">{TICKET_TYPE_LABEL[t]}</Tag> },
            { title: '总容量', dataIndex: 'totalCapacity', width: 90, align: 'right' },
            { title: '已通过', dataIndex: 'approvedOccupancy', width: 90, align: 'right',
              render: (v: number) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
            { title: '审核中', dataIndex: 'pendingReviewOccupancy', width: 90, align: 'right',
              render: (v: number) => v > 0 ? <span style={{ color: '#1677ff' }}>{v}</span> : v },
            { title: '资料缺失', dataIndex: 'missingDataOccupancy', width: 100, align: 'right',
              render: (v: number) => v > 0 ? <Tag color="warning">{v}</Tag> : v },
            { title: '预留', dataIndex: 'reservedOccupancy', width: 80, align: 'right',
              render: (v: number) => v > 0 ? <span style={{ color: '#722ed1' }}>{v}</span> : v },
            { title: '已占合计', dataIndex: 'occupiedTotal', width: 100, align: 'right', bold: true },
            { title: '可用', dataIndex: 'availableCount', width: 90, align: 'right',
              render: (v: number) => <span style={{ fontWeight: 600, color: v === 0 ? '#ff4d4f' : '#52c41a' }}>{v}</span> },
            { title: '占用率', dataIndex: 'occupancyRate', width: 150,
              render: (r: number, rec: InventoryOccupancy) => (
                <Progress percent={rec.occupancyRate} size="small"
                  status={rec.occupancyRate >= 95 ? 'exception' : rec.occupancyRate >= 80 ? 'active' : 'normal'} />
              ) },
            { title: '更新时间', dataIndex: 'updatedAt', width: 160,
              render: (v: string) => new Date(v).toLocaleString() }
          ]} />
      </Card>
    </div>
  )
}
