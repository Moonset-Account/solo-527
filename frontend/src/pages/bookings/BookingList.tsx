import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, DatePicker, TimePicker, Space, message, Tag, Row, Col } from 'antd'
import { PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, CheckOutlined } from '@ant-design/icons'
import { bookingApi, memberApi, coachApi, packageApi, groupClassApi } from '@/api'
import type { Booking, Member, Coach, MemberPackage, GroupClass, BookingType, BookingStatus } from '@/types'
import { useUserStore } from '@/store'

const BookingList: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [coaches, setCoaches] = useState<Coach[]>([])
  const [memberPackages, setMemberPackages] = useState<MemberPackage[]>([])
  const [groupClasses, setGroupClasses] = useState<GroupClass[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null)
  const [form] = Form.useForm()
  const { userInfo, isCoach } = useUserStore()

  const [filters, setFilters] = useState({
    status: undefined as string | undefined,
    startDate: undefined as string | undefined,
    endDate: undefined as string | undefined
  })

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    setLoading(true)
    try {
      const params: any = { ...filters }
      if (isCoach() && userInfo?.userId) {
        const coach = coaches.find((c) => c.userId === userInfo.userId)
        if (coach) {
          params.coachId = coach.id
        }
      }
      const [bookingData, memberData, coachData, pkgData, classData] = await Promise.all([
        bookingApi.list(params),
        memberApi.list(),
        coachApi.list(),
        packageApi.list(),
        groupClassApi.list()
      ])
      setBookings(bookingData)
      setMembers(memberData)
      setCoaches(coachData)
      setMemberPackages(pkgData)
      setGroupClasses(classData)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingBooking(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleCancel = async (id: number) => {
    try {
      await bookingApi.cancel(id)
      message.success('取消成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleCheckIn = async (id: number) => {
    try {
      await bookingApi.checkIn(id)
      message.success('签到成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleComplete = async (id: number) => {
    try {
      await bookingApi.complete(id)
      message.success('完成成功')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSubmit = async (values: any) => {
    try {
      const data = {
        ...values,
        bookingDate: values.bookingDate ? values.bookingDate.format('YYYY-MM-DD') : null,
        startTime: values.startTime ? values.startTime.format('HH:mm') : null,
        endTime: values.endTime ? values.endTime.format('HH:mm') : null
      }
      if (editingBooking) {
        message.info('预约暂不支持编辑')
      } else {
        await bookingApi.create(data)
        message.success('创建成功')
      }
      setModalOpen(false)
      loadData()
    } catch (e: any) {
      console.error(e)
      message.error(e?.response?.data?.message || '操作失败')
    }
  }

  const getStatusTag = (status: BookingStatus) => {
    const colorMap: Record<string, string> = {
      BOOKED: 'blue',
      CHECKED_IN: 'cyan',
      COMPLETED: 'green',
      CANCELLED: 'red',
      NO_SHOW: 'orange'
    }
    const textMap: Record<string, string> = {
      BOOKED: '已预约',
      CHECKED_IN: '已签到',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
      NO_SHOW: '未到场'
    }
    return <Tag color={colorMap[status] || 'default'}>{textMap[status] || status}</Tag>
  }

  const getTypeTag = (type: BookingType) => {
    return type === 'PRIVATE' ? <Tag color="blue">私教课</Tag> : <Tag color="green">团课</Tag>
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '预约编号', dataIndex: 'bookingNo', key: 'bookingNo' },
    {
      title: '会员',
      dataIndex: 'memberId',
      key: 'memberId',
      render: (memberId: number) => members.find((m) => m.id === memberId)?.name || memberId
    },
    {
      title: '教练',
      dataIndex: 'coachId',
      key: 'coachId',
      render: (coachId: number) => {
        if (!coachId) return '-'
        const coach = coaches.find((c) => c.id === coachId)
        return coach?.coachNo || coachId
      }
    },
    { title: '类型', dataIndex: 'bookingType', key: 'bookingType', render: (type: BookingType) => getTypeTag(type) },
    { title: '预约日期', dataIndex: 'bookingDate', key: 'bookingDate' },
    { title: '开始时间', dataIndex: 'startTime', key: 'startTime' },
    { title: '结束时间', dataIndex: 'endTime', key: 'endTime' },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: BookingStatus) => getStatusTag(status) },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Booking) => (
        <Space size="small">
          {record.status === 'BOOKED' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleCheckIn(record.id)}>
                签到
              </Button>
              <Button type="link" danger size="small" icon={<CloseCircleOutlined />} onClick={() => handleCancel(record.id)}>
                取消
              </Button>
            </>
          )}
          {record.status === 'CHECKED_IN' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record.id)}>
              完成
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <Row style={{ marginBottom: 16 }} gutter={[16, 16]} align="middle">
        <Col>
          <Select
            placeholder="状态筛选"
            style={{ width: 150 }}
            allowClear
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
          >
            <Select.Option value="BOOKED">已预约</Select.Option>
            <Select.Option value="CHECKED_IN">已签到</Select.Option>
            <Select.Option value="COMPLETED">已完成</Select.Option>
            <Select.Option value="CANCELLED">已取消</Select.Option>
            <Select.Option value="NO_SHOW">未到场</Select.Option>
          </Select>
        </Col>
        <Col>
          <DatePicker.RangePicker
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                setFilters({
                  ...filters,
                  startDate: dates[0].format('YYYY-MM-DD'),
                  endDate: dates[1].format('YYYY-MM-DD')
                })
              } else {
                setFilters({ ...filters, startDate: undefined, endDate: undefined })
              }
            }}
          />
        </Col>
        <Col flex="auto" style={{ textAlign: 'right' }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增预约
          </Button>
        </Col>
      </Row>

      <Table columns={columns} dataSource={bookings} rowKey="id" loading={loading} />

      <Modal
        title={editingBooking ? '编辑预约' : '新增预约'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="memberId" label="会员" rules={[{ required: true, message: '请选择会员' }]}>
            <Select placeholder="请选择会员">
              {members.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} ({m.memberNo})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="bookingType" label="预约类型" rules={[{ required: true, message: '请选择预约类型' }]}>
            <Select placeholder="请选择预约类型">
              <Select.Option value="PRIVATE">私教课</Select.Option>
              <Select.Option value="GROUP">团课</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.bookingType !== curr.bookingType}>
            {({ getFieldValue }) => {
              const type = getFieldValue('bookingType')
              if (type === 'PRIVATE') {
                return (
                  <>
                    <Form.Item name="coachId" label="教练" rules={[{ required: true, message: '请选择教练' }]}>
                      <Select placeholder="请选择教练">
                        {coaches.map((c) => (
                          <Select.Option key={c.id} value={c.id}>
                            {c.coachNo}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item name="memberPackageId" label="课包">
                      <Select placeholder="请选择课包">
                        {memberPackages.map((p) => (
                          <Select.Option key={p.id} value={p.id}>
                            课包#{p.id} (剩余{p.remainingSessions}课时)
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </>
                )
              }
              if (type === 'GROUP') {
                return (
                  <Form.Item name="groupId" label="团课" rules={[{ required: true, message: '请选择团课' }]}>
                    <Select placeholder="请选择团课">
                      {groupClasses.map((c) => (
                        <Select.Option key={c.id} value={c.id}>
                          {c.name} ({c.classDate} {c.startTime})
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                )
              }
              return null
            }}
          </Form.Item>
          <Form.Item name="bookingDate" label="预约日期" rules={[{ required: true, message: '请选择预约日期' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="时间">
            <Space>
              <Form.Item name="startTime" noStyle rules={[{ required: true, message: '请选择开始时间' }]}>
                <TimePicker format="HH:mm" placeholder="开始时间" />
              </Form.Item>
              <Form.Item name="endTime" noStyle rules={[{ required: true, message: '请选择结束时间' }]}>
                <TimePicker format="HH:mm" placeholder="结束时间" />
              </Form.Item>
            </Space>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalOpen(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default BookingList
