import { useState, useEffect } from 'react'
import { Card, Table, Button, Space, Select, DatePicker, Modal, Descriptions } from 'antd'
import { SearchOutlined, EyeOutlined } from '@ant-design/icons'
import { getOperationLogs } from '../../api/operationLogs'
import dayjs from 'dayjs'

const { Option } = Select
const { RangePicker } = DatePicker

const OperationLogList = () => {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [moduleFilter, setModuleFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [currentItem, setCurrentItem] = useState(null)

  const modules = ['product', 'member', 'appointment', 'stock_adjust', 'damageReport', 'consultant', 'commission', 'portfolio', 'batchImport', 'memberTreatment', 'auth']
  const moduleLabels = {
    product: '产品管理',
    member: '会员管理',
    appointment: '预约管理',
    stock_adjust: '库存管理',
    damageReport: '报损管理',
    consultant: '顾问管理',
    commission: '提成管理',
    portfolio: '作品管理',
    batchImport: '批量导入',
    memberTreatment: '会员疗程',
    auth: '系统设置',
  }

  const loadData = async () => {
    const params = { page, pageSize: 10 }
    if (moduleFilter) params.module = moduleFilter
    if (dateRange && dateRange[0]) {
      params.startTime = dateRange[0].startOf('day').toISOString()
    }
    if (dateRange && dateRange[1]) {
      params.endTime = dateRange[1].endOf('day').toISOString()
    }
    try {
      const res = await getOperationLogs(params)
      if (res.success) {
        setData(res.data.list || [])
        setTotal(res.data.total || 0)
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadData()
  }, [page, moduleFilter, dateRange])

  const handleSearch = () => {
    setPage(1)
    loadData()
  }

  const handleDetail = (record) => {
    setCurrentItem(record)
    setDetailVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '模块',
      dataIndex: 'module',
      key: 'module',
      width: 120,
      render: (t) => moduleLabels[t] || t,
    },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100 },
    {
      title: '操作人',
      dataIndex: 'user',
      key: 'user',
      width: 100,
      render: (user) => user?.name || '-',
    },
    {
      title: '操作对象',
      key: 'target',
      render: (_, record) => record.detail ? (typeof record.detail === 'string' ? record.detail.substring(0, 50) : '') : '-',
    },
    {
      title: 'IP地址',
      dataIndex: 'ip',
      key: 'ip',
      width: 130,
      render: (ip) => ip || '-',
    },
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (t) => t ? new Date(t).toLocaleString() : '-',
    },
    {
      title: '操作',
      key: 'action_col',
      width: 100,
      render: (_, record) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(record)}>
          详情
        </Button>
      ),
    },
  ]

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 20 }}>操作日志</h2>

      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Select
              placeholder="模块筛选"
              value={moduleFilter || undefined}
              onChange={(val) => { setModuleFilter(val); setPage(1) }}
              allowClear
              style={{ width: 150 }}
            >
              {modules.map(m => <Option key={m} value={m}>{moduleLabels[m] || m}</Option>)}
            </Select>
            <RangePicker
              placeholder={['开始时间', '结束时间']}
              value={dateRange}
              onChange={setDateRange}
            />
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>查询</Button>
          </Space>
        </div>

        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          pagination={{
            current: page,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            total,
            onChange: setPage,
          }}
        />
      </Card>

      <Modal
        title="日志详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={null}
        width={600}
      >
        {currentItem && (
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="日志ID">{currentItem.id}</Descriptions.Item>
            <Descriptions.Item label="模块">{moduleLabels[currentItem.module] || currentItem.module}</Descriptions.Item>
            <Descriptions.Item label="操作类型">{currentItem.action}</Descriptions.Item>
            <Descriptions.Item label="操作人">{currentItem.user?.name || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作详情">{currentItem.detail}</Descriptions.Item>
            <Descriptions.Item label="IP地址">{currentItem.ip || '-'}</Descriptions.Item>
            <Descriptions.Item label="操作时间">{currentItem.createdAt ? new Date(currentItem.createdAt).toLocaleString() : '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  )
}

export default OperationLogList
