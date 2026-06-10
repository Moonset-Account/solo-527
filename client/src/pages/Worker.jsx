import React, { useState, useEffect } from 'react'
import {
  Tabs,
  Table,
  Tag,
  Button,
  Space,
  Card,
  Form,
  Input,
  Select,
  Upload,
  Modal,
  message,
  Row,
  Col,
  Spin,
  Empty,
  Timeline,
  Divider
} from 'antd'
import {
  PlusOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  UploadOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import { getUser } from '@/utils/auth'
import dayjs from 'dayjs'

const { TextArea } = Input
const { Option } = Select

const eventTypeMap = {
  FACILITY_DAMAGE: { text: '设施损坏', color: 'orange' },
  ENVIRONMENT: { text: '环境卫生', color: 'green' },
  SECURITY: { text: '治安问题', color: 'red' },
  PUBLIC_SERVICE: { text: '公共服务', color: 'blue' },
  OTHER: { text: '其他', color: 'default' }
}

const eventLevelMap = {
  LOW: { text: '低', color: 'green' },
  MEDIUM: { text: '中', color: 'orange' },
  HIGH: { text: '高', color: 'red' },
  URGENT: { text: '紧急', color: 'magenta' }
}

const eventStatusMap = {
  PENDING: { text: '待处理', color: 'orange' },
  ASSIGNED: { text: '已分派', color: 'blue' },
  PROCESSING: { text: '处理中', color: 'cyan' },
  COMPLETED: { text: '已完成', color: 'green' },
  CLOSED: { text: '已关闭', color: 'default' },
  CANCELLED: { text: '已取消', color: 'default' }
}

const Worker = () => {
  const [activeTab, setActiveTab] = useState('list')
  const [form] = Form.useForm()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [filters, setFilters] = useState({ status: '', type: '' })
  const [grids, setGrids] = useState([])
  const [detailModal, setDetailModal] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)

  const user = getUser()

  useEffect(() => {
    fetchGrids()
    fetchEvents()
  }, [filters, pagination.current])

  const fetchGrids = async () => {
    try {
      const res = await request.get('/grids/all')
      setGrids(res.data)
    } catch (error) {
      console.error('获取网格列表失败:', error)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        reporterId: user?.id,
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type })
      }
      const res = await request.get('/events', { params })
      setEvents(res.data.list)
      setPagination((prev) => ({ ...prev, total: res.data.total }))
    } catch (error) {
      console.error('获取事件列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = async (record) => {
    setDetailLoading(true)
    try {
      const res = await request.get(`/events/${record.id}`)
      setCurrentEvent(res.data)
      setDetailModal(true)
    } catch (error) {
      console.error('获取事件详情失败:', error)
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

      await request.post('/events', submitData)
      message.success('事件上报成功')
      form.resetFields()
      setActiveTab('list')
      fetchEvents()
    } catch (error) {
      console.error('事件上报失败:', error)
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setFieldsValue({
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6)
          })
          message.success('定位成功')
        },
        (error) => {
          const mockLat = 30 + Math.random() * 0.1
          const mockLng = 120 + Math.random() * 0.1
          form.setFieldsValue({
            latitude: mockLat.toFixed(6),
            longitude: mockLng.toFixed(6)
          })
          message.success('模拟定位成功')
        }
      )
    } else {
      const mockLat = 30 + Math.random() * 0.1
      const mockLng = 120 + Math.random() * 0.1
      form.setFieldsValue({
        latitude: mockLat.toFixed(6),
        longitude: mockLng.toFixed(6)
      })
      message.success('模拟定位成功')
    }
  }

  const columns = [
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '事件类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => {
        const info = eventTypeMap[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '事件级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level) => {
        const info = eventLevelMap[level] || { text: level, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status) => {
        const info = eventStatusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '所在网格',
      dataIndex: ['grid', 'name'],
      key: 'grid',
      width: 100
    },
    {
      title: '上报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
          详情
        </Button>
      )
    }
  ]

  const tabItems = [
    {
      key: 'list',
      label: '事件列表'
    },
    {
      key: 'report',
      label: '上报事件'
    }
  ]

  const uploadProps = {
    listType: 'picture-card',
    beforeUpload: () => false,
    maxCount: 3
  }

  return (
    <div>
      <Card title="网格员工作台">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {activeTab === 'list' && (
          <div>
            <Space style={{ marginBottom: 16 }}>
              <Select
                placeholder="状态筛选"
                style={{ width: 120 }}
                allowClear
                value={filters.status || undefined}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, status: value }))
                  setPagination((prev) => ({ ...prev, current: 1 }))
                }}
              >
                <Option value="PENDING">待处理</Option>
                <Option value="ASSIGNED">已分派</Option>
                <Option value="PROCESSING">处理中</Option>
                <Option value="COMPLETED">已完成</Option>
                <Option value="CLOSED">已关闭</Option>
              </Select>
              <Select
                placeholder="类型筛选"
                style={{ width: 120 }}
                allowClear
                value={filters.type || undefined}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, type: value }))
                  setPagination((prev) => ({ ...prev, current: 1 }))
                }}
              >
                <Option value="FACILITY_DAMAGE">设施损坏</Option>
                <Option value="ENVIRONMENT">环境卫生</Option>
                <Option value="SECURITY">治安问题</Option>
                <Option value="PUBLIC_SERVICE">公共服务</Option>
                <Option value="OTHER">其他</Option>
              </Select>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setActiveTab('report')}>
                上报事件
              </Button>
            </Space>

            <Table
              columns={columns}
              dataSource={events}
              rowKey="id"
              loading={loading}
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
          </div>
        )}

        {activeTab === 'report' && (
          <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="title"
                  label="事件标题"
                  rules={[{ required: true, message: '请输入事件标题' }]}
                >
                  <Input placeholder="请输入事件标题" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="事件类型"
                  rules={[{ required: true, message: '请选择事件类型' }]}
                >
                  <Select placeholder="请选择事件类型">
                    <Option value="FACILITY_DAMAGE">设施损坏</Option>
                    <Option value="ENVIRONMENT">环境卫生</Option>
                    <Option value="SECURITY">治安问题</Option>
                    <Option value="PUBLIC_SERVICE">公共服务</Option>
                    <Option value="OTHER">其他</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="level"
                  label="事件级别"
                  rules={[{ required: true, message: '请选择事件级别' }]}
                >
                  <Select placeholder="请选择事件级别">
                    <Option value="LOW">低</Option>
                    <Option value="MEDIUM">中</Option>
                    <Option value="HIGH">高</Option>
                    <Option value="URGENT">紧急</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="gridId"
                  label="所在网格"
                  rules={[{ required: true, message: '请选择所在网格' }]}
                >
                  <Select placeholder="请选择网格">
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
              label="发生地点"
              rules={[{ required: true, message: '请输入发生地点' }]}
            >
              <Input placeholder="请输入具体位置" prefix={<EnvironmentOutlined />} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={10}>
                <Form.Item
                  name="latitude"
                  label="纬度"
                >
                  <Input placeholder="纬度" readOnly />
                </Form.Item>
              </Col>
              <Col span={10}>
                <Form.Item
                  name="longitude"
                  label="经度"
                >
                  <Input placeholder="经度" readOnly />
                </Form.Item>
              </Col>
              <Col span={4}>
                <Form.Item label="&nbsp;">
                  <Button icon={<EnvironmentOutlined />} onClick={handleGetLocation} block>
                    获取定位
                  </Button>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="description"
              label="事件描述"
              rules={[{ required: true, message: '请输入事件描述' }]}
            >
              <TextArea rows={4} placeholder="请详细描述事件情况" />
            </Form.Item>

            <Form.Item name="photos" label="现场照片">
              <Upload {...uploadProps}>
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传</div>
                </div>
              </Upload>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" loading={submitLoading} onClick={handleSubmit}>
                  提交上报
                </Button>
                <Button onClick={() => form.resetFields()}>重置</Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Card>

      <Modal
        title="事件详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>
        ]}
        width={700}
      >
        <Spin spinning={detailLoading}>
          {currentEvent && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>事件标题：</strong>{currentEvent.title}</p>
                  <p><strong>事件类型：</strong>
                    <Tag color={eventTypeMap[currentEvent.type]?.color || 'default'}>
                      {eventTypeMap[currentEvent.type]?.text || currentEvent.type}
                    </Tag>
                  </p>
                  <p><strong>事件级别：</strong>
                    <Tag color={eventLevelMap[currentEvent.level]?.color || 'default'}>
                      {eventLevelMap[currentEvent.level]?.text || currentEvent.level}
                    </Tag>
                  </p>
                  <p><strong>状态：</strong>
                    <Tag color={eventStatusMap[currentEvent.status]?.color || 'default'}>
                      {eventStatusMap[currentEvent.status]?.text || currentEvent.status}
                    </Tag>
                  </p>
                </Col>
                <Col span={12}>
                  <p><strong>所在网格：</strong>{currentEvent.grid?.name}</p>
                  <p><strong>发生地点：</strong>{currentEvent.location}</p>
                  <p><strong>上报人：</strong>{currentEvent.reporter?.name}</p>
                  <p><strong>上报时间：</strong>
                    {dayjs(currentEvent.createdAt).format('YYYY-MM-DD HH:mm')}
                  </p>
                </Col>
              </Row>

              <p><strong>事件描述：</strong>{currentEvent.description}</p>

              <Divider orientation="left">处理进度</Divider>
              <Timeline
                items={currentEvent.operationLogs?.map((log) => ({
                  color: log.status === 'SUCCESS' ? 'green' : 'red',
                  children: (
                    <div>
                      <p style={{ margin: 0, fontWeight: 500 }}>{log.action}</p>
                      <p style={{ margin: '4px 0', color: '#666', fontSize: 12 }}>
                        操作人：{log.operatorName}
                      </p>
                      <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                        {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                      </p>
                    </div>
                  )
                })) || []}
              />
            </div>
          )}
        </Spin>
      </Modal>
    </div>
  )
}

export default Worker
