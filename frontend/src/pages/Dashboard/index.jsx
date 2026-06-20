import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Progress, Tag, Button, Space, Badge, Tooltip, message } from 'antd'
import {
  MedicineBoxOutlined,
  WarningOutlined,
  FireOutlined,
  AuditOutlined,
  MessageOutlined,
  AlertOutlined,
  SwapOutlined,
  EyeOutlined
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import StatCard from '@/components/StatCard'
import PageHeader from '@/components/PageHeader'
import CommonTable from '@/components/CommonTable'
import {
  getDashboardStats,
  getSafetyStock,
  getHighRiskMedicines,
  getCategoryStock
} from '@/api/dashboard'

const mockStats = {
  totalMedicines: 1286,
  belowSafetyCount: 87,
  highRiskCount: 23,
  pendingAllocations: 34,
  pendingSupplierReplies: 15,
  openExceptions: 42
}

const warehouses = ['北京中心仓', '上海浦东仓', '广州白云仓', '深圳罗湖仓', '成都武侯仓', '武汉江汉仓', '杭州余杭仓', '南京鼓楼仓']

const categories = ['抗生素类', '心血管类', '消化系统类', '呼吸系统类', '神经系统类', '内分泌类', '抗肿瘤类', '维生素类', '中药饮片', '医疗器械']

const medicineNames = [
  '阿莫西林胶囊', '头孢克肟片', '阿奇霉素分散片', '左氧氟沙星片', '青霉素V钾片',
  '硝苯地平缓释片', '酒石酸美托洛尔片', '阿托伐他汀钙片', '瑞舒伐他汀钙片', '阿司匹林肠溶片',
  '奥美拉唑肠溶胶囊', '雷贝拉唑钠肠溶片', '多潘立酮片', '蒙脱石散', '双歧杆菌三联活菌胶囊',
  '布洛芬缓释胶囊', '对乙酰氨基酚片', '复方氨酚烷胺片', '盐酸氨溴索口服溶液', '孟鲁司特钠咀嚼片',
  '盐酸二甲双胍缓释片', '格列美脲片', '阿卡波糖片', '胰岛素注射液', '左甲状腺素钠片',
  '地西泮片', '盐酸舍曲林片', '草酸艾司西酞普兰片', '盐酸氟西汀胶囊', '卡马西平片',
  '注射用紫杉醇', '卡培他滨片', '吉非替尼片', '甲磺酸伊马替尼片', '盐酸厄洛替尼片',
  '维生素C片', '复合维生素B片', '维生素AD滴剂', '碳酸钙D3片', '叶酸片',
  '金银花颗粒', '板蓝根颗粒', '感冒灵颗粒', '藿香正气水', '云南白药胶囊',
  '一次性医用口罩', '一次性注射器', '医用纱布', '创可贴', '体温计'
]

const generateMedicineCode = (index) => {
  const prefix = ['MED', 'PHR', 'DRU', 'MED', 'PHR']
  return `${prefix[index % 5]}${String(10000 + index).padStart(6, '0')}`
}

const generateSafetyStockData = () => {
  const data = []
  for (let i = 0; i < 28; i++) {
    const safetyStock = Math.floor(Math.random() * 800) + 200
    const ratioVariants = [1.5, 1.2, 1.0, 0.95, 0.85, 0.75, 0.6, 0.45, 0.3, 0.15]
    const ratio = ratioVariants[i % ratioVariants.length] + (Math.random() - 0.5) * 0.1
    const currentStock = Math.floor(safetyStock * ratio)
    const stockRatio = currentStock / safetyStock
    let status, riskLevel, daysUntilStockout, statusText

    if (stockRatio >= 1.0) {
      status = 'normal'
      statusText = '正常'
      riskLevel = 'Low'
      daysUntilStockout = Math.floor(Math.random() * 60) + 30
    } else if (stockRatio >= 0.8) {
      status = 'warning'
      statusText = '预警'
      riskLevel = 'Medium'
      daysUntilStockout = Math.floor(Math.random() * 20) + 15
    } else if (stockRatio >= 0.5) {
      status = 'alert'
      statusText = '告警'
      riskLevel = 'High'
      daysUntilStockout = Math.floor(Math.random() * 12) + 5
    } else {
      status = 'danger'
      statusText = '危险'
      riskLevel = 'Critical'
      daysUntilStockout = Math.floor(Math.random() * 5) + 0
    }

    data.push({
      key: i + 1,
      medicineId: 1000 + i,
      medicineCode: generateMedicineCode(i),
      medicineName: medicineNames[i % medicineNames.length],
      warehouseId: (i % 8) + 1,
      warehouseName: warehouses[i % warehouses.length],
      currentStock,
      safetyStock,
      stockRatio: Number(stockRatio.toFixed(2)),
      status,
      statusText,
      riskLevel,
      daysUntilStockout,
      category: categories[i % categories.length]
    })
  }
  return data
}

const mockSafetyStockData = generateSafetyStockData()

const mockHighRiskData = mockSafetyStockData
  .filter(item => item.riskLevel === 'High' || item.riskLevel === 'Critical')
  .sort((a, b) => a.stockRatio - b.stockRatio)
  .slice(0, 10)
  .map((item, index) => ({ ...item, key: index + 1 }))

const mockCategoryData = [
  { category: '抗生素类', totalStock: 25680, belowSafetyCount: 18 },
  { category: '心血管类', totalStock: 18920, belowSafetyCount: 12 },
  { category: '消化系统类', totalStock: 14560, belowSafetyCount: 8 },
  { category: '呼吸系统类', totalStock: 12340, belowSafetyCount: 15 },
  { category: '神经系统类', totalStock: 8760, belowSafetyCount: 6 },
  { category: '内分泌类', totalStock: 9820, belowSafetyCount: 9 },
  { category: '抗肿瘤类', totalStock: 5640, belowSafetyCount: 7 },
  { category: '维生素类', totalStock: 21450, belowSafetyCount: 4 },
  { category: '中药饮片', totalStock: 16780, belowSafetyCount: 5 },
  { category: '医疗器械', totalStock: 31200, belowSafetyCount: 3 }
]

const getStockRatioColor = (ratio) => {
  if (ratio >= 1.0) return '#52c41a'
  if (ratio >= 0.8) return '#faad14'
  if (ratio >= 0.5) return '#fa8c16'
  return '#ff4d4f'
}

const getRiskLevelTag = (riskLevel) => {
  const map = {
    Low: { color: 'green', text: '低风险' },
    Medium: { color: 'blue', text: '中风险' },
    High: { color: 'orange', text: '高风险' },
    Critical: { color: 'red', text: '极高风险' }
  }
  const cfg = map[riskLevel] || map.Low
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}

const getStatusTag = (status) => {
  const map = {
    normal: { color: 'green', text: '正常' },
    warning: { color: 'gold', text: '预警' },
    alert: { color: 'orange', text: '告警' },
    danger: { color: 'red', text: '危险' }
  }
  const cfg = map[status] || map.normal
  return <Tag color={cfg.color}>{cfg.text}</Tag>
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(mockStats)
  const [safetyStockData, setSafetyStockData] = useState(mockSafetyStockData)
  const [highRiskData, setHighRiskData] = useState(mockHighRiskData)
  const [categoryData, setCategoryData] = useState(mockCategoryData)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, safetyRes, highRiskRes, categoryRes] = await Promise.all([
        getDashboardStats(),
        getSafetyStock(),
        getHighRiskMedicines({ take: 10 }),
        getCategoryStock()
      ])

      if (statsRes?.success && statsRes.data) {
        setStats(statsRes.data)
      }
      if (safetyRes?.success && safetyRes.data && safetyRes.data.length > 0) {
        const processed = safetyRes.data.map((item, idx) => ({
          ...item,
          key: idx + 1,
          statusText: item.status === 'normal' ? '正常' :
            item.status === 'warning' ? '预警' :
            item.status === 'alert' ? '告警' : '危险'
        }))
        setSafetyStockData(processed)
      }
      if (highRiskRes?.success && highRiskRes.data && highRiskRes.data.length > 0) {
        const processed = highRiskRes.data.map((item, idx) => ({
          ...item,
          key: idx + 1,
          statusText: item.status === 'normal' ? '正常' :
            item.status === 'warning' ? '预警' :
            item.status === 'alert' ? '告警' : '危险'
        }))
        setHighRiskData(processed)
      }
      if (categoryRes?.success && categoryRes.data && categoryRes.data.length > 0) {
        setCategoryData(categoryRes.data)
      }
    } catch (error) {
      console.warn('API调用失败，使用Mock数据:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAllocation = (record) => {
    message.info(`正在为 ${record.medicineName} 生成调拨建议...`)
  }

  const handleViewDetail = (record) => {
    message.info(`查看药品详情: ${record.medicineName}`)
  }

  const handleJumpReplenishment = () => {
    navigate('/replenishment')
  }

  const safetyStockColumns = [
    {
      title: '药品信息',
      dataIndex: 'medicineName',
      key: 'medicineInfo',
      width: 220,
      fixed: 'left',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500, color: '#262626' }}>{record.medicineName}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>{record.medicineCode}</div>
        </div>
      )
    },
    {
      title: '仓库',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 120
    },
    {
      title: '库存状况',
      key: 'stockStatus',
      width: 260,
      render: (_, record) => {
        const percent = Math.min(Math.round(record.stockRatio * 100), 100)
        const color = getStockRatioColor(record.stockRatio)
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 13 }}>
                <span style={{ color: color, fontWeight: 600 }}>{record.currentStock}</span>
                <span style={{ color: '#8c8c8c' }}> / {record.safetyStock}</span>
              </span>
              <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                比率 {(record.stockRatio * 100).toFixed(0)}%
              </span>
            </div>
            <Progress
              percent={percent}
              showInfo={false}
              strokeColor={color}
              size="small"
              trailColor="#f0f0f0"
            />
          </div>
        )
      }
    },
    {
      title: '预计缺货天数',
      dataIndex: 'daysUntilStockout',
      key: 'daysUntilStockout',
      width: 130,
      align: 'center',
      render: (days) => {
        let color = '#52c41a'
        let text = `${days} 天`
        if (days <= 3) { color = '#ff4d4f'; text = <Badge status="error" text={`${days} 天`} /> }
        else if (days <= 10) { color = '#fa8c16'; text = <Badge status="warning" text={`${days} 天`} /> }
        else if (days <= 20) { color = '#faad14'; text = `${days} 天` }
        return <span style={{ color, fontWeight: 500 }}>{text}</span>
      }
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      align: 'center',
      render: (level) => getRiskLevelTag(level)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      align: 'center',
      render: (status) => getStatusTag(status)
    },
    {
      title: '操作',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="生成调拨建议">
            <Button
              type="link"
              size="small"
              icon={<SwapOutlined />}
              onClick={() => handleAllocation(record)}
            >
              调拨
            </Button>
          </Tooltip>
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetail(record)}
            >
              详情
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ]

  const highRiskColumns = [
    {
      title: '排名',
      key: 'rank',
      width: 60,
      align: 'center',
      render: (_, __, index) => {
        const rank = index + 1
        let color = '#8c8c8c'
        if (rank <= 3) color = rank === 1 ? '#f5222d' : rank === 2 ? '#fa541c' : '#faad14'
        return <span style={{ color, fontWeight: 700, fontSize: 16 }}>#{rank}</span>
      }
    },
    {
      title: '药品名称',
      dataIndex: 'medicineName',
      key: 'medicineName',
      width: 160,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{text}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.medicineCode}</div>
        </div>
      )
    },
    {
      title: '当前库存',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 100,
      align: 'right',
      render: (val) => <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{val}</span>
    },
    {
      title: '安全库存',
      dataIndex: 'safetyStock',
      key: 'safetyStock',
      width: 100,
      align: 'right'
    },
    {
      title: '缺货天数',
      dataIndex: 'daysUntilStockout',
      key: 'daysUntilStockout',
      width: 100,
      align: 'center',
      render: (days) => (
        <Badge status={days <= 3 ? 'error' : 'warning'} text={<span style={{ color: days <= 3 ? '#ff4d4f' : '#fa8c16', fontWeight: 600 }}>{days} 天</span>} />
      )
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      align: 'center',
      render: (level) => getRiskLevelTag(level)
    }
  ]

  const categoryPieOption = {
    title: {
      text: '库存分类汇总',
      left: 'left',
      textStyle: { fontSize: 14, fontWeight: 500 }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const item = categoryData[params.dataIndex]
        return `${params.marker}${params.name}<br/>
          库存总量: <b>${params.value.toLocaleString()}</b> 件<br/>
          占比: <b>${params.percent}%</b><br/>
          低于安全库存: <b style="color:#ff4d4f">${item?.belowSafetyCount || 0} 种</b>`
      }
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center',
      textStyle: { fontSize: 12 }
    },
    color: ['#1677ff', '#52c41a', '#faad14', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16', '#2f54eb', '#a0d911', '#fa541c'],
    series: [
      {
        name: '库存分类',
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '55%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}\n{d}%',
          fontSize: 11,
          lineHeight: 16
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 15
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        },
        data: categoryData.map(item => ({
          value: item.totalStock,
          name: item.category
        }))
      }
    ]
  }

  return (
    <div>
      <PageHeader title="安全库存看板" subTitle="实时监控药品库存安全状况，智能预警缺货风险" />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="药品总数"
            value={stats.totalMedicines?.toLocaleString() || '0'}
            suffix="种"
            extra={<MedicineBoxOutlined style={{ fontSize: 32, color: '#1677ff', opacity: 0.5 }} />}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <div
            onClick={handleJumpReplenishment}
            style={{ cursor: 'pointer' }}
          >
            <StatCard
              title="低于安全库存"
              value={stats.belowSafetyCount?.toLocaleString() || '0'}
              suffix="种"
              extra={
                <Badge count={stats.belowSafetyCount || 0} size="small" offset={[0, 0]}>
                  <WarningOutlined style={{ fontSize: 32, color: '#ff4d4f', opacity: 0.5 }} />
                </Badge>
              }
              style={{
                border: '1.5px solid #ff4d4f',
                background: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)'
              }}
            />
          </div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="高风险药品"
            value={stats.highRiskCount?.toLocaleString() || '0'}
            suffix="种"
            extra={<FireOutlined style={{ fontSize: 32, color: '#cf1322', opacity: 0.5 }} />}
            style={{
              border: '1.5px solid #cf1322',
              background: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 100%)'
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="待审批调拨"
            value={stats.pendingAllocations?.toLocaleString() || '0'}
            suffix="单"
            extra={<AuditOutlined style={{ fontSize: 32, color: '#fa8c16', opacity: 0.5 }} />}
            style={{
              background: 'linear-gradient(135deg, #fff7e6 0%, #ffffff 100%)'
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="待供应商回复"
            value={stats.pendingSupplierReplies?.toLocaleString() || '0'}
            suffix="单"
            extra={<MessageOutlined style={{ fontSize: 32, color: '#722ed1', opacity: 0.5 }} />}
            style={{
              background: 'linear-gradient(135deg, #f9f0ff 0%, #ffffff 100%)'
            }}
          />
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <StatCard
            title="未关闭异常"
            value={stats.openExceptions?.toLocaleString() || '0'}
            suffix="条"
            extra={<AlertOutlined style={{ fontSize: 32, color: '#fa541c', opacity: 0.5 }} />}
            style={{
              background: 'linear-gradient(135deg, #fff2e8 0%, #ffffff 100%)'
            }}
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <span>安全库存看板</span>
                <Tag color="blue">共 {safetyStockData.length} 条</Tag>
              </Space>
            }
            extra={
              <Button size="small" onClick={fetchDashboardData}>
                刷新数据
              </Button>
            }
          >
            <CommonTable
              loading={loading}
              columns={safetyStockColumns}
              dataSource={safetyStockData}
              pagination={{
                pageSize: 8,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`,
                pageSizeOptions: ['8', '15', '20', '50']
              }}
              scroll={{ x: 1100 }}
              rowClassName={(record) => {
                if (record.riskLevel === 'Critical') return 'row-danger'
                if (record.riskLevel === 'High') return 'row-warning'
                return ''
              }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <FireOutlined style={{ color: '#cf1322' }} />
                <span>高风险药品 TOP10</span>
              </Space>
            }
            style={{ height: '100%' }}
          >
            <CommonTable
              loading={loading}
              columns={highRiskColumns}
              dataSource={highRiskData}
              pagination={false}
              scroll={{ x: 620 }}
              size="middle"
              rowClassName={(record, index) => {
                if (index < 3) return 'row-highlight'
                return ''
              }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card>
            <ReactECharts option={categoryPieOption} style={{ height: 400 }} />
          </Card>
        </Col>
      </Row>

      <style>{`
        .row-danger {
          background-color: #fff1f0 !important;
        }
        .row-danger:hover > td {
          background-color: #ffccc7 !important;
        }
        .row-warning {
          background-color: #fff7e6 !important;
        }
        .row-warning:hover > td {
          background-color: #ffe7ba !important;
        }
        .row-highlight {
          background-color: #fffbe6 !important;
        }
      `}</style>
    </div>
  )
}

export default Dashboard
