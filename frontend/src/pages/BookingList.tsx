import { useEffect, useState } from 'react'
import { Table, Button, Tag, Space, Typography, DatePicker, Select, message } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { bookingApi } from '../api'
import dayjs from 'dayjs'

const { Title } = Typography
const { Option } = Select

export default function BookingList() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'))

  useEffect(() => {
    loadBookings()
  }, [selectedDate])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const data: any = await bookingApi.getByCoach(1, selectedDate)
      setBookings(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await bookingApi.complete(id)
      message.success('课时已完成')
      loadBookings()
    } catch (error) {
      console.error(error)
    }
  }

  const handleCancel = async (id: number) => {
    try {
      await bookingApi.cancel(id)
      message.success('预约已取消')
      loadBookings()
    } catch (error) {
      console.error(error)
    }
  }

  const columns = [
    {
      title: '会员',
      dataIndex: ['member', 'name'],
      key: 'member',
    },
    {
      title: '课程类型',
      dataIndex: 'courseType',
      key: 'courseType',
      render: (type: string) => (type === 'PERSONAL' ? '私教课' : '团课'),
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => dayjs(time).format('MM-DD HH:mm'),
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (time: string) => dayjs(time).format('HH:mm'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap: Record<string, string> = {
          PENDING: 'orange',
          CONFIRMED: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'default',
          ABSENT: 'red',
        }
        const labelMap: Record<string, string> = {
          PENDING: '待确认',
          CONFIRMED: '已确认',
          COMPLETED: '已完成',
          CANCELLED: '已取消',
          ABSENT: '未到课',
        }
        return <Tag color={colorMap[status]}>{labelMap[status]}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => {
        if (record.status === 'CONFIRMED' || record.status === 'PENDING') {
          return (
            <Space>
              <Button
                type="link"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record.id)}
              >
                完成
              </Button>
              <Button
                type="link"
                size="small"
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleCancel(record.id)}
              >
                取消
              </Button>
            </Space>
          )
        }
        return null
      },
    },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <Title level={4} style={{ margin: 0 }}>
          预约管理
        </Title>
        <Space>
          <DatePicker
            value={dayjs(selectedDate)}
            onChange={(date) => date && setSelectedDate(date.format('YYYY-MM-DD'))}
          />
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={bookings}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </div>
  )
}
