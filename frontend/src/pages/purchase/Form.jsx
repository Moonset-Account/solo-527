import React, { useState, useEffect } from 'react'
import {
  Form, Input, InputNumber, DatePicker, Button, Space, Table,
  Upload, message, Card, Divider, Alert,
} from 'antd'
import {
  PlusOutlined, DeleteOutlined, UploadOutlined, SaveOutlined, SendOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import {
  createPurchaseRequest,
  updatePurchaseRequest,
  getPurchaseRequestDetail,
  uploadAttachment,
  deleteAttachment,
  getPriceHistory,
} from '../../services/api'

const generateTempKey = () => `temp_${Date.now()}_${Math.floor(Math.random() * 100000)}`

const PurchaseRequestForm = () => {
  const [form] = Form.useForm()
  const [items, setItems] = useState([])
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [tempKey, setTempKey] = useState('')
  const [priceWarnings, setPriceWarnings] = useState([])
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = !!id

  useEffect(() => {
    if (isEdit) {
      fetchDetail()
    } else {
      setTempKey(generateTempKey())
    }
  }, [id])

  useEffect(() => {
    checkPriceWarnings()
  }, [items])

  const fetchDetail = async () => {
    setLoading(true)
    try {
      const data = await getPurchaseRequestDetail(id)
      form.setFieldsValue({
        title: data.title,
        projectName: data.projectName,
        department: data.department,
        remark: data.remark,
        deliveryDate: data.deliveryDate ? dayjs(data.deliveryDate) : null,
      })
      setItems(data.items || [])
      setAttachments(data.attachments || [])
    } finally {
      setLoading(false)
    }
  }

  const checkPriceWarnings = async () => {
    const warnings = []
    for (const item of items) {
      if (!item.materialName || !item.estimatedPrice || item.estimatedPrice <= 0) continue
      try {
        const res = await getPriceHistory({ materialName: item.materialName, pageSize: 1 })
        if (res.list && res.list.length > 0) {
          const history = res.list[0]
          const oldPrice = parseFloat(history.price)
          const newPrice = parseFloat(item.estimatedPrice)
          if (oldPrice > 0) {
            const fluctuation = ((newPrice - oldPrice) / oldPrice) * 100
            if (Math.abs(fluctuation) >= 5) {
              warnings.push({
                materialName: item.materialName,
                oldPrice,
                newPrice,
                fluctuation: parseFloat(fluctuation.toFixed(2)),
              })
            }
          }
        }
      } catch (e) {}
    }
    setPriceWarnings(warnings)
  }

  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      materialName: '',
      specification: '',
      unit: '',
      quantity: 0,
      estimatedPrice: 0,
      totalAmount: 0,
      remark: '',
    }])
  }

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const updateItem = (index, field, value) => {
    const newItems = [...items]
    newItems[index][field] = value
    if (field === 'quantity' || field === 'estimatedPrice') {
      newItems[index].totalAmount = (parseFloat(newItems[index].quantity) || 0) * (parseFloat(newItems[index].estimatedPrice) || 0)
    }
    setItems(newItems)
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0)

  const handleUpload = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    if (isEdit) {
      formData.append('requestId', id)
    } else {
      formData.append('tempKey', tempKey)
    }

    try {
      const data = await uploadAttachment(formData)
      setAttachments([...attachments, data])
      message.success('上传成功')
    } catch (e) {}
    return false
  }

  const handleDeleteAttachment = async (attId) => {
    try {
      await deleteAttachment(attId)
      setAttachments(attachments.filter(a => a.id !== attId))
      message.success('删除成功')
    } catch (e) {}
  }

  const saveRequest = async (status) => {
    setSubmitting(true)
    try {
      const values = await form.validateFields()
      
      if (items.length === 0) {
        message.error('请至少添加一条物料明细')
        return
      }

      const validItems = items.filter(item => item.materialName && item.quantity > 0 && item.estimatedPrice > 0)
      if (validItems.length === 0) {
        message.error('请填写完整的物料明细（名称、数量、单价不能为空）')
        return
      }

      const data = {
        ...values,
        items: JSON.stringify(validItems.map(item => ({
          materialName: item.materialName,
          specification: item.specification,
          unit: item.unit,
          quantity: item.quantity,
          estimatedPrice: item.estimatedPrice,
          remark: item.remark,
        }))),
        deliveryDate: values.deliveryDate ? values.deliveryDate.format('YYYY-MM-DD') : null,
        status,
      }

      if (!isEdit) {
        data.tempKey = tempKey
      }

      let alertMsg = '保存成功'
      if (isEdit) {
        await updatePurchaseRequest(id, data)
        if (status === 'pending') alertMsg = '提交成功，审批流程已启动，价格波动检测已完成'
      } else {
        await createPurchaseRequest(data)
        if (status === 'pending') alertMsg = '提交成功，审批流程已启动，价格波动检测已完成'
      }

      message.success(alertMsg)
      navigate('/purchase-requests')
    } catch (e) {
      if (e.errorFields) {
        message.error('请检查表单填写是否正确')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleSave = () => saveRequest('draft')
  const handleSubmit = () => saveRequest('pending')

  const columns = [
    {
      title: '物料名称',
      dataIndex: 'materialName',
      width: 150,
      render: (_, record, index) => (
        <Input
          value={record.materialName}
          onChange={(e) => updateItem(index, 'materialName', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '规格型号',
      dataIndex: 'specification',
      width: 150,
      render: (_, record, index) => (
        <Input
          value={record.specification}
          onChange={(e) => updateItem(index, 'specification', e.target.value)}
          placeholder="请输入"
        />
      ),
    },
    {
      title: '单位',
      dataIndex: 'unit',
      width: 80,
      render: (_, record, index) => (
        <Input
          value={record.unit}
          onChange={(e) => updateItem(index, 'unit', e.target.value)}
          placeholder="如:米、吨"
        />
      ),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          value={record.quantity}
          onChange={(v) => updateItem(index, 'quantity', v)}
          min={0}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '预估单价',
      dataIndex: 'estimatedPrice',
      width: 120,
      render: (_, record, index) => (
        <InputNumber
          value={record.estimatedPrice}
          onChange={(v) => updateItem(index, 'estimatedPrice', v)}
          min={0}
          precision={2}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'totalAmount',
      width: 120,
      render: (v) => `¥${Number(v || 0).toLocaleString()}`,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      width: 150,
      render: (_, record, index) => (
        <Input
          value={record.remark}
          onChange={(e) => updateItem(index, 'remark', e.target.value)}
        />
      ),
    },
    {
      title: '操作',
      width: 80,
      render: (_, __, index) => (
        <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeItem(index)} />
      ),
    },
  ]

  const uploadProps = {
    beforeUpload: handleUpload,
    showUploadList: false,
  }

  return (
    <div className="page-container">
      <div className="page-title">
        {isEdit ? '编辑采购需求' : '新建采购需求'}
      </div>

      {priceWarnings.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<ExclamationCircleOutlined />}
          style={{ marginBottom: 16 }}
          message={`检测到 ${priceWarnings.length} 项物料价格波动超过5%`}
          description={
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {priceWarnings.map((w, i) => (
                <li key={i}>
                  <strong>{w.materialName}：</strong>
                  历史价 ¥{w.oldPrice.toLocaleString()}，当前价 ¥{w.newPrice.toLocaleString()}，
                  <span style={{ color: w.fluctuation > 0 ? '#f5222d' : '#52c41a' }}>
                    波动 {w.fluctuation > 0 ? '+' : ''}{w.fluctuation}%
                  </span>
                </li>
              ))}
            </ul>
          }
        />
      )}

      <Form form={form} layout="vertical" loading={loading}>
        <Card title="基本信息" style={{ marginBottom: 16 }}>
          <Form.Item name="title" label="需求标题" rules={[{ required: true, message: '请输入需求标题' }]}>
            <Input placeholder="请输入需求标题" />
          </Form.Item>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item name="projectName" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
              <Input placeholder="请输入项目名称" />
            </Form.Item>
            <Form.Item name="department" label="申请部门" rules={[{ required: true, message: '请输入申请部门' }]}>
              <Input placeholder="请输入申请部门" />
            </Form.Item>
            <Form.Item name="deliveryDate" label="期望到货日期">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>
          <Form.Item name="remark" label="需求说明">
            <Input.TextArea rows={3} placeholder="请输入需求说明" />
          </Form.Item>
        </Card>

        <Card
          title="物料明细"
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={addItem}>添加物料</Button>}
          style={{ marginBottom: 16 }}
        >
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            pagination={false}
            scroll={{ x: 1000 }}
          />
          <Divider />
          <div style={{ textAlign: 'right', fontSize: 16, fontWeight: 'bold' }}>
            合计金额：¥{totalAmount.toLocaleString()}
          </div>
        </Card>

        <Card title="附件上传" style={{ marginBottom: 16 }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>上传附件</Button>
          </Upload>
          <div style={{ marginTop: 12 }}>
            {attachments.length === 0 ? (
              <span style={{ color: '#999' }}>暂无附件，可上传图纸、报价单等</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {attachments.map((att) => (
                  <div key={att.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f5f5f5', borderRadius: 4 }}>
                    <span>{att.fileName}</span>
                    <Space>
                      <span style={{ color: '#999', fontSize: 12 }}>{(att.fileSize / 1024).toFixed(1)} KB</span>
                      <Button type="text" danger size="small" onClick={() => handleDeleteAttachment(att.id)}>删除</Button>
                    </Space>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Space size="large">
            <Button onClick={() => navigate(-1)}>取消</Button>
            <Button icon={<SaveOutlined />} onClick={handleSave} loading={submitting}>
              保存草稿
            </Button>
            <Button type="primary" icon={<SendOutlined />} onClick={handleSubmit} loading={submitting}>
              提交审批
            </Button>
          </Space>
        </div>
      </Form>
    </div>
  )
}

export default PurchaseRequestForm
