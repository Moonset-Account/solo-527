import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, DatePicker, TimePicker, Modal, Form, message, Empty, Tag, Space, List, Avatar, Popconfirm } from 'antd'
import { CalendarOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import axios from '@/utils/request'

interface Room { id: number; name: string; building: string; floor: number; total_seats: number; available_seats: number; seats: any[] }
interface Seat { id: number; seat_number: string; row: number | null; col: number | null; has_power: boolean; has_window: boolean }

export default function StudyRooms() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [reservations, setReservations] = useState<any[]>([])
  const [tab, setTab] = useState<'rooms' | 'my'>('rooms')

  const fetchRooms = async () => {
    const { data } = await axios.get('/api/rooms/study-rooms/')
    setRooms(data.results || data)
  }

  const fetchMyReservations = async () => {
    const { data } = await axios.get('/api/rooms/reservations/my/')
    setReservations(data.results || data)
  }

  useEffect(() => {
    fetchRooms()
    fetchMyReservations()
  }, [tab])

  const submitReservation = async (values: any) => {
    try {
      await axios.post('/api/rooms/reservations/', {
        seat: selectedSeat?.id,
        date: values.date.format('YYYY-MM-DD'),
        start_time: values.time_range[0].format('HH:mm'),
        end_time: values.time_range[1].format('HH:mm'),
      })
      message.success('预约成功')
      setModalOpen(false)
      form.resetFields()
      fetchMyReservations()
    } catch {}
  }

  const cancelReservation = async (id: number) => {
    try {
      await axios.post(`/api/rooms/reservations/${id}/cancel/`)
      message.success('已取消')
      fetchMyReservations()
    } catch {}
  }

  const checkin = async (id: number) => {
    try {
      await axios.post('/api/rooms/checkins/do_checkin/', { reservation_id: id })
      message.success('签到成功')
      fetchMyReservations()
    } catch {}
  }

  return (
    <div>
      <Card
        tabList={[
          { key: 'rooms', tab: '自习室座位' },
          { key: 'my', tab: '我的预约' },
        ]}
        activeTabKey={tab}
        onTabChange={setTab}
      >
        {tab === 'rooms' && (
          <>
            {!selectedRoom ? (
              <Row gutter={[16, 16]}>
                {rooms.map((room) => (
                  <Col xs={24} sm={12} md={8} key={room.id}>
                    <Card
                      hoverable
                      onClick={() => setSelectedRoom(room)}
                      style={{ height: '100%' }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                        {room.building} - {room.name}
                      </div>
                      <div style={{ color: '#666', marginBottom: 4 }}>
                        楼层: {room.floor} 层
                      </div>
                      <div style={{ color: '#666', marginBottom: 8 }}>
                        <CalendarOutlined /> 开放: {room.open_time} - {room.close_time}
                      </div>
                      <Row>
                        <Col span={12}>
                          <div style={{ fontSize: 12, color: '#999' }}>总座位</div>
                          <div style={{ fontSize: 20, fontWeight: 600 }}>{room.total_seats}</div>
                        </Col>
                        <Col span={12} style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, color: '#999' }}>可用</div>
                          <div style={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}>{room.available_seats}</div>
                        </Col>
                      </Row>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <div>
                <Space style={{ marginBottom: 16 }}>
                  <Button onClick={() => { setSelectedRoom(null); setSelectedSeat(null) }}>返回列表</Button>
                  <span style={{ fontWeight: 600 }}>{selectedRoom.building} - {selectedRoom.name}</span>
                  <Tag color="green">可用 {selectedRoom.available_seats}/{selectedRoom.total_seats}</Tag>
                </Space>
                <div className="seat-grid" style={{ gridTemplateColumns: `repeat(8, 1fr)` }}>
                  {selectedRoom.seats.filter((s: any) => s.is_active).map((seat: Seat) => {
                    const isOccupied = false
                    const isSelected = selectedSeat?.id === seat.id
                    let className = 'seat-btn'
                    if (isOccupied) className += ' occupied'
                    if (isSelected) className += ' selected'
                    return (
                      <div
                        key={seat.id}
                        className={className}
                        onClick={() => setSelectedSeat(seat)}
                      >
                        <div>{seat.seat_number}</div>
                        <div style={{ fontSize: 10, color: seat.has_power ? '#faad14' : '#ccc' }}>
                          {seat.has_power ? '⚡' : ''} {seat.has_window ? '🪟' : ''}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedSeat && (
                  <Card style={{ marginTop: 16 }}>
                    <Space>
                      <span>已选座位: <b>{selectedSeat.seat_number}</b></span>
                      {selectedSeat.has_power && <Tag color="gold">有电源</Tag>}
                      {selectedSeat.has_window && <Tag color="blue">靠窗</Tag>}
                      <Button type="primary" onClick={() => setModalOpen(true)}>
                        预约该座位
                      </Button>
                    </Space>
                  </Card>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'my' && (
          <List
            dataSource={reservations}
            locale={{ emptyText: <Empty description="暂无预约" /> }}
            renderItem={(item: any) => (
              <List.Item
                actions={[
                  item.status === 'reserved' && (
                    <Button size="small" type="primary" onClick={() => checkin(item.id)}>签到</Button>
                  ),
                  item.status === 'reserved' && (
                    <Popconfirm title="确认取消预约？" onConfirm={() => cancelReservation(item.id)}>
                      <Button size="small" danger>取消</Button>
                    </Popconfirm>
                  ),
                ]}
              >
                <List.Item.Meta
                  avatar={<Avatar icon={<CalendarOutlined />} />}
                  title={
                    <Space>
                      <span>{item.seat_info?.study_room?.name} - {item.seat_info?.seat_number}</span>
                      <Tag color={
                        item.status === 'reserved' ? 'blue' :
                        item.status === 'checked_in' ? 'green' :
                        item.status === 'cancelled' ? 'default' : 'red'
                      }>
                        {item.status_display}
                      </Tag>
                    </Space>
                  }
                  description={
                    <Space>
                      <span><CalendarOutlined /> {dayjs(item.date).format('YYYY-MM-DD')}</span>
                      <span><ClockCircleOutlined /> {item.start_time} - {item.end_time}</span>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title={`预约座位 ${selectedSeat?.seat_number}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={submitReservation}>
          <Form.Item label="预约日期" name="date" rules={[{ required: true }]}>
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(d) => d && d.isBefore(dayjs().startOf('day'))}
              defaultValue={dayjs()}
            />
          </Form.Item>
          <Form.Item label="时间范围" name="time_range" rules={[{ required: true }]}>
            <TimePicker.RangePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
