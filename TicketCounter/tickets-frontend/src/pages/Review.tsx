
import { useEffect, useMemo, useState } from 'react'
import {
  Card, Table, Tag, Input, Select, Button, Space, Modal, Form, Drawer, Progress,
  DatePicker, Row, Col, Empty, Typography, Popconfirm, message, Tabs, Timeline, Divider
} from 'antd'
import { SearchOutlined, AuditOutlined, CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { registrations, sessions, seats } from '../services/http'
import {
  Registration, RegistrationStatus, TicketType, RegistrationSource, RegistrationAudit,
  REG_STATUS_LABEL, TICKET_TYPE_LABEL, Seat, SESSION_STATUS_LABEL, SeatStatus
} from '../types'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text, Paragraph } = Typography

export default function Review() {
  const [query, setQuery] = useState<any>({
    pageNumber: 1, pageSize: 20, status: undefined, sessionId: undefined,
    ticketType: undefined, hasMissingData: undefined, groupNumber: undefined,
    source: undefined, keyword: '', startDate: undefined, endDate: undefined
  })
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>({ totalCount: 0, items: [] })
  const [sessionList, setSessionList] = useState<any[]>([])
  const [seatList, setSeatList] = useState<Seat[]>([])

  const [detail, setDetail] = useState<Registration | null>(null)
  const [audit, setAudit] = useState<RegistrationAudit[]>([])
  const [reviewModal, setReviewModal] = useState<{ open: boolean; data?: Registration }>({ open: false })
  const [reviewForm] = Form.useForm()

  useEffect(() => {
    sessions.getAll().then(setSessionList).catch(() => {})
  }, [])
  useEffect(() => {
    loadData()
  }, [query])
  useEffect(() => {
    if (detail?.sessionId) {
      seats.getBySession(detail.sessionId)
        .then((list: any) => setSeatList(list.filter((s: Seat) => s.status === SeatStatus.Available || s.registrationId === detail.id)))
        .catch(() => {})
    }
  }, [detail])

  const loadData = () => {
    setLoading(true)
    const payload = { ...query }
    if (!payload.keyword) delete payload.keyword
    if (payload.startDate) payload.startDate = payload.startDate.toDate()
    if (payload.endDate) payload.endDate = payload.endDate.toDate()
    registrations.query(payload).then(setData).finally(() => setLoading(false))
  }

  const openReview = (r: Registration, approved: boolean) => {
    reviewForm.resetFields()
    reviewForm.setFieldsValue({
      status: approved ? RegistrationStatus.Approved : RegistrationStatus.Rejected,
      sessionId: r.sessionId,
      ticketType: r.ticketType,
      groupNumber: r.groupNumber
    })
    setReviewModal({ open: true, data: r })
  }

  const submitReview = async () => {
    try {
      const vals = await reviewForm.validateFields()
      if (!reviewModal.data) return
      await registrations.review(reviewModal.data.id, vals)
      message.success('审核完成')
      setReviewModal({ open: false })
      loadData()
      if (detail && detail.id === reviewModal.data.id) {
        registrations.getById(detail.id).then(r => { setDetail(r); loadAudit(detail.id) })
      }
    } catch { }
  }

  const cancelReg = async (r: Registration) => {
    await registrations.cancel(r.id, '运营取消')
    message.success('已取消')
    loadData()
  }

  const openDetail = (r: Registration) => {
    setDetail(r)
    loadAudit(r.id)
  }

  const loadAudit = (id: string) => {
    registrations.audit(id).then(setAudit).catch(() => {})
  }

  const counts = useMemo(() => {
    const s: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    const missing = data.items.filter((r: Registration) => r.hasMissingData).length
    ;(data.items as Registration[]).forEach(r => { s[r.status] = (s[r.status] || 0) + 1 })
    return { s, missing }
  }, [data.items])

  const regCols = [
    { title: '报名号', dataIndex: 'registrationNo', width: 150, fixed: 'left',
      render: (v: string, r: Registration) => (
        <a onClick={() => openDetail(r)} style={{ fontFamily: 'monospace' }}>{v}</a>
      ) },
    { title: '姓名', dataIndex: 'name', width: 90,
      render: (v: string, r: Registration) => <a onClick={() => openDetail(r)}>{v}</a> },
    { title: '手机', dataIndex: 'phone', width: 120 },
    { title: '公司', dataIndex: 'company', ellipsis: true, width: 160 },
    { title: '职位', dataIndex: 'position', ellipsis: true, width: 120 },
    { title: '场次', dataIndex: 'sessionName', width: 160, ellipsis: true,
      render: (v: string, r: Registration) => {
        const s = sessionList.find(x => x.id === r.sessionId)
        return <Space>
          {v || '-'}
          {s?.groupNumber && <Tag color="purple">G{s.groupNumber}</Tag>}
        </Space>
      } },
    { title: '票种', dataIndex: 'ticketType', width: 90,
      render: (t: TicketType) => t !== undefined ? TICKET_TYPE_LABEL[t] : '-' },
    { title: '分组', dataIndex: 'groupNumber', width: 70, render: (v: number) => v || '-' },
    { title: '质量', dataIndex: 'dataQualityScore', width: 110,
      render: (s: number, r: Registration) => (
        <Progress percent={s} size="small"
          status={r.hasMissingData ? 'exception' : s >= 80 ? 'success' : 'normal'} />
      ) },
    { title: '状态', dataIndex: 'status', width: 90,
      render: (s: RegistrationStatus) => (
        <Tag color={(REG_STATUS_LABEL as any)[s].color}>{(REG_STATUS_LABEL as any)[s].text}</Tag>
      ) },
    { title: '来源', dataIndex: 'source', width: 90, render: (v: RegistrationSource) =>
      ['线上', '线下', '邀请', '合作伙伴'][v] },
    { title: '创建', dataIndex: 'createdAt', width: 140, render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    { title: '操作', fixed: 'right', width: 240,
      render: (_: any, r: Registration) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(r)}>详情</Button>
          {(r.status === RegistrationStatus.Pending || r.status === RegistrationStatus.Reviewing) && (
            <>
              <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => openReview(r, true)}>通过</Button>
              <Button size="small" danger icon={<CloseOutlined />} onClick={() => openReview(r, false)}>拒绝</Button>
            </>
          )}
          {r.status !== RegistrationStatus.Cancelled && r.status !== RegistrationStatus.Completed && (
            <Popconfirm title="取消此报名？" onConfirm={() => cancelReg(r)}>
              <Button size="small" type="link" danger>取消</Button>
            </Popconfirm>
          )}
        </Space>
      ) }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>报名审核 · 分组赛程</h2>
        <p className="desc">同屏展示报名列表与审核详情，减少跳转；缺失资料条目高亮并已同步库存占用</p>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={5}>
            <Input placeholder="姓名/手机/公司/报名号" prefix={<SearchOutlined />} allowClear
              value={query.keyword} onChange={e => setQuery({ ...query, keyword: e.target.value, pageNumber: 1 })} />
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="状态" value={query.status}
              onChange={v => setQuery({ ...query, status: v, pageNumber: 1 })}>
              {Object.entries(REG_STATUS_LABEL).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v.text}</Option>
              ))}
            </Select>
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="场次" showSearch value={query.sessionId}
              onChange={v => setQuery({ ...query, sessionId: v, pageNumber: 1 })}>
              {sessionList.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
            </Select>
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="票种" value={query.ticketType}
              onChange={v => setQuery({ ...query, ticketType: v, pageNumber: 1 })}>
              {Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => <Option key={k} value={Number(k)}>{v}</Option>)}
            </Select>
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="资料完整度" value={query.hasMissingData}
              onChange={v => setQuery({ ...query, hasMissingData: v, pageNumber: 1 })}>
              <Option value={true}>有缺失</Option>
              <Option value={false}>完整</Option>
            </Select>
          </Col>
          <Col span={3}>
            <Select style={{ width: '100%' }} allowClear placeholder="分组" value={query.groupNumber}
              onChange={v => setQuery({ ...query, groupNumber: v, pageNumber: 1 })}>
              {Array.from({ length: 10 }).map((_, i) => <Option key={i + 1} value={i + 1}>第{i + 1}组</Option>)}
            </Select>
          </Col>
          <Col span={4}>
            <RangePicker showTime style={{ width: '100%' }}
              value={query.startDate && query.endDate ? [dayjs(query.startDate), dayjs(query.endDate)] : null}
              onChange={(v: any) => setQuery({ ...query, startDate: v?.[0], endDate: v?.[1], pageNumber: 1 })} />
          </Col>
        </Row>
      </Card>

      <Row gutter={12} style={{ marginBottom: 12 }}>
        {Object.entries(REG_STATUS_LABEL).map(([k, v]) => (
          <Col key={k} span={3}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 6, textAlign: 'center' }}>
              <Tag color={v.color} style={{ margin: 0 }}>{v.text}</Tag>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{counts.s[Number(k)] || 0}</div>
            </div>
          </Col>
        ))}
        <Col span={3}>
          <div style={{ background: '#fffbe6', padding: 12, borderRadius: 6, textAlign: 'center', border: '1px solid #ffe58f' }}>
            <Tag color="warning" style={{ margin: 0 }}>资料缺失</Tag>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4, color: '#faad14' }}>{counts.missing}</div>
          </div>
        </Col>
        <Col span={3}>
          <div style={{ background: '#fff', padding: 12, borderRadius: 6, textAlign: 'center' }}>
            <Tag color="blue" style={{ margin: 0 }}>本页总数</Tag>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 4 }}>{data.items.length}/{data.totalCount}</div>
          </div>
        </Col>
      </Row>

      <div className="two-col">
        <Card title={<span><AuditOutlined /> 报名列表</span>} bodyStyle={{ padding: 0 }}>
          <Table<Registration>
            size="small" rowKey="id" loading={loading} scroll={{ x: 1400 }}
            dataSource={data.items as any}
            columns={regCols}
            rowClassName={(r) => (r as Registration).hasMissingData ? 'row-warning' : ''}
            pagination={{
              current: query.pageNumber, pageSize: query.pageSize, total: data.totalCount, showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => setQuery({ ...query, pageNumber: p, pageSize: ps })
            }} />
          <style>{`.row-warning { background: #fffbe6 !important; }`}</style>
        </Card>

        <Card title={<span><EyeOutlined /> 详情 / 审核操作</span>} bodyStyle={{ padding: detail ? 0 : 24 }}>
          {!detail ? (
            <Empty description="点击左侧任意报名查看详情" style={{ padding: 40 }} />
          ) : (
            <Tabs defaultActiveKey="info" size="small" items={[
              {
                key: 'info', label: '资料详情',
                children: (
                  <div style={{ padding: 16 }}>
                    <Space style={{ marginBottom: 12 }}>
                      <Tag color={(REG_STATUS_LABEL as any)[detail.status].color} style={{ fontSize: 14, padding: '2px 10px' }}>
                        {(REG_STATUS_LABEL as any)[detail.status].text}
                      </Tag>
                      {detail.hasMissingData && <Tag color="warning">资料缺失：{detail.missingFields}</Tag>}
                      <Tag>数据质量 {detail.dataQualityScore}分</Tag>
                    </Space>
                    <Row gutter={[16, 8]}>
                      {[
                        ['报名号', detail.registrationNo],
                        ['姓名', detail.name],
                        ['手机', detail.phone],
                        ['邮箱', detail.email],
                        ['公司', detail.company],
                        ['职位', detail.position],
                        ['身份证', detail.idCard],
                        ['微信', detail.wechat],
                        ['行业', detail.industry],
                        ['城市', detail.city],
                        ['场次', detail.sessionName],
                        ['分组', detail.groupNumber ? `第${detail.groupNumber}组` : '-'],
                        ['票种', detail.ticketType !== undefined ? TICKET_TYPE_LABEL[detail.ticketType] : '-'],
                        ['来源', ['线上', '线下', '邀请', '合作伙伴'][detail.source]],
                        ['创建', dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')],
                        ['审核人', detail.reviewer || '-'],
                        ['审核时间', detail.reviewedAt ? dayjs(detail.reviewedAt).format('YYYY-MM-DD HH:mm') : '-']
                      ].map(([k, v]) => (
                        <Col span={12} key={k}>
                          <div style={{ fontSize: 12, color: '#999' }}>{k}</div>
                          <div style={{ padding: '2px 0 8px', borderBottom: '1px solid #f0f0f0', minHeight: 28 }}>
                            {v || <Text type="secondary" style={{ color: '#faad14' }}>（未填写）</Text>}
                          </div>
                        </Col>
                      ))}
                    </Row>
                    {detail.remark && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#999' }}>备注</div>
                        <div style={{ padding: 8, background: '#fafafa', borderRadius: 4 }}>{detail.remark}</div>
                      </div>
                    )}
                    {detail.reviewComment && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ fontSize: 12, color: '#999' }}>审核意见</div>
                        <div style={{ padding: 8, background: '#e6f4ff', borderRadius: 4 }}>{detail.reviewComment}</div>
                      </div>
                    )}
                    <Divider style={{ margin: '16px 0' }} />
                    <Space wrap>
                      {(detail.status === RegistrationStatus.Pending || detail.status === RegistrationStatus.Reviewing) && (
                        <>
                          <Button type="primary" onClick={() => openReview(detail, true)}>审核通过</Button>
                          <Button danger onClick={() => openReview(detail, false)}>审核拒绝</Button>
                        </>
                      )}
                      <Button onClick={() => {
                        registrations.getById(detail.id).then(r => { setDetail(r); loadAudit(detail.id); message.info('已刷新') })
                      }}>刷新</Button>
                    </Space>
                  </div>
                )
              },
              {
                key: 'seat', label: '场次/座位分配',
                children: (
                  <div style={{ padding: 16 }}>
                    <div style={{ marginBottom: 12 }}>
                      <Text type="secondary">当前场次：</Text>
                      <Text strong>{detail.sessionName || '未分配'}</Text>
                      　<Text type="secondary">票种：</Text>
                      <Text strong>{detail.ticketType !== undefined ? TICKET_TYPE_LABEL[detail.ticketType] : '未选'}</Text>
                    </div>
                    {seatList.length === 0 ? (
                      <Empty description="无可用座位，请先在场次中创建" />
                    ) : (
                      <div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {seatList.map(s => (
                            <div key={s.id} style={{
                              width: 42, height: 42, border: '1px solid #ddd', borderRadius: 4,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11,
                              background: s.status === SeatStatus.Available ? '#f6ffed' :
                                s.registrationId === detail.id ? '#e6f4ff' : '#fafafa',
                              cursor: s.status === SeatStatus.Available ? 'pointer' : 'default',
                              borderColor: s.registrationId === detail.id ? '#1677ff' : '#d9d9d9'
                            }} title={`${s.seatCode} - ${s.status === 0 ? '可用' : '已分配给:' + s.registrationName}`}>
                              {s.number || s.seatCode}
                            </div>
                          ))}
                        </div>
                        <Paragraph type="secondary" style={{ marginTop: 12 }}>
                          分配座位请使用"审核通过"按钮并选择座位。
                        </Paragraph>
                      </div>
                    )}
                  </div>
                )
              },
              {
                key: 'audit', label: '操作留痕',
                children: (
                  <div style={{ padding: 16 }}>
                    {audit.length === 0 ? <Empty description="暂无留痕" /> : (
                      <Timeline
                        items={audit.map(a => ({
                          color: a.toStatus === RegistrationStatus.Approved ? 'green' :
                            a.toStatus === RegistrationStatus.Rejected || a.toStatus === RegistrationStatus.Cancelled ? 'red' : 'blue',
                          children: (
                            <div>
                              <div style={{ fontWeight: 600 }}>
                                {(REG_STATUS_LABEL as any)[a.toStatus].text}
                                <span style={{ color: '#999', fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                                  {a.operator} · {dayjs(a.operatedAt).format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                              </div>
                              {a.comment && <div style={{ color: '#666', marginTop: 4 }}>{a.comment}</div>}
                              <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                                状态变更：{(REG_STATUS_LABEL as any)[a.fromStatus].text} → {(REG_STATUS_LABEL as any)[a.toStatus].text}
                              </div>
                            </div>
                          )
                        }))}
                      />
                    )}
                  </div>
                )
              }
            ]} />
          )}
        </Card>
      </div>

      <Modal
        title={reviewModal.data ? `审核：${reviewModal.data.name} - ${reviewModal.data.registrationNo}` : ''}
        open={reviewModal.open}
        onOk={submitReview} onCancel={() => setReviewModal({ open: false })}
        okText="确认" width={640}
      >
        <Form form={reviewForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="审核结果" name="status" rules={[{ required: true }]}>
                <Select>
                  <Option value={RegistrationStatus.Approved}>通过</Option>
                  <Option value={RegistrationStatus.Rejected}>拒绝</Option>
                  <Option value={RegistrationStatus.Reviewing}>标记审核中</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="分配场次" name="sessionId">
                <Select showSearch optionFilterProp="children">
                  {sessionList.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="分配票种" name="ticketType">
                <Select>
                  {Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => <Option key={k} value={Number(k)}>{v}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="分组赛程" name="groupNumber">
                <Select allowClear>
                  {Array.from({ length: 10 }).map((_, i) => <Option key={i + 1} value={i + 1}>第{i + 1}组</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="分配座位" name="seatId">
                <Select allowClear showSearch optionFilterProp="children"
                  disabled={!reviewForm.getFieldValue('sessionId')}
                  placeholder="选择分配场次后可选">
                  {seatList.filter(s => s.status === SeatStatus.Available || s.registrationId === reviewModal.data?.id)
                    .map(s => (
                      <Option key={s.id} value={s.id}>{s.seatCode} ({s.area || '-'}/{s.row || '-'}{s.number || ''} - {TICKET_TYPE_LABEL[s.ticketType]})</Option>
                    ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="审核意见" name="comment">
            <Input.TextArea rows={3} placeholder="请输入审核意见（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
