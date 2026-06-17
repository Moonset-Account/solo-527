import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Input, Select, DatePicker, Modal, Form, Tag, App, Popconfirm, Card, Checkbox } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, PlayCircleOutlined, CheckCircleOutlined, EyeOutlined, SafetyCertificateOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { planApi, workOrderApi, equipmentApi, processApi } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker

const ProductionPlan = () => {
  const [data, setData] = useState([])
  const [workOrders, setWorkOrders] = useState([])
  const [equipments, setEquipments] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detail, setDetail] = useState(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [selectedProcesses, setSelectedProcesses] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [equipmentFilter, setEquipmentFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
    fetchSelectData()
  }, [statusFilter, equipmentFilter, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (statusFilter) params.status = statusFilter
      if (equipmentFilter) params.equipmentId = equipmentFilter
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      planApi.getList(params).then((res) => {
        if (res.code === 200) setData(res.data)
        setLoading(false)
      })
    } catch (e) {
      message.error('加载数据失败')
      setLoading(false)
    }
  }

  const fetchSelectData = async () => {
    const [workOrderRes, equipmentRes, processRes] = await Promise.all([
      workOrderApi.getList(),
      equipmentApi.getList(),
      processApi.getList(),
    ])
    if (workOrderRes.code === 200) setWorkOrders(workOrderRes.data)
    if (equipmentRes.code === 200) setEquipments(equipmentRes.data)
    if (processRes.code === 200) setProcesses(processRes.data)
  }

  const handleAdd = () => {
    setEditingItem(null)
    setSelectedProcesses([])
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      plannedStart: dayjs(record.plannedStart),
      plannedEnd: dayjs(record.plannedEnd),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await planApi.delete(id)
      if (res.code === 200) {
        message.success('删除成功')
        fetchData()
      }
    } catch (e) {
      message.error('删除失败')
    }
  }

  const handleConfirm = async (record) => {
    modal.confirm({
      title: '确认计划',
      content: `确定要确认计划【${record.planNo}】吗？确认后计划将进入待执行状态。`,
      onOk: async () => {
        const res = await planApi.confirm(record.id)
        if (res.code === 200) {
          message.success('计划已确认')
          fetchData()
        } else {
          message.error(res.message)
        }
      },
    })
  }

  const handleStart = async (record) => {
    modal.confirm({
      title: '确认开始',
      content: `确定要开始计划【${record.planNo}】吗？`,
      onOk: async () => {
        const res = await planApi.start(record.id)
        if (res.code === 200) {
          message.success('计划已开始')
          fetchData()
        } else {
          message.error(res.message)
        }
      },
    })
  }

  const handleComplete = async (record) => {
    modal.confirm({
      title: '确认完成',
      content: `确定要完成计划【${record.planNo}】吗？所有工序将被标记完成，系统将自动计算设备稼动数据。`,
      onOk: async () => {
        const res = await planApi.complete(record.id)
        if (res.code === 200) {
          message.success('计划已完成')
          fetchData()
        } else {
          message.error(res.message)
        }
      },
    })
  }

  const viewDetail = async (record) => {
    const res = await planApi.getDetail(record.id)
    if (res.code === 200) {
      setDetail(res.data)
      setDetailVisible(true)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        plannedStart: values.plannedStart.format('YYYY-MM-DD HH:mm:ss'),
        plannedEnd: values.plannedEnd.format('YYYY-MM-DD HH:mm:ss'),
      }
      if (!editingItem) {
        submitData.processIds = selectedProcesses
      }

      let res
      if (editingItem) {
        res = await planApi.update(editingItem.id, submitData)
      } else {
        res = await planApi.create(submitData)
      }

      if (res.code === 200) {
        message.success(editingItem ? '更新成功' : '创建成功')
        setModalVisible(false)
        fetchData()
      } else {
        message.error(res.message)
      }
    } catch (e) {
      if (e.errorFields) return
      message.error('保存失败')
    }
  }

  const statusColor = (status) => {
    const colors = {
      DRAFT: 'default',
      CONFIRMED: 'blue',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      CANCELLED: 'error',
    }
    return colors[status] || 'default'
  }

  const statusText = (status) => {
    const texts = {
      DRAFT: '草稿',
      CONFIRMED: '已确认',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      CANCELLED: '已取消',
    }
    return texts[status] || status
  }

  const processStatusColor = (status) => {
    const colors = {
      PENDING: 'default',
      IN_PROGRESS: 'processing',
      COMPLETED: 'success',
      REWORK: 'error',
    }
    return colors[status] || 'default'
  }

  const processStatusText = (status) => {
    const texts = {
      PENDING: '待开始',
      IN_PROGRESS: '进行中',
      COMPLETED: '已完成',
      REWORK: '返工',
    }
    return texts[status] || status
  }

  const columns = [
    {
      title: '计划编号',
      dataIndex: 'planNo',
      key: 'planNo',
    },
    {
      title: '工单',
      key: 'workOrder',
      render: (_, r) => `${r.workOrder?.orderNo} - ${r.workOrder?.productName}`,
    },
    {
      title: '设备',
      key: 'equipment',
      render: (_, r) => r.equipment?.name || '-',
    },
    {
      title: '计划时间',
      key: 'time',
      render: (_, r) => (
        <span>
          {dayjs(r.plannedStart).format('MM-DD HH:mm')} ~ {dayjs(r.plannedEnd).format('MM-DD HH:mm')}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusColor(s)}>{statusText(s)}</Tag>,
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
    },
    {
      title: '工序数',
      key: 'processFlows',
      render: (_, r) => r._count?.processFlows || 0,
    },
    {
      title: '创建人',
      key: 'createdBy',
      render: (_, r) => r.createdBy?.name || '-',
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          {record.status === 'DRAFT' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                编辑
              </Button>
              <Button type="link" size="small" icon={<SafetyCertificateOutlined />} onClick={() => handleConfirm(record)}>
                确认
              </Button>
            </>
          )}
          {record.status === 'CONFIRMED' && (
            <Button type="link" size="small" icon={<PlayCircleOutlined />} onClick={() => handleStart(record)}>
              开始
            </Button>
          )}
          {record.status === 'IN_PROGRESS' && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleComplete(record)}>
              完成
            </Button>
          )}
          {(record.status === 'DRAFT' || record.status === 'CONFIRMED') && (
            <Popconfirm title="确定删除该计划吗？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">生产计划</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增计划
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="状态筛选"
            value={statusFilter || undefined}
            onChange={setStatusFilter}
            style={{ width: 150 }}
            allowClear
          >
            <Option value="DRAFT">草稿</Option>
            <Option value="CONFIRMED">已确认</Option>
            <Option value="IN_PROGRESS">进行中</Option>
            <Option value="COMPLETED">已完成</Option>
            <Option value="CANCELLED">已取消</Option>
          </Select>
          <Select
            placeholder="设备筛选"
            value={equipmentFilter || undefined}
            onChange={setEquipmentFilter}
            style={{ width: 150 }}
            allowClear
          >
            {equipments.map((e) => (
              <Option key={e.id} value={e.id}>
                {e.name}
              </Option>
            ))}
          </Select>
          <RangePicker showTime value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal
        title={editingItem ? '编辑计划' : '新增计划'} open={modalVisible} onOk={handleSubmit} onCancel={() => setModalVisible(false)} destroyOnClose width={700}>
        <Form form={form} layout="vertical">
          <Form.Item name="planNo" label="计划编号" rules={[{ required: true, message: '请输入计划编号' }]}>
            <Input placeholder="请输入计划编号" />
          </Form.Item>
          <Form.Item name="workOrderId" label="工单" rules={[{ required: true, message: '请选择工单' }]}>
            <Select placeholder="请选择工单">
              {workOrders.map((w) => (
                <Option key={w.id} value={w.id}>
                  {w.orderNo} - {w.productName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="equipmentId" label="设备" rules={[{ required: true, message: '请选择设备' }]}>
              <Select placeholder="请选择设备">
                {equipments.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name}
                  </Option>
                ))}
              </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue={1}>
            <Select>
              <Option value={1}>普通</Option>
              <Option value={2}>较高</Option>
              <Option value={3}>高</Option>
            </Select>
          </Form.Item>
          <Form.Item name="plannedStart" label="计划开始时间" rules={[{ required: true, message: '请选择开始时间' }]}>
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="plannedEnd" label="计划结束时间" rules={[{ required: true, message: '请选择结束时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} />
            </Form.Item>
            {!editingItem && (
              <Form.Item label="工序">
                <Checkbox.Group
                  options={processes.map((p) => ({ label: `${p.name} (${p.code})`, value: p.id }))}
                  value={selectedProcesses}
                  onChange={setSelectedProcesses}
                />
              </Form.Item>
            )}
            <Form.Item name="remark" label="备注">
              <Input.TextArea rows={2} placeholder="请输入备注" />
            </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="计划详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          detail && detail.status === 'DRAFT' && (
            <Button key="confirm" type="primary" icon={<SafetyCertificateOutlined />} onClick={async () => {
              const res = await planApi.confirm(detail.id)
              if (res.code === 200) {
                message.success('计划已确认')
                setDetailVisible(false)
                fetchData()
              } else {
                message.error(res.message)
              }
            }}>
              确认计划
            </Button>
          ),
          detail && detail.status === 'CONFIRMED' && (
            <Button key="start" type="primary" icon={<PlayCircleOutlined />} onClick={async () => {
              const res = await planApi.start(detail.id)
              if (res.code === 200) {
                message.success('计划已开始')
                setDetailVisible(false)
                fetchData()
              } else {
                message.error(res.message)
              }
            }}>
              开始生产
            </Button>
          ),
          detail && detail.status === 'IN_PROGRESS' && (
            <Button key="complete" type="primary" icon={<CheckCircleOutlined />} onClick={async () => {
              const res = await planApi.complete(detail.id)
              if (res.code === 200) {
                message.success('计划已完成，设备稼动数据已生成')
                setDetailVisible(false)
                fetchData()
              } else {
                message.error(res.message)
              }
            }}>
              完成计划
            </Button>
          ),
          <Button key="close" onClick={() => setDetailVisible(false)}>关闭</Button>,
        ].filter(Boolean)}
        width={800}
      >
        {detail && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <p><strong>计划编号：</strong>{detail.planNo}</p>
              <p>
                <strong>工单：</strong>
                {detail.workOrder?.orderNo} - {detail.workOrder?.productName}
              </p>
              <p><strong>设备：</strong>{detail.equipment?.name}</p>
              <p>
                <strong>计划时间：</strong>
                {dayjs(detail.plannedStart).format('YYYY-MM-DD HH:mm')} ~{' '}
                {dayjs(detail.plannedEnd).format('YYYY-MM-DD HH:mm')}
              </p>
              {detail.actualStart && (
                <p><strong>实际开始：</strong>{dayjs(detail.actualStart).format('YYYY-MM-DD HH:mm')}</p>
              )}
              {detail.actualEnd && (
                <p><strong>实际结束：</strong>{dayjs(detail.actualEnd).format('YYYY-MM-DD HH:mm')}</p>
              )}
              <p>
                <strong>状态：</strong>
                <Tag color={statusColor(detail.status)}>{statusText(detail.status)}</Tag>
              </p>
              <p><strong>创建人：</strong>{detail.createdBy?.name}</p>
            </Card>

            <Card size="small" title="工序流程" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={detail.processFlows}
                rowKey="id"
                columns={[
                  { title: '工序', key: 'process', render: (_, r) => r.process?.name || '-', },
                  { title: '状态', dataIndex: 'status', key: 'status', render: (s) => <Tag color={processStatusColor(s)}>{processStatusText(s)}</Tag>, },
                  { title: '操作员', dataIndex: 'operator', key: 'operator', },
                  { title: '开始时间', key: 'startTime', render: (_, r) => r.startTime ? dayjs(r.startTime).format('MM-DD HH:mm') : '-', },
                  { title: '结束时间', key: 'endTime', render: (_, r) => r.endTime ? dayjs(r.endTime).format('MM-DD HH:mm') : '-', },
                  { title: '合格数', dataIndex: 'outputQuantity', key: 'outputQuantity', },
                  { title: '不良数', dataIndex: 'defectQuantity', key: 'defectQuantity', },
                ]}
                pagination={false}
              />
            </Card>

            <Card size="small" title="设备稼动记录">
              {detail.utilizations && detail.utilizations.length > 0 ? (
                <Table
                  size="small"
                  dataSource={detail.utilizations}
                  rowKey="id"
                  columns={[
                    { title: '日期', key: 'recordDate', render: (_, r) => dayjs(r.recordDate).format('YYYY-MM-DD'), },
                    { title: '运行时间(分钟)', dataIndex: 'runTime', key: 'runTime', },
                    { title: '停机时间(分钟)', dataIndex: 'stopTime', key: 'stopTime', },
                    { title: '空闲时间(分钟)', dataIndex: 'idleTime', key: 'idleTime', },
                    { title: '产量', dataIndex: 'outputQuantity', key: 'outputQuantity', },
                    { title: '稼动率(%)', dataIndex: 'utilizationRate', key: 'utilizationRate', render: (v) => `${v.toFixed(1)}%`, },
                  ]}
                  pagination={false}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#999', padding: '24px 0' }}>
                  {detail.status === 'COMPLETED'
                    ? '暂无稼动记录数据'
                    : '计划完成后系统将自动生成设备稼动记录'}
                </div>
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProductionPlan
