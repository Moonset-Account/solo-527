import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Statistic,
  Drawer,
  Descriptions,
  Upload,
  Spin
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UploadOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import { getUser } from '@/utils/auth'
import dayjs from 'dayjs'

const { Option } = Select
const { TextArea } = Input

const facilityStatusMap = {
  NORMAL: { text: '正常', color: 'green' },
  DAMAGED: { text: '损坏', color: 'red' },
  MAINTENANCE: { text: '维护中', color: 'orange' }
}

const facilityTypeColors = {
  '健身器材': 'blue',
  '照明设施': 'gold',
  '休闲设施': 'cyan',
  '游乐设施': 'magenta',
  '消防设施': 'red',
  '其他': 'default'
}

const Facilities = () => {
  const user = getUser()
  const isAdmin = user?.role === 'ADMIN'

  const [facilities, setFacilities] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ keyword: '', type: '', status: '', gridId: '' })
  const [grids, setGrids] = useState([])
  const [statistics, setStatistics] = useState({})

  const [modalVisible, setModalVisible] = useState(false)
  const [editingFacility, setEditingFacility] = useState(null)
  const [form] = Form.useForm()
  const [submitLoading, setSubmitLoading] = useState(false)

  const [detailVisible, setDetailVisible] = useState(false)
  const [currentFacility, setCurrentFacility] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [searchForm] = Form.useForm()

  useEffect(() => {
    fetchGrids()
    fetchStatistics()
    fetchFacilities()
  }, [pagination.current, pagination.pageSize])

  const fetchGrids = async () => {
    try {
      const res = await request.get('/grids/all')
      setGrids(res.data)
    } catch (error) {
      console.error('获取网格列表失败:', error)
    }
  }

  const fetchStatistics = async () => {
    try {
      const res = await request.get('/facilities/statistics')
      setStatistics(res.data)
    } catch (error) {
      console.error('获取设施统计失败:', error)
    }
  }

  const fetchFacilities = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.gridId && { gridId: filters.gridId })
      }
      const res = await request.get('/facilities', { params })
      setFacilities(res.data.list)
      setPagination((prev) => ({ ...prev, total: res.data.total }))
    } catch (error) {
      console.error('获取设施列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    setFilters(values)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchFacilities(), 0)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({ keyword: '', type: '', status: '', gridId: '' })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchFacilities(), 0)
  }

  const handleAdd = () => {
    setEditingFacility(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingFacility(record)
    form.setFieldsValue({
      ...record,
      gridId: record.gridId
    })
    setModalVisible(true)
  }

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除设施「${record.name}」吗？`,
      onOk: async () => {
        try {
          await request.delete(`/facilities/${record.id}`)
          message.success('删除成功')
          fetchFacilities()
          fetchStatistics()
        } catch (error) {
          console.error('删除失败:', error)
        }
      }
    })
  }

  const handleViewDetail = async (record) => {
    setDetailLoading(true)
    try {
      const res = await request.get(`/facilities/${record.id}`)
      setCurrentFacility(res.data)
      setDetailVisible(true)
    } catch (error) {
      console.error('获取设施详情失败:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setSubmitLoading(true)

      const submitData = {
        ...values,
        gridId: parseInt(values.gridId)
      }

      if (editingFacility) {
        await request.put(`/facilities/${editingFacility.id}`, submitData)
        message.success('更新成功')
      } else {
        await request.post('/facilities', submitData)
        message.success('创建成功')
      }

      setModalVisible(false)
      form.resetFields()
      fetchFacilities()
      fetchStatistics()
    } catch (error) {
      console.error('提交失败:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const columns = [
    {
      title: '设施编码',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: '设施名称',
      dataIndex: 'name',
      key: 'name',
      width: 150
    },
    {
      title: '设施类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag color={facilityTypeColors[type] || 'default'}>{type}</Tag>
      )
    },
    {
      title: '位置',
      dataIndex: 'location',
      key: 'location'
    },
    {
      title: '所属网格',
      dataIndex: ['grid', 'name'],
      key: 'grid',
      width: 100
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const info = facilityStatusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: isAdmin ? 180 : 80,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          {isAdmin && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
                删除
              </Button>
            </>
          )}
        </Space>
      )
    }
  ]

  const statCards = [
    {
      title: '设施总数',
      value: statistics.total || 0,
      prefix: <ToolOutlined />,
      suffix: '个',
      color: '#1890ff'
    },
    {
      title: '正常运行',
      value: statistics.normal || 0,
      prefix: <CheckCircleOutlined />,
      suffix: '个',
      color: '#52c41a'
    },
    {
      title: '损坏',
      value: statistics.damaged || 0,
      prefix: <ExclamationCircleOutlined />,
      suffix: '个',
      color: '#cf1322'
    },
    {
      title: '维护中',
      value: statistics.maintenance || 0,
      prefix: <ToolOutlined />,
      suffix: '个',
      color: '#fa8c16'
    }
  ]

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>{isAdmin ? '设施管理' : '设施列表'}</h2>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {statCards.map((card, index) => (
          <Col span={6} key={index}>
            <Card>
              <Statistic
                title={card.title}
                value={card.value}
                valueStyle={{ color: card.color }}
                prefix={card.prefix}
                suffix={card.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Card title="筛选条件" style={{ marginBottom: 16 }}>
        <Form form={searchForm} layout="inline">
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="名称/编码" style={{ width: 150 }} allowClear />
          </Form.Item>
          <Form.Item name="type" label="类型">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="健身器材">健身器材</Option>
              <Option value="照明设施">照明设施</Option>
              <Option value="休闲设施">休闲设施</Option>
              <Option value="游乐设施">游乐设施</Option>
              <Option value="消防设施">消防设施</Option>
              <Option value="其他">其他</Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 100 }} allowClear>
              <Option value="NORMAL">正常</Option>
              <Option value="DAMAGED">损坏</Option>
              <Option value="MAINTENANCE">维护中</Option>
            </Select>
          </Form.Item>
          <Form.Item name="gridId" label="网格">
            <Select placeholder="全部" style={{ width: 120 }} allowClear showSearch optionFilterProp="children">
              {grids.map((grid) => (
                <Option key={grid.id} value={grid.id}>
                  {grid.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" onClick={handleSearch}>搜索</Button>
              <Button onClick={handleReset}>重置</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card
        extra={
          isAdmin && (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              新增设施
            </Button>
          )
        }
      >
        <Table
          columns={columns}
          dataSource={facilities}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            }
          }}
        />
      </Card>

      <Modal
        title={editingFacility ? '编辑设施' : '新增设施'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitLoading}
        width={600}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="code"
                label="设施编码"
                rules={[{ required: true, message: '请输入设施编码' }]}
              >
                <Input placeholder="请输入设施编码" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="name"
                label="设施名称"
                rules={[{ required: true, message: '请输入设施名称' }]}
              >
                <Input placeholder="请输入设施名称" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="设施类型"
                rules={[{ required: true, message: '请选择设施类型' }]}
              >
                <Select placeholder="请选择设施类型">
                  <Option value="健身器材">健身器材</Option>
                  <Option value="照明设施">照明设施</Option>
                  <Option value="休闲设施">休闲设施</Option>
                  <Option value="游乐设施">游乐设施</Option>
                  <Option value="消防设施">消防设施</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="gridId"
                label="所属网格"
                rules={[{ required: true, message: '请选择所属网格' }]}
              >
                <Select placeholder="请选择网格" showSearch optionFilterProp="children">
                  {grids.map((grid) => (
                    <Option key={grid.id} value={grid.id}>
                      {grid.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="location"
            label="位置"
            rules={[{ required: true, message: '请输入位置' }]}
          >
            <Input placeholder="请输入具体位置" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="状态"
                rules={[{ required: true, message: '请选择状态' }]}
              >
                <Select placeholder="请选择状态">
                  <Option value="NORMAL">正常</Option>
                  <Option value="DAMAGED">损坏</Option>
                  <Option value="MAINTENANCE">维护中</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="image" label="设施照片">
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>上传</div>
              </div>
            </Upload>
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入设施描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="设施详情"
        placement="right"
        width={500}
        open={detailVisible}
        onClose={() => setDetailVisible(false)}
      >
        <Spin spinning={detailLoading}>
          {currentFacility && (
            <div>
              {currentFacility.image && (
                <div style={{ marginBottom: 16 }}>
                  <img
                    src={currentFacility.image}
                    alt={currentFacility.name}
                    style={{ width: '100%', borderRadius: 8 }}
                  />
                </div>
              )}

              <Descriptions title="基本信息" column={1} bordered size="small">
                <Descriptions.Item label="设施编码">{currentFacility.code}</Descriptions.Item>
                <Descriptions.Item label="设施名称">{currentFacility.name}</Descriptions.Item>
                <Descriptions.Item label="设施类型">
                  <Tag color={facilityTypeColors[currentFacility.type] || 'default'}>
                    {currentFacility.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={facilityStatusMap[currentFacility.status]?.color || 'default'}>
                    {facilityStatusMap[currentFacility.status]?.text || currentFacility.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="所属网格">{currentFacility.grid?.name}</Descriptions.Item>
                <Descriptions.Item label="位置">{currentFacility.location}</Descriptions.Item>
                {currentFacility.latitude && currentFacility.longitude && (
                  <Descriptions.Item label="经纬度">
                    {currentFacility.latitude}, {currentFacility.longitude}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="创建时间">
                  {dayjs(currentFacility.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {dayjs(currentFacility.updatedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>

              {currentFacility.description && (
                <div style={{ marginTop: 16 }}>
                  <h4>设施描述</h4>
                  <p>{currentFacility.description}</p>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Drawer>
    </div>
  )
}

export default Facilities
