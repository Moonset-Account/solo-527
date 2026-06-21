import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  DatePicker,
  TimePicker,
  Input,
  message,
  Tabs,
  Calendar,
  Badge,
  List,
  Avatar,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  CalendarOutlined,
  UnorderedListOutlined,
  PlusOutlined,
  CheckOutlined,
  CloseOutlined,
  ClockCircleOutlined,
  UserOutlined,
  EnvironmentOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons'
import {
  getAppointmentList,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  createAppointment,
  getAdvisors,
} from '../api/appointment'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const AppointmentList = () => {
  const [loading, setLoading] = useState(false)
  const [appointments, setAppointments] = useState([])
  const [viewMode, setViewMode] = useState('list')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [advisors, setAdvisors] = useState([])
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const [calendarAppointments, setCalendarAppointments] = useState([])

  useEffect(() => {
    loadAppointments()
    loadAdvisors()
  }, [statusFilter])

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const res = await getAppointmentList({ status: statusFilter })
      if (res.code === 0) {
        setAppointments(res.data.list)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAdvisors = async () => {
    const res = await getAdvisors()
    if (res.code === 0) {
      setAdvisors(res.data.data)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      '待确认': 'orange',
      '已确认': 'blue',
      '进行中': 'processing',
      '已完成': 'green',
      '已取消': 'default',
    }
    return colors[status] || 'default'
  }

  const handleConfirm = async (record) => {
    Modal.confirm({
      title: '确认预约',
      content: `确定要确认 ${record.memberName} 的 ${record.treatmentName} 预约吗？`,
      onOk: async () => {
        const res = await confirmAppointment(record.id)
        if (res.code === 0) {
          message.success('预约已确认')
          loadAppointments()
        }
      },
    })
  }

  const handleComplete = async (record) => {
    Modal.confirm({
      title: '完成预约',
      content: `确定要将 ${record.memberName} 的 ${record.treatmentName} 标记为已完成吗？`,
      onOk: async () => {
        const res = await completeAppointment(record.id)
        if (res.code === 0) {
          message.success('预约已完成')
          loadAppointments()
        }
      },
    })
  }

  const handleCancel = async (record) => {
    Modal.confirm({
      title: '取消预约',
      content: `确定要取消 ${record.memberName} 的 ${record.treatmentName} 预约吗？`,
      okType: 'danger',
      onOk: async () => {
        const res = await cancelAppointment(record.id)
        if (res.code === 0) {
          message.success('预约已取消')
          loadAppointments()
        }
      },
    })
  }

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      await createAppointment(values)
      message.success('预约创建成功')
      setModalVisible(false)
      loadAppointments()
    } catch (err) {
      console.error(err)
    }
  }

  const columns = [
    {
      title: '会员信息',
      dataIndex: 'memberName',
      key: 'memberName',
      render: (text, record) => (
        <Space>
          <Avatar size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <div style={{ color: '#999', fontSize: 12 }}>{record.memberPhone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '疗程项目',
      dataIndex: 'treatmentName',
      key: 'treatmentName',
    },
    {
      title: '预约时间',
      key: 'time',
      render: (_, record) => (
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: 4, color: '#999' }} />
            {record.date}
          </div>
          <div style={{ color: '#999', fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {record.time}
          </div>
        </div>
      ),
    },
    {
      title: '顾问',
      dataIndex: 'advisor',
      key: 'advisor',
    },
    {
      title: '房间',
      dataIndex: 'room',
      key: 'room',
      render: (room) => (
        <span>
          <EnvironmentOutlined style={{ marginRight: 4 }} />
          {room}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag color={getStatusColor(status)}>{status}</Tag>,
      filters: [
        { text: '待确认', value: '待确认' },
        { text: '已确认', value: '已确认' },
        { text: '进行中', value: '进行中' },
        { text: '已完成', value: '已完成' },
        { text: '已取消', value: '已取消' },
      ],
      onFilter: (value) => {
        setStatusFilter(value)
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === '待确认' && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                onClick={() => handleConfirm(record)}
              >
                确认
              </Button>
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            </>
          )}
          {record.status === '已确认' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleComplete(record)}
              >
                开始
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleCancel(record)}
              >
                取消
              </Button>
            </>
          )}
          {record.status === '进行中' && (
            <Button
              type="primary"
              size="small"
              onClick={() => handleComplete(record)}
            >
              完成
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const dateCellRender = (value) => {
    const dayAppointments = appointments.filter(
      (item) => dayjs(item.date).isSame(value, 'day')
    )
    return (
      <ul className="appointments" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {dayAppointments.slice(0, 3).map((item) => (
          <li key={item.id} style={{ fontSize: 12, padding: '2px 0' }}>
            <Badge
              color={
                item.status === '已完成'
                  ? 'green'
                  : item.status === '待确认'
                  ? 'orange'
                  : item.status === '已取消'
                  ? 'default'
                  : 'blue'
              }
              text={item.treatmentName}
            />
          </li>
        ))}
        {dayAppointments.length > 3 && (
          <li style={{ fontSize: 12, color: '#999' }}>
            +{dayAppointments.length - 3} 更多
          </li>
        )}
      </ul>
    )
  }

  const stats = [
    { title: '今日预约', value: 12, color: '#1890ff', icon: <CalendarOutlined /> },
    { title: '待确认', value: 3, color: '#faad14', icon: <ClockCircleOutlined /> },
    { title: '进行中', value: 2, color: '#52c41a', icon: <AppstoreAddOutlined /> },
    { title: '已完成', value: 5, color: '#722ed1', icon: <CheckOutlined /> },
  ]

  const listView = (
    <Card>
      <Table
        columns={columns}
        dataSource={appointments}
        rowKey="id"
        loading={loading}
        pagination={{
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
      />
    </Card>
  )

  const calendarView = (
    <Card>
      <Calendar dateCellRender={dateCellRender} />
      <div style={{ marginTop: 16 }}>
        <h3>
          <CalendarOutlined style={{ marginRight: 8 }} />
          {selectedDate.format('YYYY年MM月DD日')} 预约安排
        </h3>
        <List
          dataSource={appointments.filter((item) =>
            dayjs(item.date).isSame(selectedDate, 'day')
          )}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Tag color={getStatusColor(item.status)} key="status">
                  {item.status}
                </Tag>,
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={item.treatmentName}
                description={
                  <span>
                    {item.memberName} · {item.time} · {item.advisor}
                  </span>
                }
              />
            </List.Item>
          )}
        />
      </div>
    </Card>
  )

  const tabItems = [
    {
      key: 'list',
      label: (
        <span>
          <UnorderedListOutlined />
          列表视图
        </span>
      ),
      children: listView,
    },
    {
      key: 'calendar',
      label: (
        <span>
          <CalendarOutlined />
          日历视图
        </span>
      ),
      children: calendarView,
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {stats.map((stat, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card
        title="预约管理"
        extra={
          <Space>
            <Select
              placeholder="状态筛选"
              value={statusFilter || undefined}
              onChange={(value) => setStatusFilter(value)}
              style={{ width: 120 }}
              allowClear
            >
              <Option value="待确认">待确认</Option>
              <Option value="已确认">已确认</Option>
              <Option value="进行中">进行中</Option>
              <Option value="已完成">已完成</Option>
              <Option value="已取消">已取消</Option>
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增预约
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={viewMode}
          onChange={setViewMode}
          items={tabItems}
        />
      </Card>

      <Modal
        title="新增预约"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="memberName"
                label="会员姓名"
                rules={[{ required: true, message: '请输入会员姓名' }]}
              >
                <Input placeholder="请输入会员姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="memberPhone"
                label="会员电话"
                rules={[{ required: true, message: '请输入会员电话' }]}
              >
                <Input placeholder="请输入会员电话" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="treatmentName"
                label="疗程项目"
                rules={[{ required: true, message: '请选择疗程项目' }]}
              >
                <Select placeholder="请选择疗程项目">
                  <Option value="水光针护理">水光针护理</Option>
                  <Option value="面部清洁套餐">面部清洁套餐</Option>
                  <Option value="热玛吉抗衰">热玛吉抗衰</Option>
                  <Option value="光子嫩肤">光子嫩肤</Option>
                  <Option value="背部刮痧">背部刮痧</Option>
                  <Option value="精油SPA">精油SPA</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="advisorId"
                label="顾问"
                rules={[{ required: true, message: '请选择顾问' }]}
              >
                <Select placeholder="请选择顾问">
                  {advisors.map((advisor) => (
                    <Option key={advisor.id} value={advisor.id}>
                      {advisor.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="预约日期"
                rules={[{ required: true, message: '请选择预约日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="time"
                label="预约时间"
                rules={[{ required: true, message: '请选择预约时间' }]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default AppointmentList
