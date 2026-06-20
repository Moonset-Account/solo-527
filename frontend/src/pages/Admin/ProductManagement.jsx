import { useState, useEffect } from 'react'
import { Button, Space, Input, Select, Modal, Form, InputNumber, message, Row, Col, Tag, Popconfirm, Table, Statistic } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, PoweroffOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import { getProductList, createProduct, updateProduct, deleteProduct } from '@/api/admin'

const categoryColorMap = {
  antibiotic: 'red',
  analgesic: 'orange',
  cardiovascular: 'blue',
  respiratory: 'cyan',
  digestive: 'green',
  vitamin: 'purple',
  infusion: 'gold',
  chinese: 'magenta'
}

const categoryTextMap = {
  antibiotic: '抗生素',
  analgesic: '解热镇痛',
  cardiovascular: '心血管',
  respiratory: '呼吸系统',
  digestive: '消化系统',
  vitamin: '维生素',
  infusion: '输液类',
  chinese: '中成药'
}

const warehouseList = [
  { id: 1, code: 'WH-CENTRAL-001', name: '中央仓' },
  { id: 2, code: 'WH-EAST-002', name: '华东仓' },
  { id: 3, code: 'WH-SOUTH-003', name: '华南仓' },
  { id: 4, code: 'WH-WEST-004', name: '华西仓' }
]

const generateInventoryData = (productId) => {
  const baseData = {
    1: [
      { productId: 1, warehouseId: 1, quantity: 2580, minStock: 500, maxStock: 5000 },
      { productId: 1, warehouseId: 2, quantity: 1850, minStock: 400, maxStock: 4000 },
      { productId: 1, warehouseId: 3, quantity: 1200, minStock: 300, maxStock: 3000 },
      { productId: 1, warehouseId: 4, quantity: 320, minStock: 300, maxStock: 2000 },
    ],
    2: [
      { productId: 2, warehouseId: 1, quantity: 3200, minStock: 600, maxStock: 6000 },
      { productId: 2, warehouseId: 2, quantity: 2100, minStock: 500, maxStock: 5000 },
      { productId: 2, warehouseId: 3, quantity: 1580, minStock: 400, maxStock: 4000 },
      { productId: 2, warehouseId: 4, quantity: 890, minStock: 300, maxStock: 3000 },
    ],
    3: [
      { productId: 3, warehouseId: 1, quantity: 5600, minStock: 1000, maxStock: 10000 },
      { productId: 3, warehouseId: 2, quantity: 4200, minStock: 800, maxStock: 8000 },
      { productId: 3, warehouseId: 3, quantity: 3100, minStock: 600, maxStock: 6000 },
      { productId: 3, warehouseId: 4, quantity: 1800, minStock: 500, maxStock: 5000 },
    ],
    4: [
      { productId: 4, warehouseId: 1, quantity: 1800, minStock: 400, maxStock: 4000 },
      { productId: 4, warehouseId: 2, quantity: 1200, minStock: 300, maxStock: 3000 },
      { productId: 4, warehouseId: 3, quantity: 850, minStock: 250, maxStock: 2500 },
      { productId: 4, warehouseId: 4, quantity: 420, minStock: 200, maxStock: 2000 },
    ],
    5: [
      { productId: 5, warehouseId: 1, quantity: 8500, minStock: 2000, maxStock: 20000 },
      { productId: 5, warehouseId: 2, quantity: 6200, minStock: 1500, maxStock: 15000 },
      { productId: 5, warehouseId: 3, quantity: 4800, minStock: 1200, maxStock: 12000 },
      { productId: 5, warehouseId: 4, quantity: 2100, minStock: 800, maxStock: 8000 },
    ],
    6: [
      { productId: 6, warehouseId: 1, quantity: 12000, minStock: 3000, maxStock: 30000 },
      { productId: 6, warehouseId: 2, quantity: 8500, minStock: 2000, maxStock: 20000 },
      { productId: 6, warehouseId: 3, quantity: 6800, minStock: 1500, maxStock: 15000 },
      { productId: 6, warehouseId: 4, quantity: 3200, minStock: 1000, maxStock: 10000 },
    ],
    7: [
      { productId: 7, warehouseId: 1, quantity: 2100, minStock: 500, maxStock: 5000 },
      { productId: 7, warehouseId: 2, quantity: 1500, minStock: 400, maxStock: 4000 },
      { productId: 7, warehouseId: 3, quantity: 980, minStock: 300, maxStock: 3000 },
      { productId: 7, warehouseId: 4, quantity: 180, minStock: 300, maxStock: 2000 },
    ],
    8: [
      { productId: 8, warehouseId: 1, quantity: 4500, minStock: 800, maxStock: 8000 },
      { productId: 8, warehouseId: 2, quantity: 3200, minStock: 600, maxStock: 6000 },
      { productId: 8, warehouseId: 3, quantity: 2100, minStock: 500, maxStock: 5000 },
      { productId: 8, warehouseId: 4, quantity: 1200, minStock: 400, maxStock: 4000 },
    ],
    9: [
      { productId: 9, warehouseId: 1, quantity: 9800, minStock: 2500, maxStock: 25000 },
      { productId: 9, warehouseId: 2, quantity: 7200, minStock: 1800, maxStock: 18000 },
      { productId: 9, warehouseId: 3, quantity: 5100, minStock: 1500, maxStock: 15000 },
      { productId: 9, warehouseId: 4, quantity: 2800, minStock: 1000, maxStock: 10000 },
    ],
    10: [
      { productId: 10, warehouseId: 1, quantity: 1850, minStock: 400, maxStock: 4000 },
      { productId: 10, warehouseId: 2, quantity: 1200, minStock: 300, maxStock: 3000 },
      { productId: 10, warehouseId: 3, quantity: 720, minStock: 250, maxStock: 2500 },
      { productId: 10, warehouseId: 4, quantity: 150, minStock: 300, maxStock: 2000 },
    ]
  }
  return baseData[productId] || warehouseList.map((w) => ({
    productId,
    warehouseId: w.id,
    quantity: Math.floor(Math.random() * 2000),
    minStock: 200,
    maxStock: 2000
  }))
}

const ProductManagement = () => {
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInventoryOpen, setIsInventoryOpen] = useState(false)
  const [modalType, setModalType] = useState('create')
  const [editingRecord, setEditingRecord] = useState(null)
  const [inventoryRecord, setInventoryRecord] = useState(null)
  const [inventoryData, setInventoryData] = useState([])
  const [searchParams, setSearchParams] = useState({ keyword: '', category: null, status: null })
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })

  const [dataSource, setDataSource] = useState([
    { id: 1, code: 'MED-AMX-001', genericName: '阿莫西林胶囊', tradeName: '阿莫仙', spec: '0.25g*24粒', unit: '盒', manufacturer: '珠海联邦制药', approvalNo: '国药准字H44021518', category: 'antibiotic', safeStock: 1500, maxStock: 15000, leadTime: 3, status: true, createTime: '2024-01-01 08:00:00' },
    { id: 2, code: 'MED-CTX-002', genericName: '头孢克肟分散片', tradeName: '世福素', spec: '0.1g*6片', unit: '盒', manufacturer: '广州白云山制药', approvalNo: '国药准字H20051484', category: 'antibiotic', safeStock: 1800, maxStock: 18000, leadTime: 5, status: true, createTime: '2024-01-05 09:30:00' },
    { id: 3, code: 'MED-IBP-003', genericName: '布洛芬缓释胶囊', tradeName: '芬必得', spec: '0.3g*20粒', unit: '盒', manufacturer: '中美史克', approvalNo: '国药准字H10900089', category: 'analgesic', safeStock: 3000, maxStock: 30000, leadTime: 2, status: true, createTime: '2024-01-10 10:15:00' },
    { id: 4, code: 'MED-FFDS-004', genericName: '复方丹参滴丸', tradeName: '天士力', spec: '27mg*180丸', unit: '盒', manufacturer: '天士力制药集团', approvalNo: '国药准字Z10950111', category: 'cardiovascular', safeStock: 1200, maxStock: 12000, leadTime: 7, status: true, createTime: '2024-01-15 14:20:00' },
    { id: 5, code: 'MED-NACL-005', genericName: '氯化钠注射液', tradeName: '生理盐水', spec: '0.9% 250ml', unit: '袋', manufacturer: '四川科伦药业', approvalNo: '国药准字H51021157', category: 'infusion', safeStock: 5000, maxStock: 50000, leadTime: 2, status: true, createTime: '2024-01-20 16:45:00' },
    { id: 6, code: 'MED-VC-006', genericName: '维生素C片', tradeName: '力度伸', spec: '100mg*100片', unit: '瓶', manufacturer: '东北制药集团', approvalNo: '国药准字H21020701', category: 'vitamin', safeStock: 8000, maxStock: 80000, leadTime: 3, status: true, createTime: '2024-02-01 08:30:00' },
    { id: 7, code: 'MED-OML-007', genericName: '奥美拉唑肠溶胶囊', tradeName: '洛赛克', spec: '20mg*14粒', unit: '盒', manufacturer: '阿斯利康制药', approvalNo: '国药准字H20030945', category: 'digestive', safeStock: 1500, maxStock: 15000, leadTime: 5, status: true, createTime: '2024-02-10 10:00:00' },
    { id: 8, code: 'MED-SHL-008', genericName: '双黄连口服液', tradeName: '哈药', spec: '10ml*10支', unit: '盒', manufacturer: '哈药集团三精制药', approvalNo: '国药准字Z10920053', category: 'chinese', safeStock: 2500, maxStock: 25000, leadTime: 4, status: true, createTime: '2024-02-15 11:30:00' },
    { id: 9, code: 'MED-GLU-009', genericName: '葡萄糖注射液', tradeName: 'GS', spec: '5% 500ml', unit: '袋', manufacturer: '华润双鹤药业', approvalNo: '国药准字H11021404', category: 'infusion', safeStock: 6000, maxStock: 60000, leadTime: 2, status: false, createTime: '2024-02-20 15:00:00' },
    { id: 10, code: 'MED-ZYFSX-010', genericName: '盐酸左氧氟沙星片', tradeName: '可乐必妥', spec: '0.5g*5片', unit: '盒', manufacturer: '第一三共制药', approvalNo: '国药准字H20000655', category: 'antibiotic', safeStock: 1200, maxStock: 12000, leadTime: 6, status: true, createTime: '2024-03-01 09:00:00' }
  ])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
    { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
    {
      title: '通用名/商品名',
      key: 'name',
      width: 220,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.genericName}</div>
          <div style={{ fontSize: 12, color: '#888' }}>{record.tradeName}</div>
        </div>
      )
    },
    { title: '规格', dataIndex: 'spec', key: 'spec', width: 140 },
    { title: '单位', dataIndex: 'unit', key: 'unit', width: 70 },
    { title: '生产厂家', dataIndex: 'manufacturer', key: 'manufacturer', width: 160, ellipsis: true },
    { title: '批准文号', dataIndex: 'approvalNo', key: 'approvalNo', width: 160 },
    { title: '分类', dataIndex: 'category', key: 'category', width: 100, render: (cat) => <Tag color={categoryColorMap[cat]}>{categoryTextMap[cat]}</Tag> },
    { title: '安全库存', dataIndex: 'safeStock', key: 'safeStock', width: 90, align: 'right', render: (val) => val.toLocaleString() },
    { title: '最大库存', dataIndex: 'maxStock', key: 'maxStock', width: 90, align: 'right', render: (val) => val.toLocaleString() },
    { title: '提前期(天)', dataIndex: 'leadTime', key: 'leadTime', width: 100, align: 'center' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 80, render: (status) => <Tag color={status ? 'green' : 'default'}>{status ? '启用' : '禁用'}</Tag> },
    {
      title: '操作',
      key: 'action',
      width: 280,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title={record.status ? '确认禁用该药品？' : '确认启用该药品？'}
            onConfirm={() => handleToggleStatus(record)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" size="small" icon={<PoweroffOutlined />} danger={record.status}>
              {record.status ? '禁用' : '启用'}
            </Button>
          </Popconfirm>
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewInventory(record)}>
            查看库存
          </Button>
          <Popconfirm
            title="确认删除该药品？"
            onConfirm={() => handleDelete(record.id)}
            okText="删除"
            cancelText="取消"
            okType="danger"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const inventoryColumns = [
    { title: '仓库编码', dataIndex: 'warehouseCode', key: 'warehouseCode', width: 160 },
    { title: '仓库名称', dataIndex: 'warehouseName', key: 'warehouseName', width: 120 },
    { title: '当前库存', dataIndex: 'quantity', key: 'quantity', width: 120, align: 'right', render: (val) => <span style={{ fontWeight: 500 }}>{val.toLocaleString()}</span> },
    { title: '安全库存', dataIndex: 'minStock', key: 'minStock', width: 100, align: 'right', render: (val) => val.toLocaleString() },
    { title: '最大库存', dataIndex: 'maxStock', key: 'maxStock', width: 100, align: 'right', render: (val) => val.toLocaleString() },
    {
      title: '库存状态',
      key: 'stockStatus',
      width: 120,
      render: (_, record) => {
        if (record.quantity < record.minStock) {
          return <Tag color="red">库存不足</Tag>
        } else if (record.quantity > record.maxStock) {
          return <Tag color="orange">超储</Tag>
        }
        return <Tag color="green">正常</Tag>
      }
    },
    {
      title: '库存占比',
      key: 'ratio',
      width: 140,
      render: (_, record) => {
        const ratio = (record.quantity / record.maxStock) * 100
        const color = ratio < 20 ? '#ff4d4f' : ratio > 90 ? '#faad14' : '#52c41a'
        return (
          <div>
            <div style={{ background: '#f0f0f0', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(ratio, 100)}%`, height: '100%', background: color }} />
            </div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{ratio.toFixed(1)}%</div>
          </div>
        )
      }
    }
  ]

  useEffect(() => {
    loadData()
  }, [pagination.current, pagination.pageSize, searchParams])

  const loadData = async () => {
    try {
      setLoading(true)
      const res = await getProductList({
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.keyword,
        category: searchParams.category,
        status: searchParams.status
      })
      if (res && res.data) {
        setDataSource(res.data.list || dataSource)
        setPagination((prev) => ({ ...prev, total: res.data.total || dataSource.length }))
      }
    } catch {
      setPagination((prev) => ({ ...prev, total: dataSource.length }))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, current: 1 }))
    loadData()
  }

  const handleReset = () => {
    setSearchParams({ keyword: '', category: null, status: null })
    setPagination((prev) => ({ ...prev, current: 1 }))
  }

  const handleCreate = () => {
    setModalType('create')
    setEditingRecord(null)
    form.resetFields()
    form.setFieldsValue({ status: true, category: 'antibiotic', unit: '盒', safeStock: 1000, maxStock: 10000, leadTime: 3 })
    setIsModalOpen(true)
  }

  const handleEdit = (record) => {
    setModalType('edit')
    setEditingRecord(record)
    form.setFieldsValue(record)
    setIsModalOpen(true)
  }

  const handleViewInventory = (record) => {
    setInventoryRecord(record)
    const rawData = generateInventoryData(record.id)
    const dataWithWarehouse = rawData.map((item) => {
      const wh = warehouseList.find((w) => w.id === item.warehouseId)
      return {
        ...item,
        warehouseCode: wh?.code || '',
        warehouseName: wh?.name || ''
      }
    })
    setInventoryData(dataWithWarehouse)
    setIsInventoryOpen(true)
  }

  const handleDelete = async (id) => {
    try {
      await deleteProduct(id)
    } catch {}
    setDataSource(dataSource.filter((item) => item.id !== id))
    message.success('删除成功')
  }

  const handleToggleStatus = async (record) => {
    const newStatus = !record.status
    try {
      await updateProduct(record.id, { status: newStatus })
    } catch {}
    setDataSource(dataSource.map((item) => (item.id === record.id ? { ...item, status: newStatus } : item)))
    message.success(newStatus ? '已启用' : '已禁用')
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (modalType === 'create') {
        try {
          const res = await createProduct(values)
          const newId = (res && res.data && res.data.id) || Math.max(...dataSource.map((i) => i.id), 0) + 1
          setDataSource([
            {
              id: newId,
              ...values,
              status: values.status ?? true,
              createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
            },
            ...dataSource
          ])
        } catch {
          const newId = Math.max(...dataSource.map((i) => i.id), 0) + 1
          setDataSource([
            {
              id: newId,
              ...values,
              status: values.status ?? true,
              createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
            },
            ...dataSource
          ])
        }
        message.success('创建成功')
      } else {
        try {
          await updateProduct(editingRecord.id, values)
        } catch {}
        setDataSource(dataSource.map((item) => (item.id === editingRecord.id ? { ...item, ...values } : item)))
        message.success('修改成功')
      }
      setIsModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleTableChange = (newPagination) => {
    setPagination(newPagination)
  }

  const totalInventory = inventoryData.reduce((sum, item) => sum + item.quantity, 0)
  const lowStockCount = inventoryData.filter((item) => item.quantity < item.minStock).length

  return (
    <div>
      <PageHeader
        title="药品/商品管理"
      />

      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space wrap>
          <Input
            placeholder="关键词(编码/通用名/商品名/厂家)"
            style={{ width: 280 }}
            allowClear
            prefix={<SearchOutlined />}
            value={searchParams.keyword}
            onChange={(e) => setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="请选择分类"
            style={{ width: 150 }}
            allowClear
            value={searchParams.category}
            onChange={(val) => setSearchParams((prev) => ({ ...prev, category: val }))}
            options={[
              { value: 'antibiotic', label: '抗生素' },
              { value: 'analgesic', label: '解热镇痛' },
              { value: 'cardiovascular', label: '心血管' },
              { value: 'respiratory', label: '呼吸系统' },
              { value: 'digestive', label: '消化系统' },
              { value: 'vitamin', label: '维生素' },
              { value: 'infusion', label: '输液类' },
              { value: 'chinese', label: '中成药' }
            ]}
          />
          <Select
            placeholder="请选择状态"
            style={{ width: 120 }}
            allowClear
            value={searchParams.status}
            onChange={(val) => setSearchParams((prev) => ({ ...prev, status: val }))}
            options={[
              { value: true, label: '启用' },
              { value: false, label: '禁用' }
            ]}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>新增</Button>
        </Space>
      </div>

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={pagination}
        onChange={handleTableChange}
        rowKey="id"
        scroll={{ x: 1800 }}
      />

      <Modal
        title={modalType === 'create' ? '新增药品' : '编辑药品'}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={() => setIsModalOpen(false)}
        width={800}
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="code" label="编码" rules={[{ required: true, message: '请输入编码' }]}>
                <Input placeholder="请输入药品编码" disabled={modalType === 'edit'} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select placeholder="请选择分类" options={[
                  { value: 'antibiotic', label: '抗生素' },
                  { value: 'analgesic', label: '解热镇痛' },
                  { value: 'cardiovascular', label: '心血管' },
                  { value: 'respiratory', label: '呼吸系统' },
                  { value: 'digestive', label: '消化系统' },
                  { value: 'vitamin', label: '维生素' },
                  { value: 'infusion', label: '输液类' },
                  { value: 'chinese', label: '中成药' }
                ]} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="genericName" label="通用名" rules={[{ required: true, message: '请输入通用名' }]}>
                <Input placeholder="请输入通用名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="tradeName" label="商品名" rules={[{ required: true, message: '请输入商品名' }]}>
                <Input placeholder="请输入商品名" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="spec" label="规格" rules={[{ required: true, message: '请输入规格' }]}>
                <Input placeholder="如：0.25g*24粒" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="unit" label="单位" rules={[{ required: true, message: '请输入单位' }]}>
                <Select
                  placeholder="请选择单位"
                  options={[
                    { value: '盒', label: '盒' },
                    { value: '瓶', label: '瓶' },
                    { value: '袋', label: '袋' },
                    { value: '支', label: '支' },
                    { value: '片', label: '片' }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="leadTime" label="提前期(天)" rules={[{ required: true, message: '请输入提前期' }]}>
                <InputNumber min={1} max={30} style={{ width: '100%' }} placeholder="采购提前期" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="manufacturer" label="生产厂家" rules={[{ required: true, message: '请输入生产厂家' }]}>
                <Input placeholder="请输入生产厂家" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="approvalNo" label="批准文号" rules={[{ required: true, message: '请输入批准文号' }]}>
                <Input placeholder="国药准字XXXXXXXX" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="safeStock" label="安全库存" rules={[{ required: true, message: '请输入安全库存' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入安全库存" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="maxStock" label="最大库存" rules={[{ required: true, message: '请输入最大库存' }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="请输入最大库存" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="status" label="状态" valuePropName="checked">
                <Select
                  placeholder="请选择状态"
                  style={{ width: '100%' }}
                  options={[
                    { value: true, label: '启用' },
                    { value: false, label: '禁用' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      <Modal
        title={`库存详情 - ${inventoryRecord?.genericName || ''} (${inventoryRecord?.tradeName || ''})`}
        open={isInventoryOpen}
        onCancel={() => setIsInventoryOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsInventoryOpen(false)}>
            关闭
          </Button>
        ]}
        width={900}
        destroyOnClose
      >
        {inventoryRecord && (
          <div>
            <div style={{ background: '#fafafa', padding: 16, borderRadius: 4, marginBottom: 16 }}>
              <Row gutter={16}>
                <Col xs={12} md={6}>
                  <Statistic title="药品编码" value={inventoryRecord.code} valueStyle={{ fontSize: 14, color: '#333' }} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic title="规格" value={inventoryRecord.spec} valueStyle={{ fontSize: 14, color: '#333' }} />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="总库存"
                    prefix={<InboxOutlined />}
                    value={totalInventory}
                    suffix={inventoryRecord.unit}
                    valueStyle={{ fontSize: 18, color: '#1890ff' }}
                  />
                </Col>
                <Col xs={12} md={6}>
                  <Statistic
                    title="预警仓库"
                    value={lowStockCount}
                    suffix="个"
                    valueStyle={{ fontSize: 18, color: lowStockCount > 0 ? '#ff4d4f' : '#52c41a' }}
                  />
                </Col>
              </Row>
            </div>
            <Table
              columns={inventoryColumns}
              dataSource={inventoryData}
              rowKey="warehouseId"
              pagination={false}
              size="middle"
            />
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProductManagement
