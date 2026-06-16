import React, { useState, useEffect } from 'react'
import { Card, Button, Tabs, Table, Tag, Space, Input, Modal, Form, Select, message, Row, Col, Statistic } from 'antd'
import { ArrowLeftOutlined, ShoppingCartOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { eventAPI, orderAPI } from '../services/api.js'

const { Option } = Select

function BuyTickets() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [seats, setSeats] = useState([])
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(false)
  const [buyModalVisible, setBuyModalVisible] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    loadDetail()
  }, [id])

  useEffect(() => {
    if (selectedSession) {
      loadSeats()
    }
  }, [selectedSession])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await eventAPI.getDetail(id)
      setEvent(data)
      if (data.sessions?.length > 0) {
        setSelectedSession(data.sessions[0].id)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadSeats = async () => {
    try {
      const data = await eventAPI.getSeats(id, selectedSession)
      setSeats(data)
      setSelectedSeats([])
    } catch (e) {}
  }

  const handleSeatClick = (seat) => {
    if (seat.status === 'SOLD') return
    const exists = selectedSeats.find(s => s.id === seat.id)
    if (exists) {
      setSelectedSeats(selectedSeats.filter(s => s.id !== seat.id))
    } else {
      if (selectedSeats.length >= 6) {
        message.warning('最多可选6个座位')
        return
      }
      setSelectedSeats([...selectedSeats, seat])
    }
  }

  const handleBuy = async (values) => {
    setLoading(true)
    try {
      const ticket = event.tickets?.find(t => t.name.includes(seats[0]?.zone === 'VIP' ? 'VIP' : '普通'))
      const items = selectedSeats.map(seat => ({
        ticketId: ticket?.id || event.tickets?.[0]?.id,
        sessionId: selectedSession,
        seatId: seat.id,
        seatName: `${seat.row}排${seat.number}号`,
        quantity: 1
      }))

      await orderAPI.create({
        eventId: parseInt(id),
        items,
        sourceOrder: values.sourceOrder,
        remark: values.remark
      })
      message.success('购票成功')
      setBuyModalVisible(false)
      setSelectedSeats([])
      loadSeats()
    } finally {
      setLoading(false)
    }
  }

  const seatRows = {}
  seats.forEach(seat => {
    if (!seatRows[seat.row]) seatRows[seat.row] = []
    seatRows[seat.row].push(seat)
  })

  const totalPrice = selectedSeats.reduce((sum, s) => sum + parseFloat(s.price), 0)

  if (!event) return <div style={{ padding: 24 }}>加载中...</div>

  return (
    <div className="page-container">
      <div className="page-header">
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>
          <h2>选票购票 - {event.name}</h2>
        </Space>
      </div>

      <Row gutter={16}>
        <Col span={16}>
          <Card title="选择场次" style={{ marginBottom: 16 }}>
            <Select
              style={{ width: '100%' }}
              value={selectedSession}
              onChange={setSelectedSession}
            >
              {event.sessions?.map(s => (
                <Option key={s.id} value={s.id}>{s.name}</Option>
              ))}
            </Select>
          </Card>

          <Card title="选择座位">
            <div className="seat-grid">
              <div className="stage">舞 台</div>
              {Object.keys(seatRows).sort().map(row => (
                <div key={row} className="seat-row">
                  <span style={{ width: 24, color: '#999', fontSize: 12 }}>{row}排</span>
                  {seatRows[row].sort((a, b) => a.number - b.number).map(seat => (
                    <div
                      key={seat.id}
                      className={`seat-item ${seat.status === 'AVAILABLE' ? 'available' : 'sold'} ${selectedSeats.find(s => s.id === seat.id) ? 'selected' : ''}`}
                      onClick={() => handleSeatClick(seat)}
                      title={`${seat.zone}区 - ¥${seat.price}`}
                    >
                      {seat.number}
                    </div>
                  ))}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 24, marginTop: 16 }}>
                <Space>
                  <div className="seat-item available" style={{ cursor: 'default' }}></div>
                  <span style={{ fontSize: 12 }}>可选</span>
                </Space>
                <Space>
                  <div className="seat-item selected" style={{ cursor: 'default' }}></div>
                  <span style={{ fontSize: 12 }}>已选</span>
                </Space>
                <Space>
                  <div className="seat-item sold" style={{ cursor: 'default' }}></div>
                  <span style={{ fontSize: 12 }}>已售</span>
                </Space>
              </div>
            </div>
          </Card>
        </Col>

        <Col span={8}>
          <Card title="选座信息">
            <Statistic
              title="已选座位"
              value={selectedSeats.length}
              suffix="个"
              style={{ marginBottom: 16 }}
            />
            <Statistic
              title="合计金额"
              value={totalPrice}
              prefix="¥"
              style={{ marginBottom: 24 }}
            />
            {selectedSeats.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ color: '#666', marginBottom: 8 }}>座位详情：</p>
                <div style={{ maxHeight: 200, overflow: 'auto' }}>
                  {selectedSeats.map(s => (
                    <Tag key={s.id} color="blue" style={{ marginBottom: 4 }}>
                      {s.row}排{s.number}号 - {s.zone}区 ¥{s.price}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            <Button
              type="primary"
              size="large"
              block
              icon={<ShoppingCartOutlined />}
              disabled={selectedSeats.length === 0}
              onClick={() => setBuyModalVisible(true)}
            >
              立即购票
            </Button>
          </Card>
        </Col>
      </Row>

      <Modal
        title="确认购票"
        open={buyModalVisible}
        onCancel={() => setBuyModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleBuy}>
          <div style={{ background: '#f5f7fa', padding: 16, borderRadius: 8, marginBottom: 16 }}>
            <p><strong>活动：</strong>{event.name}</p>
            <p><strong>座位数：</strong>{selectedSeats.length} 个</p>
            <p><strong>总金额：</strong><span style={{ color: '#f5222d', fontSize: 20, fontWeight: 'bold' }}>¥{totalPrice}</span></p>
          </div>
          <Form.Item name="sourceOrder" label="来源单据号">
            <Input placeholder="请输入外部来源单据号（选填）" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注信息" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              确认支付
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BuyTickets
