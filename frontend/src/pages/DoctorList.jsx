import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Table, Tag, Space, Button, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Tooltip } from 'antd'
import { UserOutlined, PhoneOutlined, PlusOutlined, SearchOutlined, TeamOutlined, MedicineBoxOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { getDoctors, getDoctor } from '../services/api'

const { Option } = Select

const clinics = [
  { id: 1, name: '总院口腔诊所' },
  { id: 2, name: '海淀分院' },
  { id: 3, name: '西城分院' }
]

const departments = [
  { value: '口腔内科', label: '口腔内科' },
  { value: '口腔修复科', label: '口腔修复科' },
  { value: '口腔正畸科', label: '口腔正畸科' },
  { value: '口腔种植科', label: '口腔种植科' },
  { value: '口腔外科', label: '口腔外科' },
  { value: '儿童口腔科', label: '儿童口腔科' }
]

const DoctorList = () => {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [clinicFilter, setClinicFilter] = useState(null)
  const [departmentFilter, setDepartmentFilter] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [doctorDetail, setDoctorDetail] = useState(null)
  const [stats, setStats] = useState({ total: 0, active: 0, departmentBreakdown: {} })
  const [form] = Form.useForm()

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const params = {
        ...(searchText && { search: searchText }),
        ...(clinicFilter && { clinicId: clinicFilter }),
        ...(departmentFilter && { department: departmentFilter }),
        ...(activeFilter !== null && activeFilter !== undefined && { isActive: activeFilter })
      }
      const res = await getDoctors(params)
      const data = res.data || []
      const list = Array.isArray(data) ? data : (data.items || [])
      setDoctors(list)
      const breakdown = {}
      list.forEach(d => {
        breakdown[d.department] = (breakdown[d.department] || 0) + 1
      })
      setStats({
        total: list.length,
        active: list.filter(d => d.isActive).length,
        departmentBreakdown: breakdown
      })
    } catch {
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [clinicFilter, departmentFilter, activeFilter])

  const handleSearch = () => {
    fetchDoctors()
  }

  const handleReset = () => {
    setSearchText('')
    setClinicFilter(null)
    setDepartmentFilter(null)
    setActiveFilter(null)
  }

  const openDetail = async (record) => {
    setDetailModalVisible(true)
    setDetailLoading(true)
    try {
      const res = await getDoctor(record.id)
      setDoctorDetail(res.data)
    } catch {
      setDoctorDetail(null)
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
      title: '职称',
      dataIndex: 'title',
      key: 'title',
      render: (title) => <Tag color="purple">{title}</Tag>
    },
    {
      title: '科室',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: '所属诊所',
      dataIndex: 'clinicId',
      key: 'clinicId',
      render: (clinicId) => <Tag color="cyan">{getClinicName(clinicId)}</Tag>
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone) => (
        <Space>
          <PhoneOutlined />
          <span>{phone || '-'}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => (
        <Badge
          status={isActive ? 'success' : 'default'}
          text={<Tag color={isActive ? 'green' : 'default'}>{isActive ? '在职' : '离职'}</Tag>}
        />
      )
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
              title="医生总数"
              value={stats.total}
              prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="在职医生"
              value={stats.active}
              prefix={<UserOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="科室分布" size="small">
            <Space wrap>
              {Object.entries(stats.departmentBreakdown).map(([dept, count]) => (
                <Tooltip key={dept} title={`${dept}: ${count}人`}>
                  <Tag color="blue" style={{ fontSize: 13, padding: '2px 10px' }}>
                    {dept} <span style={{ fontWeight: 600, marginLeft: 4 }}>{count}</span>
                  </Tag>
                </Tooltip>
              ))}
              {Object.keys(stats.departmentBreakdown).length === 0 && (
                <span style={{ color: '#8c8c8c' }}>暂无数据</span>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索医生姓名"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 200 }}
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
            placeholder="全部科室"
            value={departmentFilter}
            onChange={setDepartmentFilter}
            style={{ width: 150 }}
            allowClear
          >
            {departments.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}
          </Select>
          <Select
            placeholder="全部状态"
            value={activeFilter}
            onChange={setActiveFilter}
            style={{ width: 120 }}
            allowClear
          >
            <Option value={true}>在职</Option>
            <Option value={false}>离职</Option>
          </Select>
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新增医生</Button>
        </Space>
      </Card>

      <Card>
        <Table
          columns={columns}
          dataSource={doctors}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
        />
      </Card>

      <Modal
        title={<Space><PlusOutlined />新增医生</Space>}
        open={createModalVisible}
        onOk={() => {
          form.validateFields().then(() => {
            form.resetFields()
            setCreateModalVisible(false)
          }).catch(() => {})
        }}
        onCancel={() => { setCreateModalVisible(false); form.resetFields() }}
        okText="确认"
        cancelText="取消"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="姓名" rules={[{ required: true, message: '请输入姓名' }]}>
                <Input prefix={<UserOutlined />} placeholder="请输入医生姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="title" label="职称" rules={[{ required: true, message: '请选择职称' }]}>
                <Select placeholder="请选择职称">
                  <Option value="主任医师">主任医师</Option>
                  <Option value="副主任医师">副主任医师</Option>
                  <Option value="主治医师">主治医师</Option>
                  <Option value="住院医师">住院医师</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="department" label="科室" rules={[{ required: true, message: '请选择科室' }]}>
                <Select placeholder="请选择科室">
                  {departments.map(d => <Option key={d.value} value={d.value}>{d.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }, { pattern: /^1\d{10}$/, message: '请输入正确的手机号' }]}>
                <Input prefix={<PhoneOutlined />} placeholder="请输入手机号" maxLength={11} />
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
          </Row>
        </Form>
      </Modal>

      <Modal
        title={<Space><MedicineBoxOutlined />医生详情</Space>}
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setDoctorDetail(null) }}
        footer={<Button onClick={() => { setDetailModalVisible(false); setDoctorDetail(null) }}>关闭</Button>}
        width={680}
        loading={detailLoading}
      >
        {doctorDetail && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions bordered column={2} size="small" title="基本信息">
              <Descriptions.Item label="姓名">{doctorDetail.name}</Descriptions.Item>
              <Descriptions.Item label="职称"><Tag color="purple">{doctorDetail.title}</Tag></Descriptions.Item>
              <Descriptions.Item label="科室"><Tag color="blue">{doctorDetail.department}</Tag></Descriptions.Item>
              <Descriptions.Item label="手机号">
                <Space><PhoneOutlined />{doctorDetail.phone || '-'}</Space>
              </Descriptions.Item>
              <Descriptions.Item label="所属诊所"><Tag color="cyan">{getClinicName(doctorDetail.clinicId)}</Tag></Descriptions.Item>
              <Descriptions.Item label="状态">
                <Badge
                  status={doctorDetail.isActive ? 'success' : 'default'}
                  text={<Tag color={doctorDetail.isActive ? 'green' : 'default'}>{doctorDetail.isActive ? '在职' : '离职'}</Tag>}
                />
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{doctorDetail.createdAt ? dayjs(doctorDetail.createdAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="今日预约数"
                    value={doctorDetail.todayAppointmentCount || 0}
                    prefix={<TeamOutlined style={{ color: '#1890ff' }} />}
                    valueStyle={{ color: '#1890ff' }}
                    suffix="个"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic
                    title="负荷评分"
                    value={doctorDetail.workloadScore || 0}
                    prefix={<MedicineBoxOutlined style={{ color: doctorDetail.workloadScore >= 75 ? '#52c41a' : doctorDetail.workloadScore >= 60 ? '#fa8c16' : '#f5222d' }} />}
                    valueStyle={{ color: doctorDetail.workloadScore >= 75 ? '#52c41a' : doctorDetail.workloadScore >= 60 ? '#fa8c16' : '#f5222d' }}
                    suffix="分"
                  />
                </Card>
              </Col>
            </Row>
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default DoctorList