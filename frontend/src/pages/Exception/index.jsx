import { useState, useMemo } from 'react'
import {
  Button, Space, Input, Select, Modal, Form, message, Row, Col, Tag, Card, Avatar,
  Timeline, Descriptions, Divider, Statistic, Empty
} from 'antd'
import {
  SearchOutlined, ExclamationCircleOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, UserOutlined, SolutionOutlined, EyeOutlined, TeamOutlined
} from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'
import { getExceptionList, handleException, getExceptionDetail, getExceptionStats } from '@/api/exception'

const exceptionTypeMap = {
  delivery_delay: { text: '交期延误', color: 'red' },
  quality_issue: { text: '质量问题', color: 'orange' },
  stockout_risk: { text: '缺货风险', color: 'warning' },
  supplier_issue: { text: '供应商问题', color: 'purple' }
}

const riskLevelMap = {
  low: { text: '低', color: 'green' },
  medium: { text: '中', color: 'blue' },
  high: { text: '高', color: 'orange' },
  urgent: { text: '紧急', color: 'red' }
}

const exceptionStatusMap = {
  open: { text: '未解决', color: 'red' },
  processing: { text: '处理中', color: 'blue' },
  resolved: { text: '已解决', color: 'green' }
}

const userList = [
  { id: 1, name: '张伟', avatar: '张', color: '#1677ff' },
  { id: 2, name: '李娜', avatar: '李', color: '#52c41a' },
  { id: 3, name: '王芳', avatar: '王', color: '#fa8c16' },
  { id: 4, name: '刘强', avatar: '刘', color: '#722ed1' },
  { id: 5, name: '陈静', avatar: '陈', color: '#eb2f96' },
  { id: 6, name: '杨洋', avatar: '杨', color: '#13c2c2' },
  { id: 7, name: '赵敏', avatar: '赵', color: '#faad14' }
]

const creatorList = ['系统自动', '张伟', '李娜', '王芳', '刘强', '陈静']

const titleTemplates = {
  delivery_delay: [
    '{medicine}交货延误{days}天',
    '{supplier}交期异常：{medicine}推迟交货',
    '紧急！{medicine}承诺交货日期已过{days}天',
    '{medicine}物流延误，预计延迟{days}天到货'
  ],
  quality_issue: [
    '{medicine}抽检不合格，合格率{rate}%',
    '{supplier}供应的{medicine}发现质量问题',
    '{medicine}入库检验发现破损{count}件',
    '质量预警：{medicine}有效期异常'
  ],
  stockout_risk: [
    '{medicine}库存低于安全库存，当前仅剩{count}件',
    '缺货预警：{medicine}预计{days}天后断货',
    '{medicine}库存告急，请紧急补货',
    '高风险：{medicine}连续3天销量超预期'
  ],
  supplier_issue: [
    '{supplier}临时停产，影响{medicine}供应',
    '{supplier}资质审核未通过，需更换供应商',
    '{supplier}合同即将到期，请及时续约',
    '{supplier}联系不上，{medicine}补货受阻'
  ]
}

const delayReasonList = [
  '厂家原材料供应不足导致生产延期',
  '物流运输途中遭遇恶劣天气',
  '供应商生产线临时故障维修',
  '海关清关手续延误',
  '订单排产期紧张，产能不足',
  '质检环节发现问题需返工',
  '节假日期间物流配送延迟',
  '供应商更换运输公司导致衔接不畅'
]

const medicineNameList = [
  '阿莫西林胶囊', '布洛芬缓释片', '头孢克肟片', '奥美拉唑肠溶胶囊',
  '盐酸左氧氟沙星片', '复方氨酚烷胺片', '硝苯地平缓释片', '二甲双胍缓释片',
  '阿托伐他汀钙片', '氯雷他定片', '蒙脱石散', '双歧杆菌三联活菌胶囊',
  '维生素C片', '板蓝根颗粒', '感冒灵颗粒'
]

const supplierNameList = [
  '国药控股有限公司', '九州通医药集团', '上药控股有限公司', '华润医药商业',
  '瑞康医药集团', '南京医药股份', '华东医药股份', '中国医药健康',
  '海王生物工程', '英特药业有限公司', '嘉事堂药业', '人民同泰医药'
]

const allocationNoList = [
  'AL202605', 'AL202604', 'AL202603', 'AL202602', 'AL202601',
  'AL202512', 'AL202511', 'AL202510'
]

const fillTemplate = (template, vars) => {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || '')
}

const generateExceptionData = () => {
  const types = Object.keys(exceptionTypeMap)
  const risks = Object.keys(riskLevelMap)
  const statuses = Object.keys(exceptionStatusMap)
  const data = []
  for (let i = 1; i <= 22; i++) {
    const type = types[i % types.length]
    const risk = risks[i % risks.length]
    const statusIdx = i % 3
    const status = statuses[statusIdx]
    const medIdx = i % medicineNameList.length
    const supIdx = i % supplierNameList.length
    const userIdx = (i - 1) % userList.length
    const creatorIdx = i % creatorList.length
    const allocIdx = i % allocationNoList.length

    const createdAt = dayjs().subtract(2 + i, 'day').subtract(i * 3, 'hour')
    const estimatedDate = createdAt.add(3 + (i % 7), 'day')
    let actualDate = null
    let resolvedAt = null
    let resolveNote = ''

    if (status === 'resolved') {
      actualDate = estimatedDate.add((i % 5) - 2, 'day')
      resolvedAt = actualDate.add(2 + (i % 8), 'hour')
      resolveNote = [
        '已协调供应商加急处理，问题已解决。',
        '已启动备用供应商，确保库存正常。',
        '质量问题已退回并更换合格批次。',
        '物流已恢复正常，货物正在配送中。',
        '已与供应商达成新的合作协议。'
      ][i % 5]
    }

    const delayDays = (i % 8) + 1
    const qualityRate = 70 + (i % 25)
    const stockCount = 5 + (i % 30)

    const titleVars = {
      medicine: medicineNameList[medIdx],
      supplier: supplierNameList[supIdx],
      days: delayDays,
      rate: qualityRate,
      count: stockCount
    }
    const titlePool = titleTemplates[type]
    const title = fillTemplate(titlePool[i % titlePool.length], titleVars)

    const delayReason = type === 'delivery_delay' || type === 'supplier_issue'
      ? delayReasonList[i % delayReasonList.length]
      : (type === 'quality_issue' ? `抽检发现${2 + (i % 5)}件不合格，合格率仅${qualityRate}%`
          : `当前库存${stockCount}件，低于安全库存${50 + (i % 100)}件`)

    const assignee = statusIdx === 0 && i % 3 === 0 ? null : userList[userIdx]

    data.push({
      id: i,
      exceptionNo: `EX${dayjs(createdAt).format('YYYYMMDD')}${String(i).padStart(4, '0')}`,
      type,
      title,
      relatedAllocation: i % 2 === 0 ? `${allocationNoList[allocIdx]}${String(100 + i).padStart(4, '0')}` : null,
      relatedSupplier: i % 2 === 1 ? { id: supIdx + 1, name: supplierNameList[supIdx] } : null,
      medicine: medicineNameList[medIdx],
      medicineCode: `MED${String(medIdx + 1).padStart(3, '0')}`,
      riskLevel: risk,
      delayReason,
      estimatedDate: estimatedDate.format('YYYY-MM-DD'),
      actualDate: actualDate ? actualDate.format('YYYY-MM-DD') : null,
      handleHours: resolvedAt
        ? Math.max(1, resolvedAt.diff(createdAt, 'hour'))
        : null,
      assignee,
      assigneeId: assignee ? assignee.id : null,
      assigneeName: assignee ? assignee.name : null,
      creator: creatorList[creatorIdx],
      status,
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      resolvedAt: resolvedAt ? resolvedAt.format('YYYY-MM-DD HH:mm:ss') : null,
      resolveNote
    })
  }
  return data
}

const Exception = () => {
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 22 })
  const [dataSource, setDataSource] = useState(generateExceptionData())

  const [search, setSearch] = useState({
    keyword: '',
    type: '',
    riskLevel: '',
    resolved: '',
    assigneeId: ''
  })

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState(null)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignRecord, setAssignRecord] = useState(null)
  const [assignForm] = Form.useForm()

  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveRecord, setResolveRecord] = useState(null)
  const [resolveForm] = Form.useForm()

  const filteredData = useMemo(() => {
    return dataSource.filter(item => {
      if (search.keyword) {
        const kw = search.keyword.toLowerCase()
        if (!item.exceptionNo.toLowerCase().includes(kw) &&
            !item.title.toLowerCase().includes(kw) &&
            !item.medicine.toLowerCase().includes(kw) &&
            (item.relatedAllocation ? !item.relatedAllocation.toLowerCase().includes(kw) : true) &&
            (item.relatedSupplier ? !item.relatedSupplier.name.toLowerCase().includes(kw) : true)) {
          return false
        }
      }
      if (search.type && item.type !== search.type) return false
      if (search.riskLevel && item.riskLevel !== search.riskLevel) return false
      if (search.resolved === 'yes' && item.status !== 'resolved') return false
      if (search.resolved === 'no' && item.status === 'resolved') return false
      if (search.assigneeId) {
        if (search.assigneeId === 'unassigned') {
          if (item.assigneeId) return false
        } else if (item.assigneeId !== search.assigneeId) {
          return false
        }
      }
      return true
    })
  }, [dataSource, search])

  const stats = useMemo(() => {
    const total = dataSource.length
    const unresolved = dataSource.filter(i => i.status !== 'resolved').length
    const highRisk = dataSource.filter(i => i.riskLevel === 'high' || i.riskLevel === 'urgent').length
    const resolvedList = dataSource.filter(i => i.handleHours !== null)
    const avgHours = resolvedList.length > 0
      ? Math.round(resolvedList.reduce((s, i) => s + i.handleHours, 0) / resolvedList.length)
      : 0
    return { total, unresolved, highRisk, avgHours }
  }, [dataSource])

  const handleSearch = () => {
    message.info(`查询到 ${filteredData.length} 条记录`)
  }

  const handleReset = () => {
    setSearch({ keyword: '', type: '', riskLevel: '', resolved: '', assigneeId: '' })
  }

  const handleViewDetail = (record) => {
    setDetailRecord(record)
    setDetailOpen(true)
  }

  const handleOpenAssign = (record) => {
    setAssignRecord(record)
    assignForm.resetFields()
    assignForm.setFieldsValue({ assigneeId: record.assigneeId })
    setAssignOpen(true)
  }

  const handleSubmitAssign = async () => {
    try {
      const values = await assignForm.validateFields()
      const user = userList.find(u => u.id === values.assigneeId)
      setDataSource(prev => prev.map(item =>
        item.id === assignRecord.id ? {
          ...item,
          assigneeId: user.id,
          assigneeName: user.name,
          assignee: user,
          status: item.status === 'open' ? 'processing' : item.status
        } : item
      ))
      message.success(`已指派给 ${user.name}`)
      setAssignOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleOpenResolve = (record) => {
    setResolveRecord(record)
    resolveForm.resetFields()
    resolveForm.setFieldsValue({ resolveNote: '', actualDate: null })
    setResolveOpen(true)
  }

  const handleSubmitResolve = async () => {
    try {
      const values = await resolveForm.validateFields()
      const now = dayjs()
      const actualDateVal = values.actualDate ? values.actualDate.format('YYYY-MM-DD') : null
      const created = dayjs(resolveRecord.createdAt)
      const handleH = Math.max(1, now.diff(created, 'hour'))
      setDataSource(prev => prev.map(item =>
        item.id === resolveRecord.id ? {
          ...item,
          status: 'resolved',
          resolveNote: values.resolveNote,
          actualDate: actualDateVal || item.actualDate || item.estimatedDate,
          resolvedAt: now.format('YYYY-MM-DD HH:mm:ss'),
          handleHours: handleH
        } : item
      ))
      message.success('异常已解决')
      setResolveOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const buildTimeline = (record) => {
    const items = []
    items.push({
      color: 'blue',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>创建异常记录</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.createdAt}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>创建人：{record.creator}</div>
        </div>
      )
    })
    if (record.assigneeName) {
      items.push({
        color: 'cyan',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>指派负责人</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              负责人：<Tag color="blue">{record.assigneeName}</Tag>
            </div>
          </div>
        )
      })
    }
    if (record.status !== 'open') {
      items.push({
        color: record.status === 'resolved' ? 'green' : 'orange',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.status === 'resolved' ? '异常已解决' : '处理中'}
            </div>
            {record.resolvedAt && (
              <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.resolvedAt}</div>
            )}
            {record.resolveNote && (
              <div style={{ fontSize: 13, marginTop: 4, color: '#52c41a' }}>
                解决措施：{record.resolveNote}
              </div>
            )}
          </div>
        )
      })
    } else {
      items.push({
        color: 'gray',
        children: (
          <div>
            <div style={{ fontWeight: 500, color: '#ff4d4f' }}>待处理</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {record.assigneeName ? `等待 ${record.assigneeName} 处理` : '请尽快指派负责人'}
            </div>
          </div>
        )
      })
    }
    return items
  }

  const columns = [
    { title: '异常单号', dataIndex: 'exceptionNo', key: 'exceptionNo', width: 160, fixed: 'left' },
    {
      title: '异常类型',
      dataIndex: 'type',
      key: 'type',
      width: 110,
      render: (type) => (
        <Tag color={exceptionTypeMap[type].color}>{exceptionTypeMap[type].text}</Tag>
      )
    },
    { title: '标题', dataIndex: 'title', key: 'title', width: 260, ellipsis: true },
    {
      title: '关联',
      key: 'related',
      width: 180,
      render: (_, record) => (
        <div>
          {record.relatedAllocation && (
            <div style={{ fontSize: 12, color: '#1677ff' }}>调拨：{record.relatedAllocation}</div>
          )}
          {record.relatedSupplier && (
            <div style={{ fontSize: 12, color: '#722ed1' }}>供应商：{record.relatedSupplier.name}</div>
          )}
          {!record.relatedAllocation && !record.relatedSupplier && (
            <span style={{ color: '#bfbfbf' }}>-</span>
          )}
        </div>
      )
    },
    {
      title: '药品',
      key: 'medicine',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.medicine}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.medicineCode}</div>
        </div>
      )
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level) => (
        <Tag color={riskLevelMap[level].color} style={{ fontWeight: 600 }}>
          {riskLevelMap[level].text}风险
        </Tag>
      )
    },
    {
      title: '交期延误原因',
      dataIndex: 'delayReason',
      key: 'delayReason',
      width: 240,
      ellipsis: true,
      render: (v) => v ? (
        <span style={{ color: '#cf1322', fontWeight: 500 }}>{v}</span>
      ) : '-'
    },
    {
      title: '预计/实际日期',
      key: 'dates',
      width: 160,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: 12 }}>预计：{record.estimatedDate}</div>
          <div style={{ fontSize: 12, color: record.actualDate ? '#52c41a' : '#8c8c8c' }}>
            实际：{record.actualDate || '-'}
          </div>
        </div>
      )
    },
    {
      title: '办理时长',
      dataIndex: 'handleHours',
      key: 'handleHours',
      width: 110,
      align: 'right',
      render: (v) => v !== null ? (
        <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}h</span>
      ) : (
        <span style={{ color: '#ff4d4f', fontWeight: 600 }}>-</span>
      )
    },
    {
      title: '负责人',
      dataIndex: 'assigneeName',
      key: 'assignee',
      width: 130,
      render: (name, record) => {
        if (!name) {
          return <Tag color="default" icon={<UserOutlined />}>未指派</Tag>
        }
        const user = userList.find(u => u.id === record.assigneeId)
        const color = user ? user.color : '#1677ff'
        return (
          <Space size={4}>
            <Avatar size={22} style={{ backgroundColor: color, verticalAlign: 'middle' }}>
              {name.charAt(0)}
            </Avatar>
            <Tag color="blue" style={{ marginLeft: 0 }}>{name}</Tag>
          </Space>
        )
      }
    },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 90 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => (
        <Tag color={exceptionStatusMap[status].color}>{exceptionStatusMap[status].text}</Tag>
      )
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<TeamOutlined />}
            onClick={() => handleOpenAssign(record)}
          >
            指派
          </Button>
          {record.status !== 'resolved' && (
            <Button
              type="primary"
              size="small"
              icon={<SolutionOutlined />}
              onClick={() => handleOpenResolve(record)}
            >
              解决
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="异常记录" />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #e6f4ff 0%, #91caff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ExclamationCircleOutlined style={{ fontSize: 24, color: '#1677ff' }} />
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>异常总数</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#262626' }}>
                  {stats.total}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #fff7e6 0%, #ffd591 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ClockCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>未解决数</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#fa8c16' }}>
                  {stats.unresolved}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #fff1f0 0%, #ffa39e 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <WarningOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>高风险数</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#ff4d4f' }}>
                  {stats.highRisk}
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: 'linear-gradient(135deg, #f6ffed 0%, #b7eb8f 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircleOutlined style={{ fontSize: 24, color: '#52c41a' }} />
              </div>
              <div>
                <div style={{ color: '#8c8c8c', fontSize: 13 }}>平均办理时长</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: '#52c41a' }}>
                  {stats.avgHours}<span style={{ fontSize: 14, fontWeight: 400, marginLeft: 4 }}>h</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16, borderRadius: 4 }}>
        <Space wrap size="middle">
          <Input
            placeholder="异常单号/标题/药品/关联"
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined />}
            value={search.keyword}
            onChange={(e) => setSearch(prev => ({ ...prev, keyword: e.target.value }))}
          />
          <Select
            placeholder="异常类型"
            style={{ width: 150 }}
            allowClear
            options={Object.entries(exceptionTypeMap).map(([k, v]) => ({ value: k, label: v.text }))}
            value={search.type || undefined}
            onChange={(v) => setSearch(prev => ({ ...prev, type: v || '' }))}
          />
          <Select
            placeholder="风险等级"
            style={{ width: 130 }}
            allowClear
            options={Object.entries(riskLevelMap).map(([k, v]) => ({ value: k, label: `${v.text}风险` }))}
            value={search.riskLevel || undefined}
            onChange={(v) => setSearch(prev => ({ ...prev, riskLevel: v || '' }))}
          />
          <Select
            placeholder="解决状态"
            style={{ width: 130 }}
            allowClear
            options={[
              { value: 'no', label: '未解决' },
              { value: 'yes', label: '已解决' }
            ]}
            value={search.resolved || undefined}
            onChange={(v) => setSearch(prev => ({ ...prev, resolved: v || '' }))}
          />
          <Select
            placeholder="负责人"
            style={{ width: 150 }}
            allowClear
            options={[
              { value: 'unassigned', label: '未指派' },
              ...userList.map(u => ({ value: u.id, label: u.name }))
            ]}
            value={search.assigneeId || undefined}
            onChange={(v) => setSearch(prev => ({ ...prev, assigneeId: v || '' }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
      </Card>

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={filteredData}
        pagination={{ ...pagination, total: filteredData.length }}
        onChange={(pagination) => setPagination(pagination)}
        locale={{ emptyText: <Empty description="暂无异常记录" /> }}
      />

      <Modal
        title="异常详情"
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setDetailOpen(false)}>关闭</Button>
        ]}
        width={880}
        destroyOnClose
      >
        {detailRecord && (
          <div>
            <div style={{
              padding: 16,
              background: detailRecord.status === 'resolved'
                ? 'linear-gradient(135deg, #f6ffed 0%, #ffffff 100%)'
                : detailRecord.riskLevel === 'urgent' || detailRecord.riskLevel === 'high'
                  ? 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)'
                  : 'linear-gradient(135deg, #e6f4ff 0%, #ffffff 100%)',
              borderRadius: 8,
              marginBottom: 16,
              border: `1px solid ${detailRecord.status === 'resolved' ? '#b7eb8f' : '#91caff'}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                <Tag color={exceptionTypeMap[detailRecord.type].color} style={{ fontSize: 14, padding: '2px 10px' }}>
                  {exceptionTypeMap[detailRecord.type].text}
                </Tag>
                <Tag color={riskLevelMap[detailRecord.riskLevel].color} style={{ fontWeight: 600 }}>
                  {riskLevelMap[detailRecord.riskLevel].text}风险
                </Tag>
                <Tag color={exceptionStatusMap[detailRecord.status].color}>
                  {exceptionStatusMap[detailRecord.status].text}
                </Tag>
                <span style={{ fontWeight: 600, fontSize: 15 }}>{detailRecord.title}</span>
              </div>
              <div style={{ color: '#595959', fontSize: 13 }}>
                异常单号：<strong>{detailRecord.exceptionNo}</strong>
                <span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
                创建人：{detailRecord.creator}
                <span style={{ margin: '0 12px', color: '#d9d9d9' }}>|</span>
                创建时间：{detailRecord.createdAt}
              </div>
            </div>

            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="药品" span={1}>
                {detailRecord.medicine}（{detailRecord.medicineCode}）
              </Descriptions.Item>
              <Descriptions.Item label="预计日期/实际日期" span={1}>
                <div>预计：{detailRecord.estimatedDate}</div>
                <div style={{ color: detailRecord.actualDate ? '#52c41a' : '#8c8c8c' }}>
                  实际：{detailRecord.actualDate || '-'}
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="关联调拨单" span={1}>
                {detailRecord.relatedAllocation || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联供应商" span={1}>
                {detailRecord.relatedSupplier ? detailRecord.relatedSupplier.name : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="办理时长" span={1}>
                {detailRecord.handleHours !== null
                  ? <span style={{ color: '#1677ff', fontWeight: 600 }}>{detailRecord.handleHours} 小时</span>
                  : <span style={{ color: '#ff4d4f', fontWeight: 600 }}>办理中</span>}
              </Descriptions.Item>
              <Descriptions.Item label="负责人" span={1}>
                {detailRecord.assigneeName ? (
                  <Space>
                    <Avatar size={20} style={{
                      backgroundColor: userList.find(u => u.id === detailRecord.assigneeId)?.color || '#1677ff'
                    }}>
                      {detailRecord.assigneeName.charAt(0)}
                    </Avatar>
                    <Tag color="blue">{detailRecord.assigneeName}</Tag>
                  </Space>
                ) : <Tag color="default">未指派</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="交期延误原因" span={2}>
                <span style={{ color: '#cf1322', fontWeight: 500 }}>{detailRecord.delayReason}</span>
              </Descriptions.Item>
              {detailRecord.resolveNote && (
                <Descriptions.Item label="解决措施" span={2}>
                  <span style={{ color: '#389e0d' }}>{detailRecord.resolveNote}</span>
                </Descriptions.Item>
              )}
              {detailRecord.resolvedAt && (
                <Descriptions.Item label="解决时间" span={2}>
                  {detailRecord.resolvedAt}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider orientation="left" style={{ margin: '16px 0' }}>处理时间线</Divider>
            <Timeline items={buildTimeline(detailRecord)} />
          </div>
        )}
      </Modal>

      <Modal
        title="指派负责人"
        open={assignOpen}
        onOk={handleSubmitAssign}
        onCancel={() => setAssignOpen(false)}
        width={480}
        destroyOnClose
      >
        {assignRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 4 }}>
            <div style={{ color: '#595959', fontSize: 13 }}>异常：{assignRecord.exceptionNo}</div>
            <div style={{ fontWeight: 500, marginTop: 4 }}>{assignRecord.title}</div>
          </div>
        )}
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="assigneeId"
            label="选择负责人"
            rules={[{ required: true, message: '请选择负责人' }]}
          >
            <Select
              placeholder="请选择负责人"
              options={userList.map(u => ({
                value: u.id,
                label: (
                  <Space>
                    <Avatar size={22} style={{ backgroundColor: u.color }}>{u.avatar}</Avatar>
                    <span>{u.name}</span>
                  </Space>
                )
              }))}
              optionLabelProp="label"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="解决异常"
        open={resolveOpen}
        onOk={handleSubmitResolve}
        onCancel={() => setResolveOpen(false)}
        width={560}
        okText="确认解决"
        cancelText="取消"
        destroyOnClose
      >
        {resolveRecord && (
          <div style={{ marginBottom: 16, padding: 12, background: '#e6f4ff', borderRadius: 4, border: '1px solid #91caff' }}>
            <div style={{ color: '#1677ff', fontSize: 13 }}>异常：{resolveRecord.exceptionNo}</div>
            <div style={{ fontWeight: 500, marginTop: 4 }}>{resolveRecord.title}</div>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
              创建于 {resolveRecord.createdAt}
            </div>
          </div>
        )}
        <Form form={resolveForm} layout="vertical">
          <Form.Item
            name="resolveNote"
            label="解决措施"
            rules={[{ required: true, message: '请输入解决措施' }]}
          >
            <Input.TextArea
              rows={5}
              placeholder="请详细说明解决措施、处理过程和最终结果，便于后续追溯分析"
              maxLength={800}
              showCount
            />
          </Form.Item>
          <Form.Item
            label="实际日期（可选）"
            name="actualDate"
          >
            <Select
              placeholder="选择实际完成/交货日期"
              allowClear
              style={{ width: '100%' }}
              options={(() => {
                const opts = []
                for (let i = 0; i < 14; i++) {
                  const d = dayjs().subtract(13 - i, 'day')
                  opts.push({
                    value: d,
                    label: d.format('YYYY-MM-DD')
                  })
                }
                return opts
              })()}
              labelInValue
              fieldNames={{ label: 'label', value: 'value' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Exception
