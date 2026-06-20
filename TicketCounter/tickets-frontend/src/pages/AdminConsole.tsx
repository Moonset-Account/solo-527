
import { useEffect, useMemo, useState } from 'react'
import {
  Card, List, Tag, Button, Modal, Form, Input, InputNumber, Select, DatePicker,
  Space, Table, Tooltip, Popconfirm, message, Tabs, Typography, Badge, Empty, Drawer,
  Row, Col, Divider
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, EditOutlined, SettingOutlined,
  ReloadOutlined, TeamOutlined, CloudDownloadOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { sessions, seats, ticketStock } from '../services/http'
import {
  Session, Seat, TicketStock, SeatStatus, TicketType, SessionStatus,
  SEAT_STATUS_LABEL, SESSION_STATUS_LABEL, TICKET_TYPE_LABEL
} from '../types'

const { RangePicker } = DatePicker
const { Option } = Select
const { Title, Text, Paragraph } = Typography

const SEAT_STATUS_BG: Record<SeatStatus, string> = {
  [SeatStatus.Available]: '#52c41a',
  [SeatStatus.Reserved]: '#faad14',
  [SeatStatus.Sold]: '#ff4d4f',
  [SeatStatus.Locked]: '#1677ff',
  [SeatStatus.Maintenance]: '#bfbfbf'
}

export default function AdminConsole() {
  const [sessionList, setSessionList] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [seatList, setSeatList] = useState<Seat[]>([])
  const [stockList, setStockList] = useState<TicketStock[]>([])
  const [loading, setLoading] = useState(false)

  const [sessionModal, setSessionModal] = useState<{ open: boolean; data?: Session }>({ open: false })
  const [seatModal, setSeatModal] = useState<{ open: boolean; data?: Seat }>({ open: false })
  const [batchSeatModal, setBatchSeatModal] = useState(false)
  const [stockModal, setStockModal] = useState<{ open: boolean; data?: TicketStock }>({ open: false })
  const [seatDetail, setSeatDetail] = useState<Seat | null>(null)
  const [sessionForm] = Form.useForm()
  const [seatForm] = Form.useForm()
  const [batchSeatForm] = Form.useForm()
  const [stockForm] = Form.useForm()

  useEffect(() => { loadSessions() }, [])
  useEffect(() => {
    if (activeSessionId) {
      loadSessionDetails(activeSessionId)
    }
  }, [activeSessionId])

  const loadSessions = () => {
    sessions.getAll().then((data: any) => {
      setSessionList(data)
      if (data.length > 0 && !activeSessionId) setActiveSessionId(data[0].id)
    })
  }

  const loadSessionDetails = (sid: string) => {
    setLoading(true)
    Promise.all([
      seats.getBySession(sid),
      ticketStock.getBySession(sid)
    ]).then(([s, st]) => {
      setSeatList(s)
      setStockList(st)
    }).finally(() => setLoading(false))
  }

  const activeSession = useMemo(() => sessionList.find(s => s.id === activeSessionId), [sessionList, activeSessionId])

  const openSessionModal = (s?: Session) => {
    sessionForm.resetFields()
    if (s) {
      sessionForm.setFieldsValue({
        ...s,
        range: [dayjs(s.startTime), dayjs(s.endTime)]
      })
    }
    setSessionModal({ open: true, data: s })
  }

  const saveSession = async () => {
    try {
      const vals = await sessionForm.validateFields()
      const [start, end] = vals.range
      const payload = { ...vals, startTime: start.toDate(), endTime: end.toDate() }
      delete payload.range
      if (sessionModal.data) {
        await sessions.update(sessionModal.data.id, { ...payload, status: sessionModal.data.status })
        message.success('场次已更新')
      } else {
        await sessions.create(payload)
        message.success('场次已创建')
      }
      setSessionModal({ open: false })
      loadSessions()
    } catch { }
  }

  const deleteSession = async (id: string) => {
    await sessions.delete(id)
    message.success('场次已删除')
    if (activeSessionId === id) setActiveSessionId(null)
    loadSessions()
  }

  const changeSessionStatus = async (s: Session, status: SessionStatus) => {
    await sessions.changeStatus(s.id, status)
    message.success('状态已变更')
    loadSessions()
  }

  const openSeatModal = (s?: Seat) => {
    seatForm.resetFields()
    if (s) seatForm.setFieldsValue(s)
    else seatForm.setFieldsValue({ sessionId: activeSessionId, ticketType: 0, status: 0 })
    setSeatModal({ open: true, data: s })
  }

  const saveSeat = async () => {
    try {
      const vals = await seatForm.validateFields()
      if (seatModal.data) {
        await seats.update(seatModal.data.id, vals)
        message.success('座位已更新')
      } else {
        await seats.create(vals)
        message.success('座位已创建')
      }
      setSeatModal({ open: false })
      loadSessionDetails(activeSessionId!)
    } catch { }
  }

  const deleteSeat = async (id: string) => {
    await seats.delete(id)
    message.success('座位已删除')
    loadSessionDetails(activeSessionId!)
  }

  const saveBatchSeats = async () => {
    try {
      const vals = await batchSeatForm.validateFields()
      await seats.batchCreate({ ...vals, sessionId: activeSessionId })
      message.success(`批量创建座位成功`)
      setBatchSeatModal(false)
      batchSeatForm.resetFields()
      loadSessionDetails(activeSessionId!)
    } catch { }
  }

  const openStockModal = (s?: TicketStock) => {
    stockForm.resetFields()
    if (s) stockForm.setFieldsValue(s)
    else stockForm.setFieldsValue({ sessionId: activeSessionId })
    setStockModal({ open: true, data: s })
  }

  const saveStock = async () => {
    try {
      const vals = await stockForm.validateFields()
      if (stockModal.data) {
        await ticketStock.update(stockModal.data.id, vals)
        message.success('票种库存已更新')
      } else {
        await ticketStock.create(vals)
        message.success('票种库存已创建')
      }
      setStockModal({ open: false })
      loadSessionDetails(activeSessionId!)
    } catch { }
  }

  const deleteStock = async (id: string) => {
    await ticketStock.delete(id)
    message.success('票种已删除')
    loadSessionDetails(activeSessionId!)
  }

  const seatByAreaAndRow = useMemo(() => {
    const map: Record<string, Record<string, Seat[]>> = {}
    seatList.forEach(s => {
      const area = s.area || '默认区'
      if (!map[area]) map[area] = {}
      if (!map[area][s.row || '未分行']) map[area][s.row || '未分行'] = []
      map[area][s.row || '未分行'].push(s)
    })
    Object.keys(map).forEach(area => {
      Object.keys(map[area]).forEach(row => {
        map[area][row].sort((a, b) => (a.number || a.sortOrder) - (b.number || b.sortOrder))
      })
    })
    return map
  }, [seatList])

  const seatStats = useMemo(() => {
    const stats = { total: seatList.length, available: 0, reserved: 0, sold: 0, locked: 0, maintenance: 0 }
    seatList.forEach(s => {
      if (s.status === SeatStatus.Available) stats.available++
      else if (s.status === SeatStatus.Reserved) stats.reserved++
      else if (s.status === SeatStatus.Sold) stats.sold++
      else if (s.status === SeatStatus.Locked) stats.locked++
      else stats.maintenance++
    })
    return stats
  }, [seatList])

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>管理台 · 场次/座位/票种库存</h2>
          <p className="desc" style={{ margin: 0, marginTop: 4 }}>同屏维护：左侧场次列表 · 中间座位图 · 右侧票种库存</p>
        </div>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openSessionModal()}>新增场次</Button>
          <Button icon={<ReloadOutlined />} onClick={loadSessions}>刷新</Button>
        </Space>
      </div>

      <div className="three-col">
        <div className="card-content" style={{ maxHeight: 'calc(100vh - 240px)', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <Title level={5} style={{ margin: 0 }}>场次列表</Title>
          </div>
          <List<Session>
            size="small"
            dataSource={sessionList}
            locale={{ emptyText: '暂无场次，请先新增' }}
            renderItem={(s) => (
              <List.Item
                style={{
                  cursor: 'pointer', border: activeSessionId === s.id ? '1px solid #1677ff' : '1px solid transparent',
                  borderRadius: 6, padding: 12, marginBottom: 8, background: activeSessionId === s.id ? '#e6f4ff' : '#fafafa'
                }}
                onClick={() => setActiveSessionId(s.id)}
                actions={[
                  <Tooltip key="edit" title="编辑"><EditOutlined onClick={(e) => { e.stopPropagation(); openSessionModal(s) }} /></Tooltip>,
                  <Popconfirm key="del" title="删除场次？" onConfirm={(e) => { e?.stopPropagation(); deleteSession(s.id) }}>
                    <DeleteOutlined onClick={(e) => e.stopPropagation()} />
                  </Popconfirm>
                ]}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{s.name}</Text>
                      <Tag color={(SESSION_STATUS_LABEL as any)[s.status].color}>{(SESSION_STATUS_LABEL as any)[s.status].text}</Tag>
                      {s.groupNumber && <Tag color="purple">第{s.groupNumber}组</Tag>}
                    </Space>
                  }
                  description={
                    <div style={{ fontSize: 12, color: '#666' }}>
                      <div>{s.venue || '场地待定'}</div>
                      <div>{dayjs(s.startTime).format('MM-DD HH:mm')} ~ {dayjs(s.endTime).format('HH:mm')}</div>
                      <div style={{ marginTop: 4 }}>
                        座位：<Badge status="success" text={`${s.seatCount}`} showZero />
                        　已售：{s.soldSeatCount}　占用率：{s.seatCount > 0 ? Math.round(s.soldSeatCount / s.seatCount * 100) : 0}%
                      </div>
                      <Space size={4} style={{ marginTop: 6 }}>
                        {Object.entries(SESSION_STATUS_LABEL).map(([k, v]) => (
                          s.status !== Number(k) && (
                            <a key={k} style={{ fontSize: 12 }} onClick={(e) => { e.stopPropagation(); changeSessionStatus(s, Number(k)) }}>
                              标记{v.text}
                            </a>
                          )
                        ))}
                      </Space>
                    </div>
                  } />
              </List.Item>
            )} />
        </div>

        <div>
          <Card title={
            <Space>
              <span>{activeSession ? activeSession.name : '请选择场次'}</span>
              {activeSession && <Tag color={(SESSION_STATUS_LABEL as any)[activeSession.status].color}>{(SESSION_STATUS_LABEL as any)[activeSession.status].text}</Tag>}
            </Space>
          }
            style={{ marginBottom: 16 }}
            extra={activeSessionId && (
              <Space>
                <Button size="small" icon={<PlusOutlined />} onClick={() => openSeatModal()}>单个座位</Button>
                <Button size="small" type="primary" icon={<CloudDownloadOutlined />} onClick={() => setBatchSeatModal(true)}>批量生成</Button>
                <Button size="small" onClick={() => loadSessionDetails(activeSessionId!)}>刷新座位</Button>
              </Space>
            )}
            loading={loading}
            bodyStyle={{ padding: 16 }}>
            {!activeSessionId ? <Empty description="请选择左侧场次" /> : (
              <div>
                <Row gutter={12} style={{ marginBottom: 16 }}>
                  {Object.entries(seatStats).filter(([k]) => k !== 'total').map(([k, v]) => {
                    const labels: any = SEAT_STATUS_LABEL
                    return (
                      <Col span={4} key={k}>
                        <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, background: '#fafafa' }}>
                          <div style={{ color: '#999', fontSize: 12 }}>{labels[(k as any)].text}</div>
                          <div style={{ fontSize: 20, fontWeight: 600, color: SEAT_STATUS_BG[(k as any)] }}>{v}</div>
                        </div>
                      </Col>
                    )
                  })}
                  <Col span={4}>
                    <div style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 6, background: '#e6f4ff' }}>
                      <div style={{ color: '#999', fontSize: 12 }}>总数</div>
                      <div style={{ fontSize: 20, fontWeight: 600, color: '#1677ff' }}>{seatStats.total}</div>
                    </div>
                  </Col>
                </Row>
                <Divider style={{ margin: '8px 0 16px' }}>座位图（点击座位查看详情/编辑）</Divider>
                {Object.keys(seatByAreaAndRow).length === 0 ? (
                  <Empty description="暂无座位，点击右上角批量生成" />
                ) : Object.entries(seatByAreaAndRow).map(([area, rows]) => (
                  <div key={area} style={{ marginBottom: 20 }}>
                    <div style={{ marginBottom: 8, fontWeight: 600 }}>{area}</div>
                    <div>
                      {Object.entries(rows).map(([row, seatsArr]) => (
                        <div key={row} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ width: 50, fontSize: 12, color: '#999' }}>{row}排</div>
                          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                            {seatsArr.map(s => (
                              <Tooltip key={s.id} title={`${s.seatCode} ${SEAT_STATUS_LABEL[s.status].text}${s.registrationName ? ' - ' + s.registrationName : ''}`}>
                                <div
                                  onClick={() => setSeatDetail(s)}
                                  style={{
                                    width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, color: '#fff', borderRadius: 4, cursor: 'pointer',
                                    background: SEAT_STATUS_BG[s.status],
                                    border: s.ticketType === TicketType.VIP ? '2px solid #722ed1' :
                                      s.ticketType === TicketType.VVIP ? '2px solid #faad14' : 'none',
                                    opacity: s.status === SeatStatus.Maintenance ? 0.5 : 1
                                  }}>
                                  {s.number || s.seatCode.slice(-2)}
                                </div>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <Space style={{ marginTop: 16 }} size={16}>
                  {Object.entries(SEAT_STATUS_LABEL).map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                      <div style={{ width: 14, height: 14, background: SEAT_STATUS_BG[k as any], borderRadius: 2, marginRight: 6 }} />
                      {v.text}
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ width: 14, height: 14, background: '#fff', border: '2px solid #722ed1', borderRadius: 2, marginRight: 6 }} />VIP
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', fontSize: 12 }}>
                    <div style={{ width: 14, height: 14, background: '#fff', border: '2px solid #faad14', borderRadius: 2, marginRight: 6 }} />VVIP
                  </div>
                </Space>
              </div>
            )}
          </Card>
        </div>
      </div>

      {activeSessionId && (
        <div className="card-content" style={{ marginTop: 16 }}>
          <Tabs defaultActiveKey="stock" items={[
            {
              key: 'stock',
              label: <span><SettingOutlined /> 票种库存</span>,
              children: (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <Button icon={<PlusOutlined />} type="primary" size="small" onClick={() => openStockModal()}>新增票种</Button>
                    <Button style={{ marginLeft: 8 }} size="small" onClick={() => ticketStock.refresh(activeSessionId!).then(() => { message.success('库存已刷新'); loadSessionDetails(activeSessionId!) })}>
                      重新计算占用
                    </Button>
                  </div>
                  <Table<TicketStock>
                    size="small" rowKey="id" dataSource={stockList} pagination={false}
                    columns={[
                      { title: '票种', dataIndex: 'ticketType', width: 120,
                        render: (t) => <Tag color="geekblue">{TICKET_TYPE_LABEL[t]}</Tag> },
                      { title: '票种名', dataIndex: 'ticketTypeName' },
                      { title: '总数量', dataIndex: 'totalQuantity', width: 100 },
                      { title: '已售', dataIndex: 'soldQuantity', width: 80, render: (v) => <span style={{ color: '#ff4d4f' }}>{v}</span> },
                      { title: '预留', dataIndex: 'reservedQuantity', width: 80, render: (v) => <span style={{ color: '#faad14' }}>{v}</span> },
                      { title: '可用', dataIndex: 'availableQuantity', width: 80, render: (v) => <span style={{ color: '#52c41a', fontWeight: 600 }}>{v}</span> },
                      { title: '价格', dataIndex: 'price', width: 100, render: (v) => v ? `¥${v}` : '-' },
                      { title: '说明', dataIndex: 'description', ellipsis: true },
                      {
                        title: '操作', width: 140, render: (_, r) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => openStockModal(r)}>编辑</Button>
                            <Popconfirm title="删除此票种？" onConfirm={() => deleteStock(r.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
                            </Popconfirm>
                          </Space>
                        )
                      }
                    ]} />
                </div>
              )
            },
            {
              key: 'seatList',
              label: <span><TeamOutlined /> 座位明细</span>,
              children: (
                <Table<Seat>
                  size="small" rowKey="id" dataSource={seatList}
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  columns={[
                    { title: '区域', dataIndex: 'area', width: 100, render: (v) => v || '-' },
                    { title: '排', dataIndex: 'row', width: 80 },
                    { title: '号', dataIndex: 'number', width: 60 },
                    { title: '座位编码', dataIndex: 'seatCode', width: 120 },
                    { title: '票种', dataIndex: 'ticketType', width: 100, render: (t) => TICKET_TYPE_LABEL[t] },
                    { title: '状态', dataIndex: 'status', width: 100,
                      render: (s) => <Tag color={SEAT_STATUS_LABEL[s].color}>{SEAT_STATUS_LABEL[s].text}</Tag> },
                    { title: '占用人', dataIndex: 'registrationName', width: 100, render: (v) => v || '-' },
                    {
                      title: '操作', width: 120, render: (_, r) => (
                        <Space>
                          <Button size="small" onClick={() => { seatForm.setFieldsValue(r); setSeatModal({ open: true, data: r }) }}>编辑</Button>
                          <Popconfirm title="删除此座位？" onConfirm={() => deleteSeat(r.id)}>
                            <Button size="small" danger>删除</Button>
                          </Popconfirm>
                        </Space>
                      )
                    }
                  ]} />
              )
            }
          ]} />
        </div>
      )}

      <Modal title={sessionModal.data ? '编辑场次' : '新增场次'} open={sessionModal.open}
        onOk={saveSession} onCancel={() => setSessionModal({ open: false })} width={560}>
        <Form form={sessionForm} layout="vertical">
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="场次名称" name="name" rules={[{ required: true }]}>
                <Input placeholder="例：行业峰会主论坛·A组" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="分组序号" name="groupNumber">
                <InputNumber min={1} style={{ width: '100%' }} placeholder="可选，用于分组赛程" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="时间" name="range" rules={[{ required: true }]}>
            <RangePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item label="场地" name="venue">
                <Input placeholder="例：国际会议中心·大宴会厅" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item label="排序" name="sortOrder">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={seatModal.data ? '编辑座位' : '新增座位'} open={seatModal.open}
        onOk={saveSeat} onCancel={() => setSeatModal({ open: false })}>
        <Form form={seatForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="区域" name="area"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="排" name="row"><Input /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="号" name="number"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="座位编码" name="seatCode" rules={[{ required: true }]}>
            <Input placeholder="例：A-05" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="状态" name="status">
                <Select>
                  {Object.entries(SEAT_STATUS_LABEL).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="票种" name="ticketType">
                <Select>
                  {Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="排序" name="sortOrder"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="批量生成座位" open={batchSeatModal} onOk={saveBatchSeats} onCancel={() => setBatchSeatModal(false)} width={560}>
        <Form form={batchSeatForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="区域" name="area"><Input placeholder="例：A区/VIP区" /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="排号前缀" name="rowPrefix"><Input placeholder="例：A，留空则使用数字" /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="起始排" name="startRow" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} defaultValue={1} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="结束排" name="endRow" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} defaultValue={10} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="每排座位数" name="seatsPerRow" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} defaultValue={20} /></Form.Item>
            </Col>
          </Row>
          <Form.Item label="票种" name="ticketType" rules={[{ required: true }]}>
            <Select>
              {Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => (
                <Option key={k} value={Number(k)}>{v}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title={stockModal.data ? '编辑票种库存' : '新增票种库存'} open={stockModal.open}
        onOk={saveStock} onCancel={() => setStockModal({ open: false })}>
        <Form form={stockForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="票种类型" name="ticketType" rules={[{ required: true }]}>
                <Select>
                  {Object.entries(TICKET_TYPE_LABEL).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="票种名称" name="ticketTypeName" rules={[{ required: true }]}>
                <Input placeholder="例：标准早鸟票" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="总数量" name="totalQuantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="价格（元）" name="price">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="座位详情" placement="right" width={380} open={!!seatDetail} onClose={() => setSeatDetail(null)}>
        {seatDetail && (
          <div>
            <Paragraph>
              <Text strong>座位编码：</Text>{seatDetail.seatCode}
            </Paragraph>
            <Paragraph>
              <Text strong>状态：</Text>
              <Tag color={SEAT_STATUS_LABEL[seatDetail.status].color}>{SEAT_STATUS_LABEL[seatDetail.status].text}</Tag>
            </Paragraph>
            <Paragraph>
              <Text strong>票种：</Text>{TICKET_TYPE_LABEL[seatDetail.ticketType]}
            </Paragraph>
            <Paragraph>
              <Text strong>区域/排/号：</Text>{seatDetail.area || '-'} / {seatDetail.row || '-'} / {seatDetail.number || '-'}
            </Paragraph>
            <Paragraph>
              <Text strong>占用人：</Text>{seatDetail.registrationName || '（无人占用）'}
            </Paragraph>
            <Space>
              <Button type="primary" onClick={() => {
                seatForm.setFieldsValue(seatDetail);
                setSeatDetail(null);
                setSeatModal({ open: true, data: seatDetail })
              }}>编辑此座位</Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  )
}
