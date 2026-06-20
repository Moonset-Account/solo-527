import { useState, useEffect } from 'react'
import { Button, Space, Input, Select, Modal, Form, message, Tag, Card, Row, Col, Descriptions, Timeline, InputNumber, DatePicker, Checkbox, Divider } from 'antd'
import { SearchOutlined, ReloadOutlined, PlusOutlined, CheckCircleOutlined, CloseCircleOutlined, TruckOutlined, InboxOutlined, StopOutlined, EyeOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'
import { getAllocationList, createAllocation, updateAllocation, confirmAllocation } from '@/api/allocation'

const warehouses = [
  { value: 1, label: '北京仓' },
  { value: 2, label: '上海仓' },
  { value: 3, label: '广州仓' },
  { value: 4, label: '深圳仓' },
  { value: 5, label: '成都仓' }
]

const statusOptions = [
  { value: 1, label: '待审批' },
  { value: 2, label: '已批准' },
  { value: 3, label: '已拒绝' },
  { value: 4, label: '运输中' },
  { value: 5, label: '已完成' },
  { value: 6, label: '已取消' }
]

const statusColorMap = {
  1: 'orange',
  2: 'blue',
  3: 'red',
  4: 'cyan',
  5: 'green',
  6: 'default'
}

const statusTextMap = {
  1: '待审批',
  2: '已批准',
  3: '已拒绝',
  4: '运输中',
  5: '已完成',
  6: '已取消'
}

const receiptStatusMap = {
  1: { text: '待签收', color: 'orange' },
  2: { text: '部分签收', color: 'blue' },
  3: { text: '全部签收', color: 'green' },
  4: { text: '存在差异', color: 'red' }
}

const discrepancyTypeOptions = [
  { value: 1, label: '数量短缺' },
  { value: 2, label: '数量多发' },
  { value: 3, label: '破损' },
  { value: 4, label: '过期' },
  { value: 5, label: '批次错误' },
  { value: 6, label: '药品错误' }
]

const medicines = [
  { id: 1001, code: 'MED001', name: '阿莫西林胶囊' },
  { id: 1002, code: 'MED002', name: '布洛芬缓释片' },
  { id: 1003, code: 'MED003', name: '头孢克肟分散片' },
  { id: 1004, code: 'MED004', name: '奥美拉唑肠溶胶囊' },
  { id: 1005, code: 'MED005', name: '氯雷他定片' },
  { id: 1006, code: 'MED006', name: '盐酸左氧氟沙星片' },
  { id: 1007, code: 'MED007', name: '复方氨酚烷胺片' },
  { id: 1008, code: 'MED008', name: '维生素C片' },
  { id: 1009, code: 'MED009', name: '蒙脱石散' },
  { id: 1010, code: 'MED010', name: '硝苯地平控释片' },
  { id: 1011, code: 'MED011', name: '阿托伐他汀钙片' },
  { id: 1012, code: 'MED012', name: '盐酸二甲双胍缓释片' },
  { id: 1013, code: 'MED013', name: '阿司匹林肠溶片' },
  { id: 1014, code: 'MED014', name: '瑞舒伐他汀钙片' },
  { id: 1015, code: 'MED015', name: '琥珀酸美托洛尔缓释片' }
]

const users = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']

const medicineOptions = medicines.map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` }))

const generateMockData = () => {
  const data = []
  for (let i = 1; i <= 25; i++) {
    const medicine = medicines[(i - 1) % medicines.length]
    const sourceIdx = (i - 1) % warehouses.length
    const targetIdx = (i + 2) % warehouses.length
    const status = ((i - 1) % 6) + 1
    const quantity = Math.floor(Math.random() * 300) + 50
    const batchNumber = `B${dayjs().format('YYYYMM')}${String(i).padStart(4, '0')}`
    const applicant = users[(i - 1) % users.length]
    const approver = status >= 2 ? users[(i + 1) % users.length] : null
    const receiver = status === 5 ? users[(i + 3) % users.length] : null
    const receivedQty = status === 5 ? (i % 3 === 0 ? quantity - 5 : quantity) : 0
    const receiptStatus = status === 5
      ? (receivedQty < quantity ? 4 : 3)
      : status >= 4 ? 1 : null
    const createdAt = dayjs().subtract(i * 5, 'hour').format('YYYY-MM-DD HH:mm:ss')
    const expectedDelivery = dayjs().add(Math.floor(Math.random() * 7) + 1, 'day').format('YYYY-MM-DD')
    const actualDelivery = status === 5 ? dayjs().subtract(Math.floor(Math.random() * 3) + 1, 'day').format('YYYY-MM-DD') : null

    const flowRecords = []
    flowRecords.push({ time: createdAt, action: '创建调拨申请', operator: applicant, remark: `调拨数量：${quantity}` })
    if (status === 2 || status === 4 || status === 5) {
      flowRecords.push({
        time: dayjs(createdAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss'),
        action: '审批通过',
        operator: approver,
        remark: '审批意见：同意调拨'
      })
    }
    if (status === 3) {
      flowRecords.push({
        time: dayjs(createdAt).add(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        action: '审批拒绝',
        operator: approver,
        remark: '库存不足，无法调拨'
      })
    }
    if (status === 4 || status === 5) {
      flowRecords.push({
        time: dayjs(createdAt).add(3, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        action: '开始运输',
        operator: '物流系统',
        remark: '已从源仓库发出'
      })
    }
    if (status === 5) {
      flowRecords.push({
        time: dayjs(actualDelivery + ' 14:30:00').format('YYYY-MM-DD HH:mm:ss'),
        action: '完成签收',
        operator: receiver,
        remark: receiptStatus === 4 ? `实收${receivedQty}，存在数量差异` : `全部签收，实收${receivedQty}`
      })
    }
    if (status === 6) {
      flowRecords.push({
        time: dayjs(createdAt).add(2, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        action: '取消调拨',
        operator: applicant,
        remark: '用户主动取消'
      })
    }

    data.push({
      id: i,
      requestNumber: `AL${dayjs().format('YYYYMM')}${String(i).padStart(5, '0')}`,
      sourceWarehouseId: warehouses[sourceIdx].value,
      sourceWarehouseName: warehouses[sourceIdx].label,
      targetWarehouseId: warehouses[targetIdx].value,
      targetWarehouseName: warehouses[targetIdx].label,
      medicineId: medicine.id,
      medicineCode: medicine.code,
      medicineName: medicine.name,
      batchId: 2000 + i,
      batchNumber,
      quantity,
      reason: i % 3 === 0 ? '库存不足，需要从其他仓库调拨补充' : i % 3 === 1 ? '紧急订单需求' : '定期库存平衡调配',
      status,
      requestedByUserId: (i % 8) + 1,
      requestedByUserName: applicant,
      approvedByUserId: approver ? (i % 8) + 2 : null,
      approvedByUserName: approver,
      approvedAt: status >= 2 ? dayjs(createdAt).add(30, 'minute').format('YYYY-MM-DD HH:mm:ss') : null,
      expectedDeliveryDate: expectedDelivery,
      actualDeliveryDate: actualDelivery,
      receiptStatus,
      receiptDate: actualDelivery,
      receivedByUserId: receiver ? (i % 8) + 3 : null,
      receivedByUserName: receiver,
      receivedQuantity: receivedQty,
      remarks: status === 3 ? '库存不足' : '',
      createdAt,
      updatedAt: createdAt,
      flowRecords
    })
  }
  return data
}

const mockData = generateMockData()

const Allocation = () => {
  const [loading, setLoading] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [approveModalVisible, setApproveModalVisible] = useState(false)
  const [receiveModalVisible, setReceiveModalVisible] = useState(false)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [approveType, setApproveType] = useState(null)
  const [searchForm] = Form.useForm()
  const [createForm] = Form.useForm()
  const [approveForm] = Form.useForm()
  const [receiveForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm.getFieldsValue()
      }
      const res = await getAllocationList(params)
      if (res?.data) {
        const list = res.data.list || res.data || []
        const total = res.data.total || list.length
        setFilteredData(list)
        setPagination((prev) => ({ ...prev, total }))
      } else {
        throw new Error('API返回空数据')
      }
    } catch (err) {
      console.warn('API调用失败，使用Mock数据:', err)
      applySearch(mockData, searchForm.getFieldsValue())
    } finally {
      setLoading(false)
    }
  }

  const applySearch = (data, filters) => {
    let result = [...data]
    if (filters.keyword) {
      const kw = filters.keyword.toLowerCase()
      result = result.filter(
        (item) =>
          item.requestNumber.toLowerCase().includes(kw) ||
          item.medicineName.toLowerCase().includes(kw) ||
          item.medicineCode.toLowerCase().includes(kw) ||
          item.batchNumber.toLowerCase().includes(kw)
      )
    }
    if (filters.status) {
      result = result.filter((item) => item.status === filters.status)
    }
    if (filters.warehouseId) {
      result = result.filter(
        (item) =>
          item.sourceWarehouseId === filters.warehouseId ||
          item.targetWarehouseId === filters.warehouseId
      )
    }
    setFilteredData(result)
    setPagination((prev) => ({ ...prev, current: 1, total: result.length }))
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = () => {
    const filters = searchForm.getFieldsValue()
    setLoading(true)
    try {
      applySearch(mockData, filters)
      message.success('查询成功')
    } catch (err) {
      message.error('查询失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilteredData(mockData)
    setPagination({ current: 1, pageSize: 10, total: mockData.length })
  }

  const handleCreate = () => {
    createForm.resetFields()
    setCreateModalVisible(true)
  }

  const handleCreateSubmit = async () => {
    try {
      const values = await createForm.validateFields()
      const payload = {
        ...values,
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.format('YYYY-MM-DD') : null,
        requestedByUserId: 1
      }
      try {
        await createAllocation(payload)
      } catch {
        // API失败，Mock处理
      }
      const newId = Math.max(...mockData.map((i) => i.id)) + 1
      const sourceWh = warehouses.find((w) => w.value === values.sourceWarehouseId)
      const targetWh = warehouses.find((w) => w.value === values.targetWarehouseId)
      const med = medicines.find((m) => m.id === values.medicineId)
      const newRecord = {
        id: newId,
        requestNumber: `AL${dayjs().format('YYYYMM')}${String(newId).padStart(5, '0')}`,
        sourceWarehouseId: values.sourceWarehouseId,
        sourceWarehouseName: sourceWh?.label,
        targetWarehouseId: values.targetWarehouseId,
        targetWarehouseName: targetWh?.label,
        medicineId: values.medicineId,
        medicineCode: med?.code,
        medicineName: med?.name,
        batchId: values.batchId,
        batchNumber: values.batchNumber || '未指定',
        quantity: values.quantity,
        reason: values.reason,
        status: 1,
        requestedByUserId: 1,
        requestedByUserName: '当前用户',
        approvedByUserId: null,
        approvedByUserName: null,
        approvedAt: null,
        expectedDeliveryDate: payload.expectedDeliveryDate,
        actualDeliveryDate: null,
        receiptStatus: null,
        receiptDate: null,
        receivedByUserId: null,
        receivedByUserName: null,
        receivedQuantity: 0,
        remarks: '',
        createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
        flowRecords: [
          {
            time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            action: '创建调拨申请',
            operator: '当前用户',
            remark: `调拨数量：${values.quantity}`
          }
        ]
      }
      const newData = [newRecord, ...mockData]
      setFilteredData(newData)
      setPagination((prev) => ({ ...prev, total: newData.length }))
      message.success('创建成功')
      setCreateModalVisible(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleApprove = (record, type) => {
    setCurrentRecord(record)
    setApproveType(type)
    approveForm.resetFields()
    setApproveModalVisible(true)
  }

  const handleApproveSubmit = async () => {
    try {
      const values = await approveForm.validateFields()
      const payload = {
        allocationRequestId: currentRecord.id,
        isApproved: approveType === 'pass',
        approvedByUserId: 2,
        remarks: values.remarks
      }
      try {
        await confirmAllocation(currentRecord.id, payload)
      } catch {
        // API失败，Mock处理
      }
      const newStatus = approveType === 'pass' ? 2 : 3
      const newData = filteredData.map((item) => {
        if (item.id === currentRecord.id) {
          const newFlow = [
            ...item.flowRecords,
            {
              time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
              action: approveType === 'pass' ? '审批通过' : '审批拒绝',
              operator: '审批人',
              remark: values.remarks || (approveType === 'pass' ? '审批意见：同意调拨' : '审批意见：拒绝调拨')
            }
          ]
          return {
            ...item,
            status: newStatus,
            approvedByUserId: 2,
            approvedByUserName: '审批人',
            approvedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
            remarks: values.remarks,
            flowRecords: newFlow
          }
        }
        return item
      })
      setFilteredData(newData)
      message.success(approveType === 'pass' ? '审批通过' : '已拒绝')
      setApproveModalVisible(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleMarkTransit = async (record) => {
    try {
      try {
        await updateAllocation(record.id, { status: 4 })
      } catch {
        // API失败，Mock处理
      }
      const newData = filteredData.map((item) => {
        if (item.id === record.id) {
          return {
            ...item,
            status: 4,
            flowRecords: [
              ...item.flowRecords,
              {
                time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                action: '开始运输',
                operator: '物流系统',
                remark: '已从源仓库发出'
              }
            ]
          }
        }
        return item
      })
      setFilteredData(newData)
      message.success('已标记为运输中')
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleReceive = (record) => {
    setCurrentRecord(record)
    receiveForm.resetFields()
    receiveForm.setFieldsValue({
      receivedQuantity: record.quantity,
      receiptStatus: 3,
      discrepancyTypes: [],
      remarks: ''
    })
    setReceiveModalVisible(true)
  }

  const handleReceiveSubmit = async () => {
    try {
      const values = await receiveForm.validateFields()
      const payload = {
        allocationRequestId: currentRecord.id,
        receiptStatus: values.receiptStatus,
        receivedQuantity: values.receivedQuantity,
        receivedByUserId: 3,
        remarks: values.remarks
      }
      try {
        await confirmAllocation(currentRecord.id, { status: 5, ...payload })
      } catch {
        // API失败，Mock处理
      }
      const newData = filteredData.map((item) => {
        if (item.id === currentRecord.id) {
          return {
            ...item,
            status: 5,
            receiptStatus: values.receiptStatus,
            receivedQuantity: values.receivedQuantity,
            actualDeliveryDate: dayjs().format('YYYY-MM-DD'),
            receiptDate: dayjs().format('YYYY-MM-DD'),
            receivedByUserId: 3,
            receivedByUserName: '签收人',
            flowRecords: [
              ...item.flowRecords,
              {
                time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                action: '完成签收',
                operator: '签收人',
                remark: values.receiptStatus === 4
                  ? `实收${values.receivedQuantity}，差异类型：${values.discrepancyTypes?.map((t) => discrepancyTypeOptions.find((d) => d.value === t)?.label).join('、') || '无'}`
                  : `全部签收，实收${values.receivedQuantity}`
              }
            ]
          }
        }
        return item
      })
      setFilteredData(newData)
      message.success('签收成功')
      setReceiveModalVisible(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleCancel = (record) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消该调拨申请吗？此操作不可撤销。',
      okText: '确认取消',
      okType: 'danger',
      onOk: async () => {
        try {
          try {
            await updateAllocation(record.id, { status: 6 })
          } catch {
            // API失败，Mock处理
          }
          const newData = filteredData.map((item) => {
            if (item.id === record.id) {
              return {
                ...item,
                status: 6,
                flowRecords: [
                  ...item.flowRecords,
                  {
                    time: dayjs().format('YYYY-MM-DD HH:mm:ss'),
                    action: '取消调拨',
                    operator: '当前用户',
                    remark: '用户主动取消'
                  }
                ]
              }
            }
            return item
          })
          setFilteredData(newData)
          message.success('已取消')
        } catch (err) {
          message.error('操作失败')
        }
      }
    })
  }

  const handleViewDetail = (record) => {
    setCurrentRecord(record)
    setDetailModalVisible(true)
  }

  const handleTableChange = (page) => {
    setPagination(page)
  }

  const columns = [
    { title: '调拨单号', dataIndex: 'requestNumber', key: 'requestNumber', width: 160 },
    {
      title: '药品编码+名称',
      key: 'medicine',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ color: '#999', fontSize: 12 }}>{record.medicineCode}</div>
          <div>{record.medicineName}</div>
        </div>
      )
    },
    { title: '批次号', dataIndex: 'batchNumber', key: 'batchNumber', width: 140 },
    {
      title: '源仓库→目标仓库',
      key: 'warehouseFlow',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <span>{record.sourceWarehouseName}</span>
          <span style={{ color: '#999', fontSize: 12 }}>↓</span>
          <span>{record.targetWarehouseName}</span>
        </Space>
      )
    },
    { title: '数量', dataIndex: 'quantity', key: 'quantity', width: 80, sorter: (a, b) => a.quantity - b.quantity },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val) => <Tag color={statusColorMap[val]}>{statusTextMap[val]}</Tag>
    },
    { title: '申请人', dataIndex: 'requestedByUserName', key: 'requestedByUserName', width: 90 },
    { title: '申请时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: '预计到货', dataIndex: 'expectedDeliveryDate', key: 'expectedDeliveryDate', width: 110 },
    {
      title: '操作',
      key: 'action',
      width: 300,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === 1 && (
            <>
              <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleApprove(record, 'pass')}>
                审批通过
              </Button>
              <Button type="link" size="small" danger icon={<CloseCircleOutlined />} onClick={() => handleApprove(record, 'reject')}>
                审批拒绝
              </Button>
            </>
          )}
          {record.status === 2 && (
            <Button type="link" size="small" icon={<TruckOutlined />} onClick={() => handleMarkTransit(record)}>
              标记运输
            </Button>
          )}
          {record.status === 4 && (
            <Button type="link" size="small" icon={<InboxOutlined />} onClick={() => handleReceive(record)}>
              签收
            </Button>
          )}
          {(record.status === 1) && (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleCancel(record)}>
              取消
            </Button>
          )}
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
        </Space>
      )
    }
  ]

  const pagedData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  )

  return (
    <div>
      <PageHeader title="调拨申请" />

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="单号/药品/批次" style={{ width: 200 }} allowClear prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" style={{ width: 150 }} allowClear options={statusOptions} />
          </Form.Item>
          <Form.Item name="warehouseId" label="仓库">
            <Select placeholder="请选择仓库" style={{ width: 150 }} allowClear options={warehouses} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card>
        <CommonTable
          loading={loading}
          columns={columns}
          dataSource={pagedData}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title="新建调拨申请"
        open={createModalVisible}
        onOk={handleCreateSubmit}
        onCancel={() => setCreateModalVisible(false)}
        width={700}
      >
        <Form form={createForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="sourceWarehouseId" label="源仓库" rules={[{ required: true, message: '请选择源仓库' }]}>
                <Select placeholder="请选择源仓库" options={warehouses} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="targetWarehouseId" label="目标仓库" rules={[{ required: true, message: '请选择目标仓库' }]}>
                <Select placeholder="请选择目标仓库" options={warehouses} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="medicineId" label="药品" rules={[{ required: true, message: '请选择药品' }]}>
                <Select placeholder="请选择药品" options={medicineOptions} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="batchNumber" label="批次号">
                <Input placeholder="请输入批次号（可选）" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="quantity" label="数量" rules={[{ required: true, message: '请输入数量' }]}>
                <InputNumber min={1} style={{ width: '100%' }} placeholder="请输入调拨数量" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="expectedDeliveryDate" label="预计到货日期">
                <DatePicker style={{ width: '100%' }} placeholder="请选择预计到货日期" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="reason" label="调拨原因" rules={[{ required: true, message: '请输入调拨原因' }]}>
                <Input.TextArea rows={3} placeholder="请输入调拨原因" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={approveType === 'pass' ? '审批通过' : '审批拒绝'}
        open={approveModalVisible}
        onOk={handleApproveSubmit}
        onCancel={() => setApproveModalVisible(false)}
        okType={approveType === 'pass' ? 'primary' : 'danger'}
        okText={approveType === 'pass' ? '确认通过' : '确认拒绝'}
        width={500}
      >
        {currentRecord && (
          <div>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="调拨单号">{currentRecord.requestNumber}</Descriptions.Item>
              <Descriptions.Item label="药品">{currentRecord.medicineName} ({currentRecord.medicineCode})</Descriptions.Item>
              <Descriptions.Item label="调拨方向">{currentRecord.sourceWarehouseName} → {currentRecord.targetWarehouseName}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentRecord.quantity}</Descriptions.Item>
              <Descriptions.Item label="调拨原因">{currentRecord.reason}</Descriptions.Item>
            </Descriptions>
            <Form form={approveForm} layout="vertical">
              <Form.Item name="remarks" label="审批备注">
                <Input.TextArea rows={3} placeholder={approveType === 'pass' ? '请输入审批意见（可选）' : '请输入拒绝原因'} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="调拨签收"
        open={receiveModalVisible}
        onOk={handleReceiveSubmit}
        onCancel={() => setReceiveModalVisible(false)}
        width={600}
      >
        {currentRecord && (
          <div>
            <Descriptions size="small" column={1} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="调拨单号">{currentRecord.requestNumber}</Descriptions.Item>
              <Descriptions.Item label="药品">{currentRecord.medicineName} ({currentRecord.medicineCode})</Descriptions.Item>
              <Descriptions.Item label="批次">{currentRecord.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="目标仓库">{currentRecord.targetWarehouseName}</Descriptions.Item>
              <Descriptions.Item label="申请数量" style={{ background: '#e6f7ff' }}>{currentRecord.quantity}</Descriptions.Item>
            </Descriptions>
            <Divider style={{ margin: '8px 0 16px' }} />
            <Form form={receiveForm} layout="vertical">
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="receivedQuantity"
                    label="实收数量"
                    rules={[{ required: true, message: '请输入实收数量' }]}
                  >
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="receiptStatus"
                    label="签收状态"
                    rules={[{ required: true, message: '请选择签收状态' }]}
                  >
                    <Select
                      options={[
                        { value: 2, label: '部分签收' },
                        { value: 3, label: '全部签收' },
                        { value: 4, label: '存在差异' }
                      ]}
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item
                name="discrepancyTypes"
                label="差异标记（如有差异请选择）"
              >
                <Checkbox.Group options={discrepancyTypeOptions} />
              </Form.Item>
              <Form.Item name="remarks" label="备注">
                <Input.TextArea rows={3} placeholder="请输入签收备注（差异说明等）" />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="调拨申请详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={850}
      >
        {currentRecord && (
          <div>
            <Descriptions title="基础信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="调拨单号">{currentRecord.requestNumber}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColorMap[currentRecord.status]}>{statusTextMap[currentRecord.status]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="药品编码">{currentRecord.medicineCode}</Descriptions.Item>
              <Descriptions.Item label="药品名称">{currentRecord.medicineName}</Descriptions.Item>
              <Descriptions.Item label="批次号">{currentRecord.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="数量">{currentRecord.quantity}</Descriptions.Item>
              <Descriptions.Item label="源仓库">{currentRecord.sourceWarehouseName}</Descriptions.Item>
              <Descriptions.Item label="目标仓库">{currentRecord.targetWarehouseName}</Descriptions.Item>
              <Descriptions.Item label="申请人">{currentRecord.requestedByUserName}</Descriptions.Item>
              <Descriptions.Item label="申请时间">{currentRecord.createdAt}</Descriptions.Item>
              <Descriptions.Item label="预计到货">{currentRecord.expectedDeliveryDate || '-'}</Descriptions.Item>
              <Descriptions.Item label="实际到货">{currentRecord.actualDeliveryDate || '-'}</Descriptions.Item>
            </Descriptions>

            {(currentRecord.approvedByUserName || currentRecord.receivedByUserName) && (
              <Descriptions title="处理信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
                {currentRecord.approvedByUserName && (
                  <>
                    <Descriptions.Item label="审批人">{currentRecord.approvedByUserName}</Descriptions.Item>
                    <Descriptions.Item label="审批时间">{currentRecord.approvedAt}</Descriptions.Item>
                  </>
                )}
                {currentRecord.receivedByUserName && (
                  <>
                    <Descriptions.Item label="签收人">{currentRecord.receivedByUserName}</Descriptions.Item>
                    <Descriptions.Item label="签收时间">{currentRecord.receiptDate}</Descriptions.Item>
                    <Descriptions.Item label="实收数量">{currentRecord.receivedQuantity}</Descriptions.Item>
                    <Descriptions.Item label="签收状态">
                      {currentRecord.receiptStatus && (
                        <Tag color={receiptStatusMap[currentRecord.receiptStatus].color}>
                          {receiptStatusMap[currentRecord.receiptStatus].text}
                        </Tag>
                      )}
                    </Descriptions.Item>
                  </>
                )}
                {currentRecord.remarks && (
                  <Descriptions.Item label="备注" span={2}>{currentRecord.remarks}</Descriptions.Item>
                )}
              </Descriptions>
            )}

            <Descriptions title="调拨原因" bordered size="small" column={1} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="原因说明">{currentRecord.reason}</Descriptions.Item>
            </Descriptions>

            <Card title="完整流转记录" size="small" style={{ padding: 0 }}>
              <Timeline
                items={currentRecord.flowRecords.map((record, idx) => ({
                  color: idx === currentRecord.flowRecords.length - 1 ? 'blue' : 'gray',
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>{record.action}</div>
                      <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                        操作人：{record.operator}　时间：{record.time}
                      </div>
                      {record.remark && (
                        <div style={{ color: '#999', fontSize: 12, marginTop: 2 }}>
                          备注：{record.remark}
                        </div>
                      )}
                    </div>
                  )
                }))}
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Allocation
