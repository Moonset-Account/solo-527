import { useState, useMemo } from 'react'
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
  DatePicker,
  Switch,
  Slider,
  Divider,
  Alert,
  Checkbox,
  Tooltip,
  InputNumber
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  BellOutlined,
  SettingOutlined,
  CheckCircleTwoTone,
  CloseCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import CommonTable from '@/components/CommonTable'
import PageHeader from '@/components/PageHeader'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker

const riskLevelMap = {
  low: { text: '低', color: 'green', order: 1, stackColor: '#52c41a' },
  medium: { text: '中', color: 'gold', order: 2, stackColor: '#faad14' },
  high: { text: '高', color: 'orange', order: 3, stackColor: '#fa8c16' },
  urgent: { text: '紧急', color: 'red', order: 4, stackColor: '#ff4d4f' }
}

const notifyTypeOptions = [
  { value: 'email', label: '邮件通知' },
  { value: 'sms', label: '短信通知' },
  { value: 'wechat', label: '企业微信' },
  { value: 'dingtalk', label: '钉钉通知' },
  { value: 'system', label: '系统消息' }
]

const warehouseList = ['北京仓', '上海仓', '广州仓', '深圳仓', '成都仓', '武汉仓']

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
  { name: '蒙脱石散', code: 'MED-012' },
  { name: '氯雷他定片', code: 'MED-013' },
  { name: '多潘立酮片', code: 'MED-014' },
  { name: '阿奇霉素片', code: 'MED-015' }
]

const getRiskByDays = (days) => {
  if (days <= 1) return 'urgent'
  if (days <= 3) return 'high'
  if (days <= 7) return 'medium'
  return 'low'
}

const generateTrendData = () => {
  const dates = []
  for (let i = 29; i >= 0; i--) {
    dates.push(dayjs().subtract(i, 'day').format('MM-DD'))
  }
  const low = [], medium = [], high = [], urgent = []
  for (let i = 0; i < 30; i++) {
    const base = 8 + Math.sin(i / 3) * 3
    low.push(Math.max(2, Math.floor(base + Math.random() * 6 - 3)))
    medium.push(Math.max(1, Math.floor(base * 0.7 + Math.random() * 5 - 2)))
    high.push(Math.max(0, Math.floor(base * 0.4 + Math.random() * 4 - 1)))
    urgent.push(Math.max(0, Math.floor(base * 0.2 + Math.random() * 3)))
  }
  return { dates, low, medium, high, urgent }
}

const generateDetailData = () => {
  const data = []
  let id = 1
  for (let dayOffset = 0; dayOffset < 30; dayOffset += 2) {
    const date = dayjs().subtract(dayOffset, 'day').format('YYYY-MM-DD')
    const numRows = Math.floor(Math.random() * 3) + 2
    for (let j = 0; j < numRows; j++) {
      const medicine = medicines[Math.floor(Math.random() * medicines.length)]
      const warehouse = warehouseList[Math.floor(Math.random() * warehouseList.length)]
      const dailyUsage = Math.floor(Math.random() * 40) + 8
      const safeStock = dailyUsage * (Math.floor(Math.random() * 5) + 5)
      const currentStock = Math.floor(Math.random() * safeStock) + Math.floor(Math.random() * 40)
      const stockoutDays = currentStock >= dailyUsage
        ? Math.max(0, Math.floor((currentStock - dailyUsage * 2) / dailyUsage))
        : 0
      const riskLevel = getRiskByDays(stockoutDays)
      const thresholdMap = { low: 15, medium: 7, high: 3, urgent: 1 }
      const triggersAlert = stockoutDays <= thresholdMap[riskLevel]

      data.push({
        id: id++,
        date,
        medicineName: medicine.name,
        medicineCode: medicine.code,
        warehouse,
        currentStock,
        safeStock,
        dailyUsage,
        stockoutDays,
        riskLevel,
        triggersAlert,
        createdAt: `${date} ${String(Math.floor(Math.random() * 12) + 6).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`
      })
    }
  }
  return data.sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt))
}

const StockoutTrend = () => {
  const [loading, setLoading] = useState(false)
  const [dataSource] = useState(generateDetailData)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: generateDetailData().length })

  const [viewModalOpen, setViewModalOpen] = useState(false)
  const [replenishModalOpen, setReplenishModalOpen] = useState(false)
  const [ruleModalOpen, setRuleModalOpen] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)

  const [viewForm] = Form.useForm()
  const [replenishForm] = Form.useForm()
  const [ruleForm] = Form.useForm()

  const [keyword, setKeyword] = useState('')
  const [filterWarehouse, setFilterWarehouse] = useState(null)
  const [filterMedicines, setFilterMedicines] = useState([])
  const [dateRange, setDateRange] = useState(null)
  const [filterRisk, setFilterRisk] = useState(null)
  const [filterAlertOnly, setFilterAlertOnly] = useState(false)

  const [notifyEnabled, setNotifyEnabled] = useState(true)
  const [urgentThreshold, setUrgentThreshold] = useState(1)
  const [highThreshold, setHighThreshold] = useState(3)
  const [mediumThreshold, setMediumThreshold] = useState(7)

  const [ruleList, setRuleList] = useState([
    { id: 1, riskLevel: 'urgent', dayThreshold: 1, notifyTypes: ['email', 'sms', 'system'], enabled: true },
    { id: 2, riskLevel: 'high', dayThreshold: 3, notifyTypes: ['email', 'system'], enabled: true },
    { id: 3, riskLevel: 'medium', dayThreshold: 7, notifyTypes: ['email'], enabled: true },
    { id: 4, riskLevel: 'low', dayThreshold: 15, notifyTypes: ['system'], enabled: false }
  ])

  const trendData = useMemo(() => generateTrendData(), [])

  const trendOption = {
    title: {
      text: '近30天缺货风险趋势',
      left: 'left',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: {
      data: ['低风险', '中风险', '高风险', '紧急风险'],
      right: 10,
      top: 0
    },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.dates,
      axisLabel: { fontSize: 11, rotate: 30 }
    },
    yAxis: {
      type: 'value',
      name: '品种数'
    },
    series: [
      {
        name: '低风险',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.low,
        itemStyle: { color: '#52c41a' },
        lineStyle: { width: 2 }
      },
      {
        name: '中风险',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.medium,
        itemStyle: { color: '#faad14' },
        lineStyle: { width: 2 }
      },
      {
        name: '高风险',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.high,
        itemStyle: { color: '#fa8c16' },
        lineStyle: { width: 2 }
      },
      {
        name: '紧急风险',
        type: 'line',
        stack: 'Total',
        smooth: true,
        areaStyle: { opacity: 0.3 },
        data: trendData.urgent,
        itemStyle: { color: '#ff4d4f' },
        lineStyle: { width: 2 }
      }
    ]
  }

  const filteredData = useMemo(() => {
    let result = [...dataSource]
    if (keyword) {
      result = result.filter(i =>
        i.medicineName.includes(keyword) ||
        i.medicineCode.includes(keyword)
      )
    }
    if (filterWarehouse) {
      result = result.filter(i => i.warehouse === filterWarehouse)
    }
    if (filterMedicines && filterMedicines.length > 0) {
      result = result.filter(i => filterMedicines.includes(i.medicineCode))
    }
    if (dateRange && dateRange.length === 2) {
      const start = dateRange[0].format('YYYY-MM-DD')
      const end = dateRange[1].format('YYYY-MM-DD')
      result = result.filter(i => i.date >= start && i.date <= end)
    }
    if (filterRisk) {
      result = result.filter(i => i.riskLevel === filterRisk)
    }
    if (filterAlertOnly) {
      result = result.filter(i => i.triggersAlert)
    }
    return result
  }, [dataSource, keyword, filterWarehouse, filterMedicines, dateRange, filterRisk, filterAlertOnly])

  const columns = [
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      sorter: (a, b) => a.date.localeCompare(b.date)
    },
    {
      title: '药品+编码',
      key: 'medicine',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.medicineName}</div>
          <div style={{ fontSize: 12, color: '#999' }}>{record.medicineCode}</div>
        </div>
      )
    },
    {
      title: '仓库',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 100,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    {
      title: '当前库存 / 安全库存',
      key: 'stocks',
      width: 170,
      render: (_, record) => {
        const ratio = record.currentStock / record.safeStock
        let color = '#262626'
        if (ratio < 0.3) color = '#ff4d4f'
        else if (ratio < 0.6) color = '#faad14'
        return (
          <div>
            <div>
              <span style={{ color: '#8c8c8c' }}>当前：</span>
              <span style={{ color, fontWeight: 600 }}>{record.currentStock}</span>
            </div>
            <div>
              <span style={{ color: '#8c8c8c' }}>安全：</span>
              <span>{record.safeStock}</span>
            </div>
            <div style={{ marginTop: 4, height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, ratio * 100)}%`,
                  background: ratio < 0.3 ? '#ff4d4f' : ratio < 0.6 ? '#faad14' : '#52c41a',
                  transition: 'width .3s'
                }}
              />
            </div>
          </div>
        )
      }
    },
    {
      title: '日均用量',
      dataIndex: 'dailyUsage',
      key: 'dailyUsage',
      width: 90,
      align: 'right',
      render: (v) => <span>{v} 件/天</span>
    },
    {
      title: '预计缺货天数',
      dataIndex: 'stockoutDays',
      key: 'stockoutDays',
      width: 120,
      align: 'center',
      render: (val) => {
        const level = getRiskByDays(val)
        return (
          <div>
            <div style={{
              fontSize: 20,
              fontWeight: 600,
              color: riskLevelMap[level].color
            }}>
              {val}
            </div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>天</div>
          </div>
        )
      }
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (level) => {
        const info = riskLevelMap[level]
        return (
          <Tag color={info.color} style={{ fontSize: 13, padding: '2px 10px' }}>
            {info.text}风险
          </Tag>
        )
      }
    },
    {
      title: '触发告警',
      dataIndex: 'triggersAlert',
      key: 'triggersAlert',
      width: 100,
      align: 'center',
      render: (v) => v
        ? (
          <Tooltip title="已触发告警通知">
            <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 22 }} />
          </Tooltip>
        )
        : (
          <Tooltip title="未达到告警阈值">
            <CloseCircleOutlined style={{ fontSize: 20, color: '#d9d9d9' }} />
          </Tooltip>
        )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button
            size="small"
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleGenerateReplenish(record)}
          >
            生成补货
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
        </Space>
      )
    }
  ]

  const handleView = (record) => {
    setCurrentRecord(record)
    viewForm.resetFields()
    viewForm.setFieldsValue(record)
    setViewModalOpen(true)
  }

  const handleGenerateReplenish = (record) => {
    setCurrentRecord(record)
    replenishForm.resetFields()
    const safetyQty = record.safeStock * 2 - record.currentStock
    const suggestQty = Math.max(record.safeStock, safetyQty)
    replenishForm.setFieldsValue({
      medicineName: record.medicineName,
      medicineCode: record.medicineCode,
      warehouse: record.warehouse,
      currentStock: record.currentStock,
      safeStock: record.safeStock,
      dailyUsage: record.dailyUsage,
      suggestQty,
      actualQty: suggestQty,
      remark: `缺货风险：${riskLevelMap[record.riskLevel].text}，预计${record.stockoutDays}天后缺货`
    })
    setReplenishModalOpen(true)
  }

  const handleReplenishSubmit = async () => {
    try {
      await replenishForm.validateFields()
      const poNo = 'PO' + dayjs().format('YYYYMMDD') + String(Math.floor(Math.random() * 9000) + 1000)
      message.success(`补货单 ${poNo} 已生成，待审批`)
      setReplenishModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleOpenRuleModal = () => {
    ruleForm.resetFields()
    setRuleModalOpen(true)
  }

  const handleRuleSubmit = async () => {
    try {
      const values = await ruleForm.validateFields()
      const newRule = {
        id: Date.now(),
        riskLevel: values.riskLevel,
        dayThreshold: values.dayThreshold,
        notifyTypes: values.notifyTypes,
        enabled: true
      }
      setRuleList([...ruleList, newRule])
      message.success('提醒规则添加成功')
      setRuleModalOpen(false)
    } catch {
      console.log('表单验证失败')
    }
  }

  const handleToggleRule = (id, checked) => {
    setRuleList(ruleList.map(r => r.id === id ? { ...r, enabled: checked } : r))
    message.success(checked ? '已启用规则' : '已停用规则')
  }

  const handleDeleteRule = (id) => {
    setRuleList(ruleList.filter(r => r.id !== id))
    message.success('规则已删除')
  }

  const handleSearch = () => {
    setLoading(true)
    setTimeout(() => {
      setPagination(p => ({ ...p, current: 1, total: filteredData.length }))
      setLoading(false)
    }, 300)
  }

  const handleReset = () => {
    setKeyword('')
    setFilterWarehouse(null)
    setFilterMedicines([])
    setDateRange(null)
    setFilterRisk(null)
    setFilterAlertOnly(false)
    setPagination({ current: 1, pageSize: 10, total: dataSource.length })
  }

  const handleTableChange = (page) => {
    setPagination(page)
  }

  const fetchData = async (params) => {
    setLoading(true)
    try {
      // TODO: 调用API: getStockoutTrendList(params)
      // const res = await request({ url: '/admin/stockout-trends', method: 'get', params })
      setLoading(false)
    } catch {
      setLoading(false)
    }
  }

  const totalAlerts = filteredData.filter(i => i.triggersAlert).length
  const urgentCount = filteredData.filter(i => i.riskLevel === 'urgent').length
  const highCount = filteredData.filter(i => i.riskLevel === 'high').length

  return (
    <div>
      <PageHeader
        title="缺货风险趋势"
        extra={
          <Button
            icon={<SettingOutlined />}
            onClick={handleOpenRuleModal}
          >
            提醒规则配置
          </Button>
        }
      />

      <Card style={{ marginBottom: 16, borderRadius: 8 }}>
        <ReactECharts option={trendOption} style={{ height: 320 }} />
      </Card>

      {notifyEnabled && (urgentCount > 0 || highCount > 0) && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={
            <Space size="large">
              <span>当前共 <b style={{ color: '#cf1322' }}>{totalAlerts}</b> 条告警</span>
              {urgentCount > 0 && (
                <span>紧急风险 <Tag color="red">{urgentCount}</Tag></span>
              )}
              {highCount > 0 && (
                <span>高风险 <Tag color="orange">{highCount}</Tag></span>
              )}
              <span style={{ marginLeft: 'auto' }}>
                <BellOutlined /> 自动通知已开启
              </span>
            </Space>
          }
        />
      )}

      <div style={{ background: '#fff', padding: 16, marginBottom: 16, borderRadius: 4 }}>
        <Space wrap size="middle" style={{ marginBottom: 12 }}>
          <Input
            placeholder="药品名称/编码"
            style={{ width: 220 }}
            allowClear
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
          />
          <Select
            placeholder="仓库"
            style={{ width: 150 }}
            allowClear
            value={filterWarehouse}
            onChange={setFilterWarehouse}
            options={warehouseList.map(w => ({ value: w, label: w }))}
          />
          <Select
            mode="multiple"
            placeholder="药品多选"
            style={{ width: 280 }}
            allowClear
            maxTagCount="responsive"
            value={filterMedicines}
            onChange={setFilterMedicines}
            options={medicines.map(m => ({ value: m.code, label: `${m.name} (${m.code})` }))}
          />
          <RangePicker
            style={{ width: 280 }}
            placeholder={['开始日期', '结束日期']}
            value={dateRange}
            onChange={setDateRange}
          />
          <Select
            placeholder="风险等级"
            style={{ width: 130 }}
            allowClear
            value={filterRisk}
            onChange={setFilterRisk}
            options={Object.entries(riskLevelMap).map(([k, v]) => ({ value: k, label: `${v.text}风险` }))}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>

        <Divider style={{ margin: '8px 0 12px' }} />

        <Row gutter={[24, 12]} align="middle">
          <Col xs={24} sm={8} md={6}>
            <Space size={8}>
              <BellOutlined style={{ color: notifyEnabled ? '#1677ff' : '#bfbfbf' }} />
              <span>按条件提醒：</span>
              <Switch checked={notifyEnabled} onChange={setNotifyEnabled} />
            </Space>
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Space size="large" wrap disabled={!notifyEnabled}>
              <div style={{ opacity: notifyEnabled ? 1 : 0.4 }}>
                <Tag color="red">紧急</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>≥</span>
                <Slider
                  min={0}
                  max={3}
                  value={urgentThreshold}
                  onChange={setUrgentThreshold}
                  disabled={!notifyEnabled}
                  style={{ width: 100, display: 'inline-block', verticalAlign: 'middle', margin: '0 8px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{urgentThreshold}天</span>
              </div>
              <div style={{ opacity: notifyEnabled ? 1 : 0.4 }}>
                <Tag color="orange">高</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>≥</span>
                <Slider
                  min={1}
                  max={10}
                  value={highThreshold}
                  onChange={setHighThreshold}
                  disabled={!notifyEnabled}
                  style={{ width: 100, display: 'inline-block', verticalAlign: 'middle', margin: '0 8px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{highThreshold}天</span>
              </div>
              <div style={{ opacity: notifyEnabled ? 1 : 0.4 }}>
                <Tag color="gold">中</Tag>
                <span style={{ fontSize: 12, color: '#8c8c8c' }}>≥</span>
                <Slider
                  min={3}
                  max={20}
                  value={mediumThreshold}
                  onChange={setMediumThreshold}
                  disabled={!notifyEnabled}
                  style={{ width: 100, display: 'inline-block', verticalAlign: 'middle', margin: '0 8px' }}
                />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{mediumThreshold}天</span>
              </div>
              <div style={{ opacity: notifyEnabled ? 1 : 0.4 }}>
                <Checkbox checked={filterAlertOnly} onChange={e => setFilterAlertOnly(e.target.checked)}>
                  仅显示已告警
                </Checkbox>
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {ruleList.filter(r => r.enabled).length > 0 && (
        <Card
          size="small"
          style={{ marginBottom: 16, borderRadius: 4, background: '#fafafa' }}
          title={
            <Space>
              <SafetyOutlined style={{ color: '#1677ff' }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>当前生效的提醒规则</span>
            </Space>
          }
        >
          <Space wrap size="small">
            {ruleList.filter(r => r.enabled).map(rule => (
              <Tag key={rule.id} color={riskLevelMap[rule.riskLevel].color} style={{ padding: '4px 10px' }}>
                {riskLevelMap[rule.riskLevel].text}风险 ≥ {rule.dayThreshold}天
                <span style={{ marginLeft: 4, color: 'rgba(0,0,0,0.45)' }}>
                  ({rule.notifyTypes.map(t => notifyTypeOptions.find(o => o.value === t)?.label).join('/')})
                </span>
              </Tag>
            ))}
          </Space>
        </Card>
      )}

      <CommonTable
        loading={loading}
        columns={columns}
        dataSource={filteredData}
        pagination={{ ...pagination, total: filteredData.length }}
        onChange={handleTableChange}
      />

      <Modal
        title="风险详情"
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>关闭</Button>,
          currentRecord && (
            <Button
              key="replenish"
              type="primary"
              icon={<ShoppingCartOutlined />}
              onClick={() => {
                setViewModalOpen(false)
                setTimeout(() => handleGenerateReplenish(currentRecord), 100)
              }}
            >
              生成补货单
            </Button>
          )
        ]}
        width={640}
        destroyOnClose
      >
        {currentRecord && (
          <div style={{ lineHeight: 2.2 }}>
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <div><span style={{ color: '#8c8c8c' }}>统计日期：</span>{currentRecord.date}</div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>风险等级：</span>
                  <Tag color={riskLevelMap[currentRecord.riskLevel].color}>
                    {riskLevelMap[currentRecord.riskLevel].text}风险
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
                <div><span style={{ color: '#8c8c8c' }}>所在仓库：</span>{currentRecord.warehouse}</div>
              </Col>
              <Col span={12}>
                <div>
                  <span style={{ color: '#8c8c8c' }}>是否告警：</span>
                  {currentRecord.triggersAlert
                    ? <CheckCircleTwoTone twoToneColor="#52c41a" />
                    : <CloseCircleOutlined style={{ color: '#d9d9d9' }} />}
                </div>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#f0f5ff' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>当前库存</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#1677ff' }}>{currentRecord.currentStock}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#e6f7ff' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>安全库存</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#096dd9' }}>{currentRecord.safeStock}</div>
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small" style={{ textAlign: 'center', background: '#fff7e6' }}>
                  <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 4 }}>日均用量</div>
                  <div style={{ fontSize: 24, fontWeight: 600, color: '#d46b08' }}>{currentRecord.dailyUsage}</div>
                </Card>
              </Col>
            </Row>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{
              padding: 20,
              borderRadius: 8,
              textAlign: 'center',
              background: currentRecord.riskLevel === 'urgent' ? '#fff1f0'
                : currentRecord.riskLevel === 'high' ? '#fff7e6'
                : currentRecord.riskLevel === 'medium' ? '#fffbe6' : '#f6ffed'
            }}>
              <WarningOutlined
                style={{
                  fontSize: 36,
                  color: riskLevelMap[currentRecord.riskLevel].color,
                  marginBottom: 8
                }}
              />
              <div style={{
                fontSize: 14,
                color: '#8c8c8c',
                marginBottom: 4
              }}>
                按当前日均用量预计缺货时间
              </div>
              <div style={{
                fontSize: 36,
                fontWeight: 700,
                color: riskLevelMap[currentRecord.riskLevel].color
              }}>
                {currentRecord.stockoutDays} <span style={{ fontSize: 16, fontWeight: 400 }}>天</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
                即约 {dayjs().add(currentRecord.stockoutDays, 'day').format('YYYY年MM月DD日')} 左右
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        title="生成补货单"
        open={replenishModalOpen}
        onOk={handleReplenishSubmit}
        onCancel={() => setReplenishModalOpen(false)}
        width={640}
        destroyOnClose
        okText="确认生成"
      >
        {currentRecord && (
          <div>
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={`${currentRecord.medicineName} 在 ${currentRecord.warehouse} 当前库存 ${currentRecord.currentStock}，预计 ${currentRecord.stockoutDays} 天后缺货`}
            />
            <Form form={replenishForm} layout="vertical">
              <Row gutter={16}>
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
                <Col span={12}>
                  <Form.Item name="warehouse" label="补货仓库">
                    <Input disabled />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="当前/安全库存">
                    <Space size={8}>
                      <span style={{ color: '#ff4d4f', fontWeight: 500 }}>
                        {currentRecord.currentStock}
                      </span>
                      <span style={{ color: '#8c8c8c' }}>/</span>
                      <span>{currentRecord.safeStock}</span>
                    </Space>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="suggestQty" label="建议补货量">
                    <InputNumber disabled style={{ width: '100%' }} addonAfter="件" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="actualQty"
                    label="实际补货量"
                    rules={[{ required: true, message: '请输入实际补货量' }, { min: 1, message: '至少1件' }]}
                  >
                    <InputNumber min={1} style={{ width: '100%' }} addonAfter="件" />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="remark" label="备注">
                <Input.TextArea rows={3} placeholder="请输入备注信息（可选）" showCount maxLength={300} />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      <Modal
        title="提醒规则配置"
        open={ruleModalOpen}
        onCancel={() => setRuleModalOpen(false)}
        width={760}
        destroyOnClose
        footer={[
          <Button key="close" onClick={() => setRuleModalOpen(false)}>完成</Button>
        ]}
      >
        <div style={{ marginBottom: 20 }}>
          <Divider orientation="left" plain style={{ marginTop: 0 }}>现有规则</Divider>
          {ruleList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: '#bfbfbf' }}>暂无规则，请添加</div>
          ) : (
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              {ruleList.map(rule => (
                <Card
                  key={rule.id}
                  size="small"
                  style={{ opacity: rule.enabled ? 1 : 0.5 }}
                  extra={
                    <Space>
                      <Switch
                        size="small"
                        checked={rule.enabled}
                        onChange={(v) => handleToggleRule(rule.id, v)}
                      />
                      <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        删除
                      </Button>
                    </Space>
                  }
                >
                  <Space wrap size="large">
                    <Space>
                      <span style={{ color: '#8c8c8c' }}>风险等级：</span>
                      <Tag color={riskLevelMap[rule.riskLevel].color}>
                        {riskLevelMap[rule.riskLevel].text}
                      </Tag>
                    </Space>
                    <Space>
                      <span style={{ color: '#8c8c8c' }}>天数阈值：</span>
                      <span style={{ fontWeight: 500 }}>≥ {rule.dayThreshold} 天</span>
                    </Space>
                    <Space>
                      <span style={{ color: '#8c8c8c' }}>通知方式：</span>
                      <Space wrap size={4}>
                        {rule.notifyTypes.map(t => (
                          <Tag key={t} color="blue">
                            {notifyTypeOptions.find(o => o.value === t)?.label}
                          </Tag>
                        ))}
                      </Space>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          )}
        </div>

        <Divider orientation="left" plain>添加新规则</Divider>
        <Form form={ruleForm} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="riskLevel"
                label="风险等级"
                rules={[{ required: true, message: '请选择' }]}
              >
                <Select
                  placeholder="请选择"
                  options={Object.entries(riskLevelMap).map(([k, v]) => ({
                    value: k,
                    label: (
                      <Tag color={v.color}>{v.text}风险</Tag>
                    )
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="dayThreshold"
                label="天数阈值(≥)"
                rules={[{ required: true, message: '请输入' }]}
              >
                <InputNumber min={0} max={60} style={{ width: '100%' }} addonAfter="天" placeholder="如3" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item
                name="notifyTypes"
                label="通知方式"
                rules={[{ required: true, message: '请至少选一种' }]}
              >
                <Checkbox.Group options={notifyTypeOptions} />
              </Form.Item>
            </Col>
          </Row>
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={handleRuleSubmit}>添加规则</Button>
          </div>
        </Form>
      </Modal>
    </div>
  )
}

export default StockoutTrend
