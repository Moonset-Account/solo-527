import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Space, Button, Modal, Form, Input, Select, DatePicker, Descriptions, Statistic, Badge, Tooltip } from 'antd'
import { UserOutlined, PhoneOutlined, PlusOutlined, SearchOutlined, TeamOutlined, UserAddOutlined, MedicineBoxOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getPatients, getPatient, createPatient } from '../services/api'

const { Option } = Select

const clinics = [
  { id: 1, name: '总院口腔诊所' },
  { id: 2, name: '海淀分院' },
  { id: 3, name: '西城分院' }
]

const statusMap = {
  1: { color: 'green', text: '活跃' },
  2: { color: 'default', text: '不活跃' },
  3: { color: 'red', text: '已流失' }
}

const PatientList = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [searchText, setSearchText] = useState('')
  const [clinicFilter, setClinicFilter] = useState(null)
  const [statusFilter, setStatusFilter] = useState(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [patientDetail, setPatientDetail] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, lost: 0, newThisMonth: 0 })
  const [form] = Form.useForm()

  const fetchPatients = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        page,
        pageSize,
        ...(searchText && { search: searchText }),
        ...(clinicFilter && { clinicId: clinicFilter }),
        ...(statusFilter && { status: statusFilter })
      }
      const res = await getPatients(params)
      const data = res.data
      setPatients(data.items || [])
      setPagination({ current: page, pageSize, total: data.total || 0 })
      const items = data.items || []
      setStats({
        total: data.total || 0,
        active: items.filter(p => p.status === 1).length,
        lost: items.filter(p => p.status === 3).length,
        newThisMonth: items.filter(p => dayjs(p.createdAt).isSame(dayjs(), 'month')).length
      })
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [clinicFilter, statusFilter])

  const handleSearch = () => {
    fetchPatients(1, pagination.pageSize)
  }

  const handleTableChange = (pag) => {
    fetchPatients(pag.current, pag.pageSize)
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        birthDate: values.birthDate ? values.birthDate.format('YYYY-MM-DD') : undefined
      }
      await createPatient(data)
      setCreateModalVisible(false)
      form.resetFields()
      fetchPatients(1, pagination.pageSize)
    } catch {}
  }

  const openDetail = async (record) => {
    setDetailModalVisible(true)
    setDetailLoading(true)
    try {
      const res = await getPatient(record.id)
      setPatientDetail(res.data)
    } catch {
      setPatientDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const getClinicName = (clinicId) => {
    const clinic = clinics.find(c => c.id === clinicId)
    return clinic ? clinic.name : '-'
  }

  const columns = [
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <UserOutlined style={{ color: '#1890ff' }} />
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Space>
      )
    },
    {
      title: '性别',
      dataIndex: 'gender',
      key: 'gender',
      width: 80,
      render: (gender) => <Tag color={gender === '男' ? 'blue' : 'pink'}>{gender}</Tag>
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          <span>{phone}</span>
        </Space>
      )
    },
    {
      title: '所属诊所',
      dataIndex: 'clinicId',
      key: 'clinicId',
      render: (clinicId) => <Tag color="cyan">{getClinicName(clinicId)}</Tag>
    },
    {
      title: '状态',
      key: 'status',
      dataIndex: 'status',
      render: (status) => {
        const s = statusMap[status]
        return s ? <Badge status={s.color === 'green' ? 'success' : s.color === 'red' ? 'error' : 'default'} text={<Tag color={s.color}>{s.text}</Tag>} /> : '-'
      }
    },
    {
      title: '最近就诊',
      key: 'lastVisitDate',
      render: (_, record) => {
        const lastVisit = record.lastVisitDate || record.createdAt
        return lastVisit ? dayjs(lastVisit).format('YYYY-MM-DD') : '-'
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? dayjs(date).format('YYYY-MM-DD') : '-'
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<SearchOutlined />} onClick={() => openDetail(record)}>
          详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="患者总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="活跃患者"
              value={stats.active}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已流失"
              value={stats.lost}
              prefix={<UserAddOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月新增"
              value={stats.newThisMonth}
              prefix={<MedicineBoxOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索姓名/手机号"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 220 }}
            allowClear
          />
          <Select
            placeholder="全部诊所"
            value={clinicFilter}
            onChange={setClinicFilter}
            style={{ width: 160 }}
            allowClear
          >
            {clinics.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
          </Select>
          <Select
            placeholder="全部状态"
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 130 }}
            allowClear
          >
            <Option value={1}>活跃</Option>
            <Option value={2}>不活跃</Option>
            <Option value={3}>已流失</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={() => { setSearchText(''); setClinicFilter(null); setStatusFilter(null); fetchPatients(1, pagination.pageSize) }}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新增患者</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={patients}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined />新增患者</Space>}
        open={createModalVisible}
        onOk={handleCreate}
        onCancel={() => { setCreateModalVisible(false); form.resetFields() }}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical" initialValues={{ gender: '男' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入患者姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="gender" label="性别" rules={[{ required: true, message: '请选择性别' }]}>
                <Select>
                  <Option value="男">男</Option>
                  <Option value="女">女</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="birthDate" label="出生日期">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="clinicId" label="所属诊所" rules={[{ required: true, message: '请选择诊所' }]}>
                <Select placeholder="请选择诊所">
                  {clinics.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="idCard" label="身份证号">
                <Input placeholder="请输入身份证号" maxLength={18} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={<Space><UserOutlined />患者详情</Space>}
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setPatientDetail(null) }}
        footer={<Button onClick={() => { setDetailModalVisible(false); setPatientDetail(null) }}>关闭</Button>}
        width={720}
        loading={detailLoading}
      >
        {patientDetail && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions bordered column={2} size="small" title="基本信息">
              <Descriptions.Item label="姓名">{patientDetail.name}</Descriptions.Item>
              <Descriptions.Item label="性别"><Tag color={patientDetail.gender === '男' ? 'blue' : 'pink'}>{patientDetail.gender}</Tag></Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space><PhoneOutlined />{patientDetail.phone}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="出生日期">{patientDetail.birthDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="身份证号">{patientDetail.idCard || '-'}</Descriptions.Item>
              <Descriptions.Item label="所属诊所"><Tag color="cyan">{getClinicName(patientDetail.clinicId)}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => { const s = statusMap[patientDetail.status]; return s ? <Tag color={s.color}>{s.text}</Tag> : '-' })()}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">{patientDetail.createdAt ? dayjs(patientDetail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            <Card size="small" title="近期预约" extra={<Tooltip title="最近5条预约记录"><SearchOutlined /></Tooltip>}>
              {patientDetail.recentAppointments && patientDetail.recentAppointments.length > 0 ? (
                <Table
                  size="small"
                  dataSource={patientDetail.recentAppointments}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '预约日期', dataIndex: 'appointmentDate', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
                    { title: '医生', dataIndex: 'doctorName' },
                    { title: '类型', dataIndex: 'appointmentType', render: (v) => <Tag color="blue">{v}</Tag> },
                    { title: '状态', dataIndex: 'status', render: (v) => <Tag color={v === '已完成' ? 'green' : v === '已取消' ? 'default' : 'gold'}>{v}</Tag> }
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 16 }}>暂无预约记录</div>
              )}
            </Card>

            <Card size="small" title="主诉记录" extra={<Tooltip title="最近5条主诉"><MedicineBoxOutlined /></Tooltip>}>
              {patientDetail.chiefComplaints && patientDetail.chiefComplaints.length > 0 ? (
                <Table
                  size="small"
                  dataSource={patientDetail.chiefComplaints}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '日期', dataIndex: 'createdAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
                    { title: '主诉内容', dataIndex: 'content', ellipsis: true },
                    { title: '诊断', dataIndex: 'diagnosis', ellipsis: true }
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 16 }}>暂无主诉记录</div>
              )}
            </Card>

            <Card size="small" title="处方记录" extra={<Tooltip title="最近5条处方"><MedicineBoxOutlined /></Tooltip>}>
              {patientDetail.prescriptions && patientDetail.prescriptions.length > 0 ? (
                <Table
                  size="small"
                  dataSource={patientDetail.prescriptions}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: '日期', dataIndex: 'createdAt', render: (v) => v ? dayjs(v).format('YYYY-MM-DD') : '-' },
                    { title: '处方内容', dataIndex: 'content', ellipsis: true },
                    { title: '医生', dataIndex: 'doctorName' }
                  ]}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#8c8c8c', padding: 16 }}>暂无处方记录</div>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default PatientList