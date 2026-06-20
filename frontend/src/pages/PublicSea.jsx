import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  message,
  Drawer,
  Descriptions,
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  ShopOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getLeadList, claimLead } from '../api/lead'
import dayjs from 'dayjs'

const { Option } = Select

const statusMap = {
  NEW: { text: '新线索', color: 'blue' },
  CONTACTED: { text: '已接触', color: 'cyan' },
  MEASURED: { text: '已量房', color: 'green' },
  QUOTED: { text: '已报价', color: 'gold' },
  NEGOTIATING: { text: '谈判中', color: 'purple' },
  DEAL: { text: '已成交', color: 'success' },
  LOST: { text: '已流失', color: 'red' },
}

const levelMap = {
  S: { text: 'S级', color: 'red' },
  A: { text: 'A级', color: 'orange' },
  B: { text: 'B级', color: 'gold' },
  C: { text: 'C级', color: 'blue' },
  D: { text: 'D级', color: 'default' },
}

const PublicSea = () => {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [levelFilter, setLevelFilter] = useState('')
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentLead, setCurrentLead] = useState(null)

  useEffect(() => {
    loadLeads()
  }, [])

  const loadLeads = async (page = 1, pageSize = 10) => {
    setLoading(true)
    try {
      const params = {
        pageNum: page,
        pageSize,
        keyword: keyword || undefined,
        status: statusFilter || undefined,
        level: levelFilter || undefined,
        publicSeaStatus: 'IN_SEA',
      }
      const res = await getLeadList(params)
      setData(res.records || [])
      setPagination({
        current: res.current,
        pageSize: res.size,
        total: res.total,
      })
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    loadLeads(1, pagination.pageSize)
  }

  const handleClaim = async (record) => {
    try {
      await claimLead(record.id)
      message.success('领取成功')
      loadLeads(pagination.current, pagination.pageSize)
    } catch (e) {}
  }

  const openDetailDrawer = (record) => {
    setCurrentLead(record)
    setDetailVisible(true)
  }

  const columns = [
    {
      title: '客户姓名',
      dataIndex: 'customerName',
      width: 120,
      render: (text, record) => (
        <a onClick={() => navigate(`/leads/${record.id}`)}>{text}</a>
      ),
    },
    {
      title: '电话',
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: '小区',
      dataIndex: 'community',
      width: 120,
    },
    {
      title: '房屋面积',
      dataIndex: 'houseArea',
      width: 100,
      render: (val) => val ? `${val}㎡` : '-',
    },
    {
      title: '预算',
      dataIndex: 'budgetMin',
      width: 140,
      render: (val, record) => {
        if (record.budgetMin && record.budgetMax) {
          return `¥${record.budgetMin} - ¥${record.budgetMax}`
        }
        return val ? `¥${val}` : '-'
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      },
    },
    {
      title: '等级',
      dataIndex: 'level',
      width: 80,
    },
    {
      title: '来源',
      dataIndex: 'source',
      width: 100,
    },
    {
      title: '入池时间',
      dataIndex: 'publicSeaInTime',
      width: 160,
      render: (val) => val ? dayjs(val).format('YYYY-MM-DD HH:mm') : '-',
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => openDetailDrawer(record)}>
            查看
          </Button>
          <Button type="link" size="small" onClick={() => handleClaim(record)}>
            领取
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>公海池 <Tag icon={<ShopOutlined />}>IN_SEA</Tag></h2>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Input
            placeholder="搜索客户姓名/电话"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            onPressEnter={handleSearch}
          />
          <Select
            placeholder="状态"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 120 }}
            allowClear
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Select
            placeholder="等级"
            value={levelFilter || undefined}
            onChange={setLevelFilter}
            style={{ width: 100 }}
            allowClear
          >
            {Object.entries(levelMap).map(([key, val]) => (
              <Option key={key} value={key}>{val.text}</Option>
            ))}
          </Select>
          <Button type="primary" onClick={handleSearch}>搜索</Button>
          <Button onClick={() => { setKeyword(''); setStatusFilter(''); setLevelFilter(''); loadLeads(1, pagination.pageSize) }}>
            重置
          </Button>
        </Space>
      </div>

      <div className="table-card">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => loadLeads(page, pageSize),
          }}
          scroll={{ x: 1200 }}
        />
      </div>

      <Drawer
        title="线索详情"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        {currentLead && (
          <div>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="客户姓名">{currentLead.customerName}</Descriptions.Item>
              <Descriptions.Item label="电话">{currentLead.phone}</Descriptions.Item>
              <Descriptions.Item label="小区">{currentLead.community || '-'}</Descriptions.Item>
              <Descriptions.Item label="地址">{currentLead.address || '-'}</Descriptions.Item>
              <Descriptions.Item label="房屋面积">{currentLead.houseArea ? `${currentLead.houseArea}㎡` : '-'}</Descriptions.Item>
              <Descriptions.Item label="预算范围">
                {currentLead.budgetMin && currentLead.budgetMax
                  ? `¥${currentLead.budgetMin} - ¥${currentLead.budgetMax}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="装修风格">{currentLead.decorationStyle || '-'}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {statusMap[currentLead.status]?.text || currentLead.status}
              </Descriptions.Item>
              <Descriptions.Item label="等级">
                {levelMap[currentLead.level]?.text || currentLead.level}
              </Descriptions.Item>
              <Descriptions.Item label="来源">{currentLead.source || '-'}</Descriptions.Item>
              <Descriptions.Item label="入池时间">
                {currentLead.publicSeaInTime ? dayjs(currentLead.publicSeaInTime).format('YYYY-MM-DD HH:mm') : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button type="primary" size="large" onClick={() => handleClaim(currentLead)}>
                立即领取
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

export default PublicSea
