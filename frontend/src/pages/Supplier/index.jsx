import { useState, useMemo } from 'react'
import { Tabs, Button, Space, Input, Select, Modal, Form, message, Row, Col, Rate, Tag, DatePicker, Timeline, InputNumber, Radio, Divider, Popconfirm, Card, Descriptions } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined, CheckOutlined, ClockCircleOutlined, StopOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'
import { getSupplierList, createSupplier, updateSupplier, deleteSupplier, getSupplierDetail } from '@/api/supplier'

const { RangePicker } = DatePicker

const replyStatusMap = {
  pending: { text: '待回复', color: 'orange' },
  replied: { text: '已回复', color: 'blue' },
  confirmed: { text: '已确认', color: 'green' },
  delayed: { text: '延误', color: 'red' }
}

const supplierStatusMap = {
  active: { text: '合作中', color: 'green' },
  inactive: { text: '已停用', color: 'default' }
}

const medicineList = [
  { code: 'MED001', name: '阿莫西林胶囊' },
  { code: 'MED002', name: '布洛芬缓释片' },
  { code: 'MED003', name: '头孢克肟片' },
  { code: 'MED004', name: '奥美拉唑肠溶胶囊' },
  { code: 'MED005', name: '盐酸左氧氟沙星片' },
  { code: 'MED006', name: '复方氨酚烷胺片' },
  { code: 'MED007', name: '硝苯地平缓释片' },
  { code: 'MED008', name: '二甲双胍缓释片' },
  { code: 'MED009', name: '阿托伐他汀钙片' },
  { code: 'MED010', name: '氯雷他定片' },
  { code: 'MED011', name: '蒙脱石散' },
  { code: 'MED012', name: '双歧杆菌三联活菌胶囊' }
]

const supplierNameList = [
  '国药控股有限公司', '九州通医药集团', '上药控股有限公司', '华润医药商业',
  '瑞康医药集团', '南京医药股份', '华东医药股份', '中国医药健康',
  '海王生物工程', '英特药业有限公司', '嘉事堂药业', '人民同泰医药'
]

const generateReplyData = () => {
  const statuses = ['pending', 'replied', 'confirmed', 'delayed']
  const delayReasons = [
    '厂家原材料供应不足', '生产线临时故障维修', '物流运输途中延误',
    '质量检验未通过需返工', '天气原因导致运输受阻', '报关手续延迟',
    '节假日产能不足', '供应链调整临时缺货'
  ]
  const data = []
  for (let i = 1; i <= 28; i++) {
    const status = statuses[i % 4]
    const createdAt = dayjs().subtract(30 + Math.floor(Math.random() * 30), 'day').add(Math.floor(Math.random() * 86400), 'second')
    const repliedAt = status === 'pending' ? null : createdAt.add(2 + Math.floor(Math.random() * 72), 'hour')
    const deadline = createdAt.add(3, 'day')
    const promiseDate = createdAt.add(5 + Math.floor(Math.random() * 15), 'day')
    const isDelayed = status === 'delayed' || (repliedAt && repliedAt.isAfter(deadline))
    const delayDays = isDelayed ? Math.floor(Math.random() * 10) + 1 : 0
    const actualDate = status === 'confirmed' ? promiseDate.add(Math.floor(Math.random() * 5) - 2, 'day') : null
    const medIdx = i % medicineList.length
    const supIdx = i % supplierNameList.length
    data.push({
      id: i,
      replyNo: `SR${dayjs(createdAt).format('YYYYMMDD')}${String(i).padStart(4, '0')}`,
      replenishmentId: `RP${dayjs(createdAt).format('YYYYMM')}${String(100 + i).padStart(4, '0')}`,
      supplierId: supIdx + 1,
      supplierName: supplierNameList[supIdx],
      medicineCode: medicineList[medIdx].code,
      medicineName: medicineList[medIdx].name,
      quoteQuantity: Math.floor(Math.random() * 500) + 50,
      quotePrice: +(Math.random() * 80 + 5).toFixed(2),
      promiseDeliveryDate: promiseDate.format('YYYY-MM-DD'),
      actualDeliveryDate: actualDate ? actualDate.format('YYYY-MM-DD') : null,
      status: isDelayed && status !== 'pending' ? 'delayed' : status,
      delayReason: isDelayed ? delayReasons[i % delayReasons.length] : '',
      delayDays,
      createdAt: createdAt.format('YYYY-MM-DD HH:mm:ss'),
      repliedAt: repliedAt ? repliedAt.format('YYYY-MM-DD HH:mm:ss') : null,
      deadline: deadline.format('YYYY-MM-DD HH:mm:ss'),
      handleHours: repliedAt ? Math.max(0, repliedAt.diff(createdAt, 'hour')) : null,
      supplierRemark: status !== 'pending' ? `供应商${supplierNameList[supIdx]}已确认报价，预计${promiseDate.format('MM月DD日')}发货。` : '',
      internalRemark: i % 3 === 0 ? '优先跟进该供应商，历史合作记录良好。' : i % 5 === 0 ? '注意该供应商近期出现多次延误情况。' : ''
    })
  }
  return data
}

const generateSupplierData = () => {
  const data = []
  for (let i = 1; i <= 12; i++) {
    const supIdx = (i - 1) % supplierNameList.length
    data.push({
      id: i,
      code: `SUP${String(i).padStart(4, '0')}`,
      name: supplierNameList[supIdx],
      contact: ['张经理', '李主管', '王总', '赵经理', '孙主管', '周经理', '吴总', '郑主管', '冯经理', '陈主管', '褚经理', '卫总'][(i - 1) % 12],
      phone: `13${8 + (i % 2)}${String(10000000 + i * 137).slice(0, 8)}`,
      email: `contact${i}@supplier${i}.com`,
      rating: +(3 + Math.random() * 2).toFixed(1),
      status: i % 11 === 0 ? 'inactive' : 'active',
      address: ['北京市朝阳区建国路88号', '上海市浦东新区张江路100号', '广州市天河区天河路200号', '深圳市南山区科技园路300号', '成都市武侯区人民南路四段'][i % 5]
    })
  }
  return data
}

const Supplier = () => {
  const [activeTab, setActiveTab] = useState('reply')
  const [replyPagination, setReplyPagination] = useState({ current: 1, pageSize: 10, total: 28 })
  const [supplierPagination, setSupplierPagination] = useState({ current: 1, pageSize: 10, total: 12 })
  const [loading, setLoading] = useState(false)

  const [replyDataSource, setReplyDataSource] = useState(generateReplyData())
  const [supplierDataSource, setSupplierDataSource] = useState(generateSupplierData())

  const [replySearch, setReplySearch] = useState({ keyword: '', supplierId: '', status: '', dateRange: null })
  const [supplierSearch, setSupplierSearch] = useState({ keyword: '', status: '' })

  const [replyDetailOpen, setReplyDetailOpen] = useState(false)
  const [replyDetailRecord, setReplyDetailRecord] = useState(null)

  const [delayModalOpen, setDelayModalOpen] = useState(false)
  const [delayRecord, setDelayRecord] = useState(null)
  const [delayForm] = Form.useForm()

  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [confirmRecord, setConfirmRecord] = useState(null)

  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [statusRecord, setStatusRecord] = useState(null)
  const [statusForm] = Form.useForm()

  const [supplierModalOpen, setSupplierModalOpen] = useState(false)
  const [supplierModalType, setSupplierModalType] = useState('create')
  const [supplierEditingRecord, setSupplierEditingRecord] = useState(null)
  const [supplierForm] = Form.useForm()

  const filteredReplyData = useMemo(() => {
    return replyDataSource.filter(item => {
      if (replySearch.keyword) {
        const kw = replySearch.keyword.toLowerCase()
        if (!item.replyNo.toLowerCase().includes(kw) &&
            !item.replenishmentId.toLowerCase().includes(kw) &&
            !item.supplierName.toLowerCase().includes(kw) &&
            !item.medicineName.toLowerCase().includes(kw) &&
            !item.medicineCode.toLowerCase().includes(kw)) {
          return false
        }
      }
      if (replySearch.supplierId && item.supplierId !== replySearch.supplierId) return false
      if (replySearch.status && item.status !== replySearch.status) return false
      if (replySearch.dateRange && replySearch.dateRange.length === 2) {
        const start = replySearch.dateRange[0].startOf('day')
        const end = replySearch.dateRange[1].endOf('day')
        const createdAt = dayjs(item.createdAt)
        if (createdAt.isBefore(start) || createdAt.isAfter(end)) return false
      }
      return true
    })
  }, [replyDataSource, replySearch])

  const filteredSupplierData = useMemo(() => {
    return supplierDataSource.filter(item => {
      if (supplierSearch.keyword) {
        const kw = supplierSearch.keyword.toLowerCase()
        if (!item.name.toLowerCase().includes(kw) &&
            !item.code.toLowerCase().includes(kw) &&
            !item.contact.toLowerCase().includes(kw) &&
            !item.phone.includes(kw)) {
          return false
        }
      }
      if (supplierSearch.status && item.status !== supplierSearch.status) return false
      return true
    })
  }, [supplierDataSource, supplierSearch])

  const handleReplySearch = () => {
    message.info(`查询到 ${filteredReplyData.length} 条记录`)
  }

  const handleReplyReset = () => {
    setReplySearch({ keyword: '', supplierId: '', status: '', dateRange: null })
  }

  const handleSupplierSearch = () => {
    message.info(`查询到 ${filteredSupplierData.length} 条记录`)
  }

  const handleSupplierReset = () => {
    setSupplierSearch({ keyword: '', status: '' })
  }

  const handleViewReplyDetail = (record) => {
    setReplyDetailRecord(record)
    setReplyDetailOpen(true)
  }

  const handleOpenStatusModal = (record) => {
    setStatusRecord(record)
    statusForm.setFieldsValue({ status: record.status })
    setStatusModalOpen(true)
  }

  const handleSubmitStatus = async () => {
    try {
      const values = await statusForm.validateFields()
      setReplyDataSource(prev => prev.map(item =>
        item.id === statusRecord.id ? { ...item, status: values.status } : item
      ))
      message.success('状态更新成功')
      setStatusModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleOpenDelayModal = (record) => {
    setDelayRecord(record)
    delayForm.resetFields()
    delayForm.setFieldsValue({ delayDays: record.delayDays || 1 })
    setDelayModalOpen(true)
  }

  const handleSubmitDelay = async () => {
    try {
      const values = await delayForm.validateFields()
      setReplyDataSource(prev => prev.map(item =>
        item.id === delayRecord.id ? {
          ...item,
          status: 'delayed',
          delayReason: values.delayReason,
          delayDays: values.delayDays
        } : item
      ))
      message.success('延误记录成功')
      setDelayModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleOpenConfirmModal = (record) => {
    setConfirmRecord(record)
    setConfirmModalOpen(true)
  }

  const handleSubmitConfirm = () => {
    setReplyDataSource(prev => prev.map(item =>
      item.id === confirmRecord.id ? {
        ...item,
        status: 'confirmed',
        actualDeliveryDate: item.actualDeliveryDate || dayjs(item.promiseDeliveryDate).format('YYYY-MM-DD')
      } : item
    ))
    message.success('回复确认成功')
    setConfirmModalOpen(false)
  }

  const handleCreateSupplier = () => {
    setSupplierModalType('create')
    setSupplierEditingRecord(null)
    supplierForm.resetFields()
    supplierForm.setFieldsValue({ status: 'active', rating: 3 })
    setSupplierModalOpen(true)
  }

  const handleEditSupplier = (record) => {
    setSupplierModalType('edit')
    setSupplierEditingRecord(record)
    supplierForm.setFieldsValue(record)
    setSupplierModalOpen(true)
  }

  const handleToggleSupplierStatus = (record) => {
    setSupplierDataSource(prev => prev.map(item =>
      item.id === record.id ? { ...item, status: item.status === 'active' ? 'inactive' : 'active' } : item
    ))
    message.success(record.status === 'active' ? '已停用' : '已启用')
  }

  const handleDeleteSupplier = (id) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该供应商吗？此操作不可恢复。',
      onOk: () => {
        setSupplierDataSource(prev => prev.filter(item => item.id !== id))
        message.success('删除成功')
      }
    })
  }

  const handleSubmitSupplier = async () => {
    try {
      const values = await supplierForm.validateFields()
      if (supplierModalType === 'create') {
        const newId = Math.max(...supplierDataSource.map(i => i.id)) + 1
        setSupplierDataSource(prev => [{
          id: newId,
          ...values,
          code: `SUP${String(newId).padStart(4, '0')}`
        }, ...prev])
        message.success('创建成功')
      } else {
        setSupplierDataSource(prev => prev.map(item =>
          item.id === supplierEditingRecord.id ? { ...item, ...values } : item
        ))
        message.success('修改成功')
      }
      setSupplierModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const replyColumns = [
    { title: '回复单号', dataIndex: 'replyNo', key: 'replyNo', width: 160, fixed: 'left' },
    { title: '关联补货ID', dataIndex: 'replenishmentId', key: 'replenishmentId', width: 140 },
    { title: '供应商名称', dataIndex: 'supplierName', key: 'supplierName', width: 180 },
    {
      title: '药品信息',
      key: 'medicine',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.medicineName}</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.medicineCode}</div>
        </div>
      )
    },
    { title: '报价数量', dataIndex: 'quoteQuantity', key: 'quoteQuantity', width: 90, align: 'right' },
    { title: '报价单价', dataIndex: 'quotePrice', key: 'quotePrice', width: 100, align: 'right', render: (v) => `¥${v}` },
    { title: '承诺交货日期', dataIndex: 'promiseDeliveryDate', key: 'promiseDeliveryDate', width: 120 },
    { title: '实际交货日期', dataIndex: 'actualDeliveryDate', key: 'actualDeliveryDate', width: 120, render: (v) => v || '-' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => <Tag color={replyStatusMap[status].color}>{replyStatusMap[status].text}</Tag>
    },
    {
      title: '延误原因',
      dataIndex: 'delayReason',
      key: 'delayReason',
      width: 180,
      render: (v) => v ? <span style={{ color: '#ff4d4f', fontWeight: 500 }}>{v}</span> : '-'
    },
    { title: '延误天数', dataIndex: 'delayDays', key: 'delayDays', width: 90, align: 'right', render: (v) => v ? <span style={{ color: '#ff4d4f' }}>{v}天</span> : '-' },
    {
      title: '办理时长',
      dataIndex: 'handleHours',
      key: 'handleHours',
      width: 100,
      align: 'right',
      render: (v, record) => {
        if (v === null) {
          const now = dayjs()
          const created = dayjs(record.createdAt)
          const pendingHours = Math.max(0, now.diff(created, 'hour'))
          return <span style={{ color: '#fa8c16', fontWeight: 600 }}>待办{pendingHours}h</span>
        }
        return <span style={{ color: '#1677ff', fontWeight: 600 }}>{v}h</span>
      }
    },
    { title: '回复截止日期', dataIndex: 'deadline', key: 'deadline', width: 160 },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewReplyDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" onClick={() => handleOpenStatusModal(record)}>
            更新状态
          </Button>
          {(record.status === 'replied' || record.status === 'delayed') && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleOpenConfirmModal(record)}>
              确认回复
            </Button>
          )}
          {record.status !== 'confirmed' && (
            <Button type="link" size="small" danger onClick={() => handleOpenDelayModal(record)}>
              记录延误
            </Button>
          )}
        </Space>
      )
    }
  ]

  const supplierColumns = [
    { title: '编码', dataIndex: 'code', key: 'code', width: 120, fixed: 'left' },
    { title: '名称', dataIndex: 'name', key: 'name', width: 200 },
    { title: '联系人', dataIndex: 'contact', key: 'contact', width: 100 },
    { title: '电话', dataIndex: 'phone', key: 'phone', width: 140 },
    { title: '邮箱', dataIndex: 'email', key: 'email', width: 200 },
    { title: '评级', dataIndex: 'rating', key: 'rating', width: 180, render: (v) => <Rate disabled allowHalf value={v} /> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => <Tag color={supplierStatusMap[status].color}>{supplierStatusMap[status].text}</Tag>
    },
    {
      title: '操作',
      key: 'action',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditSupplier(record)}>
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            icon={record.status === 'active' ? <StopOutlined /> : <CheckOutlined />}
            onClick={() => handleToggleSupplierStatus(record)}
          >
            {record.status === 'active' ? '停用' : '启用'}
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDeleteSupplier(record.id)} okText="确定" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const buildTimeline = (record) => {
    const items = []
    items.push({
      color: 'blue',
      children: (
        <div>
          <div style={{ fontWeight: 500 }}>创建回复请求</div>
          <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.createdAt}</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>系统自动发送至 {record.supplierName}</div>
        </div>
      )
    })
    if (record.repliedAt) {
      items.push({
        color: 'green',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>供应商已回复</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.repliedAt}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              报价 {record.quoteQuantity} 件，单价 ¥{record.quotePrice}
              {record.promiseDeliveryDate && `，承诺 ${record.promiseDeliveryDate} 交货`}
            </div>
          </div>
        )
      })
    }
    if (record.delayReason) {
      items.push({
        color: 'red',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>记录延误</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>延误 {record.delayDays} 天</div>
            <div style={{ fontSize: 13, marginTop: 4, color: '#ff4d4f' }}>{record.delayReason}</div>
          </div>
        )
      })
    }
    if (record.status === 'confirmed') {
      items.push({
        color: 'purple',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>确认回复</div>
            <div style={{ color: '#8c8c8c', fontSize: 12 }}>采购计划员已确认</div>
            {record.actualDeliveryDate && (
              <div style={{ fontSize: 13, marginTop: 4 }}>实际交货日期：{record.actualDeliveryDate}</div>
            )}
          </div>
        )
      })
    }
    if (record.status === 'pending') {
      items.push({
        color: 'gray',
        children: (
          <div>
            <div style={{ fontWeight: 500 }}>等待供应商回复</div>
            <div style={{ color: '#fa8c16', fontSize: 12 }}>截止：{record.deadline}</div>
          </div>
        )
      })
    }
    return items
  }

  const tabItems = [
    {
      key: 'reply',
      label: (
        <span>
          <ClockCircleOutlined style={{ marginRight: 6 }} />
          供应商回复
          <Tag color="blue" style={{ marginLeft: 8 }}>{replyDataSource.length}</Tag>
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16, borderRadius: 4 }}>
            <Space wrap>
              <Input
                placeholder="回复单号/补货ID/供应商/药品"
                style={{ width: 260 }}
                allowClear
                prefix={<SearchOutlined />}
                value={replySearch.keyword}
                onChange={(e) => setReplySearch(prev => ({ ...prev, keyword: e.target.value }))}
              />
              <Select
                placeholder="选择供应商"
                style={{ width: 180 }}
                allowClear
                options={supplierNameList.map((name, idx) => ({ value: idx + 1, label: name }))}
                value={replySearch.supplierId || undefined}
                onChange={(v) => setReplySearch(prev => ({ ...prev, supplierId: v || '' }))}
              />
              <Select
                placeholder="选择状态"
                style={{ width: 140 }}
                allowClear
                options={Object.entries(replyStatusMap).map(([k, v]) => ({ value: k, label: v.text }))}
                value={replySearch.status || undefined}
                onChange={(v) => setReplySearch(prev => ({ ...prev, status: v || '' }))}
              />
              <RangePicker
                style={{ width: 280 }}
                value={replySearch.dateRange}
                onChange={(dates) => setReplySearch(prev => ({ ...prev, dateRange: dates }))}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleReplySearch}>查询</Button>
              <Button onClick={handleReplyReset}>重置</Button>
            </Space>
          </Card>

          <CommonTable
            loading={loading}
            columns={replyColumns}
            dataSource={filteredReplyData}
            pagination={{ ...replyPagination, total: filteredReplyData.length }}
            onChange={(pagination) => setReplyPagination(pagination)}
          />
        </div>
      )
    },
    {
      key: 'supplier',
      label: (
        <span>
          <EditOutlined style={{ marginRight: 6 }} />
          供应商管理
          <Tag color="green" style={{ marginLeft: 8 }}>{supplierDataSource.length}</Tag>
        </span>
      ),
      children: (
        <div>
          <Card style={{ marginBottom: 16, borderRadius: 4 }}>
            <Space wrap>
              <Input
                placeholder="编码/名称/联系人/电话"
                style={{ width: 260 }}
                allowClear
                prefix={<SearchOutlined />}
                value={supplierSearch.keyword}
                onChange={(e) => setSupplierSearch(prev => ({ ...prev, keyword: e.target.value }))}
              />
              <Select
                placeholder="选择状态"
                style={{ width: 140 }}
                allowClear
                options={Object.entries(supplierStatusMap).map(([k, v]) => ({ value: k, label: v.text }))}
                value={supplierSearch.status || undefined}
                onChange={(v) => setSupplierSearch(prev => ({ ...prev, status: v || '' }))}
              />
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSupplierSearch}>查询</Button>
              <Button onClick={handleSupplierReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateSupplier} style={{ marginLeft: 'auto' }}>
                新增供应商
              </Button>
            </Space>
          </Card>

          <CommonTable
            loading={loading}
            columns={supplierColumns}
            dataSource={filteredSupplierData}
            pagination={{ ...supplierPagination, total: filteredSupplierData.length }}
            onChange={(pagination) => setSupplierPagination(pagination)}
          />
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="供应商管理" />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        size="large"
        style={{ background: '#fff', padding: '0 16px', borderRadius: 4 }}
        tabBarStyle={{ borderBottom: '1px solid #f0f0f0', marginBottom: 0 }}
      />

      <Modal
        title="供应商回复详情"
        open={replyDetailOpen}
        onCancel={() => setReplyDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setReplyDetailOpen(false)}>关闭</Button>
        ]}
        width={880}
        destroyOnClose
      >
        {replyDetailRecord && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="回复单号" span={1}>{replyDetailRecord.replyNo}</Descriptions.Item>
              <Descriptions.Item label="关联补货ID" span={1}>{replyDetailRecord.replenishmentId}</Descriptions.Item>
              <Descriptions.Item label="供应商名称" span={1}>{replyDetailRecord.supplierName}</Descriptions.Item>
              <Descriptions.Item label="状态" span={1}>
                <Tag color={replyStatusMap[replyDetailRecord.status].color}>
                  {replyStatusMap[replyDetailRecord.status].text}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="药品编码" span={1}>{replyDetailRecord.medicineCode}</Descriptions.Item>
              <Descriptions.Item label="药品名称" span={1}>{replyDetailRecord.medicineName}</Descriptions.Item>
              <Descriptions.Item label="报价数量" span={1}>{replyDetailRecord.quoteQuantity} 件</Descriptions.Item>
              <Descriptions.Item label="报价单价" span={1}>¥{replyDetailRecord.quotePrice}</Descriptions.Item>
              <Descriptions.Item label="承诺交货日期" span={1}>{replyDetailRecord.promiseDeliveryDate}</Descriptions.Item>
              <Descriptions.Item label="实际交货日期" span={1}>{replyDetailRecord.actualDeliveryDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={1}>{replyDetailRecord.createdAt}</Descriptions.Item>
              <Descriptions.Item label="回复时间" span={1}>{replyDetailRecord.repliedAt || '-'}</Descriptions.Item>
              <Descriptions.Item label="回复截止" span={1}>{replyDetailRecord.deadline}</Descriptions.Item>
              <Descriptions.Item label="办理时长" span={1}>
                {replyDetailRecord.handleHours !== null ? `${replyDetailRecord.handleHours} 小时` : '办理中'}
              </Descriptions.Item>
              {replyDetailRecord.delayReason && (
                <Descriptions.Item label="延误原因" span={2}>
                  <span style={{ color: '#ff4d4f' }}>{replyDetailRecord.delayReason}（延误{replyDetailRecord.delayDays}天）</span>
                </Descriptions.Item>
              )}
            </Descriptions>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Card title="供应商备注" size="small" style={{ marginBottom: 16 }}>
                  {replyDetailRecord.supplierRemark || <span style={{ color: '#8c8c8c' }}>暂无备注</span>}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="内部备注" size="small" style={{ marginBottom: 16 }}>
                  {replyDetailRecord.internalRemark || <span style={{ color: '#8c8c8c' }}>暂无备注</span>}
                </Card>
              </Col>
            </Row>

            <Divider orientation="left" style={{ margin: '16px 0' }}>办理时间线</Divider>
            <Timeline items={buildTimeline(replyDetailRecord)} />
          </div>
        )}
      </Modal>

      <Modal
        title="记录延误"
        open={delayModalOpen}
        onOk={handleSubmitDelay}
        onCancel={() => setDelayModalOpen(false)}
        width={520}
        destroyOnClose
      >
        <Form form={delayForm} layout="vertical">
          <Form.Item
            name="delayReason"
            label="延误原因"
            rules={[{ required: true, message: '请输入延误原因' }]}
          >
            <Input.TextArea rows={4} placeholder="请详细说明延误原因，便于后续跟进分析" maxLength={500} showCount />
          </Form.Item>
          <Form.Item
            name="delayDays"
            label="延误天数"
            rules={[{ required: true, message: '请输入延误天数' }]}
          >
            <InputNumber min={1} max={365} style={{ width: '100%' }} addonAfter="天" placeholder="请输入延误天数" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="确认回复"
        open={confirmModalOpen}
        onOk={handleSubmitConfirm}
        onCancel={() => setConfirmModalOpen(false)}
        width={520}
        okText="确认"
        cancelText="取消"
        destroyOnClose
      >
        {confirmRecord && (
          <div>
            <div style={{ marginBottom: 16, padding: 12, background: '#e6f4ff', borderRadius: 4, border: '1px solid #91caff' }}>
              <div style={{ fontWeight: 500, color: '#1677ff', marginBottom: 8 }}>确认信息摘要</div>
              <div>回复单号：<strong>{confirmRecord.replyNo}</strong></div>
              <div>供应商：{confirmRecord.supplierName}</div>
              <div>药品：{confirmRecord.medicineName}（{confirmRecord.medicineCode}）</div>
              <div>报价：{confirmRecord.quoteQuantity} 件 × ¥{confirmRecord.quotePrice} = <strong style={{ color: '#cf1322' }}>¥{(confirmRecord.quoteQuantity * confirmRecord.quotePrice).toFixed(2)}</strong></div>
              <div>承诺交货：{confirmRecord.promiseDeliveryDate}</div>
            </div>
            <div style={{ color: '#8c8c8c', fontSize: 13 }}>
              确认后状态将变更为"已确认"，请核对上述信息无误后操作。
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="更新状态"
        open={statusModalOpen}
        onOk={handleSubmitStatus}
        onCancel={() => setStatusModalOpen(false)}
        width={420}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            name="status"
            label="回复状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                {Object.entries(replyStatusMap).map(([k, v]) => (
                  <Radio key={k} value={k}>
                    <Tag color={v.color}>{v.text}</Tag>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={supplierModalType === 'create' ? '新增供应商' : '编辑供应商'}
        open={supplierModalOpen}
        onOk={handleSubmitSupplier}
        onCancel={() => setSupplierModalOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form form={supplierForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="供应商名称" rules={[{ required: true, message: '请输入供应商名称' }]}>
                <Input placeholder="请输入供应商名称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="contact" label="联系人" rules={[{ required: true, message: '请输入联系人' }]}>
                <Input placeholder="请输入联系人姓名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="联系电话" rules={[{ required: true, message: '请输入联系电话' }]}>
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="邮箱" rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}>
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="rating" label="评级">
                <Rate allowHalf />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态" rules={[{ required: true, message: '请选择状态' }]}>
                <Radio.Group>
                  <Radio value="active">合作中</Radio>
                  <Radio value="inactive">已停用</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="address" label="地址">
                <Input.TextArea rows={2} placeholder="请输入详细地址" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Supplier
