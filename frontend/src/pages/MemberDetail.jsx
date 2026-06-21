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
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { getMemberDetail } from '../api/member'

const MemberDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState(null)

  useEffect(() => {
    loadMemberDetail()
  }, [id])

  const loadMemberDetail = async () => {
    setLoading(true)
    try {
      const res = await getMemberDetail(id)
      if (res.code === 0) {
        setMember(res.data)
      }
    } finally {
      setLoading(false)
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

  const getStatusColor = (status) => {
    const colors = {
      '已完成': 'green',
      '待确认': 'orange',
      '进行中': 'blue',
      '已取消': 'default',
    }
    return colors[status] || 'default'
  }

  if (!member) {
    return <Empty description="加载中..." />
  }

  const treatmentTab = (
    <List
      dataSource={member.treatments}
      loading={loading}
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button type="link" size="small" icon={<EyeOutlined />}>
              详情
            </Button>,
          ]}
        >
          <List.Item.Meta
            avatar={
              <Avatar shape="square" size={64} src={item.image} />
            }
            title={item.name}
            description={
              <div>
                <Progress
                  percent={Math.round(
                    ((item.totalCount - item.remainingCount) / item.totalCount) * 100
                  )}
                  size="small"
                  style={{ width: 200 }}
                />
                <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
                  剩余 {item.remainingCount}/{item.totalCount} 次 · 有效期至 {item.validUntil}
                </div>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )

  const appointmentTab = (
    <List
      dataSource={member.appointments}
      loading={loading}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={
              <Space>
                {item.treatmentName}
                <Tag color={getStatusColor(item.status)}>{item.status}</Tag>
              </Space>
            }
            description={
              <div>
                <span style={{ marginRight: 16 }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {item.date}
                </span>
                <span style={{ marginRight: 16 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  {item.time}
                </span>
                <span>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {item.advisor}
                </span>
              </div>
            }
          />
        </List.Item>
      )}
    />
  )

  const consumptionTab = (
    <List
      dataSource={member.consumptionRecords}
      loading={loading}
      renderItem={(item) => (
        <List.Item>
          <List.Item.Meta
            title={item.description}
            description={
              <span style={{ color: '#999' }}>
                <CalendarOutlined style={{ marginRight: 4 }} />
                {item.date}
              </span>
            }
          />
          <div
            style={{
              color: item.amount > 0 ? '#52c41a' : '#f5222d',
              fontWeight: 500,
              fontSize: 16,
            }}
          >
            {item.amount > 0 ? '+' : ''}
            {item.amount}元
          </div>
        </List.Item>
      )}
    />
  )

  const worksTab = (
    <Row gutter={[16, 16]}>
      {member.works.map((work) => (
        <Col span={8} key={work.id}>
          <Card
            hoverable
            cover={<Image alt={work.title} src={work.image} height={200} />}
          >
            <Card.Meta
              title={work.title}
              description={
                <span style={{ color: '#999' }}>
                  <CalendarOutlined style={{ marginRight: 4 }} />
                  {work.date}
                </span>
              }
            />
          </Card>
        </Col>
      ))}
    </Row>
  )

  const tabItems = [
    { key: 'treatments', label: '疗程记录', children: treatmentTab },
    { key: 'appointments', label: '预约记录', children: appointmentTab },
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

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Badge count={member.level} offset={[10, 60]}>
            <Avatar size={100} src={member.avatar} icon={<UserOutlined />} />
          </Badge>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 8px 0' }}>
              {member.name}
              <Tag color={getLevelColor(member.level)} style={{ marginLeft: 12 }}>
                {member.level}
              </Tag>
            </h2>
            <Descriptions column={3} size="small">
              <Descriptions.Item label="手机号">
                <PhoneOutlined style={{ marginRight: 4 }} />
                {member.phone}
              </Descriptions.Item>
              <Descriptions.Item label="生日">
                <CalendarOutlined style={{ marginRight: 4 }} />
                {member.birthday}
              </Descriptions.Item>
              <Descriptions.Item label="注册日期">
                {member.registerDate}
              </Descriptions.Item>
              <Descriptions.Item label="地址" span={3}>
                <EnvironmentOutlined style={{ marginRight: 4 }} />
                {member.address}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
        <Divider />
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="账户余额"
              value={member.balance}
              precision={2}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#f5222d' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="累计消费"
              value={member.totalConsumption}
              precision={2}
              suffix="元"
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="在做疗程"
              value={member.treatments?.length || 0}
              suffix="个"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="待预约次"
              value={
                member.treatments?.reduce((sum, t) => sum + t.remainingCount, 0) || 0
              }
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
