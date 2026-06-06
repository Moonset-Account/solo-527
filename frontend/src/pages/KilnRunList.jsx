import React, { useState, useEffect } from 'react'
import { 
  Table, Button, Modal, Form, Select, DatePicker, 
  InputNumber, Tag, Space, message, Popconfirm, Dropdown, Menu
} from 'antd'
import { 
  PlusOutlined, 
  FilterOutlined, 
  CheckOutlined, 
  UndoOutlined,
  ExportOutlined,
  PlayCircleOutlined,
  StopOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { kilnRunApi, masterDataApi, savedFilterApi } from '../api'
import dayjs from 'dayjs'

const statusMap = {
  DRAFT: { text: '草稿', color: 'default' },
  APPROVED: { text: '已审批', color: 'blue' },
  FIRING: { text: '烧制中', color: 'orange' },
  COMPLETED: { text: '已完成', color: 'green' }
}

const temperatureZoneMap = {
  LOW: '低温',
  MIDDLE: '中温',
  HIGH: '高温'
}

export default function KilnRunList() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [savedFilters, setSavedFilters] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [kilns, setKilns] = useState([])
  const [firingCurves, setFiringCurves] = useState([])
  const [form] = Form.useForm()

  useEffect(() => {
    loadData()
    loadMasterData()
    loadSavedFilters()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: page - 1, size: pageSize }
      const result = await kilnRunApi.list(params)
      setData(result.content)
      setTotal(result.totalElements)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const loadMasterData = async () => {
    try {
      const [kilnData, curveData] = await Promise.all([
        masterDataApi.getKilns(),
        masterDataApi.getFiringCurves()
      ])
      setKilns(kilnData)
      setFiringCurves(curveData)
    } catch (e) {
      console.error(e)
    }
  }

  const loadSavedFilters = async () => {
    try {
      const data = await savedFilterApi.list('kiln-runs')
      setSavedFilters(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async (values) => {
    try {
      const submitData = {
        ...values,
        scheduledStartTime: values.scheduledStartTime?.toISOString()
      }
      await kilnRunApi.create(submitData)
      message.success('创建成功')
      setCreateModal(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleApprove = async (id) => {
    try {
      await kilnRunApi.approve(id)
      message.success('审批通过')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleWithdraw = async (id) => {
    try {
      await kilnRunApi.withdraw(id)
      message.success('已撤回')
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleStart = async (id) => {
    try {
      await kilnRunApi.start(id)
      message.success('已开始烧制')
      loadData()
    } catch (e) {
      console.error(e)
      message.error(e.response?.data?.message || '操作失败')
    }
  }

  const handleComplete = async (id) => {
    try {
      await kilnRunApi.complete(id)
      message.success('烧制完成')
      loadData()
    } catch (e) {
      console.error(e)
      message.error(e.response?.data?.message || '操作失败')
    }
  }

  const columns = [
    { title: '窑次编号', dataIndex: 'runCode', width: 180 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: status => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    },
    { 
      title: '温区', 
      dataIndex: 'temperatureZone', 
      width: 80,
      render: zone => temperatureZoneMap[zone] || zone
    },
    { title: '容量', width: 100, render: (_, r) => `${r.usedCapacity}/${r.maxCapacity}` },
    { 
      title: '计划时间', 
      dataIndex: 'scheduledStartTime', 
      width: 160,
      render: date => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      width: 160,
      render: date => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => navigate(`/kiln-runs/${record.id}`)}>
            详情
          </Button>
          {record.status === 'DRAFT' && (
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>
              审批
            </Button>
          )}
          {record.status === 'APPROVED' && (
            <>
              <Popconfirm title="确定撤回该窑次？" onConfirm={() => handleWithdraw(record.id)}>
                <Button type="link" size="small" icon={<UndoOutlined />}>撤回</Button>
              </Popconfirm>
              <Popconfirm title="确定开始烧制？" onConfirm={() => handleStart(record.id)}>
                <Button type="link" size="small" icon={<PlayCircleOutlined />}>
                  开始烧制
                </Button>
              </Popconfirm>
            </>
          )}
          {record.status === 'FIRING' && (
            <Popconfirm title="确定完成烧制？" onConfirm={() => handleComplete(record.id)}>
              <Button type="link" size="small" icon={<StopOutlined />}>完成烧制</Button>
            </Popconfirm>
          )}
          {record.status === 'COMPLETED' && (
            <Button type="link" size="small" icon={<ExportOutlined />} onClick={() => kilnRunApi.export(record.id)}>
              导出
            </Button>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>窑次编排</h2>
        <Space>
          <Dropdown menu={{
            items: savedFilters.map(f => ({ key: f.id, label: f.filterName })),
            onClick: ({ key }) => {
              const filter = savedFilters.find(f => f.id === key)
              if (filter) {
                setFilters(filter.filterCriteria)
                setPage(1)
                setTimeout(loadData, 0)
              }
            }
          }}>
            <Button icon={<FilterOutlined />}>我的筛选</Button>
          </Dropdown>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            创建窑次
          </Button>
        </Space>
      </div>

      <div className="filter-bar">
        <Space wrap>
          <Select 
            placeholder="状态" 
            style={{ width: 140 }} 
            allowClear
            value={filters.status}
            onChange={val => setFilters({ ...filters, status: val })}
          >
            {Object.entries(statusMap).map(([key, val]) => (
              <Select.Option key={key} value={key}>{val.text}</Select.Option>
            ))}
          </Select>
          <Select 
            placeholder="温区" 
            style={{ width: 120 }} 
            allowClear
            value={filters.temperatureZone}
            onChange={val => setFilters({ ...filters, temperatureZone: val })}
          >
            <Select.Option value="LOW">低温</Select.Option>
            <Select.Option value="MIDDLE">中温</Select.Option>
            <Select.Option value="HIGH">高温</Select.Option>
          </Select>
          <Button type="primary" onClick={() => { setPage(1); loadData() }}>查询</Button>
          <Button onClick={() => { setFilters({}); setPage(1); loadData() }}>重置</Button>
        </Space>
      </div>

      <div className="table-container">
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => { setPage(p); setPageSize(ps) }
          }}
        />
      </div>

      <Modal
        title="创建窑次"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="kilnId" label="窑炉" rules={[{ required: true }]}>
            <Select placeholder="请选择窑炉">
              {kilns.map(k => (
                <Select.Option key={k.id} value={k.id}>{k.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="temperatureZone" label="温区" rules={[{ required: true }]}>
            <Select placeholder="请选择温区">
              <Select.Option value="LOW">低温</Select.Option>
              <Select.Option value="MIDDLE">中温</Select.Option>
              <Select.Option value="HIGH">高温</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="firingCurveId" label="烧成曲线" rules={[{ required: true }]}>
            <Select placeholder="请选择烧成曲线">
              {firingCurves.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="maxCapacity" label="最大容量" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="scheduledStartTime" label="计划开始时间">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
