import React, { useState, useEffect } from 'react'
import { 
  Table, Button, Modal, Form, Input, Select, InputNumber, 
  Tag, Space, message, Popconfirm, Drawer, Radio, Dropdown, Menu
} from 'antd'
import { 
  PlusOutlined, 
  FilterOutlined, 
  SaveOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons'
import { artworkApi, masterDataApi, savedFilterApi } from '../api'
import dayjs from 'dayjs'

const { TextArea } = Input

const statusMap = {
  SUBMITTED: { text: '待审核', color: 'orange' },
  REVIEWED: { text: '已审核', color: 'blue' },
  REJECTED: { text: '已拒绝', color: 'red' },
  SCHEDULED: { text: '已排窑', color: 'purple' },
  OUT_KILN: { text: '已出窑', color: 'green' }
}

export default function ArtworkList() {
  const [data, setData] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [filters, setFilters] = useState({})
  const [savedFilters, setSavedFilters] = useState([])
  const [createModal, setCreateModal] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [students, setStudents] = useState([])
  const [clays, setClays] = useState([])
  const [glazes, setGlazes] = useState([])
  const [form] = Form.useForm()
  const [reviewForm] = Form.useForm()

  useEffect(() => {
    loadData()
    loadMasterData()
    loadSavedFilters()
  }, [page, pageSize])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = { ...filters, page: page - 1, size: pageSize }
      const result = await artworkApi.list(params)
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
      const [studentData, clayData, glazeData] = await Promise.all([
        masterDataApi.getStudents(),
        masterDataApi.getClays(),
        masterDataApi.getGlazes()
      ])
      setStudents(studentData)
      setClays(clayData)
      setGlazes(glazeData)
    } catch (e) {
      console.error(e)
    }
  }

  const loadSavedFilters = async () => {
    try {
      const data = await savedFilterApi.list('artworks')
      setSavedFilters(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleCreate = async (values) => {
    try {
      await artworkApi.create(values)
      message.success('创建成功')
      setCreateModal(false)
      form.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleReview = async (values) => {
    try {
      await artworkApi.review(currentRecord.id, values)
      message.success('审核完成')
      setReviewModal(false)
      reviewForm.resetFields()
      loadData()
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveFilter = () => {
    Modal.confirm({
      title: '保存筛选条件',
      content: (
        <Form layout="vertical">
          <Form.Item label="筛选名称" name="filterName" rules={[{ required: true }]}>
            <Input placeholder="请输入筛选名称" />
          </Form.Item>
        </Form>
      ),
      onOk: async () => {
        try {
          await savedFilterApi.save('artworks', '自定义筛选', filters, false)
          message.success('筛选条件已保存')
          loadSavedFilters()
        } catch (e) {
          console.error(e)
        }
      }
    })
  }

  const columns = [
    { title: '作品编号', dataIndex: 'artworkCode', width: 180 },
    { title: '作品名称', dataIndex: 'name', width: 150 },
    { 
      title: '状态', 
      dataIndex: 'status', 
      width: 100,
      render: status => <Tag color={statusMap[status]?.color}>{statusMap[status]?.text}</Tag>
    },
    { 
      title: '提交来源', 
      dataIndex: 'submissionSource', 
      width: 100,
      render: source => source === 'EXTERNAL' ? '外部提交' : '内部录入'
    },
    { title: '重量(kg)', dataIndex: 'weight', width: 100 },
    { 
      title: '创建时间', 
      dataIndex: 'createdAt', 
      width: 180,
      render: date => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.status === 'SUBMITTED' && (
            <>
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => {
                setCurrentRecord(record)
                reviewForm.setFieldsValue({ pass: true })
                setReviewModal(true)
              }}>
                审核
              </Button>
            </>
          )}
          {record.status === 'REVIEWED' && !record.kilnRunId && (
            <Button type="link" size="small">安排入窑</Button>
          )}
          {record.status === 'SCHEDULED' && (
            <Popconfirm title="确定撤回该作品？" onConfirm={async () => {
              await artworkApi.withdraw(record.id)
              message.success('撤回成功')
              loadData()
            }}>
              <Button type="link" size="small" danger>撤回</Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ]

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>作品登记</h2>
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
          <Button icon={<SaveOutlined />} onClick={handleSaveFilter}>保存筛选</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            登记作品
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
            placeholder="提交来源" 
            style={{ width: 140 }} 
            allowClear
            value={filters.submissionSource}
            onChange={val => setFilters({ ...filters, submissionSource: val })}
          >
            <Select.Option value="EXTERNAL">外部提交</Select.Option>
            <Select.Option value="INTERNAL">内部录入</Select.Option>
          </Select>
          <Input 
            placeholder="搜索关键词" 
            style={{ width: 200 }}
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => { setPage(1); loadData() }}
          />
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
        title="登记作品"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="studentId" label="学员" rules={[{ required: true }]}>
            <Select placeholder="请选择学员">
              {students.map(s => (
                <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="clayId" label="泥料" rules={[{ required: true }]}>
            <Select placeholder="请选择泥料">
              {clays.map(c => (
                <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="glazeId" label="釉料">
            <Select placeholder="请选择釉料" allowClear>
              {glazes.map(g => (
                <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="name" label="作品名称">
            <Input placeholder="请输入作品名称" />
          </Form.Item>
          <Form.Item name="weight" label="重量(kg)">
            <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>创建</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="审核作品"
        open={reviewModal}
        onCancel={() => setReviewModal(false)}
        footer={null}
      >
        <Form form={reviewForm} layout="vertical" onFinish={handleReview}>
          <Form.Item name="pass" label="审核结果" rules={[{ required: true }]}>
            <Radio.Group>
              <Radio value={true}>通过</Radio>
              <Radio value={false}>拒绝</Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="notes" label="审核备注">
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>提交</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
