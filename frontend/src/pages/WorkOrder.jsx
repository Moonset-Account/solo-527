import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  DatePicker,
  Modal,
  Form,
  Tag,
  App,
  Popconfirm,
  Card,
  Switch,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, EyeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { workOrderApi, materialApi } from '../services/api'

const { Option } = Select
const { RangePicker } = DatePicker

const WorkOrder = () => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [detailVisible, setDetailVisible] = useState(false)
  const [detail, setDetail] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()
  const [materialForm] = Form.useForm()
  const [materialModalVisible, setMaterialModalVisible] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState(null)
  const { message, modal } = App.useApp()

  useEffect(() => {
    fetchData()
  }, [keyword, statusFilter, dateRange])

  const fetchData = async () => {
    try {
      setLoading(true)
      const params = {}
      if (keyword) params.keyword = keyword
      if (statusFilter) params.status = statusFilter
      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      const response = await workOrderApi.getList(params)
      if (response.code === 200) {
        setData(response.data)
      }
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const viewDetail = async (record) => {
    try {
      setLoading(true)
      const response = await workOrderApi.getDetail(record.id)
      if (response.code === 200) {
        setDetail(response.data)
        setDetailVisible(true)
      }
    } catch (error) {
      message.error('获取详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      ...record,
      plannedDate: dayjs(record.plannedDate),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const response = await workOrderApi.delete(id)
      if (response.code === 200) {
        message.success('删除成功')
        fetchData()
      } else {
        message.error(response.message)
      }
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const submitData = {
        ...values,
        plannedDate: values.plannedDate.format('YYYY-MM-DD'),
      }
      if (editingItem) {
        const response = await workOrderApi.update(editingItem.id, submitData)
        if (response.code === 200) {
          message.success('更新成功')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(response.message)
        }
      } else {
        const response = await workOrderApi.create(submitData)
        if (response.code === 200) {
          message.success('创建成功')
          setModalVisible(false)
          fetchData()
        } else {
          message.error(response.message)
        }
      }
    } catch (error) {
      if (error.errorFields) return
      message.error('保存失败')
    }
  }

  const handleAddMaterial = () => {
    materialForm.resetFields()
    setMaterialModalVisible(true)
  }

  const handleMaterialSubmit = async () => {
    try {
      const values = await materialForm.validateFields()
      const response = await materialApi.create({
        ...values,
        workOrderId: detail.id,
      })
      if (response.code === 200) {
        message.success('物料检查添加成功')
        setMaterialModalVisible(false)
        viewDetail({ id: detail.id })
      } else {
        message.error(response.message)
      }
    } catch (error) {
      if (error.errorFields) return
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

  const columns = [
    {
      title: '工单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '产品名称',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: '产品编码',
      dataIndex: 'productCode',
      key: 'productCode',
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: '计划日期',
      dataIndex: 'plannedDate',
      key: 'plannedDate',
      render: (d) => dayjs(d).format('YYYY-MM-DD'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (s) => <Tag color={statusColor(s)}>{statusText(s)}</Tag>,
    },
    {
      title: '物料齐套',
      dataIndex: 'materialReady',
      key: 'materialReady',
      render: (m) =>
        m ? <Tag color="success">已齐套</Tag> : <Tag color="warning">未齐套</Tag>,
    },
    {
      title: '关联计划',
      key: 'plans',
      render: (_, r) => r._count?.plans || 0,
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => viewDetail(record)}>
            详情
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除该工单吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">生产工单</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          新增工单
        </Button>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="搜索工单号/产品"
            prefix={<SearchOutlined />}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
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
          <RangePicker value={dateRange} onChange={setDateRange} />
          <Button onClick={fetchData}>刷新</Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingItem ? '编辑工单' : '新增工单'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        destroyOnClose
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="orderNo"
            label="工单号"
            rules={[{ required: true, message: '请输入工单号' }]}
          >
            <Input placeholder="请输入工单号" />
          </Form.Item>
          <Form.Item
            name="productName"
            label="产品名称"
            rules={[{ required: true, message: '请输入产品名称' }]}
          >
            <Input placeholder="请输入产品名称" />
          </Form.Item>
          <Form.Item
            name="productCode"
            label="产品编码"
            rules={[{ required: true, message: '请输入产品编码' }]}
          >
            <Input placeholder="请输入产品编码" />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="数量"
            rules={[{ required: true, message: '请输入数量' }]}
            initialValue={1}
          >
            <Input.Number min={1} style={{ width: '100%' }} placeholder="请输入数量" />
          </Form.Item>
          <Form.Item
            name="plannedDate"
            label="计划日期"
            rules={[{ required: true, message: '请选择计划日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="请选择计划日期" />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="DRAFT">
            <Select>
              <Option value="DRAFT">草稿</Option>
              <Option value="CONFIRMED">已确认</Option>
              <Option value="IN_PROGRESS">进行中</Option>
              <Option value="COMPLETED">已完成</Option>
              <Option value="CANCELLED">已取消</Option>
            </Select>
          </Form.Item>
          <Form.Item name="materialReady" label="物料齐套" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="工单详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="material" type="primary" onClick={handleAddMaterial}>
            添加物料检查
          </Button>,
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}
      >
        {detail && (
          <div>
            <Card size="small" title="基本信息" style={{ marginBottom: 16 }}>
              <p>
                <strong>工单号：</strong>
                {detail.orderNo}
              </p>
              <p>
                <strong>产品：</strong>
                {detail.productName}（{detail.productCode}）
              </p>
              <p>
                <strong>数量：</strong>
                {detail.quantity}
              </p>
              <p>
                <strong>计划日期：</strong>
                {dayjs(detail.plannedDate).format('YYYY-MM-DD')}
              </p>
              <p>
                <strong>状态：</strong>
                <Tag color={statusColor(detail.status)}>{statusText(detail.status)}</Tag>
              </p>
            </Card>

            <Card size="small" title="物料检查" style={{ marginBottom: 16 }}>
              <Table
                size="small"
                dataSource={detail.materialChecks}
                rowKey="id"
                columns={[
                  { title: '物料名称', dataIndex: 'materialName', key: 'materialName' },
                  { title: '物料编码', dataIndex: 'materialCode', key: 'materialCode' },
                  { title: '需求数量', dataIndex: 'requiredQty', key: 'requiredQty' },
                  { title: '可用数量', dataIndex: 'availableQty', key: 'availableQty' },
                  {
                    title: '是否齐套',
                    dataIndex: 'isComplete',
                    key: 'isComplete',
                    render: (v) =>
                      v ? <Tag color="success">是</Tag> : <Tag color="warning">否</Tag>,
                  },
                  { title: '检查人', dataIndex: 'checkedBy', key: 'checkedBy' },
                ]}
                pagination={false}
              />
            </Card>

            <Card size="small" title="关联计划">
              <Table
                size="small"
                dataSource={detail.plans}
                rowKey="id"
                columns={[
                  { title: '计划编号', dataIndex: 'planNo', key: 'planNo' },
                  {
                    title: '设备',
                    key: 'equipment',
                    render: (_, r) => r.equipment?.name || '-',
                  },
                  {
                    title: '工序数',
                    key: 'processFlows',
                    render: (_, r) => r._count?.processFlows || 0,
                  },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    key: 'status',
                    render: (s) => <Tag color={statusColor(s)}>{statusText(s)}</Tag>,
                  },
                ]}
                pagination={false}
              />
            </Card>
          </div>
        )}
      </Modal>

      <Modal
        title="添加物料检查"
        open={materialModalVisible}
        onOk={handleMaterialSubmit}
        onCancel={() => setMaterialModalVisible(false)}
        destroyOnClose
      >
        <Form form={materialForm} layout="vertical">
          <Form.Item
            name="materialName"
            label="物料名称"
            rules={[{ required: true, message: '请输入物料名称' }]}
          >
            <Input placeholder="请输入物料名称" />
          </Form.Item>
          <Form.Item
            name="materialCode"
            label="物料编码"
            rules={[{ required: true, message: '请输入物料编码' }]}
          >
            <Input placeholder="请输入物料编码" />
          </Form.Item>
          <Form.Item
            name="requiredQty"
            label="需求数量"
            rules={[{ required: true, message: '请输入需求数量' }]}
            initialValue={1}
          >
            <Input.Number min={1} style={{ width: '100%' }} placeholder="请输入需求数量" />
          </Form.Item>
          <Form.Item
            name="availableQty"
            label="可用数量"
            rules={[{ required: true, message: '请输入可用数量' }]}
            initialValue={0}
          >
            <Input.Number min={0} style={{ width: '100%' }} placeholder="请输入可用数量" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default WorkOrder
