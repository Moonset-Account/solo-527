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
import { getMemberList, addMember, updateMember } from '../api/member'

const { Option } = Select

const MemberList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [total, setTotal] = useState(0)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [searchName, setSearchName] = useState('')
  const [searchPhone, setSearchPhone] = useState('')
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
      const res = await getMemberList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        name: searchName,
        phone: searchPhone,
        level: searchLevel,
      })
      if (res.code === 0) {
        setMembers(res.data.list)
        setTotal(res.data.total)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadMembers()
  }

  const handleReset = () => {
    setSearchName('')
    setSearchPhone('')
    setSearchLevel('')
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadMembers()
  }

  const handleAdd = () => {
    setEditingMember(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingMember(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleView = (record) => {
    navigate(`/admin/members/${record.id}`)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingMember) {
        await updateMember(editingMember.id, values)
        message.success('编辑成功')
      } else {
        await addMember(values)
        message.success('添加成功')
      }
      setModalVisible(false)
      loadMembers()
    } catch (err) {
      console.error(err)
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

  const columns = [
    {
      title: '会员信息',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.avatar} size={40} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
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
        { text: '钻石会员', value: '钻石会员' },
        { text: '金牌会员', value: '金牌会员' },
        { text: '银牌会员', value: '银牌会员' },
        { text: '普通会员', value: '普通会员' },
      ],
    },
    {
      title: '账户余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <span style={{ color: '#f5222d', fontWeight: 500 }}>¥{balance}</span>
      ),
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      title: '累计消费',
      dataIndex: 'totalConsumption',
      key: 'totalConsumption',
      render: (amount) => <span>¥{amount}</span>,
      sorter: (a, b) => a.totalConsumption - b.totalConsumption,
    },
    {
      title: '注册日期',
      dataIndex: 'registerDate',
      key: 'registerDate',
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

  const stats = [
    { title: '会员总数', value: 1286, icon: <TeamOutlined />, color: '#1890ff' },
    { title: '本月新增', value: 68, icon: <UserOutlined />, color: '#52c41a' },
    { title: '活跃会员', value: 856, icon: <RiseOutlined />, color: '#faad14' },
    { title: '储值总额', value: 358600, prefix: '¥', icon: <DollarOutlined />, color: '#722ed1' },
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
                suffix={stat.prefix || ''}
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
              placeholder="姓名"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              style={{ width: 150 }}
              prefix={<UserOutlined />}
            />
            <Input
              placeholder="手机号"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              style={{ width: 180 }}
            />
            <Select
              placeholder="会员等级"
              value={searchLevel || undefined}
              onChange={setSearchLevel}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="钻石会员">钻石会员</Option>
              <Option value="金牌会员">金牌会员</Option>
              <Option value="银牌会员">银牌会员</Option>
              <Option value="普通会员">普通会员</Option>
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
            showTotal: (total) => `共 ${total} 条`,
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
                  <Option value="普通会员">普通会员</Option>
                  <Option value="银牌会员">银牌会员</Option>
                  <Option value="金牌会员">金牌会员</Option>
                  <Option value="钻石会员">钻石会员</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birthday" label="生日">
                <Input placeholder="请输入生日" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="address" label="地址">
                <Input placeholder="请输入地址" />
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
