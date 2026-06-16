
import { useState, useEffect } from 'react'
import {
  Row,
  Col,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Badge,
  Descriptions,
  Statistic,
  Alert,
  Tooltip,
  Divider,
  message
} from 'antd'
import {
  BellOutlined,
  UserOutlined,
  PhoneOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  PlusOutlined,
  SearchOutlined,
  ReloadOutlined,
  WarningOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import {
  getFollowUps,
  completeFollowUp,
  createFollowUp,
  getOverdueFollowUpCount,
  getDoctors,
  getPatients
} from '../services/api'

const { Option } = Select
const { TextArea } = Input
const { RangePicker } = DatePicker

const typeMap = {
  1: { text: '治疗后随访', color: 'blue' },
  2: { text: '术后随访', color: 'purple' },
  3: { text: '定期检查', color: 'cyan' },
  99: { text: '其他', color: 'default' }
}

const statusMap = {
  1: { text: '待处理', color: 'gold' },
  2: { text: '进行中', color: 'processing' },
  3: { text: '已完成', color: 'green' },
  4: { text: '已逾期', color: 'red' },
  5: { text: '已取消', color: 'default' }
}

const clinics = [
  { id: 1, name: '总院口腔诊所' },
  { id: 2, name: '海淀分院' },
  { id: 3, name: '西城分院' }
]

const FollowUpManagement = () => {
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(false)
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [overdueCount, setOverdueCount] = useState(0)
  const [stats, setStats] = useState({ total: 0, pending: 0, overdue: 0, completedToday: 0 })
  const [selectedRow, setSelectedRow] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [completeVisible, setCompleteVisible] = useState(false)
  const [createVisible, setCreateVisible] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [completeForm] = Form.useForm()
  const [createForm] = Form.useForm()

  const [filters, setFilters] = useState({
    clinicId: null,
    doctorId: null,
    status: null,
    type: null,
    isOverdue: null,
    dateRange: null
  })

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    fetchDoctors()
    fetchPatients()
    fetchOverdueCount()
  }, [])

  useEffect(() => {
    fetchFollowUps()
  }, [pagination.current, pagination.pageSize, filters])

  const fetchFollowUps = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize
      }
      if (filters.clinicId) params.clinicId = filters.clinicId
      if (filters.doctorId) params.doctorId = filters.doctorId
      if (filters.status) params.status = filters.status
      if (filters.type) params.type = filters.type
      if (filters.isOverdue !== null) params.isOverdue = filters.isOverdue
      if (filters.dateRange && filters.dateRange[0]) {
        params.startDate = filters.dateRange[0].format('YYYY-MM-DD')
        params.endDate = filters.dateRange[1].format('YYYY-MM-DD')
      }
      const res = await getFollowUps(params)
      const items = res.data?.items || res.items || []
      const total = res.data?.totalCount || res.totalCount || items.length
      setFollowUps(items)
      setPagination(prev => ({ ...prev, total }))
      computeStats(items)
    } catch {
      message.error('获取随访列表失败')
    } finally {
      setLoading(false)
    }
  }

  const computeStats = (items) => {
    const total = items.length
    const pending = items.filter(i => i.status === 1).length
    const overdue = items.filter(i => i.isOverdue).length
    const completedToday = items.filter(i =>
      i.status === 3 && i.completedDate && dayjs(i.completedDate).isSame(dayjs(), 'day')
    ).length
    setStats({ total, pending, overdue, completedToday })
  }

  const fetchDoctors = async () => {
    try {
      const res = await getDoctors({ pageSize: 100 })
      setDoctors(res.data?.items || res.items || [])
    } catch {
      setDoctors([
        { id: 1, name: '张医生', title: '主任医师' },
        { id: 2, name: '李医生', title: '副主任医师' },
        { id: 3, name: '王医生', title: '主治医师' },
        { id: 4, name: '赵医生', title: '主任医师' }
      ])
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await getPatients({ pageSize: 100 })
      setPatients(res.data?.items || res.items || [])
    } catch {
      setPatients([])
    }
  }

  const fetchOverdueCount = async () => {
    try {
      const res = await getOverdueFollowUpCount()
      setOverdueCount(res.data || res || 0)
    } catch {
      setOverdueCount(0)
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleReset = () => {
    setFilters({
      clinicId: null,
      doctorId: null,
      status: null,
      type: null,
      isOverdue: null,
      dateRange: null
    })
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handleTableChange = (pag) => {
    setPagination(prev => ({
      ...prev,
      current: pag.current,
      pageSize: pag.pageSize
    }))
  }

  const showDetail = (record) => {
    setSelectedRow(record)
    setDetailVisible(true)
  }

  const showComplete = (record) => {
    setCompletingId(record.id)
    completeForm.resetFields()
    setCompleteVisible(true)
  }

  const handleComplete = async () => {
    try {
      const values = await completeForm.validateFields()
      await completeFollowUp(completingId, values)
      message.success('随访已办结，数据将自动同步到排班负荷报表')
      setCompleteVisible(false)
      completeForm.resetFields()
      fetchFollowUps()
      fetchOverdueCount()
    } catch {
      message.error('请填写随访结果')
    }
  }

  const handleCreate = async () => {
    try {
      const values = await createForm.validateFields()
      const data = {
        ...values,
        plannedDate: values.plannedDate?.format('YYYY-MM-DD'),
        dueDate: values.dueDate?.format('YYYY-MM-DD')
      }
      await createFollowUp(data)
      message.success('随访任务创建成功')
      setCreateVisible(false)
      createForm.resetFields()
      fetchFollowUps()
    } catch {
      message.error('请完善随访信息')
    }
  }

  const columns = [
    {
      title: '患者',
      key: 'patient',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <UserOutlined style={{ color: '#1890ff' }} />
            <span style={{ fontWeight: 500 }}>{record.patientName}</span>
            {record.isOverdue && (
              <Tooltip title="已逾期">
                <ExclamationCircleOutlined style={{ color: '#f5222d' }} />
              </Tooltip>
            )}
          </Space>
          <Space size={4} style={{ fontSize: 12, color: '#8c8c8c', paddingLeft: 18 }}>
            <PhoneOutlined />
            <span>{record.patientPhone}</span>
          </Space>
        </Space>
      )
    },
    {
      title: '随访类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const t = typeMap[type] || { text: '未知', color: 'default' }
        return <Tag color={t.color}>{t.text}</Tag>
      }
    },
    {
      title: '计划日期',
      key: 'plannedDate',
      width: 130,
      sorter: (a, b) => new Date(a.plannedDate) - new Date(b.plannedDate),
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Space size={4}>
            <CalendarOutlined style={{ color: '#8c8c8c' }} />
            <span>{record.plannedDateText || record.plannedDate}</span>
          </Space>
          {record.isOverdue && (
            <Tag color="red" style={{ fontSize: 11, marginTop: 2 }}>
              <WarningOutlined /> 逾期
            </Tag>
          )}
        </Space>
      )
    },
    {
      title: '负责医生',
      key: 'doctor',
      width: 120,
      render: (_, record) => (
        <Space>
          <UserOutlined style={{ color: '#722ed1' }} />
          <span>{record.doctorName}</span>
        </Space>
      )
    },
    {
      title: '负责人',
      key: 'responsiblePerson',
      width: 120,
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <span>{record.responsiblePersonName}</span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status, record) => {
        const s = statusMap[status] || { text: '未知', color: 'default' }
        if (record.isOverdue && status !== 3 && status !== 5) {
          return <Tag color="red" icon={<ExclamationCircleOutlined />}>已逾期</Tag>
        }
        return <Tag color={s.color}>{s.text}</Tag>
      }
    },
    {
      title: '逾期',
      key: 'overdue',
      width: 80,
      align: 'center',
      render: (_, record) => {
        if (!record.isOverdue || record.status === 3 || record.status === 5) return <span style={{ color: '#d9d9d9' }}>—</span>
        const overdueDays = dayjs().diff(dayjs(record.plannedDate), 'day')
        return (
          <Badge count={overdueDays} overflowCount={99} style={{ backgroundColor: '#f5222d' }}>
            <ClockCircleOutlined style={{ fontSize: 18, color: '#f5222d' }} />
          </Badge>
        )
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => showDetail(record)}>
            详情
          </Button>
          {record.status !== 3 && record.status !== 5 && (
            <Button
              type="link"
              size="small"
              style={record.isOverdue ? { color: '#f5222d', fontWeight: 600 } : {}}
              onClick={() => showComplete(record)}
            >
              {record.isOverdue ? '立即处理' : '办结'}
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      {overdueCount > 0 && (
        <Alert
          message={
            <Space>
              <WarningOutlined />
              <span>当前有 <strong>{overdueCount}</strong> 条逾期随访需要处理</span>
            </Space>
          }
          type="error"
          showIcon={false}
          style={{ marginBottom: 16 }}
          action={
            <Button
              size="small"
              danger
              onClick={() => {
                setFilters(prev => ({ ...prev, isOverdue: true }))
                setPagination(prev => ({ ...prev, current: 1 }))
              }}
            >
              查看逾期随访
            </Button>
          }
        />
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="随访总数"
              value={stats.total}
              prefix={<BellOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待处理"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已逾期"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined style={{ color: '#f5222d' }} />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="今日完成"
              value={stats.completedToday}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle">
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>诊所：</span>
              <Select
                placeholder="全部诊所"
                value={filters.clinicId}
                onChange={(v) => setFilters(prev => ({ ...prev, clinicId: v }))}
                style={{ width: 150 }}
                allowClear
              >
                {clinics.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>医生：</span>
              <Select
                placeholder="全部医生"
                value={filters.doctorId}
                onChange={(v) => setFilters(prev => ({ ...prev, doctorId: v }))}
                style={{ width: 160 }}
                allowClear
              >
                {doctors.map(d => <Option key={d.id} value={d.id}>{d.name} - {d.title || ''}</Option>)}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>状态：</span>
              <Select
                placeholder="全部状态"
                value={filters.status}
                onChange={(v) => setFilters(prev => ({ ...prev, status: v }))}
                style={{ width: 130 }}
                allowClear
              >
                {Object.entries(statusMap).map(([k, v]) => (
                  <Option key={k} value={Number(k)}>{v.text}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>类型：</span>
              <Select
                placeholder="全部类型"
                value={filters.type}
                onChange={(v) => setFilters(prev => ({ ...prev, type: v }))}
                style={{ width: 130 }}
                allowClear
              >
                {Object.entries(typeMap).map(([k, v]) => (
                  <Option key={k} value={Number(k)}>{v.text}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <span style={{ fontWeight: 500 }}>日期：</span>
              <RangePicker
                value={filters.dateRange}
                onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
                style={{ width: 250 }}
              />
            </Space>
          </Col>
          <Col>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                查询
              </Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>
                重置
              </Button>
              <Button
                type="primary"
                danger={filters.isOverdue === true}
                onClick={() => {
                  setFilters(prev => ({ ...prev, isOverdue: prev.isOverdue === true ? null : true }))
                  setPagination(prev => ({ ...prev, current: 1 }))
                }}
              >
                {filters.isOverdue === true ? '查看全部' : '仅看逾期'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card
        title={
          <Space>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>随访管理列表</span>
            {filters.isOverdue === true && <Tag color="red">逾期筛选中</Tag>}
          </Space>
        }
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { createForm.resetFields(); setCreateVisible(true) }}>
            新建随访
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={followUps}
          rowKey="id"
          loading={loading}
          size="small"
          scroll={{ x: 1100 }}
          onRow={(record) => ({
            onClick: () => showDetail(record),
            style: {
              cursor: 'pointer',
              backgroundColor: record.isOverdue && record.status !== 3 && record.status !== 5
                ? '#fff1f0'
                : undefined
            }
          })}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`
          }}
          onChange={handleTableChange}
          rowClassName={(record) =>
            record.isOverdue && record.status !== 3 && record.status !== 5
              ? 'overdue-row'
              : ''
          }
        />
      </Card>

      <Modal
        title={
          <Space>
            <BellOutlined style={{ color: '#1890ff' }} />
            <span>随访详情</span>
            {selectedRow?.isOverdue && selectedRow.status !== 3 && selectedRow.status !== 5 && (
              <Tag color="red" icon={<ExclamationCircleOutlined />}>已逾期</Tag>
            )}
          </Space>
        }
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
          selectedRow && selectedRow.status !== 3 && selectedRow.status !== 5 && (
            <Button
              key="complete"
              type="primary"
              danger={selectedRow.isOverdue}
              onClick={() => {
                setDetailVisible(false)
                showComplete(selectedRow)
              }}
            >
              {selectedRow.isOverdue ? '立即处理' : '办结'}
            </Button>
          )
        ].filter(Boolean)}
      >
        {selectedRow && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {selectedRow.isOverdue && selectedRow.status !== 3 && selectedRow.status !== 5 && (
              <Alert
                message="该随访已逾期，请尽快处理"
                type="error"
                showIcon
                icon={<WarningOutlined />}
              />
            )}

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="患者姓名">
                <Space>
                  <UserOutlined style={{ color: '#1890ff' }} />
                  <span style={{ fontWeight: 500 }}>{selectedRow.patientName}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="联系电话">
                <Space>
                  <PhoneOutlined />
                  <span>{selectedRow.patientPhone}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="负责医生">
                <Space>
                  <UserOutlined style={{ color: '#722ed1' }} />
                  <span>{selectedRow.doctorName}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="负责人">
                <Space>
                  <UserOutlined />
                  <span>{selectedRow.responsiblePersonName}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="随访类型">
                <Tag color={(typeMap[selectedRow.type] || {}).color}>
                  {selectedRow.typeText || (typeMap[selectedRow.type] || {}).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="当前状态">
                <Tag color={(statusMap[selectedRow.status] || {}).color}>
                  {selectedRow.statusText || (statusMap[selectedRow.status] || {}).text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="计划日期">
                <Space>
                  <CalendarOutlined />
                  <span>{selectedRow.plannedDateText || selectedRow.plannedDate}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="到期日期">
                <Space>
                  <CalendarOutlined />
                  <span>{selectedRow.dueDate || '—'}</span>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>
                {selectedRow.createdAt || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left" style={{ margin: 0 }}>随访内容</Divider>
            <Card size="small" style={{ backgroundColor: '#fafafa' }}>
              {selectedRow.content || '暂无内容'}
            </Card>

            {selectedRow.status === 3 && (
              <>
                <Divider orientation="left" style={{ margin: 0 }}>办结信息</Divider>
                <Descriptions bordered column={2} size="small">
                  <Descriptions.Item label="完成时间">
                    {selectedRow.completedDate || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="随访结果">
                    <Tag color="green">{selectedRow.result || '—'}</Tag>
                  </Descriptions.Item>
                  {selectedRow.remark && (
                    <Descriptions.Item label="备注" span={2}>
                      {selectedRow.remark}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </>
            )}

            {selectedRow.isOverdue && selectedRow.status !== 3 && selectedRow.status !== 5 && (
              <>
                <Divider orientation="left" style={{ margin: 0 }}>逾期信息</Divider>
                <Card size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="逾期天数"
                        value={dayjs().diff(dayjs(selectedRow.plannedDate), 'day')}
                        suffix="天"
                        prefix={<WarningOutlined />}
                        valueStyle={{ color: '#f5222d' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="计划日期"
                        value={selectedRow.plannedDateText || selectedRow.plannedDate}
                        valueStyle={{ fontSize: 16 }}
                        prefix={<CalendarOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </>
            )}
          </Space>
        )}
      </Modal>

      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            <span>办结随访</span>
          </Space>
        }
        open={completeVisible}
        onCancel={() => { setCompleteVisible(false); completeForm.resetFields() }}
        onOk={handleComplete}
        width={520}
        okText="确认办结"
        cancelText="取消"
      >
        <Alert
          message="办结后将自动同步到排班负荷报表"
          type="info"
          showIcon
          icon={<ReloadOutlined />}
          style={{ marginBottom: 16 }}
        />
        <Form form={completeForm} layout="vertical">
          <Form.Item
            name="result"
            label="随访结果"
            rules={[{ required: true, message: '请填写随访结果' }]}
          >
            <TextArea
              rows={4}
              placeholder="请输入随访结果，如：患者恢复良好，无不适症状"
              maxLength={500}
              showCount
            />
          </Form.Item>
          <Form.Item
            name="remark"
            label="备注"
          >
            <TextArea
              rows={2}
              placeholder="其他需要备注的信息（选填）"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          <Space>
            <PlusOutlined style={{ color: '#1890ff' }} />
            <span>新建随访</span>
          </Space>
        }
        open={createVisible}
        onCancel={() => { setCreateVisible(false); createForm.resetFields() }}
        onOk={handleCreate}
        width={600}
        okText="创建"
        cancelText="取消"
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="patientId"
                label="患者"
                rules={[{ required: true, message: '请选择患者' }]}
              >
                <Select
                  placeholder="请选择患者"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    option.children?.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {patients.map(p => (
                    <Option key={p.id} value={p.id}>{p.name} - {p.phone}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="doctorId"
                label="负责医生"
                rules={[{ required: true, message: '请选择负责医生' }]}
              >
                <Select placeholder="请选择医生">
                  {doctors.map(d => (
                    <Option key={d.id} value={d.id}>{d.name} - {d.title || ''}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="responsiblePersonId"
                label="负责人ID"
                rules={[{ required: true, message: '请输入负责人ID' }]}
              >
                <Input placeholder="请输入负责人ID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="responsiblePersonName"
                label="负责人姓名"
                rules={[{ required: true, message: '请输入负责人姓名' }]}
              >
                <Input placeholder="请输入负责人姓名" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="随访类型"
                rules={[{ required: true, message: '请选择随访类型' }]}
              >
                <Select placeholder="请选择随访类型">
                  {Object.entries(typeMap).map(([k, v]) => (
                    <Option key={k} value={Number(k)}>{v.text}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="appointmentId"
                label="关联预约ID"
              >
                <Input placeholder="选填" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="plannedDate"
                label="计划日期"
                rules={[{ required: true, message: '请选择计划日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="到期日期"
                rules={[{ required: true, message: '请选择到期日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="content"
            label="随访内容"
            rules={[{ required: true, message: '请填写随访内容' }]}
          >
            <TextArea
              rows={3}
              placeholder="请输入随访内容，如：治疗后回访，询问恢复情况"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default FollowUpManagement
