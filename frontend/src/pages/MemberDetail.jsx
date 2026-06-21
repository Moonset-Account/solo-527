
import { useState, useEffect } from 'react'
import {
  Card,
  Avatar,
  Tag,
  Tabs,
  List,
  Progress,
  Statistic,
  Row,
  Col,
  Image,
  Badge,
  Empty,
  Button,
  Space,
  Descriptions,
  Divider,
  Spin,
} from 'antd'
import {
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  EyeOutlined,
  GiftOutlined,
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getMember } from '../api/members'
import { getAppointments } from '../api/appointments'
import { getPortfolio } from '../api/portfolio'
import dayjs from 'dayjs'

const MemberDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [works, setWorks] = useState([])

  useEffect(() => {
    loadMemberDetail()
  }, [id])

  const loadMemberDetail = async () => {
    setLoading(true)
    try {
      const [memRes, aptRes, pfRes] = await Promise.all([
        getMember(id),
        getAppointments({ memberId: id, pageSize: 100 }),
        getPortfolio({ memberId: id, pageSize: 100 }),
      ])
      if (memRes.success) {
        setMember(memRes.data)
      }
      if (aptRes.success) {
        setAppointments(aptRes.data.list || [])
      }
      if (pfRes.success) {
        setWorks(pfRes.data.list || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const getLevelColor = (level) => {
    const colors = {
      'VIP': 'purple',
      '钻石': 'purple',
      '金卡': 'gold',
      '银卡': 'default',
      '银牌': 'default',
      '普通': 'blue',
    }
    return colors[level] || 'default'
  }

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      confirmed: 'blue',
      pending: 'orange',
      cancelled: 'default',
    }
    return colors[status] || 'default'
  }

  const getStatusLabel = (status) => {
    const labels = {
      completed: '已完成',
      confirmed: '已确认',
      pending: '待确认',
      cancelled: '已取消',
    }
    return labels[status] || status
  }

  if (!member && loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    )
  }

  if (!member) {
    return <Empty description="会员不存在" />
  }

  const treatments = member.memberTreatments || []
  const pendingAppointments = appointments.filter(a => a.status === 'pending' || a.status === 'confirmed')
  const totalRemaining = treatments.reduce((sum, t) => sum + (t.remainingSessions || 0), 0)

  const treatmentTab = (
    <List
      dataSource={treatments}
      locale={{ emptyText: '暂无疗程记录' }}
      renderItem={(item) => {
        const used = (item.totalSessions || 0) - (item.remainingSessions || 0)
        const percent = item.totalSessions ? Math.round((used / item.totalSessions) * 100) : 0
        return (
          <List.Item
            actions={[
              <Button type="link" size="small" icon={<EyeOutlined />}>
                详情
              </Button>,
            ]}
          >
            <List.Item.Meta
              avatar={
                <Avatar
                  shape="square"
                  size={64}
                  src={item.treatment?.image}
                  icon={<GiftOutlined />}
                />
              }
              title={item.treatment?.name || `疗程#${item.treatmentId}`}
              description={
                <div>
                  <Progress
                    percent={percent}
                    size="small"
                    style={{ width: 200 }}
                  />
                  <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                    剩余 {item.remainingSessions}/{item.totalSessions} 次
                    {item.expireDate && ` · 有效期至 ${dayjs(item.expireDate).format('YYYY-MM-DD')}`}
                    {item.purchaseDate && ` · 购买于 ${dayjs(item.purchaseDate).format('YYYY-MM-DD')}`}
                  </div>
                </div>
              }
            />
            {item.remainingSessions > 0 && dayjs(item.expireDate).diff(dayjs(), 'day') < 30 && (
              <Tag color="orange">即将到期</Tag>
            )}
            {item.remainingSessions === 0 && (
              <Tag color="red">已用完</Tag>
            )}
          </List.Item>
        )
      }}
    />
  )

  const appointmentTab = (
    <List
      dataSource={appointments}
      locale={{ emptyText: '暂无预约记录' }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                {item.items?.length
                  ? item.items.map(i => i.treatment?.name || `项目#${i.treatmentId}`).join('、')
                  : `预约#${item.id}`}
                <Tag color={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Tag>
              </Space>
            }
            description={
              <div>
                <span style={{ marginRight: 16 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {item.appointmentDate ? dayjs(item.appointmentDate).format('YYYY-MM-DD') : '-'}
                </span>
                <span style={{ marginRight: 16 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {item.startTime || '-'}
                </span>
                {item.consultant?.name && (
                  <span>
                    <UserOutlined style={{ marginRight: 4 }} />
                    {item.consultant.name}
                  </span>
                )}
              </div>
            }
          />
        </List.Item>
      )}
    />
  )

  const consumptionTab = (
    <List
      dataSource={treatments.filter(t => t.purchaseDate)}
      locale={{ emptyText: '暂无消费记录' }}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={`购买疗程：${item.treatment?.name || `疗程#${item.treatmentId}`}`}
            description={
              <span style={{ color: '#999' }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {item.purchaseDate ? dayjs(item.purchaseDate).format('YYYY-MM-DD') : '-'}
              </span>
            }
          />
          <div
            style={{
              color: '#f5222d',
              fontWeight: 500,
              fontSize: 16,
            }}
          >
            {item.pricePaid ? `-${item.pricePaid}` : `-${(item.treatment?.price || 0)}`}元
          </div>
        </List.Item>
      )}
    />
  )

  const worksTab = works.length > 0 ? (
    <Row gutter={[16, 16]}>
      {works.map((work) => (
        <Col xs={24} sm={12} md={8} key={work.id}>
          <Card
            hoverable
            cover={
              <Image
                alt={work.title}
                src={work.image}
                height={200}
                style={{ objectFit: 'cover' }}
                preview
              />
            }
          >
            <Card.Meta
              title={work.title}
              description={
                <span style={{ color: '#999' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {work.createdAt ? dayjs(work.createdAt).format('YYYY-MM-DD') : '-'}
                </span>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  ) : (
    <Empty description="暂无作品记录" style={{ padding: '40px 0' }} />
  )

  const tabItems = [
    { key: 'treatments', label: '疗程记录', children: treatmentTab },
    { key: 'appointments', label: `预约记录${pendingAppointments.length ? ` (待${pendingAppointments.length})` : ''}`, children: appointmentTab },
    { key: 'consumption', label: '消费记录', children: consumptionTab },
    { key: 'works', label: '作品展示', children: worksTab },
  ]

  return (
    <div>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/admin/members')}
        style={{ marginBottom: 16 }}
      >
        返回列表
      </Button>

      <Card style={{ marginBottom: 16 }} loading={loading}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <Badge count={member.level} offset={[10, 60]}>
            <Avatar size={100} src={member.avatar} icon={<UserOutlined />} />
          </Badge>
          <div style={{ flex: 1, minWidth: 300 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>
              {member.name}
              <Tag color={getLevelColor(member.level)} style={{ marginLeft: 12 }}>
                {member.level}
              </Tag>
              {member.gender && (
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  {member.gender}
                </Tag>
              )}
              {member.status === 'inactive' && (
                <Tag color="default" style={{ marginLeft: 8 }}>已停用</Tag>
              )}
            </h2>
            <Descriptions column={2} size="small" style={{ marginTop: 12 }}>
              <Descriptions.Item label="手机号">
                <PhoneOutlined style={{ marginRight: 4 }} />
                {member.phone}
              </Descriptions.Item>
              <Descriptions.Item label="会员编号">
                {member.memberNo || `-`}
              </Descriptions.Item>
              <Descriptions.Item label="生日">
                <CalendarOutlined style={{ marginRight: 4 }} />
                {member.birthday ? dayjs(member.birthday).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="注册日期">
                {member.createdAt ? dayjs(member.createdAt).format('YYYY-MM-DD') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="上次到店" span={2}>
                {member.lastVisitAt ? dayjs(member.lastVisitAt).format('YYYY-MM-DD HH:mm') : '尚未到店'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
        <Divider />
        <Row gutter={16}>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="累计消费"
              value={member.totalSpent || 0}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="累计次数"
              value={treatments.reduce((s, t) => s + (t.totalSessions || 0), 0)}
              suffix="次"
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="在做疗程"
              value={treatments.length}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={12} md={6}>
            <Statistic
              title="待预约次"
              value={totalRemaining}
              suffix="次"
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
        </Row>
        {member.remark && (
          <>
            <Divider />
            <div>
              <span style={{ color: '#999' }}>备注：</span>
              {member.remark}
            </div>
          </>
        )}
      </Card>

      <Card>
        <Tabs defaultActiveKey="treatments" items={tabItems} />
      </Card>
    </div>
  )
}

export default MemberDetail
