import { useState } from 'react'
import {
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  message,
  Row,
  Col,
  Tag,
  Card,
  Statistic,
  Avatar,
  Popconfirm,
  Divider,
  Tooltip
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  UserOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FileTextOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  WarningOutlined
} from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'

const discrepancyTypeMap = {
  short: { text: '数量短缺', color: 'red' },
  over: { text: '数量多余', color: 'orange' },
  damaged: { text: '损坏', color: 'purple' },
  expired: { text: '过期', color: 'magenta' },
  batch_error: { text: '批次错误', color: 'cyan' },
  medicine_error: { text: '药品错误', color: 'blue' }
}

const statusMap = {
  open: { text: '开放', color: 'red' },
  investigating: { text: '调查中', color: 'orange' },
  resolved: { text: '已解决', color: 'green' },
  escalated: { text: '升级', color: 'purple' }
}

const ownerList = [
  { id: 1, name: '张经理', avatar: 'Z' },
  { id: 2, name: '李调查', avatar: 'L' },
  { id: 3, name: '王审核', avatar: 'W' },
  { id: 4, name: '赵负责', avatar: 'Z' },
  { id: 5, name: '陈协调', avatar: 'C' },
  { id: 6, name: '刘处理', avatar: 'L' }
]

const avatarColors = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa541c']

const getAvatarColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

const generateMockData = () => {
  const medicines = [
    { name: '阿莫西林胶囊', code: 'MED-001' },
    { name: '布洛芬缓释片', code: 'MED-002' },
    { name: '头孢克肟分散片', code: 'MED-003' },
    { name: '维生素C泡腾片', code: 'MED-004' },
    { name: '复方感冒灵颗粒', code: 'MED-005' },
    { name: '云南白药气雾剂', code: 'MED-006' },
    { name: '双黄连口服液', code: 'MED-007' },
    { name: '藿香正气水', code: 'MED-008' },
    { name: '板蓝根颗粒', code: 'MED-009' },
    { name: '健胃消食片', code: 'MED-010' }
  ]
  const types = Object.keys(discrepancyTypeMap)
  const statuses = Object.keys(statusMap)
  const data = []

  for (let i = 1; i <= 18; i++) {
    const type = types[(i - 1) % types.length]
    const status = statuses[(i * 2 - 1) % statuses.length]
    const medicine = medicines[(i - 1) % medicines.length]
    const expected = Math.floor(Math.random() * 400) + 50
    let actual, diff
    if (type === 'short') {
      diff = -(Math.floor(Math.random() * 30) + 5)
      actual = expected + diff
    } else if (type === 'over') {
      diff = Math.floor(Math.random() * 30) + 5
      actual = expected + diff
    } else if (type === 'damaged') {
      diff = -(Math.floor(Math.random() * 20) + 3)
      actual = expected + diff
    } else if (type === 'expired') {
      diff = -(Math.floor(Math.random() * 50) + 10)
      actual = expected + diff
    } else {
      diff = Math.floor(Math.random() * 40) - 20
      actual = expected + diff
      if (actual < 0) actual = 0
      diff = actual - expected
    }
    const owner = ownerList[(i - 1) % ownerList.length]
    const day = String((i % 28) + 1).padStart(2, '0')
    const month = String(((i * 3) % 12) + 1).padStart(2, '0')
    data.push({
      id: i,
      discrepancyNo: `DS2025${month}${String(i).padStart(4, '0')}`,
      allocationNo: `AL2025${month}${String(i + 100).padStart(4, '0')}`,
      type,
      medicineName: medicine.name,
      medicineCode: medicine.code,
      expectedQty: expected,
      actualQty: actual,
      diffQty: diff,
      status,
      ownerId: status !== 'open' ? owner.id : null,
      ownerName: status !== 'open' ? owner.name : null,
      createTime: `2025-${month}-${day} ${String(8 + (i % 10)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00`,
      investigationResult: status !== 'open'
        ? `经核查，该差异原因为${discrepancyTypeMap[type].text}，涉及批次${medicine.code}-B${i}，已联系相关部门进行复核处理，后续将加强出库环节的校验工作。`
        : null,
      resolutionMeasure: status === 'resolved'
        ? `已完成${discrepancyTypeMap[type].text}处理：补发货品/退回多余/销毁损坏品/更换正确批次/重新调配。相关责任人已进行培训。`
        : null
    })
  }
  return data
}

const DiscrepancyManagement = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState(generateMockData)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 18 })

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [assignModalOpen, setAssignModalOpen] = useState(false)
  const [resolveModalOpen, setResolveModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  const [detailForm] = Form.useForm()
  const [assignForm] = Form.useForm()
  const [resolveForm] = Form.useForm()

  const [keyword, setKeyword] = useState('')
  const [filterType, setFilterType] = useState(null)
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterOwner, setFilterOwner] = useState(null)

  const totalCount = dataSource.length
  const openCount = dataSource.filter(i => i.status === 'open').length
  const investigatingCount = dataSource.filter(i => i.status === 'investigating').length
  const resolvedCount = dataSource.filter(i => i.status === 'resolved').length

  const columns = [
    {
      title: '差异单号',
      dataIndex: 'discrepancyNo',
      key: 'discrepancyNo',
      width: 150,
      render: (val) => <span style={{ color: '#1677ff', fontFamily: 'monospace' }}>{val}</span>
    },
    {
      title: '关联调拨单',
      dataIndex: 'allocationNo',
      key: 'allocationNo',
      width: 150,
      render: (val) => <span style={{ fontFamily: 'monospace', color: '#666' }}>{val}</span>
    },
    {
      title: '差异类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => (
        <Tag color={discrepancyTypeMap[type].color}>
          {discrepancyTypeMap[type].text}
        </Tag>
      )
    },
    {
      title: '药品',
      dataIndex: 'medicineName',
      key: 'medicineName',
      width: 160,
      render: (val, record) => (
        <div>
          <div>{val}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.medicineCode}</div>
        </div>
      )
    },
    {
      title: '期望/实际/差异数量',
      key: 'quantities',
      width: 200,
      render: (_, record) => (
        <div style={{ lineHeight: 1.6 }}>
          <div>
            <span style={{ color: '#8c8c8c' }}>期望：</span>
            <span>{record.expectedQty}</span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>实际：</span>
            <span>{record.actualQty}</span>
          </div>
          <div>
            <span style={{ color: '#8c8c8c' }}>差异：</span>
            <span style={{
              color: record.diffQty > 0 ? '#52c41a' : record.diffQty < 0 ? '#ff4d4f' : '#262626',
              fontWeight: 600
            }}>
              {record.diffQty > 0 ? `+${record.diffQty}` : record.diffQty}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={statusMap[status].color}>
          {statusMap[status].text}
        </Tag>
      )
    },
    {
      title: '负责人',
      key: 'owner',
      width: 120,
      render: (_, record) => {
        if (!record.ownerName) {
          return <span style={{ color: '#bfbfbf' }}>未指派</span>
        }
        return (
          <Space size={6}>
            <Avatar
              size={24}
              style={{ backgroundColor: getAvatarColor(record.ownerName), fontSize: 12 }}
            >
              {record.ownerName.charAt(0)}
            </Avatar>
            <span>{record.ownerName}</span>
          </Space>
        )
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 170
    },
    {
      title: '调查结果',
      dataIndex: 'investigationResult',
      key: 'investigationResult',
      width: 220,
      ellipsis: { showTitle: false },
      render: (val) => val
        ? <Tooltip title={val}><span>{val}</span></Tooltip>
        : <span style={{ color: '#bfbfbf' }}>暂无</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserOutlined />}
            onClick={() => handleAssign(record)}
            disabled={record.status === 'resolved'}
          >
            指派
          </Button>
          {record.status !== 'resolved' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => handleResolve(record)}
            >
              解决
            </Button>
          )}
          <Popconfirm
            title="确认删除该差异记录？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const handleViewDetail = (record) => {
    setCurrentRecord(record)
    setDetailModalOpen(true)
  }

  const handleAssign = (record) => {
    setCurrentRecord(record)
    assignForm.resetFields()
    assignForm.setFieldsValue({ ownerId: record.ownerId })
    setAssignModalOpen(true)
  }

  const handleResolve = (record) => {
    setCurrentRecord(record)
    resolveForm.resetFields()
    resolveForm.setFieldsValue({
      investigationResult: record.investigationResult || '',
      resolutionMeasure: record.resolutionMeasure || ''
    })
    setResolveModalOpen(true)
  }

  const handleDelete = (id) => {
    setDataSource(dataSource.filter(item => item.id !== id))
    setPagination(p => ({ ...p, total: p.total - 1 }))
    message.success('删除成功')
  }

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields()
      const owner = ownerList.find(o => o.id === values.ownerId)
      setDataSource(dataSource.map(item =>
        item.id === currentRecord.id
          ? {
              ...item,
              ownerId: owner.id,
              ownerName: owner.name,
              status: item.status === 'open' ? 'investigating' : item.status
            }
          : item
      ))
      message.success('指派成功')
      setAssignModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleResolveSubmit = async () => {
    try {
      const values = await resolveForm.validateFields()
      setDataSource(dataSource.map(item =>
        item.id === currentRecord.id
          ? {
              ...item,
              status: 'resolved',
              investigationResult: values.investigationResult,
              resolutionMeasure: values.resolutionMeasure
            }
          : item
      ))
      message.success('已标记为已解决')
      setResolveModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      let filtered = generateMockData()
      if (keyword) {
        filtered = filtered.filter(i =>
          i.discrepancyNo.includes(keyword) ||
          i.allocationNo.includes(keyword) ||
          i.medicineName.includes(keyword) ||
          i.medicineCode.includes(keyword)
        )
      }
      if (filterType) {
        filtered = filtered.filter(i => i.type === filterType)
      }
      if (filterStatus) {
        filtered = filtered.filter(i => i.status === filterStatus)
      }
      if (filterOwner) {
        filtered = filtered.filter(i => i.ownerId === filterOwner)
      }
      setDataSource(filtered)
      setPagination(p => ({ ...p, current: 1, total: filtered.length }))
      setLoading(false)
    }, 300)
  }

  const handleReset = () => {
    setKeyword('')
    setFilterType(null)
    setFilterStatus(null)
    setFilterOwner(null)
    const data = generateMockData()
    setDataSource(data)
    setPagination({ current: 1, pageSize: 10, total: data.length })
  }

  const handleTableChange = (page) => {
    setPagination(page)
  }

  const fetchData = async (params) => {
    setLoading(true)
    try {
      // TODO: 调用API: getDiscrepancyList(params)
      // const res = await request({ url: '/admin/discrepancies', method: 'get', params })
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="差异管理" />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FileTextOutlined style={{ fontSize: 32, color: '#1677ff', opacity: 0.6 }} />
              <div>
                <Statistic title="差异总数" value={totalCount} suffix="条" />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f', opacity: 0.6 }} />
              <div>
                <Statistic title="开放" value={openCount} suffix="条" valueStyle={{ color: '#ff4d4f' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ClockCircleOutlined style={{ fontSize: 32, color: '#faad14', opacity: 0.6 }} />
              <div>
                <Statistic title="调查中" value={investigatingCount} suffix="条" valueStyle={{ color: '#faad14' }} />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ borderRadius: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <CheckCircleOutlined style={{ fontSize: 32, color: '#52c41a', opacity: 0.6 }} />
              <div>
                <Statistic title="已解决" value={resolvedCount} suffix="条" valueStyle={{ color: '#52c41a' }} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space wrap size="middle">
          <Input
            placeholder="差异单号/调拨单号/药品"
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Select
            placeholder="差异类型"
            style={{ width: 150 }}
            allowClear
            value={filterType}
            onChange={setFilterType}
            options={Object.entries(discrepancyTypeMap).map(([key, val]) => ({
              value: key, label: val.text
            }))}
          />
          <Select
            placeholder="状态"
            style={{ width: 130 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            options={Object.entries(statusMap).map(([key, val]) => ({
              value: key, label: val.text
            }))}
          />
          <Select
            placeholder="负责人"
            style={{ width: 150 }}
            allowClear
            value={filterOwner}
            onChange={setFilterOwner}
            options={ownerList.map(o => ({ value: o.id, label: o.name }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </div>

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        onChange={handleTableChange}
      />

      <Modal
        title="差异详情"
        open={detailModalOpen}
        onCancel={() => setDetailModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>
        ]}
        width={720}
        destroyOnClose
      >
        {currentRecord && (
          <div style={{ lineHeight: 2.2 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>差异单号：</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{currentRecord.discrepancyNo}</span>
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>关联调拨单：</span>
                  <span style={{ fontFamily: 'monospace' }}>{currentRecord.allocationNo}</span>
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>差异类型：</span>
                  <Tag color={discrepancyTypeMap[currentRecord.type].color}>
                    {discrepancyTypeMap[currentRecord.type].text}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>状态：</span>
                  <Tag color={statusMap[currentRecord.status].color}>
                    {statusMap[currentRecord.status].text}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>药品名称：</span>{currentRecord.medicineName}</div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>药品编码：</span>{currentRecord.medicineCode}</div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>期望数量</div>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{currentRecord.expectedQty}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fafafa' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>实际数量</div>
                  <div style={{ fontSize: 22, fontWeight: 600 }}>{currentRecord.actualQty}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>差异数量</div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: currentRecord.diffQty > 0 ? '#52c41a' : currentRecord.diffQty < 0 ? '#ff4d4f' : '#262626'
                  }}>
                    {currentRecord.diffQty > 0 ? `+${currentRecord.diffQty}` : currentRecord.diffQty}
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>负责人：</span>
                  {currentRecord.ownerName ? (
                    <Space size={6}>
                      <Avatar size={20} style={{ backgroundColor: getAvatarColor(currentRecord.ownerName), fontSize: 11 }}>
                        {currentRecord.ownerName.charAt(0)}
                      </Avatar>
                      <span>{currentRecord.ownerName}</span>
                    </Space>
                  ) : <span style={{ color: '#bfbfbf' }}>未指派</span>}
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>创建时间：</span>{currentRecord.createTime}</div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                <TeamOutlined style={{ marginRight: 4 }} />调查结果
              </div>
              <div style={{
                background: '#f5f5f5',
                padding: 12,
                borderRadius: 4,
                minHeight: 60,
                lineHeight: 1.8
              }}>
                {currentRecord.investigationResult || '暂无调查结果'}
              </div>
            </div>

            <div>
              <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />解决措施
              </div>
              <div style={{
                background: '#f6ffed',
                padding: 12,
                borderRadius: 4,
                minHeight: 60,
                lineHeight: 1.8
              }}>
                {currentRecord.resolutionMeasure || '暂无解决措施'}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="指派负责人"
        open={assignModalOpen}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignModalOpen(false)}
        width={480}
        destroyOnClose
        okText="确认指派"
      >
        {currentRecord && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>差异单号</div>
              <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{currentRecord.discrepancyNo}</div>
              <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>药品</div>
              <div>{currentRecord.medicineName}</div>
            </div>
            <Form form={assignForm} layout="vertical">
              <Form.Item
                name="ownerId"
                label="选择负责人"
                rules={[{ required: true, message: '请选择负责人' }]}
              >
                <Select
                  placeholder="请选择负责人"
                  optionLabelProp="label"
                  options={ownerList.map(o => ({
                    value: o.id,
                    label: o.name,
                    children: (
                      <Space>
                        <Avatar size={20} style={{ backgroundColor: getAvatarColor(o.name), fontSize: 11 }}>
                          {o.avatar}
                        </Avatar>
                        {o.name}
                      </Space>
                    )
                  }))}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="解决差异"
        open={resolveModalOpen}
        onOk={handleResolveSubmit}
        onCancel={() => setResolveModalOpen(false)}
        width={640}
        destroyOnClose
        okText="确认解决"
      >
        {currentRecord && (
          <div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>差异单号</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{currentRecord.discrepancyNo}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>差异类型</div>
                  <Tag color={discrepancyTypeMap[currentRecord.type].color}>
                    {discrepancyTypeMap[currentRecord.type].text}
                  </Tag>
                </Col>
              </Row>
            </div>
            <Form form={resolveForm} layout="vertical">
              <Form.Item
                name="investigationResult"
                label="调查结果"
                rules={[{ required: true, message: '请输入调查结果' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请详细描述调查过程和原因分析..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
              <Form.Item
                name="resolutionMeasure"
                label="解决措施"
                rules={[{ required: true, message: '请输入解决措施' }]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder="请详细描述处理方式、补救措施和后续改进方案..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default DiscrepancyManagement
