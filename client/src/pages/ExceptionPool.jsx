import React, { useState, useEffect } from 'react'
import {
  Table, Button, Space, Modal, Form, Input, Select, message, Popconfirm,
  Tag, Alert, Drawer, Descriptions, Badge, Divider, Card, Tabs
} from 'antd'
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  WarningOutlined, CheckCircleOutlined, SyncOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import {
  getExceptionPools, createExceptionPool, updateExceptionPool,
  deleteExceptionPool, getExceptionPool, submitIllustratorConclusion,
  confirmBrandException, getBrands, getOrders
} from '../services/api'
import dayjs from 'dayjs'

function ExceptionPool() {
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 })
  const [modalVisible, setModalVisible] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [conclusionModalVisible, setConclusionModalVisible] = useState(false)
  const [currentRecord, setCurrentRecord] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [brands, setBrands] = useState([])
  const [orders, setOrders] = useState([])
  const [form] = Form.useForm()
  const [conclusionForm] = Form.useForm()
  const [filterForm] = Form.useForm()
  const [brandUnconfirmedOnly, setBrandUnconfirmedOnly] = useState(false)

  useEffect(() => {
    loadData()
    loadBrands()
    loadOrders()
  }, [pagination.current, pagination.pageSize, brandUnconfirmedOnly])

  const loadData = async () => {
    setLoading(true)
    try {
      const values = filterForm.getFieldsValue()
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        ...values
      }
      if (brandUnconfirmedOnly) {
        params.brandConfirmed = false
      }
      const res = await getExceptionPools(params)
      setList(res.list)
      setTotal(res.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadBrands = async () => {
    try {
      const res = await getBrands({ pageSize: 100 })
      setBrands(res.list)
    } catch (err) {
      console.error(err)
    }
  }

  const loadOrders = async () => {
    try {
      const res = await getOrders({ pageSize: 100 })
      setOrders(res.list)
    } catch (err) {
      console.error(err)
    }
  }

  const handleSearch = () => {
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleReset = () => {
    filterForm.resetFields()
    setBrandUnconfirmedOnly(false)
    setPagination(p => ({ ...p, current: 1 }))
    setTimeout(loadData, 0)
  }

  const handleAdd = () => {
    setCurrentRecord(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = record => {
    setCurrentRecord(record)
    form.setFieldsValue(record)
    setModalVisible(true)
  }

  const handleDetail = async record => {
    try {
      const data = await getExceptionPool(record.id)
      setDetailData(data)
      setDrawerVisible(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async id => {
    try {
      await deleteExceptionPool(id)
      message.success('删除成功')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSubmit = async values => {
    try {
      if (currentRecord) {
        await updateExceptionPool(currentRecord.id, values)
        message.success('更新成功')
      } else {
        await createExceptionPool(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleConclusion = record => {
    setCurrentRecord(record)
    conclusionForm.resetFields()
    conclusionForm.setFieldsValue({
      conclusion: record.illustratorConclusion
    })
    setConclusionModalVisible(true)
  }

  const handleSubmitConclusion = async values => {
    try {
      await submitIllustratorConclusion(currentRecord.id, values)
      message.success('处理结论已提交')
      setConclusionModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleBrandConfirm = async record => {
    try {
      await confirmBrandException(record.id)
      message.success('品牌已确认')
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const getSuggestionForError = error => {
    if (!error) return '暂无建议'
    if (error.includes('网络') || error.includes('timeout')) {
      return '建议检查网络连接，或稍后重试同步操作'
    }
    if (error.includes('权限') || error.includes('permission')) {
      return '建议检查接口权限配置，确认授权是否有效'
    }
    if (error.includes('数据') || error.includes('data')) {
      return '建议检查数据格式是否正确，或联系管理员确认数据完整性'
    }
    if (error.includes('超时')) {
      return '建议减少单次同步数据量，或在网络稳定时重试'
    }
    return '建议联系技术支持人员排查问题'
  }

  const priorityColors = {
    HIGH: 'red',
    MEDIUM: 'orange',
    LOW: 'green'
  }

  const statusColors = {
    PENDING: 'default',
    HANDLING: 'processing',
    ILLUSTRATOR_HANDLED: 'blue',
    HANDLED: 'green',
    CLOSED: 'gray'
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
    {
      title: '异常标题',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          <span>{text}</span>
          {record.syncError && (
            <Badge status="error" text={<Tag color="red" icon={<WarningOutlined />}>同步错误</Tag>} />
          )}
        </Space>
      )
    },
    { title: '异常类型', dataIndex: 'exceptionType', key: 'exceptionType', render: t => <Tag color="purple">{t}</Tag> },
    { title: '品牌', dataIndex: ['brand', 'name'], key: 'brand', render: v => v || '-' },
    { title: '关联订单', dataIndex: ['order', 'orderNo'], key: 'order', render: v => v || '-' },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      render: p => <Tag color={priorityColors[p]}>{p}</Tag>
    },
    {
      title: '品牌确认',
      dataIndex: 'brandConfirmed',
      key: 'brandConfirmed',
      width: 100,
      render: v => v ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: s => <Tag color={statusColors[s]}>{s}</Tag>
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: t => dayjs(t).format('MM-DD HH:mm') },
    {
      title: '操作',
      key: 'actions',
      width: 280,
      render: (_, r) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleDetail(r)}>详情</Button>
          {!r.brandConfirmed && (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleBrandConfirm(r)}>
              品牌确认
            </Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleConclusion(r)}>
            插画师结论
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  const unconfirmedCount = list.filter(e => !e.brandConfirmed).length

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>异常池</h2>
        <p style={{ color: '#666', marginTop: 8 }}>
          管理订单和品牌合作中的异常问题，支持品牌确认筛选、插画师处理结论补充
        </p>
      </div>

      {unconfirmedCount > 0 && (
        <Alert
          className="sync-error-tip"
          message={`有 ${unconfirmedCount} 条异常待品牌确认`}
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" onClick={() => setBrandUnconfirmedOnly(!brandUnconfirmedOnly)}>
              {brandUnconfirmedOnly ? '显示全部' : '筛选查看'}
            </Button>
          }
        />
      )}

      <div className="filter-bar">
        <Form form={filterForm} layout="inline" onFinish={handleSearch}>
          <Form.Item name="keyword" label="关键词">
            <Input placeholder="异常标题/描述" style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="exceptionType" label="类型">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="PHOTO_ISSUE">照片问题</Select.Option>
              <Select.Option value="DELAY_DELIVERY">交付延期</Select.Option>
              <Select.Option value="PAYMENT_ISSUE">回款问题</Select.Option>
              <Select.Option value="BRAND_DISPUTE">品牌纠纷</Select.Option>
              <Select.Option value="SYNC_ERROR">同步错误</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择" style={{ width: 120 }} allowClear>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="HANDLING">处理中</Select.Option>
              <Select.Option value="ILLUSTRATOR_HANDLED">插画师已处理</Select.Option>
              <Select.Option value="HANDLED">已处理</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级">
            <Select placeholder="请选择" style={{ width: 100 }} allowClear>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="LOW">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">搜索</Button>
              <Button onClick={handleReset}>重置</Button>
              <Button
                type={brandUnconfirmedOnly ? 'primary' : 'default'}
                icon={<ExclamationCircleOutlined />}
                onClick={() => setBrandUnconfirmedOnly(!brandUnconfirmedOnly)}
              >
                {brandUnconfirmedOnly ? '全部异常' : '品牌未确认'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>

      <div className="table-toolbar">
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增异常</Button>
          <Button icon={<SyncOutlined />} onClick={loadData}>刷新</Button>
        </Space>
        <span style={{ color: '#666' }}>共 {total} 条记录</span>
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={list}
        rowKey="id"
        pagination={{
          ...pagination,
          total,
          showTotal: t => `共 ${t} 条`,
          showSizeChanger: true
        }}
        onChange={pag => setPagination({ current: pag.current, pageSize: pag.pageSize })}
      />

      <Modal
        title={currentRecord ? '编辑异常' : '新增异常'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="title" label="异常标题" rules={[{ required: true }]}>
            <Input placeholder="请输入异常标题" />
          </Form.Item>
          <Form.Item name="exceptionType" label="异常类型" initialValue="OTHER">
            <Select>
              <Select.Option value="PHOTO_ISSUE">照片问题</Select.Option>
              <Select.Option value="DELAY_DELIVERY">交付延期</Select.Option>
              <Select.Option value="PAYMENT_ISSUE">回款问题</Select.Option>
              <Select.Option value="BRAND_DISPUTE">品牌纠纷</Select.Option>
              <Select.Option value="SYNC_ERROR">同步错误</Select.Option>
              <Select.Option value="OTHER">其他</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="brandId" label="关联品牌">
            <Select placeholder="请选择品牌" allowClear>
              {brands.map(b => (
                <Select.Option key={b.id} value={b.id}>{b.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="orderId" label="关联订单">
            <Select placeholder="请选择订单" allowClear>
              {orders.map(o => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.title}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label="优先级" initialValue="MEDIUM">
            <Select>
              <Select.Option value="HIGH">高</Select.Option>
              <Select.Option value="MEDIUM">中</Select.Option>
              <Select.Option value="LOW">低</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="PENDING">
            <Select>
              <Select.Option value="PENDING">待处理</Select.Option>
              <Select.Option value="HANDLING">处理中</Select.Option>
              <Select.Option value="HANDLED">已处理</Select.Option>
              <Select.Option value="CLOSED">已关闭</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="异常描述">
            <Input.TextArea rows={3} placeholder="请详细描述异常情况" />
          </Form.Item>
          <Form.Item name="handleSuggestion" label="处理建议">
            <Input.TextArea rows={2} placeholder="建议的处理方式" />
          </Form.Item>
          <Form.Item name="syncError" label="同步错误信息">
            <Input.TextArea rows={2} placeholder="如果是同步错误，请填写错误信息" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">保存</Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="异常详情"
        placement="right"
        width={600}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      >
        {detailData && (
          <div>
            <Descriptions title={detailData.title} bordered column={1} size="small">
              <Descriptions.Item label="异常类型">
                <Tag color="purple">{detailData.exceptionType}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color={priorityColors[detailData.priority]}>{detailData.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={statusColors[detailData.status]}>{detailData.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="品牌">
                {detailData.brand?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="关联订单">
                {detailData.order?.orderNo || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="品牌确认">
                {detailData.brandConfirmed ? <Tag color="green">已确认</Tag> : <Tag color="orange">待确认</Tag>}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(detailData.createdAt).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label="处理时间">
                {detailData.handledAt ? dayjs(detailData.handledAt).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">异常描述</Divider>
            <p style={{ whiteSpace: 'pre-wrap' }}>{detailData.description || '暂无描述'}</p>

            <Divider orientation="left">处理建议</Divider>
            <Card size="small" type="inner" title="系统建议">
              <p style={{ whiteSpace: 'pre-wrap' }}>{detailData.handleSuggestion || '暂无建议'}</p>
            </Card>

            {detailData.syncError && (
              <>
                <Divider orientation="left">
                  <Space>
                    <WarningOutlined style={{ color: '#f5222d' }} />
                    同步错误信息
                  </Space>
                </Divider>
                <Alert
                  type="error"
                  showIcon
                  message="同步出错"
                  description={detailData.syncError}
                  style={{ marginBottom: 12 }}
                />
                <Card size="small" type="inner" title="可处理建议">
                  <p style={{ color: '#52c41a' }}>
                    <CheckCircleOutlined /> {detailData.syncSuggestion || getSuggestionForError(detailData.syncError)}
                  </p>
                </Card>
              </>
            )}

            <Divider orientation="left">插画师处理结论</Divider>
            <Card size="small" type="inner">
              {detailData.illustratorConclusion ? (
                <p style={{ whiteSpace: 'pre-wrap' }}>{detailData.illustratorConclusion}</p>
              ) : (
                <p style={{ color: '#999' }}>暂无处理结论</p>
              )}
              <Button
                type="primary"
                size="small"
                style={{ marginTop: 8 }}
                onClick={() => {
                  setCurrentRecord(detailData)
                  conclusionForm.setFieldsValue({ conclusion: detailData.illustratorConclusion })
                  setConclusionModalVisible(true)
                }}
              >
                补充处理结论
              </Button>
            </Card>

            <Divider orientation="left">备注</Divider>
            <p style={{ whiteSpace: 'pre-wrap' }}>{detailData.remark || '暂无备注'}</p>
          </div>
        )}
      </Drawer>

      <Modal
        title="插画师处理结论"
        open={conclusionModalVisible}
        onCancel={() => setConclusionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={conclusionForm} layout="vertical" onFinish={handleSubmitConclusion}>
          <Form.Item name="conclusion" label="处理结论" rules={[{ required: true, message: '请输入处理结论' }]}>
            <Input.TextArea
              rows={6}
              placeholder="请详细描述处理方案和结论..."
              showCount
              maxLength={500}
            />
          </Form.Item>
          <Form.Item name="illustratorId" label="插画师ID">
            <Input placeholder="请输入插画师ID（可选）" />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">提交结论</Button>
              <Button onClick={() => setConclusionModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ExceptionPool
