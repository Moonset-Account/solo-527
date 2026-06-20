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
  Tabs,
  InputNumber,
  Checkbox,
  DatePicker,
  Card,
  Avatar,
  Tooltip,
  Divider,
  Rate
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  CheckOutlined,
  WarningOutlined,
  InboxOutlined,
  ArrowRightOutlined,
  FileTextOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'

const receiptStatusMap = {
  pending: { text: '待签收', color: 'orange' },
  partial: { text: '部分签收', color: 'cyan' },
  received: { text: '已签收', color: 'green' },
  discrepancy: { text: '差异', color: 'red' }
}

const discrepancyTypeOptions = [
  { value: 'short', label: '数量短缺' },
  { value: 'over', label: '数量多余' },
  { value: 'damaged', label: '损坏' },
  { value: 'expired', label: '过期' },
  { value: 'batch_error', label: '批次错误' },
  { value: 'medicine_error', label: '药品错误' }
]

const warehouseList = ['北京仓', '上海仓', '广州仓', '深圳仓', '成都仓', '武汉仓']

const receiverList = [
  { id: 1, name: '李签收', avatar: 'L' },
  { id: 2, name: '王入库', avatar: 'W' },
  { id: 3, name: '张验收', avatar: 'Z' },
  { id: 4, name: '赵质检', avatar: 'Z' },
  { id: 5, name: '陈收货', avatar: 'C' }
]

const avatarColors = ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96']

const getAvatarColor = (name) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

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
  { name: '健胃消食片', code: 'MED-010' },
  { name: '感冒清热颗粒', code: 'MED-011' },
  { name: '蒙脱石散', code: 'MED-012' }
]

const generateMockData = () => {
  const data = []
  const statuses = ['pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'pending', 'partial', 'received', 'received', 'received', 'received', 'received', 'received', 'discrepancy', 'received', 'partial', 'received', 'discrepancy', 'received', 'received']

  for (let i = 1; i <= 22; i++) {
    const medicine = medicines[(i - 1) % medicines.length]
    const fromIdx = (i - 1) % warehouseList.length
    const toIdx = (fromIdx + 2 + (i % 3)) % warehouseList.length
    const quantity = Math.floor(Math.random() * 400) + 50
    const status = statuses[(i - 1) % statuses.length]
    const receiver = receiverList[(i - 1) % receiverList.length]
    const month = String(((i * 2) % 6) + 1).padStart(2, '0')
    const day = String((i % 28) + 1).padStart(2, '0')
    const hour = String(8 + (i % 10)).padStart(2, '0')
    const min = String((i * 11) % 60).padStart(2, '0')

    let actualQty = null
    let diffQty = null
    let receiptTime = null
    let receiverName = null
    let receiverId = null
    let batchNo = `${medicine.code}-B${2025}${String(i).padStart(3, '0')}`
    let remark = null

    if (status !== 'pending') {
      receiverName = receiver.name
      receiverId = receiver.id
      receiptTime = `2025-${month}-${day} ${hour}:${min}:00`

      if (status === 'received') {
        actualQty = quantity
        diffQty = 0
      } else if (status === 'partial') {
        actualQty = Math.floor(quantity * (0.6 + Math.random() * 0.3))
        diffQty = actualQty - quantity
      } else if (status === 'discrepancy') {
        actualQty = Math.floor(quantity * (0.7 + Math.random() * 0.4))
        if (actualQty > quantity) actualQty = quantity - Math.floor(Math.random() * 20) - 5
        diffQty = actualQty - quantity
        remark = '发现部分货品外包装破损，已拒收破损部分，等待补发。'
      }
    }

    const expectedDate = dayjs(`2025-${month}-${day}`)
    const actualDate = status !== 'pending'
      ? expectedDate.add(Math.floor(Math.random() * 3), 'day').format('YYYY-MM-DD')
      : null

    data.push({
      id: i,
      allocationNo: `AL2025${month}${String(100 + i).padStart(4, '0')}`,
      medicineName: medicine.name,
      medicineCode: medicine.code,
      batchNo,
      fromWarehouse: warehouseList[fromIdx],
      toWarehouse: warehouseList[toIdx],
      quantity,
      actualQty,
      diffQty,
      expectedDate: expectedDate.format('YYYY-MM-DD'),
      actualDate,
      status,
      receiverId,
      receiverName,
      receiptTime,
      remark,
      rating: status === 'received' ? (Math.floor(Math.random() * 2) + 4) : null
    })
  }
  return data
}

const ReceiptManagement = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource, setDataSource] = useState(generateMockData)
  const [activeTab, setActiveTab] = useState('pending')
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 22 })

  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [discrepancyModalOpen, setDiscrepancyModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  const [receiptForm] = Form.useForm()
  const [discrepancyForm] = Form.useForm()
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false)

  const [keyword, setKeyword] = useState('')
  const [filterStatus, setFilterStatus] = useState(null)
  const [filterWarehouse, setFilterWarehouse] = useState(null)
  const [dateRange, setDateRange] = useState(null)

  const pendingData = dataSource.filter(i => i.status === 'pending' || i.status === 'partial')
  const receivedData = dataSource.filter(i => i.status === 'received' || i.status === 'discrepancy')
  const displayData = activeTab === 'pending' ? pendingData : receivedData

  const columns = [
    {
      title: '调拨单号',
      dataIndex: 'allocationNo',
      key: 'allocationNo',
      width: 150,
      render: (val) => <span style={{ color: '#1677ff', fontFamily: 'monospace' }}>{val}</span>
    },
    {
      title: '药品+批次',
      key: 'medicine',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.medicineName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>
            <span>{record.medicineCode}</span>
            <span style={{ margin: '0 4px' }}>|</span>
            <span>批次:{record.batchNo}</span>
          </div>
        </div>
      )
    },
    {
      title: '源仓库 → 目标仓库',
      key: 'warehouses',
      width: 200,
      render: (_, record) => (
        <Space size={6}>
          <Tag color="blue">{record.fromWarehouse}</Tag>
          <ArrowRightOutlined style={{ color: '#bfbfbf' }} />
          <Tag color="green">{record.toWarehouse}</Tag>
        </Space>
      )
    },
    {
      title: '数量',
      key: 'qty',
      width: 140,
      render: (_, record) => (
        <div>
          <div>
            <span style={{ color: '#8c8c8c' }}>调拨：</span>
            <span>{record.quantity}</span>
          </div>
          {record.actualQty !== null && (
            <div>
              <span style={{ color: '#8c8c8c' }}>实收：</span>
              <span style={{ color: record.actualQty < record.quantity ? '#ff4d4f' : '#52c41a' }}>
                {record.actualQty}
              </span>
            </div>
          )}
        </div>
      )
    },
    {
      title: '预计到货/实际到货',
      key: 'dates',
      width: 180,
      render: (_, record) => (
        <div style={{ lineHeight: 1.8 }}>
          <div>
            <CalendarOutlined style={{ color: '#8c8c8c', marginRight: 4 }} />
            <span style={{ color: '#8c8c8c' }}>预计：</span>
            <span>{record.expectedDate}</span>
          </div>
          <div>
            <InboxOutlined style={{ color: '#8c8c8c', marginRight: 4 }} />
            <span style={{ color: '#8c8c8c' }}>实际：</span>
            <span style={{ color: record.actualDate ? '#262626' : '#bfbfbf' }}>
              {record.actualDate || '—'}
            </span>
          </div>
        </div>
      )
    },
    {
      title: '签收状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={receiptStatusMap[status].color}>
          {receiptStatusMap[status].text}
        </Tag>
      )
    },
    {
      title: '差异数量',
      dataIndex: 'diffQty',
      key: 'diffQty',
      width: 100,
      render: (val) => {
        if (val === null || val === 0) return <span style={{ color: '#bfbfbf' }}>—</span>
        return (
          <span style={{
            color: val > 0 ? '#52c41a' : '#ff4d4f',
            fontWeight: 600
          }}>
            {val > 0 ? `+${val}` : val}
          </span>
        )
      }
    },
    {
      title: '签收人',
      key: 'receiver',
      width: 110,
      render: (_, record) => {
        if (!record.receiverName) return <span style={{ color: '#bfbfbf' }}>—</span>
        return (
          <Space size={6}>
            <Avatar size={22} style={{ backgroundColor: getAvatarColor(record.receiverName), fontSize: 11 }}>
              {record.receiverName.charAt(0)}
            </Avatar>
            <span>{record.receiverName}</span>
          </Space>
        )
      }
    },
    {
      title: '签收时间',
      dataIndex: 'receiptTime',
      key: 'receiptTime',
      width: 170,
      render: (val) => val || <span style={{ color: '#bfbfbf' }}>—</span>
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {(record.status === 'pending' || record.status === 'partial') && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleReceipt(record)}
            >
              签收
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {(record.status === 'discrepancy' || record.status === 'partial' || record.status === 'received') && (
            record.diffQty !== 0 && (
              <Button
                type="link"
                size="small"
                danger
                icon={<WarningOutlined />}
                onClick={() => handleCreateDiscrepancy(record)}
              >
                创建差异
              </Button>
            )
          )}
        </Space>
      )
    }
  ]

  const handleReceipt = (record) => {
    setCurrentRecord(record)
    setHasDiscrepancy(false)
    receiptForm.resetFields()
    receiptForm.setFieldsValue({
      actualQty: record.status === 'partial'
        ? record.quantity - (record.actualQty || 0)
        : record.quantity,
      batchNo: record.batchNo,
      remark: '',
      hasDiscrepancy: false,
      discrepancyType: null,
      discrepancyQty: 0
    })
    setReceiptModalOpen(true)
  }

  const handleViewDetail = (record) => {
    setCurrentRecord(record)
    setDetailModalOpen(true)
  }

  const handleCreateDiscrepancy = (record) => {
    setCurrentRecord(record)
    discrepancyForm.resetFields()
    discrepancyForm.setFieldsValue({
      allocationNo: record.allocationNo,
      medicineName: record.medicineName,
      medicineCode: record.medicineCode,
      batchNo: record.batchNo,
      expectedQty: record.quantity,
      actualQty: record.actualQty,
      diffQty: record.diffQty,
      discrepancyType: record.diffQty < 0 ? 'short' : record.diffQty > 0 ? 'over' : null,
      description: record.remark || ''
    })
    setDiscrepancyModalOpen(true)
  }

  const handleReceiptSubmit = async () => {
    try {
      const values = await receiptForm.validateFields()
      const isPartial = values.actualQty < currentRecord.quantity
      const newStatus = values.hasDiscrepancy ? 'discrepancy' : (isPartial ? 'partial' : 'received')
      const receiver = receiverList[0]
      const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
      const today = dayjs().format('YYYY-MM-DD')

      let actualTotal = values.actualQty
      let diffTotal = actualTotal - currentRecord.quantity
      if (currentRecord.status === 'partial' && currentRecord.actualQty) {
        actualTotal = currentRecord.actualQty + values.actualQty
        diffTotal = actualTotal - currentRecord.quantity
      }

      setDataSource(dataSource.map(item =>
        item.id === currentRecord.id
          ? {
              ...item,
              status: diffTotal < 0 || values.hasDiscrepancy ? 'discrepancy' : (actualTotal < item.quantity ? 'partial' : 'received'),
              actualQty: actualTotal,
              diffQty: diffTotal,
              actualDate: today,
              receiverId: receiver.id,
              receiverName: receiver.name,
              receiptTime: now,
              remark: values.remark || item.remark,
              rating: actualTotal >= item.quantity && !values.hasDiscrepancy ? 5 : item.rating
            }
          : item
      ))
      message.success('签收成功')
      setReceiptModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleDiscrepancySubmit = async () => {
    try {
      const values = await discrepancyForm.validateFields()
      message.success('差异记录已创建，单号：DS' + Date.now().toString().slice(-8))
      setDiscrepancyModalOpen(false)
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
          i.allocationNo.includes(keyword) ||
          i.medicineName.includes(keyword) ||
          i.medicineCode.includes(keyword) ||
          i.batchNo.includes(keyword)
        )
      }
      if (filterStatus) {
        filtered = filtered.filter(i => i.status === filterStatus)
      }
      if (filterWarehouse) {
        filtered = filtered.filter(i =>
          i.fromWarehouse === filterWarehouse || i.toWarehouse === filterWarehouse
        )
      }
      if (dateRange && dateRange.length === 2) {
        const start = dateRange[0].format('YYYY-MM-DD')
        const end = dateRange[1].format('YYYY-MM-DD')
        filtered = filtered.filter(i => i.expectedDate >= start && i.expectedDate <= end)
      }
      setDataSource(filtered)
      setPagination(p => ({ ...p, current: 1, total: filtered.length }))
      setLoading(false)
    }, 300)
  }

  const handleReset = () => {
    setKeyword('')
    setFilterStatus(null)
    setFilterWarehouse(null)
    setDateRange(null)
    const data = generateMockData()
    setDataSource(data)
    setPagination({ current: 1, pageSize: 10, total: data.length })
  }

  const handleTabChange = (key) => {
    setActiveTab(key)
  }

  const handleTableChange = (page) => {
    setPagination(page)
  }

  const fetchData = async (params) => {
    setLoading(true)
    try {
      // TODO: 调用API: getReceiptList(params)
      // const res = await request({ url: '/admin/receipts', method: 'get', params })
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const renderTabs = () => (
    <Tabs
      activeKey={activeTab}
      onChange={handleTabChange}
      items={[
        {
          key: 'pending',
          label: (
            <Space>
              <span>待签收</span>
              <Tag color="orange" style={{ marginLeft: 4 }}>{pendingData.length}</Tag>
            </Space>
          )
        },
        {
          key: 'received',
          label: (
            <Space>
              <span>已签收</span>
              <Tag color="green" style={{ marginLeft: 4 }}>{receivedData.length}</Tag>
            </Space>
          )
        }
      ]}
    />
  )

  return (
    <div>
      <PageHeader title="签收管理" />

      <div style={{ background: '#fff', padding: '16px 16px 0', marginBottom: 16, borderRadius: 4 }}>
        <Space wrap size="middle" style={{ marginBottom: 12 }}>
          <Input
            placeholder="调拨单号/药品/批次号"
            style={{ width: 240 }}
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Select
            placeholder="签收状态"
            style={{ width: 140 }}
            allowClear
            value={filterStatus}
            onChange={setFilterStatus}
            options={Object.entries(receiptStatusMap).map(([key, val]) => ({
              value: key, label: val.text
            }))}
          />
          <Select
            placeholder="仓库（源/目标）"
            style={{ width: 180 }}
            allowClear
            value={filterWarehouse}
            onChange={setFilterWarehouse}
            options={warehouseList.map(w => ({ value: w, label: w }))}
          />
          <DatePicker.RangePicker
            style={{ width: 280 }}
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={setDateRange}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        {renderTabs()}
      </div>

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={displayData}
        pagination={{ ...pagination, total: displayData.length }}
        onChange={handleTableChange}
      />

      <Modal
        title="签收详情"
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
                <div>
                  <span style={{ color: '#8c8c8c' }}>调拨单号：</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 500, color: '#1677ff' }}>
                    {currentRecord.allocationNo}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>签收状态：</span>
                  <Tag color={receiptStatusMap[currentRecord.status].color}>
                    {receiptStatusMap[currentRecord.status].text}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>药品名称：</span>{currentRecord.medicineName}</div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>药品编码：</span>{currentRecord.medicineCode}</div>
              </Col>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>批次号：</span>{currentRecord.batchNo}</div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>运输路径：</span>
                  <Space size={4}>
                    <Tag color="blue">{currentRecord.fromWarehouse}</Tag>
                    <ArrowRightOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />
                    <Tag color="green">{currentRecord.toWarehouse}</Tag>
                  </Space>
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 8]}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>调拨数量</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#1677ff' }}>{currentRecord.quantity}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f6ffed' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>实收数量</div>
                  <div style={{ fontSize: 22, fontWeight: 600, color: '#52c41a' }}>
                    {currentRecord.actualQty !== null ? currentRecord.actualQty : '—'}
                  </div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: currentRecord.diffQty < 0 ? '#fff1f0' : '#fffbe6' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>差异数量</div>
                  <div style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: currentRecord.diffQty > 0 ? '#52c41a' : currentRecord.diffQty < 0 ? '#ff4d4f' : '#262626'
                  }}>
                    {currentRecord.diffQty !== null && currentRecord.diffQty !== 0
                      ? (currentRecord.diffQty > 0 ? `+${currentRecord.diffQty}` : currentRecord.diffQty)
                      : '—'}
                  </div>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>预计到货日：</span>{currentRecord.expectedDate}</div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>实际到货日：</span>
                  <span style={{ color: currentRecord.actualDate ? '#262626' : '#bfbfbf' }}>
                    {currentRecord.actualDate || '—'}
                  </span>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>签收人：</span>
                  {currentRecord.receiverName ? (
                    <Space size={6}>
                      <Avatar size={20} style={{ backgroundColor: getAvatarColor(currentRecord.receiverName), fontSize: 11 }}>
                        {currentRecord.receiverName.charAt(0)}
                      </Avatar>
                      <span>{currentRecord.receiverName}</span>
                    </Space>
                  ) : <span style={{ color: '#bfbfbf' }}>—</span>}
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>签收时间：</span>
                  <span style={{ color: currentRecord.receiptTime ? '#262626' : '#bfbfbf' }}>
                    {currentRecord.receiptTime || '—'}
                  </span>
                </div>
              </Col>
            </Row>

            {currentRecord.rating && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <span style={{ color: '#8c8c8c' }}>签收评价：</span>
                  <Rate disabled value={currentRecord.rating} />
                  <span style={{ marginLeft: 8, color: '#faad14' }}>{currentRecord.rating}分</span>
                </div>
              </>
            )}

            {currentRecord.remark && (
              <>
                <Divider style={{ margin: '12px 0' }} />
                <div>
                  <div style={{ color: '#8c8c8c', marginBottom: 4 }}>
                    <FileTextOutlined style={{ marginRight: 4 }} />签收备注
                  </div>
                  <div style={{
                    background: '#f5f5f5',
                    padding: 12,
                    borderRadius: 4,
                    lineHeight: 1.8
                  }}>
                    {currentRecord.remark}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal
        title={currentRecord?.status === 'partial' ? '继续签收' : '办理签收'}
        open={receiptModalOpen}
        onOk={handleReceiptSubmit}
        onCancel={() => setReceiptModalOpen(false)}
        width={560}
        destroyOnClose
        okText="确认签收"
      >
        {currentRecord && (
          <div>
            <div style={{ padding: 12, background: '#f5f5f5', borderRadius: 4, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>调拨单号</div>
                  <div style={{ fontFamily: 'monospace', fontWeight: 500 }}>{currentRecord.allocationNo}</div>
                </Col>
                <Col span={12}>
                  <div style={{ color: '#8c8c8c', fontSize: 12 }}>药品 / 批次</div>
                  <div>{currentRecord.medicineName}</div>
                  <div style={{ fontSize: 12, color: '#999' }}>{currentRecord.batchNo}</div>
                </Col>
              </Row>
              {currentRecord.status === 'partial' && (
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px dashed #d9d9d9' }}>
                  <Row gutter={16}>
                    <Col span={8}>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>应调拨</div>
                      <div>{currentRecord.quantity}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>已签收</div>
                      <div style={{ color: '#52c41a' }}>{currentRecord.actualQty || 0}</div>
                    </Col>
                    <Col span={8}>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>待签收</div>
                      <div style={{ color: '#faad14' }}>{currentRecord.quantity - (currentRecord.actualQty || 0)}</div>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
            <Form form={receiptForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="actualQty"
                    label="实收数量"
                    rules={[{ required: true, message: '请输入实收数量' }]}
                  >
                    <InputNumber
                      min={0}
                      max={currentRecord.quantity - (currentRecord.actualQty || 0)}
                      style={{ width: '100%' }}
                      addonAfter={`/ ${currentRecord.quantity - (currentRecord.actualQty || 0)}`}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="batchNo"
                    label="批次号"
                    rules={[{ required: true, message: '请输入批次号' }]}
                  >
                    <Input placeholder="请输入或确认批次号" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="remark" label="签收备注">
                <Input.TextArea rows={2} placeholder="如有特殊情况请填写..." showCount maxLength={200} />
              </Form.Item>
              <Form.Item name="hasDiscrepancy" valuePropName="checked">
                <Checkbox onChange={(e) => setHasDiscrepancy(e.target.checked)}>
                  <span style={{ color: '#ff4d4f' }}>发现差异</span>（勾选后请填写差异信息）
                </Checkbox>
              </Form.Item>
              {hasDiscrepancy && (
                <div style={{
                  padding: 12,
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: 4,
                  marginBottom: 16
                }}>
                  <Row gutter={16}>
                    <Col span={14}>
                      <Form.Item
                        name="discrepancyType"
                        label="差异类型"
                        rules={[{ required: true, message: '请选择差异类型' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select placeholder="请选择差异类型" options={discrepancyTypeOptions} />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item
                        name="discrepancyQty"
                        label="差异数量"
                        rules={[{ required: true, message: '请输入差异数量' }]}
                        style={{ marginBottom: 0 }}
                      >
                        <InputNumber min={0} style={{ width: '100%' }} placeholder="件数" />
                      </Form.Item>
                    </Col>
                  </Row>
                </div>
              )}
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="创建差异记录"
        open={discrepancyModalOpen}
        onOk={handleDiscrepancySubmit}
        onCancel={() => setDiscrepancyModalOpen(false)}
        width={640}
        destroyOnClose
        okText="提交创建"
      >
        {currentRecord && (
          <div>
            <div style={{ padding: 12, background: '#fff1f0', borderRadius: 4, marginBottom: 16 }}>
              <Tooltip title="该差异记录将关联到此调拨单">
                <FileTextOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                <span style={{ color: '#cf1322' }}>系统将基于签收数据自动创建差异记录，您可补充描述信息。</span>
              </Tooltip>
            </div>
            <Form form={discrepancyForm} layout="vertical">
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="allocationNo" label="关联调拨单号">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="batchNo" label="批次号">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="medicineName" label="药品名称">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="medicineCode" label="药品编码">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="expectedQty" label="期望数量">
                    <InputNumber style={{ width: '100%' }} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="actualQty" label="实际数量">
                    <InputNumber style={{ width: '100%' }} disabled />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="diffQty" label="差异数量">
                    <InputNumber style={{ width: '100%' }} disabled />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="discrepancyType"
                    label="差异类型"
                    rules={[{ required: true, message: '请选择差异类型' }]}
                  >
                    <Select placeholder="请选择差异类型" options={discrepancyTypeOptions} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item
                    name="description"
                    label="差异描述"
                    rules={[{ required: true, message: '请描述差异情况' }]}
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="请详细描述差异的具体情况，如破损数量、过期程度、错误批次信息等..."
                      showCount
                      maxLength={500}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ReceiptManagement
