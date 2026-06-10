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
  DatePicker,
  message,
  Row,
  Col,
  Drawer,
  Descriptions,
  Timeline,
  Spin
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  UserSwitchOutlined,
  StopOutlined,
  HistoryOutlined,
  RollbackOutlined,
  TeamOutlined,
  ToolOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import request from '@/utils/request'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker
const { Option } = Select
const { TextArea } = Input

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

const EventManage = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [filters, setFilters] = useState({
    keyword: '',
    type: '',
    level: '',
    status: '',
    gridId: '',
    reporterId: '',
    departmentId: '',
    startDate: '',
    endDate: ''
  })

  const [grids, setGrids] = useState([])
  const [departments, setDepartments] = useState([])
  const [users, setUsers] = useState([])

  const [detailDrawer, setDetailDrawer] = useState(false)
  const [currentEvent, setCurrentEvent] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const [assignModal, setAssignModal] = useState(false)
  const [assignForm] = Form.useForm()
  const [assignLoading, setAssignLoading] = useState(false)
  const [assigningId, setAssigningId] = useState(null)
  const [isBatchAssign, setIsBatchAssign] = useState(false)

  const [logDrawer, setLogDrawer] = useState(false)
  const [logs, setLogs] = useState([])
  const [logLoading, setLogLoading] = useState(false)
  const [currentEventId, setCurrentEventId] = useState(null)

  const [facilityModal, setFacilityModal] = useState(false)
  const [facilityForm] = Form.useForm()
  const [facilityLoading, setFacilityLoading] = useState(false)
  const [facilityEventId, setFacilityEventId] = useState(null)

  const [searchForm] = Form.useForm()

  useEffect(() => {
    fetchGrids()
    fetchDepartments()
    fetchUsers()
    fetchEvents()
  }, [pagination.current, pagination.pageSize])

  const fetchGrids = async () => {
    try {
      const res = await request.get('/grids/all')
      setGrids(res.data)
    } catch (error) {
      console.error('获取网格列表失败:', error)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await request.get('/departments/all')
      setDepartments(res.data)
    } catch (error) {
      console.error('获取部门列表失败:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await request.get('/users', { params: { pageSize: 100 } })
      setUsers(res.data.list)
    } catch (error) {
      console.error('获取用户列表失败:', error)
    }
  }

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.type && { type: filters.type }),
        ...(filters.level && { level: filters.level }),
        ...(filters.status && { status: filters.status }),
        ...(filters.gridId && { gridId: filters.gridId }),
        ...(filters.reporterId && { reporterId: filters.reporterId }),
        ...(filters.departmentId && { departmentId: filters.departmentId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate })
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

  const handleSearch = () => {
    const values = searchForm.getFieldsValue()
    const dateRange = values.dateRange
    setFilters({
      ...values,
      startDate: dateRange ? dayjs(dateRange[0]).format('YYYY-MM-DD') : '',
      endDate: dateRange ? dayjs(dateRange[1]).format('YYYY-MM-DD') : ''
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchEvents(), 0)
  }

  const handleReset = () => {
    searchForm.resetFields()
    setFilters({
      keyword: '',
      type: '',
      level: '',
      status: '',
      gridId: '',
      reporterId: '',
      departmentId: '',
      startDate: '',
      endDate: ''
    })
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchEvents(), 0)
  }

  const handleViewDetail = async (record) => {
    setDetailLoading(true)
    try {
      const res = await request.get(`/events/${record.id}`)
      setCurrentEvent(res.data)
      setDetailDrawer(true)
    } catch (error) {
      console.error('获取事件详情失败:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleAssign = (record) => {
    setAssigningId(record.id)
    setIsBatchAssign(false)
    assignForm.resetFields()
    setAssignModal(true)
  }

  const handleAssignSubmit = async () => {
    try {
      const values = await assignForm.validateFields()
      setAssignLoading(true)

      if (isBatchAssign) {
        const res = await request.post('/events/batch-assign', {
          ids: selectedRowKeys,
          ...values
        })
        const { successCount, failCount, failReasons } = res.data
        if (failCount > 0) {
          Modal.warning({
            title: '批量分派完成',
            content: (
              <div>
                <p>成功 {successCount} 条，失败 {failCount} 条</p>
                {failReasons && failReasons.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <p style={{ fontWeight: 'bold' }}>失败详情：</p>
                    {failReasons.map((item, idx) => (
                      <p key={idx} style={{ color: 'red', margin: '4px 0' }}>
                        {item.id}: {item.reason}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ),
            okText: '确定'
          })
        } else {
          message.success(`成功分派 ${successCount} 条记录`)
        }
        setSelectedRowKeys([])
      } else {
        await request.post(`/events/${assigningId}/assign`, values)
        message.success('分派成功')
      }

      setAssignModal(false)
      fetchEvents()
    } catch (error) {
      console.error('分派失败:', error)
    } finally {
      setAssignLoading(false)
    }
  }

  const handleClose = (record) => {
    Modal.confirm({
      title: '确认关闭',
      content: `确定要关闭事件「${record.title}」吗？`,
      onOk: async () => {
        try {
          await request.post(`/events/${record.id}/close`)
          message.success('关闭成功')
          fetchEvents()
        } catch (error) {
          console.error('关闭失败:', error)
        }
      }
    })
  }

  const handleViewLogs = async (record) => {
    setCurrentEventId(record.id)
    setLogLoading(true)
    try {
      const res = await request.get('/operation-logs', {
        params: { eventId: record.id, pageSize: 50 }
      })
      setLogs(res.data.list)
      setLogDrawer(true)
    } catch (error) {
      console.error('获取操作日志失败:', error)
    } finally {
      setLogLoading(false)
    }
  }

  const handleBatchWithdraw = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要撤回的事件')
      return
    }

    Modal.confirm({
      title: '批量撤回',
      content: `确定要撤回选中的 ${selectedRowKeys.length} 条事件吗？（仅未生效且待处理的事件可撤回）`,
      onOk: async () => {
        try {
          const res = await request.post('/events/batch-withdraw', {
            ids: selectedRowKeys
          })
          const { successCount, failCount, failReasons } = res.data

          if (failCount > 0) {
            Modal.warning({
              title: '批量撤回完成',
              content: (
                <div>
                  <p>成功 {successCount} 条，失败 {failCount} 条</p>
                  {failReasons && failReasons.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <p style={{ fontWeight: 'bold' }}>失败详情：</p>
                      {failReasons.map((item, idx) => (
                        <div key={idx} style={{ color: 'red', margin: '4px 0' }}>
                          <span style={{ fontWeight: 500 }}>{item.title || `事件ID:${item.id}`}</span>
                          <span> - {item.reason}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ),
              okText: '确定'
            })
          } else {
            message.success(`成功撤回 ${successCount} 条记录`)
          }

          setSelectedRowKeys([])
          fetchEvents()
        } catch (error) {
          console.error('批量撤回失败:', error)
        }
      }
    })
  }

  const handleBatchAssign = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要分派的事件')
      return
    }
    setAssigningId(null)
    setIsBatchAssign(true)
    assignForm.resetFields()
    setAssignModal(true)
  }

  const handleProcessFacilityDamage = (record) => {
    setFacilityEventId(record.id)
    facilityForm.resetFields()
    facilityForm.setFieldsValue({
      serviceDate: dayjs()
    })
    setFacilityModal(true)
  }

  const handleFacilitySubmit = async () => {
    try {
      const values = await facilityForm.validateFields()
      setFacilityLoading(true)

      const postData = {
        ...values,
        serviceDate: values.serviceDate ? dayjs(values.serviceDate).format('YYYY-MM-DD') : undefined
      }

      await request.post(`/events/${facilityEventId}/process-facility-damage`, postData)
      message.success('设施损坏处理成功，志愿服务数据已回写')
      setFacilityModal(false)
      fetchEvents()
      if (detailDrawer && currentEvent && currentEvent.id === facilityEventId) {
        handleViewDetail({ id: facilityEventId })
      }
    } catch (error) {
      console.error('设施损坏处理失败:', error)
    } finally {
      setFacilityLoading(false)
    }
  }

  const columns = [
    {
      title: '事件标题',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type) => {
        const info = eventTypeMap[type] || { text: type, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 70,
      render: (level) => {
        const info = eventLevelMap[level] || { text: level, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => {
        const info = eventStatusMap[status] || { text: status, color: 'default' }
        return <Tag color={info.color}>{info.text}</Tag>
      }
    },
    {
      title: '网格',
      dataIndex: ['grid', 'name'],
      key: 'grid',
      width: 100
    },
    {
      title: '上报人',
      dataIndex: ['reporter', 'name'],
      key: 'reporter',
      width: 80
    },
    {
      title: '责任部门',
      dataIndex: ['department', 'name'],
      key: 'department',
      width: 100,
      render: (name) => name || '-'
    },
    {
      title: '上报时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<UserSwitchOutlined />}
            disabled={record.status === 'CLOSED'}
            onClick={() => handleAssign(record)}
          >
            分派
          </Button>
          {record.type === 'FACILITY_DAMAGE' && record.status !== 'CLOSED' && (
            <Button
              type="link"
              size="small"
              icon={<ToolOutlined />}
              onClick={() => handleProcessFacilityDamage(record)}
            >
              设施处理
            </Button>
          )}
          <Button
            type="link"
            size="small"
            danger
            icon={<StopOutlined />}
            disabled={record.status !== 'COMPLETED'}
            onClick={() => handleClose(record)}
          >
            关闭
          </Button>
          <Button type="link" size="small" icon={<HistoryOutlined />} onClick={() => handleViewLogs(record)}>
            日志
          </Button>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  }

  return (
    <div>
      <Card title="事件管理">
        <Form form={searchForm} layout="inline" style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col span={6}>
              <Form.Item name="keyword" label="关键词">
                <Input placeholder="标题/描述" allowClear />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="type" label="类型">
                <Select placeholder="全部" allowClear>
                  <Option value="FACILITY_DAMAGE">设施损坏</Option>
                  <Option value="ENVIRONMENT">环境卫生</Option>
                  <Option value="SECURITY">治安问题</Option>
                  <Option value="PUBLIC_SERVICE">公共服务</Option>
                  <Option value="OTHER">其他</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="level" label="级别">
                <Select placeholder="全部" allowClear>
                  <Option value="LOW">低</Option>
                  <Option value="MEDIUM">中</Option>
                  <Option value="HIGH">高</Option>
                  <Option value="URGENT">紧急</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="status" label="状态">
                <Select placeholder="全部" allowClear>
                  <Option value="PENDING">待处理</Option>
                  <Option value="ASSIGNED">已分派</Option>
                  <Option value="PROCESSING">处理中</Option>
                  <Option value="COMPLETED">已完成</Option>
                  <Option value="CLOSED">已关闭</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            <Col span={4}>
              <Form.Item name="gridId" label="网格">
                <Select placeholder="全部" allowClear showSearch optionFilterProp="children">
                  {grids.map((grid) => (
                    <Option key={grid.id} value={grid.id}>
                      {grid.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="reporterId" label="上报人">
                <Select placeholder="全部" allowClear showSearch optionFilterProp="children">
                  {users.map((user) => (
                    <Option key={user.id} value={user.id}>
                      {user.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="departmentId" label="责任部门">
                <Select placeholder="全部" allowClear showSearch optionFilterProp="children">
                  {departments.map((dept) => (
                    <Option key={dept.id} value={dept.id}>
                      {dept.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Form.Item>
                <Space>
                  <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
                    搜索
                  </Button>
                  <Button icon={<ReloadOutlined />} onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Space style={{ marginBottom: 16 }}>
          <Button icon={<RollbackOutlined />} onClick={handleBatchWithdraw}>
            批量撤回
          </Button>
          <Button type="primary" icon={<TeamOutlined />} onClick={handleBatchAssign}>
            批量分派
          </Button>
          {selectedRowKeys.length > 0 && (
            <span style={{ color: '#666' }}>已选 {selectedRowKeys.length} 项</span>
          )}
        </Space>

        <Table
          columns={columns}
          dataSource={events}
          rowKey="id"
          loading={loading}
          rowSelection={rowSelection}
          scroll={{ x: 1200 }}
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

      <Drawer
        title="事件详情"
        placement="right"
        width={600}
        open={detailDrawer}
        onClose={() => setDetailDrawer(false)}
      >
        <Spin spinning={detailLoading}>
          {currentEvent && (
            <div>
              <Descriptions title="基本信息" column={1} bordered size="small">
                <Descriptions.Item label="事件标题">{currentEvent.title}</Descriptions.Item>
                <Descriptions.Item label="事件类型">
                  <Tag color={eventTypeMap[currentEvent.type]?.color || 'default'}>
                    {eventTypeMap[currentEvent.type]?.text || currentEvent.type}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="事件级别">
                  <Tag color={eventLevelMap[currentEvent.level]?.color || 'default'}>
                    {eventLevelMap[currentEvent.level]?.text || currentEvent.level}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={eventStatusMap[currentEvent.status]?.color || 'default'}>
                    {eventStatusMap[currentEvent.status]?.text || currentEvent.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="所在网格">{currentEvent.grid?.name}</Descriptions.Item>
                <Descriptions.Item label="发生地点">{currentEvent.location}</Descriptions.Item>
                <Descriptions.Item label="经纬度">
                  {currentEvent.latitude && currentEvent.longitude
                    ? `${currentEvent.latitude}, ${currentEvent.longitude}`
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="上报人">{currentEvent.reporter?.name}</Descriptions.Item>
                <Descriptions.Item label="责任部门">{currentEvent.department?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="处理人">{currentEvent.assignee?.name || '-'}</Descriptions.Item>
                <Descriptions.Item label="上报时间">
                  {dayjs(currentEvent.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
                <Descriptions.Item label="完成时间">
                  {currentEvent.completedAt
                    ? dayjs(currentEvent.completedAt).format('YYYY-MM-DD HH:mm:ss')
                    : '-'}
                </Descriptions.Item>
              </Descriptions>

              <div style={{ marginTop: 16 }}>
                <h4>事件描述</h4>
                <p style={{ whiteSpace: 'pre-wrap' }}>{currentEvent.description || '无'}</p>
              </div>

              {currentEvent.operationLogs && currentEvent.operationLogs.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <h4>处理进度</h4>
                  <Timeline
                    items={currentEvent.operationLogs.map((log) => ({
                      color: log.status === 'SUCCESS' ? 'green' : 'red',
                      children: (
                        <div>
                          <p style={{ margin: 0, fontWeight: 500 }}>{log.action}</p>
                          <p style={{ margin: '4px 0', color: '#666', fontSize: 12 }}>
                            操作人：{log.operatorName}
                          </p>
                          {log.failureReason && (
                            <p style={{ margin: '4px 0', color: 'red', fontSize: 12 }}>
                              失败原因：{log.failureReason}
                            </p>
                          )}
                          <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                            {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                          </p>
                        </div>
                      )
                    }))}
                  />
                </div>
              )}

              {currentEvent.type === 'FACILITY_DAMAGE' && (
                <div style={{ marginTop: 24 }}>
                  <h4>志愿服务记录</h4>
                  {currentEvent.volunteerServices && currentEvent.volunteerServices.length > 0 ? (
                    currentEvent.volunteerServices.map((vs, idx) => (
                      <Card key={vs.id} size="small" style={{ marginBottom: 8 }}>
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="志愿者">{vs.volunteerName}</Descriptions.Item>
                          <Descriptions.Item label="联系电话">{vs.volunteerPhone}</Descriptions.Item>
                          <Descriptions.Item label="服务时长">{vs.serviceHours} 小时</Descriptions.Item>
                          <Descriptions.Item label="服务日期">
                            {dayjs(vs.serviceDate).format('YYYY-MM-DD')}
                          </Descriptions.Item>
                          {vs.description && (
                            <Descriptions.Item label="服务描述" span={2}>
                              {vs.description}
                            </Descriptions.Item>
                          )}
                        </Descriptions>
                      </Card>
                    ))
                  ) : (
                    <p style={{ color: '#999' }}>暂无志愿服务记录</p>
                  )}
                </div>
              )}

              {currentEvent.type === 'FACILITY_DAMAGE' && currentEvent.status !== 'CLOSED' && (
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="primary" icon={<ToolOutlined />} onClick={() => handleProcessFacilityDamage(currentEvent)}>
                    处理设施损坏
                  </Button>
                </div>
              )}
            </div>
          )}
        </Spin>
      </Drawer>

      <Modal
        title={isBatchAssign ? '批量分派' : '分派事件'}
        open={assignModal}
        onOk={handleAssignSubmit}
        onCancel={() => setAssignModal(false)}
        confirmLoading={assignLoading}
        okText="确定"
        cancelText="取消"
      >
        <Form form={assignForm} layout="vertical">
          <Form.Item
            name="departmentId"
            label="责任部门"
          >
            <Select placeholder="请选择责任部门" allowClear showSearch optionFilterProp="children">
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="assigneeId"
            label="处理人"
          >
            <Select placeholder="请选择处理人" allowClear showSearch optionFilterProp="children">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="设施损坏处理 - 志愿服务回写"
        open={facilityModal}
        onOk={handleFacilitySubmit}
        onCancel={() => setFacilityModal(false)}
        confirmLoading={facilityLoading}
        okText="提交"
        cancelText="取消"
        width={500}
      >
        <Form form={facilityForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="volunteerName"
                label="志愿者姓名"
                rules={[{ required: true, message: '请输入志愿者姓名' }]}
              >
                <Input placeholder="请输入志愿者姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="volunteerPhone"
                label="联系电话"
                rules={[
                  { required: true, message: '请输入联系电话' },
                  { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' }
                ]}
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="serviceHours"
                label="服务时长（小时）"
                rules={[
                  { required: true, message: '请输入服务时长' },
                  { type: 'number', min: 0.5, message: '服务时长至少0.5小时' }
                ]}
              >
                <Input.Number placeholder="0.0" style={{ width: '100%' }} min={0.5} step={0.5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="serviceDate"
                label="服务日期"
                rules={[{ required: true, message: '请选择服务日期' }]}
              >
                <DatePicker style={{ width: '100%' }} placeholder="请选择日期" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="description"
            label="服务描述"
          >
            <TextArea rows={3} placeholder="请输入服务描述（选填）" maxLength={500} showCount />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="操作日志"
        placement="right"
        width={500}
        open={logDrawer}
        onClose={() => setLogDrawer(false)}
      >
        <Spin spinning={logLoading}>
          <Timeline
            items={logs.map((log) => ({
              color: log.status === 'SUCCESS' ? 'green' : 'red',
              children: (
                <div>
                  <p style={{ margin: 0, fontWeight: 500 }}>{log.action}</p>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: 12 }}>
                    操作人：{log.operator?.name || log.operatorName}
                  </p>
                  {log.failureReason && (
                    <p style={{ margin: '4px 0', color: 'red', fontSize: 12 }}>
                      失败原因：{log.failureReason}
                    </p>
                  )}
                  <p style={{ margin: '4px 0', color: '#999', fontSize: 12 }}>
                    {dayjs(log.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              )
            }))}
          />
        </Spin>
      </Drawer>
    </div>
  )
}

export default EventManage
