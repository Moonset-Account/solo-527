import { Card, Select, Badge, Space, Tooltip, Button, Modal, Form, Input, DatePicker, Radio, message } from 'antd'
import { CalendarOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useState, useEffect, useMemo } from 'react'
import dayjs, { Dayjs } from 'dayjs'
import { get, post } from '../api'
import type { RoomStatus, Property, PaginatedResponse } from '../types'

const { Option } = Select

const statusConfig: Record<string, { color: string; text: string; bgColor: string }> = {
  occupied: { color: '#faad14', text: '已入住', bgColor: '#fffbe6' },
  checked_out: { color: '#fa8c16', text: '已退房', bgColor: '#fff7e6' },
  cleaning: { color: '#1890ff', text: '清洁中', bgColor: '#e6f7ff' },
  cleaning_completed: { color: '#722ed1', text: '清洁完成', bgColor: '#f9f0ff' },
  inspecting: { color: '#eb2f96', text: '验收中', bgColor: '#fff0f6' },
  available: { color: '#52c41a', text: '可入住', bgColor: '#f6ffed' },
  maintenance: { color: '#ff4d4f', text: '维修中', bgColor: '#fff1f0' },
  blocked: { color: '#8c8c8c', text: '锁定', bgColor: '#f5f5f5' },
}

const Calendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs())
  const [selectedCommunity, setSelectedCommunity] = useState<string | undefined>()
  const [communities, setCommunities] = useState<string[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null)
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<RoomStatus | null>(null)
  const [form] = Form.useForm()

  const fetchCommunities = async () => {
    try {
      const data = await get<string[]>('/properties/communities')
      setCommunities(data || [])
    } catch (e) {}
  }

  const fetchProperties = async () => {
    try {
      const data = await get<PaginatedResponse<Property>>('/properties', {
        params: { community: selectedCommunity, page_size: 100 },
      })
      setProperties(data.data || [])
    } catch (e) {}
  }

  const fetchRoomStatuses = async () => {
    const startDate = currentMonth.startOf('month').format('YYYY-MM-DD')
    const endDate = currentMonth.endOf('month').format('YYYY-MM-DD')
    try {
      const data = await get<RoomStatus[]>('/room-statuses/calendar', {
        params: {
          start_date: startDate,
          end_date: endDate,
          community: selectedCommunity,
        },
      })
      setRoomStatuses(data || [])
    } catch (e) {}
  }

  useEffect(() => {
    fetchCommunities()
  }, [])

  useEffect(() => {
    fetchProperties()
    fetchRoomStatuses()
  }, [selectedCommunity, currentMonth])

  const daysInMonth = useMemo(() => {
    const start = currentMonth.startOf('month')
    const end = currentMonth.endOf('month')
    const days: Dayjs[] = []
    let day = start
    while (day.isBefore(end) || day.isSame(end, 'day')) {
      days.push(day)
      day = day.add(1, 'day')
    }
    return days
  }, [currentMonth])

  const getStatusForPropertyAndDate = (propertyId: number, date: Dayjs): RoomStatus | undefined => {
    return roomStatuses.find(
      (rs) => rs.property_id === propertyId && dayjs(rs.date).isSame(date, 'day')
    )
  }

  const handleCellClick = (status: RoomStatus | null, propertyId: number, date: Dayjs) => {
    setSelectedStatus(status)
    setSelectedPropertyId(propertyId)
    setSelectedDate(date)
    if (status) {
      form.setFieldsValue({
        status: status.status,
        guest_name: status.guest_name,
        remarks: status.remarks,
      })
    } else {
      form.resetFields()
      form.setFieldsValue({ status: 'available' })
    }
    setModalVisible(true)
  }

  const handleSaveStatus = async (values: any) => {
    try {
      await post('/room-statuses', {
        property_id: selectedPropertyId,
        date: selectedDate?.format('YYYY-MM-DD'),
        status: values.status,
        guest_name: values.guest_name,
        remarks: values.remarks,
        check_in_time: values.check_in_time ? values.check_in_time.toISOString() : null,
        check_out_time: values.check_out_time ? values.check_out_time.toISOString() : null,
      })
      message.success('房态更新成功')
      setModalVisible(false)
      fetchRoomStatuses()
    } catch (e) {}
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="选择小区"
          style={{ width: 200 }}
          allowClear
          value={selectedCommunity}
          onChange={setSelectedCommunity}
        >
          {communities.map((c) => (
            <Option key={c} value={c}>{c}</Option>
          ))}
        </Select>
        <Button onClick={() => setCurrentMonth(currentMonth.subtract(1, 'month'))}>
          <LeftOutlined />
        </Button>
        <Button onClick={() => setCurrentMonth(dayjs())}>今天</Button>
        <Button onClick={() => setCurrentMonth(currentMonth.add(1, 'month'))}>
          <RightOutlined />
        </Button>
        <span style={{ fontSize: 16, fontWeight: 500 }}>
          {currentMonth.format('YYYY年MM月')}
        </span>
      </Space>

      <Space style={{ marginBottom: 16, flexWrap: 'wrap' }}>
        {Object.entries(statusConfig).map(([key, config]) => (
          <Badge
            key={key}
            color={config.color}
            text={config.text}
          />
        ))}
      </Space>

      <Card bodyStyle={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead>
              <tr>
                <th style={{ width: 150, padding: 12, background: '#fafafa', border: '1px solid #f0f0f0', position: 'sticky', left: 0, zIndex: 1 }}>房源</th>
                {daysInMonth.map((day) => (
                  <th
                    key={day.format('YYYY-MM-DD')}
                    style={{
                      padding: 8,
                      background: day.isSame(dayjs(), 'day') ? '#e6f7ff' : '#fafafa',
                      border: '1px solid #f0f0f0',
                      minWidth: 80,
                      fontWeight: 500,
                    }}
                  >
                    <div>{weekDays[day.day()]}</div>
                    <div style={{ fontSize: 16 }}>{day.date()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {properties.map((prop) => (
                <tr key={prop.id}>
                  <td
                    style={{
                      padding: 12,
                      border: '1px solid #f0f0f0',
                      background: '#fafafa',
                      position: 'sticky',
                      left: 0,
                      zIndex: 1,
                      fontWeight: 500,
                    }}
                  >
                    <div>{prop.name}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{prop.community}</div>
                  </td>
                  {daysInMonth.map((day) => {
                    const status = getStatusForPropertyAndDate(prop.id, day)
                    const config = status ? statusConfig[status.status] : statusConfig.available
                    return (
                      <td
                        key={day.format('YYYY-MM-DD')}
                        style={{
                          padding: 4,
                          border: '1px solid #f0f0f0',
                          background: config.bgColor,
                          cursor: 'pointer',
                          textAlign: 'center',
                          verticalAlign: 'middle',
                        }}
                        onClick={() => handleCellClick(status || null, prop.id, day)}
                      >
                        <Tooltip title={status?.guest_name || config.text}>
                          <Badge
                            color={config.color}
                            text={
                              <span style={{ fontSize: 11 }}>
                                {status?.guest_name || config.text}
                              </span>
                            }
                          />
                        </Tooltip>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        title="编辑房态"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveStatus}>
          <Form.Item name="status" label="房间状态" rules={[{ required: true }]}>
            <Radio.Group>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Radio key={key} value={key}>
                <Badge color={config.color} text={config.text} />
              </Radio>
            ))}
            </Radio.Group>
          </Form.Item>
          <Form.Item name="guest_name" label="客人姓名">
            <Input placeholder="请输入客人姓名" />
          </Form.Item>
          <Form.Item name="check_in_time" label="入住时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="check_out_time" label="退房时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="remarks" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Calendar
