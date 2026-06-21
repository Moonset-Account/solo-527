
import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Tag,
  Avatar,
  Space,
  Modal,
  Form,
  message,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  TeamOutlined,
  RiseOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getMembers, createMember, updateMember } from '../api/members'
import dayjs from 'dayjs'

const { Option } = Select

const MemberList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [statsTotal, setStatsTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchKeyword, setSearchKeyword] = useState('')
  const [searchLevel, setSearchLevel] = useState('')
  const [modalVisible, setModalVisible] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadMembers()
  }, [pagination.current, pagination.pageSize])

  const loadMembers = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
      }
      if (searchKeyword) {
        params.keyword = searchKeyword
      }
      if (searchLevel) {
        params.level = searchLevel
      }
      const res = await getMembers(params)
      if (res.success) {
        setMembers(res.data.list || [])
        setTotal(res.data.total || 0)
        if (pagination.current === 1) {
          setStatsTotal(res.data.total || 0)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(loadMembers, 0)
  }

  const handleReset = () => {
    setSearchKeyword('')
    setSearchLevel('')
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(loadMembers, 0)
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingMember(record)
    form.setFieldsValue({
      name: record.name,
      phone: record.phone,
      level: record.level,
      gender: record.gender,
      birthday: record.birthday ? dayjs(record.birthday).format('YYYY-MM-DD') : undefined,
      remark: record.remark,
    })
    setModalVisible(true)
  }

  const handleView = (record) => {
    navigate(`/admin/members/${record.id}`)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const payload = { ...values }
      if (values.birthday) {
        payload.birthday = dayjs(values.birthday).toISOString()
      }
      if (editingMember) {
        const res = await updateMember(editingMember.id, payload)
        if (res.success) {
          message.success('编辑成功')
          setModalVisible(false)
          loadMembers()
        }
      } else {
        const res = await createMember(payload)
        if (res.success) {
          message.success('添加成功')
          setModalVisible(false)
          loadMembers()
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const getLevelColor = (level) => {
    const colors = {
      'VIP': 'purple',
      '钻石': 'purple',
      '钻石会员': 'purple',
      '金卡': 'gold',
      '金牌会员': 'gold',
      '银卡': 'default',
      '银牌会员': 'default',
      '普通': 'blue',
      '普通会员': 'blue',
    }
    return colors[level] || 'default'
  }

  const columns = [
    {
      title: '会员信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>
              {text}
              {record.memberNo && <span style={{ color: '#999', marginLeft: 8, fontSize: 12 }}>({record.memberNo})</span>}
            </div>
            <div style={{ color: '#999', fontSize: 12 }}>{record.phone}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '会员等级',
      dataIndex: 'level',
      key: 'level',
      render: (level) => <Tag color={getLevelColor(level)}>{level}</Tag>,
      filters: [
        { text: 'VIP/钻石', value: 'VIP' },
        { text: '金卡/金牌', value: '金卡' },
        { text: '银卡/银牌', value: '银卡' },
        { text: '普通', value: '普通' },
      ],
    },
    {
      title: '累计消费',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount) => <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{Number(amount || 0).toFixed(2)}</span>,
      sorter: (a, b) => Number(a.totalSpent || 0) - Number(b.totalSpent || 0),
    },
    {
      title: '上次到店',
      dataIndex: 'lastVisitAt',
      key: 'lastVisitAt',
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD') : '未到店',
    },
    {
      title: '注册日期',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (t) => t ? dayjs(t).format('YYYY-MM-DD') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
        </Space>
      ),
    },
  ]

  const activeMonthMembers = members.filter(m => {
    if (!m.lastVisitAt) return false
    return dayjs(m.lastVisitAt).isAfter(dayjs().subtract(30, 'day'))
  }).length

  const stats = [
    { title: '会员总数', value: statsTotal, icon: <TeamOutlined />, color: '#1890ff' },
    { title: '本页活跃', value: activeMonthMembers, icon: <RiseOutlined />, color: '#faad14' },
    {
      title: '累计消费总额',
      value: members.reduce((s, m) => s + Number(m.totalSpent || 0), 0),
      prefix: '¥',
      precision: 2,
      icon: <DollarOutlined />,
      color: '#722ed1',
    },
  ]

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={8} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.icon}
                suffix={stat.suffix || ''}
                precision={stat.precision}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <div
          style={{
            marginBottom: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <h2 style={{ margin: 0 }}>会员列表</h2>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增会员
          </Button>
        </div>

        <Card type="inner" style={{ marginBottom: 16 }}>
          <Space wrap>
            <Input
              placeholder="姓名 / 手机号 / 会员号"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              style={{ width: 240 }}
              prefix={<UserOutlined />}
              onPressEnter={handleSearch}
              allowClear
            />
            <Select
              placeholder="会员等级"
              value={searchLevel || undefined}
              onChange={setSearchLevel}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="VIP">VIP/钻石</Option>
              <Option value="金卡">金卡/金牌</Option>
              <Option value="银卡">银卡/银牌</Option>
              <Option value="普通">普通</Option>
            </Select>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
              搜索
            </Button>
            <Button onClick={handleReset}>重置</Button>
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          onChange={(page) =>
            setPagination({
              current: page.current,
              pageSize: page.pageSize,
            })
          }
        />
      </Card>

      <Modal
        title={editingMember ? '编辑会员' : '新增会员'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="姓名"
                rules={[{ required: true, message: '请输入姓名' }]}
              >
                <Input placeholder="请输入姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="phone"
                label="手机号"
                rules={[
                  { required: true, message: '请输入手机号' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
                ]}
              >
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="level"
                label="会员等级"
                rules={[{ required: true, message: '请选择会员等级' }]}
              >
                <Select placeholder="请选择会员等级">
                  <Option value="普通">普通</Option>
                  <Option value="银卡">银卡</Option>
                  <Option value="金卡">金卡</Option>
                  <Option value="VIP">VIP</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别">
                <Select placeholder="请选择性别" allowClear>
                  <Option value="女">女</Option>
                  <Option value="男">男</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birthday" label="生日">
                <Input placeholder="YYYY-MM-DD" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default MemberList
