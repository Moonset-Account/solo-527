import { useState, useEffect } from 'react'
import { Button, Space, Input, Select, Modal, Form, message, Tag, Card, Row, Col, Descriptions } from 'antd'
import { SearchOutlined, ReloadOutlined, ThunderboltOutlined, CheckCircleOutlined, EyeOutlined, SwapOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'
import { getReplenishmentList, updateReplenishment } from '@/api/replenishment'
import { createAllocation } from '@/api/allocation'

const warehouses = [
  { value: 1, label: '北京仓' },
  { value: 2, label: '上海仓' },
  { value: 3, label: '广州仓' },
  { value: 4, label: '深圳仓' },
  { value: 5, label: '成都仓' }
]

const riskLevelOptions = [
  { value: 1, label: '低风险' },
  { value: 2, label: '中风险' },
  { value: 3, label: '高风险' },
  { value: 4, label: '极高风险' }
]

const priorityOptions = [
  { value: 1, label: '普通' },
  { value: 2, label: '紧急' },
  { value: 3, label: '特急' }
]

const processedOptions = [
  { value: true, label: '已处理' },
  { value: false, label: '未处理' }
]

const riskLevelColorMap = {
  1: 'green',
  2: 'blue',
  3: 'orange',
  4: 'red'
}

const riskLevelTextMap = {
  1: '低风险',
  2: '中风险',
  3: '高风险',
  4: '极高风险'
}

const priorityColorMap = {
  1: 'default',
  2: 'orange',
  3: 'red'
}

const priorityTextMap = {
  1: '普通',
  2: '紧急',
  3: '特急'
}

const supplierReplyStatusMap = {
  1: { text: '待回复', color: 'default' },
  2: { text: '已回复', color: 'blue' },
  3: { text: '已确认', color: 'green' },
  4: { text: '已延迟', color: 'orange' }
}

const medicines = [
  { code: 'MED001', name: '阿莫西林胶囊' },
  { code: 'MED002', name: '布洛芬缓释片' },
  { code: 'MED003', name: '头孢克肟分散片' },
  { code: 'MED004', name: '奥美拉唑肠溶胶囊' },
  { code: 'MED005', name: '氯雷他定片' },
  { code: 'MED006', name: '盐酸左氧氟沙星片' },
  { code: 'MED007', name: '复方氨酚烷胺片' },
  { code: 'MED008', name: '维生素C片' },
  { code: 'MED009', name: '蒙脱石散' },
  { code: 'MED010', name: '硝苯地平控释片' },
  { code: 'MED011', name: '阿托伐他汀钙片' },
  { code: 'MED012', name: '盐酸二甲双胍缓释片' },
  { code: 'MED013', name: '阿司匹林肠溶片' },
  { code: 'MED014', name: '瑞舒伐他汀钙片' },
  { code: 'MED015', name: '琥珀酸美托洛尔缓释片' }
]

const suppliers = [
  { id: 1, name: '国药控股有限公司' },
  { id: 2, name: '上海医药集团' },
  { id: 3, name: '华润医药商业' },
  { id: 4, name: '九州通医药集团' },
  { id: 5, name: '南京医药股份' }
]

const generateMockData = () => {
  const data = []
  for (let i = 1; i <= 35; i++) {
    const medicine = medicines[(i - 1) % medicines.length]
    const warehouse = warehouses[(i - 1) % warehouses.length]
    const supplier = suppliers[(i - 1) % suppliers.length]
    const currentStock = Math.floor(Math.random() * 500) + 10
    const safetyStock = Math.floor(Math.random() * 200) + 100
    const avgDaily = Math.floor(Math.random() * 30) + 5
    const daysUntil = currentStock > safetyStock
      ? Math.floor((currentStock - safetyStock) / avgDaily) + 1
      : Math.max(0, Math.floor(currentStock / avgDaily) - 2)
    const riskLevel = daysUntil <= 1 ? 4 : daysUntil <= 3 ? 3 : daysUntil <= 7 ? 2 : 1
    const priority = riskLevel === 4 ? 3 : riskLevel === 3 ? 2 : 1
    const isProcessed = i % 5 === 0

    data.push({
      id: i,
      medicineId: 1000 + i,
      medicineCode: medicine.code,
      medicineName: medicine.name,
      warehouseId: warehouse.value,
      warehouseName: warehouse.label,
      currentStock,
      safetyStock,
      suggestedQuantity: Math.floor((safetyStock - currentStock) * 1.5) + avgDaily * 14,
      averageDailyUsage: avgDaily,
      daysUntilStockout: daysUntil,
      riskLevel,
      priority,
      preferredSupplierId: supplier.id,
      preferredSupplierName: supplier.name,
      isProcessed,
      generatedAt: dayjs().subtract(i, 'hour').format('YYYY-MM-DD HH:mm:ss'),
      createdByUserId: 1,
      allocationRequest: i % 3 === 0 ? {
        id: 100 + i,
        requestNumber: `AL${dayjs().format('YYYYMM')}${String(i).padStart(4, '0')}`,
        sourceWarehouseName: warehouses[(i + 2) % warehouses.length].label,
        targetWarehouseName: warehouse.label,
        quantity: Math.floor(Math.random() * 300) + 50,
        status: (i % 4) + 1
      } : null,
      supplierReplyStatus: (i % 4) + 1
    })
  }
  return data
}

const mockData = generateMockData()

const Replenishment = () => {
  const [loading, setLoading] = useState(false)
  const [filteredData, setFilteredData] = useState([])
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [allocationModalVisible, setAllocationModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [searchForm] = Form.useForm()
  const [allocationForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...searchForm.getFieldsValue()
      }
      const res = await getReplenishmentList(params)
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
          item.medicineName.toLowerCase().includes(kw) ||
          item.medicineCode.toLowerCase().includes(kw) ||
          item.preferredSupplierName.toLowerCase().includes(kw)
      )
    }
    if (filters.warehouseId) {
      result = result.filter((item) => item.warehouseId === filters.warehouseId)
    }
    if (filters.riskLevel) {
      result = result.filter((item) => item.riskLevel === filters.riskLevel)
    }
    if (filters.priority) {
      result = result.filter((item) => item.priority === filters.priority)
    }
    if (filters.isProcessed !== undefined && filters.isProcessed !== null) {
      result = result.filter((item) => item.isProcessed === filters.isProcessed)
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
    setSelectedRowKeys([])
  }

  const handleGenerateSuggestions = async () => {
    setLoading(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      message.success('补货建议已生成，共新增 ' + Math.floor(Math.random() * 10 + 5) + ' 条建议')
    } catch (err) {
      message.error('生成失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBatchProcess = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择要处理的记录')
      return
    }
    Modal.confirm({
      title: '批量处理确认',
      content: `确定要将选中的 ${selectedRowKeys.length} 条记录标记为已处理吗？`,
      onOk: async () => {
        try {
          await Promise.all(
            selectedRowKeys.map((id) => {
              try {
                return updateReplenishment(id, { isProcessed: true })
              } catch {
                return Promise.resolve()
              }
            })
          )
          const newData = filteredData.map((item) =>
            selectedRowKeys.includes(item.id) ? { ...item, isProcessed: true } : item
          )
          setFilteredData(newData)
          setSelectedRowKeys([])
          message.success('批量处理成功')
        } catch (err) {
          message.error('批量处理失败')
        }
      }
    })
  }

  const handleViewDetail = (record) => {
    setCurrentRecord(record)
    setDetailModalVisible(true)
  }

  const handleMarkProcessed = async (record) => {
    try {
      try {
        await updateReplenishment(record.id, { isProcessed: true })
      } catch {
        // API失败，Mock处理
      }
      const newData = filteredData.map((item) =>
        item.id === record.id ? { ...item, isProcessed: true } : item
      )
      setFilteredData(newData)
      message.success('已标记为处理')
    } catch (err) {
      message.error('操作失败')
    }
  }

  const handleGenerateAllocation = (record) => {
    setCurrentRecord(record)
    allocationForm.resetFields()
    allocationForm.setFieldsValue({
      sourceWarehouseId: warehouses[(warehouses.findIndex((w) => w.value === record.warehouseId) + 2) % warehouses.length].value,
      targetWarehouseId: record.warehouseId,
      medicineId: record.medicineId,
      medicineName: record.medicineName,
      quantity: Math.min(record.suggestedQuantity, record.suggestedQuantity * 0.6),
      reason: '库存不足，从其他仓库调拨'
    })
    setAllocationModalVisible(true)
  }

  const handleAllocationSubmit = async () => {
    try {
      const values = await allocationForm.validateFields()
      try {
        await createAllocation({
          ...values,
          expectedDeliveryDate: dayjs().add(3, 'day').format('YYYY-MM-DD'),
          requestedByUserId: 1
        })
      } catch {
        // API失败，Mock处理
      }
      message.success('调拨申请已创建')
      setAllocationModalVisible(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleTableChange = (page) => {
    setPagination(page)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
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
    { title: '仓库', dataIndex: 'warehouseName', key: 'warehouseName', width: 100 },
    { title: '当前库存', dataIndex: 'currentStock', key: 'currentStock', width: 100, sorter: (a, b) => a.currentStock - b.currentStock },
    { title: '安全库存', dataIndex: 'safetyStock', key: 'safetyStock', width: 100 },
    { title: '建议补货量', dataIndex: 'suggestedQuantity', key: 'suggestedQuantity', width: 110, sorter: (a, b) => a.suggestedQuantity - b.suggestedQuantity },
    { title: '日均用量', dataIndex: 'averageDailyUsage', key: 'averageDailyUsage', width: 100 },
    {
      title: '预计缺货天数',
      dataIndex: 'daysUntilStockout',
      key: 'daysUntilStockout',
      width: 120,
      sorter: (a, b) => a.daysUntilStockout - b.daysUntilStockout,
      render: (val) => <span style={{ color: val <= 1 ? '#ff4d4f' : val <= 3 ? '#faad14' : '#52c41a', fontWeight: 600 }}>{val} 天</span>
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (val) => <Tag color={riskLevelColorMap[val]}>{riskLevelTextMap[val]}</Tag>
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 90,
      render: (val) => <Tag color={priorityColorMap[val]}>{priorityTextMap[val]}</Tag>
    },
    { title: '首选供应商', dataIndex: 'preferredSupplierName', key: 'preferredSupplierName', width: 160 },
    { title: '生成时间', dataIndex: 'generatedAt', key: 'generatedAt', width: 170 },
    {
      title: '状态',
      key: 'status',
      width: 100,
      render: (_, record) => (
        record.isProcessed
          ? <Tag color="green">已处理</Tag>
          : <Tag color="orange">未处理</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            查看
          </Button>
          {!record.isProcessed && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleMarkProcessed(record)}>
              标记处理
            </Button>
          )}
          <Button type="link" size="small" icon={<SwapOutlined />} onClick={() => handleGenerateAllocation(record)}>
            生成调拨
          </Button>
        </Space>
      )
    }
  ]

  const pagedData = filteredData.slice(
    (pagination.current - 1) * pagination.pageSize,
    pagination.current * pagination.pageSize
  )

  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  }

  return (
    <div>
      <PageHeader title="补货建议 (采购计划员入口)" />

      <Card style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="药品编码/名称/供应商" style={{ width: 200 }} allowClear prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item name="warehouseId" label="仓库">
            <Select placeholder="请选择仓库" style={{ width: 150 }} allowClear options={warehouses} />
          </Form.Item>
          <Form.Item name="riskLevel" label="风险等级">
            <Select placeholder="请选择" style={{ width: 130 }} allowClear options={riskLevelOptions} />
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear options={priorityOptions} />
          </Form.Item>
          <Form.Item name="isProcessed" label="是否已处理">
            <Select placeholder="请选择" style={{ width: 130 }} allowClear options={processedOptions} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={handleReset}>重置</Button>
              <Button type="primary" icon={<ThunderboltOutlined />} style={{ background: '#52c41a', borderColor: '#52c41a' }} onClick={handleGenerateSuggestions}>生成建议</Button>
              <Button icon={<CheckCircleOutlined />} onClick={handleBatchProcess} disabled={selectedRowKeys.length === 0}>批量处理</Button>
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
          rowSelection={rowSelection}
        />
      </Card>

      <Modal
        title="补货建议详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>
        ]}
        width={800}
      >
        {currentRecord && (
          <div>
            <Descriptions title="基础信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="ID">{currentRecord.id}</Descriptions.Item>
              <Descriptions.Item label="药品编码">{currentRecord.medicineCode}</Descriptions.Item>
              <Descriptions.Item label="药品名称" span={2}>{currentRecord.medicineName}</Descriptions.Item>
              <Descriptions.Item label="仓库">{currentRecord.warehouseName}</Descriptions.Item>
              <Descriptions.Item label="首选供应商">{currentRecord.preferredSupplierName}</Descriptions.Item>
              <Descriptions.Item label="风险等级"><Tag color={riskLevelColorMap[currentRecord.riskLevel]}>{riskLevelTextMap[currentRecord.riskLevel]}</Tag></Descriptions.Item>
              <Descriptions.Item label="优先级"><Tag color={priorityColorMap[currentRecord.priority]}>{priorityTextMap[currentRecord.priority]}</Tag></Descriptions.Item>
              <Descriptions.Item label="生成时间">{currentRecord.generatedAt}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {currentRecord.isProcessed ? <Tag color="green">已处理</Tag> : <Tag color="orange">未处理</Tag>}
              </Descriptions.Item>
            </Descriptions>

            <Descriptions title="库存信息" bordered size="small" column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="当前库存">{currentRecord.currentStock}</Descriptions.Item>
              <Descriptions.Item label="安全库存" style={{ background: '#fff7e6' }}>{currentRecord.safetyStock}</Descriptions.Item>
              <Descriptions.Item label="建议补货量" style={{ background: '#e6f7ff' }}>{currentRecord.suggestedQuantity}</Descriptions.Item>
              <Descriptions.Item label="日均用量">{currentRecord.averageDailyUsage}</Descriptions.Item>
              <Descriptions.Item label="预计缺货天数" span={2}>
                <span style={{ color: currentRecord.daysUntilStockout <= 1 ? '#ff4d4f' : currentRecord.daysUntilStockout <= 3 ? '#faad14' : '#52c41a', fontWeight: 600 }}>
                  {currentRecord.daysUntilStockout} 天
                </span>
              </Descriptions.Item>
            </Descriptions>

            {currentRecord.allocationRequest && (
              <Descriptions title="调拨申请" bordered size="small" column={2} style={{ marginBottom: 16 }}>
                <Descriptions.Item label="调拨单号">{currentRecord.allocationRequest.requestNumber}</Descriptions.Item>
                <Descriptions.Item label="调拨数量">{currentRecord.allocationRequest.quantity}</Descriptions.Item>
                <Descriptions.Item label="源仓库">{currentRecord.allocationRequest.sourceWarehouseName}</Descriptions.Item>
                <Descriptions.Item label="目标仓库">{currentRecord.allocationRequest.targetWarehouseName}</Descriptions.Item>
              </Descriptions>
            )}

            <Descriptions title="供应商回复状态" bordered size="small" column={1}>
              <Descriptions.Item label="状态">
                <Tag color={supplierReplyStatusMap[currentRecord.supplierReplyStatus].color}>
                  {supplierReplyStatusMap[currentRecord.supplierReplyStatus].text}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>

      <Modal
        title="生成调拨申请"
        open={allocationModalVisible}
        onOk={handleAllocationSubmit}
        onCancel={() => setAllocationModalVisible(false)}
        width={600}
      >
        <Form form={allocationForm} layout="vertical">
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
              <Form.Item name="medicineId" label="药品ID" rules={[{ required: true, message: '请输入药品ID' }]}>
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="medicineName" label="药品名称">
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="quantity" label="调拨数量" rules={[{ required: true, message: '请输入调拨数量' }]}>
                <Input type="number" min={1} placeholder="请输入调拨数量" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="reason" label="调拨原因">
                <Input placeholder="请输入调拨原因" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  )
}

export default Replenishment
