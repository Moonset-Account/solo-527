import { useState, useEffect } from 'react'
import {
  Card, Table, Tag, Button, Space, Modal, Form, Input, Switch, message,
  InputNumber, DatePicker, Select, List, Popconfirm,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import axios from '@/utils/request'

export default function SeatManage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [roomModal, setRoomModal] = useState(false)
  const [seatModal, setSeatModal] = useState(false)
  const [editingRoom, setEditingRoom] = useState<any>(null)
  const [currentRoom, setCurrentRoom] = useState<any>(null)
  const [editingSeat, setEditingSeat] = useState<any>(null)
  const [roomForm] = Form.useForm()
  const [seatForm] = Form.useForm()
  const [tab, setTab] = useState<'rooms' | 'reservations'>('rooms')
  const [resParams, setResParams] = useState<any>({})

  const fetchRooms = async () => {
    setLoading(true)
    try {
      const { data } = await axios.get('/api/rooms/study-rooms/', { params: { page_size: 100 } })
      setRooms(data.results || data)
    } finally {
      setLoading(false)
    }
  }

  const fetchReservations = async () => {
    const { data } = await axios.get('/api/rooms/reservations/', { params: { page_size: 100, ...resParams } })
    setReservations(data.results || data)
  }

  useEffect(() => {
    if (tab === 'rooms') fetchRooms()
    else fetchReservations()
  }, [tab, resParams])

  const openRoomModal = (record?: any) => {
    setEditingRoom(record)
    roomForm.setFieldsValue({
      name: record?.name || '',
      building: record?.building || '',
      floor: record?.floor || 1,
      total_seats: record?.total_seats || 0,
      open_time: record?.open_time ? dayjs(record.open_time, 'HH:mm') : undefined,
      close_time: record?.close_time ? dayjs(record.close_time, 'HH:mm') : undefined,
      description: record?.description || '',
      is_active: record?.is_active ?? true,
    })
    setRoomModal(true)
  }

  const saveRoom = async (values: any) => {
    try {
      const payload = {
        ...values,
        open_time: values.open_time.format('HH:mm'),
        close_time: values.close_time.format('HH:mm'),
      }
      if (editingRoom) {
        await axios.put(`/api/rooms/study-rooms/${editingRoom.id}/`, payload)
      } else {
        await axios.post('/api/rooms/study-rooms/', payload)
      }
      message.success('保存成功')
      setRoomModal(false)
      fetchRooms()
    } catch {}
  }

  const deleteRoom = async (id: number) => {
    try {
      await axios.delete(`/api/rooms/study-rooms/${id}/`)
      message.success('已删除')
      fetchRooms()
    } catch {}
  }

  const openSeatModal = (room: any, seat?: any) => {
    setCurrentRoom(room)
    setEditingSeat(seat)
    seatForm.setFieldsValue({
      seat_number: seat?.seat_number || '',
      row: seat?.row,
      col: seat?.col,
      has_power: seat?.has_power ?? false,
      has_window: seat?.has_window ?? false,
      is_active: seat?.is_active ?? true,
    })
    setSeatModal(true)
  }

  const saveSeat = async (values: any) => {
    try {
      const payload = { ...values, study_room: currentRoom.id }
      if (editingSeat) {
        await axios.put(`/api/rooms/seats/${editingSeat.id}/`, payload)
      } else {
        await axios.post('/api/rooms/seats/', payload)
      }
      message.success('保存成功')
      setSeatModal(false)
      fetchRooms()
    } catch {}
  }

  const deleteSeat = async (id: number) => {
    try {
      await axios.delete(`/api/rooms/seats/${id}/`)
      message.success('已删除')
      fetchRooms()
    } catch {}
  }

  const cancelReservation = async (id: number) => {
    try {
      await axios.post(`/api/rooms/reservations/${id}/cancel/`)
      message.success('已取消')
      fetchReservations()
    } catch {}
  }

  const roomColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '名称', dataIndex: 'name' },
    { title: '楼栋', dataIndex: 'building', width: 100 },
    { title: '楼层', dataIndex: 'floor', width: 80 },
    { title: '总座位', dataIndex: 'total_seats', width: 100 },
    { title: '可用', dataIndex: 'available_seats', width: 80 },
    { title: '开放时间', dataIndex: 'open_time', width: 100, render: (t: string, r: any) => `${t} - ${r.close_time}` },
    {
      title: '状态', dataIndex: 'is_active', width: 80,
      render: (v: boolean) => <Tag color={v ? 'green' : 'default'}>{v ? '启用' : '禁用'}</Tag>,
    },
    {
      title: '操作', key: 'action', width: 180,
      render: (_: any, r: any) => (
        <Space>
          <Button size="small" onClick={() => openSeatModal(r)}>
            新增座位
          </Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => openRoomModal(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteRoom(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const resColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户', dataIndex: 'user_info', width: 120, render: (u: any) => u?.real_name || u?.username },
    { title: '座位', dataIndex: 'seat_info', width: 160, render: (s: any) => `${s?.study_room?.name} - ${s?.seat_number}` },
    { title: '日期', dataIndex: 'date', width: 120, render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
    { title: '时段', dataIndex: 'start_time', width: 150, render: (s: string, r: any) => `${s} - ${r.end_time}` },
    {
      title: '状态', dataIndex: 'status', width: 100,
      render: (v: string, r: any) => {
        const colors: Record<string, string> = {
          reserved: 'blue', checked_in: 'green', cancelled: 'default', no_show: 'red', completed: 'cyan',
        }
        return <Tag color={colors[v]}>{r.status_display}</Tag>
      },
    },
    { title: '预约时间', dataIndex: 'reserved_at', width: 170, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    {
      title: '操作', key: 'action', width: 100,
      render: (_: any, r: any) => r.status === 'reserved' && (
        <Popconfirm title="确认取消？" onConfirm={() => cancelReservation(r.id)}>
          <Button size="small" danger>取消</Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <Card
      tabList={[
        { key: 'rooms', tab: '自习室与座位' },
        { key: 'reservations', tab: '预约记录' },
      ]}
      activeTabKey={tab}
      onTabChange={(k) => setTab(k as any)}
      extra={tab === 'rooms' ? (
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openRoomModal()}>
          新增自习室
        </Button>
      ) : null}
    >
      {tab === 'rooms' && (
        <>
          <Table
            rowKey="id" loading={loading} dataSource={rooms} columns={roomColumns}
            expandable={{
              expandedRowRender: (record) => (
                <Card size="small" title={`座位列表 (${record.seats?.length || 0})`}>
                  <List
                    grid={{ gutter: 8, xs: 2, sm: 4, md: 6, lg: 8 }}
                    dataSource={record.seats || []}
                    locale={{ emptyText: '暂无座位' }}
                    renderItem={(seat: any) => (
                      <List.Item>
                        <Card
                          size="small"
                          style={{ textAlign: 'center' }}
                          title={seat.seat_number}
                          extra={
                            <Space>
                              <Button size="small" type="link" onClick={() => openSeatModal(record, seat)}>
                                <EditOutlined />
                              </Button>
                              <Popconfirm title="删除？" onConfirm={() => deleteSeat(seat.id)}>
                                <Button size="small" type="link" danger>
                                  <DeleteOutlined />
                                </Button>
                              </Popconfirm>
                            </Space>
                          }
                        >
                          <Space size={4} direction="vertical">
                            {seat.has_power && <Tag color="gold">电源</Tag>}
                            {seat.has_window && <Tag color="blue">靠窗</Tag>}
                            {!seat.is_active && <Tag color="red">禁用</Tag>}
                          </Space>
                        </Card>
                      </List.Item>
                    )}
                  />
                </Card>
              ),
            }}
            pagination={false}
          />
        </>
      )}

      {tab === 'reservations' && (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Select
              placeholder="状态" allowClear style={{ width: 140 }}
              options={[
                { value: 'reserved', label: '已预约' },
                { value: 'checked_in', label: '已签到' },
                { value: 'cancelled', label: '已取消' },
                { value: 'no_show', label: '未签到' },
              ]}
              onChange={(v) => setResParams((p: any) => ({ ...p, status: v }))}
            />
            <DatePicker
              onChange={(d: any) => setResParams((p: any) => ({
                ...p,
                date_from: d?.format('YYYY-MM-DD'),
                date_to: d?.format('YYYY-MM-DD'),
              }))}
              placeholder="预约日期"
            />
          </Space>
          <Table rowKey="id" dataSource={reservations} columns={resColumns} pagination={{ pageSize: 20 }} />
        </>
      )}

      <Modal
        title={editingRoom ? '编辑自习室' : '新增自习室'}
        open={roomModal} onCancel={() => setRoomModal(false)}
        onOk={() => roomForm.submit()} width={600}
      >
        <Form form={roomForm} layout="vertical" onFinish={saveRoom}>
          <Form.Item label="名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="楼栋" name="building" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="楼层" name="floor" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="总座位数" name="total_seats" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Space>
            <Form.Item label="开放时间" name="open_time" rules={[{ required: true }]}>
              <DatePicker picker="time" format="HH:mm" />
            </Form.Item>
            <Form.Item label="关闭时间" name="close_time" rules={[{ required: true }]}>
              <DatePicker picker="time" format="HH:mm" />
            </Form.Item>
          </Space>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="启用" name="is_active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSeat ? '编辑座位' : `新增座位 - ${currentRoom?.name}`}
        open={seatModal} onCancel={() => setSeatModal(false)}
        onOk={() => seatForm.submit()}
      >
        <Form form={seatForm} layout="vertical" onFinish={saveSeat}>
          <Form.Item label="座位号" name="seat_number" rules={[{ required: true }]}><Input /></Form.Item>
          <Space>
            <Form.Item label="行" name="row"><InputNumber min={0} /></Form.Item>
            <Form.Item label="列" name="col"><InputNumber min={0} /></Form.Item>
          </Space>
          <Space>
            <Form.Item label="有电源" name="has_power" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item label="靠窗" name="has_window" valuePropName="checked"><Switch /></Form.Item>
            <Form.Item label="启用" name="is_active" valuePropName="checked"><Switch /></Form.Item>
          </Space>
        </Form>
      </Modal>
    </Card>
  )
}
