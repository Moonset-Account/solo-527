import { useState, useEffect } from 'react'
import {
  Card,
  Input,
  Button,
  Avatar,
  Tag,
  List,
  Select,
  DatePicker,
  TimePicker,
  Statistic,
  Divider,
  message,
  Modal,
  Badge,
  Empty,
  Row,
  Col,
} from 'antd'
import {
  SearchOutlined,
  ShoppingCartOutlined,
  PlusOutlined,
  MinusOutlined,
  DeleteOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
} from '@ant-design/icons'
import { getMembers } from '../api/members'
import { getTreatments } from '../api/treatments'
import { getConsultants } from '../api/consultants'
import { createAppointment } from '../api/appointments'
import { getRemainingCount } from '../api/memberTreatments'
import dayjs from 'dayjs'

const { Search } = Input
const { Option } = Select

const Cashier = () => {
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [cart, setCart] = useState([])
  const [advisors, setAdvisors] = useState([])
  const [selectedAdvisor, setSelectedAdvisor] = useState(null)
  const [appointmentDate, setAppointmentDate] = useState(dayjs())
  const [appointmentTime, setAppointmentTime] = useState(null)
  const [searching, setSearching] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [memberTreatments, setMemberTreatments] = useState([])

  useEffect(() => {
    loadTreatments()
    loadAdvisors()
  }, [])

  const loadTreatments = async () => {
    const res = await getTreatments({ pageSize: 100 })
    if (res.success === true) {
      setTreatments(res.data.list)
    }
  }

  const loadAdvisors = async () => {
    const res = await getConsultants({ pageSize: 100 })
    if (res.success) {
      setAdvisors(res.data.list)
    }
  }

  const handleSearch = async (value) => {
    if (!value.trim()) {
      setSearchResults([])
      return
    }
    setSearching(true)
    try {
      const res = await getMembers({ keyword: value, pageSize: 20 })
      if (res.success) {
        setSearchResults(res.data.list)
        setShowMemberModal(true)
      }
    } finally {
      setSearching(false)
    }
  }

  const handleSelectMember = async (member) => {
    setSelectedMember(member)
    setShowMemberModal(false)
    setSearchKeyword('')
    setSearchResults([])
    try {
      const res = await getRemainingCount(member.id)
      if (res.success) {
        setMemberTreatments(res.data.list || [])
      }
    } catch {
      setMemberTreatments([])
    }
  }

  const handleAddToCart = (treatment) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === treatment.id)
      if (existing) {
        return prev.map((item) =>
          item.id === treatment.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { ...treatment, quantity: 1 }]
    })
    message.success(`已添加 ${treatment.name} 到购物车`)
  }

  const handleUpdateQuantity = (id, delta) => {
    setCart((prev) => {
      return prev
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    })
  }

  const handleRemoveFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id))
  }

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    if (!selectedMember) {
      message.warning('请先选择会员')
      return
    }
    if (cart.length === 0) {
      message.warning('请选择疗程')
      return
    }
    if (!selectedAdvisor) {
      message.warning('请选择顾问')
      return
    }
    if (!appointmentTime) {
      message.warning('请选择预约时间')
      return
    }
    setShowConfirmModal(true)
  }

  const handleConfirmAppointment = async () => {
    try {
      await createAppointment({
        memberId: selectedMember.id,
        consultantId: selectedAdvisor,
        appointmentDate: appointmentDate.format('YYYY-MM-DD'),
        startTime: appointmentTime.format('HH:mm'),
        endTime: appointmentTime.add(1, 'hour').format('HH:mm'),
        totalAmount: totalPrice,
        items: cart.map(c => ({
          treatmentId: c.id,
          quantity: c.quantity,
          unitPrice: c.price,
          subtotal: c.price * c.quantity,
        })),
      })
      message.success('预约成功')
      setShowConfirmModal(false)
      setCart([])
      setSelectedAdvisor(null)
      setAppointmentTime(null)
    } catch (err) {
      message.error('预约失败')
    }
  }

  const getLevelColor = (level) => {
    const colors = {
      '钻石会员': 'purple',
      '金牌会员': 'gold',
      '银牌会员': 'default',
      '普通会员': 'blue',
    }
    return colors[level] || 'default'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Card style={{ marginBottom: 16 }}>
        <Search
          placeholder="搜索会员（手机号/姓名）"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          loading={searching}
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />
      </Card>

      <div
        style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          minHeight: 0,
        }}
      >
        <div style={{ width: 280, flexShrink: 0 }}>
          <Card
            title="会员信息"
            extra={
              selectedMember && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => setSelectedMember(null)}
                >
                  更换
                </Button>
              )
            }
            style={{ height: '100%', overflow: 'auto' }}
          >
            {selectedMember ? (
              <div style={{ textAlign: 'center' }}>
                <Avatar size={80} src={selectedMember.avatar} />
                <h3 style={{ marginTop: 12, marginBottom: 4 }}>
                  {selectedMember.name}
                </h3>
                <Tag color={getLevelColor(selectedMember.level)}>
                  {selectedMember.level}
                </Tag>
                <Divider />
                <List size="small">
                  <List.Item>
                    <span style={{ color: '#999' }}>
                      <PhoneOutlined style={{ marginRight: 8 }} />
                      手机号
                    </span>
                    <span>{selectedMember.phone}</span>
                  </List.Item>
                  <List.Item>
                    <span style={{ color: '#999' }}>
                      <UserOutlined style={{ marginRight: 8 }} />
                      累计消费
                    </span>
                    <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                      ¥{selectedMember.totalSpent}
                    </span>
                  </List.Item>
                </List>
                {memberTreatments.length > 0 && (
                  <>
                    <Divider>疗程剩余次数</Divider>
                    <List size="small" dataSource={memberTreatments}
                      renderItem={(mt) => (
                        <List.Item>
                          <span style={{ color: '#666', fontSize: 12 }}>
                            {mt.treatment?.name || '未知疗程'}
                          </span>
                          <Tag color={mt.remainingSessions > 0 ? 'blue' : 'red'}>
                            剩余 {mt.remainingSessions}/{mt.totalSessions} 次
                          </Tag>
                        </List.Item>
                      )}
                    />
                  </>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <UserAddOutlined
                  style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 12 }}
                />
                <p style={{ color: '#999' }}>请搜索并选择会员</p>
              </div>
            )}
          </Card>
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: 'auto' }}>
          <Card title="选择疗程" style={{ height: '100%' }}>
            <Row gutter={[16, 16]}>
              {treatments.map((treatment) => (
                <Col xs={24} sm={12} md={8} lg={8} xl={6} key={treatment.id}>
                  <Badge.Ribbon
                    text={`${treatment.totalSessions}次`}
                    color="blue"
                  >
                    <Card
                      hoverable
                      cover={
                        <img
                          alt={treatment.name}
                          src={treatment.image}
                          style={{ height: 140, objectFit: 'cover' }}
                        />
                      }
                      actions={[
                        <Button
                          type="primary"
                          icon={<PlusOutlined />}
                          onClick={() => handleAddToCart(treatment)}
                          block
                        >
                          加入
                        </Button>,
                      ]}
                    >
                      <Card.Meta
                        title={treatment.name}
                        description={
                          <div>
                            <div
                              style={{
                                color: '#f5222d',
                                fontSize: 18,
                                fontWeight: 'bold',
                              }}
                            >
                              ¥{treatment.price}
                            </div>
                            <div style={{ color: '#999', fontSize: 12 }}>
                              {treatment.duration}分钟 · {treatment.category}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Badge.Ribbon>
                </Col>
              ))}
            </Row>
          </Card>
        </div>

        <div style={{ width: 320, flexShrink: 0 }}>
          <Card
            title={
              <span>
                <ShoppingCartOutlined style={{ marginRight: 8 }} />
                购物车
                <Badge
                  count={totalCount}
                  style={{ marginLeft: 8 }}
                  color="#f5222d"
                />
              </span>
            }
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}
          >
            {cart.length > 0 ? (
              <List
                size="small"
                dataSource={cart}
                style={{ flex: 1 }}
                renderItem={(item) => (
                  <List.Item
                    actions={[
                      <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleRemoveFromCart(item.id)}
                      />,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar shape="square" size={48} src={item.image} />
                      }
                      title={item.name}
                      description={
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#f5222d' }}>¥{item.price}</span>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Button
                              size="small"
                              icon={<MinusOutlined />}
                              onClick={() => handleUpdateQuantity(item.id, -1)}
                              style={{ padding: '0 4px' }}
                            />
                            <span style={{ padding: '0 8px' }}>{item.quantity}</span>
                            <Button
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => handleUpdateQuantity(item.id, 1)}
                              style={{ padding: '0 4px' }}
                            />
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                description="购物车是空的"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
              />
            )}

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <div style={{ marginBottom: 8 }}>选择顾问</div>
              <Select
                placeholder="请选择顾问"
                value={selectedAdvisor}
                onChange={setSelectedAdvisor}
                style={{ width: '100%' }}
              >
                {advisors.map((advisor) => (
                  <Option key={advisor.id} value={advisor.id}>
                    <Avatar size={20} src={advisor.avatar} style={{ marginRight: 8 }} />
                    {advisor.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8, fontSize: 12 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  预约日期
                </div>
                <DatePicker
                  value={appointmentDate}
                  onChange={setAppointmentDate}
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8, fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  预约时间
                </div>
                <TimePicker
                  value={appointmentTime}
                  onChange={setAppointmentTime}
                  format="HH:mm"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <Statistic
              title="合计金额"
              value={totalPrice}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#f5222d', fontSize: 24 }}
              style={{ marginBottom: 12 }}
            />

            <Button
              type="primary"
              size="large"
              block
              icon={<CheckCircleOutlined />}
              onClick={handleCheckout}
              disabled={cart.length === 0}
            >
              确认预约并结算
            </Button>
          </Card>
        </div>
      </div>

      <Modal
        title="搜索会员"
        open={showMemberModal}
        onCancel={() => setShowMemberModal(false)}
        footer={null}
        width={500}
      >
        <List
          dataSource={searchResults}
          renderItem={(item) => (
            <List.Item
              style={{ cursor: 'pointer' }}
              onClick={() => handleSelectMember(item)}
              hoverable
            >
              <List.Item.Meta
                avatar={<Avatar src={item.avatar} size={48} />}
                title={
                  <span>
                    {item.name}
                    <Tag
                      color={getLevelColor(item.level)}
                      style={{ marginLeft: 8 }}
                    >
                      {item.level}
                    </Tag>
                  </span>
                }
                description={item.phone}
              />
            </List.Item>
          )}
        />
        {searchResults.length === 0 && (
          <Empty description="未找到会员" />
        )}
      </Modal>

      <Modal
        title="确认预约"
        open={showConfirmModal}
        onOk={handleConfirmAppointment}
        onCancel={() => setShowConfirmModal(false)}
        okText="确认预约"
        cancelText="取消"
      >
        <div style={{ padding: '12px 0' }}>
          <p>
            <strong>会员：</strong>
            {selectedMember?.name}
          </p>
          <p>
            <strong>疗程：</strong>
            {cart.map((item) => item.name).join('、')}
          </p>
          <p>
            <strong>顾问：</strong>
            {advisors.find((a) => a.id === selectedAdvisor)?.name}
          </p>
          <p>
            <strong>时间：</strong>
            {appointmentDate?.format('YYYY-MM-DD')}{' '}
            {appointmentTime?.format('HH:mm')}
          </p>
          <p style={{ fontSize: 18, color: '#f5222d', fontWeight: 'bold' }}>
            合计：¥{totalPrice.toFixed(2)}
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default Cashier
